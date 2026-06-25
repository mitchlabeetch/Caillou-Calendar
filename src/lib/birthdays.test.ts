import { describe, it, expect } from 'vitest';
import { nextBirthdayFor, eventsThisWeekByMember } from './birthdays';

describe('birthdays', () => {
  it('skips members without a birthday', () => {
    const result = nextBirthdayFor([{ id: 'm1', name: 'A' }], new Date('2026-06-25'));
    expect(result).toBeNull();
  });

  it('returns the next upcoming birthday in MM-DD format', () => {
    const result = nextBirthdayFor(
      [{ id: 'm1', name: 'Alice', birthday: '12-25' }],
      new Date('2026-06-25'),
    );
    expect(result?.member.name).toBe('Alice');
    expect(result?.daysUntil).toBeGreaterThan(150);
  });

  it('rolls over to next year when the date has already passed', () => {
    const result = nextBirthdayFor(
      [{ id: 'm1', name: 'Alice', birthday: '01-15' }],
      new Date('2026-06-25'),
    );
    expect(result?.daysUntil).toBeGreaterThan(180);
  });

  it('returns 0 days for today', () => {
    const result = nextBirthdayFor(
      [{ id: 'm1', name: 'Bob', birthday: '06-25' }],
      new Date('2026-06-25'),
    );
    expect(result?.daysUntil).toBe(0);
  });

  it('eventsThisWeekByMember buckets by memberId', () => {
    const events = [
      { date: '2026-06-25', memberIds: ['m1'] },
      { date: '2026-06-26', memberIds: ['m1', 'm2'] },
      { date: '2026-06-30', memberIds: ['m2'] },
      { date: '2026-07-05', memberIds: ['m1'] },
    ];
    const result = eventsThisWeekByMember(
      events,
      new Date('2026-06-22'),
      new Date('2026-06-28'),
    );
    expect(result.m1).toBe(2);
    expect(result.m2).toBe(1);
  });

  it('eventsThisWeekByMember returns empty map for empty input', () => {
    expect(eventsThisWeekByMember([], new Date('2026-06-22'), new Date('2026-06-28'))).toEqual({});
  });
});