import { test, expect } from '@playwright/test';
// Task 4: vendored playground engine works in a Next production build.
test('engine runs SQL, stops runaway queries, recovers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const same = (u: string) => new URL(u).origin === new URL(page.url() || 'http://x').origin;
  page.on('requestfailed', r => { if (same(r.url())) errors.push('failed ' + r.url()); });
  page.on('response', r => { if (r.status() >= 400 && same(r.url())) errors.push(r.status() + ' ' + r.url()); });
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) errors.push('csp ' + m.text()); });
  const resp = await page.goto('/lab-spike');
  expect(resp?.headers()['content-security-policy']).toContain('wasm-unsafe-eval');
  await expect(page.getByTestId('zod')).toContainText('zod/v4: ok');
  await expect(page.locator('.cm-editor')).toBeVisible();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  const table = page.getByTestId('entry-table');
  await expect(table).toBeVisible({ timeout: 15000 });
  await expect(table.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: 'Run runaway query' }).click();
  await expect(page.getByTestId('entry-error')).toContainText('Timed out after 5s', { timeout: 12000 });
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByTestId('entry-table').locator('tbody tr')).toHaveCount(6, { timeout: 10000 });
  await page.locator('.cm-content').click();
  await page.keyboard.press('End');
  await page.keyboard.type(' -- typed');
  await expect(page.locator('.cm-content')).toContainText('-- typed');
  expect(errors).toEqual([]);
});
