# Report on LLM Usage – FitFood (Week 6)

This report describes how AI/LLM tools were used throughout the Assignment 6 sprint. It covers all AI/LLM-assisted activities, including coding, project management, customer documentation, and presentation design, explicitly stating which parts of the work were done without any AI assistance.

## Summary
AI/LLM tools were heavily utilized during this Sprint for development support, complex documentation setup, and Agile project management. As the Sprint focused on delivering the Trial Release, creating the Customer Handover documentation, and preparing the final presentation, LLM usage shifted towards extensive text analysis, formatting transition-readiness artifacts, and presentation design.

The division of labor for this sprint was:
* **DeepSeek:** Used by the development team to assist with recipe matching logic and prompt engineering for the LLM-based meal plan generation feature.
* **Gemini:** Used extensively by the management team for Agile workflow management, analyzing a massive multi-hour customer UAT transcript for exact feedback extraction, formatting the Customer Handover document, and generating Sprint Review/Retrospective artifacts.
* **Claude (Claude Code):** Used to assist with UI updates and Docker configuration troubleshooting for deployment attempts.
* **Gamma AI:** Used to generate and select the visual design and layout structure for our final Assignment 6 slide deck presentation.
* **Manual Work:** Demo execution, peer reviews, deployment verification, and actual presentation rehearsals were done strictly by the team.

## Tools Used
| Tool | Role in the assignment |
| :--- | :--- |
| **DeepSeek** | Assisting with complex matching algorithms, RAG-adjacent logic, and data structures for meal generation. |
| **Gemini** | Project management, transcript analysis, generating UAT histories, and formatting Customer Handover / Sprint Review documentation. |
| **Claude** | Code implementation, UI updates, and Docker configuration assistance. |
| **Gamma AI** | Generating presentation layouts and assisting with slide deck visual design. |

## How Each Tool Was Used

### Gemini — Agile Management & Analytical Support
Gemini was the primary tool used for Project Management and Assignment 6 compliance:
* **Transcript & Feedback Analysis:** Deeply analyzing the raw transcripts from the Customer Trial session to identify communication gaps, isolate exact customer requirements, and translate them into actionable Product Backlog Items.
* **Handover Documentation:** Structuring the `customer-handover.md`, `AGENTS.md`, and `CONTRIBUTING.md` documents to ensure compliance with strict course artifact semantics.
* **Artifact Generation:** Formatting the Sprint Retrospective, UAT Execution History, and Sprint Review Summary based on raw team feedback.

### Claude — Implementation / Realization
Claude (via Claude Code) was used to accelerate the technical requirements:
* Implementing the UI for the new "Generate Meal Plan" flow and Tinder-style swipe actions.
* Assisting with Dockerfile analysis to address ongoing external server deployment issues.

### DeepSeek — Logic and Algorithm Design
DeepSeek was used by the developers to support technical tasks:
* Refining the tokenization and semantic chunking logic to accurately match ingredients from the user's virtual fridge.
* Finalizing the prompt structures for the LLM-based meal plan generation engine.

### Gamma AI — Presentation Design
Gamma AI was used to accelerate the preparation for the Week 6/7 presentations:
* Generating structural layouts for the slide deck.
* Assisting with color themes and visual hierarchy to ensure the presentation is clear and readable for Demo Day.

## What Was NOT AI-Assisted
* **Live Customer Meeting:** The actual Customer Trial session, live demo execution, and direct feedback collection were conducted entirely by human team members on Zoom.
* **Presentation Rehearsal:** The mandatory video recording of the team standing and rehearsing the presentation was performed entirely manually by the team members.
* **Final Code Reviews & Merges:** All GitHub Pull Requests, code reviews, and manual approvals were performed strictly by team members.
* **Infrastructure Attempts:** Testing the VM access and running the Docker containers locally during the presentation was done manually.
