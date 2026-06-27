from __future__ import annotations

from pydantic import BaseModel


class IngredientAvailability(BaseModel):
    product_id: int
    name: str
    grams_needed: float
    available: bool
    note: str = ""


class RecommendationOut(BaseModel):
    dish_id: int | None
    name: str
    kind: str  # "dish" | "combo"
    score: float
    reason: str
    calories: float
    protein: float
    fat: float
    carbs: float
    suggested_grams: float
    missing_ingredients: list[str]
    ingredients: list[IngredientAvailability]


class DayRemaining(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float


class RationNextOut(RecommendationOut):
    """Следующий кандидат для свайпа рациона."""
    source: str = "catalog"  # "catalog" (из каталога) | "llm" (придумано моделью)
    meal_slot_id: int
    day_remaining: DayRemaining
