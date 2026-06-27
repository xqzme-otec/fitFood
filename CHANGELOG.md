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
