# FitFood Tracker: Customer Handover Document

This document outlines the current handover state of the FitFood Tracker product, providing the customer with necessary ownership, access, configuration, and troubleshooting details.

## 1. Current Handover Status
* **Handover Level:** Deployed or operated on customer side (currently deployed on the University Campus VM for customer access).
* **Confirmation Status:** Accepted with follow-up items.
* **Transition Context:** The customer has reviewed the product, confirmed that the core functionality is ready, and is highly satisfied with the work done. Active daily use is currently paused pending final minor follow-up items (bug fixes and minor features) that the team will address during Sprint 5 (Week 7). 

## 2. Ownership, Access, and Infrastructure
* **Repository:** The source code is currently hosted in the team's public repository (`xqzme-otec/fitFood`) under an MIT license. At the end of Week 7, the repository can be transferred or forked to the customer's GitHub account.
* **Deployment Infrastructure:** The application is deployed on a University IT Virtual Machine (IP: `10.93.26.202`, Port: `8000`). 
* **Important Access Note:** Currently, the live deployment is accessible **only from the university campus network**. For independent global use, the customer will need to migrate the Docker containers to their own VPS/Server in the future.

## 3. Configuration and Secrets Handling
To run FitFood Tracker, the customer must configure specific environment variables. **Do not commit actual secret values to the repository.** A template is provided in `.env.example`. 

The customer must create a `.env` file on the production server with the following keys:
* `SECRET_KEY`: Used for JWT authentication. Must be generated securely (e.g., `openssl rand -hex 32`).
* `POSTGRES_PASSWORD`: Database password for the Docker container.
* `LLM_PROVIDER`: Set to `openrouter` to enable real AI generation (otherwise defaults to `mock`).
* `OPENROUTER_API_KEY`: Key from openrouter.ai for AI meal generation and explanations.
* `CHECK_TOKEN`: Key from proverkacheka.com for real receipt QR scanning.

## 4. Setup, Deployment, and Recovery
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

## 5. Main Entry Points for Use and Troubleshooting
For normal operation, the customer and operators should refer to the following documentation artifacts:
* **[README.md](../README.md):** Main entry point with detailed local run and Docker instructions.
* **[User Acceptance Tests (UAT)](user-acceptance-tests.md):** Contains step-by-step end-user scenarios (registration, adding products, receipt scanning, generating meals).
* **[Hosted Documentation](https://xqzme-otec.github.io/fitFood/):** Full technical and architectural reference.

**Common Troubleshooting:**
* *QR Camera scanner doesn't work:* Browsers require HTTPS for camera access. Until SSL/HTTPS is configured on a customer's domain, use the "upload QR file" option instead.
* *Receipt returns fake/demo data:* Check if `CHECK_TOKEN` is correctly set in `.env`.
* *AI doesn't explain recipes:* Check if `LLM_PROVIDER=openrouter` and `OPENROUTER_API_KEY` are configured.

## 6. Known Limitations and Required Support
The current documentation and deployment are sufficient for the reached handover level (testing and validation). However, to move to full independent global operation, the following limitations must be noted:
* **Web-based only:** There is no native mobile app; the UI is responsive for mobile browsers.
* **No Push Notifications:** The system does not send active device alerts.
* **Pending Follow-ups:** Features like "Chestny Znak" (expiration dates by barcode) and automatic fridge deduction after "I ate this" are not fully implemented.
* **Remaining Team Support:** During Week 7, the team will resolve the follow-up items reported by the customer and finalize the MVP v3 release.
