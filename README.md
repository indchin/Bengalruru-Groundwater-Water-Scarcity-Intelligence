# Bengaluru Water Intelligence

An interactive dashboard visualizing Bengaluru's groundwater crisis: real published
figures from CGWB, the Karnataka Minor Irrigation Department, BWSSB and IMD,
calibrated into a per-locality model with explainable risk scoring, a "what-if"
scenario simulator, and an early-warning system.

This repo is a **restructured, production-oriented rebuild** of an earlier
single-file HTML prototype. The prototype is preserved for reference but this
is the version to build on: a real Express + SQLite API behind a modular
Vite frontend, with tests, linting, Docker, and CI.

## Architecture

```
bwi/
├── backend/          Express API + SQLite database
│   ├── src/
│   │   ├── db/        connection, repository (the ONLY file that knows it's SQLite),
│   │   │               domain model (calibration logic), seed script
│   │   ├── routes/     one file per resource (areas, groundwater, rainfall, ...)
│   │   ├── middleware/ auth (API-key), error handling
│   │   ├── jobs/       scheduled data-refresh orchestration
│   │   └── config/     centralised env var access
│   └── tests/          Vitest + Supertest (35 tests)
├── frontend/         Vite + vanilla JS (no framework) SPA
│   ├── src/
│   │   ├── api.js      the only file that calls fetch()
│   │   ├── state.js    shared app state
│   │   ├── ui/          one module per tab/feature (map, drawer, list, compare,
│   │   │                warnings, scenario, sources, ai, dashboard)
│   │   └── utils/       band definitions, formatting helpers
│   └── tests/          Vitest + jsdom, Leaflet/Chart.js mocked (39 tests)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

**Why this shape:** every backend route goes through `repository.js`, so
swapping SQLite for Postgres later means rewriting one file. The frontend's
`api.js` is the only place that calls `fetch()`, so adding auth headers,
retries, or a different backend URL never touches UI code. Each `ui/*.js`
module owns one tab and can be worked on independently.

## Data model: what's real vs. modeled

See the in-app **Data Sources** tab for the full, cited list. Summary:

- **REAL, exact:** Devanahalli's 2015→2024 depth (32.2→73.74 mbgl), the five
  Bengaluru Urban taluks' decadal groundwater change vs their 10-year mean
  (Karnataka Minor Irrigation Dept), 2022's record rainfall (1,957mm), the
  2023 drought declaration, city-wide borewell-dry counts, BWSSB Cauvery
  capacity figures, CGWB's 2023 rural water-quality assessment.
- **REAL-CALIBRATED:** every locality's year-by-year trajectory is generated
  once (deterministic, seeded by area id — not random) and mathematically
  blended so it matches its real taluk-level anchor exactly. No public feed
  gives a verified daily reading per locality, so this is disclosed as
  calibration, not measurement.
- **Explicitly a model, not data:** the 0–100 Crisis Score, all predictions,
  and "what-if" scenario outputs. These are transparent, weighted formulas
  (see `backend/src/db/model.js`), not black boxes — but they're estimates.

## Run locally (without Docker)

Requires Node 22+.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run seed      # populates ./data/app.db from the domain model
npm run dev       # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev        # http://localhost:5173
```

## Run with Docker

```bash
docker compose up --build
# frontend: http://localhost:8080
# backend:  http://localhost:4000
```

Set `ADMIN_API_KEY`, `CORS_ORIGIN`, and `PUBLIC_API_BASE_URL` env vars before
running in anything beyond local dev — see `docker-compose.yml` comments.

> Note: the Dockerfiles/compose file follow standard, widely-used patterns
> (multi-stage Node build, Alpine base, nginx for static serving) but have
> **not been executed in this build environment**, which doesn't have Docker
> available. Test `docker compose up --build` yourself before relying on it
> for a real deployment — the GitHub Actions workflow below will also build
> both images on every push, which is the first real verification point.

## Testing & linting

```bash
cd backend  && npm test && npm run lint   # 35 tests
cd frontend && npm test && npm run lint   # 39 tests
```

CI (`.github/workflows/ci.yml`) runs both suites, both linters, both
`npm audit`, and both Docker builds on every push to `main` and every PR.

## Auth

`GET /api/*` read endpoints are public (this is a public-interest civic
dashboard). `POST /api/admin/*` requires an `X-Api-Key` header matching
`ADMIN_API_KEY`. This is intentionally minimal — for a real multi-user
deployment, replace it with a proper auth provider (Supabase Auth, Clerk,
Auth0) checking a verified session/JWT instead of a shared secret.

## Scheduled data refresh

`backend/src/jobs/refresh.js` runs on a cron schedule (`REFRESH_CRON`,
default 3am daily) and is also triggerable manually via
`POST /api/admin/refresh`. Today its fetchers are honest stubs — no CGWB/
BWSSB/IMD source currently publishes a stable public API, so the real
figures in this app were sourced from bulletins and news reports by hand.
The orchestration, logging (`refresh_log` table), and error handling around
it are real and tested; wiring in a live source means implementing one of
the `FETCHERS` entries in that file.

## Extending this app

- **New data layer:** add a route in `backend/src/routes/`, a repository
  function in `backend/src/db/repository.js`, a migration in
  `connection.js`'s `initSchema()`, and an `api.js` function on the frontend.
- **New tab:** add a `<section>` to `frontend/index.html`, a module in
  `frontend/src/ui/`, and wire it into `switchTab()` in `main.js`.
- **New database:** rewrite `backend/src/db/connection.js` and
  `repository.js` for Postgres/MySQL; nothing else changes.
