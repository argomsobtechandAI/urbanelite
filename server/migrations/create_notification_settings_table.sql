-- ─────────────────────────────────────────────────────────────────────────────
-- Notification Settings Table
-- ─────────────────────────────────────────────────────────────────────────────

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
CREATE POLICY "manage_own_notification_settings" ON notification_settings
    FOR ALL
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
