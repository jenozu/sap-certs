import type { Page, Route } from '@playwright/test';
// In-memory /api/v2 used by practice e2e (APIs themselves are covered by Vitest + PGlite).
export async function mockPracticeApi(page: Page) {
  const s = { attempts: [] as Record<string, unknown>[], drafts: new Map<string, { code: string; rev: number }>(), skills: [] as Record<string, unknown>[], sessions: [] as unknown[], attemptPosts: 0 };
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/v2/attempts*', async (r: Route) => {
    if (r.request().method() === 'GET') return r.fulfill({ json: { attempts: s.attempts } });
    s.attemptPosts++;
    const a = r.request().postDataJSON() as Record<string, unknown>;
    if (s.attempts.some(x => x.id === a.id)) return r.fulfill({ json: { created: false } });
    s.attempts.push({ ...a, independent: a.passed && a.hintsUsed === 0 && !a.solutionViewed });
    return r.fulfill({ status: 201, json: { created: true } });
  });
  await page.route('**/api/v2/drafts/**', async (r: Route) => {
    const id = decodeURIComponent(new URL(r.request().url()).pathname.split('/').pop()!);
    if (r.request().method() === 'GET') return r.fulfill({ json: { draft: s.drafts.get(id) ?? null } });
    const b = r.request().postDataJSON() as { code: string; rev: number };
    const cur = s.drafts.get(id);
    if ((cur?.rev ?? 0) !== b.rev) return r.fulfill({ status: 409, json: { error: 'changed', current: cur } });
    s.drafts.set(id, { code: b.code, rev: b.rev + 1 });
    return r.fulfill({ json: { rev: b.rev + 1 } });
  });
  await page.route('**/api/v2/skills*', async (r: Route) => {
    if (r.request().method() === 'GET') return r.fulfill({ json: { skills: s.skills } });
    const { skills } = r.request().postDataJSON() as { skills: Record<string, unknown>[] };
    for (const k of skills) { const lang = String(k.language).toLowerCase(); const i = s.skills.findIndex(x => x.id === k.id); const row = { aliases: [], tags: [], source: '', notes: '', ...k, language: lang, state: 'introduced' }; if (i < 0) s.skills.push(row); }
    return r.fulfill({ json: { skills: s.skills } });
  });
  await page.route('**/api/v2/practice-sessions', r => { s.sessions.push(r.request().postDataJSON()); return r.fulfill({ json: { ok: true } }); });
  return s;
}
