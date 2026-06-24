import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CalendarEvent, FamilyMember, AppSettings } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.warn("Valid Supabase credentials not found. App will run in local-only mode.");
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// ---------------------------------------------------------------------------
// Row mappers: camelCase (app) <-> snake_case (DB)
// ---------------------------------------------------------------------------

/** Convert a CalendarEvent (camelCase) to a DB row (snake_case). */
export const eventToDbRow = (event: CalendarEvent, ownerId: string): Record<string, unknown> => ({
  id: event.id,
  owner_id: ownerId,
  title: event.title,
  date: event.date,
  end_date: event.endDate ?? null,
  start_time: event.startTime ?? null,
  end_time: event.endTime ?? null,
  member_ids: event.memberIds ?? [],
  thumbnail_url: event.thumbnailUrl ?? null,
  location: event.location ?? null,
  recurrence_type: event.recurrence?.type ?? 'none',
  recurrence_end_date: event.recurrence?.endDate ?? null,
  recurrence_count: event.recurrence?.count ?? null,
  exception_dates: event.exceptionDates ?? [],
  reminders: event.reminders ?? [],
  is_birthday: event.isBirthday ?? false,
  driver_id: event.driverId ?? null,
});

/** Convert a DB row (snake_case) to a CalendarEvent (camelCase). */
export const dbRowToEvent = (row: Record<string, any>): CalendarEvent => ({
  id: row.id,
  title: row.title,
  date: row.date,
  endDate: row.end_date ?? undefined,
  startTime: row.start_time ?? undefined,
  endTime: row.end_time ?? undefined,
  memberIds: row.member_ids ?? [],
  thumbnailUrl: row.thumbnail_url ?? undefined,
  location: row.location ?? undefined,
  recurrence: row.recurrence_type && row.recurrence_type !== 'none'
    ? { type: row.recurrence_type, endDate: row.recurrence_end_date ?? undefined, count: row.recurrence_count ?? undefined }
    : undefined,
  exceptionDates: row.exception_dates ?? [],
  reminders: row.reminders ?? [],
  isBirthday: row.is_birthday ?? false,
  driverId: row.driver_id ?? undefined,
});

/** Convert a FamilyMember (camelCase) to a DB row. */
export const memberToDbRow = (member: FamilyMember, ownerId: string): Record<string, unknown> => ({
  id: member.id,
  owner_id: ownerId,
  name: member.name,
  color: member.color,
  bg_class: member.bgClass,
  icon: member.icon,
  role: 'member',
});

/** Convert a DB family_member row to a FamilyMember. */
export const dbRowToMember = (row: Record<string, any>): FamilyMember => ({
  id: row.id,
  name: row.name,
  color: row.color ?? row.bg_class ?? 'bg-mem-1',
  bgClass: row.bg_class ?? row.color ?? 'bg-mem-1',
  icon: row.icon ?? 'face',
});

/** Convert an AppSettings to a DB row. */
export const settingsToDbRow = (settings: AppSettings, ownerId: string): Record<string, unknown> => ({
  owner_id: ownerId,
  start_of_week: settings.startOfWeek,
  time_format: settings.timeFormat,
});

/** Convert a DB settings row to AppSettings. */
export const dbRowToSettings = (row: Record<string, any>): Partial<AppSettings> => ({
  startOfWeek: row.start_of_week ?? 1,
  timeFormat: row.time_format ?? '24h',
});

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export const signInWithGoogle = () => {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client not initialized");
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.events'
    }
  });
};

export const signInWithEmail = (email: string, password: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client not initialized");
  return sb.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = (email: string, password: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client not initialized");
  return sb.auth.signUp({ email, password });
};

export const signOut = () => {
  const sb = getSupabase();
  if (!sb) return Promise.resolve();
  return sb.auth.signOut();
};
