import { describe, it, expect } from 'vitest';
import { validateEventInput, type EventDraft } from './eventValidation';

/**
 * Defensive input validation for event drafts.
 *
 * These tests cover the hard rules the plan calls out (10MB title,
 * 100 attendees, end-before-start, birth date in the future, …).
 * Every new error path here must include an explicit message so the
 * caller can show it inline.
 */

const baseDraft: EventDraft = {
  title: 'Doctor',
  date: '2026-07-01',
  startTime: '09:00',
  endTime: '10:00',
  attendeeIds: ['m1'],
};

describe('validateEventInput', () => {
  it('accepts a minimal well-formed draft', () => {
    expect(validateEventInput(baseDraft)).toEqual({ ok: true, errors: {} });
  });

  it('rejects an empty title', () => {
    const r = validateEventInput({ ...baseDraft, title: '   ' });
    expect(r.ok).toBe(false);
    expect(r.errors.title).toBeTruthy();
  });

  it('rejects a title longer than 5_000 characters', () => {
    const r = validateEventInput({ ...baseDraft, title: 'a'.repeat(5_001) });
    expect(r.ok).toBe(false);
    expect(r.errors.title).toBeTruthy();
  });

  it('rejects a 10MB title (defends against OOM)', () => {
    const r = validateEventInput({ ...baseDraft, title: 'a'.repeat(10 * 1024 * 1024) });
    expect(r.ok).toBe(false);
    expect(r.errors.title).toBeTruthy();
  });

  it('rejects a malformed date string', () => {
    const r = validateEventInput({ ...baseDraft, date: 'not-a-date' });
    expect(r.ok).toBe(false);
    expect(r.errors.date).toBeTruthy();
  });

  it('rejects a date outside the supported window', () => {
    const r = validateEventInput({ ...baseDraft, date: '1700-01-01' });
    expect(r.ok).toBe(false);
    expect(r.errors.date).toBeTruthy();
  });

  it('rejects endTime before startTime', () => {
    const r = validateEventInput({ ...baseDraft, startTime: '10:00', endTime: '09:00' });
    expect(r.ok).toBe(false);
    expect(r.errors.endTime).toBeTruthy();
  });

  it('accepts endTime equal to startTime (zero-length event)', () => {
    const r = validateEventInput({ ...baseDraft, startTime: '09:00', endTime: '09:00' });
    expect(r.ok).toBe(true);
  });

  it('rejects more than 100 attendees', () => {
    const ids = Array.from({ length: 101 }, (_, i) => `m${i}`);
    const r = validateEventInput({ ...baseDraft, attendeeIds: ids });
    expect(r.ok).toBe(false);
    expect(r.errors.attendeeIds).toBeTruthy();
  });

  it('rejects a birth date in the future', () => {
    const futureYear = new Date().getFullYear() + 5;
    const r = validateEventInput({
      ...baseDraft,
      isBirthday: true,
      birthDate: `${futureYear}-06-26`,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.birthDate).toBeTruthy();
  });

  it('accepts a birth date in the past', () => {
    const r = validateEventInput({
      ...baseDraft,
      isBirthday: true,
      birthDate: '1990-06-26',
    });
    expect(r.ok).toBe(true);
  });

  it('rejects an event whose date span exceeds 5 years', () => {
    const r = validateEventInput({
      ...baseDraft,
      endDate: '2032-07-01', // > 5 years past start
    });
    expect(r.ok).toBe(false);
    expect(r.errors.endDate).toBeTruthy();
  });

  it('rejects HTML/script payloads in the title (XSS guard)', () => {
    const r = validateEventInput({
      ...baseDraft,
      title: '<script>alert(1)</script>',
    });
    // The validator must reject the raw script tag. The XSS-safe
    // rendering path strips it, but input must never carry it.
    expect(r.ok).toBe(false);
    expect(r.errors.title).toBeTruthy();
  });

  it('reports multiple errors at once', () => {
    const r = validateEventInput({
      title: '',
      date: 'nope',
      startTime: '10:00',
      endTime: '09:00',
      attendeeIds: [],
    });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).length).toBeGreaterThanOrEqual(3);
  });
});