import { useEffect } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameWeek, isSameDay } from 'date-fns';

/**
 * Centralised keyboard shortcut handler. Reads its callbacks via a
 * `controls` object so the hook stays cheap to wire up.
 *
 * Conventions match the wiki ("Common pitfalls" §11):
 *   ←/→            navigate days
 *   Shift + ←/→    navigate months/weeks
 *   M / ↑          month view
 *   W / ↓          week view
 *   T              today
 *   1–9            toggle family member filter
 */
export interface KeyboardControls {
  view: 'month' | 'week';
  setView: (v: 'month' | 'week') => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  toggleMember?: (id: string) => void;
  familyMembers: { id: string }[];
}

function isInputElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(controls: KeyboardControls) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire inside inputs/textareas/contenteditable, and not
      // while a meta key is held (so browser shortcuts keep working).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInputElement(document.activeElement)) return;
      // Also skip when a modal is open.
      if (document.querySelector('[role="dialog"]')) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey) {
            controls.setCurrentDate(subMonths(controls.currentDate, 1));
          } else {
            const d = new Date(controls.currentDate);
            d.setDate(d.getDate() - 1);
            controls.setCurrentDate(d);
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            controls.setCurrentDate(addMonths(controls.currentDate, 1));
          } else {
            const d = new Date(controls.currentDate);
            d.setDate(d.getDate() + 1);
            controls.setCurrentDate(d);
          }
          e.preventDefault();
          break;
        case 'ArrowUp':
          controls.setView('month');
          e.preventDefault();
          break;
        case 'ArrowDown':
          controls.setView('week');
          e.preventDefault();
          break;
        case 'm':
        case 'M':
          controls.setView('month');
          break;
        case 'w':
        case 'W':
          controls.setView('week');
          break;
        case 't':
        case 'T':
          controls.setCurrentDate(new Date());
          break;
        default: {
          const n = Number(e.key);
          if (Number.isInteger(n) && n >= 1 && n <= 9 && controls.toggleMember) {
            const idx = n - 1;
            const member = controls.familyMembers[idx];
            if (member) {
              controls.toggleMember(member.id);
              e.preventDefault();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [controls]);
}

// Re-export commonly-used date-fns helpers so callers don't double-import.
export { addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameWeek, isSameDay };