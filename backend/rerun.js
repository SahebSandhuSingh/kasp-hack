const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');
const improvedProduct = require('./improve.js');

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const QUERY = "best protein bar under ₹500 with free returns";
const TARGET_ID = "p7";

// ──────────────────────────────────────────────
// LOAD PRODUCTS
// ──────────────────────────────────────────────
function loadProducts() {
  const storePath = path.join(__dirname, 'store.json');
  const raw = fs.readFileSync(storePath, 'utf-8');
  const store = JSON.parse(raw);
  return store.products;
}

// ──────────────────────────────────────────────
// FORMAT PRODUCT BLOCK FOR PROMPT
// ──────────────────────────────────────────────
function formatProductBlock(product, index) {
  return `
Product ${index + 1}:
  ID: ${product.id}
  Name: ${product.name}
  Price: ₹${product.price}
  Description: ${product.description}
  Return Policy: ${product.return_policy !== null ? product.return_policy : 'NOT PROVIDED'}
  Shipping: ${product.shipping !== null ? product.shipping : 'NOT PROVIDED'}
  Rating: ${product.rating}/5
  Review Count: ${product.review_count}
  Reviews: ${product.reviews.length > 0 ? product.reviews.map(r => `"${r}"`).join(', ') : 'NO REVIEWS'}
  Tags: ${product.tags.join(', ')}
  Ingredients: ${product.ingredients !== null ? product.ingredients : 'NOT PROVIDED'}
  Is Vegan: ${product.is_vegan !== null ? product.is_vegan : 'NOT SPECIFIED'}
`.trim();
}

// ──────────────────────────────────────────────
// BUILD PROMPTS
// ──────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are a strict AI shopping agent evaluating products for a user query. Your job is to recommend the best products based ONLY on the data provided. You must be harsh and specific in your evaluations. If a product is missing data (no return policy, vague description, no reviews, unclear shipping), that is a signal of low quality and you must penalize it. You are NOT allowed to assume any information that is not explicitly present in the product data. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;
}

function buildUserPrompt(query, products) {
  const productBlocks = products
    .map((p, i) => formatProductBlock(p, i))
    .join('\n\n');

  return `User query: ${query}

Here are the products available in this store:

${productBlocks}

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
- If reviews array is empty or review_count is low, flag it as weak trust signal
- If description is vague or promotional without substance, flag it explicitly`;
}

// ──────────────────────────────────────────────
// CALL GROQ API
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
// FIND PRODUCT IN RESULT
// ──────────────────────────────────────────────
function findProductInResult(result, id) {
  const selected = result.selected.find(p => p.id === id);
  if (selected) return { status: 'selected', data: selected };

  const rejected = result.rejected.find(p => p.id === id);
  if (rejected) return { status: 'rejected', data: rejected };

  return null;
}

// ──────────────────────────────────────────────
// PRINT DELTA
// ──────────────────────────────────────────────
function printDelta(beforeResult, afterResult, originalProducts) {
  const originalP7 = originalProducts.find(p => p.id === TARGET_ID);

  const before = findProductInResult(beforeResult, TARGET_ID);
  const after = findProductInResult(afterResult, TARGET_ID);

  console.log('\n=== COUNTERFACTUAL ANALYSIS ===');
  console.log(`Product: ${improvedProduct.name} (${TARGET_ID})`);
  console.log(`Query: ${QUERY}`);

  // ── BEFORE ──
  console.log('\n--- BEFORE (original data) ---');
  if (!before) {
    console.warn(`⚠️  WARNING: ${TARGET_ID} not found in beforeResult (selected or rejected).`);
  } else {
    console.log('Status: ❌ REJECTED');
    console.log(`Reason: ${before.data.reason_rejected}`);
  }

  // ── AFTER ──
  console.log('\n--- AFTER (improved data) ---');
  if (!after) {
    console.warn(`⚠️  WARNING: ${TARGET_ID} not found in afterResult (selected or rejected).`);
  } else if (after.status === 'selected') {
    console.log('Status: ✅ SELECTED');
    console.log(`Reason: ${after.data.reason_chosen}`);
  } else {
    console.log('Status: ❌ STILL REJECTED');
    console.log(`Reason: ${after.data.reason_rejected}`);
  }

  // ── WHAT CHANGED ──
  console.log('\n--- WHAT CHANGED ---');
  console.log('Fields improved:');
  console.log('  • description: vague promotional text → detailed 4-sentence product description');
  console.log(`  • return_policy: null → free 30-day no-questions-asked returns`);
  console.log(`  • shipping: null → free delivery, 3-5 business days`);
  console.log(`  • rating: ${originalP7 ? originalP7.rating : 'N/A'} → ${improvedProduct.rating}`);
  console.log(`  • review_count: ${originalP7 ? originalP7.review_count : 'N/A'} → ${improvedProduct.review_count} reviews with text`);
  console.log(`  • reviews: empty array → ${improvedProduct.reviews.length} detailed customer reviews`);
  console.log(`  • ingredients: null → full ingredient list provided`);
  console.log(`  • price: ${originalP7 ? '₹' + originalP7.price : 'N/A'} → ₹${improvedProduct.price}`);

  // ── VERDICT ──
  console.log('\n--- VERDICT ---');
  if (after && after.status === 'selected') {
    console.log('✅ IMPROVEMENT CONFIRMED: Fixing missing data fields moved this product from REJECTED to SELECTED.');
    console.log('   This proves that data quality directly impacts AI recommendation visibility.');
  } else {
    console.log('⚠️  Product is still rejected. The simulation reasoning above shows what still needs fixing.');
  }

  console.log('\n===============================\n');
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

    // ── STEP 1: Load original products ──
    console.log('Loading original products from store.json...');
    const originalProducts = loadProducts();
    console.log(`Loaded ${originalProducts.length} products.`);

    // ── STEP 2: Run simulation with original data ──
    console.log('\n[1/2] Running simulation with ORIGINAL data...');
    const beforeResult = await callLLM(originalProducts, QUERY);
    console.log('      Done.');

    // ── STEP 3: Inject improved product ──
    console.log('\nInjecting improved product p7...');
    const updatedProducts = originalProducts.map(p =>
      p.id === TARGET_ID ? improvedProduct : p
    );
    console.log(`      Replaced p7 with improved version. Array length: ${updatedProducts.length}`);

    // ── STEP 4: Run simulation with improved data ──
    console.log('\n[2/2] Running simulation with IMPROVED data...');
    const afterResult = await callLLM(updatedProducts, QUERY);
    console.log('      Done.');

    // ── STEP 5: Print delta ──
    printDelta(beforeResult, afterResult, originalProducts);

  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

main();
