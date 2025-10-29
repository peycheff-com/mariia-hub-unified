-- Security Audit and Fixes
-- This script addresses security issues and improves RLS policies

-- ========================================
-- 1. FIX FAILED_LOGIN_ATTEMPTS RLS POLICY
-- ========================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view failed login attempts" ON failed_login_attempts;

-- Create secure policy - only admins can view
CREATE POLICY "Admins can view failed login attempts" ON failed_login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ========================================
-- 2. IMPROVE RLS POLICIES FOR SENSITIVE DATA
-- ========================================

-- Ensure PII is protected
CREATE POLICY "Users can view own PII" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Payment information - stricter access
CREATE POLICY "Admins only for payment details" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Booking data - users can see their own bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE POLICY "Users view own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ========================================
-- 3. AUDIT LOGGING FOR SENSITIVE OPERATIONS
-- ========================================

-- Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_user_action
ON security_audit_log(user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_risk_level
ON security_audit_log(risk_level, created_at DESC)
WHERE risk_level IN ('high', 'critical');

-- ========================================
-- 4. SECURITY FUNCTIONS
-- ========================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'medium'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    ip_address,
    user_agent,
    old_values,
    new_values,
    risk_level
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    p_old_values,
    p_new_values,
    p_risk_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
  user_id UUID,
  suspicious_activity JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Detect multiple failed logins
  SELECT
    user_id,
    jsonb_build_object(
      'type', 'multiple_failed_logins',
      'count', COUNT(*)::INTEGER,
      'time_window', '1 hour',
      'risk_level', CASE
        WHEN COUNT(*) >= 10 THEN 'critical'
        WHEN COUNT(*) >= 5 THEN 'high'
        ELSE 'medium'
      END
    )
  FROM failed_login_attempts
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) >= 3

  UNION ALL

  -- Detect rapid booking attempts
  SELECT
    user_id,
    jsonb_build_object(
      'type', 'rapid_bookings',
      'count', COUNT(*)::INTEGER,
      'time_window', '10 minutes',
      'risk_level', CASE
        WHEN COUNT(*) >= 10 THEN 'high'
        ELSE 'medium'
      END
    )
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '10 minutes'
  GROUP BY user_id
  HAVING COUNT(*) >= 5

  UNION ALL

  -- Detect admin access from new locations
  SELECT
    p.id as user_id,
    jsonb_build_object(
      'type', 'admin_new_location',
      'previous_locations', (
        SELECT array_agg(DISTINCT ip_address::TEXT)
        FROM security_audit_log
        WHERE user_id = p.id
          AND action = 'login_success'
          AND created_at > NOW() - INTERVAL '30 days'
      ),
      'current_location', inet_client_addr()::TEXT,
      'risk_level', 'high'
    )
  FROM profiles p
  WHERE p.role = 'admin'
    AND EXISTS (
      SELECT 1 FROM security_audit_log sal
      WHERE sal.user_id = p.id
        AND sal.action = 'login_success'
        AND sal.ip_address != inet_client_addr()
        AND sal.created_at > NOW() - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. TRIGGERS FOR SECURITY AUDITING
-- ========================================

-- Trigger for profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    PERFORM log_security_event(
      'profile_updated',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD)::JSONB,
      row_to_json(NEW)::JSONB,
      CASE
        WHEN OLD.email != NEW.email OR OLD.role != NEW.role THEN 'high'
        ELSE 'low'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON profiles;
CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();

-- ========================================
-- 6. RATE LIMITING FOR API ENDPOINTS
-- ========================================

-- Create rate limit table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint_path TEXT,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint
ON api_rate_limits(user_id, endpoint_path, window_end);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint_path TEXT,
  p_max_requests INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  -- Clean up old windows
  DELETE FROM api_rate_limits
  WHERE window_end < NOW();

  -- Get current request count
  SELECT COALESCE(SUM(request_count), 0) INTO v_request_count
  FROM api_rate_limits
  WHERE user_id = p_user_id
    AND endpoint_path = p_endpoint_path
    AND window_start <= NOW()
    AND window_end > NOW();

  -- Check if over limit
  IF v_request_count >= p_max_requests THEN
    -- Log rate limit violation
    PERFORM log_security_event(
      'rate_limit_exceeded',
      'api_rate_limits',
      NULL,
      jsonb_build_object('current_count', v_request_count, 'limit', p_max_requests),
      NULL,
      'medium'
    );
    RETURN FALSE;
  END IF;

  -- Update or create rate limit record
  INSERT INTO api_rate_limits (user_id, endpoint_path, request_count)
  VALUES (p_user_id, p_endpoint_path, 1)
  ON CONFLICT (user_id, endpoint_path, window_start, window_end)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. SECURITY MONITORING DASHBOARD
-- ========================================

-- View for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
  'failed_logins' as metric,
  COUNT(*)::INTEGER as count_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::INTEGER as count_1h
FROM failed_login_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'suspicious_activities' as metric,
  COUNT(*)::INTEGER as count_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::INTEGER as count_1h
FROM security_audit_log
WHERE risk_level IN ('high', 'critical')
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'admin_actions' as metric,
  COUNT(*)::INTEGER as count_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::INTEGER as count_1h
FROM security_audit_log sal
JOIN profiles p ON sal.user_id = p.id
WHERE p.role = 'admin'
  AND sal.created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'rate_limit_violations' as metric,
  COUNT(*)::INTEGER as count_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::INTEGER as count_1h
FROM security_audit_log
WHERE action = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '24 hours';

-- ========================================
-- 8. PERMISSIONS AND GRANTS
-- ========================================

-- Grant necessary permissions
GRANT SELECT ON security_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO authenticated;
GRANT SELECT ON security_dashboard TO authenticated;

-- Only admins can view full audit details
CREATE POLICY "Admins view full audit log" ON security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users can see their own audit entries
CREATE POLICY "Users view own audit entries" ON security_audit_log
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- ========================================
-- 9. SECURITY CHECKLIST VERIFICATION
-- ========================================

-- Function to verify security configuration
CREATE OR REPLACE FUNCTION security_health_check()
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
  v_rls_enabled BOOLEAN;
  v_policies_count INTEGER;
  v_admin_count INTEGER;
BEGIN
  -- Check if RLS is enabled on sensitive tables
  SELECT COUNT(*) > 0 INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN ('profiles', 'bookings', 'payment_methods');

  -- Count RLS policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
    WHERE schemaname = 'public';

  -- Count admin users
  SELECT COUNT(*) INTO v_admin_count
  FROM profiles
  WHERE role = 'admin';

  SELECT jsonb_build_object(
    'rls_enabled', v_rls_enabled,
    'total_rls_policies', v_policies_count,
    'admin_users_count', v_admin_count,
    'audit_logging_enabled', EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'security_audit_log'
    ),
    'rate_limiting_enabled', EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'api_rate_limits'
    ),
    'security_functions', (
      SELECT json_agg(json_build_object(
        'function_name', proname,
        'security_definer', prosecdef
      ))
      FROM pg_proc
      WHERE proname IN ('log_security_event', 'check_rate_limit', 'detect_suspicious_activity')
    ),
    'check_timestamp', NOW()
  ) INTO v_results;

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE security_audit_log IS 'Audit log for security-sensitive operations';
COMMENT ON FUNCTION log_security_event IS 'Logs security events to audit table';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Detects suspicious user behavior patterns';
COMMENT ON FUNCTION check_rate_limit IS 'Implements rate limiting for API endpoints';
COMMENT ON FUNCTION security_health_check IS 'Returns security configuration status';
COMMENT ON VIEW security_dashboard IS 'Security metrics dashboard for monitoring';

-- Run initial security health check
SELECT security_health_check();