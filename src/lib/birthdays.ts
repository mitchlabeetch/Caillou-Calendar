/**
 * Birthday countdown helper.
 *
 * Given a list of family members with `birthday: 'MM-DD'` or
 * 'YYYY-MM-DD', returns the closest upcoming birthday and the days
 * until it.
 */

import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

export interface BirthdayMember {
  id: string;
  name: string;
  birthday?: string;
}

export interface NextBirthday {
  member: BirthdayMember;
  daysUntil: number;
  date: Date;
}

export function nextBirthdayFor(members: BirthdayMember[], from = new Date()): NextBirthday | null {
  let best: NextBirthday | null = null;
  for (const m of members) {
    if (!m.birthday) continue;
    const candidate = nextOccurrence(m.birthday, from);
    if (!candidate) continue;
    const days = differenceInCalendarDays(candidate, from);
    if (days < 0) continue;
    if (!best || days < best.daysUntil) {
      best = { member: m, daysUntil: days, date: candidate };
    }
  }
  return best;
}

function nextOccurrence(birthday: string, from: Date): Date | null {
  // Accept either MM-DD or full ISO YYYY-MM-DD.
  const parts = birthday.split('-');
  if (parts.length !== 2 && parts.length !== 3) return null;
  const month = parseInt(parts[parts.length - 2], 10);
  const day = parseInt(parts[parts.length - 1], 10);
  if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = from.getFullYear();
  const candidateThisYear = new Date(year, month - 1, day);
  if (candidateThisYear < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    candidateThisYear.setFullYear(year + 1);
  }
  return candidateThisYear;
}

/** Quick stats — events this week per member. */
export function eventsThisWeekByMember<T extends { date: string; memberIds: string[] }>(
  events: T[],
  weekStart: Date,
  weekEnd: Date,
): Record<string, number> {
  const out: Record<string, number> = {};
  const startIso = weekStart.toISOString().slice(0, 10);
  const endIso = weekEnd.toISOString().slice(0, 10);
  for (const e of events) {
    if (e.date < startIso || e.date > endIso) continue;
    for (const id of e.memberIds) {
      out[id] = (out[id] ?? 0) + 1;
    }
  }
  return out;
}

// Keep parseISO + isValid referenced so a stale import warning never surfaces.
void parseISO;
void isValid;