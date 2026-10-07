import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';

// This file is the ONLY place that knows we're using SQLite. Every route
// goes through the repository functions in repository.js, not through this
// connection directly — so swapping to Postgres later (e.g. via `pg` +
// rewriting repository.js's internals) never touches route/controller code.

const dir = path.dirname(config.dbPath);
if (dir && dir !== '.' && !fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      taluk TEXT NOT NULL,
      tier TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      is_real_anchor INTEGER NOT NULL DEFAULT 0,
      real_note TEXT,
      taluk_anchor_delta REAL,
      taluk_anchor_drought_2023 TEXT,
      current_level REAL NOT NULL,
      prev_level REAL NOT NULL,
      yoy_pct REAL NOT NULL,
      five_yr_delta_pct REAL NOT NULL,
      borewell_pct INTEGER NOT NULL,
      recharge_level TEXT NOT NULL,
      recharge_score INTEGER NOT NULL,
      crisis_score INTEGER NOT NULL,
      band_key TEXT NOT NULL,
      accel_pct REAL NOT NULL,
      confidence TEXT NOT NULL,
      conf_score INTEGER NOT NULL,
      last_updated TEXT NOT NULL,
      water_sources_json TEXT NOT NULL,
      drinking_json TEXT NOT NULL,
      prediction_json TEXT NOT NULL,
      drivers_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      documented_facts_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS area_history (
      area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      level REAL NOT NULL,
      rainfall_mm INTEGER NOT NULL,
      rain_index REAL NOT NULL,
      PRIMARY KEY (area_id, year)
    );

    CREATE TABLE IF NOT EXISTS rainfall_years (
      year INTEGER PRIMARY KEY,
      mm INTEGER NOT NULL,
      basis TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      idx INTEGER PRIMARY KEY,
      org TEXT NOT NULL,
      name TEXT NOT NULL,
      date TEXT,
      resolution TEXT,
      unit TEXT,
      frequency TEXT,
      confidence TEXT,
      is_real INTEGER NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      detail TEXT
    );
  `);
}
