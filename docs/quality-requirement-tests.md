# Quality Requirement Tests (QRTs)

This document defines the project's measurable quality requirements and the
**automated** tests that verify each one. It follows the course Process
Requirements for what counts as a QRT and the Product Repository Requirements for
where the tests live and how they run in CI.

## What counts as a QRT here

- A QRT is an **automated test** that asserts a *measurable* quality requirement
  (a threshold, an exact value, or an invariant) — not a subjective or manually
  inspected property.
- **Evidence type:** the QRT's evidence is the **test execution result in CI**
  (pass/fail on the protected default branch). A coverage percentage, a passing
  linter, a successful build, or a link-check result is **not** QRT evidence on
  its own — those are separate QA signals documented in
  [`testing.md`](./testing.md).
- Each QRT below lists: an ID, the quality requirement, the measurable
  metric/threshold, the evidence type, the automated test that provides the
  evidence, and the CI job that runs it.

All QRTs are stored in the normal repository test location (`tests/`), carry the
pytest marker `qrt`, and run as part of the standard `pytest` job in CI. They can
be selected on their own with:

```bash
pytest -m qrt
```

---

## QRT-1 — Nutrition correctness

| Field | Value |
|-------|-------|
| **Quality requirement** | The KБЖУ engine computes BMR with the Mifflin–St Jeor formula, and preserves the protein/fat/carb energy ratios when the user manually changes their daily calorie limit. |
| **Measurable metric / threshold** | BMR equals the Mifflin–St Jeor reference value within **±0.1 kcal**; after a manual calorie change the recomputed P/F/C energy ratios stay within **±0.5 percentage points** of the originals; the three ratios sum to 1.0 within the same tolerance. |
| **Evidence type** | Automated test execution in CI. |
| **Automated test** | [`tests/test_qrt_nutrition.py`](../tests/test_qrt_nutrition.py) — `test_bmr_matches_mifflin_st_jeor_reference`, `test_macro_ratios_sum_to_one`, `test_manual_calorie_change_preserves_macro_ratios`. |
| **Code under test** | [`app/services/nutrition.py`](../app/services/nutrition.py) (`calc_bmr`, `calc_targets`, `rescale_for_calories`). |
| **CI job** | `tests` workflow (`.github/workflows/tests.yml`). |

**Why this matters:** the entire product builds on these numbers — daily targets,
per-meal limits, and remaining-budget calculations all derive from BMR and the
macro split. A silent formula or rounding regression would corrupt every
downstream feature, so it is verified against fixed reference values.

---

## QRT-2 — API latency

| Field | Value |
|-------|-------|
| **Quality requirement** | The read endpoints a user hits on every screen respond quickly on the seeded fixture dataset. |
| **Measurable metric / threshold** | `GET /profile/targets`, `GET /diary/summary`, and `GET /recommendations` each return `200` in **under 1000 ms** (best of three timed calls after a warm-up). |
| **Evidence type** | Automated test execution in CI. |
| **Automated test** | [`tests/test_qrt_latency.py`](../tests/test_qrt_latency.py) — `test_endpoint_latency_within_budget` (parametrized over the three endpoints). |
| **Code under test** | The diary/summary, targets, and recommendation request paths (routers + services). |
| **CI job** | `tests` workflow (`.github/workflows/tests.yml`). |

**Why this matters:** these endpoints aggregate diary entries and scan the recipe
catalogue against fridge contents. The 1000 ms budget is intentionally generous:
it is a guardrail against an accidental performance regression (for example an
N+1 query or an unindexed scan) rather than a precise SLA, and the generous bound
plus best-of-three sampling keeps the check stable in CI. The threshold can be
tightened once production latency baselines exist.

---

## QRT-3 — Recommendation determinism & validity

| Field | Value |
|-------|-------|
| **Quality requirement** | For an unchanged user state the recommender returns identical, identically-ordered results (no hidden randomness), and never recommends a dish that is missing a key ingredient. |
| **Measurable metric / threshold** | Two consecutive `GET /recommendations` calls for the same state return **structurally identical JSON** (same items, order, and scores); every recommended dish has **zero** missing ingredients with `grams_needed ≥ KEY_INGREDIENT_GRAMS` (50 g). |
| **Evidence type** | Automated test execution in CI. |
| **Automated test** | [`tests/test_qrt_recommendation_determinism.py`](../tests/test_qrt_recommendation_determinism.py) — `test_recommendations_are_deterministic`, `test_recommended_dishes_have_all_key_ingredients`. |
| **Code under test** | [`app/services/recommendation.py`](../app/services/recommendation.py) (`recommend_dishes` and scoring helpers). |
| **CI job** | `tests` workflow (`.github/workflows/tests.yml`). |

**Why this matters:** recommendations are the product's headline feature.
Determinism makes the feature testable and trustworthy (the same fridge always
yields the same advice), and the ingredient-availability invariant enforces the
core promise — only suggest dishes the user can actually cook with what they have.

---

## Traceability

| QRT | Quality requirement | Test file | CI job |
|-----|---------------------|-----------|--------|
| QRT-1 | Nutrition correctness | `tests/test_qrt_nutrition.py` | `tests` |
| QRT-2 | API latency | `tests/test_qrt_latency.py` | `tests` |
| QRT-3 | Recommendation determinism & validity | `tests/test_qrt_recommendation_determinism.py` | `tests` |

These QRTs are maintained product assets. When the related product code changes,
the QRTs must be kept passing or replaced with documented equivalent-or-stronger
checks. See [`testing.md`](./testing.md) for the full testing and QA-check
strategy.
