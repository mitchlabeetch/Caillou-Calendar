import { vi } from 'vitest';
import type { CalendarEvent, FamilyMember, AppSettings } from '../types';

/**
 * In-memory localDb stand-in used by integration tests. Mirrors the
 * shape of `src/lib/localDb.ts` so the real `App` can call it via
 * `vi.mock('../lib/localDb', ...)`.
 */
export function createMockLocalDb() {
  const events = new Map<string, CalendarEvent>();
  const family = new Map<string, FamilyMember>();
  const places = new Map<string, { id: string; name: string; icon?: string }>();
  let settings: AppSettings | undefined;

  return {
    events,
    family,
    places,
    getSettings: () => settings,
    setSettings: (s: AppSettings) => {
      settings = s;
      return Promise.resolve();
    },
    getEvents: vi.fn(() => Promise.resolve(Array.from(events.values()))),
    setEvents: vi.fn((list: CalendarEvent[]) => {
      events.clear();
      list.forEach(e => events.set(e.id, e));
      return Promise.resolve();
    }),
    addEvent: vi.fn((e: CalendarEvent) => {
      events.set(e.id, e);
      return Promise.resolve();
    }),
    updateEvent: vi.fn((id: string, updates: Partial<CalendarEvent>) => {
      const existing = events.get(id);
      if (existing) events.set(id, { ...existing, ...updates });
      return Promise.resolve();
    }),
    deleteEvent: vi.fn((id: string) => {
      events.delete(id);
      return Promise.resolve();
    }),
    deleteEventsBatch: vi.fn((ids: string[]) => {
      ids.forEach(id => events.delete(id));
      return Promise.resolve();
    }),
    getFamilyMembers: vi.fn(() => Promise.resolve(Array.from(family.values()))),
    setFamilyMembers: vi.fn((list: FamilyMember[]) => {
      family.clear();
      list.forEach(m => family.set(m.id, m));
      return Promise.resolve();
    }),
    getPlaces: vi.fn(() => Promise.resolve(Array.from(places.values()))),
    setPlaces: vi.fn((list: { id: string; name: string; icon?: string }[]) => {
      places.clear();
      list.forEach(p => places.set(p.id, p));
      return Promise.resolve();
    }),
    enqueueSync: vi.fn(() => Promise.resolve()),
    getOutboundQueue: vi.fn(() => Promise.resolve([])),
    clearOutboundQueue: vi.fn(() => Promise.resolve()),
  };
}

export function seedMockDb(
  mock: ReturnType<typeof createMockLocalDb>,
  seed: {
    events?: CalendarEvent[];
    family?: FamilyMember[];
    places?: { id: string; name: string; icon?: string }[];
    settings?: AppSettings;
  } = {},
) {
  if (seed.events) seed.events.forEach(e => mock.events.set(e.id, e));
  if (seed.family) seed.family.forEach(m => mock.family.set(m.id, m));
  if (seed.places) seed.places.forEach(p => mock.places.set(p.id, p));
  if (seed.settings) mock.setSettings(seed.settings);
}

export const sampleFamily: FamilyMember[] = [
  { id: 'm1', name: 'Alice', color: '#B39DDB', bgClass: 'bg-mem-1', icon: 'User' },
  { id: 'm2', name: 'Bob', color: '#80CBC4', bgClass: 'bg-mem-2', icon: 'User' },
];

export const sampleEvent: CalendarEvent = {
  id: 'evt-1',
  title: 'Sample',
  date: '2026-06-25',
  startTime: '10:00',
  memberIds: ['m1'],
  recurrence: { type: 'none' },
  reminders: [],
};

/**
 * Mock useAuth to always resolve to a local-mode user so App renders
 * the calendar rather than the sign-in screen.
 */
export function mockUseAuth() {
  const signOut = vi.fn(async () => {});
  return {
    user: { uid: 'local-user', email: 'local@example.com' },
    loading: false,
    error: null,
    signOut,
  };
}
