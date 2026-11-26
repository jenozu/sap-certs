// Pack validator (ADR-009). A pack = playground course.json (validated by the vendored
// schema, so the manifest stays playground-compatible) + Pathway exercise metadata.
// Input is a virtual file map, so bundled packs and imported ZIPs share one path.
import { z } from 'zod';
import { httpUrl, relPath, slug } from '../../../vendor/playground/course-system/schema';
import type { PracticeExercise } from '../adapters/types';
import { sqlGradingSchema } from '../adapters/sql/grading';
import { normalizeLanguage } from '../adapters/registry';

export const LIMITS = { packBytes: 2_000_000, fileBytes: 200_000, files: 500 };
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be semver, e.g. 1.0.0');
export const exerciseIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, 'lowercase letters, digits, dots and hyphens');

const pathwayExercise = z.object({
  exerciseId: exerciseIdSchema,
  exerciseVersion: semver,
  skills: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1).max(10),
  difficulty: z.enum(['intro', 'core', 'stretch']),
  kind: z.enum(['targeted', 'debugging', 'predict-output', 'business', 'assessment', 'sandbox']),
  businessPurpose: z.string().max(500).optional(),
  solution: relPath,                       // required in Pathway packs (optional in playground)
  hints: z.array(z.string().max(1000)).min(1).max(8),
});
// Same structure as the playground course format, but any language id (multi-language academy).
const langId = z.string().trim().min(1).max(40);
const lesson = z.object({
  id: slug, title: z.string().min(1), type: z.string().default('coding'), content: relPath, estimatedMinutes: z.number().positive(),
  exercise: z.object({ type: langId, starter: relPath, tests: relPath, solution: relPath.optional(), hints: z.array(z.string()).optional(), dataset: relPath.optional() }).optional(),
});
const unique = (key: string) => (arr: { id: string }[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>();
  arr.forEach((it, i) => { if (seen.has(it.id)) ctx.addIssue({ code: 'custom', message: `duplicate id "${it.id}"`, path: [i, 'id'] }); seen.add(it.id); });
  void key;
};
export const packManifestSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  id: slug, title: z.string().min(1), version: semver, language: langId, description: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']), estimatedHours: z.number().positive(),
  author: z.string().optional(), source: z.string().optional(),
  resources: z.array(z.object({ title: z.string(), url: httpUrl })).optional(),
  fixtures: z.record(slug, relPath).optional(),
  modules: z.array(z.object({ id: slug, title: z.string().min(1), lessons: z.array(lesson).min(1).superRefine(unique('lessons')) })).min(1).superRefine(unique('modules')),
});

export interface ValidPack {
  id: string; version: string; language: string; title: string; description: string;
  fixtures: Record<string, string>; exercises: PracticeExercise[];
}
export type ValidationResult = { ok: true; pack: ValidPack; warnings: string[] } | { ok: false; errors: string[] };

const issues = (prefix: string, e: z.ZodError) => e.issues.map(i => `${prefix}${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`);
async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validatePack(files: Record<string, string>): Promise<ValidationResult> {
  const errors: string[] = []; const warnings: string[] = [];
  const paths = Object.keys(files);
  if (paths.length > LIMITS.files) return { ok: false, errors: [`Too many files (${paths.length} > ${LIMITS.files}).`] };
  let total = 0;
  for (const p of paths) {
    const size = new TextEncoder().encode(files[p]).length; total += size;
    if (!relPath.safeParse(p).success || p.includes('\\')) errors.push(`${p}: unsafe path (absolute, "..", or backslash).`);
    if (size > LIMITS.fileBytes) errors.push(`${p}: file too large (${size} bytes > ${LIMITS.fileBytes}).`);
  }
  if (total > LIMITS.packBytes) errors.push(`Pack too large (${total} bytes > ${LIMITS.packBytes}).`);
  if (errors.length) return { ok: false, errors };
  if (!('course.json' in files)) return { ok: false, errors: ['Missing course.json at the pack root.'] };

  let manifest: unknown;
  try { manifest = JSON.parse(files['course.json']); } catch (e) { return { ok: false, errors: [`course.json is not valid JSON: ${(e as Error).message}`] }; }
  const course = packManifestSchema.safeParse(manifest);
  if (!course.success) return { ok: false, errors: issues('course.json: ', course.error) };
  const c = course.data; const language = normalizeLanguage(c.language);

  const need = (p: string, where: string) => { if (!(p in files)) errors.push(`${where}: file "${p}" not found in pack.`); return files[p] ?? ''; };
  const fixtures: Record<string, string> = {};
  for (const [fid, p] of Object.entries(c.fixtures ?? {})) fixtures[fid] = need(p, `fixtures.${fid}`);

  const exercises: PracticeExercise[] = []; const seen = new Set<string>();
  const rawModules = (manifest as { modules: { lessons: { exercise?: unknown }[] }[] }).modules;
  for (const [mi, m] of c.modules.entries()) for (const [li, lesson] of m.lessons.entries()) {
    if (!lesson.exercise) continue;
    const where = `modules.${mi}.lessons.${li} (${lesson.id})`;
    const px = pathwayExercise.safeParse(rawModules[mi].lessons[li].exercise);
    if (!px.success) { errors.push(...issues(`${where}.exercise.`, px.error)); continue; }
    const ex = px.data;
    if (seen.has(ex.exerciseId)) { errors.push(`${where}: duplicate exerciseId "${ex.exerciseId}".`); continue; }
    seen.add(ex.exerciseId);
    if (normalizeLanguage(lesson.exercise.type) !== language) errors.push(`${where}: exercise language "${lesson.exercise.type}" differs from pack language "${language}".`);
    const instructions = need(lesson.content, where), starter = need(lesson.exercise.starter, where), solution = need(ex.solution, where);
    const testsRaw = need(lesson.exercise.tests, where);
    let grading: unknown; let context: unknown;
    if (testsRaw) {
      let tests: { grading?: unknown };
      try { tests = JSON.parse(testsRaw); } catch { errors.push(`${where}: ${lesson.exercise.tests} is not valid JSON.`); continue; }
      if (language === 'sql') {
        const g = sqlGradingSchema.safeParse(tests.grading);
        if (!g.success) { errors.push(...issues(`${where} grading.`, g.error)); continue; }
        const graded = ex.kind !== 'sandbox';
        if (graded && g.data.fixtures.length < 2) errors.push(`${where}: graded SQL exercises need at least 2 fixtures (catches hard-coded answers).`);
        for (const f of g.data.fixtures) if (!(f in fixtures)) errors.push(`${where}: unknown fixture "${f}".`);
        grading = g.data; context = { defaultFixture: g.data.fixtures[0] };
      } else { grading = tests.grading; warnings.push(`${where}: no validator for language "${language}" yet; grading not checked.`); }
    }
    const contentHash = await sha256(JSON.stringify([instructions, starter, solution, grading, ex.hints]));
    exercises.push({
      id: ex.exerciseId, version: ex.exerciseVersion, language, title: lesson.title, skills: ex.skills, difficulty: ex.difficulty, kind: ex.kind,
      instructions, businessPurpose: ex.businessPurpose, starter, solution, hints: ex.hints, grading, context: { ...(context as object), contentHash },
    });
  }
  if (!exercises.length && !errors.length) errors.push('Pack has no exercises.');
  if (errors.length) return { ok: false, errors };
  return { ok: true, warnings, pack: { id: c.id, version: c.version, language, title: c.title, description: c.description, fixtures, exercises } };
}
