# AI Representation Optimizer

Measure and improve how AI shopping agents rank your Shopify products before customers ever see recommendations.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=0A0A0A)
![Groq%20API](https://img.shields.io/badge/Groq%20API-llama--3.3--70b-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## Overview

AI Representation Optimizer evaluates how LLM-powered shopping agents interpret product data in a Shopify catalog. It is built for merchants and growth teams who need clear visibility into why products are selected or ignored. The platform runs realistic agent simulations, surfaces trust and data-quality gaps, and produces ranked remediation priorities. It also validates impact by proving that targeted data fixes improve inclusion.

---

## How It Works

1. Input store data from a Shopify-like catalog with mixed product quality.
2. Simulate multiple AI shopping queries against every product via Groq.
3. Diagnose structured rejection patterns and calculate inclusion rates.
4. Show counterfactual before/after proof for improved product records.

---

## Features

| AI Simulation | Merchant Diagnostics | Actionable Output |
|---|---|---|
| - Single-query and multi-query evaluation flows.<br>- LLM ranking decisions with selection and rejection reasons.<br>- Live simulation endpoint for dashboard input. | - Per-product inclusion rate across seven user intents.<br>- Pattern-based issue flags (returns, shipping, social proof, description, ingredients, pricing).<br>- Priority scoring to highlight underperforming SKUs. | - Ranked action plan with severity and progress indicators.<br>- Counterfactual rerun proving rejected to selected transitions.<br>- Frontend dashboard for monitoring and remediation review. |

---

## Demo Results

| Product | Inclusion Rate | Priority |
|---|---|---|
| ProForge Whey Protein Bar | 85.7% | ✅ PERFORMING WELL |
| IronMax High-Protein Crunch Bar | 71.4% | 🟢 MINOR FIXES |
| CleanFuel Plant Protein Bar | 28.6% | 🟡 NEEDS WORK |
| PowerZone Protein Bar | 0% | 🔴 CRITICAL |
| GreenLeaf Organic Oat Bar | 0% | 🔴 CRITICAL |
| ZenProtein Ayurvedic Bar | 0% | 🔴 CRITICAL |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js (CommonJS) |
| API Server | Express, CORS |
| AI Model | llama-3.3-70b-versatile via Groq API |
| Backend HTTP Client | axios |
| Frontend | React 18, Vite |
| Frontend Data Fetching | fetch |
| Configuration | dotenv |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Groq API key

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
cat > backend/.env << 'EOF'
GROQ_API_KEY=your_groq_api_key_here
EOF
```

### 3. Generate audit data

```bash
cd backend
node audit.js
```

### 4. Start backend API

```bash
cd backend
node server.js
```

### 5. Start frontend app

```bash
cd frontend
npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/audit | Returns the generated audit report used by the dashboard. |
| POST | /api/simulate | Runs a live query simulation across the product catalog. |
| POST | /api/rerun | Runs the before/after counterfactual and returns delta output. |

---

## Project Structure

```text
kasp-hack/
├── README.md
├── backend/
│   ├── store.json          # Mock store catalog
│   ├── simulate.js         # Single-query simulation CLI
│   ├── improve.js          # Improved product payload for rerun
│   ├── rerun.js            # Counterfactual rerun engine
│   ├── audit.js            # Multi-query audit generator
│   ├── server.js           # Express API server
│   ├── audit_report.json   # Persisted audit output
│   └── package.json        # Backend dependencies and scripts
└── frontend/
    ├── index.html          # Vite HTML entry
    ├── package.json        # Frontend dependencies and scripts
    ├── vite.config.js      # API proxy configuration
    └── src/
        ├── main.jsx        # React bootstrap
        ├── App.jsx         # Route-level composition
        ├── index.css       # Global styles
        └── components/
            ├── Layout.jsx      # App shell
            ├── Dashboard.jsx   # Audit dashboard view
            ├── Simulate.jsx    # Query simulation view
            └── BeforeAfter.jsx # Counterfactual comparison view
```

---

## Roadmap

- [x] Step 1 - Single query simulation engine
- [x] Step 2 - Counterfactual rerun engine
- [x] Step 3 - Multi-query audit and priority planner
- [x] Step 4 - React dashboard
- [ ] Step 5 - Real Shopify Admin API integration (in progress)

---

## Team

- aditzz073 — Full-Stack Engineering
- SahebSandhuSingh — AI Systems Engineering

---

*Built for the Kasparro Hackathon 2026*