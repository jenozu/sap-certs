import { defineConfig, devices } from '@playwright/test';
// PREVIEW_URL runs against a deployed (protected) preview using the Vercel bypass secret;
// otherwise a local production server is started.
const remote = process.env.PREVIEW_URL;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const exe = process.env.CHROME_PATH;
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: remote ?? 'http://localhost:3100',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } : undefined,
    launchOptions: exe ? { executablePath: exe } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: remote ? undefined : { command: 'npx next start -p 3100', port: 3100, reuseExistingServer: true, timeout: 60_000 },
});
