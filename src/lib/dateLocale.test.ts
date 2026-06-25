import { describe, it, expect } from 'vitest';
import { getDateLocale } from './dateLocale';

describe('getDateLocale', () => {
  it('returns a locale object for known languages', () => {
    expect(getDateLocale('en')).toBeTruthy();
    expect(getDateLocale('fr')).toBeTruthy();
    expect(getDateLocale('de')).toBeTruthy();
    expect(getDateLocale('es')).toBeTruthy();
    expect(getDateLocale('it')).toBeTruthy();
    expect(getDateLocale('pt')).toBeTruthy();
  });

  it('falls back to English for unknown languages', () => {
    const fallback = getDateLocale('xx');
    const english = getDateLocale('en');
    expect(fallback).toBe(english);
  });
});