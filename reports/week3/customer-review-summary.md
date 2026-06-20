# Customer Review Summary — Sprint Review Meeting

## Meeting Details

| Field | Value |
|---|---|
| **Date** | Week 3 Sprint Review (exact date redacted) |
| **Duration** | ~20 minutes |
| **Participants** | Customer / Product Owner (1), Developer / Tech Lead (1), Team Lead / Scrum Master (1), additional team members (2) |
| **Format** | Video call (Zoom) with screen share |

---

## Artifacts Demonstrated

- Analysis / Kanban board with the current Sprint backlog
- Live mobile/web application — user registration and goal-setting flow
- Product inventory screen (inventory list, add-product flow)
- Recipe section with "add your own recipe" feature
- Product category structure (refactored)
- Deployed instance running on a university VM and a cloud provider

---

## Scope Reviewed

The team presented MVP v1 progress including:

- Product inventory management with fridge-linked inventory
- Product search backed by a grocery retailer CSV dataset (~3,600 entries including synthetic training data)
- Macro-nutrient data (calories, macros per 100 g) with null-handling for incomplete entries
- Product name cleaning (removed noise such as review counts and ratings from names)
- Partial recipe section — "add your own" feature implemented; recipe database parsing in progress
- Refactored product category structure (meat/fish merged, fruit/vegetables merged, dry goods and baked goods added)
- Filters added to the fridge/inventory view
- Expiry date estimation via LLM category classification (partially complete)
- Receipt scanner: not yet implemented; manual text input only

---

## Implemented Increment Discussed

| Feature | Status at Review |
|---|---|
| User registration and goal input | Done |
| Product inventory (manual add) | Done |
| Product search from retailer CSV | Done |
| Product name cleaning | Done |
| Macro tracking per 100 g | Done |
| "Add your own recipe" entry | Done |
| Product category refactor | Done (receipt scanner section pending) |
| Filters in inventory view | Done |
| Recipe database parsing | In Progress |
| Recipe matching (fridge ↔ recipe DB) | Not started |
| Receipt scanner | Not started |
| Expiry date display and estimation | Partially done |
| Frontend redesign | Planned for next Sprint |

---

## Customer Feedback

### Positive

- Customer acknowledged visible progress and encouraged the team to continue.
- The current MVP state was accepted as sufficient for the MVP milestone ("For MVP, I think it's fine as-is").
- Customer expressed confidence in the team's design and UX decisions and stated they rely on the team's creativity for layout and user flow.

### Requested Changes and Suggestions

1. **Recipe feed / visual discovery:** Customer suggested adding a scrollable feed of previously generated recipes with images on the main screen, showing what the user ate recently and what the app recommends today (e.g., based on items expiring soonest). This was framed as a UX engagement idea, not a hard requirement.

2. **Expiry date — external data source integration:** Customer will share two external resource links:
   - One for QR/barcode lookup
   - One for retrieving product information (including expiry date where available)
   The team should combine external data with their own LLM-based estimation for products not covered by the external source (e.g., fresh produce like cucumbers).

3. **Repository and deployment links:** Customer requested the deployed IP address and an updated repository README link.

4. **Receipt scanner — barcode lookup:** Customer reminded the team of a barcode-based external resource (mentioned in the first meeting) to be integrated when the receipt scanner is implemented.

---

## Approval Status

**MVP v1 increment: Accepted by customer** with no blocking issues. The customer did not request rollback or rejection of any completed feature. Suggestions above are enhancements and follow-up items, not blockers for the current Sprint acceptance.

---

