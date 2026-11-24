import { and, eq, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { workspaces } from './schema';

// The caller must derive userId from a verified server-side session.
export function workspaceRepository(db: PgDatabase<PgQueryResultHKT>) {
  return {
    async load(userId: string) {
      const [row] = await db.select({ data: workspaces.data, version: workspaces.version })
        .from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
      return row ?? null;
    },
    async save(userId: string, data: unknown, version: number) {
      if (!Number.isSafeInteger(version) || version < 0) throw new Error('Invalid revision');
      const rows = version === 0
        ? await db.insert(workspaces).values({ userId, data, version: 1 })
            .onConflictDoNothing({ target: workspaces.userId }).returning({ version: workspaces.version })
        : await db.update(workspaces).set({ data, version: sql`${workspaces.version} + 1` })
            .where(and(eq(workspaces.userId, userId), eq(workspaces.version, version)))
            .returning({ version: workspaces.version });
      return rows[0]?.version ?? null;
    },
  };
}
