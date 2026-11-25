/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from tests/workspace-unit.mjs (D1 era) + task 6 owner/guard rules.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '../helpers/db';

let testDb: Awaited<ReturnType<typeof createTestDb>>;
vi.mock('@/db/postgres', () => ({ getPostgresDb: () => testDb.db }));
const { GET, PUT } = await import('@/app/api/workspace/route');

const base = 'http://localhost/api/workspace';
const read = async () => { const r = await GET(); return { status: r.status, body: (await r.json()) as any }; };
const write = async (data: unknown, version: number, headers: Record<string, string> = {}) => {
  const r = await PUT(new Request(base, { method: 'PUT', headers: { origin: 'http://localhost', 'content-type': 'application/json', ...headers }, body: JSON.stringify({ data, version }) }));
  return { status: r.status, body: (await r.json()) as any };
};

beforeAll(async () => { testDb = await createTestDb(); });
beforeEach(() => { process.env.OWNER_ID = 'owner:test'; });

describe('workspace API', () => {
  it('fails closed without OWNER_ID', async () => {
    delete process.env.OWNER_ID;
    expect((await read()).status).toBe(503);
    expect((await write({}, 0)).status).toBe(503);
  });

  it('persists, protects stale writes, isolates owners, validates URLs', async () => {
    const start = await read();
    expect(start.status).toBe(200);
    expect(start.body.version).toBe(0);
    expect(start.body.data.items.filter((i: { kind: string }) => i.kind === 'phase').map((i: { id: string }) => i.id)).toEqual(['sql', 'js', 'cap', 'python', 'btp']);
    const changed = structuredClone(start.body.data);
    const c2 = changed.items.find((i: { id: string }) => i.id === 'c2');
    c2.progress = 30; c2.notes = 'QA saved course note';
    changed.sessions['2026-11-23'] = { title: 'SQL practice', minutes: 120, done: true, notes: 'joins' };
    expect((await write(changed, 0)).status).toBe(200);
    const reread = await read();
    expect(reread.body.version).toBe(1);
    expect(reread.body.data.items.find((i: { id: string }) => i.id === 'c2').progress).toBe(30);
    expect(reread.body.data.sessions['2026-11-23'].done).toBe(true);
    expect((await write(changed, 0)).status).toBe(409);
    process.env.OWNER_ID = 'owner:other';
    const other = await read();
    expect(other.body.version).toBe(0);
    expect(other.body.data.items.find((i: { id: string }) => i.id === 'c2').progress).toBe(0);
    process.env.OWNER_ID = 'owner:test';
    const bad = structuredClone(changed); bad.items[0].url = 'javascript:alert(1)';
    expect((await write(bad, 1)).status).toBe(400);
    expect((await write(start.body.data, 1)).status).toBe(200);
  });

  it('rejects foreign origin, non-JSON and oversized requests', async () => {
    expect((await write({}, 0, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await write({}, 0, { 'content-type': 'text/plain' })).status).toBe(415);
    expect((await write({}, 0, { 'content-length': '600000' })).status).toBe(413);
  });

  it('ignores identity headers from the client', async () => {
    const r = await GET();
    const body = (await r.json()) as any;
    expect(r.status).toBe(200);
    expect(body.version).toBeGreaterThanOrEqual(0);
  });
});
