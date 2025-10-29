-- Create communication_logs table for tracking all communications
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'sms', 'email', 'push')),
  recipient TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'scheduled', 'bounced', 'opened', 'clicked')),
  provider TEXT NOT NULL CHECK (provider IN ('twilio', 'resend', 'firebase', 'sendgrid')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- For analytics and reporting
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_name TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_communication_logs_type ON communication_logs(type);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_recipient ON communication_logs(recipient);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at);
CREATE INDEX idx_communication_logs_provider ON communication_logs(provider);
CREATE INDEX idx_communication_logs_campaign_id ON communication_logs(campaign_id);
CREATE INDEX idx_communication_logs_booking_id ON communication_logs(booking_id);
CREATE INDEX idx_communication_logs_user_id ON communication_logs(user_id);

-- Create analytics tables for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_parameters JSONB DEFAULT '{}',
  page_url TEXT,
  page_title TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_event_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_page_url ON analytics_events(page_url);

-- Create page_views table for detailed page analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer_url TEXT,
  time_on_page_seconds INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT FALSE,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_page_url ON page_views(page_url);
CREATE INDEX idx_page_views_entered_at ON page_views(entered_at);

-- Create conversion_events table for tracking conversions
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('booking', 'newsletter_signup', 'contact_form', 'purchase', 'registration')),
  conversion_value DECIMAL(10,2),
  currency TEXT DEFAULT 'PLN',
  items JSONB DEFAULT '[]',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversion_events_session_id ON conversion_events(session_id);
CREATE INDEX idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX idx_conversion_events_type ON conversion_events(conversion_type);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at);

-- Enable RLS
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for communication_logs
CREATE POLICY "Admins can view all communication logs"
  ON communication_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert communication logs"
  ON communication_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for analytics (read-only for most users)
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Similar policies for other tables
CREATE POLICY "Admins can view all page views"
  ON page_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversions"
  ON conversion_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert conversions"
  ON conversion_events FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_communication_logs_updated_at BEFORE UPDATE ON communication_logs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create view for communication statistics
CREATE OR REPLACE VIEW communication_stats AS
SELECT
  type,
  status,
  provider,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as count,
  COUNT(DISTINCT recipient) as unique_recipients
FROM communication_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY type, status, provider, DATE_TRUNC('day', created_at);

-- Create view for conversion funnel
CREATE OR REPLACE VIEW booking_funnel AS
WITH steps AS (
  SELECT
    'Service View' as step,
    COUNT(DISTINCT session_id) as users
  FROM analytics_events
  WHERE event_name = 'view_item'

  UNION ALL

  SELECT
    'Booking Started' as step,
    COUNT(DISTINCT session_id) as users
  FROM analytics_events
  WHERE event_name = 'begin_booking'

  UNION ALL

  SELECT
    'Time Selected' as step,
    COUNT(DISTINCT session_id) as users
  FROM analytics_events
  WHERE event_name = 'booking_step' AND event_parameters->>'step_number' = '2'

  UNION ALL

  SELECT
    'Details Completed' as step,
    COUNT(DISTINCT session_id) as users
  FROM analytics_events
  WHERE event_name = 'booking_step' AND event_parameters->>'step_number' = '3'

  UNION ALL

  SELECT
    'Booking Complete' as step,
    COUNT(DISTINCT session_id) as users
  FROM conversion_events
  WHERE conversion_type = 'booking'
)
SELECT
  step,
  users,
  LAG(users, 1, users) OVER (ORDER BY users DESC) - users as dropoff,
  ROUND(100.0 * users / FIRST_VALUE(users) OVER (ORDER BY users DESC), 2) as conversion_rate
FROM steps
ORDER BY users DESC;