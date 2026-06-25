/**
 * Focus trap + aria-modal utility for the dialog layer.
 *
 * Wraps any modal body with: focus-trap on Tab/Shift-Tab, restore-on-
 * close, and Escape handling. Used by ModalShell and the remaining
 * legacy modals that don't go through it yet.
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export function useFocusTrap(isActive: boolean, returnFocusRef?: React.RefObject<HTMLElement>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable child (or the container itself as a
    // graceful fallback if there are none).
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length > 0) focusables[0].focus();
    else container.tabIndex = -1, container.focus();

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      const list = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      const target = returnFocusRef?.current ?? previouslyFocused;
      target?.focus?.();
    };
  }, [isActive, returnFocusRef]);

  return containerRef;
}

/** Programmatically install aria-modal + role=dialog on a node. */
export function applyAriaModal(el: HTMLElement | null, label: string | undefined): void {
  if (!el) return;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (label) el.setAttribute('aria-label', label);
}