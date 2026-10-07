import { createApp } from './app.js';
import { config } from './config/index.js';
import { initSchema, db } from './db/connection.js';
import { startScheduledRefresh } from './jobs/refresh.js';

initSchema();

// First-run convenience: if the areas table is empty (fresh DB / fresh
// clone), seed it automatically so `npm start` works out of the box.
const areaCount = db.prepare('SELECT COUNT(*) AS c FROM areas').get().c;
if (areaCount === 0) {
  console.log('Empty database detected — running initial seed...');
  const { seedDatabase } = await import('./db/seed.js');
  seedDatabase();
}

const app = createApp();

app.listen(config.port, () => {
  console.log(`Bengaluru Water Intelligence API listening on :${config.port} (${config.nodeEnv})`);
  startScheduledRefresh();
});
