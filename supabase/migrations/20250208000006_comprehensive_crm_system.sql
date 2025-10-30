-- Comprehensive CRM System Migration for Luxury Beauty/Fitness Platform
-- This migration creates a complete CRM system with client profiles, loyalty, and advanced analytics

-- CRM-specific enums and types
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE communication_channel AS ENUM ('email', 'sms', 'whatsapp', 'push', 'in_app');
CREATE TYPE communication_type AS ENUM ('marketing', 'transactional', 'reminder', 'follow_up', 'personal');
CREATE TYPE client_segment AS ENUM ('vip', 'loyal', 'at_risk', 'new', 'dormant', 'corporate');
CREATE TYPE relationship_strength AS ENUM ('very_strong', 'strong', 'moderate', 'weak', 'very_weak');
CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'rewarded', 'expired');

-- Enhanced Client Profiles Table
CREATE TABLE IF NOT EXISTS crm_client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Personal Information
    preferred_name TEXT,
    birth_date DATE,
    occupation TEXT,
    company TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,

    -- Preferences and Characteristics
    preferred_language TEXT DEFAULT 'pl',
    communication_preferences TEXT[], -- Array of preferred channels
    appointment_reminder_hours INTEGER DEFAULT 24,
    preferred_contact_times TEXT[], -- e.g., ['morning', 'afternoon', 'evening']

    -- Health and Beauty Considerations
    allergies TEXT[],
    skin_conditions TEXT[],
    medical_conditions TEXT[],
    contraindications TEXT[],
    preferred_products TEXT[],
    avoided_ingredients TEXT[],

    -- Beauty/Fitness Specific
    skin_type TEXT CHECK (skin_type IN ('normal', 'dry', 'oily', 'combination', 'sensitive')),
    beauty_goals TEXT[],
    fitness_goals TEXT[],
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),

    -- Luxury Service Preferences
    preferred_service_duration INTEGER, -- minutes
    preferred_service_intensity TEXT CHECK (preferred_service_intensity IN ('gentle', 'moderate', 'intense')),
    room_temperature_preference INTEGER, -- Celsius
    music_preference TEXT,
    scent_preference TEXT,
    beverage_preference TEXT,

    -- VIP Status and Special Treatment
    is_vip BOOLEAN DEFAULT false,
    vip_notes TEXT,
    special_occasions JSONB DEFAULT '{}', -- {birthday: "2024-05-15", anniversary: "2024-08-20"}
    personal_interests TEXT[],
    conversation_topics TEXT[],

    -- Payment Preferences
    preferred_payment_method TEXT,
    billing_address JSONB,
    invoice_preferences JSONB DEFAULT '{}',

    -- Relationship Management
    relationship_strength relationship_strength DEFAULT 'moderate',
    relationship_score INTEGER CHECK (relationship_score >= 0 AND relationship_score <= 100),
    preferred_staff UUID REFERENCES profiles(id),
    staff_preferences JSONB DEFAULT '{}',

    -- Client Metadata
    client_notes TEXT,
    internal_tags TEXT[],
    external_references JSONB DEFAULT '{}', -- Links to external systems
    crm_metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id)
);

-- Client Photo Gallery for Visual History
CREATE TABLE IF NOT EXISTS crm_client_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Image Details
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    description TEXT,

    -- Progress Tracking
    progress_category TEXT, -- 'before', 'after', 'during', 'milestone'
    progress_notes TEXT,
    treatment_date DATE,
    treatment_number INTEGER, -- For tracking series of treatments

    -- Visual Analysis
    skin_analysis JSONB DEFAULT '{}',
    progress_metrics JSONB DEFAULT '{}',
    improvement_areas TEXT[],

    -- Metadata
    taken_by_staff UUID REFERENCES profiles(id),
    consent_granted BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,

    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Service History with Analytics
CREATE TABLE IF NOT EXISTS crm_service_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,

    -- Service Details
    service_date DATE NOT NULL,
    service_duration INTEGER, -- Actual duration in minutes
    service_status TEXT CHECK (service_status IN ('completed', 'cancelled', 'no_show', 'rescheduled')),

    -- Staff and Performance
    primary_staff UUID REFERENCES profiles(id),
    assisting_staff UUID[],
    staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
    staff_feedback TEXT,

    -- Service Outcomes
    treatment_results JSONB DEFAULT '{}',
    client_reaction TEXT,
    immediate_satisfaction INTEGER CHECK (immediate_satisfaction >= 1 AND immediate_satisfaction <= 10),

    -- Product Usage
    products_used JSONB DEFAULT '{}',
    products_recommended TEXT[],
    products_purchased TEXT[],

    -- Progress Tracking
    progress_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    next_recommended_date DATE,

    -- Financial Details
    actual_price DECIMAL(10,2),
    discount_applied DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    tip_amount DECIMAL(10,2) DEFAULT 0,

    -- No-show and Cancellation Tracking
    is_no_show BOOLEAN DEFAULT false,
    is_last_minute_cancellation BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    cancellation_hours_notice INTEGER,

    -- Client Feedback
    post_treatment_feedback TEXT,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    would_recommend BOOLEAN,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-Tier Loyalty Program System
CREATE TABLE IF NOT EXISTS crm_loyalty_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Program Configuration
    is_active BOOLEAN DEFAULT true,
    points_to_currency_rate DECIMAL(10,4) DEFAULT 0.01, -- Points to PLN conversion
    minimum_redemption_points INTEGER DEFAULT 100,
    points_expiry_months INTEGER DEFAULT 12,

    -- Tier Configuration
    tier_requirements JSONB DEFAULT '{}', -- {bronze: 0, silver: 500, gold: 1500, platinum: 3000}
    tier_benefits JSONB DEFAULT '{}', -- Benefits per tier

    -- Earning Rules
    booking_points_multiplier DECIMAL(3,2) DEFAULT 1.0,
    review_points INTEGER DEFAULT 10,
    referral_points INTEGER DEFAULT 100,
    birthday_points INTEGER DEFAULT 50,

    -- Anniversary and Milestone Rewards
    anniversary_points INTEGER DEFAULT 25,
    milestone_rewards JSONB DEFAULT '{}', -- {10_visits: 100, 25_visits: 250}

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Loyalty Status
CREATE TABLE IF NOT EXISTS crm_client_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES crm_loyalty_program(id),

    -- Current Status
    current_tier loyalty_tier DEFAULT 'bronze',
    current_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier_progress_points INTEGER DEFAULT 0,

    -- Tier History
    tier_upgrade_date DATE,
    current_tier_start_date DATE,
    previous_tier loyalty_tier,

    -- Analytics
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    days_since_last_booking INTEGER,

    -- Expiration Tracking
    points_expiring_next_month INTEGER DEFAULT 0,
    next_points_expiry DATE,

    -- Special Status
    is_anniversary_month BOOLEAN DEFAULT false,
    is_birthday_month BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(client_id, program_id)
);

-- Loyalty Points Transactions
CREATE TABLE IF NOT EXISTS crm_loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_loyalty_id UUID REFERENCES crm_client_loyalty(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Transaction Details
    transaction_type TEXT CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'bonus')),
    points_change INTEGER NOT NULL, -- Positive for earning, negative for redemption
    points_balance_after INTEGER NOT NULL,

    -- Transaction Context
    reason TEXT NOT NULL,
    reference_type TEXT, -- 'booking', 'review', 'referral', 'birthday', 'manual'
    reference_id UUID,
    description TEXT,

    -- Expiration
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT false,

    -- Admin
    created_by UUID REFERENCES profiles(id),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Loyalty Rewards Catalog
CREATE TABLE IF NOT EXISTS crm_loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES crm_loyalty_program(id) ON DELETE CASCADE,

    -- Reward Details
    name TEXT NOT NULL,
    description TEXT,
    reward_type TEXT CHECK (reward_type IN ('discount', 'free_service', 'product', 'upgrade', 'experience')),

    -- Cost and Value
    points_cost INTEGER NOT NULL,
    monetary_value DECIMAL(10,2),

    -- Eligibility
    minimum_tier loyalty_tier DEFAULT 'bronze',
    required_bookings INTEGER DEFAULT 0,
    max_redemptions_per_client INTEGER,

    -- Availability
    is_active BOOLEAN DEFAULT true,
    available_from DATE,
    available_until DATE,
    total_quantity INTEGER,
    remaining_quantity INTEGER,

    -- Configuration
    discount_percentage DECIMAL(5,2), -- For discount rewards
    discount_amount DECIMAL(10,2), -- For fixed amount discounts
    service_id UUID REFERENCES services(id), -- For free service rewards

    terms_conditions TEXT,
    image_url TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS crm_reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_loyalty_id UUID REFERENCES crm_client_loyalty(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES crm_loyalty_rewards(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Redemption Details
    points_used INTEGER NOT NULL,
    reward_value DECIMAL(10,2),

    -- Status
    status TEXT CHECK (status IN ('pending', 'confirmed', 'used', 'expired', 'cancelled')) DEFAULT 'pending',
    confirmed_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Usage Details
    usage_context JSONB DEFAULT '{}',
    staff_notes TEXT,
    client_feedback TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Segmentation System
CREATE TABLE IF NOT EXISTS crm_client_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Segment Configuration
    segment_type client_segment NOT NULL,
    segment_criteria JSONB DEFAULT '{}', -- Dynamic segmentation rules
    is_active BOOLEAN DEFAULT true,

    -- Segment Analytics
    client_count INTEGER DEFAULT 0,
    average_value DECIMAL(10,2) DEFAULT 0,
    retention_rate DECIMAL(5,4) DEFAULT 0,

    -- Marketing Configuration
    preferred_channels TEXT[],
    messaging_tone TEXT,
    campaign_frequency TEXT DEFAULT 'monthly',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Segment Memberships
CREATE TABLE IF NOT EXISTS crm_client_segment_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES crm_client_segments(id) ON DELETE CASCADE,

    -- Membership Details
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    assignment_reason TEXT,
    manual_assignment BOOLEAN DEFAULT false,

    -- Historical Tracking
    assigned_at TIMESTAMPTZ DEFAULT now(),
    reclassified_at TIMESTAMPTZ,
    previous_segment_id UUID REFERENCES crm_client_segments(id),

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(client_id, segment_id)
);

-- Communication Templates and History
CREATE TABLE IF NOT EXISTS crm_communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Template Configuration
    channel communication_channel NOT NULL,
    type communication_type NOT NULL,
    language TEXT DEFAULT 'pl',

    -- Content
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Available template variables

    -- Personalization
    personalization_rules JSONB DEFAULT '{}',
    dynamic_content JSONB DEFAULT '{}',

    -- Delivery Options
    send_immediately BOOLEAN DEFAULT false,
    send_time_preference TEXT, -- 'morning', 'afternoon', 'evening'
    days_to_send_before INTEGER DEFAULT 0,

    -- Targeting
    segment_ids UUID[],
    tier_requirements JSONB DEFAULT '{}',

    -- Performance
    usage_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    approval_status TEXT DEFAULT 'approved',

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Communication History
CREATE TABLE IF NOT EXISTS crm_communication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES crm_communication_templates(id) ON DELETE SET NULL,

    -- Communication Details
    channel communication_channel NOT NULL,
    type communication_type NOT NULL,
    direction TEXT CHECK (direction IN ('outbound', 'inbound')) DEFAULT 'outbound',

    -- Content
    subject TEXT,
    content TEXT NOT NULL,
    personalization_data JSONB DEFAULT '{}',

    -- Delivery Information
    recipient_address TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    -- Engagement
    clicked_links TEXT[],
    replied_at TIMESTAMPTZ,
    reply_content TEXT,

    -- Performance
    delivery_status TEXT DEFAULT 'pending',
    error_message TEXT,

    -- Context
    campaign_id TEXT,
    automation_trigger TEXT,
    booking_id UUID REFERENCES bookings(id),

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Journey Mapping
CREATE TABLE IF NOT EXISTS crm_client_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,

    -- Journey Stage
    current_stage TEXT NOT NULL,
    stage_progress INTEGER CHECK (stage_progress >= 0 AND stage_progress <= 100),
    journey_name TEXT,

    -- Touchpoint Details
    touchpoint_type TEXT NOT NULL,
    touchpoint_channel TEXT NOT NULL,
    touchpoint_description TEXT,

    -- Interaction Data
    interaction_data JSONB DEFAULT '{}',
    satisfaction_impact INTEGER CHECK (satisfaction_impact >= -5 AND satisfaction_impact <= 5),
    conversion_probability DECIMAL(3,2) CHECK (conversion_probability >= 0 AND conversion_probability <= 1),

    -- Timing
    occurred_at TIMESTAMPTZ DEFAULT now(),
    session_duration_seconds INTEGER,

    -- Next Best Action
    next_best_action TEXT,
    next_action_priority TEXT CHECK (next_action_priority IN ('high', 'medium', 'low')),
    next_action_timing TIMESTAMPTZ,

    -- Staff Assignment
    assigned_staff UUID REFERENCES profiles(id),
    action_required BOOLEAN DEFAULT false,
    action_completed BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Advanced Recommendations Engine
CREATE TABLE IF NOT EXISTS crm_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,

    -- Recommendation Details
    recommendation_type TEXT CHECK (recommendation_type IN ('service', 'product', 'treatment_plan', 'upgrade', 'maintenance')),
    title TEXT NOT NULL,
    description TEXT,

    -- Target Items
    service_id UUID REFERENCES services(id),
    product_ids TEXT[],
    treatment_plan JSONB DEFAULT '{}',

    -- Recommendation Logic
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 10),

    -- Personalization Context
    recommendation_reason TEXT NOT NULL,
    personalization_factors JSONB DEFAULT '{}',
    behavioral_triggers TEXT[],

    -- Business Rules
    seasonal_relevance BOOLEAN DEFAULT false,
    urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    booking_window_days INTEGER,

    -- Presentation
    presentation_style TEXT,
    discount_offer JSONB DEFAULT '{}',
    special_terms TEXT,

    -- Tracking
    shown_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    converted_booking_id UUID REFERENCES bookings(id),

    -- Feedback
    client_feedback TEXT,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Analytics and Metrics
CREATE TABLE IF NOT EXISTS crm_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,

    -- Metrics Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

    -- Client Value Metrics
    period_revenue DECIMAL(10,2) DEFAULT 0,
    period_bookings INTEGER DEFAULT 0,
    period_products_purchased INTEGER DEFAULT 0,
    period_referrals INTEGER DEFAULT 0,

    -- Engagement Metrics
    communication_sent INTEGER DEFAULT 0,
    communication_opened INTEGER DEFAULT 0,
    communication_clicked INTEGER DEFAULT 0,
    website_visits INTEGER DEFAULT 0,
    social_media_engagement INTEGER DEFAULT 0,

    -- Satisfaction Metrics
    satisfaction_score DECIMAL(3,2),
    net_promoter_score INTEGER CHECK (net_promoter_score >= -100 AND net_promoter_score <= 100),
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),

    -- Loyalty Metrics
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    tier_progress INTEGER DEFAULT 0,
    rewards_used INTEGER DEFAULT 0,

    -- Predictive Metrics
    churn_probability DECIMAL(5,4),
    lifetime_value_prediction DECIMAL(10,2),
    next_booking_probability DECIMAL(3,2),

    -- calculated analytics
    calculated_at TIMESTAMPTZ DEFAULT now(),

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(client_id, period_start, period_end, period_type)
);

-- Automated Actions and Workflows
CREATE TABLE IF NOT EXISTS crm_automated_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Trigger Configuration
    trigger_type TEXT NOT NULL, -- 'client_event', 'schedule', 'metric_threshold'
    trigger_conditions JSONB DEFAULT '{}',

    -- Action Configuration
    action_type TEXT NOT NULL, -- 'send_communication', 'update_segment', 'create_task', 'update_loyalty'
    action_parameters JSONB DEFAULT '{}',

    -- Targeting
    target_segments TEXT[],
    target_tiers loyalty_tier[],
    exclusion_criteria JSONB DEFAULT '{}',

    -- Scheduling
    is_active BOOLEAN DEFAULT true,
    run_schedule TEXT, -- Cron expression
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    -- Performance
    total_runs INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0,
    error_count INTEGER DEFAULT 0,

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Action Execution Log
CREATE TABLE IF NOT EXISTS crm_action_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES crm_automated_actions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES crm_client_profiles(id) ON DELETE CASCADE,

    -- Execution Details
    triggered_at TIMESTAMPTZ DEFAULT now(),
    trigger_data JSONB DEFAULT '{}',

    -- Status
    status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results
    action_results JSONB DEFAULT '{}',
    affected_records INTEGER DEFAULT 0,

    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_client_profiles_user_id ON crm_client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_profiles_loyalty_tier ON crm_client_profiles(relationship_strength);
CREATE INDEX IF NOT EXISTS idx_crm_client_profiles_is_vip ON crm_client_profiles(is_vip);
CREATE INDEX IF NOT EXISTS idx_crm_client_gallery_client_id ON crm_client_gallery(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_gallery_service_id ON crm_client_gallery(service_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_gallery_progress_category ON crm_client_gallery(progress_category);
CREATE INDEX IF NOT EXISTS idx_crm_service_history_client_id ON crm_service_history(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_service_history_service_date ON crm_service_history(service_date);
CREATE INDEX IF NOT EXISTS idx_crm_service_history_service_status ON crm_service_history(service_status);
CREATE INDEX IF NOT EXISTS idx_crm_service_history_primary_staff ON crm_service_history(primary_staff);
CREATE INDEX IF NOT EXISTS idx_crm_client_loyalty_client_id ON crm_client_loyalty(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_loyalty_current_tier ON crm_client_loyalty(current_tier);
CREATE INDEX IF NOT EXISTS idx_crm_client_loyalty_current_points ON crm_client_loyalty(current_points);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_transactions_client_loyalty_id ON crm_loyalty_transactions(client_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_transactions_created_at ON crm_loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_transactions_transaction_type ON crm_loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_rewards_program_id ON crm_loyalty_rewards(program_id);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_rewards_is_active ON crm_loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_reward_redemptions_client_loyalty_id ON crm_reward_redemptions(client_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_crm_reward_redemptions_status ON crm_reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_crm_client_segments_segment_type ON crm_client_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_crm_client_segment_memberships_client_id ON crm_client_segment_memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_segment_memberships_segment_id ON crm_client_segment_memberships(segment_id);
CREATE INDEX IF NOT EXISTS idx_crm_communication_templates_channel ON crm_communication_templates(channel);
CREATE INDEX IF NOT EXISTS idx_crm_communication_templates_type ON crm_communication_templates(type);
CREATE INDEX IF NOT EXISTS idx_crm_communication_history_client_id ON crm_communication_history(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_communication_history_sent_at ON crm_communication_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_crm_communication_history_delivery_status ON crm_communication_history(delivery_status);
CREATE INDEX IF NOT EXISTS idx_crm_client_journey_client_id ON crm_client_journey(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_client_journey_occurred_at ON crm_client_journey(occurred_at);
CREATE INDEX IF NOT EXISTS idx_crm_client_journey_current_stage ON crm_client_journey(current_stage);
CREATE INDEX IF NOT EXISTS idx_crm_recommendations_client_id ON crm_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_recommendations_confidence_score ON crm_recommendations(confidence_score);
CREATE INDEX IF NOT EXISTS idx_crm_recommendations_priority_score ON crm_recommendations(priority_score);
CREATE INDEX IF NOT EXISTS idx_crm_recommendations_created_at ON crm_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_analytics_client_id ON crm_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_analytics_period_start ON crm_analytics(period_start);
CREATE INDEX IF NOT EXISTS idx_crm_analytics_period_type ON crm_analytics(period_type);
CREATE INDEX IF NOT EXISTS idx_crm_automated_actions_trigger_type ON crm_automated_actions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_crm_automated_actions_is_active ON crm_automated_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_action_executions_action_id ON crm_action_executions(action_id);
CREATE INDEX IF NOT EXISTS idx_crm_action_executions_client_id ON crm_action_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_action_executions_status ON crm_action_executions(status);

-- Enable Row Level Security
ALTER TABLE crm_client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_client_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_client_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_client_segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_communication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_client_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_action_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own client profile" ON crm_client_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all client profiles" ON crm_client_profiles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own gallery" ON crm_client_gallery
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM crm_client_profiles cp
        WHERE cp.id = client_id AND cp.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all gallery items" ON crm_client_gallery
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own service history" ON crm_service_history
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM crm_client_profiles cp
        WHERE cp.id = client_id AND cp.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all service history" ON crm_service_history
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own loyalty data" ON crm_client_loyalty
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM crm_client_profiles cp
        WHERE cp.id = client_id AND cp.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all loyalty data" ON crm_client_loyalty
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own loyalty transactions" ON crm_loyalty_transactions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM crm_client_loyalty cl
        JOIN crm_client_profiles cp ON cl.client_id = cp.id
        WHERE cl.id = client_loyalty_id AND cp.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all loyalty transactions" ON crm_loyalty_transactions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at columns
CREATE TRIGGER update_crm_client_profiles_updated_at
    BEFORE UPDATE ON crm_client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_client_gallery_updated_at
    BEFORE UPDATE ON crm_client_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_service_history_updated_at
    BEFORE UPDATE ON crm_service_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_client_loyalty_updated_at
    BEFORE UPDATE ON crm_client_loyalty
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_loyalty_rewards_updated_at
    BEFORE UPDATE ON crm_loyalty_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_reward_redemptions_updated_at
    BEFORE UPDATE ON crm_reward_redemptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_client_segments_updated_at
    BEFORE UPDATE ON crm_client_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_communication_templates_updated_at
    BEFORE UPDATE ON crm_communication_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_communication_history_updated_at
    BEFORE UPDATE ON crm_communication_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_recommendations_updated_at
    BEFORE UPDATE ON crm_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_analytics_updated_at
    BEFORE UPDATE ON crm_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_automated_actions_updated_at
    BEFORE UPDATE ON crm_automated_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for CRM operations

-- Function to create/update client profile
CREATE OR REPLACE FUNCTION create_or_update_client_profile(
    p_user_id UUID,
    p_preferred_name TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_preferred_language TEXT DEFAULT 'pl',
    p_communication_preferences TEXT[] DEFAULT NULL,
    p_skin_type TEXT DEFAULT NULL,
    p_beauty_goals TEXT[] DEFAULT NULL,
    p_fitness_goals TEXT[] DEFAULT NULL,
    p_allergies TEXT[] DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Try to update existing profile
    UPDATE crm_client_profiles
    SET
        preferred_name = COALESCE(p_preferred_name, preferred_name),
        birth_date = COALESCE(p_birth_date, birth_date),
        preferred_language = COALESCE(p_preferred_language, preferred_language),
        communication_preferences = COALESCE(p_communication_preferences, communication_preferences),
        skin_type = COALESCE(p_skin_type, skin_type),
        beauty_goals = COALESCE(p_beauty_goals, beauty_goals),
        fitness_goals = COALESCE(p_fitness_goals, fitness_goals),
        allergies = COALESCE(p_allergies, allergies),
        client_notes = COALESCE(p_notes, client_notes),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING id INTO v_client_id;

    -- If no existing profile, create new one
    IF v_client_id IS NULL THEN
        INSERT INTO crm_client_profiles (
            user_id, preferred_name, birth_date, preferred_language,
            communication_preferences, skin_type, beauty_goals, fitness_goals, allergies, client_notes
        ) VALUES (
            p_user_id, p_preferred_name, p_birth_date, p_preferred_language,
            p_communication_preferences, p_skin_type, p_beauty_goals, p_fitness_goals, p_allergies, p_notes
        )
        RETURNING id INTO v_client_id;
    END IF;

    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and award loyalty points
CREATE OR REPLACE FUNCTION award_loyalty_points(
    p_client_id UUID,
    p_points INTEGER,
    p_reason TEXT,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_loyalty_id UUID;
    v_new_balance INTEGER;
    v_tier loyalty_tier;
    v_points_needed INTEGER;
BEGIN
    -- Get or create client loyalty record
    SELECT id INTO v_loyalty_id
    FROM crm_client_loyalty
    WHERE client_id = p_client_id;

    IF v_loyalty_id IS NULL THEN
        -- Create new loyalty record
        INSERT INTO crm_client_loyalty (client_id, current_points, lifetime_points)
        VALUES (p_client_id, p_points, p_points)
        RETURNING id INTO v_loyalty_id;

        v_new_balance := p_points;
    ELSE
        -- Update existing loyalty record
        UPDATE crm_client_loyalty
        SET
            current_points = current_points + p_points,
            lifetime_points = lifetime_points + p_points,
            updated_at = NOW()
        WHERE id = v_loyalty_id
        RETURNING current_points INTO v_new_balance;
    END IF;

    -- Record the transaction
    INSERT INTO crm_loyalty_transactions (
        client_loyalty_id, booking_id, transaction_type, points_change,
        points_balance_after, reason, reference_type, reference_id
    ) VALUES (
        v_loyalty_id, p_booking_id, 'earned', p_points,
        v_new_balance, p_reason, p_reference_type, p_reference_id
    );

    -- Check for tier upgrade
    SELECT current_tier INTO v_tier FROM crm_client_loyalty WHERE id = v_loyalty_id;

    -- Simple tier progression (bronze -> silver -> gold -> platinum)
    -- These thresholds should be configurable from the loyalty program
    IF v_tier = 'bronze' AND v_new_balance >= 500 THEN
        UPDATE crm_client_loyalty
        SET
            current_tier = 'silver',
            tier_upgrade_date = CURRENT_DATE,
            current_tier_start_date = CURRENT_DATE,
            previous_tier = 'bronze'
        WHERE id = v_loyalty_id;
    ELSIF v_tier = 'silver' AND v_new_balance >= 1500 THEN
        UPDATE crm_client_loyalty
        SET
            current_tier = 'gold',
            tier_upgrade_date = CURRENT_DATE,
            current_tier_start_date = CURRENT_DATE,
            previous_tier = 'silver'
        WHERE id = v_loyalty_id;
    ELSIF v_tier = 'gold' AND v_new_balance >= 3000 THEN
        UPDATE crm_client_loyalty
        SET
            current_tier = 'platinum',
            tier_upgrade_date = CURRENT_DATE,
            current_tier_start_date = CURRENT_DATE,
            previous_tier = 'gold'
        WHERE id = v_loyalty_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate service recommendations
CREATE OR REPLACE FUNCTION generate_service_recommendations(
    p_client_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    recommendation_id UUID,
    service_id UUID,
    service_title TEXT,
    confidence_score DECIMAL,
    reason TEXT,
    priority_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH client_profile AS (
        SELECT
            cp.*,
            cl.current_tier,
            csh.last_service_date,
            csh.favorite_service_types,
            csh.average_rating_given
        FROM crm_client_profiles cp
        LEFT JOIN crm_client_loyalty cl ON cp.id = cl.client_id
        LEFT JOIN (
            SELECT
                client_id,
                MAX(service_date) as last_service_date,
                array_agg(DISTINCT s.service_type) as favorite_service_types,
                AVG(satisfaction_score) as average_rating_given
            FROM crm_service_history csh
            JOIN services s ON csh.service_id = s.id
            WHERE csh.service_status = 'completed'
            GROUP BY client_id
        ) csh ON cp.id = csh.client_id
        WHERE cp.id = p_client_id
    ),
    service_candidates AS (
        SELECT
            s.id,
            s.title,
            s.service_type,
            s.price,
            -- Calculate confidence score based on multiple factors
            CASE
                WHEN s.service_type = ANY(cp.favorite_service_types) THEN 0.8
                WHEN s.service_type != cp.service_type THEN 0.3
                ELSE 0.6
            END *
            CASE
                WHEN s.price <= COALESCE(csh.average_booking_value, s.price * 1.5) THEN 1.2
                WHEN s.price > COALESCE(csh.average_booking_value, s.price * 2) THEN 0.7
                ELSE 1.0
            END *
            CASE
                WHEN csh.last_service_date IS NULL THEN 1.5 -- New client bonus
                WHEN csh.last_service_date < CURRENT_DATE - INTERVAL '90 days' THEN 1.3 -- Inactive client bonus
                ELSE 1.0
            END as confidence_score,
            -- Generate personalized reason
            CASE
                WHEN s.service_type = ANY(cp.favorite_service_types)
                THEN 'Based on your previous preferences for ' || s.service_type || ' services'
                WHEN s.service_type != cp.service_type
                THEN 'Try something new! This ' || s.service_type || ' service complements your usual routine'
                ELSE 'Popular service that matches your profile'
            END as reason,
            -- Calculate priority based on multiple factors
            CASE
                WHEN csh.last_service_date IS NULL THEN 10
                WHEN csh.last_service_date < CURRENT_DATE - INTERVAL '90 days' THEN 9
                WHEN s.service_type = ANY(cp.favorite_service_types) THEN 8
                ELSE 6
            END as priority_score
        FROM client_profile cp
        CROSS JOIN services s
        LEFT JOIN (
            SELECT
                client_id,
                AVG(b.total_amount) as average_booking_value
            FROM bookings b
            WHERE b.status = 'completed'
            GROUP BY client_id
        ) csh ON cp.id = csh.client_id
        WHERE s.is_active = true
        AND s.id NOT IN (
            SELECT service_id FROM crm_service_history
            WHERE client_id = p_client_id
            AND service_date > CURRENT_DATE - INTERVAL '30 days'
            AND service_status = 'completed'
        )
    )
    SELECT
        gen_random_uuid() as recommendation_id,
        sc.id as service_id,
        sc.title as service_title,
        LEAST(0.95, sc.confidence_score) as confidence_score,
        sc.reason,
        sc.priority_score
    FROM service_candidates sc
    ORDER BY sc.confidence_score DESC, sc.priority_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update client analytics
CREATE OR REPLACE FUNCTION update_client_analytics(
    p_client_id UUID,
    p_period_type TEXT DEFAULT 'monthly'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO crm_analytics (
        client_id, period_start, period_end, period_type,
        period_revenue, period_bookings, satisfaction_score, churn_probability
    )
    SELECT
        p_client_id,
        CASE p_period_type
            WHEN 'daily' THEN CURRENT_DATE
            WHEN 'weekly' THEN date_trunc('week', CURRENT_DATE)::date
            WHEN 'monthly' THEN date_trunc('month', CURRENT_DATE)::date
            WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE)::date
            WHEN 'yearly' THEN date_trunc('year', CURRENT_DATE)::date
        END,
        CASE p_period_type
            WHEN 'daily' THEN CURRENT_DATE
            WHEN 'weekly' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date
            WHEN 'monthly' THEN (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
            WHEN 'quarterly' THEN (date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::date
            WHEN 'yearly' THEN (date_trunc('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::date
        END,
        p_period_type,
        COALESCE(SUM(b.total_amount), 0) as period_revenue,
        COUNT(b.id) as period_bookings,
        AVG(csh.satisfaction_score) as satisfaction_score,
        -- Simple churn probability calculation
        CASE
            WHEN COUNT(b.id) = 0 THEN 0.8
            WHEN MAX(b.created_at) < CURRENT_DATE - INTERVAL '90 days' THEN 0.6
            WHEN MAX(b.created_at) < CURRENT_DATE - INTERVAL '60 days' THEN 0.3
            WHEN MAX(b.created_at) < CURRENT_DATE - INTERVAL '30 days' THEN 0.1
            ELSE 0.05
        END as churn_probability
    FROM crm_client_profiles cp
    LEFT JOIN bookings b ON cp.user_id = b.user_id
        AND b.created_at >= CASE p_period_type
            WHEN 'daily' THEN CURRENT_DATE
            WHEN 'weekly' THEN date_trunc('week', CURRENT_DATE)
            WHEN 'monthly' THEN date_trunc('month', CURRENT_DATE)
            WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE)
            WHEN 'yearly' THEN date_trunc('year', CURRENT_DATE)
        END
        AND b.created_at < CASE p_period_type
            WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
            WHEN 'weekly' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
            WHEN 'monthly' THEN date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months'
            WHEN 'yearly' THEN date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'
        END
        AND b.status = 'completed'
    LEFT JOIN crm_service_history csh ON cp.id = csh.client_id
        AND csh.service_date >= CASE p_period_type
            WHEN 'daily' THEN CURRENT_DATE
            WHEN 'weekly' THEN date_trunc('week', CURRENT_DATE)::date
            WHEN 'monthly' THEN date_trunc('month', CURRENT_DATE)::date
            WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE)::date
            WHEN 'yearly' THEN date_trunc('year', CURRENT_DATE)::date
        END
    WHERE cp.id = p_client_id
    GROUP BY cp.id
    ON CONFLICT (client_id, period_start, period_end, period_type)
    DO UPDATE SET
        period_revenue = EXCLUDED.period_revenue,
        period_bookings = EXCLUDED.period_bookings,
        satisfaction_score = EXCLUDED.satisfaction_score,
        churn_probability = EXCLUDED.churn_probability,
        calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically award loyalty points for completed bookings
CREATE OR REPLACE FUNCTION award_booking_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
    v_points INTEGER;
BEGIN
    -- Get client profile for the booking user
    SELECT id INTO v_client_id
    FROM crm_client_profiles
    WHERE user_id = NEW.user_id;

    -- Create client profile if it doesn't exist
    IF v_client_id IS NULL THEN
        v_client_id := create_or_update_client_profile(NEW.user_id);
    END IF;

    -- Calculate points based on booking value (1 point per PLN spent)
    v_points := ROUND(NEW.total_amount);

    -- Award bonus points based on booking value
    IF NEW.total_amount >= 500 THEN
        v_points := v_points + 50; -- Bonus for high-value bookings
    ELSIF NEW.total_amount >= 200 THEN
        v_points := v_points + 25;
    END IF;

    -- Award the points
    PERFORM award_loyalty_points(
        v_client_id,
        v_points,
        'Points earned from booking: ' || NEW.id,
        'booking',
        NEW.id,
        NEW.id
    );

    -- Add service history record
    INSERT INTO crm_service_history (
        client_id, booking_id, service_id, service_date,
        service_duration, service_status, actual_price,
        satisfaction_score
    ) VALUES (
        v_client_id, NEW.id, NEW.service_id, NEW.booking_date,
        (SELECT duration_minutes FROM services WHERE id = NEW.service_id),
        CASE WHEN NEW.status = 'completed' THEN 'completed' ELSE NEW.status END,
        NEW.total_amount,
        (SELECT AVG(satisfaction_score) FROM crm_service_history WHERE client_id = v_client_id)
    );

    -- Update client analytics
    PERFORM update_client_analytics(v_client_id, 'monthly');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_loyalty_points_on_booking_completion
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION award_booking_loyalty_points();

-- Initialize default loyalty program
INSERT INTO crm_loyalty_program (
    name, description, points_to_currency_rate, tier_requirements, tier_benefits
) VALUES (
    'Mariia Hub Rewards',
    'Comprehensive loyalty program for our valued clients',
    0.01, -- 1 point = 0.01 PLN
    '{
        "bronze": {"name": "Bronze", "points": 0, "discount": 5, "birthday_bonus": 25},
        "silver": {"name": "Silver", "points": 500, "discount": 10, "birthday_bonus": 50, "early_access": true},
        "gold": {"name": "Gold", "points": 1500, "discount": 15, "birthday_bonus": 75, "early_access": true, "priority_booking": true},
        "platinum": {"name": "Platinum", "points": 3000, "discount": 20, "birthday_bonus": 100, "early_access": true, "priority_booking": true, "personal_concierge": true}
    }',
    '{
        "bronze": ["5% discount on services", "Birthday points bonus", "Monthly newsletter"],
        "silver": ["10% discount on services", "50 birthday points", "Early booking access", "Exclusive events"],
        "gold": ["15% discount on services", "75 birthday points", "Priority booking", "Exclusive events", "Free consultation"],
        "platinum": ["20% discount on services", "100 birthday points", "Priority booking", "Personal concierge", "Exclusive events", "Free monthly treatment"]
    }'
) ON CONFLICT (name) DO NOTHING;

-- Initialize default client segments
INSERT INTO crm_client_segments (name, description, segment_type, segment_criteria) VALUES
('VIP Clients', 'High-value clients with premium preferences', 'vip', '{"lifetime_value": 10000, "booking_frequency": 2, "average_rating": 4.5}'),
('Loyal Clients', 'Regular clients with consistent booking patterns', 'loyal', '{"booking_frequency": 1, "days_since_last_booking": 60, "total_bookings": 5}'),
('At Risk', 'Clients showing signs of decreased engagement', 'at_risk', '{"days_since_last_booking": 90, "booking_frequency_decline": 50}'),
('New Clients', 'Recently acquired clients needing onboarding', 'new', '{"days_since_first_booking": 30, "total_bookings": 1}'),
('Dormant Clients', 'Inactive clients who may need re-engagement', 'dormant', '{"days_since_last_booking": 180}'),
('Corporate Clients', 'Business clients with specific needs', 'corporate', '{"company": true, "billing_type": "invoice"}')
ON CONFLICT (name) DO NOTHING;

-- Initialize default communication templates
INSERT INTO crm_communication_templates (
    name, description, channel, type, subject_template, body_template, variables
) VALUES
('Welcome Email', 'Welcome message for new clients', 'email', 'marketing',
 'Welcome to Mariia Hub!',
 'Hello {{preferred_name}}, welcome to our luxury beauty and fitness platform! We''re excited to help you achieve your beauty and wellness goals.',
 '{"preferred_name": "Client preferred name"}'),

('Booking Reminder', 'Automated booking reminder', 'email', 'reminder',
 'Reminder: Your appointment tomorrow',
 'Hello {{preferred_name}}, this is a friendly reminder about your {{service_title}} appointment tomorrow at {{start_time}}. We look forward to seeing you!',
 '{"preferred_name": "Client name", "service_title": "Service name", "start_time": "Appointment time"}'),

('Birthday Greeting', 'Birthday message with special offer', 'email', 'marketing',
 'Happy Birthday {{preferred_name}}!',
 'Happy Birthday {{preferred_name}}! As a special gift, we''ve added {{birthday_points}} loyalty points to your account. Enjoy {{discount_percentage}} off your next treatment!',
 '{"preferred_name": "Client name", "birthday_points": "Points awarded", "discount_percentage": "Discount amount"}'),

('Loyalty Tier Upgrade', 'Notification when client reaches new tier', 'email', 'marketing',
 'Congratulations! You''ve reached {{new_tier}} status!',
 'Congratulations {{preferred_name}}! You''ve reached {{new_tier}} status in our loyalty program. Enjoy {{new_benefits}} as our way of saying thank you for your loyalty.',
 '{"preferred_name": "Client name", "new_tier": "New tier name", "new_benefits": "List of benefits"}'),

('Re-engagement Campaign', 'Targeted message for dormant clients', 'email', 'marketing',
 'We miss you, {{preferred_name}}!',
 'Hello {{preferred_name}}, it''s been a while since your last visit. We''d love to see you again! Here''s a special {{discount_percentage}} discount to welcome you back.',
 '{"preferred_name": "Client name", "discount_percentage": "Discount amount"}')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON crm_client_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON crm_client_gallery TO authenticated;
GRANT SELECT ON crm_service_history TO authenticated;
GRANT SELECT ON crm_client_loyalty TO authenticated;
GRANT SELECT ON crm_loyalty_transactions TO authenticated;
GRANT SELECT ON crm_loyalty_rewards TO authenticated;
GRANT SELECT ON crm_reward_redemptions TO authenticated;
GRANT SELECT ON crm_client_segments TO authenticated;
GRANT SELECT ON crm_communication_templates TO authenticated;
GRANT SELECT, INSERT ON crm_communication_history TO authenticated;
GRANT SELECT ON crm_client_journey TO authenticated;
GRANT SELECT ON crm_recommendations TO authenticated;
GRANT SELECT ON crm_analytics TO authenticated;

-- Grant admin permissions
GRANT ALL ON crm_client_profiles TO authenticated;
GRANT ALL ON crm_client_gallery TO authenticated;
GRANT ALL ON crm_service_history TO authenticated;
GRANT ALL ON crm_client_loyalty TO authenticated;
GRANT ALL ON crm_loyalty_transactions TO authenticated;
GRANT ALL ON crm_loyalty_rewards TO authenticated;
GRANT ALL ON crm_reward_redemptions TO authenticated;
GRANT ALL ON crm_client_segments TO authenticated;
GRANT ALL ON crm_client_segment_memberships TO authenticated;
GRANT ALL ON crm_communication_templates TO authenticated;
GRANT ALL ON crm_communication_history TO authenticated;
GRANT ALL ON crm_client_journey TO authenticated;
GRANT ALL ON crm_recommendations TO authenticated;
GRANT ALL ON crm_analytics TO authenticated;
GRANT ALL ON crm_automated_actions TO authenticated;
GRANT ALL ON crm_action_executions TO authenticated;

COMMIT;