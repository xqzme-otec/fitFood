"""Пользователь, анкета (профиль), история веса, нормы КБЖУ и приёмы пищи."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ActivityLevel, Goal, Sex


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_profile_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    profile: Mapped[Profile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    nutrition_target: Mapped[NutritionTarget | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    weight_history: Mapped[list[WeightRecord]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    meal_slots: Mapped[list[MealSlot]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="MealSlot.order"
    )


class Profile(Base):
    """Анкета пользователя."""
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    sex: Mapped[Sex] = mapped_column(Enum(Sex))
    height_cm: Mapped[float] = mapped_column(Float)
    weight_kg: Mapped[float] = mapped_column(Float)
    age: Mapped[int] = mapped_column(Integer)
    activity_level: Mapped[ActivityLevel] = mapped_column(Enum(ActivityLevel))
    goal: Mapped[Goal] = mapped_column(Enum(Goal))

    # Заполняются только при цели "набор" или "похудение".
    target_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    meals_per_day: Mapped[int] = mapped_column(Integer, default=3)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="profile")


class WeightRecord(Base):
    """История изменения веса (для графиков и пересчёта норм)."""
    __tablename__ = "weight_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    weight_kg: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="weight_history")


class NutritionTarget(Base):
    """Текущая суточная норма КБЖУ пользователя.

    Хранит как абсолютные значения, так и доли (ratio) макронутриентов,
    чтобы при ручном изменении калорий пересчитать БЖУ пропорционально.
    """
    __tablename__ = "nutrition_targets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    bmr: Mapped[float] = mapped_column(Float)          # базовый обмен
    tdee: Mapped[float] = mapped_column(Float)         # суточный расход с активностью
    calories: Mapped[float] = mapped_column(Float)     # итоговая норма (с учётом цели)

    protein_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)
    carb_g: Mapped[float] = mapped_column(Float)

    # Доли калорий по макронутриентам (сумма ~= 1.0).
    protein_ratio: Mapped[float] = mapped_column(Float)
    fat_ratio: Mapped[float] = mapped_column(Float)
    carb_ratio: Mapped[float] = mapped_column(Float)

    is_manual: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="nutrition_target")


class MealSlot(Base):
    """Шаблон приёма пищи (завтрак/обед/ужин) с лимитами КБЖУ."""
    __tablename__ = "meal_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    name: Mapped[str] = mapped_column(String(100))
    order: Mapped[int] = mapped_column(Integer, default=0)
    calorie_share: Mapped[float] = mapped_column(Float)  # доля от суточной нормы (0..1)

    calorie_limit: Mapped[float] = mapped_column(Float)
    protein_limit: Mapped[float] = mapped_column(Float)
    fat_limit: Mapped[float] = mapped_column(Float)
    carb_limit: Mapped[float] = mapped_column(Float)

    user: Mapped[User] = relationship(back_populates="meal_slots")
