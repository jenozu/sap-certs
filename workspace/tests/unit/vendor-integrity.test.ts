import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
// ADR-004: vendored playground files are pinned; edit upstream and re-sync instead.
const dir = new URL('../../vendor/playground/', import.meta.url);
const upstream = JSON.parse(readFileSync(new URL('UPSTREAM.json', dir), 'utf8')) as { sha: string; files: Record<string, string> };
describe('vendored playground snapshot', () => {
  it('is pinned to a commit', () => expect(upstream.sha).toMatch(/^[0-9a-f]{40}$/));
  for (const [file, hash] of Object.entries(upstream.files)) {
    it(`${file} is unmodified`, () => {
      expect(createHash('sha256').update(readFileSync(new URL(file, dir))).digest('hex')).toBe(hash);
    });
  }
});
