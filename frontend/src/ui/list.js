import { state } from '../state.js';
import { band, bandIndex } from '../utils/bands.js';
import { round1, confChip } from '../utils/format.js';

let onRowOpen = () => {};

function bandChipSmall(b) {
  return `<span class="band-chip" style="background:${b.hex}; font-size:0.68rem;">${b.label}</span>`;
}

export function initList(rowOpenHandler) {
  onRowOpen = rowOpenHandler;
  document.getElementById('list-search').addEventListener('input', renderList);
  document.getElementById('list-sort').addEventListener('change', renderList);
  document.getElementById('list-filter-band').addEventListener('change', renderList);
}

export function renderList() {
  const q = document.getElementById('list-search').value.trim().toLowerCase();
  const sortKey = document.getElementById('list-sort').value;
  const filterBand = document.getElementById('list-filter-band').value;
  let rows = state.areas.filter((a) => a.name.toLowerCase().includes(q) && (filterBand === 'all' || band(a.bandKey).label === filterBand));

  const sorters = {
    'crisis-desc': (a, b2) => b2.crisisScore - a.crisisScore, 'crisis-asc': (a, b2) => a.crisisScore - b2.crisisScore,
    'level-desc': (a, b2) => b2.current - a.current, 'level-asc': (a, b2) => a.current - b2.current,
    'decline-desc': (a, b2) => b2.yoyPct - a.yoyPct, 'decline-asc': (a, b2) => a.yoyPct - b2.yoyPct,
    'pred-desc': (a, b2) => bandIndex(b2.prediction.h1y.band.key) - bandIndex(a.prediction.h1y.band.key),
    'pred-asc': (a, b2) => bandIndex(a.prediction.h1y.band.key) - bandIndex(b2.prediction.h1y.band.key),
    'conf-desc': (a, b2) => b2.confScore - a.confScore, 'conf-asc': (a, b2) => a.confScore - b2.confScore,
  };
  rows = rows.sort(sorters[sortKey]);
  document.getElementById('list-count').textContent = `${rows.length} of ${state.areas.length} areas`;
  document.getElementById('area-table-body').innerHTML = rows.map((a) => `
    <tr tabindex="0" data-id="${a.id}">
      <td><strong>${a.name}</strong></td>
      <td>${a.zone}</td>
      <td class="mono">${round1(a.current)}</td>
      <td class="mono">${a.yoyPct >= 0 ? '+' : ''}${a.yoyPct}%</td>
      <td class="mono">${a.fiveYrDeltaPct >= 0 ? '+' : ''}${a.fiveYrDeltaPct}%</td>
      <td class="mono">${a.crisisScore}</td>
      <td>${bandChipSmall(band(a.bandKey))}</td>
      <td class="mono">${a.water_sources.groundwater}%</td>
      <td>${bandChipSmall(band(bandKeyFromQuality(a)))}</td>
      <td>${bandChipSmall(a.prediction.h1y.band)}</td>
      <td>${confChip(a.confidence)}</td>
    </tr>`).join('');
  document.querySelectorAll('#area-table-body tr').forEach((tr) => {
    tr.addEventListener('click', () => onRowOpen(tr.dataset.id));
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') onRowOpen(tr.dataset.id); });
  });
}

function bandKeyFromQuality(a) {
  const inv = 100 - a.drinking.qualityScore;
  if (inv <= 20) return 'healthy';
  if (inv <= 40) return 'watch';
  if (inv <= 60) return 'moderate';
  if (inv <= 80) return 'high';
  return 'critical';
}
