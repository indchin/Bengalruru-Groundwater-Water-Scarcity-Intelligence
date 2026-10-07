import { describe, it, expect, beforeEach } from 'vitest';
import { setAreas } from '../src/state.js';
import { renderDashboard } from '../src/ui/dashboard.js';
import { fixtureAreas } from './fixtures.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="dashboard-cards"></div>';
  setAreas(fixtureAreas);
});

describe('renderDashboard', () => {
  it('renders one stat card per metric', () => {
    renderDashboard();
    const cards = document.querySelectorAll('#dashboard-cards .stat-card');
    expect(cards.length).toBeGreaterThanOrEqual(8);
  });

  it('counts critical areas correctly from fixture data', () => {
    renderDashboard();
    const html = document.getElementById('dashboard-cards').innerHTML;
    // fixtures.js has exactly 1 critical area (devanahalli)
    expect(html).toMatch(/<div class="num mono">1<\/div>\s*<div class="lbl">Areas in critical condition/);
  });

  it('includes at least one REAL-labeled city-wide stat', () => {
    renderDashboard();
    const html = document.getElementById('dashboard-cards').innerHTML;
    expect(html).toMatch(/REAL:/);
  });
});
