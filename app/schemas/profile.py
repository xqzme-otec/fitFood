from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models.enums import ActivityLevel, Goal, Sex


class ProfileCreate(BaseModel):
    sex: Sex
    height_cm: float = Field(gt=50, lt=260)
    weight_kg: float = Field(gt=20, lt=400)
    age: int = Field(gt=5, lt=120)
    activity_level: ActivityLevel
    goal: Goal
    target_weight_kg: float | None = Field(default=None, gt=20, lt=400)
    target_days: int | None = Field(default=None, gt=0, lt=2000)
    meals_per_day: int = Field(default=3, ge=1, le=6)

    @model_validator(mode="after")
    def check_goal_fields(self) -> "ProfileCreate":
        if self.goal in (Goal.gain, Goal.lose):
            if self.target_weight_kg is None or self.target_days is None:
                raise ValueError(
                    "Для цели 'набор'/'похудение' нужны target_weight_kg и target_days"
                )
        return self


class ProfileOut(BaseModel):
    sex: Sex
    height_cm: float
    weight_kg: float
    age: int
    activity_level: ActivityLevel
    goal: Goal
    target_weight_kg: float | None
    target_days: int | None
    meals_per_day: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class WeightUpdate(BaseModel):
    weight_kg: float = Field(gt=20, lt=400)


class CalorieOverride(BaseModel):
    calories: float = Field(ge=1000, le=8000)


class MacroOverride(BaseModel):
    """Ручная установка БЖУ в граммах. Калории опциональны (иначе считаются)."""
    protein_g: float = Field(ge=0, le=600)
    fat_g: float = Field(ge=0, le=400)
    carb_g: float = Field(ge=0, le=1200)
    calories: float | None = Field(default=None, ge=1000, le=8000)


class WeightRecordOut(BaseModel):
    weight_kg: float
    recorded_at: datetime

    model_config = {"from_attributes": True}


class NutritionTargetOut(BaseModel):
    bmr: float
    tdee: float
    calories: float
    protein_g: float
    fat_g: float
    carb_g: float
    is_manual: bool

    model_config = {"from_attributes": True}


class MealSlotOut(BaseModel):
    id: int
    name: str
    order: int
    calorie_share: float
    calorie_limit: float
    protein_limit: float
    fat_limit: float
    carb_limit: float

    model_config = {"from_attributes": True}


class MealShareIn(BaseModel):
    """Один приём пищи при ручной настройке распределения."""
    name: str
    share: float = Field(gt=0, le=1)


class MealPlanUpdate(BaseModel):
    """Ручная настройка распределения калорий по приёмам. Сумма долей = 1.0."""
    meals: list[MealShareIn]

    @model_validator(mode="after")
    def check_sum(self) -> "MealPlanUpdate":
        total = sum(m.share for m in self.meals)
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Сумма долей должна быть 1.0, получено {total:.2f}")
        return self
