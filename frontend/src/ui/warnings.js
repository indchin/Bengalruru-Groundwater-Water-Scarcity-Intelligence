import { state } from '../state.js';
import { bandIndex } from '../utils/bands.js';

let onOpenArea = () => {};

export function initWarnings(openHandler) {
  onOpenArea = openHandler;
}

export function renderWarnings() {
  const alerts = [];
  state.areas.forEach((a) => {
    if (a.accelPct > 18) {
      alerts.push({ level: 'critical', area: a, text: `Groundwater decline in ${a.name} has accelerated by ${a.accelPct}% over the recent monitoring window.` });
    }
    const curIdx = bandIndex(a.bandKey);
    const futIdx = bandIndex(a.prediction.h1y.band.key);
    if (futIdx > curIdx) {
      alerts.push({ level: futIdx - curIdx >= 2 ? 'critical' : 'emerging', area: a, text: `${a.name} is projected to move from ${bandLabel(a.bandKey)} \u2192 ${a.prediction.h1y.band.label} within 12 months.` });
    }
    if (a.rechargeLevel === 'Low' && a.borewell > 65) {
      alerts.push({ level: 'emerging', area: a, text: `${a.name} combines low recharge potential with ${a.borewell}% borewell dependency \u2014 limited buffer if rainfall underperforms.` });
    }
  });
  alerts.sort((x, y) => (x.level === 'critical' ? 0 : 1) - (y.level === 'critical' ? 0 : 1));

  document.getElementById('warnings-list').innerHTML = alerts.length ? alerts.map((al) => `
    <div class="alert-card ${al.level === 'critical' ? 'alert-critical' : 'alert-emerging'}">
      <span class="glyph">${al.level === 'critical' ? '\u{1F534}' : '\u{1F7E0}'}</span>
      <div style="flex:1;">
        <h4>${al.level === 'critical' ? 'Critical Warning' : 'Emerging Risk'} \u2014 ${al.area.name}</h4>
        <p>${al.text}</p>
      </div>
      <button class="ghost-btn" data-open="${al.area.id}">View area</button>
    </div>`).join('') : '<p style="color:var(--muted);">No active alerts in the current dataset.</p>';
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => onOpenArea(b.dataset.open)));
}

function bandLabel(key) {
  const map = { healthy: 'Healthy', watch: 'Watch', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Critical' };
  return map[key] || key;
}
