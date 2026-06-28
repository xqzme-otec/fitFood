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

---

## UAT-05: Generate today's meal plan automatically from the fridge

**Requirement status:** Active

**Scenario:** As a registered user with products in my fridge, I ask the app to generate a meal plan for today, so that I get a full set of meals that fit my remaining KBJU targets without manually picking each one.

**Steps:**
1. Ensure the fridge has enough products to compose at least one meal.
2. Trigger meal-plan generation from the main view.
3. Review the generated meal(s); accept or request a replacement.

**Expected result:** The app generates as many meals as the fridge contents support (up to the configured meals-per-day target), respecting the user's KBJU goal, and clearly communicates when it cannot generate a full plan.

**Execution History:**

| Week / Sprint | Result | Evidence | Notes |
|---|---|---|---|
| Week 4 (Sprint 2 Review) | **Not available** (feature not implemented) | [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md#uat-execution-summary) | Customer attempted to locate meal-plan generation; not yet built. Customer specified detailed requirements (3-meal MVP default, regeneration, Tinder-style swipe accept/reject UX, user-added recipes included in the pool). Confirmed as the **top priority for the next Sprint**. |

---

## Maintenance

If the product stack, screens, or this set of scenarios change in a later Sprint, update this document and the traceability links above instead of leaving stable IDs or execution history stale, per [`Assignment_04.md`](../Assignment_04.md#part-10-conduct-user-acceptance-testing-with-the-customer).
