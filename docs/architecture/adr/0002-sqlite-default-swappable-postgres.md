# ADR-0002: SQLite by default, environment-swappable to PostgreSQL

- **Status:** Accepted
- **Date:** 2026-07-04
- **Primary quality requirement:** [QR-2 — Read-endpoint response time](../../quality-requirements.md#qr-2-read-endpoint-response-time) (Performance Efficiency → Time behaviour)

## Context

The team, the CI runner, and the TA all need to bring the product up quickly and
reproducibly. The original design brief assumed PostgreSQL + Alembic, but
requiring a running database server for every checkout, test run, and demo adds
setup friction and a moving part that can make CI flaky and latency numbers
noisy.

QR-2 asserts that the hot read endpoints (`/profile/targets`, `/diary/summary`,
`/recommendations`) stay under a 1000 ms budget on the seeded fixture dataset.
That guardrail is only meaningful if the datastore used for the measurement is
consistent and available on every run.

## Decision

Access the database exclusively through **SQLAlchemy**, with the connection
chosen at runtime from `DATABASE_URL`:

- **Default = embedded SQLite** (`sqlite:///fitfood.db`) so the app and the test
  suite run with zero external services (`app/config.py`).
- **Production/compose = PostgreSQL** by setting `DATABASE_URL`
  (`docker-compose.yml` injects `postgresql+psycopg2://…@db:5432/fitfood`).

No raw SQL tied to one dialect; schema is created from the ORM models at
startup (`Base.metadata.create_all` + `ensure_columns`).

## Consequences

**Positive**
- QR-2's latency test ([QRT-2](../../quality-requirement-tests.md#qrt-2--api-latency)) runs against a stable, dependency-free SQLite fixture — no DB server jitter in the 1000 ms budget.
- One-command startup for developers, CI, and graders; the same code path serves both engines.
- Migration to Postgres for the customer-facing deployment is a config change, not a code change.

**Negative / trade-offs**
- SQLite and PostgreSQL differ (types, concurrency, constraints); behaviour must be kept within the common SQLAlchemy subset, and prod-only issues could escape the SQLite test path.
- `create_all` + `ensure_columns` is a lightweight substitute for full migrations; a dedicated migration tool (Alembic) may be needed as the schema grows.

## Relation to other decisions

Enables [ADR-0004](0004-single-process-api-and-static-frontend.md) (single
lightweight process) and is orthogonal to
[ADR-0001](0001-pure-nutrition-domain.md).
