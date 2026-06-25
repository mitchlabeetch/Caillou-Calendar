/**
 * Daylight-savings indicator.
 *
 * Returns the offset (minutes) of the browser timezone for each of
 * the seven days in the week a given date falls in. If any day has
 * a different offset, the week crosses a DST boundary and a small
 * "DST" badge should be rendered.
 */

export interface DstReport {
  crossesDst: boolean;
  offsets: number[]; // minutes from UTC for each day
  shiftMinutes: number; // largest in-week offset delta
}

export function dstReportForWeek(weekStartIso: string): DstReport {
  const start = new Date(weekStartIso + 'T12:00:00Z');
  if (isNaN(start.getTime())) {
    return { crossesDst: false, offsets: [], shiftMinutes: 0 };
  }
  const offsets: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    offsets.push(d.getTimezoneOffset());
  }
  const min = Math.min(...offsets);
  const max = Math.max(...offsets);
  return {
    crossesDst: max !== min,
    offsets,
    shiftMinutes: Math.abs(max - min),
  };
}

/** True if a specific date is the same DST day as another. */
export function isDstShiftDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso + 'T12:00:00Z');
  const b = new Date(bIso + 'T12:00:00Z');
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return a.getTimezoneOffset() !== b.getTimezoneOffset();
}