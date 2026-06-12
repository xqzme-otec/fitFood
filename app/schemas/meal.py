from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, model_validator


class FoodEntryCreate(BaseModel):
    meal_slot_id: int
    amount: float = Field(gt=0, description="Съедено, г или мл")
    product_id: int | None = None
    dish_id: int | None = None
    entry_date: date | None = None

    @model_validator(mode="after")
    def one_of(self) -> "FoodEntryCreate":
        if bool(self.product_id) == bool(self.dish_id):
            raise ValueError("Укажите ровно одно: product_id ИЛИ dish_id")
        return self


class FoodEntryOut(BaseModel):
    id: int
    meal_slot_id: int
    entry_date: date
    name: str
    amount: float
    calories: float
    protein: float
    fat: float
    carbs: float

    model_config = {"from_attributes": True}


class MacroSummary(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float


class MealSlotSummary(BaseModel):
    meal_slot_id: int
    name: str
    limit: MacroSummary
    consumed: MacroSummary
    remaining: MacroSummary
    entries: list[FoodEntryOut]


class DaySummary(BaseModel):
    date: date
    target: MacroSummary
    consumed: MacroSummary
    remaining: MacroSummary
    meals: list[MealSlotSummary]
