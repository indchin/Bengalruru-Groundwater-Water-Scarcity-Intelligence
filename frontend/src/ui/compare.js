import Chart from 'chart.js/auto';
import { state } from '../state.js';

export function toggleCompare(id) {
  const idx = state.compareIds.indexOf(id);
  if (idx > -1) {
    state.compareIds.splice(idx, 1);
  } else {
    if (state.compareIds.length >= 4) state.compareIds.shift();
    state.compareIds.push(id);
  }
  renderCompare();
}

function renderComparePicker() {
  document.getElementById('compare-picker').innerHTML = state.compareIds.map((id) => {
    const a = state.areaById[id];
    if (!a) return ''; // defensive: skip an id that no longer resolves (e.g. stale dataset)
    return `<span class="chip">${a.name} <button aria-label="Remove ${a.name} from comparison" data-remove="${id}">\u2715</button></span>`;
  }).join('');
  document.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => toggleCompare(b.dataset.remove)));
}

export function renderCompare() {
  renderComparePicker();
  const areas = state.compareIds.map((id) => state.areaById[id]).filter(Boolean);
  const has = areas.length >= 2;
  document.getElementById('compare-empty').style.display = has ? 'none' : 'block';
  document.getElementById('compare-content').style.display = has ? 'block' : 'none';
  if (!has) return;

  const ctx = document.getElementById('compare-line-chart');
  if (state.charts.compare) state.charts.compare.destroy();
  const palette = ['#8C2F26', '#1B6FA8', '#C9A227', '#2E8F82'];
  const years = (areas[0].hist || []).map((h) => h.year);
  state.charts.compare = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: areas.map((a, i) => ({ label: a.name, data: (a.hist || []).map((h) => h.level), borderColor: palette[i % 4], backgroundColor: palette[i % 4] + '22', tension: 0.25, pointRadius: 2 })),
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { reverse: true, title: { display: true, text: 'm bgl' } } }, plugins: { legend: { position: 'bottom' } } },
  });

  document.getElementById('compare-cards').innerHTML = areas.map((a) => `
    <div class="section-card">
      <h4>${a.name} <span style="font-weight:400; font-size:0.72rem; color:var(--muted);">${a.zone}</span></h4>
      <div class="field-row"><span class="k">Current level</span><span class="v">${Math.round(a.current * 10) / 10} m bgl</span></div>
      <div class="field-row"><span class="k">Crisis score</span><span class="v">${a.crisisScore} \u2014 ${a.prediction.h1y.band.label}</span></div>
      <div class="field-row"><span class="k">Rainfall (latest yr)</span><span class="v">${(a.hist?.[a.hist.length - 1]?.rainfall_mm) ?? '\u2014'} mm</span></div>
      <div class="field-row"><span class="k">Groundwater dependency</span><span class="v">${a.water_sources.groundwater}%</span></div>
      <div class="field-row"><span class="k">Water quality</span><span class="v">${a.drinking.qualityStatus}</span></div>
      <div class="field-row"><span class="k">1-yr prediction</span><span class="v">${a.prediction.h1y.band.label}</span></div>
      <div class="field-row"><span class="k">Top risk factor</span><span class="v" style="font-weight:500; white-space:normal; text-align:right;">${a.drivers[0]}</span></div>
    </div>`).join('');
}
