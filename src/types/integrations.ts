/**
 * Core Types for Third-Party Integrations
 * Comprehensive integration management system for beauty and fitness business ecosystem
 */

// Base integration types
export type IntegrationProvider =
  | 'google'
  | 'microsoft'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'mailchimp'
  | 'sendgrid'
  | 'twilio'
  | 'whatsapp'
  | 'trustpilot'
  | 'yelp'
  | 'google_reviews'
  | 'google_analytics'
  | 'mixpanel'
  | 'hotjar'
  | 'hubspot'
  | 'salesforce'
  | 'slack'
  | 'microsoft_teams'
  | 'discord'
  | 'calendly'
  | 'zoom'
  | 'shopify';

export type IntegrationCategory =
  | 'calendar'
  | 'social_media'
  | 'email_marketing'
  | 'messaging'
  | 'reviews'
  | 'analytics'
  | 'crm'
  | 'communication'
  | 'e_commerce'
  | 'scheduling';

export type AuthType =
  | 'oauth2'
  | 'api_key'
  | 'basic_auth'
  | 'bearer_token'
  | 'webhook';

export type SyncFrequency =
  | 'realtime'
  | 'every_5_minutes'
  | 'every_15_minutes'
  | 'every_30_minutes'
  | 'hourly'
  | 'daily'
  | 'weekly';

export type IntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending_setup'
  | 'rate_limited'
  | 'deprecated';

// Core integration configuration
export interface IntegrationConfig {
  id: string;
  provider: IntegrationProvider;
  category: IntegrationCategory;
  status: IntegrationStatus;
  authType: AuthType;
  is_enabled: boolean;
  sync_frequency: SyncFrequency;
  last_sync_at?: string;
  next_sync_at?: string;
  error_count: number;
  last_error?: string;
  settings: Record<string, any>;
  credentials: Record<string, any>;
  webhook_config?: WebhookConfig;
  rate_limits?: RateLimitConfig;
  created_at: string;
  updated_at: string;
}

// Webhook configuration
export interface WebhookConfig {
  endpoint_url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  last_received?: string;
  retry_count: number;
  max_retries: number;
}

// Rate limiting configuration
export interface RateLimitConfig {
  requests_per_hour: number;
  requests_per_day: number;
  current_usage: {
    hour: number;
    day: number;
    last_reset: {
      hour: string;
      day: string;
    };
  };
}

// Sync log entry
export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete' | 'sync';
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data_before?: Record<string, any>;
  data_after?: Record<string, any>;
  external_id?: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

// Analytics data structure
export interface IntegrationAnalytics {
  id: string;
  integration_id: string;
  date: string;
  metrics: Record<string, number>;
  events: IntegrationEvent[];
  performance: {
    avg_response_time_ms: number;
    success_rate: number;
    error_count: number;
    total_requests: number;
  };
  created_at: string;
}

export interface IntegrationEvent {
  id: string;
  type: string;
  provider: IntegrationProvider;
  entity_type: string;
  entity_id: string;
  data: Record<string, any>;
  timestamp: string;
  processed: boolean;
}

// Data mapping for field transformation
export interface DataMapping {
  id: string;
  integration_id: string;
  local_field: string;
  external_field: string;
  transformation_type: 'direct' | 'format' | 'split' | 'join' | 'calculate' | 'lookup';
  transformation_config?: Record<string, any>;
  is_required: boolean;
  default_value?: any;
}

// Integration templates for quick setup
export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  provider: IntegrationProvider;
  category: IntegrationCategory;
  setup_instructions: string[];
  required_fields: string[];
  optional_fields: string[];
  default_settings: Record<string, any>;
  webhook_events: string[];
  rate_limits: RateLimitConfig;
  is_recommended: boolean;
}

// Polishing for Polish market specifics
export interface PolishMarketConfig {
  integration_id: string;
  language: 'pl' | 'en';
  currency: 'PLN' | 'EUR' | 'USD';
  timezone: 'Europe/Warsaw';
  business_hours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    workdays: number[]; // 1-7 (Monday-Sunday)
  };
  holidays: string[]; // ISO date strings
  localized_fields: Record<string, Record<string, string>>;
  compliance: {
    gdpr_compliant: boolean;
    data_processing_agreement: boolean;
    local_server_required: boolean;
  };
}

// Calendar specific types
export interface CalendarEvent {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  location?: string;
  attendees: CalendarAttendee[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurrence?: CalendarRecurrence;
  metadata: Record<string, any>;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  is_optional?: boolean;
}

export interface CalendarRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date?: string;
  occurrences?: number;
  days_of_week?: number[]; // 0-6 (Sunday-Saturday)
}

// Social media specific types
export interface SocialMediaPost {
  id: string;
  platform: IntegrationProvider;
  external_id?: string;
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  post_type: 'text' | 'image' | 'video' | 'story' | 'reel';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  metrics: SocialMediaMetrics;
  metadata: Record<string, any>;
}

export interface SocialMediaMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  clicks?: number;
  impressions?: number;
  reach?: number;
  engagement_rate?: number;
  collected_at?: string;
}

// Email marketing specific types
export interface EmailCampaign {
  id: string;
  platform: IntegrationProvider;
  external_id?: string;
  name: string;
  subject: string;
  content: string;
  list_ids: string[];
  segment_ids?: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  metrics: EmailCampaignMetrics;
  settings: {
    from_name: string;
    from_email: string;
    reply_to?: string;
    template_id?: string;
    track_opens: boolean;
    track_clicks: boolean;
  };
}

export interface EmailCampaignMetrics {
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  collected_at?: string;
}

// Review platform specific types
export interface Review {
  id: string;
  platform: IntegrationProvider;
  external_id?: string;
  reviewer_name: string;
  rating: number; // 1-5
  comment?: string;
  service_type?: string;
  review_date: string;
  response?: {
    content: string;
    author: string;
    responded_at: string;
  };
  status: 'new' | 'responded' | 'flagged' | 'resolved';
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number; // -1 to 1
  metadata: Record<string, any>;
}

// Analytics platform specific types
export interface AnalyticsEvent {
  id: string;
  platform: IntegrationProvider;
  event_name: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  timestamp: string;
  revenue?: number;
  currency?: string;
}

// CRM specific types
export interface CRMContact {
  id: string;
  platform: IntegrationProvider;
  external_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'evangelist';
  lead_status?: string;
  source?: string;
  last_contacted?: string;
  properties: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CRMDeal {
  id: string;
  platform: IntegrationProvider;
  external_id?: string;
  contact_id: string;
  deal_name: string;
  amount?: number;
  currency?: string;
  stage: string;
  probability?: number;
  expected_close_date?: string;
  source?: string;
  properties: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Communication tool specific types
export interface CommunicationMessage {
  id: string;
  platform: IntegrationProvider;
  channel_id?: string;
  thread_id?: string;
  external_id?: string;
  author_id: string;
  author_name: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'embed' | 'system';
  timestamp: string;
  reactions?: MessageReaction[];
  replies?: CommunicationMessage[];
  attachments?: MessageAttachment[];
  metadata: Record<string, any>;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Error handling types
export interface IntegrationError {
  id: string;
  integration_id: string;
  error_type: 'auth' | 'rate_limit' | 'api' | 'network' | 'validation' | 'unknown';
  error_code?: string;
  error_message: string;
  context: Record<string, any>;
  resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

// Health check types
export interface IntegrationHealth {
  integration_id: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_check: string;
  response_time_ms: number;
  success_rate: number;
  error_rate: number;
  last_successful_sync?: string;
  upcoming_maintenance?: string;
  issues: IntegrationIssue[];
}

export interface IntegrationIssue {
  type: 'warning' | 'error' | 'critical';
  message: string;
  details?: string;
  suggested_action?: string;
  detected_at: string;
}

// Export all types for external use
export type {
  IntegrationProvider,
  IntegrationCategory,
  AuthType,
  SyncFrequency,
  IntegrationStatus,
  IntegrationConfig,
  WebhookConfig,
  RateLimitConfig,
  IntegrationSyncLog,
  IntegrationAnalytics,
  IntegrationEvent,
  DataMapping,
  IntegrationTemplate,
  PolishMarketConfig,
  CalendarEvent,
  CalendarAttendee,
  CalendarRecurrence,
  SocialMediaPost,
  SocialMediaMetrics,
  EmailCampaign,
  EmailCampaignMetrics,
  Review,
  AnalyticsEvent,
  CRMContact,
  CRMDeal,
  CommunicationMessage,
  MessageReaction,
  MessageAttachment,
  IntegrationError,
  IntegrationHealth,
  IntegrationIssue
};