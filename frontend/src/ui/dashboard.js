import { state } from '../state.js';
import { round1 } from '../utils/format.js';

export function renderDashboard() {
  const areas = state.areas;
  const critical = areas.filter((a) => a.bandKey === 'critical').length;
  const high = areas.filter((a) => a.bandKey === 'high').length;
  const avgLevel = round1(areas.reduce((s, a) => s + a.current, 0) / areas.length);
  const predictedHighFuture = areas.filter((a) => {
    const p = a.prediction.h1y.band.key;
    return p === 'high' || p === 'critical';
  }).length;

  const cards = [
    { n: areas.length, l: 'Bengaluru areas tracked (this prototype)', cls: '' },
    { n: critical, l: 'Areas in critical condition (modeled)', cls: 'crit' },
    { n: high, l: 'Areas at high risk (modeled)', cls: 'high' },
    { n: avgLevel + ' m', l: 'Avg. modeled groundwater depth (bgl)', cls: '' },
    { n: '~7,000 / 13,900', l: 'REAL: city borewells run dry (DK Shivakumar, Mar 2024)', cls: 'crit' },
    { n: '60% / 40%', l: 'REAL: city population on Cauvery vs groundwater (2024)', cls: '' },
    { n: '~2,235 MLD', l: 'REAL: total Cauvery capacity after Stage V (1,460 + 775 MLD)', cls: '' },
    { n: predictedHighFuture, l: 'Modeled: predicted High/Critical risk in 1 yr', cls: 'crit' },
  ];
  document.getElementById('dashboard-cards').innerHTML = cards.map((c) => `
    <div class="stat-card ${c.cls}"><div class="num mono">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');
}
