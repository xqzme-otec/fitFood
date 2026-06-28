"""Интеграция с LLM.

По умолчанию работает детерминированный МОК — проект запускается без ключей.
Чтобы подключить реальную модель, задайте в .env:
  LLM_PROVIDER=openai  и  OPENAI_API_KEY=...
  (или LLM_PROVIDER=ollama)
и реализуйте вызовы в _openai_* / _ollama_* методах.

LLM решает две задачи:
  1) оценка срока годности продукта (в днях);
  2) разбор текста чека: какие позиции — еда, их количество и срок хранения.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass

import httpx

from app.config import settings
from app.services import naming

# --- Базы знаний для мок-режима ---

# Типичный срок хранения (дней) по ключевым словам.
_SHELF_LIFE_DAYS: list[tuple[tuple[str, ...], int]] = [
    (("молоко", "кефир", "сливки", "ряженка"), 7),
    (("творог", "сметана", "йогурт"), 10),
    (("сыр",), 30),
    (("масло сливочное", "масло"), 60),
    (("курица", "филе", "фарш", "мясо", "говядина", "свинина", "индейка"), 3),
    (("колбаса", "сосиска", "сарделька"), 14),
    (("семга", "лосось", "рыба", "минтай", "треска", "форель"), 2),
    (("помидор", "огурец", "перец", "салат", "зелень", "брокколи", "капуста"), 7),
    (("яблоко", "груша", "апельсин", "мандарин", "банан", "лимон"), 14),
    (("картофель", "лук", "морковь", "свекла", "чеснок"), 60),
    (("хлеб", "батон", "лаваш", "булочка"), 4),
    (("гречка", "рис", "макароны", "крупа", "мука", "сахар", "соль"), 365),
    (("яйцо", "яйца"), 25),
    (("сок", "вода", "напиток", "лимонад"), 180),
    (("консерв", "тушенка", "горошек", "кукуруза", "фасоль"), 720),
    (("заморож", "пельмени", "вареники"), 180),
    (("шоколад", "конфета", "печенье", "вафли"), 120),
    (("соус", "кетчуп", "майонез", "горчица"), 90),
]
_DEFAULT_SHELF_LIFE = 14

# Слова-маркеры НЕпищевых товаров (мыло, химия и т.п.).
_NON_FOOD_WORDS = {
    "мыло", "шампунь", "гель", "порошок", "salfetk", "салфет", "бумага", "туалет",
    "зубн", "паста зубная", "щетка", "щётка", "пакет", "пакеты", "губка", "освежитель",
    "чистящ", "стиральн", "кондиционер для белья", "дезодорант", "крем для рук",
    "батарейк", "лампа", "перчатк", "плёнка", "фольга", "корм для", "наполнитель",
    "сигарет", "зажигалк", "спички",
}


@dataclass
class ParsedReceiptItem:
    raw_name: str
    parsed_name: str
    quantity: float
    unit: str
    price: float | None
    expiry_days: int | None  # срок хранения в днях (если выводится LLM)
    is_food: bool


def _clean_name(name: str) -> str:
    text = re.sub(r"\s+", " ", name).strip()
    # Убираем «висячую» пунктуацию по краям, остающуюся после вырезания меры/цены
    # (например, «Кетчуп дой-пак (» -> «Кетчуп дой-пак»). Незакрытую скобку,
    # если в имени осталась только открывающая, тоже отбрасываем.
    text = text.strip(" .,;:-/×*")
    if text.endswith("(") and ")" not in text:
        text = text[:-1].strip(" .,;:-/×*")
    return text


def estimate_shelf_life_days(product_name: str) -> int:
    """Мок-оценка срока годности (дней). При наличии ключа можно делегировать в LLM."""
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return _openai_shelf_life(product_name)
    name = product_name.lower()
    for words, days in _SHELF_LIFE_DAYS:
        if any(w in name for w in words):
            return days
    return _DEFAULT_SHELF_LIFE


def _is_non_food(name: str) -> bool:
    low = name.lower()
    return any(w in low for w in _NON_FOOD_WORDS)


_QTY_RE = re.compile(
    r"(\d+[.,]?\d*)\s*(кг|г|гр|л|мл|шт)\b", re.IGNORECASE
)
_PRICE_RE = re.compile(r"(\d+[.,]\d{2})\s*(?:руб|р|₽)?\s*$", re.IGNORECASE)


def _parse_qty_unit(line: str) -> tuple[float, str]:
    m = _QTY_RE.search(line)
    if not m:
        return 1.0, "pcs"
    value = float(m.group(1).replace(",", "."))
    unit_raw = m.group(2).lower()
    if unit_raw == "кг":
        return value * 1000, "g"
    if unit_raw in ("г", "гр"):
        return value, "g"
    if unit_raw == "л":
        return value * 1000, "ml"
    if unit_raw == "мл":
        return value, "ml"
    return value, "pcs"


def _parse_price(line: str) -> float | None:
    m = _PRICE_RE.search(line.strip())
    return float(m.group(1).replace(",", ".")) if m else None


def parse_receipt(ocr_text: str) -> list[ParsedReceiptItem]:
    """Разбор текста чека.

    Промпт реальной LLM:
      «Извлеки из чека только пищевые продукты. Верни список: название,
       количество, срок годности (если указан). Непродукты игнорируй.
       Для продуктов без срока — предложи типичный срок хранения.»

    Мок: построчно парсит количество/цену, отсекает непищёвку по словарю,
    очищает имя и проставляет срок хранения через estimate_shelf_life_days.
    """
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return _openai_parse_receipt(ocr_text)

    items: list[ParsedReceiptItem] = []
    for raw_line in ocr_text.splitlines():
        line = raw_line.strip()
        if not line or len(line) < 2:
            continue
        # Пропускаем служебные строки чека.
        low = line.lower()
        if any(k in low for k in ("итого", "итог", "сдача", "наличными", "карта",
                                  "ндс", "кассир", "чек", "оплата", "spar", "магнит")):
            continue

        quantity, unit = _parse_qty_unit(line)
        price = _parse_price(line)

        # Имя = строка без количества и цены.
        name = _QTY_RE.sub("", line)
        name = _PRICE_RE.sub("", name)
        name = _clean_name(re.sub(r"[*xX×]\s*\d+", "", name))
        if not name:
            continue

        is_food = not _is_non_food(name)
        expiry_days = estimate_shelf_life_days(name) if is_food else None

        items.append(
            ParsedReceiptItem(
                raw_name=line,
                parsed_name=name,
                quantity=quantity,
                unit=unit,
                price=price,
                expiry_days=expiry_days,
                is_food=is_food,
            )
        )
    return items


def parse_structured_items(
    raw_items: list[dict],
) -> list[ParsedReceiptItem]:
    """Разбор уже структурированных позиций чека (например, из API ФНС по QR).

    В отличие от parse_receipt (свободный OCR-текст), здесь название, количество
    и цена уже известны из фискальных данных. Остаётся применить ту же бизнес-
    логику: очистить имя, отсечь непищёвку, оценить срок хранения.

    Каждый элемент raw_items: {"name": str, "quantity": float|None,
    "price": float|None}. Количество/единицу пытаемся уточнить по названию
    (например, «Молоко 930мл» → 930 мл); если в названии нет меры — берём
    фискальное количество как штуки.
    """
    items: list[ParsedReceiptItem] = []
    for raw in raw_items:
        raw_name = str(raw.get("name") or "").strip()
        if not raw_name:
            continue

        # Детерминированная чистка фискального имени (артикул/упаковка/точки),
        # затем убираем меру. LLM-нормализация имён — позже, в receipt._build_receipt.
        base = naming.clean_receipt_name(raw_name)
        name = _clean_name(_QTY_RE.sub("", base))
        if not name:
            name = base or raw_name

        # Мера из названия приоритетнее фискального count (он почти всегда «шт»).
        qty, unit = _parse_qty_unit(raw_name)
        if unit == "pcs":
            fiscal_qty = raw.get("quantity")
            qty = float(fiscal_qty) if fiscal_qty else 1.0

        is_food = not _is_non_food(name)
        expiry_days = estimate_shelf_life_days(name) if is_food else None
        price = raw.get("price")

        items.append(
            ParsedReceiptItem(
                raw_name=raw_name,
                parsed_name=name,
                quantity=qty,
                unit=unit,
                price=float(price) if price is not None else None,
                expiry_days=expiry_days,
                is_food=is_food,
            )
        )
    return items


def normalize_product_names(names: list[str]) -> list[str]:
    """Приводит названия продуктов из чека к человекочитаемому виду (батч).

    Сокращённые/брендовые фискальные имена («ТЕНД. Филе кур. охл») LLM
    превращает в понятные («Куриное филе охлаждённое»). Запрос — один на весь
    чек. Без ключа (или при сбое) возвращает имена без изменений: деттерминированная
    чистка уже сделана в parse_structured_items.
    """
    if not names:
        return []
    if settings.llm_provider == "openrouter" and settings.openrouter_api_key:
        result = _openrouter_normalize_names(names)
        if result and len(result) == len(names):
            # Пустые ответы модели заменяем исходным именем.
            return [(r.strip() if r and r.strip() else names[i]) for i, r in enumerate(result)]
    return list(names)


def _openrouter_normalize_names(names: list[str]) -> list[str] | None:
    """Один запрос к LLM: список сырых имён -> список человекочитаемых (тот же порядок)."""
    numbered = "\n".join(f"{i}. {n}" for i, n in enumerate(names))
    text = _openrouter_chat(
        [
            {"role": "system", "content": (
                "Ты приводишь сокращённые названия продуктов из кассового чека к "
                "понятному виду на русском: раскрываешь сокращения, убираешь бренды и "
                "коды, сохраняешь суть продукта. Возвращай только JSON без markdown."
            )},
            {"role": "user", "content": (
                "Нормализуй каждое название. Сохрани тот же порядок и количество. "
                'Верни строго JSON: {"names": ["...", "..."]}.\n\n' + numbered
            )},
        ],
        max_tokens=600,
    )
    data = _safe_json(text) if text else None
    if not data or not isinstance(data.get("names"), list):
        return None
    return [str(x) for x in data["names"]]


# --- Генерация рациона (объяснения + креативные блюда) ---

_DOMINANT_RU = {
    "protein": "белок",
    "fat": "жиры",
    "carbs": "углеводы",
    "calories": "калорийность",
}


def _openrouter_chat(messages: list[dict], *, max_tokens: int = 200,
                     temperature: float = 0.7) -> str | None:
    """Один запрос к OpenRouter (OpenAI-совместимый chat/completions).

    Возвращает текст ответа или None при любой ошибке/отсутствии ключа —
    вызывающий код обязан иметь детерминированный фолбэк.
    """
    if settings.llm_provider != "openrouter" or not settings.openrouter_api_key:
        return None
    try:
        resp = httpx.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "https://github.com/xqzme-otec/fitFood",
                "X-Title": "FitFood",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openrouter_model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return content.strip() if content else None
    except Exception as exc:  # noqa: BLE001 — LLM опционален, не роняем запрос
        print(f"[llm] OpenRouter недоступен, фолбэк: {exc}")
        return None


def _safe_json(text: str) -> dict | None:
    """Достаёт первый JSON-объект из ответа модели (срезает ```-обёртки)."""
    try:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        return json.loads(m.group(0)) if m else None
    except Exception:  # noqa: BLE001
        return None


def explain_ration(dish_name: str, dominant_need: str, missing: list[str],
                   remaining) -> str:
    """Короткое дружелюбное объяснение, почему блюдо подходит. LLM или фолбэк.

    `remaining` — объект с полями calories/protein/fat/carbs (остаток на день).
    """
    need_ru = _DOMINANT_RU.get(dominant_need, "баланс КБЖУ")
    text = _openrouter_chat(
        [
            {"role": "system",
             "content": "Ты — помощник по питанию FitFood. Отвечай кратко, по-русски, без markdown."},
            {"role": "user", "content": (
                f"На следующий приём пищи пользователю важно добрать: {need_ru}. "
                f"Остаток на день: {remaining.calories:.0f} ккал, белок {remaining.protein:.0f} г, "
                f"жиры {remaining.fat:.0f} г, углеводы {remaining.carbs:.0f} г. "
                f"Предлагается блюдо «{dish_name}». "
                + (f"Не хватает ингредиентов: {', '.join(missing[:3])}. " if missing else "")
                + "Объясни в 1-2 коротких дружелюбных предложениях, почему это блюдо подходит."
            )},
        ],
        max_tokens=120,
    )
    if text:
        return text
    base = f"«{dish_name}» помогает добрать {need_ru} в оставшемся дневном лимите."
    if missing:
        base += f" Не хватает: {', '.join(missing[:3])}."
    return base


# Роли продуктов для сборки осмысленного блюда. Распознаём по словам в названии
# (приоритетно) и по категории холодильника. Для каждой роли — базовая порция (г)
# и оценка КБЖУ на 100 г (используется, только если у продукта нет ссылки на каталог).
_ROLE_WORDS: list[tuple[str, tuple[str, ...]]] = [
    ("protein", ("куриц", "куриное", "филе", "грудка", "говядин", "свинин", "индейк",
                 "фарш", "телятин", "рыба", "лосось", "сёмга", "семга", "треск",
                 "минтай", "форель", "тунец", "креветк", "яйцо", "яйца", "ветчин", "бекон")),
    ("dairy", ("творог", "сыр", "йогурт", "кефир", "молоко", "сметана", "ряженк",
               "моцарелла", "брынза")),
    ("carb", ("гречк", "рис", "макарон", "паста", "спагетти", "овсян", "булгур",
              "киноа", "кускус", "картоф", "хлеб", "лаваш", "тортиль", "лапша",
              "перлов", "пшено", "чечевиц", "нут", "крупа")),
    ("fruit", ("яблок", "банан", "груш", "апельсин", "мандарин", "ягод", "черник",
               "клубник", "малин", "киви", "виноград", "персик", "абрикос", "манго")),
    ("veg", ("помидор", "томат", "огурец", "перец", "лук", "морков", "капуст",
             "брокколи", "кабачок", "баклажан", "шпинат", "салат", "зелень",
             "чеснок", "свекл", "цуккини", "тыкв", "гриб", "авокадо")),
]
_ROLE_BY_CATEGORY = {
    "Мясо и рыба": "protein",
    "Молочка": "dairy",
    "Бакалея": "carb",
    "Хлеб и выпечка": "carb",
}
_ROLE_DEFAULTS: dict[str, dict] = {
    "protein": {"grams": 150.0, "per100": (165.0, 25.0, 6.0, 1.0)},
    "dairy": {"grams": 150.0, "per100": (120.0, 11.0, 5.0, 6.0)},
    "carb": {"grams": 150.0, "per100": (130.0, 3.0, 1.0, 27.0)},
    "veg": {"grams": 120.0, "per100": (35.0, 2.0, 0.3, 6.0)},
    "fruit": {"grams": 120.0, "per100": (55.0, 0.6, 0.2, 13.0)},
    "other": {"grams": 120.0, "per100": (120.0, 4.0, 4.0, 15.0)},
}


def _role_for(name: str, category: str | None = None) -> str:
    """Роль продукта по названию/категории: protein/dairy/carb/veg/fruit/other."""
    low = (name or "").lower()
    for role, words in _ROLE_WORDS:
        if any(w in low for w in words):
            return role
    cat = category or ""
    if cat == "Овощи и фрукты":  # уточняем по названию, иначе считаем овощем
        return "veg"
    return _ROLE_BY_CATEGORY.get(cat, "other")


def _role_of(item) -> str:
    """Роль продукта холодильника: protein/dairy/carb/veg/fruit/other."""
    return _role_for(getattr(item, "name", "") or "", getattr(item, "category", "") or "")


def estimate_macros(name: str, category: str | None = None) -> dict:
    """Оценка КБЖУ на 100 г для продукта без привязки к каталогу.

    Возвращает {"calories", "protein", "fat", "carbs"}. При наличии ключа
    делегирует в LLM; иначе — детерминированная оценка по «роли» продукта
    (мясо/молочка/крупы/овощи/фрукты/прочее), как и estimate_shelf_life_days.
    """
    if settings.llm_provider == "openrouter" and settings.openrouter_api_key:
        llm_macros = _openrouter_macros(name)
        if llm_macros:
            return llm_macros
    cal, pro, fat, carb = _ROLE_DEFAULTS[_role_for(name, category)]["per100"]
    return {"calories": cal, "protein": pro, "fat": fat, "carbs": carb}


def _openrouter_macros(name: str) -> dict | None:
    """Просит LLM оценить КБЖУ на 100 г, возвращает dict или None при сбое."""
    text = _openrouter_chat(
        [
            {"role": "system", "content": (
                "Ты — нутрициолог. Оцениваешь пищевую ценность продукта на 100 г. "
                "Возвращай только JSON без markdown."
            )},
            {"role": "user", "content": (
                f"Оцени КБЖУ продукта «{name}» на 100 г. Верни строго JSON: "
                '{"calories": число, "protein": число, "fat": число, "carbs": число}'
            )},
        ],
        max_tokens=120,
    )
    data = _safe_json(text) if text else None
    if not data:
        return None
    try:
        macros = {k: float(data[k]) for k in ("calories", "protein", "fat", "carbs")}
    except (KeyError, TypeError, ValueError):
        return None
    if any(v < 0 for v in macros.values()) or macros["calories"] > 1000:
        return None  # отбраковываем явный бред модели
    return macros


def _per100(item, role: str) -> tuple[float, float, float, float]:
    """КБЖУ на 100 г: из связанного продукта каталога или оценка по роли."""
    p = getattr(item, "product", None)
    if p is not None:
        return (p.calories, p.protein, p.fat, p.carbs)
    return _ROLE_DEFAULTS[role]["per100"]


def _instrumental(name: str) -> str:
    """Грубое склонение одного слова в творительный падеж («гречка» → «гречкой»).

    Для составных названий возвращает их в нижнем регистре без склонения —
    меню-стиль остаётся читаемым («с куриное филе» не идеально, но допустимо).
    """
    if len(name.split()) != 1:
        return name.lower()
    w = name.lower()
    if w.endswith("а"):
        return w[:-1] + "ой"
    if w.endswith("я"):
        return w[:-1] + "ей"
    if w.endswith("ь"):
        return w[:-1] + "ью"
    if w.endswith(("о", "е")):
        return w + "м"
    if w and w[-1] in "бвгдзйклмнпрстфхцчшщ":
        return w + "ом"
    return w


def _compose_dish(remaining, items: list) -> dict | None:
    """Детерминированно собирает осмысленное блюдо из холодильника + считает КБЖУ.

    Берёт по одному продукту на роль (белок + гарнир + овощ, либо молочка + фрукт),
    подгоняет суммарную порцию под остаток калорий на день и суммирует реальные
    КБЖУ продуктов. Возвращает None, если продуктов нет.
    """
    if not items:
        return None

    by_role: dict[str, object] = {}
    for it in items:
        by_role.setdefault(_role_of(it), it)

    # Подбираем связную тарелку: главный продукт + уместные гарниры.
    chosen: list = []
    if "protein" in by_role:
        chosen = [by_role["protein"]]
        if "carb" in by_role:
            chosen.append(by_role["carb"])
        if "veg" in by_role:
            chosen.append(by_role["veg"])
    elif "dairy" in by_role:
        chosen = [by_role["dairy"]]
        if "fruit" in by_role:
            chosen.append(by_role["fruit"])
        elif "veg" in by_role:
            chosen.append(by_role["veg"])
    elif "carb" in by_role:
        chosen = [by_role["carb"]]
        if "veg" in by_role:
            chosen.append(by_role["veg"])
    else:
        chosen = [next(iter(by_role.values()))]

    roles = [_role_of(c) for c in chosen]
    base_grams = [_ROLE_DEFAULTS[r]["grams"] for r in roles]
    per100s = [_per100(c, r) for c, r in zip(chosen, roles)]

    # Подгоняем порцию под остаток калорий на день (в разумных пределах).
    base_cal = sum(p[0] * g / 100.0 for p, g in zip(per100s, base_grams)) or 1.0
    if remaining.calories and remaining.calories > 0:
        factor = max(0.5, min(remaining.calories / base_cal, 1.6))
    else:
        factor = 1.0
    grams = [round(g * factor / 10.0) * 10.0 for g in base_grams]

    cal = sum(p[0] * g / 100.0 for p, g in zip(per100s, grams))
    pro = sum(p[1] * g / 100.0 for p, g in zip(per100s, grams))
    fat = sum(p[2] * g / 100.0 for p, g in zip(per100s, grams))
    carb = sum(p[3] * g / 100.0 for p, g in zip(per100s, grams))

    main, sides = chosen[0], chosen[1:]
    if sides:
        name = f"{main.name} с " + " и ".join(_instrumental(s.name) for s in sides)
    else:
        name = main.name

    need = _dominant_need_local(remaining)
    if remaining.calories and remaining.calories > 0:
        reason = (
            f"Собрано из вашего холодильника под остаток дня (~{remaining.calories:.0f} ккал): "
            f"{round(pro)} г белка помогут добрать {_DOMINANT_RU.get(need, 'баланс КБЖУ')}."
        )
    else:
        reason = (
            "Лёгкий вариант из холодильника — дневной лимит почти исчерпан, "
            "поэтому порция небольшая."
        )

    return {
        "name": name[0].upper() + name[1:] if name else name,
        "reason": reason,
        "calories": round(cal, 1), "protein": round(pro, 1),
        "fat": round(fat, 1), "carbs": round(carb, 1),
        "grams": round(sum(grams), 1),
    }


def _dominant_need_local(remaining) -> str:
    """Какого макронутриента сейчас не хватает больше всего (по граммам остатка)."""
    needs = {"protein": remaining.protein, "fat": remaining.fat, "carbs": remaining.carbs}
    positive = {k: v for k, v in needs.items() if v and v > 0}
    return max(positive, key=positive.get) if positive else "calories"


def invent_dish(remaining, items: list) -> dict | None:
    """Креативное блюдо из продуктов холодильника, когда каталог исчерпан.

    `items` — объекты FridgeItem (с .name/.category/.product). Всегда возвращает
    блюдо с реальными КБЖУ (детерминированная сборка), либо None если холодильник
    пуст. Если доступна LLM — берём её более «вкусные» название/описание, но КБЖУ
    оставляем расчётными (LLM в КБЖУ ненадёжна).
    """
    det = _compose_dish(remaining, items)
    if det is None:
        return None

    fridge_names = [getattr(i, "name", "") for i in items if getattr(i, "name", "")]
    text = _openrouter_chat(
        [
            {"role": "system", "content": (
                "Ты — шеф-повар FitFood. Придумываешь простые, аппетитные и реалистичные "
                "домашние блюда строго из заданных продуктов. Возвращай только JSON без markdown."
            )},
            {"role": "user", "content": (
                f"Продукты в холодильнике: {', '.join(fridge_names[:20])}. "
                f"Остаток на день: {remaining.calories:.0f} ккал, белок {remaining.protein:.0f} г, "
                f"жиры {remaining.fat:.0f} г, углеводы {remaining.carbs:.0f} г. "
                "Предложи одно аппетитное блюдо, которое реально приготовить из этих продуктов. "
                'Верни строго JSON: {"name": str (короткое название блюда), '
                '"reason": str (1-2 дружелюбных предложения, почему подходит)}'
            )},
        ],
        max_tokens=200,
    )
    parsed = _safe_json(text) if text else None
    if parsed and parsed.get("name"):
        det["name"] = str(parsed["name"]).strip()
        if parsed.get("reason"):
            det["reason"] = str(parsed["reason"]).strip()
    return det


# --- Заглушки реальных провайдеров (реализуйте при наличии ключей) ---

def _openai_shelf_life(product_name: str) -> int:  # pragma: no cover
    raise NotImplementedError(
        "Реализуйте вызов OpenAI здесь. Промпт: "
        f'«Для продукта "{product_name}" укажи средний срок годности в днях. '
        'Ответ только числом».'
    )


def _openai_parse_receipt(ocr_text: str) -> list[ParsedReceiptItem]:  # pragma: no cover
    raise NotImplementedError("Реализуйте разбор чека через OpenAI здесь.")
