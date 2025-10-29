-- Defense in Depth Security Implementation
-- Multi-layered security enhancements for production deployment

-- Enable pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create security audit tables
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 1,
    limit_count INTEGER NOT NULL,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, window_start, window_end)
);

-- Create IP blocking table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by UUID REFERENCES auth.users(id),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create secure audit log table
CREATE TABLE IF NOT EXISTS secure_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    user_id UUID REFERENCES auth.users(id),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    sensitive_fields TEXT[] DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all security tables
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_events
CREATE POLICY "Admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service role can manage security events" ON security_events
    FOR ALL TO service_role USING (true);

-- RLS Policies for rate_limits
CREATE POLICY "Service role full access to rate limits" ON rate_limits
    FOR ALL TO service_role USING (true);

-- RLS Policies for blocked_ips
CREATE POLICY "Admins can view blocked IPs" ON blocked_ips
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service role full access to blocked IPs" ON blocked_ips
    FOR ALL TO service_role USING (true);

-- RLS Policies for security_metrics
CREATE POLICY "Admins can view security metrics" ON security_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service role full access to security metrics" ON security_metrics
    FOR ALL TO service_role USING (true);

-- RLS Policies for secure_audit_logs
CREATE POLICY "Admins can view all audit logs" ON secure_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service role can manage audit logs" ON secure_audit_logs
    FOR ALL TO service_role USING (true);

-- Enhanced security functions

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_endpoint VARCHAR(255) DEFAULT NULL,
    p_method VARCHAR(10) DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type,
        severity,
        user_id,
        session_id,
        ip_address,
        user_agent,
        endpoint,
        method,
        details
    ) VALUES (
        p_event_type,
        p_severity,
        p_user_id,
        p_session_id,
        p_ip_address,
        p_user_agent,
        p_endpoint,
        p_method,
        p_details
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR(255),
    p_limit_count INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
    is_allowed BOOLEAN,
    remaining_requests INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_window_end TIMESTAMP WITH TIME ZONE;
    v_current_count INTEGER;
    v_reset_time TIMESTAMP WITH TIME ZONE;
BEGIN
    v_window_start := date_trunc('minute', NOW()) -
        (floor(EXTRACT(MINUTE FROM NOW()) / p_window_minutes) * p_window_minutes || ' minutes')::INTERVAL;
    v_window_end := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;

    -- Get current count
    SELECT COALESCE(request_count, 0) INTO v_current_count
    FROM rate_limits
    WHERE identifier = p_identifier
    AND window_start = v_window_start
    AND window_end = v_window_end;

    -- Update or insert rate limit record
    INSERT INTO rate_limits (identifier, window_start, window_end, request_count, limit_count, reset_at)
    VALUES (p_identifier, v_window_start, v_window_end,
            COALESCE(v_current_count, 0) + 1, p_limit_count, v_window_end)
    ON CONFLICT (identifier, window_start, window_end)
    DO UPDATE SET
        request_count = rate_limits.request_count + 1,
        reset_at = EXCLUDED.reset_at;

    RETURN QUERY SELECT
        (v_current_count < p_limit_count) as is_allowed,
        GREATEST(p_limit_count - v_current_count - 1, 0) as remaining_requests,
        v_window_end as reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block IP address
CREATE OR REPLACE FUNCTION block_ip_address(
    p_ip_address INET,
    p_reason TEXT,
    p_blocked_by UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    block_id UUID;
BEGIN
    INSERT INTO blocked_ips (
        ip_address,
        reason,
        blocked_by,
        expires_at,
        notes
    ) VALUES (
        p_ip_address,
        p_reason,
        p_blocked_by,
        p_expires_at,
        p_notes
    ) RETURNING id INTO block_id;

    RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_blocked BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM blocked_ips
        WHERE ip_address = p_ip_address
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_is_blocked;

    RETURN v_is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record security metrics
CREATE OR REPLACE FUNCTION record_security_metric(
    p_metric_type VARCHAR(50),
    p_metric_value NUMERIC,
    p_dimensions JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO security_metrics (
        metric_type,
        metric_value,
        dimensions
    ) VALUES (
        p_metric_type,
        p_metric_value,
        p_dimensions
    ) RETURNING id INTO metric_id;

    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create secure audit log
CREATE OR REPLACE FUNCTION create_secure_audit_log(
    p_table_name VARCHAR(100),
    p_operation VARCHAR(20),
    p_user_id UUID DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_sensitive_fields TEXT[] DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO secure_audit_logs (
        table_name,
        operation,
        user_id,
        record_id,
        old_values,
        new_values,
        sensitive_fields,
        ip_address,
        user_agent
    ) VALUES (
        p_table_name,
        p_operation,
        p_user_id,
        p_record_id,
        p_old_values,
        p_new_values,
        p_sensitive_fields,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced triggers for audit logging

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';

    IF TG_OP = 'INSERT' THEN
        PERFORM create_secure_audit_log(
            TG_TABLE_NAME::text,
            TG_OP,
            v_user_id,
            NEW.id,
            NULL,
            to_jsonb(NEW),
            '{password,secret,token,key}'::text[],
            v_ip_address,
            v_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_secure_audit_log(
            TG_TABLE_NAME::text,
            TG_OP,
            v_user_id,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            '{password,secret,token,key}'::text[],
            v_ip_address,
            v_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_secure_audit_log(
            TG_TABLE_NAME::text,
            TG_OP,
            v_user_id,
            OLD.id,
            to_jsonb(OLD),
            NULL,
            '{password,secret,token,key}'::text[],
            v_ip_address,
            v_user_agent
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    -- Add audit triggers to user-related tables
    FOREACH v_table_name IN ARRAY ARRAY['profiles', 'user_preferences', 'payment_methods', 'addresses']
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %s_audit_trigger ON %I', v_table_name, v_table_name);
            EXECUTE format('CREATE TRIGGER %s_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()', v_table_name, v_table_name);
        EXCEPTION WHEN undefined_table THEN
            CONTINUE;
        END;
    END LOOP;

    -- Add audit triggers to booking-related tables
    FOREACH v_table_name IN ARRAY ARRAY['bookings', 'booking_drafts', 'holds', 'availability_slots']
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %s_audit_trigger ON %I', v_table_name, v_table_name);
            EXECUTE format('CREATE TRIGGER %s_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()', v_table_name, v_table_name);
        EXCEPTION WHEN undefined_table THEN
            CONTINUE;
        END;
    END LOOP;

    -- Add audit triggers to payment-related tables
    FOREACH v_table_name IN ARRAY ARRAY['payment_intents', 'payment_refunds', 'stripe_customers']
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %s_audit_trigger ON %I', v_table_name, v_table_name);
            EXECUTE format('CREATE TRIGGER %s_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()', v_table_name, v_table_name);
        EXCEPTION WHEN undefined_table THEN
            CONTINUE;
        END;
    END LOOP;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window ON rate_limits(identifier, window_start);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_security_metrics_type_recorded ON security_metrics(metric_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_secure_audit_logs_table_name ON secure_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_secure_audit_logs_created_at ON secure_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_secure_audit_logs_user_id ON secure_audit_logs(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON security_events TO service_role;
GRANT ALL ON rate_limits TO service_role;
GRANT ALL ON blocked_ips TO service_role;
GRANT ALL ON security_metrics TO service_role;
GRANT ALL ON secure_audit_logs TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_security_event TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION block_ip_address TO service_role;
GRANT EXECUTE ON FUNCTION is_ip_blocked TO service_role;
GRANT EXECUTE ON FUNCTION record_security_metric TO service_role;
GRANT EXECUTE ON FUNCTION create_secure_audit_log TO service_role;

-- Cleanup functions

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM secure_audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically unblock expired IPs
CREATE OR REPLACE FUNCTION unblock_expired_ips()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE blocked_ips
    SET is_active = FALSE, updated_at = NOW()
    WHERE is_active = TRUE
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security dashboard view
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
    (SELECT COUNT(*) FROM security_events WHERE created_at >= NOW() - INTERVAL '24 hours') as events_24h,
    (SELECT COUNT(*) FROM security_events WHERE severity = 'critical' AND created_at >= NOW() - INTERVAL '24 hours') as critical_events_24h,
    (SELECT COUNT(*) FROM security_events WHERE severity = 'high' AND created_at >= NOW() - INTERVAL '24 hours') as high_events_24h,
    (SELECT COUNT(*) FROM blocked_ips WHERE is_active = TRUE) as active_blocked_ips,
    (SELECT COUNT(*) FROM rate_limits WHERE window_start >= NOW() - INTERVAL '1 hour') as active_rate_limits,
    (SELECT AVG(request_count::float / limit_count::float) * 100 FROM rate_limits WHERE window_start >= NOW() - INTERVAL '24 hours') as avg_rate_limit_usage_percent;

-- Insert initial security metric
SELECT record_security_metric('security_system_initialized', 1, '{"migration_version": "20250301000000"}');

COMMENT ON TABLE security_events IS 'Audit log for security events with classification and tracking';
COMMENT ON TABLE rate_limits IS 'Rate limiting for API endpoints and user actions';
COMMENT ON TABLE blocked_ips IS 'IP addresses blocked due to security violations';
COMMENT ON TABLE security_metrics IS 'Security-related metrics for monitoring and analysis';
COMMENT ON TABLE secure_audit_logs IS 'Comprehensive audit logging for sensitive data operations';

-- Security policies notification
DO $$
BEGIN
    RAISE NOTICE 'Defense in depth security implementation completed';
    RAISE NOTICE 'Security tables, functions, and policies have been created';
    RAISE NOTICE 'Review and test all security features before production deployment';
END $$;