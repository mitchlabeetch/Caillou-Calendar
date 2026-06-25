import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedSelectedMembers } from './usePersistedSelectedMembers';

describe('usePersistedSelectedMembers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when nothing is persisted', () => {
    const { result } = renderHook(() => usePersistedSelectedMembers());
    expect(result.current.selectedMembers).toEqual([]);
  });

  it('persists toggles across reloads', () => {
    const { result, unmount } = renderHook(() => usePersistedSelectedMembers());
    act(() => result.current.toggleMember('m1'));
    act(() => result.current.toggleMember('m2'));
    expect(result.current.selectedMembers).toEqual(['m1', 'm2']);
    unmount();

    const { result: second } = renderHook(() => usePersistedSelectedMembers());
    expect(second.current.selectedMembers).toEqual(['m1', 'm2']);
  });

  it('toggleMember is idempotent', () => {
    const { result } = renderHook(() => usePersistedSelectedMembers());
    act(() => result.current.toggleMember('m1'));
    act(() => result.current.toggleMember('m1'));
    expect(result.current.selectedMembers).toEqual([]);
  });

  it('falls back to synoptic-selected-members-init on first run', () => {
    localStorage.setItem('synoptic-selected-members-init', JSON.stringify(['seed']));
    const { result } = renderHook(() => usePersistedSelectedMembers());
    expect(result.current.selectedMembers).toEqual(['seed']);
  });
});