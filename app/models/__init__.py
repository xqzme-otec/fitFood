"""Импорт всех моделей, чтобы Base.metadata знал о таблицах."""
from app.models.enums import (
    ActivityLevel,
    FridgeCategory,
    Goal,
    ReceiptStatus,
    Sex,
)
from app.models.fridge import (
    FridgeItem,
    Receipt,
    ReceiptItem,
    RecommendationLog,
)
from app.models.meal import FoodEntry
from app.models.product import Dish, DishIngredient, Product
from app.models.user import (
    MealSlot,
    NutritionTarget,
    Profile,
    User,
    WeightRecord,
)

__all__ = [
    "ActivityLevel", "FridgeCategory", "Goal", "ReceiptStatus", "Sex",
    "User", "Profile", "WeightRecord", "NutritionTarget", "MealSlot",
    "Product", "Dish", "DishIngredient", "FoodEntry",
    "FridgeItem", "Receipt", "ReceiptItem", "RecommendationLog",
]
