import { getPostgresDb } from '@/db/postgres';
import { practiceRepo } from '@/lib/server/practice-repo';
import { json, ownerOr503, readBody, serverError } from '@/lib/server/route';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { attemptInput } from '@/lib/practice/schemas';

export async function GET(req: Request) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const u = new URL(req.url);
  try { return json({ attempts: await practiceRepo(getPostgresDb(), o.owner).listAttempts({ exerciseId: u.searchParams.get('exerciseId') ?? undefined, language: u.searchParams.get('language') ?? undefined }) }); }
  catch { return serverError(); }
}

// Insert-only; replaying the same id is a no-op (offline queue, double clicks).
export async function POST(req: Request) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const b = await readBody(req, attemptInput, 80_000); if ('res' in b) return b.res;
  try { const r = await practiceRepo(getPostgresDb(), o.owner).addAttempt(b.data); return json(r, r.created ? 201 : 200); }
  catch { return serverError(); }
}
