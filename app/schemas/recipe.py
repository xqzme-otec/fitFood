"""Схемы каталога рецептов."""
from __future__ import annotations

from pydantic import BaseModel


class MenuOut(BaseModel):
    key: str        # завтрак / обед / ...
    label: str      # Завтрак / Обед / ...
    count: int


class RecipeCard(BaseModel):
    """Краткая карточка для списка/сетки."""
    id: int
    menu: str
    name: str
    photo_url: str
    calories: float
    protein: float
    fat: float
    carbs: float
    category: str
    cuisine: str
    cook_time_min: int | None
    servings: int | None
    # Сколько ингредиентов рецепта есть в холодильнике (для сортировки/бейджа).
    match_count: int = 0
    total_ingredients: int = 0


class RecipeIngredient(BaseModel):
    text: str          # строка ингредиента как в рецепте
    available: bool     # есть ли в холодильнике


class RecipeDetail(RecipeCard):
    source_url: str
    prep_time_min: int | None
    method_text: str
    ingredients: list[RecipeIngredient]


class RecipeListOut(BaseModel):
    total: int
    items: list[RecipeCard]
