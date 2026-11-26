import type { ExecutionResult, TestResult } from "../../types/execution";
import type { TestFile } from "../../course-system/schema";

export type SqlTest = Extract<TestFile, { language: "sql" }>["tests"][number];
export interface SqlRunner {
  /** Restore the fresh dataset before each test. */
  reset(): Promise<void>;
  exec(code: string): Promise<ExecutionResult>;
}

const show = (columns: string[] | undefined, rows: unknown[][]) =>
  JSON.stringify(columns ? { columns, rows } : rows);
const key = (r: unknown[]) => JSON.stringify(r);

/** Evaluators are separate from execution: they only use the runner they are given. */
export async function evaluateSql(tests: SqlTest[], code: string, runner: SqlRunner): Promise<TestResult[]> {
  const out: TestResult[] = [];
  for (const t of tests) {
    await runner.reset();
    let r = await runner.exec(code);
    if (r.success && t.checkQuery) r = await runner.exec(t.checkQuery); // runs on the db the user's code changed
    if (!r.success) {
      out.push({ name: t.name, passed: false, error: r.errors.join("\n") });
      continue;
    }
    const tbl = r.tables?.at(-1) ?? r.table ?? { columns: [], rows: [] };
    const want = t.expectedRows ?? [];
    const ordered = t.orderMatters ?? false;
    const norm = (rows: unknown[][]) => (ordered ? rows.map(key) : rows.map(key).sort());
    const a = norm(tbl.rows);
    const e = norm(want);
    const colsOk = !t.expectedColumns || key(t.expectedColumns) === key(tbl.columns);
    const rowsOk = !t.expectedRows || (a.length === e.length && a.every((x, i) => x === e[i]));
    out.push({
      name: t.name,
      passed: colsOk && rowsOk,
      expected: show(t.expectedColumns, want),
      actual: show(t.expectedColumns && tbl.columns, tbl.rows),
    });
  }
  return out;
}

/** Lesson controller hook: emits 'exercise-passed' once every test passes. */
export const EXERCISE_PASSED = "exercise-passed";
export function emitIfPassed(results: TestResult[], target: EventTarget = window, detail?: object) {
  const passed = results.length > 0 && results.every((r) => r.passed);
  if (passed) target.dispatchEvent(new CustomEvent(EXERCISE_PASSED, { detail }));
  return passed;
}
