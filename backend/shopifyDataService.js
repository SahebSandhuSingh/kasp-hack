const axios = require('axios');

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text) {
  if (!text) return 0;
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}

function containsKeyword(text, kw) {
  return stripHtml(text || '').toLowerCase().includes(kw.toLowerCase());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────
function scoreProduct(product) {
  let score = 0;
  const issues = [];

  const desc = product.body_html || '';
  const wc = wordCount(desc);

  // Description > 50 words (+20)
  if (wc >= 50) score += 20;
  else issues.push('Description too short (<50 words)');

  // Return policy (+15)
  if (containsKeyword(desc, 'return')) score += 15;
  else issues.push('Missing return policy');

  // Shipping info (+15)
  if (containsKeyword(desc, 'shipping') || containsKeyword(desc, 'delivery')) score += 15;
  else issues.push('Missing shipping info');

  // Tags > 3 (+15)
  const tags = product.tags ? product.tags.split(',').filter(Boolean) : [];
  if (tags.length > 3) score += 15;
  else issues.push('Fewer than 3 product tags');

  // Ingredients/specs (+15)
  if (
    containsKeyword(desc, 'ingredient') ||
    containsKeyword(desc, 'specification') ||
    containsKeyword(desc, 'material') ||
    containsKeyword(desc, 'composition')
  ) score += 15;
  else issues.push('No ingredients or specs');

  // More than 1 image (+10)
  if (product.images && product.images.length > 1) score += 10;
  else issues.push('Only one product image');

  // Compare-at price (+10)
  const hasCompareAt = product.variants?.some(v => v.compare_at_price);
  if (hasCompareAt) score += 10;
  else issues.push('No compare-at price set');

  return { score: Math.min(score, 100), issues, issues_count: issues.length };
}

// ─────────────────────────────────────────
// FUNCTION 1 — Fetch + Score Products
// ─────────────────────────────────────────
async function fetchAndScoreProducts(storeDomain, accessToken) {
  const clean = storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();

  const resp = await axios.get(
    `https://${clean}/admin/api/2024-01/products.json?limit=250`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  );

  const rawProducts = resp.data.products || [];

  const scored = rawProducts.map(p => {
    const { score, issues, issues_count } = scoreProduct(p);
    return {
      product_id:    p.id.toString(),
      product_title: p.title,
      score,
      issues,
      issues_count,
      store_domain:  clean,
      price:         p.variants?.[0]?.price || '0',
      image:         p.images?.[0]?.src || null,
      tags:          p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
  });

  return { scored, domain: clean };
}

// ─────────────────────────────────────────
// FUNCTION 2 — Fetch Sales Data (last 30 days)
// ─────────────────────────────────────────
async function fetchSalesData(storeDomain, accessToken) {
  const clean = storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
  const since = daysAgo(30);

  let allOrders = [];
  let url = `https://${clean}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since}T00:00:00Z`;

  // Handle pagination
  while (url) {
    const resp = await axios.get(url, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    allOrders = allOrders.concat(resp.data.orders || []);

    // Shopify pagination via Link header
    const link = resp.headers['link'] || '';
    const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }

  // Group by product_id
  const productMap = {};
  for (const order of allOrders) {
    for (const item of order.line_items || []) {
      const pid = item.product_id?.toString();
      if (!pid) continue;
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id:    pid,
          product_title: item.title,
          revenue:       0,
          orders_count:  0,
          store_domain:  clean,
          period_start:  since,
          period_end:    today(),
        };
      }
      productMap[pid].revenue      += parseFloat(item.price) * item.quantity;
      productMap[pid].orders_count += 1;
    }
  }

  return Object.values(productMap);
}

// ─────────────────────────────────────────
// AI TRAFFIC TIER
// ─────────────────────────────────────────
function getTrafficTier(score) {
  if (score >= 70) return 'High Visibility';
  if (score >= 40) return 'Moderate Visibility';
  return 'Low Visibility / At Risk';
}

module.exports = { fetchAndScoreProducts, fetchSalesData, scoreProduct, getTrafficTier, today, daysAgo };
