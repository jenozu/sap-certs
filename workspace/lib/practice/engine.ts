'use client';
// Browser-only SQL runner around the vendored playground engine (same timeout and
// stop semantics as the playground's execution manager, SQL only).
import { createSqlEngine } from '../../vendor/playground/execution/adapters/sql';
import type { ExecutionEngine, ExecutionResult } from '../../vendor/playground/types/execution';

export const SQL_TIMEOUT_MS = 5000;
let engine: Promise<ExecutionEngine> | undefined;

function getEngine() {
  engine ??= (async () => {
    const e = createSqlEngine(() => new Worker(new URL('./sql-worker.ts', import.meta.url), { type: 'module' }));
    await e.initialize();
    return e;
  })();
  engine.catch(() => { engine = undefined; });
  return engine;
}

const fail = (m: string): ExecutionResult => ({ success: false, output: '', errors: [m] });

export async function runSql(code: string, dataset?: string, timeoutMs = SQL_TIMEOUT_MS): Promise<ExecutionResult> {
  let e: ExecutionEngine;
  try { e = await getEngine(); } catch (err) { return fail(err instanceof Error ? err.message : String(err)); }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      e.execute(code, { dataset }),
      new Promise<ExecutionResult>((res) => {
        timer = setTimeout(() => { res(fail(`Timed out after ${timeoutMs / 1000}s.`)); e.stop().catch(() => {}); }, timeoutMs);
      }),
    ]);
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  } finally { clearTimeout(timer); }
}

export async function resetSql() { if (engine) await (await engine).reset(); }
