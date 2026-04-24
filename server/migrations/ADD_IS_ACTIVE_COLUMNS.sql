-- ============================================================
-- MIGRATION: Add is_active columns for enable/disable support
-- Run this in: Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/<your-project>/sql/new
-- ============================================================

-- 1. Add is_active to users table (for disabling fraud users/vendors)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Add is_active to service_categories table (for enabling/disabling categories)
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. (Optional) Update all existing records to be active by default
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
UPDATE service_categories SET is_active = TRUE WHERE is_active IS NULL;
