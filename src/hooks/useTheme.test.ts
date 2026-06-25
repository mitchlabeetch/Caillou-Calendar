import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system when nothing is persisted', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('system');
  });

  it('setTheme writes to localStorage and DOM', () => {
    const { result } = renderHook(() => useTheme());
    result.current[1]('dark');
    expect(localStorage.getItem('synoptic-theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('round-trips through storage', () => {
    localStorage.setItem('synoptic-theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('light');
  });

  it('rejects bogus storage values', () => {
    localStorage.setItem('synoptic-theme', 'hot-pink');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('system');
  });
});