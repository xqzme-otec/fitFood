"""Алгоритм расчёта КБЖУ.

Формула BMR — Миффлина-Сан Жеора:
  мужчины:  BMR = 10*вес + 6.25*рост - 5*возраст + 5
  женщины:  BMR = 10*вес + 6.25*рост - 5*возраст - 161

TDEE = BMR * коэффициент активности.
Итоговая норма калорий = TDEE + поправка на цель (дефицит/профицит).

Если для цели "набор"/"похудение" заданы целевой вес и срок (дней),
дефицит/профицит вычисляется так, чтобы достичь цели за срок
(1 кг жира ≈ 7700 ккал), но в безопасных пределах.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models.enums import ActivityLevel, Goal

# Коэффициенты активности к BMR.
ACTIVITY_FACTORS: dict[ActivityLevel, float] = {
    ActivityLevel.minimal: 1.2,
    ActivityLevel.low: 1.375,
    ActivityLevel.medium: 1.55,
    ActivityLevel.high: 1.725,
    ActivityLevel.very_high: 1.9,
}

# Белок (г на кг массы тела) в зависимости от цели.
PROTEIN_PER_KG: dict[Goal, float] = {
    Goal.gain: 2.0,
    Goal.maintain: 1.6,
    Goal.lose: 1.8,
}

# Жиры (г на кг массы тела) — нижняя здоровая граница.
FAT_PER_KG = 1.0

KCAL_PER_KG_FAT = 7700.0  # энергоёмкость 1 кг массы тела

# Безопасные пределы суточной поправки (доля от TDEE).
MAX_DEFICIT_FRACTION = 0.25
MAX_SURPLUS_FRACTION = 0.20
DEFAULT_DEFICIT_FRACTION = 0.15
DEFAULT_SURPLUS_FRACTION = 0.12

# Калорийность макронутриентов.
KCAL_PROTEIN = 4.0
KCAL_FAT = 9.0
KCAL_CARB = 4.0


@dataclass
class MacroTargets:
    bmr: float
    tdee: float
    calories: float
    protein_g: float
    fat_g: float
    carb_g: float
    protein_ratio: float
    fat_ratio: float
    carb_ratio: float


def calc_bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + 5 if sex == "male" else base - 161


def calc_tdee(bmr: float, activity: ActivityLevel) -> float:
    return bmr * ACTIVITY_FACTORS[activity]


def _goal_calories(
    tdee: float,
    goal: Goal,
    weight_kg: float,
    target_weight_kg: float | None,
    target_days: int | None,
) -> float:
    """Возвращает итоговую суточную норму калорий с учётом цели."""
    if goal == Goal.maintain:
        return tdee

    # Если заданы целевой вес и срок — считаем нужную суточную поправку.
    if target_weight_kg and target_days and target_days > 0:
        delta_kg = abs(weight_kg - target_weight_kg)
        daily_adjust = delta_kg * KCAL_PER_KG_FAT / target_days
    else:
        frac = DEFAULT_DEFICIT_FRACTION if goal == Goal.lose else DEFAULT_SURPLUS_FRACTION
        daily_adjust = tdee * frac

    if goal == Goal.lose:
        daily_adjust = min(daily_adjust, tdee * MAX_DEFICIT_FRACTION)
        return tdee - daily_adjust
    else:  # gain
        daily_adjust = min(daily_adjust, tdee * MAX_SURPLUS_FRACTION)
        return tdee + daily_adjust


def calc_targets(
    *,
    sex: str,
    weight_kg: float,
    height_cm: float,
    age: int,
    activity: ActivityLevel,
    goal: Goal,
    target_weight_kg: float | None = None,
    target_days: int | None = None,
) -> MacroTargets:
    """Полный расчёт суточной нормы КБЖУ по анкете."""
    bmr = calc_bmr(sex, weight_kg, height_cm, age)
    tdee = calc_tdee(bmr, activity)
    calories = _goal_calories(tdee, goal, weight_kg, target_weight_kg, target_days)
    calories = max(calories, 1200.0)  # не опускаемся ниже физиологического минимума

    protein_g = PROTEIN_PER_KG[goal] * weight_kg
    fat_g = FAT_PER_KG * weight_kg

    protein_kcal = protein_g * KCAL_PROTEIN
    fat_kcal = fat_g * KCAL_FAT
    carb_kcal = max(calories - protein_kcal - fat_kcal, 0.0)
    carb_g = carb_kcal / KCAL_CARB

    return MacroTargets(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        calories=round(calories, 1),
        protein_g=round(protein_g, 1),
        fat_g=round(fat_g, 1),
        carb_g=round(carb_g, 1),
        protein_ratio=round(protein_kcal / calories, 4),
        fat_ratio=round(fat_kcal / calories, 4),
        carb_ratio=round(carb_kcal / calories, 4),
    )


def rescale_for_calories(
    new_calories: float,
    protein_ratio: float,
    fat_ratio: float,
    carb_ratio: float,
) -> tuple[float, float, float]:
    """Пересчёт БЖУ под новый лимит калорий с сохранением соотношения.

    Используется, когда пользователь вручную меняет дневной лимит калорий.
    Возвращает (protein_g, fat_g, carb_g).
    """
    protein_g = new_calories * protein_ratio / KCAL_PROTEIN
    fat_g = new_calories * fat_ratio / KCAL_FAT
    carb_g = new_calories * carb_ratio / KCAL_CARB
    return round(protein_g, 1), round(fat_g, 1), round(carb_g, 1)


def default_meal_shares(meals_per_day: int) -> list[tuple[str, float]]:
    """Дефолтное распределение калорий по приёмам пищи (имя, доля)."""
    presets: dict[int, list[tuple[str, float]]] = {
        1: [("Приём 1", 1.0)],
        2: [("Завтрак", 0.45), ("Ужин", 0.55)],
        3: [("Завтрак", 0.30), ("Обед", 0.40), ("Ужин", 0.30)],
        4: [("Завтрак", 0.25), ("Обед", 0.35), ("Перекус", 0.15), ("Ужин", 0.25)],
        5: [("Завтрак", 0.25), ("Перекус", 0.10), ("Обед", 0.30),
            ("Перекус 2", 0.10), ("Ужин", 0.25)],
    }
    if meals_per_day in presets:
        return presets[meals_per_day]
    # Равномерное распределение для нестандартного числа приёмов.
    share = 1.0 / meals_per_day
    return [(f"Приём {i + 1}", share) for i in range(meals_per_day)]
