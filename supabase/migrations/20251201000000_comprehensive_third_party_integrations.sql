-- Comprehensive Third-Party Integrations Schema
-- Supports all major business ecosystem integrations for beauty and fitness platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- google, microsoft, facebook, instagram, etc.
    category TEXT NOT NULL, -- calendar, social_media, email_marketing, etc.
    status TEXT NOT NULL DEFAULT 'pending_setup', -- connected, disconnected, error, etc.
    auth_type TEXT NOT NULL, -- oauth2, api_key, basic_auth, etc.
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    sync_frequency TEXT NOT NULL DEFAULT 'hourly', -- realtime, every_5_minutes, etc.
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    error_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    settings JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '{}',
    webhook_config JSONB,
    rate_limits JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('connected', 'disconnected', 'error', 'pending_setup', 'rate_limited', 'deprecated')),
    CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token', 'webhook')),
    CONSTRAINT valid_sync_frequency CHECK (sync_frequency IN ('realtime', 'every_5_minutes', 'every_15_minutes', 'every_30_minutes', 'hourly', 'daily', 'weekly'))
);

-- Integration sync logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- events, contacts, campaigns, etc.
    entity_id TEXT,
    operation TEXT NOT NULL, -- create, update, delete, sync
    sync_status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
    data_before JSONB,
    data_after JSONB,
    external_id TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    CONSTRAINT valid_operation CHECK (operation IN ('create', 'update', 'delete', 'sync')),
    CONSTRAINT valid_sync_status CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Integration analytics
CREATE TABLE IF NOT EXISTS integration_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}',
    events JSONB DEFAULT '[]',
    performance JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(integration_id, date)
);

-- Integration events (webhook events, system events, etc.)
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ
);

-- Integration errors
CREATE TABLE IF NOT EXISTS integration_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL, -- auth, rate_limit, api, network, validation, unknown
    error_code TEXT,
    error_message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Integration health checks
CREATE TABLE IF NOT EXISTS integration_health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- healthy, degraded, unhealthy
    last_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    last_successful_sync TIMESTAMPTZ,
    upcoming_maintenance TIMESTAMPTZ,
    issues JSONB DEFAULT '[]',

    CONSTRAINT valid_health_status CHECK (status IN ('healthy', 'degraded', 'unhealthy'))
);

-- Integration templates for quick setup
CREATE TABLE IF NOT EXISTS integration_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    setup_instructions TEXT[] NOT NULL,
    required_fields TEXT[] NOT NULL,
    optional_fields TEXT[] DEFAULT '{}',
    default_settings JSONB DEFAULT '{}',
    webhook_events TEXT[] DEFAULT '{}',
    rate_limits JSONB DEFAULT '{}',
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data mapping between internal and external formats
CREATE TABLE IF NOT EXISTS integration_data_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    local_field TEXT NOT NULL,
    external_field TEXT NOT NULL,
    transformation_type TEXT NOT NULL DEFAULT 'direct', -- direct, format, split, join, calculate, lookup
    transformation_config JSONB,
    is_required BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_transformation_type CHECK (transformation_type IN ('direct', 'format', 'split', 'join', 'calculate', 'lookup'))
);

-- Polish market specific configurations
CREATE TABLE IF NOT EXISTS polish_market_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'pl',
    currency TEXT NOT NULL DEFAULT 'PLN',
    timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
    business_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "17:00", "workdays": [1, 2, 3, 4, 5]}',
    holidays DATE[] DEFAULT '{}',
    localized_fields JSONB DEFAULT '{}',
    compliance JSONB NOT NULL DEFAULT '{"gdpr_compliant": true, "data_processing_agreement": false, "local_server_required": false}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_language CHECK (language IN ('pl', 'en')),
    CONSTRAINT valid_currency CHECK (currency IN ('PLN', 'EUR', 'USD'))
);

-- Calendar-specific tables
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    external_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
    location TEXT,
    attendees JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, tentative, cancelled
    recurrence JSONB,
    metadata JSONB DEFAULT '{}',
    google_event_id TEXT,
    microsoft_event_id TEXT,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_event_status CHECK (status IN ('confirmed', 'tentative', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    source TEXT NOT NULL, -- google_calendar, microsoft_calendar, manual, etc.
    status TEXT, -- free, tentative, busy, oof, etc.
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Social media specific tables
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- facebook, instagram, tiktok, etc.
    external_id TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    post_type TEXT NOT NULL DEFAULT 'text', -- text, image, video, story, reel
    status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, failed
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    metrics JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_post_type CHECK (post_type IN ('text', 'image', 'video', 'story', 'reel')),
    CONSTRAINT valid_post_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed'))
);

-- Email marketing specific tables
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- mailchimp, sendgrid, etc.
    external_id TEXT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    list_ids TEXT[] DEFAULT '{}',
    segment_ids TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    metrics JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_campaign_status CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled'))
);

-- Review platform specific tables
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- google_reviews, trustpilot, yelp, etc.
    external_id TEXT,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    service_type TEXT,
    review_date DATE NOT NULL,
    response JSONB,
    status TEXT NOT NULL DEFAULT 'new', -- new, responded, flagged, resolved
    sentiment TEXT, -- positive, neutral, negative
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_review_status CHECK (status IN ('new', 'responded', 'flagged', 'resolved')),
    CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative'))
);

-- Analytics platform specific tables
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- google_analytics, mixpanel, hotjar, etc.
    event_name TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revenue DECIMAL(10,2),
    currency TEXT DEFAULT 'PLN'
);

-- CRM specific tables
CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- hubspot, salesforce, etc.
    external_id TEXT,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    company TEXT,
    tags TEXT[] DEFAULT '{}',
    lifecycle_stage TEXT NOT NULL DEFAULT 'lead', -- lead, prospect, customer, evangelist
    lead_status TEXT,
    source TEXT,
    last_contacted TIMESTAMPTZ,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_lifecycle_stage CHECK (lifecycle_stage IN ('lead', 'prospect', 'customer', 'evangelist'))
);

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    external_id TEXT,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    deal_name TEXT NOT NULL,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'PLN',
    stage TEXT NOT NULL,
    probability DECIMAL(3,2) CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    source TEXT,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communication tool specific tables
CREATE TABLE IF NOT EXISTS communication_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- slack, microsoft_teams, discord, etc.
    channel_id TEXT,
    thread_id TEXT,
    external_id TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- text, image, file, embed, system
    timestamp TIMESTAMPTZ NOT NULL,
    reactions JSONB DEFAULT '[]',
    replies JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'embed', 'system'))
);

-- Microsoft Teams specific tables
CREATE TABLE IF NOT EXISTS teams_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    meeting_id TEXT NOT NULL UNIQUE,
    join_url TEXT NOT NULL,
    subject TEXT,
    participants JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp specific tables (extended from existing)
CREATE TABLE IF NOT EXISTS whatsapp_business_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    phone_number_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    quality_rating TEXT, -- GREEN, YELLOW, RED
    webhook_url TEXT,
    webhook_secret TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook tracking for all integrations
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}',
    signature TEXT,
    processed BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    window_type TEXT NOT NULL, -- hour, day, minute
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    limit_reached BOOLEAN NOT NULL DEFAULT false,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(integration_id, endpoint, window_type, window_start),
    CONSTRAINT valid_window_type CHECK (window_type IN ('minute', 'hour', 'day'))
);

-- Integration data exports/imports
CREATE TABLE IF NOT EXISTS integration_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL, -- full, incremental, specific_entity
    entity_types TEXT[] DEFAULT '{}',
    format TEXT NOT NULL DEFAULT 'json', -- json, csv, xlsx
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    file_url TEXT,
    record_count INTEGER,
    file_size_bytes BIGINT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_export_type CHECK (export_type IN ('full', 'incremental', 'specific_entity')),
    CONSTRAINT valid_export_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_export_format CHECK (format IN ('json', 'csv', 'xlsx'))
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON integrations(category);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON integrations(is_enabled);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_status ON integration_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_started_at ON integration_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_integration_analytics_integration_id_date ON integration_analytics(integration_id, date);
CREATE INDEX IF NOT EXISTS idx_integration_events_provider_timestamp ON integration_events(provider, timestamp);
CREATE INDEX IF NOT EXISTS idx_integration_events_processed ON integration_events(processed);
CREATE INDEX IF NOT EXISTS idx_integration_errors_integration_id_created_at ON integration_errors(integration_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_integration_id ON calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_start_time ON availability_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform_status ON social_media_posts(platform, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_platform_status ON email_campaigns(platform, status);
CREATE INDEX IF NOT EXISTS idx_reviews_platform_status ON reviews(platform, status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform_timestamp ON analytics_events(platform, timestamp);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle_stage ON crm_contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_communication_messages_platform_timestamp ON communication_messages(platform, timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_processed ON webhook_logs(provider, processed);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_reset_at ON rate_limit_tracking(reset_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_templates_updated_at BEFORE UPDATE ON integration_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_polish_market_configs_updated_at BEFORE UPDATE ON polish_market_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_meetings_updated_at BEFORE UPDATE ON teams_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_business_accounts_updated_at BEFORE UPDATE ON whatsapp_business_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example - adjust based on your authentication/authorization system)
CREATE POLICY "Users can view their own integrations" ON integrations FOR SELECT USING (true);
CREATE POLICY "Users can insert their own integrations" ON integrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own integrations" ON integrations FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own integrations" ON integrations FOR DELETE USING (true);

-- Similar policies for other tables (simplified for brevity)
CREATE POLICY "Users can view related sync logs" ON integration_sync_logs FOR SELECT USING (true);
CREATE POLICY "Users can view related analytics" ON integration_analytics FOR SELECT USING (true);
CREATE POLICY "Users can view related events" ON integration_events FOR SELECT USING (true);
CREATE POLICY "Users can view related errors" ON integration_errors FOR SELECT USING (true);
CREATE POLICY "Users can view calendar events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Users can manage calendar events" ON calendar_events FOR ALL USING (true);
CREATE POLICY "Users can view availability slots" ON availability_slots FOR SELECT USING (true);
CREATE POLICY "Users can manage availability slots" ON availability_slots FOR ALL USING (true);

-- Insert default integration templates
INSERT INTO integration_templates (id, name, description, provider, category, setup_instructions, required_fields, optional_fields, default_settings, webhook_events, rate_limits, is_recommended) VALUES
(uuid_generate_v4(), 'Google Calendar', 'Sync appointments with Google Calendar', 'google', 'calendar',
 ARRAY['Create Google Cloud Project', 'Enable Calendar API', 'Create OAuth 2.0 credentials', 'Configure redirect URI', 'Connect account'],
 ARRAY['client_id', 'client_secret'],
 ARRAY['timezone', 'working_hours', 'buffer_time_minutes'],
 '{"sync_direction": "bidirectional", "sync_availability": true, "buffer_time_minutes": 15, "timezone": "Europe/Warsaw"}',
 ARRAY['event.created', 'event.updated', 'event.deleted'],
 '{"requests_per_hour": 10000, "requests_per_day": 1000000}',
 true),
(uuid_generate_v4(), 'Microsoft 365 Calendar', 'Sync with Outlook/Calendar', 'microsoft', 'calendar',
 ARRAY['Register app in Azure AD', 'Enable Graph API permissions', 'Create client secret', 'Configure redirect URI', 'Connect account'],
 ARRAY['client_id', 'client_secret', 'tenant_id'],
 ARRAY['timezone', 'working_hours', 'enable_teams_integration'],
 '{"sync_direction": "bidirectional", "enable_teams_integration": true, "auto_create_meetings": false}',
 ARRAY['event.created', 'event.updated', 'event.deleted'],
 '{"requests_per_hour": 10000, "requests_per_day": 1000000}',
 true),
(uuid_generate_v4(), 'Facebook Business', 'Connect Facebook Page and Instagram', 'facebook', 'social_media',
 ARRAY['Create Facebook App', 'Add Graph API permissions', 'Get Page Access Token', 'Connect Instagram Business account'],
 ARRAY['page_id', 'page_access_token', 'instagram_business_id'],
 ARRAY['auto_post_stories', 'track_engagement'],
 '{"auto_post_stories": false, "track_engagement": true}',
 ARRAY['post.created', 'post.updated', 'comment.added'],
 '{"requests_per_hour": 4800, "requests_per_day": 48000}',
 true),
(uuid_generate_v4(), 'Mailchimp', 'Email marketing automation', 'mailchimp', 'email_marketing',
 ARRAY['Create Mailchimp account', 'Generate API key', 'Create audience lists', 'Set up templates'],
 ARRAY['api_key', 'audience_id'],
 ARRAY['default_from_name', 'default_from_email', 'track_opens', 'track_clicks'],
 '{"track_opens": true, "track_clicks": true}',
 ARRAY['campaign.sent', 'subscriber.added', 'subscriber.unsubscribed'],
 '{"requests_per_hour": 3600, "requests_per_day": 86400}',
 true),
(uuid_generate_v4(), 'Twilio', 'SMS and messaging', 'twilio', 'messaging',
 ARRAY['Create Twilio account', 'Get phone number', 'Generate API credentials', 'Configure messaging service'],
 ARRAY['account_sid', 'auth_token', 'twilio_phone_number'],
 ARRAY['messaging_service_sid', 'webhook_url'],
 '{"business_hours": {"start": "09:00", "end": "21:00", "timezone": "Europe/Warsaw"}}',
 ARRAY['message.sent', 'message.received', 'message.delivery'],
 '{"requests_per_hour": 10000, "requests_per_day": 1000000}',
 true),
(uuid_generate_v4(), 'HubSpot', 'CRM and marketing automation', 'hubspot', 'crm',
 ARRAY['Create HubSpot account', 'Generate private app access token', 'Configure properties', 'Set up workflows'],
 ARRAY['access_token'],
 ARRAY['pipeline_id', 'deal_stage', 'lifecycle_stage'],
 '{"default_deal_stage": "appointmentscheduled", "sync_invoices": true}',
 ARRAY['contact.created', 'deal.created', 'deal.updated'],
 '{"requests_per_hour": 250000, "requests_per_day": 10000000}',
 true),
(uuid_generate_v4(), 'Google Analytics 4', 'Website and app analytics', 'google_analytics', 'analytics',
 ARRAY['Create GA4 property', 'Enable Data API', 'Create service account', 'Configure data streams'],
 ARRAY['property_id', 'service_account_key'],
 ARRAY['custom_dimensions', 'enhanced_measurement'],
 '{"enhanced_measurement": true, "anonymize_ip": true}',
 ARRAY['conversion', 'page_view', 'event'],
 '{"requests_per_hour": 50000, "requests_per_day": 10000000}',
 true),
(uuid_generate_v4(), 'Slack', 'Team communication', 'slack', 'communication',
 ARRAY['Create Slack app', 'Add bot permissions', 'Install to workspace', 'Configure channels'],
 ARRAY['bot_token', 'app_id'],
 ARRAY['default_channel', 'notification_types'],
 '{"notification_types": ["booking_confirmation", "new_review"]}',
 ARRAY['message.channels', 'reaction.added'],
 '{"requests_per_hour": 60000, "requests_per_day": 1000000}',
 true);

-- Create default Polish market configurations for common integrations
-- These would be populated when integrations are created

-- Add comments for documentation
COMMENT ON TABLE integrations IS 'Core table storing all third-party integration configurations';
COMMENT ON TABLE integration_sync_logs IS 'Logs for all synchronization operations between systems';
COMMENT ON TABLE integration_analytics IS 'Analytics data for integration performance and usage';
COMMENT ON TABLE integration_events IS 'All events from integrations including webhooks and system events';
COMMENT ON TABLE integration_errors IS 'Error tracking for all integration operations';
COMMENT ON TABLE integration_health_checks IS 'Health monitoring data for integrations';
COMMENT ON TABLE calendar_events IS 'Synchronized calendar events from various platforms';
COMMENT ON TABLE availability_slots IS 'Time slot availability data across different calendars';
COMMENT ON TABLE social_media_posts IS 'Social media content and metrics';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns and performance data';
COMMENT ON TABLE reviews IS 'Customer reviews from various platforms';
COMMENT ON TABLE analytics_events IS 'Raw analytics events from tracking platforms';
COMMENT ON TABLE crm_contacts IS 'Customer contact data from CRM systems';
COMMENT ON TABLE crm_deals IS 'Sales deals and opportunities from CRM';
COMMENT ON TABLE communication_messages IS 'Messages from team communication platforms';
COMMENT ON TABLE polish_market_configs IS 'Polish market specific settings and compliance data';

-- Create function to clean up old logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_integration_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up old sync logs
    DELETE FROM integration_sync_logs
    WHERE started_at < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Clean up old events
    DELETE FROM integration_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep AND processed = true;

    -- Clean up old webhook logs
    DELETE FROM webhook_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep AND processed = true;

    -- Clean up old rate limit tracking
    DELETE FROM rate_limit_tracking
    WHERE reset_at < NOW() - INTERVAL '1 day' * days_to_keep;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get integration health summary
CREATE OR REPLACE FUNCTION get_integration_health_summary()
RETURNS TABLE(
    total_integrations BIGINT,
    connected_integrations BIGINT,
    healthy_integrations BIGINT,
    degraded_integrations BIGINT,
    unhealthy_integrations BIGINT,
    last_sync_avg INTERVAL,
    error_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_integrations,
        COUNT(*) FILTER (WHERE status = 'connected') as connected_integrations,
        COUNT(*) FILTER (WHERE hc.status = 'healthy') as healthy_integrations,
        COUNT(*) FILTER (WHERE hc.status = 'degraded') as degraded_integrations,
        COUNT(*) FILTER (WHERE hc.status = 'unhealthy') as unhealthy_integrations,
        AVG(i.last_sync_at) as last_sync_avg,
        AVG(CASE WHEN i.error_count > 0 THEN i.error_count::DECIMAL ELSE 0 END) as error_rate
    FROM integrations i
    LEFT JOIN integration_health_checks hc ON i.id = hc.integration_id
    WHERE i.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate sync success rate
CREATE OR REPLACE FUNCTION calculate_sync_success_rate(integration_id_param UUID, days_back INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
    total_syncs BIGINT;
    successful_syncs BIGINT;
    success_rate DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_syncs
    FROM integration_sync_logs
    WHERE integration_id = integration_id_param
    AND started_at >= NOW() - INTERVAL '1 day' * days_back;

    SELECT COUNT(*) INTO successful_syncs
    FROM integration_sync_logs
    WHERE integration_id = integration_id_param
    AND sync_status = 'completed'
    AND started_at >= NOW() - INTERVAL '1 day' * days_back;

    IF total_syncs = 0 THEN
        RETURN 0;
    END IF;

    success_rate := (successful_syncs::DECIMAL / total_syncs::DECIMAL) * 100;
    RETURN ROUND(success_rate, 2);
END;
$$ LANGUAGE plpgsql;

COMMIT;