# Sprint 5 (Week 7) Retrospective

**Date:** 2026-07-19
**Participants:** Timur Ishmuratov (Scrum Master), Daniil Vishnevskii (Tech Lead), Artemiy Tiglev, Pavel Romanov, Egor Gilmanov.

## 1. What Went Well
*   **Successful Deployment:** Daniil successfully fixed the deployment, and now the application works perfectly and is accessible globally.
*   **Customer Satisfaction:** During the trial, the customer was highly impressed with the RAG-based LLM system and the automatic fridge deduction ("That's great - everything is working properly").
*   **Clear Handover Agreement:** Timur and Egor effectively managed customer communication. The customer explicitly agreed to the formal handover format (transferring repository ownership and making the customer the owner).

## 2. What Could Be Improved
*   **Time Estimation for Documentation:** The final documentation, UAT updates, and reporting required a significant amount of time. We could have allocated more buffer time for these administrative tasks earlier in the sprint.
*   **Automated Testing Coverage:** While manual and user testing was successful, having a broader suite of automated end-to-end tests would have made the final release process faster and less stressful.

## 3. Action Items (If the project were to continue)
*Since Sprint 5 is the final sprint of the academic course, these action items reflect what the team would prioritize if development were to continue post-transition.*
1.  **Independent Code Review:** Address any written feedback the customer provides after they pull the repository and review the codebase independently, as agreed during the meeting.
2.  **Usage Analytics:** Integrate basic analytics so the customer can track user engagement and app performance post-handover.
3.  **Model Performance Optimization:** Explore ways to speed up the LLM generation time.

## 4. Assessment of Previous Action Items
*   **[Completed] Implement strictly fridge-based LLM generation:** The model now successfully generates dishes entirely from provided ingredients.
*   **[Completed] Fix fridge deduction on consumption:** Ingredient quantities (e.g., 60 grams of meat) are now correctly deducted when the user clicks "I ate this".
*   **[Completed] Agree on product handover format:** The team secured the customer's agreement to take ownership of the GitHub repository.
