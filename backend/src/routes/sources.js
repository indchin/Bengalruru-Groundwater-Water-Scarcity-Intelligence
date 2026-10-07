import { Router } from 'express';
import * as repo from '../db/repository.js';

export const sourcesRouter = Router();

// GET /api/sources — the Data Provenance tab's content, served from the DB
// instead of hardcoded in the frontend, so it can be updated independently.
sourcesRouter.get('/', (req, res) => {
  res.json({ sources: repo.getDataSources() });
});
