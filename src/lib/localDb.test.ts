// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./supabase', () => ({
  getSupabase: vi.fn(),
}));

import {
  localDb,
  flushOutboundSyncQueue,
  getDb,
  getActiveStorageScope,
  setActiveStorageScope,
} from './localDb';
import { getSupabase } from './supabase';
import { CalendarEvent, FamilyMember, AppSettings } from '../types';

const baseEvent: CalendarEvent = {
  id: 'e1',
  title: 'Test',
  date: '2026-06-25',
  startTime: '10:00',
  memberIds: ['m1'],
  recurrence: { type: 'none' },
  reminders: [],
};

const baseMember: FamilyMember = {
  id: 'm1',
  name: 'Alice',
  color: '#B39DDB',
  bgClass: 'bg-mem-1',
  icon: 'User',
};

beforeEach(async () => {
  await setActiveStorageScope('signed-out');
  // Reset by clearing each store. The module caches the dbPromise
  // but `clearOutboundQueue` etc. just no-op when empty.
  const db = await getDb();
  for (const store of ['events', 'family_members', 'places', 'settings', 'outbound_sync_queue']) {
    const tx = db.transaction(store as any, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
});

describe('localDb — storage scopes', () => {
  it('isolates cached records and outbound queue items per storage scope', async () => {
    await setActiveStorageScope('user:alpha');
    expect(getActiveStorageScope()).toBe('user:alpha');
    await localDb.setEvents([baseEvent]);
    await localDb.enqueueSync('events', 'insert', { id: 'alpha-queued' });

    await setActiveStorageScope('user:bravo');
    expect(await localDb.getEvents()).toEqual([]);
    expect(await localDb.getOutboundQueue()).toEqual([]);

    await localDb.setEvents([{ ...baseEvent, id: 'bravo-event', title: 'Bravo' }]);

    await setActiveStorageScope('user:alpha');
    expect((await localDb.getEvents()).map((event) => event.id)).toEqual(['e1']);
    expect((await localDb.getOutboundQueue()).map((item) => item.payload.id)).toEqual(['alpha-queued']);

    await setActiveStorageScope('user:bravo');
    expect((await localDb.getEvents()).map((event) => event.id)).toEqual(['bravo-event']);
    expect(await localDb.getOutboundQueue()).toEqual([]);
  });
});

describe('localDb — events', () => {
  it('round-trips events via setEvents / getEvents', async () => {
    await localDb.setEvents([baseEvent]);
    const got = await localDb.getEvents();
    expect(got).toEqual([baseEvent]);
  });

  it('addEvent / updateEvent / deleteEvent', async () => {
    await localDb.addEvent(baseEvent);
    expect(await localDb.getEvents()).toEqual([baseEvent]);

    await localDb.updateEvent('e1', { title: 'Updated' });
    expect((await localDb.getEvents())[0].title).toBe('Updated');

    await localDb.deleteEvent('e1');
    expect(await localDb.getEvents()).toEqual([]);
  });

  it('updateEvent on missing id is a no-op', async () => {
    await localDb.updateEvent('nope', { title: 'x' });
    expect(await localDb.getEvents()).toEqual([]);
  });

  it('deleteEventsBatch removes many', async () => {
    await localDb.setEvents([
      baseEvent,
      { ...baseEvent, id: 'e2' },
      { ...baseEvent, id: 'e3' },
    ]);
    await localDb.deleteEventsBatch(['e1', 'e3']);
    const got = await localDb.getEvents();
    expect(got.map(e => e.id)).toEqual(['e2']);
  });

  it('setEvents replaces the store', async () => {
    await localDb.setEvents([baseEvent, { ...baseEvent, id: 'e2' }]);
    await localDb.setEvents([{ ...baseEvent, id: 'e3' }]);
    expect((await localDb.getEvents()).map(e => e.id)).toEqual(['e3']);
  });
});

describe('localDb — family & places & settings', () => {
  it('round-trips family members', async () => {
    await localDb.setFamilyMembers([baseMember]);
    expect(await localDb.getFamilyMembers()).toEqual([baseMember]);
  });

  it('round-trips places', async () => {
    await localDb.setPlaces([{ id: 'p1', name: 'Home', icon: 'Home' }]);
    expect(await localDb.getPlaces()).toEqual([{ id: 'p1', name: 'Home', icon: 'Home' }]);
  });

  it('round-trips settings', async () => {
    const settings: AppSettings = { startOfWeek: 0, timeFormat: '12h' };
    await localDb.setSettings(settings);
    expect(await localDb.getSettings()).toEqual({ ...settings, id: 'app-settings' });
  });

  it('getSettings returns undefined when empty', async () => {
    expect(await localDb.getSettings()).toBeUndefined();
  });
});

describe('localDb — outbound sync queue', () => {
  it('enqueues and reads queue ordered by timestamp', async () => {
    await localDb.enqueueSync('events', 'insert', { id: 'a' });
    await new Promise(r => setTimeout(r, 5));
    await localDb.enqueueSync('events', 'update', { id: 'a', title: 'b' });
    const q = await localDb.getOutboundQueue();
    expect(q).toHaveLength(2);
    expect(q[0].table).toBe('events');
    expect(q[0].operation).toBe('insert');
    expect(q[1].operation).toBe('update');
  });

  it('clears queue by ids', async () => {
    await localDb.enqueueSync('events', 'insert', { id: 'a' });
    const [item] = await localDb.getOutboundQueue();
    await localDb.clearOutboundQueue([item.id]);
    expect(await localDb.getOutboundQueue()).toEqual([]);
  });
});

describe('flushOutboundSyncQueue', () => {
  it('returns early when supabase is null', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(flushOutboundSyncQueue()).resolves.toBeUndefined();
  });

  it('flushes an insert successfully and clears the queue item', async () => {
    const from = vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from,
    });
    await localDb.enqueueSync('events', 'insert', { id: 'a' });
    await flushOutboundSyncQueue();
    expect(from).toHaveBeenCalledWith('events');
    expect(await localDb.getOutboundQueue()).toEqual([]);
  });

  it('flushes an update with owner_id', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }));
    const from = vi.fn(() => ({ update }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from,
    });
    await localDb.enqueueSync('events', 'update', { id: 'a', title: 'x' });
    await flushOutboundSyncQueue();
    expect(update).toHaveBeenCalledWith({ title: 'x', owner_id: 'u1' });
  });

  it('flushes a single delete', async () => {
    const eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const del = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: del }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from,
    });
    await localDb.enqueueSync('events', 'delete', { id: 'a' });
    await flushOutboundSyncQueue();
    expect(del).toHaveBeenCalled();
  });

  it('flushes a batch delete with .in(...)', async () => {
    const inFn = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const del = vi.fn(() => ({ in: inFn }));
    const from = vi.fn(() => ({ delete: del }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from,
    });
    await localDb.enqueueSync('events', 'delete', { id: ['a', 'b'] });
    await flushOutboundSyncQueue();
    expect(inFn).toHaveBeenCalledWith('id', ['a', 'b']);
  });

  it('skips an item that throws and continues', async () => {
    const from = vi.fn(() => ({
      insert: vi.fn(() => Promise.reject(new Error('boom'))),
    }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from,
    });
    await localDb.enqueueSync('events', 'insert', { id: 'a' });
    await expect(flushOutboundSyncQueue()).resolves.toBeUndefined();
    // Item still in queue because it failed.
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });
});
