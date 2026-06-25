// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './i18n';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initialises to English by default', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.t('app.appSettings', { defaultValue: 'fallback' })).not.toBe('fallback');
  });

  it('switches to French and back', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.language).toBe('fr');
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('exposes the resources for every supported locale', () => {
    const locales = Object.keys(i18n.options.resources ?? {});
    for (const l of ['en', 'fr', 'es', 'de', 'it', 'pt']) {
      expect(locales).toContain(l);
    }
  });

  it('has at least one registered module (react-i18next)', () => {
    const modules = (i18n as unknown as { modules: Array<{ type?: string }> }).modules;
    // i18next stores modules as an object { [name]: { type, ... } }
    // in v22+; just assert the object exists and has at least one key.
    expect(modules).toBeTruthy();
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });
});
