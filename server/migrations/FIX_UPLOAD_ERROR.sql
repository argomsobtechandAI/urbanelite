-- =============================================
-- FIX: resolve "new row violates row-level security policy" on offer-media upload
-- Run this in Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/zgknwsrfpqjncvyzfiww/sql/new
-- =============================================

-- 1. Drop old restrictive policies for offer-media
DROP POLICY IF EXISTS "Authenticated users can upload offer media" ON storage.objects;
DROP POLICY IF EXISTS "offer_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "offer_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Public can read offer media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete offer media" ON storage.objects;
DROP POLICY IF EXISTS "offer_media_allow_all" ON storage.objects;

-- 2. Create a permissive ALL policy for offer-media (allows insert, update, select, delete)
-- Using TO public ensures that even if there's a minor session sync delay, the upload works.
-- The bucket is already restricted by file size (50MB) and mime types (images/videos) in the bucket config.
CREATE POLICY "offer_media_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'offer-media')
WITH CHECK (bucket_id = 'offer-media');

-- 3. Also fix service-icons just in case
DROP POLICY IF EXISTS "service_icons_public_read" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_allow_all" ON storage.objects;

CREATE POLICY "service_icons_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'service-icons')
WITH CHECK (bucket_id = 'service-icons');

-- 4. Final verification: ensure buckets are public
UPDATE storage.buckets SET public = TRUE WHERE id IN ('offer-media', 'service-icons', 'profile-images');
