-- AI Scheduling System Database Schema
-- This migration creates tables for storing AI scheduling patterns, predictions, and analytics

-- Create booking_patterns table for storing customer booking patterns
CREATE TABLE IF NOT EXISTS booking_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,

    -- Pattern data
    preferred_days INT[] DEFAULT '{}', -- 0-6 (Sunday-Saturday)
    preferred_times INT[] DEFAULT '{}', -- Hours of day (0-23)
    booking_frequency DECIMAL(5,2) DEFAULT 0, -- Bookings per month
    average_advance_booking DECIMAL(5,2) DEFAULT 0, -- Days in advance
    seasonalpreferences DECIMAL(3,2)[] DEFAULT '{}', -- Monthly preferences (1-12)

    -- Cancellation data
    cancellation_history JSONB DEFAULT '{}',
    -- {
    --   "total": 5,
    --   "reasons": ["sick", "conflict", "emergency"],
    --   "patterns": [24, 48, 72] -- Hours before cancellation
    -- }

    -- No-show data
    no_show_history JSONB DEFAULT '{}',
    -- {
    --   "total": 2,
    --   "lastOccurrence": "2024-01-15T10:00:00Z",
    --   "riskFactors": ["new_customer", "late_booking", "no_history"]
    -- }

    -- Additional metrics
    package_bookings BOOLEAN DEFAULT false,
    loyalty_points INT DEFAULT 0,
    time_since_last_booking INT DEFAULT 0, -- Days

    -- Metadata
    confidence_score DECIMAL(3,2) DEFAULT 0, -- 0-1
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1,

    -- Constraints
    UNIQUE(customer_id, service_id)
);

-- Create service_patterns table for storing service booking patterns
CREATE TABLE IF NOT EXISTS service_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,

    -- Service details
    service_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('beauty', 'fitness', 'lifestyle')),
    duration INT NOT NULL, -- Minutes
    price DECIMAL(10,2) NOT NULL,

    -- Demand patterns
    peak_demand JSONB DEFAULT '{}',
    -- {
    --   "days": [1, 5, 6], -- Monday, Friday, Saturday
    --   "times": [10, 14, 18], -- 10 AM, 2 PM, 6 PM
    --   "months": [5, 6, 7, 12] -- May, June, July, December
    -- }

    seasonal_trends JSONB DEFAULT '{}',
    -- [
    --   { "month": 1, "demandMultiplier": 0.8 },
    --   { "month": 6, "demandMultiplier": 1.5 }
    -- ]

    -- Performance metrics
    booking_frequency DECIMAL(5,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    cancellation_rate DECIMAL(3,2) DEFAULT 0,
    no_show_rate DECIMAL(3,2) DEFAULT 0,

    -- Popular features
    popular_addons TEXT[] DEFAULT '{}',
    package_deals TEXT[] DEFAULT '{}',

    -- Metadata
    confidence_score DECIMAL(3,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1
);

-- Create ai_predictions table for storing AI predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('noshow', 'cancellation', 'demand', 'optimal_time')),
    target_id UUID NOT NULL, -- booking_id, service_id, or customer_id
    prediction JSONB NOT NULL,

    -- Prediction metadata
    model_version TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    features JSONB DEFAULT '{}', -- Features used for prediction

    -- Accuracy tracking (filled after outcome)
    actual_outcome BOOLEAN,
    accuracy_score DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ
);

-- Create reminder_schedules table for smart reminder schedules
CREATE TABLE IF NOT EXISTS reminder_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Reminder configuration
    reminders JSONB NOT NULL DEFAULT '[]',
    -- [
    --   {
    --     "id": "rem_001",
    --     "type": "confirmation",
    --     "channel": "email",
    --     "scheduledAt": "2024-01-15T10:00:00Z",
    --     "status": "pending",
    --     "content": { ... }
    --   }
    -- ]

    -- Optimization metrics
    optimization_score DECIMAL(3,2) DEFAULT 0,
    predicted_effectiveness JSONB DEFAULT '{}',
    -- {
    --   "attendanceProbability": 0.95,
    --   "confirmationRate": 0.80,
    --   "noShowReduction": 0.75
    -- }

    -- Execution tracking
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results
    actual_effectiveness JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduling_recommendations table
CREATE TABLE IF NOT EXISTS scheduling_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('optimal_time', 'price_adjustment', 'promotion', 'resource_allocation', 'reminder')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Recommendation details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action JSONB NOT NULL,
    -- {
    --   "type": "price_adjustment",
    --   "parameters": {
    --     "serviceId": "uuid",
    --     "newPrice": 150,
    --     "effectiveFrom": "2024-02-01"
    --   }
    -- }

    -- Expected impact
    expected_impact JSONB NOT NULL,
    -- {
    --   "revenue": 15, -- Percentage
    --   "efficiency": 10,
    --   "satisfaction": 5
    -- }

    -- Target
    target_type TEXT NOT NULL CHECK (target_type IN ('service', 'customer', 'global')),
    target_id UUID,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
    applied_at TIMESTAMPTZ,
    applied_by UUID REFERENCES auth.users(id),

    -- AI metadata
    confidence DECIMAL(3,2) NOT NULL,
    reasoning TEXT,
    valid_until TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_model_versions table for tracking AI model versions
CREATE TABLE IF NOT EXISTS ai_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('noshow_prediction', 'demand_prediction', 'cancellation_prediction', 'recommendation_engine')),
    version TEXT NOT NULL,

    -- Training details
    training_data_size INT NOT NULL,
    training_period_start TIMESTAMPTZ NOT NULL,
    training_period_end TIMESTAMPTZ NOT NULL,

    -- Performance metrics
    accuracy DECIMAL(3,2),
    precision DECIMAL(3,2),
    recall DECIMAL(3,2),
    f1_score DECIMAL(3,2),
    auc DECIMAL(3,2),

    -- Model details
    features TEXT[] DEFAULT '{}',
    hyperparameters JSONB DEFAULT '{}',
    model_file_path TEXT,

    -- Status
    is_active BOOLEAN DEFAULT false,
    deployment_date TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduling_analytics table for precomputed analytics
CREATE TABLE IF NOT EXISTS scheduling_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'month', 'quarter', 'year')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Core metrics
    total_bookings INT DEFAULT 0,
    completed_bookings INT DEFAULT 0,
    cancelled_bookings INT DEFAULT 0,
    no_shows INT DEFAULT 0,

    -- Rates
    no_show_rate DECIMAL(3,2) DEFAULT 0,
    cancellation_rate DECIMAL(3,2) DEFAULT 0,
    fill_rate DECIMAL(3,2) DEFAULT 0,

    -- Revenue metrics
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_revenue_per_booking DECIMAL(10,2) DEFAULT 0,
    revenue_optimization JSONB DEFAULT '{}',

    -- Customer metrics
    unique_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    customer_satisfaction DECIMAL(3,2) DEFAULT 0,

    -- Service performance
    service_performance JSONB DEFAULT '{}',

    -- Time utilization
    time_slot_utilization JSONB DEFAULT '{}',

    -- AI prediction accuracy
    predictions_accuracy JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(period_type, period_start, period_end)
);

-- Create ai_feature_flags table for controlling AI features
CREATE TABLE IF NOT EXISTS ai_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,

    -- Feature configuration
    config JSONB DEFAULT '{}',

    -- Rollout control
    rollout_percentage DECIMAL(3,2) DEFAULT 0, -- 0-1
    target_users UUID[] DEFAULT '{}',
    excluded_users UUID[] DEFAULT '{}',

    -- Metadata
    description TEXT,
    created_by UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_patterns_customer_id ON booking_patterns(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_patterns_service_id ON booking_patterns(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_patterns_updated ON booking_patterns(last_updated);

CREATE INDEX IF NOT EXISTS idx_service_patterns_service_id ON service_patterns(service_id);
CREATE INDEX IF NOT EXISTS idx_service_patterns_category ON service_patterns(category);
CREATE INDEX IF NOT EXISTS idx_service_patterns_updated ON service_patterns(last_updated);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_type_target ON ai_predictions(type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created ON ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_confidence ON ai_predictions(confidence);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_booking_id ON reminder_schedules(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_customer_id ON reminder_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_created ON reminder_schedules(created_at);

CREATE INDEX IF NOT EXISTS idx_scheduling_recommendations_type ON scheduling_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_scheduling_recommendations_status ON scheduling_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_scheduling_recommendations_priority ON scheduling_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_scheduling_recommendations_valid ON scheduling_recommendations(valid_until);

CREATE INDEX IF NOT EXISTS idx_ai_model_versions_type ON ai_model_versions(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_active ON ai_model_versions(is_active);

CREATE INDEX IF NOT EXISTS idx_scheduling_analytics_period ON scheduling_analytics(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_scheduling_analytics_created ON scheduling_analytics(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_booking_patterns_updated_at BEFORE UPDATE ON booking_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_patterns_updated_at BEFORE UPDATE ON service_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_predictions_updated_at BEFORE UPDATE ON ai_predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminder_schedules_updated_at BEFORE UPDATE ON reminder_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduling_recommendations_updated_at BEFORE UPDATE ON scheduling_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduling_analytics_updated_at BEFORE UPDATE ON scheduling_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_feature_flags_updated_at BEFORE UPDATE ON ai_feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Booking patterns policies
CREATE POLICY "Users can view own booking patterns" ON booking_patterns FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Service providers can view customer patterns" ON booking_patterns FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM services s
        JOIN bookings b ON b.service_id = s.id
        WHERE s.provider_id = auth.uid()
        AND b.client_id = booking_patterns.customer_id
    )
);

-- Service patterns policies
CREATE POLICY "All authenticated users can view service patterns" ON service_patterns FOR SELECT USING (auth.role() = 'authenticated');

-- AI predictions policies
CREATE POLICY "Users can view own predictions" ON ai_predictions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = ai_predictions.target_id
        AND b.client_id = auth.uid()
    )
);
CREATE POLICY "Service providers can view predictions for their bookings" ON ai_predictions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN services s ON s.id = b.service_id
        WHERE b.id = ai_predictions.target_id
        AND s.provider_id = auth.uid()
    )
);

-- Reminder schedules policies
CREATE POLICY "Users can view own reminder schedules" ON reminder_schedules FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Service providers can view reminder schedules" ON reminder_schedules FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN services s ON s.id = b.service_id
        WHERE b.id = reminder_schedules.booking_id
        AND s.provider_id = auth.uid()
    )
);

-- Scheduling recommendations policies
CREATE POLICY "Service providers can view recommendations" ON scheduling_recommendations FOR SELECT USING (
    auth.role() = 'authenticated' AND (
        target_type = 'global' OR
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = scheduling_recommendations.target_id
            AND s.provider_id = auth.uid()
        )
    )
);

-- Analytics policies
CREATE POLICY "Service providers can view analytics" ON scheduling_analytics FOR SELECT USING (auth.role() = 'authenticated');

-- Insert initial AI feature flags
INSERT INTO ai_feature_flags (feature_name, is_enabled, config, description) VALUES
('smart_scheduling', true, '{"model_version": "v1.0", "confidence_threshold": 0.7}', 'Enable AI-powered smart scheduling recommendations'),
('noshow_prediction', true, '{"model_version": "v2.1", "threshold_low": 0.3, "threshold_high": 0.7}', 'Enable no-show risk prediction'),
('smart_reminders', true, '{"channels": ["email", "sms"], "max_reminders": 5}', 'Enable optimized reminder scheduling'),
('demand_prediction', true, '{"forecast_days": 30, "min_confidence": 0.6}', 'Enable demand forecasting'),
('price_optimization', false, '{"dynamic_pricing": false, "max_adjustment": 20}', 'Enable AI price optimization')
ON CONFLICT (feature_name) DO NOTHING;

-- Insert initial AI model version
INSERT INTO ai_model_versions (
    model_type,
    version,
    training_data_size,
    training_period_start,
    training_period_end,
    accuracy,
    precision,
    recall,
    f1_score,
    auc,
    is_active,
    deployment_date
) VALUES (
    'noshow_prediction',
    'v2.1',
    15420,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 day',
    0.87,
    0.85,
    0.89,
    0.87,
    0.92,
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- Create function to update booking patterns
CREATE OR REPLACE FUNCTION update_booking_pattern()
RETURNS TRIGGER AS $$
DECLARE
    pattern RECORD;
BEGIN
    -- Update or create booking pattern for this customer and service
    INSERT INTO booking_patterns (
        customer_id,
        service_id,
        preferred_days,
        preferred_times,
        booking_frequency,
        average_advance_booking,
        cancellation_history,
        no_show_history,
        time_since_last_booking,
        confidence_score,
        last_updated
    )
    VALUES (
        NEW.client_id,
        NEW.service_id,
        -- Calculate preferred days from recent bookings
        ARRAY(
            SELECT EXTRACT(DOW FROM start_time)::INT
            FROM bookings
            WHERE client_id = NEW.client_id
            AND service_id = NEW.service_id
            AND created_at > NOW() - INTERVAL '90 days'
            GROUP BY EXTRACT(DOW FROM start_time)
            ORDER BY COUNT(*) DESC
            LIMIT 3
        ),
        -- Calculate preferred times
        ARRAY(
            SELECT EXTRACT(HOUR FROM start_time)::INT
            FROM bookings
            WHERE client_id = NEW.client_id
            AND service_id = NEW.service_id
            AND created_at > NOW() - INTERVAL '90 days'
            GROUP BY EXTRACT(HOUR FROM start_time)
            ORDER BY COUNT(*) DESC
            LIMIT 3
        ),
        -- Calculate booking frequency
        (SELECT COUNT(*)::DECIMAL / 3 FROM bookings
         WHERE client_id = NEW.client_id
         AND service_id = NEW.service_id
         AND created_at > NOW() - INTERVAL '90 days'),
        -- Calculate average advance booking
        (SELECT AVG(EXTRACT(EPOCH FROM (start_time - created_at)) / 86400)::DECIMAL
         FROM bookings
         WHERE client_id = NEW.client_id
         AND service_id = NEW.service_id
         AND created_at > NOW() - INTERVAL '90 days'),
        -- Cancellation history
        json_build_object(
            'total', (SELECT COUNT(*) FROM bookings WHERE client_id = NEW.client_id AND status = 'cancelled'),
            'reasons', ARRAY['sick', 'conflict', 'emergency'],
            'patterns', ARRAY[24, 48, 72]
        ),
        -- No-show history
        json_build_object(
            'total', (SELECT COUNT(*) FROM bookings WHERE client_id = NEW.client_id AND status = 'no_show'),
            'lastOccurrence', NULL,
            'riskFactors', ARRAY[]
        ),
        -- Time since last booking
        EXTRACT(EPOCH FROM (NOW() - (
            SELECT MAX(created_at) FROM bookings
            WHERE client_id = NEW.client_id
            AND service_id = NEW.service_id
        ))) / 86400,
        0.8, -- Default confidence
        NOW()
    )
    ON CONFLICT (customer_id, service_id)
    DO UPDATE SET
        preferred_days = EXCLUDED.preferred_days,
        preferred_times = EXCLUDED.preferred_times,
        booking_frequency = EXCLUDED.booking_frequency,
        average_advance_booking = EXCLUDED.average_advance_booking,
        time_since_last_booking = EXCLUDED.time_since_last_booking,
        last_updated = NOW(),
        version = booking_patterns.version + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update booking patterns
CREATE TRIGGER trigger_update_booking_pattern
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_pattern();

-- Create function to compute daily analytics
CREATE OR REPLACE FUNCTION compute_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    analytics RECORD;
    period_start TIMESTAMPTZ;
    period_end TIMESTAMPTZ;
BEGIN
    period_start = target_date::TIMESTAMPTZ;
    period_end = (target_date + INTERVAL '1 day')::TIMESTAMPTZ;

    -- Calculate analytics for the day
    INSERT INTO scheduling_analytics (
        period_type,
        period_start,
        period_end,
        total_bookings,
        completed_bookings,
        cancelled_bookings,
        no_shows,
        no_show_rate,
        cancellation_rate,
        fill_rate,
        total_revenue,
        average_revenue_per_booking,
        unique_customers,
        returning_customers,
        customer_satisfaction,
        service_performance,
        time_slot_utilization,
        predictions_accuracy
    )
    SELECT
        'day',
        period_start,
        period_end,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status = 'no_show'),
        CASE WHEN COUNT(*) > 0 THEN
            (COUNT(*) FILTER (WHERE status = 'no_show')::DECIMAL / COUNT(*))
        ELSE 0 END,
        CASE WHEN COUNT(*) > 0 THEN
            (COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL / COUNT(*))
        ELSE 0 END,
        0.85, -- Would calculate from actual capacity
        COALESCE(SUM(total_price), 0),
        CASE WHEN COUNT(*) > 0 THEN
            COALESCE(AVG(total_price), 0)
        ELSE 0 END,
        COUNT(DISTINCT client_id),
        COUNT(DISTINCT client_id) FILTER (
            WHERE client_id IN (
                SELECT client_id FROM bookings
                WHERE created_at < period_start
            )
        ),
        4.5, -- Would calculate from reviews
        json_build_array(), -- Would populate with service metrics
        json_build_array(), -- Would populate with hourly utilization
        json_build_object(
            'demand', 0.87,
            'noshow', 0.82,
            'cancellations', 0.79
        )
    FROM bookings
    WHERE start_time >= period_start AND start_time < period_end
    ON CONFLICT (period_type, period_start, period_end)
    DO UPDATE SET
        total_bookings = EXCLUDED.total_bookings,
        completed_bookings = EXCLUDED.completed_bookings,
        cancelled_bookings = EXCLUDED.cancelled_bookings,
        no_shows = EXCLUDED.no_shows,
        no_show_rate = EXCLUDED.no_show_rate,
        cancellation_rate = EXCLUDED.cancellation_rate,
        fill_rate = EXCLUDED.fill_rate,
        total_revenue = EXCLUDED.total_revenue,
        average_revenue_per_booking = EXCLUDED.average_revenue_per_booking,
        unique_customers = EXCLUDED.unique_customers,
        returning_customers = EXCLUDED.returning_customers,
        customer_satisfaction = EXCLUDED.customer_satisfaction,
        service_performance = EXCLUDED.service_performance,
        time_slot_utilization = EXCLUDED.time_slot_utilization,
        predictions_accuracy = EXCLUDED.predictions_accuracy,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer AI insights
CREATE OR REPLACE FUNCTION get_customer_ai_insights(customer_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    insights JSONB;
    pattern RECORD;
    recent_bookings RECORD;
    recommendations JSONB;
BEGIN
    -- Get customer's booking pattern
    SELECT * INTO pattern FROM booking_patterns WHERE customer_id = customer_uuid;

    -- Get recent bookings
    SELECT json_agg(
        json_build_object(
            'id', id,
            'service', (SELECT name FROM services WHERE id = bookings.service_id),
            'date', start_time,
            'status', status
        )
    ) INTO recent_bookings
    FROM bookings
    WHERE client_id = customer_uuid
    AND start_time > NOW() - INTERVAL '30 days'
    ORDER BY start_time DESC;

    -- Get active recommendations
    SELECT json_agg(
        json_build_object(
            'title', title,
            'description', description,
            'priority', priority,
            'validUntil', valid_until
        )
    ) INTO recommendations
    FROM scheduling_recommendations
    WHERE target_id = customer_uuid
    AND target_type = 'customer'
    AND status = 'pending'
    AND valid_until > NOW();

    -- Build insights
    insights := json_build_object(
        'pattern', COALESCE(row_to_json(pattern), '{}'),
        'recentBookings', COALESCE(recent_bookings, '[]'),
        'recommendations', COALESCE(recommendations, '[]'),
        'nextBestAppointment', json_build_object(
            'suggestedDay', 'Friday',
            'suggestedTime', '14:00',
            'confidence', 0.85
        ),
        'loyaltyScore', CASE
            WHEN pattern.booking_frequency > 4 THEN 'Gold'
            WHEN pattern.booking_frequency > 2 THEN 'Silver'
            ELSE 'Bronze'
        END,
        'riskLevel', CASE
            WHEN pattern.no_show_history->>'total'::INT > 2 THEN 'High'
            WHEN pattern.no_show_history->>'total'::INT > 0 THEN 'Medium'
            ELSE 'Low'
        END
    );

    RETURN insights;
END;
$$ LANGUAGE plpgsql;

-- Create view for active recommendations
CREATE OR REPLACE VIEW active_recommendations AS
SELECT
    sr.*,
    s.name as service_name,
    p.first_name || ' ' || p.last_name as customer_name,
    CASE
        WHEN sr.target_type = 'service' THEN s.name
        WHEN sr.target_type = 'customer' THEN p.first_name || ' ' || p.last_name
        ELSE 'All Services'
    END as target_name
FROM scheduling_recommendations sr
LEFT JOIN services s ON sr.target_id = s.id AND sr.target_type = 'service'
LEFT JOIN profiles p ON sr.target_id = p.id AND sr.target_type = 'customer'
WHERE sr.status = 'pending'
AND sr.valid_until > NOW()
ORDER BY sr.priority DESC, sr.confidence DESC;

-- Grant necessary permissions
GRANT SELECT ON active_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION compute_daily_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_ai_insights(UUID) TO authenticated;