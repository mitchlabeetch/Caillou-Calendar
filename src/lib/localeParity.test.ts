import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The locale parity guard runs the same audit as
 * `node scripts/audit-locales.mjs` but stays in-process so it is
 * picked up by `npm run test:coverage`. If this test ever fails,
 * a non-English user is about to see a `keyName` fallback string.
 */

const LOCALES_DIR = resolve(process.cwd(), 'src', 'locales');
const REFERENCE = 'en.json';

function collectKeys(obj: unknown, prefix = ''): string[] {
  const keys: string[] = [];
  if (obj === null || typeof obj !== 'object') return keys;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('locale parity', () => {
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  const referenceKeys = new Set(
    collectKeys(JSON.parse(readFileSync(resolve(LOCALES_DIR, REFERENCE), 'utf8'))),
  );

  it('en.json exists and has at least 100 keys', () => {
    expect(files).toContain(REFERENCE);
    expect(referenceKeys.size).toBeGreaterThan(100);
  });

  for (const file of files) {
    if (file === REFERENCE) continue;
    it(`${file} has every key that en.json has`, () => {
      const localeKeys = new Set(
        collectKeys(JSON.parse(readFileSync(resolve(LOCALES_DIR, file), 'utf8'))),
      );
      const gaps = [...referenceKeys].filter((k) => !localeKeys.has(k));
      expect(gaps, `${file} is missing keys: ${gaps.join(', ')}`).toEqual([]);
    });
  }
});