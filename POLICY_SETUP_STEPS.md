# Storage Policy Setup - REQUIRED STEPS

## ⚠️ CRITICAL: You MUST do this manually in Supabase Dashboard

The bucket exists but has no policies. Follow these exact steps:

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com/dashboard

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - You should see the "family-media" bucket

3. **Go to Policies Tab**
   - Click on the "Policies" tab at the top
   - You'll see it says "No policies yet"

4. **Create New Policy**
   - Click the "New policy" button
   - Select "For full custom access" template

5. **Fill in Policy Details:**
   ```
   Policy name: Allow family-media access
   Allowed operation: All
   Target roles: authenticated
   
   Policy definition (paste this exactly):
   bucket_id = 'family-media'
   ```

6. **Save the Policy**
   - Click "Review"
   - Click "Save policy"

7. **Test Upload**
   - Go back to your app
   - Try uploading an image
   - Should work now!

## Alternative: If you have database admin access

Run this SQL as a database admin/owner:

```sql
-- Disable RLS completely (quick fix)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Why This Happens

- The bucket exists ✅
- But RLS (Row Level Security) is enabled on storage.objects
- Without policies, RLS blocks all operations
- You need to either:
  - Add policies (manual steps above)
  - OR disable RLS (requires admin access)

## Verification

After setting the policy, you should see:
- Policy name: "Allow family-media access"
- Status: Active
- Upload should work immediately
