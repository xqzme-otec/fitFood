from __future__ import annotations

from pydantic import BaseModel, Field


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    unit: str
    calories: float
    protein: float
    fat: float
    carbs: float

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    category: str = "Прочее"
    unit: str = "g"
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    fat: float = Field(ge=0)
    carbs: float = Field(ge=0)


class IngredientOut(BaseModel):
    product_id: int
    name: str
    grams: float


class DishOut(BaseModel):
    id: int
    name: str
    description: str
    category: str
    total_grams: float
    per_100g: dict[str, float]
    ingredients: list[IngredientOut]

    model_config = {"from_attributes": True}


class IngredientIn(BaseModel):
    product_id: int
    grams: float = Field(gt=0)


class DishCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "Готовая еда"
    ingredients: list[IngredientIn] = Field(min_length=1)
