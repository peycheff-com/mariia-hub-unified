-- PWA Features Migration
-- Adds tables for push notifications, device registrations, calendar sync, and QR check-ins

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  device_type TEXT, -- 'ios', 'android', 'web', 'desktop'
  user_agent TEXT
);

-- Device registrations for multi-device support
CREATE TABLE IF NOT EXISTS device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL, -- Unique device identifier
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web', 'desktop')),
  device_name TEXT,
  push_subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  app_version TEXT,
  os_version TEXT,
  user_agent TEXT,
  UNIQUE(user_id, device_id)
);

-- Calendar connections for sync
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  sync_preferences JSONB DEFAULT '{}', -- Store sync preferences
  UNIQUE(user_id, provider, email)
);

-- Calendar events sync log
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  external_event_id TEXT,
  sync_action TEXT NOT NULL CHECK (sync_action IN ('created', 'updated', 'deleted')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'pending')),
  sync_error TEXT,
  sync_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- QR Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id),
  method TEXT NOT NULL CHECK (method IN ('qr_code', 'manual', 'auto')),
  qr_data JSONB,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_location POINT, -- PostGIS point for location
  verified_by UUID REFERENCES profiles(id), -- Staff who verified
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR code tracking
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  code_data TEXT NOT NULL,
  signature TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES profiles(id),
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PWA Installation tracking
CREATE TABLE IF NOT EXISTS pwa_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  device_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web', 'desktop')),
  source TEXT, -- 'pwa-install', 'direct', 'shortcut'
  install_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  app_version TEXT,
  user_agent TEXT,
  is_first_install BOOLEAN DEFAULT false
);

-- Offline action queue
CREATE TABLE IF NOT EXISTS offline_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'booking', 'cancellation', 'review', etc.
  action_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
  error_message TEXT
);

-- Push notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('push', 'email', 'sms')),
  language TEXT DEFAULT 'en',
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  data_template JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'clicked', 'failed')),
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_active ON device_registrations(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active ON calendar_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_connection_id ON calendar_sync_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_check_ins_booking_id ON check_ins(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_time ON check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_qr_codes_booking_id ON qr_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires ON qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_used ON qr_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_pwa_installations_user_id ON pwa_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_pwa_installations_device_id ON pwa_installations(device_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON offline_action_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_retry ON offline_action_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Row Level Security (RLS) policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Device registrations policies
CREATE POLICY "Users can view own device registrations" ON device_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own device registrations" ON device_registrations
  FOR ALL USING (auth.uid() = user_id);

-- Calendar connections policies
CREATE POLICY "Users can manage own calendar connections" ON calendar_connections
  FOR ALL USING (auth.uid() = user_id);

-- Calendar sync log policies
CREATE POLICY "Users can view own calendar sync logs" ON calendar_sync_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = calendar_sync_log.connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  );

-- Check-ins policies
CREATE POLICY "Staff can view all check-ins" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Staff can create check-ins" ON check_ins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- QR codes policies
CREATE POLICY "Users can view own QR codes" ON qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = qr_codes.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all QR codes" ON qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- PWA installations policies
CREATE POLICY "Users can manage own PWA installations" ON pwa_installations
  FOR ALL USING (auth.uid() = user_id);

-- Offline action queue policies
CREATE POLICY "Users can manage own offline actions" ON offline_action_queue
  FOR ALL USING (auth.uid() = user_id);

-- Notification logs policies
CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, language, title_template, body_template, data_template) VALUES
  ('booking_reminder', 'push', 'en', 'Appointment Reminder', 'Your {{service_name}} appointment is tomorrow at {{time}}', '{"url": "/dashboard"}'),
  ('booking_confirmation', 'push', 'en', 'Booking Confirmed', 'Your {{service_name}} appointment has been confirmed for {{time}}', '{"url": "/dashboard"}'),
  ('booking_cancellation', 'push', 'en', 'Appointment Cancelled', 'Your {{service_name}} appointment has been cancelled', '{"url": "/dashboard"}'),
  ('payment_success', 'push', 'en', 'Payment Successful', 'Payment of {{amount}} for {{service_name}} has been processed', '{"url": "/dashboard"}'),
  ('promotion', 'push', 'en', 'Special Offer', '{{message}}', '{"url": "/promotions"}'),
  ('booking_reminder', 'push', 'pl', 'Przypomnienie o wizycie', 'Twoja wizyta {{service_name}} odbędzie się jutro o {{time}}', '{"url": "/dashboard"}'),
  ('booking_confirmation', 'push', 'pl', 'Rezerwacja potwierdzona', 'Twoja wizyta {{service_name}} została potwierdzona na {{time}}', '{"url": "/dashboard"}'),
  ('booking_cancellation', 'push', 'pl', 'Wizyta odwołana', 'Twoja wizyta {{service_name}} została odwołana', '{"url": "/dashboard"}'),
  ('payment_success', 'push', 'pl', 'Płatność pomyślna', 'Płatność {{amount}} za {{service_name}} została przetworzona', '{"url": "/dashboard"}'),
  ('promotion', 'push', 'pl', 'Specjalna oferta', '{{message}}', '{"url": "/promotions"}')
ON CONFLICT (name, type, language) DO NOTHING;

-- Create function to cleanup expired QR codes
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET is_used = true, used_at = NOW()
  WHERE expires_at < NOW() AND is_used = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old notification logs
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs
  WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to sync offline actions
CREATE OR REPLACE FUNCTION process_offline_actions()
RETURNS void AS $$
DECLARE
  action RECORD;
BEGIN
  FOR action IN
    SELECT * FROM offline_action_queue
    WHERE status = 'pending'
    AND next_retry_at <= NOW()
    ORDER BY created_at
  LOOP
    BEGIN
      -- Process the action based on type
      CASE action.action_type
        WHEN 'booking' THEN
          PERFORM process_booking_action(action.id, action.action_data);
        WHEN 'cancellation' THEN
          PERFORM process_cancellation_action(action.id, action.action_data);
        ELSE
          -- Unknown action type, mark as failed
          UPDATE offline_action_queue
          SET status = 'failed', error_message = 'Unknown action type'
          WHERE id = action.id;
      END CASE;
    EXCEPTION
      WHEN others THEN
        UPDATE offline_action_queue
        SET
          retry_count = retry_count + 1,
          next_retry_at = NOW() + (2 ^ retry_count) * INTERVAL '1 minute',
          error_message = SQLERRM
        WHERE id = action.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- These placeholder functions would need to be implemented based on your business logic
CREATE OR REPLACE FUNCTION process_booking_action(action_id UUID, action_data JSONB)
RETURNS void AS $$
BEGIN
  -- Implementation depends on your booking logic
  UPDATE offline_action_queue
  SET status = 'synced'
  WHERE id = action_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_cancellation_action(action_id UUID, action_data JSONB)
RETURNS void AS $$
BEGIN
  -- Implementation depends on your cancellation logic
  UPDATE offline_action_queue
  SET status = 'synced'
  WHERE id = action_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_push_subscriptions_timestamp
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_calendar_connections_timestamp
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_notification_templates_timestamp
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();