-- Secure Credential Storage Migration
-- Implements encrypted storage for all third-party service credentials

-- Create service_credentials table
CREATE TABLE IF NOT EXISTS service_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    encrypted_key TEXT NOT NULL,
    encrypted_secret TEXT NOT NULL,
    iv TEXT NOT NULL, -- Initialization vectors for both key and secret
    tag TEXT NOT NULL, -- Authentication tags for both key and secret
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_rotated TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_active_service_env UNIQUE (service, environment, is_active)
        DEFERRABLE INITIALLY DEFERRED
);

-- Create credential_audit_log table
CREATE TABLE IF NOT EXISTS credential_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    environment TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'ROTATE', 'DEACTIVATE', 'DELETE')),
    credential_id UUID REFERENCES service_credentials(id),
    initiated_by TEXT NOT NULL DEFAULT 'system',
    timestamp TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Create service_health table for monitoring
CREATE TABLE IF NOT EXISTS service_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    last_check TIMESTAMPTZ DEFAULT now(),
    response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT unique_service_env UNIQUE (service, environment)
);

-- Create api_usage_limits table for rate limiting
CREATE TABLE IF NOT EXISTS api_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    reset_at TIMESTAMPTZ,

    CONSTRAINT unique_service_window UNIQUE (service, environment, window_start, window_end)
);

-- Create circuit_breaker_state table
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    state TEXT NOT NULL CHECK (state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    failure_count INTEGER DEFAULT 0,
    last_failure_time TIMESTAMPTZ,
    next_retry_time TIMESTAMPTZ,
    timeout_seconds INTEGER DEFAULT 60,
    failure_threshold INTEGER DEFAULT 5,
    success_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_circuit_service_env UNIQUE (service, environment)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_credentials_service_env ON service_credentials(service, environment);
CREATE INDEX IF NOT EXISTS idx_service_credentials_active ON service_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_service_credentials_expires ON service_credentials(expires_at);
CREATE INDEX IF NOT EXISTS idx_credential_audit_service ON credential_audit_log(service);
CREATE INDEX IF NOT EXISTS idx_credential_audit_timestamp ON credential_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_service_health_service ON service_health(service);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_service_window ON api_usage_limits(service, window_start);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_service ON circuit_breaker_state(service, environment);

-- Enable Row Level Security
ALTER TABLE service_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only service role can access)
CREATE POLICY "Service role full access to credentials" ON service_credentials
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to audit log" ON credential_audit_log
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to health" ON service_health
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_service_credentials_updated_at
    BEFORE UPDATE ON service_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_updated_at
    BEFORE UPDATE ON circuit_breaker_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check credential expiration
CREATE OR REPLACE FUNCTION check_credential_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() THEN
        RAISE EXCEPTION 'Credential has expired on %', NEW.expires_at;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to prevent using expired credentials
CREATE TRIGGER prevent_expired_credentials
    BEFORE INSERT OR UPDATE ON service_credentials
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION check_credential_expiration();

-- Create function to log credential changes
CREATE OR REPLACE FUNCTION log_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO credential_audit_log (service, environment, action, credential_id, metadata)
        VALUES (NEW.service, NEW.environment, 'CREATE', NEW.id,
                jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = true AND NEW.is_active = false THEN
            INSERT INTO credential_audit_log (service, environment, action, credential_id, metadata)
            VALUES (NEW.service, NEW.environment, 'DEACTIVATE', NEW.id,
                    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP));
        ELSIF OLD.encrypted_secret != NEW.encrypted_secret THEN
            INSERT INTO credential_audit_log (service, environment, action, credential_id, metadata)
            VALUES (NEW.service, NEW.environment, 'ROTATE', NEW.id,
                    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP));
        ELSE
            INSERT INTO credential_audit_log (service, environment, action, credential_id, metadata)
            VALUES (NEW.service, NEW.environment, 'UPDATE', NEW.id,
                    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to audit credential changes
CREATE TRIGGER audit_credential_changes
    AFTER INSERT OR UPDATE ON service_credentials
    FOR EACH ROW
    EXECUTE FUNCTION log_credential_change();

-- Create function to initialize or update service health
CREATE OR REPLACE FUNCTION upsert_service_health(
    p_service TEXT,
    p_status TEXT DEFAULT 'unknown',
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error_rate DECIMAL DEFAULT NULL,
    p_last_error TEXT DEFAULT NULL,
    p_environment TEXT DEFAULT 'production',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    health_record service_health%ROWTYPE;
BEGIN
    -- Try to update existing record
    UPDATE service_health
    SET
        status = p_status,
        last_check = now(),
        response_time_ms = p_response_time_ms,
        error_rate = p_error_rate,
        last_error = p_last_error,
        consecutive_failures = CASE
            WHEN p_status = 'unhealthy' THEN consecutive_failures + 1
            ELSE 0
        END,
        metadata = p_metadata
    WHERE service = p_service AND environment = p_environment
    RETURNING * INTO health_record;

    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO service_health (
            service, status, response_time_ms, error_rate,
            last_error, environment, metadata
        ) VALUES (
            p_service, p_status, p_response_time_ms, p_error_rate,
            p_last_error, p_environment, p_metadata
        )
        RETURNING * INTO health_record;
    END IF;

    RETURN health_record.id;
END;
$$ LANGUAGE plpgsql;

-- Create function to manage circuit breaker state
CREATE OR REPLACE FUNCTION update_circuit_breaker(
    p_service TEXT,
    p_success BOOLEAN,
    p_environment TEXT DEFAULT 'production'
)
RETURNS TEXT AS $$
DECLARE
    breaker_state circuit_breaker_state%ROWTYPE;
    new_state TEXT;
BEGIN
    -- Get current circuit breaker state
    SELECT * INTO breaker_state
    FROM circuit_breaker_state
    WHERE service = p_service AND environment = p_environment;

    -- If no state exists, create it
    IF NOT FOUND THEN
        INSERT INTO circuit_breaker_state (service, state, environment)
        VALUES (p_service, 'CLOSED', p_environment)
        RETURNING * INTO breaker_state;
    END IF;

    -- Update state based on success/failure
    IF p_success THEN
        CASE breaker_state.state
            WHEN 'OPEN' THEN
                -- Check if we should try again
                IF now() >= breaker_state.next_retry_time THEN
                    UPDATE circuit_breaker_state
                    SET state = 'HALF_OPEN', failure_count = 0
                    WHERE service = p_service AND environment = p_environment;
                    new_state := 'HALF_OPEN';
                ELSE
                    new_state := 'OPEN';
                END IF;
            WHEN 'HALF_OPEN' THEN
                -- Reset to closed if we get enough successes
                IF breaker_state.failure_count = 0 THEN
                    UPDATE circuit_breaker_state
                    SET state = 'CLOSED', failure_count = 0
                    WHERE service = p_service AND environment = p_environment;
                    new_state := 'CLOSED';
                ELSE
                    new_state := 'HALF_OPEN';
                END IF;
            ELSE
                -- Already closed, just reset failures
                UPDATE circuit_breaker_state
                SET failure_count = 0
                WHERE service = p_service AND environment = p_environment;
                new_state := 'CLOSED';
        END CASE;
    ELSE
        -- Failure occurred
        UPDATE circuit_breaker_state
        SET
            failure_count = failure_count + 1,
            last_failure_time = now(),
            state = CASE
                WHEN failure_count + 1 >= failure_threshold THEN 'OPEN'
                ELSE state
            END,
            next_retry_time = CASE
                WHEN failure_count + 1 >= failure_threshold THEN now() + (timeout_seconds || ' seconds')::INTERVAL
                ELSE next_retry_time
            END
        WHERE service = p_service AND environment = p_environment;

        new_state := CASE
            WHEN breaker_state.failure_count + 1 >= breaker_state.failure_threshold THEN 'OPEN'
            ELSE breaker_state.state
        END;
    END IF;

    RETURN new_state;
END;
$$ LANGUAGE plpgsql;

-- Create view for active credentials (without sensitive data)
CREATE OR REPLACE VIEW active_service_credentials AS
SELECT
    service,
    environment,
    is_active,
    expires_at,
    created_at,
    last_rotated,
    updated_at
FROM service_credentials
WHERE is_active = true;

-- Grant necessary permissions
GRANT ALL ON service_credentials TO service_role;
GRANT ALL ON credential_audit_log TO service_role;
GRANT ALL ON service_health TO service_role;
GRANT ALL ON api_usage_limits TO service_role;
GRANT ALL ON circuit_breaker_state TO service_role;

GRANT SELECT ON active_service_credentials TO service_role;
GRANT EXECUTE ON FUNCTION upsert_service_health TO service_role;
GRANT EXECUTE ON FUNCTION update_circuit_breaker TO service_role;

-- Create initial circuit breaker entries for critical services
INSERT INTO circuit_breaker_state (service, environment, failure_threshold, timeout_seconds)
VALUES
    ('stripe', 'production', 5, 60),
    ('booksy', 'production', 3, 120),
    ('whatsapp', 'production', 5, 30),
    ('resend', 'production', 5, 60),
    ('supabase', 'production', 3, 30)
ON CONFLICT (service, environment) DO NOTHING;