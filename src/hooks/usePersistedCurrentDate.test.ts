import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedCurrentDate } from './usePersistedCurrentDate';

describe('usePersistedCurrentDate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to today', () => {
    const { result } = renderHook(() => usePersistedCurrentDate());
    const [d] = result.current;
    const today = new Date();
    expect(d.getFullYear()).toBe(today.getFullYear());
    expect(d.getMonth()).toBe(today.getMonth());
    expect(d.getDate()).toBe(today.getDate());
  });

  it('persists across reloads', () => {
    const { result, unmount } = renderHook(() => usePersistedCurrentDate());
    const target = new Date(2030, 0, 15);
    act(() => result.current[1](target));
    expect(result.current[0]).toEqual(target);
    unmount();

    const { result: second } = renderHook(() => usePersistedCurrentDate());
    expect(second.current[0].getFullYear()).toBe(2030);
    expect(second.current[0].getMonth()).toBe(0);
    expect(second.current[0].getDate()).toBe(15);
  });

  it('ignores garbage values in storage', () => {
    localStorage.setItem('synoptic-current-date', 'not-a-date');
    const { result } = renderHook(() => usePersistedCurrentDate());
    const today = new Date();
    expect(result.current[0].getFullYear()).toBe(today.getFullYear());
  });
});