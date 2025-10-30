-- Analytics Database Schema for Luxury Beauty/Fitness Platform
-- This migration adds comprehensive analytics capabilities

-- Analytics events table for tracking all user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    properties JSONB,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider TEXT DEFAULT 'custom',
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT
);

-- Failed analytics events for debugging
CREATE TABLE IF NOT EXISTS analytics_failed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT,
    event TEXT NOT NULL,
    properties JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User journey tracking
CREATE TABLE IF NOT EXISTS booking_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_selected JSONB,
    steps_completed JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    abandonment_reason TEXT,
    total_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer segments for behavioral analysis
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    segment_type TEXT NOT NULL CHECK (segment_type IN ('behavioral', 'demographic', 'value_based', 'predictive')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer segment assignments
CREATE TABLE IF NOT EXISTS customer_segment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(customer_id, segment_id)
);

-- Revenue analytics and forecasting
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    service_type TEXT NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    forecast_revenue DECIMAL(12,2),
    forecast_accuracy DECIMAL(5,2),
    revenue_source TEXT DEFAULT 'booking',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, service_type, revenue_source)
);

-- Performance KPIs tracking
CREATE TABLE IF NOT EXISTS performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL,
    kpi_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2),
    threshold_min DECIMAL(10,2),
    threshold_max DECIMAL(10,2),
    measurement_date DATE NOT NULL,
    dimension1 TEXT,
    dimension2 TEXT,
    dimension3 TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI alerts and notifications
CREATE TABLE IF NOT EXISTS kpi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_breach', 'trend_anomaly', 'target_missed', 'target_exceeded')),
    current_value DECIMAL(10,2) NOT NULL,
    threshold_value DECIMAL(10,2),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive models and their performance
CREATE TABLE IF NOT EXISTS predictive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('booking_forecast', 'churn_prediction', 'revenue_forecast', 'demand_prediction', 'customer_lifetime_value')),
    version TEXT NOT NULL,
    model_config JSONB NOT NULL,
    training_data_period_start DATE,
    training_data_period_end DATE,
    accuracy_score DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall_score DECIMAL(5,2),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions generated by models
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES predictive_models(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- Could be user_id, service_id, date, etc.
    entity_type TEXT NOT NULL,
    prediction_type TEXT NOT NULL,
    predicted_value DECIMAL(12,2),
    confidence_score DECIMAL(3,2),
    prediction_date DATE NOT NULL,
    actual_value DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer behavior tracking
CREATE TABLE IF NOT EXISTS customer_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    behavior_type TEXT NOT NULL,
    behavior_data JSONB NOT NULL,
    context JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing campaign analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    spend DECIMAL(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    cost_per_click DECIMAL(10,2),
    cost_per_acquisition DECIMAL(10,2),
    return_on_ad_spend DECIMAL(5,2),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time metrics aggregation
CREATE TABLE IF NOT EXISTS realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(12,2) NOT NULL,
    dimensions JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    bounce BOOLEAN DEFAULT FALSE,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN(properties);

CREATE INDEX IF NOT EXISTS idx_booking_journeys_session_id ON booking_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_booking_journeys_user_id ON booking_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_journeys_created_at ON booking_journeys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_journeys_is_completed ON booking_journeys(is_completed);

CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_customer ON customer_segment_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_segment ON customer_segment_assignments(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_expires ON customer_segment_assignments(expires_at);

CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_service_type ON revenue_analytics(service_type);

CREATE INDEX IF NOT EXISTS idx_performance_kpis_name_date ON performance_kpis(kpi_name, measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_created_at ON kpi_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_resolved ON kpi_alerts(is_resolved);

CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_id);

CREATE INDEX IF NOT EXISTS idx_customer_behaviors_user_timestamp ON customer_behaviors(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_customer_behaviors_type ON customer_behaviors(behavior_type);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_dates ON campaign_analytics(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);

CREATE INDEX IF NOT EXISTS idx_realtime_metrics_name_timestamp ON realtime_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_expires ON realtime_metrics(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_analytics_events_updated_at BEFORE UPDATE ON analytics_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_journeys_updated_at BEFORE UPDATE ON booking_journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_analytics_updated_at BEFORE UPDATE ON revenue_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_kpis_updated_at BEFORE UPDATE ON performance_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictive_models_updated_at BEFORE UPDATE ON predictive_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_analytics_updated_at BEFORE UPDATE ON campaign_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Analytics events - Users can see their own events
CREATE POLICY "Users can view their own analytics events" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service accounts can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Booking journeys - Users can see their own journeys
CREATE POLICY "Users can view their own booking journeys" ON booking_journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service accounts can insert booking journeys" ON booking_journeys FOR INSERT WITH CHECK (true);

-- Customer segment assignments - Users can see their own segments
CREATE POLICY "Users can view their own segment assignments" ON customer_segment_assignments FOR SELECT USING (auth.uid() = customer_id);

-- Customer behaviors - Users can see their own behaviors
CREATE POLICY "Users can view their own behaviors" ON customer_behaviors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service accounts can insert customer behaviors" ON customer_behaviors FOR INSERT WITH CHECK (true);

-- User sessions - Users can see their own sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for all tables
CREATE POLICY "Admins can view all analytics events" ON analytics_events FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all booking journeys" ON booking_journeys FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all customer segments" ON customer_segments FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all segment assignments" ON customer_segment_assignments FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all revenue analytics" ON revenue_analytics FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all performance KPIs" ON performance_kpis FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all KPI alerts" ON kpi_alerts FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all predictions" ON predictions FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all customer behaviors" ON customer_behaviors FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all campaign analytics" ON campaign_analytics FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all realtime metrics" ON realtime_metrics FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all user sessions" ON user_sessions FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create some default customer segments
INSERT INTO customer_segments (name, description, criteria, segment_type) VALUES
('High Value Customers', 'Customers with lifetime value > 5000 PLN',
 '{"lifetime_value": {"operator": ">", "value": 5000}, "total_bookings": {"operator": ">=", "value": 10}}',
 'value_based'),
('New Customers', 'Customers who booked within the last 30 days',
 '{"first_booking_days_ago": {"operator": "<=", "value": 30}, "total_bookings": {"operator": "=", "value": 1}}',
 'behavioral'),
('At Risk Customers', 'Customers who haven''t booked in 90+ days',
 '{"last_booking_days_ago": {"operator": ">", "value": 90}, "total_bookings": {"operator": ">=", "value": 2}}',
 'predictive'),
('Beauty Enthusiasts', 'Customers who primarily book beauty services',
 '{"beauty_booking_percentage": {"operator": ">", "value": 70}}',
 'behavioral'),
('Fitness Devotees', 'Customers who primarily book fitness services',
 '{"fitness_booking_percentage": {"operator": ">", "value": 70}}',
 'behavioral')
ON CONFLICT DO NOTHING;

-- Create default KPI definitions
INSERT INTO performance_kpis (kpi_name, kpi_value, target_value, threshold_min, threshold_max, measurement_date, dimension1) VALUES
('daily_revenue', 0, 5000, 2000, 10000, CURRENT_DATE, 'all'),
('daily_bookings', 0, 25, 10, 50, CURRENT_DATE, 'all'),
('conversion_rate', 0, 15, 5, 25, CURRENT_DATE, 'all'),
('average_booking_value', 0, 400, 200, 800, CURRENT_DATE, 'all'),
('customer_satisfaction', 0, 4.5, 3.5, 5.0, CURRENT_DATE, 'all'),
('bounce_rate', 0, 30, 0, 50, CURRENT_DATE, 'all')
ON CONFLICT (kpi_name, measurement_date, dimension1) DO NOTHING;

-- Create some default predictive models
INSERT INTO predictive_models (name, model_type, version, model_config, is_active) VALUES
('Booking Forecast Model', 'booking_forecast', '1.0.0',
 '{"algorithm": "lstm", "features": ["historical_bookings", "day_of_week", "month", "seasonality", "weather"], "forecast_horizon": 7}',
false),
('Customer Churn Prediction', 'churn_prediction', '1.0.0',
 '{"algorithm": "random_forest", "features": ["booking_frequency", "last_booking_days", "total_spent", "service_diversity"], "threshold": 0.7}',
false),
('Revenue Forecast Model', 'revenue_forecast', '1.0.0',
 '{"algorithm": "arima", "features": ["historical_revenue", "trend", "seasonality", "promotions"], "forecast_horizon": 30}',
false)
ON CONFLICT DO NOTHING;

-- Create functions for common analytics operations
CREATE OR REPLACE FUNCTION update_realtime_metric(metric_name TEXT, metric_value DECIMAL, dimensions JSONB DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO realtime_metrics (metric_name, metric_value, dimensions, expires_at)
    VALUES (metric_name, metric_value, dimensions, NOW() + INTERVAL '1 hour')
    ON CONFLICT (metric_name, dimensions) DO UPDATE SET
        metric_value = EXCLUDED.metric_value,
        timestamp = NOW(),
        expires_at = NOW() + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to get conversion funnel metrics
CREATE OR REPLACE FUNCTION get_funnel_metrics(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'service_views', (SELECT COUNT(*) FROM analytics_events WHERE event = 'view_item' AND timestamp BETWEEN start_date AND end_date),
        'booking_starts', (SELECT COUNT(*) FROM analytics_events WHERE event = 'booking_initiated' AND timestamp BETWEEN start_date AND end_date),
        'time_selections', (SELECT COUNT(*) FROM booking_journeys WHERE current_step >= 2 AND created_at BETWEEN start_date AND end_date),
        'detail_completions', (SELECT COUNT(*) FROM booking_journeys WHERE current_step >= 3 AND created_at BETWEEN start_date AND end_date),
        'payments', (SELECT COUNT(*) FROM analytics_events WHERE event = 'booking_completed' AND timestamp BETWEEN start_date AND end_date),
        'conversion_rate', CASE
            WHEN (SELECT COUNT(*) FROM analytics_events WHERE event = 'view_item' AND timestamp BETWEEN start_date AND end_date) > 0
            THEN (SELECT COUNT(*) FROM analytics_events WHERE event = 'booking_completed' AND timestamp BETWEEN start_date AND end_date)::DECIMAL /
                 (SELECT COUNT(*) FROM analytics_events WHERE event = 'view_item' AND timestamp BETWEEN start_date AND end_date) * 100
            ELSE 0
        END
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_ltv(user_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_revenue DECIMAL(12,2);
    total_bookings INTEGER;
    days_since_first_booking INTEGER;
    avg_monthly_value DECIMAL(12,2);
    ltv DECIMAL(12,2);
BEGIN
    SELECT
        COALESCE(SUM(b.total_amount), 0),
        COUNT(b.id)
    INTO total_revenue, total_bookings
    FROM bookings b
    WHERE b.user_id = calculate_customer_ltv.user_id
    AND b.status = 'completed';

    SELECT EXTRACT(DAYS FROM (NOW() - MIN(b.created_at)))::INTEGER
    INTO days_since_first_booking
    FROM bookings b
    WHERE b.user_id = calculate_customer_ltv.user_id
    AND b.status = 'completed';

    IF days_since_first_booking = 0 OR total_bookings = 0 THEN
        RETURN 0;
    END IF;

    avg_monthly_value := (total_revenue / days_since_first_booking) * 30;

    -- Simple LTV calculation: avg_monthly_value * projected_customer_lifetime_months
    -- Assuming average customer lifetime of 24 months for beauty/fitness services
    ltv := avg_monthly_value * 24;

    RETURN ltv;
END;
$$ LANGUAGE plpgsql;

-- Function to identify trending services
CREATE OR REPLACE FUNCTION get_trending_services(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    service_id UUID,
    service_title TEXT,
    service_type TEXT,
    bookings_current_period INTEGER,
    bookings_previous_period INTEGER,
    growth_rate DECIMAL(5,2),
    revenue_current_period DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT
            b.service_id,
            s.title,
            s.service_type,
            COUNT(b.id) as bookings,
            SUM(b.total_amount) as revenue
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.created_at >= NOW() - INTERVAL '1 day' * days_back
        AND b.status IN ('confirmed', 'completed')
        GROUP BY b.service_id, s.title, s.service_type
    ),
    previous_period AS (
        SELECT
            b.service_id,
            COUNT(b.id) as bookings
        FROM bookings b
        WHERE b.created_at >= NOW() - INTERVAL '1 day' * (days_back * 2)
        AND b.created_at < NOW() - INTERVAL '1 day' * days_back
        AND b.status IN ('confirmed', 'completed')
        GROUP BY b.service_id
    )
    SELECT
        cp.service_id,
        cp.title,
        cp.service_type,
        cp.bookings::INTEGER,
        COALESCE(pp.bookings, 0)::INTEGER,
        CASE
            WHEN pp.bookings > 0
            THEN ((cp.bookings - pp.bookings)::DECIMAL / pp.bookings) * 100
            ELSE NULL
        END,
        cp.revenue
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.service_id = pp.service_id
    WHERE cp.bookings >= 3  -- Minimum bookings to be considered trending
    ORDER BY growth_rate DESC NULLS LAST, cp.bookings DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMIT;