import L from 'leaflet';
import { state } from '../state.js';
import { band, bandIndex, BAND_ORDER, BAND_DEF } from '../utils/bands.js';
import { round1, shapeSvg, clamp } from '../utils/format.js';

let map, markerLayer, lakeLayer;
let onAreaClick = () => {};

const LAKES = [
  { name: 'Bellandur Lake', lat: 12.9260, lng: 77.6650, note: "REAL: ~800 acres; one of Bengaluru's largest lakes, with long-documented pollution and a rejuvenation still incomplete as of early 2025 (Deccan Herald, 28 Jan 2025)." },
  { name: 'Varthur Lake', lat: 12.9410, lng: 77.7420, note: 'REAL: ~800 acres, downstream of Bellandur; named alongside it as an incomplete rejuvenation priority (Deccan Herald, 28 Jan 2025).' },
  { name: 'Hebbal Lake', lat: 13.0455, lng: 77.5950, note: 'Rejuvenated lake in North Bengaluru, supports local recharge.' },
  { name: 'Ulsoor Lake', lat: 12.9815, lng: 77.6205, note: 'Historic central-Bengaluru lake.' },
];

export function initMap(clickHandler) {
  onAreaClick = clickHandler;
  map = L.map('map-canvas', { scrollWheelZoom: true }).setView([12.98, 77.66], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  lakeLayer = L.layerGroup();
  renderMarkers();
}

function valueForLayer(area) {
  const hist = area.hist || [];
  const h = hist[state.yearIdx] || { level: area.current, rainfall_mm: 0, rainIdx: 1 };
  switch (state.layer) {
    case 'crisis':
      return { band: band(area.bandKey), txt: area.crisisScore + ' / 100' };
    case 'current':
      return { band: band(bandKeyFromScore(clamp((h.level - 10) / 70 * 100, 0, 100))), txt: round1(h.level) + ' m bgl' };
    case 'decline': {
      const prevH = hist[Math.max(0, state.yearIdx - 1)] || h;
      const d = round1(h.level - prevH.level);
      return { band: band(bandKeyFromScore(clamp(d / 6 * 100, 0, 100))), txt: (d >= 0 ? '+' : '') + d + ' m' };
    }
    case 'recharge': {
      const inv = 100 - area.rechargeScore;
      return { band: band(bandKeyFromScore(inv)), txt: area.rechargeLevel };
    }
    case 'borewell':
      return { band: band(bandKeyFromScore(area.borewell)), txt: area.borewell + '%' };
    case 'drinking': {
      const v = clamp(100 - area.water_sources.cauvery - area.water_sources.rainwater, 0, 100);
      return { band: band(bandKeyFromScore(v)), txt: area.drinking.availability };
    }
    case 'cauvery': {
      const inv = 100 - area.water_sources.cauvery;
      return { band: band(bandKeyFromScore(inv)), txt: area.water_sources.cauvery + '% Cauvery' };
    }
    case 'quality': {
      const inv = 100 - area.drinking.qualityScore;
      return { band: band(bandKeyFromScore(inv)), txt: area.drinking.qualityStatus };
    }
    case 'rainfall': {
      const r = h.rainfall_mm;
      const inv = clamp((1000 - r) / 8, 0, 100);
      return { band: band(bandKeyFromScore(inv)), txt: r + ' mm' };
    }
    case 'prediction': {
      const p = area.prediction[state.horizon];
      return { band: band(p.band.key), txt: p.band.label + ' (' + p.confidence + ' conf.)' };
    }
    default:
      return { band: band(area.bandKey), txt: area.crisisScore };
  }
}

function bandKeyFromScore(score) {
  if (score <= 20) return 'healthy';
  if (score <= 40) return 'watch';
  if (score <= 60) return 'moderate';
  if (score <= 80) return 'high';
  return 'critical';
}

export function renderMarkers() {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  state.areas.forEach((area) => {
    const val = valueForLayer(area);
    const shape = state.showShapes ? val.band.shape : 'circle';
    const size = 26;
    const icon = L.divIcon({
      className: 'gw-marker', html: `<span class="shape">${shapeSvg(shape, val.band.hex, size)}</span>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });
    const m = L.marker([area.lat, area.lng], { icon, keyboard: true, title: `${area.name}: ${val.band.label}` });
    m.bindTooltip(`<strong>${area.name}</strong><br>${val.band.label} \u00b7 ${val.txt}${area.isRealAnchor ? ' <span style="color:#0E4C71">(real anchor)</span>' : ''}`, { direction: 'top', offset: [0, -14] });
    m.on('click', () => onAreaClick(area.id));
    m.addTo(markerLayer);
  });

  if (state.showLakes) {
    lakeLayer.clearLayers();
    LAKES.forEach((l) => {
      const mk = L.circleMarker([l.lat, l.lng], { radius: 8, color: '#0E4C71', weight: 2, fillColor: '#5FB2D8', fillOpacity: 0.85 });
      mk.bindPopup(`<strong>${l.name}</strong><br>${l.note}`);
      mk.addTo(lakeLayer);
    });
    lakeLayer.addTo(map);
  } else if (map.hasLayer(lakeLayer)) {
    map.removeLayer(lakeLayer);
  }
}

export function renderGauge() {
  const shaft = document.getElementById('gauge-shaft');
  const ctx = document.getElementById('gauge-context');
  const labels = {
    crisis: 'Water Stress / Crisis Score (0-100)', current: 'Depth to groundwater (m below ground)', decline: 'Year-on-year change',
    recharge: 'Recharge potential (inverted = risk)', borewell: 'Borewell dependency (%)', drinking: 'Drinking-water risk proxy',
    cauvery: 'Cauvery-supply gap', quality: 'Drinking/groundwater quality risk', rainfall: 'Rainfall deficit proxy', prediction: 'Predicted scarcity band',
  };
  ctx.textContent = labels[state.layer] || 'Crisis Score';
  shaft.innerHTML = BAND_ORDER.map((key, i) => {
    const b = BAND_DEF[key];
    return `
    <div class="gauge-band" style="border-left-color:${b.hex};">
      <span class="tick">${i * 20}-${Math.min((i + 1) * 20, 100)}</span>
      <div class="name">${state.showShapes ? `<span class="shape-swatch shape-${b.shape}" style="background:${b.hex};"></span>` : ''}${b.label}</div>
      <div class="desc">${b.desc}</div>
    </div>`;
  }).join('');
}

export { bandIndex };
