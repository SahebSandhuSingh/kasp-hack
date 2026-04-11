require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RERUN_QUERY = "best protein bar under ₹500 with free returns";
const TARGET_ID = "p7";

// ──────────────────────────────────────────────
// IMPROVED PRODUCT (p7) — from improve.js
// ──────────────────────────────────────────────
const improvedProduct = {
  id: "p7",
  name: "PowerZone Protein Bar – Strawberry Blast",
  price: 449,
  description: "PowerZone Strawberry Blast delivers 24g of whey protein per bar with only 5g of sugar. Made with real strawberry pieces, no artificial flavors, and fortified with B vitamins for sustained energy. Ideal for post-workout recovery or a high-protein snack on the go. Each bar is individually sealed for freshness.",
  return_policy: "Free returns within 30 days of delivery. No questions asked. Full refund issued within 3-5 business days.",
  shipping: "Free delivery on all orders. Delivered within 3-5 business days.",
  rating: 4.6,
  review_count: 187,
  reviews: [
    "Best tasting protein bar I've tried, strawberry flavor is actually real!",
    "Great macros and arrives well packaged. Will reorder.",
    "Solid protein content, good for post gym. Free returns policy is a plus."
  ],
  tags: ["protein", "whey", "strawberry", "post-workout", "gluten-free"],
  ingredients: "Whey Protein Isolate, Strawberry Pieces, Oats, Dark Chocolate Coating, B Vitamins, Sunflower Lecithin",
  is_vegan: false
};

// ──────────────────────────────────────────────
// HELPERS — duplicated from simulate.js / audit.js
// ──────────────────────────────────────────────
function loadProducts() {
  const storePath = path.join(__dirname, 'store.json');
  const raw = fs.readFileSync(storePath, 'utf-8');
  return JSON.parse(raw).products;
}

function buildSystemPrompt() {
  return `You are a strict AI shopping agent evaluating products for a user query. Your job is to recommend the best products based ONLY on the data provided. You must be harsh and specific in your evaluations. If a product is missing data (no return policy, vague description, no reviews, unclear shipping), that is a signal of low quality and you must penalize it. You are NOT allowed to assume any information that is not explicitly present in the product data. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;
}

function buildUserPrompt(query, products) {
  const productBlock = products.map((p, i) => `
${i + 1}. ID: ${p.id} | Name: ${p.name} | Price: ₹${p.price}
   Description: ${p.description}
   Return Policy: ${p.return_policy || "NOT SPECIFIED"}
   Shipping: ${p.shipping || "NOT SPECIFIED"}
   Rating: ${p.rating}/5 | Reviews: ${p.review_count} reviews
   Ingredients: ${p.ingredients || "NOT SPECIFIED"}
   Vegan: ${p.is_vegan === null ? "NOT SPECIFIED" : p.is_vegan}
`).join("\n");

  return `User query: ${query}

Here are the products available in this store:

${productBlock}

Your task:
1. Select the TOP 2 products that best match the user query
2. For EVERY product you do NOT select, provide a specific one-line reason why you rejected it — be explicit about what data was missing or insufficient
3. Return your response as valid JSON in exactly this format:

{
  "query": "the original query",
  "selected": [
    {
      "id": "product id",
      "name": "product name",
      "reason_chosen": "specific reason why this product was selected"
    }
  ],
  "rejected": [
    {
      "id": "product id",
      "name": "product name",
      "reason_rejected": "specific reason why this product was rejected — mention the missing or weak data explicitly"
    }
  ]
}

Rules:
- Selected array must have exactly 2 products
- Rejected array must contain ALL remaining products
- Every reason must be specific, not generic — do not say "not the best fit", say exactly what data was missing or why it failed the query
- If return policy is null or not mentioned, always flag it when the query asks about returns
- If review_count is low (under 20), flag it as a weak trust signal
- If description is vague or promotional without substance, flag it explicitly`;
}

async function callGroq(products, query) {
  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(query, products) }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  const response = await axios.post(GROQ_URL, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    }
  });

  return JSON.parse(response.data.choices[0].message.content);
}

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────

// GET /api/audit — serve the pre-generated audit report
app.get('/api/audit', (req, res) => {
  try {
    const reportPath = path.join(__dirname, 'audit_report.json');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'audit_report.json not found. Run node audit.js first.' });
    }
    const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulate — run a single query against the full store
app.post('/api/simulate', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query field is required' });
    }
    const products = loadProducts();
    const result = await callGroq(products, query.trim());
    res.json(result);
  } catch (err) {
    console.error('POST /api/simulate error:', err.message);
    if (err.response) {
      return res.status(502).json({ error: 'Groq API error', detail: err.response.data });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rerun — before/after counterfactual for p7
app.post('/api/rerun', async (req, res) => {
  try {
    const products = loadProducts();
    const originalP7 = products.find(p => p.id === TARGET_ID);

    // BEFORE — original data
    const beforeResult = await callGroq(products, RERUN_QUERY);

    // Inject improved product
    const updatedProducts = products.map(p => p.id === TARGET_ID ? improvedProduct : p);

    // AFTER — improved data
    const afterResult = await callGroq(updatedProducts, RERUN_QUERY);

    // Find p7 in each result
    const beforeP7 = beforeResult.rejected.find(p => p.id === TARGET_ID)
      || beforeResult.selected.find(p => p.id === TARGET_ID);
    const afterP7Selected = afterResult.selected.find(p => p.id === TARGET_ID);
    const afterP7Rejected = afterResult.rejected.find(p => p.id === TARGET_ID);

    const delta = [
      { field: 'description', before: 'Vague promotional text with no nutritional data', after: 'Detailed 4-sentence description with protein, sugar, ingredients, and purpose' },
      { field: 'return_policy', before: originalP7 ? (originalP7.return_policy || 'null') : 'null', after: improvedProduct.return_policy },
      { field: 'shipping', before: originalP7 ? (originalP7.shipping || 'null') : 'null', after: improvedProduct.shipping },
      { field: 'rating', before: originalP7 ? String(originalP7.rating) : 'N/A', after: String(improvedProduct.rating) },
      { field: 'review_count', before: originalP7 ? String(originalP7.review_count) + ' reviews' : 'N/A', after: String(improvedProduct.review_count) + ' reviews' },
      { field: 'reviews', before: 'Empty array (no review text)', after: '3 detailed customer reviews with text' },
      { field: 'ingredients', before: 'null', after: improvedProduct.ingredients },
    ];

    res.json({
      query: RERUN_QUERY,
      before: {
        status: beforeResult.selected.find(p => p.id === TARGET_ID) ? 'selected' : 'rejected',
        reason: beforeP7 ? (beforeP7.reason_rejected || beforeP7.reason_chosen) : 'Not found in results',
        originalData: originalP7
      },
      after: {
        status: afterP7Selected ? 'selected' : 'rejected',
        reason: afterP7Selected ? afterP7Selected.reason_chosen : (afterP7Rejected ? afterP7Rejected.reason_rejected : 'Not found in results'),
        improvedData: improvedProduct
      },
      delta,
      verdict: afterP7Selected
        ? 'IMPROVEMENT CONFIRMED'
        : 'STILL_REJECTED'
    });
  } catch (err) {
    console.error('POST /api/rerun error:', err.message);
    if (err.response) {
      return res.status(502).json({ error: 'Groq API error', detail: err.response.data });
    }
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Rep Optimizer backend running on http://localhost:${PORT}`);
  console.log('   GET  /api/audit');
  console.log('   POST /api/simulate');
  console.log('   POST /api/rerun\n');
});
