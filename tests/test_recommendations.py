"""Тесты рекомендаций рецептов по содержимому холодильника и КБЖУ."""


def _stock_fridge(client, headers):
    for name, qty in [
        ("Куриное филе", 500),
        ("Гречка", 400),
        ("Лук репчатый", 200),
        ("Морковь", 300),
        ("Творог 9%", 400),
        ("Ягоды черника", 150),
    ]:
        client.post("/fridge/items", headers=headers, json={"name": name, "quantity": qty})


def test_recommendations_returns_scored_list(client, profiled_headers):
    _stock_fridge(client, profiled_headers)
    r = client.get("/recommendations", headers=profiled_headers)
    assert r.status_code == 200, r.text
    recs = r.json()
    assert isinstance(recs, list)
    # При наполненном холодильнике должна быть хотя бы одна рекомендация.
    assert len(recs) >= 1
    first = recs[0]
    for field in ("name", "kind", "score", "reason", "missing_ingredients"):
        assert field in first


def test_recommendations_for_specific_meal(client, profiled_headers):
    _stock_fridge(client, profiled_headers)
    slots = client.get("/profile/meals", headers=profiled_headers).json()
    r = client.get("/recommendations", headers=profiled_headers,
                   params={"meal_slot_id": slots[-1]["id"]})
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), list)


def test_recommendations_requires_profile(client, auth_headers):
    assert client.get("/recommendations", headers=auth_headers).status_code == 409
