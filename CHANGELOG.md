# Changelog
## [Unreleased] - 2026-06-24

### Added

- Recipe catalog with filters: new `recipes` router/service/models backed by a large seeded dataset (breakfast, lunch, dinner, snacks, desserts, healthy food).
- "Add straight to diary" flow: product search modal now lets you choose between adding to the diary (meal slot, quantity, live KБЖУ preview) or to the fridge.

### Changed

- Frontend fully rewritten as a TypeScript Next.js + MUI SPA (replacing the vanilla JS frontend), statically exported and served by FastAPI from `frontend/out` for a single-container deploy.
- Redesigned dashboard, sidebar (interactive user card, decluttered nav, removed Diary item), fridge page (category chips, expiry-status cards, stats tiles), and home search.

### Fixed

- Realigned fridge category emoji map with the merged `FridgeCategory` enum, fixing an app import crash in CI.

### Security

- Bumped `pydantic-settings` 2.14.1 → 2.14.2 to resolve GHSA-4xgf-cpjx-pc3j, surfaced by the new `pip-audit` dependency scan.

### Technical

- Added automated Quality Requirement Tests (nutrition accuracy, API latency, recommendation determinism) under the `qrt` pytest marker; documented in [`docs/quality-requirement-tests.md`](docs/quality-requirement-tests.md).
- Expanded the automated test suite (recommendation scoring, classifier fallback, manual-macro recalculation, and a receipt→fridge→recommendation integration test) and documented the testing strategy in [`docs/testing.md`](docs/testing.md).
- Added test-coverage measurement (`pytest-cov`) with a per-critical-module ≥30% gate ([`scripts/check_critical_coverage.py`](scripts/check_critical_coverage.py)) wired into the `tests` CI workflow.
- Added a `qa` CI workflow running Bandit (static security analysis) and pip-audit (dependency CVE audit).

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



## [0.2.0] - 2026-06-27

### Added
- Recipe catalog with filters and a large dataset.
- Direct meal logging feature with live nutrient preview.
- Automated quality requirement tests and CI/CD pipeline.
- Comprehensive unit and integration test suite.

### Changed
- Frontend fully rewritten for better maintainability.
- Redesigned dashboard, fridge page, and navigation.
- Updated documentation on quality requirements and testing strategy.

### Fixed
- Fridge category mapping and infrastructure configuration issues.
