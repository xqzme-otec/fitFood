# Report on LLM Usage – FitFood

This report describes how AI/LLM tools were used throughout the Assignment 4 sprint. It covers all AI/LLM-assisted activities, including coding, project management, workflow enforcement, quality assurance, and documentation, explicitly stating which parts of the work were done without any AI assistance.

## Summary
AI/LLM tools were heavily utilized during this Sprint for development support, automated testing setup, and Agile project management. As the Sprint focused on Quality-Driven Engineering and responding to customer feedback, LLM usage shifted towards text analysis, CI/CD troubleshooting, and frontend refactoring.

The division of labor for this sprint was:
* **DeepSeek:** Used by the development team to assist with recipe matching logic (tokenization) and brainstorming the upcoming LLM-based meal plan generation feature.
* **Gemini:** Used extensively by the Team Lead for Agile workflow management, analyzing customer UAT transcripts for exact feedback extraction, diagnosing team/process friction, and fixing documentation errors.
* **Claude (Claude Code):** Used to realize the frontend refactoring (TypeScript Next.js + MUI) and implement automated Quality Requirement Tests (QRTs).
* **Manual Work:** UAT execution, peer reviews, final decision-making, and deployment verification were done strictly by the team.

## Tools Used
| Tool | Role in the assignment |
| :--- | :--- |
| **DeepSeek** | Assisting with complex matching algorithms and data structures. |
| **Gemini** | Project management, transcript analysis, process friction diagnosis, documentation proofreading, and CI/CD error resolution. |
| **Claude** | Code implementation — Next.js frontend rewrite, writing test suites, and GitHub Actions CI configuration. |
| **(none)** | Live UAT sessions, GitHub PR peer reviews, and strategic project decisions. |

## How Each Tool Was Used

### Gemini — Agile Management & Analytical Support
Gemini was the primary tool used for Project Management and Assignment 4 compliance:
* **Transcript & Feedback Analysis:** Deeply analyzing the raw transcripts from the Customer UAT session to identify communication gaps, isolate exact customer requirements (e.g., the Tinder-style swipe UX), and translate them into actionable Product Backlog Items.
* **Error Diagnostics:** Analyzing team workflow friction and errors in communication to formulate a highly accurate and objective Sprint Retrospective and Reflection.
* **Documentation & Syntax Correction:** Finding and fixing formatting and logical errors in the Markdown documentation, specifically debugging and resolving pathing errors that caused the `lychee` CI link checker to fail.
* **Reporting:** Structuring the `CHANGELOG.md` for MVP v0.2.0 and drafting the Customer Feedback Response table based on ISO 25010 quality standards.

### Claude — Implementation / Realization
Claude (via Claude Code) was used to accelerate the technical requirements of Assignment 4:
* Fully rewriting the frontend from Vanilla JS to a TypeScript Next.js + MUI Single Page Application.
* Writing unit and integration tests to meet the new automated quality requirements.
* Assisting with the configuration of the `.github/workflows` files for CI/CD branch protection.

### DeepSeek — Logic and Algorithm Design
DeepSeek was used by the developers to support technical tasks:
* Refining the tokenization logic to accurately match ingredients from the user's virtual fridge with the recipe database.
* Early architectural brainstorming for the LLM-based meal plan generation engine planned for the next sprint.

## What Was NOT AI-Assisted
* **Live Customer UAT:** The actual User Acceptance Testing session, screen sharing, and live feedback collection were conducted entirely by human team members.
* **Final Code Reviews & Merges:** All GitHub Pull Requests, code reviews, and manual approvals (enforcing branch protection rules) were performed strictly by team members.
* **Infrastructure Deployment:** Testing the VM access and running the Docker containers locally during the presentation was done manually.
* **Decision Making:** Final decisions on which features to defer (e.g., OCR receipt scanning) and which to prioritize were made by the team based on customer input, not AI output.
