'use client';
// Lists tables and columns from the fixture's CREATE TABLE statements.
export function parseSchema(sql: string): { table: string; columns: string[] }[] {
  const out: { table: string; columns: string[] }[] = [];
  for (const m of sql.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi)) {
    const cols = m[2].split(/,(?![^()]*\))/).map(s => s.trim()).filter(s => s && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(s)).map(s => s.split(/\s+/)[0]);
    out.push({ table: m[1], columns: cols });
  }
  return out;
}
export function SchemaPanel({ sql }: { sql: string }) {
  const tables = parseSchema(sql);
  return (
    <section aria-label="Database schema" className="practice-schema">
      <h2>Tables</h2>
      {tables.map(t => (
        <details key={t.table}>
          <summary><code>{t.table}</code></summary>
          <p>{t.columns.map(c => <code key={c}>{c}</code>)}</p>
        </details>
      ))}
    </section>
  );
}
