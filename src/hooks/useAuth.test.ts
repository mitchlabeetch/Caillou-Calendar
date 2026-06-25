// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockSupabase = vi.fn();
const mockSubscribeToPush = vi.fn();
const mockUnsubscribeFromPush = vi.fn();

vi.mock('../lib/supabase', () => ({
  getSupabase: () => mockSupabase(),
}));
vi.mock('../lib/pushNotifications', () => ({
  subscribeToPush: mockSubscribeToPush,
  unsubscribeFromPush: mockUnsubscribeFromPush,
}));

// We import after the mocks are set up.
import { useAuth } from './useAuth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAuth — local mode (no supabase)', () => {
  it('falls back to local-user when getSupabase returns null', async () => {
    mockSupabase.mockReturnValue(null);
    const { result } = renderHook(() => useAuth());
    // Wait one tick for the async effect to resolve.
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(result.current.user?.uid).toBe('local-user');
    expect(result.current.loading).toBe(false);
  });
});

describe('useAuth — supabase mode', () => {
  it('uses the supabase session when present', async () => {
    const unsubscribe = vi.fn();
    mockSupabase.mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({
          data: { session: { user: { id: 'u-1', email: 'a@b.com' } } },
        }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe } } }),
        signOut: () => Promise.resolve(),
      },
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(result.current.user?.uid).toBe('u-1');
    expect(result.current.user?.email).toBe('a@b.com');
    expect(unsubscribe).toBeDefined();
  });

  it('falls back to null user when no session', async () => {
    mockSupabase.mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut: () => Promise.resolve(),
      },
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(result.current.user).toBeNull();
  });

  it('captures error and clears user when init throws', async () => {
    mockSupabase.mockImplementation(() => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(result.current.error).toBe('boom');
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('signOut clears the user and calls supabase.auth.signOut when configured', async () => {
    const signOut = vi.fn(() => Promise.resolve());
    mockSupabase.mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut,
      },
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    await act(async () => { await result.current.signOut(); });
    expect(signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
