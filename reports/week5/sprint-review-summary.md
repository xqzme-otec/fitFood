# Sprint Review Summary — Week 5 (MVP v2)

## Meeting Details

| Field | Value |
|---|---|
| **Sprint** | Sprint 3 / Week 5 |
| **Duration** | ~6 hours total across two recordings (majority is setup/troubleshooting; substantive review ~1.5 hours) |
| **Participants** | Customer / Product Owner (1), Developer A (1), Developer B — receipt scanner (1), Team Lead / Scrum Master (1), Team Member A (1), Team Member B (1) — **5 team members + customer** |
| **Format** | Video call (Zoom); customer deployed locally — university VM not reachable from external network |
| **Recordings** | Two separate recordings combined into one transcript |

---

## Sprint Goal Reviewed

Deliver MVP v2: implement LLM-based meal plan generation, Tinder-style meal selection, receipt scanner, and address UI contrast issues identified in Sprint 2.

---

## Artifacts Demonstrated

- Live application (deployed locally by customer from `main` branch via Docker Compose)
- **Generate Meal Plan** button — new in this Sprint
- Meal plan daily view with generated meals per slot (breakfast, lunch, dinner, snacks)
- "I ate this" log confirmation flow
- Receipt scanner (file upload mode — API-based, not OCR)
- Product database matching with LLM KBZHU fallback for unmatched products
- Recipe database section with card detail view
- Fridge inventory view with product listing

---

## UAT Execution Summary

| Scenario | Outcome | Notes |
|---|---|---|
| Clone and run the app locally from `main` | **Passed** | Customer ran via Docker Compose; VM still not reachable externally |
| Register and complete profile setup | **Not re-tested** | Tested in previous Sprint; assumed stable |
| Generate a meal plan from fridge contents | **Partially passed** | Generation works end-to-end; output is currently repetitive with small product sets |
| Mark a generated meal as eaten | **Partially passed** | Logs to daily tracker; fridge quantity deduction not yet connected |
| View recipe detail for a generated meal | **Failed** | No link from generated meal to full recipe detail page |
| Scan a receipt via file upload | **Passed** | File upload works; webcam requires HTTPS (not yet available locally) |
| Browse recipe database | **Passed** | Recipe cards with detail view working correctly |
| Test diversity / non-repetition of generated meals | **Failed** | Same items reappear; no rejection-memory implemented yet |

---

## Delivered Increment (MVP v2) — Feature Status

| Feature | Status at Review |
|---|---|
| LLM-based meal plan generation | **Done** — functional; needs quality improvements |
| Generate Meal Plan button on main screen | Done |
| Recipe database as generation source | Done |
| LLM new dish generation (beyond recipe DB) | Done |
| Non-key ingredient threshold (< 50 g excluded) | Done |
| Receipt scanner (file upload) | Done |
| Receipt scanner (webcam / QR) | Partial — requires HTTPS environment |
| KBZHU from database on receipt scan | Done |
| LLM KBZHU fallback for unmatched products | Done |
| Tinder-style swipe UX for meal selection | In progress (team working on it) |
| UI contrast improvements | In progress |
| Fridge ↔ meal plan quantity deduction | **Not done** — top remaining gap |
| Recipe detail link from generated meal | **Not done** — flagged during UAT |
| Generation diversity / rejection memory | **Not done** — flagged during UAT |
| Chestny Znak expiry date integration | **Not done** — customer repeated as key requirement |
| OpenFoodFacts integration | Under investigation |
| Manual calorie tracker (free-text entry) | Requested this Sprint; not yet done |
| Docker image size optimization | Flagged; not yet addressed |

---

## Customer Feedback

### Positive

- Customer confirmed that seeing meal plan generation is the most important milestone reached so far: "I can see that generation is working — that's the most important thing I wanted to see."
- Receipt scanner integration acknowledged as complete for the file-upload path.
- LLM KBZHU fallback for unmatched products accepted as a reasonable approach for MVP, with acknowledgment that it will become less critical as the product database grows.
- Overall product structure praised: "The shell, the recipe database, the tracking UI — it's all ready."
- Non-key ingredient threshold (50 g) approved; noted it can be refined later.
- RAG-based generation approach endorsed: "RAG is a good approach — the general direction is right."

### Issues Identified During UAT

1. **Docker image too large** — customer flagged image size as excessive; recommended target of ~200 MB maximum.
2. **Generated meals are repetitive** — small product set contributes, but the system also has no rejection memory.
3. **No recipe detail link from generated meal** — user cannot navigate from a generated meal slot to its full recipe page.
4. **Fridge not connected to meal consumption** — marking a meal as eaten does not deduct quantities from the fridge inventory.
5. **Webcam scanning requires HTTPS** — local setup blocks camera permission; needs production server.
6. **Repository contains non-code assets** (reports, screenshots, assignments) — inflates Docker image; consider separating.

### Requested Changes

1. **Fridge ↔ meal plan integration (top priority):**
   - When a user marks a meal as eaten, deduct the consumed ingredient quantities from the fridge.
   - Ask user to confirm or manually adjust quantities before deducting.
   - For generic recipe ingredients (e.g., "cheese") matched to specific fridge items (e.g., "Russian cheese"), select the best token-match variant. KBZHU difference between variants is acceptable at MVP level.

2. **Generation quality and diversity:**
   - Improve generation to avoid repetition across meals and across days.
   - If a user declines a dish, do not offer it again immediately.
   - Context-awareness: some dishes are meal-type-specific (soup → lunch only; omelette → breakfast only). Consider this in generation ordering.

3. **Recipe detail page from generated meal:**
   - Add a navigation link from each generated meal slot to its full recipe detail card.
   - Consistent with how recipe cards work in the recipe section.

4. **Chestny Znak integration (key requirement):**
   - Unique product identifier from receipt QR code → Chestny Znak API → expiry date (where available).
   - Fallback for unregistered products: LLM prompt — "Given this product stored at ~20°C, how long would it last from the purchase date? Provide an approximate expiry date."
   - Hybrid model: real data from Chestny Znak + LLM estimate = higher coverage.
   - Chestny Znak currently covers ~15–20% of products; coverage expected to grow.

5. **OpenFoodFacts investigation:**
   - Customer suggested exploring OpenFoodFacts for additional product data (including Russian products).
   - Team to do this as a research task; customer noted it may not add expiry date data but could enrich the product database.

6. **Manual calorie tracker:**
   - Add simple free-text entry for users to manually log meals eaten outside the app.
   - Keep it product-level only — no complex input required.

7. **Docker image optimization:**
   - Review Dockerfile and build process; reduce image to ~200 MB target.
   - Consider separating non-code repository content from the deployable image.

### Customer's Two Final Requirements (Explicitly Stated)

> "My last two requirements: complete the meal plan generation quality, and integrate Chestny Znak."

---

## Architecture / Technical Notes from Customer

- **RAG approach for generation:** Semantically chunk recipes, match chunks against fridge product embeddings, feed candidates to LLM for final plan assembly. Prioritize high-calorie key ingredients in matching.
- **Ingredient variant matching:** For MVP, use best token-match to select a specific fridge variant when a recipe lists a generic ingredient. Exact KBZHU difference is negligible at this scale.
- **Quantity tracking:** When a meal is consumed, deduct the recipe-specified weight of each ingredient from the fridge inventory. User can optionally adjust before deduction.
- **Future direction (post-MVP):** Integration with grocery delivery services (e.g., major retailers) — if a fridge item is missing for a desired recipe, suggest purchase via delivery. Product delivery links already exist in the data layer. Customer noted this as a future monetization/co-op opportunity.

---

## Approval Status

**MVP v2 increment: Conditionally accepted** — generation is working and represents meaningful progress. The customer will review the code independently and provide written feedback by the weekend.

**Blocking gaps before MVP v2 is considered complete:**
- Fridge ↔ meal consumption deduction
- Recipe detail navigation from generated meals
- Generation diversity / rejection memory

**Outstanding key requirements (carry to Sprint 4):**
- Chestny Znak expiry date integration
- Meal plan generation quality (RAG-based, fridge-connected, diverse)

---

## Risks Identified

| Risk | Notes |
|---|---|
| Fridge ↔ generation connection not built | Core MVP flow broken — meal consumption doesn't update fridge state |
| Chestny Znak access blocked | Service may be restricted; team needs to research access options |
| Generation repetitiveness | Likely to cause poor user experience in real-world use |
| Docker image bloat | 200 MB+ image; may affect deployment; needs optimization |
| VM not externally accessible | Customer continues to run locally; limits UAT realism |
| Customer availability | Customer has thesis defense next Tuesday; written feedback may arrive mid-week |

---

## Action Points

| # | Action | Owner | Notes |
|---|---|---|---|
| 1 | Connect fridge inventory to meal consumption (deduct quantities when "I ate this") | Developer A | Include confirmation / quantity adjustment step |
| 2 | Add recipe detail navigation from generated meal slots | Developer A / Team | Match UX of recipe card section |
| 3 | Implement generation diversity — rejection memory, no immediate repeats | Developer A | Consider meal-type context (breakfast/lunch/dinner) |
| 4 | Investigate and integrate Chestny Znak expiry date API | Developer B | Research access options; implement hybrid model with LLM fallback |
| 5 | Explore OpenFoodFacts for additional product data | Developer A | Research task; evaluate whether expiry or KBZHU data is useful |
| 6 | Add manual calorie / meal entry (free-text, product-level) | Team | Simple input; don't over-engineer |
| 7 | Optimize Docker image size toward ~200 MB target | Team | Review Dockerfile; separate non-code assets from image build |
| 8 | Enable webcam receipt scanning (HTTPS required) | Developer B | Needs production server or ngrok for testing |
| 9 | Customer to send written code review and feedback | Customer | Target: by the weekend; thesis defense on Tuesday |
| 10 | Team to implement Tinder-style swipe UX for meal selection | Developer A / Team | Carry-over from Sprint 2 — complete this Sprint |

---

## Resulting Product Backlog Updates

- **Fridge ↔ generation deduction** added as highest-priority PBI for Sprint 4.
- **Recipe detail from generated meal** added as a new PBI.
- **Generation diversity / rejection memory** added as a new PBI.
- **Chestny Znak integration** carried forward as a key requirement PBI.
- **Docker image optimization** added as a technical debt PBI.
- **Manual calorie tracker** added as a new user-requested PBI.
- **OpenFoodFacts investigation** added as a research spike.
- **Tinder-style swipe UX** remains open; moved to Sprint 4 if not completed this week.
