# Week 3 Reflection: FitFood Tracker

## Learning points
This week, our team learned the importance of robust data preparation and flexible scope management during MVP v1 delivery. Managing and cleaning the ~3,600 entry grocery retailer CSV taught us how to handle incomplete data (such as null-handling for macros per 100g) and efficiently remove noise from product names. We also learned that proactively refactoring our product category structure (e.g., merging meat/fish and fruit/vegetables) significantly streamlined the frontend inventory filters. On the process side, enforcing strict workflow templates kept our deployment to the university VM and cloud provider stable just in time for the review.

## Validated assumptions
The Sprint Review confirmed our core assumption: the customer fully accepted our manual-entry inventory flow, category refactoring, and macro tracking as a sufficient and successful milestone for MVP v1. We also validated our design approach; the customer expressed high confidence in our UI/UX decisions, explicitly trusting the team's creativity to drive the layout and user flow. Finally, successfully demonstrating the "add your own recipe" feature validated that our foundational database structure is sound.

## Friction and gaps
While the core inventory loop is functional, we experienced technical friction in finalizing the recipe database parsing and the core matching algorithm (fridge ↔ recipe DB), which remain in progress. A major identified gap is the lack of automated data entry; the receipt scanner is not yet implemented, leaving users with manual input. Additionally, we realized that our initial LLM-based expiry date estimation is only partially complete and cannot reliably cover all exact product lifespans without external factual data.

## Planned response
In the next Sprint, our primary focus will be closing the recipe matching gap and implementing the visual, scrollable recipe feed suggested by the customer to increase daily user engagement. To resolve the expiry date tracking friction, we will integrate the two external barcode/QR lookup APIs provided by the customer, pivoting to use our LLM estimation strictly as a fallback for fresh produce (like cucumbers). Finally, we will immediately update our root `README.md` with the requested deployed IP address and ensure all access links are provided to the customer.
