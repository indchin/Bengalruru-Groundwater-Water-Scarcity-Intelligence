import { Router } from 'express';
import * as repo from '../db/repository.js';

export const groundwaterRouter = Router();

// GET /api/groundwater?area=whitefield&year=2024
// Mirrors the /data/groundwater abstraction described in the original
// prototype's comments — now a real endpoint instead of an in-browser array.
groundwaterRouter.get('/', (req, res) => {
  const { area, year } = req.query;
  if (area) {
    const found = repo.getArea(area);
    if (!found) return res.status(404).json({ error: `Unknown area id "${area}"` });
    let hist = repo.getAreaHistory(area);
    if (year) hist = hist.filter(h => String(h.year) === String(year));
    return res.json({ area, hist });
  }
  const all = repo.getAllHistory();
  res.json(all);
});
