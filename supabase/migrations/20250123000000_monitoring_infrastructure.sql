-- Comprehensive Monitoring Infrastructure for Mariia Hub
-- This migration creates tables for advanced monitoring, alerting, and analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Monitoring metrics table for time-series data
CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC,
  labels JSONB DEFAULT '{}',
  metric_type TEXT DEFAULT 'gauge' CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_id TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring events table for user behavior tracking
CREATE TABLE IF NOT EXISTS monitoring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_id TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS monitoring_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT,
  error_context JSONB DEFAULT '{}',
  user_impact TEXT DEFAULT 'unknown' CHECK (user_impact IN ('low', 'medium', 'high', 'critical')),
  business_context JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_id TEXT,
  environment TEXT DEFAULT 'production',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS monitoring_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_url TEXT NOT NULL,
  fcp_ms INTEGER, -- First Contentful Paint
  lcp_ms INTEGER, -- Largest Contentful Paint
  fid_ms INTEGER, -- First Input Delay
  cls_score NUMERIC(10, 3), -- Cumulative Layout Shift
  ttfb_ms INTEGER, -- Time to First Byte
  dom_interactive_ms INTEGER,
  load_complete_ms INTEGER,
  navigation_type TEXT,
  device_type TEXT,
  connection_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_id TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API performance monitoring
CREATE TABLE IF NOT EXISTS monitoring_api_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  request_size_bytes INTEGER DEFAULT 0,
  response_size_bytes INTEGER DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  user_id TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health check results
CREATE TABLE IF NOT EXISTS monitoring_health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  message TEXT,
  details JSONB DEFAULT '{}',
  duration_ms INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts and incidents
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'suppressed')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  resolved_by TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User session tracking
CREATE TABLE IF NOT EXISTS monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  conversion_events INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business metrics tracking
CREATE TABLE IF NOT EXISTS monitoring_business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('booking', 'payment', 'user_engagement', 'conversion', 'revenue')),
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System resource monitoring
CREATE TABLE IF NOT EXISTS monitoring_system_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpu_usage_percent NUMERIC(5, 2),
  memory_usage_mb INTEGER,
  memory_usage_percent NUMERIC(5, 2),
  disk_usage_gb INTEGER,
  disk_usage_percent NUMERIC(5, 2),
  active_connections INTEGER,
  database_connections INTEGER,
  cache_hit_rate NUMERIC(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name_timestamp ON monitoring_metrics(name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_session_id ON monitoring_metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_timestamp ON monitoring_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type_timestamp ON monitoring_events(type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_session_id ON monitoring_events(session_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_errors_timestamp ON monitoring_errors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_errors_resolved ON monitoring_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_monitoring_errors_impact ON monitoring_errors(user_impact);
CREATE INDEX IF NOT EXISTS idx_monitoring_errors_session_id ON monitoring_errors(session_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_performance_timestamp ON monitoring_performance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_performance_session_id ON monitoring_performance(session_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_api_performance_timestamp ON monitoring_api_performance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_api_performance_endpoint ON monitoring_api_performance(endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_api_performance_status ON monitoring_api_performance(status_code, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_health_checks_timestamp ON monitoring_health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_health_checks_name ON monitoring_health_checks(check_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered ON monitoring_alerts(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_session_id ON monitoring_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_start_time ON monitoring_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_user_id ON monitoring_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_business_metrics_timestamp ON monitoring_business_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_business_metrics_type ON monitoring_business_metrics(metric_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_system_resources_timestamp ON monitoring_system_resources(timestamp DESC);

-- Create RLS (Row Level Security) policies
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_api_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_system_resources ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for client-side monitoring
CREATE POLICY "Allow anonymous insert metrics" ON monitoring_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert events" ON monitoring_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert errors" ON monitoring_errors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert performance" ON monitoring_performance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert api performance" ON monitoring_api_performance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert business metrics" ON monitoring_business_metrics
  FOR INSERT WITH CHECK (true);

-- Admin access policies
CREATE POLICY "Allow full admin access to monitoring" ON monitoring_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow full admin access to events" ON monitoring_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create views for common monitoring queries
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT
  (SELECT COUNT(*) FROM monitoring_sessions WHERE start_time >= NOW() - INTERVAL '24 hours') as active_sessions_24h,
  (SELECT COUNT(*) FROM monitoring_events WHERE timestamp >= NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM monitoring_errors WHERE timestamp >= NOW() - INTERVAL '24 hours') as errors_24h,
  (SELECT AVG(score) FROM monitoring_health_checks WHERE timestamp >= NOW() - INTERVAL '1 hour') as avg_health_score,
  (SELECT AVG(response_time_ms) FROM monitoring_api_performance WHERE timestamp >= NOW() - INTERVAL '1 hour') as avg_response_time,
  (SELECT COUNT(DISTINCT user_id) FROM monitoring_sessions WHERE start_time >= NOW() - INTERVAL '24 hours') as unique_users_24h;

CREATE OR REPLACE VIEW monitoring_error_summary AS
SELECT
  error_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as affected_sessions,
  MAX(timestamp) as last_occurrence,
  AVG(CASE WHEN user_impact = 'critical' THEN 4
           WHEN user_impact = 'high' THEN 3
           WHEN user_impact = 'medium' THEN 2
           ELSE 1 END) as avg_impact_score
FROM monitoring_errors
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY error_count DESC;

CREATE OR REPLACE VIEW monitoring_performance_summary AS
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(fcp_ms) as avg_fcp,
  AVG(lcp_ms) as avg_lcp,
  AVG(fid_ms) as avg_fid,
  AVG(cls_score) as avg_cls,
  COUNT(*) as page_loads
FROM monitoring_performance
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Create functions for automated cleanup
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Delete metrics older than 90 days
  DELETE FROM monitoring_metrics
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Delete events older than 90 days
  DELETE FROM monitoring_events
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Delete resolved errors older than 30 days
  DELETE FROM monitoring_errors
  WHERE resolved = TRUE
  AND timestamp < NOW() - INTERVAL '30 days';

  -- Delete performance data older than 90 days
  DELETE FROM monitoring_performance
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Delete API performance data older than 30 days
  DELETE FROM monitoring_api_performance
  WHERE timestamp < NOW() - INTERVAL '30 days';

  -- Delete old health checks (keep last 1000 per check type)
  DELETE FROM monitoring_health_checks
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY check_name ORDER BY timestamp DESC) as rn
      FROM monitoring_health_checks
    ) ranked
    WHERE rn <= 1000
  );

  -- Delete resolved alerts older than 7 days
  DELETE FROM monitoring_alerts
  WHERE status = 'resolved'
  AND resolved_at < NOW() - INTERVAL '7 days';

  -- Delete sessions older than 90 days
  DELETE FROM monitoring_sessions
  WHERE start_time < NOW() - INTERVAL '90 days';

  -- Delete business metrics older than 90 days
  DELETE FROM monitoring_business_metrics
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- Delete system resources older than 7 days
  DELETE FROM monitoring_system_resources
  WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create alerts based on thresholds
CREATE OR REPLACE FUNCTION check_monitoring_thresholds()
RETURNS void AS $$
DECLARE
  error_threshold INTEGER := 10;
  performance_threshold INTEGER := 3000;
  health_threshold INTEGER := 70;
BEGIN
  -- Check for high error rate
  INSERT INTO monitoring_alerts (alert_type, severity, title, description, details)
  SELECT
    'high_error_rate',
    CASE WHEN COUNT(*) > error_threshold * 2 THEN 'critical' ELSE 'warning' END,
    'High Error Rate Detected',
    format('%s errors detected in the last hour', COUNT(*)),
    json_build_object('error_count', COUNT(*), 'threshold', error_threshold)
  FROM monitoring_errors
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM monitoring_alerts
    WHERE alert_type = 'high_error_rate'
    AND triggered_at >= NOW() - INTERVAL '1 hour'
    AND status IN ('open', 'acknowledged')
  )
  HAVING COUNT(*) > error_threshold;

  -- Check for poor performance
  INSERT INTO monitoring_alerts (alert_type, severity, title, description, details)
  SELECT
    'poor_performance',
    CASE WHEN AVG(lcp_ms) > performance_threshold * 2 THEN 'critical' ELSE 'warning' END,
    'Poor Page Performance',
    format('Average LCP is %s ms (threshold: %s ms)', ROUND(AVG(lcp_ms)), performance_threshold),
    json_build_object('avg_lcp', ROUND(AVG(lcp_ms)), 'threshold', performance_threshold, 'page_loads', COUNT(*))
  FROM monitoring_performance
  WHERE timestamp >= NOW() - INTERVAL '30 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM monitoring_alerts
    WHERE alert_type = 'poor_performance'
    AND triggered_at >= NOW() - INTERVAL '30 minutes'
    AND status IN ('open', 'acknowledged')
  )
  GROUP BY timestamp >= NOW() - INTERVAL '30 minutes'
  HAVING AVG(lcp_ms) > performance_threshold;

  -- Check for low health score
  INSERT INTO monitoring_alerts (alert_type, severity, title, description, details)
  SELECT
    'low_health_score',
    CASE WHEN AVG(score) < 50 THEN 'critical' ELSE 'warning' END,
    'Low System Health Score',
    format('Health score is %s (threshold: %s)', ROUND(AVG(score)), health_threshold),
    json_build_object('avg_score', ROUND(AVG(score)), 'threshold', health_threshold, 'checks', COUNT(*))
  FROM monitoring_health_checks
  WHERE timestamp >= NOW() - INTERVAL '5 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM monitoring_alerts
    WHERE alert_type = 'low_health_score'
    AND triggered_at >= NOW() - INTERVAL '5 minutes'
    AND status IN ('open', 'acknowledged')
  )
  GROUP BY timestamp >= NOW() - INTERVAL '5 minutes'
  HAVING AVG(score) < health_threshold;
END;
$$ LANGUAGE plpgsql;

-- Create cron jobs for automated tasks (requires pg_cron extension)
-- Note: pg_cron needs to be enabled in Supabase if not already available
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_old_monitoring_data();');
-- SELECT cron.schedule('check-monitoring-thresholds', '*/5 * * * *', 'SELECT check_monitoring_thresholds();');

-- Grant necessary permissions
GRANT SELECT ON monitoring_dashboard TO authenticated;
GRANT SELECT ON monitoring_dashboard TO anon;
GRANT SELECT ON monitoring_error_summary TO authenticated;
GRANT SELECT ON monitoring_error_summary TO anon;
GRANT SELECT ON monitoring_performance_summary TO authenticated;
GRANT SELECT ON monitoring_performance_summary TO anon;

GRANT EXECUTE ON FUNCTION cleanup_old_monitoring_data TO authenticated;
GRANT EXECUTE ON FUNCTION check_monitoring_thresholds TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE monitoring_metrics IS 'Time-series metrics collection for application monitoring';
COMMENT ON TABLE monitoring_events IS 'User behavior and custom event tracking';
COMMENT ON TABLE monitoring_errors IS 'Error tracking with business context and user impact';
COMMENT ON TABLE monitoring_performance IS 'Web Vitals and page performance metrics';
COMMENT ON TABLE monitoring_api_performance IS 'API endpoint performance monitoring';
COMMENT ON TABLE monitoring_health_checks IS 'System health check results';
COMMENT ON TABLE monitoring_alerts IS 'Alerts and incidents management';
COMMENT ON TABLE monitoring_sessions IS 'User session tracking and analytics';
COMMENT ON TABLE monitoring_business_metrics IS 'Business KPIs and conversion tracking';
COMMENT ON TABLE monitoring_system_resources IS 'System resource usage monitoring';

COMMENT ON FUNCTION cleanup_old_monitoring_data IS 'Automated cleanup of old monitoring data';
COMMENT ON FUNCTION check_monitoring_thresholds IS 'Automatic alert creation based on metric thresholds';