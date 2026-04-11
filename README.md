# AI Representation Optimizer

> **Hackathon Project** — A tool that simulates how AI shopping agents perceive and evaluate a Shopify store, shows merchants why their products get skipped, and tells them exactly what to fix.

---

## 🧠 The Problem

AI-powered shopping agents (like those built on LLMs) are increasingly being used to recommend products to users. These agents don't browse stores like humans — they evaluate structured product data. If a product has a vague description, no return policy, or zero reviews, an AI agent will skip it — and the merchant has no idea why.

**AI Representation Optimizer** solves this by simulating the agent's decision-making process, exposing which products are invisible to AI, diagnosing why, and proving that fixing the data fixes the visibility.

---

## ✅ What's Built (Steps 1–3)

### Step 1 — Single Query Simulation (`simulate.js`)
- Loads a mock Shopify store (12 protein bar products with intentionally varied data quality)
- Runs a single user query through the Groq API (`llama-3.3-70b-versatile`)
- Returns 2 selected products with reasons chosen, and all 10 rejected products with specific diagnostic rejection reasons

### Step 2 — Counterfactual Re-run Engine (`rerun.js`)
- Runs the simulation with original product data → captures rejection reasons
- Injects an "improved" version of a rejected product (`improve.js`) with all missing fields filled in
- Re-runs the same simulation with the improved data
- Prints a structured before/after delta proving that fixing the data moves a product from rejected → selected

### Step 3 — Multi-Query Audit Engine (`audit.js`)
- Runs 7 different queries across the full store (covering price, returns, reviews, shipping, trust, ingredients, value)
- Computes per-product **inclusion rate** (how often each product is selected as a % across all queries)
- Diagnoses underperforming products using rejection reason pattern matching → flags specific issues like `missing_return_policy`, `weak_social_proof`, `weak_description`
- Outputs a ranked merchant priority action plan (🔴 CRITICAL → ✅ PERFORMING WELL)
- Saves `audit_report.json` for consumption by the React frontend (Step 4)

---

## 📁 File Structure

```
kasp-hack/
├── README.md
└── backend/
    ├── store.json          # Mock Shopify store — 12 protein bar products (varied quality)
    ├── simulate.js         # Step 1: Single query simulation
    ├── improve.js          # Step 2: Improved product data for p7 (counterfactual input)
    ├── rerun.js            # Step 2: Before/after counterfactual engine
    ├── audit.js            # Step 3: Multi-query audit + priority action plan
    ├── audit_report.json   # Step 3 output — consumed by React frontend
    ├── .env                # GROQ_API_KEY (gitignored)
    ├── .gitignore
    └── package.json
```

---

## 🚀 Setup & Usage

### Prerequisites
- Node.js (v18+)
- A [Groq API key](https://console.groq.com) (free tier works)

### Install dependencies

```bash
cd backend
npm install
```

### Configure your API key

Edit `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
```

---

### Run Step 1 — Single Query Simulation

```bash
node simulate.js
```

**What you'll see:**
```
=== AI SIMULATION RESULT ===
Query: best protein bar under ₹500 with free returns

✅ SELECTED PRODUCTS:
1. ProForge Whey Protein Bar – Chocolate Fudge (id: p1)
   Reason: ...

❌ REJECTED PRODUCTS:
1. PowerZone Protein Bar – Strawberry Blast (id: p7)
   Reason: The product description is vague and promotional, lacks return policy and shipping details...
```

---

### Run Step 2 — Counterfactual Engine

```bash
node rerun.js
```

**What you'll see:**
```
=== COUNTERFACTUAL ANALYSIS ===
Product: PowerZone Protein Bar – Strawberry Blast (p7)

--- BEFORE (original data) ---
Status: ❌ REJECTED
Reason: vague description, null return_policy, no reviews...

--- AFTER (improved data) ---
Status: ✅ SELECTED
Reason: 24g protein, free 30-day returns, 187 reviews, free shipping...

--- VERDICT ---
✅ IMPROVEMENT CONFIRMED: Fixing missing data fields moved this product from REJECTED to SELECTED.
```

---

### Run Step 3 — Full Audit

```bash
node audit.js
```

> ⏱️ Takes ~2 minutes (7 API calls with 15s delay between each to stay under rate limits)

**What you'll see:**
```
=== MERCHANT AI AUDIT REPORT ===
Queries run: 7 | Products audited: 12

--- PRIORITY ACTION PLAN (worst first) ---
#1. PowerZone Protein Bar (id: p7) — ₹329
    Inclusion Rate: 0% (0/7 queries)
    Priority: 🔴 CRITICAL
    Issues: missing_return_policy, weak_social_proof, weak_description, missing_ingredients

...

--- TOP PERFORMERS ---
  ✅ ProForge Whey Protein Bar – Chocolate Fudge — 85.7% inclusion rate
```

Saves `audit_report.json` for the React dashboard.

---

## 📊 Sample Audit Results

From a real run against the mock store:

| Product | Inclusion Rate | Priority |
|---|---|---|
| ProForge Whey Protein Bar | 85.7% | ✅ PERFORMING WELL |
| IronMax High-Protein Crunch Bar | 71.4% | 🟢 MINOR FIXES |
| CleanFuel Plant Protein Bar | 28.6% | 🟡 NEEDS WORK |
| PowerZone Protein Bar | 0% | 🔴 CRITICAL |
| GreenLeaf Organic Oat Bar | 0% | 🔴 CRITICAL |
| ZenProtein Ayurvedic Bar | 0% | 🔴 CRITICAL |

**Key insight:** Products with null `return_policy`, null `ingredients`, vague descriptions, and fewer than 20 reviews are consistently invisible to AI shopping agents — regardless of their actual product quality.

---

## 🔍 Issue Flags Explained

| Flag | Triggered When |
|---|---|
| `missing_return_policy` | Rejection reason mentions "return" |
| `missing_shipping_info` | Rejection reason mentions "shipping" or "delivery" |
| `weak_social_proof` | Rejection reason mentions "review" or "trust" |
| `weak_description` | Rejection reason mentions "description", "vague", or "promotional" |
| `missing_ingredients` | Rejection reason mentions "ingredient" |
| `price_issue` | Rejection reason mentions "price", "budget", or "expensive" |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js (CommonJS) |
| AI model | `llama-3.3-70b-versatile` via [Groq API](https://groq.com) |
| HTTP client | `axios` |
| Config | `dotenv` |
| Frontend (Step 4) | React *(coming soon)* |

---

## 🗺️ Roadmap

- [x] Step 1 — Single query simulation engine
- [x] Step 2 — Counterfactual re-run (before/after fix)
- [x] Step 3 — Multi-query inclusion rate audit + priority action plan
- [ ] Step 4 — React dashboard consuming `audit_report.json`
- [ ] Step 5 — Real Shopify store integration via Admin API

---

## 💡 Core Insight

> AI shopping agents are trained to be skeptical. Missing data isn't neutral — it's a rejection signal. A product without a return policy, clear shipping, or real reviews looks **untrustworthy** to an LLM, even if the product itself is excellent. This tool makes that invisible filter visible.