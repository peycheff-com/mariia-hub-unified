-- Comprehensive Feedback System Migration
-- This migration creates tables for a multi-faceted feedback collection system

-- Create custom types for feedback system
DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM (
        'service_rating',
        'post_booking_review',
        'bug_report',
        'feature_request',
        'general_feedback',
        'nps_survey',
        'user_experience',
        'customer_support',
        'payment_experience'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM (
        'pending',
        'in_review',
        'addressed',
        'resolved',
        'dismissed',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_priority AS ENUM (
        'low',
        'medium',
        'high',
        'urgent',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sentiment_analysis AS ENUM (
        'positive',
        'neutral',
        'negative',
        'mixed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_channel AS ENUM (
        'web',
        'email',
        'sms',
        'whatsapp',
        'mobile_app',
        'in_person'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Main feedback entries table
CREATE TABLE IF NOT EXISTS feedback_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,

    -- Core feedback content
    feedback_type feedback_type NOT NULL,
    title TEXT,
    content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Categorization and routing
    category TEXT,
    subcategory TEXT,
    tags TEXT[],
    priority feedback_priority DEFAULT 'medium',
    status feedback_status DEFAULT 'pending',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Sentiment and analysis
    sentiment sentiment_analysis,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    keywords TEXT[],
    auto_categorized BOOLEAN DEFAULT false,

    -- Metadata
    channel feedback_channel DEFAULT 'web',
    source_url TEXT,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    session_id TEXT,

    -- System data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Feedback attachments (screenshots, files, etc.)
CREATE TABLE IF NOT EXISTS feedback_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback_entries(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Feedback responses and actions
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback_entries(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    response_type TEXT DEFAULT 'comment', -- comment, solution, request_for_info, etc.
    is_internal BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. NPS (Net Promoter Score) surveys
CREATE TABLE IF NOT EXISTS nps_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    reason TEXT,
    follow_up_sent BOOLEAN DEFAULT false,
    survey_type TEXT DEFAULT 'post_booking', -- post_booking, periodic, trigger_based
    trigger_event TEXT, -- booking_completed, service_used, cancellation, etc.
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Feedback templates and automation
CREATE TABLE IF NOT EXISTS feedback_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    feedback_type feedback_type NOT NULL,
    template_config JSONB NOT NULL, -- Questions, options, validation rules
    auto_trigger_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Feedback request campaigns
CREATE TABLE IF NOT EXISTS feedback_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT, -- email, sms, in_app, webhook
    target_criteria JSONB DEFAULT '{}'::jsonb, -- Who to target
    template_id UUID REFERENCES feedback_templates(id),
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    schedule_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Feedback analytics and metrics
CREATE TABLE IF NOT EXISTS feedback_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    feedback_type feedback_type,
    total_entries INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    sentiment_distribution JSONB DEFAULT '{}'::jsonb,
    status_distribution JSONB DEFAULT '{}'::jsonb,
    priority_distribution JSONB DEFAULT '{}'::jsonb,
    response_time_hours DECIMAL(8,2),
    resolution_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(date, feedback_type)
);

-- 8. Feedback subscriptions and notifications
CREATE TABLE IF NOT EXISTS feedback_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feedback_type feedback_type,
    priority feedback_priority,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Feedback integration logs (for external systems)
CREATE TABLE IF NOT EXISTS feedback_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback_entries(id) ON DELETE CASCADE,
    integration_provider TEXT NOT NULL, -- zendesk, jira, slack, etc.
    integration_type TEXT, -- ticket, notification, sync
    external_id TEXT,
    status TEXT, -- success, failed, pending
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Feedback tags management
CREATE TABLE IF NOT EXISTS feedback_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_id ON feedback_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_booking_id ON feedback_entries(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_service_id ON feedback_entries(service_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_type_status ON feedback_entries(feedback_type, status);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_priority ON feedback_entries(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_sentiment ON feedback_entries(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_created_at ON feedback_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_tags ON feedback_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_keywords ON feedback_entries USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_responder_id ON feedback_responses(responder_id);

CREATE INDEX IF NOT EXISTS idx_nps_surveys_user_id ON nps_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_score ON nps_surveys(score);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_responded_at ON nps_surveys(responded_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_campaigns_active ON feedback_campaigns(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_date_type ON feedback_analytics(date, feedback_type);

-- RLS Policies
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_subscriptions ENABLE ROW LEVEL SECURITY;

-- Feedback entries policies
CREATE POLICY "Users can view their own feedback" ON feedback_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON feedback_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all feedback" ON feedback_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Attachments policies
CREATE POLICY "Users can view attachments for their feedback" ON feedback_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feedback_entries
            WHERE feedback_entries.id = feedback_attachments.feedback_id
            AND feedback_entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all attachments" ON feedback_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Responses policies
CREATE POLICY "Users can view published responses" ON feedback_responses
    FOR SELECT USING (is_published = true OR auth.uid() = feedback_entries.user_id);

CREATE POLICY "Admins can manage all responses" ON feedback_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- NPS surveys policies
CREATE POLICY "Users can view their own NPS responses" ON nps_surveys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NPS responses" ON nps_surveys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all NPS responses" ON nps_surveys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Feedback subscriptions policies
CREATE POLICY "Users can manage their own subscriptions" ON feedback_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON feedback_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Triggers and functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_entries_updated_at
    BEFORE UPDATE ON feedback_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_responses_updated_at
    BEFORE UPDATE ON feedback_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_subscriptions_updated_at
    BEFORE UPDATE ON feedback_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update feedback analytics
CREATE OR REPLACE FUNCTION update_feedback_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO feedback_analytics (
        date,
        feedback_type,
        total_entries,
        average_rating,
        sentiment_distribution,
        status_distribution,
        priority_distribution
    )
    SELECT
        CURRENT_DATE,
        NEW.feedback_type,
        1,
        CASE WHEN NEW.rating IS NOT NULL THEN NEW.rating ELSE NULL END,
        jsonb_build_object(NEW.sentiment, 1),
        jsonb_build_object(NEW.status, 1),
        jsonb_build_object(NEW.priority, 1)
    ON CONFLICT (date, feedback_type) DO UPDATE SET
        total_entries = feedback_analytics.total_entries + 1,
        average_rating = CASE
            WHEN NEW.rating IS NOT NULL THEN
                (feedback_analytics.average_rating * feedback_analytics.total_entries + NEW.rating) /
                (feedback_analytics.total_entries + 1)
            ELSE feedback_analytics.average_rating
        END,
        sentiment_distribution = feedback_analytics.sentiment_distribution ||
            jsonb_build_object(NEW.sentiment,
                COALESCE((feedback_analytics.sentiment_distribution->>NEW.sentiment)::int, 0) + 1
            ),
        status_distribution = feedback_analytics.status_distribution ||
            jsonb_build_object(NEW.status,
                COALESCE((feedback_analytics.status_distribution->>NEW.status)::int, 0) + 1
            ),
        priority_distribution = feedback_analytics.priority_distribution ||
            jsonb_build_object(NEW.priority,
                COALESCE((feedback_analytics.priority_distribution->>NEW.priority)::int, 0) + 1
            ),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_analytics
    AFTER INSERT ON feedback_entries
    FOR EACH ROW EXECUTE FUNCTION update_feedback_analytics();

-- Function to manage tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment tag usage counts
    IF NEW.tags IS NOT NULL THEN
        UPDATE feedback_tags
        SET usage_count = usage_count + 1
        WHERE name = ANY(NEW.tags);
    END IF;

    -- Decrement old tag usage counts
    IF OLD.tags IS NOT NULL THEN
        UPDATE feedback_tags
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE name = ANY(OLD.tags) AND name != ALL(COALESCE(NEW.tags, ARRAY[]::text[]));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
    AFTER UPDATE ON feedback_entries
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage();

-- Initialize default feedback templates
INSERT INTO feedback_templates (name, description, feedback_type, template_config) VALUES
(
    'Post-Booking Service Review',
    'Automated review request sent after service completion',
    'post_booking_review',
    '{
        "questions": [
            {
                "id": "rating",
                "type": "rating",
                "label": "How would you rate your experience?",
                "required": true,
                "min": 1,
                "max": 5
            },
            {
                "id": "service_quality",
                "type": "rating",
                "label": "Service Quality",
                "required": true,
                "min": 1,
                "max": 5
            },
            {
                "id": "staff_professionalism",
                "type": "rating",
                "label": "Staff Professionalism",
                "required": true,
                "min": 1,
                "max": 5
            },
            {
                "id": "comments",
                "type": "textarea",
                "label": "Additional comments",
                "required": false
            }
        ],
        "auto_categorize": true,
        "sentiment_analysis": true
    }'::jsonb
),
(
    'Bug Report Form',
    'Form for reporting technical issues and bugs',
    'bug_report',
    '{
        "questions": [
            {
                "id": "severity",
                "type": "select",
                "label": "Severity",
                "required": true,
                "options": ["Low", "Medium", "High", "Critical"]
            },
            {
                "id": "description",
                "type": "textarea",
                "label": "Describe the issue",
                "required": true
            },
            {
                "id": "steps_to_reproduce",
                "type": "textarea",
                "label": "Steps to reproduce",
                "required": true
            },
            {
                "id": "expected_behavior",
                "type": "textarea",
                "label": "Expected behavior",
                "required": true
            },
            {
                "id": "browser_info",
                "type": "text",
                "label": "Browser and version",
                "required": false
            }
        ],
        "auto_priority": true,
        "auto_categorize": true
    }'::jsonb
),
(
    'NPS Survey',
    'Net Promoter Score survey',
    'nps_survey',
    '{
        "questions": [
            {
                "id": "nps_score",
                "type": "scale",
                "label": "How likely are you to recommend us to friends and colleagues?",
                "required": true,
                "min": 0,
                "max": 10
            },
            {
                "id": "reason",
                "type": "textarea",
                "label": "What is the main reason for your score?",
                "required": false
            }
        ],
        "calculate_nps": true
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Initialize default feedback tags
INSERT INTO feedback_tags (name, color, description) VALUES
    ('Customer Service', '#EF4444', 'Issues related to customer service interactions'),
    ('Technical Issue', '#F59E0B', 'Bugs and technical problems'),
    ('Feature Request', '#10B981', 'Suggestions for new features'),
    ('User Experience', '#3B82F6', 'UX/UI feedback and improvements'),
    ('Billing', '#8B5CF6', 'Payment and billing related feedback'),
    ('Service Quality', '#EC4899', 'Service delivery and quality issues'),
    ('Documentation', '#6B7280', 'Documentation and help content'),
    ('Performance', '#F97316', 'Performance and speed issues'),
    ('Mobile App', '#06B6D4', 'Mobile application specific feedback'),
    ('Website', '#84CC16', 'Website specific feedback')
ON CONFLICT DO NOTHING;

-- Create storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-attachments', 'feedback-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for feedback attachments
CREATE POLICY "Users can upload attachments for their feedback" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'feedback-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own feedback attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'feedback-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all feedback attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'feedback-attachments' AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

COMMENT ON TABLE feedback_entries IS 'Main table for storing all types of user feedback';
COMMENT ON TABLE feedback_attachments IS 'Files and screenshots attached to feedback entries';
COMMENT ON TABLE feedback_responses IS 'Responses and actions taken on feedback entries';
COMMENT ON TABLE nps_surveys IS 'Net Promoter Score survey responses';
COMMENT ON TABLE feedback_templates IS 'Configurable templates for different feedback types';
COMMENT ON TABLE feedback_campaigns IS 'Automated feedback request campaigns';
COMMENT ON TABLE feedback_analytics IS 'Aggregated analytics and metrics for feedback data';
COMMENT ON TABLE feedback_subscriptions IS 'User subscriptions for feedback notifications';
COMMENT ON TABLE feedback_integration_logs IS 'Logs for external system integrations';
COMMENT ON TABLE feedback_tags IS 'Managed tags for categorizing feedback';