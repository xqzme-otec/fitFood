# Sprint Review Transcript — Week 6 (Sprint 4 / Trial Release)

> **Publication status:** Published with team permission. Personal names replaced with roles. Off-topic fragments and silence gaps removed for readability. Meaning fully preserved.

---

**Participants:**
- **Customer / Product Owner** (Speaker 01)
- **Scrum Master / Team Lead** (Speaker 00)
- **Developer A** (Speaker 02)
- **Team Members** (implied — present but minimal dialogue this session)

> **Note:** This was a shortened review session. The customer had recently submitted their thesis and had limited time. The customer agreed to review the product in more detail independently after the call and send written feedback.

---

**[00:00:31]**
**Scrum Master:** Hello. Today we'll follow the usual plan. I'll show the current backlog, then Developer A will present the week's results, then we'll ask you to test the app yourself if possible, and finally we have some organisational questions about product handover.

**[00:07:40]**
**Customer:** Do I need to watch everything live during the recording, or can I review parts of it off-camera?

**[00:09:21]**
**Scrum Master:** Off-camera is fine.

**[00:09:41]**
**Customer:** Let's move quickly — 10 to 15 minutes ideally. I submitted my thesis this week and I'll send you feedback shortly after — tomorrow or the day after. Just show me the app. Developer A usually shares his screen — let him show me what was done, any difficulties, and what changed this week. That will be enough for now. I'll review everything in detail myself later.

**[00:17:10]**
**Developer A:** OK, I'll take over then.

**[00:18:01]**
**Developer A:** Can you see my screen?

**[00:18:41]**
**Customer:** Yes, I can see it.

**[00:19:11]**
**Developer A:** Right, so — everything that needed to be done regarding the RAG-based system: recommending dishes based on fridge contents, ensuring KBZHU is not under- or over-counted, and having all products sourced from the fridge. The LLM now generates dishes entirely from what it's given. It generates its own meal ideas based on the ingredients provided. And the fridge update now happens automatically. Let me demonstrate.

---

*[Developer A sets up the demo — approximately 15 minutes of preparation]*

---

**[00:36:50]**
**Developer A:** OK — pressing "Generate Meal Plan" now. Give it a moment to think.

**[00:40:11]**
**Customer:** Oh wow — that's impressive! Is this running on Docker Compose?

**[00:41:50]**
**Developer A:** Yes, it's running on Compose right now.

**[00:42:40]**
**Customer:** Interesting — can you tell me how you implemented the generation? You mentioned RAG. Did you improve the previous approach?

**[00:44:51]**
**Developer A:** I'm feeding the LLM the candidate recipes plus all the fridge ingredients with their KBZHU. The model then generates full dishes — for example: vegetable omelette with broccoli and cheese, or chicken strips with broccoli, carrot, onion, Russian cheese, butter, salt, and pepper. All of those are exactly what's in the fridge. When I press "I ate this," each ingredient is logged individually. The one downside is that generation is a bit slow.

**[00:51:30]**
**Customer:** That's understandable given the model size.

**[00:51:50]**
**Developer A:** It's running on a 120B parameter model.

**[00:53:40]**
**Customer:** Got it. Just to confirm — you're not running the model locally and fine-tuning it, right? You're just sending requests to an external hosted model?

**[00:55:10]**
**Developer A:** Correct — no local training or fine-tuning. It's a single API request to the hosted model.

**[00:56:10]**
**Customer:** And what exactly are you sending it?

**[00:57:11]**
**Developer A:** The candidate recipes and the fridge ingredients.

**[00:57:51]**
**Customer:** All recipes in the database?

**[00:58:11]**
**Developer A:** No — only the ones that roughly match based on the search. And all the fridge ingredients with their KBZHU and quantities. A typical fridge won't have hundreds of products so the context size is manageable.

**[01:04:20]**
**Customer:** After generating — do the used products actually leave the fridge?

**[01:04:51]**
**Developer A:** Yes, they do. Watch — chicken strips here. Let me open the fridge. Under meat and fish — 60 grams were deducted. I had added 1 kg during the demo, and you can see the remainder now.

**[01:06:20]**
**Customer:** That's great — everything is working properly. The only remaining issue is that it's not deployed yet?

**[01:06:41]** *(implied)*
**Developer A:** Yes — I'm still having some deployment issues, but locally it all works correctly.

**[01:11:00]**
**Customer:** What about calorie balance across meals — if lunch is under target and dinner is over, how is that handled?

**[01:12:11]**
**Developer A:** If the user presses "No, I won't eat this," the system finds an alternative suggestion.

**[01:13:41]**
**Customer:** OK, that's a reasonable approach for now. In general, this looks good. I don't have further questions right now — I need to explore it myself. Please update the repo and I'll pull and review the code, then send written feedback. Let's close the review part there.

---

## Organisational Questions — Product Handover

**[01:18:50]**
**Scrum Master:** Can we ask a couple of organisational questions? The course asked us to clarify.

**[01:19:41]**
**Customer:** Yes, go ahead.

**[01:20:01]**
**Scrum Master:** What is your view on the product's current completeness for handover? Do you think it needs further work, or is it close to ready?

**[01:22:20]**
**Customer:** I should say this on the record for documentation purposes, right?

**[01:24:11]**
**Scrum Master:** Yes — just your current opinion.

**[01:24:31]**
**Customer:** OK. My current view is that the product is generally in a good state. I'll be honest — I originally envisioned something slightly different: I expected a custom-trained model rather than prompting a hosted LLM. But if the LLM handles the prompts well and produces good results, that's an acceptable approach. Overall I'm satisfied with the outcome. I like how it looks, I like that products are added and removed from the fridge, and that at least one generation cycle works end-to-end. That's already demonstrative. That said, I want to explore it myself in more detail, outside the call, and look at the code directly. I'll send feedback once I've done that.

**[01:31:51]**
**Scrum Master:** Thank you. And regarding the formal repository handover — this is our final week next week. How would you like us to handle it? We were thinking of transferring ownership to you.

**[01:35:20]**
**Customer:** Yes. As an organisational matter — I don't worry about it too much. But yes, let's document this properly. Just add me as the repository owner, and after that you can stay as collaborators or I can manage that as needed.

**[01:39:30]**
**Scrum Master:** Thank you — we needed to know the format for the handover.

**[01:40:21]**
**Customer:** Just transfer the repo and make me the owner. That format works.

**[01:43:30]**
**Scrum Master:** Understood. We'll wait for your written feedback and then know what to address in the final week.

**[01:45:01]**
**Customer:** Yes, exactly. Overall — good work, well done.

**[01:46:51]**
**Customer:** All right, everyone — have a good weekend. Goodbye.

**[01:47:40]**
**Scrum Master:** Thank you. Goodbye.

**[01:48:00]**
**Developer A:** Take care.

---

*Recording ended.*
