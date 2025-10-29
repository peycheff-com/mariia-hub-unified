-- Marketing Automation System Migration
-- Comprehensive system for automated email/SMS campaigns, workflows, and customer engagement

-- Create marketing_automation_workflows table
CREATE TABLE IF NOT EXISTS marketing_automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('welcome_series', 'aftercare_reminders', 'review_requests', 're_engagement', 'birthday_anniversary', 'abandoned_booking', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    trigger_config JSONB NOT NULL DEFAULT '{}',
    workflow_nodes JSONB NOT NULL DEFAULT '[]',
    workflow_edges JSONB NOT NULL DEFAULT '[]',
    segment_criteria JSONB NOT NULL DEFAULT '{}',
    ab_test_config JSONB DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create marketing_templates table
CREATE TABLE IF NOT EXISTS marketing_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    type TEXT NOT NULL CHECK (type IN ('marketing', 'transactional', 'automation')),
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    styles JSONB DEFAULT '{}',
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES marketing_automation_workflows(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp', 'multi')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
    template_id UUID REFERENCES marketing_templates(id),
    segment_criteria JSONB NOT NULL DEFAULT '{}',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    schedule_at TIMESTAMP WITH TIME ZONE,
    send_time_optimization BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'Europe/Warsaw',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create customer_segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}',
    is_dynamic BOOLEAN DEFAULT true,
    customer_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_segment_members table
CREATE TABLE IF NOT EXISTS customer_segment_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(segment_id, customer_id)
);

-- Create campaign_recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_address TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'unsubscribed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    variables JSONB DEFAULT '{}',
    tracking_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES marketing_automation_workflows(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL,
    trigger_data JSONB DEFAULT '{}',
    current_node_id TEXT,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    execution_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create workflow_node_executions table
CREATE TABLE IF NOT EXISTS workflow_node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create marketing_analytics table
CREATE TABLE IF NOT EXISTS marketing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES marketing_automation_workflows(id) ON DELETE CASCADE,
    template_id UUID REFERENCES marketing_templates(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create marketing_preferences table
CREATE TABLE IF NOT EXISTS marketing_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_consent BOOLEAN DEFAULT true,
    sms_consent BOOLEAN DEFAULT false,
    whatsapp_consent BOOLEAN DEFAULT false,
    push_consent BOOLEAN DEFAULT true,
    consent_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_source TEXT DEFAULT 'profile',
    unsubscribe_reason TEXT,
    unsubscribe_all_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- Create email_deliverability table
CREATE TABLE IF NOT EXISTS email_deliverability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    delivery_status TEXT NOT NULL,
    provider_response TEXT,
    bounce_type TEXT,
    complaint_feedback TEXT,
    spam_complaint BOOLEAN DEFAULT false,
    delivery_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_marketing_workflows_status ON marketing_automation_workflows(status);
CREATE INDEX idx_marketing_workflows_type ON marketing_automation_workflows(type);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_workflow ON marketing_campaigns(workflow_id);
CREATE INDEX idx_marketing_campaigns_schedule ON marketing_campaigns(schedule_at) WHERE status = 'scheduled';
CREATE INDEX idx_marketing_templates_channel ON marketing_templates(channel);
CREATE INDEX idx_marketing_templates_type ON marketing_templates(type);
CREATE INDEX idx_customer_segments_dynamic ON customer_segments(is_dynamic);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_customer ON campaign_recipients(customer_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_customer ON workflow_executions(customer_id);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_node_executions_execution ON workflow_node_executions(execution_id);
CREATE INDEX idx_marketing_analytics_campaign ON marketing_analytics(campaign_id);
CREATE INDEX idx_marketing_analytics_timestamp ON marketing_analytics(timestamp);
CREATE INDEX idx_marketing_analytics_event_type ON marketing_analytics(event_type);
CREATE INDEX idx_marketing_preferences_customer ON marketing_preferences(customer_id);

-- Add RLS policies
ALTER TABLE marketing_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliverability ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_marketing_workflows_updated_at BEFORE UPDATE ON marketing_automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_templates_updated_at BEFORE UPDATE ON marketing_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_preferences_updated_at BEFORE UPDATE ON marketing_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate segment size
CREATE OR REPLACE FUNCTION calculate_segment_size(segment_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    segment_count INTEGER;
BEGIN
    EXECUTE 'UPDATE customer_segments SET customer_count = (
        SELECT COUNT(DISTINCT p.id)
        FROM profiles p
        WHERE ' || (
            SELECT CASE
                WHEN criteria IS NOT NULL AND jsonb_typeof(criteria) = 'object'
                THEN build_segment_query(criteria)
                ELSE 'true'
            END
        ) || '
    ) WHERE id = $1' INTO segment_count, segment_uuid;

    UPDATE customer_segments
    SET last_calculated_at = NOW()
    WHERE id = segment_uuid;

    RETURN segment_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to build segment query from criteria
CREATE OR REPLACE FUNCTION build_segment_query(criteria JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN 'true'; -- Simplified for now - will need to expand based on actual criteria
END;
$$ LANGUAGE plpgsql;

-- Create function to trigger workflow execution
CREATE OR REPLACE FUNCTION trigger_workflow_execution(
    workflow_uuid UUID,
    customer_uuid UUID,
    trigger_event TEXT,
    trigger_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO workflow_executions (workflow_id, customer_id, trigger_event, trigger_data)
    VALUES (workflow_uuid, customer_uuid, trigger_event, trigger_data)
    RETURNING id INTO execution_id;

    -- Trigger first node execution
    PERFORM execute_workflow_node(execution_id, 'start');

    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to execute workflow node
CREATE OR REPLACE FUNCTION execute_workflow_node(
    execution_uuid UUID,
    node_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    node_execution_id UUID;
    workflow_config JSONB;
    node_config JSONB;
BEGIN
    -- Get workflow configuration
    SELECT workflow_nodes INTO workflow_config
    FROM marketing_automation_workflows
    WHERE id = (SELECT workflow_id FROM workflow_executions WHERE id = execution_uuid);

    -- Find node configuration
    node_config := (
        SELECT element
        FROM jsonb_array_elements(workflow_config) as element
        WHERE element->>'id' = node_id
    );

    -- Create node execution record
    INSERT INTO workflow_node_executions (execution_id, node_id, node_type, status, started_at)
    VALUES (execution_uuid, node_id, node_config->>'type', 'running', NOW())
    RETURNING id INTO node_execution_id;

    -- Execute node based on type
    CASE node_config->>'type'
        WHEN 'send_email' THEN
            PERFORM execute_send_email(node_execution_id, node_config);
        WHEN 'send_sms' THEN
            PERFORM execute_send_sms(node_execution_id, node_config);
        WHEN 'wait' THEN
            PERFORM execute_wait(node_execution_id, node_config);
        WHEN 'branch' THEN
            PERFORM execute_branch(node_execution_id, node_config);
        WHEN 'update_data' THEN
            PERFORM execute_update_data(node_execution_id, node_config);
        WHEN 'ab_test' THEN
            PERFORM execute_ab_test(node_execution_id, node_config);
    END CASE;

    -- Update execution status
    UPDATE workflow_node_executions
    SET status = 'completed', completed_at = NOW()
    WHERE id = node_execution_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Placeholder functions for node execution
CREATE OR REPLACE FUNCTION execute_send_email(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for sending email
    RAISE NOTICE 'Sending email for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_send_sms(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for sending SMS
    RAISE NOTICE 'Sending SMS for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_wait(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for wait node
    RAISE NOTICE 'Executing wait for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_branch(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for branch logic
    RAISE NOTICE 'Executing branch for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_update_data(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for updating data
    RAISE NOTICE 'Updating data for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_ab_test(node_execution_id UUID, node_config JSONB)
RETURNS VOID AS $$
BEGIN
    -- Implementation for A/B testing
    RAISE NOTICE 'Executing A/B test for node execution %', node_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for campaign performance summary
CREATE OR REPLACE VIEW campaign_performance_summary AS
SELECT
    c.id,
    c.name,
    c.type,
    c.status,
    c.total_recipients,
    c.sent_count,
    c.delivered_count,
    c.opened_count,
    c.clicked_count,
    c.failed_count,
    CASE
        WHEN c.sent_count > 0 THEN ROUND((c.delivered_count::NUMERIC / c.sent_count::NUMERIC) * 100, 2)
        ELSE 0
    END as delivery_rate,
    CASE
        WHEN c.delivered_count > 0 THEN ROUND((c.opened_count::NUMERIC / c.delivered_count::NUMERIC) * 100, 2)
        ELSE 0
    END as open_rate,
    CASE
        WHEN c.opened_count > 0 THEN ROUND((c.clicked_count::NUMERIC / c.opened_count::NUMERIC) * 100, 2)
        ELSE 0
    END as click_rate,
    c.created_at,
    c.schedule_at
FROM marketing_campaigns c;

-- Create view for workflow execution summary
CREATE OR REPLACE VIEW workflow_execution_summary AS
SELECT
    w.id as workflow_id,
    w.name as workflow_name,
    w.type as workflow_type,
    COUNT(we.id) as total_executions,
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END) as completed_executions,
    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_executions,
    COUNT(CASE WHEN we.status = 'running' THEN 1 END) as running_executions,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at))) as avg_execution_time_seconds
FROM marketing_automation_workflows w
LEFT JOIN workflow_executions we ON w.id = we.workflow_id
GROUP BY w.id, w.name, w.type;

-- Insert default templates
INSERT INTO marketing_templates (name, description, channel, type, subject_template, body_template, variables, language) VALUES
('Welcome Email', 'Welcome email for new customers', 'email', 'automation', 'Welcome to {{business_name}}!',
'<h1>Welcome {{customer_name}}!</h1><p>Thank you for joining us. We''re excited to have you as part of our community.</p><p>Here''s a special offer for your first visit: {{welcome_offer}}</p>',
'["customer_name", "business_name", "welcome_offer"]', 'en'),
('Appointment Reminder', 'Reminder for upcoming appointments', 'sms', 'transactional', NULL,
'Hi {{customer_name}}, this is a reminder about your appointment tomorrow at {{appointment_time}}. Reply CANCEL to reschedule.',
'["customer_name", "appointment_time"]', 'en'),
('Review Request', 'Request for service review', 'email', 'automation', 'How was your experience?',
'<p>Hi {{customer_name}},</p><p>We hope you enjoyed your recent {{service_type}} service. We''d love to hear your feedback!</p><p><a href="{{review_link}}">Leave a Review</a></p>',
'["customer_name", "service_type", "review_link"]', 'en'),
('Aftercare Instructions', 'Post-treatment care instructions', 'email', 'automation', 'Aftercare Instructions',
'<p>Hi {{customer_name}},</p><p>Here are your aftercare instructions for {{service_type}}:</p>{{aftercare_instructions}}<p>Feel free to contact us if you have any questions.</p>',
'["customer_name", "service_type", "aftercare_instructions"]', 'en'),
('Birthday Special', 'Birthday special offer', 'email', 'automation', 'Happy Birthday {{customer_name}}!',
'<h1>Happy Birthday!</h1><p>As a special birthday treat, here''s {{discount_percentage}}% off your next service with us.</p><p>Valid until {{expiry_date}}.</p>',
'["customer_name", "discount_percentage", "expiry_date"]', 'en');

-- Insert default workflows
INSERT INTO marketing_automation_workflows (name, description, type, trigger_config, workflow_nodes, workflow_edges, status) VALUES
('Welcome Series', 'Multi-step welcome sequence for new customers', 'welcome_series',
'{"trigger_type": "customer_created", "delay_minutes": 0}',
'[
    {"id": "start", "type": "trigger", "position": {"x": 100, "y": 100}},
    {"id": "wait_1h", "type": "wait", "config": {"duration": {"value": 1, "unit": "hour"}}, "position": {"x": 300, "y": 100}},
    {"id": "welcome_email", "type": "send_email", "config": {"template_id": null, "personalize": true}, "position": {"x": 500, "y": 100}},
    {"id": "wait_3d", "type": "wait", "config": {"duration": {"value": 3, "unit": "day"}}, "position": {"x": 700, "y": 100}},
    {"id": "follow_up_email", "type": "send_email", "config": {"template_id": null, "include_offers": true}, "position": {"x": 900, "y": 100}}
]',
'[
    {"id": "e1", "source": "start", "target": "wait_1h"},
    {"id": "e2", "source": "wait_1h", "target": "welcome_email"},
    {"id": "e3", "source": "welcome_email", "target": "wait_3d"},
    {"id": "e4", "source": "wait_3d", "target": "follow_up_email"}
]',
'active'),
('Post-Appointment Care', 'Aftercare reminders and review requests', 'aftercare_reminders',
'{"trigger_type": "booking_completed", "delay_minutes": 60}',
'[
    {"id": "start", "type": "trigger", "position": {"x": 100, "y": 100}},
    {"id": "aftercare_email", "type": "send_email", "config": {"template_id": null, "send_aftercare": true}, "position": {"x": 300, "y": 100}},
    {"id": "wait_3d", "type": "wait", "config": {"duration": {"value": 3, "unit": "day"}}, "position": {"x": 500, "y": 100}},
    {"id": "review_request", "type": "send_email", "config": {"template_id": null, "request_review": true}, "position": {"x": 700, "y": 100}}
]',
'[
    {"id": "e1", "source": "start", "target": "aftercare_email"},
    {"id": "e2", "source": "aftercare_email", "target": "wait_3d"},
    {"id": "e3", "source": "wait_3d", "target": "review_request"}
]',
'active'),
('Re-engagement Campaign', 'Re-engage inactive customers', 're_engagement',
'{"trigger_type": "scheduled", "schedule": "0 9 * * 1", "segment_criteria": {"days_since_last_booking": 30}}',
'[
    {"id": "start", "type": "trigger", "position": {"x": 100, "y": 100}},
    {"id": "we_miss_you", "type": "send_email", "config": {"template_id": null, "offer_type": "come_back"}, "position": {"x": 300, "y": 100}},
    {"id": "wait_7d", "type": "wait", "config": {"duration": {"value": 7, "unit": "day"}}, "position": {"x": 500, "y": 100}},
    {"id": "special_offer", "type": "send_email", "config": {"template_id": null, "discount_percentage": 20}, "position": {"x": 700, "y": 100}}
]',
'[
    {"id": "e1", "source": "start", "target": "we_miss_you"},
    {"id": "e2", "source": "we_miss_you", "target": "wait_7d"},
    {"id": "e3", "source": "wait_7d", "target": "special_offer"}
]',
'active');