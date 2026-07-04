"""Парсинг данных рецептов и сопоставление ингредиентов с холодильником."""
from __future__ import annotations

import re

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import FridgeItem, Recipe
from app.services import classifier

# Меню рецептов: ключ (категория_запроса в CSV) -> человекочитаемое название.
MENU_LABELS: dict[str, str] = {
    "завтрак": "Завтрак",
    "обед": "Обед",
    "ужин": "Ужин",
    "здоровая_еда": "Здоровая еда",
    "десерты": "Десерты",
    "закуски": "Закуски",
}
MENU_ORDER = list(MENU_LABELS.keys())

# Токены, не несущие смысла для матчинга (единицы, общие слова).
_STOP_TOKENS = {
    "свежий", "свежая", "свежие", "охлажденное", "охлаждённое", "домашний",
    "для", "вкусу", "штук", "штука", "зубчик", "зубчика", "ложка", "ложки",
    "стакан", "стакана", "щепотка", "пучок", "веточка", "банка", "упаковка",
    "соль", "перец", "вода", "сахар",
}


def parse_minutes(value: str | None) -> int | None:
    """«120 мин» / «1 ч 30 мин» -> минуты (int). None, если не распознано."""
    if not value:
        return None
    text = str(value).lower()
    hours = re.search(r"(\d+)\s*ч", text)
    mins = re.search(r"(\d+)\s*мин", text)
    total = 0
    if hours:
        total += int(hours.group(1)) * 60
    if mins:
        total += int(mins.group(1))
    if total == 0:
        # Просто число без единиц — трактуем как минуты.
        bare = re.search(r"\d+", text)
        total = int(bare.group()) if bare else 0
    return total or None


def parse_servings(value: str | None) -> int | None:
    if not value:
        return None
    m = re.search(r"\d+", str(value))
    return int(m.group()) if m else None


def _ingredient_names(ingredients_text: str) -> list[str]:
    """Названия ингредиентов из текста (по строкам, до количества/единиц)."""
    names: list[str] = []
    for line in (ingredients_text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        # Отрезаем количество: «Морковь 3 шт. = 300 г» -> «Морковь».
        name = re.split(r"\d", line, maxsplit=1)[0].strip(" .,-—=")
        if name:
            names.append(name)
    return names


def tokens(text: str) -> set[str]:
    """Значимые токены строки для нечёткого сопоставления."""
    cleaned = classifier.clean_title(text)
    return {t for t in cleaned.split() if len(t) > 2 and t not in _STOP_TOKENS}


def ingredient_keys(ingredients_text: str) -> str:
    """Уникальные токены всех ингредиентов рецепта (через пробел) для хранения."""
    acc: set[str] = set()
    for name in _ingredient_names(ingredients_text):
        acc |= tokens(name)
    return " ".join(sorted(acc))


def fridge_tokens(items: list[FridgeItem]) -> set[str]:
    acc: set[str] = set()
    for it in items:
        acc |= tokens(it.name)
    return acc


def match_count(recipe_keys: str, fridge: set[str]) -> int:
    """Сколько уникальных ингредиентов рецепта есть в холодильнике."""
    if not recipe_keys or not fridge:
        return 0
    return len(set(recipe_keys.split()) & fridge)


def retrieve_matching(
    db: Session, fridge_items: list[FridgeItem], limit: int = 6
) -> list[Recipe]:
    """RAG-retrieval: рецепты каталога, лучше всего совпадающие с холодильником.

    Предварительно отсекаем по SQL (ingredient_keys содержит хотя бы один токен
    холодильника), затем ранжируем в Python по числу совпавших ингредиентов.
    Служат КОНТЕКСТОМ (вдохновением) для LLM, а не готовым ответом.
    """
    fridge = fridge_tokens(fridge_items)
    if not fridge:
        return []
    conds = [Recipe.ingredient_keys.ilike(f"%{tok}%") for tok in fridge]
    rows = db.query(Recipe).filter(or_(*conds)).all()
    ranked = sorted(
        rows, key=lambda r: match_count(r.ingredient_keys, fridge), reverse=True
    )
    return [r for r in ranked if match_count(r.ingredient_keys, fridge) > 0][:limit]
