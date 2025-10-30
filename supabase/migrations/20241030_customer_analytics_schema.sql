-- Customer Analytics Schema Migration
-- Comprehensive customer analytics for luxury beauty/fitness platform

-- Analytics configuration table
CREATE TABLE IF NOT EXISTS analytics_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL UNIQUE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('clv', 'churn_risk', 'satisfaction', 'engagement', 'performance')),
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer lifetime value tracking
CREATE TABLE IF NOT EXISTS customer_lifetime_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- CLV Components
    historical_revenue DECIMAL(10,2) DEFAULT 0,
    predicted_revenue_12m DECIMAL(10,2) DEFAULT 0,
    predicted_revenue_24m DECIMAL(10,2) DEFAULT 0,
    total_clv DECIMAL(10,2) DEFAULT 0,

    -- CLV Metrics
    average_order_value DECIMAL(10,2) DEFAULT 0,
    purchase_frequency DECIMAL(5,2) DEFAULT 0,
    customer_tenure_months INTEGER DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,

    -- Segmentation
    clv_tier TEXT CHECK (clv_tier IN ('platinum', 'gold', 'silver', 'bronze', 'new')),
    value_score INTEGER CHECK (value_score >= 0 AND value_score <= 100),

    -- Prediction confidence
    prediction_confidence DECIMAL(3,2) CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, calculation_date)
);

-- Churn risk assessment
CREATE TABLE IF NOT EXISTS churn_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,

    -- Risk scoring
    churn_probability DECIMAL(5,4) CHECK (churn_probability >= 0 AND churn_probability <= 1),
    risk_level TEXT CHECK (risk_level IN ('critical', 'high', 'medium', 'low', 'minimal')),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),

    -- Behavioral indicators
    days_since_last_booking INTEGER DEFAULT 0,
    booking_frequency_decline DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    satisfaction_trend TEXT CHECK (satisfaction_trend IN ('improving', 'stable', 'declining')),

    -- Predictive factors
    predictive_features JSONB DEFAULT '{}',
    model_version TEXT NOT NULL,
    prediction_confidence DECIMAL(3,2) DEFAULT 0.5,

    -- Intervention tracking
    intervention_triggered BOOLEAN DEFAULT false,
    intervention_type TEXT,
    intervention_date TIMESTAMPTZ,
    intervention_result TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, assessment_date)
);

-- Customer journey mapping
CREATE TABLE IF NOT EXISTS customer_journey_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT,

    -- Event details
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_properties JSONB DEFAULT '{}',

    -- Journey context
    touchpoint TEXT NOT NULL,
    channel TEXT NOT NULL,
    campaign TEXT,
    source TEXT,
    medium TEXT,

    -- Timing
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    session_duration_seconds INTEGER,

    -- Conversion tracking
    conversion_funnel_stage TEXT,
    conversion_value DECIMAL(10,2),
    is_conversion_event BOOLEAN DEFAULT false,

    -- Journey analysis
    journey_step INTEGER,
    total_journey_steps INTEGER,
    dropped_off_at_step BOOLEAN DEFAULT false,
    dropoff_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personalization data
CREATE TABLE IF NOT EXISTS personalization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Preference clustering
    preference_cluster TEXT,
    behavioral_segment TEXT,
    demographic_segment TEXT,

    -- Service preferences
    preferred_service_types TEXT[],
    preferred_time_slots TEXT[],
    preferred_locations TEXT[],
    price_sensitivity_level TEXT CHECK (price_sensitivity_level IN ('high', 'medium', 'low')),

    -- Behavioral patterns
    booking_patterns JSONB DEFAULT '{}',
    interaction_patterns JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',

    -- Recommendation weights
    collaborative_filtering_weights JSONB DEFAULT '{}',
    content_based_weights JSONB DEFAULT '{}',
    hybrid_weights JSONB DEFAULT '{}',

    -- Personalization effectiveness
    recommendation_ctr DECIMAL(5,4) DEFAULT 0,
    personalization_lift DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Service recommendations
CREATE TABLE IF NOT EXISTS service_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,

    -- Recommendation details
    recommendation_type TEXT CHECK (recommendation_type IN ('collaborative', 'content_based', 'hybrid', 'popular', 'seasonal')),
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recommendation_reason TEXT,

    -- Context
    context JSONB DEFAULT '{}',
    trigger_event TEXT,

    -- Performance tracking
    shown_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),

    -- A/B testing
    experiment_id TEXT,
    variation_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer satisfaction tracking
CREATE TABLE IF NOT EXISTS customer_satisfaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,

    -- Satisfaction metrics
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
    service_quality_score INTEGER CHECK (service_quality_score >= 1 AND overall_satisfaction <= 10),
    value_for_money_score INTEGER CHECK (value_for_money_score >= 1 AND value_for_money_score <= 10),
    likelihood_to_recommend INTEGER CHECK (likelihood_to_recommend >= 0 AND likelihood_to_recommend <= 10),

    -- sentiment analysis
    sentiment_score DECIMAL(5,4) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    sentiment_confidence DECIMAL(3,2),

    -- Feedback text
    feedback_text TEXT,
    feedback_keywords TEXT[],
    feedback_summary TEXT,

    -- Response management
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_status TEXT,
    follow_up_date TIMESTAMPTZ,
    auto_response_sent BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referral_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,

    -- Program configuration
    referral_type TEXT CHECK (referral_type IN ('customer', 'influencer', 'partner')),
    reward_type TEXT CHECK (reward_type IN ('discount', 'cash', 'service', 'points')),
    reward_amount DECIMAL(10,2),
    reward_currency TEXT DEFAULT 'PLN',

    -- Program rules
    minimum_booking_value DECIMAL(10,2) DEFAULT 0,
    reward_conditions JSONB DEFAULT '{}',
    expiration_days INTEGER DEFAULT 365,

    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES referral_programs(id),
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referred_email TEXT,
    referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Referral details
    referral_code TEXT UNIQUE NOT NULL,
    referral_date TIMESTAMPTZ DEFAULT NOW(),

    -- Conversion tracking
    conversion_date TIMESTAMPTZ,
    first_booking_date TIMESTAMPTZ,
    first_booking_value DECIMAL(10,2),

    -- Rewards
    reward_status TEXT CHECK (reward_status IN ('pending', 'issued', 'expired', 'void')),
    reward_issued_date TIMESTAMPTZ,
    reward_amount DECIMAL(10,2),

    -- Attribution
    attribution_window_days INTEGER DEFAULT 30,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Influencer tracking
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Influencer profile
    influencer_tier TEXT CHECK (influencer_tier IN ('nano', 'micro', 'macro', 'mega')),
    primary_platform TEXT,
    handle TEXT,
    follower_count INTEGER,

    -- Contact and terms
    contact_email TEXT,
    commission_rate DECIMAL(5,4),
    contract_terms JSONB DEFAULT '{}',

    -- Performance metrics
    total_referrals INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    total_revenue_generated DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    partnership_start_date DATE,
    partnership_end_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Seasonal behavior patterns
CREATE TABLE IF NOT EXISTS seasonal_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Pattern identification
    pattern_name TEXT NOT NULL,
    pattern_type TEXT CHECK (pattern_type IN ('booking', 'service_preference', 'spending', 'engagement')),
    season TEXT NOT NULL,
    year INTEGER NOT NULL,

    -- Pattern metrics
    baseline_value DECIMAL(10,2),
    seasonal_value DECIMAL(10,2),
    seasonal_index DECIMAL(5,2),
    confidence_level DECIMAL(3,2),

    -- Pattern characteristics
    start_date DATE,
    end_date DATE,
    peak_date DATE,
    duration_days INTEGER,

    -- Influencing factors
    driving_factors JSONB DEFAULT '{}',
    external_events JSONB DEFAULT '{}',

    -- Predictions
    next_season_prediction DECIMAL(10,2),
    prediction_accuracy DECIMAL(3,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(pattern_name, season, year)
);

-- Customer acquisition channels
CREATE TABLE IF NOT EXISTS acquisition_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Channel identification
    channel_name TEXT NOT NULL UNIQUE,
    channel_category TEXT CHECK (channel_category IN ('organic', 'paid', 'social', 'referral', 'direct', 'email')),
    subchannel TEXT,

    -- Channel metrics
    total_customers INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    cac DECIMAL(10,2) DEFAULT 0,
    ltv_cac_ratio DECIMAL(5,2) DEFAULT 0,

    -- Performance tracking
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    lead_to_customer_rate DECIMAL(5,4) DEFAULT 0,
    payback_period_days INTEGER,

    -- Attribution modeling
    attribution_model TEXT DEFAULT 'last_click',
    custom_attribution_rules JSONB DEFAULT '{}',

    -- Budget and ROI
    total_spend DECIMAL(12,2) DEFAULT 0,
    total_roi DECIMAL(10,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_acquisition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Acquisition details
    acquisition_date DATE NOT NULL,
    first_touch_channel TEXT,
    first_touch_timestamp TIMESTAMPTZ,
    last_touch_channel TEXT,
    last_touch_timestamp TIMESTAMPTZ,

    -- Attribution
    attributed_channel UUID REFERENCES acquisition_channels(id),
    attribution_model TEXT DEFAULT 'last_click',
    attribution_confidence DECIMAL(3,2),

    -- Journey details
    touchpoints JSONB DEFAULT '[]',
    total_touchpoints INTEGER DEFAULT 0,
    time_to_convert_days INTEGER,

    -- Cost tracking
    acquisition_cost DECIMAL(10,2) DEFAULT 0,
    attributed_spend DECIMAL(10,2) DEFAULT 0,

    -- Value tracking
    first_booking_value DECIMAL(10,2),
    lifetime_value DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events (for tracking various metrics)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event identification
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_name TEXT NOT NULL,

    -- User and session
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Event data
    properties JSONB DEFAULT '{}',
    value DECIMAL(10,2),
    currency TEXT DEFAULT 'PLN',

    -- Context
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    url TEXT,
    user_agent TEXT,
    ip_address INET,

    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized views for analytics performance
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_summary_metrics AS
SELECT
    p.id as user_id,
    p.full_name,
    p.email,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    AVG(b.total_amount) as avg_booking_value,
    MIN(b.created_at) as first_booking_date,
    MAX(b.created_at) as last_booking_date,
    DATE_PART('day', MAX(b.created_at) - MIN(b.created_at)) as customer_lifespan_days,
    COALESCE(clv.total_clv, 0) as current_clv,
    COALESCE(cra.churn_probability, 0) as churn_risk,
    COALESCE(cs.overall_satisfaction, 0) as avg_satisfaction
FROM profiles p
LEFT JOIN bookings b ON p.id = b.user_id AND b.status = 'completed'
LEFT JOIN customer_lifetime_value clv ON p.id = clv.user_id
LEFT JOIN churn_risk_assessments cra ON p.id = cra.user_id
LEFT JOIN customer_satisfaction cs ON p.id = cs.user_id
GROUP BY p.id, p.full_name, p.email, clv.total_clv, cra.churn_probability, cs.overall_satisfaction;

CREATE MATERIALIZED VIEW IF NOT EXISTS channel_performance_summary AS
SELECT
    ac.channel_name,
    ac.channel_category,
    COUNT(ca.user_id) as total_customers,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    COALESCE(AVG(b.total_amount), 0) as avg_customer_value,
    ac.cac,
    ac.ltv_cac_ratio,
    ac.roi_percentage
FROM acquisition_channels ac
LEFT JOIN customer_acquisition ca ON ac.id = ca.attributed_channel
LEFT JOIN bookings b ON ca.user_id = b.user_id AND b.status = 'completed'
GROUP BY ac.id, ac.channel_name, ac.channel_category, ac.cac, ac.ltv_cac_ratio, ac.roi_percentage;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_lifetime_value_user_id ON customer_lifetime_value(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_lifetime_value_calculation_date ON customer_lifetime_value(calculation_date);
CREATE INDEX IF NOT EXISTS idx_churn_risk_assessments_user_id ON churn_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_assessments_assessment_date ON churn_risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_churn_risk_assessments_risk_level ON churn_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_customer_journey_events_user_id ON customer_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_events_session_id ON customer_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_events_occurred_at ON customer_journey_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_customer_journey_events_event_type ON customer_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_user_id ON personalization_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_user_id ON service_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_service_id ON service_recommendations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_created_at ON service_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_user_id ON customer_satisfaction(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_booking_id ON customer_satisfaction(booking_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_patterns_pattern_type ON seasonal_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_seasonal_patterns_season ON seasonal_patterns(season);
CREATE INDEX IF NOT EXISTS idx_acquisition_channels_channel_category ON acquisition_channels(channel_category);
CREATE INDEX IF NOT EXISTS idx_customer_acquisition_user_id ON customer_acquisition(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_acquisition_attributed_channel ON customer_acquisition(attributed_channel);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_processed ON analytics_events(processed);

-- Functions for CLV calculation
CREATE OR REPLACE FUNCTION calculate_customer_clv(
    p_user_id UUID,
    p_calculation_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
    v_historical_revenue DECIMAL(10,2);
    v_total_bookings INTEGER;
    v_avg_order_value DECIMAL(10,2);
    v_customer_tenure_months INTEGER;
    v_booking_frequency DECIMAL(5,2);
    v_predicted_revenue_12m DECIMAL(10,2);
    v_predicted_revenue_24m DECIMAL(10,2);
    v_total_clv DECIMAL(10,2);
    v_clv_tier TEXT;
    v_value_score INTEGER;
BEGIN
    -- Calculate historical metrics
    SELECT
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COALESCE(AVG(total_amount), 0),
        EXTRACT(MONTH FROM AGE(p_calculation_date, MIN(created_at)))
    INTO
        v_historical_revenue,
        v_total_bookings,
        v_avg_order_value,
        v_customer_tenure_months
    FROM bookings
    WHERE user_id = p_user_id
    AND status = 'completed'
    AND created_at <= p_calculation_date;

    -- Calculate booking frequency (bookings per month)
    IF v_customer_tenure_months > 0 THEN
        v_booking_frequency := v_total_bookings::DECIMAL / v_customer_tenure_months;
    ELSE
        v_booking_frequency := 0;
    END IF;

    -- Predict future revenue (simplified model)
    v_predicted_revenue_12m := v_avg_order_value * v_booking_frequency * 12;
    v_predicted_revenue_24m := v_avg_order_value * v_booking_frequency * 24;

    -- Calculate total CLV
    v_total_clv := v_historical_revenue + v_predicted_revenue_24m;

    -- Determine CLV tier
    IF v_total_clv >= 10000 THEN
        v_clv_tier := 'platinum';
        v_value_score := 90 + LEAST(10, (v_total_clv - 10000) / 1000);
    ELSIF v_total_clv >= 5000 THEN
        v_clv_tier := 'gold';
        v_value_score := 70 + ((v_total_clv - 5000) / 50);
    ELSIF v_total_clv >= 2000 THEN
        v_clv_tier := 'silver';
        v_value_score := 50 + ((v_total_clv - 2000) / 30);
    ELSIF v_total_clv >= 500 THEN
        v_clv_tier := 'bronze';
        v_value_score := 30 + ((v_total_clv - 500) / 15);
    ELSE
        v_clv_tier := 'new';
        v_value_score := LEAST(30, v_total_clv / 20);
    END IF;

    -- Insert or update CLV record
    INSERT INTO customer_lifetime_value (
        user_id,
        calculation_date,
        historical_revenue,
        predicted_revenue_12m,
        predicted_revenue_24m,
        total_clv,
        average_order_value,
        purchase_frequency,
        customer_tenure_months,
        clv_tier,
        value_score,
        prediction_confidence
    ) VALUES (
        p_user_id,
        p_calculation_date,
        v_historical_revenue,
        v_predicted_revenue_12m,
        v_predicted_revenue_24m,
        v_total_clv,
        v_avg_order_value,
        v_booking_frequency,
        v_customer_tenure_months,
        v_clv_tier,
        v_value_score,
        CASE
            WHEN v_total_bookings >= 10 THEN 0.8
            WHEN v_total_bookings >= 5 THEN 0.6
            WHEN v_total_bookings >= 2 THEN 0.4
            ELSE 0.2
        END
    )
    ON CONFLICT (user_id, calculation_date)
    DO UPDATE SET
        historical_revenue = EXCLUDED.historical_revenue,
        predicted_revenue_12m = EXCLUDED.predicted_revenue_12m,
        predicted_revenue_24m = EXCLUDED.predicted_revenue_24m,
        total_clv = EXCLUDED.total_clv,
        average_order_value = EXCLUDED.average_order_value,
        purchase_frequency = EXCLUDED.purchase_frequency,
        customer_tenure_months = EXCLUDED.customer_tenure_months,
        clv_tier = EXCLUDED.clv_tier,
        value_score = EXCLUDED.value_score,
        prediction_confidence = EXCLUDED.prediction_confidence,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function for churn risk assessment
CREATE OR REPLACE FUNCTION assess_churn_risk(
    p_user_id UUID,
    p_assessment_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
    v_days_since_last_booking INTEGER;
    v_booking_frequency_decline DECIMAL(5,2);
    v_engagement_score DECIMAL(5,2);
    v_churn_probability DECIMAL(5,4);
    v_risk_level TEXT;
    v_risk_score INTEGER;
    v_last_booking_date TIMESTAMPTZ;
    v_avg_booking_interval DECIMAL(10,2);
    v_std_booking_interval DECIMAL(10,2);
    v_total_bookings INTEGER;
BEGIN
    -- Get last booking date
    SELECT MAX(created_at) INTO v_last_booking_date
    FROM bookings
    WHERE user_id = p_user_id
    AND status = 'completed';

    -- Calculate days since last booking
    IF v_last_booking_date IS NOT NULL THEN
        v_days_since_last_booking := EXTRACT(DAY FROM (p_assessment_date::TIMESTAMPTZ - v_last_booking_date));
    ELSE
        v_days_since_last_booking := 999; -- Never booked
    END IF;

    -- Calculate booking patterns
    SELECT
        COUNT(*),
        AVG(EXTRACT(DAY FROM (lead.created_at - lag.created_at))) as avg_interval,
        STDDEV(EXTRACT(DAY FROM (lead.created_at - lag.created_at))) as std_interval
    INTO
        v_total_bookings,
        v_avg_booking_interval,
        v_std_booking_interval
    FROM (
        SELECT created_at,
            LAG(created_at) OVER (ORDER BY created_at) as lag_created_at
        FROM bookings
        WHERE user_id = p_user_id
        AND status = 'completed'
        ORDER BY created_at
    ) sub
    WHERE lag_created_at IS NOT NULL;

    -- Calculate engagement score (simplified)
    v_engagement_score := CASE
        WHEN v_total_bookings = 0 THEN 0
        WHEN v_days_since_last_booking <= 30 THEN 100
        WHEN v_days_since_last_booking <= 60 THEN 80
        WHEN v_days_since_last_booking <= 90 THEN 60
        WHEN v_days_since_last_booking <= 180 THEN 40
        ELSE 20
    END;

    -- Adjust engagement score based on booking frequency decline
    IF v_avg_booking_interval > 0 AND v_days_since_last_booking > (v_avg_booking_interval + v_std_booking_interval) THEN
        v_booking_frequency_decline := (v_days_since_last_booking - v_avg_booking_interval) / v_avg_booking_interval * 100;
        v_engagement_score := GREATEST(0, v_engagement_score - v_booking_frequency_decline);
    END IF;

    -- Calculate churn probability (simplified model)
    v_churn_probability := CASE
        WHEN v_total_bookings = 0 THEN 1.0
        WHEN v_engagement_score >= 80 THEN 0.05
        WHEN v_engagement_score >= 60 THEN 0.15
        WHEN v_engagement_score >= 40 THEN 0.35
        WHEN v_engagement_score >= 20 THEN 0.65
        ELSE 0.85
    END;

    -- Determine risk level
    IF v_churn_probability >= 0.8 THEN
        v_risk_level := 'critical';
    ELSIF v_churn_probability >= 0.6 THEN
        v_risk_level := 'high';
    ELSIF v_churn_probability >= 0.3 THEN
        v_risk_level := 'medium';
    ELSIF v_churn_probability >= 0.1 THEN
        v_risk_level := 'low';
    ELSE
        v_risk_level := 'minimal';
    END IF;

    v_risk_score := ROUND(v_churn_probability * 100);

    -- Insert or update churn risk assessment
    INSERT INTO churn_risk_assessments (
        user_id,
        assessment_date,
        churn_probability,
        risk_level,
        risk_score,
        days_since_last_booking,
        booking_frequency_decline,
        engagement_score,
        satisfaction_trend,
        model_version,
        prediction_confidence
    ) VALUES (
        p_user_id,
        p_assessment_date,
        v_churn_probability,
        v_risk_level,
        v_risk_score,
        v_days_since_last_booking,
        v_booking_frequency_decline,
        v_engagement_score,
        CASE
            WHEN v_booking_frequency_decline > 20 THEN 'declining'
            WHEN v_booking_frequency_decline < -20 THEN 'improving'
            ELSE 'stable'
        END,
        'v1.0',
        CASE
            WHEN v_total_bookings >= 5 THEN 0.7
            WHEN v_total_bookings >= 2 THEN 0.5
            ELSE 0.3
        END
    )
    ON CONFLICT (user_id, assessment_date)
    DO UPDATE SET
        churn_probability = EXCLUDED.churn_probability,
        risk_level = EXCLUDED.risk_level,
        risk_score = EXCLUDED.risk_score,
        days_since_last_booking = EXCLUDED.days_since_last_booking,
        booking_frequency_decline = EXCLUDED.booking_frequency_decline,
        engagement_score = EXCLUDED.engagement_score,
        satisfaction_trend = EXCLUDED.satisfaction_trend,
        prediction_confidence = EXCLUDED.prediction_confidence,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY customer_summary_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY channel_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security policies
ALTER TABLE customer_lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_acquisition ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example - adjust according to your security requirements)
CREATE POLICY "Users can view own CLV data" ON customer_lifetime_value
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own churn risk data" ON churn_risk_assessments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journey events" ON customer_journey_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own personalization profile" ON personalization_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON service_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own satisfaction data" ON customer_satisfaction
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own acquisition data" ON customer_acquisition
    FOR SELECT USING (auth.uid() = user_id);

-- Triggers for automated updates
CREATE OR REPLACE FUNCTION update_analytics_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_lifetime_value_updated_at
    BEFORE UPDATE ON customer_lifetime_value
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_churn_risk_assessments_updated_at
    BEFORE UPDATE ON churn_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_personalization_profiles_updated_at
    BEFORE UPDATE ON personalization_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_service_recommendations_updated_at
    BEFORE UPDATE ON service_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_customer_satisfaction_updated_at
    BEFORE UPDATE ON customer_satisfaction
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_influencers_updated_at
    BEFORE UPDATE ON influencers
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_seasonal_patterns_updated_at
    BEFORE UPDATE ON seasonal_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_acquisition_channels_updated_at
    BEFORE UPDATE ON acquisition_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

CREATE TRIGGER update_customer_acquisition_updated_at
    BEFORE UPDATE ON customer_acquisition
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamps();

-- Automated analytics triggers
CREATE OR REPLACE FUNCTION trigger_clv_calculation()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate CLV for updated/inserted booking
    PERFORM calculate_customer_clv(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clv_on_booking_change
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION trigger_clv_calculation();

CREATE OR REPLACE FUNCTION trigger_churn_assessment()
RETURNS TRIGGER AS $$
BEGIN
    -- Assess churn risk after significant booking activity
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        PERFORM assess_churn_risk(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_churn_assessment_on_booking_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_churn_assessment();

-- Insert default analytics configuration
INSERT INTO analytics_config (metric_name, metric_type, configuration) VALUES
('clv_calculation', 'clv', '{"model": "simplified", "confidence_threshold": 0.5, "update_frequency": "daily"}'),
('churn_prediction', 'churn_risk', '{"model": "behavioral", "confidence_threshold": 0.6, "intervention_threshold": 0.7}'),
('satisfaction_tracking', 'satisfaction', '{"collection_methods": ["post_booking", "periodic"], "response_threshold": 0.3}'),
('engagement_scoring', 'engagement', '{"factors": ["booking_frequency", "time_since_last", "interaction_rate"], "weights": {"booking": 0.4, "recency": 0.4, "interaction": 0.2}}'),
('recommendation_engine', 'performance', '{"models": ["collaborative", "content_based", "hybrid"], "default_model": "hybrid", "min_confidence": 0.3}')
ON CONFLICT (metric_name) DO NOTHING;

COMMIT;