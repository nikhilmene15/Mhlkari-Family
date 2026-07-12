-- =============================================
-- FIX CONTRIBUTIONS TABLE SCHEMA
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Drop existing contributions table and recreate with UUID brother_id
DROP TABLE IF EXISTS public.contributions CASCADE;

-- Recreate contributions table with UUID brother_id
CREATE TABLE IF NOT EXISTS public.contributions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brother_id   UUID NOT NULL, -- Changed from INTEGER to UUID
  amount       NUMERIC(12,2) NOT NULL DEFAULT 300,
  month        TEXT NOT NULL, -- Format: YYYY-MM
  paid_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brother_id, month)
);

-- Enable RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "contributions_read" ON public.contributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contributions_insert" ON public.contributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contributions_update" ON public.contributions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "contributions_delete" ON public.contributions FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix PRT attendance table to use UUID brother_id
DROP TABLE IF EXISTS public.prt_attendance CASCADE;

CREATE TABLE IF NOT EXISTS public.prt_attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id   UUID NOT NULL REFERENCES public.prt_meetings(id) ON DELETE CASCADE,
  brother_id   UUID NOT NULL, -- Changed from INTEGER to UUID
  is_present   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(meeting_id, brother_id)
);

-- Enable RLS for PRT Attendance
ALTER TABLE public.prt_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prt_attendance_read" ON public.prt_attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prt_attendance_insert" ON public.prt_attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prt_attendance_update" ON public.prt_attendance FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the updated table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'contributions' AND table_schema = 'public'
ORDER BY ordinal_position;
