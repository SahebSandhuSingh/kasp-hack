# Product Document — AI Representation Optimizer

## The Problem

When a merchant spends years perfecting their Shopify store — writing descriptions, setting prices, building their catalogue — they assume the world can find them. And for a long time, that was mostly true. SEO tools told them how Google saw their store. They could fix it.

That world is changing. AI shopping agents — the kind embedded in ChatGPT, Perplexity, and a growing number of consumer apps — are becoming a primary product discovery layer. When a buyer asks "what's the best protein supplement for post-workout recovery under ₹2000," an AI agent doesn't crawl Google. It reasons across the product data it has access to: descriptions, policies, specifications, reviews, structured metadata.

If a merchant's product data is incomplete, ambiguous, or contradictory, the AI agent doesn't flag it as broken. It simply skips it. The merchant never knows. There is no error message. There is no Search Console equivalent for AI visibility. The product is just quietly invisible.

That is the problem this tool is built to solve.

---

## Who This Is For

A Shopify merchant who has already invested in building a store and wants to understand why their products might be underperforming in AI-driven discovery channels. Today, when a merchant suspects their products aren't showing up in AI-driven searches, they have no tool to investigate. They can check Google Search Console for SEO. They can run A/B tests on their storefront. But for AI visibility, they have nothing — no diagnostic, no score, no actionable signal. They either guess, or they don't know the problem exists at all. They need a diagnostic that speaks their language: "your product description doesn't have enough information for an AI to confidently recommend this to a buyer researching value-for-money options."

---

## What We Built

We built a merchant-facing diagnostic tool that simulates how an AI shopping agent perceives and ranks each product in a Shopify store — and tells the merchant exactly what to fix, and why.

The core user journey is:

A merchant connects their Shopify store. The system analyses the store's product catalogue and identifies the target buyer persona — who is actually shopping here, what they care about, what sophistication level they bring to their searches. From that persona, it generates 7 calibrated buyer queries per product — not generic searches, but the specific ways this store's actual buyer would phrase a search intent. It then simulates, for each query, whether an AI shopping agent would include or exclude that product, and why.

Before flagging anything as broken, the system runs a fairness check: is this exclusion actually a problem, or is the product genuinely not the right fit for that query? Only incorrect exclusions — cases where the product belongs but the data is too weak to surface it — trigger fix recommendations. Those fixes are field-level and specific: not "improve your description" but "your description doesn't mention return policy, which is a high-confidence exclusion trigger for price-sensitive buyers." The system then applies the fix to a copy of the product and re-runs the simulation to show the merchant a before/after score. Proof, not promises.

---

## Key Product Decisions

**Simulation-first, not analytics-first.**
The obvious approach to this problem is to build a scanner — check word count, check for keywords, check readability scores. We chose not to do this because it solves the wrong problem. AI agents don't rank products by keyword density. They reason about context, buyer intent, and information completeness. A scanner would tell a merchant to add more words. Our system tells them which specific information gap is causing an AI agent to lose confidence in a product recommendation. That required building a simulation, not a scanner.

**Persona extraction runs once per store, not per product.**
Early in the design we considered extracting a buyer persona for each individual product. We rejected this because it creates fragmented, inconsistent audits — the same store would produce different personas for different products, making cross-product comparisons meaningless. A store has one buyer type. The persona is a property of the store, not of individual products.

**The fairness checker (Step 3) before fix recommendations.**
This was the most important product decision we made. Without it, the system would flag every low-scoring product as broken and generate fix recommendations for all of them. But many exclusions are correct — a budget product genuinely shouldn't be recommended in a search for premium professional-grade equipment. Generating fixes for correct exclusions would create noise, erode merchant trust, and ultimately make the tool useless. The fairness checker separates signal from noise before any fix is generated.

**7 queries per product.**
This number covers all 4 purchase intents — research, compare, buy, problem-solving — with enough variation to produce a statistically meaningful inclusion rate. Fewer than 5 queries produces scores that are too sensitive to a single bad query. More than 10 produces diminishing signal while significantly increasing API cost and latency.

---

## What We Chose NOT to Build

**Competitor benchmarking.** Knowing that a competitor's product scores 80% while yours scores 40% is useful context, but it requires scraping competitor stores — a scope that would triple the complexity and introduce reliability issues. We chose to focus on making the audit itself accurate before adding comparison features.

**Persistent storage and user accounts.** For v1, every audit is stateless — run it, get results, done. Adding persistence would mean building authentication, a database layer, and a results history UI. None of that improves the quality of the audit itself. We cut it to stay focused on what matters: audit accuracy.

---

## Tradeoffs We Encountered

The hardest tradeoff was between audit speed and audit reliability. Running queries through an LLM produces reasoning — it can explain why a product was excluded, which is far more useful than a score. But LLMs are non-deterministic: the same query on the same product can produce different results on different runs. We resolved this with a majority vote system — each query runs twice, and if the results disagree, a tiebreaker run is added. This adds latency but makes the audit trustworthy. A score that randomly changes by 28% between runs is not a product — it's noise.

