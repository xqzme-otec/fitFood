"""Тесты алгоритма подбора эмодзи и его проброса в API.

Алгоритм: подходящий эмодзи по продукту, иначе по категории, иначе запасной.
"""
from app.services.emoji import DEFAULT_EMOJI, emoji_for


# --- Юнит-тесты алгоритма ---

def test_emoji_by_product_keyword():
    """Для конкретного продукта берётся «его» эмодзи."""
    assert emoji_for("Куриное филе охлаждённое") == "🍗"
    assert emoji_for("Огурцы свежие") == "🥒"
    assert emoji_for("Молоко 2.5%") == "🥛"
    assert emoji_for("Банан") == "🍌"


def test_emoji_dish_keywords():
    """Блюда тоже распознаются по ключевым словам."""
    assert emoji_for("Борщ украинский") == "🥣"
    assert emoji_for("Омлет с овощами") == "🍳"


def test_emoji_category_fallback():
    """Если продукт не распознан — берётся эмодзи категории."""
    # «цуккини» нет в словаре продуктов, но категория задана.
    assert emoji_for("Цуккини", "Овощи и фрукты") == "🥦"
    assert emoji_for("Нечто", "Молочка") == "🥛"


def test_emoji_default_when_unknown():
    """Нет ни продукта, ни известной категории — запасной эмодзи."""
    assert emoji_for("Абракадабра", None) == DEFAULT_EMOJI
    assert emoji_for("Абракадабра", "Несуществующая категория") == DEFAULT_EMOJI


def test_emoji_priority_product_over_category():
    """Эмодзи продукта имеет приоритет над эмодзи категории."""
    # Название содержит «лосось» (🐟), категория «Молочка» (🥛) — должен победить продукт.
    assert emoji_for("Лосось", "Молочка") == "🐟"


# --- Интеграция: эмодзи в ответах API ---

def test_fridge_item_has_emoji(client, profiled_headers):
    r = client.post(
        "/fridge/items",
        headers=profiled_headers,
        json={"name": "Куриное филе", "quantity": 500, "unit": "g"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["emoji"] == "🍗"
    assert isinstance(body["category"], str)


def test_fridge_list_items_have_emoji(client, profiled_headers):
    client.post(
        "/fridge/items",
        headers=profiled_headers,
        json={"name": "Брокколи", "quantity": 300, "unit": "g"},
    )
    r = client.get("/fridge/items", headers=profiled_headers)
    assert r.status_code == 200, r.text
    items = r.json()
    assert items, "ожидался хотя бы один продукт"
    for it in items:
        assert "emoji" in it and isinstance(it["emoji"], str) and it["emoji"]


def test_dishes_have_emoji(client, profiled_headers):
    r = client.get("/dishes?limit=5", headers=profiled_headers)
    assert r.status_code == 200, r.text
    dishes = r.json()
    assert dishes, "в каталоге ожидались блюда"
    for d in dishes:
        assert d.get("emoji"), f"у блюда {d['name']} нет эмодзи"


def test_receipt_items_have_emoji(client, profiled_headers):
    text = "Молоко 930мл 89.90\nМыло Dove 79.00\nБрокколи 400г 119.00"
    r = client.post("/receipts/scan-text", headers=profiled_headers, json={"text": text})
    assert r.status_code == 201, r.text
    items = r.json()["items"]
    assert items, "ожидались распознанные позиции"
    for it in items:
        assert "emoji" in it and isinstance(it["emoji"], str) and it["emoji"]
    # Среди позиций есть и еда, и непродукт (мыло).
    assert any(it["is_food"] for it in items)
    assert any(not it["is_food"] for it in items)
