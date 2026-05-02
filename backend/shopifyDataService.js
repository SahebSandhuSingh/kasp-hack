const axios = require('axios');
const { scoreProduct: categoryScoreProduct } = require('./categoryEngine');

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────
// SCORING ENGINE (delegates to categoryEngine)
// ─────────────────────────────────────────
function scoreProduct(product) {
  return categoryScoreProduct(product);
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
    const result = scoreProduct(p);
    return {
      product_id: p.id.toString(),
      product_title: p.title,
      score: result.score,
      issues: result.issues,
      issues_count: result.issues_count,
      category: result.category,
      category_confidence: result.category_confidence,
      matched_signals: result.matched_signals,
      criteria_results: result.criteria_results,
      store_domain: clean,
      description: p.body_html ? String(p.body_html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '',
      raw_html: p.body_html || '',
      product_type: p.product_type || '',
      price: p.variants?.[0]?.price || '0',
      image: p.images?.[0]?.src || null,
      tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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
          product_id: pid,
          product_title: item.title,
          revenue: 0,
          orders_count: 0,
          store_domain: clean,
          period_start: since,
          period_end: today(),
        };
      }
      productMap[pid].revenue += parseFloat(item.price) * item.quantity;
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
