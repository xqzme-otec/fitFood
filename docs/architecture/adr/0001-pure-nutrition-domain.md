# ADR-0001: Pure, side-effect-free nutrition (KBJU) domain module

- **Status:** Accepted
- **Date:** 2026-07-04
- **Primary quality requirement:** [QR-1 — KBJU calculation correctness](../../quality-requirements.md#qr-1-kbju-calculation-correctness) (Functional Suitability → Functional correctness)

## Context

The KBJU math (BMR via Mifflin–St Jeor, TDEE with an activity factor and a
goal-based deficit/surplus, protein/fat/carb targets, and proportional rescaling
when the user changes their daily calorie limit) is the foundation of the
product: meal limits, remaining-budget messaging, and recipe recommendations all
build on it. A defect here corrupts every downstream feature at once.

We needed this logic to be **exhaustively and cheaply testable** so QR-1 can be
enforced as a hard CI gate on every push.

## Decision

Keep all nutrition calculations in a **pure functional module**
(`app/services/nutrition.py`: `calc_bmr`, `calc_tdee`, `calc_targets`,
`rescale_for_calories`) that takes plain values and returns plain values, with
**no database access, no I/O, and no hidden global state**. Routers and other
services call these functions; the functions never call back into the ORM or
network. `app/services/targets.py` composes them for the profile use-case.

## Consequences

**Positive**
- QR-1 is verified by a fast, deterministic unit test ([QRT-1](../../quality-requirement-tests.md#qrt-1--nutrition-correctness), `tests/test_qrt_nutrition.py`) with no fixtures or DB — it runs on every push/PR.
- The formulas are reusable from any layer without dragging in persistence.
- High cohesion: all nutrition rules live in one place, easy to audit against the reference formulas.

**Negative / trade-offs**
- Callers must load the domain inputs (profile weight, goal, activity) and pass them in explicitly, rather than the calculation fetching them itself.
- Cross-cutting concerns (caching computed targets) must be handled by the caller, not the pure module.

## Relation to other decisions

Complements [ADR-0002](0002-sqlite-default-swappable-postgres.md): because the
math is DB-independent, the choice of datastore does not affect QR-1.
