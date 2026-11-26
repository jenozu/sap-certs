'use client';
// Browser execution: vendored engine in a Web Worker, with timeout + terminate (ADR-010).
import { createSqlEngineWith } from '../../../../vendor/playground/execution/adapters/sql/engine';
import type { ExecutionEngine, ExecutionResult } from '../../../../vendor/playground/types/execution';
import type { SqlRunner } from './grading';

export const SQL_TIMEOUT_MS = 5000;
export const MAX_ROWS_SHOWN = 1000;
let enginePromise: Promise<ExecutionEngine> | undefined;
let currentDataset: string | undefined;

function getEngine() {
  enginePromise ??= (async () => {
    const e = createSqlEngineWith(() => new Worker(new URL('./sql-worker.ts', import.meta.url), { type: 'module' }));
    await e.initialize();
    currentDataset = undefined;
    return e;
  })();
  enginePromise.catch(() => { enginePromise = undefined; });
  return enginePromise;
}

const fail = (m: string): ExecutionResult => ({ success: false, output: '', errors: [m] });

async function withTimeout(e: ExecutionEngine, work: () => Promise<ExecutionResult>, ms: number): Promise<ExecutionResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<ExecutionResult>(res => {
        timer = setTimeout(() => { currentDataset = undefined; e.stop().catch(() => {}); res(fail(`Timed out after ${ms / 1000}s. Check for a query that never ends (e.g. recursive CTE without a stop condition).`)); }, ms);
      }),
    ]);
  } catch (err) { return fail(err instanceof Error ? err.message : String(err)); }
  finally { clearTimeout(timer); }
}

/** Fresh database from `dataset`, then run statements. */
async function fresh(e: ExecutionEngine, dataset: string) {
  if (currentDataset === dataset) await e.reset();
  else { await e.execute('SELECT 1', { dataset }); await e.reset(); currentDataset = dataset; }
}

export function capRows(r: ExecutionResult): ExecutionResult {
  const cap = (t: { columns: string[]; rows: unknown[][] }) => (t.rows.length > MAX_ROWS_SHOWN ? { ...t, rows: t.rows.slice(0, MAX_ROWS_SHOWN) } : t);
  const truncated = (r.tables ?? []).some(t => t.rows.length > MAX_ROWS_SHOWN);
  return { ...r, tables: r.tables?.map(cap), table: r.table && cap(r.table), output: truncated ? `${r.output}\nShowing the first ${MAX_ROWS_SHOWN} rows.`.trim() : r.output };
}

export function createBrowserSqlRunner(timeoutMs = SQL_TIMEOUT_MS): SqlRunner & { runFree(ds: string | undefined, code: string): Promise<ExecutionResult>; reset(ds?: string): Promise<void> } {
  return {
    async run(ds, code) {
      const e = await getEngine().catch(err => { throw err; });
      return withTimeout(e, async () => { await fresh(e, ds); return e.execute(code, { dataset: ds }); }, timeoutMs);
    },
    async runThen(ds, code, q) {
      const e = await getEngine();
      return withTimeout(e, async () => { await fresh(e, ds); const r = await e.execute(code, { dataset: ds }); return r.success ? e.execute(q, { dataset: ds }) : r; }, timeoutMs);
    },
    /** Free run keeps state between runs (like a real database session) until reset. */
    async runFree(ds, code) {
      let e: ExecutionEngine;
      try { e = await getEngine(); } catch (err) { return fail(err instanceof Error ? err.message : String(err)); }
      return withTimeout(e, async () => {
        if (currentDataset !== ds) { await fresh(e, ds ?? ''); }
        return capRows(await e.execute(code, { dataset: ds }));
      }, timeoutMs);
    },
    async reset(ds) { const e = await getEngine(); await fresh(e, ds ?? ''); },
  };
}
