// prebuild: validate bundled packs and write public/packs/{index.json,<id>.json} for the client.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { validatePack } from '../lib/practice/packs/validate';
import { readPackDir } from '../lib/practice/packs/fs-load';

const root = new URL('../content/packs/', import.meta.url).pathname;
const out = new URL('../public/packs/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const index = [];
for (const id of readdirSync(root)) {
  const v = await validatePack(readPackDir(root + id));
  if (!v.ok) { console.error(`pack ${id} is invalid:\n  ${v.errors.join('\n  ')}`); process.exit(1); }
  const { pack } = v;
  writeFileSync(out + `${pack.id}.json`, JSON.stringify(pack));
  index.push({ id: pack.id, version: pack.version, language: pack.language, title: pack.title, description: pack.description, exercises: pack.exercises.map(e => ({ id: e.id, title: e.title, skills: e.skills, difficulty: e.difficulty, kind: e.kind })) });
}
writeFileSync(out + 'index.json', JSON.stringify({ packs: index }));
console.log(`bundled ${index.length} pack(s)`);
