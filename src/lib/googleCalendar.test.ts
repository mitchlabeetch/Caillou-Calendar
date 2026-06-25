import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  googleEventToCaillou,
  pullEventsFromGoogleCalendar,
  syncEventsWithGoogle,
  pushEventsToGoogleCalendar,
} from './googleCalendar';
import { CalendarEvent } from '../types';

vi.mock('./supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: {
          session: {
            provider_token: 'fake-google-token',
          },
        },
      }),
    },
  }),
}));

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function makeFetchMock(routes: Array<{ pattern: RegExp; handler: (body: unknown) => { status: number; body: unknown } }>) {
  const calls: FetchCall[] = [];
  return {
    calls,
    fetch: vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      for (const { pattern, handler } of routes) {
        if (pattern.test(url)) {
          const body = init && init.body ? JSON.parse(init.body as string) : undefined;
          const res = handler(body);
          return new Response(JSON.stringify(res.body), { status: res.status });
        }
      }
      return new Response('not found', { status: 404 });
    }),
  };
}

describe('googleEventToCaillou', () => {
  it('converts an all-day event', () => {
    const out = googleEventToCaillou({
      id: 'abc',
      summary: 'Holiday',
      start: { date: '2026-12-25' },
      end: { date: '2026-12-26' },
      updated: '2026-06-25T10:00:00.000Z',
    });
    expect(out.title).toBe('Holiday');
    expect(out.date).toBe('2026-12-25');
    expect(out.startTime).toBeUndefined();
    expect(out.googleEventId).toBe('abc');
    expect(out.updatedAt).toBe('2026-06-25T10:00:00.000Z');
  });

  it('converts a timed event', () => {
    const out = googleEventToCaillou({
      id: 'xyz',
      summary: 'Soccer',
      start: { dateTime: '2026-06-25T10:00:00+02:00' },
      end: { dateTime: '2026-06-25T11:00:00+02:00' },
      updated: '2026-06-25T10:00:00.000Z',
    });
    expect(out.date).toBe('2026-06-25');
    expect(out.startTime).toBe('10:00');
    expect(out.endTime).toBe('11:00');
  });

  it('passes default memberIds through', () => {
    const out = googleEventToCaillou(
      { id: 'a', summary: 'x', start: { date: '2026-06-25' }, end: { date: '2026-06-26' } },
      ['m1', 'm2'],
    );
    expect(out.memberIds).toEqual(['m1', 'm2']);
  });
});

describe('pushEventsToGoogleCalendar', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns localId → googleId pairs', async () => {
    const mock = makeFetchMock([
      { pattern: /\/calendars\/primary\/events$/, handler: () => ({ status: 200, body: { id: 'gid-1' } }) },
    ]);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const events: CalendarEvent[] = [
      {
        id: 'local-1',
        title: 'Test',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1'],
        recurrence: { type: 'none' },
        reminders: [],
      },
    ];
    const result = await pushEventsToGoogleCalendar(events);
    expect(result).toEqual([{ localId: 'local-1', googleId: 'gid-1' }]);
  });

  it('uses PATCH for events that already have a googleEventId', async () => {
    const mock = makeFetchMock([
      { pattern: /\/calendars\/primary\/events\/gid-existing$/, handler: () => ({ status: 200, body: { id: 'gid-existing' } }) },
    ]);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const events: CalendarEvent[] = [
      {
        id: 'local-1',
        title: 'Test',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1'],
        googleEventId: 'gid-existing',
        recurrence: { type: 'none' },
        reminders: [],
      },
    ];
    const result = await pushEventsToGoogleCalendar(events);
    expect(result).toEqual([{ localId: 'local-1', googleId: 'gid-existing' }]);
    expect(mock.calls[0].init?.method).toBe('PATCH');
  });
});

describe('pullEventsFromGoogleCalendar', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps Google items to Caillou events', async () => {
    const mock = makeFetchMock([
      {
        pattern: /\/calendars\/primary\/events\?/,
        handler: () => ({
          status: 200,
          body: {
            items: [
              {
                id: 'g1',
                summary: 'Doctor',
                start: { dateTime: '2026-07-01T09:00:00+02:00' },
                end: { dateTime: '2026-07-01T10:00:00+02:00' },
                updated: '2026-06-25T11:00:00.000Z',
              },
            ],
          },
        }),
      },
    ]);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const events = await pullEventsFromGoogleCalendar(
      { timeMin: '2026-07-01T00:00:00Z', timeMax: '2026-07-02T00:00:00Z' },
      { assignDefaultMembers: () => ['m1'] },
    );
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Doctor');
    expect(events[0].startTime).toBe('09:00');
    expect(events[0].memberIds).toEqual(['m1']);
    expect(events[0].googleEventId).toBe('g1');
  });
});

describe('syncEventsWithGoogle', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function buildRoutes() {
    return [
      // NOTE: PATCH/POST routes must come AFTER the GET list route since
      // both URLs share the `/calendars/primary/events` prefix.
      {
        pattern: /\/calendars\/primary\/events\?/,
        handler: () => ({
          status: 200,
          body: {
            items: [
              {
                id: 'gid-remote',
                summary: 'Remote Event',
                start: { dateTime: '2026-06-25T15:00:00+02:00' },
                end: { dateTime: '2026-06-25T16:00:00+02:00' },
                updated: '2026-06-25T12:00:00.000Z',
              },
            ],
          },
        }),
      },
      {
        pattern: /\/calendars\/primary\/events\//,
        handler: (_body: unknown) => ({ status: 200, body: { id: 'gid-existing' } }),
      },
      {
        pattern: /\/calendars\/primary\/events$/,
        handler: (_body: unknown) => ({ status: 200, body: { id: 'gid-new' } }),
      },
    ];
  }

  it('pushes events without googleEventId and pulls remote events', async () => {
    const routes = buildRoutes();
    const mock = makeFetchMock(routes);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const local: CalendarEvent[] = [
      {
        id: 'local-1',
        title: 'Local',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1'],
        recurrence: { type: 'none' },
        reminders: [],
      },
    ];
    const { events, result } = await syncEventsWithGoogle(
      local,
      { timeMin: '2026-06-25T00:00:00Z', timeMax: '2026-06-26T00:00:00Z' },
      { strategy: 'last-write-wins' },
    );
    expect(result.pushed).toBe(1);
    expect(result.pulled).toBe(1);
    expect(events).toHaveLength(2);
    const localAfter = events.find((e) => e.id === 'local-1');
    expect(localAfter?.googleEventId).toBe('gid-new');
  });

  it('last-write-wins picks the more recent updatedAt', async () => {
    const routes = buildRoutes();
    const mock = makeFetchMock(routes);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const local: CalendarEvent[] = [
      {
        id: 'local-1',
        title: 'Older local',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1'],
        googleEventId: 'gid-remote',
        updatedAt: '2026-06-25T08:00:00.000Z',
        recurrence: { type: 'none' },
        reminders: [],
      },
    ];
    const { events, result } = await syncEventsWithGoogle(
      local,
      { timeMin: '2026-06-25T00:00:00Z', timeMax: '2026-06-26T00:00:00Z' },
      { strategy: 'last-write-wins' },
    );
    expect(result.conflicts).toBe(1);
    // Remote updatedAt is 2026-06-25T12:00:00Z which is newer.
    const merged = events.find((e) => e.googleEventId === 'gid-remote');
    expect(merged?.title).toBe('Remote Event');
  });

  it('local-wins strategy keeps the local copy even when remote is newer', async () => {
    const routes = buildRoutes();
    const mock = makeFetchMock(routes);
    globalThis.fetch = mock.fetch as unknown as typeof fetch;
    const local: CalendarEvent[] = [
      {
        id: 'local-1',
        title: 'Local kept',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1'],
        googleEventId: 'gid-remote',
        updatedAt: '2026-06-25T08:00:00.000Z',
        recurrence: { type: 'none' },
        reminders: [],
      },
    ];
    const { events } = await syncEventsWithGoogle(
      local,
      { timeMin: '2026-06-25T00:00:00Z', timeMax: '2026-06-26T00:00:00Z' },
      { strategy: 'local-wins' },
    );
    const merged = events.find((e) => e.googleEventId === 'gid-remote');
    expect(merged?.title).toBe('Local kept');
  });
});
