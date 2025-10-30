-- Support Infrastructure Migration
-- Creates comprehensive support system for luxury beauty/fitness platform

-- Support-related custom types
CREATE TYPE ticket_channel AS ENUM ('email', 'chat', 'phone', 'web', 'mobile_app', 'social_media');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'escalated');
CREATE TYPE ticket_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE ticket_category AS ENUM ('booking_issue', 'payment_problem', 'service_inquiry', 'technical_support', 'complaint', 'feature_request', 'general', 'billing', 'account_management');
CREATE TYPE sla_status AS ENUM ('on_track', 'at_risk', 'breached', 'exceeded');
CREATE TYPE support_team_role AS ENUM ('agent', 'senior_agent', 'team_lead', 'manager', 'specialist');

-- Support tickets table with comprehensive tracking
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL GENERATED ALWAYS AS ('SUP' || LPAD(EXTRACT(MILLISECONDS FROM now())::TEXT, 9, '0')) STORED,

  -- Customer information
  user_id UUID REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,

  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'general',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  channel ticket_channel NOT NULL,

  -- Routing and assignment
  assigned_agent_id UUID REFERENCES profiles(id),
  assigned_team_id UUID,
  escalation_level INTEGER DEFAULT 0,

  -- SLA tracking
  sla_status sla_status DEFAULT 'on_track',
  sla_response_deadline TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Related entities
  booking_id UUID REFERENCES bookings(id),
  service_id UUID REFERENCES services(id),

  -- Additional tracking
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  internal_notes TEXT,
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support ticket conversations/communications
CREATE TABLE IF NOT EXISTS ticket_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Communication details
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('customer_message', 'agent_message', 'system_note', 'internal_note', 'email_sent', 'email_received')),
  channel ticket_channel NOT NULL,

  -- Sender information
  sender_id UUID REFERENCES auth.users(id), -- Can be customer or agent
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  is_internal BOOLEAN DEFAULT false,

  -- Attachments and media
  attachments TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base categories
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES kb_categories(id),
  icon TEXT,
  color TEXT DEFAULT '#8B4513',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base articles with multilingual support
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES kb_categories(id),

  -- SEO and identification
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,

  -- Content with multilingual support
  content_en TEXT,
  content_pl TEXT,
  summary_en TEXT,
  summary_pl TEXT,

  -- Classification
  tags TEXT[],
  difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  estimated_read_time INTEGER, -- in minutes

  -- Media
  featured_image_url TEXT,
  video_url TEXT,
  attachments TEXT[],

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Status and workflow
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,

  -- Related services for contextual help
  related_service_ids UUID[],

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Knowledge base search analytics
CREATE TABLE IF NOT EXISTS kb_search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  search_language TEXT DEFAULT 'en',
  results_count INTEGER,
  clicked_article_id UUID REFERENCES kb_articles(id),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Support teams and agents
CREATE TABLE IF NOT EXISTS support_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  team_email TEXT,
  specialty_areas TEXT[], -- Array of ticket categories they handle
  working_hours JSONB, -- JSON object with schedule
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support agents with extended profiles
CREATE TABLE IF NOT EXISTS support_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  team_id UUID REFERENCES support_teams(id),

  -- Agent details
  agent_level support_team_role NOT NULL DEFAULT 'agent',
  specializations TEXT[], -- Array of categories they specialize in
  languages TEXT[] DEFAULT '{en}', -- Languages they support
  max_concurrent_tickets INTEGER DEFAULT 10,

  -- Performance metrics
  avg_response_time INTEGER, -- in minutes
  customer_satisfaction_avg DECIMAL(3,2),
  tickets_resolved INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_on_break BOOLEAN DEFAULT false,
  break_reason TEXT,

  -- Config
  working_hours JSONB,
  auto_assign_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- SLA (Service Level Agreement) policies
CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- SLA targets (in minutes)
  first_response_target INTEGER NOT NULL, -- Target first response time
  resolution_target INTEGER NOT NULL, -- Target resolution time

  -- Applicability
  priority ticket_priority NOT NULL,
  category ticket_category,
  customer_tier TEXT, -- 'vip', 'premium', 'standard', etc.

  -- Business hours configuration
  business_hours JSONB, -- When SLA clock runs
  holiday_calendar JSONB, -- Days when SLA is paused

  -- Alert thresholds
  warning_threshold_percentage INTEGER DEFAULT 80, -- Warning at 80% of SLA
  critical_threshold_percentage INTEGER DEFAULT 95, -- Critical at 95% of SLA

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket escalations
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Escalation details
  from_agent_id UUID REFERENCES support_agents(id),
  to_agent_id UUID REFERENCES support_agents(id),
  from_team_id UUID REFERENCES support_teams(id),
  to_team_id UUID REFERENCES support_teams(id),

  escalation_reason TEXT NOT NULL,
  escalation_type TEXT NOT NULL CHECK (escalation_type IN ('manual', 'automatic', 'sla_breach', 'customer_request')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer satisfaction surveys
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Survey responses
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  agent_rating INTEGER CHECK (agent_rating >= 1 AND agent_rating <= 5),
  resolution_rating INTEGER CHECK (resolution_rating >= 1 AND resolution_rating <= 5),

  -- Feedback
  feedback TEXT,
  would_recommend BOOLEAN,
  suggestions TEXT,

  -- Context
  survey_sent_at TIMESTAMPTZ,
  survey_completed_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Support analytics and metrics
CREATE TABLE IF NOT EXISTS support_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,

  -- Ticket volume metrics
  new_tickets INTEGER DEFAULT 0,
  resolved_tickets INTEGER DEFAULT 0,
  escalated_tickets INTEGER DEFAULT 0,

  -- Time metrics (in minutes)
  avg_first_response_time INTEGER DEFAULT 0,
  avg_resolution_time INTEGER DEFAULT 0,

  -- Quality metrics
  customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
  first_contact_resolution_rate DECIMAL(5,2) DEFAULT 0,

  -- SLA compliance
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0,

  -- Agent metrics
  active_agents INTEGER DEFAULT 0,
  agent_utilization_rate DECIMAL(5,2) DEFAULT 0,

  -- Channel breakdown
  channel_breakdown JSONB DEFAULT '{}', -- {email: 10, chat: 5, phone: 3}

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(metric_date)
);

-- Canned responses/templates for common queries
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category ticket_category NOT NULL,
  shortcut TEXT UNIQUE, -- Quick keyboard shortcut

  -- Content with multilingual support
  content_en TEXT NOT NULL,
  content_pl TEXT,

  -- Variables that can be inserted (like {{customer_name}})
  variables TEXT[],

  -- Usage analytics
  usage_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support integrations (chat systems, phone systems, etc.)
CREATE TABLE IF NOT EXISTS support_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type TEXT NOT NULL, -- 'livechat', 'phone', 'email', 'social'
  integration_name TEXT NOT NULL,
  configuration JSONB NOT NULL, -- Integration-specific config
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_agent ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla_deadline ON support_tickets(sla_resolution_deadline);
CREATE INDEX IF NOT EXISTS idx_support_tickets_booking_id ON support_tickets(booking_id);

CREATE INDEX IF NOT EXISTS idx_ticket_conversations_ticket_id ON ticket_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_conversations_created_at ON ticket_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_conversations_sender_id ON ticket_conversations(sender_id);

CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_kb_articles_view_count ON kb_articles(view_count);

CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_active ON kb_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_support_agents_team ON support_agents(team_id);
CREATE INDEX IF NOT EXISTS idx_support_agents_active ON support_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_support_agents_level ON support_agents(agent_level);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_ticket ON satisfaction_surveys(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_completed_at ON satisfaction_surveys(survey_completed_at);

-- Updated_at trigger for support tables
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_conversations_updated_at BEFORE UPDATE ON ticket_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_categories_updated_at BEFORE UPDATE ON kb_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON kb_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_teams_updated_at BEFORE UPDATE ON support_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_agents_updated_at BEFORE UPDATE ON support_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_policies_updated_at BEFORE UPDATE ON sla_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_escalations_updated_at BEFORE UPDATE ON ticket_escalations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canned_responses_updated_at BEFORE UPDATE ON canned_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_integrations_updated_at BEFORE UPDATE ON support_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for support tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Support agents can view assigned tickets" ON support_tickets
    FOR SELECT USING (
        assigned_agent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM support_agents
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can view all tickets" ON support_tickets
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Support agents can update assigned tickets" ON support_tickets
    FOR UPDATE USING (
        assigned_agent_id = auth.uid() OR
        has_role(auth.uid(), 'admin')
    );

-- RLS Policies for ticket conversations
CREATE POLICY "Users can view own ticket conversations" ON ticket_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = ticket_conversations.ticket_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Support agents can view assigned ticket conversations" ON ticket_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = ticket_conversations.ticket_id
            AND (st.assigned_agent_id = auth.uid() OR EXISTS (
                SELECT 1 FROM support_agents
                WHERE user_id = auth.uid() AND is_active = true
            ))
        )
    );

CREATE POLICY "Admins can view all ticket conversations" ON ticket_conversations
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for knowledge base
CREATE POLICY "Anyone can view published articles" ON kb_articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all articles" ON kb_articles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for knowledge base categories
CREATE POLICY "Anyone can view active categories" ON kb_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON kb_categories
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for satisfaction surveys
CREATE POLICY "Users can view own surveys" ON satisfaction_surveys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = satisfaction_surveys.ticket_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Support agents can view assigned surveys" ON satisfaction_surveys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = satisfaction_surveys.ticket_id
            AND (st.assigned_agent_id = auth.uid() OR has_role(auth.uid(), 'admin'))
        )
    );

-- Insert default knowledge base categories
INSERT INTO kb_categories (name, description, slug, icon, sort_order) VALUES
('Getting Started', 'Basic guides for using our platform', 'getting-started', '📘', 1),
('Booking & Appointments', 'Help with booking services and managing appointments', 'booking-appointments', '📅', 2),
('Payments & Billing', 'Payment methods, invoices, and billing questions', 'payments-billing', '💳', 3),
('Services', 'Information about our beauty and fitness services', 'services', '✨', 4),
('Technical Support', 'Technical issues and troubleshooting', 'technical-support', '🔧', 5),
('Account Management', 'Managing your account and profile', 'account-management', '👤', 6),
('Policies & Procedures', 'Our policies, terms, and procedures', 'policies-procedures', '📋', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert default SLA policies
INSERT INTO sla_policies (name, description, first_response_target, resolution_target, priority) VALUES
('Urgent Response SLA', 'For urgent issues requiring immediate attention', 15, 120, 'urgent'),
('High Priority SLA', 'For high priority issues', 60, 480, 'high'),
('Medium Priority SLA', 'Standard service level', 240, 1440, 'medium'),
('Low Priority SLA', 'For non-urgent inquiries', 480, 2880, 'low')
ON CONFLICT (name) DO NOTHING;

-- Insert default canned responses
INSERT INTO canned_responses (title, category, content_en, content_pl, variables) VALUES
('Booking Confirmation', 'booking_issue', 'Dear {{customer_name}}, your booking for {{service_name}} on {{booking_date}} at {{booking_time}} has been confirmed. Please arrive 10 minutes early. If you need to reschedule, please let us know at least 24 hours in advance.', 'Szanowny/a {{customer_name}}, Pana/Pani rezerwacja na {{service_name}} w dniu {{booking_date}} o godzinie {{booking_time}} została potwierdzona. Prosimy przybyć 10 minut wcześniej. W przypadku potrzeby zmiany terminu, prosimy o informację co najmniej 24 godziny wcześniej.', ARRAY['customer_name', 'service_name', 'booking_date', 'booking_time']),
('Payment Issue Resolution', 'payment_problem', 'We apologize for the payment issue you experienced. We have investigated the matter and {{resolution_action}}. No further action is needed from your side at this time.', 'Przepraszamy za problem z płatnością. Zbadaliśmy sprawę i {{resolution_action}}. W tym momencie nie jest wymagana żadna dalsza akcja z Pana/Pani strony.', ARRAY['resolution_action']),
('Service Information', 'service_inquiry', 'Thank you for your interest in {{service_name}}. {{service_description}}. The duration is {{duration}} minutes and the price is {{price}} {{currency}}. Would you like to book an appointment?', 'Dziękujemy za zainteresowanie {{service_name}}. {{service_description}}. Czas trwania to {{duration}} minut, a cena to {{price}} {{currency}}. Czy chciałby/Chciałaby Pan/Pani umówić wizytę?', ARRAY['service_name', 'service_description', 'duration', 'price', 'currency'])
ON CONFLICT (shortcut) DO NOTHING;

-- Function to generate automatic ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  timestamp_part TEXT;
  sequence_part TEXT;
BEGIN
  timestamp_part := EXTRACT(EPOCH FROM now())::TEXT;
  sequence_part := LPAD(floor(random() * 10000)::TEXT, 4, '0');
  new_number := 'SUP' || timestamp_part || sequence_part;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = new_number) LOOP
    sequence_part := LPAD(floor(random() * 10000)::TEXT, 4, '0');
    new_number := 'SUP' || timestamp_part || sequence_part;
  END LOOP;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SLA deadlines based on policies
CREATE OR REPLACE FUNCTION calculate_sla_deadlines(
  ticket_priority ticket_priority,
  ticket_category ticket_category DEFAULT NULL
)
RETURNS TABLE(
  response_deadline TIMESTAMPTZ,
  resolution_deadline TIMESTAMPTZ
) AS $$
DECLARE
  sla_policy RECORD;
BEGIN
  -- Find applicable SLA policy
  SELECT * INTO sla_policy
  FROM sla_policies
  WHERE sla_policies.priority = ticket_priority
    AND (ticket_category IS NULL OR sla_policies.category = ticket_category)
    AND sla_policies.is_active = true
  ORDER BY
    CASE WHEN sla_policies.category IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;

  IF FOUND THEN
    response_deadline := now() + (sla_policy.first_response_target || ' minutes')::INTERVAL;
    resolution_deadline := now() + (sla_policy.resolution_target || ' minutes')::INTERVAL;
  ELSE
    -- Default SLA if no policy found
    response_deadline := now() + '4 hours'::INTERVAL;
    resolution_deadline := now() + '24 hours'::INTERVAL;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket SLA status
CREATE OR REPLACE FUNCTION update_ticket_sla_status()
RETURNS TRIGGER AS $$
DECLARE
  sla_breached BOOLEAN := false;
  at_risk BOOLEAN := false;
BEGIN
  -- Check if SLA is breached
  IF NEW.sla_resolution_deadline IS NOT NULL AND now() > NEW.sla_resolution_deadline THEN
    sla_breached := true;
  ELSIF NEW.sla_resolution_deadline IS NOT NULL AND now() > (NEW.sla_resolution_deadline - INTERVAL '1 hour') THEN
    at_risk := true;
  END IF;

  -- Update SLA status
  IF sla_breached THEN
    NEW.sla_status := 'breached';
  ELSIF at_risk THEN
    NEW.sla_status := 'at_risk';
  ELSE
    NEW.sla_status := 'on_track';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update SLA status
CREATE TRIGGER update_ticket_sla_status_trigger
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_ticket_sla_status();

COMMENT ON TABLE support_tickets IS 'Main table for tracking customer support tickets with SLA monitoring';
COMMENT ON TABLE ticket_conversations IS 'All communications and notes related to support tickets';
COMMENT ON TABLE kb_articles IS 'Knowledge base articles with multilingual support';
COMMENT ON TABLE kb_categories IS 'Categories for organizing knowledge base articles';
COMMENT ON TABLE support_agents IS 'Support agent profiles and performance metrics';
COMMENT ON TABLE support_teams IS 'Support team configurations and specializations';
COMMENT ON TABLE sla_policies IS 'Service Level Agreement policies and targets';
COMMENT ON TABLE satisfaction_surveys IS 'Customer satisfaction surveys for ticket resolution quality';