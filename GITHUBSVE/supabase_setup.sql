-- ══════════════════════════════════════════════════════
--  NOESIS PEAK — Supabase Setup SQL
--  Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. PROFILES TABLE (links auth.users to roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player','coach')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'player')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. LINK PLAYERS TABLE TO PROFILES
-- Add profile_id column to your existing players table
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id);

-- 3. COACH MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  target_squad  TEXT DEFAULT 'all',  -- 'all', 'U15', 'U17', etc.
  coach_id      UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coaches can read all profiles"
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- Coach messages (players can read, coaches can write)
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read messages"
  ON public.coach_messages FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches can insert messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- 5. SET YOUR ACCOUNT AS COACH
-- Replace with your actual email:
UPDATE public.profiles SET role = 'coach'
WHERE email = 'YOUR_COACH_EMAIL@example.com';

-- 6. LINK EXISTING PLAYERS TO THEIR SUPABASE ACCOUNTS
-- After players sign up, link them manually:
-- UPDATE public.players SET profile_id = '<user_uuid>'
-- WHERE name = 'Player Name';
-- (You can also do this via the Supabase Table Editor)
