# Technical Document — AI Representation Optimizer

## How the System Works

The system is a Node.js + Express backend that connects to a Shopify store, runs an AI-powered audit across its product catalogue, and returns structured fix recommendations. There is no database. Every audit is stateless — the system fetches live data, processes it, and returns results in a single request cycle.

The full data flow is:

```
Shopify Store
    → fetchProducts() — live product fetch with auto token refresh
    → normalizeProduct() — HTML stripped, structured fields extracted
    → getStoreData() — persona-ready store summary built
    → Step 1: Persona Extraction (OpenAI)
    → Step 2: Calibrated Query Generation + Simulation (OpenAI, batched)
    → runQueryWithConsensus() — majority vote for stable scores
    → Step 3: Exclusion Validation / Fairness Check (OpenAI)
    → detectIssues() — deterministic pattern checks, no LLM
    → Step 4: Fix Recommendations (OpenAI, only on incorrect exclusions)
    → deduplicateFixes() — conflict resolution post-processor
    → Counterfactual Engine — fix applied, re-simulated, delta score returned
    → Audit Result returned to client
```

---

## Where AI Is Used and Where It Isn't

This is the most important architectural decision in the system, so it deserves explicit explanation.

**LLM handles these tasks** because they require reasoning about context, intent, and meaning:
- Persona extraction — understanding who the store's buyer is from product and pricing signals
- Query generation — producing searches that reflect how a specific buyer type actually thinks
- Simulation — deciding whether a product fits a query the way an AI shopping agent would
- Fix generation — writing specific, contextually appropriate improvement suggestions

**Deterministic code handles these tasks** because they are pattern checks on structured data, not reasoning problems:
- Issue detection — all 6 issue types (missing return policy, weak description, missing specifications, missing shipping info, weak social proof, price validation) are pure JavaScript checks against product fields
- HTML stripping — regex-based, not inference-based
- Word count — counting words in clean text
- Priority assignment — threshold comparison (≤20% critical, ≤50% needs work, ≤85% minor fixes)
- Fix conflict detection — field-level deduplication

---

## Key Implementation Decisions

**Batched query generation (Step 2).**
The original design called for 7 separate API calls per product — one per query. This was replaced with a single batched call that generates all 7 queries and runs all simulations in one prompt. For a store with 20 products, this reduces OpenAI calls from 140 to 20. The output shape is identical, so nothing downstream changed.

**Majority vote for simulation consistency.**
`runQueryWithConsensus()` runs each simulation twice in parallel. If both agree, that result is returned with confidence averaged. If they disagree, a third tiebreaker call runs. The result includes a `consensus: false` flag when a tiebreaker was needed, so the audit surface can signal lower confidence to the merchant. Temperature is set to 0.2 to reduce but not eliminate variance — zero temperature would make the model overconfident.

**Centralised variable substitution.**
`buildPrompt(template, variables)` replaces all `{{variable}}` placeholders before any prompt is sent to OpenAI. This sounds obvious but was not working correctly in the original implementation — placeholders were being sent literally to OpenAI, which treated them as content and returned queries like "best product for {{use_cases}}." `validateVariables()` runs before every build and logs a warning for any null or empty variable, catching missing data before it produces silent garbage output.

**Auto token refresh for Shopify.**
Shopify access tokens from the client credentials grant expire every 24 hours. The token manager caches the current token in memory with its expiry time and automatically fetches a fresh one if the token is within 5 minutes of expiry. The `.env` stores `CLIENT_ID` and `CLIENT_SECRET` — never a static token. This means the system works indefinitely without manual intervention.

---

## Failure Handling

**Shopify API down or returns 401.**
`fetchProducts()` catches 401 and throws a human-readable error: "Invalid or expired Shopify token." It catches 404 and throws "Store not found — check SHOPIFY_STORE in .env." Network failures are caught generically. The audit endpoint returns a structured error response rather than crashing.

**OpenAI returns malformed JSON.**
Every OpenAI call is wrapped in a try/catch. If JSON parsing fails, the call retries once. If the retry also fails, a fallback object is returned: `{ would_include: false, confidence: 0, reason: "parse_error", error: true }`. This means a single bad LLM response doesn't crash an entire audit — it produces a conservative fallback score for that query.

**OpenAI returns conflicting fixes for the same field.**
`deduplicateFixes()` runs on every Step 4 response before it reaches the client. It groups fixes by field, merges duplicates, keeps the highest impact estimate, and adds a `merged: true` flag. This is a second layer of protection — the Step 4 prompt also instructs the model to never return two fixes for the same field, but the post-processor catches any that slip through.

**Unexpected or incomplete store data.**
If a merchant connects a store with 0 products, `getStoreData()` returns an empty catalogue and the audit endpoint returns a structured error — "No products found in this store" — rather than attempting to run a persona extraction on nothing. If a product has no description at all, it is flagged as `data-incomplete` and skipped by the simulation rather than producing a meaningless 0% score. If the store URL is malformed or the domain doesn't resolve, the fetch fails fast with a clear message before any API credits are consumed.

**Product with no description.**
`detectIssues()` flags `weak_description` immediately. The simulation still runs but the persona extraction prompt receives a warning in the store summary that some products have empty descriptions. The audit result marks these products as data-incomplete rather than low-scoring, which surfaces differently in the fix recommendations.

---

## Known Limitations and What We Would Improve

**No pagination above 250 products.** The current Shopify fetch uses `limit=250`. Stores with larger catalogues would need cursor-based pagination using Shopify's `page_info` parameter. This is a one-function change but was out of scope for this version.

**Persona accuracy on mixed-category stores.** A store selling both industrial tools and home decor will produce a confused persona — there isn't a single buyer type that spans both. The correct solution is per-category persona extraction with the store-level audit split by category. This is a clear v2 architectural change.

**No competitor context.** The audit tells a merchant how AI agents see their product in isolation. It doesn't tell them how they compare to competitors. Adding this would require either scraping competitor stores or integrating a third-party product intelligence API — both are meaningful scope additions.

**LLM inconsistency at the edges.** The majority vote system significantly reduces score instability, but a product that genuinely sits on the fence — where reasonable AI agents would disagree — will still sometimes produce a `consensus: false` result. This is not a bug. It is the correct signal that the product data is genuinely ambiguous, and the merchant should treat it as such.

---

## What We Learned

We initially assumed that low AI inclusion rates were always a product data problem — merchants had weak descriptions, missing policies, vague titles. Building the fairness checker taught us this was wrong. Roughly 40% of low-scoring products in our test audits were correctly excluded — the product genuinely didn't fit the query for that buyer. This changed our core metric from "inclusion rate" to "actionable improvement rate." A tool that tells a merchant to fix things that don't need fixing destroys trust faster than a tool that finds nothing. The fairness checker is the most important feature in the system precisely because it makes the tool honest.

