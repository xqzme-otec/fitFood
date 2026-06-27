# Customer Meeting Transcript — Week 2

**Meeting Date:** 14 June 2026, 16:24  
**Participants:** Customer (@emil), Team Lead / Scrum Master (@timur), Developer (@speaker3), Developer (@speaker4)  
**Language:** Russian (original); transcript cleaned for readability.

> PII removed. Real names replaced with GitHub/GitLab pseudonyms or roles. Post-meeting technical chat (after [19:26]) included for completeness but marked as off-topic.
>
> **Note on user-story numbering:** the US-01…US-10 labels spoken below follow the order
> stories were *discussed in this call*, not the final stable IDs. The stable IDs used by
> [`user-stories.md`](user-stories.md) and every later document differ — see the mapping
> table in [`user-stories.md`](user-stories.md#note-on-user-story-id-numbering). For
> example, "US-08" below (synonym recognition, the story whose priority was changed during
> this call) is stable ID **US-07**.

---

**@timur** *[00:21]*  
Hi everyone. Can you hear me?

**@emil** *[00:25]*  
Yes, hello.

**@timur** *[00:29]*  
I'm joining without a camera today. Hi all.

**@timur** *[00:35]*  
Before we start, @emil, we have an organisational question for the university. Do you mind if we record this call?

**@emil** *[00:45]*  
No, that's fine.

**@timur** *[00:47]*  
The recording and a sanitised English transcript will be shared privately with our instructors for assessment. Do you agree to that?

**@emil** *[00:57]*  
Yes, I agree.

**@timur** *[00:59]*  
One last question: do you permit us to publish the sanitised transcript in our public GitHub repository?

**@emil** *[01:05]*  
Yes, you may.

**@timur** *[01:07]*  
Thank you. @speaker3, could you please share your screen? First, I'd like to go through the user stories. We have prepared 10 user stories derived from the analysis of our previous meeting and product research. We'd like to get your feedback, approval, or any requested changes. Stories are tagged with Must Have, Should Have, and Could Have priorities. Our strategy is to focus on the Must Have stories for the core product; Could Have stories will be tackled only if the base product is delivered successfully and time permits.

---

**User Story Presentation**

**@timur** *[03:08]*  
**US-01:** As an app user, I want to create an account so that I can store personal data and have a personalised interface. Priority: Must Have.

**US-02:** As a registered user, I want to add purchased products by scanning a receipt or by manual search. Priority: Must Have.

**US-03:** As a user, I want to receive recipe recommendations based on available products, so that I can cook from what I already have and minimise food waste. Priority: Must Have.

**US-04:** As a registered user, I want to track the total calories and macronutrients (proteins, fats, carbohydrates) of added products, so that I can control my diet and reach my health goals. Priority: Must Have.

**US-05:** As a registered user, I want to browse and select meal plans for weight loss, maintenance, or gain. Priority: Should Have.

**@timur** *[04:38]*  
**US-06:** As a user, I want to receive reminders about remaining daily macronutrient targets (calories, proteins, fats, carbohydrates), so that I do not miss my daily goals.

**@emil** *[05:03]*  
Regarding US-06 — when exactly would that notification arrive? What is the idea behind it?

**@timur** *[05:19]*  
It would not arrive at the very end of the day, but sometime in the afternoon — before it is too late to eat. At a specific configurable time, the notification would state how many macronutrients remain to be consumed for the day, with the message that there is still time to reach the goal before sleep.

**@emil** *[06:05]*  
Got it. That works. As a potential additional feature beyond MVP: instead of just showing numbers, the notification could suggest specific products — either already in the user's inventory or available to buy at a nearby store before closing. You could add that as a separate Could Have story.

**@timur** *[06:42]*  
Noted. Moving on.

**US-07:** As a user, I want to track expiry dates of products I own, so that I reduce food waste and save money. Priority: Must Have.

**US-08:** As a user, I want the application to recognise synonyms and word forms when entering products, so that items are correctly categorised. Priority: Could Have. We flagged it as Could Have due to technical uncertainty.

**@emil** *[08:49]*  
That's fine. Though I'd actually rate US-08 as Should Have — semantic/vector search models make this reasonably straightforward. What makes you think it's technically hard?

**@speaker3** *[09:31]*  
I haven't implemented anything like this before, so I'm not confident yet.

**@emil** *[09:46]*  
Understood. I'd suggest reading about semantic data models — it may not be as complex as you think. I wouldn't put it at Could Have; Should Have seems more fitting. But we can revisit this as the work progresses.

**@timur** *[10:28]*  
Agreed. We'll update the priority to Should Have.

**@timur** *[10:35]*  
**US-09:** As a user, I want to search my inventory through a search bar. Priority: Must Have.

**US-10:** As a registered user, I want to sort products by serving size or by macronutrient content, so that I can more easily select recipes. Priority: Could Have.

**@emil** *[08:49]*  
OK. Good.

**@timur** *[08:53]*  
So, are the user stories approved — with the corrections noted?

**@emil** *[08:59]*  
Yes, with the adjustments — change US-08 from Could Have to Should Have.

---

**MVP v0 Demo**

**@speaker3** *[10:44]*  
Shall I show what's built so far?

**@emil** *[10:47]*  
If you have something ready, I'd be happy to see it.

**@speaker3** *[10:52]*  
I need screen-share permissions first.

**@speaker4** *[10:57]*  
@timur, just give him presenter rights, it'll be easier.

**@speaker3** *[11:22]*  
OK, visible now?

**@timur** *[11:24]*  
Yes.

**@speaker3** *[11:26]*  
I can't deploy yet because my university subscription is still being provisioned by the IT department. Here's the local build. I've registered, entered my parameters, and the app has calculated my daily macros. I can update current weight, daily mode, macro targets, and number of meals (3–5), with macro distribution across meals. Recipes are not yet populated — I haven't parsed the recipe data yet. Receipt scanning by photo is not implemented yet; only QR-code scanning is working at the moment. Let me add "tomatoes, 1 kg" as an example — the XGBoost classifier categorises by keywords: dairy, chicken, meat, and so on. The model achieves around 91–92% accuracy. Bread was classified as grains because I haven't added a bakery category yet, but that can be corrected manually.

**@speaker3** *[13:12]*  
Here you can confirm and add items through category menus: dairy, meat, fruit, etc. You can edit quantities. Then "Add to diet" — select meal (breakfast, lunch, dinner), enter the amount in grams, and macros are calculated and logged. You can also add products manually from an external source — I parsed a supermarket catalogue while training the model; some data fields are misaligned but that's a one-line fix.

**@emil** *[14:32]*  
Looks solid.

**@speaker3** *[14:34]*  
The UI is still placeholder — I'll redesign it. The pink colour scheme doesn't appeal to me. I have a reference app on my phone with a style I really like; I'll aim for something similar. It has quick-add for weight, water, measurements, and snacks, and a recent recipes section. It also supports food scanning by label (OCR for macros + name) or barcode.

**@emil** *[15:47]*  
So mostly manual entry there as well?

**@speaker3** *[15:56]*  
It has label scanning and barcode scanning too.

**@emil** *[16:20]*  
OK. User flows and start pages are fairly standard across apps in this category; the differentiator is functionality.

**@speaker3** *[16:35]*  
And recent products are stored in suggestions here.

**@emil** *[17:05]*  
Go back through the left nav once more, please. Is the expiry date section mocked or already implemented — when I go into the fridge section, are "good for 5 days / 7 days" values real?

**@speaker3** *[17:31]*  
Yes, that's live — it's calculated from average shelf-life data.

**@emil** *[17:37]*  
OK, looks good overall. I'll think about any additional feedback before our next call. Could you send me a screen recording of the user flow? Nothing major will change — just possibly minor tweaks. Please record a walkthrough and send it to me.

**@speaker3** *[18:12]*  
Sure.

**@timur** *[18:14]*  
Anything else?

**@emil** *[18:22]*  
Is that everything?

**@timur** *[18:25]*  
Yes, that covers our agenda.

**@emil** *[18:34]*  
Alright. Well done, team. Everything looks good so far. One small request: please try not to schedule calls on weekends. I understand why it happened, but going forward let's aim for weekdays — I'll do my best to find a time that works for everyone.

**@timur** *[19:15]*  
Of course, understood. Goodbye.

**@emil** *[19:19]*  
Good luck, everyone. Have a productive week. Goodbye.

**@timur** *[19:24]*  
Thank you. Goodbye.

---

*[Post-meeting team discussion — off-topic; not part of the customer review]*

**@speaker4** *[19:32]*  
Are you admin? You need to close the session so the recording saves.

**@speaker3** *[19:38]*  
How do I transfer? Let me make you organiser.

**@speaker4** *[20:00]*  
Close the conference and save it — I'll try from my side.

**@speaker3** *[20:06]*  
I pushed the Docker image, by the way.

**@speaker4** *[20:18]*  
Send the link to the PR that needs review.

**@speaker3** *[20:35]*  
Are you @riderfa on the repo? I added you as a reviewer.

**@speaker4** *[20:46]*  
Yes.

**@speaker3** *[20:48]*  
You're added. Each PR needs reviewers added manually. Anyway — do we need to run everything on a VM?

**@speaker4** *[21:13]*  
Yes, on the VM and deployed.

**@speaker3** *[21:15]*  
My subscription still isn't loading. I contacted the IT department, not sure what else I can do.

**@speaker4** *[21:30]*  
Should we merge the request?

**@speaker3** *[21:36]*  
Yes, merge it. Done.

**@speaker4** *[21:52]*  
Close the conference.

**@speaker3** *[21:55]*  
OK, bye everyone.
