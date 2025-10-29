-- Analytics Batching System Migration
-- Tables for storing analytics events with batching and offline support

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    user_id UUID,
    session_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    provider TEXT DEFAULT 'custom',
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_failed_events table
CREATE TABLE IF NOT EXISTS analytics_failed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE,
    event TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_batches table
CREATE TABLE IF NOT EXISTS analytics_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_count INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    events JSONB NOT NULL,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID,
    started_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_funnel table
CREATE TABLE IF NOT EXISTS analytics_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_name TEXT NOT NULL,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    user_id UUID,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    properties JSONB DEFAULT '{}',
    conversion_time_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_cohorts table
CREATE TABLE IF NOT EXISTS analytics_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_name TEXT NOT NULL,
    cohort_date DATE NOT NULL,
    user_count INTEGER NOT NULL,
    retention_data JSONB DEFAULT '{}', -- {day1: 0.8, day7: 0.6, day30: 0.4}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_cohort_name_date UNIQUE (cohort_name, cohort_date)
);

-- Create analytics_real_time table for recent events
CREATE TABLE IF NOT EXISTS analytics_real_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    user_id UUID,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_provider ON analytics_events(provider);
CREATE INDEX IF NOT EXISTS idx_analytics_events_processed ON analytics_events(processed);

CREATE INDEX IF NOT EXISTS idx_analytics_failed_events_retry ON analytics_failed_events(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_analytics_failed_events_created ON analytics_failed_events(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_batches_provider ON analytics_batches(provider);
CREATE INDEX IF NOT EXISTS idx_analytics_batches_status ON analytics_batches(status);
CREATE INDEX IF NOT EXISTS idx_analytics_batches_created ON analytics_batches(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_analytics_funnel_funnel_step ON analytics_funnel(funnel_name, step_order);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_user_id ON analytics_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_timestamp ON analytics_funnel(timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_cohorts_date ON analytics_cohorts(cohort_date);
CREATE INDEX IF NOT EXISTS idx_analytics_cohorts_name ON analytics_cohorts(cohort_name);

CREATE INDEX IF NOT EXISTS idx_analytics_real_time_timestamp ON analytics_real_time(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_real_time_event ON analytics_real_time(event);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_failed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_real_time ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to analytics" ON analytics_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to failed events" ON analytics_failed_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to batches" ON analytics_batches
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to sessions" ON analytics_sessions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to funnel" ON analytics_funnel
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role read access to cohorts" ON analytics_cohorts
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Service role read access to real-time" ON analytics_real_time
    FOR SELECT TO service_role
    USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_analytics_events_updated_at
    BEFORE UPDATE ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_failed_events_updated_at
    BEFORE UPDATE ON analytics_failed_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_batches_updated_at
    BEFORE UPDATE ON analytics_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_sessions_updated_at
    BEFORE UPDATE ON analytics_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_cohorts_updated_at
    BEFORE UPDATE ON analytics_cohorts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to process analytics batches
CREATE OR REPLACE FUNCTION process_analytics_batch(
    batch_id UUID,
    provider TEXT DEFAULT 'custom'
)
RETURNS BOOLEAN AS $$
DECLARE
    batch_record analytics_batches%ROWTYPE;
    events_json JSONB;
BEGIN
    -- Get batch record
    SELECT * INTO batch_record
    FROM analytics_batches
    WHERE id = batch_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Batch not found: %', batch_id;
    END IF;

    -- Update status to processing
    UPDATE analytics_batches
    SET status = 'processing', updated_at = now()
    WHERE id = batch_id;

    -- Process events based on provider
    CASE provider
        WHEN 'ga4' THEN
            -- Send to Google Analytics
            PERFORM send_to_google_analytics(batch_record.events);
        WHEN 'meta' THEN
            -- Send to Meta Conversions API
            PERFORM send_to_meta_conversions(batch_record.events);
        ELSE
            -- Store in our analytics_events table
            INSERT INTO analytics_events (
                id,
                event,
                properties,
                user_id,
                session_id,
                timestamp,
                provider,
                processed
            )
            SELECT
                (event_data->>'id')::UUID,
                event_data->>'event',
                event_data->'properties',
                (event_data->>'user_id')::UUID,
                event_data->>'session_id',
                (event_data->>'timestamp')::TIMESTAMPTZ,
                provider,
                true
            FROM jsonb_array_elements(batch_record.events) AS event_data;
    END CASE;

    -- Update batch status
    UPDATE analytics_batches
    SET
        status = 'sent',
        sent_at = now(),
        updated_at = now()
    WHERE id = batch_id;

    -- Update real-time table
    INSERT INTO analytics_real_time (event, user_id, session_id, timestamp, properties)
    SELECT
        event_data->>'event',
        (event_data->>'user_id')::UUID,
        event_data->>'session_id',
        (event_data->>'timestamp')::TIMESTAMPTZ,
        event_data->'properties'
    FROM jsonb_array_elements(batch_record.events) AS event_data;

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    -- Handle failure
    UPDATE analytics_batches
    SET
        status = 'failed',
        error_message = SQLERRM,
        retry_count = retry_count + 1,
        next_retry_at = now() + (retry_count + 1) * INTERVAL '1 minute',
        updated_at = now()
    WHERE id = batch_id;

    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old analytics data
CREATE OR REPLACE FUNCTION cleanup_analytics_data(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := now() - (days_to_keep || ' days')::INTERVAL;

    -- Delete old events
    DELETE FROM analytics_events
    WHERE created_at < cutoff_date;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete old failed events
    DELETE FROM analytics_failed_events
    WHERE created_at < cutoff_date;

    -- Delete old batches
    DELETE FROM analytics_batches
    WHERE created_at < cutoff_date AND status = 'sent';

    -- Delete old real-time events
    DELETE FROM analytics_real_time
    WHERE created_at < cutoff_date - INTERVAL '7 days'; -- Keep real-time for 7 days only

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to track funnel steps
CREATE OR REPLACE FUNCTION track_funnel_step(
    p_funnel_name TEXT,
    p_step_name TEXT,
    p_step_order INTEGER,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_properties JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    previous_step analytics_funnel%ROWTYPE;
    conversion_time INTEGER;
BEGIN
    -- Get previous step for this user/session
    SELECT * INTO previous_step
    FROM analytics_funnel
    WHERE funnel_name = p_funnel_name
    AND (user_id = p_user_id OR session_id = p_session_id)
    ORDER BY step_order DESC, timestamp DESC
    LIMIT 1;

    -- Calculate conversion time
    IF previous_step IS NOT NULL THEN
        conversion_time := EXTRACT(EPOCH FROM (now() - previous_step.timestamp))::INTEGER;
    END IF;

    -- Insert funnel step
    INSERT INTO analytics_funnel (
        funnel_name,
        step_name,
        step_order,
        user_id,
        session_id,
        properties,
        conversion_time_seconds
    )
    VALUES (
        p_funnel_name,
        p_step_name,
        p_step_order,
        p_user_id,
        p_session_id,
        p_properties,
        conversion_time
    )
    RETURNING id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create view for analytics dashboard
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT
    DATE(timestamp) as date,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE event = 'page_view') as page_views,
    COUNT(*) FILTER (WHERE event = 'booking_completed') as bookings,
    COUNT(*) FILTER (WHERE event = 'purchase') as purchases,
    AVG(EXTRACT(EPOCH FROM (
        SELECT MAX(timestamp) - MIN(timestamp)
        FROM analytics_sessions s
        WHERE s.session_id = analytics_events.session_id
    )))::INTEGER as avg_session_duration_seconds
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Create view for funnel analysis
CREATE OR REPLACE VIEW booking_funnel_analysis AS
WITH funnel_steps AS (
    SELECT
        step_name,
        step_order,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_events,
        AVG(conversion_time_seconds) as avg_conversion_time
    FROM analytics_funnel
    WHERE funnel_name = 'booking_funnel'
    GROUP BY step_name, step_order
),
conversion_rates AS (
    SELECT
        fs.step_name,
        fs.step_order,
        fs.unique_users,
        fs.unique_sessions,
        fs.total_events,
        fs.avg_conversion_time,
        LAG(fs.unique_users) OVER (ORDER BY fs.step_order) as previous_users,
        CASE
            WHEN LAG(fs.unique_users) OVER (ORDER BY fs.step_order) > 0 THEN
                (fs.unique_users::DECIMAL / LAG(fs.unique_users) OVER (ORDER BY fs.step_order)) * 100
            ELSE NULL
        END as conversion_rate_percent
    FROM funnel_steps fs
)
SELECT
    step_name,
    step_order,
    unique_users,
    unique_sessions,
    total_events,
    avg_conversion_time,
    previous_users,
    conversion_rate_percent
FROM conversion_rates
ORDER BY step_order;

-- Grant permissions
GRANT ALL ON analytics_events TO service_role;
GRANT ALL ON analytics_failed_events TO service_role;
GRANT ALL ON analytics_batches TO service_role;
GRANT ALL ON analytics_sessions TO service_role;
GRANT ALL ON analytics_funnel TO service_role;
GRANT SELECT ON analytics_cohorts TO service_role;
GRANT SELECT ON analytics_real_time TO service_role;

GRANT EXECUTE ON FUNCTION process_analytics_batch TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_analytics_data TO service_role;
GRANT EXECUTE ON FUNCTION track_funnel_step TO service_role;

-- Create scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_analytics_data(90);');

-- Create materialized view for fast analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_events_summary AS
SELECT
    DATE(timestamp) as date,
    event,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE processed = true
GROUP BY DATE(timestamp), event;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_events_summary_unique
ON analytics_events_summary (date, event);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_events_summary;
END;
$$ LANGUAGE plpgsql;