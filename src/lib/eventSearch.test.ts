import { describe, it, expect } from 'vitest';
import { searchEvents, firstMatch } from './eventSearch';
import type { CalendarEvent } from '../types';

const sample: CalendarEvent[] = [
  { id: '1', title: 'Soccer practice', date: '2026-06-25', memberIds: [], category: 'sports', tags: ['kids', 'outdoor'], location: 'Field A' },
  { id: '2', title: 'Doctor visit', date: '2026-06-26', memberIds: [], category: 'medical' },
  { id: '3', title: 'School pickup', date: '2026-06-25', memberIds: [], tags: ['school'] },
  { id: '4', title: 'Beach day', date: '2026-07-01', memberIds: [], location: 'Plage de la Baule' },
];

describe('eventSearch', () => {
  it('returns no hits for an empty query', () => {
    expect(searchEvents(sample, '')).toEqual([]);
    expect(searchEvents(sample, '   ')).toEqual([]);
  });

  it('matches title case-insensitively', () => {
    const hits = searchEvents(sample, 'soccer');
    expect(hits).toHaveLength(1);
    expect(hits[0].event.id).toBe('1');
    expect(hits[0].matchedField).toBe('title');
  });

  it('matches category', () => {
    const hits = searchEvents(sample, 'medical');
    expect(hits).toHaveLength(1);
    expect(hits[0].event.id).toBe('2');
  });

  it('matches tags', () => {
    const hits = searchEvents(sample, 'kids');
    expect(hits).toHaveLength(1);
    expect(hits[0].event.id).toBe('1');
    expect(hits[0].matchedField).toBe('tag');
  });

  it('matches location', () => {
    const hits = searchEvents(sample, 'plage');
    expect(hits).toHaveLength(1);
    expect(hits[0].event.id).toBe('4');
  });

  it('title wins over tag in the score (higher score first)', () => {
    const hits = searchEvents(sample, 'school');
    // "School pickup" title matches with score 100; tag match would be 60.
    expect(hits[0].matchedField).toBe('title');
    expect(hits[0].event.id).toBe('3');
  });

  it('firstMatch returns the top hit or undefined', () => {
    expect(firstMatch(sample, 'soccer')?.id).toBe('1');
    expect(firstMatch(sample, 'nope')).toBeUndefined();
  });
});