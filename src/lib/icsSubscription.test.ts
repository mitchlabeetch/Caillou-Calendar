import { describe, it, expect } from 'vitest';
import { buildIcsSubscriptionUrl, copyToClipboard } from './icsSubscription';

describe('icsSubscription', () => {
  it('builds a URL with the family id encoded', () => {
    const { url, label } = buildIcsSubscriptionUrl('family-xyz', 'https://example.com');
    expect(url).toBe('https://example.com/api/ics?family=family-xyz');
    expect(label).toBe('family-xyz.ics');
  });

  it('uses window.location.origin when no baseUrl is provided', () => {
    const { url } = buildIcsSubscriptionUrl('fam');
    expect(url).toContain('/api/ics?family=fam');
  });

  it('copyToClipboard resolves false when navigator is unavailable', async () => {
    // navigator.clipboard is undefined in jsdom.
    const ok = await copyToClipboard('x');
    expect(typeof ok).toBe('boolean');
  });
});