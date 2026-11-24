import { auth } from '@/auth';
import { getPostgresDb } from '@/db/postgres';
import { workspaceRepository } from '@/db/postgres/repository';
import { initial, stateSchema } from '../../model';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
async function userId() {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id?.startsWith('github:') ? id : null;
}
export async function GET() {
  try {
    const uid = await userId();
    if (!uid) return response({ error: 'Sign in to load your workspace.' }, 401);
    const row = await workspaceRepository(getPostgresDb()).load(uid);
    return response(row ?? { data: initial, version: 0 });
  } catch { return response({ error: 'Your workspace could not be loaded. Please retry.' }, 503); }
}
export async function PUT(req: Request) {
  try {
    const uid = await userId();
    if (!uid) return response({ error: 'Sign in to save your workspace.' }, 401);
    if (req.headers.get('origin') !== new URL(req.url).origin) return response({ error: 'Invalid request origin.' }, 403);
    if (!req.headers.get('content-type')?.startsWith('application/json')) return response({ error: 'Expected JSON.' }, 415);
    const raw = await req.text();
    if (raw.length > 500000) return response({ error: 'Workspace is too large.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return response({ error: 'Invalid JSON.' }, 400); }
    const parsed = stateSchema.safeParse(body?.data);
    if (!parsed.success || !Number.isSafeInteger(body?.version) || body.version < 0)
      return response({ error: 'Check your fields and use valid http or https links.' }, 400);
    const version = await workspaceRepository(getPostgresDb()).save(uid, parsed.data, body.version);
    if (version === null) return response({ error: 'This workspace changed in another tab. Reload before saving; your open edit is still here.' }, 409);
    return response({ version });
  } catch { return response({ error: 'Save failed. Your previous saved data is safe. Please retry.' }, 503); }
}
