"""QRT-2 — API latency.

Quality requirement: the read endpoints a user hits on every screen
(`/profile/targets`, `/diary/summary`, `/recommendations`) must respond quickly
on the seeded fixture dataset.

Evidence type: automated test executed in CI (the `qrt` marker selects it).
The 1000 ms bound is deliberately generous so the check measures a real
regression (e.g. an accidental N+1 query) rather than CI noise; see
docs/quality-requirement-tests.md for the rationale.
"""
import time

import pytest

pytestmark = pytest.mark.qrt

LATENCY_BUDGET_S = 1.0


def _stock(client, headers):
    """Give the user some fridge stock and a diary entry so the endpoints do real work."""
    for name, qty in [
        ("Куриное филе", 500), ("Гречка", 400), ("Морковь", 300),
        ("Творог 9%", 400), ("Ягоды черника", 150),
    ]:
        client.post("/fridge/items", headers=headers, json={"name": name, "quantity": qty})

    slots = client.get("/profile/meals", headers=headers).json()
    products = client.get("/products", params={"q": "Куриное"}).json()
    if products:
        client.post("/diary/entries", headers=headers, json={
            "meal_slot_id": slots[0]["id"], "product_id": products[0]["id"], "amount": 150,
        })


def _measure(client, method, url, headers):
    """Return elapsed seconds for a single request, asserting it succeeded."""
    start = time.perf_counter()
    resp = client.request(method, url, headers=headers)
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200, resp.text
    return elapsed


@pytest.mark.parametrize("url", ["/profile/targets", "/diary/summary", "/recommendations"])
def test_endpoint_latency_within_budget(client, profiled_headers, url):
    _stock(client, profiled_headers)

    # Warm-up: first call pays one-time import/JIT/connection costs we don't measure.
    _measure(client, "GET", url, profiled_headers)

    # Take the best of three timed calls to stay robust against CI scheduler jitter.
    best = min(_measure(client, "GET", url, profiled_headers) for _ in range(3))
    assert best < LATENCY_BUDGET_S, f"{url} took {best:.3f}s (budget {LATENCY_BUDGET_S}s)"
