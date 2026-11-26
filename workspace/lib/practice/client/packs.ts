'use client';
// Loads bundled packs (built at prebuild into /packs). Imported packs join this registry in Release 2.
import type { PracticeExercise } from '../adapters/types';
import type { ValidPack } from '../packs/validate';

export interface PackSummary { id: string; version: string; language: string; title: string; description: string; exercises: { id: string; title: string; skills: string[]; difficulty: string; kind: string }[] }
let indexP: Promise<PackSummary[]> | undefined;
const packP = new Map<string, Promise<ValidPack>>();

export function listPacks(): Promise<PackSummary[]> {
  indexP ??= fetch('/packs/index.json').then(r => { if (!r.ok) throw new Error('Could not load practice packs.'); return r.json() as Promise<{ packs: PackSummary[] }>; }).then(j => j.packs);
  indexP.catch(() => { indexP = undefined; });
  return indexP;
}
export function loadPack(id: string): Promise<ValidPack> {
  if (!packP.has(id)) {
    const p = fetch(`/packs/${encodeURIComponent(id)}.json`).then(r => { if (!r.ok) throw new Error(`Could not load pack ${id}.`); return r.json() as Promise<ValidPack>; });
    p.catch(() => packP.delete(id));
    packP.set(id, p);
  }
  return packP.get(id)!;
}
/** Exercise with its SQL context resolved (fixtures) and the pack it came from. */
export async function findExercise(exerciseId: string): Promise<{ exercise: PracticeExercise; pack: ValidPack } | null> {
  for (const s of await listPacks()) {
    if (!s.exercises.some(e => e.id === exerciseId)) continue;
    const pack = await loadPack(s.id);
    const ex = pack.exercises.find(e => e.id === exerciseId);
    if (ex) return { pack, exercise: { ...ex, context: { ...(ex.context as object), fixtures: pack.fixtures } } };
  }
  return null;
}
export const contentHashOf = (ex: PracticeExercise) => (ex.context as { contentHash?: string } | undefined)?.contentHash ?? 'unknown';
