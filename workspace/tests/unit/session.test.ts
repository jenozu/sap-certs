import { describe, expect, it } from 'vitest';
import { pickExercises } from '@/lib/practice/client/session';
const all = [
  { id: 'a', skills: ['sql-cte'], difficulty: 'intro' }, { id: 'b', skills: ['sql-cte'], difficulty: 'core' },
  { id: 'c', skills: ['sql-union'], difficulty: 'intro' }, { id: 'd', skills: ['sql-cte', 'sql-union'], difficulty: 'stretch' },
];
describe('pickExercises', () => {
  it('filters by any selected concept and difficulty, unattempted first, then failed, then passed', () => {
    expect(pickExercises(all, { skills: ['sql-cte'], difficulty: [], count: 10 }, new Set(['a']), new Set(['a', 'b']))).toEqual(['d', 'b', 'a']);
    expect(pickExercises(all, { skills: ['sql-union'], difficulty: ['intro'], count: 10 }, new Set(), new Set())).toEqual(['c']);
    expect(pickExercises(all, { skills: [], difficulty: [], count: 2 }, new Set(), new Set())).toHaveLength(2);
  });
});
