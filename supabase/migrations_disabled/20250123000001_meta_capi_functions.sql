-- Meta Conversions API Functions
-- Additional functions to support the enhanced CAPI implementation

-- Function to increment retry count
CREATE OR REPLACE FUNCTION increment_retry_count(event_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    UPDATE meta_conversions
    SET retry_count = retry_count + 1,
        last_retry_at = NOW()
    WHERE event_id = increment_retry_count.event_id
    RETURNING retry_count INTO current_count;

    RETURN COALESCE(current_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old conversion events
CREATE OR REPLACE FUNCTION cleanup_old_conversions(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM meta_conversions
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND status IN ('sent', 'failed');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversion analytics
CREATE OR REPLACE FUNCTION get_conversion_analytics(
    start_date DATE DEFAULT NOW() - INTERVAL '30 days',
    end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
    event_name TEXT,
    total_events BIGINT,
    successful_events BIGINT,
    failed_events BIGINT,
    total_conversion_value DECIMAL,
    average_conversion_value DECIMAL,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.event_name,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE mc.status = 'sent') as successful_events,
        COUNT(*) FILTER (WHERE mc.status = 'failed') as failed_events,
        COALESCE(SUM(mc.conversion_value), 0) as total_conversion_value,
        COALESCE(AVG(mc.conversion_value), 0) as average_conversion_value,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND(COUNT(*) FILTER (WHERE mc.status = 'sent')::DECIMAL / COUNT(*) * 100, 2)
            ELSE 0
        END as success_rate
    FROM meta_conversions mc
    WHERE DATE(mc.created_at) BETWEEN start_date AND end_date
    GROUP BY mc.event_name
    ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily conversion trends
CREATE OR REPLACE FUNCTION get_daily_conversion_trends(
    start_date DATE DEFAULT NOW() - INTERVAL '7 days',
    end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
    event_date DATE,
    total_events BIGINT,
    successful_events BIGINT,
    total_conversion_value DECIMAL,
    unique_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(mc.created_at) as event_date,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE mc.status = 'sent') as successful_events,
        COALESCE(SUM(mc.conversion_value), 0) as total_conversion_value,
        COUNT(DISTINCT mc.event_id) as unique_events
    FROM meta_conversions mc
    WHERE DATE(mc.created_at) BETWEEN start_date AND end_date
    GROUP BY DATE(mc.created_at)
    ORDER BY event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversion funnels
CREATE OR REPLACE FUNCTION get_conversion_funnel()
RETURNS TABLE (
    event_name TEXT,
    event_count BIGINT,
    conversion_rate DECIMAL,
    drop_off_rate DECIMAL,
    avg_time_to_conversion_minutes DECIMAL
) AS $$
DECLARE
    total_pageviews BIGINT;
    previous_step BIGINT := 0;
BEGIN
    -- Get total pageviews as baseline
    SELECT COUNT(*) INTO total_pageviews
    FROM meta_conversions
    WHERE event_name = 'PageView'
    AND created_at >= NOW() - INTERVAL '30 days';

    RETURN QUERY
    WITH funnel_steps AS (
        SELECT
            event_name,
            COUNT(*) as event_count,
            MIN(event_time) as min_event_time,
            MAX(event_time) as max_event_time
        FROM meta_conversions
        WHERE created_at >= NOW() - INTERVAL '30 days'
        AND event_name IN ('PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase')
        GROUP BY event_name
    ),
    step_ordering AS (
        SELECT
            event_name,
            event_count,
            CASE event_name
                WHEN 'PageView' THEN 1
                WHEN 'ViewContent' THEN 2
                WHEN 'AddToCart' THEN 3
                WHEN 'InitiateCheckout' THEN 4
                WHEN 'Purchase' THEN 5
            END as step_order
        FROM funnel_steps
    )
    SELECT
        so.event_name,
        so.event_count,
        CASE
            WHEN total_pageviews > 0 THEN
                ROUND(so.event_count::DECIMAL / total_pageviews * 100, 2)
            ELSE 0
        END as conversion_rate,
        CASE
            WHEN previous_step > 0 THEN
                ROUND((previous_step - so.event_count)::DECIMAL / previous_step * 100, 2)
            ELSE 0
        END as drop_off_rate,
        CASE
            WHEN fs.event_count > 0 THEN
                ROUND((fs.max_event_time - fs.min_event_time)::DECIMAL / 60, 2)
            ELSE 0
        END as avg_time_to_conversion_minutes
    FROM step_ordering so
    JOIN funnel_steps fs ON so.event_name = fs.event_name
    ORDER BY so.step_order;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed events
CREATE OR REPLACE FUNCTION retry_failed_events(max_retries INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
    retried_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Update failed events to 'retry' status
    UPDATE meta_conversions
    SET status = 'retry',
        retry_count = retry_count + 1,
        last_retry_at = NOW()
    WHERE status = 'failed'
    AND retry_count < max_retries;

    GET DIAGNOSTICS retried_count = ROW_COUNT;

    RETURN retried_count;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meta_conversions_event_name_created_at
ON meta_conversions(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_conversions_status_created_at
ON meta_conversions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_conversions_event_id
ON meta_conversions(event_id);

CREATE INDEX IF NOT EXISTS idx_meta_pixel_events_pixel_id_created_at
ON meta_pixel_events(pixel_id, created_at DESC);

-- Enable Row Level Security for additional tables if needed
ALTER TABLE meta_pixel_events ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_retry_count TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_conversions TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_conversion_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION retry_failed_events TO authenticated;

GRANT SELECT ON meta_conversions TO authenticated;
GRANT INSERT ON meta_conversions TO authenticated;
GRANT UPDATE ON meta_conversions TO authenticated;

GRANT SELECT ON meta_pixel_events TO authenticated;
GRANT INSERT ON meta_pixel_events TO authenticated;