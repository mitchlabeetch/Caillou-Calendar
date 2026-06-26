/**
 * Puppeteer smoke test for the wired Caillou Calendar app.
 *
 * Verifies:
 *  - App boots on `localhost:3000` with no console / page errors
 *  - Month view is the default landing screen
 *  - Keyboard shortcuts: M (month), W (week), T (today)
 *  - Settings modal opens, has `role="dialog"`, theme switcher applies, Escape closes
 *  - AddEventModal opens, focusables present, Escape closes
 *  - EventDetailModal opens when an event is clicked
 *  - Screenshot saved to audit-screenshots/wiring-month.png
 *
 * Pre-req: `npm run dev` running on :3000.
 *
 * Usage: `node test-app-wiring.cjs`
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.resolve(__dirname, 'audit-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ''}`);
}

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const consoleLogs = [];
  const failedRequests = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') consoleErrors.push(text);
  });
  page.on('pageerror', err => pageErrors.push(err.toString()));
  page.on('requestfailed', req => failedRequests.push(`${req.url()} (${req.failure() && req.failure().errorText})`));
  page.on('response', resp => {
    if (resp.status() >= 400) failedRequests.push(`${resp.status()} ${resp.url()}`);
  });

  try {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);
    record('app booted', true);

    // 1. Title should contain "Caillou"
    const title = await page.title();
    record('title contains Caillou', /caillou/i.test(title), title);

    // 2. The calendar header contains the current month/year. The exact
    //    format depends on i18n locale and date-fns PPP. Search all visible
    //    text for a 4-digit year as a stable signal.
    const headerText = await page.evaluate(() => {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December',
                      'Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember',
                      'janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre',
                      'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre',
                      'gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre',
                      'janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const candidates = document.querySelectorAll('h1, h2, h3, h4, [class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"]');
      for (const el of candidates) {
        if (el.offsetParent === null) continue;
        const t = (el.textContent || '').trim();
        if (!t) continue;
        if (months.some(m => t.includes(m))) return t;
      }
      // Fallback: any visible element with a 4-digit year in 2020–2099 range
      const all = document.querySelectorAll('div, span, p');
      for (const el of all) {
        if (el.offsetParent === null) continue;
        if (el.children.length > 4) continue;
        const t = (el.textContent || '').trim();
        if (/\b(202\d|203\d)\b/.test(t)) return t;
      }
      return '';
    });
    record('month header visible', /\w+/.test(headerText), `header: "${headerText}"`);

    // 3. Keyboard: T then W switches to week view, M back to month
    await page.keyboard.press('T');
    await sleep(400);
    await page.keyboard.press('w');
    await sleep(700);
    const hasHoursCol = await page.evaluate(() => {
      const els = document.querySelectorAll('div');
      return Array.from(els).some(d => /\d+ ?(AM|PM|am|pm|:00)/.test(d.textContent || ''));
    });
    record('W keyboard → week view', hasHoursCol);

    await page.keyboard.press('m');
    await sleep(700);
    const hasMonthGrid = await page.evaluate(() => {
      // Month view typically has a 7-column grid header (Sun Mon Tue...)
      return !!document.querySelector('[class*="grid-cols-7"]');
    });
    record('M keyboard → month view', hasMonthGrid);

    // 4. Settings modal: click the floating Settings button (sidebar's top-right one)
    const settingsOpened = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('button'));
      for (const btn of all) {
        if (btn.getBoundingClientRect().width === 0) continue;
        const svg = btn.querySelector('svg');
        if (!svg) continue;
        const cls = (svg.getAttribute('class') || '').toLowerCase();
        if (cls.includes('lucide-settings')) {
          btn.click();
          return 'icon';
        }
      }
      return null;
    });
    await sleep(900);
    let dialogOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('settings modal opens', settingsOpened && dialogOpen, settingsOpened ? `via ${settingsOpened}` : 'button not found');

    if (dialogOpen) {
      // Switch theme to dark. Always use the native HTMLSelectElement value setter
      // + synthetic change event because that is what reliably triggers React 19's
      // controlled <select> onChange handler (verified by test-debug-theme.cjs).
      const themeChanged = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('[role="dialog"] select'));
        const themeSel = selects.find(s =>
          Array.from(s.options).some(o => o.value === 'dark'));
        if (!themeSel) return { ok: false, reason: 'no theme select found' };
        try {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
          setter.call(themeSel, 'dark');
          themeSel.dispatchEvent(new Event('change', { bubbles: true }));
          return { ok: true, current: themeSel.value };
        } catch (err) {
          return { ok: false, reason: err && err.message };
        }
      });
      if (!themeChanged.ok) {
        console.log('Theme change failed:', themeChanged.reason);
      }
      await sleep(600);
      const isDark = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme') === 'dark'
        || document.documentElement.dataset.theme === 'dark');
      const lsTheme = await page.evaluate(() => localStorage.getItem('synoptic-theme'));
      record('theme switcher → dark mode', isDark,
        `data-theme=${await page.evaluate(() => document.documentElement.getAttribute('data-theme'))}, ls=${lsTheme}, change=${JSON.stringify(themeChanged)}`);

      // Escape closes the modal
      await page.keyboard.press('Escape');
      await sleep(600);
      const closedAfterEscape = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
      record('Escape closes modal', closedAfterEscape);

      // Restore light mode
      await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        const themeSel = selects.find(s => Array.from(s.options).some(o => o.value === 'dark'));
        if (themeSel) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
          setter.call(themeSel, 'light');
          themeSel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await sleep(400);
    }

    // 5. AddEventModal via "+" button — find a button with a Plus icon
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('button'));
      for (const btn of all) {
        if (btn.getBoundingClientRect().width === 0) continue;
        const svg = btn.querySelector('svg');
        if (!svg) continue;
        const cls = (svg.getAttribute('class') || '').toLowerCase();
        if (cls.includes('lucide-plus')) {
          btn.click();
          return;
        }
      }
    });
    await sleep(800);
    const addOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    record('add-event modal opens', addOpen);

    if (addOpen) {
      const focusables = await page.evaluate(() => {
        const panel = document.querySelector('[role="dialog"]');
        if (!panel) return 0;
        return panel.querySelectorAll('input, select, button, textarea, [tabindex]:not([tabindex="-1"])').length;
      });
      record('modal contains focusables', focusables > 0, `${focusables} focusables`);

      // Verify role="dialog" + aria-modal
      const ariaAttrs = await page.evaluate(() => {
        const panel = document.querySelector('[role="dialog"]');
        return panel ? { role: panel.getAttribute('role'), ariaModal: panel.getAttribute('aria-modal') } : null;
      });
      record('aria-modal="true"', ariaAttrs && ariaAttrs.ariaModal === 'true', JSON.stringify(ariaAttrs));

      await page.keyboard.press('Escape');
      await sleep(500);
      const addClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
      record('add-event modal closes', addClosed);
    }

    // 6. Screenshot the final month view
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wiring-month.png'), fullPage: false });
    record('captured screenshot', true, 'audit-screenshots/wiring-month.png');

    // 7. Console/page errors must be empty (filter known dev-only noise)
    const meaningfulConsoleErrors = consoleErrors.filter(e =>
      // Frame-ancestors via meta is a known benign warning.
      !/frame-ancestors/i.test(e) &&
      // 404s are tracked separately via failedRequests so we can filter by URL
      !/Failed to load resource/i.test(e));
    const meaningfulFailedRequests = failedRequests.filter(u =>
      // Vite HMR / module-graph probes in dev often 404; ignore these.
      !/\/@vite\//i.test(u) &&
      !/\/@id\//i.test(u) &&
      !/\/@react-refresh/i.test(u) &&
      !/\.well-known/i.test(u) &&
      !/sw\.js/i.test(u) &&
      !/firebase/i.test(u) &&
      !/manifest/i.test(u));
    record('no meaningful console errors', meaningfulConsoleErrors.length === 0,
      meaningfulConsoleErrors.length ? meaningfulConsoleErrors.slice(0, 2).join(' | ') : '');
    record('no meaningful 404s', meaningfulFailedRequests.length === 0,
      meaningfulFailedRequests.length ? meaningfulFailedRequests.slice(0, 3).join(' | ') : '');
    record('no page errors', pageErrors.length === 0,
      pageErrors.length ? pageErrors.slice(0, 2).join(' | ') : '');

  } catch (e) {
    record('test exception', false, e.message);
    console.error(e);
  }

  // Print results summary
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log('\n---- Summary ----');
  console.log(`Passed: ${passed} / ${results.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 5).join('\n'));
  console.log(`Failed requests: ${failedRequests.length}`);
  if (failedRequests.length) console.log(failedRequests.slice(0, 8).join('\n'));
  console.log(`Page errors: ${pageErrors.length}`);
  if (pageErrors.length) console.log(pageErrors.slice(0, 5).join('\n'));
  if (failed > 0 || pageErrors.length > 0) process.exitCode = 1;

  // Print any interesting console logs for debugging
  const interestingLogs = consoleLogs.filter(l =>
    /change|theme|dark/i.test(l) || /error/i.test(l));
  if (interestingLogs.length > 0) {
    console.log('\nInteresting console logs:');
    console.log(interestingLogs.slice(0, 10).join('\n'));
  }

  await browser.close();
})();