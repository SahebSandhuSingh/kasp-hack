# Technical Document — Visibly

## What is Visibly
AI shopping assistants (ChatGPT, Perplexity) don't browse; they read structured data. Listings with missing policies or vague descriptions are skipped entirely. Visibly solves this by auditing Shopify products against category-specific AI rubrics, predicting their "AI Citation Probability," and applying LLM-generated fixes directly to the live store via the Shopify Admin API in one click.

### Data Flow Pipeline

```text
Shopify Store
  → resolveAccessToken() 
  → fetchShopifyProducts() [limit 250]
  → normalizeProduct()
  → detectCategory() [9 categories]
  → scoreProduct() + applyCompletenessDeductions()
  → scoreToAICitationProbability()
  → Step 1: Persona Extraction [LLM]
  → Step 2: Batched Query Generation + Simulation [LLM]
  → runQueryWithConsensus() [majority vote]
  → Step 3: Fairness Check [LLM]
  → detectIssues() [deterministic shim]
  → Step 4: Fix Recommendations [LLM]
  → deduplicateFixes()
  → Counterfactual Engine (delta score prediction)
  → DB Log + Return Audit Result
```

## System Architecture

![Visibly System Architecture](./visibly_system_architecture.svg)

Visibly is a React SPA (Vite, React Router v6) backed by a Node.js/Express server and an SQLite database (`better-sqlite3`, WAL mode).
- **State & Storage**: SQLite stores `score_snapshots`, `product_sales`, and `optimization_history`.
- **Authentication**: `express-session` manages OAuth flows; credentials stay in session memory, never on disk. 

## Architectural Boundary: AI vs. Deterministic Code
We strictly isolate probabilistic reasoning from deterministic checks to save tokens, reduce latency, and ensure reliability.
- **LLM Handles**: Persona extraction, query generation, shopping simulations, and contextual fix generation.
- **Deterministic Code Handles**: Category detection, rubric scoring, field completeness checks, probability math, issue flagging, fix deduplication, and HTML stripping.

## Key Subsystems

### 1. Category-Aware Scoring (`categoryEngine.js`)
- **Auto-Detection**: Classifies products into 9 categories using tags, titles, and body content.
- **Deep Validation**: Replaces simple keyword checks with regex and specific requirements (e.g., apparel must have `%` material breakdown; electronics need numeric specs with units).
- **Normalization**: Standardizes raw Shopify `body_html` and tags into a unified internal schema.
- **Strict Ceilings**: Applies dynamic completeness deductions (e.g., short descriptions, no images) and enforces a hard score limit of **92/100**. Perfect scores are rejected as mathematically unrealistic.

### 2. AI Citation Probability & Counterfactuals
Raw 0–100 scores are mapped to a non-linear probability curve (capped at 91%). 
Before applying a fix, the **Counterfactual Engine** re-simulates the *improved* listing against the original AI queries to predict the exact delta in visibility, applying a 0.85 realism discount to projections.

### 3. One-Click Apply & Write Pipeline
- **Direct API Writes**: Modifies the live store directly via Shopify Admin API (PUT).
- **Atomic Logging & Reverts**: Every change writes to `optimization_history`. Full reversions (`POST /revert`) are natively supported.
- **Rate Limit Handling**: Gracefully catches `429 Too Many Requests` using `Retry-After` headers.

### 4. Analytics Pipeline
Powered by `Recharts`, combining local DB records with live Shopify data:
- **Traffic Report**: Ranks products by visibility tiers alongside revenue impact.
- **Score Trends**: Tracked via an hourly background cron job.
- **Sales Correlation**: Scatter plots proving the relationship between AI visibility scores and actual sales.

## Implementation Details & Failure Handling
- **Batched Prompts**: Simulation engines batch query generation and product evaluation into single prompts, drastically cutting API overhead.
- **Simulation Consensus**: `runQueryWithConsensus()` runs simulations in parallel. Disagreements trigger a tiebreaker call (temperature `0.2`), surfacing a `consensus: false` flag if ambiguity persists.
- **Variable Substitution Failsafes**: Prompts are strictly validated before dispatch; null placeholders are intercepted to prevent LLM hallucinations.
- **Graceful Fallbacks**: If OpenAI returns malformed JSON, the system retries once before returning a safe, conservative fallback object. Network failures surface structured errors instead of crashing the audit.

## Known Limitations & Learnings
- **Pagination**: Current API fetches are capped at 250 products; cursor-based pagination is required for massive catalogues.
- **Mixed-Category Personas**: Stores spanning completely unrelated verticals (e.g., industrial tools + baby clothes) generate confused personas.
- **The "Fairness" Insight**: We learned that ~40% of low scores aren't bad data—the product genuinely doesn't fit the buyer's query. This shifted our focus from raw "inclusion rate" to "actionable improvement rate." 
- **Merchant Psychology**: Raw scores (e.g., "65/100") lack urgency. Translating them to "Citation Probability" drives action. Furthermore, eliminating the friction of manual copy-pasting via One-Click Apply is what transitions the tool from a dashboard into a growth engine.
