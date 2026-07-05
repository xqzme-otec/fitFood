# FitFood — Architecture Documentation

**Last updated:** 2026-07-05 | **Sprint:** 3 (Assignment 5)

This document is a maintained project asset. Update it when the product scope, architecture, deployment model, or key technology choices change.

Diagram sources (Mermaid `.mmd`) live in the subdirectories alongside this file and are also embedded below so they render natively on GitHub and in VS Code.

---

## Table of Contents

- [Overview](#overview)
- [Static View — Component Diagram](#static-view--component-diagram)
- [Dynamic View — Sequence Diagram](#dynamic-view--sequence-diagram)
- [Deployment View — Deployment Diagram](#deployment-view--deployment-diagram)
- [Architecture Decisions (ADRs)](#architecture-decisions-adrs)
- [Quality Requirements and Architecture](#quality-requirements-and-architecture)

---

## Overview

FitFood is a web application that helps users track pantry products, monitor expiry dates, log meals, calculate personalised daily macronutrient targets (KBJU), and receive smart recipe recommendations based on their fridge contents.

The system is built as a single **FastAPI** application that serves both the REST API and a statically-exported **Next.js** frontend. Business logic is cleanly separated into a service layer; data persistence uses **SQLAlchemy ORM** over **SQLite** (development) or **PostgreSQL** (production). Receipt scanning integrates an **OCR adapter**, an **LLM adapter** (OpenAI / OpenRouter / mock), and a trained **XGBoost ML classifier** for product category prediction.

---

## Static View — Component Diagram

**Source:** [static-view/component-diagram.mmd](static-view/component-diagram.mmd)

![Component Diagram](images/component-diagram.svg)

### What the diagram shows

The component diagram divides the system into five layers:

| Layer | Contents |
|---|---|
| **Client** | Browser running the Next.js SPA; makes HTTP calls to the FastAPI API |
| **Routers** | Nine FastAPI routers (`auth`, `profile`, `products`, `fridge`, `meals`, `recipes`, `receipts`, `recommendations`, `rations`) — each maps HTTP verbs to service calls |
| **Services** | Pure Python modules containing all domain logic (`nutrition`, `targets`, `fridge`, `recommendation`, `receipt`, `classifier`, `llm`, `ocr`, `check_api`, `naming`) |
| **Core** | Cross-cutting concerns: `security` (JWT encode/decode) and `deps` (DB session injection, auth guard) |
| **Models / ORM** | SQLAlchemy declarative models (`User`, `Profile`, `FridgeItem`, `Meal`, `Recipe`, `Receipt`, `Product`) backed by the database |

External dependencies:

- **LLM Provider** (OpenAI / OpenRouter / Ollama) — contacted by the `llm` service over HTTPS; falls back to a deterministic mock when no key is configured.
- **ФНС Check API** (proverkacheka.com) — contacted by `check_api` to fetch real receipt contents from a QR code; optional.
- **ML model files** (`xgb_model.pkl`, `tfidf_vectorizer.pkl`, `label_encoder.pkl`, `keywords.pkl`) — loaded locally by the `classifier` service; keyword fallback used when files are absent.

### Coupling, cohesion, and maintainability

**Cohesion is high within each service.** Each service module has a single, well-defined responsibility (e.g. `nutrition.py` only contains BMR / KBJU math). Services do not import each other except through explicit composition in routers or in the `receipt` pipeline service.

**Coupling between layers is low and one-directional.** Routers depend on services; services depend on ORM models and external adapters; models depend only on SQLAlchemy. There are no circular imports.

**The main maintainability risk is the receipt pipeline**, which coordinates four services (`ocr` → `llm` → `classifier` → `naming`). Changes to the LLM prompt schema or the OCR output format propagate through this pipeline. This is mitigated by the adapter pattern used in both `ocr.py` and `llm.py` — the real implementation can be swapped by changing a single config variable (`LLM_PROVIDER`) without touching the pipeline logic.

**Quality requirements particularly supported or constrained by this structure:**

- **QR-1 (KBJU correctness):** The `nutrition` service is pure Python with no I/O, making it easy to unit-test exhaustively — directly supported by the service-layer isolation.
- **QR-2 (API latency):** All three measured endpoints (`/profile/targets`, `/diary/summary`, `/recommendations`) delegate to services that do a fixed number of ORM queries; no N+1 paths exist at the router layer. Constrained: if the recipe catalogue grows large, `recommendation.py` performs an in-process scan of all recipes — see [ADR-003](adr/ADR-003-recommendation-engine.md).
- **QR-3 (Recommendation determinism):** Because `recommendation.py` is a pure function over ORM data with no random state, determinism is a structural property. Constrained: any future addition of LLM-based ranking would break determinism unless explicitly seeded.

---

## Dynamic View — Sequence Diagram

**Source:** [dynamic-view/sequence-receipt-scan.mmd](dynamic-view/sequence-receipt-scan.mmd)

![Sequence Diagram — Receipt Scan](images/sequence-receipt-scan.svg)

### What the diagram shows

The sequence diagram traces the **receipt scan and fridge update flow** — the most complex multi-component interaction in FitFood:

1. **Upload** — The user uploads a receipt image (or text). The `receipts` router delegates to `receipt.process_receipt`.
2. **OCR** — The `ocr` adapter extracts raw text from the image (mock returns a demo receipt; a real implementation would call pytesseract or a cloud Vision API).
3. **LLM parsing** — The `llm` adapter sends the raw text to the configured LLM provider with a prompt asking it to extract only food items, including quantity and estimated shelf life. The response is a structured JSON list.
4. **Classification & normalisation** — For each parsed item, the `classifier` service predicts the fridge category using the XGBoost model (with keyword fallback at low confidence), and the `naming` service normalises the product name.
5. **Pending save** — The assembled receipt (items list with categories) is saved to the database with `status=pending` and returned to the user as a confirmation list. Non-food items rejected by the LLM appear alongside food items with a `rejected` flag so the user can review the filter.
6. **Confirmation** — The user reviews the list, unticks unwanted items, and submits. The confirmed items are inserted as `FridgeItem` rows and the receipt is marked `confirmed`.

### Why this scenario is architecturally important

This flow is the **highest-integration path** in the product and is the only place where all five external concerns are exercised together: HTTP file upload, OCR, external LLM API, local ML inference, and database writes. It is also the primary **quality and reliability risk**:

- LLM output is non-deterministic and can be malformed JSON — the `receipt` service must handle parse failures gracefully (relevant to a future QR-4 on fault tolerance).
- The OCR → LLM boundary is where most latency lives — relevant to **QR-2** if the endpoint is ever moved to a synchronous measured path.
- The classification step enforces that non-food items (soap, tissues) are never silently added to the fridge — directly supporting the product's core promise.

### Architecture decisions and integration boundaries illustrated

- The **LLM adapter pattern** ([ADR-001](adr/ADR-001-llm-adapter-pattern.md)) is visible: the router and pipeline code are independent of the concrete LLM provider — only `llm.py` changes when switching from mock to OpenAI.
- The **two-phase confirmation UX** (pending → confirmed) decouples the LLM parsing step from the fridge mutation, allowing the user to correct AI mistakes without touching the database.
- The **local ML classifier** ([ADR-002](adr/ADR-002-local-ml-classifier.md)) fires synchronously in step 4 — no network call, no latency spike, and fully deterministic.

---

## Deployment View — Deployment Diagram

**Source:** [deployment-view/deployment-diagram.mmd](deployment-view/deployment-diagram.mmd)

![Deployment Diagram](images/deployment-diagram.svg)

### What the diagram shows

The deployment diagram describes two environments:

**Production (University VM 10.93.26.202)**

| Node | Contents |
|---|---|
| `app` Docker container | Uvicorn / FastAPI process + Next.js static export files + ML model pkl files |
| `db` Docker container | PostgreSQL 16 with a named `pgdata` volume for persistence |
| Docker internal network | `app` reaches `db` by container name (`db:5432`) |

Configuration is injected via `docker-compose.yml` environment variables (`DATABASE_URL`, `SECRET_KEY`, `LLM_PROVIDER`, `OPENAI_API_KEY`, `CHECK_TOKEN`). Secrets are never committed; they are set in the VM environment or a `.env` file outside the repository.

**Local development**

A plain Python virtualenv runs Uvicorn with `--reload`; SQLite is used as the database (no Docker required). The `LLM_PROVIDER=mock` default means the product is fully functional without any API keys.

### Why this deployment model was chosen

- **Single-container app** keeps the deployment simple and eliminates inter-service networking complexity for the current team size and load profile.
- **PostgreSQL via Docker Compose** gives production-grade persistence with a persistent volume while remaining one-command to start (`docker compose up --build`).
- **Static frontend served by FastAPI** avoids a separate web server (nginx) or CDN at the cost of making the Python process also handle static file serving — acceptable at current load but worth revisiting if traffic grows.
- **SQLite for local dev** means any team member can run the full product with zero infrastructure dependencies.

### Deployment constraints and operational considerations

- **External access:** The VM is only reachable on the campus network. Customers outside the campus must clone the repository and run locally. This is the most pressing deployment risk (tracked in Sprint backlog).
- **Secrets management:** `SECRET_KEY`, `OPENAI_API_KEY`, and `CHECK_TOKEN` must be set in the VM environment before starting the stack. The `.env.example` file documents required variables.
- **LLM provider availability:** If `LLM_PROVIDER=openai` and the API key is revoked or rate-limited, receipt scanning degrades to the mock (non-AI) path — a known graceful-degradation behaviour, not a hard failure.
- **ML model files:** The pkl files are committed to the repository (`notebooks/models/`). They must be present in the Docker image at build time. The classifier silently falls back to keyword matching if files are missing.

---

## Architecture Decisions (ADRs)

Maintained ADRs are stored in [adr/](adr/). Each ADR is linked to the quality requirement(s) it addresses.

| ID | Title | Status | QR |
|---|---|---|---|
| [ADR-001](adr/ADR-001-llm-adapter-pattern.md) | LLM Adapter Pattern with Mock Fallback | Accepted | QR-3 |
| [ADR-002](adr/ADR-002-local-ml-classifier.md) | Local XGBoost Classifier for Product Categories | Accepted | QR-2, QR-3 |
| [ADR-003](adr/ADR-003-recommendation-engine.md) | In-Process Recipe Matching without Vector DB | Accepted | QR-2, QR-3 |

### How the architecture and decisions fit together

The three ADRs collectively define the **AI/ML integration strategy**:

- ADR-001 ensures the LLM integration is swappable and testable — the mock mode is what makes QRT-3 (determinism) possible in CI without a real LLM key.
- ADR-002 keeps product classification fast and offline — the XGBoost model fires in under 5 ms, contributing to QR-2 latency compliance on the recommendations endpoint.
- ADR-003 keeps recipe matching purely in-process and deterministic — directly enabling QR-3 (no randomness in recommendations) and avoiding the operational overhead of a vector store.

Together they establish a **"local-first AI" principle**: ML inference and recipe matching run locally, while the LLM (which is inherently non-deterministic and network-dependent) is used only for the least latency-sensitive step (receipt parsing) and is always replaceable with a mock.

---

## Quality Requirements and Architecture

| Quality requirement | ISO/IEC 25010 | Supporting structural decision |
|---|---|---|
| [QR-1: KBJU calculation correctness](../quality-requirements.md#qr-1-kbju-calculation-correctness) | Functional Suitability / Functional correctness | Pure, stateless `nutrition` service — no I/O, fully unit-testable |
| [QR-2: Read-endpoint response time](../quality-requirements.md#qr-2-read-endpoint-response-time) | Performance Efficiency / Time behaviour | ADR-002 (local ML, no network), ADR-003 (in-process matching, fixed query count) |
| [QR-3: Recommendation determinism & ingredient validity](../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) | Reliability / Maturity | ADR-001 (mock fallback, no LLM in rec path), ADR-003 (pure function, no random state) |
