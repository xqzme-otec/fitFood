"""Рекомендации рецептов на основе холодильника и остатка КБЖУ."""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import MealSlot, RecommendationLog, User
from app.schemas.recommendation import RecommendationOut
from app.services import recommendation as rec_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(
    meal_slot_id: int | None = Query(
        default=None, description="Для какого приёма. По умолчанию — ближайший/'на сейчас'"
    ),
    day: date_type = Query(default_factory=date_type.today),
    limit: int = Query(default=5, le=20),
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Подобрать блюда под остаток лимита приёма и содержимое холодильника.

    Если meal_slot_id не задан — берётся приём с наибольшим остатком калорий
    (трактуется как «на сейчас»).
    """
    if meal_slot_id is not None:
        slot = db.get(MealSlot, meal_slot_id)
        if not slot or slot.user_id != user.id:
            raise HTTPException(status_code=404, detail="Приём пищи не найден")
    else:
        slots = user.meal_slots
        if not slots:
            raise HTTPException(status_code=400, detail="Не настроены приёмы пищи")
        # «На сейчас» — приём с наибольшим остатком калорий.
        slot = max(
            slots,
            key=lambda s: rec_service.remaining_for_meal(db, user, s, day).calories,
        )

    results = rec_service.recommend_dishes(db, user, slot, day, limit=limit)

    # Логируем топ-рекомендацию для истории.
    if results:
        top = results[0]
        db.add(
            RecommendationLog(
                user_id=user.id,
                meal_slot_id=slot.id,
                dish_id=top["dish_id"],
                score=top["score"],
                reason=top["reason"],
            )
        )
        db.commit()

    return results
