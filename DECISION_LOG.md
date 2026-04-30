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
- **Why 7:** At 5 queries, we couldn't reliably cover all four intent types — you'd get clustering around "buy" intent and miss research/comparison queries. At 10+, the runtime becomes too long for a live demo (each query = 1 LLM call × N products). 7 gives us 1-2 queries per intent type, which produces a stable inclusion rate without excessive latency. The math: 7 queries × 12 products = 84 evaluations. At ~2s per call, that's ~3 minutes. Acceptable. 10 queries would push to ~4.5 minutes. Not acceptable for a demo.

### 3.2 — Why persona extraction runs once at store level, not per product

- **What we chose:** One LLM call at the start to identify buyer type, use cases, and sophistication level for the entire store.
- **What we considered:** Per-product persona extraction (adapts to each product's niche).
- **Why store-level:** A store's buyer persona is a property of the *store*, not the product. A fitness supplement store targets the same buyer archetype across all its products. Running persona extraction per product would waste tokens, introduce inconsistency (different personas per product in the same store), and add ~12 extra LLM calls. One call gives us a shared context that makes all downstream query generation coherent. If a store sells across wildly different categories, this assumption breaks — but for Shopify stores (which are typically niche), it holds.

### 3.3 — Why we added a fairness/validation gate (Step 3) before generating fixes

- **What we chose:** Before generating any fix recommendations, we run a "fairness checker" that asks: is this exclusion correct or incorrect?
- **What we considered:** Skipping validation and generating fixes for every failed query.
- **Why the gate:** Without it, the system creates false alarms. If a buyer searches "vegan protein bar" and your product is whey-based, the exclusion is *correct* — the product genuinely doesn't match. Generating fixes for this case is noise. It teaches merchants to ignore the tool. Alert fatigue kills products like this. The fairness gate classifies each exclusion as "correct" (product doesn't fit) or "incorrect" (product fits but data is too weak). Only incorrect exclusions trigger fix generation. This cuts noise by 30-50% in our testing and makes every recommendation actionable.

### 3.4 — Why issue detection is pure code, not LLM

- **What we chose:** Deterministic JavaScript checks for missing_return_policy, missing_shipping_info, weak_description, etc.
- **What we considered:** Sending product data to the LLM and asking it to identify issues.
- **Why deterministic:** These are binary checks on structured data. "Does the description contain the word 'return'?" is not a reasoning problem — it's a string search. Using an LLM for this wastes tokens, adds 1-2 seconds of latency, and introduces non-determinism (the same product might get different issues on different runs). We run 6 checks in <1ms with zero API cost. The LLM is reserved for tasks that actually require reasoning: evaluating buyer intent match, judging description quality in context, and generating improvement recommendations.

### 3.5 — Why GPT-4o-mini over other models

- **What we chose:** OpenAI GPT-4o-mini for all LLM calls (simulation, query generation, fairness checking, fix generation).
- **What we considered:** GPT-4o (better reasoning but 10x cost), Claude 3.5 Sonnet (strong but different API surface), open-source models via Groq (LLaMA 3.3 70B — fast but less reliable JSON output).
- **Why GPT-4o-mini:** Three reasons. (1) **JSON reliability**: with `response_format: { type: "json_object" }`, GPT-4o-mini produces valid JSON on virtually every call. Open-source models frequently break JSON formatting, requiring retry logic that adds latency. (2) **Cost-performance ratio**: at $0.15/1M input tokens, we can run a full 7-query audit on 12 products for under $0.05. GPT-4o would be $0.50+ for the same run. (3) **Latency**: sub-2 second response times make the live demo feel responsive. The tradeoff: GPT-4o-mini's reasoning is weaker than GPT-4o for nuanced evaluation. We mitigate this with highly structured prompts that constrain the output space.

### 3.6 — Why counterfactual re-simulation, not just "trust the fix"

- **What we chose:** After generating fix recommendations, we actually apply the fix to a clone of the product and re-run the AI simulation to prove the fix works.
- **What we considered:** Just showing the fix recommendations and claiming they'd help.
- **Why re-simulation:** Because "we think this will help" is not the same as "we proved this helped." The counterfactual engine takes the original product (which failed), applies the suggested description/policy improvements, and re-runs the exact same query. If the product goes from excluded→included, the fix is validated. If it's still excluded, the fix is insufficient and the merchant needs to know. This is the difference between a recommendation tool and a proof tool.

---

## 4. What We Cut and Why

### 4.1 — Real-time Shopify webhook sync
**What it was:** Auto-detect when a merchant updates a product and re-run the audit delta.
**Why we cut it:** Requires Shopify app OAuth, webhook registration, persistent storage. Too much infrastructure for a hackathon. The manual "connect store" flow is sufficient to demonstrate the value.
**With more time:** Build a proper Shopify embedded app with webhook listeners for `products/update` events, triggering targeted re-audits.

### 4.2 — Multi-model simulation (consensus scoring)
**What it was:** Run the same query against GPT-4o-mini, Claude, and LLaMA, then compute a consensus score for each product.
**Why we cut it:** 3x the API calls, 3x the cost, and adds complexity in reconciling different models' outputs. Not enough ROI for a demo.
**With more time:** Run 2-3 models in parallel and flag products where models disagree — disagreement signals ambiguity in product data.

### 4.3 — Historical audit tracking / trend dashboard
**What it was:** Store every audit run, show inclusion rate over time, track which fixes moved the needle.
**Why we cut it:** Requires a database (we run stateless). The audit report is generated fresh each time.
**With more time:** Add PostgreSQL or SQLite, store audit snapshots, show a timeline of AI visibility improvement.

### 4.4 — Category-aware query generation
**What it was:** Instead of generating queries purely from the store persona, also pull real trending search queries from the product's category (via Google Trends API or similar).
**Why we cut it:** External API dependency, rate limits, and the persona-based generation is already producing relevant queries.
**With more time:** Integrate with Google Trends or Shopify's search analytics to ground queries in real buyer behavior, not just LLM-generated approximations.

### 4.5 — Image analysis for product listings
**What it was:** Evaluate product image quality (resolution, background, alt-text) as a factor in AI agent recommendations.
**Why we cut it:** Requires vision model calls (GPT-4o with vision), significantly increases cost and complexity. Most AI shopping agents currently evaluate text data, not images.
**With more time:** Add image audit as a separate pass using a vision model.

---

## 5. What We Are Uncertain About

### 5.1 — Do AI shopping agents actually behave like our simulation?

Our simulation models a "strict AI shopping agent" with specific evaluation criteria. But ChatGPT, Perplexity, and Shop AI each have their own prompts, retrieval logic, and ranking heuristics. Our simulation is a *reasonable approximation*, not a ground truth mirror. We don't know how far our simulated rankings diverge from real AI agent behavior. The architecture is sound — but the calibration is unvalidated.

### 5.2 — Is 7 queries enough for statistical stability?

With only 7 queries, a single borderline inclusion/exclusion changes the rate by ~14 percentage points. That's noisy. A product with a "true" inclusion rate of 50% could show up as 28% or 71% depending on query phrasing. We're not confident the numbers are stable enough for merchants to act on confidently. More queries would help, but we're constrained by cost and demo runtime.

### 5.3 — Does fixing descriptions actually improve real-world AI visibility?

We can prove that our simulation includes a product after fixing its description. But we can't prove that Perplexity's shopping agent or ChatGPT's product recommendations would also include it. The counterfactual is internally valid but externally unverified. This is the biggest honest gap in the system.

---

## 6. What We Would Build Next

### 6.1 — Shopify App with continuous monitoring
Turn this into an embedded Shopify app that runs audits weekly, tracks visibility trends, and alerts merchants when a product's AI visibility drops. This is the "AI Search Console" vision — always-on, not one-shot.

### 6.2 — Real AI agent benchmarking
Instead of simulating with our own prompt, actually query ChatGPT, Perplexity, and Google AI Overview with real buyer queries and scrape whether the merchant's products appear. Compare our simulation predictions against real-world results to calibrate accuracy.

### 6.3 — One-click fix application
Currently we recommend fixes. The next step is a "Apply Fix" button that writes the improved description, return policy, or shipping info directly back to Shopify via the Admin API. Close the loop: detect → diagnose → fix → verify → deploy.
