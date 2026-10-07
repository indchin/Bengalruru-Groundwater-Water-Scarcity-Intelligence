import { db } from './connection.js';

// Every route/controller in this app calls only these functions — never
// `db` directly. That's what makes the SQLite -> Postgres swap mentioned in
// connection.js realistic later: rewrite this one file, everything else
// (routes, tests, frontend) is untouched.

function rowToArea(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    zone: row.zone,
    taluk: row.taluk,
    tier: row.tier,
    lat: row.lat,
    lng: row.lng,
    isRealAnchor: !!row.is_real_anchor,
    realNote: row.real_note,
    talukAnchor: row.taluk_anchor_delta == null ? null : {
      delta: row.taluk_anchor_delta,
      drought2023: row.taluk_anchor_drought_2023,
    },
    current: row.current_level,
    prev: row.prev_level,
    yoyPct: row.yoy_pct,
    fiveYrDeltaPct: row.five_yr_delta_pct,
    borewell: row.borewell_pct,
    rechargeLevel: row.recharge_level,
    rechargeScore: row.recharge_score,
    crisisScore: row.crisis_score,
    bandKey: row.band_key,
    accelPct: row.accel_pct,
    confidence: row.confidence,
    confScore: row.conf_score,
    lastUpdated: row.last_updated,
    water_sources: JSON.parse(row.water_sources_json),
    drinking: JSON.parse(row.drinking_json),
    prediction: JSON.parse(row.prediction_json),
    drivers: JSON.parse(row.drivers_json),
    recommendations: JSON.parse(row.recommendations_json),
    documentedFacts: JSON.parse(row.documented_facts_json),
    updatedAt: row.updated_at,
  };
}

export function listAreas() {
  const rows = db.prepare('SELECT * FROM areas ORDER BY name').all();
  return rows.map(rowToArea);
}

export function getArea(id) {
  const row = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
  return rowToArea(row);
}

export function getAreaHistory(id) {
  return db.prepare('SELECT year, level, rainfall_mm, rain_index as rainIdx FROM area_history WHERE area_id = ? ORDER BY year').all(id);
}

export function getAllHistory() {
  const rows = db.prepare('SELECT * FROM area_history ORDER BY area_id, year').all();
  const byArea = {};
  for (const r of rows) {
    (byArea[r.area_id] ??= []).push({ year: r.year, level: r.level, rainfall_mm: r.rainfall_mm, rainIdx: r.rain_index });
  }
  return byArea;
}

export function getRainfallYears() {
  return db.prepare('SELECT year, mm, basis FROM rainfall_years ORDER BY year').all();
}

export function getDataSources() {
  return db.prepare('SELECT * FROM data_sources ORDER BY idx').all().map(r => ({
    org: r.org, name: r.name, date: r.date, res: r.resolution, unit: r.unit,
    freq: r.frequency, conf: r.confidence, real: !!r.is_real, note: r.note,
  }));
}

export function upsertArea(area) {
  db.prepare(`
    INSERT INTO areas (id, name, zone, taluk, tier, lat, lng, is_real_anchor, real_note,
      taluk_anchor_delta, taluk_anchor_drought_2023, current_level, prev_level, yoy_pct,
      five_yr_delta_pct, borewell_pct, recharge_level, recharge_score, crisis_score,
      band_key, accel_pct, confidence, conf_score, last_updated, water_sources_json,
      drinking_json, prediction_json, drivers_json, recommendations_json, documented_facts_json,
      updated_at)
    VALUES (@id, @name, @zone, @taluk, @tier, @lat, @lng, @is_real_anchor, @real_note,
      @taluk_anchor_delta, @taluk_anchor_drought_2023, @current_level, @prev_level, @yoy_pct,
      @five_yr_delta_pct, @borewell_pct, @recharge_level, @recharge_score, @crisis_score,
      @band_key, @accel_pct, @confidence, @conf_score, @last_updated, @water_sources_json,
      @drinking_json, @prediction_json, @drivers_json, @recommendations_json, @documented_facts_json,
      datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, zone=excluded.zone, taluk=excluded.taluk, tier=excluded.tier,
      lat=excluded.lat, lng=excluded.lng, is_real_anchor=excluded.is_real_anchor,
      real_note=excluded.real_note, taluk_anchor_delta=excluded.taluk_anchor_delta,
      taluk_anchor_drought_2023=excluded.taluk_anchor_drought_2023,
      current_level=excluded.current_level, prev_level=excluded.prev_level,
      yoy_pct=excluded.yoy_pct, five_yr_delta_pct=excluded.five_yr_delta_pct,
      borewell_pct=excluded.borewell_pct, recharge_level=excluded.recharge_level,
      recharge_score=excluded.recharge_score, crisis_score=excluded.crisis_score,
      band_key=excluded.band_key, accel_pct=excluded.accel_pct, confidence=excluded.confidence,
      conf_score=excluded.conf_score, last_updated=excluded.last_updated,
      water_sources_json=excluded.water_sources_json, drinking_json=excluded.drinking_json,
      prediction_json=excluded.prediction_json, drivers_json=excluded.drivers_json,
      recommendations_json=excluded.recommendations_json,
      documented_facts_json=excluded.documented_facts_json, updated_at=datetime('now')
  `).run(area);
}

export function replaceAreaHistory(areaId, hist) {
  const del = db.prepare('DELETE FROM area_history WHERE area_id = ?');
  const ins = db.prepare('INSERT INTO area_history (area_id, year, level, rainfall_mm, rain_index) VALUES (?,?,?,?,?)');
  const tx = db.transaction((rows) => {
    del.run(areaId);
    for (const h of rows) ins.run(areaId, h.year, h.level, h.rainfall_mm, h.rainIdx);
  });
  tx(hist);
}

export function replaceRainfallYears(rows) {
  const del = db.prepare('DELETE FROM rainfall_years');
  const ins = db.prepare('INSERT INTO rainfall_years (year, mm, basis) VALUES (?,?,?)');
  const tx = db.transaction((rs) => { del.run(); for (const r of rs) ins.run(r.year, r.mm, r.basis); });
  tx(rows);
}

export function replaceDataSources(rows) {
  const del = db.prepare('DELETE FROM data_sources');
  const ins = db.prepare('INSERT INTO data_sources (idx, org, name, date, resolution, unit, frequency, confidence, is_real, note) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const tx = db.transaction((rs) => {
    del.run();
    rs.forEach((r, i) => ins.run(i, r.org, r.name, r.date, r.res, r.unit, r.freq, r.conf, r.real ? 1 : 0, r.note));
  });
  tx(rows);
}

export function logRefreshStart() {
  const info = db.prepare("INSERT INTO refresh_log (started_at, status) VALUES (datetime('now'), 'running')").run();
  return info.lastInsertRowid;
}
export function logRefreshEnd(id, status, detail) {
  db.prepare("UPDATE refresh_log SET finished_at = datetime('now'), status = ?, detail = ? WHERE id = ?").run(status, detail ?? null, id);
}
export function getRecentRefreshLog(limit = 10) {
  return db.prepare('SELECT * FROM refresh_log ORDER BY id DESC LIMIT ?').all(limit);
}
