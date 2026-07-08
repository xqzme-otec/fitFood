# Product Roadmap: FitFood Tracker

## [Sprint-1](https://github.com/xqzme-otec/fitFood/milestone/1)
**Dates:** 16 June 2026 - 21 June 2026
**Sprint Goal:** Deliver a working web application where a registered user can manage their pantry: add products manually, view expiration dates with colour indicators, search the inventory, and track daily macronutrient intake — so the core food-management loop of FitFood is usable end-to-end for the first time.
**Focus:** Delivering a stable MVP v1 to prove the core concept of smart fridge integration and recipe recommendations.
**Planned Items:**
* [US-01: Adding Products to Inventory](https://github.com/xqzme-otec/fitFood/issues/21)
* [US-03: Daily Macronutrient Tracking] (https://github.com/xqzme-otec/fitFood/issues/23)
* [US-04: Structured Dietary Plans](https://github.com/xqzme-otec/fitFood/issues/24)
* [US-06: [Expiration Date Tracking](https://github.com/xqzme-otec/fitFood/issues/26) 
* [US-08: Inventory Search](https://github.com/xqzme-otec/fitFood/issues/28)
* [US-10: User Registration and Authentication](https://github.com/xqzme-otec/fitFood/issues/30)

## [Sprint 2](https://github.com/xqzme-otec/fitFood/milestone/2)
**Dates:** 22 June 2026 - 28 June 2026
**Sprint Goal:** Deliver a more intuitive and robust user experience by launching a completely redesigned frontend, implementing smart semantic product recognition, and adding recipe generation. Simultaneously, establish a strong foundation of quality by automating testing and CI pipelines to ensure long-term product stability.
**Focus:** Improving product reliability, responding to customer feedback (UI redesign & smart search), defining measurable quality requirements, and establishing automated quality gates in CI.
**Planned Items:**
- [US-02: Smart Recipe Recommendations](https://github.com/xqzme-otec/fitFood/issues/22)
- [US-07: Recognition of similar words (Semantic Search)](https://github.com/xqzme-otec/fitFood/issues/27)
- [FRONT: Create new frontend at all](https://github.com/xqzme-otec/fitFood/issues/33)
- [INFRA: Setup GitHub Actions CI Pipeline and Branch Protection](https://github.com/xqzme-otec/fitFood/issues/59)
- [TEST: Implement Unit and Integration Tests for Critical Modules](https://github.com/xqzme-otec/fitFood/issues/60)
- [QA: Implement Automated Quality Requirement Tests (QRT)](https://github.com/xqzme-otec/fitFood/issues/61)
- [INFRA: Configure Additional QA Check](https://github.com/xqzme-otec/fitFood/issues/59)




## [Sprint 3](https://github.com/xqzme-otec/fitFood/milestone/3)
**Dates:** 29 June 2026 - 05 July 2026
**Sprint Goal:** Deliver the MVP v3 increment of the FitFood Tracker application, focusing on the implementation of smart LLM-based meal plan generation and receipt scanning functionality. Ensure transparency in the development process by introducing up-to-date architecture documentation (ADRs, diagrams) and improved configuration management.
**Focus:** Delivering MVP v3, addressing previous customer feedback (UI contrast), establishing architecture documentation, and implementing the core LLM dietary generation strictly based on fridge inventory.
**Planned Items:**
* [[TECH] Implement LLM-Based Smart Meal Plan Generation](https://github.com/xqzme-otec/fitFood/issues/86)
* [[TECH] Receipt Scanning with Expiry Dates](https://github.com/xqzme-otec/fitFood/issues/87)
* [[TECH] Tinder-Style Recipe Selection and Regeneration UI](https://github.com/xqzme-otec/fitFood/issues/88)
* [[BUG] UI/UX Contrast and Accessibility Fixes](https://github.com/xqzme-otec/fitFood/issues/85)


### The Current Product Direction
FitFood Tracker is evolving into an intelligent, highly automated dietary management system. The primary focus is shifting from manual data entry to smart automation, utilizing LLMs for personalized meal generation strictly based on available inventory, and automated data extraction via receipt scanning.

### MVP v3 Scope and Justification
The planned MVP v3 scope is directly justified by customer value and feedback. We prioritized the LLM-based smart generation (identified by the customer as the most complex and critical feature) and immediate UI contrast fixes (green-on-grey readability in Light Mode). To ensure high maintainability and that the work can be completed to the current Definition of Done, we are balancing new UI mechanics with architecture hardening and core data flows.


## [Sprint 4](https://github.com/xqzme-otec/fitFood/milestone/4) (Week 6)
**Dates:** 06 July 2026 - 12 July 2026
**Sprint Goal:** Produce a stable trial release of FitFood Tracker for the customer to try before the final transition, alongside a customer-facing documentation review and transition-readiness evidence.
**Focus:** Finalizing current features, fixing critical bugs, and deploying the trial release.
**Planned Items:**
* [[BUG] Fix RAG system fallback: Prevent automatic switch to mock mode (#102)](https://github.com/xqzme-otec/fitFood/issues/102)
* [[TECH] Enhance User Interface and UX for Week 6 Trial Release (#103)](https://github.com/xqzme-otec/fitFood/issues/103)
* [[TECH] Deploy Week 6 Trial Release and configure CI/CD (#104)](https://github.com/xqzme-otec/fitFood/issues/104)

## [Sprint 5](https://github.com/xqzme-otec/fitFood/milestone/5) (Week 7)
**Dates:** 13 July 2026 - 19 July 2026
**Sprint Goal:** Perform follow-up maintenance based on the customer's Week 6 trial feedback, finalize transition work, and deliver the final course version (MVP v3) of FitFood Tracker.
**Focus:** Fixing bugs identified during the Week 6 customer UAT, finalizing the transition state, and preparing the public sanitized demo video and Demo Day presentation.
**Planned Items:**
* *Specific PBIs will be added following the Week 6 customer trial feedback.*
* Finalize MVP v3 Release
* Record and publish public sanitized demo video

### Final Course Outcome (End of Course)
By the end of the course (Week 7), FitFood Tracker will be finalized at **MVP v3**. The product will be delivered with a fully documented customer-handover state (`docs/customer-handover.md`), either ready for independent use or actively operated by the customer. All course-related development will freeze at this release.
