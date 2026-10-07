import { describe, it, expect } from 'vitest';
import { round1, clamp, bandChip, confChip, shapeSvg } from '../src/utils/format.js';
import { band } from '../src/utils/bands.js';

describe('round1', () => {
  it('rounds to one decimal place', () => {
    expect(round1(3.14159)).toBe(3.1);
    expect(round1(3.05)).toBeCloseTo(3.1, 1);
  });
});

describe('clamp', () => {
  it('constrains a value to the given range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('bandChip', () => {
  it('renders a span with the band color and label', () => {
    const html = bandChip(band('high'));
    expect(html).toContain('High Risk');
    expect(html).toContain('#C1622B');
  });
});

describe('confChip', () => {
  it('uses distinct emoji per confidence level (not color alone)', () => {
    expect(confChip('High')).toContain('High confidence');
    expect(confChip('Low')).toContain('Low confidence');
    expect(confChip('High')).not.toBe(confChip('Low'));
  });
});

describe('shapeSvg', () => {
  it('produces valid-looking SVG markup for every known shape', () => {
    for (const shape of ['circle', 'triangle', 'square', 'x', 'diamond']) {
      const svg = shapeSvg(shape, '#000000', 24);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('gives circle and square visually distinct markup (shape, not just color)', () => {
    const circle = shapeSvg('circle', '#8C2F26', 24);
    const square = shapeSvg('square', '#8C2F26', 24);
    expect(circle).not.toBe(square);
    expect(circle).toContain('<circle');
    expect(square).toContain('<rect');
  });
});
