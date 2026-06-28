# Week 4 Reflection: Quality-Driven Engineering

## Learning points
This week marked a transition from a feature-focused development approach to a quality-driven engineering process. Key lessons include:
- **CI/CD Value:** We learned that automating the pipeline (GitHub Actions) significantly reduces the fear of "breaking the build" and streamlines the merging process.
- **Measurable Quality:** Defining quality metrics helped us realize that testing is not just a checkbox, but a tool for prioritization.
- **Strategic Deferral:** Responding to customer feedback taught us that a Product Owner's job is not just to say "yes," but to balance new features with technical debt and stability. We learned to justify postponing complex tasks to ensure the MVP core remains stable.
- **UX Design:** The customer's suggestion of a "Tinder-style" swipe interface demonstrated how a complex meal planning function can be made simple and engaging.

## Validated assumptions
- **Assumption:** *Manual testing is sufficient for our MVP.* - **Result:** **Rejected.** Automated tests revealed edge-case bugs in macro-parsing and category mapping that we never caught during manual walkthroughs.
- **Assumption:** *Implementing external API integrations (Barcode/OCR) would be a quick win.* - **Result:** **Rejected.** After reviewing technical complexity and dependency management, we realized these require dedicated infrastructure and risk management, justifying their deferral.
- **Assumption:** *A complex UI redesign is needed immediately.* - **Result:** **Confirmed.** Customer feedback validated that while the functionality is solid, the UX and visual aesthetics require a more professional approach to increase user engagement.

## Friction and gaps
- **Deployment Risks:** We faced persistent issues with the university VM configuration (network filtering, subscription delays), which caused friction in achieving consistent deployment.
- **Quality Gaps:** While we reached 30% test coverage, our recipe matching logic remains under-tested due to its high complexity.
- **Uncertainties:** The integration of receipt scanning (OCR) remains a major technical uncertainty due to varied receipt formats and library limitations.

## Planned response
In the next Sprint, we will:
- **Focus on Core Feature:** Implement the LLM-based meal plan generation, including the swipe-based UX for recipe selection.
- **Improve Quality:** Resolve the UI contrast bugs and improve test coverage for the generation engine.
