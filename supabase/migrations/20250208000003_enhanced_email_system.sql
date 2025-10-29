-- Enhanced Email System Migration
-- Tables for email queuing, delivery tracking, templates, and analytics

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html TEXT,
    text TEXT,
    variables TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_queue table for queuing emails
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_data JSONB NOT NULL,
    scheduled_for TIMESTAMPTZ DEFAULT now(),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
    provider TEXT,
    provider_message_id TEXT,
    last_attempt_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_deliveries table for tracking
CREATE TABLE IF NOT EXISTS email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'queued', 'sent', 'delivered', 'bounced', 'complained', 'rejected'
    )),
    provider TEXT NOT NULL,
    provider_message_id TEXT,
    recipient_email TEXT NOT NULL,
    sender_email TEXT,
    subject TEXT,
    template_id UUID REFERENCES email_templates(id),
    last_update TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft')),
    complained_at TIMESTAMPTZ,
    complaint_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_delivery_events table for detailed tracking
CREATE TABLE IF NOT EXISTS email_delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES email_deliveries(id),
    timestamp TIMESTAMPTZ DEFAULT now(),
    event TEXT NOT NULL,
    provider TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS email_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    provider TEXT NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_complained INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    delivery_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_email_analytics_date_provider UNIQUE (date, provider)
);

-- Create email_suppression_list table
CREATE TABLE IF NOT EXISTS email_suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('bounced', 'complained', 'unsubscribed', 'manual')),
    provider TEXT,
    provider_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- For temporary suppressions
    created_by TEXT DEFAULT 'system',

    CONSTRAINT unique_email_suppression UNIQUE (email, reason)
);

-- Create email_rate_limits table
CREATE TABLE IF NOT EXISTS email_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    requests_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_rate_limit_window UNIQUE (provider, window_start, window_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry ON email_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_provider ON email_deliveries(provider);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient ON email_deliveries(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at ON email_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_template_id ON email_deliveries(template_id);

CREATE INDEX IF NOT EXISTS idx_email_delivery_events_email_id ON email_delivery_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_events_timestamp ON email_delivery_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_delivery_events_event ON email_delivery_events(event);

CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics(date);
CREATE INDEX IF NOT EXISTS idx_email_analytics_provider ON email_analytics(provider);

CREATE INDEX IF NOT EXISTS idx_email_suppression_email ON email_suppression_list(email);
CREATE INDEX IF NOT EXISTS idx_email_suppression_reason ON email_suppression_list(reason);
CREATE INDEX IF NOT EXISTS idx_email_suppression_expires_at ON email_suppression_list(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_rate_limits_provider ON email_rate_limits(provider);
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_window ON email_rate_limits(window_start, window_end);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to email data" ON email_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to email queue" ON email_queue
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to email deliveries" ON email_deliveries
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to delivery events" ON email_delivery_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role read access to analytics" ON email_analytics
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Service role full access to suppression list" ON email_suppression_list
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to rate limits" ON email_rate_limits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_deliveries_updated_at
    BEFORE UPDATE ON email_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_analytics_updated_at
    BEFORE UPDATE ON email_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update email analytics
CREATE OR REPLACE FUNCTION update_email_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when email status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO email_analytics (
            date,
            provider,
            total_sent,
            total_delivered,
            total_bounced,
            total_complained,
            delivery_rate,
            bounce_rate
        )
        VALUES (
            CURRENT_DATE,
            NEW.provider,
            CASE WHEN NEW.status IN ('sent', 'delivered', 'bounced', 'complained') THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'bounced' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'complained' THEN 1 ELSE 0 END,
            0, -- Will be updated below
            0   -- Will be updated below
        )
        ON CONFLICT (date, provider)
        DO UPDATE SET
            total_sent = email_analytics.total_sent +
                CASE WHEN NEW.status IN ('sent', 'delivered', 'bounced', 'complained') THEN 1 ELSE 0 END,
            total_delivered = email_analytics.total_delivered +
                CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
            total_bounced = email_analytics.total_bounced +
                CASE WHEN NEW.status = 'bounced' THEN 1 ELSE 0 END,
            total_complained = email_analytics.total_complained +
                CASE WHEN NEW.status = 'complained' THEN 1 ELSE 0 END,
            delivery_rate = CASE
                WHEN email_analytics.total_sent > 0 THEN
                    (email_analytics.total_delivered::DECIMAL / email_analytics.total_sent) * 100
                ELSE 0
            END,
            bounce_rate = CASE
                WHEN email_analytics.total_sent > 0 THEN
                    (email_analytics.total_bounced::DECIMAL / email_analytics.total_sent) * 100
                ELSE 0
            END,
            updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics updates
CREATE TRIGGER trigger_update_email_analytics
    AFTER UPDATE ON email_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_email_analytics();

-- Create function to check email suppression
CREATE OR REPLACE FUNCTION is_email_suppressed(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM email_suppression_list
        WHERE email = email_address
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to add email to suppression list
CREATE OR REPLACE FUNCTION add_email_suppression(
    email_address TEXT,
    suppression_reason TEXT,
    provider TEXT DEFAULT NULL,
    expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    suppression_id UUID;
BEGIN
    INSERT INTO email_suppression_list (
        email,
        reason,
        provider,
        expires_at
    )
    VALUES (
        email_address,
        suppression_reason,
        provider,
        expires_at
    )
    ON CONFLICT (email, reason) DO UPDATE SET
        provider = COALESCE(EXCLUDED.provider, email_suppression_list.provider),
        expires_at = COALESCE(EXCLUDED.expires_at, email_suppression_list.expires_at),
        updated_at = now()
    RETURNING id INTO suppression_id;

    RETURN suppression_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get email queue statistics
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
    queued_count BIGINT,
    sent_count BIGINT,
    failed_count BIGINT,
    oldest_queued TIMESTAMPTZ,
    next_retry_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM email_queue WHERE status = 'queued')::BIGINT,
        (SELECT COUNT(*) FROM email_queue WHERE status = 'sent')::BIGINT,
        (SELECT COUNT(*) FROM email_queue WHERE status = 'failed')::BIGINT,
        (SELECT MIN(scheduled_for) FROM email_queue WHERE status = 'queued'),
        (SELECT COUNT(*) FROM email_queue WHERE next_retry_at <= now() AND status = 'queued')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Create view for email dashboard
CREATE OR REPLACE VIEW email_dashboard AS
SELECT
    DATE(ed.created_at) as date,
    ed.provider,
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE ed.status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE ed.status = 'bounced') as bounced,
    COUNT(*) FILTER (WHERE ed.status = 'complained') as complained,
    COUNT(*) FILTER (WHERE ed.status = 'sent') as sent,
    COALESCE(SUM(
        CASE WHEN ede.event = 'opened' THEN 1 ELSE 0 END
    ), 0) as opens,
    COALESCE(SUM(
        CASE WHEN ede.event = 'clicked' THEN 1 ELSE 0 END
    ), 0) as clicks
FROM email_deliveries ed
LEFT JOIN email_delivery_events ede ON ede.email_id = ed.id
WHERE ed.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(ed.created_at), ed.provider
ORDER BY date DESC, provider;

-- Grant permissions
GRANT ALL ON email_templates TO service_role;
GRANT ALL ON email_queue TO service_role;
GRANT ALL ON email_deliveries TO service_role;
GRANT ALL ON email_delivery_events TO service_role;
GRANT SELECT ON email_analytics TO service_role;
GRANT ALL ON email_suppression_list TO service_role;
GRANT ALL ON email_rate_limits TO service_role;

GRANT EXECUTE ON FUNCTION is_email_suppressed TO service_role;
GRANT EXECUTE ON FUNCTION add_email_suppression TO service_role;
GRANT EXECUTE ON FUNCTION get_email_queue_stats TO service_role;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html, text, category) VALUES
    (
        'booking_confirmation',
        'Booking Confirmation - Mariia Beauty',
        '<h1>Booking Confirmed</h1><p>Dear {{name}},</p><p>Your appointment has been confirmed for {{date}} at {{time}}.</p>',
        'Booking Confirmed\n\nDear {{name}},\n\nYour appointment has been confirmed for {{date}} at {{time}}.',
        'booking'
    ),
    (
        'booking_reminder',
        'Appointment Reminder - Mariia Beauty',
        '<h1>Appointment Reminder</h1><p>Hi {{name}},</p><p>This is a reminder about your appointment tomorrow at {{time}}.</p>',
        'Appointment Reminder\n\nHi {{name}},\n\nThis is a reminder about your appointment tomorrow at {{time}}.',
        'booking'
    ),
    (
        'welcome_email',
        'Welcome to Mariia Beauty!',
        '<h1>Welcome {{name}}!</h1><p>Thank you for joining Mariia Beauty. We''re excited to have you with us.</p>',
        'Welcome {{name}}!\n\nThank you for joining Mariia Beauty. We''re excited to have you with us.',
        'onboarding'
    )
ON CONFLICT (name) DO NOTHING;