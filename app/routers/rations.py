"""Свайп-генератор рациона.

`GET /rations/next` отдаёт следующего кандидата блюда для конкретного приёма.
Подбор учитывает ДНЕВНОЙ остаток КБЖУ (а не только лимит приёма), поэтому после
съеденного ранее блюда следующий приём адаптируется (углеводный завтрак →
бельково-жировой обед). LLM (OpenRouter, гибридно) пишет объяснение и придумывает
блюдо, когда каталог исчерпан. Лайк = обычная запись в дневник (`/diary/entries`).
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import FridgeItem, MealSlot, User
from app.schemas.recommendation import DayRemaining, RationNextOut
from app.services import llm
from app.services import recommendation as rec_service

router = APIRouter(prefix="/rations", tags=["rations"])


def _parse_exclude(exclude: str | None) -> set[int]:
    if not exclude:
        return set()
    return {int(p) for p in exclude.split(",") if p.strip().isdigit()}


@router.get("/next", response_model=RationNextOut | None)
def next_ration_card(
    meal_slot_id: int = Query(..., description="Для какого приёма подбираем блюдо"),
    day: date_type = Query(default_factory=date_type.today),
    exclude: str | None = Query(default=None, description="CSV id уже отвергнутых блюд"),
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Следующая карточка свайпа для приёма `meal_slot_id`.

    Возвращает блюдо из каталога (source=catalog), креативное блюдо от LLM
    (source=llm), когда каталог исчерпан, или `null`, если предложить нечего.
    """
    slot = db.get(MealSlot, meal_slot_id)
    if not slot or slot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Приём пищи не найден")

    exclude_ids = _parse_exclude(exclude)
    day_rem = rec_service.remaining_for_day(db, user, day)
    dominant = rec_service._dominant_need(day_rem)  # дефицит на уровне дня
    day_remaining = DayRemaining(
        calories=day_rem.calories, protein=day_rem.protein,
        fat=day_rem.fat, carbs=day_rem.carbs,
    )

    results = rec_service.recommend_dishes(
        db, user, slot, day, limit=5,
        dominant_override=dominant, exclude_dish_ids=exclude_ids,
    )
    dishes = [r for r in results if r["kind"] == "dish"]

    if dishes:
        top = dishes[0]
        top["reason"] = llm.explain_ration(
            top["name"], dominant, top.get("missing_ingredients", []), day_rem
        )
        return RationNextOut(
            **top, source="catalog", meal_slot_id=slot.id, day_remaining=day_remaining,
        )

    # Каталог исчерпан → креативное блюдо из холодильника (LLM или фолбэк).
    fridge_items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    idea = llm.invent_dish(day_rem, fridge_items)
    if idea is None:
        return None  # холодильник пуст — предложить нечего

    return RationNextOut(
        dish_id=None,
        name=idea["name"],
        kind="llm",
        score=0.0,
        reason=idea["reason"],
        calories=idea["calories"],
        protein=idea["protein"],
        fat=idea["fat"],
        carbs=idea["carbs"],
        suggested_grams=idea["grams"],
        missing_ingredients=[],
        ingredients=[],
        source="llm",
        meal_slot_id=slot.id,
        day_remaining=day_remaining,
    )
