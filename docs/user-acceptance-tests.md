# User Acceptance Tests

This document defines FitFood's end-user-facing User Acceptance Test (UAT) scenarios. UAT scenarios are **maintained product assets**: stable IDs, once assigned, are never reused for a different scenario. A scenario is retired (status `Retired`) rather than deleted or renumbered if it stops applying.

Each scenario has a stable ID, a `Requirement status` (`Active` / `Retired`), traceability to the user story it verifies, customer-executable steps, and an expected result. Execution results for each Sprint are appended to that scenario's **Execution History** table rather than overwriting prior runs, so pass/fail trends are visible over time.

## Index

| ID | Title | Requirement status | Traced user story |
|---|---|---|---|
| [UAT-01](#uat-01-register-and-set-up-a-goal-profile) | Register and set up a goal profile | Active | [US-10](user-stories.md) |
| [UAT-02](#uat-02-view-the-daily-kbju-calorie-and-macro-breakdown) | View the daily KBJU (calorie and macro) breakdown | Active | [US-03](user-stories.md) |
| [UAT-03](#uat-03-browse-and-filter-the-recipe-catalog) | Browse and filter the recipe catalog | Active | [US-02](user-stories.md) |
| [UAT-04](#uat-04-add-a-recipe-to-todays-meal-plan-manually) | Add a recipe to today's meal plan manually | Active | [US-02](user-stories.md) |
| [UAT-05](#uat-05-generate-todays-meal-plan-automatically-from-the-fridge) | Generate today's meal plan automatically from the fridge | Active | [US-02](user-stories.md), [US-01](user-stories.md) |
| [UAT-06](#uat-06-scan-a-receipt-and-confirm-items-to-the-fridge) | Scan a receipt and confirm items to the fridge | Active | [US-01](user-stories.md) |
| [UAT-07](#uat-07-mark-a-generated-meal-as-eaten-and-verify-daily-log) | Mark a generated meal as eaten and verify daily log | Active | [US-02](user-stories.md), [US-03](user-stories.md) |

---

## UAT-01: Register and set up a goal profile

**Requirement status:** Active

**Scenario:** As a new user, I register an account and complete the profile questionnaire (sex, height, weight, age, activity level, goal), so that the app can compute my personal daily calorie and macro targets.

**Steps:**
1. Open the app and choose "Register".
2. Enter email and password; submit.
3. Complete the profile form: sex, height, weight, age, activity level, goal (e.g. weight loss), and — if the goal is gain/loss — target weight and timeframe.
4. Submit the profile.

**Expected result:** Registration succeeds, the profile is saved, and the app immediately displays a computed daily calorie target consistent with the entered data.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Passed** | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Customer completed registration with test data (goal: weight loss, target weight: 75 kg, 8 meal slots). Field-label colour contrast flagged as a separate UI issue, not a functional failure. |
| Week 5 (Sprint 3 Review) | **Not re-tested** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | Feature assumed stable from Sprint 2; session time focused on new Sprint 3 functionality. |

---

## UAT-02: View the daily KBJU (calorie and macro) breakdown

**Requirement status:** Active

**Scenario:** As a registered user, I open the "Today" view to see how many calories and macros I have consumed and how much remains against my daily target, so that I can track progress toward my goal.

**Steps:**
1. Log in and open the daily/"Today" view.
2. Read the displayed calorie target and the calorie/macro breakdown for the day.

**Expected result:** The daily calorie norm and breakdown are displayed clearly and match the values implied by the user's profile and goal.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Passed** | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Customer confirmed the daily calorie breakdown display is clear and correct. |
| Week 5 (Sprint 3 Review) | **Not re-tested** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | Session focused on new Sprint 3 features; KBJU display assumed stable. |

---

## UAT-03: Browse and filter the recipe catalog

**Requirement status:** Active

**Scenario:** As a registered user, I browse the recipe section and apply filters/sorting, so that I can find a recipe I can cook, prioritizing recipes that match what I already have in my fridge.

**Steps:**
1. Open the recipes section.
2. Browse the listed recipes (with images and macro info per 100 g).
3. Apply a filter or sort option (e.g. smart sort by fridge-ingredient match).

**Expected result:** Recipes load with images, source attribution, and macro data; filters/sort visibly change the displayed order or set of recipes.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Passed** | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Customer explored the recipe browser; smart ingredient-based sort and key-ingredient threshold logic were explained and approved in principle. Positive surprise: customer had not expected a populated recipe browser at this stage. |
| Week 5 (Sprint 3 Review) | **Passed** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | Recipe cards with detail view confirmed working correctly by customer. |

---

## UAT-04: Add a recipe to today's meal plan manually

**Requirement status:** Active

**Scenario:** As a registered user, I manually add a recipe (built-in or user-added) to one of today's meal slots, so that it counts toward my daily calorie/macro tracking without waiting for automatic generation.

**Steps:**
1. From the recipe browser or main view, select a recipe.
2. Add it to a specific meal slot (e.g. lunch) in today's plan.
3. Confirm it appears in the daily plan and the calorie tracker updates.

**Expected result:** The recipe is added to the chosen meal slot and the daily calorie/macro tracker reflects it.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Partially verified** | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Developer confirmed the feature is available and that user-added recipes are eligible too, but the customer had not added fridge products first, so the full add-to-plan flow was not exercised end-to-end. **Re-run with a populated fridge planned for the next session.** |
| Week 5 (Sprint 3 Review) | **Not re-tested** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | Session focused on the automatic generation flow (UAT-05, UAT-07); manual add-to-plan not explicitly re-tested. |

---

## UAT-05: Generate today's meal plan automatically from the fridge

**Requirement status:** Active

**Scenario:** As a registered user with products in my fridge, I ask the app to generate a meal plan for today, so that I get a full set of meals that fit my remaining KBJU targets without manually picking each one.

**Steps:**
1. Ensure the fridge has enough products to compose at least one meal.
2. Trigger meal-plan generation from the main view via the "Generate Meal Plan" button.
3. Review the generated meal(s); accept or request a replacement.

**Expected result:** The app generates as many meals as the fridge contents support (up to the configured meals-per-day target), respecting the user's KBJU goal, and clearly communicates when it cannot generate a full plan.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Not available** (feature not implemented) | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Customer attempted to locate meal-plan generation; not yet built. Customer specified detailed requirements (3-meal MVP default, regeneration, Tinder-style swipe accept/reject UX, user-added recipes included in the pool). Confirmed as the **top priority for the next Sprint**. |
| Week 5 (Sprint 3 Review) | **Partially passed** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | Generation works end-to-end — customer confirmed "I can see that generation is working — that's the most important thing I wanted to see." Output was repetitive with a small product set; no rejection memory yet. Customer tested with a larger product list and observed improved variety. Non-key ingredient threshold (< 50 g) approved. Gaps: no recipe detail link from generated meal, fridge quantity not deducted on "I ate this". |
| Week 6 (Sprint 4 Review) | **Passed** | [`reports/week6/sprint-review-summary.md`](../reports/week6/sprint-review-summary.md) | Generation and Tinder-style swipe UI work perfectly. Customer is highly satisfied with the flow, requesting only minor polishing/adjustments for the recipe generation logic in Sprint 5. |
| Week 7 (Final Transition) | **Passed** | [`reports/week7/README.md`](../reports/week7/README.md) | Customer confirmed final recipe generation logic on the live deployed instance. Minor polishing from Week 6 completed and accepted. |

---

## UAT-06: Scan a receipt and confirm items to the fridge

**Requirement status:** Active

**Scenario:** As a registered user, I upload a photo or file of a grocery receipt so that the app extracts the food items, shows me a confirmation list (with non-food items marked as rejected), and adds the confirmed items to my fridge inventory.

**Traced PBI:** Receipt scanner feature — Sprint 3. Related to [US-01](user-stories.md) (Adding Products to Inventory).

**Steps:**
1. Navigate to the receipt scanner section.
2. Upload a receipt image or text file.
3. Review the confirmation list: food items with their detected categories, non-food items shown as rejected.
4. Confirm the desired items.
5. Verify the confirmed items appear in the fridge inventory with correct categories and estimated expiry dates.

**Expected result:** Food items from the receipt are extracted, categorised, and added to the fridge. Non-food items (soap, tissues, etc.) are excluded. Confirmed items appear in the fridge view with category and expiry date.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 5 (Sprint 3 Review) | **Passed** (file upload path) | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | File upload receipt scanning works end-to-end. For matched products, KBJU data comes from the product database; for unmatched products, LLM estimates KBJU — accepted by customer as a reasonable fallback. Webcam / QR scanning requires HTTPS and could not be tested in the local deployment; marked as partial gap, not a failure of the core flow. |
| Week 6 (Sprint 4 Review) | **Passed with minor follow-up** | [`reports/week6/sprint-review-summary.md`](../reports/week6/sprint-review-summary.md) | The core scanning flow works. However, the customer noted occasional minor inaccuracies and small bugs in the parsed receipt data. Marked for minor polishing in Sprint 5. |
| Week 7 (Final Transition) | **Passed** | [`reports/week7/README.md`](../reports/week7/README.md) | Minor bugs and inaccuracies in receipt parsing reported in Week 6 were fixed in Sprint 5. Customer accepted the final scanning flow. |

---

## UAT-07: Mark a generated meal as eaten and verify daily log

**Requirement status:** Active

**Scenario:** As a registered user who has generated a meal plan, I mark one of the generated meals as eaten, so that it is recorded in my daily KBJU log and — once fully connected — the ingredient quantities are deducted from my fridge.

**Traced PBI:** "I ate this" consumption flow — Sprint 3. Related to [US-02](user-stories.md) (Smart Recipe Recommendations), [US-03](user-stories.md) (Daily Macronutrient Tracking).

**Steps:**
1. Generate a meal plan from the main view (fridge must have products).
2. For one generated meal slot, press "I ate this".
3. Confirm the meal appears in the daily KBJU tracker with the correct calorie/macro values.
4. Check the fridge inventory to verify whether ingredient quantities were deducted.

**Expected result:** The meal is logged in the daily tracker and the KBJU totals update. Fridge quantities for the consumed ingredients are deducted (or the user is prompted to confirm/adjust quantities before deduction).

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 5 (Sprint 3 Review) | **Partially passed** | [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md) | "I ate this" successfully logs the meal to the daily tracker and KBJU totals update correctly. **Gap:** fridge inventory is not yet updated — quantities are not deducted from the fridge after marking a meal as eaten. Customer confirmed this as the top remaining integration gap: "When the user marks a meal as eaten, you should deduct the consumed ingredient quantities from the fridge." Fixing this is Action Point #1 for Sprint 4. |
| Week 6 (Sprint 4 Review) | **Passed** | [`reports/week6/sprint-review-summary.md`](../reports/week6/sprint-review-summary.md) | Customer confirmed all core tests passed successfully. The previous gap regarding fridge inventory deduction is resolved and everything works perfectly. |
| Week 7 (Final Transition) | **Passed** | [`reports/week7/README.md`](../reports/week7/README.md) | Final verification during handover. Customer confirmed the feature works flawlessly on the global deployment without campus-network restrictions. |

---

## Maintenance

If the product stack, screens, or this set of scenarios change in a later Sprint, update this document and the traceability links above instead of leaving stable IDs or execution history stale, per [`Assignment_04.md`](../Assignment_04.md#part-10-conduct-user-acceptance-testing-with-the-customer).
