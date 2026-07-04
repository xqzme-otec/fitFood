from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel


class IngredientAvailability(BaseModel):
    product_id: int | None = None
    name: str
    grams_needed: float
    available: bool
    note: str = ""
    # КБЖУ за указанную порцию (grams_needed). Для блюд каталога не заполняется
    # (0.0), для RAG-блюда — снимок, который клиент вернёт в /rations/eat.
    calories: float = 0.0
    protein: float = 0.0
    fat: float = 0.0
    carbs: float = 0.0


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
    source: str = "catalog"  # "catalog" (из каталога) | "llm" (RAG-блюдо)
    method: str = ""          # метод приготовления (для RAG-блюда)
    meal_slot_id: int
    day_remaining: DayRemaining


class RationEatIngredient(BaseModel):
    """Ингредиент RAG-блюда, который клиент возвращает при «Съел это».

    Если product_id указан и продукт существует — КБЖУ пересчитывается по каталогу
    (надёжнее). Иначе используется снимок calories/protein/fat/carbs за порцию.
    """
    product_id: int | None = None
    name: str
    grams: float
    calories: float = 0.0
    protein: float = 0.0
    fat: float = 0.0
    carbs: float = 0.0


class RationEatIn(BaseModel):
    """Запрос «Съел это»: все ингредиенты RAG-блюда пишутся в приём пищи."""
    meal_slot_id: int
    day: date_type | None = None
    name: str = ""
    ingredients: list[RationEatIngredient]
