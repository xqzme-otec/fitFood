"""Integration test for the receipt -> fridge -> recommendation chain.

This exercises an important multi-component interaction: scanning a receipt
parses and classifies items, confirming them populates the fridge, and the
recommender then uses that fridge stock to suggest dishes. It spans
receipt.py, llm.py (mock), classifier.py, fridge.py and recommendation.py.
"""
RECEIPT_TEXT = (
    "Куриное филе 500г 350.00\n"
    "Гречка 800г 90.00\n"
    "Морковь 500г 40.00\n"
    "Мыло Dove 100г 79.00\n"
    "Лук репчатый 500г 35.00"
)


def test_scanned_receipt_stock_drives_recommendations(client, profiled_headers):
    # 1. Scan the receipt text.
    scan = client.post("/receipts/scan-text", headers=profiled_headers,
                       json={"text": RECEIPT_TEXT})
    assert scan.status_code in (200, 201), scan.text
    scan_data = scan.json()
    items = scan_data["items"]

    # Non-food (soap) is filtered; food items get categories.
    assert any("мыло" in it["parsed_name"].lower() and it["is_food"] is False for it in items)

    # 2. Confirm only the food items into the fridge.
    confirm = {"items": [{"item_id": it["id"], "accepted": it["is_food"]} for it in items]}
    confirmed = client.post(f"/receipts/{scan_data['id']}/confirm",
                            headers=profiled_headers, json=confirm)
    assert confirmed.status_code in (200, 201), confirmed.text

    fridge_names = {i["name"].lower() for i in client.get("/fridge/items", headers=profiled_headers).json()}
    assert any("филе" in n for n in fridge_names)
    assert not any("мыло" in n for n in fridge_names)

    # 3. Recommendations now draw on the freshly stocked fridge.
    recs = client.get("/recommendations", headers=profiled_headers)
    assert recs.status_code == 200, recs.text
    recs_data = recs.json()
    assert isinstance(recs_data, list) and recs_data

    # Any recommended dish must only rely on key ingredients we actually stocked.
    for rec in (r for r in recs_data if r["kind"] == "dish"):
        missing_key = [
            ing for ing in rec["ingredients"]
            if not ing["available"] and ing["grams_needed"] >= 50.0
        ]
        assert not missing_key, rec["name"]
