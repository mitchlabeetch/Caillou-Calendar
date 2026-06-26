/**
 * Regression test for the "single source of truth" cleanup. The data
 * layer (events / family / places / settings) lives in IndexedDB via
 * `localDb` only. UI preferences (theme, currentDate, …) keep using
 * `localStorage` because they are cheap scalars.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'local-user', email: 'l@x' }, loading: false, error: null, signOut: vi.fn() }),
}));

vi.mock('./lib/localDb', () => {
  const store = new Map<string, unknown>();
  let activeScope = 'local-user';
  return {
    setActiveStorageScope: vi.fn((scope: string) => {
      activeScope = scope;
      return Promise.resolve();
    }),
    getActiveStorageScope: vi.fn(() => activeScope),
    clearStorageScope: vi.fn(() => Promise.resolve()),
    localDb: {
      getEvents: vi.fn(() => Promise.resolve((store.get('events') as unknown[]) ?? [])),
      setEvents: vi.fn((list: unknown[]) => { store.set('events', list); return Promise.resolve(); }),
      getFamilyMembers: vi.fn(() => Promise.resolve((store.get('family') as unknown[]) ?? [])),
      setFamilyMembers: vi.fn((list: unknown[]) => { store.set('family', list); return Promise.resolve(); }),
      getPlaces: vi.fn(() => Promise.resolve((store.get('places') as unknown[]) ?? [])),
      setPlaces: vi.fn((list: unknown[]) => { store.set('places', list); return Promise.resolve(); }),
      getSettings: vi.fn(() => Promise.resolve(store.get('settings'))),
      setSettings: vi.fn((s: unknown) => { store.set('settings', s); return Promise.resolve(); }),
    },
    flushOutboundSyncQueue: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('./lib/syncEngine', () => ({
  syncInsert: vi.fn(), syncUpdate: vi.fn(), syncDelete: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({ getSupabase: () => null }));
vi.mock('./lib/pushNotifications', () => ({
  getPushSubscription: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(), unsubscribeFromPush: vi.fn(),
}));
vi.mock('mobile-drag-drop', () => ({ default: () => ({ destroy: () => {} }) }));

import App from './App';

describe('Single source of truth (events/family/places/settings)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does NOT mirror events to localStorage as a second source of truth', async () => {
    render(<App />);
    await waitFor(() => {
      // App has rendered some buttons
      expect(document.querySelectorAll('button').length).toBeGreaterThan(0);
    });
    expect(localStorage.getItem('synoptic-events')).toBeNull();
  });

  it('migrates legacy localStorage events to IndexedDB and removes the legacy key', async () => {
    const legacy = [{ id: 'l1', title: 'Legacy', date: '2026-01-01', memberIds: [], recurrence: { type: 'none' }, reminders: [] }];
    localStorage.setItem('synoptic-events', JSON.stringify(legacy));
    render(<App />);
    await waitFor(() => {
      expect(document.querySelectorAll('button').length).toBeGreaterThan(0);
    });
    // The migration runs on mount; we wait for the IndexedDB write
    // effect to flush. We assert the legacy key was removed.
    await waitFor(() => {
      expect(localStorage.getItem('synoptic-events')).toBeNull();
    }, { timeout: 1500 });
  });
});
