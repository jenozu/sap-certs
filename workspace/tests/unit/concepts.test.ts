import { describe, expect, it } from 'vitest';
import { resolveConcepts } from '@/lib/practice/concepts';
describe('resolveConcepts', () => {
  it('maps the owner priorities to seed concepts without duplicates', () => {
    const r = resolveConcepts('with clause, Left Join, cross joins, UNION, union all, CTE', 'SQL');
    expect(r.map(c => c.id)).toEqual(['sql-cte', 'sql-left-join', 'sql-cross-join', 'sql-union', 'sql-union-all']);
    expect(r.every(c => c.language === 'sql')).toBe(true);
  });
  it('creates stable ids for unknown concepts in any language', () => {
    const r = resolveConcepts('Closures\nArray.map, async/await', 'JavaScript');
    expect(r.map(c => c.id)).toEqual(['javascript-closure', 'javascript-array-map', 'javascript-async-await']);
    expect(resolveConcepts('closures', 'javascript', [{ id: 'javascript-closure', name: 'Closures', language: 'javascript', aliases: [] }])[0].isNew).toBe(false);
  });
});
