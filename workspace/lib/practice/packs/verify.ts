// Content verification shared by `npm run content:verify` and the import pipeline (Node side):
// reference passes, starter fails, a hard-coded copy of the expected answer fails.
import type { ValidPack } from './validate';
import { evaluateSqlExercise, sqlGradingSchema, type SqlRunner } from '../adapters/sql/grading';

const lit = (v: unknown) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

export async function verifySqlPack(pack: ValidPack, runner: SqlRunner): Promise<string[]> {
  const problems: string[] = [];
  for (const ex of pack.exercises) {
    const g = sqlGradingSchema.parse(ex.grading);
    const ref = await evaluateSqlExercise(ex.solution, ex.solution, g, pack.fixtures, runner);
    if (ref.error || !ref.passed) { problems.push(`${ex.id}: reference solution does not pass (${ref.error ?? ref.checks.filter(c => !c.passed).map(c => c.name + ': ' + c.detail).join('; ')})`); continue; }
    if (ex.kind === 'sandbox') continue;
    const starter = await evaluateSqlExercise(ex.starter, ex.solution, g, pack.fixtures, runner);
    if (starter.passed) problems.push(`${ex.id}: the starter code already passes`);
    const base = await runner.run(pack.fixtures[g.fixtures[0]], ex.solution);
    const t = base.tables?.at(-1) ?? { columns: [], rows: [] };
    const hard = t.rows.length ? t.rows.map(r => `SELECT ${r.map((v, i) => `${lit(v)} AS "${t.columns[i]}"`).join(', ')}`).join(' UNION ALL ') : `SELECT ${t.columns.map(c => `NULL AS "${c}"`).join(', ') || '1'} WHERE 0`;
    const hc = await evaluateSqlExercise(hard + ' -- ' + g.requiredConstructs.join(' '), ex.solution, { ...g, requiredConstructs: [] }, pack.fixtures, runner);
    if (hc.passed) problems.push(`${ex.id}: a hard-coded answer passes (fixtures don't differ enough)`);
  }
  return problems;
}
