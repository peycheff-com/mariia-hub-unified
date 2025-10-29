-- Reliability System Tables Migration
-- Create tables for health monitoring, alerting, audit logging, and SLO tracking

-- Health check results storage
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  components JSONB NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('improving', 'stable', 'degrading')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for health_scores
CREATE INDEX idx_health_scores_timestamp ON health_scores(timestamp DESC);
CREATE INDEX idx_health_scores_overall_score ON health_scores(overall_score);

-- Dependency metrics storage
CREATE TABLE IF NOT EXISTS dependency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependency_name TEXT NOT NULL,
  metrics JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for dependency_metrics
CREATE INDEX idx_dependency_metrics_name_timestamp ON dependency_metrics(dependency_name, timestamp DESC);
CREATE INDEX idx_dependency_metrics_timestamp ON dependency_metrics(timestamp DESC);

-- Recovery attempts tracking
CREATE TABLE IF NOT EXISTS recovery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  duration INTEGER NOT NULL, -- milliseconds
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for recovery_attempts
CREATE INDEX idx_recovery_attempts_action_id ON recovery_attempts(action_id, timestamp DESC);
CREATE INDEX idx_recovery_attempts_success ON recovery_attempts(success, timestamp DESC);
CREATE INDEX idx_recovery_attempts_severity ON recovery_attempts(severity, timestamp DESC);

-- Alerts management
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  message TEXT NOT NULL,
  enrichment JSONB,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alerts
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_rule_id ON alerts(rule_id, timestamp DESC);

-- SLO events tracking
CREATE TABLE IF NOT EXISTS slo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  indicator TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  value DECIMAL, -- Optional numeric value (e.g., response time)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for slo_events
CREATE INDEX idx_slo_events_service_indicator ON slo_events(service, indicator, timestamp DESC);
CREATE INDEX idx_slo_events_timestamp ON slo_events(timestamp DESC);

-- Error budget status tracking
CREATE TABLE IF NOT EXISTS error_budget_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id TEXT NOT NULL,
  error_budget DECIMAL NOT NULL CHECK (error_budget >= 0 AND error_budget <= 100),
  burn_rate DECIMAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'burning', 'exhausted')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for error_budget_status
CREATE INDEX idx_error_budget_status_slo_id ON error_budget_status(slo_id, timestamp DESC);
CREATE INDEX idx_error_budget_status_status ON error_budget_status(status);

-- SLO alerts
CREATE TABLE IF NOT EXISTS slo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id TEXT NOT NULL,
  slo_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'burning', 'exhausted')),
  error_budget DECIMAL NOT NULL,
  burn_rate DECIMAL NOT NULL,
  fast_burn_threshold DECIMAL NOT NULL,
  slow_burn_threshold DECIMAL NOT NULL,
  is_fast_burning BOOLEAN NOT NULL,
  is_slow_burning BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for slo_alerts
CREATE INDEX idx_slo_alerts_slo_id ON slo_alerts(slo_id, timestamp DESC);
CREATE INDEX idx_slo_alerts_status ON slo_alerts(status);

-- Audit logs (main table for recent events)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'error')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, timestamp DESC);
CREATE INDEX idx_audit_logs_outcome ON audit_logs(outcome, timestamp DESC);

-- Audit logs archive (long-term storage)
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- Create indexes for audit_logs_archive
CREATE INDEX idx_audit_logs_archive_timestamp ON audit_logs_archive(timestamp DESC);
CREATE INDEX idx_audit_logs_archive_user_id ON audit_logs_archive(user_id, timestamp DESC);

-- Health check utility function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(timestamp TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY SELECT NOW() as timestamp;
END;
$$ LANGUAGE plpgsql;

-- Archive audit logs function
CREATE OR REPLACE FUNCTION archive_audit_logs(cutoff_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old records to archive
  WITH moved AS (
    DELETE FROM audit_logs
    WHERE timestamp < cutoff_date
    RETURNING *
  )
  INSERT INTO audit_logs_archive
  SELECT * FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Clear cache function (placeholder for actual implementation)
CREATE OR REPLACE FUNCTION clear_all_cache()
RETURNS BOOLEAN AS $$
BEGIN
  -- Placeholder for cache clearing logic
  -- This would integrate with your cache system (Redis, etc.)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Force database reconnect function
CREATE OR REPLACE FUNCTION force_reconnect()
RETURNS BOOLEAN AS $$
BEGIN
  -- This is a placeholder for reconnection logic
  -- In a real implementation, you might check connection pools
  PERFORM pg_reload_conf();
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Drain failed queue items function
CREATE OR REPLACE FUNCTION drain_failed_queue_items()
RETURNS BOOLEAN AS $$
BEGIN
  -- Placeholder for queue draining logic
  -- This would move failed items to dead letter queue
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies

-- Enable RLS on sensitive tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_attempts ENABLE ROW LEVEL SECURITY;

-- Policy for audit_logs - only admins can view all, users can see their own
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Policy for alerts - only admins can manage
CREATE POLICY "Admins can manage alerts" ON alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Views for common queries

-- Health score summary view
CREATE OR REPLACE VIEW health_score_summary AS
SELECT
  overall_score,
  trend,
  timestamp,
  CASE
    WHEN overall_score >= 90 THEN 'healthy'
    WHEN overall_score >= 70 THEN 'degraded'
    ELSE 'unhealthy'
  END as status
FROM health_scores
ORDER BY timestamp DESC
LIMIT 1;

-- Active alerts view
CREATE OR REPLACE VIEW active_alerts AS
SELECT
  id,
  rule_id,
  severity,
  message,
  timestamp,
  CASE
    WHEN status = 'open' THEN '🔴'
    WHEN status = 'acknowledged' THEN '🟡'
    WHEN status = 'resolved' THEN '🟢'
  END as status_icon
FROM alerts
WHERE status IN ('open', 'acknowledged')
ORDER BY severity DESC, timestamp DESC;

-- SLO status overview view
CREATE OR REPLACE VIEW slo_status_overview AS
SELECT DISTINCT ON (slo_id)
  slo_id,
  status,
  error_budget,
  burn_rate,
  timestamp
FROM error_budget_status
ORDER BY slo_id, timestamp DESC;

-- Grant permissions to service role
GRANT SELECT ON health_scores TO authenticated;
GRANT SELECT ON dependency_metrics TO authenticated;
GRANT SELECT ON recovery_attempts TO authenticated;
GRANT SELECT ON alerts TO authenticated;
GRANT SELECT ON slo_events TO authenticated;
GRANT SELECT ON error_budget_status TO authenticated;
GRANT SELECT ON slo_alerts TO authenticated;
GRANT SELECT ON health_score_summary TO authenticated;
GRANT SELECT ON active_alerts TO authenticated;
GRANT SELECT ON slo_status_overview TO authenticated;

-- Grant execution permissions for functions
GRANT EXECUTE ON FUNCTION health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_audit_logs(TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION force_reconnect() TO authenticated;
GRANT EXECUTE ON FUNCTION drain_failed_queue_items() TO authenticated;