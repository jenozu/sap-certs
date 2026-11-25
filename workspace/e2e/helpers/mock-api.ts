import type { Page } from '@playwright/test';
import { initial, type Workspace } from '../../app/model';
import { applyImport, parseImportFile, planImport } from '../../lib/workspace/import';
// UI regression runs against an in-memory copy of /api/workspace (the API itself is
// covered by Vitest + PGlite). Mirrors the real contract: version check -> 409.
export async function mockWorkspaceApi(page: Page) {
  const state: { data: unknown; version: number } = { data: structuredClone(initial), version: 0 };
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/workspace', async route => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({ json: state });
    }
    const body = req.postDataJSON() as { data: unknown; version: number };
    if (body.version !== state.version) return route.fulfill({ status: 409, json: { error: 'This workspace changed in another tab. Reload before saving; your open edit is still here.' } });
    state.data = body.data; state.version += 1;
    return route.fulfill({ json: { version: state.version } });
  });
  await page.route('**/api/workspace/import*', async route => {
    const req = route.request();
    const body = req.postDataJSON() as { file: unknown; version: number };
    const parsed = parseImportFile(body.file);
    if (!parsed.ok) return route.fulfill({ status: 400, json: { error: parsed.error } });
    if (body.version !== state.version) return route.fulfill({ status: 409, json: { error: 'stale' } });
    const plan = planImport(state.data as Workspace, parsed.workspace);
    if (req.url().includes('dryRun=1')) return route.fulfill({ json: { plan } });
    state.data = applyImport(state.data as Workspace, parsed.workspace); state.version += 1;
    return route.fulfill({ json: { plan, version: state.version, data: state.data } });
  });
  return state;
}
