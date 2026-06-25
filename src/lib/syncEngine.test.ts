// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./supabase', async () => {
  const actual = await vi.importActual<typeof import('./supabase')>('./supabase');
  return {
    ...actual,
    getSupabase: vi.fn(),
  };
});

import { syncInsert, syncUpdate, syncDelete } from './syncEngine';
import { getSupabase } from './supabase';
import { localDb, getDb } from './localDb';

beforeEach(async () => {
  // Wipe the queue between tests.
  const db = await getDb();
  const tx = db.transaction('outbound_sync_queue', 'readwrite');
  await tx.store.clear();
  await tx.done;
  (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe('syncInsert', () => {
  it('queues when supabase is null', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await syncInsert('events', { id: 'e1', title: 'x' });
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });

  it('inserts directly when supabase is online and succeeds', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ insert }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncInsert('events', { id: 'e1', title: 'x' });
    expect(insert).toHaveBeenCalled();
    expect(await localDb.getOutboundQueue()).toHaveLength(0);
  });

  it('queues on insert error', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: { message: 'fail' } }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ insert }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncInsert('events', { id: 'e1' });
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });

  it('queues when offline', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ insert: vi.fn() }),
    });
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await syncInsert('events', { id: 'e1' });
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });

  it('returns silently when no user id', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({ insert: vi.fn() }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncInsert('events', { id: 'e1' });
    expect(await localDb.getOutboundQueue()).toHaveLength(0);
  });
});

describe('syncUpdate', () => {
  it('queues when supabase is null', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await syncUpdate('events', 'e1', { title: 'x' });
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });

  it('updates directly when supabase is online and succeeds', async () => {
    const eqOwner = vi.fn(() => Promise.resolve({ error: null }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const update = vi.fn(() => ({ eq: eqId }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ update }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncUpdate('events', 'e1', { title: 'x' });
    expect(update).toHaveBeenCalled();
    expect(eqId).toHaveBeenCalledWith('id', 'e1');
    expect(eqOwner).toHaveBeenCalledWith('owner_id', 'u1');
    expect(await localDb.getOutboundQueue()).toHaveLength(0);
  });

  it('queues on update error', async () => {
    const update = vi.fn(() => ({
      eq: () => ({ eq: () => Promise.resolve({ error: { message: 'fail' } }) }),
    }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ update }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncUpdate('events', 'e1', { title: 'x' });
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });
});

describe('syncDelete', () => {
  it('queues single id when supabase is null', async () => {
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await syncDelete('events', 'e1');
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });

  it('deletes a single id directly when supabase is online', async () => {
    const eqOwner = vi.fn(() => Promise.resolve({ error: null }));
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    const del = vi.fn(() => ({ eq: eqId }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ delete: del }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncDelete('events', 'e1');
    expect(del).toHaveBeenCalled();
  });

  it('deletes a batch with .in(...) when ids is an array', async () => {
    const eqOwner = vi.fn(() => Promise.resolve({ error: null }));
    const inFn = vi.fn(() => ({ eq: eqOwner }));
    const del = vi.fn(() => ({ in: inFn }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ delete: del }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncDelete('events', ['e1', 'e2']);
    expect(inFn).toHaveBeenCalledWith('id', ['e1', 'e2']);
  });

  it('queues on delete error', async () => {
    const del = vi.fn(() => ({
      eq: () => ({ eq: () => Promise.resolve({ error: { message: 'fail' } }) }),
    }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: () => ({ delete: del }),
    });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await syncDelete('events', 'e1');
    expect(await localDb.getOutboundQueue()).toHaveLength(1);
  });
});
