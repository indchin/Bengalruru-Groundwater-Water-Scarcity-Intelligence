import { Router } from 'express';
import * as repo from '../db/repository.js';

export const areasRouter = Router();

// GET /api/areas — summary list for the map/list/compare/warnings views.
// GET /api/areas?includeHistory=true — also attaches each area's full
// year-by-year history, needed by the map's timeline slider/animation
// (which redraws every area's marker for a given year) without requiring
// 28 separate detail requests.
areasRouter.get('/', (req, res) => {
  const areas = repo.listAreas();
  if (req.query.includeHistory === 'true') {
    const historyByArea = repo.getAllHistory();
    for (const a of areas) a.hist = historyByArea[a.id] || [];
  }
  res.json({ count: areas.length, areas });
});

// GET /api/areas/:id — full detail for one locality, including its history.
areasRouter.get('/:id', (req, res) => {
  const area = repo.getArea(req.params.id);
  if (!area) return res.status(404).json({ error: `Unknown area id "${req.params.id}"` });
  const hist = repo.getAreaHistory(req.params.id);
  res.json({ ...area, hist });
});
