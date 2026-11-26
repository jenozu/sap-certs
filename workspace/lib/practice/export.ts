// Export/import of practice data (v2). Workspace part keeps the v1 shape {exportedAt, workspace}.
import { z } from 'zod';
import { attemptInput, skillInput } from './schemas';

export const practiceExportSchema = z.object({
  skills: z.array(skillInput.extend({ state: z.enum(['introduced', 'practising', 'understood', 'proficient', 'mastered']).default('introduced') })).max(5000).default([]),
  attempts: z.array(attemptInput).max(50_000).default([]),
  drafts: z.array(z.object({ exerciseId: z.string().min(1).max(120), language: z.string().min(1).max(40), code: z.string().max(50_000) })).max(5000).default([]),
});
export type PracticeExport = z.infer<typeof practiceExportSchema>;
