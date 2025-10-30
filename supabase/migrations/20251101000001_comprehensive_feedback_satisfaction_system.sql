-- Comprehensive Client Feedback and Satisfaction Measurement System
-- Migration for luxury beauty/fitness platform feedback management

-- =====================================================
-- FEEDBACK CORE TABLES
-- =====================================================

-- Feedback surveys and campaigns
CREATE TABLE IF NOT EXISTS feedback_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_pl TEXT NOT NULL,
    description_en TEXT,
    description_pl TEXT,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('post_service', 'nps', 'ces', 'general_satisfaction', 'staff_evaluation', 'facility_feedback')),
    service_type TEXT CHECK (service_type IN ('beauty', 'fitness', 'lifestyle', 'all')),
    trigger_events TEXT[] DEFAULT '{}', -- Events that trigger this survey
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- Survey configuration and logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Survey questions with dynamic logic support
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES feedback_surveys(id) ON DELETE CASCADE,
    question_text_en TEXT NOT NULL,
    question_text_pl TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'nps', 'ces', 'multiple_choice', 'text', 'emoji', 'star_rating')),
    display_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- Question-specific config (options, scale, etc.)
    conditional_logic JSONB DEFAULT '{}', -- Show/hide logic based on previous answers
    validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback submissions and responses
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES feedback_surveys(id),
    booking_id UUID REFERENCES bookings(id),
    client_id UUID REFERENCES profiles(id),
    service_id UUID REFERENCES services(id),
    staff_id UUID REFERENCES profiles(id),
    submission_source TEXT NOT NULL CHECK (submission_source IN ('email', 'sms', 'in_app', 'qr_code', 'tablet', 'website', 'mobile_app')),
    submission_channel TEXT NOT NULL DEFAULT 'online',
    session_id TEXT, -- For tracking partial completions
    is_complete BOOLEAN DEFAULT false,
    completion_rate INTEGER DEFAULT 0, -- Percentage of survey completed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_to_complete INTEGER, -- Seconds taken to complete
    client_ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual question responses
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    response_value TEXT, -- For text responses
    response_number NUMERIC, -- For numeric ratings
    response_array TEXT[], -- For multiple choice
    response_metadata JSONB DEFAULT '{}', -- Additional response data
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_seconds INTEGER -- Time taken to answer this question
);

-- =====================================================
-- SATISFACTION METRICS AND ANALYTICS
-- =====================================================

-- Overall satisfaction scores by different dimensions
CREATE TABLE IF NOT EXISTS satisfaction_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    service_id UUID REFERENCES services(id),
    booking_id UUID REFERENCES bookings(id),
    staff_id UUID REFERENCES profiles(id),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('overall_satisfaction', 'service_quality', 'staff_professionalism', 'facility_cleanliness', 'value_for_money', 'likelihood_to_return', 'likelihood_to_recommend', 'emotional_satisfaction', 'luxury_experience', 'personalization', 'convenience', 'digital_experience', 'communication_quality')),
    score NUMERIC NOT NULL CHECK (score >= 1 AND score <= 5),
    max_score NUMERIC DEFAULT 5,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    measurement_source TEXT NOT NULL, -- survey, review, direct_feedback, etc.
    context JSONB DEFAULT '{}', -- Additional context for the measurement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Net Promoter Score (NPS) measurements
CREATE TABLE IF NOT EXISTS nps_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    service_category TEXT CHECK (service_category IN ('beauty', 'fitness', 'lifestyle')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    promoter_category TEXT NOT NULL CHECK (promoter_category IN ('detractor', 'passive', 'promoter')),
    feedback_text TEXT,
    reason TEXT, -- Reason for the score
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    measurement_source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Effort Score (CES) measurements
CREATE TABLE IF NOT EXISTS ces_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('booking_process', 'rescheduling', 'cancellation', 'payment', 'support_interaction', 'service_completion', 'feedback_submission')),
    effort_score NUMERIC NOT NULL CHECK (effort_score >= 1 AND effort <= 7),
    effort_level TEXT NOT NULL CHECK (effort_level IN ('very_difficult', 'difficult', 'neutral', 'easy', 'very_easy')),
    feedback_text TEXT,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    measurement_source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SENTIMENT ANALYSIS AND TEXT PROCESSING
-- =====================================================

-- Sentiment analysis results for text feedback
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL, -- Can reference feedback_responses, reviews, etc.
    source_type TEXT NOT NULL CHECK (source_type IN ('feedback_response', 'review', 'support_interaction', 'social_media')),
    text_content TEXT NOT NULL,
    sentiment_score NUMERIC CHECK (sentiment_score >= -1 AND sentiment_score <= 1), -- -1 (negative) to 1 (positive)
    sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    emotions JSONB DEFAULT '{}', -- Detected emotions with scores
    keywords TEXT[] DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    entities JSONB DEFAULT '{}', -- Named entities (people, places, services)
    language_detected TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback themes and topics for categorization
CREATE TABLE IF NOT EXISTS feedback_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name_en TEXT NOT NULL UNIQUE,
    theme_name_pl TEXT NOT NULL UNIQUE,
    theme_category TEXT NOT NULL CHECK (theme_category IN ('service_quality', 'staff_behavior', 'facility', 'pricing', 'communication', 'technology', 'scheduling', 'products', 'atmosphere', 'cleanliness', 'professionalism', 'other')),
    is_positive BOOLEAN, -- Whether this theme is generally positive or negative
    is_active BOOLEAN DEFAULT true,
    parent_theme_id UUID REFERENCES feedback_themes(id),
    keywords TEXT[] DEFAULT '{}',
    description_en TEXT,
    description_pl TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link feedback submissions to identified themes
CREATE TABLE IF NOT EXISTS feedback_theme_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL, -- Can reference various feedback tables
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('submission', 'response', 'review', 'external_review')),
    theme_id UUID NOT NULL REFERENCES feedback_themes(id),
    relevance_score NUMERIC CHECK (relevance_score >= 0 AND relevance_score <= 1),
    auto_detected BOOLEAN DEFAULT false,
    manually_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICE RECOVERY AND FOLLOW-UP
-- =====================================================

-- Service recovery cases and workflows
CREATE TABLE IF NOT EXISTS service_recovery_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    trigger_feedback_id UUID, -- Reference to the feedback that triggered recovery
    booking_id UUID REFERENCES bookings(id),
    service_id UUID REFERENCES services(id),
    staff_id UUID REFERENCES profiles(id),
    recovery_priority TEXT NOT NULL DEFAULT 'medium' CHECK (recovery_priority IN ('low', 'medium', 'high', 'critical')),
    recovery_status TEXT NOT NULL DEFAULT 'new' CHECK (recovery_status IN ('new', 'assigned', 'in_progress', 'client_contacted', 'resolved', 'closed', 'escalated')),
    satisfaction_before NUMERIC CHECK (satisfaction_before >= 1 AND satisfaction_before <= 5),
    satisfaction_after NUMERIC CHECK (satisfaction_after >= 1 AND satisfaction_after <= 5),
    recovery_cost NUMERIC,
    recovery_actions JSONB DEFAULT '{}', -- Actions taken for recovery
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_scheduled_at TIMESTAMP WITH TIME ZONE,
    follow_up_completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES profiles(id), -- Staff member assigned to recovery
    case_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service recovery tasks and checklists
CREATE TABLE IF NOT EXISTS recovery_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_case_id UUID NOT NULL REFERENCES service_recovery_cases(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('client_contact', 'staff_training', 'process_improvement', 'compensation', 'follow_up', 'escalation')),
    task_description TEXT NOT NULL,
    task_status TEXT NOT NULL DEFAULT 'pending' CHECK (task_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES profiles(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    task_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compensation and recovery offers
CREATE TABLE IF NOT EXISTS recovery_compensation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_case_id UUID REFERENCES service_recovery_cases(id),
    compensation_type TEXT NOT NULL CHECK (compensation_type IN ('discount', 'free_service', 'refund', 'gift', 'upgrade', 'loyalty_points')),
    compensation_value NUMERIC,
    compensation_details TEXT,
    offer_status TEXT NOT NULL DEFAULT 'offered' CHECK (offer_status IN ('offered', 'accepted', 'declined', 'expired')),
    client_response TEXT,
    offered_by UUID REFERENCES profiles(id),
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REAL-TIME MONITORING AND ALERTS
-- =====================================================

-- Real-time satisfaction monitoring
CREATE TABLE IF NOT EXISTS satisfaction_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_score', 'negative_sentiment', 'multiple_complaints', 'trend_decline', 'staff_performance', 'service_issue', 'facility_problem')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    alert_title TEXT NOT NULL,
    alert_description TEXT,
    trigger_data JSONB DEFAULT '{}', -- Data that triggered the alert
    source_feedback_id UUID, -- Reference to related feedback
    client_id UUID REFERENCES profiles(id),
    service_id UUID REFERENCES services(id),
    staff_id UUID REFERENCES profiles(id),
    location_id TEXT,
    alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
    assigned_to UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    auto_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert recipients and notification preferences
CREATE TABLE IF NOT EXISTS alert_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    alert_types TEXT[] DEFAULT '{}', -- Types of alerts this user receives
    severity_levels TEXT[] DEFAULT '{}', -- Severity levels to notify
    notification_methods TEXT[] DEFAULT '{"email", "in_app"}', -- How to notify
    notification_preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INTEGRATIONS AND EXTERNAL FEEDBACK
-- =====================================================

-- External review platform integrations
CREATE TABLE IF NOT EXISTS external_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('google', 'facebook', 'booksy', 'yelp', 'tripadvisor', 'local_directory')),
    external_review_id TEXT NOT NULL,
    client_name TEXT,
    rating NUMERIC NOT NULL,
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    sentiment_score NUMERIC CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    is_verified BOOLEAN DEFAULT false,
    response_required BOOLEAN DEFAULT false,
    response_sent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, external_review_id)
);

-- Feedback aggregation from multiple sources
CREATE TABLE IF NOT EXISTS feedback_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    aggregation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_feedback_entries INTEGER DEFAULT 0,
    average_satisfaction_score NUMERIC,
    average_nps_score NUMERIC,
    average_ces_score NUMERIC,
    sentiment_distribution JSONB DEFAULT '{}', -- Positive, negative, neutral counts
    top_themes TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    strength_areas TEXT[] DEFAULT '{}',
    trend_data JSONB DEFAULT '{}', -- Period-over-period changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, aggregation_period_start, aggregation_period_end)
);

-- =====================================================
-- PREDICTIVE ANALYTICS AND INTELLIGENCE
-- =====================================================

-- Client satisfaction predictions and risk analysis
CREATE TABLE IF NOT EXISTS client_satisfaction_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn_risk', 'satisfaction_decline', 'complaint_likelihood', 'recommendation_probability', 'repeat_business_probability')),
    prediction_score NUMERIC NOT NULL CHECK (prediction_score >= 0 AND prediction_score <= 1),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 1),
    influencing_factors JSONB DEFAULT '{}', -- Factors influencing the prediction
    recommended_actions JSONB DEFAULT '{}',
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service performance insights and recommendations
CREATE TABLE IF NOT EXISTS service_performance_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    insight_type TEXT NOT NULL CHECK (insight_type IN ('performance_improvement', 'staff_training', 'process_optimization', 'client_retention', 'revenue_optimization', 'competitive_advantage')),
    insight_title TEXT NOT NULL,
    insight_description TEXT NOT NULL,
    impact_potential TEXT NOT NULL CHECK (impact_potential IN ('low', 'medium', 'high', 'critical')),
    implementation_effort TEXT NOT NULL CHECK (implementation_effort IN ('low', 'medium', 'high')),
    priority_score NUMERIC CHECK (priority_score >= 0 AND priority_score <= 10),
    supporting_data JSONB DEFAULT '{}',
    recommended_actions JSONB DEFAULT '{}',
    expected_outcomes JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'implemented', 'measuring', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAFF PERFORMANCE AND TRAINING
-- =====================================================

-- Staff performance tracking based on client feedback
CREATE TABLE IF NOT EXISTS staff_feedback_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES profiles(id),
    evaluation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    evaluation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_reviews INTEGER DEFAULT 0,
    average_rating NUMERIC,
    average_satisfaction_score NUMERIC,
    client_compliment_count INTEGER DEFAULT 0,
    client_complaint_count INTEGER DEFAULT 0,
    nps_contribution NUMERIC, -- NPS score impact from this staff member
    ces_score NUMERIC, -- Customer effort score for this staff member
    strength_areas TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    client_themes JSONB DEFAULT '{}', -- Common themes in client feedback
    performance_trend TEXT CHECK (performance_trend IN ('improving', 'stable', 'declining')),
    ranking_position INTEGER, -- Position among all staff
    total_staff_compared INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, evaluation_period_start, evaluation_period_end)
);

-- Training recommendations based on feedback analysis
CREATE TABLE IF NOT EXISTS staff_training_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES profiles(id),
    training_category TEXT NOT NULL CHECK (training_category IN ('customer_service', 'technical_skills', 'communication', 'upselling', 'complaint_handling', 'product_knowledge', 'time_management', 'luxury_service_standards')),
    training_priority TEXT NOT NULL CHECK (training_priority IN ('low', 'medium', 'high', 'critical')),
    training_reason TEXT NOT NULL,
    supporting_feedback JSONB DEFAULT '{}', -- Feedback that supports this recommendation
    recommended_training_programs JSONB DEFAULT '{}',
    target_completion_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    completion_date TIMESTAMP WITH TIME ZONE,
    effectiveness_score NUMERIC CHECK (effectiveness_score >= 0 AND effectiveness_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Feedback submissions indexes
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_client_id ON feedback_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_service_id ON feedback_submissions(service_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_booking_id ON feedback_submissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_staff_id ON feedback_submissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_completed_at ON feedback_submissions(completed_at);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_survey_id ON feedback_submissions(survey_id);

-- Satisfaction metrics indexes
CREATE INDEX IF NOT EXISTS idx_satisfaction_metrics_client_id ON satisfaction_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_metrics_service_id ON satisfaction_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_metrics_staff_id ON satisfaction_metrics(staff_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_metrics_type_date ON satisfaction_metrics(metric_type, measurement_date);

-- NPS and CES indexes
CREATE INDEX IF NOT EXISTS idx_nps_measurements_client_id ON nps_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_nps_measurements_date ON nps_measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_ces_measurements_client_id ON ces_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_ces_measurements_date ON ces_measurements(measurement_date);

-- Sentiment analysis indexes
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_source ON sentiment_analysis(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment_label, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_processed_at ON sentiment_analysis(processed_at);

-- Service recovery indexes
CREATE INDEX IF NOT EXISTS idx_service_recovery_cases_client_id ON service_recovery_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_service_recovery_cases_status ON service_recovery_cases(recovery_status);
CREATE INDEX IF NOT EXISTS idx_service_recovery_cases_priority ON service_recovery_cases(recovery_priority);
CREATE INDEX IF NOT EXISTS idx_service_recovery_cases_created_at ON service_recovery_cases(created_at);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_satisfaction_alerts_status ON satisfaction_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_satisfaction_alerts_severity ON satisfaction_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_satisfaction_alerts_type ON satisfaction_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_satisfaction_alerts_created_at ON satisfaction_alerts(created_at);

-- Staff performance indexes
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_id ON staff_feedback_performance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_period ON staff_feedback_performance(evaluation_period_start, evaluation_period_end);

-- =====================================================
-- SECURITY AND ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_theme_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_recovery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_feedback_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback surveys
CREATE POLICY "Admins can view all surveys" ON feedback_surveys FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins can create surveys" ON feedback_surveys FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- RLS Policies for feedback submissions
CREATE POLICY "Users can view their own submissions" ON feedback_submissions FOR SELECT USING (
    client_id = auth.uid()
);

CREATE POLICY "Admins can view all submissions" ON feedback_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

CREATE POLICY "Users can create their own submissions" ON feedback_submissions FOR INSERT WITH CHECK (
    client_id = auth.uid()
);

-- RLS Policies for satisfaction metrics
CREATE POLICY "Users can view their own metrics" ON satisfaction_metrics FOR SELECT USING (
    client_id = auth.uid()
);

CREATE POLICY "Admins can view all metrics" ON satisfaction_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- RLS Policies for service recovery cases
CREATE POLICY "Admins can view all recovery cases" ON service_recovery_cases FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

CREATE POLICY "Staff can view assigned recovery cases" ON service_recovery_cases FOR SELECT USING (
    assigned_to = auth.uid()
);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_service_recovery_cases_updated_at BEFORE UPDATE ON service_recovery_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recovery_tasks_updated_at BEFORE UPDATE ON recovery_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_recipients_updated_at BEFORE UPDATE ON alert_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_performance_insights_updated_at BEFORE UPDATE ON service_performance_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_training_recommendations_updated_at BEFORE UPDATE ON staff_training_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate satisfaction metrics from feedback
CREATE OR REPLACE FUNCTION calculate_satisfaction_metrics_from_feedback(
    p_submission_id UUID,
    p_client_id UUID,
    p_service_id UUID,
    p_booking_id UUID,
    p_staff_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_avg_score NUMERIC;
    v_submission_count INTEGER;
BEGIN
    -- Calculate average satisfaction score from this submission
    SELECT AVG(response_number) INTO v_avg_score
    FROM feedback_responses
    WHERE submission_id = p_submission_id
    AND response_number IS NOT NULL;

    -- Insert satisfaction metrics for different dimensions
    INSERT INTO satisfaction_metrics (
        client_id,
        service_id,
        booking_id,
        staff_id,
        metric_type,
        score,
        measurement_source
    )
    SELECT
        p_client_id,
        p_service_id,
        p_booking_id,
        p_staff_id,
        sq.question_type::TEXT,
        fr.response_number,
        'survey'
    FROM feedback_responses fr
    JOIN survey_questions sq ON fr.question_id = sq.id
    WHERE fr.submission_id = p_submission_id
    AND fr.response_number IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger service recovery for low scores
CREATE OR REPLACE FUNCTION trigger_service_recovery_check()
RETURNS TRIGGER AS $$
DECLARE
    v_low_score_threshold NUMERIC := 2.5;
    v_has_low_score BOOLEAN := FALSE;
BEGIN
    -- Check if any response indicates dissatisfaction
    SELECT EXISTS(
        SELECT 1 FROM feedback_responses
        WHERE submission_id = NEW.id
        AND response_number <= v_low_score_threshold
    ) INTO v_has_low_score;

    IF v_has_low_score THEN
        -- Create service recovery case
        INSERT INTO service_recovery_cases (
            client_id,
            trigger_feedback_id,
            booking_id,
            service_id,
            staff_id,
            recovery_priority,
            recovery_status,
            satisfaction_before
        ) VALUES (
            NEW.client_id,
            NEW.id,
            NEW.booking_id,
            NEW.service_id,
            NEW.staff_id,
            CASE
                WHEN EXISTS(SELECT 1 FROM feedback_responses WHERE submission_id = NEW.id AND response_number <= 1.5) THEN 'critical'
                WHEN EXISTS(SELECT 1 FROM feedback_responses WHERE submission_id = NEW.id AND response_number <= 2.0) THEN 'high'
                ELSE 'medium'
            END,
            'new',
            (SELECT AVG(response_number) FROM feedback_responses WHERE submission_id = NEW.id AND response_number IS NOT NULL)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for service recovery
CREATE TRIGGER trigger_service_recovery_on_low_score
    AFTER INSERT ON feedback_submissions
    FOR EACH ROW
    WHEN (NEW.is_complete = true)
    EXECUTE FUNCTION trigger_service_recovery_check();

-- Function to calculate NPS category
CREATE OR REPLACE FUNCTION calculate_nps_category(p_score INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN p_score >= 9 THEN 'promoter'
        WHEN p_score >= 7 THEN 'passive'
        ELSE 'detractor'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate CES effort level
CREATE OR REPLACE FUNCTION calculate_ces_effort_level(p_score NUMERIC)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN p_score <= 2 THEN 'very_easy'
        WHEN p_score <= 3 THEN 'easy'
        WHEN p_score <= 5 THEN 'neutral'
        WHEN p_score <= 6 THEN 'difficult'
        ELSE 'very_difficult'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- =====================================================

-- Comprehensive satisfaction overview view
CREATE OR REPLACE VIEW satisfaction_overview AS
SELECT
    DATE_TRUNC('month', sm.measurement_date) as month,
    sm.metric_type,
    AVG(sm.score) as average_score,
    COUNT(*) as measurement_count,
    STDDEV(sm.score) as score_stddev,
    MIN(sm.score) as min_score,
    MAX(sm.score) as max_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sm.score) as median_score,
    -- Service breakdown
    COUNT(DISTINCT sm.service_id) as unique_services,
    COUNT(DISTINCT sm.client_id) as unique_clients,
    COUNT(DISTINCT sm.staff_id) as unique_staff
FROM satisfaction_metrics sm
GROUP BY
    DATE_TRUNC('month', sm.measurement_date),
    sm.metric_type
ORDER BY month DESC, metric_type;

-- NPS trend view
CREATE OR REPLACE VIEW nps_trend AS
SELECT
    DATE_TRUNC('month', nm.measurement_date) as month,
    COUNT(*) as total_respondents,
    COUNT(CASE WHEN nm.promoter_category = 'promoter' THEN 1 END) as promoters,
    COUNT(CASE WHEN nm.promoter_category = 'detractor' THEN 1 END) as detractors,
    COUNT(CASE WHEN nm.promoter_category = 'passive' THEN 1 END) as passives,
    ROUND(
        (COUNT(CASE WHEN nm.promoter_category = 'promoter' THEN 1 END) * 100.0 / COUNT(*)) -
        (COUNT(CASE WHEN nm.promoter_category = 'detractor' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as nps_score,
    AVG(nm.score) as average_score,
    nm.service_category
FROM nps_measurements nm
GROUP BY
    DATE_TRUNC('month', nm.measurement_date),
    nm.service_category
ORDER BY month DESC, service_category;

-- Staff performance ranking view
CREATE OR REPLACE VIEW staff_performance_ranking AS
SELECT
    sfp.staff_id,
    p.display_name as staff_name,
    sfp.evaluation_period_end,
    sfp.average_rating,
    sfp.average_satisfaction_score,
    sfp.total_reviews,
    sfp.client_compliment_count,
    sfp.client_complaint_count,
    sfp.nps_contribution,
    sfp.ces_score,
    sfp.ranking_position,
    sfp.total_staff_compared,
    ROW_NUMBER() OVER (ORDER BY sfp.average_satisfaction_score DESC) as overall_rank,
    ROW_NUMBER() OVER (ORDER BY sfp.total_reviews DESC) as feedback_volume_rank,
    ROW_NUMBER() OVER (ORDER BY sfp.nps_contribution DESC) as nps_rank
FROM staff_feedback_performance sfp
JOIN profiles p ON sfp.staff_id = p.id
WHERE sfp.evaluation_period_end >= CURRENT_DATE - INTERVAL '3 months'
ORDER BY sfp.average_satisfaction_score DESC;

-- Service recovery effectiveness view
CREATE OR REPLACE VIEW service_recovery_effectiveness AS
SELECT
    DATE_TRUNC('month', src.created_at) as month,
    COUNT(*) as total_cases,
    COUNT(CASE WHEN src.recovery_status = 'resolved' THEN 1 END) as resolved_cases,
    COUNT(CASE WHEN src.satisfaction_after IS NOT NULL AND src.satisfaction_after > COALESCE(src.satisfaction_before, 0) THEN 1 END) as improvement_cases,
    AVG(CASE WHEN src.satisfaction_before IS NOT NULL THEN src.satisfaction_before END) as avg_satisfaction_before,
    AVG(CASE WHEN src.satisfaction_after IS NOT NULL THEN src.satisfaction_after END) as avg_satisfaction_after,
    AVG(CASE WHEN src.satisfaction_before IS NOT NULL AND src.satisfaction_after IS NOT NULL
             THEN src.satisfaction_after - src.satisfaction_before END) as avg_improvement,
    SUM(COALESCE(rc.compensation_value, 0)) as total_compensation_cost,
    AVG(COALESCE(rc.compensation_value, 0)) as avg_compensation_cost,
    COUNT(CASE WHEN src.recovery_priority = 'critical' THEN 1 END) as critical_cases,
    COUNT(CASE WHEN src.recovery_priority = 'high' THEN 1 END) as high_priority_cases
FROM service_recovery_cases src
LEFT JOIN recovery_compensation rc ON src.id = rc.recovery_case_id
GROUP BY DATE_TRUNC('month', src.created_at)
ORDER BY month DESC;

-- =====================================================
-- SAMPLE DATA INSERTION FOR DEMONSTRATION
-- =====================================================

-- Insert sample feedback themes
INSERT INTO feedback_themes (theme_name_en, theme_name_pl, theme_category, is_positive, keywords) VALUES
('Excellent Service', 'Doskonała Obsługa', 'service_quality', true, ARRAY['excellent', 'amazing', 'fantastic', 'wonderful', 'świetny', 'doskonały', 'fantastyczny']),
('Professional Staff', 'Profesjonalna Obsługa', 'staff_behavior', true, ARRAY['professional', 'knowledgeable', 'skilled', 'expert', 'profesjonalny', 'kompetentny', 'ekspert']),
('Clean Environment', 'Czyste Otoczenie', 'cleanliness', true, ARRAY['clean', 'spotless', 'hygienic', 'tidy', 'czysto', 'higienicznie', 'porządek']),
('Long Waiting Time', 'Długi Czas Oczekiwania', 'scheduling', false, ARRAY['wait', 'waiting', 'late', 'delay', 'czekać', 'opóźnienie', 'spóźnienie']),
('High Prices', 'Wysokie Ceny', 'pricing', false, ARRAY['expensive', 'overpriced', 'costly', 'pricey', 'drogi', 'kosztowny', 'cena']),
('Poor Communication', 'Słaba Komunikacja', 'communication', false, ARRAY['unclear', 'confusing', 'rude', 'unhelpful', 'niejasne', 'nieuprzejmy', 'niepomocny']),
('Great Results', 'Świetne Efekty', 'service_quality', true, ARRAY['results', 'outcome', 'effect', 'improvement', 'rezultaty', 'efekty', 'poprawa']),
('Comfortable Atmosphere', 'Wygodna Atmosfera', 'atmosphere', true, ARRAY['comfortable', 'relaxing', 'peaceful', 'welcoming', 'wygodnie', 'relaksująco', 'spokojnie'])
ON CONFLICT (theme_name_en) DO NOTHING;

-- Insert sample surveys
INSERT INTO feedback_surveys (title_en, title_pl, description_en, description_pl, survey_type, service_type, trigger_events, config) VALUES
('Post-Service Satisfaction Survey', 'Ankieta Satysfakcji po Usłudze', 'Help us improve your experience by sharing your feedback', 'Pomóż nam poprawić Twoje doświadczenia, dzieląc się opinią', 'post_service', 'all', ARRAY['booking_completed'], JSONB '{"auto_trigger": true, "trigger_delay_hours": 2, "max_reminders": 2}'),
('Net Promoter Score Survey', 'Ankieta Net Promoter Score', 'How likely are you to recommend us to friends and family?', 'Jak prawdopodobne jest, że polecisz nas znajomym i rodzinie?', 'nps', 'all', ARRAY['booking_completed'], JSONB '{"frequency_days": 90, "exclude_recent_negative": true}'),
('Customer Effort Score', 'Wynik Wysiłku Klienta', 'How easy was it to complete your booking and service experience?', 'Jak łatwo było zrealizować rezerwację i korzystać z usługi?', 'ces', 'all', ARRAY['booking_completed'], JSONB '{"measure_booking_process": true, "measure_service_experience": true}')
ON CONFLICT DO NOTHING;

-- Create initial alert recipients (admin users will need to be assigned)
INSERT INTO alert_recipients (user_id, alert_types, severity_levels, notification_methods)
SELECT
    id,
    ARRAY['low_score', 'negative_sentiment', 'multiple_complaints', 'trend_decline'],
    ARRAY['warning', 'critical', 'emergency'],
    ARRAY['email', 'in_app']
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON feedback_surveys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON survey_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON feedback_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON feedback_responses TO authenticated;
GRANT SELECT ON satisfaction_overview TO authenticated;
GRANT SELECT ON nps_trend TO authenticated;
GRANT SELECT ON staff_performance_ranking TO authenticated;
GRANT SELECT ON service_recovery_effectiveness TO authenticated;

COMMIT;