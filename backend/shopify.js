const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ──────────────────────────────────────────────
// OLD HELPERS & fetchShopifyProducts (kept to not break /api/connect-store)
// ──────────────────────────────────────────────

// Strip all HTML tags, decode entities, collapse whitespace, and return plain text
function stripHtml(html) {
  if (!html) return "";
  
  // 1. Remove all HTML tags
  let text = String(html).replace(/<[^>]*>/g, " ");
  
  // 2. Decode HTML entities
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  text = text.replace(/&[#a-z0-9]+;/ig, (match) => {
    return entities[match.toLowerCase()] || ' ';
  });
  
  // 3. Collapse multiple whitespace/newlines into single spaces
  return text.replace(/\s+/g, " ").trim();
}

// Get accurate word count after stripping HTML
function getWordCount(text) {
  if (!text) return 0;
  const cleanText = stripHtml(text);
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).filter(Boolean).length;
}

function containsKeyword(text, keyword) {
  if (!text) return false;
  return stripHtml(text).toLowerCase().includes(keyword.toLowerCase());
}

function extractSentence(text, keyword) {
  if (!text) return null;
  const plain = stripHtml(text);
  const sentences = plain.split(/[.!?]+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(keyword.toLowerCase())
  );
  return match ? match.trim() : null;
}

async function fetchShopifyProducts(domain, accessToken) {
  if (!domain || !accessToken) {
    throw new Error("domain and accessToken are required");
  }

  const cleanedDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();

  let response;
  try {
    response = await axios.get(
      `https://${cleanedDomain}/admin/api/2024-01/products.json?limit=250`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 401) {
        throw new Error("Invalid access token. Please check your Shopify Admin API credentials.");
      }
      if (status === 404) {
        throw new Error("Store not found. Please check your store domain.");
      }
      throw new Error(`Shopify API error ${status}: ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`Network error reaching Shopify: ${err.message}`);
  }

  const products = response.data.products || [];

  if (products.length === 0) {
    throw new Error("No products found in this store.");
  }

  return products.map(product => ({
    id: product.id.toString(),
    name: product.title,
    price: parseFloat(product.variants?.[0]?.price || 0),
    description: stripHtml(product.body_html || ""),
    return_policy: containsKeyword(product.body_html, "return")
      ? extractSentence(product.body_html, "return")
      : null,
    shipping: (
      containsKeyword(product.body_html, "shipping") ||
      containsKeyword(product.body_html, "delivery")
    )
      ? (extractSentence(product.body_html, "shipping") ||
         extractSentence(product.body_html, "delivery"))
      : null,
    rating: null,
    review_count: 0,
    reviews: [],
    tags: product.tags
      ? product.tags.split(",").map(t => t.trim()).filter(Boolean)
      : [],
    ingredients: containsKeyword(product.body_html, "ingredient")
      ? extractSentence(product.body_html, "ingredient")
      : null,
    is_vegan: product.tags
      ? product.tags.toLowerCase().includes("vegan")
      : null,
    product_type: product.product_type || null,
    vendor: product.vendor || null,
    shopify_url: `https://${cleanedDomain}/products/${product.handle}`
  }));
}

// ──────────────────────────────────────────────
// NEW LIVE STORE FETCHING LOGIC (WITH AUTO-TOKEN MANAGER)
// ──────────────────────────────────────────────

const tokenCache = {
  token: null,
  expiresAt: null
};

async function getAccessToken() {
  const store = process.env.SHOPIFY_STORE;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!store || !clientId || !clientSecret) {
    throw new Error('Store credentials (STORE, CLIENT_ID, CLIENT_SECRET) missing in .env');
  }

  const now = Date.now();
  // Check if token exists and expiresAt is more than 5 minutes (300,000 ms) from now
  if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > now + 300000) {
    return tokenCache.token;
  }

  try {
    const response = await axios.post(
      `https://${store}/admin/oauth/access_token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data;
    tokenCache.token = data.access_token;
    // expiresAt = now + (expires_in - 300) seconds
    tokenCache.expiresAt = now + ((data.expires_in - 300) * 1000);

    return tokenCache.token;
  } catch (err) {
    throw new Error('Failed to refresh Shopify access token: ' + (err.response?.data?.error || err.message));
  }
}

async function fetchProducts() {
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  // Use static Admin API token (shpat_ / shpua_) — no OAuth exchange needed for private apps
  const token = await getAccessToken();

  if (!SHOPIFY_STORE) {
    throw new Error('SHOPIFY_STORE must be set in .env');
  }

  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': token
        }
      }
    );
    return response.data.products || [];
  } catch (err) {
    if (err.response) {
      if (err.response.status === 401) {
        throw new Error('Invalid or expired access token — check SHOPIFY_ACCESS_TOKEN in .env');
      }
      if (err.response.status === 404) {
        throw new Error('Store not found — check SHOPIFY_STORE in .env');
      }
    }
    throw new Error(`Shopify API Error: ${err.message}`);
  }
}

function normalizeProduct(product) {
  const raw_html = product.body_html || '';
  // simple regex to strip HTML as requested
  const description = raw_html.replace(/<[^>]*>?/gm, '').trim();
  
  return {
    id: product.id.toString(),
    title: product.title,
    description: description,
    category: product.product_type || 'Uncategorized',
    price: product.variants && product.variants.length > 0 ? product.variants[0].price : '0.00',
    image: product.images && product.images.length > 0 ? product.images[0].src : null,
    raw_html: raw_html
  };
}

async function getStoreData() {
  const rawProducts = await fetchProducts();
  const { scoreProduct: catScore } = require('./categoryEngine');

  const normalizedProducts = rawProducts.map(p => {
    const norm = normalizeProduct(p);
    const result = catScore(p);
    return {
      ...norm,
      score: result.score,
      issues: result.issues,
      issues_count: result.issues_count,
      category: result.category,
      category_confidence: result.category_confidence,
      matched_signals: result.matched_signals,
      criteria_results: result.criteria_results,
      status: result.score >= 70 ? 'optimized' : result.score >= 40 ? 'needs-work' : 'critical',
    };
  });
  
  const categories = [...new Set(normalizedProducts.map(p => p.category).filter(c => c))];
  
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  
  normalizedProducts.forEach(p => {
    const priceVal = parseFloat(p.price);
    if (!isNaN(priceVal)) {
      if (priceVal < minPrice) minPrice = priceVal;
      if (priceVal > maxPrice) maxPrice = priceVal;
    }
  });
  
  if (minPrice === Infinity) minPrice = 0;
  if (maxPrice === -Infinity) maxPrice = 0;

  const sample_products = normalizedProducts.slice(0, 3).map(p => ({
    title: p.title,
    description: p.description
  }));

  return {
    store_name: process.env.SHOPIFY_STORE,
    product_count: normalizedProducts.length,
    products: normalizedProducts,
    categories,
    price_range: { min: minPrice, max: maxPrice },
    sample_products
  };
}

module.exports = { 
  fetchShopifyProducts, 
  stripHtml, 
  getWordCount,
  fetchProducts,
  normalizeProduct,
  getStoreData,
  getAccessToken 
};
