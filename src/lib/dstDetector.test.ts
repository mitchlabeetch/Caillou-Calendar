import { describe, it, expect } from 'vitest';
import { dstReportForWeek, isDstShiftDay } from './dstDetector';

describe('dstDetector', () => {
  it('returns no DST crossing for a stable week', () => {
    // Pick a week well away from any DST boundary (mid-summer in Europe).
    const report = dstReportForWeek('2026-07-13');
    expect(report.crossesDst).toBe(false);
    expect(report.shiftMinutes).toBe(0);
    expect(report.offsets).toHaveLength(7);
  });

  it('returns zero offsets for an unparseable week start', () => {
    const report = dstReportForWeek('not-a-date');
    expect(report.crossesDst).toBe(false);
    expect(report.offsets).toEqual([]);
  });

  it('isDstShiftDay returns false on the same day', () => {
    expect(isDstShiftDay('2026-07-13', '2026-07-14')).toBe(false);
  });

  it('isDstShiftDay returns false for two valid dates', () => {
    expect(isDstShiftDay('2026-07-13', '2026-07-15')).toBe(false);
  });

  it('isDstShiftDay returns false for invalid input', () => {
    expect(isDstShiftDay('nope', '2026-07-15')).toBe(false);
    expect(isDstShiftDay('2026-07-15', 'nope')).toBe(false);
  });
});