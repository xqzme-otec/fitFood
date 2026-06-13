"""Дневник питания: запись съеденного и сводка КБЖУ за день."""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import Dish, FoodEntry, MealSlot, Product, User
from app.schemas.meal import (
    DaySummary,
    FoodEntryCreate,
    FoodEntryOut,
    MacroSummary,
    MealSlotSummary,
)

router = APIRouter(prefix="/diary", tags=["diary"])


def _portion_macros(product: Product | None, dish: Dish | None, amount: float) -> dict:
    """КБЖУ за съеденную порцию (amount г/мл). Каталог хранит значения на 100 г."""
    if product is not None:
        per100 = {
            "calories": product.calories, "protein": product.protein,
            "fat": product.fat, "carbs": product.carbs,
        }
        name = product.name
    else:
        per100 = dish.per_100g()
        name = dish.name
    factor = amount / 100.0
    return {
        "name": name,
        "calories": round(per100["calories"] * factor, 1),
        "protein": round(per100["protein"] * factor, 1),
        "fat": round(per100["fat"] * factor, 1),
        "carbs": round(per100["carbs"] * factor, 1),
    }


@router.post("/entries", response_model=FoodEntryOut, status_code=201)
def add_entry(
    payload: FoodEntryCreate,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Записать съеденный продукт/блюдо в приём пищи. Дневное КБЖУ обновляется автоматически."""
    slot = db.get(MealSlot, payload.meal_slot_id)
    if not slot or slot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Приём пищи не найден")

    product = db.get(Product, payload.product_id) if payload.product_id else None
    dish = db.get(Dish, payload.dish_id) if payload.dish_id else None
    if payload.product_id and not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    if payload.dish_id and not dish:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")

    macros = _portion_macros(product, dish, payload.amount)
    entry = FoodEntry(
        user_id=user.id,
        meal_slot_id=slot.id,
        entry_date=payload.entry_date or date_type.today(),
        product_id=payload.product_id,
        dish_id=payload.dish_id,
        name=macros["name"],
        amount=payload.amount,
        calories=macros["calories"],
        protein=macros["protein"],
        fat=macros["fat"],
        carbs=macros["carbs"],
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    entry = db.get(FoodEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(entry)
    db.commit()


@router.get("/summary", response_model=DaySummary)
def day_summary(
    day: date_type = Query(default_factory=date_type.today),
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Сводка за день: цель, съедено и остаток — по дню и по каждому приёму."""
    target = user.nutrition_target
    entries = (
        db.query(FoodEntry)
        .filter(FoodEntry.user_id == user.id, FoodEntry.entry_date == day)
        .all()
    )

    by_slot: dict[int, list[FoodEntry]] = {}
    for e in entries:
        by_slot.setdefault(e.meal_slot_id, []).append(e)

    meals: list[MealSlotSummary] = []
    day_consumed = {"calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0}

    for slot in user.meal_slots:
        slot_entries = by_slot.get(slot.id, [])
        consumed = {
            "calories": round(sum(e.calories for e in slot_entries), 1),
            "protein": round(sum(e.protein for e in slot_entries), 1),
            "fat": round(sum(e.fat for e in slot_entries), 1),
            "carbs": round(sum(e.carbs for e in slot_entries), 1),
        }
        for k in day_consumed:
            day_consumed[k] += consumed[k]

        limit = {
            "calories": slot.calorie_limit, "protein": slot.protein_limit,
            "fat": slot.fat_limit, "carbs": slot.carb_limit,
        }
        remaining = {k: round(limit[k] - consumed[k], 1) for k in limit}

        meals.append(
            MealSlotSummary(
                meal_slot_id=slot.id,
                name=slot.name,
                limit=MacroSummary(**limit),
                consumed=MacroSummary(**consumed),
                remaining=MacroSummary(**remaining),
                entries=[FoodEntryOut.model_validate(e) for e in slot_entries],
            )
        )

    target_macros = {
        "calories": target.calories, "protein": target.protein_g,
        "fat": target.fat_g, "carbs": target.carb_g,
    }
    day_consumed = {k: round(v, 1) for k, v in day_consumed.items()}
    day_remaining = {k: round(target_macros[k] - day_consumed[k], 1) for k in target_macros}

    return DaySummary(
        date=day,
        target=MacroSummary(**target_macros),
        consumed=MacroSummary(**day_consumed),
        remaining=MacroSummary(**day_remaining),
        meals=meals,
    )
