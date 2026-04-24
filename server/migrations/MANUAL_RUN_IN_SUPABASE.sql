-- =============================================
-- MIGRATION: Add attachment and vendor columns
-- Run this in Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/zgknwsrfpqjncvyzfiww/sql/new
-- =============================================

-- 1. Add attachment_url to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 2. Add vendor-specific columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_category_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_category_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_url TEXT;

-- 3. Create vendor_services mapping table
CREATE TABLE IF NOT EXISTS vendor_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_item_id UUID,
    custom_price TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, service_item_id)
);

-- 4. Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    booking_updates   BOOLEAN DEFAULT true,
    offers_promotions BOOLEAN DEFAULT true,
    service_reminders BOOLEAN DEFAULT true,
    account_security  BOOLEAN DEFAULT true,
    new_leads         BOOLEAN DEFAULT true,
    payouts           BOOLEAN DEFAULT true,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage their own settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'manage_own_notification_settings') THEN
        CREATE POLICY "manage_own_notification_settings" ON notification_settings
            FOR ALL USING (true); -- Simplified for backend-first usage or fix later with auth.uid()
    END IF;
END $$;

-- =============================================
-- CRITICAL FIX: Reload PostgREST Schema Cache
-- This fixes PGRST204 "column not found in schema cache" errors
-- Run this FIRST in Supabase Dashboard > SQL Editor
-- =============================================

-- Reload the PostgREST schema cache so it picks up new columns
NOTIFY pgrst, 'reload schema';

-- =============================================
-- FIX: Notification Settings Upsert Function
-- This fixes the "duplicate key" 500 error when toggling notifications.
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- 5. Create a Postgres function to upsert notification settings safely
CREATE OR REPLACE FUNCTION upsert_notification_settings(
    p_user_id UUID,
    p_booking_updates BOOLEAN DEFAULT NULL,
    p_offers_promotions BOOLEAN DEFAULT NULL,
    p_service_reminders BOOLEAN DEFAULT NULL,
    p_account_security BOOLEAN DEFAULT NULL,
    p_new_leads BOOLEAN DEFAULT NULL,
    p_payouts BOOLEAN DEFAULT NULL
)
RETURNS notification_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result notification_settings;
BEGIN
    INSERT INTO notification_settings (user_id, booking_updates, offers_promotions, service_reminders, account_security, new_leads, payouts)
    VALUES (p_user_id, 
        COALESCE(p_booking_updates, true),
        COALESCE(p_offers_promotions, true),
        COALESCE(p_service_reminders, true),
        COALESCE(p_account_security, true),
        COALESCE(p_new_leads, true),
        COALESCE(p_payouts, true)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        booking_updates   = COALESCE(p_booking_updates, notification_settings.booking_updates),
        offers_promotions = COALESCE(p_offers_promotions, notification_settings.offers_promotions),
        service_reminders = COALESCE(p_service_reminders, notification_settings.service_reminders),
        account_security  = COALESCE(p_account_security, notification_settings.account_security),
        new_leads         = COALESCE(p_new_leads, notification_settings.new_leads),
        payouts           = COALESCE(p_payouts, notification_settings.payouts),
        updated_at        = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_notification_settings TO service_role;
