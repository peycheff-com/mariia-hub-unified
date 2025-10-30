-- GDPR Compliance Database Schema for Mariia Hub
-- This migration adds comprehensive GDPR compliance functionality

-- Cookie consent categories
CREATE TYPE cookie_consent_category AS ENUM (
  'essential',     -- Essential cookies for basic functionality
  'analytics',     -- Analytics and performance cookies
  'marketing',     -- Marketing and advertising cookies
  'personalization' -- Personalization and user experience cookies
);

-- Data processing lawful bases
CREATE TYPE processing_lawful_basis AS ENUM (
  'consent',           -- User has given clear consent
  'contract',          -- Processing is necessary for contract performance
  'legal_obligation',  -- Processing is required by law
  'vital_interests',   -- Processing is necessary to protect vital interests
  'public_task',       -- Processing is necessary for public interest tasks
  'legitimate_interests' -- Processing is necessary for legitimate interests
);

-- Data subject request types
CREATE TYPE data_subject_request_type AS ENUM (
  'access',         -- Right to access personal data
  'rectification',  -- Right to correct inaccurate data
  'erasure',        -- Right to delete personal data (right to be forgotten)
  'portability',    -- Right to data portability
  'restriction',    -- Right to restrict processing
  'objection'       -- Right to object to processing
);

-- Data retention periods
CREATE TYPE retention_period AS ENUM (
  'immediate',      -- Delete immediately
  '24_hours',      -- Keep for 24 hours
  '7_days',        -- Keep for 7 days
  '30_days',       -- Keep for 30 days
  '90_days',       -- Keep for 90 days
  '6_months',      -- Keep for 6 months
  '1_year',        -- Keep for 1 year
  '2_years',       -- Keep for 2 years
  '5_years',       -- Keep for 5 years
  '7_years',       -- Keep for 7 years (legal requirement)
  'indefinite'     -- Keep indefinitely
);

-- Cookie Consent Records Table
CREATE TABLE cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_data JSONB NOT NULL DEFAULT '{}', -- Granular consent preferences
  ip_address INET,
  user_agent TEXT,
  consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing Activities Register Table
CREATE TABLE processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  lawful_basis processing_lawful_basis NOT NULL,
  data_categories TEXT[] NOT NULL, -- Types of personal data processed
  purposes TEXT[] NOT NULL, -- Purposes of processing
  recipients TEXT[] NOT NULL, -- Who receives the data
  retention_period retention_period NOT NULL,
  automated_decision_making BOOLEAN DEFAULT FALSE,
  international_transfer BOOLEAN DEFAULT FALSE,
  security_measures JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Processing Logs Table
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES processing_activities(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  action TEXT NOT NULL, -- Action performed (create, read, update, delete, export)
  data_affected JSONB NOT NULL DEFAULT '{}', -- Description of data affected
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lawful_basis_at_time processing_lawful_basis,
  purpose_at_time TEXT
);

-- Data Subject Requests Table
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type data_subject_request_type NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_data JSONB DEFAULT '{}', -- What data the user is requesting
  response_data JSONB DEFAULT '{}', -- Response to the request
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Retention Policies Table
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  data_category TEXT NOT NULL,
  retention_period retention_period NOT NULL,
  automatic_cleanup BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Policy Versions Table
CREATE TABLE privacy_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy Acceptance Records Table
CREATE TABLE policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES privacy_policy_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(policy_id, user_id)
);

-- Anonymized Data for Analytics Table
CREATE TABLE anonymized_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  anonymized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_date_range TEXT, -- Date range of original data (e.g., "2024-01-01 to 2024-01-31")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session_id ON cookie_consents(session_id);
CREATE INDEX idx_processing_logs_activity_id ON processing_logs(activity_id);
CREATE INDEX idx_processing_logs_user_id ON processing_logs(user_id);
CREATE INDEX idx_processing_logs_timestamp ON processing_logs(timestamp);
CREATE INDEX idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_policy_acceptances_user_id ON policy_acceptances(user_id);
CREATE INDEX idx_policy_acceptances_policy_id ON policy_acceptances(policy_id);

-- Row Level Security (RLS) Policies

-- Cookie Consents RLS
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cookie consents" ON cookie_consents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own cookie consents" ON cookie_consents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cookie consents" ON cookie_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Processing Logs RLS
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own processing logs" ON processing_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Data Subject Requests RLS
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data subject requests" ON data_subject_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own data subject requests" ON data_subject_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy Acceptances RLS
ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own policy acceptances" ON policy_acceptances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own policy acceptances" ON policy_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON cookie_consents TO authenticated;
GRANT SELECT ON processing_activities TO authenticated;
GRANT SELECT ON processing_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON data_subject_requests TO authenticated;
GRANT SELECT ON privacy_policy_versions TO authenticated;
GRANT SELECT, INSERT ON policy_acceptances TO authenticated;

-- Create initial processing activities
INSERT INTO processing_activities (name, description, lawful_basis, data_categories, purposes, recipients, retention_period, security_measures) VALUES
('User Authentication', 'Processing of user authentication data for account access', 'contract', ARRAY['email', 'password_hash', 'authentication_tokens'], ARRAY['user_authentication', 'account_management'], ARRAY['service_providers', 'payment_processors'], 'indefinite', '{"encryption": "AES-256", "access_control": "role_based", "audit_logging": true}'),
('Booking Management', 'Processing of booking information for service scheduling', 'contract', ARRAY['name', 'email', 'phone', 'booking_details', 'payment_information'], ARRAY['service_booking', 'payment_processing', 'communication'], ARRAY['service_providers', 'payment_processors'], '2_years', '{"encryption": "AES-256", "access_control": "role_based", "audit_logging": true}'),
('Email Communication', 'Sending transactional and marketing emails', 'consent', ARRAY['email', 'name', 'preferences'], ARRAY['transactional_emails', 'marketing_communications', 'customer_support'], ARRAY['email_service_providers'], 'indefinite', '{"encryption": "TLS", "unsubscribe_mechanism": true, "data_minimization": true}'),
('Analytics Processing', 'Collection and analysis of usage data for service improvement', 'legitimate_interests', ARRAY['ip_address', 'user_agent', 'usage_patterns', 'device_information'], ARRAY['analytics', 'service_improvement', 'security_monitoring'], ARRAY['analytics_providers'], '1_year', '{"anonymization": true, "data_minimization": true, "pseudonymization": true}'),
('Customer Support', 'Processing of support requests and communications', 'contract', ARRAY['name', 'email', 'support_request_details', 'communication_history'], ARRAY['customer_support', 'issue_resolution', 'service_improvement'], ARRAY['support_staff', 'service_providers'], '5_years', '{"encryption": "AES-256", "access_control": "role_based", "audit_logging": true}');

-- Create initial retention policies
INSERT INTO retention_policies (name, description, data_category, retention_period, automatic_cleanup) VALUES
('Booking Data', 'Retain booking records for legal and business purposes', 'booking_data', '7_years', true),
('User Accounts', 'Retain user accounts as long as they remain active', 'user_accounts', 'indefinite', false),
('Analytics Data', 'Anonymize and retain analytics data for improvement purposes', 'analytics_data', '1_year', true),
('Support Communications', 'Retain support communications for quality and legal purposes', 'support_communications', '5_years', true),
('Marketing Data', 'Retain marketing consent and preferences while user is subscribed', 'marketing_data', 'indefinite', false);

-- Create initial privacy policy version
INSERT INTO privacy_policy_versions (version, title, content, summary, effective_date) VALUES
('1.0', 'Privacy Policy - Mariia Hub',
'Full privacy policy content here...',
'This policy explains how we collect, use, and protect your personal data.',
NOW());

-- Create function to check if user has given specific consent
CREATE OR REPLACE FUNCTION has_consent(user_uuid UUID, consent_category cookie_consent_category)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cookie_consents
    WHERE user_id = user_uuid
    AND consent_data->>'category' = consent_category::text
    AND consent_data->>'granted' = 'true'
    ORDER BY consent_timestamp DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log processing activities
CREATE OR REPLACE FUNCTION log_processing_activity(
  activity_name TEXT,
  user_action TEXT,
  user_uuid UUID DEFAULT NULL,
  session_uuid TEXT DEFAULT NULL,
  data_affected JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  activity_record UUID;
BEGIN
  -- Find the processing activity
  SELECT id INTO activity_record
  FROM processing_activities
  WHERE name = activity_name
  LIMIT 1;

  -- Log the activity
  INSERT INTO processing_logs (
    activity_id,
    user_id,
    session_id,
    action,
    data_affected,
    ip_address,
    user_agent,
    timestamp
  ) VALUES (
    activity_record,
    user_uuid,
    session_uuid,
    user_action,
    data_affected,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for automated data cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
  -- This function would be called by a scheduled job
  -- Implementation depends on specific retention requirements

  -- Example: Cleanup old processing logs beyond retention period
  DELETE FROM processing_logs
  WHERE timestamp < NOW() - INTERVAL '2 years';

  -- Example: Anonymize old analytics data
  INSERT INTO anonymized_analytics (event_type, event_data, original_date_range)
  SELECT 'historical_analytics', jsonb_build_object('count', COUNT(*)),
         date_trunc('month', timestamp)::text || ' to ' || (date_trunc('month', timestamp) + INTERVAL '1 month')::text
  FROM processing_logs
  WHERE timestamp < NOW() - INTERVAL '1 year'
  GROUP BY date_trunc('month', timestamp);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_cookie_consents_updated_at BEFORE UPDATE ON cookie_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_activities_updated_at BEFORE UPDATE ON processing_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON data_subject_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_privacy_policy_versions_updated_at BEFORE UPDATE ON privacy_policy_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create comment documentation for tables
COMMENT ON TABLE cookie_consents IS 'Stores user cookie consent preferences and compliance records';
COMMENT ON TABLE processing_activities IS 'Register of all data processing activities as required by GDPR';
COMMENT ON TABLE processing_logs IS 'Audit log of all data processing activities';
COMMENT ON TABLE data_subject_requests IS 'GDPR data subject rights requests (access, deletion, etc.)';
COMMENT ON TABLE retention_policies IS 'Data retention policies and cleanup schedules';
COMMENT ON TABLE privacy_policy_versions IS 'Privacy policy versions and change tracking';
COMMENT ON TABLE policy_acceptances IS 'Records of user consent to privacy policies';
COMMENT ON TABLE anonymized_analytics IS 'Anonymized data for analytics after retention period';