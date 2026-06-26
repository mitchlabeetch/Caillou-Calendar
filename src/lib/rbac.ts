/**
 * Supabase migration: real RBAC.
 *
 * Adds a `users` table keyed by Supabase auth.uid with a `role`
 * column ('admin' | 'member' | 'child'). RLS derives trusted roles
 * from server-issued JWT metadata first, then falls back to this
 * table when present.
 *
 * The app reads the role client-side from backend-authenticated data.
 * Local overrides are reserved for local-only mode.
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

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    (select u.role from public.users u where u.id = auth.uid()),
    'member'
  );
$$;

create or replace function public.can_write_events()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'member');
$$;

create or replace function public.can_manage_family()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

-- Every user can read their own row.
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (auth.uid() = id);

-- Admins can read every row.
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users
  for select using (public.current_user_role() = 'admin');

-- Users can update their own row, except the role column. The WITH
-- CHECK pins role to the existing DB value (via a sub-select against
-- the same row) so a user cannot self-promote to admin even if their
-- JWT claims something different.
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));

-- Admins can update any row (including role changes).
drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
  for update using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Insert is restricted to admins or self-bootstrap on first sign-in.
drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users
  for insert with check (auth.uid() = id);
`;

export type RbacRole = 'admin' | 'member' | 'child';

function isRbacRole(role: unknown): role is RbacRole {
  return role === 'admin' || role === 'member' || role === 'child';
}

/** Reads the caller's role from trusted backend-authenticated data. */
export async function fetchUserRole(supabase: unknown): Promise<RbacRole | null> {
  if (!supabase) return null;
  try {
    const client = supabase as {
      auth: {
        getUser: () => Promise<{
          data: {
            user: {
              id?: string;
              user_metadata?: { role?: unknown };
            } | null;
          };
        }>;
      };
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: unknown) => {
            maybeSingle: () => Promise<{ data: { role: unknown } | null }>;
          };
        };
      };
    };
    const authUser = await client.auth.getUser();
    const metadataRole = authUser.data.user?.user_metadata?.role;
    if (isRbacRole(metadataRole)) {
      return metadataRole;
    }

    const uid = authUser.data.user?.id ?? null;
    if (!uid) {
      return null;
    }

    const { data } = await client.from('users').select('role').eq('id', uid).maybeSingle();
    return isRbacRole(data?.role) ? data.role : null;
  } catch {
    return null;
  }
}
