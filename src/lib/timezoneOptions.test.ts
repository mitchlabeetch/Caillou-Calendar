import { describe, it, expect } from 'vitest';
import { TIMEZONE_OPTIONS, resolveActiveTimezone } from './timezoneOptions';

describe('timezoneOptions', () => {
  it('lists Auto plus a set of cities', () => {
    expect(TIMEZONE_OPTIONS[0].id).toBe('auto');
    expect(TIMEZONE_OPTIONS.length).toBeGreaterThanOrEqual(20);
    expect(TIMEZONE_OPTIONS.find(t => t.id === 'Europe/Paris')).toBeDefined();
    expect(TIMEZONE_OPTIONS.find(t => t.id === 'America/New_York')).toBeDefined();
  });

  it('resolveActiveTimezone falls back to auto resolution', () => {
    expect(resolveActiveTimezone('auto')).not.toBe('');
  });

  it('resolveActiveTimezone passes through a known id', () => {
    expect(resolveActiveTimezone('Europe/Paris')).toBe('Europe/Paris');
    expect(resolveActiveTimezone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('resolveActiveTimezone treats an empty setting as auto', () => {
    expect(resolveActiveTimezone('')).not.toBe('');
  });
});