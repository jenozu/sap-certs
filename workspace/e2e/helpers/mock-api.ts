import type { Page } from '@playwright/test';
import { initial } from '../../app/model';
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
  return state;
}
