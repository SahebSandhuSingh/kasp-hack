const axios = require('axios');
require('dotenv').config();

// ──────────────────────────────────────────────
// HTML HELPERS
// ──────────────────────────────────────────────

// Strip all HTML tags from a string, return plain text
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Check if text contains a keyword (case insensitive)
function containsKeyword(text, keyword) {
  if (!text) return false;
  return stripHtml(text).toLowerCase().includes(keyword.toLowerCase());
}

// Extract the first sentence containing a keyword
function extractSentence(text, keyword) {
  if (!text) return null;
  const plain = stripHtml(text);
  const sentences = plain.split(/[.!?]+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(keyword.toLowerCase())
  );
  return match ? match.trim() : null;
}

// ──────────────────────────────────────────────
// MAIN — fetchShopifyProducts
// ──────────────────────────────────────────────

/**
 * Fetches and maps products from a Shopify store.
 * @param {string} domain   - Shopify store domain (any format accepted)
 * @param {string} accessToken - Shopify Admin API access token
 * @returns {Promise<Array>} Mapped product array in internal format
 */
async function fetchShopifyProducts(domain, accessToken) {
  // 1. Validate inputs
  if (!domain || !accessToken) {
    throw new Error("domain and accessToken are required");
  }

  // 2. Clean the domain — strip protocol and trailing slashes
  const cleanedDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();

  // 3. Call Shopify Admin API
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

  // 4. Guard — empty store
  if (products.length === 0) {
    throw new Error("No products found in this store.");
  }

  // 5. Map to internal format
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

module.exports = { fetchShopifyProducts };
