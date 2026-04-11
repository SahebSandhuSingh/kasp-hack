require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEST_QUERY = "best protein bar under ₹500 with free returns";

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
async function callGroq(systemPrompt, userPrompt) {
  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
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

  return response;
}

// ──────────────────────────────────────────────
// PRINT RESULTS
// ──────────────────────────────────────────────
function printResults(query, result) {
  console.log('\n=== AI SIMULATION RESULT ===');
  console.log(`Query: ${query}`);
  console.log('');

  console.log('✅ SELECTED PRODUCTS:');
  result.selected.forEach((product, i) => {
    console.log(`${i + 1}. ${product.name} (id: ${product.id})`);
    console.log(`   Reason: ${product.reason_chosen}`);
    console.log('');
  });

  console.log('❌ REJECTED PRODUCTS:');
  result.rejected.forEach((product, i) => {
    console.log(`${i + 1}. ${product.name} (id: ${product.id})`);
    console.log(`   Reason: ${product.reason_rejected}`);
    console.log('');
  });

  console.log('============================\n');
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_api_key_here') {
      console.error('ERROR: GROQ_API_KEY is not set. Please add your key to the .env file.');
      process.exit(1);
    }

    console.log('Loading products from store.json...');
    const products = loadProducts();
    console.log(`Loaded ${products.length} products.`);

    console.log(`\nRunning simulation for query: "${TEST_QUERY}"`);
    console.log('Calling Groq API...\n');

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(TEST_QUERY, products);

    let response;
    try {
      response = await callGroq(systemPrompt, userPrompt);
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

    // Extract the text content from Groq response
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

    printResults(TEST_QUERY, result);

  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

main();
