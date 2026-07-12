-- =============================================
-- COMPLETE STORAGE SETUP FOR FAMILY MEDIA
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Create the family-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS temporarily to set policies
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for family-media bucket
CREATE POLICY "Allow authenticated users to upload to family-media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to read from family-media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update in family-media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete from family-media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify setup
SELECT 
  'Bucket exists' as status,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'family-media'

UNION ALL

SELECT 
  'RLS enabled' as status,
  tablename,
  CASE WHEN rowsecurity THEN 'enabled' ELSE 'disabled' END as public,
  '' as created_at
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage'

UNION ALL

SELECT 
  'Policies created' as status,
  policyname,
  cmd as public,
  '' as created_at
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
