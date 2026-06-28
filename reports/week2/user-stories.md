## Note on user-story ID numbering

The stable IDs below (US-01 … US-10) are the **final, canonical IDs** used by every later
artifact: this document, [`README.md`](README.md)'s coverage mapping, [`mvp-v0-report.md`](mvp-v0-report.md),
[`analysis.md`](analysis.md), and the [Week 3 GitHub Issues](https://github.com/xqzme-otec/fitFood/issues) (#21–#29) created from
this backlog.

During the live customer call ([transcript](customer-meeting-transcript.md)), stories were
numbered in the **order they were discussed**, which differs from the final stable IDs
assigned when this document was written immediately afterward. The mapping below lets you
reconcile the two:

| Meeting-order # (transcript) | Story content | Stable ID (this document) |
|---|---|---|
| US-01 | Account creation / registration | **US-10** |
| US-02 | Add products (receipt scan / manual) | **US-01** |
| US-03 | Smart recipe recommendations | **US-02** |
| US-04 | Daily macronutrient tracking | **US-03** |
| US-05 | Structured dietary plans | **US-04** |
| US-06 | Daily goal notification | **US-05** |
| US-07 | Expiration date tracking | **US-06** |
| US-08 | Recognition of similar words (priority raised Could Have → Should Have during the call) | **US-07** |
| US-09 | Inventory search | **US-08** |
| US-10 | Recipe sorting options | **US-09** |

All other documents in this repository (README, MVP v0 report, analysis, Week 3 backlog and
Issues) use the **stable ID** column. Only the transcript and the live-discussion parts of the
meeting summary use the meeting-order numbering.

## Initial proposed MVP v1 scope 
* US-01 
* US-02 
* US-03
* US-05
* US-06
* US-08
* US-10


## US-01: Adding Products to Inventory

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to be able to add products based on the store's receipt or by manually entering the product so that I can save time during the product logging process.

### Notes and constraints

Scanning and adding products by receipt is an advantage for the user in terms of time, because people do not have time to add each product to the internal data storage. Manual entry serves as a necessary fallback mechanism if the user does not have a receipt or if the receipt is unreadable.


## US-02: Smart Recipe Recommendations

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to see recommendations of recipes for dishes that I can cook so that I can use the available ingredients and reduce the waste of food.

### Notes and constraints

A recipe database is required for this feature to function. The recommendation algorithm should prioritize recipes where the user has the highest percentage of matching available ingredients in their inventory.


## US-03: Daily Macronutrient Tracking

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to track the total calories, proteins, fats, and carbohydrates of the food I log, so that I can monitor my daily intake and successfully follow my fitness goal: gaining, losing, or maintaining weight.

### Notes and constraints

The web app should accurately summarize the nutritional value of all registered products for the current day. For this function to work properly, integration with the food nutrition database is required.


## US-04: Structured Dietary Plans 

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Registered User, I want to view and select recommended dietary plans for losing, gaining, or maintaining weight, so that I have a structured guide to follow using the ingredients I have already added to my inventory.

### Notes and constraints

Providing dietary plans adds significant value by connecting recipe generation with long-term health goals. The web app will match the user's inventory against the requirements of the selected dietary plan to suggest what to cook.


## US-05: Daily Goal Notification

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to receive reminders about my remaining daily goals for calories, fats, and carbohydrates, so that I stay on track with my dietary plan and do not forget to log my meals.

### Notes and constraints

Notifications will allow the user not to make mistakes and follow the plan to maintain weight. For push notifications, the web app will need to request access rights from the user.


## US-06: Expiration Date Tracking

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to track the expiration dates of the products in my inventory, so that I can prioritize consuming them before they spoil, reducing food waste and saving money.

### Notes and constraints

The web app can display products that expire within the next few days. The recipe recommendation algorithm should give preference to dishes that use ingredients that will expire soon.



## US-07: Recognition of similar words

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Registered user, I want the system to recognize synonyms and different word forms ("tomato" "tomatoes"), so that I can easily find and add products without needing to guess the exact spelling used in the database.

### Notes and constraints

Adding advanced search capabilities for working with morphology, plural, and synonyms dictionaries.



## US-08: Inventory Search

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Registered User, I want to find products in my inventory through the search bar so that I can see the quantity of this product and all the information about the product.

### Notes and constraints

The web app's search function should dynamically filter the list of products as the user types the product name.


## US-09: Recipe Sorting Options

**Requirement status:** Active
**MoSCoW priority:** Could Have

As a Registered User, I want to be able to sort by the number of macronutrients or the number of servings for the recipes recommended to me, so that I can shorten the time in a more convenient format and make a choice faster based on the sorting I have chosen.

### Notes and constraints

By default, the web app sorts recommended recipes by the highest percentage of matching available ingredients. Sorting by macronutrients and portions will serve as additional filters.


## US-10: User Registration and Authentication

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a New User, I want to register and log into my personal account so that my food stocks, diet plans, and saved recipes are stored and available in different sessions.

### Notes and constraints
For the MVP, standard email and password authentication is sufficient. The web app must securely hash user passwords before saving them to the database.



