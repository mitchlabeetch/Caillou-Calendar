import { describe, it, expect } from 'vitest';
import { exportEventsToICS } from './exportIcs';
import type { CalendarEvent } from '../types';

// Helper: capture the ICS string that would be downloaded, by stubbing
// URL.createObjectURL and document.body. Returns the captured text
// once the Blob has been read.
async function captureICS(events: CalendarEvent[]): Promise<string> {
  let captured = '';
  const originalCreate = URL.createObjectURL;
  const originalAppend = document.body.appendChild.bind(document.body);
  const originalClick = HTMLAnchorElement.prototype.click;
  const originalRevoke = URL.revokeObjectURL;

  URL.createObjectURL = (blob: Blob) => {
    void blob.text().then((t) => { captured = t; });
    return 'blob:fake';
  };
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function () { /* no-op */ };
  document.body.appendChild = ((node: Node) => node) as typeof document.body.appendChild;
  // Prevent removeChild from throwing
  document.body.removeChild = (() => {}) as typeof document.body.removeChild;

  try {
    exportEventsToICS(events, []);
    // Blob.text() is a microtask — wait for it to settle.
    await new Promise((r) => setTimeout(r, 0));
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    HTMLAnchorElement.prototype.click = originalClick;
    document.body.appendChild = originalAppend;
  }
  return captured;
}

describe('exportEventsToICS', () => {
  it('emits an X-WR-TIMEZONE header', async () => {
    const ics = await captureICS([{
      id: '1',
      title: 'Test',
      date: '2026-06-25',
      startTime: '09:00',
      memberIds: [],
    }]);
    expect(ics).toMatch(/X-WR-TIMEZONE:/);
  });

  it('emits UTC datetimes (suffix Z) for timed events', async () => {
    const ics = await captureICS([{
      id: '1',
      title: 'Test',
      date: '2026-06-25',
      startTime: '09:00',
      memberIds: [],
    }]);
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
  });

  it('emits DATE-only for all-day events', async () => {
    const ics = await captureICS([{
      id: '1',
      title: 'Birthday',
      date: '2026-06-25',
      memberIds: [],
    }]);
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20260625/);
  });

  it('escapes special characters in summary', async () => {
    const ics = await captureICS([{
      id: '1',
      title: 'Birthday; party',
      date: '2026-06-25',
      memberIds: [],
    }]);
    expect(ics).toMatch(/SUMMARY:Birthday\\; party/);
  });
});