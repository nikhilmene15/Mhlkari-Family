    -- =============================================
    -- MINIMAL STORAGE SETUP (NO OWNER PERMISSIONS NEEDED)
    -- Run this in: Supabase Dashboard > SQL Editor
    -- =============================================

    -- Just create the bucket - this should work
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('family-media', 'family-media', true)
    ON CONFLICT (id) DO NOTHING;

    -- Check if bucket exists
    SELECT * FROM storage.buckets WHERE name = 'family-media';

    -- If bucket exists but uploads fail, you need to:
    -- 1. Go to Supabase Dashboard > Storage > Policies
    -- 2. Click "New policy"
    -- 3. Choose "For full custom access"
    -- 4. Name: "Allow family-media access"
    -- 5. Operation: "All"
    -- 6. Roles: "authenticated"
    -- 7. Policy definition: bucket_id = 'family-media'
    -- 8. Click "Save"
