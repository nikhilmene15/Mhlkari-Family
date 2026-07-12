-- =============================================
-- SIMPLE STORAGE SETUP (NO PERMISSIONS REQUIRED)
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Create the family-media bucket (this should work with basic permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO NOTHING;

-- If the above fails, you need to create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: family-media
-- 4. Public bucket: Yes
-- 5. Click "Save"

-- Then run this to check if bucket exists:
SELECT * FROM storage.buckets WHERE name = 'family-media';
