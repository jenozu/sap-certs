// Test database: in-process Postgres (PGlite) with the real SQL migrations applied.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import * as schema from '@/db/postgres/schema';

export async function createTestDb() {
  const client = new PGlite();
  const dir = new URL('../../drizzle-postgres/', import.meta.url);
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort())
    await client.exec(readFileSync(new URL(f, dir), 'utf8'));
  return { client, db: drizzle(client, { schema }) };
}
