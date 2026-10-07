import { Router } from 'express';
import * as repo from '../db/repository.js';

export const rainfallRouter = Router();

// GET /api/rainfall — city-wide annual series with each year's real/estimated basis.
rainfallRouter.get('/', (req, res) => {
  res.json({ years: repo.getRainfallYears() });
});
