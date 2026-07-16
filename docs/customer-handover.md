# FitFood Tracker: Customer Handover Document

This document outlines the current handover state of the FitFood Tracker product, providing the customer with necessary ownership, access, configuration, and troubleshooting details.

*Last reviewed: 2026-07-16 (Sprint 5 / Week 7, no state change yet since the Week 6 trial review).*

## 1. Current Handover Status
* **Handover Level:** **Ready for independent use** — the product is functionally complete for trial use and was demonstrated live to the customer, but the customer has not yet operated it independently, and it is not yet deployed on infrastructure the customer controls. (Not yet "Independently used by customer" or "Deployed or operated on customer side".)
* **Current Blocker:** The live instance runs on a University IT VM reachable **only from the campus network**, so the customer cannot yet reach it independently outside that network. Resolving external access is the team's top Sprint 5 priority.
* **Confirmation Status:** Accepted with follow-up items (Sprint 4 / Week 6 review).
* **Transition Context:** The customer reviewed the product live, confirmed the core functionality (fridge management, receipt scanning, LLM meal generation, KBJU tracking) works and is satisfied with the outcome. Independent customer testing was deferred — the customer agreed to try it once externally reachable and send written feedback. The team will act on that feedback, resolve the deployment blocker, and finalize the handover during Sprint 5 (Week 7).
* **Remaining actions before full transition (blocking):**
  1. Resolve external deployment access (customer must reach the product without campus-network restrictions or local cloning).
  2. Transfer or grant repository ownership/access to the customer.
  3. Receive and act on the customer's written feedback from independent trial use.
  4. Finalize and tag the MVP v3 release.

## 2. Ownership, Access, and Infrastructure
Transition scope as of this review — what is already transferred/available to the customer versus what the team currently retains:

* **Repository:** Retained by the team, but already publicly readable. Hosted at [`xqzme-otec/fitFood`](https://github.com/xqzme-otec/fitFood) (public, MIT license) — the customer can already browse code and docs without an account. Write/admin ownership has **not** been transferred yet: the customer is not currently a repository collaborator. Planned for Sprint 5 (Week 7): add the customer as a collaborator, or transfer/fork the repository to their GitHub account.
* **Service / Deployment:** Retained and operated by the team. The API + frontend + PostgreSQL stack runs via Docker Compose on a University IT Virtual Machine (IP `10.93.26.202`, port `8000`), provisioned and maintained by the team, not the customer.
* **Account / Access:** Retained by the team. The customer has no login/SSH/hosting-account access to the deployment host. Application-level access (registering a user account inside FitFood itself) is available to anyone who can reach the URL.
* **Important Access Note:** The live deployment is reachable **only from the university campus network**. For independent, globally-accessible use, the containers will need to move to a server the customer (or the team, on the customer's behalf) controls — this is the Sprint 5 top-priority action, not yet done.

## 3. What the Product Does and How the Customer Uses It
FitFood is a smart-fridge / meal-planning web app. After registering and completing a short profile (sex, height, weight, age, activity level, goal), a user can:
* Track daily calorie/macro (KBJU) targets and see remaining budget per meal.
* Manage a personal fridge inventory — add items manually or by scanning a grocery receipt (photo/QR upload; non-food items are filtered out automatically).
* Browse or auto-generate meals: the app either recommends catalog recipes that fit the fridge contents and remaining KBJU budget, or (when the catalog is exhausted) has an LLM invent a dish from what's on hand, with a swipe-to-accept/reject flow.
* Log a meal as eaten to update the daily KBJU tracker.

The customer accesses all of this through the web interface at the deployed URL (see §2) — no separate customer-side installation is required to use the app itself; installation instructions in §5 are for anyone who needs to run or redeploy the service.

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
* *QR Camera scanner doesn't work:* Browsers require HTTPS for camera access. Until SSL/HTTPS is configured on a customer's domain, use the "upload QR file" option instead.
* *Receipt returns fake/demo data:* Check if `CHECK_TOKEN` is correctly set in `.env`.
* *AI doesn't explain recipes:* Check if `LLM_PROVIDER=openrouter` and `OPENROUTER_API_KEY` are configured.

## 7. Known Limitations and Required Support
The current documentation set is **sufficient for the currently reached handover level** ("Ready for independent use" / trial validation). It is **not yet sufficient** for a fully independent, customer-operated deployment — that needs the deployment/ownership blockers below resolved first. Known limitations:
* **External deployment not resolved:** see §1/§2 — the only live instance is campus-network-only; there is no customer-reachable public URL yet.
* **Fridge deduction is partial:** adding a dish straight to the diary from the recipe catalog (`AddFoodDialog`) deducts the used ingredients from the fridge. The auto-generated "swipe to accept a meal" flow (`/rations/next`, "I ate this") logs the meal to the daily KBJU tracker but does **not** yet deduct fridge quantities — this is an open gap, not a documentation error.
* **Web-based only:** There is no native mobile app; the UI is responsive for mobile browsers.
* **No Push Notifications:** The system does not send active device alerts.
* **Chestny Znak integration** (expiration dates by barcode) is not implemented; API access is still being investigated and may end up documented as a firm limitation rather than delivered.
* **Remaining Team Support:** During Sprint 5 (Week 7) the team will resolve external deployment, transfer/grant repository access, act on the customer's written feedback, and finalize the MVP v3 release. Until then, the team remains responsible for hosting, maintenance, and bug fixes.
