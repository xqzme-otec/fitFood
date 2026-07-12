# Sprint Retrospective — Week 6 (Sprint 4)

## What the team changed or attempted to change based on the previous Sprint Retrospective, and what results they observed
Based on previous sprint adjustments, the team aimed to strictly divide responsibilities to ensure both technical delivery and process management were handled effectively. The result was highly successful: the technical sub-team maintained a stable and productive coding pace, while the management/analytics sub-team completely took over customer communication, meeting facilitation, and documentation (such as the handover document and UATs). This parallel workflow prevented bottlenecks and ensured all assignment requirements were met on time.

## What went well
* **Customer Communication & Documentation:** The preparation for the transition-readiness meeting was excellent. The Scrum Master and management sub-team handled the presentation, documentation, and customer relations perfectly.
* **Core Technical Delivery:** The technical team successfully implemented the most complex backend logic: the LLM-based meal plan generation and the automatic fridge deduction ("I ate this" feature).
* **Customer Satisfaction:** The customer was highly impressed with the LLM generation ("Oh wow — that's impressive!") and confirmed that the product is demonstrative, generally ready for handover, and that the team did a very good job overall.

## What did not go well
* **External Deployment Issues:** The application is currently only running locally via Docker Compose. The external deployment to the production server failed or is facing unresolved issues.
* **Blocked Features due to Infrastructure:** Because the external deployment is incomplete and lacks HTTPS, the webcam-based receipt scanning feature is blocked and could not be tested properly.
* **Deferred Live Testing:** Because the customer was extremely busy (thesis submission), live independent UAT testing was deferred. The team now has to wait 1-2 days for written feedback, which slightly delays finalizing the exact scope for Sprint 5.

## Action points
1. **Prioritize External Deployment:** The technical team must make fixing the external server deployment (with HTTPS) their #1 priority for the beginning of Sprint 5. This is critical to unblock the webcam scanner and allow the customer to test the app independently.
2. **Backlog Finalization based on Feedback:** As soon as the customer's written feedback arrives, the management team will immediately process it, convert all reported minor bugs and follow-up items into traceable PBIs (Issues), and lock them into the Sprint 5 milestone for final polishing.
