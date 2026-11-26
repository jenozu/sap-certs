import { getPostgresDb } from '@/db/postgres';
import { practiceRepo } from '@/lib/server/practice-repo';
import { json, ownerOr503, readBody, serverError } from '@/lib/server/route';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { z } from 'zod';
import { id, sessionInput } from '@/lib/practice/schemas';

export async function POST(req: Request) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const b = await readBody(req, z.union([sessionInput, z.object({ end: id })])); if ('res' in b) return b.res;
  try {
    const repo = practiceRepo(getPostgresDb(), o.owner);
    if ('end' in b.data) await repo.endSession(b.data.end); else await repo.startSession(b.data.id, b.data.language, b.data.config);
    return json({ ok: true });
  } catch { return serverError(); }
}
