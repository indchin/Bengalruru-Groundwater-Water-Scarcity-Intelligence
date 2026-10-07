import { state } from '../state.js';

export function renderSourcesTab() {
  document.getElementById('source-grid').innerHTML = state.sources.map((s) => `
    <div class="source-card">
      <h4>${s.name} ${s.real ? '<span class="real-tag">REAL</span>' : '<span class="demo-tag">MODEL / COMPUTED</span>'}</h4>
      <div class="meta">
        <div><b>Source:</b> ${s.org}</div>
        <div><b>Date:</b> ${s.date} &nbsp; <b>Resolution:</b> ${s.res}</div>
        <div><b>Unit:</b> ${s.unit} &nbsp; <b>Update freq.:</b> ${s.freq}</div>
        <div><b>Confidence:</b> ${s.conf}</div>
        <div style="margin-top:6px;">${s.note}</div>
      </div>
    </div>`).join('');
}
