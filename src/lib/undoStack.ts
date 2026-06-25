/**
 * Undo / redo stack for the last 10 mutations.
 *
 * Pure functions over a small mutable store. Components push a
 * descriptor for the inverse op when they mutate state, then `undo()`
 * / `redo()` walk the stacks. Snapshot payloads are typed per op so
 * the consumer knows what to restore.
 */

export type UndoableOp =
  | { type: 'add'; eventId: string; snapshot: unknown }
  | { type: 'update'; eventId: string; before: unknown; after: unknown }
  | { type: 'delete'; eventId: string; snapshot: unknown }
  | { type: 'swap'; aId: string; bId: string; aBefore: unknown; bBefore: unknown }
  | { type: 'multi-delete'; eventIds: string[]; snapshots: unknown[] };

interface UndoStack {
  past: UndoableOp[];
  future: UndoableOp[];
}

const MAX = 10;
let stack: UndoStack = { past: [], future: [] };
const listeners = new Set<() => void>();

export function pushOp(op: UndoableOp): void {
  stack.past.push(op);
  if (stack.past.length > MAX) stack.past.shift();
  // Any new mutation invalidates the redo stack.
  stack.future = [];
  notify();
}

export function popUndo(): UndoableOp | null {
  const op = stack.past.pop() ?? null;
  if (op) {
    stack.future.push(op);
    notify();
  }
  return op;
}

export function popRedo(): UndoableOp | null {
  const op = stack.future.pop() ?? null;
  if (op) {
    stack.past.push(op);
    notify();
  }
  return op;
}

export function clear(): void {
  stack = { past: [], future: [] };
  notify();
}

export function canUndo(): boolean {
  return stack.past.length > 0;
}

export function canRedo(): boolean {
  return stack.future.length > 0;
}

export function peekUndo(): UndoableOp | null {
  return stack.past[stack.past.length - 1] ?? null;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) fn();
}