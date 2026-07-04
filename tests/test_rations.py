"""Тесты свайп-генератора рациона `GET /rations/next`.

Работают в мок-режиме LLM (сеть не нужна): reason приходит из детерминированного
фолбэка, подбор — из каталога.
"""
import pytest

from app.services import llm
from app.services.recommendation import Remaining


class _FakeProduct:
    def __init__(self, calories, protein, fat, carbs):
        self.calories, self.protein, self.fat, self.carbs = calories, protein, fat, carbs


class _FakeItem:
    def __init__(self, name, category, product=None):
        self.name, self.category, self.product = name, category, product


def test_invent_dish_computes_macros_and_name():
    """Фолбэк генерации блюда: реальные КБЖУ (не нули) и осмысленное название."""
    items = [
        _FakeItem("Куриное филе", "Мясо и рыба", _FakeProduct(113, 23.6, 1.9, 0.4)),
        _FakeItem("Гречка", "Бакалея", _FakeProduct(343, 12.6, 3.3, 62.1)),
        _FakeItem("Морковь", "Овощи и фрукты", _FakeProduct(35, 1.3, 0.1, 6.9)),
    ]
    rem = Remaining(calories=600, protein=50, fat=20, carbs=60)
    dish = llm.invent_dish(rem, items)

    assert dish is not None
    assert dish["calories"] > 0 and dish["protein"] > 0
    assert dish["grams"] > 0
    # Собирает связную тарелку, а не «A + B».
    assert " + " not in dish["name"]
    assert dish["name"].startswith("Куриное филе с")
    # Порция подогнана под остаток дня (с запасом на округление и clamp).
    assert dish["calories"] <= 600 * 1.6


def test_invent_dish_empty_fridge_returns_none():
    assert llm.invent_dish(Remaining(500, 40, 20, 50), []) is None


def test_generate_ration_returns_ingredients_and_method():
    """RAG-фолбэк (мок-режим): блюдо с ингредиентами (грамм) и методом приготовления."""
    items = [
        _FakeItem("Куриное филе", "Мясо и рыба", _FakeProduct(113, 23.6, 1.9, 0.4)),
        _FakeItem("Гречка", "Бакалея", _FakeProduct(343, 12.6, 3.3, 62.1)),
    ]
    rem = Remaining(calories=600, protein=50, fat=20, carbs=60)
    dish = llm.generate_ration(rem, items, recipes=[])

    assert dish is not None
    assert dish["ingredients"] and all(i["grams"] > 0 for i in dish["ingredients"])
    assert dish["method"]
    # Ингредиенты — реально из холодильника.
    names = {i["name"] for i in dish["ingredients"]}
    assert names <= {"Куриное филе", "Гречка"}


def test_generate_ration_empty_fridge_returns_none():
    assert llm.generate_ration(Remaining(500, 40, 20, 50), [], recipes=[]) is None


def test_eat_ration_writes_entries_per_ingredient(client, profiled_headers, meal_slot_id):
    """«Съел это» для RAG-блюда: каждый ингредиент — отдельная запись в дневнике."""
    products = client.get("/products", params={"q": "Куриное"}).json()
    pid = products[0]["id"]

    r = client.post("/rations/eat", headers=profiled_headers, json={
        "meal_slot_id": meal_slot_id,
        "name": "Курица с гречкой",
        "ingredients": [
            {"product_id": pid, "name": "Куриное филе", "grams": 150},
            {"product_id": None, "name": "Соус", "grams": 30,
             "calories": 50, "protein": 1, "fat": 4, "carbs": 3},
        ],
    })
    assert r.status_code == 201, r.text
    entries = r.json()
    assert len(entries) == 2

    # Продукт с product_id пересчитан по каталогу; снимок — сохранён как есть.
    by_name = {e["name"]: e for e in entries}
    assert "Соус" in by_name and by_name["Соус"]["calories"] == 50
    matched = next(e for e in entries if e["name"] != "Соус")
    assert matched["calories"] > 0

    # Записи попали в дневник и уменьшили дневной остаток.
    summary = client.get("/diary/summary", headers=profiled_headers).json()
    eaten = matched["calories"] + 50
    assert summary["consumed"]["calories"] == pytest.approx(eaten, abs=1.0)


def test_eat_ration_deducts_from_fridge(client, profiled_headers, meal_slot_id):
    """«Съел это» списывает использованные граммы из холодильника."""
    client.post("/fridge/items", headers=profiled_headers,
                json={"name": "Куриное филе", "quantity": 500})
    products = client.get("/products", params={"q": "Куриное"}).json()
    pid = products[0]["id"]

    r = client.post("/rations/eat", headers=profiled_headers, json={
        "meal_slot_id": meal_slot_id,
        "ingredients": [{"product_id": pid, "name": "Куриное филе", "grams": 150}],
    })
    assert r.status_code == 201, r.text

    fridge = client.get("/fridge/items", headers=profiled_headers).json()
    chicken = next(i for i in fridge if "Куриное" in i["name"])
    assert chicken["quantity"] == pytest.approx(350, abs=0.1)


def test_eat_ration_empty_ingredients_400(client, profiled_headers, meal_slot_id):
    r = client.post("/rations/eat", headers=profiled_headers, json={
        "meal_slot_id": meal_slot_id, "ingredients": [],
    })
    assert r.status_code == 400


def _stock_fridge(client, headers):
    for name, qty in [
        ("Куриное филе", 500), ("Гречка", 400), ("Лук репчатый", 200),
        ("Морковь", 300), ("Творог 9%", 400), ("Ягоды черника", 150),
    ]:
        client.post("/fridge/items", headers=headers, json={"name": name, "quantity": qty})


def test_next_requires_profile(client, auth_headers):
    r = client.get("/rations/next", headers=auth_headers, params={"meal_slot_id": 1})
    assert r.status_code == 409


def test_next_returns_candidate(client, profiled_headers, meal_slot_id):
    _stock_fridge(client, profiled_headers)
    r = client.get("/rations/next", headers=profiled_headers, params={"meal_slot_id": meal_slot_id})
    assert r.status_code == 200, r.text
    card = r.json()
    assert card is not None
    for field in ("name", "kind", "reason", "source", "meal_slot_id", "day_remaining", "suggested_grams"):
        assert field in card
    assert card["meal_slot_id"] == meal_slot_id
    assert card["source"] in ("catalog", "llm")
    # reason заполнен (LLM-фолбэк в мок-режиме).
    assert card["reason"]


def test_next_bad_slot_404(client, profiled_headers):
    r = client.get("/rations/next", headers=profiled_headers, params={"meal_slot_id": 999999})
    assert r.status_code == 404


def test_next_is_always_llm(client, profiled_headers, meal_slot_id):
    """Свайпер целиком на RAG: каждая карточка — ИИ-идея (source=llm), без каталога."""
    _stock_fridge(client, profiled_headers)
    card = client.get("/rations/next", headers=profiled_headers,
                      params={"meal_slot_id": meal_slot_id}).json()
    assert card is not None
    assert card["source"] == "llm"
    assert card["dish_id"] is None
    assert card["ingredients"]  # у RAG-блюда есть состав


def test_exclude_names_gives_other_variant(client, profiled_headers, meal_slot_id):
    """Свайп ✗ (exclude_names) предлагает другое блюдо для того же приёма."""
    _stock_fridge(client, profiled_headers)
    first = client.get("/rations/next", headers=profiled_headers,
                       params={"meal_slot_id": meal_slot_id}).json()
    second = client.get("/rations/next", headers=profiled_headers,
                        params={"meal_slot_id": meal_slot_id,
                                "exclude_names": first["name"]}).json()
    # При разнообразном холодильнике второй вариант отличается по названию.
    assert second is not None
    assert second["name"] != first["name"]


def test_day_remaining_reflects_eaten(client, profiled_headers, meal_slot_id):
    _stock_fridge(client, profiled_headers)
    targets = client.get("/profile/targets", headers=profiled_headers).json()

    # Съедаем продукт — дневной остаток должен уменьшиться на его калорийность.
    products = client.get("/products", params={"q": "Куриное"}).json()
    entry = client.post("/diary/entries", headers=profiled_headers, json={
        "meal_slot_id": meal_slot_id, "product_id": products[0]["id"], "amount": 200,
    }).json()

    card = client.get("/rations/next", headers=profiled_headers,
                      params={"meal_slot_id": meal_slot_id}).json()
    expected = targets["calories"] - entry["calories"]
    assert card["day_remaining"]["calories"] == pytest.approx(expected, abs=1.0)
