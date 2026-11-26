import { getPostgresDb } from '@/db/postgres';
import { workspaceRepository } from '@/db/postgres/repository';
import { initial, stateSchema } from '../../model';
import { resolveOwner, OwnerNotConfigured } from '@/lib/server/owner';
import { guardMutation } from '@/lib/server/guard';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
// Vercel Deployment Protection (all deployments) is the only access gate.
// The owner is fixed server-side via OWNER_ID; requests fail closed without it.
const notConfigured = () => response({ error: 'Server not configured.' }, 503);
export async function GET() {
  let uid: string;
  try { uid = resolveOwner(); } catch (e) { if (e instanceof OwnerNotConfigured) return notConfigured(); throw e; }
  try {
    const row = await workspaceRepository(getPostgresDb()).load(uid);
    return response(row ?? { data: initial, version: 0 });
  } catch { return response({ error: 'Your workspace could not be loaded. Please retry.' }, 503); }
}
export async function PUT(req: Request) {
  let uid: string;
  try { uid = resolveOwner(); } catch (e) { if (e instanceof OwnerNotConfigured) return notConfigured(); throw e; }
  const blocked = guardMutation(req, 500000);
  if (blocked) return blocked;
  try {
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
