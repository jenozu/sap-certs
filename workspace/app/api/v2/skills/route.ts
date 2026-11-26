import { getPostgresDb } from '@/db/postgres';
import { practiceRepo } from '@/lib/server/practice-repo';
import { json, ownerOr503, readBody, serverError } from '@/lib/server/route';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { z } from 'zod';
import { skillInput } from '@/lib/practice/schemas';

export async function GET(req: Request) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const lang = new URL(req.url).searchParams.get('language') ?? undefined;
  try { return json({ skills: await practiceRepo(getPostgresDb(), o.owner).listSkills(lang) }); } catch { return serverError(); }
}
// Upsert: new concepts start 'introduced'; existing ones merge aliases/tags/notes and keep their state.
export async function POST(req: Request) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const b = await readBody(req, z.object({ skills: z.array(skillInput).min(1).max(50) })); if ('res' in b) return b.res;
  try { return json({ skills: await practiceRepo(getPostgresDb(), o.owner).upsertSkills(b.data.skills) }); } catch { return serverError(); }
}
