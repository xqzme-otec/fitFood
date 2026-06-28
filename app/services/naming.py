"""Очистка названий продуктов от «маркетплейсного» мусора для отображения.

Каталог импортируется из выгрузки магазина, где названия слеплены с ценой,
рейтингом, отзывами, весом и рекламными бейджами, например:

    "Создали для вас159.189.Мини-маффины Lucky Days 470г4.9· 443 отзыва"
    "19.Булочка бутербродная Мультизлаковая 60г4.9· 134 отзыва"

`clean_display_name` приводит такое к человекочитаемому виду:

    "Мини-маффины Lucky Days"
    "Булочка бутербродная Мультизлаковая"

Регистр исходного названия сохраняется (в отличие от classifier.clean_title,
которая нормализует текст в нижний регистр под признаки ML-модели).
"""
from __future__ import annotations

import re

# Рекламные бейджи, приклеенные перед ценой/названием.
_BADGES = re.compile(
    r"Создали для вас|Только у нас|Суперцена|Хит продаж|Новинка|"
    r"Разн\w*\s+[а-яёa-z]+|Промокод:?\s*[A-ZА-ЯЁ]+",
    re.IGNORECASE,
)
# Ведущий ценник: "19.", "59.99.", "49.129." (одна или несколько групп "число.").
_LEADING_PRICE = re.compile(r"^(?:\d+\.)+")
_NO_REVIEWS = re.compile(r"нет\s+отзывов", re.IGNORECASE)
_REVIEWS = re.compile(r"·?\s*\d+\s*отзыв\w*", re.IGNORECASE)
_NOISE = re.compile(
    r"\+5%\s*с\s*премиум|финальная\s*цена|в\s*корзину|товар\s*18\+|-\d+%",
    re.IGNORECASE,
)
_PRICE = re.compile(r"\d+[\d\s]*(?:₽|руб)\.?", re.IGNORECASE)
# Вес/объём: 100г, 300мл, 1кг, 1.93л, 5шт. Lookahead отсекает совпадение с
# началом слова ("грамм", "литр"), но допускает слипание с цифрами ("60г4").
_UNIT = re.compile(r"\d+(?:[.,]\d+)?\s*(?:кг|мл|шт|г|л)(?![а-яё])", re.IGNORECASE)
_RATING = re.compile(r"\d+[.,]\d+")          # 4.9 — рейтинг/дробные остатки
_DIGITS = re.compile(r"\d+[.,]?\d*")          # остаточные цены/числа
_DANGLING_DOT = re.compile(r"\s*\.\s*(?=\s|$)")
_HYPHEN = re.compile(r"[ \t]*([—–-])[ \t]*")
_SPACES = re.compile(r"\s+")


# --- Очистка фискальных названий из чеков (ФНС) ---
# Примеры: "3191300 ТЕНД.Филе кур.охл.подл", "00012 Молоко п/пак 2.5%".
# Ведущий артикул/PLU: длинный код в начале строки.
_RECEIPT_CODE = re.compile(r"^\s*\d{3,}\s+")
# Точка как разделитель слов/сокращений: "ТЕНД.Филе" -> "ТЕНД. Филе".
_DOT_BEFORE_LETTER = re.compile(r"\.(?=[A-Za-zА-Яа-яЁё])")
# Маркеры упаковки/фасовки (не часть названия продукта). Длинные формы — раньше
# коротких; lookbehind/lookahead не дают сработать внутри слова («подложка»).
_PACKAGING = re.compile(
    r"(?<![А-Яа-яЁёA-Za-z])(?:подложк\w*|термоупак\w*|вакуум\w*|разв(?:ес|ис)\w*|"
    r"в/?упак\w*|упак\w*|фас\w*|лоток|н/?подл|подл|п/?уп|п/?пак|в/?у|"
    r"пл/?б|ст/?б|ж/?б|тетра(?:пак)?|дой-?пак)"
    r"\.?(?![А-Яа-яЁёA-Za-z])",
    re.IGNORECASE,
)


def clean_receipt_name(raw: str | None) -> str:
    """Чистит «фискальное» название из чека: артикул, упаковка, слипшиеся точки.

    Детерминированная (без ключей) база перед LLM-нормализацией. Аббревиатуры
    НЕ раскрывает (это делает LLM) — лишь приводит строку к опрятному виду:

        "3191300 ТЕНД.Филе кур.охл.подл" -> "ТЕНД. Филе кур. охл"
    """
    if not raw or not isinstance(raw, str):
        return ""
    text = _RECEIPT_CODE.sub("", raw)
    text = _DOT_BEFORE_LETTER.sub(". ", text)
    text = _PACKAGING.sub(" ", text)
    text = _SPACES.sub(" ", text)
    return text.strip(" .,-/")


def clean_display_name(title: str | None) -> str:
    """Возвращает очищенное название без цен, рейтингов, отзывов и веса.

    Идемпотентна: повторный вызов на уже очищенном названии ничего не меняет.
    """
    if not title or not isinstance(title, str):
        return ""
    text = _BADGES.sub(" ", title)
    text = _LEADING_PRICE.sub("", text.lstrip())
    text = _NO_REVIEWS.sub(" ", text)
    text = _REVIEWS.sub(" ", text)
    text = _NOISE.sub(" ", text)
    text = _PRICE.sub(" ", text)
    text = _UNIT.sub(" ", text)
    text = _RATING.sub(" ", text)
    text = _DIGITS.sub(" ", text)
    text = text.replace("·", " ").replace("⭐", " ").replace("₽", " ").replace("%", " ")
    text = _DANGLING_DOT.sub(" ", text)
    text = _HYPHEN.sub(r"\1", text)
    text = _SPACES.sub(" ", text)
    return text.strip(" .,-·/")
