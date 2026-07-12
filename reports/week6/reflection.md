# Team Reflection — Week 6

## Learning points
* **Parallel Workstreams Succeed:** We learned that strictly dividing responsibilities—having the technical team focus entirely on coding while the management team handles customer communication and documentation—is highly effective. It allowed us to deliver a complex LLM feature and perfectly structured handover documents simultaneously.
* **Outcome Over Implementation:** We learned that customers care more about the final result than the underlying technical method. The customer originally expected a custom-trained model, but happily accepted our RAG-based LLM approach because the generated meal plans and automatic fridge deductions worked perfectly.

## Validated assumptions
* **Automation is Key:** We assumed that automating the routine (deducting ingredients automatically upon clicking "I ate this") would be the most highly valued feature. The customer's enthusiastic reaction during the demo completely validated this assumption.
* **Transparent Documentation Works:** We assumed that being completely honest in the `customer-handover.md` about the current local-only deployment limitations would build trust. The customer appreciated the transparency and agreed to test locally while we fix the server.

## Friction and gaps
* **Deployment Blockers:** The biggest friction point was the failure to deploy the application to the external production server. This directly blocked the webcam receipt scanning feature (which requires HTTPS) and prevented the customer from immediately accessing the live product from outside the campus network.
* **Customer Availability:** The customer had just submitted their thesis and had limited time, meaning we had to defer independent live UAT testing to async written feedback. This creates a slight gap in finalizing the exact Sprint 5 scope immediately.

## Planned response
* Our absolute priority for the final Week 7 is to fix the external deployment and HTTPS setup so the customer can independently use the app.
* We will wait for the customer's written feedback in the next 1-2 days, immediately convert any bugs into GitHub Issues, and focus Sprint 5 entirely on polishing these final gaps before the ultimate MVP v3 handover.
