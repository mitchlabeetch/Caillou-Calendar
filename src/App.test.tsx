/**
 * Full App integration tests. Mocks out Supabase + localDb so App
 * boots in local-mode without IndexedDB or network. Verifies that
 * the wired shell, modal infrastructure, hooks, and calendar views
 * cooperate correctly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// --- Mocks --------------------------------------------------------------

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'local-user', email: 'local@example.com' },
    loading: false,
    error: null,
    signOut: vi.fn(async () => {}),
  }),
}));

vi.mock('./lib/localDb', () => {
  const events = new Map();
  const family = new Map();
  const places = new Map();
  let settings: any = undefined;
  let activeScope = 'local-user';
  return {
    setActiveStorageScope: vi.fn((scope: string) => {
      activeScope = scope;
      return Promise.resolve();
    }),
    getActiveStorageScope: vi.fn(() => activeScope),
    clearStorageScope: vi.fn(() => Promise.resolve()),
    localDb: {
      getEvents: vi.fn(() => Promise.resolve(Array.from(events.values()))),
      setEvents: vi.fn((list: any[]) => {
        events.clear();
        list.forEach(e => events.set(e.id, e));
        return Promise.resolve();
      }),
      addEvent: vi.fn((e: any) => { events.set(e.id, e); return Promise.resolve(); }),
      updateEvent: vi.fn((id: string, u: any) => {
        const existing = events.get(id);
        if (existing) events.set(id, { ...existing, ...u });
        return Promise.resolve();
      }),
      deleteEvent: vi.fn((id: string) => { events.delete(id); return Promise.resolve(); }),
      deleteEventsBatch: vi.fn((ids: string[]) => { ids.forEach(id => events.delete(id)); return Promise.resolve(); }),
      getFamilyMembers: vi.fn(() => Promise.resolve(Array.from(family.values()))),
      setFamilyMembers: vi.fn((list: any[]) => {
        family.clear();
        list.forEach(m => family.set(m.id, m));
        return Promise.resolve();
      }),
      getPlaces: vi.fn(() => Promise.resolve(Array.from(places.values()))),
      setPlaces: vi.fn((list: any[]) => {
        places.clear();
        list.forEach(p => places.set(p.id, p));
        return Promise.resolve();
      }),
      getSettings: vi.fn(() => Promise.resolve(settings)),
      setSettings: vi.fn((s: any) => { settings = s; return Promise.resolve(); }),
      enqueueSync: vi.fn(() => Promise.resolve()),
      getOutboundQueue: vi.fn(() => Promise.resolve([])),
      clearOutboundQueue: vi.fn(() => Promise.resolve()),
    },
    flushOutboundSyncQueue: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('./lib/syncEngine', () => ({
  syncInsert: vi.fn(() => Promise.resolve()),
  syncUpdate: vi.fn(() => Promise.resolve()),
  syncDelete: vi.fn(() => Promise.resolve()),
}));

vi.mock('./lib/supabase', () => ({
  getSupabase: () => null,
  signInWithEmail: vi.fn(() => Promise.resolve({ error: null })),
  signUpWithEmail: vi.fn(() => Promise.resolve({ error: null })),
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  dbRowToEvent: (row: any) => row,
  dbRowToMember: (row: any) => row,
  dbRowToSettings: (row: any) => row,
}));

vi.mock('./lib/pushNotifications', () => ({
  getPushSubscription: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(() => Promise.resolve(null)),
  unsubscribeFromPush: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('mobile-drag-drop', () => ({
  default: () => ({ destroy: () => {} }),
}));

// --- Tests --------------------------------------------------------------

import App from './App';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // Mark the onboarding splash as already dismissed so the first-launch
    // modal doesn't fight the Escape-key test or pollute `role="dialog"`
    // counts. The onboarding behaviour is covered separately by
    // `OnboardingSplash.test.tsx`.
    localStorage.setItem('synoptic-onboarding-dismissed', '1');
  });

  it('renders the calendar shell without crashing', async () => {
    render(<App />);
    // The header with navigation arrows should appear.
    await waitFor(() => {
      // The "+" floating action button has the lucide-plus icon.
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('exposes the Settings button (lucide-settings icon)', async () => {
    render(<App />);
    await waitFor(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const found = buttons.some(b => {
        const svg = b.querySelector('svg');
        return svg && /lucide-settings/i.test(svg.getAttribute('class') || '');
      });
      expect(found).toBe(true);
    });
  });

  it('opens the AddEventModal when the + button is clicked', async () => {
    render(<App />);
    await waitFor(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plusBtn = buttons.find(b => {
        const svg = b.querySelector('svg');
        return svg && /lucide-plus/i.test(svg.getAttribute('class') || '');
      });
      expect(plusBtn).toBeTruthy();
    });
    const buttons = Array.from(document.querySelectorAll('button'));
    const plusBtn = buttons.find(b => {
      const svg = b.querySelector('svg');
      return svg && /lucide-plus/i.test(svg.getAttribute('class') || '');
    });
    fireEvent.click(plusBtn!);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });

  it('exposes a single main landmark and a working skip link target', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const main = screen.getByRole('main');

    fireEvent.click(skipLink);

    expect(main.getAttribute('id')).toBe('main-content');
    expect(document.activeElement).toBe(main);
  });

  it('opens the SettingsModal and theme select applies', async () => {
    render(<App />);
    await waitFor(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const found = buttons.some(b => {
        const svg = b.querySelector('svg');
        return svg && /lucide-settings/i.test(svg.getAttribute('class') || '');
      });
      expect(found).toBe(true);
    });
    const settingsBtn = Array.from(document.querySelectorAll('button')).find(b => {
      const svg = b.querySelector('svg');
      return svg && /lucide-settings/i.test(svg.getAttribute('class') || '');
    });
    fireEvent.click(settingsBtn!);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
    const dialog = screen.getByRole('dialog');
    const themeSelect = within(dialog).getAllByRole('combobox').find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === 'dark'),
    ) as HTMLSelectElement | undefined;
    expect(themeSelect).toBeTruthy();
    fireEvent.change(themeSelect!, { target: { value: 'dark' } });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('closes any open dialog on Escape', async () => {
    render(<App />);
    await waitFor(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plusBtn = buttons.find(b => {
        const svg = b.querySelector('svg');
        return svg && /lucide-plus/i.test(svg.getAttribute('class') || '');
      });
      expect(plusBtn).toBeTruthy();
    });
    const buttons = Array.from(document.querySelectorAll('button'));
    const plusBtn = buttons.find(b => {
      const svg = b.querySelector('svg');
      return svg && /lucide-plus/i.test(svg.getAttribute('class') || '');
    });
    fireEvent.click(plusBtn!);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
