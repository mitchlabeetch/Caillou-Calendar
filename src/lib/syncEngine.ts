import { localDb, flushOutboundSyncQueue } from './localDb';
import { getSupabase } from './supabase';

export type SyncTable = 'events' | 'family_members' | 'places' | 'settings';

export const syncInsert = async (table: SyncTable, payload: any) => {
  const sb = getSupabase();
  if (!sb || !navigator.onLine) {
    await localDb.enqueueSync(table, 'insert', payload);
    return;
  }
  try {
    const { data: userData } = await sb.auth.getUser();
    const userId = userData?.user?.id;
    await sb.from(table).insert([{ ...payload, ownerId: userId }]);
  } catch (e) {
    console.warn('Direct sync insert failed, queued for retry:', e);
    await localDb.enqueueSync(table, 'insert', payload);
  }
};

export const syncUpdate = async (table: SyncTable, id: string, updates: any) => {
  const sb = getSupabase();
  if (!sb || !navigator.onLine) {
    await localDb.enqueueSync(table, 'update', { id, ...updates });
    return;
  }
  try {
    const { data: userData } = await sb.auth.getUser();
    const userId = userData?.user?.id;
    await sb.from(table).update({ ...updates, ownerId: userId }).eq('id', id);
  } catch (e) {
    console.warn('Direct sync update failed, queued for retry:', e);
    await localDb.enqueueSync(table, 'update', { id, ...updates });
  }
};

export const syncDelete = async (table: SyncTable, id: string | string[]) => {
  const sb = getSupabase();
  if (!sb || !navigator.onLine) {
    await localDb.enqueueSync(table, 'delete', { id });
    return;
  }
  try {
    if (Array.isArray(id)) {
      await sb.from(table).delete().in('id', id);
    } else {
      await sb.from(table).delete().eq('id', id);
    }
  } catch (e) {
    console.warn('Direct sync delete failed, queued for retry:', e);
    await localDb.enqueueSync(table, 'delete', { id });
  }
};

export { flushOutboundSyncQueue };
