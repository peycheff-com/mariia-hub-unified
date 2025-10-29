-- Conversion Optimization System
-- Enables comprehensive A/B testing, funnel analysis, and conversion tracking

-- Conversion Events Table
CREATE TABLE IF NOT EXISTS conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    event_data JSONB DEFAULT '{}',
    variation TEXT,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'PLN',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion Funnel Table
CREATE TABLE IF NOT EXISTS conversion_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    step_name TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_data JSONB DEFAULT '{}',
    variation TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    variations JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    target_metric TEXT DEFAULT 'booking_completed',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion Metrics Summary Table
CREATE TABLE IF NOT EXISTS conversion_metrics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    service_selections INTEGER DEFAULT 0,
    time_slot_selections INTEGER DEFAULT 0,
    detail_completions INTEGER DEFAULT 0,
    booking_completions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    average_booking_time INTEGER DEFAULT 0, -- in seconds
    revenue_per_session DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    mobile_sessions INTEGER DEFAULT 0,
    desktop_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date)
);

-- User Preferences for Smart Defaults
CREATE TABLE IF NOT EXISTS user_booking_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_service_type TEXT,
    preferred_time_of_day TEXT,
    preferred_location_id UUID REFERENCES locations(id),
    prefill_enabled BOOLEAN DEFAULT true,
    smart_defaults_enabled BOOLEAN DEFAULT true,
    last_booking_date TIMESTAMP WITH TIME ZONE,
    total_bookings INTEGER DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    preferred_payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Trust Signals and Social Proof
CREATE TABLE IF NOT EXISTS trust_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('recent_booking', 'popular_time', 'high_demand', 'limited_availability', 'social_proof')),
    signal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Method Performance
CREATE TABLE IF NOT EXISTS payment_method_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method TEXT NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_transaction_value DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_method, date)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name ON conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);

CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session_id ON conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_timestamp ON conversion_funnel(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_step_number ON conversion_funnel(step_number);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_start_date ON ab_tests(start_date);
CREATE INDEX IF NOT EXISTS idx_ab_tests_end_date ON ab_tests(end_date);

CREATE INDEX IF NOT EXISTS idx_conversion_metrics_date ON conversion_metrics_summary(metric_date);
CREATE INDEX IF NOT EXISTS idx_user_booking_preferences_user_id ON user_booking_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_trust_signals_service_id ON trust_signals(service_id);
CREATE INDEX IF NOT EXISTS idx_trust_signals_expires_at ON trust_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_trust_signals_type ON trust_signals(signal_type);

CREATE INDEX IF NOT EXISTS idx_payment_method_performance_date ON payment_method_performance(date);
CREATE INDEX IF NOT EXISTS idx_payment_method_performance_method ON payment_method_performance(payment_method);

-- RLS Policies
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_metrics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_booking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversion events" ON conversion_events
    FOR SELECT USING (auth.uid() IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own conversion events" ON conversion_events
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage conversion events" ON conversion_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view their own funnel steps" ON conversion_funnel
    FOR SELECT USING (auth.uid() IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own funnel steps" ON conversion_funnel
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage funnel steps" ON conversion_funnel
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view their own preferences" ON user_booking_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_booking_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view conversion metrics summary" ON conversion_metrics_summary
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage conversion metrics" ON conversion_metrics_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Anyone can view trust signals" ON trust_signals
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trust signals" ON trust_signals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Anyone can view payment performance" ON payment_method_performance
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage payment performance" ON payment_method_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS for A/B tests (admin only)
CREATE POLICY "Admins can manage A/B tests" ON ab_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Functions for Conversion Tracking
CREATE OR REPLACE FUNCTION track_conversion_event(
    p_event_name TEXT,
    p_session_id TEXT,
    p_user_id UUID DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_variation TEXT DEFAULT NULL,
    p_conversion_value DECIMAL DEFAULT 0,
    p_currency TEXT DEFAULT 'PLN'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO conversion_events (
        event_name,
        session_id,
        user_id,
        event_data,
        variation,
        conversion_value,
        currency,
        timestamp
    ) VALUES (
        p_event_name,
        p_session_id,
        p_user_id,
        p_event_data,
        p_variation,
        p_conversion_value,
        p_currency,
        NOW()
    ) RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION track_funnel_step(
    p_session_id TEXT,
    p_user_id UUID DEFAULT NULL,
    p_step_name TEXT,
    p_step_number INTEGER,
    p_step_data JSONB DEFAULT '{}',
    p_variation TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_step_id UUID;
BEGIN
    INSERT INTO conversion_funnel (
        session_id,
        user_id,
        step_name,
        step_number,
        step_data,
        variation,
        timestamp
    ) VALUES (
        p_session_id,
        p_user_id,
        p_step_name,
        p_step_number,
        p_step_data,
        p_variation,
        NOW()
    ) RETURNING id INTO v_step_id;

    RETURN v_step_id;
END;
$$;

-- Function to update conversion metrics daily
CREATE OR REPLACE FUNCTION update_conversion_metrics_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_total_sessions INTEGER;
    v_service_selections INTEGER;
    v_time_slot_selections INTEGER;
    v_detail_completions INTEGER;
    v_booking_completions INTEGER;
    v_conversion_rate DECIMAL(5,2);
    v_average_booking_time INTEGER;
    v_revenue_per_session DECIMAL(10,2);
    v_total_revenue DECIMAL(10,2);
    v_mobile_sessions INTEGER;
    v_desktop_sessions INTEGER;
BEGIN
    -- Get today's conversion metrics
    SELECT
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN step_name = 'service_selected' THEN session_id END) as service_selections,
        COUNT(DISTINCT CASE WHEN step_name = 'time_slot_selected' THEN session_id END) as time_slot_selections,
        COUNT(DISTINCT CASE WHEN step_name = 'details_entered' THEN session_id END) as detail_completions,
        COUNT(DISTINCT CASE WHEN step_name = 'booking_completed' THEN session_id END) as booking_completions
    INTO v_total_sessions, v_service_selections, v_time_slot_selections, v_detail_completions, v_booking_completions
    FROM conversion_funnel
    WHERE DATE(timestamp) = v_today;

    -- Calculate conversion rate
    v_conversion_rate := CASE
        WHEN v_total_sessions > 0 THEN (v_booking_completions::DECIMAL / v_total_sessions::DECIMAL) * 100
        ELSE 0
    END;

    -- Get revenue data
    SELECT
        COALESCE(SUM(conversion_value), 0) as total_revenue,
        COALESCE(AVG(conversion_value), 0) as revenue_per_session
    INTO v_total_revenue, v_revenue_per_session
    FROM conversion_events
    WHERE DATE(timestamp) = v_today
    AND event_name = 'booking_completed';

    -- Calculate average booking time
    WITH session_times AS (
        SELECT
            session_id,
            EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration
        FROM conversion_funnel
        WHERE DATE(timestamp) = v_today
        GROUP BY session_id
        HAVING COUNT(DISTINCT step_name) >= 3
    )
    SELECT COALESCE(AVG(session_duration), 0)::INTEGER
    INTO v_average_booking_time
    FROM session_times;

    -- Get device breakdown (mock data for now - should come from event_data)
    v_mobile_sessions := v_total_sessions * 0.7;
    v_desktop_sessions := v_total_sessions * 0.3;

    -- Upsert metrics summary
    INSERT INTO conversion_metrics_summary (
        metric_date,
        total_sessions,
        service_selections,
        time_slot_selections,
        detail_completions,
        booking_completions,
        conversion_rate,
        average_booking_time,
        revenue_per_session,
        total_revenue,
        mobile_sessions,
        desktop_sessions,
        updated_at
    ) VALUES (
        v_today,
        v_total_sessions,
        v_service_selections,
        v_time_slot_selections,
        v_detail_completions,
        v_booking_completions,
        v_conversion_rate,
        v_average_booking_time,
        v_revenue_per_session,
        v_total_revenue,
        v_mobile_sessions,
        v_desktop_sessions,
        NOW()
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        service_selections = EXCLUDED.service_selections,
        time_slot_selections = EXCLUDED.time_slot_selections,
        detail_completions = EXCLUDED.detail_completions,
        booking_completions = EXCLUDED.booking_completions,
        conversion_rate = EXCLUDED.conversion_rate,
        average_booking_time = EXCLUDED.average_booking_time,
        revenue_per_session = EXCLUDED.revenue_per_session,
        total_revenue = EXCLUDED.total_revenue,
        mobile_sessions = EXCLUDED.mobile_sessions,
        desktop_sessions = EXCLUDED.desktop_sessions,
        updated_at = NOW();

END;
$$;

-- Create default A/B test for optimized booking flow
INSERT INTO ab_tests (
    name,
    description,
    traffic_percentage,
    variations,
    start_date,
    target_metric,
    status
) VALUES (
    'Optimized Booking Flow',
    'A/B test comparing 3-step optimized flow vs 4-step standard flow',
    100,
    '[
        {
            "id": "optimized_3_step",
            "name": "3-Step Optimized Flow",
            "weight": 50,
            "config": {
                "steps": 3,
                "smart_defaults": true,
                "trust_signals": true,
                "mobile_optimized": true
            }
        },
        {
            "id": "standard_4_step",
            "name": "4-Step Standard Flow",
            "weight": 50,
            "config": {
                "steps": 4,
                "smart_defaults": false,
                "trust_signals": false,
                "mobile_optimized": false
            }
        }
    ]'::jsonb,
    NOW(),
    'booking_completed',
    'active'
) ON CONFLICT DO NOTHING;

-- Create another A/B test for mobile optimization
INSERT INTO ab_tests (
    name,
    description,
    traffic_percentage,
    variations,
    start_date,
    target_metric,
    status
) VALUES (
    'Mobile Booking Optimization',
    'Test different mobile booking interfaces and flows',
    50,
    '[
        {
            "id": "mobile_optimized",
            "name": "Mobile Optimized Flow",
            "weight": 50,
            "config": {
                "interface": "swipe_enabled",
                "quick_book": true,
                "touch_optimized": true
            }
        },
        {
            "id": "mobile_standard",
            "name": "Standard Mobile Flow",
            "weight": 50,
            "config": {
                "interface": "standard",
                "quick_book": false,
                "touch_optimized": false
            }
        }
    ]'::jsonb,
    NOW(),
    'mobile_conversion_rate',
    'active'
) ON CONFLICT DO NOTHING;

-- Function to get conversion funnel analysis
CREATE OR REPLACE FUNCTION get_conversion_funnel_analysis(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_variation TEXT DEFAULT NULL
)
RETURNS TABLE (
    step_name TEXT,
    step_number INTEGER,
    users_at_step INTEGER,
    conversion_rate_to_next DECIMAL(5,2),
    drop_off_rate DECIMAL(5,2),
    average_time_to_step INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH funnel_analysis AS (
        SELECT
            cf.step_name,
            cf.step_number,
            COUNT(DISTINCT cf.session_id) as users_at_step,
            cf.timestamp,
            cf.variation
        FROM conversion_funnel cf
        WHERE
            (p_start_date IS NULL OR DATE(cf.timestamp) >= p_start_date)
            AND (p_end_date IS NULL OR DATE(cf.timestamp) <= p_end_date)
            AND (p_variation IS NULL OR cf.variation = p_variation)
        GROUP BY cf.step_name, cf.step_number, cf.variation
    ),
    step_progression AS (
        SELECT
            fa.step_name,
            fa.step_number,
            fa.users_at_step,
            LAG(fa.users_at_step) OVER (ORDER BY fa.step_number) as previous_step_users,
            fa.variation,
            AVG(EXTRACT(EPOCH FROM (fa.timestamp - LAG(fa.timestamp) OVER (PARTITION BY session_id ORDER BY step_number)))) as avg_time_to_step
        FROM funnel_analysis fa
    )
    SELECT
        sp.step_name,
        sp.step_number,
        sp.users_at_step,
        CASE
            WHEN sp.previous_step_users > 0
            THEN (sp.users_at_step::DECIMAL / sp.previous_step_users::DECIMAL) * 100
            ELSE 100
        END as conversion_rate_to_next,
        CASE
            WHEN sp.previous_step_users > 0
            THEN ((sp.previous_step_users - sp.users_at_step)::DECIMAL / sp.previous_step_users::DECIMAL) * 100
            ELSE 0
        END as drop_off_rate,
        COALESCE(sp.avg_time_to_step, 0)::INTEGER as average_time_to_step
    FROM step_progression sp
    ORDER BY sp.step_number;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION track_conversion_event TO anon;
GRANT EXECUTE ON FUNCTION track_funnel_step TO anon;
GRANT EXECUTE ON FUNCTION update_conversion_metrics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel_analysis TO authenticated;

-- Create materialized view for conversion performance (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS conversion_performance_mv AS
SELECT
    DATE(timestamp) as metric_date,
    event_name,
    variation,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(conversion_value) as avg_conversion_value,
    SUM(conversion_value) as total_conversion_value
FROM conversion_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_name, variation;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_performance_mv_unique
    ON conversion_performance_mv (metric_date, event_name, variation);

COMMENT ON TABLE conversion_events IS 'Tracks all conversion-related events for funnel analysis and optimization';
COMMENT ON TABLE conversion_funnel IS 'Tracks user progression through booking funnel steps';
COMMENT ON TABLE ab_tests IS 'Manages A/B test configurations and variations';
COMMENT ON TABLE conversion_metrics_summary IS 'Daily aggregated conversion metrics for performance tracking';
COMMENT ON TABLE user_booking_preferences IS 'Stores user preferences for smart defaults and personalization';
COMMENT ON TABLE trust_signals IS 'Manages trust signals and social proof data displayed to users';
COMMENT ON TABLE payment_method_performance IS 'Tracks payment method performance metrics';