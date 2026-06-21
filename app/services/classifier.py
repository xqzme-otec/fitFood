"""Обёртка над обученной XGBoost-моделью классификации категории продукта.

Интерфейс признаков повторяет notebooks/train_model.ipynb:
  features = [ tfidf(clean_title) | keyword_flags | (len, word_count) ]

Модель возвращает одну из 13 «магазинных» категорий. Для холодильника
они сворачиваются в 10 укрупнённых групп (FridgeCategory).
Если модель/файлы недоступны — используется keyword-fallback.
"""
from __future__ import annotations

import re
from functools import lru_cache

import numpy as np

from app.config import settings
from app.models.enums import FridgeCategory

# Сворачивание 13 категорий модели -> 10 групп холодильника.
# Обе «рыбные»/«мясные» категории модели сливаются в «Мясо и рыба».
SHOP_TO_FRIDGE: dict[str, FridgeCategory] = {
    "Бакалея": FridgeCategory.grocery,
    "Вода и напитки": FridgeCategory.drinks,
    "Готовая еда": FridgeCategory.ready_made,
    "Замороженные продукты": FridgeCategory.other,
    "Консервы": FridgeCategory.grocery,
    "Молочный прилавок": FridgeCategory.dairy,
    "Мясо, птица, рыба": FridgeCategory.meat_fish,
    "Овощи и фрукты": FridgeCategory.veg_fruit,
    "Рыба, морепродукты": FridgeCategory.meat_fish,
    "Сладости": FridgeCategory.sweets,
    "Снеки": FridgeCategory.snacks,
    "Хлеб и выпечка": FridgeCategory.bakery,
    "Чай, кофе, какао": FridgeCategory.tea_coffee,
}


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
    return fridge_cat, conf


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
