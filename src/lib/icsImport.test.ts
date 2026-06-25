import { describe, it, expect, beforeEach } from 'vitest';
import { parseIcs, icsToEvents } from './icsImport';

const SAMPLE_ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Test//EN',
  'BEGIN:VEVENT',
  'UID:e1@test',
  'DTSTAMP:20260101T000000Z',
  'DTSTART:20260625T100000Z',
  'DTEND:20260625T110000Z',
  'SUMMARY:Lunch with Grandma',
  'LOCATION:Crêperie du Coin',
  'DESCRIPTION:Long line, go early.',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:e2@test',
  'DTSTAMP:20260101T000000Z',
  'DTSTART:20260626',
  'DTEND:20260628',
  'SUMMARY:Beach trip',
  'RRULE:FREQ=DAILY;COUNT=5',
  'EXDATE:20260627',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

describe('icsImport', () => {
  it('parses a simple ICS feed', () => {
    const events = parseIcs(SAMPLE_ICS);
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe('Lunch with Grandma');
    expect(events[0].location).toBe('Crêperie du Coin');
    expect(events[0].dtStart).toContain('2026-06-25');
    expect(events[0].allDay).toBe(false);
  });

  it('parses all-day dates', () => {
    const events = parseIcs(SAMPLE_ICS);
    expect(events[1].allDay).toBe(true);
    expect(events[1].dtStart).toBe('2026-06-26');
  });

  it('parses RRULE into a Recurrence', () => {
    const events = parseIcs(SAMPLE_ICS);
    expect(events[1].rrule).toEqual({ type: 'daily', count: 5 });
  });

  it('parses EXDATE into exceptionDates', () => {
    const events = parseIcs(SAMPLE_ICS);
    expect(events[1].exdates).toEqual(['2026-06-27']);
  });

  it('converts to CalendarEvent shape', () => {
    const parsed = parseIcs(SAMPLE_ICS);
    const events = icsToEvents(parsed);
    expect(events[0].title).toBe('Lunch with Grandma');
    expect(events[0].startTime).toBe('10:00');
    expect(events[0].endTime).toBe('11:00');
    expect(events[0].allDay).toBe(false);
    expect(events[1].allDay).toBe(true);
    expect(events[1].exceptionDates).toEqual(['2026-06-27']);
  });

  it('escapes commas, semicolons and newlines', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:esc@test',
      'DTSTAMP:20260101T000000Z',
      'DTSTART:20260101T100000Z',
      'SUMMARY:Lunch\\, with friends\\; and\\nfamily',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const events = parseIcs(ics);
    expect(events[0].summary).toBe('Lunch, with friends; and\nfamily');
  });

  it('handles folded lines (RFC 5545 §3.1)', () => {
    // RFC 5545 folds with CRLF + space; the space is consumed by the fold.
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:fold@test',
      'DTSTAMP:20260101T000000Z',
      'DTSTART:20260101T100000Z',
      'SUMMARY:A very long description that should',
      ' be unfolded back into a single line.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const events = parseIcs(ics);
    // The fold consumes the leading space; we get back "shouldbe unfolded…".
    expect(events[0].summary).toBe('A very long description that shouldbe unfolded back into a single line.');
  });
});