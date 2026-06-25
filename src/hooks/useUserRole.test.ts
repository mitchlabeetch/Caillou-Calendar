import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: { uid: 'local-user', email: 'local@example.com' } }),
}));

import { useUserRole } from './useUserRole';

describe('useUserRole', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
