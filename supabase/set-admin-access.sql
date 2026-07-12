-- =============================================
-- SET ADMIN ACCESS FOR YOUR USER
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- First, check your current user ID
SELECT 
  'Your user ID' as status,
  auth.uid() as current_user_id;

-- Check if you have a profile
SELECT 
  'Your profile' as status,
  id,
  full_name,
  role,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Update your role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Verify the change
SELECT 
  'Updated profile' as status,
  id,
  full_name,
  role,
  updated_at
FROM profiles 
WHERE id = auth.uid();

-- Alternative: If no profile exists, create one
INSERT INTO profiles (id, full_name, role)
VALUES (auth.uid(), 'Admin User', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
