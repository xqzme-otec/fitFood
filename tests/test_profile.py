"""Тесты анкеты и расчёта норм КБЖУ через API."""
import pytest

from app.services import nutrition
from app.models.enums import ActivityLevel, Goal
from tests.conftest import DEFAULT_PROFILE, register_and_login


def test_create_profile_and_targets_match_formula(client, auth_headers):
    r = client.post("/profile", headers=auth_headers, json=DEFAULT_PROFILE)
    assert r.status_code in (200, 201), r.text

    r = client.get("/profile/targets", headers=auth_headers)
    assert r.status_code == 200, r.text
    t = r.json()

    expected = nutrition.calc_targets(
        sex="male", weight_kg=85, height_cm=180, age=30,
        activity=ActivityLevel.medium, goal=Goal.lose,
        target_weight_kg=78, target_days=90,
    )
    assert t["bmr"] == pytest.approx(expected.bmr, abs=0.5)
    assert t["calories"] == pytest.approx(expected.calories, abs=0.5)
    assert t["protein_g"] == pytest.approx(expected.protein_g, abs=0.5)


def test_targets_require_profile(client, auth_headers):
    # Без анкеты targets отдают 409 (require_profile).
    r = client.get("/profile/targets", headers=auth_headers)
    assert r.status_code == 409


def test_lose_goal_needs_target_fields(client, auth_headers):
    bad = {**DEFAULT_PROFILE}
    bad.pop("target_weight_kg")
    bad.pop("target_days")
    r = client.post("/profile", headers=auth_headers, json=bad)
    assert r.status_code == 422


def test_weight_change_recalculates_targets(client, profiled_headers):
    before = client.get("/profile/targets", headers=profiled_headers).json()
    r = client.put("/profile/weight", headers=profiled_headers, json={"weight_kg": 75})
    assert r.status_code == 200, r.text
    after = r.json()
    # Белок считается на кг массы — должен снизиться вместе с весом.
    assert after["protein_g"] < before["protein_g"]
    assert after["is_manual"] is False


def test_manual_calories_rescales_macros_proportionally(client, profiled_headers):
    before = client.get("/profile/targets", headers=profiled_headers).json()
    r = client.put("/profile/calories", headers=profiled_headers, json={"calories": 2000})
    assert r.status_code == 200, r.text
    after = r.json()
    assert after["calories"] == pytest.approx(2000, abs=0.5)
    assert after["is_manual"] is True
    # Соотношение БЖУ сохраняется: доли до и после совпадают.
    ratio_before = before["protein_g"] * 4 / before["calories"]
    ratio_after = after["protein_g"] * 4 / after["calories"]
    assert ratio_after == pytest.approx(ratio_before, abs=0.01)


def test_manual_macros_override(client, profiled_headers):
    r = client.put("/profile/macros", headers=profiled_headers,
                   json={"protein_g": 150, "fat_g": 70, "carb_g": 200})
    assert r.status_code == 200, r.text
    after = r.json()
    assert after["protein_g"] == pytest.approx(150, abs=0.5)
    assert after["fat_g"] == pytest.approx(70, abs=0.5)
    assert after["is_manual"] is True


def test_meal_slots_sum_to_calories(client, profiled_headers):
    targets = client.get("/profile/targets", headers=profiled_headers).json()
    r = client.get("/profile/meals", headers=profiled_headers)
    assert r.status_code == 200, r.text
    slots = r.json()
    assert len(slots) == 3
    total_limit = sum(s["calorie_limit"] for s in slots)
    assert total_limit == pytest.approx(targets["calories"], abs=2.0)


def test_weight_history_records(client, profiled_headers):
    client.put("/profile/weight", headers=profiled_headers, json={"weight_kg": 84})
    client.put("/profile/weight", headers=profiled_headers, json={"weight_kg": 83})
    r = client.get("/profile/weight/history", headers=profiled_headers)
    assert r.status_code == 200, r.text
    assert len(r.json()) >= 2
