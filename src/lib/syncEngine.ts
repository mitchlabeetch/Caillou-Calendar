import { localDb, flushOutboundSyncQueue } from './localDb';
import { getSupabase, eventToDbRow, memberToDbRow, settingsToDbRow } from './supabase';
import type { CalendarEvent, FamilyMember, AppSettings } from '../types';
import {
  asMutationAuthorizationError,
  isMutationAuthorizationError,
} from './mutationAuthorization';

export type SyncTable = 'events' | 'family_members' | 'places' | 'settings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * Convert a payload to its DB row representation.
 * For events / family_members / settings we use the typed mappers;
 * for places and raw partial-update objects we do a simple camel→snake pass.
 */
function toDbRow(table: SyncTable, payload: any, ownerId: string): Record<string, unknown> {
  if (table === 'events') {
    // Could be a full CalendarEvent or a partial update dict
    if ('memberIds' in payload || 'isBirthday' in payload || 'recurrence' in payload) {
      return eventToDbRow(payload as CalendarEvent, ownerId);
    }
    // Partial update — map only the fields that are present
    return mapPartialEventToSnake(payload, ownerId);
  }
  if (table === 'family_members') {
    if ('bgClass' in payload) {
      return memberToDbRow(payload as FamilyMember, ownerId);
    }
    return mapPartialMemberToSnake(payload, ownerId);
  }
  if (table === 'settings') {
    return settingsToDbRow(payload as AppSettings, ownerId);
  }
  // places — already uses simple field names (id, name, icon)
  return { ...payload, owner_id: ownerId };
}

/** Map a partial CalendarEvent update to snake_case DB columns. */
function mapPartialEventToSnake(partial: Record<string, any>, ownerId: string): Record<string, unknown> {
  const map: Record<string, string> = {
    endDate: 'end_date',
    startTime: 'start_time',
    endTime: 'end_time',
    memberIds: 'member_ids',
    thumbnailUrl: 'thumbnail_url',
    isBirthday: 'is_birthday',
    driverId: 'driver_id',
    exceptionDates: 'exception_dates',
  };
  const result: Record<string, unknown> = { owner_id: ownerId };
  for (const [key, value] of Object.entries(partial)) {
    result[map[key] ?? key] = value;
  }
  // Flatten recurrence object if present
  if (result['recurrence']) {
    const rec = result['recurrence'] as any;
    result['recurrence_type'] = rec.type ?? 'none';
    result['recurrence_end_date'] = rec.endDate ?? null;
    result['recurrence_count'] = rec.count ?? null;
    delete result['recurrence'];
  }
  return result;
}

function mapPartialMemberToSnake(partial: Record<string, any>, ownerId: string): Record<string, unknown> {
  const map: Record<string, string> = { bgClass: 'bg_class' };
  const result: Record<string, unknown> = { owner_id: ownerId };
  for (const [key, value] of Object.entries(partial)) {
    result[map[key] ?? key] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public sync helpers
// ---------------------------------------------------------------------------

export const syncInsert = async (table: SyncTable, payload: any) => {
  const sb = getSupabase();
  if (!sb || !navigator.onLine) {
    await localDb.enqueueSync(table, 'insert', payload);
    return;
  }
  try {
    const userId = await getUserId();
    if (!userId) return;
    const row = toDbRow(table, payload, userId);
    const { error } = await sb.from(table).insert([row]);
    if (error) throw error;
  } catch (e) {
    if (isMutationAuthorizationError(e)) {
      throw asMutationAuthorizationError(e);
    }
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
    const userId = await getUserId();
    if (!userId) return;
    const row = toDbRow(table, updates, userId);
    // Remove owner_id and id from the update payload (they're used in the filter).
    const { owner_id: _o, id: _i, ...updateRow } = row as any;
    const query = table === 'settings'
      ? sb.from(table).upsert(row)
      : sb.from(table).update(updateRow).eq('id', id).eq('owner_id', userId);
    const { error } = await query;
    if (error) throw error;
  } catch (e) {
    if (isMutationAuthorizationError(e)) {
      throw asMutationAuthorizationError(e);
    }
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
    const userId = await getUserId();
    if (!userId) return;
    if (Array.isArray(id)) {
      const { error } = await sb.from(table).delete().in('id', id).eq('owner_id', userId);
      if (error) throw error;
    } else {
      const { error } = await sb.from(table).delete().eq('id', id).eq('owner_id', userId);
      if (error) throw error;
    }
  } catch (e) {
    if (isMutationAuthorizationError(e)) {
      throw asMutationAuthorizationError(e);
    }
    console.warn('Direct sync delete failed, queued for retry:', e);
    await localDb.enqueueSync(table, 'delete', { id });
  }
};

export { flushOutboundSyncQueue };
