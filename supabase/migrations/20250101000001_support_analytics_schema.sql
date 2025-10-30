-- Support Analytics Database Schema for Luxury Beauty/Fitness Platform
-- This migration adds comprehensive support analytics and performance tracking

-- Support tickets and interactions table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL GENERATED ALWAYS AS ('SUP' || LPAD(EXTRACT(DAY FROM created_at)::TEXT, 2, '0') || LPAD(id::TEXT, 6, '0')) STORED,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES support_categories(id),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated')),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'chat', 'phone', 'whatsapp', 'instagram', 'facebook', 'in_person', 'portal')),
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
    nps_score INTEGER CHECK (nps_score >= -100 AND nps_score <= 100),
    customer_effort_score INTEGER CHECK (customer_effort_score >= 1 AND customer_effort_score <= 7),
    first_contact_resolution BOOLEAN DEFAULT FALSE,
    escalation_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support categories and subcategories
CREATE TABLE IF NOT EXISTS support_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES support_categories(id),
    category_type TEXT NOT NULL CHECK (category_type IN ('technical', 'billing', 'booking', 'service', 'feedback', 'complaint', 'feature_request', 'general')),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support interactions/messages
CREATE TABLE IF NOT EXISTS support_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
    message TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'attachment', 'system_update', 'escalation', 'resolution')),
    internal_notes TEXT,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    reaction_sentiment JSONB, -- sentiment analysis results
    processing_time_ms INTEGER, -- AI processing time for sentiment/analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support agent performance tracking
CREATE TABLE IF NOT EXISTS support_agent_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    tickets_handled INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    first_response_time_seconds INTEGER DEFAULT 0,
    average_response_time_seconds INTEGER DEFAULT 0,
    resolution_time_seconds INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
    nps_avg DECIMAL(5,2) DEFAULT 0,
    ces_avg DECIMAL(3,2) DEFAULT 0,
    first_contact_resolution_rate DECIMAL(5,2) DEFAULT 0,
    escalation_rate DECIMAL(5,2) DEFAULT 0,
    tickets_per_hour DECIMAL(5,2) DEFAULT 0,
    utilization_rate DECIMAL(5,2) DEFAULT 0, -- percentage of scheduled time spent on tickets
    quality_score DECIMAL(3,2) DEFAULT 0, -- from QA reviews
    adherence_percentage DECIMAL(5,2) DEFAULT 0, -- schedule adherence
    knowledge_base_contributions INTEGER DEFAULT 0,
    coaching_notes TEXT,
    goals_achieved JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, measurement_date)
);

-- Support SLA definitions and tracking
CREATE TABLE IF NOT EXISTS support_sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES support_categories(id),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    first_response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    business_hours_only BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA compliance tracking
CREATE TABLE IF NOT EXISTS support_sla_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sla_policy_id UUID REFERENCES support_sla_policies(id),
    first_response_met BOOLEAN DEFAULT FALSE,
    first_response_breach_minutes INTEGER DEFAULT 0,
    resolution_met BOOLEAN DEFAULT FALSE,
    resolution_breach_minutes INTEGER DEFAULT 0,
    overall_compliance_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support quality assurance evaluations
CREATE TABLE IF NOT EXISTS support_qa_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL,
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 5),
    problem_solving_score DECIMAL(3,2) CHECK (problem_solving_score >= 0 AND problem_solving_score <= 5),
    empathy_score DECIMAL(3,2) CHECK (empathy_score >= 0 AND empathy_score <= 5),
    efficiency_score DECIMAL(3,2) CHECK (efficiency_score >= 0 AND efficiency_score <= 5),
    knowledge_score DECIMAL(3,2) CHECK (knowledge_score >= 0 AND knowledge_score <= 5),
    compliance_score DECIMAL(3,2) CHECK (compliance_score >= 0 AND compliance_score <= 5),
    strengths TEXT[],
    improvement_areas TEXT[],
    action_items TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support knowledge base analytics
CREATE TABLE IF NOT EXISTS support_kb_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL, -- can be external reference
    article_title TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    search_terms TEXT[],
    avg_time_on_page_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    ticket_deflection_count INTEGER DEFAULT 0, -- tickets avoided by this article
    created_at DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, created_at)
);

-- Support queue and wait time tracking
CREATE TABLE IF NOT EXISTS support_queue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL,
    channel TEXT NOT NULL,
    measurement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active_tickets INTEGER DEFAULT 0,
    waiting_tickets INTEGER DEFAULT 0,
    average_wait_time_seconds INTEGER DEFAULT 0,
    longest_wait_time_seconds INTEGER DEFAULT 0,
    abandoned_tickets INTEGER DEFAULT 0,
    service_level_percentage DECIMAL(5,2) DEFAULT 0, -- percentage answered within SLA
    agent_availability INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support customer feedback and satisfaction surveys
CREATE TABLE IF NOT EXISTS support_feedback_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('csat', 'nps', 'ces', 'custom')),
    survey_response_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_rating INTEGER,
    specific_ratings JSONB, -- breakdown by categories
    comments TEXT,
    would_recommend BOOLEAN,
    effort_rating INTEGER,
    resolution_met_expectations BOOLEAN,
    agent_rating INTEGER,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support coaching and training tracking
CREATE TABLE IF NOT EXISTS support_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    training_type TEXT NOT NULL CHECK (training_type IN ('onboarding', 'product_knowledge', 'soft_skills', 'system_training', 'compliance', 'coaching_session')),
    training_topic TEXT NOT NULL,
    training_date DATE NOT NULL,
    trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    duration_minutes INTEGER DEFAULT 0,
    completion_status TEXT NOT NULL CHECK (completion_status IN ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    next_training_date DATE,
    skills_covered TEXT[],
    competency_level_before TEXT,
    competency_level_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support automation and AI analytics
CREATE TABLE IF NOT EXISTS support_automation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_type TEXT NOT NULL CHECK (automation_type IN ('bot_response', 'auto_categorization', 'sentiment_analysis', 'auto_routing', 'suggested_responses', 'auto_escalation')),
    trigger_event TEXT NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    accuracy_score DECIMAL(5,2) DEFAULT 0,
    confidence_avg DECIMAL(5,2) DEFAULT 0,
    processing_time_ms_avg INTEGER DEFAULT 0,
    human_escalation_rate DECIMAL(5,2) DEFAULT 0,
    customer_acceptance_rate DECIMAL(5,2) DEFAULT 0,
    time_saved_minutes INTEGER DEFAULT 0,
    measurement_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(automation_type, trigger_event, measurement_date)
);

-- Support financial impact tracking
CREATE TABLE IF NOT EXISTS support_financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measurement_date DATE NOT NULL,
    total_interactions INTEGER DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0, -- operational cost
    cost_per_interaction DECIMAL(10,2) DEFAULT 0,
    revenue_protection_amount DECIMAL(12,2) DEFAULT 0, -- revenue saved through support
    upsell_opportunities INTEGER DEFAULT 0,
    upsell_revenue_generated DECIMAL(12,2) DEFAULT 0,
    churn_prevented_count INTEGER DEFAULT 0,
    churn_prevention_value DECIMAL(12,2) DEFAULT 0,
    customer_retention_value DECIMAL(12,2) DEFAULT 0,
    automation_roi DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(measurement_date)
);

-- Support predictive analytics
CREATE TABLE IF NOT EXISTS support_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('ticket_volume', 'churn_risk', 'upsell_opportunity', 'escalation_risk', 'sla_breach_risk', 'agent_performance')),
    entity_id UUID,
    entity_type TEXT NOT NULL,
    predicted_value DECIMAL(10,2),
    confidence_score DECIMAL(3,2),
    prediction_date DATE NOT NULL,
    actual_value DECIMAL(10,2),
    model_version TEXT NOT NULL,
    features_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support alerts and notifications
CREATE TABLE IF NOT EXISTS support_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('sla_breach', 'high_priority_queue', 'customer_satisfaction_drop', 'agent_performance', 'volume_spike', 'system_error')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT,
    entity_id UUID,
    entity_type TEXT,
    threshold_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    auto_resolve_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIP client support tracking
CREATE TABLE IF NOT EXISTS support_vip_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vip_level TEXT NOT NULL CHECK (vip_level IN ('standard', 'silver', 'gold', 'platinum', 'diamond')),
    dedicated_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    white_glove_service BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT TRUE,
    personalized_follow_up BOOLEAN DEFAULT TRUE,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    satisfaction_trend JSONB, -- recent satisfaction scores
    lifetime_support_tickets INTEGER DEFAULT 0,
    avg_resolution_time_minutes INTEGER DEFAULT 0,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support reporting and analytics
CREATE TABLE IF NOT EXISTS support_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    total_tickets INTEGER DEFAULT 0,
    open_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    first_response_time_avg INTEGER DEFAULT 0,
    resolution_time_avg INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
    nps_avg DECIMAL(5,2) DEFAULT 0,
    tickets_by_channel JSONB DEFAULT '{}',
    tickets_by_category JSONB DEFAULT '{}',
    tickets_by_priority JSONB DEFAULT '{}',
    agent_performance JSONB DEFAULT '{}',
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
    automation_rate DECIMAL(5,2) DEFAULT 0,
    cost_per_ticket DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(snapshot_date, snapshot_type)
);

-- Support team performance
CREATE TABLE IF NOT EXISTS support_team_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    measurement_date DATE NOT NULL,
    total_agents INTEGER DEFAULT 0,
    active_agents INTEGER DEFAULT 0,
    tickets_handled INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    avg_resolution_time_seconds INTEGER DEFAULT 0,
    team_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
    team_utilization_rate DECIMAL(5,2) DEFAULT 0,
    team_adherence_rate DECIMAL(5,2) DEFAULT 0,
    first_contact_resolution_rate DECIMAL(5,2) DEFAULT 0,
    escalation_rate DECIMAL(5,2) DEFAULT 0,
    quality_score_avg DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_name, measurement_date)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_agent_id ON support_tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_channel ON support_tickets(channel);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_at ON support_tickets(assigned_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved_at ON support_tickets(resolved_at);

CREATE INDEX IF NOT EXISTS idx_support_interactions_ticket_id ON support_interactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_interactions_sender_id ON support_interactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_interactions_created_at ON support_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_agent_metrics_agent_date ON support_agent_metrics(agent_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_support_agent_metrics_date ON support_agent_metrics(measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_categories_parent_id ON support_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_support_categories_type ON support_categories(category_type);

CREATE INDEX IF NOT EXISTS idx_support_sla_compliance_ticket_id ON support_sla_compliance(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_sla_compliance_policy_id ON support_sla_compliance(sla_policy_id);

CREATE INDEX IF NOT EXISTS idx_support_qa_evaluations_ticket_id ON support_qa_evaluations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_qa_evaluations_agent_id ON support_qa_evaluations(agent_id);
CREATE INDEX IF NOT EXISTS idx_support_qa_evaluations_date ON support_qa_evaluations(evaluation_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_kb_analytics_article_date ON support_kb_analytics(article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_queue_metrics_timestamp ON support_queue_metrics(measurement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_support_queue_metrics_queue ON support_queue_metrics(queue_name, channel);

CREATE INDEX IF NOT EXISTS idx_support_feedback_surveys_ticket_id ON support_feedback_surveys(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_feedback_surveys_customer_id ON support_feedback_surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_feedback_surveys_type ON support_feedback_surveys(survey_type);

CREATE INDEX IF NOT EXISTS idx_support_training_records_agent_date ON support_training_records(agent_id, training_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_automation_analytics_type_date ON support_automation_analytics(automation_type, measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_financial_metrics_date ON support_financial_metrics(measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_predictions_type_date ON support_predictions(prediction_type, prediction_date DESC);

CREATE INDEX IF NOT EXISTS idx_support_alerts_created_at ON support_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_alerts_severity ON support_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_support_alerts_resolved ON support_alerts(is_resolved);

CREATE INDEX IF NOT EXISTS idx_support_vip_tracking_customer_id ON support_vip_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_vip_tracking_level ON support_vip_tracking(vip_level);

CREATE INDEX IF NOT EXISTS idx_support_analytics_snapshots_date_type ON support_analytics_snapshots(snapshot_date DESC, snapshot_type);

CREATE INDEX IF NOT EXISTS idx_support_team_metrics_team_date ON support_team_metrics(team_name, measurement_date DESC);

-- Add updated_at trigger function (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    END IF;
END $$;

-- Add updated_at triggers
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_categories_updated_at BEFORE UPDATE ON support_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_sla_policies_updated_at BEFORE UPDATE ON support_sla_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_kb_analytics_updated_at BEFORE UPDATE ON support_kb_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_vip_tracking_updated_at BEFORE UPDATE ON support_vip_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_qa_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_vip_tracking ENABLE ROW LEVEL SECURITY;

-- Customer policies - can see their own tickets and interactions
CREATE POLICY "Customers can view their own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own support interactions" ON support_interactions FOR SELECT USING (
    auth.uid() IN (SELECT customer_id FROM support_tickets WHERE id = ticket_id)
);
CREATE POLICY "Customers can view their own feedback surveys" ON support_feedback_surveys FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own VIP tracking" ON support_vip_tracking FOR SELECT USING (auth.uid() = customer_id);

-- Agent policies - can see tickets assigned to them and their metrics
CREATE POLICY "Agents can view their assigned tickets" ON support_tickets FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can view their own metrics" ON support_agent_metrics FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can view their QA evaluations" ON support_qa_evaluations FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can view their training records" ON support_training_records FOR SELECT USING (auth.uid() = agent_id);

-- Admin/Manager policies - full access
CREATE POLICY "Admins can view all support tickets" ON support_tickets FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all support interactions" ON support_interactions FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all agent metrics" ON support_agent_metrics FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all QA evaluations" ON support_qa_evaluations FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all feedback surveys" ON support_feedback_surveys FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all training records" ON support_training_records FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Admins can view all VIP tracking" ON support_vip_tracking FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Insert default support categories
INSERT INTO support_categories (name, description, category_type, sort_order) VALUES
('Technical Issues', 'Problems with website, app, or booking system', 'technical', 1),
('Billing & Payments', 'Questions about charges, refunds, and payment methods', 'billing', 2),
('Booking Related', 'Issues with appointments, availability, and scheduling', 'booking', 3),
('Service Information', 'Questions about services, treatments, and programs', 'service', 4),
('Customer Feedback', 'General feedback, suggestions, and testimonials', 'feedback', 5),
('Complaints', 'Formal complaints and service issues', 'complaint', 6),
('Feature Requests', 'New features and improvements suggestions', 'feature_request', 7),
('General Inquiries', 'Other questions and general support', 'general', 8)
ON CONFLICT DO NOTHING;

-- Insert subcategories for technical issues
INSERT INTO support_categories (name, description, parent_id, category_type, sort_order)
SELECT 'Login Issues', 'Problems with account access and authentication', id, 'technical', 1
FROM support_categories WHERE name = 'Technical Issues' AND parent_id IS NULL
UNION ALL
SELECT 'Booking System Errors', 'Errors during the booking process', id, 'technical', 2
FROM support_categories WHERE name = 'Technical Issues' AND parent_id IS NULL
UNION ALL
SELECT 'Payment Processing', 'Issues with payment processing and transactions', id, 'technical', 3
FROM support_categories WHERE name = 'Technical Issues' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Insert default SLA policies
INSERT INTO support_sla_policies (name, category_id, priority, first_response_time_minutes, resolution_time_minutes) VALUES
('Standard Response - Low', (SELECT id FROM support_categories WHERE name = 'General Inquiries' AND parent_id IS NULL), 'low', 480, 2880), -- 8 hours response, 2 days resolution
('Standard Response - Medium', (SELECT id FROM support_categories WHERE name = 'General Inquiries' AND parent_id IS NULL), 'medium', 240, 1440), -- 4 hours response, 1 day resolution
('Priority Response - High', (SELECT id FROM support_categories WHERE name = 'Booking Related' AND parent_id IS NULL), 'high', 120, 480), -- 2 hours response, 8 hours resolution
('Urgent Response', (SELECT id FROM support_categories WHERE name = 'Technical Issues' AND parent_id IS NULL), 'urgent', 60, 240), -- 1 hour response, 4 hours resolution
('Critical Response - Payment Issues', (SELECT id FROM support_categories WHERE name = 'Billing & Payments' AND parent_id IS NULL), 'critical', 30, 120) -- 30 minutes response, 2 hours resolution
ON CONFLICT DO NOTHING;

-- Create functions for support analytics operations

-- Function to calculate current support metrics
CREATE OR REPLACE FUNCTION get_support_metrics(date_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days', date_end DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_tickets', (SELECT COUNT(*) FROM support_tickets WHERE created_at::DATE BETWEEN date_start AND date_end),
        'open_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress') AND created_at::DATE BETWEEN date_start AND date_end),
        'resolved_tickets', (SELECT COUNT(*) FROM support_tickets WHERE status = 'resolved' AND resolved_at::DATE BETWEEN date_start AND date_end),
        'avg_first_response_time', (SELECT EXTRACT(EPOCH FROM AVG(first_response_at - created_at))/60 FROM support_tickets WHERE first_response_at IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'avg_resolution_time', (SELECT EXTRACT(EPOCH FROM AVG(resolved_at - created_at))/3600 FROM support_tickets WHERE resolved_at IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'customer_satisfaction_avg', (SELECT AVG(customer_satisfaction_rating) FROM support_tickets WHERE customer_satisfaction_rating IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'nps_avg', (SELECT AVG(nps_score) FROM support_tickets WHERE nps_score IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'sla_compliance_rate', (SELECT CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(CASE WHEN first_response_met = true THEN 1 END)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END FROM support_sla_compliance sc
        JOIN support_tickets st ON sc.ticket_id = st.id
        WHERE st.created_at::DATE BETWEEN date_start AND date_end),
        'tickets_by_channel', (SELECT jsonb_object_agg(channel, count) FROM (SELECT channel, COUNT(*) as count FROM support_tickets WHERE created_at::DATE BETWEEN date_start AND date_end GROUP BY channel) t),
        'tickets_by_priority', (SELECT jsonb_object_agg(priority, count) FROM (SELECT priority, COUNT(*) as count FROM support_tickets WHERE created_at::DATE BETWEEN date_start AND date_end GROUP BY priority) t),
        'active_agents', (SELECT COUNT(DISTINCT agent_id) FROM support_tickets WHERE agent_id IS NOT NULL AND assigned_at::DATE BETWEEN date_start AND date_end),
        'automation_rate', (SELECT CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(CASE WHEN message_type = 'system_update' THEN 1 END)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END FROM support_interactions si
        JOIN support_tickets st ON si.ticket_id = st.id
        WHERE st.created_at::DATE BETWEEN date_start AND date_end)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent performance metrics
CREATE OR REPLACE FUNCTION get_agent_performance_metrics(agent_id_param UUID, date_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days', date_end DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tickets_handled', (SELECT COUNT(*) FROM support_tickets WHERE agent_id = agent_id_param AND created_at::DATE BETWEEN date_start AND date_end),
        'tickets_resolved', (SELECT COUNT(*) FROM support_tickets WHERE agent_id = agent_id_param AND status = 'resolved' AND resolved_at::DATE BETWEEN date_start AND date_end),
        'avg_first_response_time', (SELECT EXTRACT(EPOCH FROM AVG(first_response_at - assigned_at))/60 FROM support_tickets WHERE agent_id = agent_id_param AND first_response_at IS NOT NULL AND assigned_at::DATE BETWEEN date_start AND date_end),
        'avg_resolution_time', (SELECT EXTRACT(EPOCH FROM AVG(resolved_at - assigned_at))/3600 FROM support_tickets WHERE agent_id = agent_id_param AND resolved_at IS NOT NULL AND assigned_at::DATE BETWEEN date_start AND date_end),
        'customer_satisfaction_avg', (SELECT AVG(customer_satisfaction_rating) FROM support_tickets WHERE agent_id = agent_id_param AND customer_satisfaction_rating IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'nps_avg', (SELECT AVG(nps_score) FROM support_tickets WHERE agent_id = agent_id_param AND nps_score IS NOT NULL AND created_at::DATE BETWEEN date_start AND date_end),
        'first_contact_resolution_rate', (SELECT CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(CASE WHEN first_contact_resolution = true THEN 1 END)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END FROM support_tickets WHERE agent_id = agent_id_param AND created_at::DATE BETWEEN date_start AND date_end),
        'quality_score_avg', (SELECT AVG(overall_score) FROM support_qa_evaluations WHERE agent_id = agent_id_param AND evaluation_date BETWEEN date_start AND date_end),
        'tickets_by_category', (SELECT jsonb_object_agg(sc.name, count) FROM support_tickets st JOIN support_categories sc ON st.category_id = sc.id WHERE st.agent_id = agent_id_param AND st.created_at::DATE BETWEEN date_start AND date_end GROUP BY sc.name)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to predict ticket volume for next 7 days
CREATE OR REPLACE FUNCTION predict_ticket_volume(days_forward INTEGER DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simple prediction based on historical patterns and day of week
    WITH historical_patterns AS (
        SELECT
            EXTRACT(DOW FROM created_at::DATE) as day_of_week,
            COUNT(*) as avg_tickets,
            AVG(EXTRACT(HOUR FROM created_at)) as avg_hour
        FROM support_tickets
        WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '28 days'
        GROUP BY EXTRACT(DOW FROM created_at::DATE)
    ),
    predictions AS (
        SELECT
            (CURRENT_DATE + INTERVAL '1 day' * generate_series(1, days_forward))::DATE as prediction_date,
            EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day' * generate_series(1, days_forward))) as day_of_week,
            COALESCE(hp.avg_tickets, 0) as predicted_volume
        FROM historical_patterns hp
        RIGHT JOIN generate_series(1, days_forward) gs ON EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day' * gs)) = hp.day_of_week
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', prediction_date,
            'day_of_week', day_of_week,
            'predicted_volume', ROUND(predicted_volume),
            'confidence_score', 0.75
        )
    ) INTO result
    FROM predictions;

    RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer satisfaction trends
CREATE OR REPLACE FUNCTION get_satisfaction_trends(days_back INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH daily_satisfaction AS (
        SELECT
            created_at::DATE as date,
            AVG(customer_satisfaction_rating) as avg_satisfaction,
            COUNT(*) as survey_count
        FROM support_tickets
        WHERE customer_satisfaction_rating IS NOT NULL
        AND created_at::DATE >= CURRENT_DATE - INTERVAL '1 day' * days_back
        GROUP BY created_at::DATE
    ),
    trend_analysis AS (
        SELECT
            COUNT(*) as total_days,
            AVG(avg_satisfaction) as overall_avg,
            STDDEV(avg_satisfaction) as std_dev,
            (SELECT avg_satisfaction FROM daily_satisfaction ORDER BY date DESC LIMIT 1) as latest_satisfaction,
            (SELECT avg_satisfaction FROM daily_satisfaction ORDER BY date ASC LIMIT 1) as earliest_satisfaction
        FROM daily_satisfaction
    )
    SELECT jsonb_build_object(
        'daily_scores', (SELECT jsonb_agg(jsonb_build_object('date', date, 'satisfaction', ROUND(avg_satisfaction, 2), 'count', survey_count)) FROM daily_satisfaction),
        'overall_average', ROUND(ta.overall_avg, 2),
        'latest_score', ROUND(ta.latest_satisfaction, 2),
        'trend_direction', CASE
            WHEN ta.latest_satisfaction > ta.earliest_satisfaction THEN 'improving'
            WHEN ta.latest_satisfaction < ta.earliest_satisfaction THEN 'declining'
            ELSE 'stable'
        END,
        'trend_magnitude', ROUND(ABS(ta.latest_satisfaction - ta.earliest_satisfaction), 2),
        'data_points', ta.total_days
    ) INTO result
    FROM trend_analysis ta;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;