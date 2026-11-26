export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// No data, no secrets: which database label is configured and whether an owner is set.
export function GET() {
  return Response.json({
    ok: true,
    dbEnv: process.env.DB_ENV ?? 'unset',
    ownerConfigured: Boolean(process.env.OWNER_ID?.trim()),
    schemaVersion: 1,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
