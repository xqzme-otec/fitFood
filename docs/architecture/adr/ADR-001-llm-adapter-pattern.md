# ADR-001: LLM Adapter Pattern with Mock Fallback

**Date:** 2026-06-22  
**Status:** Accepted  
**Quality requirements addressed:** [QR-3](../../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) (Reliability / Maturity)

---

## Context

FitFood uses a large language model for two tasks: parsing receipt text into structured food-item lists, and estimating shelf-life for products without an explicit expiry date. LLM calls are inherently non-deterministic, require a paid API key, can fail due to rate limits or network issues, and cannot be exercised in CI without a real key.

The team needed a way to:
1. Run all automated tests (including QRT-3 determinism checks) without any LLM API key.
2. Switch between LLM providers (OpenAI, OpenRouter, Ollama, or local mock) without changing business logic code.
3. Ensure the rest of the receipt pipeline is testable in isolation.

## Decision

Implement a **provider-agnostic LLM adapter** in `app/services/llm.py`. The adapter exposes two functions (`parse_receipt` and `estimate_shelf_life`) whose signatures are fixed regardless of provider. The concrete implementation is selected at startup by reading `settings.llm_provider` (`mock` | `openai` | `openrouter` | `ollama`).

The **mock implementation** is the default: it returns a deterministic, hard-coded response that is independent of the input text and contains no randomness. This makes it suitable for CI, demos, and local development with no API key.

The `receipt` pipeline service (`app/services/receipt.py`) and all routers call only the adapter functions — they never import provider-specific SDKs.

## Consequences

**Positive:**
- CI runs fully without any API keys; QRT-3 (determinism) is always green on the mock path.
- Swapping LLM providers requires changing one environment variable; no code change.
- The mock path is a genuine fallback in production too — if the API key is missing or revoked, the system degrades gracefully rather than crashing.
- Unit and integration tests for the receipt pipeline are stable and fast.

**Negative / trade-offs:**
- The mock always returns the same demo items regardless of input — it does not actually parse the uploaded receipt. Real receipt scanning requires a real API key.
- Provider-specific features (function calling, structured output modes) are not exposed through the adapter interface without extending it.
- The `ollama` path requires a locally running Ollama server, which adds setup complexity for developers who want to test real LLM output without a cloud key.

## Alternatives considered

**Direct OpenAI SDK calls from the receipt router:** Rejected — would make tests depend on network access and valid API keys, and would couple routing code to a specific provider.

**LangChain abstraction layer:** Rejected — adds a large transitive dependency and abstraction overhead for only two LLM call sites; the hand-written adapter is simpler and more auditable.
