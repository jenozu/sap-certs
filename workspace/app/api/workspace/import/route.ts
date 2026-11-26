import { getPostgresDb } from '@/db/postgres';
import { workspaceRepository } from '@/db/postgres/repository';
import { workspaceSnapshots } from '@/db/postgres/schema';
import { initial } from '@/app/model';
import { resolveOwner, OwnerNotConfigured } from '@/lib/server/owner';
import { guardMutation } from '@/lib/server/guard';
import { applyImport, parseImportFile, planImport, type Choice } from '@/lib/workspace/import';
import { z } from 'zod';
import { practiceExportSchema } from '@/lib/practice/export';
import { importPractice } from '@/lib/server/practice-repo';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const res = (b: unknown, status = 200) => Response.json(b, { status, headers: { 'Cache-Control': 'no-store' } });
const bodySchema = z.object({ file: z.unknown(), version: z.number().int().min(0), choices: z.record(z.string(), z.enum(['keep', 'incoming'])).optional() });

// POST /api/workspace/import?dryRun=1 → plan only. Without dryRun → snapshot, merge, save.
export async function POST(req: Request) {
  let owner: string;
  try { owner = resolveOwner(); } catch (e) { if (e instanceof OwnerNotConfigured) return res({ error: 'Server not configured.' }, 503); throw e; }
  const blocked = guardMutation(req, 4_000_000);
  if (blocked) return blocked;
  const raw = await req.text();
  if (raw.length > 4_000_000) return res({ error: "File is too large (max 4 MB). Export again or split older attempts." }, 413);
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return res({ error: 'Invalid JSON.' }, 400); }
  const body = bodySchema.safeParse(json);
  if (!body.success) return res({ error: 'Invalid import request.' }, 400);
  const parsed = parseImportFile(body.data.file);
  if (!parsed.ok) return res({ error: parsed.error }, 400);
  try {
    const db = getPostgresDb();
    const repo = workspaceRepository(db);
    const row = await repo.load(owner);
    const current = (row?.data ?? initial) as typeof initial;
    const version = row?.version ?? 0;
    if (version !== body.data.version) return res({ error: 'This workspace changed in another tab. Reload and try again.' }, 409);
    const plan = planImport(current, parsed.workspace);
    const rawPractice = (body.data.file as { practice?: unknown })?.practice;
    const practice = rawPractice === undefined ? null : practiceExportSchema.safeParse(rawPractice);
    if (practice && !practice.success) { const i = practice.error.issues[0]; return res({ error: `Invalid file at practice.${i.path.join('.')}: ${i.message}` }, 400); }
    const dry = new URL(req.url).searchParams.get('dryRun') === '1';
    const practicePlan = practice?.success ? await importPractice(db, owner, practice.data, true) : null;
    if (dry) return res({ plan, practice: practicePlan });
    const merged = applyImport(current, parsed.workspace, (body.data.choices ?? {}) as Record<string, Choice>);
    await db.insert(workspaceSnapshots).values({ ownerId: owner, source: 'pre-import', data: current, version });
    const newVersion = await repo.save(owner, merged, version);
    if (newVersion === null) return res({ error: 'This workspace changed in another tab. Reload and try again.' }, 409);
    if (practice?.success) await importPractice(db, owner, practice.data, false);
    return res({ plan, practice: practicePlan, version: newVersion, data: merged });
  } catch { return res({ error: 'Import failed. Your saved data is unchanged.' }, 503); }
}
