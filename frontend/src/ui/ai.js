import { state } from '../state.js';
import { bandIndex } from '../utils/bands.js';

let onCompareOpen = () => {};
let onSwitchTab = () => {};

export function initAI({ compareOpen, switchTab }) {
  onCompareOpen = compareOpen;
  onSwitchTab = switchTab;

  document.getElementById('ai-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('ai-input');
    submitAIQuestion(input.value);
    input.value = '';
  });
}

export function renderAISuggestions() {
  const suggestions = [
    'Which areas have the highest groundwater crisis?',
    'Why is Whitefield at high risk?',
    'Which areas are most dependent on borewells?',
    'Compare Whitefield and Yelahanka',
    'What areas could face severe water scarcity next year?',
  ];
  document.getElementById('ai-suggest').innerHTML = suggestions.map((s) => `<button type="button">${s}</button>`).join('');
  document.querySelectorAll('#ai-suggest button').forEach((b) => b.addEventListener('click', () => submitAIQuestion(b.textContent)));
}

export function greetAI() {
  aiLog('bot', "Hi \u2014 ask me about Bengaluru's groundwater crisis, drivers for a specific area, or how two areas compare. I answer using this app's own dataset (fetched live from the API).");
}

function aiLog(role, html) {
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function findAreaMention(text) {
  const t = text.toLowerCase();
  return state.areas.find((a) => t.includes(a.name.toLowerCase())) || null;
}

export function answerAI(qRaw) {
  const q = qRaw.toLowerCase();
  if (/(highest|worst|most).*(crisis|risk|stress)/.test(q)) {
    const top = [...state.areas].sort((a, b) => b.crisisScore - a.crisisScore).slice(0, 5);
    return `Highest groundwater crisis right now: ${top.map((a) => `<b>${a.name}</b> (${a.crisisScore}, ${bandLabel(a.bandKey)})`).join(', ')}.`;
  }
  if (/(improved|recovered|better).*(5|five)?.*(year)?/.test(q)) {
    const improved = [...state.areas].sort((a, b) => a.fiveYrDeltaPct - b.fiveYrDeltaPct).slice(0, 5);
    return `Smallest 5-year decline (relatively "improved" vs peers): ${improved.map((a) => `<b>${a.name}</b> (${a.fiveYrDeltaPct}% over 5 yrs)`).join(', ')}. Note: in this dataset almost every area still worsened somewhat \u2014 these simply worsened the least.`;
  }
  if (/borewell/.test(q) && /(most|highest|dependen)/.test(q)) {
    const top = [...state.areas].sort((a, b) => b.borewell - a.borewell).slice(0, 5);
    return `Most borewell-dependent areas: ${top.map((a) => `<b>${a.name}</b> (${a.borewell}%)`).join(', ')}.`;
  }
  if (/compare/.test(q) || (q.match(/ and /) && findAreaMention(q))) {
    const names = state.areas.filter((a) => q.includes(a.name.toLowerCase()));
    if (names.length >= 2) {
      state.compareIds = names.slice(0, 4).map((a) => a.id);
      onCompareOpen();
      onSwitchTab('compare');
      return `Opened a comparison for ${names.map((a) => a.name).join(' vs ')} in the Compare Areas tab.`;
    }
  }
  if (/why/.test(q)) {
    const a = findAreaMention(q);
    if (a) return `<b>${a.name}</b> is at ${bandLabel(a.bandKey)} (score ${a.crisisScore}). Primary drivers: ${a.drivers.map((d) => '\u2022 ' + d).join('<br>')}`;
  }
  if (/severe|scarcity|next year|future/.test(q)) {
    const top = [...state.areas].sort((a, b) => bandIndex(b.prediction.h1y.band.key) - bandIndex(a.prediction.h1y.band.key)).slice(0, 5);
    return `Areas with the highest predicted 1-year water-scarcity band: ${top.map((a) => `<b>${a.name}</b> (${a.prediction.h1y.band.label})`).join(', ')}.`;
  }
  const a = findAreaMention(q);
  if (a) {
    return `<b>${a.name}</b> \u2014 ${a.zone}. Current groundwater: ${Math.round(a.current * 10) / 10} m bgl (${bandLabel(a.bandKey)}, score ${a.crisisScore}). Groundwater dependency ${a.water_sources.groundwater}%, Cauvery ${a.water_sources.cauvery}%. 1-yr prediction: ${a.prediction.h1y.band.label}. Click "${a.name}" in Map or List view for the full picture.`;
  }
  return "I can answer from this app's own dataset \u2014 try asking about the highest-crisis areas, why a specific area (e.g. Whitefield) is at risk, borewell dependency, predicted scarcity, or \"compare X and Y\".";
}

function bandLabel(key) {
  const map = { healthy: 'Healthy', watch: 'Watch', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Critical' };
  return map[key] || key;
}

function submitAIQuestion(q) {
  if (!q.trim()) return;
  aiLog('user', q);
  const ans = answerAI(q);
  setTimeout(() => aiLog('bot', ans), 180);
}
