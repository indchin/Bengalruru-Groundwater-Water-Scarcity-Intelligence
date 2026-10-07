import { initSchema } from './connection.js';
import * as repo from './repository.js';
import { AREAS, RAINFALL_MM, RAINFALL_BASIS, YEARS, DATA_SOURCES } from './model.js';

/**
 * Populates (or refreshes) the database from the current domain model.
 * Run with `npm run seed`. This is also what the scheduled refresh job
 * (src/jobs/refresh.js) calls once it has pulled in any new real anchor
 * figures — see that file for how a live CGWB/IMD feed would plug in here.
 */
export function seedDatabase({ verbose = true } = {}) {
  initSchema();

  for (const area of AREAS) {
    repo.upsertArea({
      id: area.id,
      name: area.name,
      zone: area.zone,
      taluk: area.taluk,
      tier: area.tier,
      lat: area.lat,
      lng: area.lng,
      is_real_anchor: area.isRealAnchor ? 1 : 0,
      real_note: area.realNote,
      taluk_anchor_delta: area.talukAnchor ? area.talukAnchor.delta : null,
      taluk_anchor_drought_2023: area.talukAnchor ? area.talukAnchor.drought2023 : null,
      current_level: area.current,
      prev_level: area.prev,
      yoy_pct: area.yoyPct,
      five_yr_delta_pct: area.fiveYrDeltaPct,
      borewell_pct: area.borewell,
      recharge_level: area.rechargeLevel,
      recharge_score: area.rechargeScore,
      crisis_score: area.crisisScore,
      band_key: area.band.key,
      accel_pct: area.accelPct,
      confidence: area.confidence,
      conf_score: area.confScore,
      last_updated: area.lastUpdated,
      water_sources_json: JSON.stringify(area.water_sources),
      drinking_json: JSON.stringify(area.drinking),
      prediction_json: JSON.stringify(area.prediction),
      drivers_json: JSON.stringify(area.drivers),
      recommendations_json: JSON.stringify(area.recommendations),
      documented_facts_json: JSON.stringify(area.documentedFacts),
    });
    repo.replaceAreaHistory(area.id, area.hist);
  }

  repo.replaceRainfallYears(YEARS.map((year, i) => ({ year, mm: RAINFALL_MM[i], basis: RAINFALL_BASIS[i] })));
  repo.replaceDataSources(DATA_SOURCES);

  if (verbose) {
    console.log(`Seeded ${AREAS.length} areas, ${YEARS.length} rainfall years, ${DATA_SOURCES.length} data sources.`);
  }
}

// Allow running directly: `node src/db/seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
