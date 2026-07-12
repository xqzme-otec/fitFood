# Sprint Review Summary — Week 6 (Sprint 4 / Trial Release)

## Meeting Details

| Field | Value |
|---|---|
| **Sprint** | Sprint 4 / Week 6 |
| **Duration** | ~1 hour 48 minutes (including setup; substantive review ~30 minutes) |
| **Participants** | Customer / Product Owner (1), Scrum Master / Team Lead (1), Developer A (1), additional team members present — **5 team members + customer** |
| **Format** | Video call (Zoom) with screen share; app demonstrated locally by Developer A |
| **Context** | Shortened session — customer had just submitted their thesis; agreed to review product independently after the call and provide written feedback |

---

## Sprint Goal Reviewed

Deliver a trial-ready increment with fully functional LLM-based meal plan generation, fridge quantity deduction on consumption, and readiness for product handover.

---

## Artifacts Demonstrated

- Live application running via Docker Compose (local)
- **Generate Meal Plan** flow — full end-to-end demo
- Generated meal output with LLM-composed dish names and ingredient lists sourced from fridge
- **"I ate this"** confirmation — automatic per-ingredient fridge deduction
- Fridge inventory view showing live quantity changes after meal consumption
- Backlog board (shown briefly at session start)

---

## UAT Execution Summary

> **Note:** Customer explicitly chose not to test the app live during this session due to time constraints. Customer confirmed intent to test independently after the call and provide written feedback. The team demonstrated the full flow on screen.

| Scenario | Outcome | Notes |
|---|---|---|
| Generate a full day meal plan from fridge contents | **Demonstrated — passed** | LLM generated contextually relevant dishes using only fridge ingredients |
| Fridge quantity deduction after eating | **Demonstrated — passed** | 60 g deducted from chicken strips after marking meal as eaten; visible in fridge view |
| View ingredient list for generated meal | **Demonstrated — passed** | Per-ingredient breakdown shown in meal card |
| Meal rejection and alternative suggestion | **Demonstrated — passed** | "No" action triggers alternative generation |
| Customer independent app testing | **Deferred** | Customer will test locally and send written feedback |
| Receipt scanner (webcam) | **Not tested** | Requires HTTPS; still pending deployment |
| Deployment to external server | **Not done** | Developer A reported ongoing deployment issues; running locally only |

---

## Delivered Increment (Sprint 4) — Feature Status

| Feature | Status at Review |
|---|---|
| LLM-based meal plan generation (RAG approach) | **Done** — full day generated from fridge contents |
| Fridge → meal ingredient sourcing | **Done** — all generated dishes use only fridge products |
| Fridge quantity deduction on "I ate this" | **Done** — automatic per-ingredient deduction confirmed live |
| Meal rejection → alternative suggestion | **Done** — "No" triggers re-generation |
| KBZHU tracking in generated meals | **Done** — passed to LLM with fridge ingredients |
| External deployment | **Not done** — local only; deployment issues unresolved |
| Webcam-based receipt scanning (HTTPS) | **Not done** — needs production server |
| Generation speed | **Acceptable for MVP** — noted as slow (120B parameter model); not a blocker |

---

## Customer Feedback

### Positive

- Customer expressed clear surprise and satisfaction with the generation result: "Oh wow — that's impressive!"
- Fridge deduction working end-to-end praised: "That's great — everything is working properly."
- RAG-based approach accepted: custom model training not required if LLM prompt quality is sufficient.
- Overall product satisfaction stated on record: "I'm satisfied with the outcome. I like how it looks, I like that products are added and removed."
- Generation producing contextually accurate dishes from fridge contents acknowledged as a meaningful milestone.

### Outstanding Concerns

1. **Customer originally envisioned a custom-trained model** — accepted the prompt-based LLM approach as valid for the current scope, but noted the original expectation differed.
2. **Deployment not yet complete** — product is only running locally; not yet accessible externally.
3. **Customer has not independently tested the product** — review is based on the demo only; written feedback to follow.

### No New Feature Requests This Session

The customer did not add new requirements during this meeting. All previous requirements (Chestny Znak, diversity, fridge connection) remain the current backlog. Written feedback expected to clarify final Sprint 5 priorities.

---

## Handover Discussion

| Topic | Outcome |
|---|---|
| **Product completeness for handover** | Customer considers the product generally ready, pending personal code review and written feedback |
| **Handover format** | Repository ownership transfer — team adds customer as repository owner |
| **Customer access post-handover** | Customer may manage collaborator access after receiving ownership |
| **Written feedback timing** | Customer to send feedback within 1–2 days (thesis just submitted) |
| **Final week scope** | To be determined after written feedback arrives |

**Customer statement on record:**
> "Overall I'm satisfied with the outcome. I like how it looks, I like that products are added and removed from the fridge, and that at least one generation cycle works end-to-end. That's already demonstrative."

---

## Approval Status

**Sprint 4 increment: Accepted with follow-up items**

- Core generation and fridge deduction features accepted.
- Customer will review code independently and may raise additional items.
- Deployment and webcam scanning remain open.
- Final acceptance deferred until written feedback is received and Sprint 5 work is complete.

**Handover level reached (Week 6):** `Ready for independent use` (pending deployment fix)

**Customer confirmation status:** `Accepted with follow-up items`

---

## Risks Identified

| Risk | Notes |
|---|---|
| External deployment not working | Product only runs locally; customer cannot access it independently until resolved |
| Written feedback not yet received | Sprint 5 scope depends on it; team should follow up if not received within 2 days |
| Customer originally expected a trained model | Managed — LLM prompt approach accepted, but noted for transparency |
| Generation speed (120B model) | Slow but acceptable for MVP; may need optimization for production |
| Webcam scanning blocked by HTTPS requirement | Deployment needed to unblock this scenario |

---

## Action Points for Sprint 5 (Week 7)

| # | Action | Owner | Notes |
|---|---|---|---|
| 1 | Resolve external deployment issues | Developer A | Top priority — customer must be able to access product independently |
| 2 | Transfer repository ownership to customer | Scrum Master | Agreed format: add customer as owner |
| 3 | Await and act on customer's written feedback | All | Expected within 1–2 days; follow up if not received |
| 4 | Address any issues raised in written feedback as Sprint 5 PBIs | Team | Convert to traceable issues before Sprint 5 planning |
| 5 | Finalize Chestny Znak integration or document limitation | Developer B | Carry-over requirement from Week 5 |
| 6 | Complete webcam receipt scanning (needs HTTPS / deployment) | Developer B | Blocked by deployment; unblocks after item 1 |
| 7 | Finalize and tag MVP v3 release | Team | Final course version; must be on protected default branch |
| 8 | Update `docs/customer-handover.md` with final handover status | Scrum Master | Required for Assignment 6 submission |
