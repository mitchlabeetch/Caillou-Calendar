import { getSupabase } from './supabase';
import { CalendarEvent } from '../types';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Returns the provider_token from the current Supabase session, throwing
 * if the user has not signed in via Google OAuth.
 */
async function getGoogleAccessToken(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) throw new Error('No Google access token available in Supabase session');
  return token;
}

/**
 * Build the Google Calendar API `start` / `end` payload from a Caillou
 * event.
 */
function toGoogleStartEnd(event: CalendarEvent) {
  if (event.startTime && event.endTime) {
    return {
      start: { dateTime: `${event.date}T${event.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: `${event.date}T${event.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    };
  }
  const start = { date: event.date };
  const endDate = new Date(event.date);
  endDate.setDate(endDate.getDate() + 1);
  const end = { date: endDate.toISOString().split('T')[0] };
  return { start, end };
}

/**
 * Push a list of local events to Google Calendar (one-way).
 *
 * Returns a list of `{ localId, googleId }` pairs so the caller can
 * persist `googleEventId` on the local copy.
 */
export const pushEventsToGoogleCalendar = async (events: CalendarEvent[]): Promise<{ localId: string; googleId: string }[]> => {
  const token = await getGoogleAccessToken();
  const results: { localId: string; googleId: string }[] = [];

  for (const event of events) {
    const { start, end } = toGoogleStartEnd(event);
    const body: Record<string, unknown> = {
      summary: event.title,
      start,
      end,
    };
    if (event.location) body.location = event.location;
    if (event.notes) body.description = event.notes;

    // If the event already exists upstream, PATCH; otherwise POST.
    const url = event.googleEventId
      ? `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(event.googleEventId)}`
      : `${GOOGLE_CALENDAR_API}/calendars/primary/events`;
    const method = event.googleEventId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Failed to push event: ${event.title}`, await res.text());
      continue;
    }
    const data = await res.json() as { id?: string };
    if (data.id) results.push({ localId: event.id, googleId: data.id });
  }

  return results;
};

export interface PullRange {
  /** ISO datetime (RFC 3339) lower bound, inclusive. */
  timeMin: string;
  /** ISO datetime (RFC 3339) upper bound, exclusive. */
  timeMax: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  updated?: string;
  location?: string;
  description?: string;
}

/**
 * Pull events from Google Calendar for the given time range and map
 * them to Caillou `CalendarEvent` shape. Caller is responsible for
 * merging the result with the local list.
 */
export const pullEventsFromGoogleCalendar = async (
  range: PullRange,
  options: { assignDefaultMembers?: () => string[] } = {},
): Promise<CalendarEvent[]> => {
  const token = await getGoogleAccessToken();
  const params = new URLSearchParams({
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Calendar list failed: ${res.status} ${txt}`);
  }
  const data = await res.json() as { items?: GoogleCalendarEvent[] };
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((item) => googleEventToCaillou(item, options.assignDefaultMembers?.()));
};

/**
 * Convert a Google Calendar event into a Caillou `CalendarEvent`.
 */
export function googleEventToCaillou(
  item: GoogleCalendarEvent,
  memberIds: string[] = [],
): CalendarEvent {
  const isAllDay = Boolean(item.start?.date);
  const date = isAllDay
    ? item.start!.date!
    : (item.start?.dateTime || '').slice(0, 10);
  const startTime = isAllDay ? undefined : (item.start?.dateTime || '').slice(11, 16);
  const endTime = isAllDay ? undefined : (item.end?.dateTime || '').slice(11, 16);
  return {
    id: `gcal-${item.id}`,
    title: item.summary || '(no title)',
    date,
    startTime,
    endTime,
    memberIds,
    location: item.location,
    notes: item.description,
    googleEventId: item.id,
    updatedAt: item.updated,
    recurrence: { type: 'none' },
    reminders: [],
  };
}

export interface ConflictResolution {
  /** How to resolve conflicts when both local and remote have changes. */
  strategy: 'last-write-wins' | 'local-wins' | 'remote-wins';
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
}

/**
 * Two-way sync. Pushes local events missing a `googleEventId`, then
 * pulls remote events and merges them. When an event exists on both
 * sides the conflict resolution strategy determines the winner.
 */
export const syncEventsWithGoogle = async (
  local: CalendarEvent[],
  range: PullRange,
  resolution: ConflictResolution = { strategy: 'last-write-wins' },
  options: { defaultMemberIds?: () => string[] } = {},
): Promise<{ events: CalendarEvent[]; result: SyncResult }> => {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0 };

  // 1. Push: every event without a googleEventId gets pushed upstream.
  const toPush = local.filter((e) => !e.googleEventId);
  if (toPush.length > 0) {
    const pushed = await pushEventsToGoogleCalendar(toPush);
    const idMap = new Map(pushed.map((p) => [p.localId, p.googleId]));
    local = local.map((e) =>
      idMap.has(e.id) ? { ...e, googleEventId: idMap.get(e.id)! } : e,
    );
    result.pushed = pushed.length;
  }

  // 2. Pull: fetch remote events in range.
  const remote = await pullEventsFromGoogleCalendar(range, {
    assignDefaultMembers: options.defaultMemberIds,
  });
  result.pulled = remote.length;

  // 3. Merge: index local by googleEventId for O(1) lookup.
  const localByGId = new Map<string, CalendarEvent>();
  for (const e of local) if (e.googleEventId) localByGId.set(e.googleEventId, e);

  // Start with a copy of ALL local events. Conflicts will be re-resolved below.
  const merged: CalendarEvent[] = [...local];
  const consumedRemoteIds = new Set<string>();

  for (const remoteEvt of remote) {
    const matchingLocal = localByGId.get(remoteEvt.googleEventId!);
    if (!matchingLocal) {
      // New remote event — adopt it.
      merged.push(remoteEvt);
      consumedRemoteIds.add(remoteEvt.id);
      continue;
    }
    consumedRemoteIds.add(matchingLocal.id);
    // Conflict detection: compare updatedAt.
    const localUpdated = matchingLocal.updatedAt ? Date.parse(matchingLocal.updatedAt) : 0;
    const remoteUpdated = remoteEvt.updatedAt ? Date.parse(remoteEvt.updatedAt) : 0;
    const isConflict = localUpdated !== remoteUpdated && localUpdated > 0 && remoteUpdated > 0;
    if (isConflict) result.conflicts++;

    let winner: CalendarEvent;
    if (resolution.strategy === 'local-wins') {
      winner = matchingLocal;
    } else if (resolution.strategy === 'remote-wins') {
      winner = { ...matchingLocal, ...remoteEvt, id: matchingLocal.id };
    } else {
      // last-write-wins
      winner = localUpdated >= remoteUpdated ? matchingLocal : { ...matchingLocal, ...remoteEvt, id: matchingLocal.id };
    }
    const idx = merged.findIndex((e) => e.id === matchingLocal.id);
    if (idx >= 0) merged[idx] = winner;
    else merged.push(winner);
  }

  // Side effect: re-push events we won locally but had a googleEventId.
  const toRePush = merged.filter(
    (e) => e.googleEventId && localByGId.has(e.googleEventId) && localByGId.get(e.googleEventId) !== e,
  );
  if (toRePush.length > 0) {
    await pushEventsToGoogleCalendar(toRePush).catch((e) => {
      console.warn('Re-push after conflict failed', e);
    });
  }

  // Silence unused-variable warning for `consumedRemoteIds` (used in
  // future telemetry).
  void consumedRemoteIds;

  return { events: merged, result };
};
