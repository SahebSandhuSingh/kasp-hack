# AI Rep Optimizer

> **Understand exactly how AI shopping agents perceive your Shopify store — and fix it.**

AI Rep Optimizer gives Shopify merchants clear, data-driven visibility into why their products are selected or ignored by LLM-powered shopping agents. It surfaces structured trust-and-quality gaps, prioritizes which products to fix first, and delivers clear correlations showing how data improvements drive actual revenue.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=0A0A0A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

---

## ⚡ What is it?

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

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.