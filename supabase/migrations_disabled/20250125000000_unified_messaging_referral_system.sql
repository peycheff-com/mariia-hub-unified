-- Migration for Unified Messaging and Referral System
-- Adds tables for unified inbox, automation flows, referral program, and Meta CAPI integration

-- 1. Unified Inbox System
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_content TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam', 'blocked')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'instagram', 'facebook', 'web')),
  channel_message_id TEXT,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_contact TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'queued', 'sent', 'delivered', 'read', 'failed')),
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Message Templates and Automation
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('booking', 'reminder', 'aftercare', 'promotion', 'review', 'referral', 'general')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'pl')),
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  template_type TEXT NOT NULL CHECK (template_type IN ('custom', 'template')),
  template_name TEXT, -- For WhatsApp Business API template names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('booking_created', 'booking_confirmed', 'booking_completed', 'booking_cancelled', 'payment_completed', 'aftercare_period', 'birthday', 'no_activity', 'abandoned_cart')),
  trigger_config JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  run_at TEXT CHECK (run_at IN ('immediate', 'scheduled', 'recurring')),
  schedule_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  recipient TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'failed', 'cancelled')),
  automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Referral Program System
CREATE TABLE IF NOT EXISTS referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_service', 'points', 'cash')),
  reward_value DECIMAL(10,2) NOT NULL,
  referrer_reward_type TEXT NOT NULL CHECK (referrer_reward_type IN ('discount_percentage', 'discount_fixed', 'free_service', 'points', 'cash')),
  referrer_reward_value DECIMAL(10,2) NOT NULL,
  max_uses_per_referrer INTEGER DEFAULT 10,
  max_uses_total INTEGER DEFAULT 1000,
  expiry_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  share_url TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email TEXT,
  referred_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'first_booking', 'completed', 'rewarded', 'expired', 'cancelled')),
  conversion_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  referral_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversion_date TIMESTAMP WITH TIME ZONE,
  reward_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Meta Conversions API (CAPI) Integration
CREATE TABLE IF NOT EXISTS meta_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT UNIQUE,
  event_time BIGINT NOT NULL,
  user_data JSONB,
  custom_data JSONB,
  action_source TEXT NOT NULL DEFAULT 'website',
  event_source_url TEXT,
  data_processing_options JSONB DEFAULT '[]',
  test_event_code TEXT,
  original_event_data JSONB,
  conversion_value DECIMAL(10,2),
  currency TEXT DEFAULT 'PLN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  meta_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT,
  pixel_id TEXT NOT NULL,
  user_data JSONB,
  custom_data JSONB,
  event_time BIGINT NOT NULL,
  event_source_url TEXT,
  action_source TEXT DEFAULT 'website',
  data_processing_options JSONB DEFAULT '[]',
  tracking_parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Communication Analytics
CREATE TABLE IF NOT EXISTS message_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  total_messages INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  average_response_time_minutes DECIMAL(10,2),
  conversation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, channel, direction)
);

CREATE TABLE IF NOT EXISTS referral_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  total_rewards_given DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, program_id)
);

-- 6. Social Media Integration for Unified Inbox
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  webhook_secret TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_status ON messages(status);

CREATE INDEX idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_messages_conversation_id ON scheduled_messages(conversation_id);
CREATE INDEX idx_scheduled_messages_status ON scheduled_messages(status);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_referrer_id ON referral_codes(referrer_id);
CREATE INDEX idx_referral_codes_status ON referral_codes(status);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_referral_date ON referrals(referral_date DESC);
CREATE INDEX idx_referrals_conversion_booking_id ON referrals(conversion_booking_id);

CREATE INDEX idx_automation_rules_is_active ON automation_rules(is_active);
CREATE INDEX idx_automation_rules_trigger_type ON automation_rules(trigger_type);

CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_channel ON message_templates(channel);
CREATE INDEX idx_message_templates_language ON message_templates(language);

CREATE INDEX idx_meta_conversions_event_name ON meta_conversions(event_name);
CREATE INDEX idx_meta_conversions_status ON meta_conversions(status);
CREATE INDEX idx_meta_conversions_event_time ON meta_conversions(event_time DESC);

CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE INDEX idx_social_connections_is_active ON social_connections(is_active);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Conversations
CREATE POLICY "Admins can view all conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    customer_id = auth.uid()
  );

CREATE POLICY "Admins can manage all conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Messages
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Referral Codes
CREATE POLICY "Admins can view all referral codes" ON referral_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own referral codes" ON referral_codes
  FOR SELECT USING (
    referrer_id = auth.uid()
  );

-- Referrals
CREATE POLICY "Admins can view all referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (
    referrer_id = auth.uid()
  );

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_referral_programs_updated_at BEFORE UPDATE ON referral_programs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_content = LEFT(NEW.content, 100),
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate 8-character random code
    new_code := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8));

    -- Check if it's unique
    IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;

    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral usage count
CREATE OR REPLACE FUNCTION update_referral_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_codes
  SET usage_count = usage_count + 1
  WHERE id = NEW.referral_code_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referral_usage_trigger
  AFTER INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_referral_usage();

-- Views for Analytics
CREATE OR REPLACE VIEW conversation_summary AS
SELECT
  c.id,
  c.customer_name,
  c.customer_email,
  c.customer_phone,
  c.status,
  c.priority,
  c.assigned_to,
  c.last_message_at,
  COUNT(m.id) as message_count,
  COUNT(CASE WHEN m.direction = 'inbound' THEN 1 END) as inbound_count,
  COUNT(CASE WHEN m.direction = 'outbound' THEN 1 END) as outbound_count,
  MAX(CASE WHEN m.direction = 'inbound' THEN m.created_at END) as last_inbound_at,
  MAX(CASE WHEN m.direction = 'outbound' THEN m.created_at END) as last_outbound_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.customer_name, c.customer_email, c.customer_phone, c.status, c.priority, c.assigned_to, c.last_message_at;

CREATE OR REPLACE VIEW referral_performance AS
SELECT
  rp.id,
  rp.name,
  rp.reward_type,
  rp.reward_value,
  COUNT(rc.id) as total_codes,
  COUNT(rf.id) as total_referrals,
  COUNT(CASE WHEN rf.status = 'completed' THEN 1 END) as successful_referrals,
  COALESCE(SUM(rf.metadata->>'reward_amount'::DECIMAL), 0) as total_rewards,
  ROUND(
    NULLIF(COUNT(CASE WHEN rf.status = 'completed' THEN 1 END), 0) * 100.0 /
    NULLIF(COUNT(rf.id), 0), 2
  ) as conversion_rate
FROM referral_programs rp
LEFT JOIN referral_codes rc ON rp.id = rc.program_id
LEFT JOIN referrals rf ON rc.id = rf.referral_code_id
GROUP BY rp.id, rp.name, rp.reward_type, rp.reward_value;

-- Insert default message templates
INSERT INTO message_templates (name, category, channel, language, subject, content, template_type, template_name) VALUES
  ('Booking Confirmation', 'booking', 'whatsapp', 'en', NULL, 'Your appointment at BM Beauty Studio is confirmed! 📅 {{service_name}} on {{date}} at {{time}}. We''ll send a reminder 24h before.', 'template', 'booking_confirmation'),
  ('Booking Confirmation SMS', 'booking', 'sms', 'en', NULL, 'Hi {{customer_name}}! Your booking at BM Beauty Studio is confirmed. {{service_name}} on {{date}} at {{time}}. Reply STOP to unsubscribe.', 'custom', NULL),
  ('24h Reminder', 'reminder', 'whatsapp', 'en', NULL, 'Reminder: Your appointment tomorrow at {{time}} for {{service_name}}. We can''t wait to see you! 💖', 'template', 'appointment_reminder'),
  ('Aftercare Tips', 'aftercare', 'whatsapp', 'en', NULL, 'After your {{service_name}} treatment, remember to {{aftercare_tips}}. Contact us if you have any questions!', 'custom', NULL),
  ('Review Request', 'review', 'whatsapp', 'en', NULL, 'How was your {{service_name}} experience? We''d love to hear your feedback! ⭐ Reply with your review.', 'custom', NULL),
  ('Welcome Referral', 'referral', 'whatsapp', 'en', NULL, 'Give a friend 10% off their first treatment and get {{reward}} for each successful referral! Share your code: {{referral_code}}', 'custom', NULL)
ON CONFLICT DO NOTHING;

-- Create default automation rules
INSERT INTO automation_rules (name, trigger_type, actions) VALUES
  ('Send Booking Confirmation', 'booking_confirmed',
    '[{"type": "send_message", "channel": "whatsapp", "template_name": "booking_confirmation", "delay_minutes": 0}]'),
  ('Send 24h Reminder', 'booking_confirmed',
    '[{"type": "send_message", "channel": "whatsapp", "template_name": "appointment_reminder", "delay_minutes": 1440}]'),
  ('Send Aftercare Tips', 'booking_completed',
    '[{"type": "send_message", "channel": "whatsapp", "template_name": "aftercare_tips", "delay_minutes": 180}]'),
  ('Request Review', 'booking_completed',
    '[{"type": "send_message", "channel": "whatsapp", "template_name": "review_request", "delay_minutes": 1440}]')
ON CONFLICT DO NOTHING;

-- Create default referral program
INSERT INTO referral_programs (name, description, reward_type, reward_value, referrer_reward_type, referrer_reward_value) VALUES
  ('Beauty Referral Program', 'Give 10% off to friends, earn 50 PLN for each successful referral', 'discount_percentage', 10.00, 'discount_fixed', 50.00)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referral_programs TO authenticated;
GRANT ALL ON message_templates TO authenticated;
GRANT ALL ON scheduled_messages TO authenticated;
GRANT ALL ON automation_rules TO authenticated;
GRANT ALL ON social_connections TO authenticated;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION update_referral_usage TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_last_message TO authenticated;

-- Create public read access for analytics views
GRANT SELECT ON conversation_summary TO authenticated;
GRANT SELECT ON referral_performance TO authenticated;