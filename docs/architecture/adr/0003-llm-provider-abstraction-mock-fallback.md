# ADR-0003: Provider-abstracted LLM/OCR with a deterministic mock fallback

- **Status:** Accepted
- **Date:** 2026-07-04
- **Primary quality requirement:** [QR-3 — Recommendation determinism & ingredient validity](../../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) (Reliability → Maturity)
- **Also supports:** receipt-scan fault tolerance when the external LLM/OCR is unavailable (candidate QR noted in [quality-requirements.md](../../quality-requirements.md#notes-on-selection)).

## Context

Two features depend on non-deterministic, paid, sometimes-unavailable external
services: receipt parsing (OCR + LLM to keep only food items and infer expiry)
and manual expiry estimation. A headline reliability requirement (QR-3) demands
that the same inputs always yield the same output and that CI never depends on a
live third party or a secret key.

We also integrate a second external service — the FNS receipt API
(`proverkacheka.com`) for QR-based receipts — with the same availability risk.

## Decision

Put every external AI/data dependency behind a **thin service adapter** with a
selectable provider and a **deterministic mock as the default**:

- `app/services/llm.py` — `llm_provider = mock | openai | ollama | openrouter`
  (`app/config.py`). With no API key set, it returns a deterministic mock result.
- `app/services/check_api.py` — the FNS QR lookup returns a deterministic demo
  receipt when `CHECK_TOKEN` is empty.
- Receipt orchestration (`app/services/receipt.py`) and recommendation
  (`app/services/recommendation.py`) never call a vendor SDK directly; they call
  the adapter.

## Consequences

**Positive**
- QR-3 is testable: [QRT-3](../../quality-requirement-tests.md#qrt-3--recommendation-determinism--validity) asserts byte-identical, identically-ordered recommendations because the mock path is deterministic and key-free.
- CI, local dev, and demos work with **no secret and no network** to a paid vendor.
- Swapping or adding a provider (e.g. a self-hosted Ollama on the VPS) is a config change confined to one module.
- Graceful degradation: an outage or a missing key downgrades to mock output instead of a 500.

**Negative / trade-offs**
- The mock must be maintained to stay representative of real provider output, or tests could pass while the real integration drifts.
- A behavioural gap between "mock" and "real" provider is possible and must be exercised manually before a customer-facing release.

## Relation to other decisions

Independent of the datastore ([ADR-0002](0002-sqlite-default-swappable-postgres.md))
and deployment topology ([ADR-0004](0004-single-process-api-and-static-frontend.md));
those decisions keep the mock path equally cheap to run everywhere.
