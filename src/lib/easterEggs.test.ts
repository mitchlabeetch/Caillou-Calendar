import { describe, it, expect } from 'vitest';
import { maybeEasterEggs, titleTriggersEasterEgg } from './easterEggs';

describe('easterEggs', () => {
  it('does not throw when console is available', () => {
    expect(() => maybeEasterEggs()).not.toThrow();
  });

  it('triggers on caillou in the title', () => {
    expect(titleTriggersEasterEgg('Hello Caillou!')).toBe(true);
    expect(titleTriggersEasterEgg('CAILLOU festival')).toBe(true);
  });

  it('does not trigger on plain titles', () => {
    expect(titleTriggersEasterEgg('Soccer practice')).toBe(false);
    expect(titleTriggersEasterEgg('')).toBe(false);
  });
});