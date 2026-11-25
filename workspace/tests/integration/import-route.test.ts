/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '../helpers/db';
import { initial } from '@/app/model';

let testDb: Awaited<ReturnType<typeof createTestDb>>;
vi.mock('@/db/postgres', () => ({ getPostgresDb: () => testDb.db }));
const { POST } = await import('@/app/api/workspace/import/route');
const { GET } = await import('@/app/api/workspace/route');

const post = async (body: unknown, dry = false) => {
  const r = await POST(new Request('http://localhost/api/workspace/import' + (dry ? '?dryRun=1' : ''), { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  return { status: r.status, body: (await r.json()) as any };
};
beforeAll(async () => { testDb = await createTestDb(); });
beforeEach(() => { process.env.OWNER_ID = 'owner:import'; });

describe('import route', () => {
  it('dry run changes nothing; apply snapshots first; re-import is a no-op', async () => {
    const file = structuredClone(initial);
    file.items.push({ ...file.items[5], id: 'custom-x', title: 'From Sites' });
    const dry = await post({ file: { exportedAt: 'x', workspace: file }, version: 0 }, true);
    expect(dry.status).toBe(200);
    expect(dry.body.plan.added).toEqual(['custom-x']);
    expect((await (await GET()).json() as any).version).toBe(0);
    const applied = await post({ file: { workspace: file }, version: 0 });
    expect(applied.status).toBe(200);
    expect(applied.body.version).toBe(1);
    const snaps = await testDb.client.query<{ source: string; version: number }>('select source, version from workspace_snapshots where owner_id = $1', ['owner:import']);
    expect(snaps.rows).toEqual([{ source: 'pre-import', version: 0 }]);
    const again = await post({ file: { workspace: file }, version: 1 }, true);
    expect(again.body.plan.added).toEqual([]);
  });
  it('rejects malformed files, unsafe URLs, stale versions and missing owner', async () => {
    expect((await post({ file: { workspace: { nope: 1 } }, version: 1 })).status).toBe(400);
    const bad = structuredClone(initial); bad.items[0].url = 'javascript:alert(1)';
    const r = await post({ file: { workspace: bad }, version: 1 });
    expect(r.status).toBe(400); expect(r.body.error).toContain('items.0.url');
    expect((await post({ file: { workspace: initial }, version: 0 })).status).toBe(409);
    delete process.env.OWNER_ID;
    expect((await post({ file: { workspace: initial }, version: 0 })).status).toBe(503);
  });
});
