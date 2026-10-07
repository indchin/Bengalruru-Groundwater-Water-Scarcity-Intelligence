import { describe, it, expect, beforeEach } from 'vitest';
import { setAreas } from '../src/state.js';
import { initList, renderList } from '../src/ui/list.js';
import { fixtureAreas } from './fixtures.js';

beforeEach(() => {
  document.body.innerHTML = `
    <input id="list-search" value="">
    <input id="list-sort" value="crisis-desc">
    <input id="list-filter-band" value="all">
    <span id="list-count"></span>
    <table><tbody id="area-table-body"></tbody></table>
  `;
  setAreas(fixtureAreas);
  initList(() => {});
});

describe('renderList', () => {
  it('renders one row per area by default', () => {
    renderList();
    const rows = document.querySelectorAll('#area-table-body tr');
    expect(rows.length).toBe(fixtureAreas.length);
  });

  it('sorts by crisis score descending', () => {
    document.getElementById('list-sort').value = 'crisis-desc';
    renderList();
    const rows = [...document.querySelectorAll('#area-table-body tr')];
    expect(rows[0].dataset.id).toBe('devanahalli'); // highest crisisScore (92)
    expect(rows[rows.length - 1].dataset.id).toBe('jayanagar'); // lowest (18)
  });

  it('sorts by crisis score ascending when requested', () => {
    document.getElementById('list-sort').value = 'crisis-asc';
    renderList();
    const rows = [...document.querySelectorAll('#area-table-body tr')];
    expect(rows[0].dataset.id).toBe('jayanagar');
  });

  it('filters by search text', () => {
    document.getElementById('list-search').value = 'white';
    renderList();
    const rows = document.querySelectorAll('#area-table-body tr');
    expect(rows.length).toBe(1);
    expect(rows[0].dataset.id).toBe('whitefield');
  });

  it('filters by crisis band', () => {
    document.getElementById('list-filter-band').value = 'Critical';
    renderList();
    const rows = document.querySelectorAll('#area-table-body tr');
    expect(rows.length).toBe(1);
    expect(rows[0].dataset.id).toBe('devanahalli');
  });

  it('updates the visible count label', () => {
    document.getElementById('list-search').value = 'jaya';
    renderList();
    expect(document.getElementById('list-count').textContent).toContain(`1 of ${fixtureAreas.length}`);
  });

  it('invokes the open-handler when a row is clicked', () => {
    let opened = null;
    initList((id) => { opened = id; });
    renderList();
    document.querySelector('#area-table-body tr[data-id="whitefield"]').click();
    expect(opened).toBe('whitefield');
  });
});
