// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  urlBase64ToUint8Array,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from './pushNotifications';

vi.mock('./supabase', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from './supabase';

function stubServiceWorker(impl: { ready?: Promise<any> }) {
  // jsdom doesn't implement a working serviceWorker.ready. Stub it
  // on the navigator prototype chain so the function under test sees
  // our push manager.
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: {
      ready: impl.ready ?? Promise.resolve({ pushManager: {} }),
    },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
});

describe('urlBase64ToUint8Array', () => {
  it('converts a base64url string into a Uint8Array', () => {
    const out = urlBase64ToUint8Array('aGVsbG8');
    expect(out).toBeInstanceOf(Uint8Array);
    // "hello" → 104 101 108 108 111
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
  });

  it('handles url-safe characters (- and _)', () => {
    const out = urlBase64ToUint8Array('a-_b');
    expect(out).toBeInstanceOf(Uint8Array);
  });
});

describe('subscribeToPush', () => {
  it('returns null when VAPID key is missing', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    const result = await subscribeToPush();
    expect(result).toBeNull();
  });

  it('subscribes and upserts to supabase when configured', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BPubKeyMock');
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } } }) },
      from: () => ({ upsert }),
    });

    const sub = { toJSON: () => ({ endpoint: 'https://example.com/push/u-1' }) } as any;
    stubServiceWorker({
      ready: Promise.resolve({
        pushManager: { subscribe: vi.fn(() => Promise.resolve(sub)) },
      }),
    });

    const result = await subscribeToPush();
    expect(result).toBe(sub);
    expect(upsert).toHaveBeenCalled();
  });

  it('still subscribes even if supabase is not configured', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BPubKeyMock');
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const sub = { toJSON: () => ({}) } as any;
    stubServiceWorker({
      ready: Promise.resolve({
        pushManager: { subscribe: vi.fn(() => Promise.resolve(sub)) },
      }),
    });
    const result = await subscribeToPush();
    expect(result).toBe(sub);
  });
});

describe('unsubscribeFromPush', () => {
  it('does nothing if there is no subscription', async () => {
    stubServiceWorker({
      ready: Promise.resolve({
        pushManager: { getSubscription: () => Promise.resolve(null) },
      }),
    });
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
  });

  it('unsubscribes and removes the supabase row', async () => {
    const unsubscribe = vi.fn(() => Promise.resolve());
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const del = vi.fn(() => ({ eq }));
    stubServiceWorker({
      ready: Promise.resolve({
        pushManager: {
          getSubscription: () => Promise.resolve({ unsubscribe }),
        },
      }),
    });
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } } }) },
      from: () => ({ delete: del }),
    });
    await unsubscribeFromPush();
    expect(unsubscribe).toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('user_id', 'u-1');
  });
});

describe('getPushSubscription', () => {
  it('returns the current subscription', async () => {
    const sub = { endpoint: 'https://example.com/push/u-1' };
    stubServiceWorker({
      ready: Promise.resolve({
        pushManager: { getSubscription: () => Promise.resolve(sub) },
      }),
    });
    await expect(getPushSubscription()).resolves.toBe(sub);
  });
});
