import { describe, expect, it } from 'vitest';
import { validatePack } from '@/lib/practice/packs/validate';
import { readPackDir } from '@/lib/practice/packs/fs-load';
import { courseSchema } from '@/vendor/playground/course-system/schema';

const seed = readPackDir(new URL('../../content/packs/sql-erp-core/', import.meta.url).pathname);
const clone = () => ({ ...seed });
const manifest = () => JSON.parse(seed['course.json']);
const withManifest = (m: unknown) => ({ ...clone(), 'course.json': JSON.stringify(m) });
const errorsOf = async (files: Record<string, string>) => { const r = await validatePack(files); return r.ok ? [] : r.errors.join('\n'); };

describe('pack validator', () => {
  it('accepts the seed pack and resolves 25 language-tagged exercises', async () => {
    const r = await validatePack(seed);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pack.exercises).toHaveLength(25);
      expect(new Set(r.pack.exercises.map(e => e.language))).toEqual(new Set(['sql']));
      expect(Object.keys(r.pack.fixtures)).toEqual(['base', 'variant-b', 'variant-c']);
    }
  });
  it('keeps course.json compatible with the playground course format', () => {
    expect(courseSchema.safeParse(manifest()).success).toBe(true);
  });
  it('rejects malformed JSON, traversal, absolute paths, oversize files and missing files', async () => {
    expect(await errorsOf({ ...clone(), 'course.json': '{nope' })).toMatch(/not valid JSON/);
    expect(await errorsOf({ ...clone(), '../escape.sql': 'x' })).toMatch(/unsafe path/);
    expect(await errorsOf({ ...clone(), '/abs.sql': 'x' })).toMatch(/unsafe path/);
    expect(await errorsOf({ ...clone(), 'big.sql': 'x'.repeat(200_001) })).toMatch(/too large/);
    const m = manifest(); m.modules[0].lessons[0].content = 'lessons/missing.md';
    expect(await errorsOf(withManifest(m))).toMatch(/not found/);
  });
  it('rejects duplicate ids, missing solution, too few fixtures, bad versions and unknown fixtures', async () => {
    let m = manifest(); m.modules[0].lessons[1].exercise.exerciseId = m.modules[0].lessons[0].exercise.exerciseId;
    expect(await errorsOf(withManifest(m))).toMatch(/duplicate exerciseId/);
    m = manifest(); delete m.modules[0].lessons[0].exercise.solution;
    expect(await errorsOf(withManifest(m))).toMatch(/solution/);
    m = manifest(); m.modules[0].lessons[0].exercise.exerciseVersion = '1.0';
    expect(await errorsOf(withManifest(m))).toMatch(/semver/);
    const t = 'lessons/sql-left-join-customers-without-orders/tests.json';
    expect(await errorsOf({ ...clone(), [t]: JSON.stringify({ language: 'sql', grading: { fixtures: ['base'] } }) })).toMatch(/at least 2 fixtures/);
    expect(await errorsOf({ ...clone(), [t]: JSON.stringify({ language: 'sql', grading: { fixtures: ['base', 'nope'] } }) })).toMatch(/unknown fixture/);
  });
  it('accepts packs for any language id; unvalidated languages get a warning, not a failure', async () => {
    const m = manifest(); m.language = 'typescript';
    for (const mod of m.modules) for (const l of mod.lessons) l.exercise.type = 'typescript';
    const r = await validatePack(withManifest(m));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.pack.language).toBe('typescript'); expect(r.warnings.length).toBeGreaterThan(0); }
  });
});
