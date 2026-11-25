import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';
describe('health', () => {
  it('reports labels only', async () => {
    process.env.DB_ENV = 'preview'; process.env.OWNER_ID = 'x';
    const body = await GET().json();
    expect(body).toEqual({ ok: true, dbEnv: 'preview', ownerConfigured: true, schemaVersion: 1 });
  });
});
