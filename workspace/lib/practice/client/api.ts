'use client';
// Practice API client with an offline queue (IndexedDB) for attempts and drafts.
// Attempts are idempotent by id, so replaying the queue can never duplicate them.
import type { AttemptInput, SkillInput } from '../schemas';

const DB = 'pathway-practice', STORE = 'outbox';
type Outbox = { key: string; url: string; method: 'POST' | 'PUT'; body: unknown; queuedAt: number };

function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'key' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const q = fn(t.objectStore(STORE)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
const enqueue = (o: Outbox) => tx('readwrite', s => s.put(o));
export const pendingCount = () => tx('readonly', s => s.count()).catch(() => 0);

async function send(url: string, method: string, body: unknown) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body: j as Record<string, unknown> };
}
const isNetworkError = (e: unknown) => e instanceof TypeError;

export async function flushOutbox(): Promise<number> {
  let sent = 0;
  const all = await tx<Outbox[]>('readonly', s => s.getAll() as IDBRequest<Outbox[]>).catch(() => []);
  for (const o of all.sort((a, b) => a.queuedAt - b.queuedAt)) {
    try {
      const r = await send(o.url, o.method, o.body);
      if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 409)) { await tx('readwrite', s => s.delete(o.key)); sent++; }
    } catch (e) { if (isNetworkError(e)) break; }
  }
  return sent;
}

export async function recordAttempt(a: AttemptInput): Promise<'saved' | 'queued'> {
  try {
    const r = await send('/api/v2/attempts', 'POST', a);
    if (r.ok) return 'saved';
    if (r.status >= 500) { await enqueue({ key: `attempt:${a.id}`, url: '/api/v2/attempts', method: 'POST', body: a, queuedAt: Date.now() }); return 'queued'; }
    throw new Error(String(r.body.error ?? 'Could not save this attempt.'));
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    await enqueue({ key: `attempt:${a.id}`, url: '/api/v2/attempts', method: 'POST', body: a, queuedAt: Date.now() });
    return 'queued';
  }
}

export interface Draft { code: string; rev: number }
export async function getDraft(exerciseId: string): Promise<Draft | null> {
  try { const r = await fetch(`/api/v2/drafts/${encodeURIComponent(exerciseId)}`); if (!r.ok) return null; return ((await r.json()) as { draft: Draft | null }).draft ?? null; } catch { return null; }
}
export async function saveDraft(exerciseId: string, language: string, code: string, rev: number): Promise<{ rev: number } | { conflict: Draft } | { queued: true }> {
  const url = `/api/v2/drafts/${encodeURIComponent(exerciseId)}`;
  try {
    const r = await send(url, 'PUT', { language, code, rev });
    if (r.ok) return { rev: r.body.rev as number };
    if (r.status === 409) return { conflict: r.body.current as Draft };
    throw new Error(String(r.body.error ?? 'Could not save your code.'));
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    await enqueue({ key: `draft:${exerciseId}`, url, method: 'PUT', body: { language, code, rev }, queuedAt: Date.now() });
    return { queued: true };
  }
}

export async function listAttempts(q: { exerciseId?: string; language?: string } = {}) {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
  const r = await fetch(`/api/v2/attempts?${p}`); if (!r.ok) throw new Error('Could not load attempts.');
  return ((await r.json()) as { attempts: unknown }).attempts as { id: string; exerciseId: string; passed: boolean; independent: boolean; submittedAt: string; skills: string[]; language: string }[];
}
export async function listSkills(language?: string) {
  const r = await fetch(`/api/v2/skills${language ? `?language=${encodeURIComponent(language)}` : ''}`); if (!r.ok) throw new Error('Could not load concepts.');
  return ((await r.json()) as { skills: unknown }).skills as (SkillInput & { state: string; createdAt: string })[];
}
export async function registerSkills(skills: SkillInput[]) {
  const r = await send('/api/v2/skills', 'POST', { skills }); if (!r.ok) throw new Error(String(r.body.error ?? 'Could not save concepts.'));
  return r.body.skills as (SkillInput & { state: string })[];
}
export async function startSession(id: string, language: string, config: { skills: string[]; difficulty: ('intro' | 'core' | 'stretch')[]; count: number; hints: boolean; mode: string }) {
  await send('/api/v2/practice-sessions', 'POST', { id, language, config }).catch(() => undefined);
}
export const endSession = (id: string) => send('/api/v2/practice-sessions', 'POST', { end: id }).catch(() => undefined);
