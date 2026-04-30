const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');
const { detectIssues } = require('./detect-issues');

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ── STEP 1: Query bank ──
const QUERIES = [
  "best protein bar under ₹500 with free returns",
  "high protein snack with good reviews",
  "vegan protein bar with clear ingredients",
  "protein bar with fast shipping",
  "most trusted protein supplement with strong reviews",
  "protein bar with no artificial ingredients",
  "best value protein bar under ₹600"
];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function loadProducts() {
  const storePath = path.join(__dirname, 'store.json');
  const raw = fs.readFileSync(storePath, 'utf-8');
  const store = JSON.parse(raw);
  return store.products;
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

// ──────────────────────────────────────────────
// CALL GROQ API (duplicated — do not import)
// ──────────────────────────────────────────────
async function callLLM(products, query) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(query, products);

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  let response;
  try {
    response = await axios.post(OPENAI_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
  } catch (apiError) {
    console.error('Groq API call failed.');
    if (apiError.response) {
      console.error('Status:', apiError.response.status);
      console.error('Response body:', JSON.stringify(apiError.response.data, null, 2));
    } else {
      console.error('Error:', apiError.message);
    }
    process.exit(1);
  }

  const rawText = response.data.choices[0].message.content;

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (parseError) {
    console.error('Failed to parse Groq response as JSON.');
    console.error('Raw response text:');
    console.error(rawText);
    process.exit(1);
  }

  return result;
}

// ──────────────────────────────────────────────
// STEP 3 — Compute per-product inclusion stats
// ──────────────────────────────────────────────
function computeStats(allResults, products) {
  const productStats = {};

  // Initialise every product
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
      fix_priority: ''
    };
  });

  // Tally across all results
  allResults.forEach(result => {
    result.selected.forEach(p => {
      if (productStats[p.id]) {
        productStats[p.id].selected_count += 1;
      }
    });
    result.rejected.forEach(p => {
      if (productStats[p.id]) {
        productStats[p.id].rejected_count += 1;
        productStats[p.id].all_rejection_reasons.push(p.reason_rejected);
      }
    });
  });

  // Compute inclusion rate
  const totalQueries = QUERIES.length;
  Object.values(productStats).forEach(stat => {
    stat.inclusion_rate = parseFloat(
      ((stat.selected_count / totalQueries) * 100).toFixed(1)
    );
  });

  return productStats;
}

// ──────────────────────────────────────────────
// STEP 4 — Diagnose products (deterministic checks)
// ──────────────────────────────────────────────
function diagnose(productStats) {
  // Load original product objects for structured data checks
  const products = loadProducts();
  const productLookup = {};
  products.forEach(p => { productLookup[p.id] = p; });

  Object.values(productStats).forEach(stat => {
    const product = productLookup[stat.id];
    stat.issues = product
      ? detectIssues(product).map(i => i.type)
      : [];
  });
}

// ──────────────────────────────────────────────
// STEP 5 — Rank and label priority
// ──────────────────────────────────────────────
function assignPriority(stat) {
  const r = stat.inclusion_rate;
  if (r <= 20) return '🔴 CRITICAL';
  if (r <= 50) return '🟡 NEEDS WORK';
  if (r <= 85) return '🟢 MINOR FIXES';
  return '✅ PERFORMING WELL';
}

function rankProducts(productStats) {
  return Object.values(productStats)
    .sort((a, b) => {
      if (a.inclusion_rate !== b.inclusion_rate) {
        return a.inclusion_rate - b.inclusion_rate; // worst first
      }
      return b.rejected_count - a.rejected_count;   // more rejections first on tie
    })
    .map(stat => {
      stat.fix_priority = assignPriority(stat);
      return stat;
    });
}

// ──────────────────────────────────────────────
// STEP 6 — Print audit report
// ──────────────────────────────────────────────
function printReport(rankedProducts) {
  const now = new Date();
  const totalProducts = rankedProducts.length;
  const avgInclusion = parseFloat(
    (rankedProducts.reduce((sum, p) => sum + p.inclusion_rate, 0) / totalProducts).toFixed(1)
  );
  const performingWell = rankedProducts.filter(p => p.inclusion_rate > 85).length;
  const needingFixes = rankedProducts.filter(p => p.inclusion_rate < 60).length;

  console.log('\n=== MERCHANT AI AUDIT REPORT ===');
  console.log('Store: FitFuel Protein Store (mock)');
  console.log(`Queries run: ${QUERIES.length}`);
  console.log(`Products audited: ${totalProducts}`);
  console.log(`Generated: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  console.log('\n--- OVERALL STORE HEALTH ---');
  console.log(`Average inclusion rate: ${avgInclusion}%`);
  console.log(`Products performing well (>85%): ${performingWell}`);
  console.log(`Products needing fixes (<60%): ${needingFixes}`);

  console.log('\n--- PRIORITY ACTION PLAN (worst first) ---');
  rankedProducts.forEach((p, i) => {
    const sampleReason = p.all_rejection_reasons.length > 0
      ? `"${p.all_rejection_reasons[0]}"`
      : 'N/A (never rejected)';
    const issuesList = p.issues.length > 0 ? p.issues.join(', ') : 'none detected';

    console.log('');
    console.log(`#${i + 1}. ${p.name} (id: ${p.id}) — ₹${p.price}`);
    console.log(`    Inclusion Rate: ${p.inclusion_rate}% (${p.selected_count}/${QUERIES.length} queries)`);
    console.log(`    Priority: ${p.fix_priority}`);
    console.log(`    Issues detected: ${issuesList}`);
    console.log(`    Sample rejection reason: ${sampleReason}`);
  });

  const topPerformers = rankedProducts.filter(p => p.inclusion_rate > 85);
  console.log('\n--- TOP PERFORMERS ---');
  if (topPerformers.length === 0) {
    console.log('  (No products above 85% inclusion rate)');
  } else {
    topPerformers.forEach(p => {
      console.log(`  ✅ ${p.name} — ${p.inclusion_rate}% inclusion rate`);
    });
  }

  console.log('\n================================\n');
}

// ──────────────────────────────────────────────
// STEP 7 — Save audit_report.json
// ──────────────────────────────────────────────
function saveReport(rankedProducts) {
  const report = {
    generated_at: new Date().toISOString(),
    query_bank: QUERIES,
    products: rankedProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      inclusion_rate: p.inclusion_rate,
      selected_count: p.selected_count,
      rejected_count: p.rejected_count,
      fix_priority: p.fix_priority,
      issues: p.issues,
      all_rejection_reasons: p.all_rejection_reasons
    }))
  };

  const outputPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Audit report saved to: ${outputPath}`);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.error('ERROR: OPENAI_API_KEY is not set. Please add your key to the .env file.');
      process.exit(1);
    }

    // ── STEP 1: Load products ──
    console.log('Loading products from store.json...');
    const products = loadProducts();
    console.log(`Loaded ${products.length} products.\n`);

    // ── STEP 2: Run all queries sequentially ──
    console.log(`Running ${QUERIES.length} queries against the store...\n`);
    const allResults = [];

    for (let i = 0; i < QUERIES.length; i++) {
      const query = QUERIES[i];
      const result = await callLLM(products, query);
      allResults.push({
        query,
        selected: result.selected,
        rejected: result.rejected
      });
      console.log(`[${i + 1}/${QUERIES.length}] Completed: "${query}"`);

      // 15s delay between calls to stay under Groq free-tier TPM limit
      if (i < QUERIES.length - 1) {
        await sleep(15000);
      }
    }

    // ── STEP 3: Compute stats ──
    const productStats = computeStats(allResults, products);

    // ── STEP 4: Diagnose underperformers ──
    diagnose(productStats);

    // ── STEP 5: Rank and label ──
    const rankedProducts = rankProducts(productStats);

    // ── STEP 6: Print report ──
    printReport(rankedProducts);

    // ── STEP 7: Save JSON ──
    saveReport(rankedProducts);

  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

main();
