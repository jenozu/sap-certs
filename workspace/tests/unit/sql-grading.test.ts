import { beforeAll, describe, expect, it } from 'vitest';
import { createNodeSqlRunner } from '@/lib/practice/adapters/sql/node-runner';
import { evaluateSqlExercise, sqlGradingSchema, type SqlRunner } from '@/lib/practice/adapters/sql/grading';
import { hasConstruct, missingConstructs } from '@/lib/practice/adapters/sql/constructs';
import { isSupported, loadAdapter, languageInfo } from '@/lib/practice/adapters/registry';

const A = `CREATE TABLE c(id INTEGER, name TEXT); CREATE TABLE o(id INTEGER, cid INTEGER, total REAL);
INSERT INTO c VALUES (1,'Acme'),(2,'Birch'),(3,'Cedar'); INSERT INTO o VALUES (10,1,99.5),(11,1,0.1),(12,3,5);`;
const B = `CREATE TABLE c(id INTEGER, name TEXT); CREATE TABLE o(id INTEGER, cid INTEGER, total REAL);
INSERT INTO c VALUES (1,'Delta'),(2,'Echo'),(4,'Fox'); INSERT INTO o VALUES (20,2,1),(21,4,0.2),(22,4,0.1);`;
const fixtures = { A, B };
const solution = 'SELECT c.name FROM c LEFT JOIN o ON o.cid = c.id WHERE o.id IS NULL;';
const g = sqlGradingSchema.parse({ fixtures: ['A', 'B'], requiredConstructs: ['LEFT JOIN'] });
let runner: SqlRunner;
beforeAll(async () => { runner = await createNodeSqlRunner(); });

describe('SQL evaluator', () => {
  it('accepts the reference and an equivalent query with different aliases/order', async () => {
    expect((await evaluateSqlExercise(solution, solution, g, fixtures, runner)).passed).toBe(true);
    const alt = 'select x.name as customer from c x left join o y on x.id = y.cid where y.cid is null order by 1 desc';
    expect((await evaluateSqlExercise(alt, solution, g, fixtures, runner)).passed).toBe(true);
  });
  it('fails hard-coded answers via the second fixture', async () => {
    const r = await evaluateSqlExercise("SELECT 'Birch' AS name", solution, { ...g, requiredConstructs: [] }, fixtures, runner);
    expect(r.checks.map(c => c.passed)).toEqual([true, false]);
    expect(r.passed).toBe(false);
  });
  it('reports a missing construct separately from correctness', async () => {
    const notExists = 'SELECT name FROM c WHERE id NOT IN (SELECT cid FROM o)';
    const r = await evaluateSqlExercise(notExists, solution, g, fixtures, runner);
    expect(r.correct).toBe(true);
    expect(r.constructOk).toBe(false);
    expect(r.passed).toBe(false);
  });
  it('compares numbers with tolerance and handles empty results and errors', async () => {
    const sum = 'SELECT round(sum(total)) FROM o';
    const g2 = sqlGradingSchema.parse({ fixtures: ['A', 'B'] });
    expect((await evaluateSqlExercise('SELECT sum(total) * 1.0 FROM o', 'SELECT sum(total) FROM o', g2, fixtures, runner)).passed).toBe(true);
    expect((await evaluateSqlExercise(sum, 'SELECT sum(total) FROM o', g2, fixtures, runner)).passed).toBe(false);
    expect((await evaluateSqlExercise('SELECT * FROM c WHERE 1=0', 'SELECT * FROM c WHERE id < 0', g2, fixtures, runner)).passed).toBe(true);
    const err = await evaluateSqlExercise('SELEC nope', solution, g2, fixtures, runner);
    expect(err.passed).toBe(false); expect(err.checks[0].detail).toMatch(/syntax/i);
  });
  it('grades data-changing exercises with checkQuery', async () => {
    const g3 = sqlGradingSchema.parse({ fixtures: ['A', 'B'], checkQuery: 'SELECT id, name FROM c ORDER BY id' });
    const sol = "UPDATE c SET name = upper(name) WHERE id = 1";
    expect((await evaluateSqlExercise("UPDATE c SET name = UPPER(name) WHERE id IN (1)", sol, g3, fixtures, runner)).passed).toBe(true);
    expect((await evaluateSqlExercise("UPDATE c SET name = upper(name)", sol, g3, fixtures, runner)).passed).toBe(false);
  });
  it('flags a broken reference solution as a content error', async () => {
    const r = await evaluateSqlExercise(solution, 'SELECT nope FROM missing', g, fixtures, runner);
    expect(r.error).toMatch(/Reference solution failed/);
  });
});

describe('construct check', () => {
  it('ignores comments and strings; distinguishes UNION from UNION ALL', () => {
    expect(hasConstruct("SELECT 'left join' -- LEFT JOIN\nFROM a", 'LEFT JOIN')).toBe(false);
    expect(hasConstruct('select * from a left   join b on 1', 'LEFT JOIN')).toBe(true);
    expect(hasConstruct('select 1 union all select 2', 'UNION')).toBe(false);
    expect(hasConstruct('select 1 union select 2', 'UNION')).toBe(true);
    expect(hasConstruct('select 1 union all select 2', 'UNION ALL')).toBe(true);
    expect(hasConstruct('WITH t AS (SELECT 1) SELECT * FROM t', 'WITH')).toBe(true);
    expect(missingConstructs('select 1', ['CROSS JOIN', 'WITH'])).toEqual(['CROSS JOIN', 'WITH']);
  });
});

describe('language registry', () => {
  it('has SQL available and other languages planned; unknown is unsupported', async () => {
    expect(isSupported('SQL')).toBe(true);
    expect(languageInfo('javascript')?.status).toBe('planned');
    expect(isSupported('cobol')).toBe(false);
    expect(await loadAdapter('cobol')).toBeNull();
  });
});
