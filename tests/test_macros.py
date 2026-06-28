"""Тесты оценки КБЖУ llm.estimate_macros (мок-режим: детерминированно по роли)."""
from app.services import llm

_KEYS = {"calories", "protein", "fat", "carbs"}


def test_returns_all_keys_and_non_negative():
    m = llm.estimate_macros("Нечто неизвестное")
    assert set(m) == _KEYS
    assert all(v >= 0 for v in m.values())


def test_protein_product_has_high_protein():
    meat = llm.estimate_macros("Куриное филе")
    veg = llm.estimate_macros("Огурцы свежие")
    # У белкового продукта белка ощутимо больше, чем у овоща.
    assert meat["protein"] > veg["protein"]


def test_category_used_when_name_uninformative():
    # По названию роль не определить, но категория «Молочка» -> молочный профиль.
    m = llm.estimate_macros("XYZ", category="Молочка")
    assert m["calories"] > 0 and m["protein"] > 0
