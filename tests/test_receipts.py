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


# Реалистичная строка QR кассового чека (в мок-режиме её содержимое не важно —
# CHECK_TOKEN не задан, возвращается демо-чек check_api._DEMO_ITEMS).
QR_RAW = "t=20230101T1200&s=703.10&fn=9999078900012345&i=12345&fp=1234567890&n=1"


def test_scan_qr_returns_food_and_filters_non_food(client, profiled_headers):
    r = client.post("/receipts/scan-qr", headers=profiled_headers, json={"qrraw": QR_RAW})
    assert r.status_code in (200, 201), r.text
    items = r.json()["items"]

    # Мыло из демо-чека распознано как НЕ еда.
    soap = next((it for it in items if "мыло" in it["parsed_name"].lower()), None)
    assert soap is not None and soap["is_food"] is False

    # У пищевых позиций есть категория, и мера из названия распознана (мл/г).
    foods = [it for it in items if it["is_food"]]
    assert len(foods) >= 3
    assert all(it["category"] for it in foods)
    milk = next((it for it in foods if "молоко" in it["parsed_name"].lower()), None)
    assert milk is not None and milk["unit"] == "ml" and milk["quantity"] == 930


def test_scan_qr_empty_string_rejected(client, profiled_headers):
    r = client.post("/receipts/scan-qr", headers=profiled_headers, json={"qrraw": "   "})
    assert r.status_code == 502, r.text


def test_scan_qr_confirm_adds_to_fridge(client, profiled_headers):
    scan = client.post("/receipts/scan-qr", headers=profiled_headers,
                       json={"qrraw": QR_RAW}).json()
    confirm = {"items": [{"item_id": it["id"], "accepted": it["is_food"]} for it in scan["items"]]}
    r = client.post(f"/receipts/{scan['id']}/confirm", headers=profiled_headers, json=confirm)
    assert r.status_code in (200, 201), r.text
    added = r.json()
    food_count = sum(1 for it in scan["items"] if it["is_food"])
    assert len(added) == food_count
