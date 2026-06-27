# Customer Review Transcript — Sprint Review & UAT Session (Week 4)

> **Publication status:** Recording permission for this session was requested from and
> granted by the customer over Telegram before the call started. Publication permission is
> reused from the customer's Week 2 consent
> (see [`reports/week2/customer-meeting-summary.md`](../week2/customer-meeting-summary.md#recording--transcript-consent)),
> which covers publishing sanitised transcripts in the public repository for the duration of
> the project. Personal names replaced with roles. Profanity, off-topic side conversations,
> and connectivity troubleshooting fragments removed for readability. Meaning is fully
> preserved.

---

**Participants:**
- **Customer / Product Owner** (Speaker 02)
- **Developer A** (Speaker 04)
- **Developer B** (Speaker 03)
- **Team Lead / Scrum Master** (Speaker 01)
- **Team Member A** (Speaker 00)
- **Team Member B** (Speaker 05 / Speaker 06 — same person, split by transcription software)

---

**[00:02:10]**
**Customer:** Hey everyone, sorry I'm a bit late.

**[00:02:12]**
**Team Lead:** Hello! We'd like to start the first part of today's call with a short testing session. Would you be able to test the app? Please enable screen share. We won't guide you — you should try the interface yourself and give us feedback or flag anything you don't like.

**[00:02:44]**
**Customer:** Is the VM network-blocked? I'm currently on a VPN.

**[00:03:27]**
**Customer:** So the idea of this session is that I explore the interface and give you an evaluation, right?

**[00:03:34]**
**Team Lead:** Yes, and we'll also present our second Sprint, which is running this week.

**[00:03:41]**
**Customer:** Can you connect to the VM from the university network yourselves?

**[00:03:48]**
**Developer A:** Yes.

**[00:03:50]**
**Customer:** I can't connect from outside. It seems external access has been blocked. Send me your branch or latest version — I'll clone it and run it locally.

**[00:04:44]**
**Customer:** I can see the repo. Is `main` your primary branch?

**[00:05:04]**
**Developer A:** Yes.

---

*[Customer clones repository and starts local deployment — approximately 2 minutes]*

---

**[00:07:44]**
**Customer:** OK, I've got it running. Ready to test. Something didn't fully load but let's continue.

**[00:08:14]**
**Customer:** What is this oval shape on the screen? Is something supposed to appear?

**[00:08:28]**
**Developer A:** That's the animated login/registration entry screen. Tap "Register."

**[00:08:39]**
**Customer:** Oh, nice — that's cool. *[registers with test data]* So it tracks nutritional intake and expiry dates.

**[00:08:53]**
**Customer:** Does email work end to end? Also — the green and grey in the input fields don't contrast well. Field labels are hard to read. On black backgrounds it looks fine though.

*[Customer fills in profile form: goal = weight loss, target weight = 75 kg, 8 meal slots per day]*

**[00:09:49]**
**Customer:** Do you actually take all these parameters into account when building meal plans?

**[00:09:52]**
**Developer A:** Yes.

**[00:10:12]**
**Customer:** On first impression this looks genuinely nice. You've calculated a recommended daily calorie intake. There's a products section and a recipes section. Where do the recipe images come from?

**[00:10:32]**
**Developer A:** We used [a third-party recipe image source]. The source attribution is shown at the bottom of each recipe card.

**[00:10:57]**
**Customer:** Good — as long as sources are credited. Otherwise there could be copyright issues. Overall I like it. Clean and simple. Macros are per 100 grams — protein, carbs, calories. Let me look at some recipes.

**[00:11:25]**
**Developer A:** Filters are available. I also had a question: I've implemented a smart sort by fridge ingredients. It tokenizes ingredient names — "9% cottage cheese" and "cottage cheese" are treated as the same item. If an ingredient in a recipe is below roughly 10–15 grams, it's considered non-key and excluded from matching. If a key ingredient is missing from the fridge, that recipe won't be recommended. On the main menu there are recipe recommendations — "eat this today." I'm wondering if that's needed given that users can also scroll and browse manually.

**[00:12:39]**
**Customer:** Having something on the main menu that immediately suggests what to eat could be a good engagement hook. But this is really a UX decision — best informed by real user research after testing with actual users. On first impression: simple, clear, intuitive. I like it. But I don't fully understand the purpose of the recipes section. If I type "fluffy omelette" there, what can I do with it? Is it just a recipe browser?

**[00:13:44]**
**Developer A:** The recipe database is meant to sync with the fridge. You can also add recipes to your daily meal plan — I believe that's already working.

**[00:14:00]**
**Customer:** Where is the meal plan generation? Have you built that yet?

**[00:14:07]**
**Customer:** I think I mentioned this before: the idea is that meals in the daily plan would be drawn from products the user actually has in the fridge. Right now the fridge is empty, but with around a hundred products available the system should be able to auto-generate a full daily meal board. And users should also be able to add meals manually — useful for people who prefer not to use generation. From a commercial perspective: one free generation per day, more with a subscription — say 10, 15, or 20 per day depending on tier.

**[00:15:30]**
**Developer A:** You mean generate a single recipe, or a full daily meal plan?

**[00:15:33]**
**Customer:** A full meal plan using the recipes in the app. I wasn't expecting to see a recipe browser here, but it actually looks great — I'm pleasantly surprised. Can users also add their own recipes? And do those user-added recipes feed into the generated meal plan?

**[00:16:09]**
**Developer B:** Yes — when you add a meal to your daily plan from the main page, both built-in and user-added recipes are available.

**[00:16:19]**
**Customer:** Good. To be clear — I definitely brought up LLM-based meal plan generation in our earlier meetings. If that got lost, please make it the central focus of your remaining Sprint time. Here's how I see the priorities:

1. **Receipt scanner + product parsing with expiry dates** — foundation layer. Important but not the heaviest task.
2. **Meal plan generation** — the hardest and most important remaining feature.

When scanning receipts you'll need to filter products — you can't mix laundry detergent with chicken in a recipe match. That's step one. Step two is intelligent meal planning: match recipes to the user's KBZHU targets, number of meals per day, and stated goals. For MVP, the app serves a single user — not families or groups. Family plans and multi-user scenarios are future work.

**[00:20:14]**
**Customer:** Products haven't been added yet — that's fine for now. Let me keep exploring. OK, this is the full daily calorie breakdown. That's good.

**[00:20:28]**
**Developer A:** About the recommendations feature: should it generate once a day with a fixed plan like "eat these things today," or should it update dynamically if the user rejects a suggestion?

**[00:20:47]**
**Customer:** I can't give a definitive answer right now — it's a UX question best answered by user research. For MVP I'd suggest: allow regeneration. When the user opens the app, if they have enough products, a three-meal plan is generated. They can regenerate if they don't like a suggestion. If the fridge only covers two meals, give them two. That itself motivates them to add more products.

Think of it like a Tinder-style swipe: show a recipe card, swipe right to keep it, swipe left to replace it. If you can only keep two out of three, the app asks: "Regenerate or finish?" I can show you a rough prototype I have from an older project.

**[00:22:04]**
**Developer A:** So: a generation button, swipe cards per meal slot — like or dislike — and re-generate if needed?

**[00:22:10]**
**Customer:** Exactly. Let me show you.

*[Customer shares screen — older mobile design prototype with NDA restrictions on parts of it]*

**[00:27:07]**
**Customer:** Here's what we had before — a recipe card interface where you swipe right to accept and left to reject. For example: pasta carbonara appears, swipe it into your plan. If you only accepted two of three cards, the system asks: "Regenerate or finish?" That's the kind of UX I had in mind. This is one of your main remaining tasks. Once this is done, the product will be very strong.

**[00:28:13]**
**Developer A:** Edge case: what if the user only has ten eggs? We can only really generate egg-based dishes.

**[00:28:25]**
**Customer:** Fair. Let's define a minimum entry point: if the app can compose at least a basic three-meal-per-day plan, that's our floor. You can run a background job — say every 30 minutes — to pre-generate suggestions. Yes, this uses LLM tokens, but it's acceptable for MVP. If we can only compose two meals due to limited ingredients, we tell the user and give them two. If we can't generate any, we tell them to add more products — which is a motivator to use the fridge feature. Non-key ingredients below the weight threshold can already be excluded from matching, right?

**[00:30:25]**
**Developer A:** Yes, that's already implemented.

**[00:30:32]**
**Customer:** Good. Longer term — not MVP — you could integrate with grocery delivery services. If a user is missing an ingredient for a recipe they want, the app could say: "Buy this to make X." I saw there are already product delivery links in the data layer. Think of that as a future monetization layer. But for now: **make generation work.** If the user wants to lose weight, give them fewer calories. If they want to gain, give them more — all by KBZHU. If you deliver that, the product will be genuinely strong. I'll review generation at our next call and give more specific direction. The implementation approach is up to you. You have all the pieces: recipe database, fridge inventory, user goals. Connect them and produce output.

**[00:32:25]**
**Customer:** Overall — great work, team. I'm genuinely impressed. Keep going, and ping me any time. I'm finishing my thesis so I sometimes lose context between sessions — just ping me every day if needed, I'll respond. The current build already looks better than I expected. Clean, simple, not over-engineered — that's good. Any questions for me?

**[00:33:33]**
**Team Lead:** No, we're good.

**[00:33:35]**
**Customer:** Great. Good week everyone. Stay in touch.

**[00:33:46]**
**Team Lead:** Goodbye, everyone.

**[00:33:48]**
**Customer:** Bye.

---

*Recording stopped.*
