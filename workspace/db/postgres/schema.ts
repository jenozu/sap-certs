import { pgTable, text, jsonb, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const workspaces = pgTable('workspaces', {
  userId: text('user_id').primaryKey(),
  data: jsonb('data').notNull(),
  version: integer('version').notNull().default(1),
}, (table) => [check('workspaces_version_check', sql`${table.version} >= 1`)]);
