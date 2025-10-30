// Marketing System Types
// Complete social media and marketing integration system types

// ============================================
// 1. SOCIAL MEDIA MANAGEMENT TYPES
// ============================================

export interface SocialPost {
  id: string;
  title?: string;
  content: string;
  platform: SocialPlatform;
  post_type: PostType;
  post_url?: string;
  image_urls: string[];
  video_url?: string;
  hashtags: string[];
  mentions: string[];
  status: PostStatus;
  is_featured: boolean;
  priority: PostPriority;
  scheduled_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  campaign_id?: string;
  content_template_id?: string;
  auto_generated: boolean;
  engagement_metrics: Record<string, any>;
  platform_specific_data: Record<string, any>;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: ContentTemplateType;
  platform: SocialPlatform;
  content_template: string;
  variable_mappings: Record<string, string>;
  hashtag_sets: string[][];
  mention_sets: string[][];
  image_prompt_templates: string[];
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SocialCalendar {
  id: string;
  title: string;
  description?: string;
  content_type?: string;
  target_audience?: string;
  platform: SocialPlatform;
  scheduled_date: string;
  scheduled_time?: string;
  post_frequency: PostFrequency;
  recurring_pattern: Record<string, any>;
  status: CalendarStatus;
  campaign_id?: string;
  content_template_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// 2. INFLUENCER COLLABORATION TYPES
// ============================================

export interface Influencer {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  primary_platform: SocialPlatform;
  secondary_platforms: SocialPlatform[];
  follower_count: number;
  engagement_rate: number;
  niche?: string;
  location?: string;
  age_range?: string;
  audience_demographics: Record<string, any>;
  content_style?: string;
  pricing_rates: Record<string, number>;
  contact_preferences: Record<string, any>;
  status: InfluencerStatus;
  notes?: string;
  social_metrics: Record<string, any>;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
  added_by?: string;
}

export interface InfluencerCollaboration {
  id: string;
  influencer_id: string;
  campaign_id?: string;
  collaboration_type: CollaborationType;
  title: string;
  brief?: string;
  requirements?: string;
  deliverables: Record<string, any>;
  content_guidelines?: string;
  posting_schedule: Record<string, any>;
  compensation_type: CompensationType;
  compensation_amount: number;
  status: CollaborationStatus;
  approval_status: ContentApprovalStatus;
  contract_signed: boolean;
  contract_url?: string;
  start_date?: string;
  end_date?: string;
  actual_deliverables: Record<string, any>;
  performance_metrics: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  managed_by?: string;
}

export interface ContentApproval {
  id: string;
  collaboration_id: string;
  content_url: string;
  content_type: ContentType;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  scheduled_post_date?: string;
  status: ContentApprovalStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  feedback?: string;
  approved_at?: string;
  approved_by?: string;
  revision_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// 3. USER-GENERATED CONTENT & SOCIAL PROOF TYPES
// ============================================

export interface ClientTestimonial {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_id?: string;
  booking_id?: string;
  rating: number;
  testimonial?: string;
  video_url?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  additional_photos: string[];
  consent_marketing: boolean;
  consent_social_media: boolean;
  consent_website: boolean;
  is_featured: boolean;
  is_verified: boolean;
  display_name?: string;
  client_age?: number;
  client_location?: string;
  treatment_date?: string;
  tags: string[];
  status: TestimonialStatus;
  featured_priority: number;
  social_media_shares: Record<string, number>;
  created_at: string;
  updated_at: string;
  approved_by?: string;
}

export interface BeforeAfterGallery {
  id: string;
  client_id?: string;
  client_name?: string;
  service_id: string;
  treatment_date: string;
  before_photos: string[];
  after_photos: string[];
  description?: string;
  treatment_details?: string;
  recovery_time?: string;
  client_testimonial?: string;
  consent_photography: boolean;
  consent_marketing: boolean;
  consent_social_media: boolean;
  consent_website: boolean;
  consent_expiry_date?: string;
  usage_restrictions?: string;
  is_published: boolean;
  featured_priority: number;
  gallery_category?: string;
  tags: string[];
  view_count: number;
  social_shares: number;
  created_at: string;
  updated_at: string;
  approved_by?: string;
}

export interface PlatformReview {
  id: string;
  external_id: string;
  platform: ReviewPlatform;
  author_name?: string;
  author_username?: string;
  rating?: number;
  review_text?: string;
  review_url?: string;
  service_mentioned?: string;
  date_published?: string;
  helpful_count: number;
  response_text?: string;
  response_date?: string;
  sentiment_score?: number;
  is_featured: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 4. MARKETING CAMPAIGNS & ANALYTICS TYPES
// ============================================

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: CampaignType;
  target_audience?: string;
  objectives: string[];
  key_messages: string[];
  start_date: string;
  end_date?: string;
  budget?: number;
  actual_spend: number;
  status: CampaignStatus;
  priority: CampaignPriority;
  target_metrics: Record<string, any>;
  actual_metrics: Record<string, any>;
  content_themes: string[];
  hashtags: string[];
  creative_assets: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  managed_by?: string;
}

export interface CampaignPerformance {
  id: string;
  campaign_id: string;
  platform?: SocialPlatform;
  date: string;
  metrics: Record<string, any>;
  impressions: number;
  reach: number;
  engagements: number;
  clicks: number;
  shares: number;
  likes: number;
  comments: number;
  saves: number;
  conversions: number;
  spend: number;
  created_at: string;
  updated_at: string;
}

export interface ABTest {
  id: string;
  campaign_id?: string;
  name: string;
  description?: string;
  test_variable: TestVariable;
  variants: Record<string, any>;
  start_date: string;
  end_date?: string;
  status: TestStatus;
  confidence_level: number;
  sample_size: number;
  results: Record<string, any>;
  winner_variant?: string;
  significance?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// 5. EMAIL MARKETING TYPES
// ============================================

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: EmailCampaignType;
  subject_template?: string;
  content_template?: string;
  from_name?: string;
  from_email?: string;
  target_segment?: string;
  trigger_conditions: Record<string, any>;
  schedule_type: EmailScheduleType;
  scheduled_at?: string;
  send_timezone: string;
  status: EmailStatus;
  priority: EmailPriority;
  budget?: number;
  target_metrics: Record<string, any>;
  personalization_vars: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  trigger_type: EmailTriggerType;
  trigger_conditions: Record<string, any>;
  steps: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailAnalytics {
  id: string;
  campaign_id?: string;
  sequence_id?: string;
  recipient_id?: string;
  email: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  unsubscribed_at?: string;
  bounced_at?: string;
  complained_at?: string;
  device_type?: string;
  client_type?: string;
  browser?: string;
  location?: string;
  click_count: number;
  open_count: number;
  status: EmailStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// 6. COMPETITOR ANALYSIS TYPES
// ============================================

export interface Competitor {
  id: string;
  name: string;
  business_type?: string;
  location?: string;
  website?: string;
  social_profiles: Record<string, string>;
  services_offered: string[];
  price_range?: string;
  target_audience?: string;
  unique_selling_points: string[];
  notes?: string;
  is_active: boolean;
  last_updated: string;
  created_at: string;
  created_by?: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  platform: SocialPlatform;
  date: string;
  follower_count?: number;
  post_count?: number;
  engagement_rate?: number;
  avg_likes?: number;
  avg_comments?: number;
  top_posts: Record<string, any>;
  hashtag_analysis: Record<string, any>;
  content_themes: string[];
  posting_frequency: Record<string, any>;
  growth_rate?: number;
  sentiment_score?: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// 7. INTEGRATION CONFIGURATION TYPES
// ============================================

export interface SocialIntegration {
  id: string;
  platform: SocialPlatform;
  account_name?: string;
  account_id?: string;
  is_connected: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  api_credentials: Record<string, any>;
  permissions: string[];
  webhook_secret?: string;
  last_sync_at?: string;
  sync_status: SyncStatus;
  error_message?: string;
  is_active: boolean;
  auto_post_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MarketingSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description?: string;
  category?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

// ============================================
// 8. CONTENT DISTRIBUTION TYPES
// ============================================

export interface ContentRepurposing {
  id: string;
  source_content_id: string;
  source_type: ContentType;
  source_platform?: SocialPlatform;
  target_platforms: SocialPlatform[];
  repurposing_strategy: RepurposingStrategy;
  status: RepurposingStatus;
  priority: RepurposingPriority;
  scheduled_for?: string;
  processing_notes?: string;
  generated_content: Record<string, any>;
  performance_comparison: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ContentPerformance {
  id: string;
  content_id: string;
  content_type: ContentType;
  platform: SocialPlatform;
  date: string;
  impressions: number;
  reach: number;
  engagements: number;
  engagement_rate: number;
  clicks: number;
  click_through_rate: number;
  shares: number;
  likes: number;
  comments: number;
  saves: number;
  video_views: number;
  video_completion_rate: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  cost: number;
  roi: number;
  sentiment_score: number;
  viral_coefficient: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENUM TYPES
// ============================================

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'blog'
  | 'email';

export type PostType =
  | 'regular'
  | 'story'
  | 'reel'
  | 'carousel'
  | 'video'
  | 'live'
  | 'guide';

export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived';

export type PostPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export type ContentTemplateType =
  | 'service_promotion'
  | 'testimonial'
  | 'educational'
  | 'behind_scenes'
  | 'news'
  | 'event'
  | 'seasonal'
  | 'user_generated'
  | 'influencer';

export type PostFrequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'bi_weekly'
  | 'monthly'
  | 'quarterly';

export type CalendarStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'postponed';

export type InfluencerStatus =
  | 'prospect'
  | 'contacted'
  | 'negotiating'
  | 'active'
  | 'inactive'
  | 'blacklisted';

export type CollaborationType =
  | 'sponsored_post'
  | 'product_review'
  | 'giveaway'
  | 'takeover'
  | 'event'
  | 'ambassador';

export type CompensationType =
  | 'fixed_fee'
  | 'commission'
  | 'product_value'
  | 'free_service'
  | 'hybrid';

export type CollaborationStatus =
  | 'negotiation'
  | 'contracted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ContentApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'published';

export type ContentType =
  | 'image'
  | 'video'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'text'
  | 'blog_post'
  | 'email';

export type TestimonialStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export type ReviewPlatform =
  | 'google'
  | 'facebook'
  | 'instagram'
  | 'trustpilot'
  | 'booksy'
  | 'local_favorites';

export type CampaignType =
  | 'brand_awareness'
  | 'lead_generation'
  | 'conversion'
  | 'engagement'
  | 'product_launch'
  | 'seasonal'
  | 'event'
  | 'retargeting';

export type CampaignStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type CampaignPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type TestVariable =
  | 'headline'
  | 'visual'
  | 'cta'
  | 'timing'
  | 'hashtag'
  | 'format'
  | 'caption_length';

export type TestStatus =
  | 'draft'
  | 'running'
  | 'completed'
  | 'paused'
  | 'cancelled';

export type EmailCampaignType =
  | 'newsletter'
  | 'promotional'
  | 'automated'
  | 'transactional'
  | 'survey'
  | 'event';

export type EmailScheduleType =
  | 'immediate'
  | 'scheduled'
  | 'recurring'
  | 'triggered'
  | 'automation';

export type EmailTriggerType =
  | 'booking_completed'
  | 'booking_cancelled'
  | 'new_customer'
  | 'abandoned_cart'
  | 're_engagement'
  | 'birthday'
  | 'seasonal'
  | 'behavior_based';

export type EmailPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type SyncStatus =
  | 'pending'
  | 'syncing'
  | 'completed'
  | 'failed'
  | 'disabled';

export type RepurposingStrategy =
  | 'cross_platform'
  | 'format_conversion'
  | 'content_extension'
  | 'snippet_extraction'
  | 'carousel_expansion'
  | 'video_to_images'
  | 'blog_to_social'
  | 'testimonial_to_post';

export type RepurposingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'scheduled';

export type RepurposingPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type EmailStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'
  | 'failed';

// ============================================
// HELPER TYPES AND INTERFACES
// ============================================

export interface MarketingMetrics {
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  averageEngagementRate: number;
  totalClicks: number;
  averageClickThroughRate: number;
  totalConversions: number;
  averageConversionRate: number;
  totalSpend: number;
  totalRevenue: number;
  averageROI: number;
  topPerformingContent: ContentPerformance[];
  audienceGrowth: number;
  sentimentScore: number;
}

export interface ContentCreationRequest {
  type: ContentType;
  platforms: SocialPlatform[];
  template?: string;
  variables: Record<string, any>;
  schedule?: {
    date: string;
    time: string;
    timezone?: string;
  };
  campaign?: string;
  priority?: PostPriority;
}

export interface PostingSchedule {
  platform: SocialPlatform;
  optimalTimes: string[];
  frequency: number; // posts per week
  bestPerformingDays: string[];
  timezone: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  size: number;
  engagement_rate: number;
  conversion_rate: number;
  preferred_platforms: SocialPlatform[];
  optimal_posting_times: string[];
}

export interface CampaignBrief {
  campaign_name: string;
  campaign_type: CampaignType;
  objectives: string[];
  target_audience: AudienceSegment;
  key_messages: string[];
  content_themes: string[];
  deliverables: string[];
  timeline: {
    start_date: string;
    end_date: string;
    milestones: Array<{
      name: string;
      date: string;
      deliverable: string;
    }>;
  };
  budget: {
    total: number;
    allocation: Record<string, number>;
  };
  kpis: Record<string, number>;
}

export interface SocialMediaPostRequest {
  content: string;
  platforms: SocialPlatform[];
  media_files: File[];
  hashtags?: string[];
  mentions?: string[];
  scheduled_for?: string;
  campaign_id?: string;
  template_id?: string;
}

export interface PerformanceReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: MarketingMetrics;
  platform_breakdown: Record<SocialPlatform, MarketingMetrics>;
  content_performance: Array<{
    content_id: string;
    content_type: ContentType;
    platform: SocialPlatform;
    metrics: MarketingMetrics;
  }>;
  campaign_performance: Array<{
    campaign_id: string;
    campaign_name: string;
    metrics: MarketingMetrics;
  }>;
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
  }>;
  recommendations: string[];
}

// Export all types for easy importing
export * from './marketing.types';