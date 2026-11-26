// Node-only: read a pack folder into a virtual file map (tools/ excluded).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
export function readPackDir(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== 'tools' && !n.startsWith('.')) walk(p); } else if (!n.endsWith('.py') && !n.startsWith('.')) files[relative(dir, p).split('\\').join('/')] = readFileSync(p, 'utf8'); } };
  walk(dir);
  return files;
}
