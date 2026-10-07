import { Router } from 'express';
import * as repo from '../db/repository.js';

const HORIZONS = ['h3m', 'h6m', 'h1y', 'h3y', 'h5y'];

export const predictionsRouter = Router();

// GET /api/predictions?area=whitefield&horizon=h1y
predictionsRouter.get('/', (req, res) => {
  const { area, horizon } = req.query;
  if (!area) return res.status(400).json({ error: 'Query param "area" is required.' });
  const found = repo.getArea(area);
  if (!found) return res.status(404).json({ error: `Unknown area id "${area}"` });
  if (horizon) {
    if (!HORIZONS.includes(horizon)) {
      return res.status(400).json({ error: `Invalid horizon. Use one of: ${HORIZONS.join(', ')}` });
    }
    return res.json({ area, horizon, prediction: found.prediction[horizon] });
  }
  res.json({ area, prediction: found.prediction });
});
