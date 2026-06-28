# Testing & QA Strategy

This document describes how FitFood is tested and which automated quality checks
run in CI. It complements [`quality-requirement-tests.md`](./quality-requirement-tests.md)
(the measurable Quality Requirement Tests) and follows the course Process
Requirements for evidence-type distinctions.

## Evidence types (what each check proves)

Different automated checks provide different kinds of evidence and are **not**
interchangeable:

| Check | Evidence it provides |
|-------|----------------------|
| **Unit tests** | A function/module behaves correctly in isolation. |
| **Integration tests** | Components behave correctly together (API ↔ services ↔ DB). |
| **Quality Requirement Tests (QRTs)** | A *measurable quality requirement* holds (see `quality-requirement-tests.md`). |
| **Coverage** | How much code the tests exercise — a completeness signal, **not** proof of correctness. |
| **Bandit** | Static security analysis of our source. |
| **pip-audit** | Dependencies have no *known* published CVEs. |
| **Lychee** | Documentation links resolve (link health only). |

Coverage numbers, a passing linter, a green build, or a link check are **not**
QRT evidence on their own.

## How to run everything locally

```bash
pip install -r requirements.txt -r requirements-dev.txt

pytest                                   # full suite (unit + integration + QRTs)
pytest -m qrt                            # only the Quality Requirement Tests
pytest --cov=app --cov-report=term-missing   # with coverage
python scripts/check_critical_coverage.py    # per-critical-module 30% gate (needs coverage.xml)

bandit -r app -ll                        # additional QA check: security static analysis
pip-audit -r requirements.txt            # additional QA check: dependency CVE audit
```

Tests are fully isolated: [`tests/conftest.py`](../tests/conftest.py) points the
app at a throwaway SQLite database and forces `LLM_PROVIDER=mock`, so no
PostgreSQL, network, or API keys are needed and runs are deterministic.

## Test layout

All tests live in [`tests/`](../tests), the normal location for this stack.

### Unit tests (logic in isolation)
- [`test_nutrition.py`](../tests/test_nutrition.py) — BMR/TDEE/target maths.
- [`test_recommendation_service.py`](../tests/test_recommendation_service.py) — token
  matching, dominant-macro selection, portion sizing, dish scoring, fallback combos.
- [`test_classifier.py`](../tests/test_classifier.py) — title cleaning, keyword
  fallback (works with the ML model absent), shop→fridge category mapping.
- [`test_fridge_service.py`](../tests/test_fridge_service.py) — expiry-status logic.
- [`test_emoji.py`](../tests/test_emoji.py) — emoji selection.

### Integration tests (components together, via the API)
- [`test_auth.py`](../tests/test_auth.py), [`test_profile.py`](../tests/test_profile.py),
  [`test_targets.py`](../tests/test_targets.py) — auth, profile, manual macro/meal-slot recalculation.
- [`test_fridge.py`](../tests/test_fridge.py), [`test_diary.py`](../tests/test_diary.py),
  [`test_dishes.py`](../tests/test_dishes.py) — fridge, diary, dish CRUD.
- [`test_receipts.py`](../tests/test_receipts.py) — receipt scan → confirm → fridge.
- [`test_recommendations.py`](../tests/test_recommendations.py) — recommendation endpoint.
- [`test_receipt_to_recommendation.py`](../tests/test_receipt_to_recommendation.py) —
  **end-to-end interaction**: scan receipt → stock fridge → drive recommendations.

### Quality Requirement Tests (marked `qrt`)
- [`test_qrt_nutrition.py`](../tests/test_qrt_nutrition.py) — QRT-1.
- [`test_qrt_latency.py`](../tests/test_qrt_latency.py) — QRT-2.
- [`test_qrt_recommendation_determinism.py`](../tests/test_qrt_recommendation_determinism.py) — QRT-3.

## Critical modules & coverage

These modules carry the core product logic. Each must keep **≥ 30% line
coverage** (enforced per-module by
[`scripts/check_critical_coverage.py`](../scripts/check_critical_coverage.py),
which parses `coverage.xml`). Current measured coverage:

| Critical module | Line coverage |
|-----------------|---------------|
| `app/services/nutrition.py` | 97% |
| `app/services/targets.py` | 86% |
| `app/services/recommendation.py` | 95% |
| `app/services/classifier.py` | 90% |
| `app/services/receipt.py` | 90% |
| `app/services/fridge.py` | 97% |

Global repository coverage is ~94%. The lowest-covered areas are the **real**
(non-mock) OCR/LLM provider stubs in `ocr.py`/`llm.py`, which are intentionally
not exercised because the test suite runs in mock mode (no external API).

## Additional QA check (Assignment 4)

The required QA suite already includes unit/integration tests, coverage, QRTs and
Lychee link checking. The **additional** QA check is deliberately distinct from
all of those — and distinct from any link checking, which cannot satisfy this
requirement.

**Options considered**

| Option | Why considered | Decision |
|--------|----------------|----------|
| **Bandit + pip-audit (security)** | Python web app handling auth (JWT, password hashing) + many third-party deps. | **Selected.** |
| Cyclomatic-complexity gate (radon/xenon) | Recommendation/nutrition logic could grow complex. | Deferred — maintainability, not a current risk; tests already cover the logic. |
| Mutation testing (mutmut) | Stronger test-quality signal. | Deferred — slow and noisy to configure for the value at this stage. |

**Selected check:** **Bandit** (static security analysis of `app/`) **+ pip-audit**
(known-CVE audit of `requirements.txt`).

- **Risk addressed:** insecure code patterns (e.g. weak crypto, unsafe
  deserialization, hardcoded secrets) and shipping dependencies with published
  vulnerabilities.
- **Why it matters here:** FitFood authenticates users (JWT + bcrypt), loads a
  pickled ML model, parses untrusted receipt text, and pulls in a large
  dependency tree (FastAPI, SQLAlchemy, XGBoost, scikit-learn, python-jose).
  A vulnerable transitive dependency or an insecure pattern is a realistic,
  high-impact risk for an app that stores personal health and account data.
- **Value demonstrated:** on first run pip-audit flagged
  `pydantic-settings 2.14.1` (GHSA-4xgf-cpjx-pc3j); it was bumped to `2.14.2`.
- **Where it runs in CI:** the `qa` workflow
  ([`.github/workflows/qa.yml`](../.github/workflows/qa.yml)) on every push and PR.
  Bandit runs at medium-and-higher severity (`-ll`) to keep the signal
  actionable; pip-audit audits the pinned `requirements.txt`.

**Limitations / deferred QA work**
- Bandit performs static analysis only and cannot find logic or auth-flow flaws;
  it runs at medium+ severity, so low-severity informational findings are not
  gated.
- pip-audit only covers *known, published* CVEs in the advisory databases.
- Complexity/maintainability gating and mutation testing remain deferred (above).

## Maintenance

Tests and QA checks added here are maintained product assets. When product code
changes, keep them passing or replace them with documented equivalent-or-stronger
coverage. The critical-module list in `scripts/check_critical_coverage.py` and the
table above must stay in sync.
