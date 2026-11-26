// npm run content:verify — validate every bundled pack and verify its exercises.
import { readdirSync } from 'node:fs';
import { validatePack } from '../lib/practice/packs/validate';
import { verifySqlPack } from '../lib/practice/packs/verify';
import { readPackDir } from '../lib/practice/packs/fs-load';
import { createNodeSqlRunner } from '../lib/practice/adapters/sql/node-runner';

const root = new URL('../content/packs/', import.meta.url).pathname;
let failed = false;
const runner = await createNodeSqlRunner();
for (const id of readdirSync(root)) {
  const v = await validatePack(readPackDir(root + id));
  if (!v.ok) { failed = true; console.error(`✗ ${id}: invalid\n  ${v.errors.join('\n  ')}`); continue; }
  v.warnings.forEach(w => console.warn(`! ${id}: ${w}`));
  const problems = v.pack.language === 'sql' ? await verifySqlPack(v.pack, runner) : [];
  if (problems.length) { failed = true; console.error(`✗ ${id}:\n  ${problems.join('\n  ')}`); }
  else console.log(`✓ ${id} ${v.pack.version}: ${v.pack.exercises.length} exercises verified on ${Object.keys(v.pack.fixtures).length} fixtures`);
}
process.exit(failed ? 1 : 0);
