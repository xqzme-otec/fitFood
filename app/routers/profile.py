"""Анкета, нормы КБЖУ, изменение веса/лимита калорий, приёмы пищи."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_profile
from app.database import get_db
from app.models import Profile, User, WeightRecord
from app.schemas.profile import (
    CalorieOverride,
    MacroOverride,
    MealPlanUpdate,
    MealSlotOut,
    NutritionTargetOut,
    ProfileCreate,
    ProfileOut,
    WeightRecordOut,
    WeightUpdate,
)
from app.services import targets as targets_service

router = APIRouter(tags=["profile"])


@router.post("/profile", response_model=ProfileOut)
def create_or_update_profile(
    payload: ProfileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Заполнение/обновление анкеты. Пересчитывает норму КБЖУ и приёмы пищи."""
    profile = user.profile or Profile(user_id=user.id)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    if user.profile is None:
        db.add(profile)
    user.is_profile_complete = True

    # Фиксируем стартовый вес в истории.
    db.add(WeightRecord(user_id=user.id, weight_kg=payload.weight_kg))
    db.commit()
    db.refresh(user)

    targets_service.recalc_targets(db, user)
    return user.profile


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(require_profile)):
    return user.profile


@router.get("/profile/targets", response_model=NutritionTargetOut)
def get_targets(user: User = Depends(require_profile)):
    return user.nutrition_target


@router.put("/profile/weight", response_model=NutritionTargetOut)
def update_weight(
    payload: WeightUpdate,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Изменение текущего веса -> запись в историю -> пересчёт нормы КБЖУ."""
    user.profile.weight_kg = payload.weight_kg
    db.add(WeightRecord(user_id=user.id, weight_kg=payload.weight_kg))
    db.commit()
    return targets_service.recalc_targets(db, user)


@router.get("/profile/weight/history", response_model=list[WeightRecordOut])
def weight_history(
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    return (
        db.query(WeightRecord)
        .filter(WeightRecord.user_id == user.id)
        .order_by(WeightRecord.recorded_at.desc())
        .all()
    )


@router.put("/profile/calories", response_model=NutritionTargetOut)
def override_calories(
    payload: CalorieOverride,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Ручная корректировка дневного лимита калорий (БЖУ пересчитываются пропорционально)."""
    try:
        return targets_service.apply_manual_calories(db, user, payload.calories)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/profile/macros", response_model=NutritionTargetOut)
def override_macros(
    payload: MacroOverride,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Ручная установка БЖУ в граммах (калории считаются из них или передаются явно)."""
    try:
        return targets_service.apply_manual_macros(
            db, user,
            protein_g=payload.protein_g,
            fat_g=payload.fat_g,
            carb_g=payload.carb_g,
            calories=payload.calories,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/profile/meals", response_model=list[MealSlotOut])
def get_meal_slots(user: User = Depends(require_profile)):
    return user.meal_slots


@router.put("/profile/meals", response_model=list[MealSlotOut])
def set_meal_plan(
    payload: MealPlanUpdate,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Ручная настройка числа приёмов и распределения калорий по ним."""
    shares = [(m.name, m.share) for m in payload.meals]
    try:
        return targets_service.set_meal_plan(db, user, shares)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
