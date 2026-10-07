import { describe, it, expect } from 'vitest';
import { band, bandIndex, BAND_ORDER, BAND_DEF } from '../src/utils/bands.js';

describe('band()', () => {
  it('resolves a known key to its display metadata', () => {
    const b = band('critical');
    expect(b.label).toBe('Critical');
    expect(b.hex).toBe('#8C2F26');
  });

  it('falls back to "watch" for an unknown key rather than throwing', () => {
    expect(() => band('not-a-real-band')).not.toThrow();
    expect(band('not-a-real-band').key).toBe('watch');
  });
});

describe('bandIndex()', () => {
  it('orders bands from healthy (0) to critical (4)', () => {
    expect(bandIndex('healthy')).toBe(0);
    expect(bandIndex('critical')).toBe(4);
    expect(bandIndex('critical')).toBeGreaterThan(bandIndex('healthy'));
  });
});

describe('BAND_DEF / BAND_ORDER consistency', () => {
  it('has a display entry for every key in BAND_ORDER', () => {
    for (const key of BAND_ORDER) {
      expect(BAND_DEF[key]).toBeDefined();
      expect(BAND_DEF[key].label).toBeTruthy();
      expect(BAND_DEF[key].hex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
