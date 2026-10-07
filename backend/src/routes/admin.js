import { Router } from 'express';
import { requireAdminKey } from '../middleware/auth.js';
import * as repo from '../db/repository.js';
import { runRefresh } from '../jobs/refresh.js';

export const adminRouter = Router();

// GET /api/admin/refresh-log — see recent scheduled/manual refresh runs.
adminRouter.get('/refresh-log', requireAdminKey, (req, res) => {
  res.json({ runs: repo.getRecentRefreshLog() });
});

// POST /api/admin/refresh — manually trigger a data refresh instead of
// waiting for the nightly cron. Requires X-Api-Key. See jobs/refresh.js for
// what this actually does today vs. what a live-feed version would do.
adminRouter.post('/refresh', requireAdminKey, async (req, res, next) => {
  try {
    const result = await runRefresh({ trigger: 'manual' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
