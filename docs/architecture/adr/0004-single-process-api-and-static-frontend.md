# ADR-0004: A single process serves the API and the static frontend

- **Status:** Accepted
- **Date:** 2026-07-04
- **Primary quality requirement:** [QR-2 — Read-endpoint response time](../../quality-requirements.md#qr-2-read-endpoint-response-time) (Performance Efficiency → Time behaviour); also Maintainability (operability of the deployment).

## Context

FitFood has a FastAPI backend and a Next.js frontend. A common approach is to
deploy them as two services (an API host plus a separate static/SPA host or CDN),
which introduces cross-origin configuration, a second deployable unit, and an
extra network hop between the UI origin and the API.

For a small team shipping to a single VPS for the customer and TA, that
operational overhead is not justified, and the extra hop works against the QR-2
latency budget.

## Decision

Build the Next.js app as a **static export** (`output: 'export'` → `frontend/out`)
and **mount it inside the same FastAPI process** via `StaticFiles(html=True)`,
mounted at `/` **after** the API routers so `/auth`, `/fridge`, … keep priority
(`app/main.py`). The result is **one container, one origin, one port (8000)**
serving both the SPA and the REST API.

## Consequences

**Positive**
- Same-origin UI + API: no CORS round-trips for the user-facing path, and no extra network hop between frontend and backend — directly helps the QR-2 budget.
- One deployable artifact (one Dockerfile/image) to build, ship, and run on the VPS — simpler operability and rollback.
- Local dev, CI, and production exercise the same wiring.

**Negative / trade-offs**
- Frontend and backend release together; the UI cannot be redeployed independently of the API.
- No CDN edge-caching for static assets out of the box; acceptable at current scale but revisit if traffic grows.
- The API process spends some cycles serving static files (mitigated by putting a reverse proxy in front if needed).

## Relation to other decisions

Builds on [ADR-0002](0002-sqlite-default-swappable-postgres.md) (lightweight,
few moving parts) to keep the whole product to one or two containers on the host,
as shown in the [deployment view](../deployment-view/deployment-diagram.puml).
