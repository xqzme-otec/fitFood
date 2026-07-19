# FitFood Tracker: Customer Handover Document

This document outlines the final handover state of the FitFood Tracker product, providing the customer with necessary ownership, access, configuration, and troubleshooting details upon the conclusion of development.

*Last reviewed: 2026-07-19 (Final Delivery, MVP v3).*

## 1. Current Handover Status
* **Handover Level:** **Independently used by customer**. The product is functionally complete, was demonstrated live, and the customer has successfully operated it independently without the development team's intervention.
* **Confirmation Status:** **Accepted**.
* **Transition Context:** The customer reviewed and independently tested MVP v3, confirming that the core functionality (fridge management, receipt scanning, LLM meal generation, KBJU tracking) works and meets expectations. The provided handover documentation is accepted as sufficient for independent operation.

## 2. Ownership, Access, and Infrastructure
Transition scope as of final delivery — what is transferred/available to the customer versus what the team retains:

* **Repository:** Hosted at [`xqzme-otec/fitFood`](https://github.com/xqzme-otec/fitFood) (public, MIT license). Full administrative rights and ownership of the repository have been transferred to the customer (Emil). The original student team members have been removed from the repository administration as per the transition agreement, leaving the customer in full control of the codebase.
* **Service / Deployment:** The API + frontend + PostgreSQL stack is fully containerized via Docker Compose. The live instance has been successfully deployed and is now globally accessible, overcoming previous campus-network restrictions. The team has transferred all server management and hosting details to the customer.
* **Account / Access:** Application-level access (registering a user account inside FitFood itself) is available to anyone who can reach the public URL. Host and server administrative access have been successfully handed over to the customer.

## 3. What the Product Does and How the Customer Uses It
FitFood is a smart-fridge / meal-planning web app. After registering and completing a short profile (sex, height, weight, age, activity level, goal), a user can:
* Track daily calorie/macro (KBJU) targets and see remaining budget per meal.
* Manage a personal fridge inventory — add items manually or by scanning a grocery receipt (photo/QR upload; non-food items are filtered out automatically).
* Browse or auto-generate meals: the app either recommends catalog recipes that fit the fridge contents and remaining KBJU budget, or (when the catalog is exhausted) has an LLM invent a dish from what's on hand, with a swipe-to-accept/reject flow.
* Log a meal as eaten to update the daily KBJU tracker.

The customer accesses all of this through the web interface at the deployed URL — no separate customer-side installation is required to use the app itself; installation instructions in §5 are for anyone who needs to redeploy the service on their own infrastructure.

## 4. Configuration and Secrets Handling
To run FitFood Tracker, the customer must configure specific environment variables. **Do not commit actual secret values to the repository.** A template is provided in `.env.example`. 

The customer must create a `.env` file on the production server with the following keys:
* `SECRET_KEY`: Used for JWT authentication. Must be generated securely (e.g., `openssl rand -hex 32`).
* `POSTGRES_PASSWORD`: Database password for the Docker container.
* `LLM_PROVIDER`: Set to `openrouter` to enable real AI generation (otherwise defaults to `mock`).
* `OPENROUTER_API_KEY`: Key from openrouter.ai for AI meal generation and explanations.
* `CHECK_TOKEN`: Key from proverkacheka.com for real receipt QR scanning.

Database credentials (`POSTGRES_USER`, `POSTGRES_DB`) and non-secret tuning values (`ACCESS_TOKEN_EXPIRE_MINUTES`, `SEED_PRODUCTS_LIMIT`) have safe defaults in `docker-compose.yml` and normally don't need to be changed.

## 5. Setup, Deployment, and Recovery
The application is fully containerized and easy to deploy.

**Initial Setup & Deployment:**
1. Clone the repository: `git clone https://github.com/xqzme-otec/fitFood.git`
2. Configure the `.env` file with the secrets mentioned above.
3. Build and start the application: `docker compose up --build -d`
*(This automatically sets up the PostgreSQL database, backend, frontend, and seeds initial products).*

**Verification:**
* Backend Health Check: Navigate to `http://<SERVER_IP>:8000/health`
* Web Interface: Navigate to `http://<SERVER_IP>:8000/`

**Recovery & Restart:**
* Soft restart: `docker compose restart`
* Full rebuild: `docker compose down` followed by `docker compose up --build -d`
* View logs: `docker compose logs -f app`

## 6. Main Entry Points for Use and Troubleshooting
For normal operation, the customer and operators should refer to the following documentation artifacts:
* **[README.md](../README.md):** Main entry point with detailed local run and Docker instructions.
* **[User Acceptance Tests (UAT)](user-acceptance-tests.md):** Contains step-by-step end-user scenarios (registration, adding products, receipt scanning, generating meals).
* **[Hosted Documentation](https://xqzme-otec.github.io/fitFood/):** Full technical and architectural reference.

**Common Troubleshooting:**
* *QR Camera scanner doesn't work:* Browsers require HTTPS for camera access. Make sure the domain is accessed via HTTPS; otherwise use the "upload QR file" option.
* *Receipt returns fake/demo data:* Check if `CHECK_TOKEN` is correctly set in `.env`.
* *AI doesn't explain recipes:* Check if `LLM_PROVIDER=openrouter` and `OPENROUTER_API_KEY` are configured.

## 7. Known Limitations and Required Support
The current documentation set is **sufficient for the currently reached handover level**. Because the course development phase has concluded, the product is delivered "as is" with the following known limitations:

* **Fridge deduction is partial:** Adding a dish straight to the diary from the recipe catalog (`AddFoodDialog`) deducts the used ingredients from the fridge. The auto-generated "swipe to accept a meal" flow (`/rations/next`, "I ate this") logs the meal to the daily KBJU tracker but does **not** yet deduct fridge quantities.
* **Web-based only:** There is no native mobile app; the UI is responsive for mobile browsers.
* **No Push Notifications:** The system does not send active device alerts.
* **Chestny Znak integration:** Expiration dates by barcode are not implemented.
* **Team Support Conclusion:** The academic course has ended with the delivery of MVP v3. The development team will no longer provide active hosting, maintenance, or bug fixes. The customer has assumed full operational responsibility for the current deployment and future updates.
