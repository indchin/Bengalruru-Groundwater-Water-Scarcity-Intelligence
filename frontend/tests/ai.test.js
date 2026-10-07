import { describe, it, expect, beforeEach } from 'vitest';
import { setAreas, state } from '../src/state.js';
import { answerAI } from '../src/ui/ai.js';
import { fixtureAreas } from './fixtures.js';

beforeEach(() => {
  setAreas(fixtureAreas);
  state.compareIds = [];
});

describe('answerAI', () => {
  it('answers "highest crisis" using real computed scores, not generic knowledge', () => {
    const ans = answerAI('Which areas have the highest groundwater crisis?');
    expect(ans).toContain('Devanahalli'); // crisisScore 92, highest in fixtures
  });

  it("answers \"why is X at risk\" with that area's actual drivers", () => {
    const ans = answerAI('Why is Whitefield at high risk?');
    expect(ans).toContain('Whitefield');
    expect(ans).toContain('borewells');
  });

  it('answers borewell-dependency questions from the dataset', () => {
    const ans = answerAI('Which areas are most dependent on borewells?');
    expect(ans).toContain('Devanahalli'); // borewell 88%, highest
  });

  it('triggers a comparison and updates shared state for "compare X and Y"', () => {
    const ans = answerAI('Compare Whitefield and Jayanagar');
    expect(state.compareIds).toContain('whitefield');
    expect(state.compareIds).toContain('jayanagar');
    expect(ans).toContain('Compare Areas tab');
  });

  it('falls back to a helpful message for unrecognized questions', () => {
    const ans = answerAI('asdkjhasdkjh nonsense query 12345');
    expect(ans).toMatch(/this app's own dataset/);
  });

  it('never fabricates a place that is not in the dataset', () => {
    const ans = answerAI('Tell me about Mumbai');
    expect(ans).not.toContain('Mumbai');
  });
});
