-- =============================================
-- MIGRATION: Add certification_docs to users
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Add certification_docs column to users table (array of image/pdf URLs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS certification_docs TEXT[] DEFAULT '{}';

-- 2. Add comment for clarity
COMMENT ON COLUMN users.certification_docs IS 'List of URLs to uploaded high-quality verification documents (Licenses, Certifications, etc. in Image or PDF format)';

-- 3. Verify column addition
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'certification_docs';
