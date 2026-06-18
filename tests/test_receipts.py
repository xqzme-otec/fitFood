"""Тесты сканирования чека (мок OCR+LLM): фильтрация еды и добавление в холодильник."""

RECEIPT_TEXT = (
    "Молоко 930мл 89.90\n"
    "Мыло Dove 100г 79.00\n"
    "Брокколи 400г 119.00\n"
    "Колбаса докторская 400г 199.00"
)


def test_scan_text_filters_food(client, profiled_headers):
    r = client.post("/receipts/scan-text", headers=profiled_headers, json={"text": RECEIPT_TEXT})
    assert r.status_code in (200, 201), r.text
    items = r.json()["items"]
    by_name = {it["parsed_name"].lower(): it for it in items}

    # Мыло должно быть распознано как НЕ еда.
    soap = next((it for it in items if "мыло" in it["parsed_name"].lower()), None)
    assert soap is not None and soap["is_food"] is False

    # Молоко/брокколи/колбаса — еда с категориями.
    foods = [it for it in items if it["is_food"]]
    assert len(foods) >= 3
    assert all(it["category"] for it in foods)


def test_confirm_adds_accepted_to_fridge(client, profiled_headers):
    scan = client.post("/receipts/scan-text", headers=profiled_headers,
                       json={"text": RECEIPT_TEXT}).json()
    # Принимаем только пищевые позиции.
    confirm = {"items": [{"item_id": it["id"], "accepted": it["is_food"]} for it in scan["items"]]}
    r = client.post(f"/receipts/{scan['id']}/confirm", headers=profiled_headers, json=confirm)
    assert r.status_code in (200, 201), r.text
    added = r.json()
    # Добавлено столько, сколько было пищевых позиций.
    food_count = sum(1 for it in scan["items"] if it["is_food"])
    assert len(added) == food_count

    fridge = client.get("/fridge/items", headers=profiled_headers).json()
    names = {i["name"].lower() for i in fridge}
    assert any("молоко" in n for n in names)
    assert not any("мыло" in n for n in names)  # непродукт не попал в холодильник
