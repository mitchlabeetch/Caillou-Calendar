import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

let authUser = { uid: 'user-1', email: 'user-1@example.com' };
const removeChannel = vi.fn();
const channel = vi.fn();
const from = vi.fn();

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    error: null,
    signOut: vi.fn(async () => {}),
  }),
}));

vi.mock('./lib/localDb', () => ({
  setActiveStorageScope: vi.fn(() => Promise.resolve()),
  getActiveStorageScope: vi.fn(() => 'user:user-1'),
  clearStorageScope: vi.fn(() => Promise.resolve()),
  localDb: {
    getEvents: vi.fn(() => Promise.resolve([])),
    setEvents: vi.fn(() => Promise.resolve()),
    getFamilyMembers: vi.fn(() => Promise.resolve([])),
    setFamilyMembers: vi.fn(() => Promise.resolve()),
    getPlaces: vi.fn(() => Promise.resolve([])),
    setPlaces: vi.fn(() => Promise.resolve()),
    getSettings: vi.fn(() => Promise.resolve(undefined)),
    setSettings: vi.fn(() => Promise.resolve()),
  },
  flushOutboundSyncQueue: vi.fn(() => Promise.resolve()),
}));

vi.mock('./lib/syncEngine', () => ({
  syncInsert: vi.fn(() => Promise.resolve()),
  syncUpdate: vi.fn(() => Promise.resolve()),
  syncDelete: vi.fn(() => Promise.resolve()),
}));

vi.mock('./lib/pushNotifications', () => ({
  getPushSubscription: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(() => Promise.resolve(null)),
  unsubscribeFromPush: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('mobile-drag-drop', () => ({
  default: () => ({ destroy: () => {} }),
}));

vi.mock('./lib/supabase', () => ({
  getSupabase: () => ({
    from,
    channel,
    removeChannel,
  }),
  signInWithEmail: vi.fn(() => Promise.resolve({ error: null })),
  signUpWithEmail: vi.fn(() => Promise.resolve({ error: null })),
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  dbRowToEvent: (row: unknown) => row,
  dbRowToMember: (row: unknown) => row,
  dbRowToSettings: (row: unknown) => row,
}));

import App from './App';

describe('App realtime cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('synoptic-onboarding-dismissed', '1');
    authUser = { uid: 'user-1', email: 'user-1@example.com' };
    removeChannel.mockReset();
    channel.mockReset();
    from.mockReset();

    from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    });

    channel.mockImplementation((name: string) => {
      const subscription = { name };
      return {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(() => subscription),
      };
    });
  });

  it('removes the previous channel on user change and on unmount', async () => {
    const { rerender, unmount } = render(<App />);

    await waitFor(() => {
      expect(channel).toHaveBeenCalledWith('events_changes:user-1');
    });

    const firstSubscription = channel.mock.results[0]?.value.subscribe.mock.results[0]?.value;

    authUser = { uid: 'user-2', email: 'user-2@example.com' };
    rerender(<App />);

    await waitFor(() => {
      expect(removeChannel).toHaveBeenCalledWith(firstSubscription);
    });

    await waitFor(() => {
      expect(channel).toHaveBeenCalledWith('events_changes:user-2');
    });

    const secondSubscription = channel.mock.results[1]?.value.subscribe.mock.results[0]?.value;

    unmount();

    await waitFor(() => {
      expect(removeChannel).toHaveBeenCalledWith(secondSubscription);
    });
  });
});
