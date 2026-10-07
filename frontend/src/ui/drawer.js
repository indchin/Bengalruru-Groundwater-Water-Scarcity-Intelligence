import Chart from 'chart.js/auto';
import { api } from '../api.js';
import { state } from '../state.js';
import { band } from '../utils/bands.js';
import { round1, bandChip, confChip } from '../utils/format.js';

let onCompareToggle = () => {};
let onOpenScenario = () => {};

export function initDrawer({ compareToggle, openScenario }) {
  onCompareToggle = compareToggle;
  onOpenScenario = openScenario;

  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  document.getElementById('drawer-subtabs').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sub]');
    if (!btn) return;
    document.querySelectorAll('#drawer-subtabs button').forEach((b) => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));
    document.querySelectorAll('.subpanel').forEach((p) => p.classList.remove('active'));
    document.getElementById('sub-' + btn.dataset.sub).classList.add('active');
  });
}

export async function openDrawer(areaId) {
  const area = await api.getArea(areaId);
  state.currentAreaId = areaId;
  document.getElementById('drawer-title').textContent = area.name;
  document.getElementById('drawer-zone').textContent = `${area.zone} \u00b7 ${area.taluk} Taluk${area.isRealAnchor ? '  \u00b7  real published anchor figure' : ''}`;

  renderOverview(area);
  renderTrend(area);
  renderSources(area);
  renderDrinking(area);
  renderPrediction(area);
  renderRecommend(area);

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('drawer-backdrop').style.display = 'block';
  document.getElementById('drawer-close').focus();
}

export function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('drawer-backdrop').style.display = 'none';
}

function renderOverview(area) {
  const deltaSign = area.current - area.prev;
  const deltaClass = deltaSign >= 0 ? 'up' : 'down';
  const inCompare = state.compareIds.includes(area.id);
  const anchorTag = area.isRealAnchor
    ? '<span class="real-tag">REAL-anchored</span>'
    : (area.talukAnchor ? '<span class="real-tag">REAL-CALIBRATED</span>' : '<span class="demo-tag">MODELED</span>');
  const talukRow = area.talukAnchor
    ? `<div class="field-row"><span class="k">${area.taluk} taluk, 10-yr change (REAL)</span><span class="v">-${area.talukAnchor.delta}${area.talukAnchor.approx ? ' (\u2248, "&lt;1m")' : ''} m vs 10-yr mean</span></div>
       <div class="field-row"><span class="k">${area.taluk} taluk, Sept-2023 drought status (REAL)</span><span class="v">${area.talukAnchor.drought2023}</span></div>`
    : '';
  const factsBlock = area.documentedFacts && area.documentedFacts.length
    ? `<div class="section-card" style="border-color:#B7D8E9; background:#F3FAFD;">
         <h4>Documented in published reports <span class="real-tag">REAL</span></h4>
         ${area.documentedFacts.map((f) => `<p style="font-size:0.82rem; margin:0 0 8px;">${f.text}<br><span style="color:var(--muted); font-size:0.72rem;">\u2014 ${f.source}</span></p>`).join('')}
       </div>`
    : '';
  const b = band(area.bandKey);

  document.getElementById('sub-overview').innerHTML = `
    <div class="section-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div>
          <div class="big-readout">${round1(area.current)}<span class="unit"> m bgl</span></div>
          <div class="delta ${deltaClass}">${deltaSign >= 0 ? '\u2193' : '\u2191'} ${Math.abs(round1(deltaSign))} m vs previous year ${anchorTag}</div>
        </div>
        <div style="text-align:right;">
          ${bandChip(b)}<br><br>${confChip(area.confidence)}
        </div>
      </div>
      <div style="margin-top:12px;">
        <div class="field-row"><span class="k">Crisis Score (modeled)</span><span class="v">${area.crisisScore} / 100</span></div>
        <div class="field-row"><span class="k">5-year change (calibrated)</span><span class="v">${area.fiveYrDeltaPct >= 0 ? '+' : ''}${area.fiveYrDeltaPct}%</span></div>
        <div class="field-row"><span class="k">Decline acceleration (recent vs prior)</span><span class="v">${area.accelPct >= 0 ? '+' : ''}${area.accelPct}%</span></div>
        <div class="field-row"><span class="k">Recharge potential (modeled)</span><span class="v">${area.rechargeLevel}</span></div>
        <div class="field-row"><span class="k">Borewell dependency (modeled)</span><span class="v">${area.borewell}%</span></div>
        ${talukRow}
        <div class="field-row"><span class="k">Last updated</span><span class="v">${area.lastUpdated}</span></div>
      </div>
    </div>
    <div class="section-card">
      <h4>Why this score?</h4>
      <div class="ai-explain"><strong>${area.name}</strong> \u2014 main contributing factors: ${area.drivers.map((d) => '\u2022 ' + d).join('<br>')}</div>
    </div>
    <div class="section-card" style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="compare-btn" id="drawer-compare-btn" aria-pressed="${inCompare}">${inCompare ? '\u2713 Added to Compare' : '+ Add to Compare'}</button>
      <button class="ghost-btn" id="drawer-scenario-btn">Open in What-If Simulator</button>
    </div>
    ${factsBlock}
    ${area.isRealAnchor ? `<div class="section-card" style="border-color:#B7D8E9; background:#F3FAFD;"><h4>Real data note</h4><p style="font-size:0.82rem; margin:0;">${area.realNote}</p></div>` : ''}
  `;
  document.getElementById('drawer-compare-btn').addEventListener('click', () => { onCompareToggle(area.id); renderOverview(area); });
  document.getElementById('drawer-scenario-btn').addEventListener('click', () => { onOpenScenario(area.id); closeDrawer(); });
}

function renderTrend(area) {
  const anchorLabel = area.isRealAnchor ? 'Anchored to real 2015/2024 CGWB figures' : (area.talukAnchor ? `Calibrated to real ${area.taluk} taluk anchor` : 'Modeled');
  document.getElementById('sub-trend').innerHTML = `
    <div class="section-card">
      <h4>Groundwater level vs rainfall <span class="real-tag">${anchorLabel}</span></h4>
      <div class="chart-box"><canvas id="trend-chart"></canvas></div>
      <p style="font-size:0.7rem; color:var(--muted); margin-top:8px;">Rainfall is the city-wide annual series (real for 2022, 2023 and 2026 \u2014 see Data Sources for each year's basis; trend-interpolated for other years). Groundwater level is this area's modeled trajectory, calibrated so its 2024 position matches the real ${area.taluk} taluk anchor. Rainfall and groundwater level are shown together to explore correlation \u2014 a visible relationship does not by itself prove rainfall caused a given change; extraction, recharge infrastructure and land use all interact with it.</p>
    </div>`;
  const ctx = document.getElementById('trend-chart');
  if (state.charts.trend) state.charts.trend.destroy();
  state.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: area.hist.map((h) => h.year),
      datasets: [
        { label: 'Groundwater depth (m bgl)', data: area.hist.map((h) => h.level), borderColor: '#8C2F26', backgroundColor: '#8C2F2622', yAxisID: 'y', tension: 0.25, pointRadius: 3 },
        { label: 'Rainfall (mm)', data: area.hist.map((h) => h.rainfall_mm), borderColor: '#1B6FA8', backgroundColor: '#1B6FA822', yAxisID: 'y1', tension: 0.25, pointRadius: 3, borderDash: [4, 3] },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { reverse: true, title: { display: true, text: 'm bgl (deeper = down)' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'mm rainfall' } } },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
    },
  });
}

function renderSources(area) {
  const ws = area.water_sources;
  document.getElementById('sub-sources').innerHTML = `
    <div class="section-card">
      <h4>Estimated water dependency <span class="demo-tag">Locality split modeled \u2014 calibrated to real city average</span></h4>
      <div class="chart-box small"><canvas id="source-donut"></canvas></div>
      <div style="margin-top:8px; font-size:0.8rem;">
        <div class="field-row"><span class="k">Groundwater / borewells</span><span class="v">${ws.groundwater}%</span></div>
        <div class="field-row"><span class="k">Cauvery water (piped)</span><span class="v">${ws.cauvery}%</span></div>
        <div class="field-row"><span class="k">Private tankers</span><span class="v">${ws.tankers}%</span></div>
        <div class="field-row"><span class="k">Lake / tank water</span><span class="v">${ws.lake}%</span></div>
        <div class="field-row"><span class="k">Rainwater harvesting</span><span class="v">${ws.rainwater}%</span></div>
        <div class="field-row"><span class="k">Treated / recycled water</span><span class="v">${ws.recycled}%</span></div>
        <div class="field-row"><span class="k">Other</span><span class="v">${ws.other}%</span></div>
      </div>
      <p style="font-size:0.7rem; color:var(--muted); margin-top:8px;">REAL city-wide anchor: ~60% of Bengaluru's population is Cauvery-dependent, ~40% groundwater-dependent (The South First, 2024). This locality's split is modeled around that real average, skewed by whether it's within the original CWSS-served core/CMC area or one of the 110 villages added in 2007 that Cauvery Stage V is still rolling out to.</p>
    </div>`;
  const ctx = document.getElementById('source-donut');
  if (state.charts.donut) state.charts.donut.destroy();
  state.charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Groundwater', 'Cauvery', 'Tankers', 'Lake/Tank', 'RWH', 'Recycled', 'Other'],
      datasets: [{ data: [ws.groundwater, ws.cauvery, ws.tankers, ws.lake, ws.rainwater, ws.recycled, ws.other], backgroundColor: ['#8C2F26', '#1B6FA8', '#C1622B', '#2E8F82', '#6AA84F', '#7C5AC7', '#9AA6A2'] }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } },
  });
}

function renderDrinking(area) {
  const d = area.drinking;
  const statusColor = { Good: '#1B6FA8', Watch: '#2E8F82', Poor: '#C1622B', Critical: '#8C2F26' }[d.qualityStatus];
  document.getElementById('sub-drinking').innerHTML = `
    <div class="section-card">
      <h4>Drinking water intelligence</h4>
      <div class="field-row"><span class="k">Primary source</span><span class="v">${area.water_sources.cauvery > area.water_sources.groundwater ? 'Cauvery (piped)' : 'Groundwater / borewell'}</span></div>
      <div class="field-row"><span class="k">Availability</span><span class="v">${d.availability}</span></div>
      <div class="field-row"><span class="k">Groundwater dependency</span><span class="v">${area.water_sources.groundwater}%</span></div>
      <div class="field-row"><span class="k">Cauvery dependency</span><span class="v">${area.water_sources.cauvery}%</span></div>
      <div class="field-row"><span class="k">Tanker dependency</span><span class="v">${area.water_sources.tankers}%</span></div>
      <div class="field-row"><span class="k">Quality status</span><span class="v" style="color:${statusColor};">${d.qualityStatus}</span></div>
      <h4 style="margin-top:14px;">Indicative quality parameters</h4>
      <div class="wq-grid">
        <div class="wq-item"><div class="v">${d.ph}</div><div class="k">pH</div></div>
        <div class="wq-item"><div class="v">${d.tds}</div><div class="k">TDS mg/L</div></div>
        <div class="wq-item"><div class="v">${d.hardness}${d.hardnessIsReal ? ' <span class="real-tag" style="vertical-align:middle;">REAL</span>' : ''}</div><div class="k">Hardness${d.hardnessIsReal ? ` (${d.hardnessRange})` : ''}</div></div>
        <div class="wq-item"><div class="v">${d.fluoride}</div><div class="k">Fluoride</div></div>
        <div class="wq-item"><div class="v">${d.nitrate}</div><div class="k">Nitrate</div></div>
        <div class="wq-item"><div class="v">${d.iron}</div><div class="k">Iron</div></div>
      </div>
      ${d.hardnessIsReal ? '<p style="font-size:0.72rem; color:var(--muted); margin-top:6px;">Hardness figure for this locality comes from a named informal industry water-hardness survey (Hard2Soft, 2026) \u2014 a real published estimate, but not an official government lab report.</p>' : ''}
      ${d.microbialFlag ? '<p style="font-size:0.78rem; color:#8C2F26; margin-top:8px;">\u26a0 Elevated microbial-contamination risk flagged for this area in the modeled dataset \u2014 in a real deployment this should trigger lab verification, not a standalone health claim.</p>' : ''}
      ${d.uraniumFlag ? '<p style="font-size:0.78rem; color:#8C2F26; margin-top:8px;">\u26a0 Elevated uranium risk flagged for this area. REAL context: CGWB\'s 2023 assessment found about 60% of rural-Bengaluru groundwater samples exceeded the uranium safety threshold, and 81% exceeded the nitrate limit \u2014 this area\'s flag is a calibrated estimate against that district-wide real finding, not a lab result for this specific locality.</p>' : ''}
      <p style="font-size:0.7rem; color:var(--muted); margin-top:8px;">Per-locality pH/TDS/fluoride/nitrate/iron figures (aside from hardness where marked REAL above) are modeled and calibrated to the real CGWB district-level findings referenced here, not a certified potability assessment for this specific street or building. A production build would source them from BWSSB/KSPCB lab results.</p>
    </div>`;
}

function renderPrediction(area) {
  const rows = [['3 months', 'h3m'], ['6 months', 'h6m'], ['1 year', 'h1y'], ['3 years', 'h3y'], ['5 years', 'h5y']]
    .map(([label, key]) => {
      const p = area.prediction[key];
      return `<tr><td>${label}</td><td><span class="band-chip" style="background:${p.band.hex}">${p.band.label}</span></td><td>${confChip(p.confidence)}</td></tr>`;
    }).join('');
  document.getElementById('sub-prediction').innerHTML = `
    <div class="section-card">
      <h4>AI water-scarcity prediction <span class="demo-tag">Model estimate, not guaranteed</span></h4>
      <table class="pred-table"><thead><tr><th>Horizon</th><th>Predicted band</th><th>Confidence</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="ai-explain" style="margin-top:12px;"><strong>${area.name} is projected toward ${area.prediction.h1y.band.label} within 12 months.</strong><br>Primary drivers: ${area.drivers.slice(0, 4).map((d) => '\u2022 ' + d).join('<br>')}</div>
    </div>`;
}

function renderRecommend(area) {
  document.getElementById('sub-recommend').innerHTML = `
    <div class="section-card">
      <h4>Recommended interventions <span class="demo-tag">Possible actions, not engineering instructions</span></h4>
      ${area.recommendations.map((r, i) => `<div class="recommend-item"><h5>Priority ${i + 1} \u2014 ${r.title}</h5><p>${r.body}</p></div>`).join('')}
    </div>`;
}
