const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const axios = require('axios');
const fs = require('fs');
const { fetchShopifyProducts, getStoreData, getAccessToken } = require('./shopify');
const { detectIssues } = require('./detect-issues');
const { runCounterfactual } = require('./counterfactual');
const db = require('./db');
const { scoreProduct, fetchAndScoreProducts, fetchSalesData, today } = require('./shopifyDataService');
const { detectCategory, getRubric, CATEGORY_LABELS, scoreToAICitationProbability } = require('./categoryEngine');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-rep-optimizer-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

function requireAuth(req, res, next) {
  if (!req.session.store) {
    return res.status(401).json({
      error: "not_connected",
      message: "Please connect your store first"
    });
  }
  req.storeSession = req.session.store;
  next();
}

const analyticsRoutes = require('./analyticsRoutes');
app.use('/api', analyticsRoutes(requireAuth));

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
  "best beginner snowboard under ₹50000",
  "lightweight everyday t-shirt for men",
  "high protein low sugar snack bar",
  "professional ski accessories for advanced riders",
  "affordable gift for someone who loves winter sports",
  "complete snowboard setup for intermediate riders",
  "best value sports equipment for outdoor activities"
];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Active sessions map — used by background cron for periodic syncs
const activeSessions = new Map();

async function loadSessionProducts(domain, accessToken) {
  const raw = await fetchShopifyProducts(domain, accessToken);
  return raw.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description || '',
    return_policy: p.return_policy || null,
    shipping: p.shipping || null,
    rating: p.rating || null,
    review_count: p.review_count || 0,
    reviews: p.reviews || [],
    tags: p.tags || [],
    ingredients: p.ingredients || null,
    is_vegan: p.is_vegan,
    product_type: p.product_type || null,
    vendor: p.vendor || null,
    shopify_url: p.shopify_url
  }));
}

function cleanStoreDomain(domain) {
  return (domain || '')
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

function normalizeStoreDomain(domain) {
  const clean = cleanStoreDomain(domain);
  if (!clean) return clean;
  return clean.endsWith('.myshopify.com') ? clean : `${clean}.myshopify.com`;
}

async function verifyShopifyConnection(storeDomain, accessToken) {
  return axios.get(
    `https://${storeDomain}/admin/api/2024-01/shop.json`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  );
}

async function resolveAccessToken(storeDomain, clientId, clientSecret) {
  // 1. Try OAuth client_credentials exchange (works for Shopify custom apps)
  try {
    const tokenResp = await axios.post(
      `https://${storeDomain}/admin/oauth/access_token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const accessToken = tokenResp.data.access_token;
    const scopeStr = tokenResp.data.scope || '';
    const verified = await verifyShopifyConnection(storeDomain, accessToken);
    return { accessToken, scope: scopeStr, shop: verified.data.shop };
  } catch (oauthErr) {
    console.warn('OAuth client_credentials exchange failed:', oauthErr.response?.status, oauthErr.response?.data || oauthErr.message);
    throw oauthErr;
  }
}

function checkScopeStatus(scopeStr) {
  const scopes = (scopeStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const required = ["read_products"];
  const recommended = ["write_products", "read_orders"];

  return {
    has_read_products: scopes.includes("read_products") || scopes.includes("write_products"),
    has_write_products: scopes.includes("write_products"),
    has_read_orders: scopes.includes("read_orders"),
    missing_required: required.filter(scope => scope === "read_products" ? !(scopes.includes("read_products") || scopes.includes("write_products")) : !scopes.includes(scope)),
    missing_recommended: recommended.filter(scope => !scopes.includes(scope))
  };
}

function startBackgroundSync(storeDomain, accessToken) {
  (async () => {
    try {
      const freshToken = await getAccessToken();
      const { scored } = await fetchAndScoreProducts(storeDomain, freshToken);
      const date = today();
      const snapStmt = db.prepare(`INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      db.transaction((snaps) => {
        for (const snap of snaps) snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, date, storeDomain, snap.category || 'general');
      })(scored);

      try {
        const salesData = await fetchSalesData(storeDomain, freshToken);
        const salesStmt = db.prepare(`INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        db.transaction((items) => {
          for (const item of items) salesStmt.run(item.product_id, item.product_title, item.revenue, item.orders_count, item.period_start, item.period_end, item.store_domain);
        })(salesData);
      } catch (salesErr) {
        // Sales sync requires Shopify protected customer data approval — skipped silently
      }
      console.log(`Background sync complete for ${storeDomain}`);
    } catch (e) {
      console.error('Background sync failed:', e.message);
    }
  })();
}

function buildSystemPrompt() {
  return `You are a strict AI shopping agent evaluating products for a user query. Your job is to recommend the best products based ONLY on the data provided. You must be harsh and specific in your evaluations. If a product is missing data (no return policy, vague description, no reviews, unclear shipping), that is a signal of low quality and you must penalize it. You are NOT allowed to assume any information that is not explicitly present in the product data. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;
}

function buildUserPrompt(query, products) {
  const productBlock = products.map((p, i) => {
    const catInfo = detectCategory(p);
    const rubric = getRubric(catInfo.category);
    const catLabel = CATEGORY_LABELS[catInfo.category] || 'General';
    return `
${i + 1}. ID: ${p.id} | Name: ${p.name} | Price: ₹${p.price} | Category: ${catLabel}
   Description: ${p.description}
   Return Policy: ${p.return_policy || "NOT SPECIFIED"}
   Shipping: ${p.shipping || "NOT SPECIFIED"}
   Rating: ${p.rating}/5 | Reviews: ${p.review_count} reviews
   Ingredients: ${p.ingredients || "NOT SPECIFIED"}
   Vegan: ${p.is_vegan === null ? "NOT SPECIFIED" : p.is_vegan}
   Key criteria for ${catLabel}: ${rubric.map(c => c.label).join(', ')}`;
  }).join("\n");

  return `User query: ${query}

Here are the products available in this store:

${productBlock}

Your task:
1. Select the TOP 2 products that best match the user query
2. For EVERY product you do NOT select, provide a specific one-line reason why you rejected it — be explicit about what data was missing or insufficient
3. Evaluate each product against its category-specific criteria (listed above). A health food product missing ingredients is a critical flaw. An apparel product missing size guide is a critical flaw. Judge accordingly.
4. Return your response as valid JSON in exactly this format:

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
- If description is vague or promotional without substance, flag it explicitly
- Consider category-specific requirements: health food needs ingredients/macros, apparel needs size/fabric, electronics needs specs/compatibility`;
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
      "POST /api/auth/connect",
      "GET /api/auth/session",
      "POST /api/auth/disconnect",
      "POST /api/live-audit",
      "POST /api/live-simulate",
      "GET /api/audit",
      "POST /api/simulate",
      "POST /api/rerun"
    ]
  });
});

// POST /api/auth/connect — connect Shopify store and save credentials in session
app.post('/api/auth/connect', async (req, res) => {
  const { store_domain } = req.body;
  const errors = {};
  const storeDomain = normalizeStoreDomain(store_domain);
  const clientId = (process.env.SHOPIFY_CLIENT_ID || '').trim();
  const clientSecret = (process.env.SHOPIFY_CLIENT_SECRET || '').trim();

  if (!storeDomain || !storeDomain.endsWith('.myshopify.com')) errors.store_domain = "Store URL must be a .myshopify.com domain.";
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  try {
    const { accessToken, scope, shop } = await resolveAccessToken(storeDomain, clientId, clientSecret);
    const scopeStatus = checkScopeStatus(scope);

    if (scopeStatus.missing_required.length > 0) {
      return res.status(403).json({
        error: "missing_scopes",
        missing: scopeStatus.missing_required,
        message: "Your app is missing required API permissions."
      });
    }

    req.session.store = {
      domain: storeDomain,
      client_id: clientId,
      client_secret: clientSecret,
      access_token: accessToken,
      shop_name: shop.name,
      shop_email: shop.email,
      plan_name: shop.plan_name,
      scope_status: scopeStatus,
      connected_at: new Date().toISOString()
    };

    // Track this session for background cron sync
    activeSessions.set(storeDomain, accessToken);

    startBackgroundSync(storeDomain, accessToken);

    return res.json({
      success: true,
      shop: {
        name: shop.name,
        domain: storeDomain,
        plan_name: shop.plan_name
      },
      scope_status: scopeStatus,
      warning: scopeStatus.has_write_products ? null : "Limited access: write_products scope is missing."
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return res.status(401).json({ error: "Invalid access token. Please use the Admin API access token (starts with shpat_) from the API credentials tab, not the API secret key." });
    }
    if (status === 403) {
      return res.status(403).json({ error: "Connected but missing required API scopes. Make sure your app has read_products and write_products access." });
    }
    if (status === 404) {
      return res.status(400).json({ error: "Store not found. Double-check your store URL (e.g. yourstore.myshopify.com)." });
    }
    console.error('POST /api/auth/connect error:', err.message);
    return res.status(400).json({ error: "Unable to connect to Shopify. Please check your store URL and credentials." });
  }
});

// GET /api/auth/session — current Shopify session state
app.get('/api/auth/session', (req, res) => {
  if (!req.session.store) return res.json({ connected: false });

  const store = req.session.store;
  res.json({
    connected: true,
    shop: {
      name: store.shop_name,
      domain: store.domain,
      plan_name: store.plan_name,
      connected_at: store.connected_at
    },
    scope_status: store.scope_status,
    has_write_access: store.scope_status?.has_write_products === true
  });
});

// POST /api/auth/disconnect — destroy Shopify session
app.post('/api/auth/disconnect', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/audit — fetch live store data from Shopify
app.get('/api/audit', requireAuth, async (req, res) => {
  try {
    const { scored } = await fetchAndScoreProducts(req.storeSession.domain, req.storeSession.access_token);
    const storeData = {
      store_name: req.storeSession.domain,
      product_count: scored.length,
      products: scored.map(p => ({
        id: p.product_id,
        title: p.product_title,
        name: p.product_title,
        score: p.score,
        issues: p.issues,
        issues_count: p.issues_count,
        category: p.category,
        category_confidence: p.category_confidence,
        matched_signals: p.matched_signals,
        criteria_results: p.criteria_results,
        status: p.score >= 70 ? 'optimized' : p.score >= 40 ? 'needs-work' : 'critical',
        description: p.description,
        raw_html: p.raw_html,
        product_type: p.product_type,
        price: p.price,
        image: p.image,
        tags: p.tags
      })),
    };
    res.json(storeData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulate — run a single query against the full store (uses Groq)
app.post('/api/simulate', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query field is required' });
    }
    const products = await loadSessionProducts(req.storeSession.domain, req.storeSession.access_token);
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
app.post('/api/rerun', requireAuth, async (req, res) => {
  try {
    const products = await loadSessionProducts(req.storeSession.domain, req.storeSession.access_token);
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

// POST /api/connect-store — legacy route removed in favor of /api/auth/connect

// POST /api/live-audit — fetch live products and run full 7-query AI audit
app.post('/api/live-audit', requireAuth, async (req, res) => {
  try {
    const cleanedDomain = req.storeSession.domain;
    const products = await fetchShopifyProducts(cleanedDomain, req.storeSession.access_token);

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
app.post('/api/live-simulate', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const cleanedDomain = req.storeSession.domain;
    const products = await fetchShopifyProducts(cleanedDomain, req.storeSession.access_token);

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
// SHOPIFY WRITE HELPER (rate-limit aware)
// ──────────────────────────────────────────────
async function shopifyRequest(method, url, accessToken, data) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await axios({
        method,
        url,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        data
      });
      return resp;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        const retryAfter = parseFloat(err.response.headers['retry-after'] || '2');
        console.log(`  ⏳ Shopify 429 — retrying after ${retryAfter}s`);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
}

// ──────────────────────────────────────────────
// PUT /api/products/apply-optimization
// ──────────────────────────────────────────────
app.put('/api/products/apply-optimization', requireAuth, async (req, res) => {
  try {
    const { product_id, updates } = req.body;

    if (!product_id || !updates) {
      return res.status(400).json({ error: 'product_id and updates are required' });
    }

    const access_token = req.storeSession.access_token;
    const cleanDomain = req.storeSession.domain;

    // Fetch current product to get old score + title + old values for revert
    let currentProduct;
    try {
      const fetchResp = await shopifyRequest(
        'get',
        `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
        access_token
      );
      currentProduct = fetchResp.data.product;
    } catch (err) {
      const status = err.response?.status || 500;
      const msg = err.response?.data?.errors || err.message;
      return res.status(status).json({ error: `Failed to fetch product: ${JSON.stringify(msg)}` });
    }

    const productTitle = currentProduct.title || 'Unknown';
    const oldScore = scoreProduct(currentProduct).score;

    // Track what fields we're changing and save old values for revert
    const appliedFields = [];
    const oldValues = {};
    const productPayload = { id: parseInt(product_id) };

    if (updates.description !== undefined) {
      appliedFields.push('description');
      oldValues.description = currentProduct.body_html || '';
      productPayload.body_html = updates.description;
    }

    if (updates.tags !== undefined) {
      appliedFields.push('tags');
      oldValues.tags = currentProduct.tags || '';
      productPayload.tags = updates.tags;
    }

    if (updates.title !== undefined) {
      appliedFields.push('title');
      oldValues.title = currentProduct.title || '';
      productPayload.title = updates.title;
    }

    // PUT product update to Shopify
    if (appliedFields.length > 0) {
      try {
        await shopifyRequest(
          'put',
          `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
          access_token,
          { product: productPayload }
        );
      } catch (err) {
        const msg = err.response?.data?.errors || err.message;
        return res.status(err.response?.status || 502).json({
          error: `Shopify API error: ${JSON.stringify(msg)}`
        });
      }
    }

    // POST metafields if included
    if (updates.metafields && updates.metafields.length > 0) {
      for (const mf of updates.metafields) {
        try {
          await shopifyRequest(
            'post',
            `https://${cleanDomain}/admin/api/2024-01/products/${product_id}/metafields.json`,
            access_token,
            {
              metafield: {
                namespace: mf.namespace,
                key: mf.key,
                value: mf.value,
                type: mf.type
              }
            }
          );
          appliedFields.push(`metafield:${mf.key}`);
        } catch (err) {
          const msg = err.response?.data?.errors || err.message;
          return res.status(err.response?.status || 502).json({
            error: `Shopify metafield error (${mf.key}): ${JSON.stringify(msg)}`
          });
        }
      }
    }

    // Re-fetch product to re-score after changes
    let updatedProduct;
    try {
      const refetch = await shopifyRequest(
        'get',
        `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
        access_token
      );
      updatedProduct = refetch.data.product;
    } catch (err) {
      updatedProduct = currentProduct;
    }

    const newScore = scoreProduct(updatedProduct).score;
    const scoreDelta = newScore - oldScore;

    // Save optimization history
    db.prepare(`
      INSERT INTO optimization_history (product_id, product_title, store_domain, applied_at, fields_changed, old_values, score_before, score_after, score_delta, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product_id, productTitle, cleanDomain,
      new Date().toISOString(),
      JSON.stringify(appliedFields),
      JSON.stringify(oldValues),
      oldScore, newScore, scoreDelta,
      'applied'
    );

    // Save new score snapshot
    const updatedResult = scoreProduct(updatedProduct);
    db.prepare(`
      INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(product_id, productTitle, newScore, updatedResult.issues_count, today(), cleanDomain, updatedResult.category || 'general');

    return res.json({
      success: true,
      product_id,
      new_score: newScore,
      new_citation: scoreToAICitationProbability(newScore, false),
      score_delta: scoreDelta,
      applied_fields: appliedFields
    });
  } catch (err) {
    console.error('PUT /api/products/apply-optimization error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/products/optimization-history
// ──────────────────────────────────────────────
app.get('/api/products/optimization-history', requireAuth, (req, res) => {
  const { product_id } = req.query;
  const store = req.storeSession.domain;

  try {
    let rows;
    if (product_id) {
      rows = db.prepare(`
        SELECT * FROM optimization_history
        WHERE store_domain = ? AND product_id = ?
        ORDER BY applied_at DESC
      `).all(store, product_id);
    } else {
      rows = db.prepare(`
        SELECT * FROM optimization_history
        WHERE store_domain = ?
        ORDER BY applied_at DESC
      `).all(store);
    }
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/products/optimization-history error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/products/revert
// ──────────────────────────────────────────────
app.post('/api/products/revert', requireAuth, async (req, res) => {
  try {
    const { product_id, history_id } = req.body;

    if (!product_id || !history_id) {
      return res.status(400).json({ error: 'product_id and history_id are required' });
    }

    const access_token = req.storeSession.access_token;
    const cleanDomain = req.storeSession.domain;

    // Fetch the history row
    const historyRow = db.prepare(`SELECT * FROM optimization_history WHERE id = ?`).get(history_id);
    if (!historyRow) {
      return res.status(404).json({ error: `History entry ${history_id} not found` });
    }

    // Parse old values
    let oldValues;
    try {
      oldValues = JSON.parse(historyRow.old_values || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Could not parse original values from history' });
    }

    // Fetch current product for score comparison
    let currentProduct;
    try {
      const fetchResp = await shopifyRequest(
        'get',
        `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
        access_token
      );
      currentProduct = fetchResp.data.product;
    } catch (err) {
      const msg = err.response?.data?.errors || err.message;
      return res.status(err.response?.status || 500).json({ error: `Failed to fetch product: ${JSON.stringify(msg)}` });
    }

    const scoreBefore = scoreProduct(currentProduct).score;

    // Build revert payload from old values
    const revertPayload = { id: parseInt(product_id) };
    const revertedFields = [];

    if (oldValues.description !== undefined) {
      revertPayload.body_html = oldValues.description;
      revertedFields.push('description');
    }
    if (oldValues.tags !== undefined) {
      revertPayload.tags = oldValues.tags;
      revertedFields.push('tags');
    }

    // Write old values back to Shopify
    if (revertedFields.length > 0) {
      try {
        await shopifyRequest(
          'put',
          `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
          access_token,
          { product: revertPayload }
        );
      } catch (err) {
        const msg = err.response?.data?.errors || err.message;
        return res.status(err.response?.status || 502).json({
          error: `Shopify revert error: ${JSON.stringify(msg)}`
        });
      }
    }

    // Mark original history row as reverted
    db.prepare(`UPDATE optimization_history SET status = 'reverted' WHERE id = ?`).run(history_id);

    // Re-fetch and re-score
    let revertedProduct;
    try {
      const refetch = await shopifyRequest(
        'get',
        `https://${cleanDomain}/admin/api/2024-01/products/${product_id}.json`,
        access_token
      );
      revertedProduct = refetch.data.product;
    } catch (err) {
      revertedProduct = currentProduct;
    }

    const scoreAfter = scoreProduct(revertedProduct).score;
    const scoreDelta = scoreAfter - scoreBefore;

    // Log the revert as a new history row
    db.prepare(`
      INSERT INTO optimization_history (product_id, product_title, store_domain, applied_at, fields_changed, old_values, score_before, score_after, score_delta, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product_id, historyRow.product_title, cleanDomain,
      new Date().toISOString(),
      JSON.stringify(revertedFields),
      '{}',
      scoreBefore, scoreAfter, scoreDelta,
      'reverted'
    );

    // Save score snapshot
    const revertResult = scoreProduct(revertedProduct);
    db.prepare(`
      INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(product_id, historyRow.product_title, scoreAfter, revertResult.issues_count, today(), cleanDomain, revertResult.category || 'general');

    return res.json({
      success: true,
      product_id,
      new_score: scoreAfter,
      score_delta: scoreDelta,
      reverted_fields: revertedFields
    });
  } catch (err) {
    console.error('POST /api/products/revert error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// SERVE REACT FRONTEND (CATCH-ALL)
// ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  }
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Visibly backend running on http://localhost:${PORT}`);
  console.log('   GET  /api/health');
  console.log('   GET  /api/audit');
  console.log('   POST /api/simulate');
  console.log('   POST /api/rerun');
  console.log('   POST /api/auth/connect');
  console.log('   GET  /api/auth/session');
  console.log('   POST /api/auth/disconnect');
  console.log('   POST /api/live-audit');
  console.log('   POST /api/live-simulate');
  console.log('   PUT  /api/products/apply-optimization');
  console.log('   GET  /api/products/optimization-history');
  console.log('   POST /api/products/revert\n');
});

// ──────────────────────────────────────────────
// BACKGROUND CRON JOBS
// ──────────────────────────────────────────────



setInterval(async () => {
  if (activeSessions.size === 0) return;

  const currentDate = today();

  for (const [domain, accessToken] of activeSessions.entries()) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();

    try {
      const exists = db.prepare('SELECT 1 FROM score_snapshots WHERE store_domain = ? AND snapshot_date = ? LIMIT 1').get(cleanDomain, currentDate);
      if (exists) continue;

      console.log(`\n[CRON] Daily sync triggered for ${cleanDomain}...`);

      const freshToken = await getAccessToken();
      const { scored } = await fetchAndScoreProducts(domain, freshToken);
      const snapStmt = db.prepare(`INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      db.transaction((snaps) => {
        for (const snap of snaps) snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, currentDate, cleanDomain, snap.category || 'general');
      })(scored);

      try {
        const salesData = await fetchSalesData(domain, freshToken);
        const salesStmt = db.prepare(`INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        db.transaction((items) => {
          for (const item of items) salesStmt.run(item.product_id, item.product_title, item.revenue, item.orders_count, item.period_start, item.period_end, item.store_domain);
        })(salesData);
      } catch (salesErr) {
        // Sales sync requires Shopify protected customer data approval — skipped silently
      }

      console.log(`[CRON] Sync complete for ${cleanDomain}`);
    } catch (err) {
      console.error(`[CRON] Sync failed for ${cleanDomain}:`, err.message);
    }
  }
}, 60 * 60 * 1000); // Check every 60 minutes
