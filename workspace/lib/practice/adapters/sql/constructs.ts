// Required-construct check on SQL with comments and string literals removed.
// Constructs are token sequences, case-insensitive ("LEFT JOIN", "WITH", "CROSS JOIN").
// Special case: "UNION" means plain UNION (not UNION ALL); "UNION ALL" means UNION ALL.
export function stripSql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function hasConstruct(sql: string, construct: string): boolean {
  const s = ` ${stripSql(sql).replace(/[(),;]/g, ' $& ').replace(/\s+/g, ' ')} `;
  const c = construct.trim().toUpperCase().replace(/\s+/g, ' ');
  if (c === 'UNION') return / UNION (?!ALL )/.test(s);
  return s.includes(` ${c} `);
}

export function missingConstructs(sql: string, required: string[] = []): string[] {
  return required.filter(c => !hasConstruct(sql, c));
}
