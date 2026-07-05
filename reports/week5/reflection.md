## Learning points
* **Delivering MVP v2 and Customer Review:** Demonstrating the core LLM-based meal plan generation proved that delivering a functional, complex feature is more valuable than a perfect UI. The customer could see the primary value of the application, which guided the rest of the feedback toward refining the generation logic rather than adjusting minor visual details.
* **Documenting Architecture and Recording ADRs:** Formalizing our architecture and decisions (ADRs) clarified system boundaries. Discussing the RAG-adjacent approach for meal generation with the customer validated our architectural direction and helped us define exactly how the LLM should interact with the recipe database and fridge inventory.
* **Managing Configuration:** We learned that poor configuration management directly impacts deliverability. Bundling course artifacts, documentation, and source code into the same Docker context bloated the image significantly. Furthermore, missing HTTPS configuration in the local deployment blocked the testing of the webcam receipt scanner.
* **Refining the Workflow:** The review highlighted the need to tighten our development loop regarding end-to-end features. We built the UI and the generation logic, but the workflow gap between marking a meal as "eaten" and actually deducting it from the fridge inventory showed that we need to trace user stories through the entire system state, not just visually.

## Validated assumptions
* **LLM Fallback for KBZHU:** Using an LLM to estimate KBZHU for products not found in our database is a viable, customer-approved fallback for the MVP stage while the product database scales.
* **RAG-based Generation Strategy:** The customer explicitly validated our RAG-adjacent approach (using semantic chunking and matching against fridge contents) as the correct technical direction for accurate meal generation.
* **Simplified Ingredient Matching:** Our assumption that we do not need to perfectly map specific fridge items (e.g., "Russian cheese") to generic recipe requirements (e.g., "cheese") was validated. Grouping them by best token match is sufficient for MVP-level calorie tracking without over-engineering.

## Friction and gaps
* **State Management Gap:** The most critical friction point is that the "I ate this" action only logs the meal but fails to deduct the consumed ingredient quantities from the fridge inventory.
* **Generation UX and Diversity:** The meal generation output is too repetitive, lacking a "rejection memory" to prevent showing the same declined dish. Additionally, users cannot navigate from a generated meal slot to its full recipe detail page.
* **Configuration and Deployment Bloat:** The Docker image is excessively large because the frontend, backend, and non-code assignment artifacts are bundled together. The target is ~200 MB.
* **Environment Constraints:** The webcam scanner requires an HTTPS environment to request camera permissions, which fails in the current local testing setup. Furthermore, the university VM remains inaccessible from the external network, forcing the customer to build the app locally.

## Planned response
* **Connect Fridge to Consumption:** As the highest priority for Sprint 4, we will implement the logic to deduct ingredient quantities from the fridge when a meal is marked as eaten, including a step for user confirmation/adjustment.
* **Refine Generation Logic:** We will add rejection memory to the LLM generation and incorporate meal-type context (e.g., breakfast vs. dinner) to ensure meal diversity. We will also add a navigation link from generated meals to their respective recipe detail cards.
* **Optimize Configuration and Deployment:** We will rewrite the Dockerfile and `.dockerignore` to exclude reports, screenshots, and assignment artifacts, aiming to hit the customer's ~200 MB image size target. We will also set up an HTTPS workaround (like ngrok) to enable webcam testing.
* **Integrate Chestny Znak:** We will research access to the Chestny Znak API to implement the requested hybrid expiry date model (real API data where available, LLM fallback where not). We will also investigate OpenFoodFacts as a supplementary data source.
