/**
 * Supabase migration: real RBAC.
 *
 * Adds a `users` table keyed by Supabase auth.uid with a `role`
 * column ('admin' | 'member' | 'child'). RLS restricts reads to
 * the caller's own row.
 *
 * The app reads the role client-side via a select-by-uid call. The
 * existing `useUserRole` hook falls back to local mode when this
 * table is unreachable.
 */

export const RBAC_MIGRATION_SQL = `
-- 001_rbac.sql — Run this against your Supabase project.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'member' check (role in ('admin', 'member', 'child')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Every user can read their own row.
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (auth.uid() = id);

-- Admins can read every row.
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Users can update their own row, except the role column.
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));

-- Admins can update any row (including role changes).
drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
  for update using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Insert is restricted to admins or self-bootstrap on first sign-in.
drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users
  for insert with check (auth.uid() = id);
`;

export type RbacRole = 'admin' | 'member' | 'child';

/** Reads the caller's role from the `users` table. Returns null if unreachable. */
export async function fetchUserRole(supabase: unknown): Promise<RbacRole | null> {
  if (!supabase) return null;
  const client = supabase as { from: (t: string) => { select: (cols: string) => { eq: (col: string, val: unknown) => { maybeSingle: () => Promise<{ data: { role: RbacRole } | null }> } } } };
  try {
    const { data } = await client.from('users').select('role').eq('id', (await getAuthUid()) ?? '').maybeSingle();
    return data?.role ?? null;
  } catch {
    return null;
  }
}

async function getAuthUid(): Promise<string | null> {
  try {
    const { getSupabase } = await import('./supabase');
    const s = getSupabase();
    if (!s) return null;
    const auth = await s.auth.getUser();
    return auth.data.user?.id ?? null;
  } catch {
    return null;
  }
}