# Customer Meeting Summary — Week 2

## Meeting Details

| Field        | Value                                      |
|--------------|--------------------------------------------|
| **Date**     | 14 June 2026                               |
| **Time**     | 16:24 (local)                              |
| **Format**   | Video call                                 |
| **Participants** | @emil (Customer), @timur (Team Lead / Scrum Master), @speaker3 (Developer), @speaker4 (Developer) |

## Recording & Transcript Consent

Before the meeting started, the team obtained the following permissions from the customer:

| Permission | Decision |
|---|---|
| Recording the call | ✅ Granted |
| Sharing sanitised transcript privately with instructors | ✅ Granted |
| Publishing sanitised transcript in the public repository | ✅ Granted |

> **Note on user-story numbering:** this summary uses the **stable IDs** from
> [`user-stories.md`](user-stories.md#note-on-user-story-id-numbering) (e.g. the synonym-recognition
> story is **US-07**). The [transcript](customer-meeting-transcript.md) instead numbers
> stories by the order they were discussed live; see the mapping table linked above to
> reconcile the two.

## Artifacts Demonstrated

1. **User stories** ([`reports/week2/user-stories.md`](user-stories.md)) — US-01 through US-10 (stable IDs) with MoSCoW priorities presented and discussed.
2. **MVP v0 local build** — live walkthrough covering US-10 (account & profile), US-01 (product add via QR scan and manual search), US-03 (macro tracking), US-06 (expiry date tracking), US-08 (inventory search).

## Discussion Points

### User Stories Review

The team presented all 10 user stories with MoSCoW priorities. The customer reviewed and approved the stories, with one change: the synonym-recognition story (stable ID **US-07**) was raised from Could Have to Should Have, because the customer judged semantic/vector search models to make it more tractable than the team initially estimated.

### MVP v0 Demo Feedback

- Overall impression: **"Looks solid"** / **"Everything looks good so far."**
- Expiry-date tracking (showing days remaining per product) confirmed as **implemented** (not mocked) using average shelf-life data — positively received.
- The XGBoost classifier achieving ~91–92% categorisation accuracy was noted.
- UI aesthetics (current pink colour scheme) flagged by the developer as a placeholder — redesign planned.
- Bread incorrectly classified as "grains" due to missing bakery category — acknowledged as a one-line fix.
- Receipt scanning by photo not yet implemented (QR-code only at MVP v0 stage) — noted.
- Recipes section not yet populated — noted.

### Scheduling Request

The customer requested that future calls be scheduled on **weekdays** rather than weekends.

## Decisions

| # | Decision |
|---|---|
| 1 | User stories US-01 through US-10 approved. |
| 2 | US-07 (synonym recognition) priority raised from Could Have to Should Have, at the customer's request. |
| 3 | Future meetings to be scheduled on weekdays. |

## Customer Approvals

| Item | Status |
|---|---|
| User stories (US-01 – US-10) | ✅ Approved |
| MoSCoW priorities | ✅ Approved |
| Initial proposed MVP v1 scope | ✅ Approved |
| MIT-licensed public development model (written consent) | ✅ Obtained before repository creation |

## Action Points

| # | Owner | Action |
|---|---|---|
| 1 | @speaker3 | Record a screen walkthrough of the user flow and send to @emil. |
| 2 | @speaker3 | Fix bread/bakery category in the XGBoost training data. |
| 3 | @speaker3 | Parse and populate recipe data. |
| 4 | @speaker3 | Implement photo-based receipt scanning (currently QR-code only). |
| 5 | @speaker3 | Redesign UI away from placeholder pink colour scheme. |
| 6 | Team | Schedule next customer meeting on a weekday. |

## Resulting Changes

| Change | Detail |
|---|---|
| US-07 priority raised | Synonym recognition (referred to as "US-08" live during the call — see [transcript](customer-meeting-transcript.md) [08:49]–[10:28]) changed from Could Have to Should Have, at the customer's request. Reflected in [`user-stories.md`](user-stories.md). |

No other changes to user stories, priorities, or prototype artifacts resulted from this meeting.

## Risks Identified

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| VM subscription not yet active (IT dept. delay) | Medium | High (blocks deployment) | Awaiting IT response; consider alternative hosting temporarily. |
| XGBoost classifier ~8–9% error rate | Low | Medium | Expand training categories (e.g. bakery); add manual correction UI. |
| Photo receipt scanning not yet started | Medium | Medium | Prioritise as part of US-02 implementation for MVP v1. |


