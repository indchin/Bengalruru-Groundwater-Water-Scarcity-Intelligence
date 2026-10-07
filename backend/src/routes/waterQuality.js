import { Router } from 'express';
import * as repo from '../db/repository.js';

export const waterQualityRouter = Router();

// GET /api/water-quality?area=whitefield
waterQualityRouter.get('/', (req, res) => {
  const { area } = req.query;
  if (!area) return res.status(400).json({ error: 'Query param "area" is required.' });
  const found = repo.getArea(area);
  if (!found) return res.status(404).json({ error: `Unknown area id "${area}"` });
  res.json({ area, drinking: found.drinking });
});
