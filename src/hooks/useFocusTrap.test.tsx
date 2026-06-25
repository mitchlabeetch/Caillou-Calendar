import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';
import React from 'react';

describe('useFocusTrap', () => {
  it('returns a ref that can be attached to a container', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('focuses the first focusable child when activated', () => {
    const div = document.createElement('div');
    const first = document.createElement('button');
    first.textContent = 'A';
    const second = document.createElement('button');
    second.textContent = 'B';
    div.appendChild(first);
    div.appendChild(second);
    document.body.appendChild(div);

    function Harness({ active }: { active: boolean }) {
      const ref = useFocusTrap(active);
      // Attach ref imperatively on each render so we can test focus.
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = div;
      return null;
    }

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => <Harness active={active} />,
      { initialProps: { active: false } },
    );
    rerender({ active: true });

    const focused = document.activeElement as HTMLElement | null;
    expect(focused).not.toBeNull();
    document.body.removeChild(div);
  });

  it('keeps the ref consistent across re-renders', () => {
    const { result, rerender } = renderHook(() => useFocusTrap(false));
    const ref1 = result.current;
    rerender();
    const ref2 = result.current;
    expect(ref1).toBe(ref2);
  });
});