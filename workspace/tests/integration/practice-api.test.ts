/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '../helpers/db';

let testDb: Awaited<ReturnType<typeof createTestDb>>;
vi.mock('@/db/postgres', () => ({ getPostgresDb: () => testDb.db }));
const attempts = await import('@/app/api/v2/attempts/route');
const drafts = await import('@/app/api/v2/drafts/[exerciseId]/route');
const skillsApi = await import('@/app/api/v2/skills/route');

const req = (url: string, method: string, body?: unknown, extra: Record<string, string> = {}) =>
  new Request('http://localhost' + url, { method, headers: { origin: 'http://localhost', 'content-type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
const out = async (r: Response) => ({ status: r.status, body: (await r.json()) as any });
const attempt = (over: Record<string, unknown> = {}) => ({
  id: 'att-1', language: 'SQL', exerciseId: 'sql.left-join.unsold-products', exerciseVersion: '1.0.0', contentHash: 'abc', packId: 'sql-erp-core',
  skills: ['sql-left-join'], mode: 'targeted', code: 'select 1', passed: true, correct: true, constructOk: true,
  results: [{ name: 'Dataset base', passed: true }], hintsUsed: 0, solutionViewed: false, durationMs: 1200,
  startedAt: '2026-11-26T10:00:00Z', submittedAt: '2026-11-26T10:01:00Z', ...over,
});
const ctx = (exerciseId: string) => ({ params: Promise.resolve({ exerciseId }) });

beforeAll(async () => { testDb = await createTestDb(); });
beforeEach(() => { process.env.OWNER_ID = 'owner:p'; });

describe('attempts', () => {
  it('records once per id, computes independence server-side, normalises language', async () => {
    expect((await out(await attempts.POST(req('/api/v2/attempts', 'POST', attempt())))).status).toBe(201);
    expect((await out(await attempts.POST(req('/api/v2/attempts', 'POST', attempt())))).status).toBe(200);
    await attempts.POST(req('/api/v2/attempts', 'POST', attempt({ id: 'att-2', hintsUsed: 1 })));
    const list = await out(await attempts.GET(req('/api/v2/attempts?exerciseId=sql.left-join.unsold-products', 'GET')));
    expect(list.body.attempts).toHaveLength(2);
    expect(list.body.attempts.map((a: any) => [a.id, a.independent, a.language]).sort()).toEqual([['att-1', true, 'sql'], ['att-2', false, 'sql']]);
  });
  it('isolates owners and validates input', async () => {
    process.env.OWNER_ID = 'owner:other';
    expect((await out(await attempts.GET(req('/api/v2/attempts', 'GET')))).body.attempts).toEqual([]);
    expect((await out(await attempts.POST(req('/api/v2/attempts', 'POST', attempt({ id: 'bad id!' }))))).status).toBe(400);
    expect((await out(await attempts.POST(req('/api/v2/attempts', 'POST', attempt(), { origin: 'https://evil.example' })))).status).toBe(403);
    delete process.env.OWNER_ID;
    expect((await attempts.GET(req('/api/v2/attempts', 'GET'))).status).toBe(503);
  });
});

describe('drafts', () => {
  it('creates, updates with rev, and rejects stale writes with the current copy', async () => {
    const ex = 'sql.cte.supplier-spend';
    expect((await out(await drafts.GET(req('/x', 'GET'), ctx(ex)))).body.draft).toBeNull();
    expect((await out(await drafts.PUT(req('/x', 'PUT', { language: 'sql', code: 'v1', rev: 0 }), ctx(ex)))).body.rev).toBe(1);
    expect((await out(await drafts.PUT(req('/x', 'PUT', { language: 'sql', code: 'v2', rev: 1 }), ctx(ex)))).body.rev).toBe(2);
    const stale = await out(await drafts.PUT(req('/x', 'PUT', { language: 'sql', code: 'old', rev: 1 }), ctx(ex)));
    expect(stale.status).toBe(409);
    expect(stale.body.current.code).toBe('v2');
  });
});

describe('skills', () => {
  it('registers concepts for any language and merges on re-register without resetting state', async () => {
    const r = await out(await skillsApi.POST(req('/api/v2/skills', 'POST', { skills: [
      { id: 'sql-cte', language: 'sql', name: 'WITH / CTE', aliases: ['with clause'], tags: ['joins'] },
      { id: 'js-closures', language: 'JavaScript', name: 'Closures', source: 'freeCodeCamp' },
    ] })));
    expect(r.status).toBe(200);
    await testDb.client.query(`update skills set state = 'understood' where id = 'sql-cte'`);
    await skillsApi.POST(req('/api/v2/skills', 'POST', { skills: [{ id: 'sql-cte', language: 'sql', name: 'WITH / CTE', aliases: ['common table expression'], notes: 'from Codecademy' }] }));
    const list = (await out(await skillsApi.GET(req('/api/v2/skills', 'GET')))).body.skills;
    const cte = list.find((s: any) => s.id === 'sql-cte');
    expect(cte.state).toBe('understood');
    expect(cte.aliases.sort()).toEqual(['common table expression', 'with clause']);
    expect(list.find((s: any) => s.id === 'js-closures').language).toBe('javascript');
    expect((await out(await skillsApi.GET(req('/api/v2/skills?language=javascript', 'GET')))).body.skills).toHaveLength(1);
  });
});
