import { pgTable, text, jsonb, integer, check, bigserial, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const workspaces = pgTable('workspaces', {
  userId: text('user_id').primaryKey(),
  data: jsonb('data').notNull(),
  version: integer('version').notNull().default(1),
}, (table) => [check('workspaces_version_check', sql`${table.version} >= 1`)]);

export const workspaceSnapshots = pgTable('workspace_snapshots', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ownerId: text('owner_id').notNull(),
  source: text('source').notNull(),
  data: jsonb('data').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
