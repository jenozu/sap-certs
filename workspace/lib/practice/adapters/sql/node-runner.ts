// Node (tests, content verification): the same vendored worker logic, called directly.
import initSqlJs from 'sql.js';
import { createHandler } from '../../../../vendor/playground/execution/adapters/sql/core';
import type { ExecutionResult } from '../../../../vendor/playground/types/execution';
import type { SqlRunner } from './grading';

export async function createNodeSqlRunner(): Promise<SqlRunner> {
  const handle = createHandler(await initSqlJs());
  const fresh = (ds: string) => { handle({ type: 'init', dataset: ds }); };
  const exec = (code: string) => handle({ type: 'exec', code }) as ExecutionResult;
  return {
    async run(ds, code) { fresh(ds); return exec(code); },
    async runThen(ds, code, q) { fresh(ds); const r = exec(code); return r.success ? exec(q) : r; },
  };
}
