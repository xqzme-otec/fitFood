"""Тесты дневника питания: запись съеденного и сводка дня."""
import pytest


def _product_id(client, query):
    r = client.get("/products", params={"q": query})
    assert r.status_code == 200 and r.json(), r.text
    return r.json()[0]["id"]


def test_add_product_entry_scales_macros(client, profiled_headers, meal_slot_id):
    pid = _product_id(client, "Куриное")
    prod = client.get(f"/products/{pid}").json()
    r = client.post("/diary/entries", headers=profiled_headers,
                    json={"meal_slot_id": meal_slot_id, "product_id": pid, "amount": 200})
    assert r.status_code == 201, r.text
    entry = r.json()
    # 200 г = двойная порция от значений на 100 г.
    assert entry["calories"] == pytest.approx(prod["calories"] * 2, abs=0.5)


def test_add_dish_entry(client, auth_headers, profiled_headers, meal_slot_id):
    dish = client.post("/dishes", headers=auth_headers, json={
        "name": "Блюдо для дневника",
        "ingredients": [{"product_id": _product_id(client, "Рис"), "grams": 200}],
    }).json()
    r = client.post("/diary/entries", headers=profiled_headers,
                    json={"meal_slot_id": meal_slot_id, "dish_id": dish["id"], "amount": 150})
    assert r.status_code == 201, r.text
    assert r.json()["calories"] > 0


def test_entry_bad_slot_404(client, profiled_headers):
    pid = _product_id(client, "Рис")
    r = client.post("/diary/entries", headers=profiled_headers,
                    json={"meal_slot_id": 999999, "product_id": pid, "amount": 100})
    assert r.status_code == 404


def test_entry_requires_exactly_one_target(client, profiled_headers, meal_slot_id):
    # Ни product_id, ни dish_id — ошибка валидации.
    r = client.post("/diary/entries", headers=profiled_headers,
                    json={"meal_slot_id": meal_slot_id, "amount": 100})
    assert r.status_code == 422


def test_day_summary_accumulates(client, profiled_headers, meal_slot_id):
    pid = _product_id(client, "Куриное")
    client.post("/diary/entries", headers=profiled_headers,
                json={"meal_slot_id": meal_slot_id, "product_id": pid, "amount": 100})
    r = client.get("/diary/summary", headers=profiled_headers)
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["consumed"]["calories"] > 0
    # остаток = цель - съедено
    assert s["remaining"]["calories"] == pytest.approx(
        s["target"]["calories"] - s["consumed"]["calories"], abs=0.5
    )


def test_delete_entry(client, profiled_headers, meal_slot_id):
    pid = _product_id(client, "Рис")
    entry = client.post("/diary/entries", headers=profiled_headers,
                        json={"meal_slot_id": meal_slot_id, "product_id": pid, "amount": 100}).json()
    assert client.delete(f"/diary/entries/{entry['id']}", headers=profiled_headers).status_code == 204
