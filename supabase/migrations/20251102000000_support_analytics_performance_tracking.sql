-- Support Analytics and Performance Tracking System
-- Comprehensive analytics schema for luxury beauty/fitness support platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- CORE ANALYTICS TABLES
-- ========================================

-- Support metrics table for real-time performance tracking
CREATE TABLE IF NOT EXISTS support_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_hour INTEGER NOT NULL CHECK (metric_hour >= 0 AND metric_hour <= 23),

    -- Volume metrics
    total_tickets INTEGER DEFAULT 0,
    new_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    open_tickets INTEGER DEFAULT 0,
    escalated_tickets INTEGER DEFAULT 0,

    -- Response time metrics (in minutes)
    avg_first_response_time DECIMAL(10,2) DEFAULT 0,
    avg_resolution_time DECIMAL(10,2) DEFAULT 0,
    median_response_time DECIMAL(10,2) DEFAULT 0,
    p95_response_time DECIMAL(10,2) DEFAULT 0,

    -- Quality metrics
    first_contact_resolution_rate DECIMAL(5,2) DEFAULT 0 CHECK (first_contact_resolution_rate >= 0 AND first_contact_resolution_rate <= 100),
    customer_satisfaction_score DECIMAL(5,2) DEFAULT 0 CHECK (customer_satisfaction_score >= 0 AND customer_satisfaction_score <= 5),
    net_promoter_score INTEGER DEFAULT 0 CHECK (net_promoter_score >= -100 AND net_promoter_score <= 100),

    -- Agent metrics
    active_agents INTEGER DEFAULT 0,
    agent_utilization_rate DECIMAL(5,2) DEFAULT 0 CHECK (agent_utilization_rate >= 0 AND agent_utilization_rate <= 100),

    -- Channel breakdown
    email_tickets INTEGER DEFAULT 0,
    chat_tickets INTEGER DEFAULT 0,
    phone_tickets INTEGER DEFAULT 0,
    social_tickets INTEGER DEFAULT 0,

    -- Priority breakdown
    urgent_tickets INTEGER DEFAULT 0,
    high_priority_tickets INTEGER DEFAULT 0,
    normal_priority_tickets INTEGER DEFAULT 0,
    low_priority_tickets INTEGER DEFAULT 0,

    -- SLA metrics
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0 CHECK (sla_compliance_rate >= 0 AND sla_compliance_rate <= 100),
    sla_breaches INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(metric_date, metric_hour)
);

-- Agent performance tracking table
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,

    -- Productivity metrics
    tickets_handled INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    avg_handling_time DECIMAL(10,2) DEFAULT 0,
    first_contact_resolutions INTEGER DEFAULT 0,

    -- Quality metrics
    customer_satisfaction_avg DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),

    -- Availability metrics
    available_time_minutes INTEGER DEFAULT 0,
    talk_time_minutes INTEGER DEFAULT 0,
    after_call_work_minutes INTEGER DEFAULT 0,
    break_time_minutes INTEGER DEFAULT 0,

    -- Performance indicators
    response_rate DECIMAL(5,2) DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0,
    escalation_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(agent_id, performance_date)
);

-- Customer satisfaction and feedback tracking
CREATE TABLE IF NOT EXISTS customer_satisfaction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Survey responses
    csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    effort_score INTEGER CHECK (effort_score >= 1 AND effort_score <= 5),

    -- Feedback details
    feedback_text TEXT,
    feedback_categories TEXT[], -- Array of feedback categories
    sentiment_score DECIMAL(5,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),

    -- Context
    support_channel VARCHAR(50),
    interaction_type VARCHAR(50),
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base analytics table
CREATE TABLE IF NOT EXISTS knowledge_base_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL,

    -- Usage metrics
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,

    -- Search metrics
    search_impressions INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,
    avg_position DECIMAL(5,2) DEFAULT 0,

    -- Resolution metrics
    resolved_issues INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(article_id, analytics_date)
);

-- Chat performance analytics table
CREATE TABLE IF NOT EXISTS chat_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,

    -- Timing metrics
    session_duration_minutes INTEGER,
    first_response_time_seconds INTEGER,
    avg_response_time_seconds INTEGER,
    wait_time_seconds INTEGER,

    -- Engagement metrics
    messages_exchanged INTEGER,
    customer_messages INTEGER,
    agent_messages INTEGER,

    -- Resolution metrics
    resolved BOOLEAN DEFAULT FALSE,
    resolution_time_minutes INTEGER,
    escalation_required BOOLEAN DEFAULT FALSE,

    -- Satisfaction metrics
    session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
    customer_effort_score INTEGER CHECK (customer_effort_score >= 1 AND customer_effort_score <= 5),

    -- Agent metrics
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    concurrent_chats INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support channel effectiveness table
CREATE TABLE IF NOT EXISTS channel_effectiveness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(50) NOT NULL,
    analytics_date DATE NOT NULL,

    -- Volume metrics
    total_conversations INTEGER DEFAULT 0,
    successful_conversations INTEGER DEFAULT 0,

    -- Performance metrics
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0,
    customer_satisfaction DECIMAL(5,2) DEFAULT 0,

    -- Cost metrics
    cost_per_interaction DECIMAL(10,2) DEFAULT 0,
    agent_time_spent_minutes INTEGER DEFAULT 0,

    -- Quality metrics
    first_contact_resolution_rate DECIMAL(5,2) DEFAULT 0,
    escalation_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(channel, analytics_date)
);

-- ========================================
-- PREDICTIVE ANALYTICS TABLES
-- ========================================

-- Volume forecasting table
CREATE TABLE IF NOT EXISTS volume_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_date DATE NOT NULL,
    forecast_horizon_days INTEGER NOT NULL,
    forecast_model VARCHAR(50) NOT NULL,

    -- Forecasted values
    predicted_ticket_volume INTEGER,
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,

    -- Predictive factors
    seasonality_factor DECIMAL(5,4),
    trend_factor DECIMAL(5,4),
    day_of_week_factor DECIMAL(5,4),

    -- Accuracy metrics
    actual_volume INTEGER, -- Filled after the date passes
    forecast_error INTEGER,
    mean_absolute_percentage_error DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(forecast_date, forecast_model)
);

-- Staffing requirements prediction table
CREATE TABLE IF NOT EXISTS staffing_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL, -- e.g., "09:00-10:00"

    -- Predicted requirements
    predicted_agents_needed INTEGER,
    predicted_volume INTEGER,
    predicted_avg_handling_time DECIMAL(10,2),

    -- Staffing metrics
    scheduled_agents INTEGER,
    agent_capacity_utilization DECIMAL(5,2),
    predicted_wait_time DECIMAL(10,2),

    -- Service level targets
    target_service_level DECIMAL(5,2),
    predicted_service_level DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(prediction_date, time_slot)
);

-- Churn risk prediction table
CREATE TABLE IF NOT EXISTS churn_risk_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,

    -- Risk metrics
    churn_risk_score DECIMAL(5,2) CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

    -- Contributing factors
    recent_support_issues INTEGER,
    avg_resolution_time DECIMAL(10,2),
    satisfaction_trend DECIMAL(5,2),
    escalation_history INTEGER,

    -- Customer context
    customer_lifetime_months INTEGER,
    total_bookings INTEGER,
    total_revenue DECIMAL(10,2),
    vip_status BOOLEAN DEFAULT FALSE,

    -- Intervention recommendations
    recommended_action TEXT,
    intervention_priority INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- QUALITY ASSURANCE TABLES
-- ========================================

-- Conversation quality scoring table
CREATE TABLE IF NOT EXISTS conversation_quality_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL,

    -- Quality criteria scores (0-10)
    empathy_score INTEGER CHECK (empathy_score >= 0 AND empathy_score <= 10),
    clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 10),
    efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 10),
    knowledge_score INTEGER CHECK (knowledge_score >= 0 AND knowledge_score <= 10),
    professionalism_score INTEGER CHECK (professionalism_score >= 0 AND professionalism_score <= 10),

    -- Overall metrics
    overall_quality_score INTEGER CHECK (overall_quality_score >= 0 AND overall_quality_score <= 100),
    quality_grade VARCHAR(2) CHECK (quality_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),

    -- Detailed feedback
    strengths TEXT[],
    improvement_areas TEXT[],
    specific_feedback TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CUSTOMER JOURNEY ANALYTICS
-- ========================================

-- Customer journey analytics table
CREATE TABLE IF NOT EXISTS customer_journey_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    journey_id UUID NOT NULL,
    touchpoint_sequence INTEGER NOT NULL,

    -- Touchpoint details
    touchpoint_type VARCHAR(50) NOT NULL, -- 'support_ticket', 'booking', 'knowledge_base', etc.
    touchpoint_channel VARCHAR(50),
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Journey metrics
    session_duration_minutes INTEGER,
    pages_viewed INTEGER,
    actions_taken INTEGER,

    -- Satisfaction metrics
    touchpoint_satisfaction INTEGER CHECK (touchpoint_satisfaction >= 1 AND touchpoint_satisfaction <= 5),
    effort_required INTEGER CHECK (effort_required >= 1 AND effort_required <= 5),

    -- Outcome metrics
    goal_achieved BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support touchpoint effectiveness table
CREATE TABLE IF NOT EXISTS support_touchpoint_effectiveness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    touchpoint_date DATE NOT NULL,
    touchpoint_type VARCHAR(50) NOT NULL,

    -- Effectiveness metrics
    total_touchpoints INTEGER DEFAULT 0,
    successful_resolutions INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(5,2) DEFAULT 0,
    time_to_resolution DECIMAL(10,2) DEFAULT 0,

    -- Business impact metrics
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    revenue_impact DECIMAL(10,2) DEFAULT 0,
    retention_impact DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(touchpoint_date, touchpoint_type)
);

-- ========================================
-- BUSINESS INTELLIGENCE TABLES
-- ========================================

-- Support cost analysis table
CREATE TABLE IF NOT EXISTS support_cost_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date DATE NOT NULL,
    cost_category VARCHAR(50) NOT NULL,

    -- Cost metrics
    total_cost DECIMAL(10,2) DEFAULT 0,
    agent_costs DECIMAL(10,2) DEFAULT 0,
    technology_costs DECIMAL(10,2) DEFAULT 0,
    training_costs DECIMAL(10,2) DEFAULT 0,

    -- Efficiency metrics
    cost_per_ticket DECIMAL(10,2) DEFAULT 0,
    cost_per_resolution DECIMAL(10,2) DEFAULT 0,
    cost_per_satisfied_customer DECIMAL(10,2) DEFAULT 0,

    -- ROI metrics
    revenue_retained DECIMAL(10,2) DEFAULT 0,
    cost_savings DECIMAL(10,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(analysis_date, cost_category)
);

-- Support impact on business metrics table
CREATE TABLE IF NOT EXISTS support_business_impact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impact_date DATE NOT NULL,

    -- Customer metrics
    new_customers_acquired INTEGER DEFAULT 0,
    customers_retained INTEGER DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,

    -- Revenue metrics
    support_attributed_revenue DECIMAL(10,2) DEFAULT 0,
    upsell_revenue DECIMAL(10,2) DEFAULT 0,
    cross_sell_revenue DECIMAL(10,2) DEFAULT 0,

    -- Brand metrics
    brand_sentiment_score DECIMAL(5,2) DEFAULT 0,
    social_media_mentions INTEGER DEFAULT 0,
    referral_rate DECIMAL(5,2) DEFAULT 0,

    -- Operational metrics
    operational_efficiency_gain DECIMAL(5,2) DEFAULT 0,
    process_improvements INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ALERTS AND NOTIFICATIONS
-- ========================================

-- Performance alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    alert_severity VARCHAR(20) CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    alert_title TEXT NOT NULL,
    alert_description TEXT,

    -- Alert metrics
    current_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    variance_percentage DECIMAL(5,2),

    -- Context
    affected_agents UUID[], -- Array of agent IDs
    affected_time_period VARCHAR(50),
    metric_category VARCHAR(50),

    -- Status
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Automated reports table
CREATE TABLE IF NOT EXISTS automated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    schedule_frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'

    -- Report configuration
    recipients TEXT[], -- Array of email addresses
    report_parameters JSONB,
    report_template TEXT,

    -- Execution tracking
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,
    generation_status VARCHAR(20) DEFAULT 'pending',

    -- Report metrics
    delivery_success_rate DECIMAL(5,2) DEFAULT 0,
    avg_generation_time_seconds INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Support metrics indexes
CREATE INDEX IF NOT EXISTS idx_support_metrics_date_hour ON support_metrics(metric_date, metric_hour);
CREATE INDEX IF NOT EXISTS idx_support_metrics_date_range ON support_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_support_metrics_created_at ON support_metrics(created_at);

-- Agent performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_date ON agent_performance(agent_id, performance_date);
CREATE INDEX IF NOT EXISTS idx_agent_performance_date ON agent_performance(performance_date);

-- Customer satisfaction indexes
CREATE INDEX IF NOT EXISTS idx_csat_ticket_id ON customer_satisfaction_metrics(ticket_id);
CREATE INDEX IF NOT EXISTS idx_csat_customer_id ON customer_satisfaction_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_csat_created_at ON customer_satisfaction_metrics(created_at);

-- Knowledge base analytics indexes
CREATE INDEX IF NOT EXISTS idx_kb_analytics_article_date ON knowledge_base_analytics(article_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_kb_analytics_date ON knowledge_base_analytics(analytics_date);

-- Chat performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_perf_session_id ON chat_performance_analytics(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_perf_agent_id ON chat_performance_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_perf_created_at ON chat_performance_analytics(created_at);

-- Channel effectiveness indexes
CREATE INDEX IF NOT EXISTS idx_channel_effectiveness_channel_date ON channel_effectiveness(channel, analytics_date);
CREATE INDEX IF NOT EXISTS idx_channel_effectiveness_date ON channel_effectiveness(analytics_date);

-- Predictive analytics indexes
CREATE INDEX IF NOT EXISTS idx_volume_forecasts_date ON volume_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_staffing_predictions_date_slot ON staffing_predictions(prediction_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_churn_risk_customer_date ON churn_risk_predictions(customer_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_churn_risk_score ON churn_risk_predictions(churn_risk_score);

-- Quality assurance indexes
CREATE INDEX IF NOT EXISTS idx_quality_scores_ticket ON conversation_quality_scores(ticket_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_evaluator ON conversation_quality_scores(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_date ON conversation_quality_scores(evaluation_date);

-- Customer journey indexes
CREATE INDEX IF NOT EXISTS idx_journey_customer ON customer_journey_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_journey_id ON customer_journey_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_date ON customer_journey_analytics(interaction_date);

-- Business intelligence indexes
CREATE INDEX IF NOT EXISTS idx_cost_analysis_date_category ON support_cost_analysis(analysis_date, cost_category);
CREATE INDEX IF NOT EXISTS idx_business_impact_date ON support_business_impact(impact_date);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON performance_alerts(alert_status, alert_severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON performance_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON performance_alerts(assigned_to);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_schedule ON automated_reports(schedule_frequency, next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON automated_reports(generation_status);

-- ========================================
-- TRIGGERS AND AUTOMATION
-- ========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_support_metrics_updated_at BEFORE UPDATE ON support_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_updated_at BEFORE UPDATE ON agent_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_analytics_updated_at BEFORE UPDATE ON knowledge_base_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_effectiveness_updated_at BEFORE UPDATE ON channel_effectiveness
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volume_forecasts_updated_at BEFORE UPDATE ON volume_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staffing_predictions_updated_at BEFORE UPDATE ON staffing_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_churn_risk_predictions_updated_at BEFORE UPDATE ON churn_risk_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_quality_scores_updated_at BEFORE UPDATE ON conversation_quality_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_touchpoint_effectiveness_updated_at BEFORE UPDATE ON support_touchpoint_effectiveness
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_cost_analysis_updated_at BEFORE UPDATE ON support_cost_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_business_impact_updated_at BEFORE UPDATE ON support_business_impact
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_reports_updated_at BEFORE UPDATE ON automated_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON ANALYTICS QUERIES
-- ========================================

-- Daily performance summary view
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT
    metric_date,
    SUM(total_tickets) as total_daily_tickets,
    SUM(resolved_tickets) as total_daily_resolutions,
    AVG(avg_first_response_time) as avg_response_time,
    AVG(customer_satisfaction_score) as avg_satisfaction,
    SUM(sla_breaches) as total_sla_breaches,
    AVG(sla_compliance_rate) as avg_sla_compliance,
    SUM(email_tickets + chat_tickets + phone_tickets + social_tickets) as total_channel_tickets
FROM support_metrics
GROUP BY metric_date
ORDER BY metric_date DESC;

-- Agent performance leaderboard view
CREATE OR REPLACE VIEW agent_performance_leaderboard AS
SELECT
    p.id as agent_id,
    p.first_name || ' ' || p.last_name as agent_name,
    ap.performance_date,
    SUM(ap.tickets_resolved) as total_resolutions,
    AVG(ap.customer_satisfaction_avg) as avg_satisfaction,
    AVG(ap.quality_score) as avg_quality_score,
    AVG(ap.avg_handling_time) as avg_handling_time,
    AVG(ap.resolution_rate) as avg_resolution_rate
FROM agent_performance ap
JOIN profiles p ON ap.agent_id = p.id
WHERE ap.performance_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.first_name, p.last_name, ap.performance_date
ORDER BY total_resolutions DESC, avg_satisfaction DESC;

-- Channel performance comparison view
CREATE OR REPLACE VIEW channel_performance_comparison AS
SELECT
    channel,
    analytics_date,
    total_conversations,
    successful_conversations,
    resolution_rate,
    customer_satisfaction,
    cost_per_interaction,
    first_contact_resolution_rate
FROM channel_effectiveness
WHERE analytics_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY analytics_date DESC, resolution_rate DESC;

-- Customer satisfaction trends view
CREATE OR REPLACE VIEW customer_satisfaction_trends AS
SELECT
    DATE(created_at) as satisfaction_date,
    AVG(csat_score) as avg_csat,
    COUNT(*) as total_responses,
    SUM(CASE WHEN csat_score >= 4 THEN 1 ELSE 0 END) as positive_responses,
    SUM(CASE WHEN csat_score <= 2 THEN 1 ELSE 0 END) as negative_responses,
    AVG(sentiment_score) as avg_sentiment
FROM customer_satisfaction_metrics
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY satisfaction_date DESC;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on sensitive tables
ALTER TABLE support_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_satisfaction_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Support metrics - read access for authenticated users
CREATE POLICY "Authenticated users can read support metrics" ON support_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Agent performance - agents can see their own performance, managers can see all
CREATE POLICY "Agents can read own performance" ON agent_performance
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Managers can read all agent performance" ON agent_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager')
        )
    );

-- Customer satisfaction - customers can see their own feedback
CREATE POLICY "Customers can read own satisfaction" ON customer_satisfaction_metrics
    FOR SELECT USING (auth.uid() = customer_id);

-- Quality scores - quality team can read all, agents can read their own evaluations
CREATE POLICY "Agents can read own quality scores" ON conversation_quality_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = conversation_quality_scores.ticket_id
            AND st.assigned_agent_id = auth.uid()
        )
    );

CREATE POLICY "Quality team can read all quality scores" ON conversation_quality_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager', 'quality_analyst')
        )
    );

-- Performance alerts - users can see alerts assigned to them or relevant to their role
CREATE POLICY "Users can read assigned alerts" ON performance_alerts
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Managers can read all alerts" ON performance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager')
        )
    );

-- ========================================
-- SECURITY AND PRIVACY
-- ========================================

-- Function to anonymize customer data for analytics
CREATE OR REPLACE FUNCTION anonymize_customer_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Anonymize sensitive customer data after 90 days
    IF NEW.created_at < NOW() - INTERVAL '90 days' THEN
        NEW.feedback_text = '[ANONYMIZED]';
        NEW.customer_id = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to anonymize old customer feedback data
CREATE TRIGGER anonymize_old_customer_feedback
    BEFORE UPDATE ON customer_satisfaction_metrics
    FOR EACH ROW EXECUTE FUNCTION anonymize_customer_data();

-- ========================================
-- SAMPLE DATA INSERTION (for development)
-- ========================================

-- Note: Sample data insertion would be done through separate seed scripts
-- This migration only creates the schema structure

-- Grant permissions to service role for data processing
GRANT SELECT, INSERT, UPDATE ON support_metrics TO service_role;
GRANT SELECT, INSERT, UPDATE ON agent_performance TO service_role;
GRANT SELECT, INSERT, UPDATE ON customer_satisfaction_metrics TO service_role;
GRANT SELECT, INSERT, UPDATE ON knowledge_base_analytics TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat_performance_analytics TO service_role;
GRANT SELECT, INSERT, UPDATE ON channel_effectiveness TO service_role;
GRANT SELECT, INSERT, UPDATE ON volume_forecasts TO service_role;
GRANT SELECT, INSERT, UPDATE ON staffing_predictions TO service_role;
GRANT SELECT, INSERT, UPDATE ON churn_risk_predictions TO service_role;
GRANT SELECT, INSERT, UPDATE ON conversation_quality_scores TO service_role;
GRANT SELECT, INSERT, UPDATE ON customer_journey_analytics TO service_role;
GRANT SELECT, INSERT, UPDATE ON support_touchpoint_effectiveness TO service_role;
GRANT SELECT, INSERT, UPDATE ON support_cost_analysis TO service_role;
GRANT SELECT, INSERT, UPDATE ON support_business_impact TO service_role;
GRANT SELECT, INSERT, UPDATE ON performance_alerts TO service_role;
GRANT SELECT, INSERT, UPDATE ON automated_reports TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column TO service_role;
GRANT EXECUTE ON FUNCTION anonymize_customer_data TO service_role;

-- Grant select permissions on views
GRANT SELECT ON daily_performance_summary TO service_role;
GRANT SELECT ON agent_performance_leaderboard TO service_role;
GRANT SELECT ON channel_performance_comparison TO service_role;
GRANT SELECT ON customer_satisfaction_trends TO service_role;

COMMIT;