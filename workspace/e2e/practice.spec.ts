import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockPracticeApi } from './helpers/mock-practice';

const EX = 'sql.left-join.customers-without-orders';
const SOLUTION = `SELECT c.name, c.city FROM customers c LEFT JOIN sales_orders s ON s.customer_id = c.customer_id WHERE s.so_id IS NULL ORDER BY c.name;`;

async function setCode(page: import('@playwright/test').Page, code: string) {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.locator('.cm-content').fill(code);
}
const mobile = (n: string) => n === 'mobile';
async function showTab(page: import('@playwright/test').Page, project: string, tab: 'Task' | 'Code' | 'Output') {
  if (mobile(project)) await page.getByRole('tab', { name: tab }).click();
}

test('practice home lists seed exercises and filters by concept', async ({ page }) => {
  await mockPracticeApi(page);
  await page.goto('/practice');
  await expect(page.getByRole('heading', { name: '25 exercises' })).toBeVisible();
  await page.getByRole('button', { name: 'CROSS JOIN' }).first().click();
  await expect(page.getByRole('heading', { name: /^\d+ exercises?$/ })).not.toHaveText('25 exercises');
  await expect(page.getByRole('link', { name: /Warehouse × category planning grid/ })).toBeVisible();
});

test('run, submit wrong, submit right; attempts recorded once each', async ({ page }, info) => {
  const api = await mockPracticeApi(page);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`/practice/${EX}`);
  await expect(page.getByRole('heading', { name: 'Customers who have never ordered' })).toBeVisible();
  await showTab(page, info.project.name, 'Code');
  await expect(page.locator('.cm-editor')).toBeVisible();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByTestId('entry-table').first()).toBeVisible({ timeout: 15000 });
  await showTab(page, info.project.name, 'Code');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Not yet' })).toBeVisible({ timeout: 15000 });
  await expect.poll(() => api.attempts.length).toBe(1);
  expect(api.attempts[0]).toMatchObject({ exerciseId: EX, passed: false, language: 'sql', exerciseVersion: '1.0.0' });
  await showTab(page, info.project.name, 'Code');
  await setCode(page, SOLUTION);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Correct$/ })).toBeVisible({ timeout: 15000 });
  await expect.poll(() => api.attempts.length).toBe(2);
  expect(api.attempts[1]).toMatchObject({ passed: true, correct: true, constructOk: true, hintsUsed: 0, independent: true });
  expect(errors).toEqual([]);
});

test('hint makes a pass assisted; reset sandbox keeps code; draft restores after reload', async ({ page }, info) => {
  const api = await mockPracticeApi(page);
  await page.goto(`/practice/${EX}`);
  await showTab(page, info.project.name, 'Task');
  await page.getByRole('button', { name: /Show a hint/ }).click();
  await expect(page.locator('.practice-hint')).toHaveCount(1);
  await showTab(page, info.project.name, 'Code');
  await setCode(page, SOLUTION + ' -- mine');
  await expect(page.getByText('Code saved')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Reset sandbox' }).click();
  await expect(page.getByText(/Sandbox reset/)).toBeVisible();
  await showTab(page, info.project.name, 'Code');
  await expect(page.locator('.cm-content')).toContainText('-- mine');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct (assisted)' })).toBeVisible({ timeout: 15000 });
  await expect.poll(() => api.attempts.length).toBe(1);
  expect(api.attempts[0]).toMatchObject({ passed: true, hintsUsed: 1, independent: false });
  await page.reload();
  await showTab(page, info.project.name, 'Code');
  await expect(page.locator('.cm-content')).toContainText('-- mine');
});

test('offline submit is queued and syncs when back online', async ({ page, context }, info) => {
  const api = await mockPracticeApi(page);
  await page.goto(`/practice/${EX}`);
  await showTab(page, info.project.name, 'Code');
  await expect(page.locator('.cm-editor')).toBeVisible();
  await page.route('**/api/v2/attempts', r => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText(/Offline: attempt saved on this device/)).toBeVisible({ timeout: 15000 });
  expect(api.attempts).toHaveLength(0);
  await page.unroute('**/api/v2/attempts');
  await mockPracticeApi(page).then(fresh => Object.assign(api, { attempts: fresh.attempts }));
  await context.setOffline(true); await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => api.attempts.length, { timeout: 10000 }).toBe(1);
});

test('custom session over chosen concepts with next-exercise flow', async ({ page }, info) => {
  const api = await mockPracticeApi(page);
  await page.goto('/practice');
  await page.getByRole('button', { name: 'WITH / CTE' }).or(page.getByRole('button', { name: 'CTE' })).first().click();
  await page.getByLabel('Number of exercises').selectOption('3');
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page).toHaveURL(/\/practice\/sql\..*session=/);
  await expect(page.getByText('1 of 3')).toBeVisible();
  expect(api.sessions).toHaveLength(1);
  await showTab(page, info.project.name, 'Output');
  await page.getByRole('link', { name: 'Next exercise' }).click();
  await expect(page.getByText('2 of 3')).toBeVisible();
});

test('skill library registers learned concepts and links to practice', async ({ page }) => {
  await mockPracticeApi(page);
  await page.goto('/skills');
  await page.getByLabel(/Concepts/).fill('with clause, Left Join, cross joins, UNION, union all');
  await page.getByLabel('Where you learned it').fill('Codecademy Learn SQL');
  await page.getByRole('button', { name: 'Register concepts' }).click();
  const result = page.getByRole('region', { name: 'Registered concepts' });
  await expect(result.getByRole('heading', { name: 'Registered 5 concepts' })).toBeVisible();
  await expect(result.getByText(/exercises? ready/)).toHaveCount(5);
  await expect(page.getByRole('heading', { name: '5 concepts', exact: true })).toBeVisible();
  await page.getByLabel('Language', { exact: true }).fill('JavaScript');
  await page.getByLabel(/Concepts/).fill('Closures');
  await page.getByRole('button', { name: 'Register concepts' }).click();
  await expect(result.getByText('no exercises yet')).toBeVisible();
  await expect(result.getByText(/isn't supported yet/)).toBeVisible();
  await expect(result.getByRole('button', { name: /Copy AI prompt/ })).toBeVisible();
});

test('practice pages have no accessibility violations', async ({ page }) => {
  await mockPracticeApi(page);
  for (const url of ['/practice', `/practice/${EX}`, '/skills']) {
    await page.goto(url);
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).include('main').disableRules(['color-contrast']).analyze();
    expect(r.violations.map(v => `${url}: ${v.id}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  }
});
