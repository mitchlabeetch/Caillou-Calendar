import { useEffect, useState, useCallback } from 'react';
import { UserRole } from '../types';
import { useAuth } from './useAuth';
import { fetchUserRole } from '../lib/rbac';

const ROLE_LS_KEY = 'synoptic-user-role';

function isValidRole(v: unknown): v is UserRole {
  return v === 'admin' || v === 'member' || v === 'child';
}

/**
 * Resolves the current user's role.
 *
 * Order of precedence:
 *   1. Backend-authenticated role data for signed-in Supabase users.
 *   2. `localStorage[synoptic-user-role]` only in local-only mode.
 *   3. `'admin'` fallback for the local-user and anonymous users.
 *
 * The returned setter is intentionally local-only. Signed-in users can
 * view their trusted backend role here, but cannot override it from the
 * client.
 */
export function useUserRole(): [UserRole, (role: UserRole) => void] {
  const { user } = useAuth();
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof localStorage === 'undefined') return 'admin';
    const stored = localStorage.getItem(ROLE_LS_KEY);
    if (isValidRole(stored)) return stored;
    // For local-user we default to admin (no real auth context).
    return 'admin';
  });

  useEffect(() => {
    if (!user || user.uid === 'local-user') {
      return;
    }

    (async () => {
      try {
        const { getSupabase } = await import('../lib/supabase');
        const sb = getSupabase();
        if (!sb) return;
        const trustedRole = await fetchUserRole(sb);
        if (isValidRole(trustedRole)) {
          setRoleState(trustedRole);
          return;
        }

        setRoleState('member');
      } catch (e) {
        console.warn('Failed to read trusted user role', e);
        setRoleState('member');
      }
    })();
  }, [user]);

  const setRole = useCallback((next: UserRole) => {
    if (user && user.uid !== 'local-user') {
      return;
    }

    setRoleState(next);
    try {
      localStorage.setItem(ROLE_LS_KEY, next);
    } catch {}
  }, [user]);

  return [role, setRole];
}
