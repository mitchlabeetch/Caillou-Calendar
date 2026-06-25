/**
 * Visual regression baselines for the Caillou Family Calendar.
 *
 * These specs lock the neo-brutalist look across the three calendar
 * surfaces (month / week / agenda), the SettingsModal, and the
 * AddEventModal. Each test renders a stable view, takes a screenshot,
 * and compares against the checked-in baseline in
 * `e2e/snapshots/<name>-*.png`.
 *
 * To refresh baselines after an intentional design change:
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 */
import { test, expect } from '@playwright/test';

test.describe('Visual regression — calendar shell', () => {
  test.beforeEach(async ({ page }) => {
    // The dev server boots in local-only mode (no Supabase env vars).
    // We clear any persisted UI state so the month grid lines up the
    // same on every run, then wait for the calendar shell to render.
    await page.addInitScript(() => {
      try { localStorage.clear(); } catch { /* sandboxed */ }
    });
    await page.goto('/');
    await page.getByRole('button', { name: /month/i }).waitFor();
  });

  test('month view baseline (desktop)', async ({ page }) => {
    // Ensure we are on month view (the boot default).
    await page.getByRole('button', { name: /month/i }).click();
    await expect(page.getByRole('button', { name: /month/i })).toHaveAttribute('class', /bg-primary/);
    // Snapshot the main content area only (skip the sidebar so its
    // member chips don't drift between environments).
    const main = page.locator('main').first();
    await expect(main).toHaveScreenshot('month-view-desktop.png', {
      mask: [page.locator('header').first()],
    });
  });

  test('week view baseline (desktop)', async ({ page }) => {
    await page.getByRole('button', { name: /^week$/i }).click();
    await expect(page.getByRole('button', { name: /^week$/i })).toHaveAttribute('class', /bg-primary/);
    const main = page.locator('main').first();
    await expect(main).toHaveScreenshot('week-view-desktop.png', {
      mask: [page.locator('header').first()],
    });
  });

  test('add event modal baseline', async ({ page }) => {
    // The floating "+" button opens the AddEventModal.
    await page.getByRole('button', { name: /add event/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveScreenshot('add-event-modal.png');
  });

  test('settings modal baseline', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveScreenshot('settings-modal.png');
  });
});

test.describe('Visual regression — mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.clear(); } catch { /* sandboxed */ }
    });
    await page.goto('/');
    await page.getByRole('button', { name: /month|week/i }).first().waitFor();
  });

  test('month agenda baseline (mobile)', async ({ page }) => {
    const main = page.locator('main').first();
    await expect(main).toHaveScreenshot('month-agenda-mobile.png', {
      mask: [page.locator('header').first()],
    });
  });
});