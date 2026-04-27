# AI Representation Optimizer

> **Understand exactly how AI shopping agents perceive your Shopify store — and fix it.**

AI Representation Optimizer gives Shopify merchants clear, data-driven visibility into why their products are selected or ignored by LLM-powered shopping agents. It runs multi-query AI simulations, surfaces structured trust-and-quality gaps, prioritizes which products to fix first, and delivers before/after proof that targeted data improvements move products from rejected to recommended.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=0A0A0A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Demo Results](#demo-results)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Overview

AI shopping agents (used by ChatGPT, Perplexity, Google AI Overviews, and emerging agent frameworks) evaluate product catalogs using structured signals — return policies, shipping clarity, ingredient transparency, social proof, and description quality. Products that fail these signals are silently rejected, costing merchants revenue they never knew they were losing.

This platform makes that invisible process transparent and measurable. Merchants can:

- **Connect their live Shopify store** and fetch their real product catalog via the Admin API
- **Run a full 7-query AI audit** that evaluates every product across common buyer intents
- **See an inclusion rate** per product — the percentage of queries in which a product was recommended
- **Get a ranked action plan** showing which products to fix first and exactly which data fields are causing rejections
- **Simulate custom queries** to test any buyer intent against live or mock product data
- **Run a before/after comparison** that proves how fixing product data changes AI outcomes on the exact same query

---

## How It Works

```
Shopify Catalog → AI Agent Simulation → Inclusion Rate → Issue Diagnosis → Priority Action Plan
```

1. **Ingest** — Fetch live products from the Shopify Admin API (or use the built-in mock store)
2. **Simulate** — Run each product through Llama 3.3 70B acting as a strict AI shopping agent across 7 standardised buyer queries
3. **Score** — Calculate a per-product inclusion rate (selected count ÷ total queries × 100%)
4. **Diagnose** — Detect structured issue flags from rejection reasons: `missing_return_policy`, `missing_shipping_info`, `weak_social_proof`, `weak_description`, `missing_specifications`, `price_issue`
5. **Rank** — Sort products worst-first with priority labels: 🔴 Critical · 🟡 Needs Work · 🟢 Minor Fixes · ✅ Good
6. **Prove** — Run a counterfactual rerun with improved data to confirm improvement

---

## Features

### 🔍 AI Simulation Engine
- Multi-query evaluation across 7 standardised buyer intents (generic enough to work for any store category)
- Single-query live simulation for ad-hoc testing
- Groq API integration with `llama-3.3-70b-versatile` — fast, accurate, structured JSON output
- Rate-limit-aware: 15-second sleep between queries to stay within free-tier TPM limits

### 🛍️ Live Shopify Integration
- Connect any store by entering a domain and Admin API access token — no OAuth required
- Accepts any domain format: `https://store.myshopify.com/`, `store.myshopify.com`, etc.
- Fetches up to 250 products per request via the `2024-01` Admin API version
- Extracts `return_policy`, `shipping`, and `ingredients` from product HTML descriptions automatically
- Detects `is_vegan` from product tags

### 📊 Merchant Dashboard
- Overall store AI Visibility Score (average inclusion rate)
- Four summary stats: avg rate · products audited · performing well · need attention
- Per-product inclusion bar chart with color-coded status (red / amber / green)
- Priority badge and issue tag list per product row
- Query bank display showing exactly which queries were used in the audit

### 🧪 Before & After Proof
- Calls the AI agent twice: once with original product data, once with improved data
- Same query, same competitor set, different data → shows the outcome change
- Displays 7-field data quality comparison and AI reasoning for each result
- Verdict banner confirms whether improvement was achieved

### 🖥️ Professional Frontend
- Shopify admin-style light UI — merchants feel immediately at home
- DM Sans + DM Mono typography
- Animated inclusion bars, skeleton loaders, keyword highlighting in rejection reasons
- Works immediately on load with mock data — no store connection required

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| AI Model | Llama 3.3 70B via Groq API | Product evaluation and reasoning |
| Backend Runtime | Node.js 18+ (CommonJS) | API server and data processing |
| API Framework | Express 4 + CORS | REST API layer |
| HTTP Client | axios | Groq API and Shopify Admin API calls |
| Configuration | dotenv | Environment variable management |
| Frontend Framework | React 18 + Vite 5 | UI layer |
| Frontend Styling | Vanilla CSS + CSS variables | Shopify-style design system |
| Fonts | DM Sans, DM Mono (Google Fonts) | Typography |
| Dev Server | Vite proxy | Routes `/api/*` to backend on port 3001 |

---

## Project Structure

```
kasp-hack/
├── README.md
│
├── backend/
│   ├── server.js           # Express API server — all 6 endpoints
│   ├── shopify.js          # Shopify Admin API client + product mapper
│   ├── audit.js            # Standalone multi-query audit CLI
│   ├── simulate.js         # Standalone single-query simulation CLI
│   ├── rerun.js            # Standalone counterfactual rerun CLI
│   ├── improve.js          # Improved product payload for p7
│   ├── store.json          # Mock product catalog (12 SKUs)
│   ├── audit_report.json   # Persisted audit output (gitignored in production)
│   ├── package.json        # Dependencies + npm scripts
│   └── .env                # GROQ_API_KEY (not committed)
│
└── frontend/
    ├── index.html          # HTML entry point
    ├── package.json        # Dependencies + npm scripts
    ├── vite.config.js      # Dev server + API proxy config
    └── src/
        ├── main.jsx        # React bootstrap
        ├── App.jsx         # State management + view routing
        ├── index.css       # Global styles + design tokens
        └── components/
            ├── Shell.jsx        # Top navbar + sidebar layout
            ├── ConnectStore.jsx # Shopify credential form + live audit trigger
            ├── Dashboard.jsx    # Audit results + priority action plan
            ├── Simulate.jsx     # Live query simulation view
            └── BeforeAfter.jsx  # Counterfactual comparison view
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Groq API key** — free at [console.groq.com](https://console.groq.com)
- *(Optional)* A Shopify store with a custom app and `read_products` scope

### 1. Clone and install

```bash
git clone https://github.com/SahebSandhuSingh/kasp-hack.git
cd kasp-hack

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# backend/.env
GROQ_API_KEY=gsk_your_key_here

# Optional — for local testing only. Credentials are passed per-request via the UI.
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_token_here
```

### 3. Start the backend

```bash
cd backend
node server.js
# → API running on http://localhost:3001
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
# → UI running on http://localhost:5173
```

The app loads immediately with mock audit data. No store connection is required to explore the dashboard.

### 5. (Optional) Pre-generate a mock audit

```bash
cd backend
node audit.js
# Runs 7 queries against the mock store, saves audit_report.json
# Takes ~2 minutes due to rate-limit sleeps
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for all LLM calls |
| `SHOPIFY_STORE_DOMAIN` | ⬜ Optional | Default store domain for local CLI testing |
| `SHOPIFY_ACCESS_TOKEN` | ⬜ Optional | Default access token for local CLI testing |

> **Note:** Shopify credentials are passed **dynamically per-request** via the `POST /api/connect-store` and `POST /api/live-audit` request bodies. The `.env` values are documentation-only placeholders for local CLI use.

---

## API Reference

All endpoints run on `http://localhost:3001`. The frontend proxies `/api/*` requests automatically.

---

### `GET /api/health`

Returns server status and a list of all registered endpoints.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T13:21:22.503Z",
  "endpoints": [
    "POST /api/connect-store",
    "POST /api/live-audit",
    "POST /api/live-simulate",
    "GET /api/audit",
    "POST /api/simulate",
    "POST /api/rerun"
  ]
}
```

---

### `GET /api/audit`

Returns the pre-generated mock audit report from `audit_report.json`.

**Response**
```json
{
  "generated_at": "2026-04-27T13:21:22.503Z",
  "query_bank": ["best product with free returns...", "..."],
  "products": [
    {
      "id": "p1",
      "name": "ProForge Whey Protein Bar – Chocolate Fudge",
      "price": 449,
      "inclusion_rate": 85.7,
      "selected_count": 6,
      "rejected_count": 1,
      "fix_priority": "✅ PERFORMING WELL",
      "issues": [],
      "all_rejection_reasons": ["..."]
    }
  ]
}
```

---

### `POST /api/simulate`

Runs a single Groq query against the mock product store.

**Request body**
```json
{ "query": "protein bar with free returns and good reviews" }
```

**Response**
```json
{
  "query": "protein bar with free returns and good reviews",
  "selected": [
    { "id": "p1", "name": "ProForge Whey Protein Bar", "reason_chosen": "..." }
  ],
  "rejected": [
    { "id": "p7", "name": "PowerZone Protein Bar", "reason_rejected": "No return policy specified..." }
  ]
}
```

---

### `POST /api/rerun`

Runs the before/after counterfactual for product `p7` (PowerZone Protein Bar). Calls the AI agent twice — once with the original data, once with an improved payload — against the same query and competitor set.

**Request body** — none required

**Response**
```json
{
  "query": "best protein bar under ₹500 with free returns",
  "before": { "status": "rejected", "reason": "No return policy specified..." },
  "after":  { "status": "selected", "reason": "Clear 30-day return policy..." },
  "delta": [
    { "field": "return_policy", "before": "null", "after": "Free returns within 30 days..." }
  ],
  "verdict": "IMPROVEMENT CONFIRMED"
}
```

---

### `POST /api/connect-store`

Validates Shopify merchant credentials and returns a lightweight product preview. Use this as a fast connection test before running a full audit.

**Request body**
```json
{
  "domain": "your-store.myshopify.com",
  "accessToken": "shpat_xxxxxxxxxxxxxxxxxxxx"
}
```

**Response**
```json
{
  "success": true,
  "store": {
    "domain": "your-store.myshopify.com",
    "product_count": 24,
    "products": [
      {
        "id": "9876543210",
        "name": "Vegan Protein Powder",
        "price": 1299,
        "has_description": true,
        "has_return_policy": false,
        "has_shipping": true,
        "has_ingredients": true,
        "is_vegan": true,
        "tag_count": 4
      }
    ]
  }
}
```

**Error responses**

| HTTP | Message |
|---|---|
| 400 | `domain and accessToken are required` |
| 400 | `Invalid access token. Please check your Shopify Admin API credentials.` |
| 400 | `Store not found. Please check your store domain.` |
| 400 | `No products found in this store.` |

---

### `POST /api/live-audit`

Fetches live products from the merchant's Shopify store and runs the full 7-query AI audit against them. Takes approximately 2 minutes due to rate-limit delays between queries.

**Request body**
```json
{
  "domain": "your-store.myshopify.com",
  "accessToken": "shpat_xxxxxxxxxxxxxxxxxxxx"
}
```

**Response**
```json
{
  "success": true,
  "store": { "domain": "your-store.myshopify.com", "product_count": 24 },
  "audit": {
    "generated_at": "2026-04-27T13:21:22.503Z",
    "query_bank": ["best product with free returns...", "..."],
    "products": [ ],
    "summary": {
      "average_inclusion_rate": 38.4,
      "performing_well": 3,
      "needs_fixes": 14
    }
  }
}
```

---

### `POST /api/live-simulate`

Runs a single Groq query simulation against a merchant's live Shopify products.

**Request body**
```json
{
  "domain": "your-store.myshopify.com",
  "accessToken": "shpat_xxxxxxxxxxxxxxxxxxxx",
  "query": "best vegan product with fast shipping"
}
```

**Response**
```json
{
  "success": true,
  "store": { "domain": "your-store.myshopify.com", "product_count": 24 },
  "result": {
    "query": "best vegan product with fast shipping",
    "selected": [ ],
    "rejected": [ ]
  }
}
```

---

## Demo Results

Results from the built-in mock store (12 protein bar SKUs, 7 queries):

| # | Product | Inclusion Rate | Priority | Top Issue |
|---|---|---|---|---|
| 1 | ProForge Whey Protein Bar – Chocolate Fudge | 85.7% | ✅ Good | — |
| 2 | IronMax High-Protein Crunch Bar – Peanut Butter | 71.4% | 🟢 Minor Fixes | weak_social_proof |
| 3 | CleanFuel Plant Protein Bar – Vanilla Almond | 28.6% | 🟡 Needs Work | missing_return_policy |
| 4 | SlimFit Keto Protein Bar – Dark Chocolate | 14.3% | 🔴 Critical | missing_shipping_info |
| 5 | PowerZone Protein Bar – Strawberry Blast | 0% | 🔴 Critical | weak_description |
| 6 | GreenLeaf Organic Oat Bar | 0% | 🔴 Critical | missing_specifications |

**Key finding:** The PowerZone bar moved from **0% → 71.4% inclusion** after fixing its description, return policy, shipping info, ingredients, and review count — without changing the product itself. Data quality directly controls AI visibility.

---

## Roadmap

- [x] Single-query simulation engine (Groq + mock store)
- [x] Counterfactual rerun engine (before/after proof)
- [x] Multi-query audit with priority ranking
- [x] React dashboard with Shopify-style UI
- [x] Live Shopify Admin API integration
- [x] Per-request credential flow (any merchant can connect)
- [x] Live audit endpoint (`/api/live-audit`)
- [x] Live simulation endpoint (`/api/live-simulate`)
- [ ] Webhook-triggered re-audit on product update
- [ ] Fix suggestion generator (auto-writes improved copy)
- [ ] Multi-store comparison dashboard
- [ ] Shopify App Store distribution

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## Team

| Name | Role |
|---|---|
| **aditzz073** | Full-Stack Engineering, Backend Architecture |
| **SahebSandhuSingh** | AI Systems Engineering, Frontend Design |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for the Kasparro Hackathon 2026*