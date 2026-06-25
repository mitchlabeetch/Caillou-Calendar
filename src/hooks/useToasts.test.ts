import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToasts } from './useToasts';

describe('useToasts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useToasts());
    expect(result.current.toasts).toEqual([]);
  });

  it('appends a toast when showToast is called', () => {
    const { result } = renderHook(() => useToasts());
    act(() => result.current.showToast('hello'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('hello');
  });

  it('dismisses by id', () => {
    const { result } = renderHook(() => useToasts());
    act(() => result.current.showToast('one'));
    act(() => result.current.showToast('two'));
    const firstId = result.current.toasts[0].id;
    act(() => result.current.dismissToast(firstId));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('two');
  });

  it('auto-dismisses after the duration', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasts());
    act(() => result.current.showToast('auto', 1000));
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});