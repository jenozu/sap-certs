// SQL grading spec (pack test file, language "sql") and the fixture-based evaluator.
// Backward compatible with playground test files: tests with expectedRows still work.
import { z } from 'zod';
import type { ExecutionResult } from '../../../../vendor/playground/types/execution';
import type { Evaluation, Check } from '../types';
import { missingConstructs } from './constructs';

export const sqlGradingSchema = z.object({
  /** Fixture ids (dataset variants). Results are compared on every fixture. */
  fixtures: z.array(z.string().min(1)).min(1),
  requiredConstructs: z.array(z.string().min(1)).default([]),
  orderMatters: z.boolean().default(false),
  /** Compare column names too (default false: aliases may differ). */
  compareColumns: z.boolean().default(false),
  numericTolerance: z.number().min(0).max(1).default(1e-9),
  /** For data-changing exercises: compare the result of this query after running the code. */
  checkQuery: z.string().optional(),
});
export type SqlGrading = z.infer<typeof sqlGradingSchema>;

export interface SqlRunner {
  /** Fresh database from the fixture, then run code (multiple statements allowed). */
  run(fixtureSql: string, code: string): Promise<ExecutionResult>;
  /** Same fresh database: run code, then query (for checkQuery). */
  runThen(fixtureSql: string, code: string, query: string): Promise<ExecutionResult>;
}

type Table = { columns: string[]; rows: unknown[][] };
const lastTable = (r: ExecutionResult): Table => r.tables?.at(-1) ?? r.table ?? { columns: [], rows: [] };

function cellEq(a: unknown, b: unknown, tol: number) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  return a === b;
}
const sortKey = (row: unknown[]) => JSON.stringify(row.map(v => (typeof v === 'number' ? Number(v.toPrecision(12)) : v)));

export function sameResult(actual: Table, expected: Table, g: SqlGrading): { ok: boolean; why?: string } {
  if (g.compareColumns && JSON.stringify(actual.columns) !== JSON.stringify(expected.columns))
    return { ok: false, why: `Columns differ: expected ${expected.columns.join(', ')}; got ${actual.columns.join(', ')}` };
  if (actual.columns.length !== expected.columns.length && expected.rows.length > 0)
    return { ok: false, why: `Expected ${expected.columns.length} column(s), got ${actual.columns.length}` };
  if (actual.rows.length !== expected.rows.length) return { ok: false, why: `Expected ${expected.rows.length} row(s), got ${actual.rows.length}` };
  const a = g.orderMatters ? actual.rows : [...actual.rows].sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  const e = g.orderMatters ? expected.rows : [...expected.rows].sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  for (let i = 0; i < e.length; i++) {
    if (a[i].length !== e[i].length || !e[i].every((v, j) => cellEq(a[i][j], v, g.numericTolerance)))
      return { ok: false, why: `Row ${i + 1} differs${g.orderMatters ? ' (order matters here)' : ''}` };
  }
  return { ok: true };
}

/** Grades `code` against the reference `solution` on every fixture. */
export async function evaluateSqlExercise(code: string, solution: string, g: SqlGrading, fixtures: Record<string, string>, runner: SqlRunner): Promise<Evaluation> {
  const checks: Check[] = [];
  let correct = true;
  for (const id of g.fixtures) {
    const ds = fixtures[id];
    if (ds === undefined) return { passed: false, correct: false, constructOk: false, checks, error: `Unknown fixture "${id}"` };
    const exec = (src: string) => (g.checkQuery ? runner.runThen(ds, src, g.checkQuery) : runner.run(ds, src));
    const [mine, ref] = [await exec(code), await exec(solution)];
    if (!ref.success) return { passed: false, correct: false, constructOk: false, checks, error: `Reference solution failed on fixture "${id}": ${ref.errors.join('; ')}` };
    if (!mine.success) { checks.push({ name: `Dataset ${id}`, passed: false, detail: mine.errors.join('\n') }); correct = false; continue; }
    const r = sameResult(lastTable(mine), lastTable(ref), g);
    checks.push({ name: `Dataset ${id}`, passed: r.ok, detail: r.why });
    if (!r.ok) correct = false;
  }
  const missing = missingConstructs(code, g.requiredConstructs);
  if (g.requiredConstructs.length) checks.push({ name: `Uses ${g.requiredConstructs.join(', ')}`, passed: missing.length === 0, detail: missing.length ? `Missing: ${missing.join(', ')}` : undefined });
  return { passed: correct && missing.length === 0, correct, constructOk: missing.length === 0, checks };
}
