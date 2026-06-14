# Report on LLM Usage – fitFood

This report describes how AI/LLM tools were used throughout the assignment. It covers all
AI/LLM-assisted activities, including coding, writing, prototyping, research, and idea
generation, and it states explicitly which parts of the work were done without any AI
assistance.

## Summary

AI/LLM tools **were** used during this assignment, but only for design support and
implementation help. All machine learning work (model training, feature engineering,
the product-category classifier) was done **manually, without LLM assistance**.

The division of labor was:

- **Machine learning tasks** — done **manually**, no LLM involved.
- **DeepSeek** — used to help shape the overall idea and produce the initial project skeleton.
- **Gemini** — used for research, including which technology stack to choose.
- **Claude (Claude Code)** — used to realize/implement the project: writing the code,
  working with the databases, and building a working FastAPI backend.

## Tools Used

| Tool | Role in the assignment |
| --- | --- |
| DeepSeek | Idea generation, concept refinement, and initial project skeleton/structure. |
| Gemini | Research and technology-stack selection. |
| Claude (Claude Code) | Implementation — writing code, database work, building the FastAPI backend, and report writing. |
| _(none)_ | All machine learning tasks were performed manually. |

## How Each Tool Was Used

### DeepSeek — idea and skeleton design

DeepSeek was used at the early, exploratory stage of the work:

- Brainstorming and refining the concept of the "FitFood — smart fridge" service.
- Discussing how the main features (KБЖУ/macronutrient tracking, inventory, receipt
  scanning, recipe recommendations) should fit together.
- Drafting an initial project skeleton — the high-level structure and the outline of the
  main components — that later served as a starting point for implementation.

### Gemini — research and stack selection

Gemini was used for the research stage of the project:

- Comparing possible technologies and helping decide which stack to use.
- Confirming the choice of FastAPI + PostgreSQL/SQLAlchemy for the backend.

### Claude — implementation / realization

Claude (via Claude Code) was used to turn the design and skeleton into a working project:

- Writing the application code based on the agreed-upon structure.
- Working with the databases — schema/model design and database-related logic.
- Building a working FastAPI backend that runs.
- Assisting with project setup, scaffolding, and wiring components together.
- Helping write and organize the project documentation and reports (including this one).

### Machine learning — done manually (no LLM)

All machine learning work was performed manually, without any AI/LLM assistance. This
includes the product-category classification model (`xgb_model.pkl`) used to assign
fridge products to their categories — data preparation, training, and evaluation were
done by hand.

## What Was NOT AI-Assisted

- Machine learning model development and all related ML tasks.
- Final decisions on scope, priorities, and acceptance of any AI-generated output —
  all suggestions were reviewed and approved by the team before being adopted.
