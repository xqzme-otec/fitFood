"""Записи съеденной еды (дневник питания)."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FoodEntry(Base):
    """Одна запись в дневнике: продукт ИЛИ блюдо, съеденное в конкретный приём.

    КБЖУ сохраняется снимком (snapshot) на момент записи — чтобы изменение
    каталога не меняло историю питания.
    """
    __tablename__ = "food_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    meal_slot_id: Mapped[int] = mapped_column(ForeignKey("meal_slots.id"))
    entry_date: Mapped[date] = mapped_column(Date, index=True, default=date.today)

    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    dish_id: Mapped[int | None] = mapped_column(ForeignKey("dishes.id"), nullable=True)

    name: Mapped[str] = mapped_column(String(300))  # денормализованное имя для истории
    amount: Mapped[float] = mapped_column(Float)     # съедено, г/мл

    # Снимок КБЖУ за съеденную порцию (не на 100 г!).
    calories: Mapped[float] = mapped_column(Float)
    protein: Mapped[float] = mapped_column(Float)
    fat: Mapped[float] = mapped_column(Float)
    carbs: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    meal_slot = relationship("MealSlot")
    product = relationship("Product")
    dish = relationship("Dish")
