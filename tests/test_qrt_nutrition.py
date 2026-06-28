"""QRT-1 — Nutrition correctness.

Quality requirement: the daily KБЖУ engine must compute BMR with the
Mifflin–St Jeor formula and must preserve the protein/fat/carb energy ratios
when the user manually changes their daily calorie limit.

Evidence type: automated test executed in CI (the `qrt` marker selects it).
Covered code: app/services/nutrition.py.
"""
import pytest

from app.models.enums import ActivityLevel, Goal
from app.services import nutrition

pytestmark = pytest.mark.qrt

# Tolerances stated in docs/quality-requirement-tests.md.
BMR_ABS_TOL = 0.1          # kcal
RATIO_ABS_TOL = 0.005      # 0.5 percentage points


def test_bmr_matches_mifflin_st_jeor_reference():
    """BMR equals the Mifflin–St Jeor reference values for both sexes."""
    # Male: 10*85 + 6.25*180 - 5*30 + 5 = 1830.0
    assert nutrition.calc_bmr("male", 85, 180, 30) == pytest.approx(1830.0, abs=BMR_ABS_TOL)
    # Female: 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
    assert nutrition.calc_bmr("female", 60, 165, 30) == pytest.approx(1320.25, abs=BMR_ABS_TOL)


def test_macro_ratios_sum_to_one():
    """Protein/fat/carb energy ratios from calc_targets sum to 1.0."""
    t = nutrition.calc_targets(
        sex="male", weight_kg=85, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.lose,
        target_weight_kg=78, target_days=90,
    )
    assert t.protein_ratio + t.fat_ratio + t.carb_ratio == pytest.approx(1.0, abs=RATIO_ABS_TOL)


def test_manual_calorie_change_preserves_macro_ratios():
    """Manually changing the calorie limit keeps the BЖУ energy ratios stable.

    This is the core guarantee from CLAUDE.md §1: rescaling the daily limit must
    keep the protein/fat/carb proportions from the user's goal.
    """
    t = nutrition.calc_targets(
        sex="male", weight_kg=85, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.lose,
        target_weight_kg=78, target_days=90,
    )

    new_calories = 2000.0
    protein_g, fat_g, carb_g = nutrition.rescale_for_calories(
        new_calories, t.protein_ratio, t.fat_ratio, t.carb_ratio
    )

    # Recompute ratios from the rescaled grams and compare to the originals.
    new_protein_ratio = protein_g * nutrition.KCAL_PROTEIN / new_calories
    new_fat_ratio = fat_g * nutrition.KCAL_FAT / new_calories
    new_carb_ratio = carb_g * nutrition.KCAL_CARB / new_calories

    assert new_protein_ratio == pytest.approx(t.protein_ratio, abs=RATIO_ABS_TOL)
    assert new_fat_ratio == pytest.approx(t.fat_ratio, abs=RATIO_ABS_TOL)
    assert new_carb_ratio == pytest.approx(t.carb_ratio, abs=RATIO_ABS_TOL)
