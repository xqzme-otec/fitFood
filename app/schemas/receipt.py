from __future__ import annotations

from datetime import date

from pydantic import BaseModel, computed_field

from app.models.enums import ReceiptStatus
from app.services.emoji import emoji_for


class ReceiptItemOut(BaseModel):
    id: int
    raw_name: str
    parsed_name: str
    category: str
    quantity: float
    unit: str
    price: float | None
    expiry_date: date | None
    is_food: bool
    accepted: bool

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def emoji(self) -> str:
        return emoji_for(self.parsed_name, self.category)


class ReceiptOut(BaseModel):
    id: int
    status: ReceiptStatus
    raw_text: str
    items: list[ReceiptItemOut]

    model_config = {"from_attributes": True}


class ReceiptTextIn(BaseModel):
    """Альтернатива загрузке фото — вставка текста чека вручную."""
    text: str


class ReceiptItemConfirm(BaseModel):
    item_id: int
    accepted: bool
    # Пользователь может скорректировать перед добавлением:
    parsed_name: str | None = None
    category: str | None = None
    quantity: float | None = None
    expiry_date: date | None = None


class ReceiptConfirm(BaseModel):
    items: list[ReceiptItemConfirm]
