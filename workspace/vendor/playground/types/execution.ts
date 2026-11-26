export interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string[];
  executionTime?: number;
  table?: {
    columns: string[];
    rows: unknown[][];
  };
  /** SQL: every result set (table is the first). */
  tables?: { columns: string[]; rows: unknown[][] }[];
}

export interface ExecutionEngine {
  initialize(): Promise<void>;
  execute(code: string, options?: object): Promise<ExecutionResult>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  dispose(): Promise<void>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}
