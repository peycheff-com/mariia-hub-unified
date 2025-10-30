-- Marketing System Migration
-- Complete social media and marketing integration system for Warsaw beauty/fitness market

-- ============================================
-- 1. SOCIAL MEDIA MANAGEMENT
-- ============================================

-- Enhanced social posts table with automation capabilities
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    content TEXT NOT NULL,
    platform social_platform NOT NULL,
    post_type post_type DEFAULT 'regular',
    post_url TEXT,
    image_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    status post_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    priority post_priority DEFAULT 'normal',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    campaign_id UUID REFERENCES marketing_campaigns(id),
    content_template_id UUID REFERENCES content_templates(id),
    auto_generated BOOLEAN DEFAULT false,
    engagement_metrics JSONB DEFAULT '{}',
    platform_specific_data JSONB DEFAULT '{}'
);

-- Content templates for automated post generation
CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type content_template_type NOT NULL,
    platform social_platform NOT NULL,
    content_template TEXT NOT NULL,
    variable_mappings JSONB DEFAULT '{}',
    hashtag_sets TEXT[] DEFAULT '{}',
    mention_sets TEXT[] DEFAULT '{}',
    image_prompt_templates TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Social media calendar for content planning
CREATE TABLE IF NOT EXISTS social_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(100),
    target_audience VARCHAR(100),
    platform social_platform NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    post_frequency post_frequency DEFAULT 'once',
    recurring_pattern JSONB DEFAULT '{}',
    status calendar_status DEFAULT 'planned',
    campaign_id UUID REFERENCES marketing_campaigns(id),
    content_template_id UUID REFERENCES content_templates(id),
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- 2. INFLUENCER COLLABORATION SYSTEM
-- ============================================

-- Influencer database for Warsaw market
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    primary_platform social_platform,
    secondary_platforms social_platform[] DEFAULT '{}',
    follower_count BIGINT,
    engagement_rate DECIMAL(5,2),
    niche VARCHAR(100),
    location VARCHAR(100),
    age_range VARCHAR(20),
    audience_demographics JSONB DEFAULT '{}',
    content_style VARCHAR(100),
    pricing_rates JSONB DEFAULT '{}',
    contact_preferences JSONB DEFAULT '{}',
    status influencer_status DEFAULT 'prospect',
    notes TEXT,
    social_metrics JSONB DEFAULT '{}',
    last_contact_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES profiles(id)
);

-- Influencer campaigns and collaborations
CREATE TABLE IF NOT EXISTS influencer_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES marketing_campaigns(id),
    collaboration_type collaboration_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    brief TEXT,
    requirements TEXT,
    deliverables JSONB DEFAULT '{}',
    content_guidelines TEXT,
    posting_schedule JSONB DEFAULT '{}',
    compensation_type compensation_type NOT NULL,
    compensation_amount DECIMAL(10,2),
    status collaboration_status DEFAULT 'negotiation',
    approval_status content_approval_status DEFAULT 'pending',
    contract_signed BOOLEAN DEFAULT false,
    contract_url TEXT,
    start_date DATE,
    end_date DATE,
    actual_deliverables JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    managed_by UUID REFERENCES profiles(id)
);

-- Content approval workflow
CREATE TABLE IF NOT EXISTS content_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID NOT NULL REFERENCES influencer_collaborations(id) ON DELETE CASCADE,
    content_url TEXT NOT NULL,
    content_type content_type NOT NULL,
    caption TEXT,
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    scheduled_post_date DATE,
    status approval_status DEFAULT 'pending_approval',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    feedback TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES profiles(id),
    revision_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER-GENERATED CONTENT & SOCIAL PROOF
-- ============================================

-- Client testimonials with rich media
CREATE TABLE IF NOT EXISTS client_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    service_id UUID REFERENCES services(id),
    booking_id UUID REFERENCES bookings(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    testimonial TEXT,
    video_url TEXT,
    before_photo_url TEXT,
    after_photo_url TEXT,
    additional_photos TEXT[] DEFAULT '{}',
    consent_marketing BOOLEAN DEFAULT false,
    consent_social_media BOOLEAN DEFAULT false,
    consent_website BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    display_name VARCHAR(255),
    client_age INTEGER,
    client_location VARCHAR(100),
    treatment_date DATE,
    tags TEXT[] DEFAULT '{}',
    status testimonial_status DEFAULT 'pending',
    featured_priority INTEGER DEFAULT 0,
    social_media_shares JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id)
);

-- Before/after gallery with consent management
CREATE TABLE IF NOT EXISTS before_after_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    client_name VARCHAR(255),
    service_id UUID REFERENCES services(id) NOT NULL,
    treatment_date DATE NOT NULL,
    before_photos TEXT[] NOT NULL,
    after_photos TEXT[] NOT NULL,
    description TEXT,
    treatment_details TEXT,
    recovery_time VARCHAR(100),
    client_testimonial TEXT,
    consent_photography BOOLEAN DEFAULT false,
    consent_marketing BOOLEAN DEFAULT false,
    consent_social_media BOOLEAN DEFAULT false,
    consent_website BOOLEAN DEFAULT false,
    consent_expiry_date DATE,
    usage_restrictions TEXT,
    is_published BOOLEAN DEFAULT false,
    featured_priority INTEGER DEFAULT 0,
    gallery_category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    social_shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id)
);

-- Review aggregation from multiple platforms
CREATE TABLE IF NOT EXISTS platform_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    platform review_platform NOT NULL,
    author_name VARCHAR(255),
    author_username VARCHAR(100),
    rating DECIMAL(3,2),
    review_text TEXT,
    review_url TEXT,
    service_mentioned VARCHAR(255),
    date_published DATE,
    helpful_count INTEGER DEFAULT 0,
    response_text TEXT,
    response_date DATE,
    sentiment_score DECIMAL(3,2),
    is_featured BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. MARKETING CAMPAIGNS & ANALYTICS
-- ============================================

-- Marketing campaigns management
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type campaign_type NOT NULL,
    target_audience VARCHAR(100),
    objectives TEXT[],
    key_messages TEXT[],
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(10,2),
    actual_spend DECIMAL(10,2) DEFAULT 0,
    status campaign_status DEFAULT 'draft',
    priority campaign_priority DEFAULT 'medium',
    target_metrics JSONB DEFAULT '{}',
    actual_metrics JSONB DEFAULT '{}',
    content_themes TEXT[] DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    creative_assets TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    managed_by UUID REFERENCES profiles(id)
);

-- Campaign performance tracking
CREATE TABLE IF NOT EXISTS campaign_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    platform social_platform,
    date DATE NOT NULL,
    metrics JSONB DEFAULT '{}',
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    engagements BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    shares BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    saves BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing for content
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_variable test_variable NOT NULL,
    variants JSONB DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE,
    status test_status DEFAULT 'draft',
    confidence_level DECIMAL(5,2) DEFAULT 95.00,
    sample_size INTEGER DEFAULT 100,
    results JSONB DEFAULT '{}',
    winner_variant VARCHAR(100),
    significance DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- 5. EMAIL MARKETING SYSTEM
-- ============================================

-- Email campaigns and automation
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type email_campaign_type NOT NULL,
    subject_template TEXT,
    content_template TEXT,
    from_name VARCHAR(100),
    from_email VARCHAR(255),
    target_segment VARCHAR(100),
    trigger_conditions JSONB DEFAULT '{}',
    schedule_type email_schedule_type DEFAULT 'immediate',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    send_timezone VARCHAR(50) DEFAULT 'Europe/Warsaw',
    status email_status DEFAULT 'draft',
    priority email_priority DEFAULT 'medium',
    budget DECIMAL(10,2),
    target_metrics JSONB DEFAULT '{}',
    personalization_vars JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Email automation sequences
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type email_trigger_type NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    steps JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Email tracking and analytics
CREATE TABLE IF NOT EXISTS email_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id),
    sequence_id UUID REFERENCES email_sequences(id),
    recipient_id UUID REFERENCES profiles(id),
    email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    complained_at TIMESTAMP WITH TIME ZONE,
    device_type VARCHAR(50),
    client_type VARCHAR(50),
    browser VARCHAR(100),
    location VARCHAR(100),
    click_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    status email_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. COMPETITOR ANALYSIS
-- ============================================

-- Competitor tracking
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    social_profiles JSONB DEFAULT '{}',
    services_offered TEXT[] DEFAULT '{}',
    price_range VARCHAR(100),
    target_audience VARCHAR(100),
    unique_selling_points TEXT[] DEFAULT '{}',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Competitor social media analysis
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    date DATE NOT NULL,
    follower_count BIGINT,
    post_count INTEGER,
    engagement_rate DECIMAL(5,2),
    avg_likes DECIMAL(8,2),
    avg_comments DECIMAL(8,2),
    top_posts JSONB DEFAULT '{}',
    hashtag_analysis JSONB DEFAULT '{}',
    content_themes TEXT[] DEFAULT '{}',
    posting_frequency JSONB DEFAULT '{}',
    growth_rate DECIMAL(5,2),
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. INTEGRATION CONFIGURATION
-- ============================================

-- Social media platform integrations
CREATE TABLE IF NOT EXISTS social_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform social_platform NOT NULL,
    account_name VARCHAR(255),
    account_id VARCHAR(255),
    is_connected BOOLEAN DEFAULT false,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    api_credentials JSONB DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    webhook_secret TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status sync_status DEFAULT 'pending',
    error_message TEXT,
    is_active BOOLEAN DEFAULT true,
    auto_post_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Marketing automation settings
CREATE TABLE IF NOT EXISTS marketing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- ============================================
-- 8. CONTENT DISTRIBUTION
-- ============================================

-- Content repurposing queue
CREATE TABLE IF NOT EXISTS content_repurposing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content_id UUID NOT NULL,
    source_type content_type NOT NULL,
    source_platform social_platform,
    target_platforms social_platform[] DEFAULT '{}',
    repurposing_strategy repurposing_strategy NOT NULL,
    status repurposing_status DEFAULT 'pending',
    priority repurposing_priority DEFAULT 'medium',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    generated_content JSONB DEFAULT '{}',
    performance_comparison JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Content performance analytics
CREATE TABLE IF NOT EXISTS content_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type content_type NOT NULL,
    platform social_platform NOT NULL,
    date DATE NOT NULL,
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    engagements BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,
    shares BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    saves BIGINT DEFAULT 0,
    video_views BIGINT DEFAULT 0,
    video_completion_rate DECIMAL(5,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    sentiment_score DECIMAL(3,2) DEFAULT 0,
    viral_coefficient DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR OPTIMIZATION
-- ============================================

-- Social media indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_platform_status ON social_posts(platform, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_calendar_date ON social_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_social_calendar_platform ON social_calendar(platform);

-- Influencer indexes
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_platform ON influencers(primary_platform);
CREATE INDEX IF NOT EXISTS idx_influencer_collabs_status ON influencer_collaborations(status);
CREATE INDEX IF NOT EXISTS idx_influencer_collabs_influencer ON influencer_collaborations(influencer_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals(status);

-- Testimonial and UGC indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON client_testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON client_testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_before_after_published ON before_after_gallery(is_published);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_platform ON platform_reviews(platform);

-- Campaign and analytics indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign ON campaign_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON campaign_performance(date);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

-- Email marketing indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign ON email_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_status ON email_analytics(status);

-- Performance analytics indexes
CREATE INDEX IF NOT EXISTS idx_content_performance_content ON content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_platform ON content_performance(platform);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_repurposing ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for marketing team access
CREATE POLICY "Marketing team full access" ON social_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'marketing')
        )
    );

CREATE POLICY "Public access to featured content" ON social_posts
    FOR SELECT USING (is_featured = true AND status = 'published');

CREATE POLICY "Marketing team full access" ON client_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'marketing')
        )
    );

CREATE POLICY "Public access to verified testimonials" ON client_testimonials
    FOR SELECT USING (is_verified = true AND is_featured = true AND consent_marketing = true);

-- Similar policies would be created for all other tables...

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... more triggers for other tables

-- Function to calculate campaign ROI
CREATE OR REPLACE FUNCTION calculate_campaign_roi(campaign_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_spend DECIMAL(10,2);
    total_revenue DECIMAL(10,2);
    roi DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(actual_spend), 0) INTO total_spend
    FROM campaign_performance
    WHERE campaign_id = campaign_performance.campaign_id;

    SELECT COALESCE(SUM(revenue), 0) INTO total_revenue
    FROM content_performance
    WHERE content_id IN (
        SELECT id FROM social_posts WHERE campaign_id = campaign_id
    );

    IF total_spend > 0 THEN
        roi := ((total_revenue - total_spend) / total_spend) * 100;
    ELSE
        roi := 0;
    END IF;

    RETURN roi;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize posting times based on engagement
CREATE OR REPLACE FUNCTION get_optimal_posting_time(platform social_platform, audience_segment VARCHAR)
RETURNS TIME AS $$
DECLARE
    optimal_time TIME;
BEGIN
    -- Analyze historical engagement data to find optimal posting times
    SELECT scheduled_time INTO optimal_time
    FROM social_posts sp
    JOIN content_performance cp ON sp.id = cp.content_id
    WHERE sp.platform = platform
    AND sp.status = 'published'
    AND cp.engagement_rate = (
        SELECT MAX(cp2.engagement_rate)
        FROM social_posts sp2
        JOIN content_performance cp2 ON sp2.id = cp2.content_id
        WHERE sp2.platform = platform
        AND sp2.status = 'published'
    )
    ORDER BY RANDOM()
    LIMIT 1;

    IF optimal_time IS NULL THEN
        -- Default optimal times based on platform
        CASE platform
            WHEN 'instagram' THEN optimal_time := '19:00:00';
            WHEN 'facebook' THEN optimal_time := '18:30:00';
            WHEN 'linkedin' THEN optimal_time := '09:00:00';
            WHEN 'tiktok' THEN optimal_time := '20:00:00';
            ELSE optimal_time := '18:00:00';
        END CASE;
    END IF;

    RETURN optimal_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENUMS
-- ============================================

-- Social platforms
CREATE TYPE social_platform AS ENUM (
    'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok',
    'youtube', 'pinterest', 'blog', 'email'
);

-- Post types
CREATE TYPE post_type AS ENUM (
    'regular', 'story', 'reel', 'carousel', 'video', 'live', 'guide'
);

-- Post statuses
CREATE TYPE post_status AS ENUM (
    'draft', 'scheduled', 'published', 'failed', 'archived'
);

-- Post priorities
CREATE TYPE post_priority AS ENUM (
    'low', 'normal', 'high', 'urgent'
);

-- Content template types
CREATE TYPE content_template_type AS ENUM (
    'service_promotion', 'testimonial', 'educational', 'behind_scenes',
    'news', 'event', 'seasonal', 'user_generated', 'influencer'
);

-- Post frequencies
CREATE TYPE post_frequency AS ENUM (
    'once', 'daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly'
);

-- Calendar statuses
CREATE TYPE calendar_status AS ENUM (
    'planned', 'in_progress', 'completed', 'cancelled', 'postponed'
);

-- Influencer statuses
CREATE TYPE influencer_status AS ENUM (
    'prospect', 'contacted', 'negotiating', 'active', 'inactive', 'blacklisted'
);

-- Collaboration types
CREATE TYPE collaboration_type AS ENUM (
    'sponsored_post', 'product_review', 'giveaway', 'takeover', 'event', 'ambassador'
);

-- Compensation types
CREATE TYPE compensation_type AS ENUM (
    'fixed_fee', 'commission', 'product_value', 'free_service', 'hybrid'
);

-- Collaboration statuses
CREATE TYPE collaboration_status AS ENUM (
    'negotiation', 'contracted', 'in_progress', 'completed', 'cancelled', 'disputed'
);

-- Content approval statuses
CREATE TYPE approval_status AS ENUM (
    'pending_approval', 'approved', 'rejected', 'needs_revision', 'published'
);

-- Content types
CREATE TYPE content_type AS ENUM (
    'image', 'video', 'carousel', 'story', 'reel', 'text', 'blog_post', 'email'
);

-- Testimonial statuses
CREATE TYPE testimonial_status AS ENUM (
    'pending', 'approved', 'rejected', 'published', 'archived'
);

-- Review platforms
CREATE TYPE review_platform AS ENUM (
    'google', 'facebook', 'instagram', 'trustpilot', 'booksy', 'local_favorites'
);

-- Campaign types
CREATE TYPE campaign_type AS ENUM (
    'brand_awareness', 'lead_generation', 'conversion', 'engagement',
    'product_launch', 'seasonal', 'event', 'retargeting'
);

-- Campaign statuses
CREATE TYPE campaign_status AS ENUM (
    'draft', 'active', 'paused', 'completed', 'cancelled'
);

-- Campaign priorities
CREATE TYPE campaign_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
);

-- Test variables
CREATE TYPE test_variable AS ENUM (
    'headline', 'visual', 'cta', 'timing', 'hashtag', 'format', 'caption_length'
);

-- Test statuses
CREATE TYPE test_status AS ENUM (
    'draft', 'running', 'completed', 'paused', 'cancelled'
);

-- Email campaign types
CREATE TYPE email_campaign_type AS ENUM (
    'newsletter', 'promotional', 'automated', 'transactional', 'survey', 'event'
);

-- Email schedule types
CREATE TYPE email_schedule_type AS ENUM (
    'immediate', 'scheduled', 'recurring', 'triggered', 'automation'
);

-- Email trigger types
CREATE TYPE email_trigger_type AS ENUM (
    'booking_completed', 'booking_cancelled', 'new_customer', 'abandoned_cart',
    're_engagement', 'birthday', 'seasonal', 'behavior_based'
);

-- Email priorities
CREATE TYPE email_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
);

-- Sync statuses
CREATE TYPE sync_status AS ENUM (
    'pending', 'syncing', 'completed', 'failed', 'disabled'
);

-- Repurposing strategies
CREATE TYPE repurposing_strategy AS ENUM (
    'cross_platform', 'format_conversion', 'content_extension', 'snippet_extraction',
    'carousel_expansion', 'video_to_images', 'blog_to_social', 'testimonial_to_post'
);

-- Repurposing statuses
CREATE TYPE repurposing_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'scheduled'
);

-- Repurposing priorities
CREATE TYPE repurposing_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
);

-- Email statuses
CREATE TYPE email_status AS ENUM (
    'pending', 'sent', 'delivered', 'opened', 'clicked', 'unsubscribed',
    'bounced', 'complained', 'failed'
);

-- ============================================
-- INSERT DEFAULT SETTINGS
-- ============================================

-- Default marketing settings
INSERT INTO marketing_settings (setting_key, setting_value, description, category) VALUES
('auto_posting_enabled', 'false', 'Enable automatic posting to social media', 'automation'),
('optimal_posting_times', '{"instagram": "19:00", "facebook": "18:30", "linkedin": "09:00", "tiktok": "20:00"}', 'Optimal posting times for each platform', 'scheduling'),
('content_approval_workflow', 'true', 'Require approval for social media content', 'workflow'),
('hashtag_sets', '{"beauty": ["beautypolska", "pieknacera", "kosmetolog", "warszawabeauty"], "fitness": ["fitnesswawa", "warsawfitness", "trening", "zdrowiestylzycia"]}', 'Default hashtag sets for different content categories', 'content'),
('consent_management', 'true', 'Enable consent management for user-generated content', 'compliance'),
('gdpr_compliance', 'true', 'Enable GDPR compliance features', 'compliance'),
('polish_language_optimization', 'true', 'Optimize content for Polish-speaking audience', 'localization'),
('competitor_monitoring', 'true', 'Enable competitor monitoring', 'analytics'),
('email_automation', 'true', 'Enable email marketing automation', 'email'),
('performance_tracking', 'true', 'Enable comprehensive performance tracking', 'analytics')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default content templates
INSERT INTO content_templates (name, description, template_type, platform, content_template, variable_mappings, hashtag_sets, is_active) VALUES
('Service Promotion Template', 'Template for promoting beauty/fitness services', 'service_promotion', 'instagram',
 '✨ Transformacja w {service_name} już od {price} PLN! 💫\n\nOdkryj sekrety {benefit} w naszym salonie w Warszawie.\n\n📅 Zapisz się na wizytę: {booking_link}\n\n{cta}',
 '{"service_name": "Nazwa usługi", "price": "Cena", "benefit": "Korzyści", "booking_link": "Link do rezerwacji", "cta": "Wezwanie do działania"}',
 '["#beautypolska", "#pieknacera", "#kosmetologwarszawa", "#warszawabeauty"]', true),
('Client Testimonial Template', 'Template for sharing client testimonials', 'testimonial', 'facebook',
 '"{testimonial_text}" - {client_name}, Warszawa\n\nDziękujemy za zaufanie! ❤️\n\nZobacz więcej opinii: {reviews_link}\n\nUmów się na wizytę i przekonaj się sama!',
 '{"testimonial_text": "Treść opinii", "client_name": "Imię klientki", "reviews_link": "Link do opinii"}',
 '["#opinie", "#testimonials", "#warszawa", "#kosmetika"]', true)
ON CONFLICT DO NOTHING;

COMMIT;