const express = require('express');
const db = require('./db');
const { fetchAndScoreProducts, fetchSalesData, today, getTrafficTier } = require('./shopifyDataService');
const { getRubric, CATEGORY_LABELS, CATEGORY_COLORS, RUBRICS } = require('./categoryEngine');

module.exports = function createAnalyticsRoutes(requireAuth) {
const router = express.Router();

// ─────────────────────────────────────────
// SAVE SNAPSHOTS
// ─────────────────────────────────────────
router.post('/snapshots/save', requireAuth, (req, res) => {
  const snapshots = req.body; // Array of scored products
  const date = today();

  const stmt = db.prepare(`
    INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((snaps) => {
    for (const snap of snaps) {
      stmt.run(
        snap.product_id,
        snap.product_title,
        snap.score,
        snap.issues_count || 0,
        date,
        snap.store_domain,
        snap.category || 'general'
      );
    }
  });

  try {
    insertMany(snapshots);
    res.json({ success: true, count: snapshots.length });
  } catch (err) {
    console.error('Error saving snapshots:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET SNAPSHOT HISTORY
// ─────────────────────────────────────────
router.get('/snapshots/history', requireAuth, (req, res) => {
  const { product_id } = req.query;
  const store = req.storeSession.domain;

  try {
    if (product_id) {
      // By Product
      const rows = db.prepare(`
        SELECT snapshot_date as date, score
        FROM score_snapshots
        WHERE store_domain = ? AND product_id = ?
        ORDER BY snapshot_date ASC
      `).all(store, product_id);
      res.json(rows);
    } else {
      // Store Average
      const rows = db.prepare(`
        SELECT snapshot_date as date, CAST(AVG(score) AS INTEGER) as avgScore
        FROM score_snapshots
        WHERE store_domain = ?
        GROUP BY snapshot_date
        ORDER BY snapshot_date ASC
        LIMIT 30
      `).all(store);
      res.json(rows);
    }
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET TRAFFIC REPORT
// ─────────────────────────────────────────
router.get('/products/traffic-report', requireAuth, (req, res) => {
  const store = req.storeSession.domain;

  try {
    // Get latest snapshot for each product
    const snapshots = db.prepare(`
      SELECT s1.product_id, s1.product_title, s1.score as latest_score, s1.issues_count, s1.category
      FROM score_snapshots s1
      INNER JOIN (
        SELECT product_id, MAX(snapshot_date) as max_date
        FROM score_snapshots
        WHERE store_domain = ?
        GROUP BY product_id
      ) s2 ON s1.product_id = s2.product_id AND s1.snapshot_date = s2.max_date
      WHERE s1.store_domain = ?
    `).all(store, store);

    // Get latest sales for each product (aggregate)
    const sales = db.prepare(`
      SELECT product_id, SUM(revenue) as total_revenue, SUM(orders_count) as total_orders
      FROM product_sales
      WHERE store_domain = ?
      GROUP BY product_id
    `).all(store);

    const salesMap = {};
    for (const s of sales) {
      salesMap[s.product_id] = s;
    }

    const report = snapshots.map(snap => {
      const sale = salesMap[snap.product_id] || { total_revenue: 0, total_orders: 0 };
      return {
        product_id: snap.product_id,
        product_title: snap.product_title,
        latest_score: snap.latest_score,
        issues_count: snap.issues_count,
        category: snap.category || 'general',
        revenue: sale.total_revenue,
        orders_count: sale.total_orders,
        ai_traffic_tier: getTrafficTier(snap.latest_score)
      };
    });

    res.json(report);
  } catch (err) {
    console.error('Error fetching traffic report:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// SYNC SALES DATA
// ─────────────────────────────────────────
router.post('/sales/sync', requireAuth, (req, res) => {
  const sales = req.body;

  const stmt = db.prepare(`
    INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(
        item.product_id,
        item.product_title,
        item.revenue,
        item.orders_count,
        item.period_start,
        item.period_end,
        item.store_domain
      );
    }
  });

  try {
    insertMany(sales);
    res.json({ success: true, count: sales.length });
  } catch (err) {
    console.error('Error syncing sales:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// MANUAL REFRESH ALL
// ─────────────────────────────────────────
router.post('/refresh', requireAuth, async (req, res) => {
  const domain = req.storeSession.domain;
  const accessToken = req.storeSession.access_token;

  try {
    // 1. Fetch & Score Products
    const { scored, domain: cleanDomain } = await fetchAndScoreProducts(domain, accessToken);
    
    // Save to DB
    const date = today();
    const snapStmt = db.prepare(`
      INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSnaps = db.transaction((snaps) => {
      for (const snap of snaps) {
        snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, date, cleanDomain, snap.category || 'general');
      }
    });
    insertSnaps(scored);

    // 2. Fetch Sales Data
    const salesData = await fetchSalesData(domain, accessToken);
    const salesStmt = db.prepare(`
      INSERT INTO product_sales (product_id, product_title, revenue, orders_count, period_start, period_end, store_domain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSales = db.transaction((items) => {
      for (const item of items) {
        salesStmt.run(item.product_id, item.product_title, item.revenue, item.orders_count, item.period_start, item.period_end, item.store_domain);
      }
    });
    insertSales(salesData);

    res.json({ success: true, message: "Data refreshed successfully" });
  } catch (err) {
    console.error('Error in refresh:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/categories/rubric
// ─────────────────────────────────────────
router.get('/categories/rubric', requireAuth, (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'category query param is required' });

  const rubric = getRubric(category);
  const label = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;

  res.json({
    category,
    label,
    colors,
    criteria: rubric.map(c => ({
      key: c.key,
      label: c.label,
      points: c.points,
      missing_msg: c.missing_msg,
    })),
  });
});

// ─────────────────────────────────────────
// GET /api/categories/summary
// ─────────────────────────────────────────
router.get('/categories/summary', requireAuth, (req, res) => {
  const store = req.storeSession.domain;

  try {
    const rows = db.prepare(`
      SELECT s1.category, s1.score, s1.issues_count
      FROM score_snapshots s1
      INNER JOIN (
        SELECT product_id, MAX(snapshot_date) as max_date
        FROM score_snapshots
        WHERE store_domain = ?
        GROUP BY product_id
      ) s2 ON s1.product_id = s2.product_id AND s1.snapshot_date = s2.max_date
      WHERE s1.store_domain = ?
    `).all(store, store);

    const catMap = {};
    for (const row of rows) {
      const cat = row.category || 'general';
      if (!catMap[cat]) catMap[cat] = { category: cat, product_count: 0, total_score: 0, critical_issues: 0 };
      catMap[cat].product_count += 1;
      catMap[cat].total_score += row.score;
      if (row.score < 40) catMap[cat].critical_issues += 1;
    }

    const categories = Object.values(catMap).map(c => ({
      category: c.category,
      label: CATEGORY_LABELS[c.category] || CATEGORY_LABELS.general,
      colors: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.general,
      product_count: c.product_count,
      avg_score: Math.round(c.total_score / c.product_count),
      critical_issues: c.critical_issues,
    }));

    res.json({ categories });
  } catch (err) {
    console.error('Error fetching category summary:', err);
    res.status(500).json({ error: err.message });
  }
});

return router;
};
