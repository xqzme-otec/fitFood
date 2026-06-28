"""QRT-3 — Recommendation determinism & validity.

Quality requirement: for an unchanged user state (same fridge, same diary, same
meal), the recipe recommender must return identical, identically-ordered results
on repeated calls (no hidden randomness), and every recommended *dish* must have
all of its key ingredients (>= KEY_INGREDIENT_GRAMS) available in the fridge.

Evidence type: automated test executed in CI (the `qrt` marker selects it).
Covered code: app/services/recommendation.py.
"""
import pytest

from app.services.recommendation import KEY_INGREDIENT_GRAMS

pytestmark = pytest.mark.qrt


def _stock_fridge(client, headers):
    for name, qty in [
        ("Куриное филе", 500), ("Гречка", 400), ("Лук репчатый", 200),
        ("Морковь", 300), ("Творог 9%", 400), ("Ягоды черника", 150),
    ]:
        client.post("/fridge/items", headers=headers, json={"name": name, "quantity": qty})


def test_recommendations_are_deterministic(client, profiled_headers):
    """Identical state -> identical ordered recommendations across repeated calls."""
    _stock_fridge(client, profiled_headers)

    first = client.get("/recommendations", headers=profiled_headers)
    second = client.get("/recommendations", headers=profiled_headers)
    assert first.status_code == second.status_code == 200

    # Full structural equality, including ordering and scores.
    assert first.json() == second.json()


def test_recommended_dishes_have_all_key_ingredients(client, profiled_headers):
    """A recommended dish must never be missing a key ingredient.

    KEY_INGREDIENT_GRAMS is the threshold above which an ingredient is mandatory;
    the recommender marks a missing mandatory ingredient with note "ключевой".
    """
    _stock_fridge(client, profiled_headers)
    recs = client.get("/recommendations", headers=profiled_headers).json()

    dish_recs = [r for r in recs if r["kind"] == "dish"]
    assert dish_recs, "expected at least one dish recommendation for a stocked fridge"

    for rec in dish_recs:
        missing_key = [
            ing for ing in rec["ingredients"]
            if not ing["available"] and ing["grams_needed"] >= KEY_INGREDIENT_GRAMS
        ]
        assert not missing_key, (
            f"dish {rec['name']!r} recommended despite missing key ingredients: "
            f"{[i['name'] for i in missing_key]}"
        )
