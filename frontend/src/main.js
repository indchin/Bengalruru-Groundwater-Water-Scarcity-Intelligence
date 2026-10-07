import 'leaflet/dist/leaflet.css';
import { api } from './api.js';
import { state, setAreas } from './state.js';
import { initMap, renderMarkers, renderGauge } from './ui/map.js';
import { renderDashboard } from './ui/dashboard.js';
import { initDrawer, openDrawer } from './ui/drawer.js';
import { initList, renderList } from './ui/list.js';
import { toggleCompare, renderCompare } from './ui/compare.js';
import { initWarnings, renderWarnings } from './ui/warnings.js';
import { initScenario, updateScenario, populateScenarioAreaSelect } from './ui/scenario.js';
import { renderSourcesTab } from './ui/sources.js';
import { initAI, renderAISuggestions, greetAI } from './ui/ai.js';

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

function switchTab(name) {
  document.querySelectorAll('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'list') renderList();
  if (name === 'compare') renderCompare();
  if (name === 'warnings') renderWarnings();
  if (name === 'scenario') updateScenario();
  if (name === 'sources') renderSourcesTab();
}

function wireSearch(inputId, resultsId, onPick) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.style.display = 'none'; return; }
    const matches = state.areas.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 8);
    results.innerHTML = matches.map((a) => `<button type="button" data-id="${a.id}">${a.name} <span style="color:var(--muted); font-size:0.72rem;">\u2014 ${a.prediction.h1y.band.label}</span></button>`).join('') || '<div style="padding:8px 10px; font-size:0.8rem; color:var(--muted);">No matches</div>';
    results.style.display = 'block';
    results.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', () => { onPick(b.dataset.id); results.style.display = 'none'; input.value = ''; }));
  });
  document.addEventListener('click', (e) => { if (e.target !== input && !results.contains(e.target)) results.style.display = 'none'; });
}

async function init() {
  const { areas } = await api.listAreas(true); // includeHistory=true — needed by map timeline, list, compare
  setAreas(areas);
  const { years } = await api.getRainfall();
  state.rainfall = years;
  const { sources } = await api.getSources();
  state.sources = sources;

  initMap(openDrawer);
  renderGauge();
  renderDashboard();

  initDrawer({
    compareToggle: toggleCompare,
    openScenario: (areaId) => {
      state.scenarioAreaId = areaId;
      document.getElementById('scenario-area').value = areaId;
      switchTab('scenario');
      updateScenario();
    },
  });

  initList(openDrawer);
  initWarnings(openDrawer);
  initScenario();
  initAI({ compareOpen: renderCompare, switchTab });

  populateScenarioAreaSelect();
  renderAISuggestions();
  greetAI();

  document.getElementById('main-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
  document.getElementById('link-to-list').addEventListener('click', () => switchTab('list'));
  document.getElementById('dismiss-disclaimer').addEventListener('click', function () {
    this.closest('.disclaimer-bar').style.display = 'none';
  });

  document.getElementById('layer-select').addEventListener('change', (e) => {
    state.layer = e.target.value;
    document.getElementById('horizon-group').style.display = state.layer === 'prediction' ? 'flex' : 'none';
    renderMarkers();
    renderGauge();
  });
  document.getElementById('horizon-select').addEventListener('change', (e) => { state.horizon = e.target.value; renderMarkers(); });
  document.getElementById('toggle-lakes').addEventListener('change', (e) => { state.showLakes = e.target.checked; renderMarkers(); });
  document.getElementById('toggle-shapes').addEventListener('change', (e) => { state.showShapes = e.target.checked; renderMarkers(); renderGauge(); });

  document.getElementById('year-slider').addEventListener('input', (e) => {
    state.yearIdx = +e.target.value;
    document.getElementById('year-readout').textContent = YEARS[state.yearIdx];
    document.querySelectorAll('.preset-row button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    renderMarkers();
  });
  document.querySelectorAll('.preset-row button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-row button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const presetMap = { latest: 11, '3m': 11, '1y': 10, '5y': 6, '10y': 1 };
      state.yearIdx = presetMap[btn.dataset.preset] ?? 11;
      document.getElementById('year-slider').value = state.yearIdx;
      document.getElementById('year-readout').textContent = YEARS[state.yearIdx];
      renderMarkers();
    });
  });
  document.getElementById('play-btn').addEventListener('click', function () {
    if (state.playTimer) { clearInterval(state.playTimer); state.playTimer = null; this.textContent = '\u25b6 Play'; return; }
    this.textContent = '\u23f8 Pause';
    state.playTimer = setInterval(() => {
      state.yearIdx = (state.yearIdx + 1) % YEARS.length;
      document.getElementById('year-slider').value = state.yearIdx;
      document.getElementById('year-readout').textContent = YEARS[state.yearIdx];
      renderMarkers();
    }, 750);
  });

  wireSearch('area-search', 'search-results', (id) => openDrawer(id));
  wireSearch('compare-search', 'compare-search-results', (id) => { if (!state.compareIds.includes(id)) toggleCompare(id); });
}

init().catch((err) => {
  console.error('Failed to initialize app:', err);
  document.getElementById('dashboard-cards').innerHTML = `<div class="stat-card crit"><div class="lbl">Could not load data from the API (${err.message}). Is the backend running? See README "Run locally".</div></div>`;
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker registration failed:', err));
  });
}
