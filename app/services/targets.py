"""Сервис управления нормами КБЖУ и приёмами пищи пользователя.

Связывает чистый расчётный модуль (services/nutrition.py) с БД:
пересоздаёт NutritionTarget и MealSlot при изменении анкеты/веса,
масштабирует БЖУ при ручном изменении лимита калорий.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import MealSlot, NutritionTarget, Profile, User
from app.services import nutrition


def recalc_targets(db: Session, user: User) -> NutritionTarget:
    """Полный пересчёт нормы КБЖУ по анкете + перестроение лимитов приёмов."""
    profile: Profile = user.profile
    macros = nutrition.calc_targets(
        sex=profile.sex.value,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age=profile.age,
        activity=profile.activity_level,
        goal=profile.goal,
        target_weight_kg=profile.target_weight_kg,
        target_days=profile.target_days,
    )

    target = user.nutrition_target
    if target is None:
        target = NutritionTarget(user_id=user.id)
        db.add(target)

    target.bmr = macros.bmr
    target.tdee = macros.tdee
    target.calories = macros.calories
    target.protein_g = macros.protein_g
    target.fat_g = macros.fat_g
    target.carb_g = macros.carb_g
    target.protein_ratio = macros.protein_ratio
    target.fat_ratio = macros.fat_ratio
    target.carb_ratio = macros.carb_ratio
    target.is_manual = False

    db.flush()
    _rebuild_meal_slots(db, user, target)
    db.commit()
    db.refresh(target)
    return target


def apply_manual_calories(db: Session, user: User, new_calories: float) -> NutritionTarget:
    """Ручная корректировка лимита калорий с пропорциональным пересчётом БЖУ."""
    target = user.nutrition_target
    if target is None:
        raise ValueError("Норма КБЖУ ещё не рассчитана")

    p, f, c = nutrition.rescale_for_calories(
        new_calories, target.protein_ratio, target.fat_ratio, target.carb_ratio
    )
    target.calories = round(new_calories, 1)
    target.protein_g = p
    target.fat_g = f
    target.carb_g = c
    target.is_manual = True

    db.flush()
    _rebuild_meal_slots(db, user, target)
    db.commit()
    db.refresh(target)
    return target


def apply_manual_macros(
    db: Session,
    user: User,
    *,
    protein_g: float,
    fat_g: float,
    carb_g: float,
    calories: float | None = None,
) -> NutritionTarget:
    """Ручная установка БЖУ в граммах.

    Калории берутся из переданного значения либо считаются из макросов
    (4/9/4 ккал на грамм). Доли пересчитываются под новые значения,
    лимиты приёмов перестраиваются.
    """
    target = user.nutrition_target
    if target is None:
        raise ValueError("Норма КБЖУ ещё не рассчитана")

    cal = calories if calories else (protein_g * 4 + fat_g * 9 + carb_g * 4)
    cal = max(cal, 1.0)

    target.calories = round(cal, 1)
    target.protein_g = round(protein_g, 1)
    target.fat_g = round(fat_g, 1)
    target.carb_g = round(carb_g, 1)
    target.protein_ratio = round(protein_g * 4 / cal, 4)
    target.fat_ratio = round(fat_g * 9 / cal, 4)
    target.carb_ratio = round(carb_g * 4 / cal, 4)
    target.is_manual = True

    db.flush()
    _rebuild_meal_slots(db, user, target)
    db.commit()
    db.refresh(target)
    return target


def _rebuild_meal_slots(
    db: Session,
    user: User,
    target: NutritionTarget,
    custom_shares: list[tuple[str, float]] | None = None,
) -> None:
    """Перестраивает лимиты приёмов пищи под текущую норму КБЖУ.

    Старается сохранить названия/доли уже настроенных приёмов; иначе берёт
    дефолтное распределение по числу приёмов из анкеты.
    """
    if custom_shares is not None:
        shares = custom_shares
    elif user.meal_slots:
        # Сохраняем существующее распределение (имя, доля).
        shares = [(s.name, s.calorie_share) for s in user.meal_slots]
    else:
        shares = nutrition.default_meal_shares(user.profile.meals_per_day)

    # Удаляем старые слоты и создаём новые с пересчитанными лимитами.
    for slot in list(user.meal_slots):
        db.delete(slot)
    db.flush()

    for order, (name, share) in enumerate(shares):
        db.add(
            MealSlot(
                user_id=user.id,
                name=name,
                order=order,
                calorie_share=share,
                calorie_limit=round(target.calories * share, 1),
                protein_limit=round(target.protein_g * share, 1),
                fat_limit=round(target.fat_g * share, 1),
                carb_limit=round(target.carb_g * share, 1),
            )
        )
    db.flush()


def set_meal_plan(
    db: Session, user: User, shares: list[tuple[str, float]]
) -> list[MealSlot]:
    """Ручная настройка распределения калорий по приёмам."""
    target = user.nutrition_target
    if target is None:
        raise ValueError("Норма КБЖУ ещё не рассчитана")
    user.profile.meals_per_day = len(shares)
    _rebuild_meal_slots(db, user, target, custom_shares=shares)
    db.commit()
    db.refresh(user)
    return user.meal_slots
