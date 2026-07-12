# Agent Guide — FitFood

This file describes how AI coding agents (Claude Code, Copilot, etc.) should work with this repository. Read it before making any changes.

## What this repository is

FitFood is a FastAPI web application with a vanilla-JS SPA frontend. The backend handles authentication, macronutrient calculation, a food diary, fridge inventory, receipt scanning (OCR + LLM), and recipe recommendations. See [README.md](README.md) for a full feature and stack overview.

## Repository layout

```
app/                  # FastAPI application (backend)
  config.py           # pydantic-settings, env vars
  database.py         # SQLAlchemy engine, session, Base
  main.py             # app factory, lifespan hooks
  core/               # security helpers, dependency injection
  models/             # SQLAlchemy ORM models
  schemas/            # Pydantic request/response schemas
  services/           # business logic (nutrition, llm, ocr, fridge, receipt, recommendation)
  routers/            # API route handlers
  data/seed.py        # DB seeding on first start
frontend/             # Vanilla JS SPA (no build step)
  js/app.js           # router + all screens
  js/api.js           # JWT-authenticated API client
  js/ui.js            # shared UI components
docs/                 # Maintained documentation (MkDocs)
notebooks/models/     # Trained ML artefacts (XGBoost, TF-IDF, label encoder)
data/                 # CSV product catalogues used for DB seeding
tests/                # pytest test suite
scripts/              # CI helper scripts
```

## How to verify changes

Always run the test suite before committing:

```bash
pytest
python scripts/check_critical_coverage.py
```

For security and dependency checks:

```bash
bandit -r app -ll
pip-audit -r requirements.txt
```

For a full end-to-end smoke test:

```bash
python smoke_test.py
```

Tests use an in-memory SQLite database and `LLM_PROVIDER=mock`. No external services or API keys are needed.

## Safe areas to modify

- `app/routers/` — adding or fixing route handlers
- `app/services/` — business logic changes
- `app/schemas/` — Pydantic schema updates
- `frontend/js/` — UI and API client changes
- `docs/` — documentation updates
- `tests/` — adding or updating tests

## Handle with care

- `app/models/` — ORM model changes affect the DB schema. There are no Alembic migrations; schema is created from models on first start. Test in a fresh environment after model changes.
- `app/data/seed.py` and `data/*.csv` — changes here affect the seeded product catalogue for all new deployments.
- `notebooks/models/` — ML artefacts are pre-trained. Do not overwrite `xgb_model.pkl`, `tfidf_vectorizer.pkl`, or `label_encoder.pkl` unless you have retrained and validated a replacement.
- `docker-compose.yml` and `Dockerfile` — changes affect the production deployment. Verify with `docker compose up --build` locally.

## Do not do

- Do not push directly to `main`. All changes must go through a PR with at least one reviewer approval and passing CI.
- Do not commit `.env` files, API keys, or passwords.
- Do not commit the SQLite database file (`fitfood.db`) — it is in `.gitignore`.
- Do not delete or rename migrations that have already been applied in production.
- Do not modify `requirements.txt` without running `pip-audit -r requirements.txt` to check for known CVEs.

## LLM and OCR integration

By default the app runs in mock mode (`LLM_PROVIDER=mock`). Mock implementations live in `app/services/llm.py` and `app/services/ocr.py`. To switch to real OpenAI calls, set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in the environment — no code changes are required.

## Key documentation

| Document | Purpose |
| --- | --- |
| [docs/architecture/README.md](docs/architecture/README.md) | Component, sequence, and deployment diagrams + ADRs |
| [docs/development-process.md](docs/development-process.md) | Git workflow, branching, PR conventions |
| [docs/quality-requirements.md](docs/quality-requirements.md) | Measurable quality requirements |
| [docs/quality-requirement-tests.md](docs/quality-requirement-tests.md) | Automated QRT descriptions |
| [docs/testing.md](docs/testing.md) | Test strategy and coverage targets |
| [docs/customer-handover.md](docs/customer-handover.md) | Current handover state and transition scope |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, branching, PR checklist, DoD |
