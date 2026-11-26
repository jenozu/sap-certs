// Owner-scoped practice data access (every query filters by owner_id).
import { and, desc, eq, sql } from 'drizzle-orm';
import type { getPostgresDb } from '@/db/postgres';
import { exerciseAttempts, practiceSessions, savedCode, skills } from '@/db/postgres/schema';
import type { AttemptInput, SkillInput } from '@/lib/practice/schemas';

type Db = ReturnType<typeof getPostgresDb>;

export function practiceRepo(db: Db, owner: string) {
  return {
    // Attempts: insert-only; the client id is the idempotency key.
    async addAttempt(a: AttemptInput) {
      const independent = a.passed && a.hintsUsed === 0 && !a.solutionViewed;
      const rows = await db.insert(exerciseAttempts).values({
        ownerId: owner, id: a.id, language: a.language, exerciseId: a.exerciseId, exerciseVersion: a.exerciseVersion,
        contentHash: a.contentHash, packId: a.packId, skills: a.skills, mode: a.mode, code: a.code, passed: a.passed,
        correct: a.correct, constructOk: a.constructOk, results: a.results, hintsUsed: a.hintsUsed, solutionViewed: a.solutionViewed,
        independent, practiceSessionId: a.practiceSessionId ?? null, durationMs: a.durationMs,
        startedAt: new Date(a.startedAt), submittedAt: new Date(a.submittedAt),
      }).onConflictDoNothing().returning({ id: exerciseAttempts.id });
      return { created: rows.length === 1, independent };
    },
    listAttempts(filter: { exerciseId?: string; language?: string } = {}, limit = 200) {
      const conds = [eq(exerciseAttempts.ownerId, owner)];
      if (filter.exerciseId) conds.push(eq(exerciseAttempts.exerciseId, filter.exerciseId));
      if (filter.language) conds.push(eq(exerciseAttempts.language, filter.language));
      return db.select({
        id: exerciseAttempts.id, exerciseId: exerciseAttempts.exerciseId, exerciseVersion: exerciseAttempts.exerciseVersion, language: exerciseAttempts.language,
        skills: exerciseAttempts.skills, mode: exerciseAttempts.mode, passed: exerciseAttempts.passed, independent: exerciseAttempts.independent,
        hintsUsed: exerciseAttempts.hintsUsed, solutionViewed: exerciseAttempts.solutionViewed, submittedAt: exerciseAttempts.submittedAt,
      }).from(exerciseAttempts).where(and(...conds)).orderBy(desc(exerciseAttempts.submittedAt)).limit(limit);
    },
    async allAttempts() { return db.select().from(exerciseAttempts).where(eq(exerciseAttempts.ownerId, owner)); },

    // Drafts: rev-checked upsert. rev 0 = create.
    async getDraft(exerciseId: string) {
      const [r] = await db.select({ code: savedCode.code, rev: savedCode.rev, updatedAt: savedCode.updatedAt }).from(savedCode)
        .where(and(eq(savedCode.ownerId, owner), eq(savedCode.exerciseId, exerciseId))).limit(1);
      return r ?? null;
    },
    async saveDraft(exerciseId: string, language: string, code: string, rev: number) {
      const rows = rev === 0
        ? await db.insert(savedCode).values({ ownerId: owner, exerciseId, language, code }).onConflictDoNothing().returning({ rev: savedCode.rev })
        : await db.update(savedCode).set({ code, rev: sql`${savedCode.rev} + 1`, updatedAt: new Date() })
            .where(and(eq(savedCode.ownerId, owner), eq(savedCode.exerciseId, exerciseId), eq(savedCode.rev, rev))).returning({ rev: savedCode.rev });
      return rows[0]?.rev ?? null;
    },
    allDrafts() { return db.select().from(savedCode).where(eq(savedCode.ownerId, owner)); },

    // Skills: dynamic concept library.
    listSkills(language?: string) {
      const conds = [eq(skills.ownerId, owner)];
      if (language) conds.push(eq(skills.language, language));
      return db.select().from(skills).where(and(...conds)).orderBy(skills.language, skills.name);
    },
    async upsertSkills(list: SkillInput[]) {
      if (!list.length) return [];
      return db.insert(skills).values(list.map(s => ({ ownerId: owner, ...s }))).onConflictDoUpdate({
        target: [skills.ownerId, skills.id],
        set: {
          aliases: sql`(select array(select distinct unnest(${skills.aliases} || excluded.aliases)))`,
          tags: sql`(select array(select distinct unnest(${skills.tags} || excluded.tags)))`,
          source: sql`case when ${skills.source} = '' then excluded.source else ${skills.source} end`,
          notes: sql`case when excluded.notes = '' then ${skills.notes} when ${skills.notes} = '' then excluded.notes else ${skills.notes} || E'\n\n' || excluded.notes end`,
          rev: sql`${skills.rev} + 1`, updatedAt: new Date(),
        },
      }).returning();
    },

    async startSession(id: string, language: string, config: unknown) {
      await db.insert(practiceSessions).values({ ownerId: owner, id, language, config }).onConflictDoNothing();
    },
    async endSession(id: string) {
      await db.update(practiceSessions).set({ endedAt: new Date() }).where(and(eq(practiceSessions.ownerId, owner), eq(practiceSessions.id, id)));
    },
    allSessions() { return db.select().from(practiceSessions).where(eq(practiceSessions.ownerId, owner)); },
  };
}

/** Export all practice data for an owner in importable shape. */
export async function exportPractice(db: Db, owner: string) {
  const repo = practiceRepo(db, owner);
  const [sk, at, dr, se] = await Promise.all([repo.listSkills(), repo.allAttempts(), repo.allDrafts(), repo.allSessions()]);
  return {
    skills: sk.map(s => ({ id: s.id, language: s.language, name: s.name, aliases: s.aliases, tags: s.tags, source: s.source, notes: s.notes, state: s.state })),
    attempts: at.map(a => ({ id: a.id, language: a.language, exerciseId: a.exerciseId, exerciseVersion: a.exerciseVersion, contentHash: a.contentHash, packId: a.packId, skills: a.skills, mode: a.mode, code: a.code, passed: a.passed, correct: a.correct, constructOk: a.constructOk, results: a.results, hintsUsed: a.hintsUsed, solutionViewed: a.solutionViewed, practiceSessionId: a.practiceSessionId, durationMs: a.durationMs, startedAt: a.startedAt.toISOString(), submittedAt: a.submittedAt.toISOString() })),
    drafts: dr.map(d => ({ exerciseId: d.exerciseId, language: d.language, code: d.code })),
    sessions: se.map(s => ({ id: s.id, language: s.language, config: s.config, startedAt: s.startedAt.toISOString(), endedAt: s.endedAt?.toISOString() ?? null })),
  };
}

/** Idempotent: attempts by id, skills merged (existing state kept), drafts only where none exist. */
export async function importPractice(db: Db, owner: string, p: import('@/lib/practice/export').PracticeExport, dryRun: boolean) {
  const repo = practiceRepo(db, owner);
  const [sk, at, dr] = await Promise.all([repo.listSkills(), repo.allAttempts(), repo.allDrafts()]);
  const haveSk = new Set(sk.map(s => s.id)), haveAt = new Set(at.map(a => a.id)), haveDr = new Set(dr.map(d => d.exerciseId));
  const plan = { skillsAdded: p.skills.filter(s => !haveSk.has(s.id)).length, skillsMerged: p.skills.filter(s => haveSk.has(s.id)).length, attemptsAdded: p.attempts.filter(a => !haveAt.has(a.id)).length, draftsAdded: p.drafts.filter(d => !haveDr.has(d.exerciseId)).length };
  if (dryRun) return plan;
  for (let i = 0; i < p.skills.length; i += 50) await repo.upsertSkills(p.skills.slice(i, i + 50).map(({ state: _s, ...rest }) => { void _s; return rest; }));
  const newStates = p.skills.filter(s => !haveSk.has(s.id) && s.state !== 'introduced');
  for (const s of newStates) await db.update(skills).set({ state: s.state }).where(and(eq(skills.ownerId, owner), eq(skills.id, s.id)));
  for (const a of p.attempts) if (!haveAt.has(a.id)) await repo.addAttempt(a);
  for (const d of p.drafts) if (!haveDr.has(d.exerciseId)) await repo.saveDraft(d.exerciseId, d.language, d.code, 0);
  return plan;
}
