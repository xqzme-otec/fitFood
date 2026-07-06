# Changelog

All notable changes to **FitFood — Smart Fridge** are documented in this file.
The format follows the team CHANGELOG template and can be automated with [git-cliff](https://git-cliff.org/).

## [Unreleased]

## [2.0.0] - 2026-06-28

MVP v2 turns FitFood into a single-container product: a rewritten Next.js SPA,
a full recipe catalog, and a "log it straight to the diary" flow — plus a quality
gate (QRTs, coverage, security scans) so the team can ship with confidence.

### Added

- FITFOOD-2001 MINOR Recipe catalog with filters (breakfast, lunch, dinner, snacks, desserts, healthy food) backed by a seeded dataset.
- FITFOOD-2002 MINOR "Add straight to diary" flow — product search modal lets you add to the diary (meal slot, quantity, live КБЖУ preview) or the fridge.
- FITFOOD-2003 MINOR Quality Requirement Tests (QRT-1/2/3) for KБЖУ correctness, read-endpoint response time, and recommendation determinism under the `qrt` pytest marker.
- FITFOOD-2004 MINOR Test-coverage gate (`pytest-cov`, ≥30% per critical module) and a `qa` CI workflow running Bandit and pip-audit.

### Changed

- FITFOOD-2005 MINOR Frontend rewritten as a TypeScript Next.js + MUI SPA, statically exported and served by FastAPI from `frontend/out` for a single-container deploy.
- FITFOOD-2006 MINOR Redesigned dashboard, sidebar, fridge page (category chips, expiry-status cards, stats tiles), and home search.

### Fixed

- FITFOOD-2007 PATCH Realigned fridge category emoji map with the merged `FridgeCategory` enum, fixing an app import crash in CI.
- FITFOOD-2008 PATCH Corrected `.gitignore` configuration issues.

### Security

- FITFOOD-2009 PATCH Bumped `pydantic-settings` 2.14.1 → 2.14.2 to resolve GHSA-4xgf-cpjx-pc3j, surfaced by the new pip-audit scan.

## [1.0.0] - 2026-06-20

MVP v1 delivers the core smart-fridge loop: register, track your daily macros,
and get recipe recommendations from what's actually in your fridge — with inventory
that updates itself as you eat.

### Added

- FITFOOD-1001 MINOR User registration and authentication.
- FITFOOD-1002 MINOR Smart recipe recommendations based on fridge inventory.
- FITFOOD-1003 MINOR Daily macronutrient tracking dashboard.
- FITFOOD-1004 MINOR Automatic inventory deduction when meals are logged.
- FITFOOD-1005 MINOR Full test suite with 62 isolated SQLite tests.
- FITFOOD-1006 PATCH GitHub Actions CI/CD workflow and extended Pull Request / Issue templates.
