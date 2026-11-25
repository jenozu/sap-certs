import { test, expect, type Page } from '@playwright/test';
import { mockWorkspaceApi } from './helpers/mock-api';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
// Task 9: lock existing workspace behaviour before any v2 change.
const views = ['Roadmap', 'Current phase', 'Weekly plan', 'Learning library', 'Projects', 'Portfolio', 'Career checkpoints', 'Compare next steps'] as const;

async function go(page: Page, view: string, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: new RegExp('^' + view.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( \\d+)?$') }).first().click();
}

let api: Awaited<ReturnType<typeof mockWorkspaceApi>>;
test.beforeEach(async ({ page }) => {
  api = await mockWorkspaceApi(page);
  await page.clock.setFixedTime(new Date('2026-11-25T12:00:00-05:00'));
  await page.goto('/');
  await expect(page.getByText('SQL foundations').first()).toBeVisible();
});

test('every existing view renders', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  for (const v of views) {
    await go(page, v, mobile);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
    if (process.env.VISUAL) await expect(page).toHaveScreenshot(`${v.replace(/\s+/g, '-').toLowerCase()}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 });
  }
});

test('edit a course, save, and see it persisted', async ({ page }, info) => {
  await go(page, 'Learning library', info.project.name === 'mobile');
  await page.getByRole('button', { name: /^Edit SQL practice: joins & aggregates/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Notes, evidence & next actions').first().fill('Regression note');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(() => api.version).toBe(1);
  await page.reload();
  await go(page, 'Learning library', info.project.name === 'mobile');
  await page.getByRole('button', { name: /^Edit SQL practice: joins & aggregates/ }).first().click();
  await expect(page.getByRole('dialog').getByLabel('Notes, evidence & next actions').first()).toHaveValue('Regression note');
});

test('dialogs close with Escape', async ({ page }, info) => {
  await go(page, 'Learning library', info.project.name === 'mobile');
  await page.getByRole('button', { name: /^Edit SQL practice/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search finds items', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'search box is desktop-only in the top bar');
  await page.getByLabel('Search workspace').fill('cycle-count');
  await expect(page.getByText('ABC cycle-count planner').first()).toBeVisible();
});

test('weekly plan navigates weeks and saves a session', async ({ page }, info) => {
  await go(page, 'Weekly plan', info.project.name === 'mobile');
  await page.getByRole('button', { name: 'Next week' }).click();
  await page.getByRole('button', { name: 'Previous week' }).click();
  await page.getByRole('button', { name: /^Edit session/ }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Session notes').fill('practised joins');
  await dialog.getByLabel('Session completed').check();
  await dialog.getByRole('button', { name: 'Save session' }).click();
  await expect.poll(() => api.version).toBe(1);
  const saved = api.data as { sessions: Record<string, { notes: string; done: boolean }> };
  expect(Object.values(saved.sessions)[0]).toMatchObject({ notes: 'practised joins', done: true });
});

test('export downloads valid workspace JSON', async ({ page }) => {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export workspace' }).click()]);
  const text = await (await dl.createReadStream()).toArray().then(c => Buffer.concat(c).toString());
  const json = JSON.parse(text);
  expect(json.workspace.items.length).toBeGreaterThan(20);
});

test('stale save shows the conflict message', async ({ page }, info) => {
  await page.route('**/api/workspace', r => r.request().method() === 'PUT' ? r.fulfill({ status: 409, json: { error: 'This workspace changed in another tab. Reload before saving; your open edit is still here.' } }) : r.fallback());
  await go(page, 'Learning library', info.project.name === 'mobile');
  await page.getByRole('button', { name: /^Edit SQL practice/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/changed in another tab/).first()).toBeVisible();
});

// Accessibility baseline: existing violations are recorded; only NEW rule violations fail.
test('no new accessibility violations', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  const file = `e2e/a11y-baseline.${info.project.name}.json`;
  const found: Record<string, string[]> = {};
  for (const v of views) {
    await go(page, v, mobile);
    await page.waitForTimeout(150);
    const r = await new AxeBuilder({ page }).include('main').analyze();
    found[v] = r.violations.map(x => x.id).sort();
  }
  if (process.env.UPDATE_A11Y || !existsSync(file)) { writeFileSync(file, JSON.stringify(found, null, 2) + '\n'); return; }
  const base = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string[]>;
  for (const v of views) expect(found[v].filter(id => !(base[v] ?? []).includes(id)), v).toEqual([]);
});
