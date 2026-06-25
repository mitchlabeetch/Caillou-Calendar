import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ _mock: true })),
}));

import {
  getSupabase,
  eventToDbRow,
  dbRowToEvent,
  memberToDbRow,
  dbRowToMember,
  settingsToDbRow,
  dbRowToSettings,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from './supabase';

const originalUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const originalKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('getSupabase', () => {
  it('returns null when env vars are unset (local-only mode)', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(getSupabase()).toBeNull();
  });

  it('returns null when URL is malformed', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'x');
    expect(getSupabase()).toBeNull();
  });
});

describe('eventToDbRow / dbRowToEvent', () => {
  it('round-trips a minimal event', () => {
    const event = {
      id: 'e1',
      title: 'Test',
      date: '2026-06-25',
      memberIds: ['m1'],
      recurrence: { type: 'none' as const },
      reminders: [],
    };
    const row = eventToDbRow(event, 'u-1');
    expect(row.id).toBe('e1');
    expect(row.owner_id).toBe('u-1');
    const back = dbRowToEvent(row as any);
    expect(back.title).toBe('Test');
    expect(back.memberIds).toEqual(['m1']);
  });

  it('handles all optional fields', () => {
    const event = {
      id: 'e1',
      title: 'Full',
      date: '2026-06-25',
      endDate: '2026-06-26',
      startTime: '10:00',
      endTime: '11:00',
      memberIds: ['m1'],
      recurrence: { type: 'weekly' as const },
      reminders: ['10m'],
      thumbnailUrl: 'https://x/i.png',
      location: 'Park',
      exceptionDates: ['2026-07-01'],
      isBirthday: true,
      driverId: 'd1',
    };
    const row = eventToDbRow(event, 'u-1');
    expect(row.end_date).toBe('2026-06-26');
    expect(row.is_birthday).toBe(true);
    const back = dbRowToEvent(row as any);
    expect(back.endDate).toBe('2026-06-26');
    expect(back.recurrence?.type).toBe('weekly');
  });

  it('collapses recurrence to undefined when row.recurrence_type is none', () => {
    const back = dbRowToEvent({ id: 'e1', title: 'X', date: '2026-06-25', member_ids: [], recurrence_type: 'none', exception_dates: [], reminders: [] } as any);
    expect(back.recurrence).toBeUndefined();
  });
});

describe('memberToDbRow / dbRowToMember', () => {
  it('round-trips a member', () => {
    const member = { id: 'm1', name: 'Alice', color: '#fff', bgClass: 'bg-mem-1', icon: 'face' };
    const row = memberToDbRow(member, 'u-1');
    expect(row.bg_class).toBe('bg-mem-1');
    expect(row.role).toBe('member');
    const back = dbRowToMember(row as any);
    expect(back.bgClass).toBe('bg-mem-1');
  });

  it('falls back when color/bgClass are missing', () => {
    const back = dbRowToMember({ id: 'm1', name: 'Alice' } as any);
    expect(back.bgClass).toBe('bg-mem-1');
    expect(back.icon).toBe('face');
  });
});

describe('settingsToDbRow / dbRowToSettings', () => {
  it('round-trips settings', () => {
    const row = settingsToDbRow({ startOfWeek: 0, timeFormat: '12h' }, 'u-1');
    expect(row.start_of_week).toBe(0);
    expect(row.time_format).toBe('12h');
    const back = dbRowToSettings(row as any);
    expect(back.timeFormat).toBe('12h');
  });

  it('uses defaults for missing fields', () => {
    const back = dbRowToSettings({} as any);
    expect(back.startOfWeek).toBe(1);
    expect(back.timeFormat).toBe('24h');
  });
});

describe('auth helpers', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
  });

  it('signInWithGoogle throws when supabase is unconfigured', () => {
    expect(() => signInWithGoogle()).toThrow();
  });

  it('signInWithEmail throws when supabase is unconfigured', () => {
    expect(() => signInWithEmail('a@b', 'p')).toThrow();
  });

  it('signUpWithEmail throws when supabase is unconfigured', () => {
    expect(() => signUpWithEmail('a@b', 'p')).toThrow();
  });

  it('signOut returns Promise.resolve when supabase is unconfigured', async () => {
    await expect(signOut()).resolves.toBeUndefined();
  });
});
