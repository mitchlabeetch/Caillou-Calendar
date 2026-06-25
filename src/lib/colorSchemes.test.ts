import { describe, it, expect, beforeEach } from 'vitest';
import { COLOR_SCHEMES, getActiveColorScheme, setActiveColorScheme, bootstrapColorScheme } from './colorSchemes';

describe('colorSchemes', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-scheme');
    document.documentElement.style.cssText = '';
  });

  it('exposes the four built-in schemes', () => {
    expect(Object.keys(COLOR_SCHEMES)).toEqual(['tangerine', 'mint', 'berry', 'slate']);
    for (const scheme of Object.values(COLOR_SCHEMES)) {
      expect(scheme.primary).toMatch(/^#[0-9a-f]{6}$/);
      expect(scheme.memberColors).toHaveLength(4);
    }
  });

  it('falls back to tangerine when nothing is stored', () => {
    expect(getActiveColorScheme().id).toBe('tangerine');
  });

  it('persists + reads the active scheme', () => {
    setActiveColorScheme('berry');
    expect(localStorage.getItem('synoptic-color-scheme')).toBe('berry');
    expect(getActiveColorScheme().id).toBe('berry');
  });

  it('applies the scheme tokens to the document root', () => {
    setActiveColorScheme('mint');
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe(COLOR_SCHEMES.mint.primary);
    expect(root.dataset.colorScheme).toBe('mint');
  });

  it('ignores unknown ids on read', () => {
    localStorage.setItem('synoptic-color-scheme', 'nope');
    expect(getActiveColorScheme().id).toBe('tangerine');
  });

  it('bootstrapColorScheme applies the persisted scheme', () => {
    localStorage.setItem('synoptic-color-scheme', 'slate');
    bootstrapColorScheme();
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(COLOR_SCHEMES.slate.primary);
  });
});