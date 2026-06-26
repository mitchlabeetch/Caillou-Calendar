#!/usr/bin/env node
/**
 * Locale parity audit.
 *
 * Walks every JSON file in src/locales/ and, using en.json as the
 * reference tree, prints every key that is missing in any other locale.
 *
 * Exits 1 if any locale has missing keys.
 *
 * Usage: node scripts/audit-locales.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, '..', 'src', 'locales');
const REFERENCE = 'en.json';

function collectKeys(obj, prefix = '') {
  const keys = [];
  if (obj === null || typeof obj !== 'object') return keys;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
if (!files.includes(REFERENCE)) {
  console.error(`Reference locale ${REFERENCE} not found in ${LOCALES_DIR}`);
  process.exit(2);
}

const referenceKeys = new Set(
  collectKeys(JSON.parse(readFileSync(resolve(LOCALES_DIR, REFERENCE), 'utf8'))),
);

let missing = 0;
for (const file of files) {
  if (file === REFERENCE) continue;
  const data = JSON.parse(readFileSync(resolve(LOCALES_DIR, file), 'utf8'));
  const localeKeys = new Set(collectKeys(data));
  const gaps = [...referenceKeys].filter((k) => !localeKeys.has(k));
  if (gaps.length === 0) {
    console.log(`✓ ${file}: ${localeKeys.size} keys, no gaps`);
  } else {
    console.error(`✗ ${file}: missing ${gaps.length} key(s)`);
    for (const gap of gaps) console.error(`    - ${gap}`);
    missing += gaps.length;
  }
}

if (missing > 0) {
  console.error(`\n${missing} total missing key(s).`);
  process.exit(1);
}
console.log('\nAll locales match en.json.');