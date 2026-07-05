"""Тесты чистки фискальных названий из чека (naming.clean_receipt_name)."""
from app.services import llm
from app.services.naming import clean_receipt_name


def test_strips_leading_article_packaging_and_splits_dots():
    assert clean_receipt_name("3191300 ТЕНД.Филе кур.охл.подл") == "ТЕНД. Филе кур. охл"


def test_removes_packaging_markers():
    assert clean_receipt_name("Молоко п/пак 2.5%") == "Молоко 2.5%"
    assert clean_receipt_name("Сыр Российский в/у") == "Сыр Российский"
    # «подложка» целиком, но не должно резать слово до «ожка».
    assert clean_receipt_name("Сыр Российский подложка 200г") == "Сыр Российский 200г"
    # Тара: бутылка/банка/дой-пак.
    assert clean_receipt_name("Уксус столовый 9% пл/б") == "Уксус столовый 9%"
    assert clean_receipt_name("Кетчуп острый дой-пак") == "Кетчуп острый"


def test_keeps_clean_name_untouched():
    assert clean_receipt_name("Куриное филе") == "Куриное филе"


def test_empty_and_none_safe():
    assert clean_receipt_name("") == ""
    assert clean_receipt_name(None) == ""


def test_parse_structured_applies_receipt_cleaning():
    # Сырое фискальное имя -> в parsed_name попадает уже почищенное.
    item = llm.parse_structured_items(
        [{"name": "3191300 ТЕНД.Филе кур.охл.подл", "quantity": 1, "price": 31900}]
    )[0]
    assert item.parsed_name == "ТЕНД. Филе кур. охл"
    assert item.is_food is True


def test_normalize_names_noop_without_key():
    # В мок-режиме (без ключа) имена возвращаются без изменений.
    names = ["ТЕНД. Филе кур. охл", "Молоко"]
    assert llm.normalize_product_names(names) == names
    assert llm.normalize_product_names([]) == []
