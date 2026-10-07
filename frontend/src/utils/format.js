export function round1(v) { return Math.round(v * 10) / 10; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function bandChip(b) {
  return `<span class="band-chip" style="background:${b.hex};">${b.label}</span>`;
}

export function confChip(conf) {
  const dot = conf === 'High' ? '\u{1F7E2}' : conf === 'Medium' ? '\u{1F7E1}' : '\u{1F534}';
  return `<span class="confidence-chip">${dot} ${conf} confidence</span>`;
}

export function shapeSvg(shape, hex, size) {
  const s = size;
  const common = `width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"`;
  if (shape === 'circle') return `<svg ${common}><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1.5}" fill="${hex}" stroke="#0E1B24" stroke-width="1.4"/></svg>`;
  if (shape === 'triangle') return `<svg ${common}><polygon points="${s / 2},2 ${s - 2},${s - 2} 2,${s - 2}" fill="${hex}" stroke="#0E1B24" stroke-width="1.4"/></svg>`;
  if (shape === 'square') return `<svg ${common}><rect x="2" y="2" width="${s - 4}" height="${s - 4}" rx="2" fill="${hex}" stroke="#0E1B24" stroke-width="1.4"/></svg>`;
  if (shape === 'x') return `<svg ${common}><g stroke="${hex}" stroke-width="${s * 0.28}" stroke-linecap="round"><line x1="3" y1="3" x2="${s - 3}" y2="${s - 3}"/><line x1="${s - 3}" y1="3" x2="3" y2="${s - 3}"/></g></svg>`;
  return `<svg ${common}><polygon points="${s / 2},1 ${s - 1},${s / 2} ${s / 2},${s - 1} 1,${s / 2}" fill="${hex}" stroke="#0E1B24" stroke-width="1.4"/></svg>`;
}
