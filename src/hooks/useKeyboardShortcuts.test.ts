// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const baseControls = () => {
  const setCurrentDate = vi.fn();
  const setView = vi.fn();
  const toggleMember = vi.fn();
  return {
    controls: {
      view: 'month' as const,
      setView,
      currentDate: new Date('2026-06-25'),
      setCurrentDate,
      toggleMember,
      familyMembers: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    },
    setView,
    setCurrentDate,
    toggleMember,
  };
};

function dispatchKey(opts: { key: string; shift?: boolean; meta?: boolean; ctrl?: boolean; alt?: boolean }) {
  const event = new KeyboardEvent('keydown', {
    key: opts.key,
    shiftKey: !!opts.shift,
    metaKey: !!opts.meta,
    ctrlKey: !!opts.ctrl,
    altKey: !!opts.alt,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  it('moves to previous/next day with arrow keys', () => {
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    expect(setCurrentDate).toHaveBeenCalledTimes(1);
    dispatchKey({ key: 'ArrowRight' });
    expect(setCurrentDate).toHaveBeenCalledTimes(2);
  });

  it('Shift + arrow moves by month', () => {
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft', shift: true });
    dispatchKey({ key: 'ArrowRight', shift: true });
    expect(setCurrentDate).toHaveBeenCalledTimes(2);
  });

  it('M/W/ArrowUp/ArrowDown switch view', () => {
    const { controls, setView } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'm' });
    dispatchKey({ key: 'W' });
    dispatchKey({ key: 'ArrowUp' });
    dispatchKey({ key: 'ArrowDown' });
    expect(setView.mock.calls.map(c => c[0])).toEqual(['month', 'week', 'month', 'week']);
  });

  it('T jumps to today', () => {
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 't' });
    expect(setCurrentDate).toHaveBeenCalled();
  });

  it('digit keys toggle family member', () => {
    const { controls, toggleMember } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: '1' });
    dispatchKey({ key: '2' });
    expect(toggleMember.mock.calls.map(c => c[0])).toEqual(['m1', 'm2']);
  });

  it('ignores shortcuts while a modal is open', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    const { controls, setCurrentDate, setView } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    dispatchKey({ key: 'm' });
    expect(setCurrentDate).not.toHaveBeenCalled();
    expect(setView).not.toHaveBeenCalled();
    document.body.removeChild(dialog);
  });

  it('ignores shortcuts when a meta key is held', () => {
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft', meta: true });
    dispatchKey({ key: 'ArrowLeft', ctrl: true });
    expect(setCurrentDate).not.toHaveBeenCalled();
  });

  it('ignores shortcuts while typing in an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    expect(setCurrentDate).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores shortcuts while typing in a textarea / contenteditable', () => {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    expect(setCurrentDate).not.toHaveBeenCalled();
    document.body.removeChild(ta);
  });

  it('ignores shortcuts while focused in a select', () => {
    const sel = document.createElement('select');
    document.body.appendChild(sel);
    sel.focus();
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    expect(setCurrentDate).not.toHaveBeenCalled();
    document.body.removeChild(sel);
  });

  it('ignores shortcuts while in a contenteditable element', () => {
    const ce = document.createElement('div');
    // The hook reads `isContentEditable`, which jsdom doesn't reflect
    // for the `contentEditable` property — set both the attribute and
    // the descriptor so the check sees it.
    ce.setAttribute('contenteditable', 'true');
    Object.defineProperty(ce, 'isContentEditable', { value: true, configurable: true });
    document.body.appendChild(ce);
    ce.focus();
    const { controls, setCurrentDate } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: 'ArrowLeft' });
    expect(setCurrentDate).not.toHaveBeenCalled();
    document.body.removeChild(ce);
  });

  it('digit > 9 or digit 0 does nothing', () => {
    const { controls, toggleMember } = baseControls();
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: '0' });
    dispatchKey({ key: '9' });
    expect(toggleMember).toHaveBeenCalledTimes(0); // '0' is invalid, '9' = idx 8 → out of range
  });

  it('digit within range but with empty member slot does nothing', () => {
    const { controls, toggleMember } = baseControls();
    controls.familyMembers = [{ id: 'a' }];
    renderHook(() => useKeyboardShortcuts(controls));
    dispatchKey({ key: '5' });
    expect(toggleMember).not.toHaveBeenCalled();
  });
});
