import { describe, expect, it } from 'vitest';
import { initial } from '@/app/model';
import { applyImport, parseImportFile, planImport } from '@/lib/workspace/import';

const clone = () => structuredClone(initial);
describe('workspace import', () => {
  it('accepts export format and bare workspace; rejects invalid with a field path', () => {
    expect(parseImportFile({ exportedAt: 'x', workspace: clone() }).ok).toBe(true);
    expect(parseImportFile(clone()).ok).toBe(true);
    const bad = clone(); bad.items[0].url = 'javascript:alert(1)';
    const r = parseImportFile({ workspace: bad });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('items.0.url');
  });
  it('plans adds/differs/same and never removes', () => {
    const cur = clone(); const inc = clone();
    inc.items.push({ ...inc.items[5], id: 'custom1', title: 'Custom' });
    inc.items[6].notes = 'changed';
    inc.items.splice(0, 1); // missing in file: must NOT be removed
    inc.sessions['2026-11-20'] = { title: 's', minutes: 60, done: true, notes: '' };
    const plan = planImport(cur, inc);
    expect(plan.added).toEqual(['custom1']);
    expect(plan.differing).toEqual([inc.items[5].id]);
    expect(plan.sessionsAdded).toEqual(['2026-11-20']);
    const merged = applyImport(cur, inc);
    expect(merged.items.length).toBe(cur.items.length + 1);
    expect(merged.items.find(i => i.id === inc.items[5].id)!.notes).not.toBe('changed'); // current kept
    expect(applyImport(cur, inc, { [`item:${inc.items[5].id}`]: 'incoming' }).items.find(i => i.id === inc.items[5].id)!.notes).toBe('changed');
    expect(applyImport(merged, inc)).toEqual(merged); // idempotent
  });
});
