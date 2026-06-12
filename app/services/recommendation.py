"""Рекомендация рецептов на основе содержимого холодильника и остатка КБЖУ.

Алгоритм (см. также CLAUDE.md §5):
  1. Берём остаток лимитов КБЖУ на выбранный приём пищи (лимит − съедено).
  2. Берём реально доступные продукты из холодильника пользователя.
  3. Для каждого блюда каталога проверяем, какие ингредиенты есть в холодильнике.
     Ключевые ингредиенты (большой вес) обязательны; неключевые могут
     отсутствовать — помечаются.
  4. Считаем «дефицитный» макронутриент и предпочитаем блюда, которые его
     покрывают (нужен белок → блюдо с высоким белком).
  5. Подбираем размер порции под остаток калорий.
  6. Если подходящих блюд нет — предлагаем простые комбинации продуктов.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Dish, FridgeItem, MealSlot, User
from app.services import classifier

# Ингредиент считается ключевым, если его вес в блюде >= порога.
KEY_INGREDIENT_GRAMS = 50.0
_STOP_TOKENS = {"свежий", "свежая", "охлажденное", "охлаждённое", "домашний", "г", "мл"}


@dataclass
class Remaining:
    calories: float
    protein: float
    fat: float
    carbs: float


def _tokens(name: str) -> set[str]:
    """Значимые токены названия для нечёткого сопоставления."""
    cleaned = classifier.clean_title(name)
    return {t for t in cleaned.split() if len(t) > 2 and t not in _STOP_TOKENS}


def _build_fridge_index(items: list[FridgeItem]) -> set[str]:
    index: set[str] = set()
    for it in items:
        index |= _tokens(it.name)
    return index


def _ingredient_available(product_name: str, fridge_tokens: set[str]) -> bool:
    prod_tokens = _tokens(product_name)
    return bool(prod_tokens & fridge_tokens)


def remaining_for_meal(db: Session, user: User, slot: MealSlot, day) -> Remaining:
    """Остаток лимита КБЖУ на приём = лимит − уже съеденное за этот приём в этот день."""
    from app.models import FoodEntry  # локальный импорт во избежание циклов

    rows = (
        db.query(FoodEntry)
        .filter(
            FoodEntry.user_id == user.id,
            FoodEntry.meal_slot_id == slot.id,
            FoodEntry.entry_date == day,
        )
        .all()
    )
    eaten_cal = sum(r.calories for r in rows)
    eaten_p = sum(r.protein for r in rows)
    eaten_f = sum(r.fat for r in rows)
    eaten_c = sum(r.carbs for r in rows)
    return Remaining(
        calories=round(slot.calorie_limit - eaten_cal, 1),
        protein=round(slot.protein_limit - eaten_p, 1),
        fat=round(slot.fat_limit - eaten_f, 1),
        carbs=round(slot.carb_limit - eaten_c, 1),
    )


def _dominant_need(rem: Remaining) -> str:
    """Какой макронутриент сейчас наиболее дефицитен (по граммам остатка)."""
    needs = {"protein": rem.protein, "fat": rem.fat, "carbs": rem.carbs}
    positive = {k: v for k, v in needs.items() if v > 0}
    if not positive:
        return "calories"
    return max(positive, key=positive.get)


def _suggested_grams(dish: Dish, rem: Remaining) -> float:
    """Размер порции, чтобы вписаться в остаток калорий (в разумных пределах)."""
    per100 = dish.per_100g()
    cal_per_g = (per100["calories"] or 1.0) / 100.0
    if rem.calories <= 0:
        return 150.0  # лимит исчерпан — предлагаем символическую порцию
    grams = rem.calories / cal_per_g
    return float(round(max(100.0, min(grams, dish.total_grams or 500.0)), 0))


def _score_dish(dish: Dish, rem: Remaining, coverage: float, dominant: str) -> float:
    """Оценка пригодности блюда: покрытие ингредиентами + попадание в дефицит."""
    per100 = dish.per_100g()
    cal = per100["calories"] or 1.0

    # Плотность дефицитного макронутриента (г на 100 ккал) — чем выше, тем лучше.
    if dominant == "calories":
        fit = 1.0
    else:
        fit = per100[{"protein": "protein", "fat": "fat", "carbs": "carbs"}[dominant]] / cal * 100

    # Штраф за переедание: если даже минимальная порция (100 г) превышает остаток.
    overshoot = 0.0
    if rem.calories > 0 and per100["calories"] > rem.calories * 1.5:
        overshoot = 1.0

    return round(coverage * 3.0 + fit - overshoot, 3)


def recommend_dishes(
    db: Session, user: User, slot: MealSlot, day, limit: int = 5
) -> list[dict]:
    fridge_items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    fridge_tokens = _build_fridge_index(fridge_items)
    rem = remaining_for_meal(db, user, slot, day)
    dominant = _dominant_need(rem)

    results: list[dict] = []
    for dish in db.query(Dish).all():
        if not dish.ingredients:
            continue

        key_total = key_have = 0
        ingredients_info = []
        missing = []
        for ing in dish.ingredients:
            available = _ingredient_available(ing.product.name, fridge_tokens)
            is_key = ing.grams >= KEY_INGREDIENT_GRAMS
            if is_key:
                key_total += 1
                key_have += int(available)
            if not available:
                missing.append(ing.product.name)
            ingredients_info.append(
                {
                    "product_id": ing.product_id,
                    "name": ing.product.name,
                    "grams_needed": ing.grams,
                    "available": available,
                    "note": "" if available else ("ключевой" if is_key else "неключевой"),
                }
            )

        # Все ключевые ингредиенты обязаны быть в наличии.
        if key_total > 0 and key_have < key_total:
            continue

        coverage = (key_have / key_total) if key_total else 0.0
        score = _score_dish(dish, rem, coverage, dominant)
        grams = _suggested_grams(dish, rem)
        per100 = dish.per_100g()
        factor = grams / 100.0

        reason_parts = []
        if dominant != "calories":
            reason_parts.append(f"покрывает дефицит: {dominant}")
        if missing:
            reason_parts.append(f"не хватает: {', '.join(missing[:3])}")
        reason = "; ".join(reason_parts) or "вписывается в остаток калорий"

        results.append(
            {
                "dish_id": dish.id,
                "name": dish.name,
                "kind": "dish",
                "score": score,
                "reason": reason,
                "calories": round(per100["calories"] * factor, 1),
                "protein": round(per100["protein"] * factor, 1),
                "fat": round(per100["fat"] * factor, 1),
                "carbs": round(per100["carbs"] * factor, 1),
                "suggested_grams": grams,
                "missing_ingredients": missing,
                "ingredients": ingredients_info,
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    if results:
        return results[:limit]

    # Фолбэк: простые комбинации из имеющихся продуктов.
    return _fallback_combos(fridge_items, rem)


def _fallback_combos(fridge_items: list[FridgeItem], rem: Remaining) -> list[dict]:
    """Если ни одно блюдо не подходит — предлагаем простые пары продуктов."""
    if not fridge_items:
        return []

    protein_like = [i for i in fridge_items if i.category in ("Молочка", "Мясо", "Рыба")]
    sweet_like = [i for i in fridge_items if i.category in ("Фрукты", "Овощи")]

    combos: list[dict] = []
    if protein_like and sweet_like:
        a, b = protein_like[0], sweet_like[0]
        combos.append(
            {
                "dish_id": None,
                "name": f"{a.name} + {b.name}",
                "kind": "combo",
                "score": 1.0,
                "reason": "простая комбинация из холодильника (источник белка + овощ/фрукт)",
                "calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0,
                "suggested_grams": 200.0,
                "missing_ingredients": [],
                "ingredients": [],
            }
        )
    if not combos:
        top = fridge_items[0]
        combos.append(
            {
                "dish_id": None,
                "name": top.name,
                "kind": "combo",
                "score": 0.5,
                "reason": "съешьте имеющийся продукт — подходящих рецептов не найдено",
                "calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0,
                "suggested_grams": 150.0,
                "missing_ingredients": [],
                "ingredients": [],
            }
        )
    return combos
