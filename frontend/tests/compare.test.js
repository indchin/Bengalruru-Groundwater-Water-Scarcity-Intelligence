import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chart.js needs a real <canvas> 2D context, which jsdom doesn't implement.
// Mocking it here lets us test the actual DOM/state logic in compare.js
// without pulling in a native canvas dependency just for tests.
vi.mock('chart.js/auto', () => ({
  default: class MockChart {
    constructor(ctx, config) { this.ctx = ctx; this.config = config; }
    destroy() {}
  },
}));

const { setAreas, state } = await import('../src/state.js');
const { toggleCompare, renderCompare } = await import('../src/ui/compare.js');
const { fixtureAreas } = await import('./fixtures.js');

beforeEach(() => {
  document.body.innerHTML = `
    <div id="compare-picker"></div>
    <div id="compare-empty"></div>
    <div id="compare-content"><canvas id="compare-line-chart"></canvas><div id="compare-cards"></div></div>
  `;
  setAreas(fixtureAreas);
  state.compareIds = [];
  state.charts = {};
});

describe('toggleCompare / renderCompare', () => {
  it('shows the empty state with fewer than 2 areas selected', () => {
    toggleCompare('whitefield');
    expect(document.getElementById('compare-empty').style.display).not.toBe('none');
    expect(document.getElementById('compare-content').style.display).toBe('none');
  });

  it('shows comparison content once 2+ areas are selected', () => {
    toggleCompare('whitefield');
    toggleCompare('jayanagar');
    expect(document.getElementById('compare-content').style.display).toBe('block');
    expect(document.getElementById('compare-empty').style.display).toBe('none');
  });

  it('caps the comparison at 4 areas, evicting the oldest on a 5th add', () => {
    ['whitefield', 'jayanagar', 'devanahalli', 'yelahanka'].forEach(toggleCompare);
    expect(state.compareIds).toHaveLength(4);
    expect(state.compareIds).toContain('whitefield');
    // adding a distinct 5th selection should evict the first-added (whitefield)
    toggleCompare('koramangala-not-in-fixtures'); // simulate a 5th distinct pick
    expect(state.compareIds).toHaveLength(4);
    expect(state.compareIds).not.toContain('whitefield');
  });

  it('removes an area when its chip remove-button is clicked', () => {
    toggleCompare('whitefield');
    toggleCompare('jayanagar');
    const removeBtn = document.querySelector('[data-remove="whitefield"]');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();
    expect(state.compareIds).not.toContain('whitefield');
  });

  it('renders a stat card mentioning each compared area by name', () => {
    toggleCompare('whitefield');
    toggleCompare('devanahalli');
    renderCompare();
    const html = document.getElementById('compare-cards').innerHTML;
    expect(html).toContain('Whitefield');
    expect(html).toContain('Devanahalli');
  });
});
