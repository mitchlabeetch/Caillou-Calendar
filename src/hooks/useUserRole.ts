import { useEffect, useState, useCallback } from 'react';
import { UserRole } from '../types';
import { useAuth } from './useAuth';

const ROLE_LS_KEY = 'synoptic-user-role';

function isValidRole(v: unknown): v is UserRole {
  return v === 'admin' || v === 'member' || v === 'child';
}

/**
 * Resolves the current user's role.
 *
 * Order of precedence:
 *   1. `localStorage[synoptic-user-role]` (manual override during dev or
 *      for local-only mode).
 *   2. `user.user_metadata.role` from Supabase auth — when running with
 *      a real backend, the admin can promote/demote users in the Supabase
 *      dashboard by setting `auth.users.raw_user_meta_data->>role`.
 *   3. `'admin'` fallback for the local-user and anonymous users.
 *
 * The returned setter writes to localStorage so a fresh page load keeps
 * the chosen role.
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

  // Re-evaluate when auth user changes (e.g., after Supabase OAuth).
  useEffect(() => {
    if (!user || user.uid === 'local-user') return;
    // Read the role from user_metadata set by the admin.
    // Note: useAuth currently exposes only `uid` + `email`; we read the
    // metadata here to avoid widening the auth contract.
    (async () => {
      try {
        const { getSupabase } = await import('../lib/supabase');
        const sb = getSupabase();
        if (!sb) return;
        const { data } = await sb.auth.getUser();
        const meta = (data?.user?.user_metadata as { role?: unknown } | undefined) || undefined;
        const metaRole = meta?.role;
        if (isValidRole(metaRole)) {
          setRoleState(metaRole);
        }
      } catch (e) {
        console.warn('Failed to read user role from metadata', e);
      }
    })();
  }, [user]);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    try {
      localStorage.setItem(ROLE_LS_KEY, next);
    } catch {}
  }, []);

  return [role, setRole];
}
