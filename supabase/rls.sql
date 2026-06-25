-- Caillou Calendar · Row Level Security policies
--
-- IMPORTANT: column names are snake_case (`owner_id`, `user_id`).
-- The previous version of this file used the camelCase `ownerId`, which
-- Postgres identifier-folds to `ownerid` so the policies matched no
-- rows and RLS was effectively disabled. See
-- wiki/operations/18-production-audit.md §9 for context.
--
-- Re-running this file is safe: policies are dropped before being
-- recreated.

-- Enable RLS on core tables
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any prior policy so this file is idempotent.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('events','family_members','places','settings','user_subscriptions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- Events
CREATE POLICY "events_select_own" ON public.events
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "events_update_own" ON public.events
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "events_delete_own" ON public.events
  FOR DELETE USING (auth.uid() = owner_id);

-- Family members
CREATE POLICY "family_members_select_own" ON public.family_members
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "family_members_insert_own" ON public.family_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "family_members_update_own" ON public.family_members
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "family_members_delete_own" ON public.family_members
  FOR DELETE USING (auth.uid() = owner_id);

-- Places
CREATE POLICY "places_select_own" ON public.places
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "places_insert_own" ON public.places
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "places_update_own" ON public.places
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "places_delete_own" ON public.places
  FOR DELETE USING (auth.uid() = owner_id);

-- Settings
CREATE POLICY "settings_select_own" ON public.settings
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "settings_insert_own" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "settings_update_own" ON public.settings
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- User subscriptions
CREATE POLICY "user_subscriptions_manage_own" ON public.user_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);