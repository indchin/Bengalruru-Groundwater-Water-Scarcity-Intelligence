import Chart from 'chart.js/auto';
import { api } from '../api.js';
import { state } from '../state.js';
import { band } from '../utils/bands.js';

function bandChipSmall(b) {
  return `<span class="band-chip" style="background:${b.hex}; font-size:0.68rem;">${b.label}</span>`;
}

export function populateScenarioAreaSelect() {
  document.getElementById('scenario-area').innerHTML = state.areas.map((a) => `<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('scenario-area').value = state.scenarioAreaId;
}

export function initScenario() {
  ['s-rain', 's-extract', 's-rwh', 's-recycled'].forEach((id) => document.getElementById(id).addEventListener('input', updateScenario));
  document.getElementById('s-lake').addEventListener('change', updateScenario);
  document.getElementById('scenario-area').addEventListener('change', updateScenario);
  document.getElementById('s-reset').addEventListener('click', () => {
    document.getElementById('s-rain').value = 0;
    document.getElementById('s-extract').value = 0;
    document.getElementById('s-rwh').value = 0;
    document.getElementById('s-recycled').value = 0;
    document.getElementById('s-lake').checked = false;
    updateScenario();
  });
}

export async function updateScenario() {
  const areaId = document.getElementById('scenario-area').value;
  const area = state.areaById[areaId];
  if (!area) return;

  const rain = +document.getElementById('s-rain').value;
  const extract = +document.getElementById('s-extract').value;
  const rwh = +document.getElementById('s-rwh').value;
  const recycled = +document.getElementById('s-recycled').value;
  const lake = document.getElementById('s-lake').checked;
  document.getElementById('s-rain-val').textContent = (rain >= 0 ? '+' : '') + rain + '%';
  document.getElementById('s-extract-val').textContent = (extract >= 0 ? '+' : '') + extract + '%';
  document.getElementById('s-rwh-val').textContent = rwh + '%';
  document.getElementById('s-recycled-val').textContent = recycled + '%';

  let result;
  try {
    result = await api.runScenario({ areaId, rainDelta: rain, extractDelta: extract, rwhDelta: rwh, recycledDelta: recycled, lakeRestore: lake });
  } catch (err) {
    document.getElementById('s-score-sim').textContent = 'Error';
    console.error('Scenario request failed:', err);
    return;
  }

  const simBand = band(result.simulated.band);
  const baseBand = band(result.baseline.band);
  document.getElementById('s-score-baseline').innerHTML = `${result.baseline.score}<div class="band-chip" style="background:${baseBand.hex}; margin-top:6px;">${baseBand.label}</div>`;
  document.getElementById('s-score-sim').innerHTML = `${result.simulated.score}<div class="band-chip" style="background:${simBand.hex}; margin-top:6px;">${simBand.label}</div>`;

  const hist = area.hist || [];
  const last = hist[hist.length - 1] || { level: area.current };
  const prev2 = hist[hist.length - 3] || last;
  const baseTraj = [hist[hist.length - 3]?.level, hist[hist.length - 2]?.level, last.level,
    Math.round((last.level + (last.level - prev2.level) / 2 * 1) * 10) / 10,
    Math.round((last.level + (last.level - prev2.level) / 2 * 3) * 10) / 10];
  const simFactor = 1 - (rain * 0.006) + (extract * 0.006) - (rwh * 0.003) - (recycled * 0.002) - (lake ? 0.05 : 0);
  const simTraj = baseTraj.map((v, i) => (i < 3 ? v : Math.round((last.level + (v - last.level) * simFactor) * 10) / 10));

  const ctx = document.getElementById('scenario-chart');
  if (state.charts.scenario) state.charts.scenario.destroy();
  state.charts.scenario = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['-2yr', '-1yr', 'Now', '+1 yr', '+3 yr'],
      datasets: [
        { label: 'Baseline trajectory', data: baseTraj, borderColor: '#7C8B85', borderDash: [5, 4], tension: 0.2 },
        { label: 'Simulated trajectory', data: simTraj, borderColor: '#1B6FA8', backgroundColor: '#1B6FA822', tension: 0.2 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { reverse: true, title: { display: true, text: 'm bgl' } } }, plugins: { legend: { position: 'bottom' } } },
  });

  const rows = [['3 months', 'h3m'], ['6 months', 'h6m'], ['1 year', 'h1y'], ['3 years', 'h3y'], ['5 years', 'h5y']]
    .map(([label, key]) => `<tr><td>${label}</td><td>${bandChipSmall(area.prediction[key].band)}</td><td>${bandChipSmall(result.prediction[key])}</td></tr>`).join('');
  document.getElementById('scenario-pred-table').innerHTML = `<thead><tr><th>Horizon</th><th>Baseline</th><th>Simulated</th></tr></thead><tbody>${rows}</tbody>`;
}
