// Task 10: validated, non-destructive merge of an exported workspace into the current one.
import { stateSchema, type Workspace, type Item } from '@/app/model';

export const exportFileSchema = stateSchema; // the export's `workspace` field
export type Choice = 'keep' | 'incoming';
export type ImportPlan = {
  added: string[];          // item ids only in the file
  differing: string[];      // same id, different content
  same: number;
  sessionsAdded: string[];  // dates only in the file
  sessionsDiffering: string[];
};

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Accepts the export format {exportedAt, workspace} or a bare workspace object. */
export function parseImportFile(raw: unknown): { ok: true; workspace: Workspace } | { ok: false; error: string } {
  const candidate = (raw && typeof raw === 'object' && 'workspace' in raw) ? (raw as { workspace: unknown }).workspace : raw;
  const r = stateSchema.safeParse(candidate);
  if (!r.success) {
    const i = r.error.issues[0];
    return { ok: false, error: `Invalid file at ${i.path.join('.') || '(root)'}: ${i.message}` };
  }
  return { ok: true, workspace: r.data };
}

export function planImport(current: Workspace, incoming: Workspace): ImportPlan {
  const byId = new Map(current.items.map(i => [i.id, i]));
  const plan: ImportPlan = { added: [], differing: [], same: 0, sessionsAdded: [], sessionsDiffering: [] };
  for (const it of incoming.items) {
    const cur = byId.get(it.id);
    if (!cur) plan.added.push(it.id);
    else if (eq(cur, it)) plan.same++;
    else plan.differing.push(it.id);
  }
  for (const [date, s] of Object.entries(incoming.sessions)) {
    if (!(date in current.sessions)) plan.sessionsAdded.push(date);
    else if (!eq(current.sessions[date], s)) plan.sessionsDiffering.push(date);
  }
  return plan;
}

/** Never removes anything. Differing items/sessions keep the current version unless chosen 'incoming'. */
export function applyImport(current: Workspace, incoming: Workspace, choices: Record<string, Choice> = {}): Workspace {
  const next: Workspace = structuredClone(current);
  const index = new Map(next.items.map((i, n) => [i.id, n]));
  for (const it of incoming.items) {
    const n = index.get(it.id);
    if (n === undefined) next.items.push(structuredClone(it) as Item);
    else if (choices[`item:${it.id}`] === 'incoming') next.items[n] = structuredClone(it) as Item;
  }
  for (const [date, s] of Object.entries(incoming.sessions)) {
    if (!(date in next.sessions) || choices[`session:${date}`] === 'incoming') next.sessions[date] = structuredClone(s);
  }
  return stateSchema.parse(next);
}
