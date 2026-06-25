import { describe, it, expect, beforeEach } from 'vitest';
import { pushOp, popUndo, popRedo, canUndo, canRedo, clear, peekUndo, subscribe } from './undoStack';

describe('undoStack', () => {
  beforeEach(() => clear());

  it('starts empty', () => {
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
    expect(peekUndo()).toBeNull();
  });

  it('pushes an op and exposes it', () => {
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    expect(canUndo()).toBe(true);
    expect(peekUndo()?.eventId).toBe('e1');
  });

  it('pops an op and moves it to redo', () => {
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    const op = popUndo();
    expect(op?.eventId).toBe('e1');
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);
  });

  it('redo restores the last op', () => {
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    popUndo();
    const op = popRedo();
    expect(op?.eventId).toBe('e1');
    expect(canRedo()).toBe(false);
  });

  it('a new mutation clears the redo stack', () => {
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    popUndo();
    expect(canRedo()).toBe(true);
    pushOp({ type: 'add', eventId: 'e2', snapshot: {} });
    expect(canRedo()).toBe(false);
  });

  it('caps at 10 entries (FIFO)', () => {
    for (let i = 0; i < 15; i++) pushOp({ type: 'add', eventId: `e${i}`, snapshot: {} });
    const ops: string[] = [];
    while (canUndo()) {
      const op = popUndo();
      if (op && op.type === 'add') ops.push(op.eventId);
    }
    expect(ops).toEqual(['e14', 'e13', 'e12', 'e11', 'e10', 'e9', 'e8', 'e7', 'e6', 'e5']);
  });

  it('notifies subscribers on change', () => {
    let count = 0;
    const unsub = subscribe(() => { count++; });
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    pushOp({ type: 'add', eventId: 'e2', snapshot: {} });
    popUndo();
    expect(count).toBeGreaterThanOrEqual(3);
    unsub();
    pushOp({ type: 'add', eventId: 'e3', snapshot: {} });
    // count does not increase after unsub
    const lastCount = count;
    pushOp({ type: 'add', eventId: 'e4', snapshot: {} });
    expect(count).toBe(lastCount);
  });

  it('clear empties both stacks', () => {
    pushOp({ type: 'add', eventId: 'e1', snapshot: {} });
    popUndo();
    clear();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });
});