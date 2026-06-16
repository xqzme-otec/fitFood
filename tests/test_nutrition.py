"""Юнит-тесты расчёта КБЖУ (app/services/nutrition.py)."""
import pytest

from app.models.enums import ActivityLevel, Goal
from app.services import nutrition


def test_bmr_male_mifflin():
    # 10*85 + 6.25*180 - 5*30 + 5 = 850 + 1125 - 150 + 5 = 1830
    assert nutrition.calc_bmr("male", 85, 180, 30) == pytest.approx(1830.0)


def test_bmr_female_mifflin():
    # 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    assert nutrition.calc_bmr("female", 60, 165, 30) == pytest.approx(1320.25)


def test_tdee_applies_activity_factor():
    bmr = 1800.0
    assert nutrition.calc_tdee(bmr, ActivityLevel.medium) == pytest.approx(1800.0 * 1.55)
    assert nutrition.calc_tdee(bmr, ActivityLevel.minimal) == pytest.approx(1800.0 * 1.2)


def test_targets_maintain_equals_tdee():
    t = nutrition.calc_targets(
        sex="male", weight_kg=80, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.maintain,
    )
    assert t.calories == pytest.approx(t.tdee, abs=0.1)
    # белок для поддержания — 1.6 г/кг
    assert t.protein_g == pytest.approx(1.6 * 80, abs=0.1)


def test_targets_lose_creates_deficit():
    t = nutrition.calc_targets(
        sex="male", weight_kg=85, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.lose,
        target_weight_kg=78, target_days=90,
    )
    assert t.calories < t.tdee  # дефицит
    assert t.protein_g == pytest.approx(1.8 * 85, abs=0.1)


def test_targets_gain_creates_surplus():
    t = nutrition.calc_targets(
        sex="male", weight_kg=70, height_cm=178, age=25,
        activity=ActivityLevel.high, goal=Goal.gain,
        target_weight_kg=78, target_days=120,
    )
    assert t.calories > t.tdee  # профицит
    assert t.protein_g == pytest.approx(2.0 * 70, abs=0.1)


def test_targets_never_below_floor():
    # Экстремальный дефицит должен упереться в минимум 1200 ккал.
    t = nutrition.calc_targets(
        sex="female", weight_kg=50, height_cm=155, age=60,
        activity=ActivityLevel.minimal, goal=Goal.lose,
        target_weight_kg=45, target_days=10,
    )
    assert t.calories >= 1200.0


def test_targets_ratios_sum_to_one():
    t = nutrition.calc_targets(
        sex="male", weight_kg=80, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.maintain,
    )
    assert t.protein_ratio + t.fat_ratio + t.carb_ratio == pytest.approx(1.0, abs=0.001)


def test_rescale_preserves_ratios():
    # При новом лимите калорий БЖУ масштабируются с сохранением долей.
    p, f, c = nutrition.rescale_for_calories(2000, 0.3, 0.25, 0.45)
    assert p == pytest.approx(2000 * 0.3 / 4, abs=0.1)
    assert f == pytest.approx(2000 * 0.25 / 9, abs=0.1)
    assert c == pytest.approx(2000 * 0.45 / 4, abs=0.1)


@pytest.mark.parametrize("n", [1, 2, 3, 4, 5, 7])
def test_meal_shares_sum_to_one(n):
    shares = nutrition.default_meal_shares(n)
    assert len(shares) == n
    assert sum(s for _, s in shares) == pytest.approx(1.0, abs=0.001)
