import { describe, it, expect, beforeEach } from 'vitest';
import { setSoundEnabled, isSoundEnabled, playCue, primeAudio } from './sounds';

describe('sounds', () => {
  beforeEach(() => localStorage.clear());

  it('is disabled by default', () => {
    expect(isSoundEnabled()).toBe(false);
  });

  it('persists and reads the enabled flag', () => {
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(localStorage.getItem('synoptic-sound-enabled')).toBe('1');
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem('synoptic-sound-enabled')).toBe('0');
  });

  it('playCue is a no-op when disabled', () => {
    expect(() => playCue('drop')).not.toThrow();
    expect(() => playCue('reminder')).not.toThrow();
    expect(() => playCue('birthday')).not.toThrow();
    expect(() => playCue('click')).not.toThrow();
  });

  it('primeAudio does not throw when AudioContext is unavailable', () => {
    expect(() => primeAudio()).not.toThrow();
  });

  it('playCue does not throw when enabled (no AudioContext in jsdom)', () => {
    setSoundEnabled(true);
    expect(() => playCue('drop')).not.toThrow();
  });
});