import { describe, it, expect } from 'vitest';
import { cn, hasSchedulingConflict, getConflictsForEvent } from './utils';
import { CalendarEvent } from '../types';

describe('cn', () => {
  it('merges and dedupes tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', false && 'text-blue-500')).toBe('text-red-500');
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: over.id ?? 'e',
  title: over.title ?? 't',
  date: over.date ?? '2026-06-25',
  memberIds: over.memberIds ?? [],
  ...over,
});

describe('hasSchedulingConflict', () => {
  it('returns false when the days differ', () => {
    expect(hasSchedulingConflict(
      ev({ id: 'a', date: '2026-06-25', startTime: '09:00' }),
      ev({ id: 'b', date: '2026-06-26', startTime: '09:00' }),
    )).toBe(false);
  });

  it('detects overlapping single-day events for the same member', () => {
    const a = ev({ id: 'a', startTime: '09:00', endTime: '10:00', memberIds: ['m1'] });
    const b = ev({ id: 'b', startTime: '09:30', endTime: '10:30', memberIds: ['m1'] });
    expect(hasSchedulingConflict(b, a)).toBe(true);
  });

  it('does not flag back-to-back events', () => {
    const a = ev({ id: 'a', startTime: '09:00', endTime: '10:00', memberIds: ['m1'] });
    const b = ev({ id: 'b', startTime: '10:00', endTime: '11:00', memberIds: ['m1'] });
    expect(hasSchedulingConflict(b, a)).toBe(false);
  });

  it('ignores events for different members', () => {
    const a = ev({ id: 'a', startTime: '09:00', endTime: '10:00', memberIds: ['m1'] });
    const b = ev({ id: 'b', startTime: '09:30', endTime: '10:30', memberIds: ['m2'] });
    expect(hasSchedulingConflict(b, a)).toBe(false);
  });

  it('returns true when one event fully contains the other', () => {
    const a = ev({ id: 'a', startTime: '09:00', endTime: '12:00', memberIds: ['m1'] });
    const b = ev({ id: 'b', startTime: '10:00', endTime: '11:00', memberIds: ['m1'] });
    expect(hasSchedulingConflict(b, a)).toBe(true);
  });
});

describe('getConflictsForEvent', () => {
  it('returns the conflicting events', () => {
    const a = ev({ id: 'a', startTime: '09:00', endTime: '10:00', memberIds: ['m1'] });
    const b = ev({ id: 'b', startTime: '09:30', endTime: '10:30', memberIds: ['m1'] });
    const c = ev({ id: 'c', startTime: '11:00', endTime: '12:00', memberIds: ['m1'] });
    expect(getConflictsForEvent(b, [a, c])).toEqual([a]);
  });
});