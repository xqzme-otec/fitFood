# MVP v0 Report — fitFood

## What MVP v0 is

MVP v0 is the **product foundation** for fitFood — a smart-fridge web service. It is a
runnable FastAPI backend plus a no-build single-page frontend that boots with **zero
external keys**: the LLM and OCR layers run in a deterministic mock mode and the database
defaults to SQLite. This proves the architecture end to end (auth → profile → nutrition
targets → diary → fridge → receipt scan → recommendations) before any single user story is
hardened to production quality.

MVP v0 is a foundation, not a finished feature set. Some user stories are represented by
infrastructure that exists but is not yet a complete, polished flow (for example, the
authentication and registration plumbing for **US-10** exists and is exercised by the smoke
check, even though the production-grade login UX is still planned for MVP v1).

## Foundation that is in place

- **Backend:** FastAPI + Pydantic v2, SQLAlchemy 2.0, JWT auth (python-jose) + bcrypt.
- **Frontend:** vanilla-JS SPA (no npm build) served by FastAPI from `frontend/`.
- **Database:** SQLite by default; PostgreSQL via `DATABASE_URL` (Docker Compose ships both
  API + PostgreSQL with one command).
- **ML:** XGBoost + TF-IDF product-category classifier (`notebooks/models/xgb_model.pkl`).
- **LLM / OCR:** deterministic mock implementations so the full pipeline runs offline.
- **Seed data:** 30+ base products, 8 dishes, and ~350 catalog items loaded on first start.

Run instructions (Docker and local) live in the [root README](../../README.md).

## User stories represented by MVP v0

MVP v0 lays the groundwork that the following stories build on (see
[user-stories.md](user-stories.md)):

| Story | How MVP v0 represents it |
|-------|--------------------------|
| **US-10** User registration & authentication | `/auth/register`, `/auth/login` (JWT), `/auth/me` — infrastructure in place and smoke-checked. |
| **US-03** Daily macronutrient tracking | Mifflin–St Jeor BMR → TDEE → goal-adjusted targets; diary summary per day and per meal. |
| **US-01** Adding products to inventory | Manual fridge add (auto category via ML, auto expiry via LLM mock) and receipt scan → confirm flow. |
| **US-08** Inventory search | Catalog search (`/products`, `/dishes`) and grouped fridge view. |
| **US-06** Expiration-date tracking | Expiry date + visual status (soon-expiring / expired) on fridge items. |
| **US-02** Smart recipe recommendations | `/recommendations` scores recipes by fridge coverage and remaining macro targets. |

## Repeatable smoke-check scenario

The foundation is verified by a single, deterministic end-to-end script that runs offline
through FastAPI's `TestClient` (no network, mock LLM/OCR):

```bash
# from the repository root, with dependencies installed
python smoke_test.py
```

See [`smoke_test.py`](../../smoke_test.py). It runs, in order:

1. **Register + login** → obtains a JWT (US-10).
2. **Create profile** (weight-loss goal) and read computed **KБЖУ / macro targets** (US-03).
3. **Read meal slots** and their per-meal calorie limits.
4. **Manual calorie override** → proportional macro recalculation; then **weight update**
   restores the auto-calculation and writes weight history.
5. **Search a product** and **log eaten food** into a meal (US-08, US-03).
6. **Search a dish** and **log a dish** portion.
7. **Day summary** → target vs. consumed vs. remaining KБЖУ.
8. **Fridge add** with auto category + auto expiry, plus **deduplication** check
   (US-01, US-06).
9. **Receipt scan (mock OCR + LLM)** → parsed items with non-food rejected (soap dropped,
   broccoli → vegetables), then **confirm** → items added to fridge (US-01).
10. **Grouped fridge** view by category (US-08).
11. **Recommendations** "for now" scored by fridge coverage + macro deficit (US-02).

A successful run prints `ГОТОВО: сквозной сценарий отработал.` Re-running is safe — the
script recreates tables and re-seeds the catalog before exercising the flow.

## Deployed / runnable artifact & demo

- **Runnable artifact + run instructions:** [root README](../../README.md)
  (`docker compose up --build -d`, then <http://127.0.0.1:8000/> and `/docs`).
- **Video demonstration:**
  <https://drive.google.com/file/d/1ijP0o_c1nPwK6E2ZAou4nDwxQJPRsSLG/view?usp=sharing>
