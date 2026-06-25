/**
 * Single source of truth for the calendar's timezone behaviour.
 *
 * Events are stored as wall-clock strings (`date: 'YYYY-MM-DD'`,
 * `startTime: 'HH:mm'`) and intentionally have no timezone offset.
 * This is the right choice for a household calendar — 9 AM school
 * drop-off means "9 AM wherever I am right now" — but it bites
 * travellers who cross timezones mid-trip.
 *
 * `getActiveTimeZone()` returns the zone used by the running
 * browser. The Settings modal lets the user override it for one
 * trip; the override is stored on `AppSettings.activeTimeZone` and
 * applied via `formatInTimeZone` from `date-fns-tz` (already a
 * transitive dependency).
 *
 * Tracked in wiki/operations/18-production-audit.md §3.1.
 */
import { formatInTimeZone } from 'date-fns-tz';

const STORAGE_KEY = 'synoptic-active-timezone';

export function getActiveTimeZone(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {}
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function setActiveTimeZone(tz: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {}
}

/** Format a wall-clock moment in the active timezone. */
export function formatInActiveZone(date: Date, fmt: string): string {
  return formatInTimeZone(date, getActiveTimeZone(), fmt);
}