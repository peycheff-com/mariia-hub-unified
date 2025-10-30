-- Comprehensive Communication Platform Database Schema
-- Migration: Add notification and communication system tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Communication Channels Enum
CREATE TYPE communication_channel AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'in_app',
  'push',
  'webhook'
);

-- Message Direction Enum
CREATE TYPE message_direction AS ENUM (
  'inbound',
  'outbound'
);

-- Message Status Enum
CREATE TYPE message_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
  'bounced',
  'spam'
);

-- Message Type Enum
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'file',
  'system',
  'template'
);

-- Priority Enum
CREATE TYPE priority_level AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Thread Status Enum
CREATE TYPE thread_status AS ENUM (
  'open',
  'closed',
  'archived',
  'spam'
);

-- Campaign Status Enum
CREATE TYPE campaign_status AS ENUM (
  'draft',
  'scheduled',
  'sending',
  'sent',
  'paused',
  'cancelled'
);

-- Trigger Events Enum
CREATE TYPE trigger_event AS ENUM (
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'payment_received',
  'payment_failed',
  'user_registered',
  'user_birthday',
  'service_reminder',
  'rebooking_suggested',
  'feedback_requested',
  'custom'
);

-- Client Communication Preferences
CREATE TABLE client_communication_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel communication_channel NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  preferred_time TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Warsaw',
  frequency_limit_hours INTEGER DEFAULT 24,
  do_not_disturb_start TIME DEFAULT '22:00:00',
  do_not_disturb_end TIME DEFAULT '08:00:00',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel)
);

-- Message Templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(500),
  content TEXT NOT NULL,
  channel communication_channel NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Settings (Platform-wide)
CREATE TABLE communication_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel communication_channel NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Threads (Conversations)
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  channel communication_channel NOT NULL,
  subject VARCHAR(500),
  last_message_at TIMESTAMPTZ,
  status thread_status DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority priority_level DEFAULT 'normal',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  external_id VARCHAR(255), -- For external service message IDs
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  direction message_direction NOT NULL,
  status message_status DEFAULT 'pending',
  channel communication_channel NOT NULL,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Attachments
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event trigger_event NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Messages
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  channel communication_channel NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status message_status DEFAULT 'scheduled',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Management
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type communication_channel NOT NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  subject VARCHAR(500),
  content TEXT NOT NULL,
  target_audience JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status campaign_status DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Sends (Tracking individual campaign messages)
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status message_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Analytics
CREATE TABLE message_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Queue (For reliable message processing)
CREATE TABLE delivery_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel communication_channel NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Media Integrations
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'linkedin', etc.
  platform_user_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Feedback Collection
CREATE TABLE feedback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'nps', 'satisfaction', 'detailed'
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal Team Communications
CREATE TABLE internal_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority priority_level DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication History (Aggregated view)
CREATE TABLE communication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  channel communication_channel NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_client_communication_preferences_user_id ON client_communication_preferences(user_id);
CREATE INDEX idx_message_threads_client_id ON message_threads(client_id);
CREATE INDEX idx_message_threads_booking_id ON message_threads(booking_id);
CREATE INDEX idx_message_threads_status ON message_threads(status);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_scheduled_for ON messages(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_messages_recipient_id ON scheduled_messages(recipient_id);
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_recipient_id ON campaign_sends(recipient_id);
CREATE INDEX idx_message_analytics_message_id ON message_analytics(message_id);
CREATE INDEX idx_delivery_queue_status ON delivery_queue(status);
CREATE INDEX idx_delivery_queue_next_retry_at ON delivery_queue(next_retry_at);
CREATE INDEX idx_automation_rules_trigger_event ON automation_rules(trigger_event);
CREATE INDEX idx_automation_rules_is_active ON automation_rules(is_active);
CREATE INDEX idx_feedback_requests_booking_id ON feedback_requests(booking_id);
CREATE INDEX idx_communication_history_user_id ON communication_history(user_id);
CREATE INDEX idx_communication_history_booking_id ON communication_history(booking_id);

-- Row Level Security (RLS) Policies
ALTER TABLE client_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client communication preferences
CREATE POLICY "Users can view own communication preferences"
  ON client_communication_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own communication preferences"
  ON client_communication_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for message threads (staff can view all, clients view own)
CREATE POLICY "Staff can view all message threads"
  ON message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Clients can view own message threads"
  ON message_threads FOR SELECT
  USING (client_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Staff can view all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Clients can view own messages"
  ON messages FOR SELECT
  USING (
    recipient_id = auth.uid()
    OR sender_id = auth.uid()
  );

-- RLS Policies for feedback requests
CREATE POLICY "Users can view own feedback requests"
  ON feedback_requests FOR SELECT
  USING (client_id = auth.uid());

-- RLS Policies for communication history
CREATE POLICY "Staff can view all communication history"
  ON communication_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can view own communication history"
  ON communication_history FOR SELECT
  USING (user_id = auth.uid());

-- Functions for automated workflows
CREATE OR REPLACE FUNCTION schedule_booking_communications()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule confirmation message
  INSERT INTO scheduled_messages (
    template_id,
    recipient_id,
    booking_id,
    channel,
    scheduled_for,
    content,
    metadata
  )
  SELECT
    t.id,
    NEW.user_id,
    NEW.id,
    'email',
    NOW(),
    t.content,
    jsonb_build_object('booking_id', NEW.id, 'event_type', 'booking_created')
  FROM message_templates t
  WHERE t.category = 'booking_confirmation'
  AND t.channel = 'email'
  AND t.is_active = true
  LIMIT 1;

  -- Schedule 24-hour reminder
  INSERT INTO scheduled_messages (
    template_id,
    recipient_id,
    booking_id,
    channel,
    scheduled_for,
    content,
    metadata
  )
  SELECT
    t.id,
    NEW.user_id,
    NEW.id,
    'sms',
    (NEW.booking_date || ' ' || NEW.start_time)::timestamp - INTERVAL '24 hours',
    t.content,
    jsonb_build_object('booking_id', NEW.id, 'event_type', 'reminder_24h')
  FROM message_templates t
  WHERE t.category = 'booking_reminder'
  AND t.channel = 'sms'
  AND t.is_active = true
  LIMIT 1;

  -- Schedule 2-hour reminder
  INSERT INTO scheduled_messages (
    template_id,
    recipient_id,
    booking_id,
    channel,
    scheduled_for,
    content,
    metadata
  )
  SELECT
    t.id,
    NEW.user_id,
    NEW.id,
    'sms',
    (NEW.booking_date || ' ' || NEW.start_time)::timestamp - INTERVAL '2 hours',
    t.content,
    jsonb_build_object('booking_id', NEW.id, 'event_type', 'reminder_2h')
  FROM message_templates t
  WHERE t.category = 'booking_reminder'
  AND t.channel = 'sms'
  AND t.is_active = true
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically schedule communications when booking is created
CREATE TRIGGER schedule_booking_communications_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION schedule_booking_communications();

-- Function to check client communication preferences
CREATE OR REPLACE FUNCTION can_send_message(
  p_user_id UUID,
  p_channel communication_channel
) RETURNS BOOLEAN AS $$
DECLARE
  pref_enabled BOOLEAN;
  pref_time TIME;
  cur_time TIME;
  pref_start TIME;
  pref_end TIME;
  last_message TIMESTAMPTZ;
  min_interval INTERVAL;
BEGIN
  -- Check if user has enabled this channel
  SELECT is_enabled, preferred_time
  INTO pref_enabled, pref_time
  FROM client_communication_preferences
  WHERE user_id = p_user_id
  AND channel = p_channel;

  -- If no preference found, assume enabled
  IF pref_enabled IS NULL THEN
    RETURN TRUE;
  END IF;

  -- If channel is disabled, return false
  IF NOT pref_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check do not disturb hours
  SELECT do_not_disturb_start, do_not_disturb_end
  INTO pref_start, pref_end
  FROM client_communication_preferences
  WHERE user_id = p_user_id
  AND channel = p_channel;

  cur_time := LOCALTIME;

  -- If current time is in do not disturb period, return false
  IF cur_time >= pref_start AND cur_time <= pref_end THEN
    RETURN FALSE;
  END IF;

  -- Check frequency limits
  SELECT max(last_message_at, created_at)
  INTO last_message
  FROM communication_history
  WHERE user_id = p_user_id
  AND channel = p_channel
  AND created_at > NOW() - INTERVAL '24 hours';

  IF last_message IS NOT NULL THEN
    -- Check if enough time has passed since last message
    SELECT (frequency_limit_hours || ' hours')::INTERVAL
    INTO min_interval
    FROM client_communication_preferences
    WHERE user_id = p_user_id
    AND channel = p_channel;

    IF NOW() < last_message + min_interval THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update communication history
CREATE OR REPLACE FUNCTION log_communication_event(
  p_user_id UUID,
  p_booking_id UUID DEFAULT NULL,
  p_channel communication_channel,
  p_event_type VARCHAR(100),
  p_summary TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  history_id UUID;
BEGIN
  INSERT INTO communication_history (
    user_id,
    booking_id,
    channel,
    event_type,
    summary,
    metadata
  ) VALUES (
    p_user_id,
    p_booking_id,
    p_channel,
    p_event_type,
    p_summary,
    p_metadata
  ) RETURNING id INTO history_id;

  RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE client_communication_preferences IS 'Stores communication preferences for each client';
COMMENT ON TABLE message_templates IS 'Reusable message templates for different communication types';
COMMENT ON TABLE message_threads IS 'Conversation threads for organizing messages';
COMMENT ON TABLE messages IS 'Individual messages sent or received';
COMMENT ON TABLE automation_rules IS 'Rules for automated communication workflows';
COMMENT ON TABLE scheduled_messages IS 'Messages scheduled for future delivery';
COMMENT ON TABLE campaigns IS 'Marketing campaigns and bulk communications';
COMMENT ON TABLE delivery_queue IS 'Queue for reliable message delivery with retry logic';
COMMENT ON TABLE message_analytics IS 'Tracking events for message analytics and reporting';

-- Initialize default communication settings
INSERT INTO communication_settings (channel, settings) VALUES
('email', '{"provider": "resend", "from_email": "noreply@mariaborysevych.com", "reply_to": "support@mariaborysevych.com"}'),
('sms', '{"provider": "twilio", "from_number": "+48123456789", "max_length": 160}'),
('whatsapp', '{"provider": "twilio", "from_number": "+48123456789", "template_approval_required": true}'),
('push', '{"provider": "firebase", "service_account_key": "encrypted"}'),
('in_app', '{"realtime_updates": true, "max_storage_days": 30}');

-- Initialize default message templates
INSERT INTO message_templates (name, category, subject, content, channel, language, variables) VALUES
('Booking Confirmation', 'booking_confirmation', 'Your appointment is confirmed!',
 'Dear {{client_name}},\n\nYour appointment for {{service_title}} on {{booking_date}} at {{booking_time}} has been confirmed.\n\nLocation: {{location}}\nDuration: {{duration}} minutes\nPrice: {{price}} {{currency}}\n\nWe look forward to seeing you!\n\nBest regards,\nMariia Hub Team',
 'email', 'en', '{"client_name": "string", "service_title": "string", "booking_date": "string", "booking_time": "string", "location": "string", "duration": "number", "price": "number", "currency": "string"}'),

'Booking Reminder 24h', 'booking_reminder', NULL,
 'Hi {{client_name}}! Reminder: Your appointment for {{service_title}} is tomorrow at {{booking_time}}. See you at {{location}}! Reply CANCEL to reschedule.',
 'sms', 'en', '{"client_name": "string", "service_title": "string", "booking_time": "string", "location": "string"}'),

'Booking Reminder 2h', 'booking_reminder', NULL,
 'Hi {{client_name}}! Quick reminder: Your appointment for {{service_title}} is in 2 hours at {{booking_time}}. We''re ready for you! 🎉',
 'sms', 'en', '{"client_name": "string", "service_title": "string", "booking_time": "string"}'),

'Payment Confirmation', 'payment_confirmation', 'Payment received',
 'Dear {{client_name}},\n\nWe''ve received your payment of {{amount}} {{currency}} for {{service_title}} on {{booking_date}}.\n\nPayment ID: {{payment_id}}\nStatus: Confirmed\n\nThank you for your business!\n\nMariia Hub Team',
 'email', 'en', '{"client_name": "string", "amount": "number", "currency": "string", "service_title": "string", "booking_date": "string", "payment_id": "string"}'),

'Welcome New Client', 'welcome', 'Welcome to Mariia Hub!',
 'Dear {{client_name}},\n\nWelcome to Mariia Hub! We''re thrilled to have you as our client.\n\nAs a new client, you''ll receive:\n- Personalized service recommendations\n- Priority booking for popular services\n- Exclusive member benefits\n\nBook your first appointment and experience the difference!\n\nBest regards,\nMariia Hub Team',
 'email', 'en', '{"client_name": "string"}'),

'Polish - Booking Confirmation', 'booking_confirmation', 'Twoje wizyta została potwierdzona!',
 'Drogi/Droga {{client_name}},\n\nTwoja wizyta na {{service_title}} w dniu {{booking_date}} o godzinie {{booking_time}} została potwierdzona.\n\nLokalizacja: {{location}}\nCzas trwania: {{duration}} minut\nCena: {{price}} {{currency}}\n\nCieszymy się na spotkanie z Tobą!\n\nZ pozdrowieniami,\nZespół Mariia Hub',
 'email', 'pl', '{"client_name": "string", "service_title": "string", "booking_date": "string", "booking_time": "string", "location": "string", "duration": "number", "price": "number", "currency": "string"}'),

'Polish - Booking Reminder', 'booking_reminder', NULL,
 'Cześć {{client_name}}! Przypomnienie: Twoja wizyta na {{service_title}} jutro o {{booking_time}}. Do zobaczenia w {{location}}! Odpisz ANULUJ aby przełożyć.',
 'sms', 'pl', '{"client_name": "string", "service_title": "string", "booking_time": "string", "location": "string"}');