# Quality Requirements

This document defines the FitFood Tracker's architecture quality requirements for Assignment 4. Each requirement is written as a measurable scenario in the [SEI quality-attribute scenario format](https://github.com/Alexey-Popov/awesome-ai-architect/blob/main/solution-architecture/quality-attributes.md) (`source` / `stimulus` / `environment` / `artifact` / `response` / `response measure`) and is classified under an [ISO/IEC 25010](https://github.com/Alexey-Popov/awesome-ai-architect/blob/main/solution-architecture/quality-attributes.md) characteristic and sub-characteristic.

Each requirement is verified by at least one automated Quality Requirement Test (QRT). QRT details, test locations, and CI evidence are tracked in [`docs/quality-requirement-tests.md`](quality-requirement-tests.md).

Shared semantics for quality requirements and QRTs are defined in [Process Requirements](https://gitlab.pg.innopolis.university/swp_26/swp_26/-/blob/main/Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests).

## Index

| ID | Title | ISO/IEC 25010 characteristic | Sub-characteristic | QRT |
|---|---|---|---|---|
| [QR-1](#qr-1-kbju-calculation-correctness) | KBJU calculation correctness | Functional Suitability | Functional correctness | [QRT-1](quality-requirement-tests.md#qrt-1--nutrition-correctness) |
| [QR-2](#qr-2-read-endpoint-response-time) | Read-endpoint response time | Performance Efficiency | Time behaviour | [QRT-2](quality-requirement-tests.md#qrt-2--api-latency) |
| [QR-3](#qr-3-recommendation-determinism--ingredient-validity) | Recommendation determinism & ingredient validity | Reliability | Maturity | [QRT-3](quality-requirement-tests.md#qrt-3--recommendation-determinism--validity) |

---

## QR-1: KBJU calculation correctness

**Characteristic / sub-characteristic:** Functional Suitability → Functional correctness

**Scenario:**
> When a **user with a completed profile** triggers a **BMR/target calculation or a manual daily-calorie-limit change** under **normal operating conditions**, the **nutrition service** shall **compute BMR using the Mifflin–St Jeor formula and rescale protein/fat/carb grams so their energy ratios are preserved**, such that **BMR matches the documented reference values within ±0.1 kcal, the protein/fat/carb energy ratios sum to 1.0 within ±0.5 percentage points, and a manual calorie-limit change preserves the original ratios within the same ±0.5 percentage point tolerance**, in **100% of evaluated cases**.

**Rationale:** KBJU targets are the basis of every downstream feature (meal limits, recommendations, deficit/surplus messaging). An incorrect BMR formula, or a manual calorie-limit change that silently distorts the user's protein/fat/carb split, is a functional defect that corrupts every feature built on top of it. This logic is pure and side-effect-free, so it is cheap to test exhaustively and a high-value correctness gate.

**Traceability:** Related to US-03 (Daily Macronutrient Tracking), US-04 (Structured Dietary Plans). Implemented and verified in PR [#78](https://github.com/xqzme-otec/fitFood/pull/78).

**Status: Implemented.**
- [`app/services/nutrition.py`](../app/services/nutrition.py) implements `calc_bmr`, `calc_tdee`, `calc_targets`, `rescale_for_calories`.
- Verified by [QRT-1](quality-requirement-tests.md#qrt-1--nutrition-correctness) — [`tests/test_qrt_nutrition.py`](../tests/test_qrt_nutrition.py), run as part of the `tests` CI workflow on every push and PR.

---

## QR-2: Read-endpoint response time

**Characteristic / sub-characteristic:** Performance Efficiency → Time behaviour

**Scenario:**
> When an **authenticated user with seeded fridge/diary data** requests **`GET /profile/targets`, `GET /diary/summary`, or `GET /recommendations`** under **normal load on the CI/seeded-fixture dataset**, the **FitFood API** shall **return a `200` response**, such that **the best of three timed calls completes in under 1000 ms**, in **100% of evaluated cases** (after a warm-up call to exclude one-time import/connection costs).

**Rationale:** These three endpoints are hit on every screen a logged-in user sees (today view, diary, recommendations) and aggregate diary entries / scan the recipe catalogue against fridge contents. A regression here (e.g. an accidental N+1 query or an unindexed scan) would be felt on nearly every interaction. The 1000 ms budget is intentionally generous — a guardrail against an accidental regression rather than a precise SLA — chosen to stay stable under CI scheduler jitter while still catching a real slowdown.

**Traceability:** Related to US-03 (Daily Macronutrient Tracking), US-02 (Smart Recipe Recommendations). Implemented and verified in PR [#78](https://github.com/xqzme-otec/fitFood/pull/78).

**Status: Implemented.**
- Covered code: the `/profile/targets`, `/diary/summary`, and `/recommendations` request paths (routers + services).
- Verified by [QRT-2](quality-requirement-tests.md#qrt-2--api-latency) — [`tests/test_qrt_latency.py`](../tests/test_qrt_latency.py), run as part of the `tests` CI workflow on every push and PR.

---

## QR-3: Recommendation determinism & ingredient validity

**Characteristic / sub-characteristic:** Reliability → Maturity

**Scenario:**
> When a **user with an unchanged fridge/diary state** issues **repeated `GET /recommendations` calls**, the **recommendation service** shall **return identical, identically-ordered results with no hidden randomness, and never recommend a dish missing a key ingredient**, such that **two consecutive calls return structurally identical JSON (same items, order, and scores), and every recommended dish has zero missing ingredients with `grams_needed` at or above the key-ingredient threshold (50 g)**, in **100% of evaluated cases**.

**Rationale:** Recipe recommendations are the product's headline feature. Non-deterministic output would make the feature impossible to trust or debug (the same fridge should always yield the same advice), and recommending a dish the user cannot actually cook with what they have would break the product's core promise. Both properties are about the system reliably meeting its specified behaviour under normal operation, which is why this is classified under Reliability rather than re-using Functional Suitability (already used by QR-1).

**Traceability:** Related to US-02 (Smart Recipe Recommendations), US-01 (Adding Products to Inventory — fridge contents drive the match). Implemented and verified in PR [#78](https://github.com/xqzme-otec/fitFood/pull/78).

**Status: Implemented.**
- Covered code: [`app/services/recommendation.py`](../app/services/recommendation.py) (`recommend_dishes` and scoring helpers).
- Verified by [QRT-3](quality-requirement-tests.md#qrt-3--recommendation-determinism--validity) — [`tests/test_qrt_recommendation_determinism.py`](../tests/test_qrt_recommendation_determinism.py), run as part of the `tests` CI workflow on every push and PR.

---

## Notes on selection

Three requirements were selected so that each maps to a **different** ISO/IEC 25010 characteristic and sub-characteristic (Functional Suitability/Functional correctness, Performance Efficiency/Time behaviour, Reliability/Maturity), as required for Assignment 4. They were prioritized because they map to the product's highest-traffic and highest-risk logic: the nutrition math every feature depends on, the read endpoints hit on every screen, and the determinism/validity of the recommendation engine — FitFood's headline feature.

An earlier draft of this document scoped different requirements (cross-user fridge-data confidentiality and receipt-scan fault tolerance under LLM/OCR failure). Those remain valid candidate quality requirements and are not implemented as QRTs yet; if the team picks them up in a later Sprint, add them here as QR-4/QR-5 with their own QRTs in [`docs/quality-requirement-tests.md`](quality-requirement-tests.md) rather than reusing the QR-1–3 IDs above.

## Maintenance

These quality requirements and their QRTs are maintained product assets. When the related product code changes, keep the requirement, its scenario, and its QRT in sync — update this document and [`docs/quality-requirement-tests.md`](quality-requirement-tests.md) together rather than letting one drift from the other.
