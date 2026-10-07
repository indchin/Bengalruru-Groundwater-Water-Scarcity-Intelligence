import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('chart.js/auto', () => ({
  default: class MockChart {
    constructor(ctx, config) { this.ctx = ctx; this.config = config; }
    destroy() {}
  },
}));

const mockRunScenario = vi.fn();
vi.mock('../src/api.js', () => ({
  api: { runScenario: (...args) => mockRunScenario(...args) },
}));

const { setAreas, state } = await import('../src/state.js');
const { updateScenario, populateScenarioAreaSelect } = await import('../src/ui/scenario.js');
const { fixtureAreas } = await import('./fixtures.js');

function setSliders({ rain = 0, extract = 0, rwh = 0, recycled = 0, lake = false } = {}) {
  document.getElementById('s-rain').value = rain;
  document.getElementById('s-extract').value = extract;
  document.getElementById('s-rwh').value = rwh;
  document.getElementById('s-recycled').value = recycled;
  document.getElementById('s-lake').checked = lake;
}

beforeEach(() => {
  document.body.innerHTML = `
    <select id="scenario-area"></select>
    <input id="s-rain" type="text" value="0"><span id="s-rain-val"></span>
    <input id="s-extract" type="text" value="0"><span id="s-extract-val"></span>
    <input id="s-rwh" type="text" value="0"><span id="s-rwh-val"></span>
    <input id="s-recycled" type="text" value="0"><span id="s-recycled-val"></span>
    <input id="s-lake" type="checkbox">
    <div id="s-score-baseline"></div>
    <div id="s-score-sim"></div>
    <canvas id="scenario-chart"></canvas>
    <table id="scenario-pred-table"></table>
  `;
  setAreas(fixtureAreas);
  state.charts = {};
  mockRunScenario.mockReset();
});

describe('populateScenarioAreaSelect', () => {
  it('lists every area as a selectable option', () => {
    populateScenarioAreaSelect();
    const options = document.getElementById('scenario-area').querySelectorAll('option');
    expect(options.length).toBe(fixtureAreas.length);
  });
});

describe('updateScenario', () => {
  it('sends the current slider values to the API', async () => {
    populateScenarioAreaSelect();
    document.getElementById('scenario-area').value = 'whitefield';
    setSliders({ rain: -30, extract: 25 });
    mockRunScenario.mockResolvedValue({
      areaId: 'whitefield',
      inputs: { rainDelta: -30, extractDelta: 25, rwhDelta: 0, recycledDelta: 0, lakeRestore: false },
      baseline: { score: 55, band: 'moderate' },
      simulated: { score: 71, band: 'high' },
      prediction: { h3m: { key: 'high' }, h6m: { key: 'high' }, h1y: { key: 'critical' }, h3y: { key: 'critical' }, h5y: { key: 'critical' } },
    });

    await updateScenario();

    expect(mockRunScenario).toHaveBeenCalledWith(expect.objectContaining({ areaId: 'whitefield', rainDelta: -30, extractDelta: 25 }));
  });

  it('renders the baseline and simulated scores returned by the API', async () => {
    populateScenarioAreaSelect();
    document.getElementById('scenario-area').value = 'whitefield';
    mockRunScenario.mockResolvedValue({
      areaId: 'whitefield',
      inputs: { rainDelta: 0, extractDelta: 0, rwhDelta: 0, recycledDelta: 0, lakeRestore: false },
      baseline: { score: 55, band: 'moderate' },
      simulated: { score: 71, band: 'high' },
      prediction: { h3m: { key: 'high' }, h6m: { key: 'high' }, h1y: { key: 'critical' }, h3y: { key: 'critical' }, h5y: { key: 'critical' } },
    });

    await updateScenario();

    expect(document.getElementById('s-score-baseline').innerHTML).toContain('55');
    expect(document.getElementById('s-score-sim').innerHTML).toContain('71');
    expect(document.getElementById('s-score-sim').innerHTML).toContain('High Risk');
  });

  it('shows an error state instead of throwing when the API call fails', async () => {
    populateScenarioAreaSelect();
    document.getElementById('scenario-area').value = 'whitefield';
    mockRunScenario.mockRejectedValue(new Error('network down'));

    await expect(updateScenario()).resolves.not.toThrow();
    expect(document.getElementById('s-score-sim').textContent).toBe('Error');
  });

  it('does nothing gracefully if no area is selected', async () => {
    document.getElementById('scenario-area').innerHTML = '';
    await expect(updateScenario()).resolves.not.toThrow();
    expect(mockRunScenario).not.toHaveBeenCalled();
  });
});
