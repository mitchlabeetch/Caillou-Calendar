import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CalendarEvent, FamilyMember, AppSettings } from '../types';
import { isMutationAuthorizationError } from './mutationAuthorization';

interface CaillouDB extends DBSchema {
  events: {
    key: string;
    value: CalendarEvent;
  };
  family_members: {
    key: string;
    value: FamilyMember;
  };
  places: {
    key: string;
    value: { id: string; name: string; icon?: string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  outbound_sync_queue: {
    key: number;
    value: {
      id: number;
      table: 'events' | 'family_members' | 'places' | 'settings';
      operation: 'insert' | 'update' | 'delete';
      payload: any;
      timestamp: number;
    };
    indexes: { by_timestamp: number };
  };
}

const BASE_DB_NAME = 'caillou-calendar';
const DB_VERSION = 1;
const STORE_NAMES = ['events', 'family_members', 'places', 'settings', 'outbound_sync_queue'] as const;
const DEFAULT_STORAGE_SCOPE = 'signed-out';

let activeStorageScope = DEFAULT_STORAGE_SCOPE;
const dbPromises = new Map<string, Promise<IDBPDatabase<CaillouDB>>>();

function normalizeStorageScope(scope?: string | null): string {
  const normalized = scope?.trim();
  return normalized ? normalized : DEFAULT_STORAGE_SCOPE;
}

function getScopedDbName(scope: string): string {
  return `${BASE_DB_NAME}::${encodeURIComponent(scope)}`;
}

export const getActiveStorageScope = () => activeStorageScope;

export const setActiveStorageScope = async (scope: string) => {
  activeStorageScope = normalizeStorageScope(scope);
  await getDb(activeStorageScope);
};

export const getDb = (scope = activeStorageScope) => {
  const normalizedScope = normalizeStorageScope(scope);
  const dbName = getScopedDbName(normalizedScope);
  const existing = dbPromises.get(dbName);
  if (existing) return existing;

  const dbPromise = openDB<CaillouDB>(dbName, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('family_members')) db.createObjectStore('family_members', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('places')) db.createObjectStore('places', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('outbound_sync_queue')) {
        const queueStore = db.createObjectStore('outbound_sync_queue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('by_timestamp', 'timestamp');
      }
    },
  });
  dbPromises.set(dbName, dbPromise);
  return dbPromise;
};

export const clearStorageScope = async (scope = activeStorageScope) => {
  const db = await getDb(scope);
  for (const store of STORE_NAMES) {
    const tx = db.transaction(store, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
};

export const localDb = {
  async getEvents(): Promise<CalendarEvent[]> {
    const db = await getDb();
    return db.getAll('events');
  },
  async setEvents(events: CalendarEvent[]) {
    const db = await getDb();
    const tx = db.transaction('events', 'readwrite');
    await tx.store.clear();
    for (const evt of events) await tx.store.put(evt);
    await tx.done;
  },
  async addEvent(event: CalendarEvent) {
    const db = await getDb();
    await db.put('events', event);
  },
  async updateEvent(id: string, updates: Partial<CalendarEvent>) {
    const db = await getDb();
    const existing = await db.get('events', id);
    if (!existing) return;
    await db.put('events', { ...existing, ...updates });
  },
  async deleteEvent(id: string) {
    const db = await getDb();
    await db.delete('events', id);
  },
  async deleteEventsBatch(ids: string[]) {
    const db = await getDb();
    const tx = db.transaction('events', 'readwrite');
    for (const id of ids) await tx.store.delete(id);
    await tx.done;
  },

  async getFamilyMembers(): Promise<FamilyMember[]> {
    const db = await getDb();
    return db.getAll('family_members');
  },
  async setFamilyMembers(members: FamilyMember[]) {
    const db = await getDb();
    const tx = db.transaction('family_members', 'readwrite');
    await tx.store.clear();
    for (const m of members) await tx.store.put(m);
    await tx.done;
  },

  async getPlaces(): Promise<{ id: string; name: string; icon?: string }[]> {
    const db = await getDb();
    return db.getAll('places');
  },
  async setPlaces(places: { id: string; name: string; icon?: string }[]) {
    const db = await getDb();
    const tx = db.transaction('places', 'readwrite');
    await tx.store.clear();
    for (const p of places) await tx.store.put(p);
    await tx.done;
  },

  async getSettings(): Promise<AppSettings | undefined> {
    const db = await getDb();
    const all = await db.getAll('settings');
    return all[0];
  },
  async setSettings(settings: AppSettings) {
    const db = await getDb();
    await db.put('settings', { ...settings, id: 'app-settings' } as any);
  },

  async enqueueSync(table: CaillouDB['outbound_sync_queue']['value']['table'], operation: 'insert' | 'update' | 'delete', payload: any) {
    const db = await getDb();
    await db.add('outbound_sync_queue', {
      table,
      operation,
      payload,
      timestamp: Date.now(),
    } as any);
  },
  async getOutboundQueue() {
    const db = await getDb();
    return db.getAllFromIndex('outbound_sync_queue', 'by_timestamp');
  },
  async clearOutboundQueue(ids: number[]) {
    const db = await getDb();
    const tx = db.transaction('outbound_sync_queue', 'readwrite');
    for (const id of ids) await tx.store.delete(id);
    await tx.done;
  },
};

export const flushOutboundSyncQueue = async () => {
  const supabaseModule = await import('./supabase');
  const supabase = supabaseModule.getSupabase();
  if (!supabase) return;

  const queue = await localDb.getOutboundQueue();
  if (queue.length === 0) return;

  const succeeded: number[] = [];

  for (const item of queue) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      switch (item.operation) {
        case 'insert': {
          const { error } = await supabase.from(item.table).insert([{ ...item.payload, owner_id: userId }]);
          if (error) throw error;
          break;
        }
        case 'update': {
          const { id, ...rest } = item.payload;
          const result = item.table === 'settings'
            ? await supabase.from(item.table).upsert({ ...rest, owner_id: userId })
            : await supabase.from(item.table).update({ ...rest, owner_id: userId }).eq('id', id);
          if (result.error) throw result.error;
          break;
        }
        case 'delete': {
          const id = item.payload.id;
          if (Array.isArray(id)) {
            const { error } = await supabase.from(item.table).delete().in('id', id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from(item.table).delete().eq('id', id);
            if (error) throw error;
          }
          break;
        }
      }
      succeeded.push(item.id);
    } catch (e) {
      if (isMutationAuthorizationError(e)) {
        console.warn('Dropping unauthorized sync queue item:', item, e);
        succeeded.push(item.id);
        continue;
      }
      console.warn('Sync queue item failed, will retry:', item, e);
    }
  }

  if (succeeded.length > 0) {
    await localDb.clearOutboundQueue(succeeded);
  }
};
