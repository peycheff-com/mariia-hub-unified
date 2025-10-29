-- Enhanced Security Policies and Database Security
-- Zero-trust architecture implementation
-- OWASP security best practices

-- Create security audit logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);

-- Create failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON public.failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_locked_until ON public.failed_login_attempts(locked_until);

-- Create API key management table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    permissions TEXT[] DEFAULT '{}',
    rate_limit_tier VARCHAR(50) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

-- Create API key usage logs
CREATE TABLE IF NOT EXISTS public.api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    response_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON public.api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_created_at ON public.api_key_usage(created_at);

-- Enable RLS on security tables
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_logs
CREATE POLICY "Admins can view all security logs" ON public.security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Users can view their own security logs" ON public.security_audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can insert security logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for failed_login_attempts
CREATE POLICY "Admins can view all failed login attempts" ON public.failed_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service can manage failed login attempts" ON public.failed_login_attempts
    FOR ALL WITH CHECK (true);

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all API keys" ON public.api_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Users can create their own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys" ON public.api_keys
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update all API keys" ON public.api_keys
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for api_key_usage
CREATE POLICY "Users can view their own API key usage" ON public.api_key_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.api_keys
            WHERE api_keys.id = public.api_key_usage.api_key_id
            AND api_keys.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all API key usage" ON public.api_key_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Service can insert API key usage" ON public.api_key_usage
    FOR INSERT WITH CHECK (true);

-- Create function to hash API keys
CREATE OR REPLACE FUNCTION public.hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(api_key::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.security_audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        details,
        session_id
    ) VALUES (
        p_event_type,
        p_severity,
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_details,
        p_session_id
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION public.handle_failed_login(
    p_email VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_record RECORD;
    lockout_threshold INTEGER := 5;
    lockout_duration INTERVAL := '15 minutes';
BEGIN
    -- Check if there's an existing record
    SELECT * INTO attempt_record
    FROM public.failed_login_attempts
    WHERE email = p_email
    FOR UPDATE;

    IF FOUND THEN
        -- If currently locked out, check if lockout has expired
        IF attempt_record.locked_until IS NOT NULL AND attempt_record.locked_until > NOW() THEN
            RETURN FALSE; -- Still locked out
        END IF;

        -- Update attempt count
        UPDATE public.failed_login_attempts
        SET
            attempt_count = attempt_count + 1,
            ip_address = COALESCE(p_ip_address, attempt_record.ip_address),
            user_agent = COALESCE(p_user_agent, attempt_record.user_agent),
            updated_at = NOW(),
            locked_until = CASE
                WHEN attempt_count + 1 >= lockout_threshold THEN NOW() + lockout_duration
                ELSE NULL
            END
        WHERE id = attempt_record.id;

        -- Log the security event
        PERFORM public.log_security_event(
            'FAILED_LOGIN_ATTEMPT',
            CASE
                WHEN attempt_count + 1 >= lockout_threshold THEN 'high'
                ELSE 'medium'
            END,
            NULL,
            p_ip_address,
            p_user_agent,
            json_build_object('email', p_email, 'attempt_count', attempt_count + 1)
        );

        RETURN attempt_count + 1 < lockout_threshold;
    ELSE
        -- Create new record
        INSERT INTO public.failed_login_attempts (
            email,
            ip_address,
            user_agent,
            attempt_count,
            locked_until
        ) VALUES (
            p_email,
            p_ip_address,
            p_user_agent,
            1,
            NULL
        );

        -- Log the security event
        PERFORM public.log_security_event(
            'FAILED_LOGIN_ATTEMPT',
            'low',
            NULL,
            p_ip_address,
            p_user_agent,
            json_build_object('email', p_email, 'attempt_count', 1)
        );

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clear failed login attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(p_email VARCHAR(255))
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.failed_login_attempts WHERE email = p_email;

    -- Log the successful login
    PERFORM public.log_security_event(
        'SUCCESSFUL_LOGIN',
        'low',
        auth.uid(),
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent',
        json_build_object('email', p_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate API key
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash TEXT, p_required_permissions TEXT[] DEFAULT '{}')
RETURNS TABLE(
    key_id UUID,
    user_id UUID,
    permissions TEXT[],
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ak.id,
        ak.user_id,
        ak.permissions,
        (ak.is_active AND (ak.expires_at IS NULL OR ak.expires_at > NOW()) AND
         (p_required_permissions <@ ak.permissions OR p_required_permissions = '{}'))::BOOLEAN as is_valid
    FROM public.api_keys ak
    WHERE ak.key_hash = p_key_hash;

    -- Log API key usage
    IF FOUND THEN
        UPDATE public.api_keys
        SET last_used_at = NOW()
        WHERE key_hash = p_key_hash;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate secure random API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
    key_bytes BYTEA;
    api_key TEXT;
BEGIN
    -- Generate 32 random bytes
    key_bytes := gen_random_bytes(32);

    -- Convert to hex and add prefix
    api_key := 'mk_' || encode(key_bytes, 'hex');

    RETURN api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create API key
CREATE OR REPLACE FUNCTION public.create_api_key(
    p_name VARCHAR(255),
    p_user_id UUID,
    p_permissions TEXT[] DEFAULT '{}',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    key_id UUID,
    api_key TEXT
) AS $$
DECLARE
    new_key TEXT;
    new_key_id UUID;
BEGIN
    -- Generate API key
    new_key := public.generate_api_key();

    -- Insert into database with hash
    INSERT INTO public.api_keys (
        name,
        key_hash,
        user_id,
        permissions,
        expires_at
    ) VALUES (
        p_name,
        public.hash_api_key(new_key),
        p_user_id,
        p_permissions,
        p_expires_at
    ) RETURNING id INTO new_key_id;

    -- Log API key creation
    PERFORM public.log_security_event(
        'API_KEY_CREATED',
        'medium',
        p_user_id,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent',
        json_build_object('key_id', new_key_id, 'name', p_name)
    );

    RETURN QUERY VALUES (new_key_id, new_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON public.security_audit_logs TO service_role;
GRANT ALL ON public.failed_login_attempts TO service_role;
GRANT ALL ON public.api_keys TO service_role;
GRANT ALL ON public.api_key_usage TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.log_security_event TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_failed_login TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_failed_login_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.hash_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.create_api_key TO service_role;

-- Create updated_at trigger for failed_login_attempts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_failed_login_attempts_updated_at
    BEFORE UPDATE ON public.failed_login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Clean up old security audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.security_audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old API key usage logs (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.api_key_usage
    WHERE created_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_details_gin ON public.security_audit_logs USING gin(details);
CREATE INDEX IF NOT EXISTS idx_api_keys_permissions_gin ON public.api_keys USING gin(permissions);