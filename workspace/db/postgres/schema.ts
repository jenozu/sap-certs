import { pgTable, text, jsonb, integer, check, bigserial, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
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

export const skills = pgTable('skills', {
  ownerId: text('owner_id').notNull(), id: text('id').notNull(), language: text('language').notNull(),
  name: text('name').notNull(), aliases: text('aliases').array().notNull().default(sql`'{}'`), tags: text('tags').array().notNull().default(sql`'{}'`),
  state: text('state').notNull().default('introduced'), source: text('source').notNull().default(''), notes: text('notes').notNull().default(''),
  rev: integer('rev').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.ownerId, t.id] })]);

export const practiceSessions = pgTable('practice_sessions', {
  ownerId: text('owner_id').notNull(), id: text('id').notNull(), language: text('language').notNull(), config: jsonb('config').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(), endedAt: timestamp('ended_at', { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.ownerId, t.id] })]);

export const exerciseAttempts = pgTable('exercise_attempts', {
  ownerId: text('owner_id').notNull(), id: text('id').notNull(), language: text('language').notNull(),
  exerciseId: text('exercise_id').notNull(), exerciseVersion: text('exercise_version').notNull(), contentHash: text('content_hash').notNull(), packId: text('pack_id').notNull(),
  skills: text('skills').array().notNull().default(sql`'{}'`), mode: text('mode').notNull(), code: text('code').notNull(),
  passed: boolean('passed').notNull(), correct: boolean('correct').notNull(), constructOk: boolean('construct_ok').notNull(), results: jsonb('results').notNull(),
  hintsUsed: integer('hints_used').notNull().default(0), solutionViewed: boolean('solution_viewed').notNull().default(false), independent: boolean('independent').notNull(),
  practiceSessionId: text('practice_session_id'), durationMs: integer('duration_ms').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(), submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.ownerId, t.id] })]);

export const savedCode = pgTable('saved_code', {
  ownerId: text('owner_id').notNull(), exerciseId: text('exercise_id').notNull(), language: text('language').notNull(),
  code: text('code').notNull(), rev: integer('rev').notNull().default(1), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.ownerId, t.exerciseId] })]);
