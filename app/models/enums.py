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
    """Категории умного холодильника (укрупнённые, для группировки в UI).

    Порядок объявления задаёт порядок групп в интерфейсе.
    """
    meat_fish = "Мясо и рыба"
    ready_made = "Готовая еда"
    dairy = "Молочка"
    grocery = "Бакалея"
    sweets = "Сладости"
    snacks = "Снеки"
    veg_fruit = "Овощи и фрукты"
    tea_coffee = "Чай, кофе, какао"
    drinks = "Напитки"
    other = "Прочее"


class ReceiptStatus(str, enum.Enum):
    pending = "pending"      # распознан, ждёт подтверждения пользователя
    confirmed = "confirmed"  # пользователь подтвердил, продукты добавлены
    cancelled = "cancelled"
