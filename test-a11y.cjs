/**
 * axe-core accessibility scan. Boots the dev server, runs axe against
 * the calendar main view + each modal, and exits non-zero on serious
 * or critical violations.
 *
 * Usage:
 *   1. npm run dev   # in another terminal
 *   2. node test-a11y.cjs
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = path.join(__dirname, 'audit-screenshots');

const SEVERITY_RANK = { minor: 0, moderate: 1, serious: 2, critical: 3 };
const FAIL_AT = SEVERITY_RANK.serious;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAxe(page, label) {
  const source = fs.readFileSync(
    require.resolve('axe-core/axe.min.js'),
    'utf8',
  );
  await page.evaluate(source);
  const results = await page.evaluate(async () => {
    // axe is loaded above via the injected script.
    // eslint-disable-next-line no-undef
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      resultTypes: ['violations'],
    });
  });
  return { label, violations: results.violations || [] };
}

function summarize(results) {
  const fail = [];
  for (const v of results.violations) {
    const sev = SEVERITY_RANK[v.impact] ?? 0;
    fail.push({
      label: results.label,
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sampleTarget: v.nodes[0] && v.nodes[0].target,
    });
    if (sev >= FAIL_AT) fail[fail.length - 1].blocking = true;
  }
  return fail;
}

(async () => {
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await sleep(500);

  const results = [];

  // 1. Calendar month view
  results.push(await runAxe(page, 'calendar-month'));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a11y-month.png'), fullPage: true });

  // 2. Settings modal
  const settingsOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => {
      const svg = b.querySelector('svg');
      return svg && /lucide-settings/i.test(svg.getAttribute('class') || '');
    });
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (settingsOpened) {
    await sleep(500);
    results.push(await runAxe(page, 'settings-modal'));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a11y-settings.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await sleep(400);
  }

  // 3. AddEvent modal
  const addOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => {
      const svg = b.querySelector('svg');
      return svg && /lucide-plus/i.test(svg.getAttribute('class') || '');
    });
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (addOpened) {
    await sleep(500);
    results.push(await runAxe(page, 'add-event-modal'));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'a11y-add-event.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await sleep(400);
  }

  await browser.close();

  // Aggregate violations.
  const all = results.flatMap(summarize);
  const blocking = all.filter(v => v.blocking);

  console.log('\n---- axe-core scan ----');
  for (const v of all) {
    const tag = v.blocking ? '✗' : '·';
    console.log(`${tag} [${v.impact || 'unknown'}] ${v.label} → ${v.id} (${v.help}) — ${v.nodes} node(s)`);
    if (v.sampleTarget) console.log(`    target: ${JSON.stringify(v.sampleTarget)}`);
  }
  console.log(`\nTotal: ${all.length} | Blocking (serious/critical): ${blocking.length}`);

  if (blocking.length > 0) {
    console.error('\nBLOCKING ACCESSIBILITY VIOLATIONS FOUND.');
    process.exit(1);
  } else {
    console.log('No serious/critical violations. axe-core scan passed.');
    process.exit(0);
  }
})().catch((err) => {
  console.error('axe-core scan crashed:', err);
  process.exit(2);
});
