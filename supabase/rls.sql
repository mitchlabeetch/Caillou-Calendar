-- Caillou Calendar · Row Level Security policies
--
-- IMPORTANT: column names are snake_case (`owner_id`, `user_id`).
-- Re-running this file is safe: policies are dropped before being
-- recreated.

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'child')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on core tables.
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    (SELECT u.role FROM public.users u WHERE u.id = auth.uid()),
    'member'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_events()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('admin', 'member');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_family()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'admin';
$$;

-- Drop any prior policy so this file is idempotent.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'events', 'family_members', 'places', 'settings', 'user_subscriptions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- Users
CREATE POLICY "users_self_read" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_admin_read" ON public.users
  FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = public.current_user_role());
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "users_self_insert" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Events
CREATE POLICY "events_select_own" ON public.events
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "events_insert_authorized" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.can_write_events());
CREATE POLICY "events_update_authorized" ON public.events
  FOR UPDATE USING (auth.uid() = owner_id AND public.can_write_events())
  WITH CHECK (auth.uid() = owner_id AND public.can_write_events());
CREATE POLICY "events_delete_authorized" ON public.events
  FOR DELETE USING (auth.uid() = owner_id AND public.can_write_events());

-- Family members
CREATE POLICY "family_members_select_own" ON public.family_members
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "family_members_insert_authorized" ON public.family_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.can_manage_family());
CREATE POLICY "family_members_update_authorized" ON public.family_members
  FOR UPDATE USING (auth.uid() = owner_id AND public.can_manage_family())
  WITH CHECK (auth.uid() = owner_id AND public.can_manage_family());
CREATE POLICY "family_members_delete_authorized" ON public.family_members
  FOR DELETE USING (auth.uid() = owner_id AND public.can_manage_family());

-- Places
CREATE POLICY "places_select_own" ON public.places
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "places_insert_authorized" ON public.places
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.can_write_events());
CREATE POLICY "places_update_authorized" ON public.places
  FOR UPDATE USING (auth.uid() = owner_id AND public.can_write_events())
  WITH CHECK (auth.uid() = owner_id AND public.can_write_events());
CREATE POLICY "places_delete_authorized" ON public.places
  FOR DELETE USING (auth.uid() = owner_id AND public.can_write_events());

-- Settings
CREATE POLICY "settings_select_own" ON public.settings
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "settings_insert_authorized" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.can_manage_family());
CREATE POLICY "settings_update_authorized" ON public.settings
  FOR UPDATE USING (auth.uid() = owner_id AND public.can_manage_family())
  WITH CHECK (auth.uid() = owner_id AND public.can_manage_family());

-- User subscriptions
CREATE POLICY "user_subscriptions_manage_own" ON public.user_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
