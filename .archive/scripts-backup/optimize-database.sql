-- Database Optimization Script for Mariia Hub
-- Run this script to optimize database performance

-- 1. Create indexes for frequently queried columns
-- ==============================================

-- Services table optimization
CREATE INDEX IF NOT EXISTS idx_services_type_status ON services(type, status);
CREATE INDEX IF NOT EXISTS idx_services_price_range ON services(price) WHERE price > 0;
CREATE INDEX IF NOT EXISTS idx_services_category ON services USING GIN (category);
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN (to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_services_popularity ON services(popularity_score DESC);

-- Bookings table optimization
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service_date ON bookings(service_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(booking_date, time_slot)
  WHERE status IN ('confirmed', 'pending');
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status, status);

-- Availability slots optimization
CREATE INDEX IF NOT EXISTS idx_availability_service_date ON availability_slots(service_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_date_range ON availability_slots(date, start_time)
  WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_availability_resource_date ON availability_slots(resource_id, date);

-- Users/Profiles optimization
CREATE INDEX IF NOT EXISTS idx_profiles_created_on ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preferences_mode ON user_preferences(preferred_mode);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id, timestamp DESC);

-- Content tables optimization
CREATE INDEX IF NOT EXISTS idx_service_gallery_order ON service_gallery(service_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_date ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_service_order ON service_faqs(service_id, order_index);

-- 2. Create partial indexes for common query patterns
-- =================================================

-- Active services only
CREATE INDEX IF NOT EXISTS idx_services_active ON services(id)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Recent bookings
CREATE INDEX IF NOT EXISTS idx_bookings_recent ON bookings(id)
  WHERE created_at > NOW() - INTERVAL '30 days';

-- Available slots
CREATE INDEX IF NOT EXISTS idx_slots_available_future ON availability_slots(id)
  WHERE is_available = true AND date >= CURRENT_DATE;

-- 3. Optimize table structures
-- ============================

-- Update table statistics for better query planning
ANALYZE services;
ANALYZE bookings;
ANALYZE availability_slots;
ANALYZE profiles;
ANALYZE analytics;

-- 4. Create optimized views
-- =========================

-- View for active services with ratings
CREATE OR REPLACE VIEW active_services AS
SELECT
  s.*,
  COALESCE(AVG(br.rating), 0) as average_rating,
  COUNT(br.id) as review_count
FROM services s
LEFT JOIN booking_reviews br ON s.id = br.service_id
WHERE s.status = 'active'
  AND s.deleted_at IS NULL
GROUP BY s.id;

-- View for booking statistics
CREATE OR REPLACE VIEW booking_stats AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
  AVG(total_amount) as average_booking_value
FROM bookings
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View for service availability summary
CREATE OR REPLACE VIEW service_availability AS
SELECT
  s.id as service_id,
  s.title,
  COUNT(CASE WHEN aslots.is_available = true AND aslots.date >= CURRENT_DATE THEN 1 END) as available_slots,
  COUNT(CASE WHEN aslots.is_available = false AND aslots.date >= CURRENT_DATE THEN 1 END) as booked_slots,
  MIN(aslots.date) as next_available_date
FROM services s
LEFT JOIN availability_slots aslots ON s.id = aslots.service_id
WHERE s.status = 'active'
GROUP BY s.id, s.title;

-- 5. Create materialized views for complex queries
-- ================================================

-- Materialized view for popular services (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_services AS
SELECT
  s.id,
  s.title,
  s.type,
  s.price,
  s.category,
  COUNT(b.id) as booking_count,
  COALESCE(AVG(br.rating), 0) as average_rating,
  COUNT(br.id) as review_count,
  (COUNT(b.id) * 0.7 + COALESCE(AVG(br.rating), 0) * 100 * 0.3) as popularity_score
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id
  AND b.created_at >= NOW() - INTERVAL '90 days'
  AND b.status = 'confirmed'
LEFT JOIN booking_reviews br ON s.id = br.service_id
WHERE s.status = 'active' AND s.deleted_at IS NULL
GROUP BY s.id, s.title, s.type, s.price, s.category
ORDER BY popularity_score DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_services_id ON popular_services(id);

-- 6. Create function to refresh materialized views
-- ================================================

CREATE OR REPLACE FUNCTION refresh_popular_services()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_services;
END;
$$ LANGUAGE plpgsql;

-- 7. Optimize configuration settings
-- ==================================

-- Increase work_mem for complex queries (per session)
-- SET work_mem = '256MB';

-- Increase maintenance_work_mem for index creation (per session)
-- SET maintenance_work_mem = '1GB';

-- Enable parallel query processing
-- SET max_parallel_workers_per_gather = 4;

-- 8. Create optimized queries as functions
-- =======================================

-- Function to get available time slots efficiently
CREATE OR REPLACE FUNCTION get_available_slots(
  p_service_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  time_slot TIME,
  available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aslots.date,
    aslots.start_time as time_slot,
    aslots.is_available as available
  FROM availability_slots aslots
  WHERE aslots.service_id = p_service_id
    AND aslots.date BETWEEN p_start_date AND p_end_date
    AND aslots.is_available = true
    AND NOT EXISTS (
      SELECT 1
      FROM holds h
      WHERE h.slot_id = aslots.id
        AND h.expires_at > NOW()
    )
  ORDER BY aslots.date, aslots.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check booking conflicts efficiently
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_service_id UUID,
  p_date DATE,
  p_time_slot TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM bookings b
  WHERE b.service_id = p_service_id
    AND b.booking_date = p_date
    AND b.time_slot = p_time_slot
    AND b.status IN ('confirmed', 'pending');

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Create triggers for automatic optimization
-- =============================================

-- Trigger to update service popularity score
CREATE OR REPLACE FUNCTION update_service_popularity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE services
    SET popularity_score = popularity_score + 1,
        updated_at = NOW()
    WHERE id = NEW.service_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_popularity
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_service_popularity();

-- 10. Partitioning strategy for large tables
-- ===========================================

-- Consider partitioning bookings by date if table grows large
/*
CREATE TABLE bookings_partitioned (
  LIKE bookings INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE bookings_2025_01 PARTITION OF bookings_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE bookings_2025_02 PARTITION OF bookings_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
*/

-- 11. Create scheduled jobs for maintenance
-- =========================================

-- Job to refresh materialized views (requires pg_cron extension)
/*
SELECT cron.schedule(
  'refresh-popular-services',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT refresh_popular_services();'
);
*/

-- Job to cleanup old sessions
/*
SELECT cron.schedule(
  'cleanup-sessions',
  '0 3 * * *', -- Daily at 3 AM
  'DELETE FROM analytics WHERE timestamp < NOW() - INTERVAL ''90 days'';'
);
*/

-- 12. Performance monitoring queries
-- ===================================

-- Query to identify slow queries
/*
SELECT
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
*/

-- Query to check index usage
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/

-- Query to identify missing indexes
/*
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('services', 'bookings', 'availability_slots')
ORDER BY tablename, attname;
*/

COMMIT;

-- Run vacuum analyze to update statistics
VACUUM ANALYZE;

-- Report optimization results
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE 'Database optimization completed. Total indexes: %', index_count;
END $$;