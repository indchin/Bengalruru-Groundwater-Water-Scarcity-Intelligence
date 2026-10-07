import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initSchema } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';
import { config } from '../src/config/index.js';

let app;

beforeAll(() => {
  initSchema();
  seedDatabase({ verbose: false });
  app = createApp();
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/areas', () => {
  it('returns all 28 seeded areas', async () => {
    const res = await request(app).get('/api/areas');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(28);
    expect(res.body.areas).toHaveLength(28);
  });

  it('each area has the fields the frontend needs', async () => {
    const res = await request(app).get('/api/areas');
    const a = res.body.areas.find(x => x.id === 'whitefield');
    expect(a).toBeDefined();
    expect(a).toHaveProperty('crisisScore');
    expect(a).toHaveProperty('bandKey');
    expect(a).toHaveProperty('water_sources');
    expect(a).toHaveProperty('prediction');
    expect(a).not.toHaveProperty('hist'); // history omitted by default (lighter payload)
  });

  it('attaches full history to every area when includeHistory=true', async () => {
    const res = await request(app).get('/api/areas?includeHistory=true');
    expect(res.status).toBe(200);
    const a = res.body.areas.find(x => x.id === 'devanahalli');
    expect(a.hist).toHaveLength(12);
    expect(a.hist.find(h => h.year === 2024).level).toBeCloseTo(73.74, 0);
  });
});

describe('GET /api/areas/:id', () => {
  it('returns full detail including history for a valid id', async () => {
    const res = await request(app).get('/api/areas/whitefield');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Whitefield');
    expect(res.body.hist).toHaveLength(12);
  });

  it('confirms the Devanahalli real anchor via the live API', async () => {
    const res = await request(app).get('/api/areas/devanahalli');
    expect(res.status).toBe(200);
    expect(res.body.isRealAnchor).toBe(true);
    const y2015 = res.body.hist.find(h => h.year === 2015);
    const y2024 = res.body.hist.find(h => h.year === 2024);
    expect(y2015.level).toBeCloseTo(32.2, 1);
    expect(y2024.level).toBeCloseTo(73.74, 0);
  });

  it('404s for an unknown area id', async () => {
    const res = await request(app).get('/api/areas/not-a-real-place');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Unknown area/);
  });
});

describe('GET /api/groundwater', () => {
  it('filters by area and year', async () => {
    const res = await request(app).get('/api/groundwater?area=devanahalli&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.hist).toHaveLength(1);
    expect(res.body.hist[0].year).toBe(2024);
  });
});

describe('GET /api/rainfall', () => {
  it('includes the real 2022 record rainfall figure', async () => {
    const res = await request(app).get('/api/rainfall');
    expect(res.status).toBe(200);
    const y2022 = res.body.years.find(y => y.year === 2022);
    expect(y2022.mm).toBe(1957);
    expect(y2022.basis).toMatch(/REAL/);
  });
});

describe('GET /api/water-sources', () => {
  it('requires an area query param', async () => {
    const res = await request(app).get('/api/water-sources');
    expect(res.status).toBe(400);
  });
  it('returns a source mix summing near 100%', async () => {
    const res = await request(app).get('/api/water-sources?area=jayanagar');
    expect(res.status).toBe(200);
    const sum = Object.values(res.body.water_sources).reduce((s, v) => s + v, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(1);
  });
});

describe('GET /api/predictions', () => {
  it('rejects an invalid horizon', async () => {
    const res = await request(app).get('/api/predictions?area=whitefield&horizon=h100y');
    expect(res.status).toBe(400);
  });
  it('returns a specific horizon prediction', async () => {
    const res = await request(app).get('/api/predictions?area=whitefield&horizon=h1y');
    expect(res.status).toBe(200);
    expect(res.body.prediction).toHaveProperty('band');
  });
});

describe('POST /api/scenario', () => {
  it('requires areaId', async () => {
    const res = await request(app).post('/api/scenario').send({});
    expect(res.status).toBe(400);
  });

  it('404s for an unknown area', async () => {
    const res = await request(app).post('/api/scenario').send({ areaId: 'nowhere' });
    expect(res.status).toBe(404);
  });

  it('worsens the simulated score for adverse inputs', async () => {
    const res = await request(app).post('/api/scenario').send({
      areaId: 'whitefield', rainDelta: -30, extractDelta: 25,
    });
    expect(res.status).toBe(200);
    expect(res.body.simulated.score).toBeGreaterThan(res.body.baseline.score);
  });

  it('clamps out-of-range inputs instead of erroring', async () => {
    const res = await request(app).post('/api/scenario').send({
      areaId: 'whitefield', rainDelta: -999, extractDelta: 999,
    });
    expect(res.status).toBe(200);
    expect(res.body.inputs.rainDelta).toBe(-40);
    expect(res.body.inputs.extractDelta).toBe(40);
  });
});

describe('GET /api/sources', () => {
  it('returns the cited data sources', async () => {
    const res = await request(app).get('/api/sources');
    expect(res.status).toBe(200);
    expect(res.body.sources.length).toBeGreaterThan(10);
    expect(res.body.sources.some(s => s.real)).toBe(true);
  });
});

describe('Admin auth', () => {
  it('rejects refresh trigger without an API key', async () => {
    const res = await request(app).post('/api/admin/refresh');
    expect(res.status).toBe(401);
  });

  it('rejects refresh trigger with a wrong API key', async () => {
    const res = await request(app).post('/api/admin/refresh').set('X-Api-Key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  it('accepts refresh trigger with the correct API key', async () => {
    const res = await request(app).post('/api/admin/refresh').set('X-Api-Key', config.adminApiKey);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  }, 15000);
});

describe('Unknown routes', () => {
  it('returns a JSON 404, not an HTML error page', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
