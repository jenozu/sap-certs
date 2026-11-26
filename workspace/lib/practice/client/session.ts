'use client';
// Custom practice sessions: concept(s), difficulty, count, hints. Kept in sessionStorage.
import type { SessionInfo } from '@/components/practice/FocusView';
export interface Candidate { id: string; skills: string[]; difficulty: string }
/** Unattempted first, then not yet passed, then passed (stable within groups). */
export function pickExercises(all: Candidate[], o: { skills: string[]; difficulty: string[]; count: number }, passed: Set<string>, attempted: Set<string>): string[] {
  const match = all.filter(e => (!o.skills.length || e.skills.some(s => o.skills.includes(s))) && (!o.difficulty.length || o.difficulty.includes(e.difficulty)));
  const rank = (e: Candidate) => (!attempted.has(e.id) ? 0 : !passed.has(e.id) ? 1 : 2);
  return [...match].sort((a, b) => rank(a) - rank(b)).slice(0, o.count).map(e => e.id);
}
const KEY = (id: string) => `pathway.session.${id}`;
export function saveSession(s: SessionInfo) { try { sessionStorage.setItem(KEY(s.id), JSON.stringify(s)); } catch { /* storage unavailable */ } }
export function readSession(id: string | null, exerciseId: string): SessionInfo | undefined {
  if (!id) return undefined;
  try { const s = JSON.parse(sessionStorage.getItem(KEY(id)) ?? 'null') as SessionInfo | null; if (!s) return undefined; const index = s.ids.indexOf(exerciseId); return index < 0 ? undefined : { ...s, index }; } catch { return undefined; }
}
