# Changelog

## [Unreleased]

## [2.0.0] - 2026-06-28

### Added

- Recipe catalog with filters: new `recipes` router/service/models backed by a large seeded dataset (breakfast, lunch, dinner, snacks, desserts, healthy food).
- "Add straight to diary" flow: product search modal now lets you choose between adding to the diary (meal slot, quantity, live KБЖУ preview) or to the fridge.

### Changed

- Frontend fully rewritten as a TypeScript Next.js + MUI SPA (replacing the vanilla JS frontend), statically exported and served by FastAPI from `frontend/out` for a single-container deploy.
- Redesigned dashboard, sidebar (interactive user card, decluttered nav, removed Diary item), fridge page (category chips, expiry-status cards, stats tiles), and home search.

### Fixed

- Realigned fridge category emoji map with the merged `FridgeCategory` enum, fixing an app import crash in CI.
- Corrected `.gitignore` configuration issues.

### Security

- Bumped `pydantic-settings` 2.14.1 → 2.14.2 to resolve GHSA-4xgf-cpjx-pc3j, surfaced by the new `pip-audit` dependency scan.

### Technical

- Defined three Quality Requirements (QR-1 KBJU calculation correctness, QR-2 read-endpoint response time, QR-3 recommendation determinism & ingredient validity), each verified by an automated Quality Requirement Test (QRT-1/2/3) under the `qrt` pytest marker; documented in [`docs/quality-requirements.md`](docs/quality-requirements.md) and [`docs/quality-requirement-tests.md`](docs/quality-requirement-tests.md).
- Expanded the automated test suite (recommendation scoring, classifier fallback, manual-macro recalculation, and a receipt→fridge→recommendation integration test) and documented the testing strategy in [`docs/testing.md`](docs/testing.md).
- Added test-coverage measurement (`pytest-cov`) with a per-critical-module ≥30% gate ([`scripts/check_critical_coverage.py`](scripts/check_critical_coverage.py)) wired into the `tests` CI workflow.
- Added a `qa` CI workflow running Bandit (static security analysis) and pip-audit (dependency CVE audit).
- Updated [`docs/definition-of-done.md`](docs/definition-of-done.md) with explicit QRT, critical-module coverage, and testing-evidence gates.

## [1.0.0] - 2026-06-20

### Added

- User Registration and Authentication logic.
- Smart Recipe Recommendations based on fridge inventory.
- Daily Macronutrient Tracking dashboard.
- Automatic inventory deduction when meals are logged.
- Full test suite with 62 isolated SQLite tests.

### Technical

- Configured GitHub Actions CI/CD workflow.
- Added extended Pull Request and Issue templates.
