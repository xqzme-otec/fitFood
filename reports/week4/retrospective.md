# Sprint Retrospective - Week 4

## What went well
- **Customer Interaction & UAT:** We successfully conducted the UAT session. The customer was genuinely impressed with our progress, praising the clean UI, animated entry screen, and the populated recipe database. 
- **Clear Product Vision:** The customer's idea for a "Tinder-style" swipe interface for recipes was a major breakthrough that energized the whole team. The customer also shared their long-term vision (monetization, grocery delivery integrations), giving us a crystal-clear understanding of how to move forward. We received precise guidance on what to fix, what to add, and what not to forget.

## What did not go well
- **Infrastructure Accessibility:** The university VM was blocked from external networks. The customer could not access the live deployed app during the call and had to spend time cloning and running the project locally.
- **UI Contrast Issues:** During live testing, the customer noticed that green text on grey input fields lacked contrast, making labels difficult to read.
- **Missing Core Logic:** While the recipe database is great, the actual LLM-based meal plan generation (the hardest and most important feature) has not yet been started.

## Changes compared to the previous Sprint
- **Focus on UX and Data:** Based on previous discussions, we shifted our focus heavily towards improving the visual presentation and smart sorting logic. This pivot was highly successful, as the customer explicitly noted the app looked much better than their prior mental model and praised the ingredient-tokenization logic.

## Process improvements for the next Sprint
1. **Strict Feature Prioritization (LLM First):** We will adjust our sprint planning to ensure the most complex and critical feature—LLM meal plan generation with the swipe UX—is our absolute top priority. Secondary features (like static menu recommendations) will be deferred until the core generation works.
2. **External Deployment Verification:** To avoid UAT delays in the future, we will add a mandatory pre-review step: a team member must test the VM deployment accessibility from a non-university network (e.g., using mobile data) before the customer meeting begins.
