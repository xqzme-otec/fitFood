# Sprint Review Transcript — Week 5 (MVP v2)

> **Publication status:** Published with team permission. Personal names replaced with roles. Off-topic side conversations, profanity, and connectivity/deployment troubleshooting fragments removed for readability. Meaning fully preserved. The meeting transcript spans two recordings; both are combined here in chronological order.

---

**Participants:**
- **Customer / Product Owner** (Speaker 00 in Part 2 / Speaker 02 in Part 1)
- **Developer A** (Speaker 04)
- **Developer B / Tech Lead** (Speaker 05 — receipt scanner; appears as Speaker 05 in Part 1)
- **Team Lead / Scrum Master** (Speaker 03 in Part 1 / Speaker 01 in Part 2)
- **Team Member A** (Speaker 01 in Part 1)
- **Team Member B** (Speaker 00 in Part 1 — same person as Speaker 02 in Part 2 context fragments)

> **Note:** Speaker IDs shift between the two recordings due to separate transcription sessions. Speaker 02 (Part 1) and Speaker 00 (Part 2) are the same Customer / Product Owner.

---

## Part 1

**[00:04:10]**
**Scrum Master:** I'll start with a brief introduction. Our plan for today: I'll give a short overview of our Sprint, then we'll let you explore the product yourself — we've added and updated user scenarios — and we'd like your feedback. This week's Sprint focused on the feedback you gave us last time. The key items were: LLM-based meal plan generation (our most complex and important feature), Tinder-style meal selection, receipt scanning, and improving UI contrast.

---

*[Extended connectivity and local deployment section — customer unable to reach the university VM from outside the campus network; clones the repository and deploys locally. Approximately 40 minutes of the recording are setup and troubleshooting. Substantive review begins below.]*

---

**[00:37:50]**
**Developer A:** Should we run the demo?

**[00:38:10]**
**Scrum Master:** Actually, the idea is for you to try the app yourself without our guidance — notice any friction points — and then we'll do the formal demo after.

**[00:42:20]**
**Customer:** OK, I can pull the project you shared with me last time. I cloned it locally.

**[00:47:10]**
**Team Member A:** We're on `main` — that's the primary branch.

---

*[Customer builds and runs the app locally using Docker Compose — approximately 10 minutes]*

---

**[01:16:10]**
**Customer:** How large is this Docker image? It seems big.

**[01:19:00]**
**Team Member A:** It is quite large, yes.

**[01:19:20]**
**Customer:** Please review your Dockerfile and build process — the image is much larger than it should be. Target somewhere around 200 MB maximum. Is it because the frontend is bundled together with the backend in the same repository?

**[01:25:40]**
**Scrum Master:** Yes, everything is in one repository — frontend, backend, reports, screenshots, assignment documents.

**[01:29:31]**
**Developer A:** The actual project code is maybe 50% of the repo — the rest is assignment artifacts.

**[01:31:00]**
**Customer:** Are you putting everything in the same repository?

**[01:31:31]**
**Developer A:** Yes.

---

**[01:39:01]**
**Scrum Master:** Artem, tell us how the receipt scanner works.

**[01:41:21]**
**Developer B (Receipt scanner):** Nothing unusual here. I used the API specification you sent for the receipt scanner service, updated it, and connected everything. It's not OCR or machine learning — it's a direct API call: you scan, and you get structured product data back. For products that match our existing product database, the KBZHU data comes from the database. For products that don't match — and there are many right now because the database is still limited — the LLM estimates the KBZHU. On a production-scale project the database would be much larger and unmatched products would be rare. For now the LLM estimation is a reasonable fallback; it generally produces accurate-enough values.

**[02:00:41]**
**Customer:** OK, let's switch to the live demo — show me your version since I'm still seeing the old build locally.

**[02:05:00]**
**Customer:** I see some images are missing in your version too.

**[02:06:30]**
**Developer A:** Yes, but look — there's now a "Generate Meal Plan" button. I've added some products to the fridge. Let me show you.

**[02:09:50]**
**Customer:** Does QR code scanning work? I assume it uses the webcam.

**[02:11:10]**
**Developer B:** File upload definitely works — you can upload a photo of a receipt. Webcam requires HTTPS to get camera permission, so it needs to run on the proper server.

**[02:15:30]**
**Customer:** Explain the full user flow for meal plan generation.

**[02:16:10]**
**Developer A:** The system takes all products that match what's in the fridge and builds a day's meal plan. When a user marks a meal as eaten, it's added to the daily log. The idea is to maintain KBZHU across the day — the recipe-based matching alone doesn't always hit targets well enough, so I'm thinking of implementing a RAG-based system: feed the LLM all the roughly-matching recipes, let it adapt them and reorder them, and return a JSON with dish name, ingredients, and preparation steps.

**[02:25:01]**
**Customer:** RAG is a good approach. We've done something similar with another team. Note that RAG works more on semantic similarity — it's slightly different from what you're describing, but the general direction is right.

**[02:27:50]**
**Developer A:** Yes, it's RAG-adjacent — the LLM receives the fridge products plus candidate recipes that roughly match, and generates an optimized plan.

**[02:30:00]**
**Customer:** What does "match" mean here?

**[02:30:30]**
**Developer A:** Matches against the fridge contents.

**[02:31:00]**
**Customer:** Right — that's the correct approach. We should stay 90% within what the user has. Minor herbs and garnishes can be excluded since they're negligible. For generation, focus on the high-calorie, high-impact ingredients that drive the bulk of the daily caloric intake. Those must be tracked against the fridge. Small additions like dill, parsley, cucumber — these matter less. Is that threshold logic already in place?

**[02:38:40]**
**Developer A:** Yes — if an ingredient in a recipe is under 50 grams, it's treated as non-key and excluded from matching.

**[02:39:10]**
**Customer:** Good. That can be refined later.

**[02:42:01]**
**Developer A:** One issue: when a user marks a generated idea as eaten, it doesn't currently deduct from the fridge — it only logs to the daily tracker. It can add a recipe from the recipe database, but the fridge connection isn't done yet. Can I show a generation?

**[02:46:00]**
**Customer:** It generated something fairly repetitive — probably because there aren't many products added yet?

**[02:46:51]**
**Developer A:** Most likely, yes.

**[02:48:20]**
**Customer:** How are you currently determining expired vs. non-expired products — just through the LLM estimate?

**[03:05:30]**
**Developer A:** Yes, currently via LLM estimation.

**[03:06:20]**
**Customer:** OK — you need to also look at the Chestny Znak service I mentioned. In 2026, Chestny Znak QR codes are appearing on essentially all consumer products in Russia — beverages, food, medications. Each product has a unique identifier accessible via QR scan. Chestny Znak stores expiry dates for a subset of products. I shared the CheckDate link with you previously — that's the entry point. I understand why you haven't integrated it yet; in earlier years that service was open, but it may now be restricted. Still, please try to access it.

**[03:11:51]**
**Customer:** Also, have you looked at OpenFoodFacts?

**[03:12:50]**
**Developer A:** Is that an American database?

**[03:13:40]**
**Customer:** No — it has Russian products too. There are hundreds of thousands of entries. Take a look — there may be useful data there.

**[03:18:51]**
**Customer:** Let me re-explain the Chestny Znak flow: when you receive a receipt, each product has a unique identifier. You pass that identifier to the Chestny Znak API. For products that are registered there, you get the expiry date directly. For those that aren't, you fall back to LLM estimation. I'd say Chestny Znak covers roughly 15–20% of products right now, but that share will grow as the system expands across product categories. Even 15–20% is meaningful — it's real verified data. The goal is a hybrid model: real data from Chestny Znak where available, LLM estimate where not. For the LLM estimate, the prompt can be simple: "Given this product stored at normal temperatures (around 20°C), how long would it last from the purchase date? Give me an approximate expiry date." That gives the user a reasonable orientation even for perishables.

**[03:43:51]**
**Customer:** I can see that generation is working — that's the most important thing I wanted to see. I want to test it myself more thoroughly later outside this call. Let me ask: Danil, is generation currently based only on the recipe database, or does the LLM also create new dishes?

**[03:49:00]**
**Developer A:** Both — it uses the recipe database and also generates new options with the LLM.

**[03:49:41]**
**Customer:** Good. To properly test it, try adding a large, diverse inventory — say a kilogram each of eggs, tomatoes, cucumbers, chicken, beef — and observe what gets generated.

**[03:53:11]**
**Developer A:** I'm also checking the OpenFoodFacts repository to see if they have what we need.

**[03:54:01]**
**Customer:** Do that research outside this call. Now, show me the app again. Let's add some varied products and test the meal plan generation.

---

*[Live testing of meal plan generation with expanded product list — customer observes the output]*

---

**[04:12:30]**
**Customer:** Wait — what does "I ate this" do? We're adding to the daily log, right?

**[04:13:40]**
**Developer A:** Yes, it appears here in the tracker.

**[04:15:01]**
**Customer:** I see pasta with cheese appeared for lunch. But it feels like the variety is still limited. How do users view the full recipe for a generated meal?

**[04:19:00]**
**Developer A:** The recipe is in the recipe database section — that's where everything comes from.

**[04:25:31]**
**Customer:** But if I'm on the meal plan and I want to see the recipe for what was just generated for this meal — how do I get there?

**[04:27:11]**
**Developer A:** Currently the generation just assembles products — it doesn't produce a named recipe with a link. It shows the products from the fridge that went into it. The "I ate this" button doesn't yet deduct from the fridge. I'll fix that.

**[04:30:21]**
**Customer:** Please add a link or navigation to a detail page showing the full recipe. This is important for user experience — the same way clicking a recipe card in the recipe section opens a full detail view, the generated meal should do the same. Also: make generation less repetitive and more diverse. If the user has declined an item twice, don't offer it a third time. Can you do that?

**[04:37:10]**
**Developer A:** There's a nuance — the user might not want something sweet at breakfast or lunch but would accept it at dinner. Similarly, soup might be a lunch-only option for them.

**[04:40:21]**
**Customer:** That's a valid point. With a four-meal-per-day plan, the user could end up rejecting the same item repeatedly. And there's a disconnect: "I ate this" is being used both as a confirmation action and as a way to find recipes. We need a separate place to view the full recipe for a generated meal. Think about how to structure this — maybe a "postpone" or "save for later" option in addition to "I ate this."

**[04:46:51]**
**Scrum Master:** We could add a "postpone to next plan" option.

**[04:48:11]**
**Developer A:** That's similar to dismissing with the X button — same logic.

**[04:49:40]**
**Team Member A:** Let's leave that detail for now and decide later.

**[04:50:51]**
**Customer:** The main goal is more diversity. And to clarify the fridge connection: when the user marks a meal as eaten, you should deduct the quantities used from the fridge. If a recipe calls for 300 g of chicken and the user marks it eaten, 300 g is subtracted from the fridge inventory. Should the system ask the user to confirm or adjust the quantity first?

**[04:54:10]**
**Developer A:** The fridge connection isn't built yet — "I ate this" only adds to the log, not subtracts from the fridge.

**[04:55:51]**
**Customer:** We need to think about how to handle that. One option: when the user marks a meal eaten, ask them to confirm or manually adjust the quantity consumed. Another option: apply the recipe quantity automatically. Link fridge and recipe consumption. Also note: some recipe ingredients may be listed generically (e.g., "cheese") while the fridge has specific variants (e.g., "Russian cheese," "Dutch cheese"). For MVP, just pick the best-matching one — most likely the one with the highest token overlap. The exact KBZHU difference between cheese variants is small enough that it won't meaningfully affect the daily plan.

**[05:04:40]**
**Customer:** The overall message is: put maximum focus on the ML/generation part. Everything else — the shell, the recipe database, the tracking UI — is ready. What remains is connecting all the pieces and making generation accurate, diverse, and well-grounded in real fridge data. A RAG-based approach is the right direction. Use semantic chunking of recipes, match against fridge contents, and prioritize high-calorie key ingredients. Also: when a meal is selected and eaten, the quantities of those ingredients must be deducted from the fridge, so future generations reflect what's actually remaining.

**[05:21:41]**
**Developer A:** So the core to-do is: connect generation to the fridge so quantities are deducted when a meal is marked as eaten.

**[05:23:31]**
**Customer:** Yes. Plus tighten the recipe matching to be more accurate. The generation exists and works — that's good progress. Now make it good. Let me also add: include a manual calorie tracker option, where users can type in something they ate outside of the app. But keep it simple — just by product. Don't force users to do anything complicated.

**[05:38:50]**
**Customer:** Also: please investigate Chestny Znak again. That's one of my two remaining key requirements. The other is the meal plan generation quality. If you want to also improve UI/UX, go ahead — I welcome it — but these two are the priority. I'll look at the code myself after this call and send you written feedback by the weekend.

---

## Part 2

**[00:00:00]**
**Developer A / Customer (internal team discussion post-review):**

**[00:00:00]**
**Developer A:** So, for ingredient matching — if the user has "Russian cheese" and "Dutch cheese" in the fridge and a recipe just says "cheese," which one do we pick?

**[00:01:20]**
**Team Member A:** Probably pick the best token match. The issue is this happens everywhere — milk (2.5% vs. 3%), flour, rice (white vs. brown), pasta types.

**[00:04:41]**
**Customer:** For simplicity, just group them and deduct from whichever has the most tokens matching. The KBZHU difference will be small — maybe 5 extra grams of fat — not worth over-engineering at MVP stage.

**[00:06:11]**
**Team Member A:** Yes, that makes sense. Use whichever matches best and move on.

**[00:09:31]**
**Customer:** Exactly — the key is that quantities are tracked. If the user has three packs of 900 g total and the recipe uses 400 g, we subtract 400 g regardless of which specific pack. What matters is that the user has accurate calorie tracking and understands what they consumed. MVP — we're not building a perfect system, we're building something useful.

**[00:15:50]**
**Team Member A:** When is the final capstone presentation?

**[00:16:40]**
**Customer:** I genuinely don't know — I'm from industry, not university faculty. I was invited as an external stakeholder. I'm also finishing my own degree right now but I'm not part of the teaching staff. No authority on academic deadlines.

**[00:20:20]**
**Team Member A:** I just want to know how much time we have left.

**[00:21:10]**
**Customer:** Your main goal is to finish the generation feature and Chestny Znak integration. Everything else is in good shape. UI/UX improvements are welcome if you have the capacity. Those are my last two requirements. I'll give you written feedback after reviewing the code — aiming for the weekend. My own thesis defense is next Tuesday, so I may push the feedback a little, but I'll definitely send it.

**[00:31:11]**
**Team Member A:** By the way — if you ever need ML engineers...

**[00:32:10]**
**Customer:** Ha — finish the project, show me the result, and we'll talk.

**[00:33:40]**
**Team Member A:** Deal.

**[00:34:40]**
**Customer:** Good luck, everyone. Have a great week. Goodbye.

---

*Recording stopped.*
