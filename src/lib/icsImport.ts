/**
 * Minimal ICS (RFC 5545) importer.
 *
 * Parses a subset of the spec: VEVENT, SUMMARY, DTSTART, DTEND,
 * RRULE, EXDATE, LOCATION, DESCRIPTION. No support for timezones
 * beyond Z / floating / naive local time. The parser is hand-written
 * to avoid pulling in a 100 KB dep just to read one file.
 */

import type { CalendarEvent, Recurrence } from '../types';

interface IcsEvent {
  uid: string;
  summary: string;
  dtStart: string; // ISO date
  dtEnd?: string; // ISO date
  allDay: boolean;
  rrule?: Recurrence;
  exdates: string[];
  location?: string;
  description?: string;
}

function unfold(text: string): string {
  // RFC 5545 §3.1: long lines fold with CRLF + space/tab.
  return text.replace(/\r?\n[ \t]/g, '');
}

function parseDate(value: string, tzid: string | undefined): { iso: string; allDay: boolean } {
  // DATE: 20251231   → 2025-12-31
  // DATETIME: 20251231T093000Z / 20251231T093000
  const v = value.trim();
  if (/^\d{8}$/.test(v)) {
    return { iso: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(v);
  if (!m) return { iso: '', allDay: false };
  const [, y, mo, d, hh, mm, ss, z] = m;
  const date = `${y}-${mo}-${d}`;
  if (z === 'Z') return { iso: `${date}T${hh}:${mm}:${ss}.000Z`, allDay: false };
  // floating local — treat as UTC for parsing convenience; the caller can
  // re-tag with `tzid` if provided. For our purposes we just store the
  // time-of-day.
  return { iso: `${date}T${hh}:${mm}:${ss}.000Z`, allDay: false };
}

function parseRrule(value: string): Recurrence | undefined {
  const parts = Object.fromEntries(
    value.split(';').map(p => p.split('=') as [string, string]),
  );
  const freq = (parts.FREQ ?? '').toLowerCase();
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : undefined;
  if (freq === 'daily') return { type: 'daily', count };
  if (freq === 'weekly') return { type: 'weekly', count };
  if (freq === 'monthly') return { type: 'monthly', count };
  if (freq === 'yearly') return { type: 'yearly', count };
  return undefined;
}

export function parseIcs(text: string): IcsEvent[] {
  const out: IcsEvent[] = [];
  // Normalise CRLF so the unfold regex (which expects \r?\n[ \t])
  // also catches bare LF + space in hand-crafted fixtures.
  const unfolded = unfold(text.replace(/\r?\n/g, '\r\n')).split(/\r?\n/);
  let current: Partial<IcsEvent> | null = null;
  let tzid: string | undefined;
  for (const raw of unfolded) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') {
      current = { exdates: [] };
      tzid = undefined;
    } else if (line === 'END:VEVENT') {
      if (current && current.uid && current.summary && current.dtStart) {
        out.push(current as IcsEvent);
      }
      current = null;
      tzid = undefined;
    } else if (!current) {
      continue;
    } else if (line.startsWith('UID:')) {
      current.uid = line.slice(4);
    } else if (line.startsWith('SUMMARY:')) {
      current.summary = unescapeIcs(line.slice(8));
    } else if (line.startsWith('LOCATION:')) {
      current.location = unescapeIcs(line.slice(9));
    } else if (line.startsWith('DESCRIPTION:')) {
      current.description = unescapeIcs(line.slice(12));
    } else if (line.startsWith('DTSTART')) {
      const m = /^DTSTART(?:;TZID=([^:]+))?:(.+)$/.exec(line);
      if (m) {
        tzid = m[1];
        const { iso, allDay } = parseDate(m[2], tzid);
        current.dtStart = iso;
        current.allDay = allDay;
      }
    } else if (line.startsWith('DTEND')) {
      const m = /^DTEND(?:;TZID=([^:]+))?:(.+)$/.exec(line);
      if (m) {
        const { iso } = parseDate(m[2], m[1]);
        current.dtEnd = iso;
      }
    } else if (line.startsWith('RRULE:')) {
      current.rrule = parseRrule(line.slice(6));
    } else if (line.startsWith('EXDATE')) {
      const m = /^EXDATE.*?:(.+)$/.exec(line);
      if (m) current.exdates!.push(parseDate(m[1], undefined).iso.slice(0, 10));
    }
  }
  return out;
}

function unescapeIcs(s: string): string {
  return s.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
}

/** Convert parsed ICS events into the in-app CalendarEvent shape. */
export function icsToEvents(parsed: IcsEvent[]): CalendarEvent[] {
  return parsed.map((ev, idx) => {
    const startDate = ev.dtStart.slice(0, 10);
    const endDate = ev.dtEnd ? ev.dtEnd.slice(0, 10) : undefined;
    const startTime = ev.allDay
      ? undefined
      : `${ev.dtStart.slice(11, 13)}:${ev.dtStart.slice(14, 16)}`;
    const endTime = ev.dtEnd && !ev.allDay
      ? `${ev.dtEnd.slice(11, 13)}:${ev.dtEnd.slice(14, 16)}`
      : undefined;
    return {
      id: `ics-${ev.uid ?? idx}-${idx}`,
      title: ev.summary,
      date: startDate,
      endDate: endDate && endDate !== startDate ? endDate : undefined,
      startTime,
      endTime,
      allDay: ev.allDay,
      memberIds: [],
      location: ev.location,
      notes: ev.description,
      recurrence: ev.rrule,
      exceptionDates: ev.exdates.length > 0 ? ev.exdates : undefined,
    };
  });
}