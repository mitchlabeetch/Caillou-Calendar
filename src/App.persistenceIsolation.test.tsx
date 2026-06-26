// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEvents } from './lib/eventsContext';

let currentUser: { uid: string; email: string } | null = { uid: 'alpha', email: 'alpha@example.com' };
let activeScope = 'signed-out';

const scopedStores = new Map<
  string,
  {
    events: Array<Record<string, unknown>>;
    family: Array<Record<string, unknown>>;
    places: Array<Record<string, unknown>>;
    settings?: Record<string, unknown>;
  }
>();

const getScopedStore = () => {
  if (!scopedStores.has(activeScope)) {
    scopedStores.set(activeScope, { events: [], family: [], places: [] });
  }
  return scopedStores.get(activeScope)!;
};

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    error: null,
    signOut: vi.fn(async () => {}),
  }),
}));

vi.mock('./hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('./lib/localDb', () => ({
  setActiveStorageScope: vi.fn(async (scope: string) => {
    activeScope = scope;
  }),
  getActiveStorageScope: vi.fn(() => activeScope),
  clearStorageScope: vi.fn(async () => {
    scopedStores.set(activeScope, { events: [], family: [], places: [] });
  }),
  localDb: {
    getEvents: vi.fn(async () => getScopedStore().events),
    setEvents: vi.fn(async (events: Array<Record<string, unknown>>) => {
      getScopedStore().events = events;
    }),
    getFamilyMembers: vi.fn(async () => getScopedStore().family),
    setFamilyMembers: vi.fn(async (family: Array<Record<string, unknown>>) => {
      getScopedStore().family = family;
    }),
    getPlaces: vi.fn(async () => getScopedStore().places),
    setPlaces: vi.fn(async (places: Array<Record<string, unknown>>) => {
      getScopedStore().places = places;
    }),
    getSettings: vi.fn(async () => getScopedStore().settings),
    setSettings: vi.fn(async (settings: Record<string, unknown>) => {
      getScopedStore().settings = settings;
    }),
    enqueueSync: vi.fn(async () => {}),
    getOutboundQueue: vi.fn(async () => []),
    clearOutboundQueue: vi.fn(async () => {}),
  },
  flushOutboundSyncQueue: vi.fn(async () => {}),
}));

vi.mock('./lib/syncEngine', () => ({
  syncInsert: vi.fn(async () => {}),
  syncUpdate: vi.fn(async () => {}),
  syncDelete: vi.fn(async () => {}),
}));

vi.mock('./lib/supabase', () => ({
  getSupabase: () => null,
  dbRowToEvent: (row: unknown) => row,
  dbRowToMember: (row: unknown) => row,
  dbRowToSettings: (row: unknown) => row,
}));

vi.mock('./lib/pushNotifications', () => ({
  getPushSubscription: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(async () => null),
  unsubscribeFromPush: vi.fn(async () => true),
}));

vi.mock('./components/Sidebar', () => ({
  Sidebar: () => null,
}));

vi.mock('./components/CalendarMonth', () => ({
  CalendarMonth: () => {
    const { events } = useEvents();
    return <div data-testid="calendar-view">{events.map((event) => String(event.title)).join(', ')}</div>;
  },
}));

vi.mock('./components/CalendarWeek', () => ({
  CalendarWeek: () => {
    const { events } = useEvents();
    return <div data-testid="calendar-view">{events.map((event) => String(event.title)).join(', ')}</div>;
  },
}));

vi.mock('./components/CalendarAgenda', () => ({
  CalendarAgenda: () => {
    const { events } = useEvents();
    return <div data-testid="calendar-view">{events.map((event) => String(event.title)).join(', ')}</div>;
  },
}));

vi.mock('./components/AddEventModal', () => ({ AddEventModal: () => null }));
vi.mock('./components/EventDetailModal', () => ({ EventDetailModal: () => null }));
vi.mock('./components/DayEventsModal', () => ({ DayEventsModal: () => null }));
vi.mock('./components/ReminderSystem', () => ({ ReminderSystem: () => null }));
vi.mock('./components/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('./components/PrintPreviewModal', () => ({ PrintPreviewModal: () => null }));
vi.mock('./components/MemberFilterBar', () => ({ MemberFilterBar: () => null }));
vi.mock('./components/DstBadge', () => ({ DstBadge: () => null }));
vi.mock('./components/OnboardingSplash', () => ({
  OnboardingSplash: () => null,
  shouldShowOnboarding: () => false,
}));

vi.mock('mobile-drag-drop', () => ({
  default: () => ({ destroy: () => {} }),
}));

import App from './App';

describe('App storage isolation', () => {
  beforeEach(() => {
    activeScope = 'signed-out';
    currentUser = { uid: 'alpha', email: 'alpha@example.com' };
    scopedStores.clear();
    scopedStores.set('user:alpha', {
      events: [{ id: 'alpha-event', title: 'Alpha cache', date: '2026-06-26', memberIds: [], recurrence: { type: 'none' }, reminders: [] }],
      family: [],
      places: [],
    });
    scopedStores.set('user:beta', {
      events: [{ id: 'beta-event', title: 'Beta cache', date: '2026-06-26', memberIds: [], recurrence: { type: 'none' }, reminders: [] }],
      family: [],
      places: [],
    });
    scopedStores.set('signed-out', { events: [], family: [], places: [] });
    localStorage.clear();
    localStorage.setItem('synoptic-onboarding-dismissed', '1');
  });

  it('switches IndexedDB scope when the authenticated account changes and clears signed-out cache', async () => {
    const { rerender } = render(<App />);

    await waitFor(() => {
      expect(activeScope).toBe('user:alpha');
      expect(screen.getByTestId('calendar-view').textContent).toContain('Alpha cache');
    });

    currentUser = { uid: 'beta', email: 'beta@example.com' };
    rerender(<App />);

    await waitFor(() => {
      expect(activeScope).toBe('user:beta');
      expect(screen.getByTestId('calendar-view').textContent).toContain('Beta cache');
      expect(screen.getByTestId('calendar-view').textContent).not.toContain('Alpha cache');
    });

    currentUser = null;
    rerender(<App />);

    await waitFor(() => {
      expect(activeScope).toBe('signed-out');
      expect(screen.getByTestId('calendar-view').textContent).not.toContain('Beta cache');
    });
  });
});
