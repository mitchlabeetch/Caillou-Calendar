import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockUseAuth = vi.fn(() => ({ user: { uid: 'local-user', email: 'local@example.com' } }));

vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

import { useUserRole } from './useUserRole';
import { getSupabase } from '../lib/supabase';

describe('useUserRole', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: { uid: 'local-user', email: 'local@example.com' } });
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReset();
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('defaults to admin when nothing is persisted', () => {
    const { result } = renderHook(() => useUserRole());
    expect(result.current[0]).toBe('admin');
  });

  it('round-trips through localStorage', () => {
    localStorage.setItem('synoptic-user-role', 'child');
    const { result } = renderHook(() => useUserRole());
    expect(result.current[0]).toBe('child');
  });

  it('setter writes to localStorage', () => {
    const { result } = renderHook(() => useUserRole());
    act(() => result.current[1]('member'));
    expect(localStorage.getItem('synoptic-user-role')).toBe('member');
    expect(result.current[0]).toBe('member');
  });

  it('rejects bogus storage values', () => {
    localStorage.setItem('synoptic-user-role', 'super-admin');
    const { result } = renderHook(() => useUserRole());
    expect(result.current[0]).toBe('admin');
  });

  it('uses the backend-authenticated role for signed-in users', async () => {
    localStorage.setItem('synoptic-user-role', 'child');
    mockUseAuth.mockReturnValue({ user: { uid: 'u-1', email: 'signed-in@example.com' } });
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: () => Promise.resolve({
          data: {
            user: {
              id: 'u-1',
              user_metadata: { role: 'member' },
            },
          },
        }),
      },
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => {
      expect(result.current[0]).toBe('member');
    });
  });

  it('does not persist local overrides for signed-in users', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u-1', email: 'signed-in@example.com' } });
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: () => Promise.resolve({
          data: {
            user: {
              id: 'u-1',
              user_metadata: { role: 'member' },
            },
          },
        }),
      },
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => {
      expect(result.current[0]).toBe('member');
    });

    act(() => result.current[1]('admin'));

    expect(result.current[0]).toBe('member');
    expect(localStorage.getItem('synoptic-user-role')).toBeNull();
  });
});
