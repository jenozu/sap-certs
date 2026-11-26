import { getPostgresDb } from '@/db/postgres';
import { practiceRepo } from '@/lib/server/practice-repo';
import { json, ownerOr503, readBody, serverError } from '@/lib/server/route';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { draftInput, id } from '@/lib/practice/schemas';

type Ctx = { params: Promise<{ exerciseId: string }> };
export async function GET(_req: Request, { params }: Ctx) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const ex = id.safeParse((await params).exerciseId); if (!ex.success) return json({ error: 'Invalid exercise id.' }, 400);
  try { return json({ draft: await practiceRepo(getPostgresDb(), o.owner).getDraft(ex.data) }); } catch { return serverError(); }
}
export async function PUT(req: Request, { params }: Ctx) {
  const o = ownerOr503(); if ('res' in o) return o.res;
  const ex = id.safeParse((await params).exerciseId); if (!ex.success) return json({ error: 'Invalid exercise id.' }, 400);
  const b = await readBody(req, draftInput, 60_000); if ('res' in b) return b.res;
  try {
    const repo = practiceRepo(getPostgresDb(), o.owner);
    const rev = await repo.saveDraft(ex.data, b.data.language, b.data.code, b.data.rev);
    if (rev === null) return json({ error: 'This code was changed on another device.', current: await repo.getDraft(ex.data) }, 409);
    return json({ rev });
  } catch { return serverError(); }
}
