from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class FridgeItemCreate(BaseModel):
    """Ручное добавление продукта в холодильник.

    Если expiry_date не указан — LLM предложит срок хранения.
    Если category не указана — определит ML-классификатор.
    """
    name: str
    quantity: float = Field(gt=0)
    unit: str = Field(default="g", pattern="^(g|ml|pcs)$")
    expiry_date: date | None = None
    category: str | None = None
    price: float | None = None
    product_id: int | None = None


class FridgeItemUpdate(BaseModel):
    quantity: float | None = Field(default=None, gt=0)
    expiry_date: date | None = None
    category: str | None = None  # ручное перемещение продукта в другую категорию


class FridgeItemOut(BaseModel):
    id: int
    product_id: int | None
    name: str
    emoji: str = "🍽️"
    category: str
    quantity: float
    unit: str
    expiry_date: date | None
    price: float | None
    expiry_status: str  # ok | soon | expired | unknown
    days_left: int | None
    kbju_100g: dict[str, float] | None  # КБЖУ на 100 г (если продукт известен)
    kbju_total: dict[str, float] | None  # КБЖУ на текущее количество

    model_config = {"from_attributes": True}


class FridgeCategoryGroup(BaseModel):
    category: str
    items: list[FridgeItemOut]
