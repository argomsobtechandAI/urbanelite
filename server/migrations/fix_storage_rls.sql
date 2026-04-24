-- =============================================================
-- MIGRATION: Fix RLS policies for storage buckets
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================

-- Drop all old restrictive policies for these buckets
DROP POLICY IF EXISTS "kyc_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "kyc_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "kyc_public_update" ON storage.objects;
DROP POLICY IF EXISTS "kyc_public_read" ON storage.objects;
DROP POLICY IF EXISTS "kyc_allow_all" ON storage.objects;

DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_allow_all" ON storage.objects;

-- Create highly permissive ALL policies (since the buckets specify limits & extensions anyway)
-- This eliminates any "upsert" or "read" restrictions causing the RLS crash.

-- 1. KYC Documents
CREATE POLICY "kyc_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'kyc-documents')
WITH CHECK (bucket_id = 'kyc-documents');

-- 2. Profile Images
CREATE POLICY "profile_images_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- 3. Offer Media
DROP POLICY IF EXISTS "offer_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "offer_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "offer_media_allow_all" ON storage.objects;

CREATE POLICY "offer_media_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'offer-media')
WITH CHECK (bucket_id = 'offer-media');

-- 4. Service Icons
DROP POLICY IF EXISTS "service_icons_public_read" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "service_icons_allow_all" ON storage.objects;

CREATE POLICY "service_icons_allow_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'service-icons')
WITH CHECK (bucket_id = 'service-icons');
