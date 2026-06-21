"""Каталог рецептов из food.ru (импорт из data/*.csv).

В отличие от Dish (блюдо, собранное из продуктов каталога) Recipe — это готовый
рецепт с собственным КБЖУ на 100 г, фото, текстовыми ингредиентами и методом
приготовления. Используется в разделе «Рецепты» для просмотра по меню
(завтрак/обед/ужин/здоровая еда/десерты/закуски) и фильтрации.
"""
from __future__ import annotations

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Меню (категория_запроса): breakfast/lunch/dinner/healthy/dessert/snack.
    menu: Mapped[str] = mapped_column(String(40), index=True)
    name: Mapped[str] = mapped_column(String(400), index=True)
    photo_url: Mapped[str] = mapped_column(String(800), default="")
    source_url: Mapped[str] = mapped_column(String(800), default="")

    # КБЖУ на 100 г готового блюда.
    calories: Mapped[float] = mapped_column(Float, index=True)
    protein: Mapped[float] = mapped_column(Float)
    fat: Mapped[float] = mapped_column(Float)
    carbs: Mapped[float] = mapped_column(Float)

    ingredients_text: Mapped[str] = mapped_column(Text, default="")
    # Нормализованные токены названий ингредиентов (через пробел) — для матчинга
    # с холодильником без повторного парсинга на каждый запрос.
    ingredient_keys: Mapped[str] = mapped_column(Text, default="", index=False)
    method_text: Mapped[str] = mapped_column(Text, default="")

    category: Mapped[str] = mapped_column(String(120), default="")  # категория (борщ, салат…)
    cuisine: Mapped[str] = mapped_column(String(120), default="")

    cook_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    prep_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
