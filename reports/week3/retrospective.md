# Sprint 1 Retrospective: FitFood Tracker

## What went well
1. **Successful MVP Delivery:** We successfully deployed the core inventory management loop and macronutrient tracking. The customer was highly satisfied with our progress and approved the MVP v1 scope without requesting any rollbacks.
2. **Workflow Adoption:** The team successfully adapted to the new strict repository workflow. Enforcing the Definition of Done, branch naming conventions (`<issue-number>-short-description`), and PR templates kept our `main` branch completely stable.
3. **Effective Division of Labor:** Dividing the work strategically—separating project management/documentation tasks from backend scraping and frontend refactoring—allowed us to deliver a usable increment despite a tight deadline.

## What did not go well
1. **Administrative Bottlenecks:** We experienced friction due to repository permission issues (e.g., delays in setting up Issue Templates), which temporarily blocked the Project Manager from finalizing workflow compliance tasks.
2. **Underestimated Complexity:** The algorithm for matching fridge inventory with the parsed recipe database proved more complex than initially estimated, causing that specific feature to remain "In Progress" at the time of the review.
3. **Scope Creep vs. Reality:** We were slightly overly optimistic about our velocity during Sprint Planning. The OCR receipt scanner had to be delayed, meaning users currently have to rely on manual data entry.

## Action points
1. **Resolve Repository Permissions:** Standardize GitHub repository access so that the Project Manager and all relevant team members have the necessary rights to create templates and manage project boards without waiting for the repository owner.
2. **Prioritize Automated Data Entry:** Conduct a technical spike early in Sprint 2 focusing on the external barcode/QR APIs provided by the customer to solve the manual entry bottleneck as quickly as possible.
