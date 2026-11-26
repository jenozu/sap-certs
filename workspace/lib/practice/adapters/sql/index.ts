'use client';
import type { LanguageAdapter, PracticeExercise } from '../types';
import { evaluateSqlExercise, sqlGradingSchema } from './grading';
import { createBrowserSqlRunner } from './browser-runner';

/** SQL context resolved by the pack loader: fixture SQL by id. */
export interface SqlContext { fixtures: Record<string, string>; defaultFixture: string }
const ctx = (ex: PracticeExercise | null) => ex?.context as SqlContext | undefined;
const runner = createBrowserSqlRunner();

export const sqlAdapter: LanguageAdapter = {
  id: 'sql',
  label: 'SQL',
  dialectNote: 'SQLite dialect (runs in your browser)',
  editorLanguage: 'sql',
  run(code, ex, contextId) {
    const c = ctx(ex);
    return runner.runFree(c ? c.fixtures[contextId ?? c.defaultFixture] : undefined, code);
  },
  resetSandbox(ex, contextId) {
    const c = ctx(ex);
    return runner.reset(c ? c.fixtures[contextId ?? c.defaultFixture] : undefined);
  },
  async evaluate(code, ex) {
    const g = sqlGradingSchema.safeParse(ex.grading);
    const c = ctx(ex);
    if (!g.success || !c) return { passed: false, correct: false, constructOk: false, checks: [], error: 'This exercise has an invalid grading setup.' };
    return evaluateSqlExercise(code, ex.solution, g.data, c.fixtures, runner);
  },
};
