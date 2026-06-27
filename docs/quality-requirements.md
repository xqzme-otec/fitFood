# Quality Requirements

This document defines the FitFood Tracker's architecture quality requirements for Assignment 4. Each requirement is written as a measurable scenario in the [SEI quality-attribute scenario format](https://github.com/Alexey-Popov/awesome-ai-architect/blob/main/solution-architecture/quality-attributes.md) (`source` / `stimulus` / `environment` / `artifact` / `response` / `response measure`) and is classified under an [ISO/IEC 25010](https://github.com/Alexey-Popov/awesome-ai-architect/blob/main/solution-architecture/quality-attributes.md) characteristic and sub-characteristic.

Each requirement is verified by at least one automated Quality Requirement Test (QRT). QRT details, test locations, and CI evidence are tracked in [`docs/quality-requirement-tests.md`](quality-requirement-tests.md).

Shared semantics for quality requirements and QRTs are defined in [Process Requirements](https://gitlab.pg.innopolis.university/swp_26/swp_26/-/blob/main/Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests).

## Index

| ID | Title | ISO/IEC 25010 characteristic | Sub-characteristic | QRT |
|---|---|---|---|---|
| [QR-01](#qr-01-fridge-data-confidentiality) | Fridge data confidentiality between users | Security | Confidentiality | [QRT-01](quality-requirement-tests.md#qrt-01) |
| [QR-02](#qr-02-kbju-calculation-correctness) | KBJU calculation correctness | Functional Suitability | Functional correctness | [QRT-02](quality-requirement-tests.md#qrt-02) |
| [QR-03](#qr-03-receipt-scan-fault-tolerance) | Receipt scan fault tolerance under LLM/OCR failure | Reliability | Fault tolerance | [QRT-03](quality-requirement-tests.md#qrt-03) |

---

## QR-01: Fridge data confidentiality between users

**Characteristic / sub-characteristic:** Security → Confidentiality

**Scenario:**
> When an **authenticated user A** sends a request (`GET`/`PATCH`/`DELETE`) under **normal operating conditions** for a **fridge item, receipt, profile, or meal record that belongs to user B**, the **FitFood API** shall **refuse to disclose or modify that record** and respond with `404 Not Found`, in **100% of attempts**, never returning another user's data or a different status code that leaks existence/content.

**Rationale:** FitFood stores personal data (pantry contents, body metrics, eaten meals, receipts). A single missing `user_id` filter in any router would let one account read or alter another account's private data. This is the highest-impact risk in the product because it is a data-isolation bug class that is easy to introduce silently when new endpoints are added (e.g. recommendations, receipts) and hard to notice without an explicit cross-user test.

**Traceability:** Related to US-01 (Adding Products to Inventory), US-10 (User Registration and Authentication). Tracked under PBI `[#TBD — link Assignment 4 issue]`.

**Examples already covered by the codebase:**
- [`app/routers/fridge.py`](../app/routers/fridge.py) filters every query by `FridgeItem.user_id == user.id` and returns `404` on mismatch.
- [`tests/test_fridge.py:test_cannot_touch_other_users_item`](../tests/test_fridge.py) asserts this for `DELETE /fridge/items/{id}`.

**Gap to close for Assignment 4:** extend cross-user negative tests to `GET /fridge/items/{id}`, `PATCH /fridge/items/{id}`, `GET /receipts/{id}`, and `POST /receipts/{id}/confirm` (see [QRT-01](quality-requirement-tests.md#qrt-01)).

---

## QR-02: KBJU calculation correctness

**Characteristic / sub-characteristic:** Functional Suitability → Functional correctness

**Scenario:**
> When a **user with a completed profile** submits **sex, height, weight, age, activity level, and goal** under **any supported goal (maintain/lose/gain)**, the **nutrition service** shall **compute BMR using the Mifflin-St Jeor formula, TDEE adjusted by the activity factor, and daily calorie/protein/fat/carb targets adjusted for the goal**, such that **calorie and macro outputs match the documented formulas within 0.5% tolerance, protein falls in the goal-specific g/kg range (maintain 1.6, lose 1.6–2.0, gain 1.8–2.2 g/kg), and the calorie floor of 1200 kcal is never violated**, in **100% of evaluated cases**.

**Rationale:** KBJU targets are the basis of every downstream feature (meal limits, recommendations, deficit/surplus messaging). An incorrect formula or an unenforced safety floor (e.g. recommending <1200 kcal/day) is both a functional defect and a user-safety issue. This logic is pure and side-effect-free, so it is cheap to test exhaustively and a high-value correctness gate.

**Traceability:** Related to US-03 (Daily Macronutrient Tracking), US-04 (Structured Dietary Plans). Tracked under PBI `[#TBD — link Assignment 4 issue]`.

**Examples already covered by the codebase:**
- [`app/services/nutrition.py`](../app/services/nutrition.py) implements `calc_bmr`, `calc_tdee`, `calc_targets`, `rescale_for_calories`.
- [`tests/test_nutrition.py`](../tests/test_nutrition.py) already covers BMR for both sexes, TDEE activity factors, goal-based protein ratios, the 1200 kcal floor, ratio-sum invariant, and proportional rescaling on manual calorie-limit changes.

**Gap to close for Assignment 4:** add a boundary case for the manual calorie-limit override endpoint (rescale must preserve the original protein/fat/carb ratio after a user-set limit change), and wire this suite into CI as a required check (see [QRT-02](quality-requirement-tests.md#qrt-02)).

---

## QR-03: Receipt scan fault tolerance under LLM/OCR failure

**Characteristic / sub-characteristic:** Reliability → Fault tolerance

**Scenario:**
> When the **external OCR or LLM provider** used by receipt scanning **times out, errors, or returns malformed output** while a user is **scanning a receipt under degraded network/provider conditions**, the **FitFood API** shall **catch the failure, leave the user's fridge and any in-progress receipt unchanged, and respond with a structured `502`/`503` error and a user-readable message**, instead of an unhandled `500`, a hung request, or a partially-committed receipt, in **100% of injected failure cases**.

**Rationale:** Receipt scanning (`POST /receipts/scan`, `/receipts/scan-text`) depends on OCR and an LLM call (`app/services/ocr.py`, `app/services/llm.py`). These are external dependencies that fail in production (rate limits, timeouts, provider outages) even though the local mock provider never fails. Today `process_receipt()` has no `try/except` around the OCR/LLM calls, so a provider failure surfaces as a generic unhandled `500` with no clear contract for the frontend to show a useful message. This is a correctness-adjacent reliability gap that becomes real risk as soon as a real `OPENAI_API_KEY`/`LLM_PROVIDER=openai` is configured (`app/config.py`).

**Traceability:** Related to US-01 (Adding Products to Inventory, receipt-scan path), receipt scanning feature in `app/routers/receipts.py`. Tracked under PBI `[#TBD — link Assignment 4 issue]`.

**Examples already covered by the codebase:**
- [`app/services/receipt.py:process_receipt`](../app/services/receipt.py) only calls `db.commit()` after the full parse loop, so today's failure mode does not corrupt committed data — but it also does not return a clean error.
- [`tests/test_receipts.py`](../tests/test_receipts.py) only exercises the success path with the mock provider.

**Gap to close for Assignment 4:** wrap the OCR/LLM calls in `process_receipt` with explicit exception handling that raises a typed `HTTPException(502/503, ...)`, and add a test that monkeypatches `llm.parse_receipt`/`ocr.image_to_text` to raise, asserting the response code, error message, and that no fridge item or receipt row was created (see [QRT-03](quality-requirement-tests.md#qrt-03)).

---

## Notes on selection

Three requirements were selected so that each maps to a **different** ISO/IEC 25010 characteristic and sub-characteristic (Security/Confidentiality, Functional Suitability/Functional correctness, Reliability/Fault tolerance), as required for Assignment 4. They were prioritized over alternatives (e.g. Performance Efficiency/Time behaviour for fridge listing endpoints) because they map to the product's highest current risks: cross-user data leakage, incorrect nutrition math, and brittle handling of the external LLM/OCR dependency that the receipt-scanning feature depends on.
