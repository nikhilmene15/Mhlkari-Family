-- =============================================
-- STORAGE BUCKET SETUP FOR FAMILY MEDIA
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Create the family-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the family-media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'family-media' AND 
  auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
