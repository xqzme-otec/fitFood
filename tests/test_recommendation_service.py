"""Unit tests for the recommendation scoring helpers.

These cover the pure scoring/matching logic in app/services/recommendation.py
that the API-level tests only exercise indirectly. They use lightweight fakes
instead of the database so the maths is tested in isolation.
"""
from dataclasses import dataclass

from app.services import recommendation as rec
from app.services.recommendation import Remaining


@dataclass
class FakeDish:
    """Minimal stand-in for app.models.Dish (only what the helpers touch)."""
    per100: dict
    total_grams: float = 300.0

    def per_100g(self) -> dict:
        return self.per100


@dataclass
class FakeFridgeItem:
    name: str
    category: str


# --- token matching -------------------------------------------------------

def test_tokens_drops_short_and_stop_words():
    tokens = rec._tokens("Куриное филе свежее")
    assert "куриное" in tokens
    assert "филе" in tokens
    # one- and two-letter tokens are dropped
    assert all(len(t) > 2 for t in tokens)


def test_ingredient_available_matches_on_shared_token():
    fridge = rec._build_fridge_index([FakeFridgeItem("Куриное филе", "Мясо")])
    assert rec._ingredient_available("филе куриное охлаждённое", fridge) is True
    assert rec._ingredient_available("Гречка", fridge) is False


# --- dominant macro need --------------------------------------------------

def test_dominant_need_picks_largest_positive_macro():
    rem = Remaining(calories=500, protein=40, fat=5, carbs=10)
    assert rec._dominant_need(rem) == "protein"


def test_dominant_need_falls_back_to_calories_when_all_macros_met():
    rem = Remaining(calories=500, protein=-1, fat=-2, carbs=-3)
    assert rec._dominant_need(rem) == "calories"


# --- portion sizing -------------------------------------------------------

def test_suggested_grams_fits_remaining_calories():
    # 100 kcal / 100 g, 600 kcal remaining -> ~600 g, capped at total_grams (500).
    dish = FakeDish(per100={"calories": 100, "protein": 10, "fat": 5, "carbs": 5}, total_grams=500)
    rem = Remaining(calories=600, protein=20, fat=10, carbs=50)
    assert rec._suggested_grams(dish, rem) == 500.0


def test_suggested_grams_symbolic_when_budget_exhausted():
    dish = FakeDish(per100={"calories": 200, "protein": 10, "fat": 5, "carbs": 5})
    rem = Remaining(calories=0, protein=0, fat=0, carbs=0)
    assert rec._suggested_grams(dish, rem) == 150.0


# --- dish scoring ---------------------------------------------------------

def test_score_rewards_protein_density_when_protein_is_needed():
    rem = Remaining(calories=600, protein=40, fat=5, carbs=10)
    high_protein = FakeDish(per100={"calories": 120, "protein": 20, "fat": 3, "carbs": 4})
    low_protein = FakeDish(per100={"calories": 120, "protein": 2, "fat": 3, "carbs": 22})
    score_high = rec._score_dish(high_protein, rem, coverage=1.0, dominant="protein")
    score_low = rec._score_dish(low_protein, rem, coverage=1.0, dominant="protein")
    assert score_high > score_low


def test_score_applies_overshoot_penalty():
    rem = Remaining(calories=100, protein=40, fat=5, carbs=10)
    # 300 kcal/100g vastly exceeds the 100 kcal remaining * 1.5 -> penalty.
    dish = FakeDish(per100={"calories": 300, "protein": 20, "fat": 3, "carbs": 4})
    with_penalty = rec._score_dish(dish, rem, coverage=1.0, dominant="protein")
    rem_loose = Remaining(calories=1000, protein=40, fat=5, carbs=10)
    without_penalty = rec._score_dish(dish, rem_loose, coverage=1.0, dominant="protein")
    assert without_penalty - with_penalty == 1.0


# --- fallback combos ------------------------------------------------------

def test_fallback_pairs_protein_with_veg_or_fruit():
    items = [FakeFridgeItem("Творог 9%", "Молочка"), FakeFridgeItem("Черника", "Фрукты")]
    combos = rec._fallback_combos(items, Remaining(500, 30, 10, 50))
    assert combos and combos[0]["kind"] == "combo"
    assert "Творог 9%" in combos[0]["name"] and "Черника" in combos[0]["name"]


def test_fallback_empty_fridge_returns_nothing():
    assert rec._fallback_combos([], Remaining(500, 30, 10, 50)) == []
