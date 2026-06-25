import { describe, it, expect } from 'vitest';
import { fetchWeatherForRange } from './weather';

describe('weather (mock mode)', () => {
  it('returns mock weather when no API key is set', async () => {
    const out = await fetchWeatherForRange('2026-07-13', '2026-07-15');
    expect(out).toHaveLength(3);
    expect(out[0].date).toBe('2026-07-13');
    expect(out[0].tempMaxC).toBeGreaterThan(out[0].tempMinC);
    expect(out[0].icon).toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it('honours the start/end range exactly', async () => {
    const out = await fetchWeatherForRange('2026-07-13', '2026-07-13');
    expect(out).toHaveLength(1);
    expect(out[0].date).toBe('2026-07-13');
  });

  it('returns cold bands for January', async () => {
    const out = await fetchWeatherForRange('2026-01-15', '2026-01-15');
    expect(out[0].tempMaxC).toBeLessThanOrEqual(10);
    expect(out[0].summary.toLowerCase()).toMatch(/cold|rain|fog/);
  });

  it('returns empty array for unparseable dates', async () => {
    const out = await fetchWeatherForRange('nope', 'also-nope');
    expect(out).toEqual([]);
  });
});