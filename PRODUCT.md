# Product Document — Visibly

## The Problem

When a merchant spends years building their Shopify store, they assume the world can find them. For a long time, that was mostly true. Google Search Console told them how Google saw their store. They could fix it.

That world is changing. AI shopping agents — embedded in ChatGPT, Perplexity, and a growing number of consumer apps — are becoming how people discover products. When a buyer asks "what's the best protein supplement for post-workout recovery," an AI agent doesn't crawl Google. It reasons about the product data it can access: descriptions, policies, specifications, reviews.

If that data is incomplete or vague, the AI doesn't flag it. It simply skips the product. The merchant never knows. There's no error message. No Search Console equivalent. The product is just quietly invisible.

That is the problem this tool is built to solve.

---

## Who This Is For

A Shopify merchant who has invested in building a store and wants to understand why their products might be underperforming in AI-driven discovery. Today, when a merchant suspects their products aren't showing up in AI searches, they have nothing to investigate with. They can check Google Search Console for SEO. But for AI visibility, there's no tool — no diagnostic, no score, no signal. They either guess, or they don't know the problem exists at all.

---

## What We Built

A merchant-facing tool that connects to a live Shopify store, simulates how AI shopping agents evaluate each product, and tells the merchant exactly what to fix — then applies those fixes directly to their store.

The journey looks like this:

A merchant enters their store URL. The system fetches their live product catalogue and runs 7 real buyer-intent queries against it — the kind of searches actual customers make, like "best beginner snowboard under ₹50000" or "high protein low sugar snack bar." For each query, it simulates whether an AI agent would recommend that product and why.

Before flagging anything as broken, the system runs a fairness check: is this exclusion actually a problem, or is the product genuinely not the right fit for that query? Only real gaps — cases where the product belongs but the data is too weak to surface it — trigger fix recommendations. Those fixes are specific: not "improve your description" but "your description doesn't mention return policy, which causes AI agents to skip this product for price-sensitive buyers."

The merchant can then apply those fixes directly to their Shopify store with one click. The system re-runs the simulation and shows a before/after score — not a promise, actual proof.

---

## Key Product Decisions

**Simulation-first, not analytics-first.**
The obvious approach is to build a scanner — check word count, flag missing keywords. We didn't because it solves the wrong problem. AI agents reason about context and buyer intent, not keyword density. A scanner tells a merchant to add more words. Our system tells them which specific gap is causing an AI agent to lose confidence. That required simulation.

**Buyer-intent queries, not policy-focused queries.**
Early versions tested products against queries like "product with free returns and clear description." We replaced these with real buyer searches like "best beginner snowboard" because that's how actual customers search. Return policies matter — but they're signals AI uses to evaluate products for real queries, not queries themselves.

**The fairness checker before fix recommendations.**
This was the most important decision we made. Without it, every low-scoring product gets flagged as broken. But many exclusions are correct — a budget product genuinely shouldn't show up in a search for premium professional equipment. Generating fixes for correct exclusions creates noise and erodes merchant trust. The fairness checker separates signal from noise before any fix is generated.

**Issue detection runs in code, not AI.**
Checking whether a product has a return policy doesn't require intelligence — it requires checking if the word "return" appears in the description. We made all 6 issue checks deterministic code. This makes detection fast, consistent, and explainable. AI handles reasoning. Code handles pattern matching.

**Write-back to Shopify.**
Most audit tools stop at recommendations. Ours applies them. When a merchant clicks Apply, the fix writes directly to their Shopify product via the API. The before/after comparison then re-runs the simulation on the updated product to show the real score change. This closes the loop from diagnosis to proof.

---

## What We Chose NOT to Build

**Competitor benchmarking.** Useful context, but requires scraping competitor stores — a scope that would triple complexity without improving audit accuracy. Cut for v1.

**Persistent user accounts.** Every audit is stateless — connect, audit, done. Adding authentication and a database layer doesn't improve the quality of what the tool actually does. Cut to stay focused.

**Multi-store support.** Deliberately single-store per session. A focused audit on one store is more actionable than a scattered view across many.

Every cut was made against one constraint: does this improve the quality of the audit itself? If not, it didn't ship.

---

## Tradeoffs We Encountered

The hardest tradeoff was between speed and reliability. LLMs are non-deterministic — the same query on the same product can produce different results on different runs. A score that randomly shifts by 28% between audits isn't useful. We resolved this with a majority vote system: each query runs twice, and if results disagree, a tiebreaker call decides. This adds some latency but makes the audit trustworthy.

The second was between flexibility and trust. We initially considered running all issue detection through the AI for maximum flexibility. But a merchant who sees "missing return policy" flagged needs to trust that flag — not wonder if the AI was having an off day. Deterministic checks don't have off days. We traded flexibility for reliability where reliability matters more.
