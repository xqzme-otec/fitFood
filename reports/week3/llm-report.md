# Report on LLM Usage – FitFood (Week 3 / Assignment 3)

This report describes how AI/LLM tools were used throughout the Assignment 3 sprint. It covers all AI/LLM-assisted activities, including coding, project management, workflow enforcement, and documentation, explicitly stating which parts of the work were done without any AI assistance.

## Summary
AI/LLM tools were heavily utilized during this Sprint for both development support and Agile project management. All machine learning work (e.g., model training, feature engineering) remained strictly manual.

The division of labor for this sprint was:
* **Machine learning tasks:** Done manually, no LLM involved.
* **DeepSeek:** Used by the development team to assist with backend refactoring and the recipe web scraping logic.
* **Gemini:** Used extensively by the Project Manager for Agile workflow enforcement, repository compliance, and drafting sprint documentation (Roadmap, Reflection, PR templates).
* **Claude (Claude Code):** Used to realize/implement the frontend refactoring, database updates, and FastAPI backend logic.

## Tools Used
| Tool | Role in the assignment |
| :--- | :--- |
| **DeepSeek** | Assisting with recipe scraping logic, data cleaning, and backend refactoring. |
| **Gemini** | Project management support, workflow templates, Definition of Done formulation, and report drafting. |
| **Claude** | Implementation — writing frontend code, database schema updates, and FastAPI development. |
| **(none)** | All machine learning tasks and manual GitHub workflow approvals. |

## How Each Tool Was Used

### DeepSeek — Logic and Data Processing
DeepSeek was used by the developers to support technical tasks during Sprint 1:
* Brainstorming the architecture for the recipe web scraper.
* Assisting with the logic for exact ingredient matching between the virtual fridge and the recipe database.
* Refining data parsing scripts for the retailer CSV dataset.

### Gemini — Agile & Repository Management
Gemini was the primary tool used for Project Management and Assignment 3 compliance:
* Generating professional GitHub Pull Request and Issue templates.
* Drafting the comprehensive `Definition of Done` checklist.
* Structuring the `CHANGELOG.md` and writing the release notes for MVP v1.
* Formulating the `docs/roadmap.md` and the final Week 3 Reflection report based on the PM's raw meeting notes and Sprint Review data.

### Claude — Implementation / Realization
Claude (via Claude Code) was used to accelerate the development of MVP v1:
* Refactoring the main page and writing frontend code for the mobile version.
* Working with the databases to update product categories and macronutrient logic.
* Assisting with project scaffolding and ensuring the FastAPI endpoints were fully functional for the customer review.

### Machine Learning — Done Manually (No LLM)
All machine learning work was performed manually, without any AI/LLM assistance. This includes the product-category classification model used to assign fridge products to their categories — data preparation, training, and evaluation were done by hand by the ML engineer.

## What Was NOT AI-Assisted
* **Final Code Reviews & Merges:** All GitHub Pull Requests, code reviews, and manual approvals were performed strictly by team members.
* **Kanban & Sprint Management:** Moving tickets, verifying acceptance criteria, and updating the project board.
* **Customer Review:** The Sprint Review meeting, live demonstration, and scope negotiation with the customer.
* **Decision Making:** Final decisions on scope, priorities, and acceptance of any AI-generated output.
