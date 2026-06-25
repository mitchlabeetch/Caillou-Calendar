/**
 * Event search/fuzzy-match.
 *
 * Case-insensitive substring search over title, location, tags, and
 * category. Returns the matched events plus a relevance score so the
 * search overlay can render results in order.
 */

import type { CalendarEvent } from '../types';

export interface SearchHit {
  event: CalendarEvent;
  score: number;
  matchedField: 'title' | 'location' | 'tag' | 'category' | 'notes';
}

export function searchEvents(events: CalendarEvent[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const hits: SearchHit[] = [];
  for (const e of events) {
    const title = e.title.toLowerCase();
    if (title.includes(q)) {
      hits.push({ event: e, score: 100 - title.indexOf(q), matchedField: 'title' });
      continue;
    }
    if (e.location && e.location.toLowerCase().includes(q)) {
      hits.push({ event: e, score: 80, matchedField: 'location' });
      continue;
    }
    if (e.category && e.category.toLowerCase().includes(q)) {
      hits.push({ event: e, score: 70, matchedField: 'category' });
      continue;
    }
    if (e.tags?.some(t => t.toLowerCase().includes(q))) {
      hits.push({ event: e, score: 60, matchedField: 'tag' });
      continue;
    }
    if (e.notes && e.notes.toLowerCase().includes(q)) {
      hits.push({ event: e, score: 40, matchedField: 'notes' });
      continue;
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** Returns next upcoming event whose title matches, used by the cmd-K palette. */
export function firstMatch(events: CalendarEvent[], query: string): CalendarEvent | undefined {
  return searchEvents(events, query)[0]?.event;
}