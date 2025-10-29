-- Database Performance Optimization Script
-- This script consolidates RLS policies, adds indexes, and optimizes queries

-- 1. Create generic RLS function for admin access
CREATE OR REPLACE FUNCTION is_admin_or_owner(user_id_to_check uuid DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is viewing their own data
  IF user_id_to_check IS NOT NULL AND auth.uid() = user_id_to_check THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop duplicate admin policies and replace with generic ones
-- This will be done per table in subsequent migrations

-- 3. Performance indexes
-- Booking performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_service_status_created
ON bookings(service_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_user_status
ON bookings(user_id, status)
WHERE status IN ('confirmed', 'pending');

CREATE INDEX IF NOT EXISTS idx_bookings_date_range
ON bookings(start_time, end_time)
WHERE status = 'confirmed';

-- Availability slots optimization
CREATE INDEX IF NOT EXISTS idx_availability_service_time
ON availability_slots(service_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_availability_status_time
ON availability_slots(status, start_time)
WHERE status = 'available';

-- JSONB indexes for booking patterns
CREATE INDEX IF NOT EXISTS idx_booking_patterns_gin
ON booking_patterns USING GIN (patterns);

CREATE INDEX IF NOT EXISTS idx_booking_patterns_service_date
ON booking_patterns(service_id, date_created);

-- Analytics optimization
CREATE INDEX IF NOT EXISTS idx_analytics_event_type_time
ON analytics(event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_service_time
ON analytics(service_id, timestamp DESC)
WHERE event_type IN ('booking_created', 'booking_completed');

-- Service content optimization
CREATE INDEX IF NOT EXISTS idx_service_content_type
ON service_content(content_type, service_id);

-- 4. Optimize slow triggers with batch processing
CREATE OR REPLACE FUNCTION trigger_update_booking_count_batch()
RETURNS trigger AS $$
BEGIN
  -- Use a materialized view approach for better performance
  REFRESH MATERIALIZED VIEW CONCURRENTLY booking_stats_summary;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    INSERT INTO system_logs (log_type, message, metadata)
    VALUES ('error', 'Failed to update booking count',
            json_build_object('error', SQLERRM, 'booking_id', NEW.id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create materialized view for booking statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS booking_stats_summary AS
SELECT
  s.id as service_id,
  s.title,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_bookings,
  AVG(CASE WHEN b.status = 'completed' THEN
    EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60
  END) as avg_duration_minutes
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id
GROUP BY s.id, s.title;

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_stats_summary_unique
ON booking_stats_summary(service_id);

-- 6. Optimized query cache for dynamic pricing
CREATE OR REPLACE FUNCTION get_cached_price(service_id uuid, date_param date)
RETURNS numeric AS $$
DECLARE
  cached_price pricing_cache.price%TYPE;
BEGIN
  SELECT price INTO cached_price
  FROM pricing_cache
  WHERE service_id = get_cached_price.service_id
    AND valid_from <= date_param
    AND valid_to >= date_param;

  IF cached_price IS NOT NULL THEN
    RETURN cached_price;
  END IF;

  -- Calculate and cache the price
  PERFORM calculate_and_cache_price(service_id, date_param);

  -- Return the newly cached price
  SELECT price INTO cached_price
  FROM pricing_cache
  WHERE service_id = get_cached_price.service_id
    AND valid_from <= date_param
    AND valid_to >= date_param;

  RETURN cached_price;
END;
$$ LANGUAGE plpgsql;

-- 7. Database health check function
CREATE OR REPLACE FUNCTION db_health_check()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
    'slow_queries', (SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000),
    'table_sizes', (
      SELECT json_agg(json_build_object(table_name, pg_size_pretty(pg_total_relation_size(table_name::regclass))))
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      LIMIT 10
    ),
    'index_usage', (
      SELECT json_agg(json_build_object(indexrelname, idx_scan, idx_tup_read, idx_tup_fetch))
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Connection pooling configuration helper
CREATE OR REPLACE FUNCTION get_pool_config()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'pool_size', current_setting('max_connections')::int * 0.75,
    'reserve_connections', 5,
    'connection_timeout', '30s',
    'idle_timeout', '300s',
    'max_lifetime', '3600s'
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Optimized bulk operations
CREATE OR REPLACE FUNCTION bulk_update_booking_status(
  booking_ids uuid[],
  new_status text
)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE bookings
  SET status = bulk_update_booking_status.new_status,
      updated_at = NOW()
  WHERE id = ANY(booking_ids)
    AND status != new_status;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the bulk operation
  INSERT INTO system_logs (log_type, message, metadata)
  VALUES ('info', 'Bulk booking status update',
          json_build_object('count', updated_count, 'new_status', new_status));

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Cleanup old data function
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep integer DEFAULT 90)
RETURNS json AS $$
DECLARE
  result json;
  deleted_audit integer;
  deleted_logs integer;
  deleted_sessions integer;
BEGIN
  -- Clean up old audit logs
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS deleted_audit = ROW_COUNT;

  -- Clean up old system logs
  DELETE FROM system_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;

  -- Clean up expired booking drafts
  DELETE FROM booking_drafts
  WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  result := json_build_object(
    'audit_logs_deleted', deleted_audit,
    'system_logs_deleted', deleted_logs,
    'booking_drafts_deleted', deleted_sessions,
    'cleanup_date', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin_or_owner TO authenticated;
GRANT EXECUTE ON FUNCTION db_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_pool_config TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data TO authenticated;

-- Create indexes for commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_services_category_status
ON services(category, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_role_created
ON profiles(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_availability_slots_created
ON availability_slots(created_at DESC)
WHERE created_at > NOW() - INTERVAL '7 days';

-- Add comments for documentation
COMMENT ON FUNCTION is_admin_or_owner IS 'Generic function to check if user is admin or owner';
COMMENT ON FUNCTION db_health_check IS 'Returns database health metrics';
COMMENT ON FUNCTION cleanup_old_data IS 'Cleans up old audit logs, system logs, and expired sessions';
COMMENT ON MATERIALIZED VIEW booking_stats_summary IS 'Pre-calculated booking statistics for performance';