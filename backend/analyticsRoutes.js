const express = require('express');
const db = require('./db');
const { fetchAndScoreProducts, fetchSalesData, today, getTrafficTier } = require('./shopifyDataService');

const router = express.Router();

// ─────────────────────────────────────────
// SAVE SNAPSHOTS
// ─────────────────────────────────────────
router.post('/snapshots/save', (req, res) => {
  const snapshots = req.body; // Array of scored products
  const date = today();

  const stmt = db.prepare(`
    INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((snaps) => {
    for (const snap of snaps) {
      stmt.run(
        snap.product_id,
        snap.product_title,
        snap.score,
        snap.issues_count || 0,
        date,
        snap.store_domain
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
router.get('/snapshots/history', (req, res) => {
  const { store, product_id } = req.query;
  if (!store) return res.status(400).json({ error: 'Store is required' });

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
router.get('/products/traffic-report', (req, res) => {
  const { store } = req.query;
  if (!store) return res.status(400).json({ error: 'Store is required' });

  try {
    // Get latest snapshot for each product
    const snapshots = db.prepare(`
      SELECT s1.product_id, s1.product_title, s1.score as latest_score, s1.issues_count
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
router.post('/sales/sync', (req, res) => {
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
router.post('/refresh', async (req, res) => {
  const { domain, accessToken } = req.body;
  if (!domain || !accessToken) return res.status(400).json({ error: "domain and accessToken required" });

  try {
    // 1. Fetch & Score Products
    const { scored, domain: cleanDomain } = await fetchAndScoreProducts(domain, accessToken);
    
    // Save to DB
    const date = today();
    const snapStmt = db.prepare(`
      INSERT INTO score_snapshots (product_id, product_title, score, issues_count, snapshot_date, store_domain)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSnaps = db.transaction((snaps) => {
      for (const snap of snaps) {
        snapStmt.run(snap.product_id, snap.product_title, snap.score, snap.issues_count || 0, date, cleanDomain);
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

module.exports = router;
