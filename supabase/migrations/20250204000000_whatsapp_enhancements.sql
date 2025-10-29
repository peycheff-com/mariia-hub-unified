-- WhatsApp Enhancements Migration
-- Additions for advanced WhatsApp Business API features

-- Add WhatsApp opt-out field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Create WhatsApp quick replies table
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords TEXT[] NOT NULL,
  response TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create WhatsApp message queue table
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('template', 'text', 'image', 'document')),
  content JSONB NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create WhatsApp message logs table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  template_name TEXT,
  status TEXT NOT NULL,
  external_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create WhatsApp templates table for approved templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
  language TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  components JSONB NOT NULL,
  external_id TEXT, -- WhatsApp template ID
  rejection_reason TEXT,
  quality_rating TEXT CHECK (quality_rating IN ('GREEN', 'YELLOW', 'RED')),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create WhatsApp campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  segment_criteria JSONB DEFAULT '{}',
  schedule_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create WhatsApp campaign sends table
CREATE TABLE IF NOT EXISTS whatsapp_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_keywords ON whatsapp_quick_replies USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_active ON whatsapp_quick_replies(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_category ON whatsapp_quick_replies(category);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_status ON whatsapp_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_scheduled_at ON whatsapp_message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_priority ON whatsapp_message_queue(priority);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_to ON whatsapp_message_queue(to);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_to ON whatsapp_message_logs(to);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_type ON whatsapp_message_logs(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_created_at ON whatsapp_message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_template ON whatsapp_message_logs(template_name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON whatsapp_templates(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_schedule_at ON whatsapp_campaigns(schedule_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_template_id ON whatsapp_campaigns(template_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_sends_campaign_id ON whatsapp_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_sends_recipient_id ON whatsapp_campaign_sends(recipient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_sends_status ON whatsapp_campaign_sends(status);

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_quick_replies_updated_at BEFORE UPDATE ON whatsapp_quick_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default quick replies
INSERT INTO whatsapp_quick_replies (keywords, response, category) VALUES
  ARRAY['hello', 'hi', 'hey', 'czesc', 'dzień dobry'],
  'Hello! Welcome to Mariia Beauty Studio. How can I help you today? You can book an appointment, ask about our services, or get information about pricing.',
  'greeting',

  ARRAY['booking', 'appointment', 'book', 'umów', 'rezerwacja', 'wizyta'],
  'To book an appointment, please visit our website or reply with your preferred date and time. I''ll help you find the best available slot.',
  'booking',

  ARRAY['price', 'pricing', 'cost', 'cena', 'cennik'],
  'Our prices vary by service. Please let me know which service you''re interested in, and I''ll provide you with detailed pricing information.',
  'pricing',

  ARRAY['services', 'service', 'offer', 'oferta', 'zabiegi'],
  'We offer a wide range of beauty services including lip enhancements, brow lamination, PMU, and more. Which service would you like to know more about?',
  'services',

  ARRAY['location', 'address', 'where', 'gdzie', 'adres'],
  'We are located at ul. Prosta 123, Warsaw, Poland. We''re open Monday-Friday 9:00-21:00 and Saturday 10:00-18:00.',
  'location',

  ARRAY['cancel', 'cancellation', 'odwołaj', 'rezygnacja'],
  'To cancel your appointment, please reply with your appointment details or call us at +48 123 456 789. Cancellations must be made at least 24 hours in advance.',
  'cancellation',

  ARRAY['contact', 'phone', 'email', 'kontakt', 'telefon'],
  'You can reach us at:📞 Phone: +48 123 456 789📧 Email: info@mariia.studio📍 Visit: ul. Prosta 123, Warsaw',
  'contact',

  ARRAY['hours', 'open', 'close', 'godziny', 'otwarte'],
  'Our opening hours are:Monday-Friday: 9:00-21:00Saturday: 10:00-18:00Sunday: Closed',
  'hours',

  ARRAY['payment', 'pay', 'card', 'cash', 'płatność', 'płac'],
  'We accept cash, card, and bank transfers. Payment is due at the time of service.',
  'payment',

  ARRAY['stop', 'unsubscribe', 'opt-out', 'stop', 'rezygnuję'],
  'You will be opted out from WhatsApp messages. Reply START to opt back in.',
  'opt-out',

  ARRAY['start', 'subscribe', 'opt-in', 'start', 'zapis'],
  'Welcome back! You will now receive WhatsApp messages for your appointments and updates.',
  'opt-in'
ON CONFLICT DO NOTHING;

-- Create function to get WhatsApp analytics
CREATE OR REPLACE FUNCTION get_whatsapp_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sent', (SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'sent' AND created_at BETWEEN start_date AND end_date),
    'total_failed', (SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'failed' AND created_at BETWEEN start_date AND end_date),
    'by_type', (
      SELECT json_build_object(
        'template', (SELECT COUNT(*) FROM whatsapp_message_logs WHERE type = 'template' AND created_at BETWEEN start_date AND end_date),
        'text', (SELECT COUNT(*) FROM whatsapp_message_logs WHERE type = 'text' AND created_at BETWEEN start_date AND end_date),
        'image', (SELECT COUNT(*) FROM whatsapp_message_logs WHERE type = 'image' AND created_at BETWEEN start_date AND end_date)
      )
    ),
    'by_template', (
      SELECT COALESCE(json_object_agg(template_name, count), '{}'::json)
      FROM (
        SELECT template_name, COUNT(*) as count
        FROM whatsapp_message_logs
        WHERE template_name IS NOT NULL
        AND created_at BETWEEN start_date AND end_date
        GROUP BY template_name
      ) t
    ),
    'opt_out_rate', (
      SELECT CASE
        WHEN total = 0 THEN 0
        ELSE ROUND((opt_outed::decimal / total::decimal) * 100, 2)
      END
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE whatsapp_opt_out = true) as opt_outed,
          COUNT(*) as total
        FROM profiles
        WHERE phone IS NOT NULL
      ) stats
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to process WhatsApp queue
CREATE OR REPLACE FUNCTION process_whatsapp_queue()
RETURNS void AS $$
BEGIN
  -- Process pending messages that are due
  UPDATE whatsapp_message_queue
  SET status = 'processing'
  WHERE status = 'pending'
  AND (scheduled_at IS NULL OR scheduled_at <= NOW())
  RETURNING id;

  -- This would be called by a cron job or scheduled function
  -- Actual sending logic would be in the edge function
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_quick_replies
CREATE POLICY "Admins can manage quick replies" ON whatsapp_quick_replies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view active quick replies" ON whatsapp_quick_replies
    FOR SELECT USING (is_active = true);

-- RLS policies for whatsapp_message_logs
CREATE POLICY "Admins can view all logs" ON whatsapp_message_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS policies for whatsapp_templates
CREATE POLICY "Admins can manage templates" ON whatsapp_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view approved templates" ON whatsapp_templates
    FOR SELECT USING (status = 'approved');

-- RLS policies for whatsapp_campaigns
CREATE POLICY "Admins can manage campaigns" ON whatsapp_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_quick_replies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_message_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_message_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_campaign_sends TO authenticated;

GRANT EXECUTE ON FUNCTION get_whatsapp_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION process_whatsapp_queue TO authenticated;