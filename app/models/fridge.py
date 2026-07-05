"""Умный холодильник, чеки и распознанные позиции чека, лог рекомендаций."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ReceiptStatus


class FridgeItem(Base):
    """Продукт в холодильнике пользователя."""
    __tablename__ = "fridge_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)

    name: Mapped[str] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(100), index=True)  # FridgeCategory.value
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(10), default="g")  # g | ml | pcs
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Оценка КБЖУ на 100 г для продуктов БЕЗ привязки к каталогу (product_id is None):
    # заполняется при добавлении через llm.estimate_macros. Если продукт каталога
    # известен — эти поля не используются (КБЖУ берётся из Product).
    calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs: Mapped[float | None] = mapped_column(Float, nullable=True)

    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    product = relationship("Product")


class Receipt(Base):
    """Загруженный чек (фото/текст) и результат его разбора."""
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    raw_text: Mapped[str] = mapped_column(Text, default="")
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[ReceiptStatus] = mapped_column(
        Enum(ReceiptStatus), default=ReceiptStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list[ReceiptItem]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )


class ReceiptItem(Base):
    """Одна распознанная позиция чека, ожидающая подтверждения."""
    __tablename__ = "receipt_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id"))

    raw_name: Mapped[str] = mapped_column(String(300))            # как в чеке
    parsed_name: Mapped[str] = mapped_column(String(300))         # очищенное имя
    category: Mapped[str] = mapped_column(String(100), default="Прочее")
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit: Mapped[str] = mapped_column(String(10), default="pcs")
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    is_food: Mapped[bool] = mapped_column(Boolean, default=True)   # пройдёт ли фильтр
    accepted: Mapped[bool] = mapped_column(Boolean, default=True)  # подтвердил ли юзер

    receipt: Mapped[Receipt] = relationship(back_populates="items")


class RecommendationLog(Base):
    """История выданных рекомендаций рецептов (для аналитики/повтора)."""
    __tablename__ = "recommendation_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    meal_slot_id: Mapped[int | None] = mapped_column(ForeignKey("meal_slots.id"), nullable=True)
    dish_id: Mapped[int | None] = mapped_column(ForeignKey("dishes.id"), nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
