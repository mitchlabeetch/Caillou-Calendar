import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveTimeZone, setActiveTimeZone } from './timezone';

describe('timezone', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a non-empty timezone', () => {
    expect(typeof getActiveTimeZone()).toBe('string');
    expect(getActiveTimeZone().length).toBeGreaterThan(0);
  });

  it('round-trips through storage', () => {
    setActiveTimeZone('Asia/Tokyo');
    expect(getActiveTimeZone()).toBe('Asia/Tokyo');
  });

  it('falls back when storage is empty', () => {
    expect(getActiveTimeZone()).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$/);
  });
});