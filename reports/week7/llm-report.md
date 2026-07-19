# Report on LLM Usage – FitFood (Week 7)

This report describes how AI/LLM tools were used throughout Sprint 5 (Week 7). It covers all AI/LLM-assisted activities, including coding, project management, final customer documentation, and presentation design, explicitly stating which parts of the work were done without any AI assistance.

## Summary
AI/LLM tools were heavily utilized during this Sprint for development support, final documentation setup, and Agile project management. As the Sprint focused on delivering the final MVP v3, executing the actual customer transition, and preparing the Demo Day presentation, LLM usage shifted towards formatting transition-readiness artifacts, finalizing deployment scripts, and presentation design.

The division of labor for this sprint was:
* **DeepSeek:** Used by the development team to assist with finalizing the matching logic and prompt engineering for the LLM-based meal plan generation feature.
* **Gemini:** Used extensively by the management team for Agile workflow management, analyzing the final customer transition meeting transcript for exact feedback extraction, finalizing the Customer Handover document, and generating Sprint Review/Retrospective artifacts.
* **Claude (Claude Code):** Used to assist with UI updates and successfully resolving the Docker configuration blockers for the global staging deployment.
* **Gamma AI:** Used to generate and select the visual design and layout structure for our final Demo Day slide deck presentation.
* **Manual Work:** Demo execution, peer reviews, global deployment verification, recording the public sanitized demo video, and actual presentation rehearsals were done strictly by the team.

## Tools Used
| Tool | Role in the assignment |
| :--- | :--- |
| **DeepSeek** | Assisting with complex matching algorithms, RAG-adjacent logic, and data structures for meal generation. |
| **Gemini** | Project management, transition analysis, finalizing UAT histories, and formatting Customer Handover / Sprint Review documentation. |
| **Claude** | Code implementation, UI updates, and Docker configuration assistance for final deployment. |
| **Gamma AI** | Generating presentation layouts and assisting with slide deck visual design. |

## How Each Tool Was Used

### Gemini — Agile Management & Analytical Support
Gemini was the primary tool used for Project Management and final Assignment 6 compliance:
* **Transcript & Feedback Analysis:** Deeply analyzing the raw transcripts from the Final Transition meeting to isolate exact customer acceptance and translate any remaining feedback into the final report.
* **Handover Documentation:** Finalizing the `customer-handover.md` and `README.md` documents to ensure they accurately reflect the "Independently used by customer" state and comply with strict course artifact semantics.
* **Artifact Generation:** Formatting the Sprint 5 Retrospective, final UAT Execution History, and Sprint Review Summary based on raw team feedback.

### Claude — Implementation / Realization
Claude (via Claude Code) was used to accelerate the technical requirements:
* Polishing the UI for the "Generate Meal Plan" flow based on Week 6 feedback.
* Assisting with Dockerfile and Compose analysis to successfully overcome previous geo-restrictions and network blockers, achieving a globally accessible staging deployment.

### DeepSeek — Logic and Algorithm Design
DeepSeek was used by the developers to support technical tasks:
* Refining the tokenization and semantic chunking logic to accurately match ingredients from the user's virtual fridge.
* Finalizing the fallback mock-mode structures for the LLM-based meal plan generation engine.

### Gamma AI — Presentation Design
Gamma AI was used to accelerate the preparation for Demo Day:
* Generating structural layouts for the final slide deck.
* Assisting with color themes and visual hierarchy to ensure the presentation is clear and readable for the Demo Day audience.

## What Was NOT AI-Assisted
* **Live Customer Meeting:** The final Customer Transition session and direct handover confirmation were conducted entirely by human team members.
* **Presentation Rehearsal & Demo Video:** The mandatory video recording of the team standing and rehearsing the presentation, as well as the public sanitized demo video for MVP v3, were performed entirely manually by the team members.
* **Final Code Reviews & Merges:** All GitHub Pull Requests, code reviews, and manual approvals for the MVP v3 release were performed strictly by team members.
* **Infrastructure Deployment:** The actual provisioning, secure `.env` key management, and deployment verification on the global staging server were done manually.
