# Sprint 3, MVP v3, Retrospective

## What went well
* The technical team successfully delivered the core LLM-based meal plan generation and the receipt scanning API, shifting our focus to complex backend logic as planned.
* The customer was highly satisfied with our ML direction (RAG-adjacent approach) and praised the fact that the generation feature actively uses fridge products.

## What did not go well
* **Deployment and Access Friction:** The customer could not access our university VM from outside the campus network. This led to a slight delay during the Sprint Review because the customer had to clone the repository and run the project locally.
* **Logical UX Gaps:** During the live test, we realized a missing connection in the user flow: clicking "I ate this" logs the meal but does not deduct the used ingredients from the fridge inventory.
* **Recipe Navigation:** There was no direct link to view the full detailed recipe from the generated meal plan card, which disconnected the user experience.

## What the team changed or attempted to change based on the previous Sprint Retrospective, and what results they observed
* **Strict Feature Prioritization (LLM First):** As decided in the Week 4 Retrospective, we shifted our absolute priority to the LLM meal plan generation and the swipe UX. This pivot was highly successful and resulted in a working MVP v3 core feature.
* **External Deployment Verification:** We attempted to improve our UAT accessibility based on the previous sprint's feedback, but the university VM remained blocked from external networks during the call. The intended result was not fully achieved, indicating that our pre-review check needs a stricter protocol and a fallback option.

## Action points
To improve our workflow and prevent the issues observed, we will implement the following concrete process changes for the next Sprint:

1. **Strict Pre-Demo Environment Check:** The Tech Lead will verify the accessibility of the staging VM from an external network (using mobile data or a non-university connection) at least 2 hours before the customer meeting. If the VM is unreachable, the Tech Lead will immediately deploy a lightweight cloud fallback environment.
2. **Inventory Synchronization Requirement:** For any new frontend feature that involves consuming or tracking food, developers must include and test the corresponding backend logic that deducts the exact ingredient quantities from the user's fridge inventory before opening a Pull Request.
3. **Early External API Triage:** Before starting development on the required expiry date tracking, the assigned developer will conduct an early feasibility check of the Chestny Znak API documentation to ensure we are not blocked by external access restrictions.
