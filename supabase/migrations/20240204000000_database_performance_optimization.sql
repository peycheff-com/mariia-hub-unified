-- Database Performance Optimization Migration
-- Comprehensive optimization for high-concurrency booking system
-- Targets sub-100ms response times for critical queries

-- ========================================
-- ADVANCED INDEXING STRATEGY
-- ========================================

-- Composite indexes for critical booking queries
-- Index for availability checking with location and service type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_slots_composite
ON availability_slots (service_id, date, is_available, start_time)
WHERE is_available = true;

-- Index for booking queries by user and status (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_status_date
ON bookings (user_id, status, booking_date DESC)
WHERE status IN ('pending', 'confirmed', 'completed');

-- Index for service listing with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active_type_category
ON services (is_active, service_type, category, price)
WHERE is_active = true;

-- Optimized indexes for time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_time_status
ON bookings (booking_date, start_time, status)
WHERE booking_date >= CURRENT_DATE;

-- Index for holds cleanup (expires_at queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_holds_expires_at_cleanup
ON holds (expires_at)
WHERE expires_at < NOW();

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_public_rating
ON reviews (service_id, rating DESC, is_public)
WHERE is_public = true AND is_verified = true;

-- Index for booking drafts with session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_drafts_session_expires
ON booking_drafts (session_id, expires_at)
WHERE expires_at > NOW();

-- Service gallery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_gallery_active_order
ON service_gallery (service_id, is_active, order_index)
WHERE is_active = true;

-- ========================================
-- PARTITIONING STRATEGY FOR HIGH-VOLUME TABLES
-- ========================================

-- Partition bookings table by date for better performance
-- Note: This requires recreating the table, so we'll use a view approach for now

-- Create a materialized view for recent bookings (last 90 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_recent_bookings AS
SELECT * FROM bookings
WHERE booking_date >= CURRENT_DATE - INTERVAL '90 days'
WITH DATA;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_recent_bookings_id
ON mv_recent_bookings (id);

-- Create indexes for common queries on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_recent_bookings_user_status
ON mv_recent_bookings (user_id, status, booking_date DESC);

-- Create materialized view for active services
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_services AS
SELECT
  s.*,
  COUNT(DISTINCT b.id) as booking_count,
  AVG(r.rating) as avg_rating
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
LEFT JOIN reviews r ON s.id = r.service_id AND r.is_public = true
WHERE s.is_active = true
GROUP BY s.id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_services_id
ON mv_active_services (id);

-- ========================================
-- PERFORMANCE FUNCTIONS AND STORED PROCEDURES
-- ========================================

-- Optimized availability checking function
CREATE OR REPLACE FUNCTION check_availability_optimized(
  p_service_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_location_type location_type DEFAULT NULL
)
RETURNS TABLE (
  slot_id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  capacity INTEGER,
  current_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aslot.id,
    aslot.date,
    aslot.start_time,
    aslot.end_time,
    aslot.is_available,
    aslot.capacity,
    COALESCE(bcount.booking_count, 0) as current_bookings
  FROM availability_slots aslot
  LEFT JOIN (
    SELECT
      b.booking_date,
      b.start_time,
      COUNT(*) as booking_count
    FROM bookings b
    WHERE b.status IN ('confirmed', 'pending')
      AND b.booking_date BETWEEN p_start_date AND p_end_date
      AND b.service_id = p_service_id
    GROUP BY b.booking_date, b.start_time
  ) bcount ON aslot.date = bcount.booking_date AND aslot.start_time = bcount.start_time
  WHERE aslot.service_id = p_service_id
    AND aslot.date BETWEEN p_start_date AND p_end_date
    AND aslot.is_available = true
    AND (p_location_type IS NULL OR aslot.location_type = p_location_type)
    AND (aslot.capacity > COALESCE(bcount.booking_count, 0))
  ORDER BY aslot.date, aslot.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized booking creation function with conflict prevention
CREATE OR REPLACE FUNCTION create_booking_optimized(
  p_service_id UUID,
  p_user_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT DEFAULT NULL,
  p_total_amount DECIMAL(10,2),
  p_currency TEXT DEFAULT 'PLN',
  p_notes TEXT DEFAULT NULL,
  p_preferences JSONB DEFAULT '{}'
)
RETURNS TABLE (
  booking_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_slot_available BOOLEAN;
  v_current_bookings INTEGER;
  v_capacity INTEGER;
  v_new_booking_id UUID;
  v_hold_expires_at TIMESTAMPTZ;
BEGIN
  -- Check slot availability with proper locking
  SELECT
    aslot.capacity,
    COUNT(b.id) as current_bookings,
    (aslot.capacity - COUNT(b.id)) > 0 as is_available
  INTO v_capacity, v_current_bookings, v_slot_available
  FROM availability_slots aslot
  LEFT JOIN bookings b ON aslot.date = b.booking_date
    AND aslot.start_time = b.start_time
    AND aslot.service_id = b.service_id
    AND b.status IN ('confirmed', 'pending')
  WHERE aslot.service_id = p_service_id
    AND aslot.date = p_booking_date
    AND aslot.start_time = p_start_time
    AND aslot.is_available = true
  GROUP BY aslot.capacity
  FOR UPDATE OF aslot;

  -- Check if slot is available
  IF NOT FOUND OR NOT v_slot_available THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Time slot is no longer available'::TEXT;
    RETURN;
  END IF;

  -- Create the booking
  INSERT INTO bookings (
    service_id, user_id, booking_date, start_time, end_time,
    client_name, client_email, client_phone, total_amount, currency,
    notes, preferences, status, payment_status
  ) VALUES (
    p_service_id, p_user_id, p_booking_date, p_start_time, p_end_time,
    p_client_name, p_client_email, p_client_phone, p_total_amount, p_currency,
    p_notes, p_preferences, 'pending', 'pending'
  ) RETURNING id INTO v_new_booking_id;

  RETURN QUERY SELECT v_new_booking_id, true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk cleanup function for expired holds and drafts
CREATE OR REPLACE FUNCTION cleanup_expired_entities()
RETURNS TABLE (
  expired_holds_count INTEGER,
  expired_drafts_count INTEGER,
  slots_recovered INTEGER
) AS $$
DECLARE
  v_expired_holds INTEGER;
  v_expired_drafts INTEGER;
  v_slots_recovered INTEGER;
BEGIN
  -- Clean up expired holds and update slots
  WITH expired_holds_data AS (
    SELECT h.id, h.time_slot_id
    FROM holds h
    WHERE h.expires_at < NOW()
  )
  UPDATE availability_slots
  SET status = 'available', updated_at = NOW()
  WHERE id IN (SELECT DISTINCT time_slot_id FROM expired_holds_data)
  AND status = 'held';

  GET DIAGNOSTICS v_slots_recovered = ROW_COUNT;

  -- Delete expired holds
  DELETE FROM holds WHERE expires_at < NOW();
  GET DIAGNOSTICS v_expired_holds = ROW_COUNT;

  -- Delete expired drafts
  DELETE FROM booking_drafts WHERE expires_at < NOW();
  GET DIAGNOSTICS v_expired_drafts = ROW_COUNT;

  RETURN QUERY SELECT v_expired_holds, v_expired_drafts, v_slots_recovered;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring function
CREATE OR REPLACE FUNCTION get_booking_performance_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date_bucket DATE,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  avg_booking_time_ms NUMERIC,
  peak_hour INTEGER,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(b.booking_date) as date_bucket,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
    AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)) * 1000) as avg_booking_time_ms,
    EXTRACT(HOUR FROM b.created_at) as peak_hour,
    CASE
      WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE b.status = 'confirmed')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM bookings b
  WHERE b.booking_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  GROUP BY DATE(b.booking_date), EXTRACT(HOUR FROM b.created_at)
  ORDER BY date_bucket, peak_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGER OPTIMIZATIONS
-- ========================================

-- Optimized trigger function for updated_at with better performance
CREATE OR REPLACE FUNCTION update_updated_at_column_optimized()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if other columns actually changed
  IF NEW IS DISTINCT FROM OLD THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply optimized triggers to critical tables
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at_optimized
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_optimized();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at_optimized
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_optimized();

DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at_optimized
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_optimized();

-- ========================================
-- CONNECTION AND SECURITY OPTIMIZATIONS
-- ========================================

-- Optimized RLS policies with better performance
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (
    is_active = true AND
    -- Use indexed columns for better performance
    (service_type IN ('beauty', 'fitness', 'lifestyle'))
  );

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid() OR
    -- Admin override with proper indexing
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    -- Validate booking date is not in the past
    booking_date >= CURRENT_DATE
  );

DROP POLICY IF EXISTS "Users can manage own booking drafts" ON booking_drafts;
CREATE POLICY "Users can manage own booking drafts" ON booking_drafts
  FOR ALL USING (
    session_id = current_setting('app.session_id', true)::TEXT OR
    (user_id = auth.uid() AND user_id IS NOT NULL)
  );

-- ========================================
-- PERFORMANCE MONITORING SETUP
-- ========================================

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  query_time_ms NUMERIC,
  result_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_name_created
ON performance_metrics (metric_name, created_at DESC);

-- Create automated performance monitoring function
CREATE OR REPLACE FUNCTION log_query_performance(
  p_metric_name TEXT,
  p_query_time_ms NUMERIC,
  p_result_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO performance_metrics (metric_name, query_time_ms, result_count, metadata)
  VALUES (p_metric_name, p_query_time_ms, p_result_count, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- REFRESH MATERIALIZED VIEWS SCHEDULE
-- ========================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_bookings;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_services;

  -- Log refresh
  INSERT INTO performance_metrics (metric_name, query_time_ms, result_count, metadata)
  VALUES ('materialized_views_refresh', 0, 2, '{"refreshed_at": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup function (to be called by cron job)
CREATE OR REPLACE FUNCTION scheduled_performance_maintenance()
RETURNS TABLE (
  task TEXT,
  records_processed INTEGER,
  execution_time_ms NUMERIC
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ := NOW();
  v_expired_counts RECORD;
BEGIN
  -- Clean up expired entities
  SELECT * INTO v_expired_counts FROM cleanup_expired_entities();

  -- Log cleanup performance
  RETURN QUERY SELECT
    'cleanup_expired_entities'::TEXT,
    (v_expired_counts.expired_holds_count + v_expired_counts.expired_drafts_count) as records_processed,
    EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000 as execution_time_ms;

  -- Refresh materialized views
  PERFORM refresh_performance_views();

  RETURN QUERY SELECT
    'refresh_materialized_views'::TEXT,
    2 as records_processed,
    EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000 as execution_time_ms;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE ANALYSIS VIEWS
-- ========================================

-- View for slow query analysis
CREATE OR REPLACE VIEW vw_slow_queries AS
SELECT
  metric_name,
  AVG(query_time_ms) as avg_time_ms,
  MAX(query_time_ms) as max_time_ms,
  COUNT(*) as query_count,
  created_at::DATE as query_date
FROM performance_metrics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY metric_name, created_at::DATE
ORDER BY avg_time_ms DESC;

-- View for booking performance trends
CREATE OR REPLACE VIEW vw_booking_performance_trends AS
SELECT
  date_bucket,
  total_bookings,
  confirmed_bookings,
  ROUND((confirmed_bookings::NUMERIC / NULLIF(total_bookings, 0)) * 100, 2) as confirmation_rate,
  avg_booking_time_ms,
  peak_hour
FROM get_booking_performance_stats(30)
ORDER BY date_bucket DESC;

-- Grant necessary permissions
GRANT SELECT ON performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION log_query_performance TO authenticated;
GRANT SELECT ON vw_slow_queries TO authenticated;
GRANT SELECT ON vw_booking_performance_trends TO authenticated;

-- ========================================
-- OPTIMIZATION NOTES
-- ========================================

-- 1. Use CONCURRENTLY for index creation in production
-- 2. Materialized views need to be refreshed regularly
-- 3. Monitor index usage and remove unused indexes
-- 4. Consider table partitioning for very high volume
-- 5. Regular vacuum and analyze are essential
-- 6. Set appropriate work_mem and shared_buffers in postgresql.conf
-- 7. Use connection pooling (PgBouncer) for high concurrency
-- 8. Monitor slow queries using pg_stat_statements

COMMIT;