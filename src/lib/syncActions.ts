/**
 * Dynamic wrapper around `syncEngine` so the rest of the app can import
 * these action names without forcing a static dependency on the
 * `syncEngine` module (which transitively imports `supabase`).
 *
 * Vite will split the `syncEngine` module into its own chunk and load
 * it only when an action is actually invoked.
 */
import type { SyncTable } from './syncEngine';

let cached: typeof import('./syncEngine') | null = null;

async function loadSync() {
  if (cached) return cached;
  cached = await import('./syncEngine');
  return cached;
}

export async function syncInsert(table: SyncTable, payload: unknown) {
  const m = await loadSync();
  return m.syncInsert(table, payload);
}

export async function syncUpdate(table: SyncTable, id: string, updates: unknown) {
  const m = await loadSync();
  return m.syncUpdate(table, id, updates as any);
}

export async function syncDelete(table: SyncTable, id: string | string[]) {
  const m = await loadSync();
  return m.syncDelete(table, id);
}

export type { SyncTable };
