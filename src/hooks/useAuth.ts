import { useCallback, useEffect, useState } from 'react';

export interface AuthState {
  user: { uid: string; email: string } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Auth state with optional Supabase backend. When env vars are missing
 * the synthetic `local-user` is used so the app stays functional
 * without a configured Supabase project (see
 * `wiki/operations/18-production-audit.md` §4.2).
 */
export function useAuth() {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { getSupabase } = await import('../lib/supabase');
        const sb = getSupabase();
        if (!sb) {
          if (cancelled) return;
          setUser({ uid: 'local-user', email: 'local@example.com' });
          setLoading(false);
          return;
        }
        const { data: { session } } = await sb.auth.getSession();
        if (cancelled) return;
        setUser(session?.user ? { uid: session.user.id, email: session.user.email ?? '' } : null);
        setLoading(false);

        if (session?.user && 'serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const granted =
              Notification.permission === 'granted' ||
              (await Notification.requestPermission()) === 'granted';
            if (granted) {
              const { subscribeToPush } = await import('../lib/pushNotifications');
              await subscribeToPush();
            }
          } catch (e) {
            console.warn('Push registration failed', e);
          }
        }

        const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => {
          if (cancelled) return;
          setUser(s?.user ? { uid: s.user.id, email: s.user.email ?? '' } : null);
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch (e) {
        if (cancelled) return;
        console.warn('Auth init failed', e);
        setError(e instanceof Error ? e.message : String(e));
        setUser(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const { unsubscribeFromPush } = await import('../lib/pushNotifications');
        await Promise.race([
          unsubscribeFromPush(),
          new Promise<void>(resolve => setTimeout(resolve, 3000)),
        ]);
      }
    } catch (e) {
      console.warn('Push unsubscribe failed during sign-out', e);
    }
    const { getSupabase } = await import('../lib/supabase');
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, error, signOut };
}