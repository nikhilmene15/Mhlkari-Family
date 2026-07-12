# Supabase Storage Setup

The image upload functionality requires proper Supabase storage configuration. Follow these steps to set up the storage bucket and permissions.

## 🚀 Quick Setup

### 1. Create the Bucket Manually (Recommended)

Since you're getting permission errors, create the bucket manually:

1. **Go to Supabase Dashboard → Storage**
2. **Click "New bucket"**
3. **Name:** `family-media`
4. **Public bucket:** ✅ Yes
5. **File size limit:** 10MB (recommended)
6. **Click "Save"**

### 2. Alternative: Run Simple Script

If manual creation doesn't work, try the simple script in `supabase/storage-setup-simple.sql`:

```sql
-- Create the family-media bucket (minimal permissions required)
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO NOTHING;

-- Check if bucket exists:
SELECT * FROM storage.buckets WHERE name = 'family-media';
```

### 3. Set Up Policies (Optional - May Require Admin Access)

If you have admin access, you can also set up policies. If not, the bucket should work with default settings for authenticated users.

```sql
-- Create the family-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO NOTHING;

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
```

### 2. Alternative: Manual Setup

If you prefer to set it up manually:

1. **Create Bucket:**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `family-media`
   - Public bucket: ✅ Yes
   - File size limit: 10MB (recommended)

2. **Set Up Policies:**
   - Go to Storage → Policies
   - Create these policies for the `family-media` bucket:

   **Policy 1 - Allow Uploads:**
   - Name: `Allow authenticated users to upload`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'family-media'`

   **Policy 2 - Allow Downloads:**
   - Name: `Allow authenticated users to read`
   - Allowed operation: `SELECT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'family-media'`

   **Policy 3 - Allow Updates:**
   - Name: `Allow users to update own files`
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'family-media'`

   **Policy 4 - Allow Deletes:**
   - Name: `Allow users to delete own files`
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'family-media'`

## 🔧 Troubleshooting

### Error: "Bucket not found"
- Run the storage setup script to create the bucket
- Check that the bucket name is exactly `family-media`

### Error: "Permission denied"
- Ensure RLS (Row Level Security) is enabled on storage.objects
- Check that all policies are created correctly
- Verify the user is authenticated

### Error: "File too large"
- The app has a 10MB limit per file
- You can adjust this in the bucket settings or in the code

## 📁 File Structure

Uploaded files will be stored in:
```
family-media/
├── photos/
│   ├── 1736659823123-abc123def456.jpg
│   ├── 1736659824456-xyz789uvw012.png
│   └── ...
```

## 🛡️ Security Notes

- All storage operations require authentication
- Files are uploaded with unique random names to prevent conflicts
- Public access is enabled for viewing, but upload requires authentication
- Consider implementing file type validation for additional security

## 📝 Environment Variables

Make sure your `.env.local` has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎯 Features Added

- ✅ Improved error handling with specific messages
- ✅ File size validation (10MB limit)
- ✅ File type validation (images only)
- ✅ Better upload progress tracking
- ✅ Album management page
- ✅ Navigation improvements
- ✅ Storage bucket setup automation
