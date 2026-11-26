import type { Database, SqlJsStatic } from "sql.js";
import type { ExecutionResult } from "../../../types/execution";

export function createDb(SQL: SqlJsStatic, dataset?: string): Database {
  const db = new SQL.Database();
  try {
    if (dataset) db.exec(dataset);
  } catch (e) {
    db.close();
    throw e;
  }
  return db;
}

/** One table per result set; sqlite's error message is kept as-is. */
export function execSql(db: Database, code: string): ExecutionResult {
  const t0 = performance.now();
  try {
    // iterateStatements (not db.exec) so a zero-row SELECT still yields its column names
    const sets: { columns: string[]; values: unknown[][] }[] = [];
    for (const st of db.iterateStatements(code)) {
      const columns = st.getColumnNames();
      if (!columns.length) {
        st.step();
        continue;
      }
      const values: unknown[][] = [];
      while (st.step()) values.push(st.get());
      sets.push({ columns, values });
    }
    const executionTime = performance.now() - t0;
    if (!sets.length) return { success: true, output: "Query OK.", errors: [], executionTime };
    const [first] = sets;
    return {
      success: true,
      output: sets.length > 1 ? `${sets.length} result sets` : `${first.values.length} row(s)`,
      errors: [],
      executionTime,
      table: { columns: first.columns, rows: first.values },
      tables: sets.map((s) => ({ columns: s.columns, rows: s.values })),
    };
  } catch (e) {
    return { success: false, output: "", errors: [e instanceof Error ? e.message : String(e)] };
  }
}

export type SqlMsg = { type: "init" | "exec" | "reset"; dataset?: string; code?: string };

/** Worker message logic as a plain function (worker.ts only wires it to postMessage). */
export function createHandler(SQL: SqlJsStatic) {
  let db: Database | undefined;
  let dataset: string | undefined;
  return (msg: SqlMsg): ExecutionResult | null => {
    if (msg.type === "exec") {
      db ??= createDb(SQL, dataset);
      return execSql(db, msg.code ?? "");
    }
    if (msg.type === "init") dataset = msg.dataset;
    db?.close();
    db = undefined; // a failing dataset must not leave a closed db behind
    db = createDb(SQL, dataset);
    return null;
  };
}
