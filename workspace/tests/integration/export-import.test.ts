/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '../helpers/db';

let testDb: Awaited<ReturnType<typeof createTestDb>>;
vi.mock('@/db/postgres', () => ({ getPostgresDb: () => testDb.db }));
const exp = await import('@/app/api/v2/export/route');
const imp = await import('@/app/api/workspace/import/route');
const attempts = await import('@/app/api/v2/attempts/route');
const skillsApi = await import('@/app/api/v2/skills/route');
const drafts = await import('@/app/api/v2/drafts/[exerciseId]/route');

const post = (url: string, body: unknown, method = 'POST') => new Request('http://localhost' + url, { method, headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify(body) });
const att = (id: string) => ({ id, language: 'sql', exerciseId: 'sql.cte.supplier-spend', exerciseVersion: '1.0.0', contentHash: 'h', packId: 'sql-erp-core', skills: ['sql-cte'], mode: 'targeted', code: 'select 1', passed: true, correct: true, constructOk: true, results: [], hintsUsed: 0, solutionViewed: false, durationMs: 10, startedAt: '2026-11-26T10:00:00.000Z', submittedAt: '2026-11-26T10:01:00.000Z' });

beforeAll(async () => { testDb = await createTestDb(); });

describe('export v2 → import round trip', () => {
  it('reproduces practice data in an empty owner and re-import changes nothing', async () => {
    process.env.OWNER_ID = 'owner:source';
    await attempts.POST(post('/api/v2/attempts', att('a1')));
    await attempts.POST(post('/api/v2/attempts', att('a2')));
    await skillsApi.POST(post('/api/v2/skills', { skills: [{ id: 'sql-cte', language: 'sql', name: 'WITH / CTE', tags: ['joins'] }] }));
    await drafts.PUT(post('/x', { language: 'sql', code: 'with x as (select 1) select * from x', rev: 0 }, 'PUT'), { params: Promise.resolve({ exerciseId: 'sql.cte.supplier-spend' }) });
    const file = await (await exp.GET()).json() as any;
    expect(file).toMatchObject({ format: 'pathway-export', version: 2 });
    expect(file.practice.attempts).toHaveLength(2);

    process.env.OWNER_ID = 'owner:target';
    const dry = await (await imp.POST(post('/api/workspace/import?dryRun=1', { file, version: 0 }))).json() as any;
    expect(dry.practice).toEqual({ skillsAdded: 1, skillsMerged: 0, attemptsAdded: 2, draftsAdded: 1 });
    expect((await imp.POST(post('/api/workspace/import', { file, version: 0 }))).status).toBe(200);
    const after = await (await exp.GET()).json() as any;
    expect(after.practice.attempts.map((a: any) => a.id).sort()).toEqual(['a1', 'a2']);
    expect(after.practice.skills[0]).toMatchObject({ id: 'sql-cte', tags: ['joins'] });
    expect(after.practice.drafts[0].code).toContain('with x');
    const again = await (await imp.POST(post('/api/workspace/import?dryRun=1', { file, version: 1 }))).json() as any;
    expect(again.practice).toMatchObject({ skillsAdded: 0, attemptsAdded: 0, draftsAdded: 0 });
  });
  it('still imports v1 files (no practice section) and rejects invalid practice data', async () => {
    process.env.OWNER_ID = 'owner:v1';
    const v1 = { exportedAt: 'x', workspace: (await import('@/app/model')).initial };
    const r = await (await imp.POST(post('/api/workspace/import?dryRun=1', { file: v1, version: 0 }))).json() as any;
    expect(r.practice).toBeNull();
    const bad = await imp.POST(post('/api/workspace/import?dryRun=1', { file: { ...v1, practice: { attempts: [{ id: 'x' }] } }, version: 0 }));
    expect(bad.status).toBe(400);
  });
});
