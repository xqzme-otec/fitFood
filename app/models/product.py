"""Каталог продуктов и блюд."""
from __future__ import annotations

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    """Продукт каталога. КБЖУ указывается на 100 г/мл."""
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    unit: Mapped[str] = mapped_column(String(10), default="g")  # g | ml

    calories: Mapped[float] = mapped_column(Float)  # на 100 г
    protein: Mapped[float] = mapped_column(Float)
    fat: Mapped[float] = mapped_column(Float)
    carbs: Mapped[float] = mapped_column(Float)

    dish_links: Mapped[list[DishIngredient]] = relationship(back_populates="product")


class Dish(Base):
    """Блюдо — состоит из продуктов с указанием веса."""
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    description: Mapped[str] = mapped_column(String(1000), default="")
    category: Mapped[str] = mapped_column(String(100), default="Готовая еда")

    ingredients: Mapped[list[DishIngredient]] = relationship(
        back_populates="dish", cascade="all, delete-orphan"
    )

    # --- Вычисляемое КБЖУ всего блюда (сумма по ингредиентам) ---
    def _totals(self) -> dict[str, float]:
        t = {"calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0, "grams": 0.0}
        for ing in self.ingredients:
            p = ing.product
            factor = ing.grams / 100.0
            t["calories"] += p.calories * factor
            t["protein"] += p.protein * factor
            t["fat"] += p.fat * factor
            t["carbs"] += p.carbs * factor
            t["grams"] += ing.grams
        return t

    @property
    def total_grams(self) -> float:
        return round(self._totals()["grams"], 1)

    def per_100g(self) -> dict[str, float]:
        """КБЖУ на 100 г готового блюда — чтобы считать съеденную порцию."""
        t = self._totals()
        g = t["grams"] or 1.0
        return {
            "calories": round(t["calories"] / g * 100, 1),
            "protein": round(t["protein"] / g * 100, 1),
            "fat": round(t["fat"] / g * 100, 1),
            "carbs": round(t["carbs"] / g * 100, 1),
        }


class DishIngredient(Base):
    __tablename__ = "dish_ingredients"
    __table_args__ = (UniqueConstraint("dish_id", "product_id", name="uq_dish_product"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    grams: Mapped[float] = mapped_column(Float)

    dish: Mapped[Dish] = relationship(back_populates="ingredients")
    product: Mapped[Product] = relationship(back_populates="dish_links")
