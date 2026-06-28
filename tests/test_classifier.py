"""Unit tests for the product-category classifier.

Covers the deterministic text cleaning, the keyword fallback (which must work
even when the XGBoost artifacts are absent), the shop->fridge category mapping,
and the public contract of predict_fridge_category.
"""
from app.models.enums import FridgeCategory
from app.services import classifier


# --- clean_title ----------------------------------------------------------

def test_clean_title_strips_numbers_units_and_normalizes_spaces():
    assert classifier.clean_title("1.Молоко 930 г") == "молоко"
    assert classifier.clean_title("  Гречка   500 г ") == "гречка"
    assert classifier.clean_title("Куриное ФИЛЕ") == "куриное филе"


def test_clean_title_handles_none_and_empty():
    assert classifier.clean_title(None) == ""
    assert classifier.clean_title("") == ""


# --- built-in keyword fallback (model-independent) ------------------------

def test_builtin_keyword_fallback_maps_known_products():
    assert classifier._keyword_fallback("молоко") == "Молочный прилавок"
    assert classifier._keyword_fallback("куриное филе") == "Мясо, птица, рыба"
    assert classifier._keyword_fallback("брокколи") == "Овощи и фрукты"


def test_builtin_keyword_fallback_defaults_to_ready_made():
    assert classifier._keyword_fallback("нечтонепонятное") == "Готовая еда"


# --- shop -> fridge category mapping --------------------------------------

def test_shop_to_fridge_merges_both_meat_and_fish_groups():
    assert classifier.SHOP_TO_FRIDGE["Мясо, птица, рыба"] == FridgeCategory.meat_fish
    assert classifier.SHOP_TO_FRIDGE["Рыба, морепродукты"] == FridgeCategory.meat_fish


# --- public contract ------------------------------------------------------

def test_predict_fridge_category_returns_enum_and_confidence():
    cat, conf = classifier.predict_fridge_category("Молоко 2.5%")
    assert isinstance(cat, FridgeCategory)
    assert 0.0 <= conf <= 1.0
