"""Тесты умного холодильника: добавление, дедуп, категории, изменение, удаление."""


def test_add_item_auto_category_and_expiry(client, profiled_headers):
    r = client.post("/fridge/items", headers=profiled_headers,
                    json={"name": "Творог 9%", "quantity": 200, "unit": "g"})
    assert r.status_code == 201, r.text
    item = r.json()
    assert item["category"]                 # категория проставлена ML-классификатором
    assert item["expiry_date"] is not None  # срок предложен LLM-моком
    assert item["expiry_status"] in ("ok", "soon", "expired", "unknown")


def test_add_item_explicit_category_honored(client, profiled_headers):
    r = client.post("/fridge/items", headers=profiled_headers,
                    json={"name": "Нечто", "quantity": 100, "unit": "g",
                          "category": "Бакалея", "expiry_date": "2030-01-01"})
    assert r.status_code == 201, r.text
    item = r.json()
    assert item["category"] == "Бакалея"
    assert item["expiry_date"] == "2030-01-01"


def test_duplicate_items_merge_quantity(client, profiled_headers):
    client.post("/fridge/items", headers=profiled_headers,
                json={"name": "Гречка", "quantity": 400, "unit": "g"})
    r = client.post("/fridge/items", headers=profiled_headers,
                    json={"name": "Гречка", "quantity": 100, "unit": "g"})
    assert r.status_code == 201, r.text
    assert r.json()["quantity"] == 500  # 400 + 100 объединились


def test_unmatched_item_still_gets_kbju(client, profiled_headers):
    # Заведомо отсутствующий в каталоге продукт -> КБЖУ оценивается (не пустое).
    r = client.post("/fridge/items", headers=profiled_headers,
                    json={"name": "Марсианский деликатес", "quantity": 200, "unit": "g"})
    assert r.status_code == 201, r.text
    item = r.json()
    assert item["product_id"] is None         # совпадения в каталоге нет
    assert item["kbju_100g"] is not None       # но КБЖУ всё равно проставлено
    assert set(item["kbju_100g"]) == {"calories", "protein", "fat", "carbs"}
    # Для г/мл считается и общий КБЖУ на количество (200 г = ×2 от значения на 100 г).
    assert item["kbju_total"] is not None
    assert item["kbju_total"]["calories"] == round(item["kbju_100g"]["calories"] * 2, 1)


def test_unmatched_item_pcs_has_no_total(client, profiled_headers):
    # Для штук общий КБЖУ не считается (нельзя перевести шт в 100 г), но на 100 г — есть.
    r = client.post("/fridge/items", headers=profiled_headers,
                    json={"name": "Инопланетный снек", "quantity": 3, "unit": "pcs"})
    assert r.status_code == 201, r.text
    item = r.json()
    assert item["kbju_100g"] is not None
    assert item["kbju_total"] is None


def test_list_and_grouped(client, profiled_headers):
    client.post("/fridge/items", headers=profiled_headers,
                json={"name": "Куриное филе", "quantity": 500, "unit": "g"})
    r = client.get("/fridge/items", headers=profiled_headers)
    assert r.status_code == 200, r.text
    assert any(i["name"] == "Куриное филе" for i in r.json())

    r = client.get("/fridge/grouped", headers=profiled_headers)
    assert r.status_code == 200, r.text
    groups = r.json()
    assert groups and all("category" in g and "items" in g for g in groups)


def test_update_quantity(client, profiled_headers):
    item = client.post("/fridge/items", headers=profiled_headers,
                       json={"name": "Макароны", "quantity": 500, "unit": "g"}).json()
    r = client.patch(f"/fridge/items/{item['id']}", headers=profiled_headers,
                     json={"quantity": 100})
    assert r.status_code == 200, r.text
    assert r.json()["quantity"] == 100


def test_delete_item(client, profiled_headers):
    item = client.post("/fridge/items", headers=profiled_headers,
                       json={"name": "Лук репчатый", "quantity": 200, "unit": "g"}).json()
    assert client.delete(f"/fridge/items/{item['id']}", headers=profiled_headers).status_code == 204
    r = client.patch(f"/fridge/items/{item['id']}", headers=profiled_headers, json={"quantity": 50})
    assert r.status_code == 404


def test_cannot_touch_other_users_item(client, profiled_headers):
    item = client.post("/fridge/items", headers=profiled_headers,
                       json={"name": "Сыр российский", "quantity": 200, "unit": "g"}).json()

    other = register_other_profiled_user(client)
    assert client.delete(f"/fridge/items/{item['id']}", headers=other).status_code == 404


def register_other_profiled_user(client):
    from tests.conftest import DEFAULT_PROFILE, register_and_login
    headers = register_and_login(client)
    client.post("/profile", headers=headers, json=DEFAULT_PROFILE)
    return headers
