import { describe, it, expect, beforeEach } from 'vitest';
import { setAreas } from '../src/state.js';
import { initWarnings, renderWarnings } from '../src/ui/warnings.js';
import { fixtureAreas } from './fixtures.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="warnings-list"></div>';
  setAreas(fixtureAreas);
});

describe('renderWarnings', () => {
  it('flags whitefield (band escalates moderate -> critical) as a warning', () => {
    initWarnings(() => {});
    renderWarnings();
    const html = document.getElementById('warnings-list').innerHTML;
    expect(html).toContain('Whitefield');
  });

  it('does not flag jayanagar (stable, high confidence, no escalation) as critical', () => {
    initWarnings(() => {});
    renderWarnings();
    const criticalCards = [...document.querySelectorAll('.alert-critical')];
    const mentionsJayanagar = criticalCards.some((c) => c.textContent.includes('Jayanagar'));
    expect(mentionsJayanagar).toBe(false);
  });

  it('lets the user open the flagged area from a warning card', () => {
    let opened = null;
    initWarnings((id) => { opened = id; });
    renderWarnings();
    const btn = document.querySelector('[data-open="whitefield"]');
    expect(btn).toBeTruthy();
    btn.click();
    expect(opened).toBe('whitefield');
  });
});
