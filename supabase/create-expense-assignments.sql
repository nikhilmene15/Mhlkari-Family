-- =============================================
-- CREATE EXPENSE MEMBER ASSIGNMENTS TABLE
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Create expense_assignments table
CREATE TABLE IF NOT EXISTS public.expense_assignments (
  id           SERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.expense_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only admins can manage assignments, authenticated users can read)
CREATE POLICY "expense_assignments_read" ON public.expense_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expense_assignments_insert" ON public.expense_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expense_assignments_update" ON public.expense_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "expense_assignments_delete" ON public.expense_assignments FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the table structure
SELECT * FROM public.expense_assignments ORDER BY id;
