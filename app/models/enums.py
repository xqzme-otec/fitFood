"""Перечисления, используемые в моделях и схемах."""
import enum


class Sex(str, enum.Enum):
    male = "male"
    female = "female"


class ActivityLevel(str, enum.Enum):
    """Средняя дневная активность -> коэффициент к BMR."""
    minimal = "minimal"      # минимальная (сидячий образ жизни)
    low = "low"              # низкая
    medium = "medium"        # средняя
    high = "high"            # высокая
    very_high = "very_high"  # очень высокая


class Goal(str, enum.Enum):
    gain = "gain"          # набор массы
    maintain = "maintain"  # поддержание
    lose = "lose"          # похудение


class FridgeCategory(str, enum.Enum):
    """Категории умного холодильника (укрупнённые, для группировки в UI)."""
    cereals = "Крупы"
    vegetables = "Овощи"
    fruits = "Фрукты"
    meat = "Мясо"
    fish = "Рыба"
    dairy = "Молочка"
    sauces = "Соусы"
    other = "Прочее"


class ReceiptStatus(str, enum.Enum):
    pending = "pending"      # распознан, ждёт подтверждения пользователя
    confirmed = "confirmed"  # пользователь подтвердил, продукты добавлены
    cancelled = "cancelled"
