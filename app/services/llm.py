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

import re
from dataclasses import dataclass

from app.config import settings

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


# --- Заглушки реальных провайдеров (реализуйте при наличии ключей) ---

def _openai_shelf_life(product_name: str) -> int:  # pragma: no cover
    raise NotImplementedError(
        "Реализуйте вызов OpenAI здесь. Промпт: "
        f'«Для продукта "{product_name}" укажи средний срок годности в днях. '
        'Ответ только числом».'
    )


def _openai_parse_receipt(ocr_text: str) -> list[ParsedReceiptItem]:  # pragma: no cover
    raise NotImplementedError("Реализуйте разбор чека через OpenAI здесь.")
