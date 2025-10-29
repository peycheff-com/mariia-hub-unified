-- Comprehensive Consent Management System for GDPR Compliance
-- Migration: Model Consent and Usage Tracking System

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main consent records table
CREATE TABLE model_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Consent classification
    consent_type TEXT NOT NULL CHECK (consent_type IN ('photo', 'video', 'testimonial', 'review', 'case_study')),
    scope JSONB NOT NULL DEFAULT '{}', -- {website, social_media, portfolio, ads, print, internal_use}

    -- Duration and expiry
    duration TEXT NOT NULL CHECK (duration IN ('permanent', 'time_limited', 'campaign_specific', 'service_related')),
    expiry_date DATE,
    campaign_name TEXT,

    -- Compensation and commercial terms
    compensation_details TEXT,
    compensation_type TEXT CHECK (compensation_type IN ('none', 'discount', 'service', 'cash', 'gift')),
    compensation_value DECIMAL(10, 2),

    -- Usage restrictions
    restrictions TEXT[] DEFAULT '{}',
    approved_contexts TEXT[] DEFAULT '{}', -- Specific contexts where content can be used
    geographic_scope TEXT[] DEFAULT '{}', -- Geographic regions where content can be used

    -- Signature and legal verification
    signature_data JSONB NOT NULL DEFAULT '{}', -- {type: 'drawn'|'typed'|'uploaded', data: string, timestamp: string}
    signature_method TEXT NOT NULL CHECK (signature_method IN ('drawn', 'typed', 'uploaded', 'verbal')),
    legal_representative TEXT, -- For minors or legal guardians

    -- Technical tracking
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    consent_language TEXT NOT NULL DEFAULT 'en',

    -- Status and lifecycle
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended', 'pending')),
    revocation_reason TEXT,
    revocation_date TIMESTAMP,

    -- Audit fields
    consent_date TIMESTAMP DEFAULT now(),
    reviewed_at TIMESTAMP,
    approved_by UUID REFERENCES profiles(id), -- Staff member who reviewed/approved
    notes TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional consent metadata
    tags TEXT[] DEFAULT '{}',

    -- System fields
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES profiles(id),

    -- Constraints
    CONSTRAINT valid_expiry_date CHECK (
        (duration = 'permanent' AND expiry_date IS NULL) OR
        (duration != 'permanent' AND expiry_date IS NOT NULL AND expiry_date > consent_date)
    ),
    CONSTRAINT compensation_value_check CHECK (
        compensation_type IN ('none', 'discount', 'service', 'gift') OR
        (compensation_type IN ('cash') AND compensation_value > 0)
    )
);

-- Consent usage tracking table
CREATE TABLE consent_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID REFERENCES model_consent(id) ON DELETE CASCADE,

    -- Usage details
    usage_type TEXT NOT NULL CHECK (usage_type IN ('website', 'social_media', 'portfolio', 'advertisement', 'print', 'email', 'case_study', 'testimonial', 'other')),
    usage_context TEXT NOT NULL, -- Where/how the content was used
    usage_description TEXT,

    -- Media details
    media_type TEXT CHECK (media_type IN ('photo', 'video', 'text', 'audio', 'mixed')),
    media_urls TEXT[] DEFAULT '{}',
    campaign_id TEXT,

    -- Geographic and time details
    geographic_region TEXT,
    display_start_date DATE,
    display_end_date DATE,
    impressions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,

    -- Attribution and tracking
    used_by UUID REFERENCES profiles(id), -- Staff member who used the consent
    department TEXT,
    project_name TEXT,

    -- Compliance
    compliance_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    usage_approved BOOLEAN DEFAULT false,
    approval_date TIMESTAMP,

    -- System fields
    used_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Consent requests table (for tracking consent requests sent to clients)
CREATE TABLE consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

    -- Request details
    request_type TEXT NOT NULL CHECK (request_type IN ('photo', 'video', 'testimonial', 'review', 'case_study')),
    request_purpose TEXT NOT NULL,
    usage_context JSONB DEFAULT '{}',

    -- Request communication
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    email_template_used TEXT,
    sms_sent BOOLEAN DEFAULT false,
    sms_sent_at TIMESTAMP,

    -- Response tracking
    response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'approved', 'declined', 'expired', 'withdrawn')),
    response_date TIMESTAMP,
    consent_form_url TEXT,
    consent_form_token UUID DEFAULT gen_random_uuid() UNIQUE,

    -- Expiry
    expires_at TIMESTAMP DEFAULT (now() + interval '30 days'),

    -- System fields
    created_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP DEFAULT now()
);

-- Consent templates table
CREATE TABLE consent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template identification
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('photo', 'video', 'testimonial', 'review', 'case_study')),
    language TEXT NOT NULL DEFAULT 'en',

    -- Template content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    consent_text TEXT NOT NULL, -- The legal consent text
    explanation_text TEXT, -- Simple explanation for clients

    -- Default settings
    default_scope JSONB DEFAULT '{}',
    default_duration TEXT DEFAULT 'permanent',
    default_compensation_type TEXT DEFAULT 'none',

    -- Usage examples and visuals
    usage_examples TEXT[] DEFAULT '{}',
    visual_examples TEXT[] DEFAULT '{}', -- URLs to example images/videos

    -- Legal and compliance
    legal_version TEXT,
    compliance_notes TEXT,
    required_fields TEXT[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- System fields
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES profiles(id)
);

-- Consent revocations table
CREATE TABLE consent_revocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID REFERENCES model_consent(id) ON DELETE CASCADE,

    -- Revocation details
    revocation_type TEXT NOT NULL CHECK (revocation_type IN ('client_request', 'time_expiry', 'policy_change', 'compliance_issue', 'other')),
    revocation_reason TEXT NOT NULL,

    -- Processing details
    processed_by UUID REFERENCES profiles(id), -- Staff member who processed revocation
    removal_request_date TIMESTAMP,
    removal_completed_date TIMESTAMP,

    -- Content removal tracking
    content_removed_from TEXT[] DEFAULT '{}', -- Where content was removed from
    removal_confirmed BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,

    -- Legal and compliance
    legal_reference TEXT,
    compliance_notes TEXT,

    -- System fields
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_model_consent_client_id ON model_consent(client_id);
CREATE INDEX idx_model_consent_booking_id ON model_consent(booking_id);
CREATE INDEX idx_model_consent_status ON model_consent(status);
CREATE INDEX idx_model_consent_consent_type ON model_consent(consent_type);
CREATE INDEX idx_model_consent_expiry_date ON model_consent(expiry_date);
CREATE INDEX idx_model_consent_created_at ON model_consent(created_at);

CREATE INDEX idx_consent_usage_log_consent_id ON consent_usage_log(consent_id);
CREATE INDEX idx_consent_usage_log_usage_type ON consent_usage_log(usage_type);
CREATE INDEX idx_consent_usage_log_used_at ON consent_usage_log(used_at);
CREATE INDEX idx_consent_usage_log_used_by ON consent_usage_log(used_by);

CREATE INDEX idx_consent_requests_client_id ON consent_requests(client_id);
CREATE INDEX idx_consent_requests_booking_id ON consent_requests(booking_id);
CREATE INDEX idx_consent_requests_status ON consent_requests(response_status);
CREATE INDEX idx_consent_requests_consent_form_token ON consent_requests(consent_form_token);

CREATE INDEX idx_consent_templates_type ON consent_templates(template_type);
CREATE INDEX idx_consent_templates_language ON consent_templates(language);
CREATE INDEX idx_consent_templates_active ON consent_templates(is_active);

CREATE INDEX idx_consent_revocations_consent_id ON consent_revocations(consent_id);
CREATE INDEX idx_consent_revocations_type ON consent_revocations(revocation_type);

-- RLS Policies
ALTER TABLE model_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_revocations ENABLE ROW LEVEL SECURITY;

-- Model Consent RLS Policies
CREATE POLICY "Users can view their own consent records" ON model_consent
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Staff can view consent records" ON model_consent
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

CREATE POLICY "Staff can insert consent records" ON model_consent
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

CREATE POLICY "Staff can update consent records" ON model_consent
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

-- Consent Usage Log RLS Policies
CREATE POLICY "Users can view usage of their consent" ON consent_usage_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM model_consent
            WHERE model_consent.id = consent_usage_log.consent_id
            AND model_consent.client_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all usage logs" ON consent_usage_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

CREATE POLICY "Staff can insert usage logs" ON consent_usage_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

-- Consent Requests RLS Policies
CREATE POLICY "Users can view their consent requests" ON consent_requests
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Staff can view all consent requests" ON consent_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

CREATE POLICY "Staff can manage consent requests" ON consent_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

-- Consent Templates RLS Policies
CREATE POLICY "Authenticated users can view active templates" ON consent_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage templates" ON consent_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

-- Consent Revocations RLS Policies
CREATE POLICY "Users can view revocations of their consent" ON consent_revocations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM model_consent
            WHERE model_consent.id = consent_revocations.consent_id
            AND model_consent.client_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage revocations" ON consent_revocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'staff' OR profiles.role = 'manager')
        )
    );

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_model_consent_updated_at
    BEFORE UPDATE ON model_consent
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_updated_at();

CREATE TRIGGER trigger_consent_requests_updated_at
    BEFORE UPDATE ON consent_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_updated_at();

CREATE TRIGGER trigger_consent_templates_updated_at
    BEFORE UPDATE ON consent_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_updated_at();

CREATE TRIGGER trigger_consent_revocations_updated_at
    BEFORE UPDATE ON consent_revocations
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_updated_at();

-- Function to check if consent is valid and active
CREATE OR REPLACE FUNCTION is_consent_active(consent_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    consent_record model_consent%ROWTYPE;
BEGIN
    SELECT * INTO consent_record
    FROM model_consent
    WHERE id = consent_uuid;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check status
    IF consent_record.status != 'active' THEN
        RETURN FALSE;
    END IF;

    -- Check expiry
    IF consent_record.duration != 'permanent' AND consent_record.expiry_date < CURRENT_DATE THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to log consent usage
CREATE OR REPLACE FUNCTION log_consent_usage(
    consent_uuid UUID,
    usage_type_param TEXT,
    usage_context_param TEXT,
    used_by_uuid UUID,
    additional_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    usage_log_id UUID;
BEGIN
    -- Check if consent is active
    IF NOT is_consent_active(consent_uuid) THEN
        RAISE EXCEPTION 'Consent is not active or expired';
    END IF;

    -- Create usage log entry
    INSERT INTO consent_usage_log (
        consent_id,
        usage_type,
        usage_context,
        used_by,
        metadata
    ) VALUES (
        consent_uuid,
        usage_type_param,
        usage_context_param,
        used_by_uuid,
        additional_metadata
    ) RETURNING id INTO usage_log_id;

    RETURN usage_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke consent
CREATE OR REPLACE FUNCTION revoke_consent(
    consent_uuid UUID,
    revocation_reason_param TEXT,
    revocation_type_param TEXT DEFAULT 'client_request',
    processed_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    revocation_id UUID;
BEGIN
    -- Update consent status
    UPDATE model_consent
    SET
        status = 'revoked',
        revocation_reason = revocation_reason_param,
        revocation_date = now()
    WHERE id = consent_uuid;

    -- Create revocation record
    INSERT INTO consent_revocations (
        consent_id,
        revocation_type,
        revocation_reason,
        processed_by,
        removal_request_date
    ) VALUES (
        consent_uuid,
        revocation_type_param,
        revocation_reason_param,
        processed_by_uuid,
        now()
    ) RETURNING id INTO revocation_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check expiring consents (for notifications)
CREATE OR REPLACE FUNCTION get_expiring_consent(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    consent_id UUID,
    client_id UUID,
    client_email TEXT,
    client_name TEXT,
    consent_type TEXT,
    expiry_date DATE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.id,
        mc.client_id,
        p.email,
        p.full_name,
        mc.consent_type,
        mc.expiry_date,
        (mc.expiry_date - CURRENT_DATE)::INTEGER as days_remaining
    FROM model_consent mc
    JOIN profiles p ON mc.client_id = p.id
    WHERE
        mc.status = 'active'
        AND mc.duration != 'permanent'
        AND mc.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_ahead * INTERVAL '1 day')
    ORDER BY mc.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Default consent templates
INSERT INTO consent_templates (name, template_type, language, title, description, consent_text, explanation_text, default_scope, default_duration, is_default) VALUES
(
    'Photo Usage - English',
    'photo',
    'en',
    'Photography Consent Form',
    'Consent for the use of photographs taken during your beauty/fitness treatment',
    'I hereby grant irrevocable consent for [Business Name] to photograph me during my treatment and use these photographs for the following purposes: website, social media, portfolio, and marketing materials. I understand that these photographs may be edited for professional presentation. I confirm that I am 18 years of age or older and have the full legal capacity to grant this consent.',
    'This allows us to share your amazing results with others who might benefit from our services. Your photos help showcase our work and inspire others.',
    '{"website": true, "social_media": true, "portfolio": true, "ads": false}',
    'permanent',
    true
),
(
    'Photo Usage - Polish',
    'photo',
    'pl',
    'Formularz Zgody na Fotografowanie',
    'Zgoda na wykorzystanie zdjęć wykonanych podczas zabiegu kosmetycznego/fitness',
    'Niniejszym udzielam nieodwołalnej zgody dla [Business Name] na fotografowanie mnie podczas mojego zabiegu i wykorzystanie tych fotografii do następujących celów: strona internetowa, media społecznościowe, portfolio i materiały marketingowe. Rozumiem, że te fotografie mogą być edytowane w celu profesjonalnej prezentacji. Potwierdzam, że mam ukończone 18 lat i posiadam pełną zdolność prawną do udzielenia tej zgody.',
    'To pozwala nam dzielić się Twoimi niesamowitymi rezultatami z innymi, którzy mogą skorzystać z naszych usług. Twoje zdjęcia pomagają pokazać naszą pracę i inspirować innych.',
    '{"website": true, "social_media": true, "portfolio": true, "ads": false}',
    'permanent',
    true
),
(
    'Video Usage - English',
    'video',
    'en',
    'Video Recording Consent Form',
    'Consent for video recording during your beauty/fitness treatment',
    'I hereby grant irrevocable consent for [Business Name] to record video of me during my treatment and use this footage for the following purposes: website, social media, portfolio, and marketing materials. I understand that the video may be edited for professional presentation and that my voice may be included. I confirm that I am 18 years of age or older and have the full legal capacity to grant this consent.',
    'Video testimonials help others understand the treatment experience and benefits. Your story could inspire someone to start their own wellness journey.',
    '{"website": true, "social_media": true, "portfolio": true, "ads": false}',
    'permanent',
    false
),
(
    'Testimonial Usage - English',
    'testimonial',
    'en',
    'Testimonial Consent Form',
    'Consent for the use of your testimonials and reviews',
    'I hereby grant consent for [Business Name] to use my testimonials, reviews, and feedback about their services in marketing materials, website, social media, and other promotional channels. I confirm that the testimonials provided are based on my genuine experience and that I have the full legal capacity to grant this consent.',
    'Your honest feedback helps others make informed decisions about our services and helps us improve our offerings.',
    '{"website": true, "social_media": true, "portfolio": true, "ads": false}',
    'permanent',
    false
);

-- Comments for documentation
COMMENT ON TABLE model_consent IS 'Main table storing all client consent records for GDPR compliance';
COMMENT ON TABLE consent_usage_log IS 'Tracks every instance where consented content is used';
COMMENT ON TABLE consent_requests IS 'Tracks consent requests sent to clients and their responses';
COMMENT ON TABLE consent_templates IS 'Template system for creating standardized consent forms';
COMMENT ON TABLE consent_revocations IS 'Records all consent revocations and content removal processes';

COMMENT ON COLUMN model_consent.signature_data IS 'Stores electronic signature information including type (drawn/typed/uploaded) and signature data';
COMMENT ON COLUMN model_consent.scope IS 'JSON object defining where content can be used (website, social_media, portfolio, ads, etc.)';
COMMENT ON COLUMN model_consent.restrictions IS 'Array of specific restrictions or limitations on content usage';
COMMENT ON COLUMN consent_usage_log.usage_context IS 'Detailed description of where and how the content was used';
COMMENT ON COLUMN consent_requests.consent_form_token IS 'Unique token for secure access to online consent forms';