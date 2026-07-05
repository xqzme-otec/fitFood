# ADR-002: Local XGBoost Classifier for Product Categories

**Date:** 2026-06-22  
**Status:** Accepted  
**Quality requirements addressed:** [QR-2](../../quality-requirements.md#qr-2-read-endpoint-response-time) (Performance Efficiency / Time behaviour), [QR-3](../../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) (Reliability / Maturity)

---

## Context

When a user scans a receipt, each food item must be assigned to a fridge category (e.g. "Молочный прилавок", "Овощи и фрукты", "Мясо, птица, рыба"). FitFood has 13 store-level categories that map to 10 fridge groups.

The options considered were:
- Ask the LLM to classify as part of the receipt-parsing prompt.
- Use a rule-based keyword dictionary.
- Train and deploy a dedicated ML model.

A key constraint is that classification must be fast (synchronous, sub-10 ms per item), deterministic (same product name → same category, every time), and must work offline without any API key.

The team had labelled product data available and the tooling to train a gradient-boosted classifier.

## Decision

Train an **XGBoost classifier** on TF-IDF features derived from product names, plus hand-crafted keyword flags and character-count features. The trained artifacts (`xgb_model.pkl`, `tfidf_vectorizer.pkl`, `label_encoder.pkl`, `keywords.pkl`) are committed to the repository under `notebooks/models/`.

The classifier is implemented in `app/services/classifier.py` with:
- A lazy-loaded `_load_artifacts()` function (loaded once, cached via `@lru_cache`).
- A keyword-based fallback (`_keyword_fallback`) activated when confidence is below 0.5 or model files are missing.

## Consequences

**Positive:**
- Classification is synchronous and runs in < 5 ms per item — no measurable impact on the `/receipts/scan` or `/recommendations` response time (QR-2 compliance).
- Output is fully deterministic for a given product name — supports QR-3 (no hidden randomness in the recommendation or fridge-update path).
- Works offline; no network dependency or API key needed.
- The keyword fallback means the feature degrades gracefully rather than failing when model files are unavailable.

**Negative / trade-offs:**
- Model files (~1 MB total) are committed to the repository. For a larger model this would become impractical.
- The model must be retrained if the product taxonomy changes. Retraining requires running the notebook manually (`notebooks/train_model.ipynb`).
- The model was trained on a specific product name corpus; it may misclassify unusual brand names or foreign-language items.
- Confidence-based fallback to keywords can produce inconsistent results at the boundary (a product near the 0.5 threshold might flip between model and keyword predictions across Python versions if TF-IDF tokenisation changes).

## Alternatives considered

**LLM-based classification (alongside receipt parsing):** Rejected — adds latency, costs tokens per item, is non-deterministic, and requires an API key. Mixing classification into the parsing prompt also makes the prompt more complex and harder to maintain.

**Pure keyword dictionary:** Considered as the sole mechanism. Kept as fallback only — insufficient coverage for the full product name corpus (too many brand names and abbreviations not in the dictionary).

**Remote inference service (e.g. Hugging Face Inference API):** Rejected — introduces network dependency and latency at a call site that runs per-item inside a loop.
