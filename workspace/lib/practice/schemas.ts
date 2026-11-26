// Shared (client + server) payload schemas for practice APIs.
import { z } from 'zod';

export const id = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, 'Use letters, digits, . _ : -');
export const language = z.string().trim().min(1).max(40).transform(s => s.toLowerCase().replace(/\s+/g, '-'));
const shortText = (max: number) => z.string().max(max);

export const attemptInput = z.object({
  id,                                        // client-generated idempotency key
  language,
  exerciseId: id,
  exerciseVersion: z.string().min(1).max(40),
  contentHash: z.string().min(1).max(128),
  packId: id,
  skills: z.array(id).max(30),
  mode: z.enum(['targeted', 'mixed', 'debugging', 'predict-output', 'business', 'review', 'assessment']),
  code: shortText(50_000),
  passed: z.boolean(),
  correct: z.boolean(),
  constructOk: z.boolean(),
  results: z.array(z.object({ name: shortText(200), passed: z.boolean(), detail: shortText(2000).optional() })).max(50),
  hintsUsed: z.number().int().min(0).max(50),
  solutionViewed: z.boolean(),
  practiceSessionId: id.nullable().optional(),
  durationMs: z.number().int().min(0).max(24 * 3600_000),
  startedAt: z.iso.datetime(),
  submittedAt: z.iso.datetime(),
});
export type AttemptInput = z.infer<typeof attemptInput>;

export const draftInput = z.object({ language, code: shortText(50_000), rev: z.number().int().min(0) });

export const skillInput = z.object({
  id, language, name: z.string().trim().min(1).max(120),
  aliases: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  source: shortText(300).default(''), notes: shortText(10_000).default(''),
});
export type SkillInput = z.infer<typeof skillInput>;

export const sessionInput = z.object({
  id, language,
  config: z.object({ skills: z.array(id).max(30), difficulty: z.array(z.enum(['intro', 'core', 'stretch'])).max(3), count: z.number().int().min(1).max(30), hints: z.boolean(), mode: z.string().max(30) }),
});
