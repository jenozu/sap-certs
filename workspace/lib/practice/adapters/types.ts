// ADR-014: every language plugs in through this interface. Practice UI, storage,
// attempts, mastery and review only use these shared shapes.
import type { ExecutionResult, TestResult } from '../../../vendor/playground/types/execution';
export type { ExecutionResult, TestResult };

export type EditorLanguage = 'sql' | 'javascript' | 'python';

/** Language-neutral exercise as loaded from a pack (language-specific parts stay opaque). */
export interface PracticeExercise {
  id: string;            // stable exerciseId
  version: string;       // exerciseVersion (semver)
  language: string;      // adapter id
  title: string;
  skills: string[];
  difficulty: 'intro' | 'core' | 'stretch';
  kind: 'targeted' | 'debugging' | 'predict-output' | 'business' | 'assessment' | 'sandbox';
  instructions: string;  // Markdown
  businessPurpose?: string;
  starter: string;
  solution: string;
  hints: string[];
  /** Adapter-specific grading spec (SQL: fixtures, tests, required constructs...). */
  grading: unknown;
  /** Adapter-specific run context (SQL: default fixture id). */
  context?: unknown;
}

export interface Check { name: string; passed: boolean; detail?: string }
export interface Evaluation {
  passed: boolean;             // correctness AND required constructs
  correct: boolean;            // results match on every fixture
  constructOk: boolean;        // required language constructs present (true when none required)
  checks: Check[];
  error?: string;
}

export interface LanguageAdapter {
  id: string;
  label: string;
  dialectNote: string;
  editorLanguage: EditorLanguage;
  /** Free run (never graded, never recorded). */
  run(code: string, exercise: PracticeExercise | null, contextId?: string): Promise<ExecutionResult>;
  /** Restore the sandbox for this exercise; drafts are not affected. */
  resetSandbox(exercise: PracticeExercise | null, contextId?: string): Promise<void>;
  /** Grade a submission. */
  evaluate(code: string, exercise: PracticeExercise): Promise<Evaluation>;
}
