const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const { fetchShopifyProducts, getStoreData } = require('./shopify');
const { detectIssues } = require('./detect-issues');
const { runCounterfactual } = require('./counterfactual');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const analyticsRoutes = require('./analyticsRoutes');
app.use('/api', analyticsRoutes);

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const RERUN_QUERY = "best protein bar under ₹500 with free returns";
const TARGET_ID = "p7";

// ──────────────────────────────────────────────
// LIVE AUDIT CONSTANTS
// ──────────────────────────────────────────────
const LIVE_QUERIES = [
  "best product with free returns and clear description",
  "highly rated product with strong customer reviews",
  "product with fast free shipping",
  "most trusted product with detailed information",
  "best value product with clear pricing",
  "product with detailed ingredients or specifications",
  "best overall product with complete information"
];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

async function callLLM(products, query) {
  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(query, products) }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  const response = await axios.post(OPENAI_URL, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    }
  });

  return JSON.parse(response.data.choices[0].message.content);
}

// ──────────────────────────────────────────────
// callGroq — now uses OpenAI gpt-4o-mini
// ──────────────────────────────────────────────
async function callGroq(products, query) {
  const productBlock = products.map((p, i) => `
${i + 1}. ID: ${p.id} | Name: ${p.name} | Price: ₹${p.price}
   Description: ${p.description || "NOT PROVIDED"}
   Return Policy: ${p.return_policy || "NOT SPECIFIED"}
   Shipping: ${p.shipping || "NOT SPECIFIED"}
   Rating: ${p.rating || "NOT SPECIFIED"} | Reviews: ${p.review_count || 0}
   Ingredients: ${p.ingredients || "NOT SPECIFIED"}
   Vegan: ${p.is_vegan === null ? "NOT SPECIFIED" : p.is_vegan}
`).join("\n");

  const systemPrompt = `You are a strict AI shopping agent evaluating products for a user query.
Recommend products based ONLY on the data provided.
Penalize missing data heavily — null return policy, vague descriptions, no reviews are rejection signals.
Never assume information not explicitly present.
Return ONLY valid JSON, no markdown, no text outside JSON.`;

  const userPrompt = `User query: ${query}

Products:
${productBlock}

Return exactly this JSON:
{
  "query": "${query}",
  "selected": [
    { "id": "...", "name": "...", "reason_chosen": "..." }
  ],
  "rejected": [
    { "id": "...", "name": "...", "reason_rejected": "specific missing data or failure reason" }
  ]
}

Rules:
- selected must have exactly 2 products (or fewer only if less than 2 products qualify)
- rejected must contain ALL remaining products
- Every reason must be specific — mention the exact missing field or data gap
- Never say "not the best fit" — say exactly what data was missing or why it failed`;

  const response = await axios.post(
    OPENAI_URL,
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
}

// Issue detection now uses deterministic checks from detect-issues.js
// (imported at top — no LLM calls needed)

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
// ROUTES — existing
// ──────────────────────────────────────────────

// GET /api/health — health check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/connect-store",
      "POST /api/live-audit",
      "POST /api/live-simulate",
      "GET /api/audit",
      "POST /api/simulate",
      "POST /api/rerun"
    ]
  });
});

// GET /api/audit — fetch live store data from Shopify
app.get('/api/audit', async (req, res) => {
  try {
    const storeData = await getStoreData();
    res.json(storeData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulate — run a single query against the full store (uses Groq)
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

// POST /api/rerun — real counterfactual engine (no mocked data)
// Accepts: { product_id, query, fixes[] } or falls back to p7 demo
app.post('/api/rerun', async (req, res) => {
  try {
    const products = loadProducts();
    const { product_id, query, fixes } = req.body;

    // Resolve target product
    const targetId = product_id || TARGET_ID;
    const product = products.find(p => p.id === targetId);
    if (!product) {
      return res.status(404).json({ error: `Product ${targetId} not found` });
    }

    // Resolve query — use provided, or fall back to default
    const testQuery = query || RERUN_QUERY;

    // Resolve fixes — use provided, or fall back to demo fixes for p7
    const appliedFixes = fixes || [
      { field: 'description', suggested_improvement: improvedProduct.description },
      { field: 'policies', suggested_improvement: improvedProduct.return_policy },
      { field: 'shipping', suggested_improvement: improvedProduct.shipping },
      { field: 'specifications', suggested_improvement: improvedProduct.ingredients },
    ];

    console.log(`\n🔬 Counterfactual: ${product.name} | query: "${testQuery}"`);

    const result = await runCounterfactual(product, appliedFixes, testQuery);

    console.log(`   Verdict: ${result.verdict} | delta: ${result.delta}`);

    res.json(result);
  } catch (err) {
    console.error('POST /api/rerun error:', err.message);
    if (err.response) {
      return res.status(502).json({ error: 'LLM API error', detail: err.response.data });
    }
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// ROUTES — new Shopify live endpoints
// ──────────────────────────────────────────────

// POST /api/connect-store — validate credentials and return product preview
app.post('/api/connect-store', async (req, res) => {
  try {
    const { domain, accessToken } = req.body;

    if (!domain || !accessToken) {
      return res.status(400).json({ error: "domain and accessToken are required" });
    }

    const products = await fetchShopifyProducts(domain, accessToken);

    // Extract cleaned domain (same logic as shopify.js)
    const cleanedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim();

    // Map to lightweight preview — not the full product object
    const preview = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      has_description: !!(p.description && p.description.length > 10),
      has_return_policy: !!p.return_policy,
      has_shipping: !!p.shipping,
      has_ingredients: !!p.ingredients,
      is_vegan: p.is_vegan,
      tag_count: p.tags ? p.tags.length : 0
    }));

    // Fire off async background sync for the new database features
    // We do not await this, so the frontend UI connects instantly.
    const { fetchAndScoreProducts, fetchSalesData, today } = require('./shopifyDataService');
    const db = require('./db');
    (async () => {
      try {
        const { scored } = await fetchAndScoreProducts(domain, accessToken);
        const date = today();
        const snapStmt = db.prepare(`INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain) VALUES (?, ?, ?, ?, ?, ?)`);
        db.transaction((snaps) => {
          for (const snap of snaps) snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, date, cleanedDomain);
        })(scored);

        const salesData = await fetchSalesData(domain, accessToken);
        const salesStmt = db.prepare(`INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        db.transaction((items) => {
          for (const item of items) salesStmt.run(item.product_id, item.product_title, item.revenue, item.orders_count, item.period_start, item.period_end, item.store_domain);
        })(salesData);
        console.log(`Background sync complete for ${cleanedDomain}`);
      } catch (e) {
        console.error('Background sync failed:', e.message);
      }
    })();

    return res.json({
      success: true,
      store: {
        domain: cleanedDomain,
        product_count: products.length,
        products: preview
      }
    });
  } catch (err) {
    console.error('POST /api/connect-store error:', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/live-audit — fetch live products and run full 7-query AI audit
app.post('/api/live-audit', async (req, res) => {
  try {
    const { domain, accessToken } = req.body;

    if (!domain || !accessToken) {
      return res.status(400).json({ error: "domain and accessToken are required" });
    }

    const products = await fetchShopifyProducts(domain, accessToken);

    const cleanedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim();

    console.log(`\n🚀 Running live audit for ${cleanedDomain} — ${products.length} products`);

    // Run all 7 queries sequentially with sleep between calls
    const allResults = [];
    for (let i = 0; i < LIVE_QUERIES.length; i++) {
      const query = LIVE_QUERIES[i];
      console.log(`  [${i + 1}/${LIVE_QUERIES.length}] Running: "${query}"`);
      const result = await callGroq(products, query);
      allResults.push({
        query,
        selected: result.selected || [],
        rejected: result.rejected || []
      });

      // 15s delay between calls to respect Groq free-tier TPM limit
      if (i < LIVE_QUERIES.length - 1) {
        console.log(`  ⏳ Waiting 15s before next query...`);
        await sleep(1000);
      }
    }

    console.log(`  ✅ All queries complete. Building audit report...`);

    // Compute per-product inclusion stats
    const productStats = {};
    products.forEach(p => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        price: p.price,
        selected_count: 0,
        rejected_count: 0,
        inclusion_rate: 0,
        all_rejection_reasons: [],
        issues: [],
        fix_priority: ""
      };
    });

    allResults.forEach(result => {
      (result.selected || []).forEach(p => {
        if (productStats[p.id]) productStats[p.id].selected_count += 1;
      });
      (result.rejected || []).forEach(p => {
        if (productStats[p.id]) {
          productStats[p.id].rejected_count += 1;
          productStats[p.id].all_rejection_reasons.push(p.reason_rejected);
        }
      });
    });

    const totalQueries = LIVE_QUERIES.length;
    Object.values(productStats).forEach(stat => {
      stat.inclusion_rate = parseFloat(
        ((stat.selected_count / totalQueries) * 100).toFixed(1)
      );
    });

    // Detect issues deterministically from product data (not LLM output)
    const productLookup = {};
    products.forEach(p => { productLookup[p.id] = p; });
    Object.values(productStats).forEach(stat => {
      const product = productLookup[stat.id];
      stat.issues = product ? detectIssues(product) : [];
    });

    // Assign fix priority labels
    function assignPriority(rate) {
      if (rate <= 20) return "🔴 CRITICAL";
      if (rate <= 50) return "🟡 NEEDS WORK";
      if (rate <= 85) return "🟢 MINOR FIXES";
      return "✅ PERFORMING WELL";
    }

    const rankedProducts = Object.values(productStats)
      .sort((a, b) => a.inclusion_rate - b.inclusion_rate)
      .map(stat => {
        stat.fix_priority = assignPriority(stat.inclusion_rate);
        return stat;
      });

    const avgInclusion = parseFloat(
      (rankedProducts.reduce((sum, p) => sum + p.inclusion_rate, 0) / rankedProducts.length).toFixed(1)
    );
    const performingWell = rankedProducts.filter(p => p.inclusion_rate > 85).length;
    const needsFixes = rankedProducts.filter(p => p.inclusion_rate < 60).length;

    console.log(`  📊 Audit complete: avg inclusion ${avgInclusion}%, ${performingWell} performing well, ${needsFixes} need fixes\n`);

    return res.json({
      success: true,
      store: {
        domain: cleanedDomain,
        product_count: products.length
      },
      audit: {
        generated_at: new Date().toISOString(),
        query_bank: LIVE_QUERIES,
        products: rankedProducts,
        summary: {
          average_inclusion_rate: avgInclusion,
          performing_well: performingWell,
          needs_fixes: needsFixes
        }
      }
    });
  } catch (err) {
    console.error('POST /api/live-audit error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/live-simulate — run a single query against live Shopify products
app.post('/api/live-simulate', async (req, res) => {
  try {
    const { domain, accessToken, query } = req.body;

    if (!domain || !accessToken || !query) {
      return res.status(400).json({ error: "domain, accessToken, and query are required" });
    }

    const products = await fetchShopifyProducts(domain, accessToken);

    const cleanedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim();

    console.log(`\n🔍 Live simulate for ${cleanedDomain} — query: "${query}"`);

    const result = await callGroq(products, query);

    return res.json({
      success: true,
      store: {
        domain: cleanedDomain,
        product_count: products.length
      },
      result: {
        query: result.query || query,
        selected: result.selected || [],
        rejected: result.rejected || []
      }
    });
  } catch (err) {
    console.error('POST /api/live-simulate error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Rep Optimizer backend running on http://localhost:${PORT}`);
  console.log('   GET  /api/health');
  console.log('   GET  /api/audit');
  console.log('   POST /api/simulate');
  console.log('   POST /api/rerun');
  console.log('   POST /api/connect-store');
  console.log('   POST /api/live-audit');
  console.log('   POST /api/live-simulate\n');
});

// ──────────────────────────────────────────────
// BACKGROUND CRON JOBS
// ──────────────────────────────────────────────
const { fetchAndScoreProducts, fetchSalesData, today } = require('./shopifyDataService');
const db = require('./db');

setInterval(async () => {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!domain || !accessToken) return;

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
  const currentDate = today();

  try {
    // Check if snapshot exists today
    const exists = db.prepare('SELECT 1 FROM score_snapshots WHERE store_domain = ? AND snapshot_date = ? LIMIT 1').get(cleanDomain, currentDate);
    if (exists) return;

    console.log(`\n[CRON] Daily sync triggered for ${cleanDomain}...`);
    
    // 1. Sync Products
    const { scored } = await fetchAndScoreProducts(domain, accessToken);
    const snapStmt = db.prepare(`INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain) VALUES (?, ?, ?, ?, ?, ?)`);
    db.transaction((snaps) => {
      for (const snap of snaps) snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, currentDate, cleanDomain);
    })(scored);

    // 2. Sync Sales
    const salesData = await fetchSalesData(domain, accessToken);
    const salesStmt = db.prepare(`INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    db.transaction((items) => {
      for (const item of items) salesStmt.run(item.product_id, item.product_title, item.revenue, item.orders_count, item.period_start, item.period_end, item.store_domain);
    })(salesData);
    
    console.log(`[CRON] Sync complete for ${cleanDomain}`);
  } catch (err) {
    console.error('[CRON] Sync failed:', err.message);
  }
}, 60 * 60 * 1000); // Check every 60 minutes
