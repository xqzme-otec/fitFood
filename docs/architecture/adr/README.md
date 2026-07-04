# Architecture Decision Records (ADRs)

This directory records the significant architecture decisions behind FitFood. Each
ADR captures the context, the decision, and its consequences, and names the
[quality requirement(s)](../../quality-requirements.md) it primarily supports.

ADRs are immutable once accepted: to change a decision, add a new ADR that
supersedes the old one rather than editing history.

| ADR | Title | Status | Primary quality requirement |
|---|---|---|---|
| [0001](0001-pure-nutrition-domain.md) | Pure, side-effect-free nutrition (KBJU) domain module | Accepted | [QR-1](../../quality-requirements.md#qr-1-kbju-calculation-correctness) |
| [0002](0002-sqlite-default-swappable-postgres.md) | SQLite by default, environment-swappable to PostgreSQL | Accepted | [QR-2](../../quality-requirements.md#qr-2-read-endpoint-response-time) |
| [0003](0003-llm-provider-abstraction-mock-fallback.md) | Provider-abstracted LLM/OCR with deterministic mock fallback | Accepted | [QR-3](../../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) |
| [0004](0004-single-process-api-and-static-frontend.md) | Single process serves the API and the static frontend | Accepted | [QR-2](../../quality-requirements.md#qr-2-read-endpoint-response-time) |
