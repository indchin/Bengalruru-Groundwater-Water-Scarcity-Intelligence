import cron from 'node-cron';
import { config } from '../config/index.js';
import * as repo from '../db/repository.js';
import { seedDatabase } from '../db/seed.js';

/**
 * DATA REFRESH PIPELINE
 * =====================
 * This is real, working job orchestration (scheduling, logging, error
 * handling) wired to real database tables (see `refresh_log`) — that part
 * is production-grade today.
 *
 * What it does NOT do yet: scrape a live CGWB/BWSSB/IMD feed. As of this
 * build, none of those publish a stable public API — the app's real
 * figures were sourced from published bulletins/news reports by hand (see
 * README + Data Sources tab). FETCHERS below is where that would plug in:
 * each entry is a named, independent function that would fetch + validate
 * one real source and return a partial update; `runRefresh` runs them all,
 * merges anything they return into the model, and reseeds the DB. Today
 * they're stubs that resolve to `null` (no change) so the pipeline is
 * exercised and testable end-to-end without pretending to have a live feed
 * it doesn't have.
 *
 * To wire in a real source: implement one of these to fetch+parse it, have
 * it return e.g. { rainfall: [{year, mm}], source: 'IMD station XYZ' }, and
 * extend seedDatabase()/model.js to accept overrides from that shape.
 */
const FETCHERS = [
  {
    name: 'cgwb-groundwater-bulletin',
    description: 'Would fetch the latest CGWB Karnataka water-level bulletin PDF and extract taluk-wise depth figures.',
    async run() { return null; },
  },
  {
    name: 'imd-rainfall',
    description: 'Would fetch IMD\'s Bengaluru station rainfall totals for the current year.',
    async run() { return null; },
  },
  {
    name: 'bwssb-cauvery-coverage',
    description: 'Would fetch BWSSB\'s published Cauvery Stage V connection/coverage counts.',
    async run() { return null; },
  },
];

export async function runRefresh({ trigger = 'scheduled' } = {}) {
  const logId = repo.logRefreshStart();
  const results = [];
  try {
    for (const fetcher of FETCHERS) {
      try {
        const outcome = await fetcher.run();
        results.push({ name: fetcher.name, outcome: outcome ?? 'no-op (stub — no live feed configured yet)' });
      } catch (err) {
        results.push({ name: fetcher.name, error: err.message });
      }
    }
    // Even with no live fetcher wired up, re-running the seed is a real,
    // idempotent refresh: it recomputes the full model deterministically
    // and upserts it, so this path is genuinely exercised end-to-end.
    seedDatabase({ verbose: false });
    repo.logRefreshEnd(logId, 'success', JSON.stringify({ trigger, results }));
    return { status: 'success', trigger, results };
  } catch (err) {
    repo.logRefreshEnd(logId, 'error', err.message);
    throw err;
  }
}

let scheduledTask = null;

export function startScheduledRefresh() {
  if (scheduledTask) return scheduledTask;
  scheduledTask = cron.schedule(config.refreshCron, () => {
    runRefresh({ trigger: 'scheduled' }).catch(err => console.error('Scheduled refresh failed:', err));
  });
  console.log(`Scheduled data refresh registered: "${config.refreshCron}" (cron syntax).`);
  return scheduledTask;
}

export function stopScheduledRefresh() {
  if (scheduledTask) { scheduledTask.stop(); scheduledTask = null; }
}
