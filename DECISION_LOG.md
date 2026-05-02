# Product Decision Log — Visibly

---

## 1. Problem Framing

**The problem:** Merchants are invisible to AI shopping agents and have zero tools to diagnose it.

When a buyer asks ChatGPT, Perplexity, or Shopify's Shop AI "best protein bar under ₹500 with free returns," the AI agent evaluates every product in the catalogue and ranks them. Products with vague descriptions, missing return policies, weak trust signals, or incomplete specifications get silently dropped. The merchant never knows this happened. There is no error log. There is no "AI Search Console" equivalent of what Google Search Console does for traditional SEO.

This is not a fringe problem. Shopify has Shop AI. Google has AI Overviews. Amazon uses LLMs for product discovery. Every one of these systems penalises incomplete product data. Unlike traditional search, there are no ranking signals merchants can inspect. They are flying blind.

**The gap we exploit:** Traditional SEO tools measure keyword density, backlinks, and page speed. None of that is what an LLM reasons about. An LLM evaluates buyer intent match, data completeness, policy clarity, trust signals, and contextual specificity. You cannot optimise for that with a keyword scanner. You need to simulate the actual AI decision process - and then close the loop by writing the fix directly back to the store.

**What the track asked for and what we built:**

The track asked for a tool that identifies gaps in a merchant's AI readiness, prioritises improvements as a ranked action plan, shows how AI agents currently perceive the store versus how the merchant wants to be represented, and helps merchants take concrete action. Visibly does all four - and goes one step further by writing the fix directly to Shopify via the Admin API, which the track brief did not require but which is the only way a recommendation system becomes a growth system.

---

## 2. Approach Decision: Simulation-First, Not Analytics-First

We considered two approaches:

**Option A - Analytics-first:** Scan product data, compute readability scores, check for missing fields, generate a report card. This is what most existing SEO tools do.

**Option B - Simulation-first:** Actually run an AI agent against the product catalogue, observe which products get selected and rejected and why, then work backwards from those failures to fixes.

**We chose B.** Here is why:

An analytics scanner would flag "description is 15 words - too short." But it cannot tell you whether a 15-word description actually causes the product to be excluded by an AI agent for a specific buyer query. The failure mode is contextual: a 15-word description might be completely acceptable for a ₹50 commodity product but fatal for a ₹2,000 specialty item where the buyer needs specifications, certifications, and trust signals before purchasing.

AI agents do not count keywords. They reason about whether a product satisfies buyer intent. The only way to know if your product fails is to simulate that reasoning. Analytics can tell you what is missing. Simulation tells you what is costing you sales.

The tradeoff: simulation is slower and more expensive - it requires LLM calls per product per query. We accept that cost because the output is fundamentally more accurate and actionable. The merchant is not told "your description is short." They are told "your product failed 5 of 7 simulated buyer queries - here is the specific data that caused each failure and here is the fix."

This decision directly maps to the track requirement: "not just a technical scan, but insight into what matters for conversion."

---

## 3. Specific Decisions With Reasoning

### 3.1 — Why simulation-first over analytics-first (detailed)

- **What we chose:** Run AI simulations against real buyer queries before generating any recommendations.
- **What we considered:** Pure deterministic scoring without any LLM simulation.
- **Why we chose it:** Deterministic scoring tells a merchant their description is short. Simulation tells them their description caused their product to be skipped for the query "high-protein snack with clean ingredients." The second framing is what drives action. The track asked for tools that show merchants "how AI agents currently perceive their store" - deterministic checks cannot answer that question.

### 3.2 — Why 7 queries per product (not 5, not 10)

- **What we chose:** 7 queries covering four intent types: research, compare, buy, and problem-solving.
- **What we considered:** 5 queries (faster and cheaper) or 10+ queries (more statistical confidence).
- **Why 7:** At 5 queries we could not reliably cover all four intent types - results clustered around buy intent and missed research and comparison queries entirely. At 10+, runtime becomes unacceptable for a live product (each query = 1 LLM call × N products). 7 gives us 1–2 queries per intent type, producing a stable inclusion rate without excessive latency. For a 12-product store: 7 queries × 12 products = 84 evaluations. At roughly 2 seconds per call with batching, that is under 3 minutes. Acceptable. 10 queries would push to over 4 minutes. Not acceptable.

### 3.3 — Why persona extraction runs once at store level, not per product

- **What we chose:** One LLM call at the start of every audit to identify buyer type, use cases, and sophistication level for the entire store.
- **What we considered:** Per-product persona extraction that adapts to each product's niche.
- **Why store-level:** A store's buyer persona is a property of the store, not individual products. A fitness supplement store targets the same buyer archetype across all its products. Running persona extraction per product would waste tokens, introduce inconsistency between products in the same audit (different personas for products the same buyer would purchase together), and add approximately 12 extra LLM calls per audit. One call gives us a shared context that makes all downstream query generation coherent. The assumption breaks for wildly mixed-category stores - acknowledged in section 6.

### 3.4 — Why we added a fairness validation gate before generating fixes

- **What we chose:** Before generating any fix recommendations, we run a fairness checker that classifies each exclusion as either "correct" (product genuinely does not fit the buyer) or "incorrect" (product fits the buyer but data is too weak to prove it).
- **What we considered:** Skipping validation entirely and generating fixes for every failed query.
- **Why the gate:** Without it, the system produces false alarms at scale. If a buyer searches "vegan protein bar" and the product is whey-based, the exclusion is correct - the product genuinely does not match. Generating fix recommendations for this case trains merchants to distrust the tool. Alert fatigue kills products like this. The fairness gate cuts actionable noise by 30–50% in our testing. Every recommendation that reaches the merchant is a genuine gap, not a false alarm. This was the most counterintuitive product insight we had - a tool that recommends fewer fixes but only correct ones is more valuable than one that recommends everything.

### 3.5 — Why category-aware scoring over a generic rubric

- **What we chose:** A 9-category detection engine where each category uses a bespoke rubric scoring specific content depth requirements.
- **What we considered:** A single generic rubric applied to every product (e.g. checking if description word count exceeds 50).
- **Why we chose it:** Generic checks generate false positives and false negatives simultaneously. A 50-word description might be excellent for a t-shirt and abysmal for a protein supplement where buyers need macros, allergens, and certifications before purchasing. By categorising products first we demand specific data shapes that match actual buyer expectations: electronics require numeric specs with units (`5000mAh`, `65W`); apparel requires a percentage material breakdown (`100% cotton`); health food requires named ingredients, not just the word "ingredients." This mirrors what the track brief called "identifying gaps in AI readiness" - generic checks cannot identify category-specific gaps.

### 3.6 — Why normalizeProduct() was necessary and what it fixed

- **What we chose:** A strict normalisation function that standardises Shopify's raw API output into our internal schema before any scoring runs.
- **What we considered:** Updating the scoring engine to dynamically check multiple field name variants throughout the codebase (`body_html || description`).
- **Why we chose it:** Shopify returns `body_html` and tags as a comma-separated string. Our engine expected `description` and a tag array. Without normalisation, every rubric check evaluated `undefined` and every product scored near zero regardless of actual listing quality - a critical silent failure mode. Centralising the fix in a single `normalizeProduct()` function cleanly isolates parsing logic from scoring logic. The alternative of scattering `|| fallback` checks through 60+ rubric criteria would have been unmaintainable and error-prone.

### 3.7 — Why the 92 score ceiling and 91% citation cap exist

- **What we chose:** Hard caps. No product can score above 92/100. Citation probability is permanently capped at 91%.
- **What we considered:** Allowing scores to reach 100/100 and probability to reach 99% if a product satisfies all rubric criteria.
- **Why we chose it:** This is a deliberate trust decision, not a technical constraint. In the real world of LLM-based retrieval, no product listing is ever guaranteed to be cited for every relevant query. Showing a merchant "100% citation probability" creates a false certainty that the system cannot back up - and when that product is still skipped for some queries (which it will be), the merchant loses trust in the entire tool. The ceiling aligns expectations with the probabilistic reality of LLM inference. A score of 92 means the listing is excellent. It does not mean the problem is solved.

### 3.8 — Why prediction scores use a realism discount

- **What we chose:** When projecting gains from AI-generated fixes before they are applied, a 0.85 realism multiplier is applied to projected gains and predicted scores are capped at 85.
- **What we considered:** Showing the full mathematical gain if all fixes were perfectly implemented.
- **Why we chose it:** Earlier iterations showed products jumping to 99% predicted citation probability after a single description fix. This was mathematically naive - it assumed every improvement is perfectly absorbed by the AI agent immediately and completely. The 0.85 discount accounts for the reality that real-world gains are partial: the AI agent may weight other factors, the fix may not be written as well as the rubric assumes, and not all queries benefit equally. Post-apply scores are shown uncapped because they reflect empirical measurement from re-fetching the live product - those numbers are true, not predicted.

### 3.9 — Why one-click apply required a confirmation modal and revert system before shipping

- **What we chose:** We required an immutable `optimization_history` ledger and a `POST /revert` endpoint to be built and tested before shipping the direct-to-Shopify write feature.
- **What we considered:** Shipping the `PUT` endpoint immediately with a simple "are you sure?" browser alert.
- **Why we chose it:** Writing to a live product catalogue is a destructive operation. A hallucinated LLM description - even one that passes internal quality checks - could permanently overwrite copy that a merchant spent significant time crafting. The confirmation modal forces the merchant to review the exact diff before anything goes live. The revert system means every mistake is recoverable. These were not optional safety features - they were the minimum necessary bar for the feature to be trustworthy enough to ship. A write-only tool without rollback would have been a liability, not a product.

### 3.10 — Why the analytics pipeline uses SQLite snapshots instead of computing on-demand from live Shopify data

- **What we chose:** `better-sqlite3` running in WAL mode, storing daily `score_snapshots` and `product_sales`, updated by a background cron job running every 60 minutes.
- **What we considered:** Fetching live data from Shopify on every analytics page load and computing trends statelessly in real time.
- **Why we chose it:** Historical trend calculation is mathematically impossible without stored state. You cannot show a merchant "your score improved 33 points over 6 weeks" if you only have today's data. SQLite was chosen over PostgreSQL because it requires zero infrastructure overhead while handling the read-heavy, low-concurrency usage pattern of a per-merchant analytics dashboard. WAL mode enables concurrent reads without blocking the cron write. The tradeoff - single-node architecture that does not scale horizontally - is acceptable for the current stage and acknowledged in the limitations section.

### 3.11 — Why GPT-4o-mini over other models

- **What we chose:** OpenAI GPT-4o-mini for all LLM calls - simulation, query generation, fairness checking, and fix generation.
- **What we considered:** GPT-4o (stronger reasoning, 10× higher cost), Claude 3.5 Sonnet (strong but different API surface), and open-source models via Groq (fast but unreliable JSON output).
- **Why GPT-4o-mini:** Three reasons. First, JSON reliability: with `response_format: { type: "json_object" }`, GPT-4o-mini produces valid JSON on virtually every call. Open-source models through Groq broke JSON formatting frequently, requiring retry logic that added latency and unpredictability. Second, cost: at $0.15 per million input tokens, a full 7-query audit on a 12-product store costs under ₹5. GPT-4o would cost 10× more for the same run. Third, latency: sub-2 second responses make the product feel responsive during live demos. The tradeoff - weaker nuanced reasoning than GPT-4o - is mitigated by highly structured prompts that constrain the output space and leave little room for reasoning errors.

### 3.12 — Why counterfactual re-simulation rather than just showing the fix

- **What we chose:** After generating fix recommendations, we apply them to a clone of the product and re-run the AI simulation to prove the fix works before the merchant sees it.
- **What we considered:** Showing the generated fix and claiming it would help without verifying it.
- **Why re-simulation:** "We think this will help" is not the same as "we simulated this and here is the predicted delta." The counterfactual engine takes the original product - which failed - applies the suggested improvements, and re-runs the exact same buyer query. If the product moves from excluded to included, the fix is validated. If it is still excluded, the fix is insufficient and the merchant needs to know that before applying it. This transforms Visibly from a recommendation tool into a proof tool. The track asked for concrete, actionable improvements - a counterfactual delta is the most concrete form of that.

---

## 4. What We Built That Was Initially Cut

### 4.1 — One-click fix application

**Originally cut because:** Writing to a live Shopify store via API felt too risky without a proper safety system. We were uncertain about scope verification, rate limit handling, and revert mechanics.

**Why we built it anyway:** We learned that friction kills optimisation loops entirely. Giving merchants a perfectly written AI-optimised description is only half the value. If they must copy it, open a new tab, log into Shopify Admin, find the product, paste it, and save - most will not do it consistently. The gap between "here is the fix" and "the fix is live" is where the value disappears. Building the write pipeline with the confirmation modal, the revert system, and scope verification transformed the tool from a passive dashboard into an active growth engine. This was the single highest-impact engineering decision we made after the initial build.

### 4.2 — Historical audit tracking and analytics

**Originally cut because:** The original system was designed to be stateless to avoid database complexity.

**Why we built it anyway:** Stateless auditing cannot answer the question merchants care most about: "Is this working?" A single audit score is a snapshot. Merchants need to see the trend - that their citation probability increased from 22% to 67% over four weeks of optimisation, and that this correlated with a measurable revenue increase. The SQLite database addition unlocked this entirely. The sales vs score scatter plot in the analytics tab is the most commercially compelling screen in the product because it answers the ROI question using the merchant's own data, not our claims.

---

## 5. What We Cut and Why

### 5.1 — Real-time Shopify webhook sync

**What it was:** Automatically detect when a merchant updates a product and trigger a targeted re-audit delta in real time.

**Why we cut it:** Requires Shopify embedded app OAuth, webhook registration, persistent background workers, and reliable event deduplication. The infrastructure complexity was out of scope. The manual "Refresh Data" button is sufficient to demonstrate the value proposition. With more time: build a proper embedded Shopify app with `products/update` webhook listeners triggering targeted re-audits per changed product.

### 5.2 — Multi-model simulation consensus scoring

**What it was:** Run the same buyer query against GPT-4o-mini, Claude, and LLaMA simultaneously, then compute a weighted consensus score per product.

**Why we cut it:** 3× the API calls, 3× the cost, and significant complexity in reconciling outputs from models with different evaluation tendencies. The ROI for a demo was insufficient. With more time: run 2–3 models in parallel and flag products where models disagree - divergence signals genuinely ambiguous product data that no single model can resolve.

### 5.3 — Image quality analysis

**What it was:** Evaluate product image resolution, alt-text completeness, and background quality using a vision model call per product.

**Why we cut it:** Requires GPT-4o with vision API, significantly increasing cost and latency per product. Current AI shopping agents primarily evaluate structured text data when making recommendations. This is a v2 addition once text optimisation is saturated.

---

## 6. What We Are Uncertain About

### 6.1 — Is 91% the actual ceiling for citation probability?

The 91% cap is a product trust decision, not an empirically validated mathematical threshold. We do not have data from real AI shopping agents to know the true theoretical ceiling for any product category. The cap exists because showing merchants 99% probability and then having their product skipped would be more damaging than showing a conservative realistic ceiling. If real-world calibration data against actual AI agent outputs were available, the curve and ceiling should be recalibrated accordingly.

### 6.2 — Do AI shopping agents actually behave like our simulation?

Our simulation models a "strict AI shopping agent" with specific evaluation criteria baked into the prompt. ChatGPT, Perplexity, and Shopify's Shop AI each have their own retrieval logic, ranking heuristics, and internal prompts that we cannot inspect. The architecture of the simulation is sound and the fairness gate makes the recommendations conservative. But the exact calibration against real-world black-box systems is unvalidated. This is the most significant honest gap in the system.

### 6.3 — Is 7 queries enough for statistical stability?

With 7 queries, a single borderline inclusion or exclusion shifts the inclusion rate by approximately 14 percentage points. That variance is meaningful. A product with a true inclusion rate of 50% could measure anywhere from 28% to 71% depending on query phrasing on a given run. We accept this noise as a constraint of cost and latency, but a production system likely needs 25+ queries per product for statistically robust confidence intervals.

### 6.4 — Does fixing descriptions actually improve real-world AI visibility?

We can prove our simulation includes a product after its description is fixed. We cannot prove that Perplexity's shopping agent or Google AI Overviews will immediately reflect that improvement. The counterfactual is internally valid within our simulation environment but externally unverified against proprietary systems. This is the difference between a logically sound proof of concept and a commercially validated product.

---

## 7. What We Would Build Next

### 7.1 — Competitor benchmarking

Compare a merchant's category scores against anonymised averages from other stores on Visibly. "Your protein bar is in the bottom 30% of health food stores on Visibly" creates urgency that internal absolute scoring cannot. This is only possible once there are enough connected stores to generate meaningful category baselines - it is a network-effect feature.

### 7.2 — Real AI agent benchmarking

Instead of simulating with our own prompt, actually query ChatGPT, Perplexity, and Google AI Overview with real buyer queries and record whether the merchant's products appear in the outputs. Comparing our simulation predictions against real-world results would calibrate the system's accuracy and close the external validation gap identified in section 6.2. This is the most important product research investment before charging merchants for the service.

### 7.3 — Embedded Shopify app with always-on monitoring

Convert Visibly into a true embedded Shopify app with webhook listeners for `products/update` events. Every time a merchant edits a product, a targeted re-audit runs automatically and the citation probability delta is shown within minutes. This completes the "AI Search Console" vision - always-on monitoring with instant feedback, not periodic one-shot auditing.

### 7.4 — Per-category persona extraction

Mixed-category stores currently produce a single confused buyer persona across all products. The correct architecture is to split persona extraction by detected category - a store selling electronics and apparel should run two separate persona extractions and generate category-specific query banks. This is a targeted fix for the limitation described in section 6.

### 7.5 — Cursor-based pagination for large catalogues

The current Shopify API fetch is hard-capped at 250 products. Implementing cursor-based pagination using Shopify's `page_info` parameter would support enterprise catalogues in the thousands. This is a single-function change with significant commercial impact - the merchants with the most to gain from AI visibility optimisation are often those with the largest catalogues.