const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'optimizer.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ─────────────────────────────────────────
// CREATE TABLES
// ─────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS score_snapshots (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id     TEXT    NOT NULL,
    product_title  TEXT    NOT NULL,
    score          INTEGER NOT NULL,
    issues_count   INTEGER NOT NULL DEFAULT 0,
    snapshot_date  TEXT    NOT NULL,
    store_domain   TEXT    NOT NULL,
    category       TEXT    NOT NULL DEFAULT 'general'
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_store_date
    ON score_snapshots (store_domain, snapshot_date);

  CREATE INDEX IF NOT EXISTS idx_snapshots_product
    ON score_snapshots (store_domain, product_id, snapshot_date);

  CREATE TABLE IF NOT EXISTS product_sales (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id     TEXT    NOT NULL,
    product_title  TEXT    NOT NULL,
    revenue        REAL    NOT NULL DEFAULT 0,
    orders_count   INTEGER NOT NULL DEFAULT 0,
    period_start   TEXT    NOT NULL,
    period_end     TEXT    NOT NULL,
    store_domain   TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sales_store
    ON product_sales (store_domain, product_id);

  CREATE TABLE IF NOT EXISTS optimization_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      TEXT    NOT NULL,
    product_title   TEXT    NOT NULL,
    store_domain    TEXT    NOT NULL,
    applied_at      TEXT    NOT NULL,
    fields_changed  TEXT    NOT NULL,
    old_values      TEXT,
    score_before    INTEGER NOT NULL DEFAULT 0,
    score_after     INTEGER NOT NULL DEFAULT 0,
    score_delta     INTEGER NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'applied'
  );

  CREATE INDEX IF NOT EXISTS idx_opthistory_store
    ON optimization_history (store_domain, applied_at DESC);

  CREATE INDEX IF NOT EXISTS idx_opthistory_product
    ON optimization_history (store_domain, product_id);
`);

// Migration: add category column if it doesn't exist (for existing DBs)
try {
  db.exec(`ALTER TABLE score_snapshots ADD COLUMN category TEXT NOT NULL DEFAULT 'general'`);
} catch (e) {
  // Column already exists — ignore
}

module.exports = db;
