"""Тесты llm.parse_structured_items — разбор готовых позиций чека (путь QR)."""
from app.services import llm


def _one(name, quantity=1.0, price=None):
    return llm.parse_structured_items([{"name": name, "quantity": quantity, "price": price}])[0]


def test_unit_parsed_from_name_beats_fiscal_quantity():
    # В названии есть «930мл» -> 930 ml, фискальное quantity=1 игнорируется.
    item = _one("Молоко Простоквашино 930мл", quantity=1)
    assert (item.quantity, item.unit) == (930.0, "ml")


def test_kg_in_name_converted_to_grams():
    item = _one("Куриное филе 0.8кг", quantity=1)
    assert (item.quantity, item.unit) == (800.0, "g")


def test_no_unit_in_name_falls_back_to_fiscal_quantity_as_pcs():
    item = _one("Свинина нежная", quantity=2)
    assert (item.quantity, item.unit) == (2.0, "pcs")


def test_dangling_punctuation_stripped_from_name():
    # После вырезания меры остаётся висячая скобка — её убираем.
    item = _one("Кетчуп томатный 350 г(")
    assert item.parsed_name == "Кетчуп томатный"
    assert (item.quantity, item.unit) == (350.0, "g")


def test_non_food_flagged_and_no_expiry():
    item = _one("Мыло Dove 100г")
    assert item.is_food is False
    assert item.expiry_days is None


def test_food_gets_shelf_life():
    item = _one("Творог 9%")
    assert item.is_food is True
    assert item.expiry_days and item.expiry_days > 0


def test_price_passed_through_as_float():
    item = _one("Сыр", price=250)
    assert item.price == 250.0 and isinstance(item.price, float)


def test_nameless_items_skipped():
    parsed = llm.parse_structured_items(
        [{"name": "  ", "quantity": 1}, {"name": "Хлеб", "quantity": 1}]
    )
    assert [p.parsed_name for p in parsed] == ["Хлеб"]
