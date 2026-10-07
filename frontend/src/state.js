// Small shared mutable state, deliberately not a framework store — this app
// is intentionally dependency-light. `areas` is populated once at startup
// from GET /api/areas and treated as a read cache; anything needing fresher
// data (e.g. after a scenario run) re-fetches explicitly.
export const state = {
  areas: [],
  areaById: {},
  rainfall: [],
  sources: [],
  layer: 'crisis',
  horizon: 'h1y',
  yearIdx: 11,
  showLakes: false,
  showShapes: true,
  currentAreaId: null,
  compareIds: [],
  scenarioAreaId: 'whitefield',
  playTimer: null,
  charts: {},
};

export function setAreas(areas) {
  state.areas = areas;
  state.areaById = Object.fromEntries(areas.map((a) => [a.id, a]));
}
