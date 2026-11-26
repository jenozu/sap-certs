import { getPostgresDb } from '@/db/postgres';
import { workspaceRepository } from '@/db/postgres/repository';
import { exportPractice } from '@/lib/server/practice-repo';
import { initial } from '@/app/model';
import { json, ownerOr503, serverError } from '@/lib/server/route';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Full backup: workspace document (v1 shape) + practice data.
export async function GET() {
  const o = ownerOr503(); if ('res' in o) return o.res;
  try {
    const db = getPostgresDb();
    const row = await workspaceRepository(db).load(o.owner);
    return json({ format: 'pathway-export', version: 2, exportedAt: new Date().toISOString(), workspace: row?.data ?? initial, practice: await exportPractice(db, o.owner) });
  } catch { return serverError(); }
}
