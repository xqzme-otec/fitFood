"""Тесты CRUD рецептов (блюд) — фича раздела «Мои рецепты»."""
import pytest


def _product_id(client, query):
    r = client.get("/products", params={"q": query})
    assert r.status_code == 200, r.text
    items = r.json()
    assert items, f"продукт по запросу '{query}' не найден"
    return items[0]["id"]


def _make_dish_payload(client, name="Тестовое блюдо"):
    chicken = _product_id(client, "Куриное")
    rice = _product_id(client, "Рис")
    return {
        "name": name,
        "description": "для теста",
        "ingredients": [
            {"product_id": chicken, "grams": 200},
            {"product_id": rice, "grams": 150},
        ],
    }


def test_create_dish_computes_per_100g(client, auth_headers):
    payload = _make_dish_payload(client, "Курица с рисом (тест)")
    r = client.post("/dishes", headers=auth_headers, json=payload)
    assert r.status_code == 201, r.text
    dish = r.json()
    assert dish["total_grams"] == pytest.approx(350, abs=0.1)
    assert dish["per_100g"]["calories"] > 0
    assert len(dish["ingredients"]) == 2


def test_create_dish_requires_auth(client):
    payload = _make_dish_payload(client)
    assert client.post("/dishes", json=payload).status_code == 401


def test_create_dish_bad_product(client, auth_headers):
    r = client.post("/dishes", headers=auth_headers, json={
        "name": "Плохое", "ingredients": [{"product_id": 999999, "grams": 100}],
    })
    assert r.status_code == 400


def test_create_dish_needs_ingredients(client, auth_headers):
    r = client.post("/dishes", headers=auth_headers, json={"name": "Пусто", "ingredients": []})
    assert r.status_code == 422


def test_get_and_search_dish(client, auth_headers):
    created = client.post("/dishes", headers=auth_headers,
                          json=_make_dish_payload(client, "Уникум Поиск Тест")).json()
    r = client.get(f"/dishes/{created['id']}")
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Уникум Поиск Тест"

    r = client.get("/dishes", params={"q": "Уникум Поиск"})
    assert r.status_code == 200, r.text
    assert any(d["id"] == created["id"] for d in r.json())


def test_get_missing_dish_404(client):
    assert client.get("/dishes/999999").status_code == 404


def test_update_dish(client, auth_headers):
    created = client.post("/dishes", headers=auth_headers,
                          json=_make_dish_payload(client, "До правки")).json()
    new_payload = {
        "name": "После правки",
        "description": "обновлено",
        "ingredients": [{"product_id": _product_id(client, "Гречка"), "grams": 300}],
    }
    r = client.put(f"/dishes/{created['id']}", headers=auth_headers, json=new_payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["name"] == "После правки"
    assert updated["total_grams"] == pytest.approx(300, abs=0.1)
    assert len(updated["ingredients"]) == 1


def test_update_dish_requires_auth(client, auth_headers):
    created = client.post("/dishes", headers=auth_headers,
                          json=_make_dish_payload(client)).json()
    r = client.put(f"/dishes/{created['id']}", json=_make_dish_payload(client))
    assert r.status_code == 401


def test_delete_dish(client, auth_headers):
    created = client.post("/dishes", headers=auth_headers,
                          json=_make_dish_payload(client, "На удаление")).json()
    assert client.delete(f"/dishes/{created['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"/dishes/{created['id']}").status_code == 404


def test_delete_missing_dish_404(client, auth_headers):
    assert client.delete("/dishes/999999", headers=auth_headers).status_code == 404
