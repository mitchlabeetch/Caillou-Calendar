/**
 * Defensive input validation for event drafts.
 *
 * The plan's Phase 4 / Task 4.6 calls out the boundary cases:
 * 10 MB titles, 100+ attendees, events spanning 5+ years, birth
 * dates in the future, end-before-start, raw HTML payloads, etc.
 *
 * This module is the single source of truth — `AddEventModal`,
 * `EventDetailModal`, the ICS import path, and any future remote
 * sync must call `validateEventInput` before mutating state.
 */

export interface EventDraft {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  endDate?: string;
  attendeeIds?: string[];
  isBirthday?: boolean;
  birthDate?: string;
}

export type ValidationErrors = Record<string, string>;
export interface ValidationResult {
  ok: boolean;
  errors: ValidationErrors;
}

const TITLE_MAX = 5000;
const ATTENDEE_MAX = 100;
const DATE_MIN_YEAR = 1900;
const DATE_MAX_SPAN_DAYS = 365 * 5; // 5 years

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

/** Returns true if `value` parses as a calendar date and falls in the
 *  supported window. The window is intentionally wide so existing
 *  historical events still validate. */
function isValidDate(value: string | undefined): boolean {
  if (!value || !ISO_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (!Number.isFinite(year) || year < DATE_MIN_YEAR || year > 2200) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string | undefined): boolean {
  if (!value || !HHMM.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

function compareHHMM(a: string, b: string): number {
  return a.localeCompare(b);
}

function hasScriptOrHtml(value: string): boolean {
  return /<\s*(script|iframe|object|embed)\b/i.test(value)
    || /javascript:/i.test(value)
    || /on\w+\s*=/i.test(value);
}

function dayDiff(start: string, end: string): number {
  const s = Date.parse(`${start}T00:00:00Z`);
  const e = Date.parse(`${end}T00:00:00Z`);
  return Math.round((e - s) / (24 * 3600 * 1000));
}

export function validateEventInput(input: EventDraft): ValidationResult {
  const errors: ValidationErrors = {};

  const title = (input.title ?? '').trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  } else if (hasScriptOrHtml(title)) {
    errors.title = 'Title cannot contain HTML or script tags.';
  }

  if (!isValidDate(input.date)) {
    errors.date = 'Date must be a valid YYYY-MM-DD value.';
  }

  if (input.endDate !== undefined && input.endDate !== '') {
    const endDate = input.endDate;
    if (!isValidDate(endDate)) {
      errors.endDate = 'End date must be a valid YYYY-MM-DD value.';
    } else if (isValidDate(input.date) && input.date) {
      const diff = dayDiff(input.date, endDate);
      if (diff < 0) {
        errors.endDate = 'End date cannot be before the start date.';
      } else if (diff > DATE_MAX_SPAN_DAYS) {
        errors.endDate = 'Events cannot span more than 5 years.';
      }
    }
  }

  if (!isValidTime(input.startTime)) {
    errors.startTime = 'Start time must be HH:mm.';
  }
  if (!isValidTime(input.endTime)) {
    errors.endTime = 'End time must be HH:mm.';
  } else if (isValidTime(input.startTime)
    && compareHHMM(input.endTime as string, input.startTime as string) < 0) {
    errors.endTime = 'End time cannot be before start time.';
  }

  const attendees = input.attendeeIds ?? [];
  if (attendees.length > ATTENDEE_MAX) {
    errors.attendeeIds = `An event cannot have more than ${ATTENDEE_MAX} attendees.`;
  }

  if (input.isBirthday) {
    if (!input.birthDate) {
      errors.birthDate = 'Birth date is required for birthday events.';
    } else if (!isValidDate(input.birthDate)) {
      errors.birthDate = 'Birth date must be a valid YYYY-MM-DD value.';
    } else {
      const today = new Date().toISOString().slice(0, 10);
      if (input.birthDate > today) {
        errors.birthDate = 'Birth date cannot be in the future.';
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}