# Customer Review Transcript — Sprint Review Meeting

> **Publication status:** Published with team permission. Personal names have been redacted or replaced with roles. Minor filler words and off-topic fragments removed for readability. Meaning is preserved throughout.

---

**Date:** [redacted — see customer-review-summary.md]
**Participants:** Product Owner / Customer (Speaker 04), Developer / Tech Lead (Speaker 03), Scrum Master / Team Lead (Speaker 01), Team Member (Speaker 00), Team Member (Speaker 02)

---

**[00:02:57]**
**Team Lead:** We are ready to start. One moment — sorry for the delay, another team member may still join.

**[00:03:10]**
**Customer:** No problem.

**[00:04:03]**
**Team Lead:** I'd like to begin our short presentation. Today our main goal is to show you the project — specifically the technical part — but first I'd like to walk you through our board and the analytical work we've done. We ran a Sprint this week and I want to show you the overall structure of our work.

**[00:04:52]**
**Team Lead:** We'd like to present the build-up of all our work. During this Sprint we ran a board with defined backlog items. We'd like to show you what we've done and get your feedback — perhaps some changes in your preferences. Work is going at full speed. Here is our analysis board where we collaborate, analyze features, and manage user stories. Our entire backlog comes from the user stories we worked on and discussed in previous meetings. All priorities remain the same as discussed before — they've just been reformatted. I'll now hand over to [Developer] who will show you the technical part.

**[00:06:32]**
**Developer:** One moment. In terms of changes — we've added a feature where items already present in the inventory appear at the top immediately. When a product is added, it's read directly from the fridge. In the recipes section we've added an "add your own" option, where users can write something. I also fixed the issue with product names — there was garbage text like review counts, ratings, and other noise appearing in the product name field. I've cleaned that up. One remaining issue is that for some products like cottage cheese, only the base name appears without the fat percentage, so users need to find the right one by caloric value.

**[00:07:59]**
**Customer:** Can you remind me — how do you search for products, what database are you using?

**[00:08:07]**
**Developer:** We're using a CSV file sourced from [a major grocery retailer].

**[00:08:43]**
**Customer:** Can you open that list again, please? I think there were percentage values and other fields.

**[00:08:55]**
**Developer:** The 93% you see — not all products had their macros parsed correctly. Some entries genuinely don't have full macro data; others had only protein or only carbs, so they weren't parsed. Right now, missing values are replaced with null. For example, some smoothies only list carbohydrates with nothing else. I also added synthetic data — about 3,600 entries — when training the model, to improve classification accuracy. However, those entries are not used in the product search system. There's also a name-cleaning report: for example, "82% butter" is now correctly distinguished from the unbranded variant.

**[00:09:54]**
**Customer:** Are calorie calculations based on 100 grams?

**[00:09:58]**
**Developer:** Yes, always, as is standard.

**[00:10:01]**
**Customer:** Good. Please show the app again. Let's walk through the user flow together. I open the app — what's the first thing I should do, by your logic?

**[00:10:17]**
**Developer:** Register and enter your goals.

**[00:10:19]**
**Customer:** OK, I'm on that page. Then, say I go to the store and buy products — what do I do next? Use the receipt scanner? Or add manually? The scanner isn't implemented yet?

**[00:10:34]**
**Developer:** Currently only text-based input. We still have 16 items open, of which about 6 user stories are done. The rest will be reworked. We'll probably remove the scanner from the main page for now and add it back later. The "add" page is also empty — we'll move that to the main page. I was thinking about showing products whose expiry date is approaching, though I'm not sure about that idea.

**[00:11:17]**
**Customer:** Regarding design and user flow — I'm happy to trust your judgment here. I don't have a firm picture in my head, so I rely on your ideas and creativity. For example, if you wanted to show a feed of previously generated recipes with images at the bottom — something you scroll through and see recipe pictures — that would also engage the user. They'd see they had chicken yesterday and meat the day before, and today the app suggests fish, which happens to be expiring first. Just my ideas for a nice visual. Regarding the tracker, though — can you show me what's in your to-do list? I saw it briefly but didn't read it carefully. What are your current priorities?

**[00:12:21]**
**Developer:** No explicit priorities set right now. About half the items are closed. Today we were doing refactoring. What I want to do next is parse recipes — including images — and then split lunch and dinner. The recipe database is large.

**[00:12:49]**
**Customer:** So what remains is the recipe generation itself — the matching between what's in the fridge and what's in the recipe database. That's what's left.

**[00:13:02]**
**Developer:** Yes, that's in the user stories. After the recipe parser is done I'll add search. It's tracked in the backlog.

**[00:14:16]**
**Customer:** One more point — last time I noticed that predicted expiry dates were visible somewhere in the app. How does that work currently?

**[00:14:46]**
**Customer:** Where is expiry date displayed, and how is it implemented?

**[00:15:33]**
**Developer:** The LLM roughly determines the category... I noticed I left something unfinished here. I was refactoring categories. I wasn't happy with the existing ones — I wanted to merge meat and fish, merge fruit and vegetables, remove sauces, remove corn, create a dry-goods category, and add baked goods. I did that, but the receipt scanner part isn't done yet.

**[00:16:17]**
**Customer:** In our very first meeting I mentioned a resource that lets you retrieve product information — including expiry date for some products — using a product's barcode identifier. I can share that with you. You could combine it: when you scan a receipt, you look up the product by its barcode ID in that external resource. You haven't started receipt scanning yet, so here's an idea for when you do. What do you think?

**[00:17:04]**
**Developer:** If you can share it, that would be great — we're about to work on that.

**[00:17:08]**
**Customer:** Agreed — I'll send you two sources. One link for the QR code, one for retrieving product information. Try to combine what the external resource provides with your own logic, because for some items — like cucumbers — there is no expiration date in the external source. For those, you'll need to estimate. The estimate doesn't need to be perfect, just a reasonable approximation to close that gap.

**[00:17:39]**
**Customer:** What are your tasks for this week? Finish expiry date and start on the recipe database?

**[00:17:50]**
**Developer:** Everything that's listed. I think we can manage most of it. Frontend will probably carry over to next week — we'll likely redesign the frontend completely.

**[00:18:11]**
**Customer:** For MVP, I think it's fine as-is. But if you want to redo it, go ahead.

**[00:18:17]**
**Developer:** Also — we added filters.

**[00:18:25]**
**Customer:** Good. Please update that. Where is the site hosted? Is it running locally?

**[00:18:32]**
**Developer:** On a [university] VM and on [a cloud service].

**[00:18:35]**
**Customer:** Interesting! Send me the IP address.

**[00:18:39]**
**Developer:** I'll update the README as well — the link there is outdated.

**[00:18:45]**
**Customer:** Is there a whitelist on the VM?

**[00:18:49]**
**Developer:** I don't think so. The VM doesn't allow hosting Telegram bots though.

**[00:18:57]**
**Customer:** Telegram bots can't be hosted right now because of network filtering on data centers — that's a current issue for the whole industry. OK, send me the IP and the repository link. I'll send you the two data sources. Agreed?

**[00:19:16]**
**Team Lead:** Yes, thank you.

**[00:19:19]**
**Customer:** Overall, good work, team. Progress is visible. Keep it up. We can wrap up.

**[00:19:28]**
**Team Lead:** Thank you very much.

**[00:19:29]**
**Developer:** Have a good day.

**[00:19:32]**
**Customer:** Goodbye.

---

*Post-meeting conversation between team members (not part of the Sprint Review) omitted.*
