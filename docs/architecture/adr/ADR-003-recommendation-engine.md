# ADR-003: In-Process Recipe Matching without Vector DB

**Date:** 2026-06-22  
**Status:** Accepted  
**Quality requirements addressed:** [QR-2](../../quality-requirements.md#qr-2-read-endpoint-response-time) (Performance Efficiency / Time behaviour), [QR-3](../../quality-requirements.md#qr-3-recommendation-determinism--ingredient-validity) (Reliability / Maturity)

---

## Context

FitFood's headline feature is recommending recipes that can be cooked from the user's fridge contents while fitting their remaining daily macronutrient budget. This requires:

1. Loading the user's current fridge items.
2. Loading the recipe catalogue (dishes with ingredient lists and nutritional values).
3. Scoring each recipe for fridge ingredient coverage and KBJU suitability.
4. Returning a deterministically-ordered ranked list.

The team considered whether to use a vector similarity search (e.g. pgvector, FAISS) or an LLM to generate recommendations dynamically.

The recipe catalogue currently contains hundreds of dishes; growth to a few thousand is expected but not more.

## Decision

Implement recipe matching as a **pure in-process Python function** (`app/services/recommendation.py`, function `recommend_dishes`):

1. Load all recipes and the user's fridge items from the database in a fixed number of ORM queries.
2. For each recipe, compute a coverage score (fraction of key ingredients available in the fridge) and a KBJU suitability score (how well the recipe's macros fill the remaining daily targets).
3. Sort deterministically by a weighted combination of these scores (coverage first, then KBJU fit, then recipe ID as a tiebreaker).
4. Return the top-N results.

No external service, vector index, or LLM call is involved in the recommendation path.

## Consequences

**Positive:**
- Response time is bounded by a fixed number of ORM queries plus in-process iteration — no network hops in the hot path. This directly supports QR-2 (< 1000 ms budget across all measured read endpoints).
- Output is fully deterministic for the same fridge and diary state (the sort key is stable and uses recipe ID as a tiebreaker) — directly supports QR-3 (determinism requirement).
- No additional infrastructure (vector DB, embedding service) to deploy or maintain.
- The matching logic is easy to audit, test, and extend with new scoring signals.

**Negative / trade-offs:**
- The function iterates over all recipes in Python. If the recipe catalogue grows to tens of thousands of dishes, this will become a bottleneck. At that scale, a pre-filtered SQL query or a vector index would be needed.
- Ingredient matching is exact (by product name equality, normalised by `naming.py`). Semantic similarity (e.g. "куриное филе" ≈ "грудка куриная") is not captured — this can cause false negatives in fridge coverage scoring.
- The lack of LLM-based personalisation means the recommendations do not adapt to user taste preferences beyond the KBJU budget. This is the customer's top requested improvement for Sprint 3 (see [customer-review-summary.md](../../../reports/week4/customer-review-summary.md)).

## Alternatives considered

**pgvector / FAISS semantic search:** Rejected for the current scale. Adds infrastructure dependency, requires embedding generation for all recipes (time and cost), and would make the determinism guarantee in QR-3 harder to enforce (embedding models can change, distances are floats).

**LLM-generated recommendations:** Rejected for the primary recommendation path — non-deterministic (violates QR-3), adds latency (violates QR-2), and costs tokens on every page load. Remains a candidate for a "personalised meal plan generation" feature (Sprint 3 backlog item) where the LLM is used once per session, not per request.

**SQL-level scoring with stored procedures:** Considered. Would move the scoring loop into the database and allow indexing. Rejected for now — the added SQL complexity and loss of testability outweigh the performance benefit at the current catalogue size. Can be revisited in a later Sprint if profiling shows the Python loop as a bottleneck.
