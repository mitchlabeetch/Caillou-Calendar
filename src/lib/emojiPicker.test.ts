import { describe, it, expect } from 'vitest';
import { EMOJI_CATEGORIES } from './emojiPicker';

describe('emojiPicker', () => {
  it('exposes a curated list of categories', () => {
    expect(EMOJI_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    for (const cat of EMOJI_CATEGORIES) {
      expect(cat.name.length).toBeGreaterThan(0);
      expect(cat.emojis.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('contains the expected categories', () => {
    const names = EMOJI_CATEGORIES.map(c => c.name);
    expect(names).toContain('People');
    expect(names).toContain('Activities');
    expect(names).toContain('Celebration');
  });
});