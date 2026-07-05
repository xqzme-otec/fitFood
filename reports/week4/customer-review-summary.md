# Customer Review Summary — Sprint Review & UAT Session (Week 4)

## Meeting Details

| Field | Value |
|---|---|
| **Date** | Week 4 Sprint Review (exact date redacted) |
| **Duration** | ~34 minutes |
| **Participants** | Customer / Product Owner (1), Developer A (1), Developer B (1), Team Lead / Scrum Master (1), Team Member A (1), Team Member B (1, appears as Speaker 05 / Speaker 06 due to transcription split) — 5 team members + customer |
| **Format** | Video call (Zoom) with screen share; customer ran app locally due to university VM being unreachable from external networks |

---

## Sprint Goal Reviewed

Deliver a working product increment with a functional recipe database, fridge inventory management, user profile and calorie calculation, and the groundwork for meal plan generation.

---

## Artifacts Demonstrated

- Live application (run locally by the customer — university VM not reachable from outside the campus network)
- User registration and goal-setting flow with animated entry screen
- Daily calorie target calculation based on user profile
- Product section with KBZHU data (per 100 g)
- Recipe browser with smart ingredient-based sort and filters
- "Add your own recipe" feature
- Meal plan daily view with calorie tracker
- Recipe attribution display (source credited on each card)
- Older mobile UI prototype shown by customer as a UX reference (Tinder-style recipe swipe mechanic)

---

## UAT Execution Summary

The customer executed the following scenarios during the session. Scenario IDs are the stable
IDs maintained in [`docs/user-acceptance-tests.md`](../../docs/user-acceptance-tests.md); see
that document for full scenario steps and execution history across Sprints.

| ID | Scenario | Outcome | Notes |
|---|---|---|---|
| [UAT-01](../../docs/user-acceptance-tests.md#uat-01-register-and-set-up-a-goal-profile) | Register a new account and complete the profile form | **Passed** | Customer completed registration successfully with test data (goal: weight loss, target weight: 75 kg) |
| [UAT-03](../../docs/user-acceptance-tests.md#uat-03-browse-and-filter-the-recipe-catalog) | Browse the recipe database and apply filters | **Passed** | Customer explored recipes; smart sort by fridge ingredients explained and demonstrated |
| [UAT-04](../../docs/user-acceptance-tests.md#uat-04-add-a-recipe-to-todays-meal-plan-manually) | Add a meal to the daily plan manually | **Partially verified** | Feature confirmed as available; customer did not add products first so full flow not exercised |
| [UAT-02](../../docs/user-acceptance-tests.md#uat-02-view-the-daily-kbju-calorie-and-macro-breakdown) | View daily calorie breakdown | **Passed** | Customer confirmed the daily norm display is clear and correct |
| [UAT-05](../../docs/user-acceptance-tests.md#uat-05-generate-todays-meal-plan-automatically-from-the-fridge) | Attempt to use meal plan generation | **Not available** | Feature not yet implemented; flagged as the top remaining priority |

---

## Delivered Increment Discussed

| Feature | Status at Review |
|---|---|
| User registration and profile / goal setup | Done |
| Daily calorie target calculation | Done |
| Product browser with KBZHU data | Done |
| Recipe browser (built-in database) | Done |
| Recipe images with source attribution | Done |
| Smart ingredient-based recipe sort | Done |
| Recipe filters | Done |
| "Add your own recipe" | Done |
| Manual meal addition to daily plan | Done |
| Daily calorie tracker view | Done |
| Receipt scanner | Not done (in progress) |
| Expiry date parsing from receipts | Not done (in progress) |
| Meal plan generation (LLM-based) | Not done — top remaining priority |
| Swipe-based meal selection UX | Not done — requested for generation feature |

---

## Quality Requirements & Automated Test Evidence

**Not covered live during the call** — the team's quality requirements were finalized after
this session. They were instead shared with and discussed with the customer over Telegram
following the call:

- The team shared [`docs/quality-requirements.md`](../../docs/quality-requirements.md)
  (QR-1 KBJU calculation correctness, QR-2 read-endpoint response time, QR-3 recommendation
  determinism & ingredient validity) and asked the customer to confirm them.
- The team showed that the corresponding CI gates pass: the `tests` workflow (pytest,
  including the QRT-1/2/3 tests in
  [`docs/quality-requirement-tests.md`](../../docs/quality-requirement-tests.md), coverage,
  and the critical-module coverage threshold) and the `qa` workflow (Bandit + pip-audit).
- The team and customer discussed which of these gates must remain mandatory going forward.

**Outcome:** the customer approved QR-1/2/3 and the current CI gates as-is, with no
requested changes.

**Carried forward to the next Sprint Review:** present this same evidence live (QR-1/2/3,
passing CI runs, the critical-module coverage table in
[`docs/testing.md`](../../docs/testing.md)) so it is part of the recorded Sprint Review
going forward, not only the post-call Telegram thread.

---

## Customer Feedback

### Positive

- Customer expressed genuine surprise and satisfaction with the overall look and feel: "Clean, simple, not over-engineered — that's good."
- Registration flow and animated entry screen praised as visually appealing.
- Daily calorie calculation display was well-received.
- Recipe browser with images was a positive surprise: "I wasn't expecting to see it — but it looks great."
- Recipe image attribution was acknowledged as correct practice.
- Smart ingredient sort logic (tokenization, key-ingredient threshold) was explained and approved in principle.
- Customer confirmed overall progress is visible and better than their prior mental model of the product.

### Issues and Observations

1. **UI contrast issue:** Green and grey in input fields contrast poorly — field labels are difficult to read. Works better on dark backgrounds.
2. **VM not externally accessible:** Customer could not reach the university-hosted deployment from outside the campus network. Had to run locally.

### Requested Changes and Priority Direction

1. **Meal plan generation (LLM-based) — highest priority:**
   - Generate a full daily meal plan from products the user has in the fridge.
   - Must respect the user's KBZHU targets and stated goal (weight loss → calorie deficit; muscle gain → surplus).
   - For MVP: target three meals per day as the minimum. If ingredients only support two, offer two and tell the user.
   - Allow regeneration — user can reject a suggested meal and request a replacement.
   - Implement a **Tinder-style swipe mechanic**: show recipe cards one at a time, swipe right to accept, left to reject. If fewer than three meals are accepted, offer "Regenerate" or "Finish."
   - User-added recipes must be eligible to appear in the generated plan alongside built-in recipes.
   - A background job (e.g., every 30 minutes) may pre-generate suggestions to reduce perceived wait time — acceptable for MVP despite LLM token cost.

2. **Receipt scanner + expiry date parsing:** Still required but treated as the foundation layer — simpler than generation. Filter out non-food items (e.g., cleaning products) during parsing.

3. **Main menu recommendations:** Optional for now. A static daily recommendation could serve as an engagement hook, but this decision should be deferred until real user feedback is available.

4. **Future (not MVP):** Integration with grocery delivery services — customer noted existing product delivery links in the data layer as a promising foundation for future affiliate/co-op monetization.

---

## Commercial / Roadmap Notes from Customer

- Generation feature has a natural monetization angle: one free generation per day, additional generations available via subscription tiers.
- Family and multi-user support is out of scope for the current MVP but noted as a future direction.
- App should motivate users to keep their fridge inventory updated — limited ingredients leading to fewer generated meals is itself a motivator.

---

## Approval Status

**Sprint increment: Accepted** — customer confirmed the current state looks good and is a solid foundation. No features rejected or rolled back.

**Meal plan generation: Not yet approved** — not implemented; will be reviewed at the next Sprint Review.

---

## Risks Identified

| Risk | Notes |
|---|---|
| Meal plan generation not yet started | Most complex remaining feature; must be the primary focus of the next Sprint |
| VM not reachable from external networks | Customer had to run locally; deployment accessibility must be improved |
| LLM token cost for background generation | Noted as acceptable for MVP; needs monitoring at scale |
| UI contrast issue in input fields | Low effort to fix; should be addressed before next UAT |
| Edge case: empty or near-empty fridge | User can't generate a plan — app must handle gracefully with a clear message |
| Quality requirements/QRT evidence approved over Telegram, not in a recorded session | Customer approved QR-1/2/3 and current CI gates as-is post-call, but this approval is not yet captured in a recorded Sprint Review; present it live next time (see "Quality Requirements & Automated Test Evidence" above) |

---

## Action Points

| # | Action | Owner | Notes |
|---|---|---|---|
| 1 | Implement LLM-based meal plan generation with three-meal default | Dev team | Top Sprint priority; use existing recipe DB + fridge inventory + user goals |
| 2 | Implement Tinder-style swipe UX for meal selection and regeneration | Dev team | Customer showed reference prototype; swipe right = keep, swipe left = replace |
| 3 | Include user-added recipes in generation pool | Dev team | Already stored; must be wired into the generation pipeline |
| 4 | Fix input field label contrast (green vs. grey) | Dev team | Accessibility/readability issue flagged by customer during UAT |
| 5 | Resolve external VM accessibility | Dev team / infrastructure | Customer could not connect from outside campus network |
| 6 | Complete receipt scanner + expiry date parsing | Dev team | Foundation for inventory population; needed before generation works well |
| 7 | Implement graceful handling for empty/sparse fridge | Dev team | Inform user when generation is not possible; motivate them to add products |
| 8 | Present QR-1/2/3, QRT CI evidence, and critical-module coverage live at the next Sprint Review | Dev team | Already shared and approved over Telegram post-call; needs to be captured in a recorded session too |

---

## Resulting Product Backlog Updates

- **Meal plan generation** confirmed as the top-priority PBI for the next Sprint — to be broken into sub-tasks: LLM prompt design, KBZHU filtering logic, recipe-to-goal matching, regeneration/swipe UX.
- **Input field contrast fix** to be added as a bug/UX improvement PBI.
- **VM external access** to be investigated as an infrastructure task.
- **Grocery delivery integration** noted for future backlog (not current Sprint scope).
- **Subscription / generation tiers** noted as a future commercial PBI.
- No existing PBIs removed or rejected as a result of this review.
