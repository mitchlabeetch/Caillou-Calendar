import { describe, it, expect } from 'vitest';
import { geocodeLocation } from './geocoder';

describe('geocoder', () => {
  it('returns null for empty input', async () => {
    expect(await geocodeLocation('')).toBeNull();
  });

  it('returns null for very short input', async () => {
    expect(await geocodeLocation('a')).toBeNull();
  });

  it('returns null when the network request fails', async () => {
    // No network in jsdom — the request will throw.
    const result = await geocodeLocation('Paris, France');
    expect(result).toBeNull();
  });
});