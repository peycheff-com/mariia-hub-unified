-- Marketing and Social Media Management Schema
-- Comprehensive system for social media automation, email marketing, influencer management, and analytics

-- Social media platforms configuration
CREATE TABLE social_media_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  api_base_url TEXT,
  rate_limit_per_hour INTEGER DEFAULT 60,
  max_content_length INTEGER,
  supported_media_types TEXT[] DEFAULT '{}',
  hashtag_limit INTEGER,
  character_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media accounts for the business
CREATE TABLE social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES social_media_platforms(id) ON DELETE CASCADE,
  account_identifier TEXT NOT NULL, -- username, handle, etc.
  display_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_metadata JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform_id, account_identifier)
);

-- Content campaigns and marketing initiatives
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('social_media', 'email', 'influencer', 'paid_ads', 'content', 'seasonal')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  budget DECIMAL(10,2),
  target_audience JSONB DEFAULT '{}',
  goals JSONB DEFAULT '{}', -- engagement, leads, sales, etc.
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media content library and scheduling
CREATE TABLE social_media_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_metadata JSONB DEFAULT '{}',
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'story', 'reel', 'carousel', 'video')),
  platform_specific_content JSONB DEFAULT '{}', -- customized content per platform
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  call_to_action TEXT,
  scheduling_status TEXT DEFAULT 'draft' CHECK (scheduling_status IN ('draft', 'scheduled', 'posted', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  platform_post_ids JSONB DEFAULT '{}', -- store post IDs from each platform
  engagement_stats JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  content_performance_score DECIMAL(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content scheduling and automation rules
CREATE TABLE content_scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  platform_ids UUID[] DEFAULT '{}',
  posting_frequency JSONB NOT NULL, -- complex scheduling rules
  optimal_times JSONB DEFAULT '{}', -- best posting times based on analytics
  content_types TEXT[] DEFAULT '{}',
  hashtag_sets JSONB DEFAULT '{}',
  auto_approve BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email marketing system
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  template_id UUID,
  content_html TEXT,
  content_text TEXT,
  personalization_vars JSONB DEFAULT '{}',
  segmentation_rules JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  a_b_test_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates with drag-and-drop builder
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_type TEXT DEFAULT 'custom' CHECK (template_type IN ('custom', 'automation', 'newsletter', 'transactional')),
  thumbnail_url TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT,
  css_styles TEXT,
  variables JSONB DEFAULT '{}', -- template variables
  sections JSONB DEFAULT '{}', -- modular sections
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  performance_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email lists and segmentation
CREATE TABLE email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  list_type TEXT DEFAULT 'manual' CHECK (list_type IN ('manual', 'dynamic', 'suppression')),
  segmentation_rules JSONB DEFAULT '{}',
  auto_update_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  subscriber_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email subscribers with GDPR compliance
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  source TEXT NOT NULL, -- how they subscribed
  subscription_date TIMESTAMPTZ DEFAULT NOW(),
  confirmation_date TIMESTAMPTZ,
  gdpr_consent BOOLEAN DEFAULT false,
  gdpr_consent_date TIMESTAMPTZ,
  gdpr_consent_ip TEXT,
  preferences JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  engagement_score DECIMAL(5,2) DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained', 'inactive')),
  unsubscribe_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email list subscriptions (many-to-many)
CREATE TABLE email_list_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
  list_id UUID REFERENCES email_lists(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  unsubscribe_reason TEXT,
  UNIQUE(subscriber_id, list_id)
);

-- Email campaign sends and tracking
CREATE TABLE email_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
  send_date TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  first_click_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'bounced', 'failed')),
  tracking_data JSONB DEFAULT '{}',
  UNIQUE(campaign_id, subscriber_id)
);

-- Influencer and partnership management
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  platform_id UUID REFERENCES social_media_platforms(id),
  niche TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  demographics JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  agency TEXT,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  rates JSONB DEFAULT '{}', -- partnership rates
  media_kit_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'negotiating', 'active', 'inactive', 'blacklisted')),
  rating DECIMAL(3,2) CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform_id, handle)
);

-- Influencer collaborations and campaigns
CREATE TABLE influencer_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  marketing_campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('post', 'story', 'video', 'review', 'giveaway', 'takeover', 'affiliate')),
  brief TEXT,
  deliverables JSONB DEFAULT '{}',
  compensation_type TEXT CHECK (compensation_type IN ('fixed', 'commission', 'product', 'hybrid')),
  compensation_amount DECIMAL(10,2),
  compensation_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  content_review_required BOOLEAN DEFAULT true,
  usage_rights TEXT,
  performance_metrics JSONB DEFAULT '{}',
  actual_compensation DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate marketing system
CREATE TABLE affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_rates JSONB NOT NULL,
  cookie_duration INTEGER DEFAULT 30, -- days
  payment_terms TEXT,
  minimum_payout DECIMAL(10,2) DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  tracking_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate partners (including influencers)
CREATE TABLE affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  program_id UUID REFERENCES affiliate_programs(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  payout_info JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'terminated')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate clicks and conversions
CREATE TABLE affiliate_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  click_id TEXT NOT NULL UNIQUE,
  referral_url TEXT,
  landing_page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  conversion_date TIMESTAMPTZ,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing analytics and attribution
CREATE TABLE marketing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform, campaign_id, metric_type)
);

-- Customer journey and touchpoints
CREATE TABLE customer_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN ('social', 'email', 'organic', 'paid', 'referral', 'direct')),
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  landing_page TEXT,
  conversion_value DECIMAL(10,2),
  attributed_campaign_id UUID REFERENCES marketing_campaigns(id),
  touchpoint_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community building and user-generated content
CREATE TABLE user_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('review', 'testimonial', 'photo', 'video', 'social_mention')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platform TEXT,
  platform_post_id TEXT,
  permission_granted BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  moderation_notes TEXT,
  engagement_stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty and referral programs
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT DEFAULT 'points' CHECK (program_type IN ('points', 'tier', 'cashback')),
  rules JSONB NOT NULL,
  rewards JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer loyalty participation
CREATE TABLE customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  tier_level TEXT,
  lifetime_points INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, program_id)
);

-- Referral program
CREATE TABLE referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  referrer_reward JSONB NOT NULL,
  referee_reward JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'converted', 'expired', 'cancelled')),
  conversion_date TIMESTAMPTZ,
  reward_amount DECIMAL(10,2),
  reward_paid BOOLEAN DEFAULT false,
  reward_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing automation workflows
CREATE TABLE marketing_automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'time', 'behavior', 'segment')),
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation execution logs
CREATE TABLE automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES marketing_automation_workflows(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('started', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  actions_executed JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}'
);

-- A/B testing for marketing
CREATE TABLE marketing_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('email', 'social', 'landing_page', 'ad')),
  variants JSONB NOT NULL,
  traffic_split JSONB NOT NULL,
  success_metrics JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  winning_variant TEXT,
  significance_level DECIMAL(5,4),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices for quick lookups
CREATE INDEX idx_social_media_content_status ON social_media_content(scheduling_status, scheduled_for);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status, scheduled_for);
CREATE INDEX idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX idx_influencer_collaborations_status ON influencer_collaborations(status, start_date);
CREATE INDEX idx_affiliate_tracking_converted ON affiliate_tracking(converted, conversion_date);
CREATE INDEX idx_customer_touchpoints_customer ON customer_touchpoints(customer_id, created_at);
CREATE INDEX idx_marketing_analytics_date ON marketing_analytics(date, platform);
CREATE INDEX idx_automation_execution_logs_workflow ON automation_execution_logs(workflow_id, started_at);

-- RLS Policies
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (admin access)
CREATE POLICY "Admin full access to marketing tables" ON social_media_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin full access to content" ON social_media_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add similar policies for other marketing tables...

-- Functions for marketing analytics
CREATE OR REPLACE FUNCTION calculate_campaign_roi(p_campaign_id UUID)
RETURNS TABLE(
  total_investment DECIMAL,
  total_revenue DECIMAL,
  roi_percentage DECIMAL,
  customer_acquisition_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CAST(b.total_amount DECIMAL)), 0) as total_revenue,
    COALESCE(mc.budget, 0) as total_investment,
    CASE
      WHEN COALESCE(mc.budget, 0) > 0
      THEN ((COALESCE(SUM(CAST(b.total_amount DECIMAL)), 0) - COALESCE(mc.budget, 0)) / COALESCE(mc.budget, 0)) * 100
      ELSE 0
    END as roi_percentage,
    CASE
      WHEN COUNT(DISTINCT b.customer_id) > 0
      THEN COALESCE(mc.budget, 0) / COUNT(DISTINCT b.customer_id)
      ELSE 0
    END as customer_acquisition_cost
  FROM marketing_campaigns mc
  LEFT JOIN bookings b ON b.marketing_campaign_id = mc.id
  WHERE mc.id = p_campaign_id
  GROUP BY mc.id, mc.budget;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update engagement metrics
CREATE OR REPLACE FUNCTION update_content_engagement_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update social media content performance score
  IF TG_TABLE_NAME = 'social_media_content' THEN
    NEW.content_performance_score = (
      -- Calculate performance score based on engagement
      -- This would integrate with platform APIs to get real metrics
      CASE
        WHEN NEW.engagement_stats IS NOT NULL THEN
          (COALESCE((NEW.engagement_stats->>'likes')::INTEGER, 0) * 1 +
           COALESCE((NEW.engagement_stats->>'comments')::INTEGER, 0) * 5 +
           COALESCE((NEW.engagement_stats->>'shares')::INTEGER, 0) * 10) * 0.1
        ELSE 0
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_content_metrics
  BEFORE INSERT OR UPDATE ON social_media_content
  FOR EACH ROW EXECUTE FUNCTION update_content_engagement_metrics();

-- Insert initial data
INSERT INTO social_media_platforms (name, display_name, api_base_url, rate_limit_per_hour, character_limit, supported_media_types) VALUES
('instagram', 'Instagram', 'https://graph.instagram.com', 200, 2200, ARRAY['image', 'video', 'carousel']),
('facebook', 'Facebook', 'https://graph.facebook.com', 200, 63206, ARRAY['image', 'video', 'link', 'event']),
('linkedin', 'LinkedIn', 'https://api.linkedin.com', 100, 1300, ARRAY['image', 'video', 'article']),
('tiktok', 'TikTok', 'https://open.tiktokapis.com', 100, 150, ARRAY['video', 'image']),
('twitter', 'X (Twitter)', 'https://api.twitter.com', 300, 280, ARRAY['image', 'video', 'gif']),
('youtube', 'YouTube', 'https://www.googleapis.com/youtube/v3', 10000, 5000, ARRAY['video', 'playlist']),
('pinterest', 'Pinterest', 'https://api.pinterest.com', 1000, 500, ARRAY['image', 'video']);

-- Insert default affiliate program
INSERT INTO affiliate_programs (name, description, commission_type, commission_rates, cookie_duration) VALUES
('Mariia Hub Partners', 'Default affiliate program for mariia-hub brand ambassadors', 'percentage', '{"default": 10, "tier_1": 15, "tier_2": 20}', 30);

-- Insert default loyalty program
INSERT INTO loyalty_programs (name, description, program_type, rules, rewards) VALUES
('Mariia Rewards', 'Earn points for bookings, reviews, and social media engagement', 'points',
 '{"booking": 10, "review": 5, "social_share": 2, "referral": 50}',
 '{"100": "5% discount", "250": "10% discount", "500": "15% discount", "1000": "free treatment"}');

-- Insert default referral program
INSERT INTO referral_programs (name, description, referrer_reward, referee_reward) VALUES
('Refer a Friend', 'Give 50 PLN credit, get 50 PLN credit when they book',
 '{"type": "credit", "amount": 50, "currency": "PLN"}',
 '{"type": "discount", "amount": 50, "currency": "PLN", "type": "first_booking"}');

COMMIT;