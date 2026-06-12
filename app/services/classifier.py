"""Обёртка над обученной XGBoost-моделью классификации категории продукта.

Интерфейс признаков повторяет notebooks/train_model.ipynb:
  features = [ tfidf(clean_title) | keyword_flags | (len, word_count) ]

Модель возвращает одну из 13 «магазинных» категорий. Для холодильника
они сворачиваются в укрупнённые группы (FridgeCategory).
Если модель/файлы недоступны — используется keyword-fallback.
"""
from __future__ import annotations

import re
from functools import lru_cache

import numpy as np

from app.config import settings
from app.models.enums import FridgeCategory

# Сворачивание 13 категорий модели -> 8 групп холодильника.
SHOP_TO_FRIDGE: dict[str, FridgeCategory] = {
    "Бакалея": FridgeCategory.cereals,
    "Вода и напитки": FridgeCategory.other,
    "Готовая еда": FridgeCategory.other,
    "Замороженные продукты": FridgeCategory.meat,
    "Консервы": FridgeCategory.other,
    "Молочный прилавок": FridgeCategory.dairy,
    "Мясо, птица, рыба": FridgeCategory.meat,
    "Овощи и фрукты": FridgeCategory.vegetables,
    "Рыба, морепродукты": FridgeCategory.fish,
    "Сладости": FridgeCategory.other,
    "Снеки": FridgeCategory.other,
    "Хлеб и выпечка": FridgeCategory.cereals,
    "Чай, кофе, какао": FridgeCategory.other,
}

# Уточняющие ключевые слова для разнесения «Овощи и фрукты» и «Соусов».
_FRUIT_WORDS = {"яблоко", "банан", "груша", "апельсин", "мандарин", "лимон",
                "ягод", "виноград", "киви", "персик", "слива", "ананас"}
_SAUCE_WORDS = {"соус", "кетчуп", "майонез", "горчица", "аджика", "паста томат"}


def clean_title(title: str) -> str:
    """Очистка названия — копия логики из ноутбука обучения."""
    text = str(title or "").lower()
    text = re.sub(r"^\d+\.", "", text)
    text = re.sub(r"\d+\.?\d*\s*[гклмл]", "", text)
    text = re.sub(r"\d+", "", text)
    text = text.lstrip(".")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


@lru_cache
def _load_artifacts():
    """Лениво загружает модель и препроцессоры. Возвращает None при ошибке."""
    try:
        import joblib

        d = settings.ml_models_dir
        model = joblib.load(d / "xgb_model.pkl")
        vectorizer = joblib.load(d / "tfidf_vectorizer.pkl")
        encoder = joblib.load(d / "label_encoder.pkl")
        keywords = joblib.load(d / "keywords.pkl")
        return model, vectorizer, encoder, keywords
    except Exception as exc:  # noqa: BLE001 — модель опциональна
        print(f"[classifier] ML-модель недоступна, fallback по ключам: {exc}")
        return None


def _refine(cleaned: str, fridge_cat: FridgeCategory) -> FridgeCategory:
    """Дополнительная эвристика для фруктов и соусов."""
    if any(w in cleaned for w in _SAUCE_WORDS):
        return FridgeCategory.sauces
    if fridge_cat == FridgeCategory.vegetables and any(w in cleaned for w in _FRUIT_WORDS):
        return FridgeCategory.fruits
    return fridge_cat


def predict_shop_category(name: str) -> tuple[str, float]:
    """Магазинная категория + уверенность (0..1)."""
    cleaned = clean_title(name)
    artifacts = _load_artifacts()
    if artifacts is None:
        return _keyword_fallback(cleaned), 0.0

    model, vectorizer, encoder, keywords = artifacts
    vec = vectorizer.transform([cleaned]).toarray()
    kw_features = [1 if w in cleaned else 0 for w in keywords.keys()]
    features = np.hstack([vec, [kw_features], [[len(cleaned), len(cleaned.split())]]])

    proba = model.predict_proba(features)[0]
    idx = int(np.argmax(proba))
    confidence = float(proba[idx])
    shop_cat = encoder.inverse_transform([idx])[0]

    # Низкая уверенность -> подстраховка ключевыми словами.
    if confidence < 0.5:
        fb = _keyword_fallback_raw(cleaned, keywords)
        if fb:
            return fb, confidence
    return shop_cat, confidence


def predict_fridge_category(name: str) -> tuple[FridgeCategory, float]:
    """Категория холодильника + уверенность."""
    shop_cat, conf = predict_shop_category(name)
    fridge_cat = SHOP_TO_FRIDGE.get(shop_cat, FridgeCategory.other)
    return _refine(clean_title(name), fridge_cat), conf


def _keyword_fallback_raw(cleaned: str, keywords: dict) -> str | None:
    for word, cat in keywords.items():
        if word in cleaned:
            return cat
    return None


# Минимальный встроенный словарь на случай полного отсутствия модели.
_BUILTIN_KEYWORDS = {
    "молоко": "Молочный прилавок", "творог": "Молочный прилавок", "сыр": "Молочный прилавок",
    "кефир": "Молочный прилавок", "йогурт": "Молочный прилавок",
    "курица": "Мясо, птица, рыба", "филе": "Мясо, птица, рыба", "колбаса": "Мясо, птица, рыба",
    "говядина": "Мясо, птица, рыба", "фарш": "Мясо, птица, рыба",
    "семга": "Рыба, морепродукты", "лосось": "Рыба, морепродукты", "минтай": "Рыба, морепродукты",
    "хлеб": "Хлеб и выпечка", "батон": "Хлеб и выпечка", "лаваш": "Хлеб и выпечка",
    "гречка": "Бакалея", "рис": "Бакалея", "макароны": "Бакалея",
    "помидор": "Овощи и фрукты", "огурец": "Овощи и фрукты", "брокколи": "Овощи и фрукты",
    "яблоко": "Овощи и фрукты", "банан": "Овощи и фрукты",
    "сок": "Вода и напитки", "вода": "Вода и напитки",
}


def _keyword_fallback(cleaned: str) -> str:
    for word, cat in _BUILTIN_KEYWORDS.items():
        if word in cleaned:
            return cat
    return "Готовая еда"
