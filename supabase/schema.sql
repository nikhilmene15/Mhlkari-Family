-- =============================================
-- MHALKARI FAMILY PORTAL — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  birth_date   DATE,
  phone        TEXT,
  bio          TEXT,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ FAMILY MEMBERS (tree) ============
CREATE TABLE IF NOT EXISTS public.family_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  birth_date   DATE,
  death_date   DATE,
  gender       TEXT CHECK (gender IN ('male', 'female', 'other')),
  avatar_url   TEXT,
  bio          TEXT,
  parent_id    UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  spouse_id    UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ ALBUMS ============
CREATE TABLE IF NOT EXISTS public.albums (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ PHOTOS ============
CREATE TABLE IF NOT EXISTS public.photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url          TEXT NOT NULL,
  caption      TEXT,
  album_id     UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  uploaded_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ FESTIVALS ============
CREATE TABLE IF NOT EXISTS public.festivals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  date         DATE NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'festival' CHECK (type IN ('festival','birthday','anniversary','event')),
  recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ EXPENSES ============
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  category     TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food','travel','shopping','medical','entertainment','utilities','contribution','other')),
  description  TEXT,
  paid_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_split     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ CONTRIBUTIONS (Monthly Brother Contributions) ============
CREATE TABLE IF NOT EXISTS public.contributions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brother_id   INTEGER NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 300,
  month        TEXT NOT NULL, -- Format: YYYY-MM
  paid_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brother_id, month)
);

-- ============ YEARLY AMOUNTS (Monthly amount per year) ============
CREATE TABLE IF NOT EXISTS public.yearly_amounts (
  year         INTEGER PRIMARY KEY,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 300,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for Contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contributions_read" ON public.contributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contributions_insert" ON public.contributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contributions_update" ON public.contributions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "contributions_delete" ON public.contributions FOR DELETE USING (auth.role() = 'authenticated');

-- RLS for Yearly Amounts
ALTER TABLE public.yearly_amounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yearly_amounts_read" ON public.yearly_amounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "yearly_amounts_insert" ON public.yearly_amounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "yearly_amounts_update" ON public.yearly_amounts FOR UPDATE USING (auth.role() = 'authenticated');

-- ============ POLLS ============
CREATE TABLE IF NOT EXISTS public.polls (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question     TEXT NOT NULL,
  description  TEXT,
  options      JSONB NOT NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ POLL VOTES ============
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id      UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, user_id)
);

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  description  TEXT,
  upi_id       TEXT NOT NULL,
  qr_data      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','paid')),
  paid_by      UUID[] NOT NULL DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general',
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Profiles: members can read all, update own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Family members: authenticated can read/write
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_members_read" ON public.family_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "family_members_write" ON public.family_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE USING (auth.role() = 'authenticated');

-- Albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums_read" ON public.albums FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "albums_write" ON public.albums FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "albums_delete" ON public.albums FOR DELETE USING (auth.uid() = created_by);

-- Photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_read" ON public.photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "photos_insert" ON public.photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "photos_delete" ON public.photos FOR DELETE USING (auth.uid() = uploaded_by);

-- Festivals
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "festivals_read" ON public.festivals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "festivals_write" ON public.festivals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "festivals_delete" ON public.festivals FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "festivals_update" ON public.festivals FOR UPDATE USING (auth.role() = 'authenticated');

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_read" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (auth.uid() = paid_by);

-- Polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls_read" ON public.polls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "polls_insert" ON public.polls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "polls_update" ON public.polls FOR UPDATE USING (auth.uid() = created_by);

-- Poll Votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read" ON public.poll_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "votes_insert" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_read" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (auth.uid() = created_by);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- Run in Supabase Dashboard > Storage
-- =============================================
-- Create a bucket called "family-media" with public access
-- INSERT INTO storage.buckets (id, name, public) VALUES ('family-media', 'family-media', true);

-- ============ PRT MEETINGS ============
CREATE TABLE IF NOT EXISTS public.prt_meetings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date         TIMESTAMP WITH TIME ZONE NOT NULL,
  location     TEXT NOT NULL,
  discussion_points TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ PRT ATTENDANCE ============
CREATE TABLE IF NOT EXISTS public.prt_attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id   UUID NOT NULL REFERENCES public.prt_meetings(id) ON DELETE CASCADE,
  brother_id   INTEGER NOT NULL,
  is_present   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(meeting_id, brother_id)
);

-- RLS for PRT Meetings
ALTER TABLE public.prt_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prt_meetings_read" ON public.prt_meetings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prt_meetings_insert" ON public.prt_meetings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prt_meetings_delete" ON public.prt_meetings FOR DELETE USING (auth.uid() = created_by);

-- RLS for PRT Attendance
ALTER TABLE public.prt_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prt_attendance_read" ON public.prt_attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prt_attendance_insert" ON public.prt_attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prt_attendance_update" ON public.prt_attendance FOR UPDATE USING (auth.role() = 'authenticated');
