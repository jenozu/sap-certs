// Copies the pinned playground modules into vendor/playground and records hashes.
// Usage: node scripts/sync-playground.mjs <path-to-playground-checkout> <commit-sha>
// Vendored files must never be edited by hand: tests/unit/vendor-integrity.test.ts enforces it.
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const FILES = [
  'src/execution/adapters/sql/core.ts',
  'src/execution/adapters/sql/engine.ts',
  'src/types/execution.ts',
  'src/components/editor/CodeEditor.tsx',
  'src/components/terminal/OutputPanel.tsx',
  'src/features/exercise-evaluation/sql.ts',
  'src/features/lesson-viewer/LessonMarkdown.tsx',
  'src/course-system/schema/index.ts',
];
const [src, sha] = process.argv.slice(2);
if (!src || !sha) { console.error('usage: sync-playground.mjs <playground-dir> <sha>'); process.exit(1); }
const out = new URL('../vendor/playground/', import.meta.url).pathname;
rmSync(out, { recursive: true, force: true });
const files = {};
for (const f of FILES) {
  const dest = join(out, f.replace(/^src\//, ''));
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(src, f), dest);
  files[f.replace(/^src\//, '')] = createHash('sha256').update(readFileSync(dest)).digest('hex');
}
writeFileSync(join(out, 'UPSTREAM.json'), JSON.stringify({ repo: 'jenozu/playground', sha, syncedAt: new Date().toISOString().slice(0, 10), files }, null, 2) + '\n');
console.log(`vendored ${FILES.length} files from ${sha}`);
