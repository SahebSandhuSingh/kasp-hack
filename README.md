# AI Rep Optimizer

> **Understand exactly how AI shopping agents perceive your Shopify store — and fix it.**

AI Rep Optimizer gives Shopify merchants clear, data-driven visibility into why their products are selected or ignored by LLM-powered shopping agents. It surfaces structured trust-and-quality gaps, prioritizes which products to fix first, and delivers clear correlations showing how data improvements drive actual revenue.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=0A0A0A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

---

<<<<<<< HEAD
## ⚡ What is it?
=======
## Table of Contents

- [Team](#team)
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


---


## Team

| Name | Role |
|---|---|
| **aditzz073** | Full-Stack Engineering, Backend Architecture |
| **SahebSandhuSingh** | AI Systems Engineering, Frontend Design |

## Overview
>>>>>>> a6e2a1ab8b512193d5526a8d506699530d452321

AI shopping agents (used by ChatGPT, Perplexity, Google AI Overviews, and emerging agent frameworks) evaluate product catalogs using structured signals — return policies, shipping clarity, ingredient transparency, social proof, and description quality. Products that fail these signals are silently rejected, costing merchants revenue they never knew they were losing.

This platform makes that invisible process transparent. Merchants can:

- **Connect a live Shopify store** using an Admin API access token to fetch real catalog and sales data.
- **Track AI Visibility Scores** (0-100 scale) calculated across 7 critical data points.
- **Analyze Revenue vs. Score Correlation** to see exactly how listing quality impacts 30-day sales.
- **Optimize Product Data** with a side-by-side diff view of AI-suggested listing improvements.
- **Simulate Custom Queries** to see what products surface when customers search using AI.

---

## 🚀 Quick Setup Guide

Getting the application running locally takes less than 2 minutes. 

### Prerequisites
- Node.js (v18+)
- A Shopify store's **Admin API Access Token** (for testing live data)

### 1. Clone & Install
```bash
git clone https://github.com/SahebSandhuSingh/kasp-hack.git
cd kasp-hack

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend` directory:
```bash
# backend/.env

# Add your OpenAI API Key for the simulation engine
OPENAI_API_KEY=sk-your-openai-api-key-here
```
*(Note: Shopify credentials are no longer needed in the `.env` file. You will securely enter them directly through the frontend UI when connecting your store.)*

### 3. Run the App

Open **Terminal 1** (Backend):
```bash
cd backend
node server.js
```

Open **Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
```

**That's it!** Navigate to `http://localhost:5174` in your browser. You will be greeted by the Shopify Connection screen.

---

## 🛠️ Features & Architecture

### Frontend (React + Vite + Tailwind)
- **Shopify Polaris Design:** A meticulous implementation of Shopify's design language (#008060 green, Inter typography, clean cards) so merchants feel immediately at home.
- **4 Core Views:**
  1. **Overview:** High-level metrics, score rings, and a prioritized issue breakdown.
  2. **Products Table:** Filterable, sortable list of all synced products with health badges.
  3. **Optimize (Before/After):** Side-by-side text diffing tool to review and apply AI-suggested descriptions.
  4. **Simulate:** Real-time query tester with an API delay simulation to see how products rank.
- **Analytics Dashboard (Recharts):** Data visualizations tracking AI Traffic tiers, Historical Score Trends, and Sales/Revenue Correlation scatter plots.

### Backend (Node.js + Express + SQLite)
- **Zero-Config Database:** Uses `better-sqlite3` in WAL mode for immediate, reliable local storage. Tracks snapshot history and 30-day product revenue.
- **Shopify Data Service:** Uses the Shopify REST API (`/admin/api/2024-01/`) to automatically fetch products, paginate through the last 30 days of orders, and sync data into SQLite.
- **100-Point Scoring Engine:** Programmatically scores listings against 7 strict criteria:
  - Description Length (>50 words)
  - Return Policy visibility
  - Shipping Information
  - Tags (>3)
  - Ingredients/Specifications 
  - Media Count (>1 image)
  - Compare-at Price presence

---

## 📈 Demo Insight
In testing, we found that products with an AI Visibility Score **below 40** generated an average of **₹0 to ₹5k** per month, while products scoring **above 70** generated **₹40k+**. By explicitly adding missing return policies and shipping data to product descriptions, products moved from 0% AI inclusion to 75%+ inclusion instantly.

---

## 👥 Team
Built for the Kasparro Hackathon 2026 by:
- **aditzz073** — Full-Stack Engineering, Backend Architecture
- **SahebSandhuSingh** — AI Systems Engineering, Frontend Design

<<<<<<< HEAD
## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
=======
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

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for the Kasparro Hackathon 2026*
>>>>>>> a6e2a1ab8b512193d5526a8d506699530d452321
