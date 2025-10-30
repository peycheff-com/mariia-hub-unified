-- Advanced Analytics System Migration
-- Comprehensive analytics infrastructure for luxury beauty/fitness booking platform

-- Analytics Events Table - Core event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- booking_viewed, service_clicked, payment_initiated, etc.
    event_category VARCHAR(50) NOT NULL, -- user_behavior, booking, payment, performance
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    properties JSONB DEFAULT '{}', -- Event-specific properties
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    revenue_impact DECIMAL(10,2) DEFAULT 0, -- Direct revenue impact of this event
    conversion_value DECIMAL(10,2) DEFAULT 0, -- Estimated conversion value
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Segments Table - Dynamic customer segmentation
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    segment_type VARCHAR(50) NOT NULL, -- behavioral, demographic, value_based, predictive
    criteria JSONB NOT NULL, -- Segment definition rules
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority = more important segment
    auto_update BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- User Segment Memberships - Many-to-many relationship
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.00 to 1.00
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For time-based segments
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, segment_id)
);

-- Analytics Metrics Table - Pre-computed metrics for performance
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- revenue, engagement, conversion, retention
    time_period VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    dimensions JSONB DEFAULT '{}', -- Additional dimensions (service_type, location, etc.)
    value DECIMAL(15,2) NOT NULL,
    previous_value DECIMAL(15,2), -- For comparison
    change_percentage DECIMAL(5,2), -- Percentage change from previous period
    target_value DECIMAL(15,2), -- Target/KPI value
    target_achievement_percentage DECIMAL(5,2), -- Achievement percentage
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_name, time_period, period_start, dimensions)
);

-- Revenue Analytics Table - Detailed revenue tracking
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    service_type VARCHAR(20),
    location_type VARCHAR(20),
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    bookings_count INTEGER NOT NULL DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    deposit_revenue DECIMAL(12,2) DEFAULT 0,
    refund_amount DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) GENERATED ALWAYS AS (total_revenue - refund_amount) STORED,
    currency VARCHAR(3) DEFAULT 'PLN',
    payment_method VARCHAR(50),
    source_type VARCHAR(50), -- online, mobile, booksy_sync
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, service_id, location_type, currency, payment_method, source_type)
);

-- Customer Journey Analytics Table
CREATE TABLE IF NOT EXISTS customer_journey_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    journey_stage VARCHAR(50) NOT NULL, -- awareness, consideration, conversion, retention, advocacy
    touchpoint_type VARCHAR(50) NOT NULL, -- website, mobile, social, referral, email
    touchpoint_details JSONB DEFAULT '{}',
    entry_timestamp TIMESTAMPTZ NOT NULL,
    exit_timestamp TIMESTAMPTZ,
    duration_seconds INTEGER,
    conversion_path JSONB DEFAULT '[]', -- Array of touchpoints in order
    is_converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    attribution_model VARCHAR(50) DEFAULT 'last_click', -- last_click, first_click, linear, time_decay
    attribution_score DECIMAL(3,2) DEFAULT 0, -- 0.00 to 1.00
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance KPIs Table - Key performance indicators
CREATE TABLE IF NOT EXISTS performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL, -- operational, financial, customer, growth
    description TEXT,
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    measurement_unit VARCHAR(20), -- percentage, currency, count, rating
    frequency VARCHAR(20) NOT NULL, -- real_time, hourly, daily, weekly, monthly
    status VARCHAR(20) NOT NULL DEFAULT 'normal', -- critical, warning, normal, good, excellent
    threshold_critical DECIMAL(15,2), -- Red threshold
    threshold_warning DECIMAL(15,2), -- Yellow threshold
    threshold_good DECIMAL(15,2), -- Green threshold
    trend_direction VARCHAR(10), -- up, down, stable
    trend_percentage DECIMAL(5,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kpi_name, frequency)
);

-- Analytics Alerts Table - Automated alerting system
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- kpi_threshold, anomaly, trend, custom
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    description TEXT,
    conditions JSONB NOT NULL, -- Alert trigger conditions
    is_active BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '["email"]', -- email, sms, slack, webhook
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    cooldown_minutes INTEGER DEFAULT 60, -- Minimum time between alerts
    escalation_rules JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Alert History Table
CREATE TABLE IF NOT EXISTS analytics_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES analytics_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, false_positive
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    notifications_sent JSONB DEFAULT '[]', -- Track notification attempts
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecast Models Table - Predictive analytics models
CREATE TABLE IF NOT EXISTS forecast_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- revenue_forecast, demand_prediction, churn_prediction
    target_variable VARCHAR(100) NOT NULL,
    input_features JSONB NOT NULL, -- Features used for prediction
    model_parameters JSONB DEFAULT '{}',
    accuracy_metrics JSONB DEFAULT '{}', -- MAE, RMSE, R², etc.
    training_data_period_start DATE,
    training_data_period_end DATE,
    last_trained_at TIMESTAMPTZ,
    next_training_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    prediction_horizon_days INTEGER DEFAULT 30,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name)
);

-- Forecast Results Table - Model predictions
CREATE TABLE IF NOT EXISTS forecast_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES forecast_models(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    target_date DATE NOT NULL,
    predicted_value DECIMAL(15,2) NOT NULL,
    confidence_interval_lower DECIMAL(15,2),
    confidence_interval_upper DECIMAL(15,2),
    prediction_metadata JSONB DEFAULT '{}',
    actual_value DECIMAL(15,2), -- Filled in after the date passes
    accuracy_error DECIMAL(5,2), -- Percentage error when actual is known
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_id, target_date)
);

-- Analytics Reports Table - Configurable reports
CREATE TABLE IF NOT EXISTS analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- dashboard, export, scheduled, ad_hoc
    description TEXT,
    query_config JSONB NOT NULL, -- Report query definition
    visualization_config JSONB DEFAULT '{}', -- Chart/display settings
    schedule_config JSONB DEFAULT '{}', -- For scheduled reports
    export_config JSONB DEFAULT '{}', -- Export format and destination
    is_active BOOLEAN DEFAULT true,
    access_level VARCHAR(20) DEFAULT 'admin', -- admin, manager, staff, viewer
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_name)
);

-- Analytics Report Executions Table
CREATE TABLE IF NOT EXISTS analytics_report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES analytics_reports(id) ON DELETE CASCADE,
    execution_type VARCHAR(20) NOT NULL, -- scheduled, manual, api
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_seconds INTEGER,
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    file_path TEXT, -- For exported reports
    file_size_bytes INTEGER,
    error_message TEXT,
    triggered_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_service_id ON analytics_events(service_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_booking_id ON analytics_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN(properties);

CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_user ON customer_segment_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment ON customer_segment_memberships(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_confidence ON customer_segment_memberships(confidence_score);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name_period ON analytics_metrics(metric_name, time_period);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period_start ON analytics_metrics(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_category ON analytics_metrics(metric_category);

CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_service ON revenue_analytics(service_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_type ON revenue_analytics(service_type, location_type);

CREATE INDEX IF NOT EXISTS idx_customer_journey_user ON customer_journey_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_session ON customer_journey_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_stage ON customer_journey_analytics(journey_stage);
CREATE INDEX IF NOT EXISTS idx_customer_journey_timestamp ON customer_journey_analytics(entry_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_performance_kpis_category ON performance_kpis(kpi_category);
CREATE INDEX IF NOT EXISTS idx_performance_kpis_status ON performance_kpis(status);
CREATE INDEX IF NOT EXISTS idx_performance_kpis_updated ON performance_kpis(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_alerts_active ON analytics_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type ON analytics_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_analytics_alert_history_alert ON analytics_alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alert_history_triggered ON analytics_alert_history(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_models_active ON forecast_models(is_active);
CREATE INDEX IF NOT EXISTS idx_forecast_results_model ON forecast_results(model_id);
CREATE INDEX IF NOT EXISTS idx_forecast_results_target_date ON forecast_results(target_date);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_active ON analytics_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_report_executions_report ON analytics_report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_analytics_report_executions_status ON analytics_report_executions(status);
CREATE INDEX IF NOT EXISTS idx_analytics_report_executions_started ON analytics_report_executions(started_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_analytics_events_updated_at BEFORE UPDATE ON analytics_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_metrics_updated_at BEFORE UPDATE ON analytics_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_updated_at BEFORE UPDATE ON revenue_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_journey_analytics_updated_at BEFORE UPDATE ON customer_journey_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_kpis_updated_at BEFORE UPDATE ON performance_kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_alerts_updated_at BEFORE UPDATE ON analytics_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_models_updated_at BEFORE UPDATE ON forecast_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_results_updated_at BEFORE UPDATE ON forecast_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_reports_updated_at BEFORE UPDATE ON analytics_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_report_executions ENABLE ROW LEVEL SECURITY;

-- Analytics Events - Only admins can view all, users can view their own events
CREATE POLICY "Admins can view all analytics events" ON analytics_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Users can view their own events" ON analytics_events
    FOR SELECT USING (user_id = auth.uid());

-- Analytics Metrics - Read-only for authenticated users
CREATE POLICY "Authenticated users can view analytics metrics" ON analytics_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Revenue Analytics - Managers and admins only
CREATE POLICY "Managers and admins can view revenue analytics" ON revenue_analytics
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    ));

-- Performance KPIs - Staff and above can view
CREATE POLICY "Staff and above can view KPIs" ON performance_kpis
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff')
    ));

-- Other tables with appropriate RLS policies would be added here...

-- Create helpful database functions for analytics

-- Function to calculate revenue metrics for a given period
CREATE OR REPLACE FUNCTION calculate_revenue_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_revenue DECIMAL,
    total_bookings BIGINT,
    avg_booking_value DECIMAL,
    service_type VARCHAR,
    location_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(r.total_revenue) as total_revenue,
        SUM(r.bookings_count) as total_bookings,
        AVG(r.average_booking_value) as avg_booking_value,
        r.service_type,
        r.location_type
    FROM revenue_analytics r
    WHERE r.date BETWEEN start_date AND end_date
    GROUP BY r.service_type, r.location_type
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing services
CREATE OR REPLACE FUNCTION get_top_performing_services(
    limit_count INTEGER DEFAULT 10,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    service_id UUID,
    service_title VARCHAR,
    total_revenue DECIMAL,
    bookings_count BIGINT,
    avg_rating DECIMAL,
    growth_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as service_id,
        s.title as service_title,
        COALESCE(SUM(r.total_revenue), 0) as total_revenue,
        COALESCE(SUM(r.bookings_count), 0) as bookings_count,
        COALESCE(AVG(rv.rating), 0) as avg_rating,
        -- Calculate growth rate (simplified)
        CASE
            WHEN LAG(SUM(r.total_revenue)) OVER (ORDER BY s.id) IS NOT NULL AND LAG(SUM(r.total_revenue)) OVER (ORDER BY s.id) > 0
            THEN ((SUM(r.total_revenue) - LAG(SUM(r.total_revenue)) OVER (ORDER BY s.id)) / LAG(SUM(r.total_revenue)) OVER (ORDER BY s.id)) * 100
            ELSE 0
        END as growth_rate
    FROM services s
    LEFT JOIN revenue_analytics r ON s.id = r.service_id
        AND r.date BETWEEN start_date AND end_date
    LEFT JOIN reviews rv ON s.id = rv.service_id
    WHERE s.is_active = true
    GROUP BY s.id, s.title
    ORDER BY total_revenue DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer segments based on behavior
CREATE OR REPLACE FUNCTION update_customer_segments()
RETURNS VOID AS $$
DECLARE
    -- High-value customers: >1000 PLN lifetime value or >5 bookings
BEGIN
    -- Insert or update high-value segment
    INSERT INTO customer_segment_memberships (user_id, segment_id, confidence_score)
    SELECT DISTINCT
        b.user_id,
        cs.id,
        CASE
            WHEN total_bookings > 10 OR total_value > 5000 THEN 1.0
            WHEN total_bookings > 5 OR total_value > 1000 THEN 0.8
            ELSE 0.6
        END as confidence_score
    FROM bookings b
    JOIN customer_segments cs ON cs.segment_type = 'value_based' AND cs.name = 'High Value Customers'
    LEFT JOIN (
        SELECT
            user_id,
            COUNT(*) as total_bookings,
            SUM(total_amount) as total_value
        FROM bookings
        WHERE status NOT IN ('cancelled', 'draft')
        GROUP BY user_id
    ) booking_stats ON b.user_id = booking_stats.user_id
    WHERE booking_stats.total_bookings > 5 OR booking_stats.total_value > 1000
    ON CONFLICT (user_id, segment_id)
    DO UPDATE SET
        confidence_score = EXCLUDED.confidence_score,
        assigned_at = NOW(),
        metadata = jsonb_build_object(
            'total_bookings', booking_stats.total_bookings,
            'total_value', booking_stats.total_value
        );
END;
$$ LANGUAGE plpgsql;

-- Function to create daily analytics metrics
CREATE OR REPLACE FUNCTION create_daily_metrics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics_metrics (
        metric_name,
        metric_category,
        time_period,
        period_start,
        period_end,
        dimensions,
        value,
        previous_value,
        change_percentage
    )
    SELECT
        'daily_revenue' as metric_name,
        'revenue' as metric_category,
        'daily' as time_period,
        date_trunc('day', r.date) as period_start,
        date_trunc('day', r.date) + INTERVAL '1 day' - INTERVAL '1 second' as period_end,
        jsonb_build_object(
            'service_type', r.service_type,
            'location_type', r.location_type,
            'currency', r.currency
        ) as dimensions,
        SUM(r.total_revenue) as value,
        LAG(SUM(r.total_revenue)) OVER (ORDER BY date_trunc('day', r.date)) as previous_value,
        CASE
            WHEN LAG(SUM(r.total_revenue)) OVER (ORDER BY date_trunc('day', r.date)) IS NOT NULL
            AND LAG(SUM(r.total_revenue)) OVER (ORDER BY date_trunc('day', r.date)) > 0
            THEN ((SUM(r.total_revenue) - LAG(SUM(r.total_revenue)) OVER (ORDER BY date_trunc('day', r.date))) /
                  LAG(SUM(r.total_revenue)) OVER (ORDER BY date_trunc('day', r.date))) * 100
            ELSE NULL
        END as change_percentage
    FROM revenue_analytics r
    WHERE r.date = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY r.date, r.service_type, r.location_type, r.currency
    ON CONFLICT (metric_name, time_period, period_start, dimensions)
    DO UPDATE SET
        value = EXCLUDED.value,
        previous_value = EXCLUDED.previous_value,
        change_percentage = EXCLUDED.change_percentage,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job function for metric updates
CREATE OR REPLACE FUNCTION schedule_analytics_updates()
RETURNS VOID AS $$
BEGIN
    -- Update customer segments
    PERFORM update_customer_segments();

    -- Create daily metrics
    PERFORM create_daily_metrics();

    -- Additional scheduled tasks can be added here
END;
$$ LANGUAGE plpgsql;

COMMIT;