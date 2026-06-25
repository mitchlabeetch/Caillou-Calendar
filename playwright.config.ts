import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the visual-regression suite.
 *
 * Boots `npm run dev` on port 3000 and runs against the live app so we
 * exercise the full calendar shell (CalendarMonth, CalendarWeek,
 * CalendarAgenda, modals, error boundary, theme tokens) end-to-end.
 *
 * The existing Puppeteer Chromium is reused via `executablePath` so we
 * do not need to download Playwright's bundled browser (which is slow
 * in CI / air-gapped environments). To switch to Playwright's bundled
 * Chromium later, delete the `executablePath` and run
 * `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Puppeteer ships a Chrome-for-Testing build; reuse it so CI does
    // not have to download a second Chromium binary.
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ??
        'C:/Users/tanag/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe',
    },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  expect: {
    // Tight thresholds so visual regressions surface as diffs in PRs.
    toHaveScreenshot: {
      maxDiffPixels: 200,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
    timeout: 10_000,
  },
});