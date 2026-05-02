# Product Decision Log — AI Representation Optimizer

## 1. Problem Framing

**The problem:** Merchants are invisible to AI shopping agents and have zero tools to diagnose it.

When a buyer asks ChatGPT, Perplexity, or a Shopify AI assistant "best protein bar under ₹500 with free returns," the AI agent evaluates every product in the catalog and ranks them. Products with vague descriptions, missing return policies, or no reviews get silently dropped. The merchant never knows this happened. There is no error log. There is no "AI Search Console" equivalent of what Google Search Console does for traditional SEO.

**Why now:** AI-powered shopping is moving from novelty to default. Shopify has Shop AI. Google has AI Overviews. Amazon uses LLMs for product discovery. Every one of these systems penalizes incomplete product data — but unlike traditional search, there are no ranking signals merchants can inspect. They are flying blind.

**The gap we exploit:** Traditional SEO tools measure keyword density, backlinks, page speed. None of that matters to an LLM. An LLM reasons about buyer intent, evaluates data completeness, and makes contextual judgments. You can't optimize for that with a keyword scanner. You need to simulate the actual AI decision process.

---

## 2. Approach Decision: Simulation-First, Not Analytics-First

We considered two approaches:

**Option A — Analytics-first:** Scan product data, compute readability scores, check for missing fields, generate a report card. This is what most SEO tools do.

**Option B — Simulation-first:** Actually run an AI agent against the product catalog, observe which products get selected/rejected and why, then work backwards from those failures to fixes.

**We chose B.** Here's why:

A keyword scanner would flag "description is 15 words, too short" — but it can't tell you whether a 15-word description *actually causes the product to be excluded* by an AI agent for a specific buyer query. The failure mode is contextual: a 15-word description might be fine for a $2 commodity product but fatal for a $50 specialty item where the buyer needs specifications.

AI agents don't count keywords. They reason about whether a product satisfies buyer intent. The only way to know if your product fails is to simulate that reasoning. Analytics can tell you what's missing; simulation tells you what's *costing you sales*.

The tradeoff: simulation is slower and more expensive (LLM calls per product per query). We accept that cost because the output is fundamentally more accurate and actionable.

---

## 3. Specific Decisions With Reasoning

### 3.1 — Why 7 queries per product (not 5, not 10)

- **What we chose:** 7 queries covering four intent types: research, compare, buy, problem-solving.
- **What we considered:** 5 queries (faster, cheaper) or 10+ queries (more statistical confidence).
- **Why 7:** At 5 queries, we couldn't reliably cover all four intent types — you'd get clustering around "buy" intent and miss research/comparison queries. At 10+, the runtime becomes too long for a live demo. 7 gives us 1-2 queries per intent type, which produces a stable inclusion rate without excessive latency. The math: 7 queries × 12 products = 84 evaluations. At ~2s per call, that's ~3 minutes. Acceptable. 10 queries would push to ~4.5 minutes. Not acceptable for a demo.

### 3.2 — Why persona extraction runs once at store level, not per product

- **What we chose:** One LLM call at the start to identify buyer type, use cases, and sophistication level for the entire store.
- **What we considered:** Per-product persona extraction (adapts to each product's niche).
- **Why store-level:** A store's buyer persona is a property of the *store*, not the product. A fitness supplement store targets the same buyer archetype across all its products. Running persona extraction per product would waste tokens, introduce inconsistency, and add ~12 extra LLM calls. One call gives us a shared context that makes all downstream query generation coherent.

### 3.3 — Why we added a fairness/validation gate (Step 3) before generating fixes

- **What we chose:** Before generating any fix recommendations, we run a "fairness checker" that asks: is this exclusion correct or incorrect?
- **What we considered:** Skipping validation and generating fixes for every failed query.
- **Why the gate:** Without it, the system creates false alarms. If a buyer searches "vegan protein bar" and your product is whey-based, the exclusion is *correct* — the product genuinely doesn't match. Generating fixes for this case is noise. Alert fatigue kills products like this. The fairness gate classifies each exclusion as "correct" (product doesn't fit) or "incorrect" (product fits but data is too weak). Only incorrect exclusions trigger fix generation. This cuts noise by 30-50% in our testing and makes every recommendation actionable.

### 3.4 — Why issue detection is pure code, not LLM

- **What we chose:** Deterministic JavaScript checks for missing_return_policy, missing_shipping_info, weak_description, etc.
- **What we considered:** Sending product data to the LLM and asking it to identify issues.
- **Why deterministic:** These are binary checks on structured data. "Does the description contain the word 'return'?" is not a reasoning problem — it's a string search. Using an LLM for this wastes tokens, adds latency, and introduces non-determinism. We run 6 checks in under 1ms with zero API cost. The LLM is reserved for tasks that actually require reasoning: evaluating buyer intent match, judging description quality in context, and generating improvement recommendations.

### 3.5 — Why GPT-4o-mini, and why we moved away from Groq

- **What we chose:** OpenAI GPT-4o-mini for all LLM calls.
- **What we started with:** Groq running LLaMA 3.3 70B — fast inference but unreliable JSON output, requiring retry logic that added latency and complexity.
- **Why GPT-4o-mini:** Three reasons. (1) **JSON reliability**: with `response_format: { type: "json_object" }`, it produces valid JSON on virtually every call. (2) **Cost**: at $0.15/1M input tokens, a full 7-query audit on 12 products costs under $0.05. (3) **Latency**: sub-2 second response times make the demo feel responsive. The tradeoff: reasoning is weaker than GPT-4o for nuanced evaluation, mitigated by highly structured prompts.

### 3.6 — Why buyer-intent queries replaced policy-focused queries

- **What we changed:** Early versions tested products against queries like "product with free returns and clear description" and "most trusted product with detailed information."
- **What we replaced them with:** Real buyer searches like "best beginner snowboard under ₹50000" and "high protein low sugar snack bar."
- **Why:** Real buyers search for what they want to buy, not how it gets delivered. Policy-focused queries made the audit feel artificial and produced misleading results — products would fail queries that no real buyer would ever type. Return policies and shipping info still matter as signals AI agents use to evaluate products, but the queries themselves must mirror actual buyer intent.

### 3.7 — Why AI Score and Citation Probability are two different numbers, and why only one can reach 100

- **What we chose:** Two separate metrics — AI Score (0-100) and Citation Probability (%).
- **What we considered:** A single unified score for everything.
- **Why two metrics:** They measure different things. AI Score (0-100) measures what the merchant controls — data completeness and quality. It is 60% simulation performance + 40% data completeness. A merchant who fills every field and fixes every issue can reach 100 — that is a valid 100 because it means they have done everything in their control. 
Citation Probability measures what AI agents actually do with that data — how many of the 7 simulated buyer queries returned a recommendation. This can never reach 100 because LLMs are probabilistic — no product is ever guaranteed to surface for every query. The ceiling is dynamic: the more unresolved issues, the lower the maximum. The clean split: AI Score is what you control. Citation Probability is what you observe.

The AI score may not reach 100 always as there may be some certifications which can only be done by the merchant.

### 3.8 — Why write-back to Shopify was non-negotiable

- **What we chose:** Apply fixes directly to the merchant's Shopify store via the Admin API with one click.
- **What we considered:** Stopping at recommendations and letting the merchant copy-paste improvements manually.
- **Why write-back:** Most audit tools stop at "here's what's wrong." Ours closes the loop. The merchant sees the problem, sees the fix, and applies it in one click. The before/after simulation then runs on the updated live product to show the real score change. Without write-back, the tool is a report. With it, it's a solution.

---

## 4. What We Cut and Why

### 4.1 — Real-time Shopify webhook sync
**What it was:** Auto-detect when a merchant updates a product and re-run the audit delta.
**Why we cut it:** Requires Shopify app OAuth, webhook registration, persistent storage. Too much infrastructure for the scope. The manual connect flow is sufficient to demonstrate value.
**With more time:** Build webhook listeners for `products/update` events, triggering targeted re-audits.

### 4.2 — Multi-model simulation (consensus scoring)
**What it was:** Run the same query against GPT-4o-mini, Claude, and LLaMA, then compute a consensus score.
**Why we cut it:** 3x the API calls, 3x the cost, and adds complexity in reconciling different models' outputs.
**With more time:** Run 2-3 models in parallel and flag products where models disagree — disagreement signals ambiguity in product data.

### 4.3 — Category-aware query generation
**What it was:** Pull real trending search queries from the product's category via Google Trends or similar.
**Why we cut it:** External API dependency and rate limits. Persona-based generation already produces relevant queries.
**With more time:** Integrate with Google Trends or Shopify's search analytics to ground queries in real buyer behavior.

### 4.4 — Image analysis for product listings
**What it was:** Evaluate product image quality as a factor in AI agent recommendations.
**Why we cut it:** Requires vision model calls, significantly increasing cost and complexity. Most AI shopping agents currently evaluate text data, not images.
**With more time:** Add image audit as a separate pass using a vision model.

### 4.5 — Multi-store support
**What it was:** Support connecting and auditing multiple stores in one session.
**Why we cut it:** A focused single-store audit is more actionable. Adding multi-store support without persistent storage and user accounts creates a confusing experience.
**With more time:** Build a proper account layer with store management.

---

## 5. What We Are Uncertain About

### 5.1 — Do AI shopping agents actually behave like our simulation?

Our simulation models a "strict AI shopping agent" with specific evaluation criteria. But ChatGPT, Perplexity, and Shop AI each have their own prompts, retrieval logic, and ranking heuristics. Our simulation is a reasonable approximation, not a ground truth mirror. We don't know how far our simulated rankings diverge from real AI agent behavior. The architecture is sound — the calibration is unvalidated.

### 5.2 — Is 7 queries enough for statistical stability?

With only 7 queries, a single borderline inclusion/exclusion changes the rate by ~14 percentage points. A product with a "true" inclusion rate of 50% could show up as 28% or 71% depending on query phrasing. We're not confident the numbers are stable enough for merchants to act on with high confidence. More queries would help, but we're constrained by cost and demo runtime.

### 5.3 — Does fixing descriptions actually improve real-world AI visibility?

We can prove that our simulation includes a product after fixing its description. But we can't prove that Perplexity's shopping agent or ChatGPT's product recommendations would also include it. The counterfactual is internally valid but externally unverified. This is the biggest honest gap in the system.

---

## 6. What We Would Build Next

### 6.1 — Shopify App with continuous monitoring
Turn this into an embedded Shopify app that runs audits weekly, tracks visibility trends, and alerts merchants when a product's AI visibility drops. This is the "AI Search Console" vision — always-on, not one-shot.

### 6.2 — Real AI agent benchmarking
Instead of simulating with our own prompt, actually query ChatGPT, Perplexity, and Google AI Overview with real buyer queries and check whether the merchant's products appear. Compare our simulation predictions against real-world results to calibrate accuracy.

### 6.3 — Multi-model consensus scoring
Run simulations across multiple AI models simultaneously. Products that consistently fail across GPT, Claude, and LLaMA have genuinely weak data. Products that only fail one model are borderline. Surface this distinction to merchants so they know which fixes are high-confidence and which are marginal.

