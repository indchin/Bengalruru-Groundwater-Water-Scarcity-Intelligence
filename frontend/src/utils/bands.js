// Mirrors backend/src/db/model.js BAND_DEF exactly (by design — the backend
// is the source of truth for band THRESHOLDS since it computes bandKey, but
// the frontend needs its own copy of display metadata: color/shape/label).
// If you change the bands on the backend, update this table too — a small,
// explicit duplication that's easier to reason about than sharing a package
// across two independently-deployable apps for five constants.
export const BAND_DEF = {
  healthy:  { key: 'healthy',  label: 'Healthy',      hex: '#1B6FA8', shape: 'circle',   desc: 'Groundwater stable, low dependency pressure' },
  watch:    { key: 'watch',    label: 'Watch',         hex: '#2E8F82', shape: 'circle',   desc: 'Early signs of stress, worth monitoring' },
  moderate: { key: 'moderate', label: 'Moderate Risk', hex: '#C9A227', shape: 'triangle', desc: 'Clear decline trend, mixed source dependency' },
  high:     { key: 'high',     label: 'High Risk',     hex: '#C1622B', shape: 'square',   desc: 'Fast decline, heavy borewell/tanker reliance' },
  critical: { key: 'critical', label: 'Critical',      hex: '#8C2F26', shape: 'x',        desc: 'Severe / extreme stress, urgent intervention zone' },
};
export const BAND_ORDER = ['healthy', 'watch', 'moderate', 'high', 'critical'];

export function band(bandKey) {
  return BAND_DEF[bandKey] || BAND_DEF.watch;
}

export function bandIndex(bandKey) {
  return BAND_ORDER.indexOf(bandKey);
}
