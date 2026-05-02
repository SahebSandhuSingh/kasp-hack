# Visibly (AI Rep Optimizer)

> **Understand exactly how AI shopping agents perceive your Shopify store — and fix it.**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=0A0A0A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

---

## ⚡ Problem Statement

AI shopping agents (used by ChatGPT, Perplexity, Google AI Overviews, and emerging agent frameworks) evaluate product catalogs using structured signals such as return policies, shipping clarity, ingredient transparency, social proof, and description quality. 

Products that fail to provide these signals are **silently rejected** by AI models, costing merchants revenue they never knew they were losing. Merchants have no visibility into how these algorithms perceive their catalogs.

## 💡 Overview

Visibly gives Shopify merchants clear, data-driven visibility into why their products are selected or ignored by LLM-powered shopping agents. It surfaces structured trust-and-quality gaps, prioritizes which products to fix first, and delivers clear correlations showing how data improvements drive actual revenue.

### Core Features

- **Connect a Live Shopify Store** securely via Admin API to fetch real catalog and sales data.
- **Track AI Visibility Scores** (0-100 scale) calculated across strict criteria (e.g. Return Policy visibility, Shipping Info, Specs).
- **Analyze Revenue vs. Score Correlation** to see exactly how listing quality impacts 30-day sales.
- **Optimize Product Data** with a side-by-side diff view of AI-suggested listing improvements and one-click store updates.
- **Simulate Custom Queries** to see what products surface when customers search using AI.

---

## 🚀 Quick Setup Guide

Getting the application running locally takes less than 2 minutes.

### Prerequisites

- Node.js (v18+)
- A Shopify store's **Admin API Access Token** (for testing live data)
- An **OpenAI API Key**

### 1. Clone & Install

```bash
git clone https://github.com/SahebSandhuSingh/kasp-hack.git
cd kasp-hack

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend` directory and add your OpenAI key:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

*(Note: Shopify credentials are securely entered directly through the frontend UI when connecting your store. You do not need them in the `.env` file.)*

### 3. Run the App Locally

Open **Terminal 1** (Start the Backend):
```bash
cd backend
npm run dev
```
*(Alternatively: `node server.js`)*

Open **Terminal 2** (Start the Frontend):
```bash
cd frontend
npm run dev
```

**That's it!** Navigate to `http://localhost:5174` in your browser. You will be greeted by the Shopify Connection screen.

---

## 👥 Team

Built for the Kasparro Hackathon 2026 by:
- **aditzz073** — Full-Stack Engineering, Backend Architecture
- **SahebSandhuSingh** — AI Systems Engineering, Frontend Design

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
