"""Integration tests for manual macro overrides and meal-slot rebuilding.

Exercises app/services/targets.py through the profile API: setting macros in
grams must derive the implied calorie total and keep the per-meal slot limits
summing to that total.
"""
import pytest

from app.services.nutrition import KCAL_CARB, KCAL_FAT, KCAL_PROTEIN


def test_manual_macros_derive_implied_calories(client, profiled_headers):
    protein_g, fat_g, carb_g = 150, 70, 200
    r = client.put("/profile/macros", headers=profiled_headers,
                   json={"protein_g": protein_g, "fat_g": fat_g, "carb_g": carb_g})
    assert r.status_code == 200, r.text
    after = r.json()

    expected_calories = (
        protein_g * KCAL_PROTEIN + fat_g * KCAL_FAT + carb_g * KCAL_CARB
    )
    assert after["calories"] == pytest.approx(expected_calories, abs=1.0)
    assert after["is_manual"] is True


def test_meal_slots_resum_after_manual_macros(client, profiled_headers):
    client.put("/profile/macros", headers=profiled_headers,
               json={"protein_g": 150, "fat_g": 70, "carb_g": 200})
    targets = client.get("/profile/targets", headers=profiled_headers).json()

    slots = client.get("/profile/meals", headers=profiled_headers).json()
    total = sum(s["calorie_limit"] for s in slots)
    assert total == pytest.approx(targets["calories"], abs=2.0)
