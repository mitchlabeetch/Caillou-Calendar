-- Enable Row Level Security on core tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Events: authenticated users can read events they own
CREATE POLICY "Allow users to read own events"
ON public.events FOR SELECT
USING (auth.uid() = ownerId);

-- Events: authenticated users can insert their own events
CREATE POLICY "Allow users to insert own events"
ON public.events FOR INSERT
WITH CHECK (auth.uid() = ownerId);

-- Events: authenticated users can update their own events
CREATE POLICY "Allow users to update own events"
ON public.events FOR UPDATE
USING (auth.uid() = ownerId);

-- Events: authenticated users can delete their own events
CREATE POLICY "Allow users to delete own events"
ON public.events FOR DELETE
USING (auth.uid() = ownerId);

-- Family members: same owner-based policies
CREATE POLICY "Allow users to read own family members"
ON public.family_members FOR SELECT
USING (auth.uid() = ownerId);

CREATE POLICY "Allow users to insert own family members"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = ownerId);

CREATE POLICY "Allow users to update own family members"
ON public.family_members FOR UPDATE
USING (auth.uid() = ownerId);

CREATE POLICY "Allow users to delete own family members"
ON public.family_members FOR DELETE
USING (auth.uid() = ownerId);

-- Places: same owner-based policies
CREATE POLICY "Allow users to read own places"
ON public.places FOR SELECT
USING (auth.uid() = ownerId);

CREATE POLICY "Allow users to insert own places"
ON public.places FOR INSERT
WITH CHECK (auth.uid() = ownerId);

CREATE POLICY "Allow users to update own places"
ON public.places FOR UPDATE
USING (auth.uid() = ownerId);

CREATE POLICY "Allow users to delete own places"
ON public.places FOR DELETE
USING (auth.uid() = ownerId);

-- Settings: same owner-based policies
CREATE POLICY "Allow users to read own settings"
ON public.settings FOR SELECT
USING (auth.uid() = ownerId);

CREATE POLICY "Allow users to insert own settings"
ON public.settings FOR INSERT
WITH CHECK (auth.uid() = ownerId);

CREATE POLICY "Allow users to update own settings"
ON public.settings FOR UPDATE
USING (auth.uid() = ownerId);

-- User subscriptions: users can only manage their own
CREATE POLICY "Allow users to manage own subscriptions"
ON public.user_subscriptions FOR ALL
USING (auth.uid() = user_id);
