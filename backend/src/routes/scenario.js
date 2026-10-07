import { Router } from 'express';
import * as repo from '../db/repository.js';
import { computeScenario, scenarioPredictionRow } from '../db/model.js';

export const scenarioRouter = Router();

function clampNum(v, lo, hi, fallback = 0) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

// POST /api/scenario
// body: { areaId, rainDelta, extractDelta, rwhDelta, recycledDelta, lakeRestore }
// Runs the exact same "what-if" model the original client-side simulator
// used, server-side — so the logic lives in one tested place instead of
// being duplicated between a browser build and a backend.
scenarioRouter.post('/', (req, res) => {
  const { areaId } = req.body || {};
  if (!areaId) return res.status(400).json({ error: 'body.areaId is required.' });
  const area = repo.getArea(areaId);
  if (!area) return res.status(404).json({ error: `Unknown area id "${areaId}"` });

  const hist = repo.getAreaHistory(areaId);
  const areaForModel = { ...area, hist, rechargeScore: area.rechargeScore, water_sources: area.water_sources };

  const rainDelta = clampNum(req.body.rainDelta, -40, 40);
  const extractDelta = clampNum(req.body.extractDelta, -30, 40);
  const rwhDelta = clampNum(req.body.rwhDelta, 0, 60);
  const recycledDelta = clampNum(req.body.recycledDelta, 0, 50);
  const lakeRestore = !!req.body.lakeRestore;

  const sim = computeScenario(areaForModel, rainDelta, extractDelta, rwhDelta, recycledDelta, lakeRestore);
  const predictionRow = scenarioPredictionRow(areaForModel, sim.score);

  res.json({
    areaId,
    inputs: { rainDelta, extractDelta, rwhDelta, recycledDelta, lakeRestore },
    baseline: { score: area.crisisScore, band: area.bandKey },
    simulated: { score: sim.score, band: sim.band.key },
    prediction: predictionRow,
  });
});
