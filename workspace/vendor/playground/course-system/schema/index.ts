import { z } from 'zod'

// Format reference: COURSE-FORMAT.md. Changing it needs owner approval (PRD 25.6).
// Objects are non-strict on purpose: unknown fields are allowed (forward compat).

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase slug (a-z, 0-9, hyphens)')

// Relative path inside the course folder; no absolute paths or ".." (untrusted content).
export const relPath = z
  .string()
  .min(1)
  .refine(
    (p) => !/^([a-zA-Z]:|[\\/])/.test(p) && !p.split(/[\\/]/).includes('..'),
    'must be a relative path without ".."',
  )

// Only http(s) links; blocks javascript:, data: etc. from untrusted manifests.
export const httpUrl = z.string().refine((u) => {
  try {
    return ['http:', 'https:'].includes(new URL(u).protocol)
  } catch {
    return false
  }
}, 'must be an http(s) URL')

// Flags every repeat of an id, with the path pointing at the duplicate.
function uniqueIds(items: { id: string }[], key: string, ctx: z.RefinementCtx) {
  const seen = new Set<string>()
  items.forEach((it, i) => {
    if (seen.has(it.id)) ctx.addIssue({ code: 'custom', message: `duplicate id "${it.id}"`, path: [key, i, 'id'] })
    seen.add(it.id)
  })
}

export const languageSchema = z.enum(['sql', 'python', 'javascript'])
export const lessonTypeSchema = z.enum([
  'reading',
  'coding',
  'guided',
  'multiple-choice',
  'debugging',
  'project',
  'review',
])

export const exerciseSchema = z.object({
  type: languageSchema,
  starter: relPath,
  tests: relPath,
  solution: relPath.optional(),
  hints: z.array(z.string()).optional(),
  dataset: relPath.optional(),
})

export const lessonSchema = z.object({
  id: slug,
  title: z.string().min(1),
  type: lessonTypeSchema.default('reading'),
  content: relPath,
  estimatedMinutes: z.number().positive(),
  exercise: exerciseSchema.optional(),
})

export const moduleSchema = z.object({
  id: slug,
  title: z.string().min(1),
  lessons: z.array(lessonSchema).min(1),
}).superRefine((m, ctx) => uniqueIds(m.lessons, 'lessons', ctx))

export const courseSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  id: slug,
  title: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'must be semver, e.g. 1.0.0'),
  language: languageSchema,
  description: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive(),
  author: z.string().optional(),
  source: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  resources: z.array(z.object({ title: z.string(), url: httpUrl })).optional(),
  modules: z.array(moduleSchema).min(1),
}).superRefine((c, ctx) => uniqueIds(c.modules, 'modules', ctx))

// Test files (lesson-NN-tests.json), one shape per language.
const sqlTest = z
  .object({
    name: z.string().min(1),
    // Compare the user's query result to expected rows, or run a check query afterwards.
    expectedRows: z.array(z.array(z.unknown())).optional(),
    expectedColumns: z.array(z.string()).optional(),
    orderMatters: z.boolean().optional(),
    checkQuery: z.string().optional(),
  })
  .refine((t) => t.expectedRows || t.checkQuery, 'needs expectedRows or checkQuery')

const codeTest = z
  .object({
    name: z.string().min(1),
    // Named assert snippet appended to the user's code, and/or expected stdout.
    assert: z.string().optional(),
    expectedStdout: z.string().optional(),
  })
  .refine((t) => t.assert !== undefined || t.expectedStdout !== undefined, 'needs assert or expectedStdout')

export const testFileSchema = z.discriminatedUnion('language', [
  z.object({ language: z.literal('sql'), tests: z.array(sqlTest).min(1) }),
  z.object({ language: z.literal('python'), tests: z.array(codeTest).min(1) }),
  z.object({ language: z.literal('javascript'), tests: z.array(codeTest).min(1) }),
])

export type Course = z.infer<typeof courseSchema>
export type Module = z.infer<typeof moduleSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type TestFile = z.infer<typeof testFileSchema>

/** Parse course.json content; errors are "path: message" lines. */
export function parseCourse(
  input: unknown,
): { ok: true; course: Course } | { ok: false; errors: string[] } {
  const r = courseSchema.safeParse(input)
  if (r.success) return { ok: true, course: r.data }
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) }
}
