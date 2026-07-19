# Sprint Review Summary — Week 7 (Sprint 5 / Final Handover / MVP v3)

## Meeting Details

| Field | Value |
|---|---|
| **Sprint** | Sprint 5 / Week 7 — Final |
| **Duration** | ~1 hour (short by design — handover confirmation session) |
| **Participants** | Customer / Product Owner (1), Scrum Master / Team Lead (1), Developer A (1), additional team members present — **5 team members + customer** |
| **Format** | Video call (Zoom); no screen share demo — customer had already reviewed the product independently |
| **Purpose** | Formal handover confirmation, documentation review acknowledgement, acceptance on record |

---

## Sprint Goal Reviewed

Complete final Sprint 5 maintenance (onboarding fix, regression testing), confirm handover readiness, obtain customer acceptance on record, and transfer repository ownership.

---

## Artifacts Reviewed

- `docs/customer-handover.md` — opened and acknowledged by customer during the call; full read deferred to asynchronous review (by Sunday)
- `README.md` — acknowledged
- Live application — customer confirmed independent use prior to the call; no new demo needed
- Source code — customer reviewed internally prior to the call

---

## UAT / Product Trial Summary

| Item | Status | Notes |
|---|---|---|
| Customer independently ran the application | **Done** | Customer confirmed: "I ran it and explored it — I clicked through and looked at the internals" |
| Application deployed on customer side | **Done** | Customer confirmed no technical issues |
| Customer reviewed source code | **Done** | Customer read through the implementation independently |
| Customer reviewed `docs/customer-handover.md` | **In progress** | Opened during call; full confirmation expected by Sunday |
| Customer reviewed `README.md` | **Acknowledged** | Not read in detail during call; confirmation pending |
| Written acceptance confirmation (Telegram) | **Pending** | Customer agreed to send by Sunday |

---

## Sprint 5 Changes Delivered

| Change | Status |
|---|---|
| Onboarding / registration bug fix | **Done** — Developer A resolved registration flow issues |
| Regression testing | **Done** — team verified existing functionality |
| No new features added | Intentional — Sprint 5 focused on stability and handover preparation |

---

## Customer Acceptance

### Acceptance Statement (on record)

**Question:** "In your opinion, is the project ready for final handover?"
**Customer response:** *"Yes, definitely."*

**Question:** "From the three options — Accepted / Accepted with future ideas / Not accepted — which applies?"
**Customer response:** *"Accepted — with some future ideas."*

### Clarification on Model Training

Customer asked whether the team had trained or fine-tuned a custom model. Team confirmed: no fine-tuning was done — the system uses direct API requests to a hosted LLM. Customer accepted this approach without objection.

---

## Handover Status

| Field | Value |
|---|---|
| **Handover level reached** | `Independently used by customer` |
| **Customer confirmation status** | `Accepted with follow-up items` |
| **Repository transfer** | Agreed in principle; timing to be coordinated after the call |
| **Written confirmation** | Customer to send Telegram message by Sunday confirming acceptance |
| **Follow-up items** | Future ideas noted by customer (not blocking acceptance) |

### Explanation

The customer independently ran the application, explored the interface, and reviewed the source code prior to this call. The application was confirmed to be working on the customer's side with no technical issues. The customer explicitly stated the project is ready for final handover and chose "Accepted with future ideas" as the confirmation status. Written Telegram confirmation was requested and agreed to by Sunday.

The "future ideas" referenced by the customer are non-blocking enhancements beyond the MVP scope (e.g., custom model training, grocery delivery integration, family/multi-user support) noted in previous sessions. None of these were required for MVP v3 acceptance.

---

## Remaining Actions (Post-Course)

| # | Action | Owner | Notes |
|---|---|---|---|
| 1 | Customer to send written Telegram confirmation of acceptance | Customer | Expected by Sunday |
| 2 | Customer to review `docs/customer-handover.md` and `README.md` in full | Customer | Asynchronous; by Sunday |
| 3 | Transfer repository ownership to customer | Scrum Master | Timing to be coordinated; customer to become owner |
| 4 | Customer may independently review and modify source code | Customer | Customer expressed interest in reviewing implementation details |

---

## Final Product Status Summary

The product delivered as MVP v3 includes:

- User registration and goal-based profile setup
- Daily calorie target calculation (KBZHU)
- Product inventory (fridge) management with quantity tracking
- Product search backed by grocery retailer dataset with LLM KBZHU fallback
- Recipe database (built-in + user-added recipes)
- LLM-based meal plan generation using fridge contents and candidate recipes
- Fridge quantity deduction on meal consumption
- Meal rejection and alternative suggestion flow
- Receipt scanner (file upload; API-based, not OCR)
- Onboarding / registration flow (fixed in Sprint 5)

**Known limitations / future work (non-blocking):**
- Webcam-based receipt scanning requires HTTPS production deployment
- Chestny Znak expiry date integration not completed (LLM estimation used as fallback)
- Generation speed depends on hosted model response time (120B parameter model)
- Single-user MVP only; family/multi-user support deferred to future development
- Custom model training not implemented; prompt-based LLM approach used instead

---

## Course Completion Note

This was the final Sprint Review of the course. The customer confirmed acceptance of MVP v3 on record. Repository ownership transfer agreed. The product is handed over in a working state with documentation in `docs/customer-handover.md`.
