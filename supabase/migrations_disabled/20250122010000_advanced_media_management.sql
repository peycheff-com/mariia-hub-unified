-- Migration for Advanced Media Management System
-- Adds C2PA watermarking, model consent management, before/after comparisons, and comprehensive media asset management

-- 1. Media Assets Management (Extended)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL(10,2), -- For video
  color_profile TEXT,
  dpi INTEGER,
  format TEXT,
  checksum TEXT NOT NULL UNIQUE, -- SHA-256 hash for integrity verification
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  cdn_url TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  alt_text TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. C2PA Watermarking System
CREATE TABLE IF NOT EXISTS c2pa_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  manifest JSONB NOT NULL, -- The C2PA manifest data
  signature JSONB NOT NULL, -- Digital signature information
  claim_generator TEXT NOT NULL, -- Tool used to generate the claim
  claim_generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'tampered')),
  validation_details JSONB DEFAULT '{}',
  public_key TEXT,
  certificate_chain JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c2pa_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID REFERENCES c2pa_manifests(id) ON DELETE CASCADE,
  assertion_type TEXT NOT NULL,
  assertion_data JSONB NOT NULL,
  assertion_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Model Consent Management
CREATE TABLE IF NOT EXISTS model_consent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  content JSONB NOT NULL, -- Rich text content of the consent form
  fields JSONB NOT NULL DEFAULT '[]', -- Form field definitions
  is_active BOOLEAN DEFAULT true,
  required_for_photos BOOLEAN DEFAULT true,
  required_for_videos BOOLEAN DEFAULT true,
  expiry_duration_months INTEGER DEFAULT 12,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_consent_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_form_id UUID REFERENCES model_consent_forms(id) ON DELETE CASCADE,
  model_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_email TEXT,
  model_phone TEXT,
  signature_data JSONB NOT NULL, -- E-signature data points
  signature_image_url TEXT, -- Visual signature image
  ip_address INET,
  user_agent TEXT,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  specific_usage JSONB DEFAULT '{}', -- Specific usage permissions
  restrictions JSONB DEFAULT '[]', -- Usage restrictions
  revocation_reason TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consent_form_id, model_id, consent_date)
);

-- 4. Before/After Comparison System
CREATE TABLE IF NOT EXISTS before_after_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  before_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  after_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  treatment_date DATE,
  time_interval_days INTEGER,
  consent_signature_id UUID REFERENCES model_consent_signatures(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comparison_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID REFERENCES before_after_comparisons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'slider_move', 'zoom', 'fullscreen', 'share')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Media Version Control
CREATE TABLE IF NOT EXISTS media_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('original', 'edit', 'resize', 'watermark', 'compress', 'color_correct')),
  editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edit_operations JSONB DEFAULT '[]',
  edit_parameters JSONB DEFAULT '{}',
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Media Asset Metadata and Tagging
CREATE TABLE IF NOT EXISTS media_metadata_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('content', 'technical', 'legal', 'location', 'people', 'treatment', 'style')),
  color TEXT, -- Hex color for UI display
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- System tags cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_asset_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES media_metadata_tags(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.00 to 1.00 for AI-detected tags
  auto_detected BOOLEAN DEFAULT false,
  detected_by JSONB, -- AI model information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(asset_id, tag_id)
);

-- 7. Media Processing Queue
CREATE TABLE IF NOT EXISTS media_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('thumbnail', 'watermark', 'compress', 'analyze', 'c2pa_sign', 'face_detect', 'nsfw_detect')),
  job_status TEXT NOT NULL DEFAULT 'pending' CHECK (job_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1-10, lower numbers = higher priority
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  job_data JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Face Detection and Privacy Controls
CREATE TABLE IF NOT EXISTS media_face_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  face_id TEXT NOT NULL, -- Unique identifier for this face
  bounding_box JSONB NOT NULL, -- {x, y, width, height}
  confidence_score DECIMAL(3,2) NOT NULL,
  age_estimate INTEGER,
  gender TEXT,
  expression TEXT,
  landmarks JSONB, -- Facial landmark points
  blur_applied BOOLEAN DEFAULT false,
  blur_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_privacy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  control_type TEXT NOT NULL CHECK (control_type IN ('face_blur', 'age_gate', 'geo_restriction', 'watermark', 'access_level')),
  control_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Media Access Control and Moderation
CREATE TABLE IF NOT EXISTS media_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'edit')),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_reason TEXT NOT NULL,
  report_details TEXT,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review')),
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_notes TEXT,
  auto_flagged BOOLEAN DEFAULT false,
  flag_confidence DECIMAL(3,2),
  flag_reasons JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Media Collections and Galleries
CREATE TABLE IF NOT EXISTS media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('portfolio', 'gallery', 'case_study', 'testimonials', 'social', 'internal')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'unlisted', 'private', 'password')),
  password_hash TEXT,
  sort_order JSONB DEFAULT '{"field": "created_at", "direction": "desc"}',
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_collection_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES media_collections(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, asset_id)
);

-- Indexes for Performance
CREATE INDEX idx_media_assets_checksum ON media_assets(checksum);
CREATE INDEX idx_media_assets_mime_type ON media_assets(mime_type);
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at DESC);
CREATE INDEX idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);
CREATE INDEX idx_media_assets_metadata ON media_assets USING GIN(metadata);

CREATE INDEX idx_c2pa_manifests_media_asset_id ON c2pa_manifests(media_asset_id);
CREATE INDEX idx_c2pa_manifests_validation_status ON c2pa_manifests(validation_status);
CREATE INDEX idx_c2pa_assertions_manifest_id ON c2pa_assertions(manifest_id);

CREATE INDEX idx_model_consent_signatures_model_id ON model_consent_signatures(model_id);
CREATE INDEX idx_model_consent_signatures_consent_form_id ON model_consent_signatures(consent_form_id);
CREATE INDEX idx_model_consent_signatures_is_active ON model_consent_signatures(is_active);
CREATE INDEX idx_model_consent_signatures_expiry_date ON model_consent_signatures(expiry_date);

CREATE INDEX idx_before_after_comparisons_service_id ON before_after_comparisons(service_id);
CREATE INDEX idx_before_after_comparisons_treatment_id ON before_after_comparisons(treatment_id);
CREATE INDEX idx_before_after_comparisons_is_featured ON before_after_comparisons(is_featured);

CREATE INDEX idx_media_versions_parent_asset_id ON media_versions(parent_asset_id);
CREATE INDEX idx_media_versions_is_current ON media_versions(is_current);

CREATE INDEX idx_media_asset_tags_asset_id ON media_asset_tags(asset_id);
CREATE INDEX idx_media_asset_tags_tag_id ON media_asset_tags(tag_id);

CREATE INDEX idx_media_processing_jobs_asset_id ON media_processing_jobs(asset_id);
CREATE INDEX idx_media_processing_jobs_status ON media_processing_jobs(job_status);
CREATE INDEX idx_media_processing_jobs_job_type ON media_processing_jobs(job_type);
CREATE INDEX idx_media_processing_jobs_next_retry ON media_processing_jobs(next_retry_at) WHERE job_status = 'failed';

CREATE INDEX idx_media_face_detections_asset_id ON media_face_detections(asset_id);
CREATE INDEX idx_media_privacy_controls_asset_id ON media_privacy_controls(asset_id);

CREATE INDEX idx_media_access_logs_asset_id ON media_access_logs(asset_id);
CREATE INDEX idx_media_access_logs_created_at ON media_access_logs(created_at DESC);

CREATE INDEX idx_media_moderation_queue_asset_id ON media_moderation_queue(asset_id);
CREATE INDEX idx_media_moderation_queue_status ON media_moderation_queue(moderation_status);

CREATE INDEX idx_media_collections_collection_type ON media_collections(collection_type);
CREATE INDEX idx_media_collections_visibility ON media_collections(visibility);
CREATE INDEX idx_media_collection_assets_collection_id ON media_collection_assets(collection_id);

-- Enable Row Level Security
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE c2pa_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_consent_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_face_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_privacy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collection_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Media Assets
CREATE POLICY "Public can view approved media assets" ON media_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM media_moderation_queue mq
      WHERE mq.asset_id = media_assets.id
      AND mq.moderation_status = 'approved'
    )
  );

CREATE POLICY "Admins can manage all media assets" ON media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own media assets" ON media_assets
  FOR SELECT USING (uploaded_by = auth.uid());

-- C2PA Manifests
CREATE POLICY "Admins can manage C2PA manifests" ON c2pa_manifests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Model Consent Forms
CREATE POLICY "Admins can manage consent forms" ON model_consent_forms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active consent forms" ON model_consent_forms
  FOR SELECT USING (is_active = true);

-- Model Consent Signatures
CREATE POLICY "Admins can manage all consent signatures" ON model_consent_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own consent signatures" ON model_consent_signatures
  FOR SELECT USING (model_id = auth.uid());

-- Before/After Comparisons
CREATE POLICY "Public can view verified comparisons" ON before_after_comparisons
  FOR SELECT USING (
    verification_status = 'verified'
    AND EXISTS (
      SELECT 1 FROM media_moderation_queue mq
      WHERE mq.asset_id IN (before_asset_id, after_asset_id)
      AND mq.moderation_status = 'approved'
    )
  );

CREATE POLICY "Admins can manage all comparisons" ON before_after_comparisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Media Collections
CREATE POLICY "Public can view public collections" ON media_collections
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Admins can manage all collections" ON media_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_c2pa_manifests_updated_at BEFORE UPDATE ON c2pa_manifests
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_model_consent_forms_updated_at BEFORE UPDATE ON model_consent_forms
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_before_after_comparisons_updated_at BEFORE UPDATE ON before_after_comparisons
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_media_collections_updated_at BEFORE UPDATE ON media_collections
  FOR EACH ROW EXECUTE FUNCTION update_media_updated_at();

-- Function to generate unique collection slug
CREATE OR REPLACE FUNCTION generate_collection_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base slug
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  slug := base_slug;

  -- Check uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM media_collections WHERE slug = slug) LOOP
    slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Function to validate consent expiry
CREATE OR REPLACE FUNCTION check_consent_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Update consent status if expired
  IF NEW.is_active = true AND NEW.expiry_date <= NOW() THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_consent_expiry_trigger
  BEFORE INSERT OR UPDATE ON model_consent_signatures
  FOR EACH ROW EXECUTE FUNCTION check_consent_expiry();

-- Function to automatically set expiry date
CREATE OR REPLACE FUNCTION set_consent_expiry()
RETURNS TRIGGER AS $$
DECLARE
  expiry_months INTEGER;
BEGIN
  -- Get default expiry from consent form
  SELECT expiry_duration_months INTO expiry_months
  FROM model_consent_forms
  WHERE id = NEW.consent_form_id;

  IF expiry_months IS NOT NULL THEN
    NEW.expiry_date := NEW.consent_date + (expiry_months || ' months')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_consent_expiry_trigger
  BEFORE INSERT ON model_consent_signatures
  FOR EACH ROW EXECUTE FUNCTION set_consent_expiry();

-- Views for Analytics
CREATE OR REPLACE VIEW media_asset_summary AS
SELECT
  ma.id,
  ma.original_filename,
  ma.mime_type,
  ma.file_size,
  ma.uploaded_by,
  COUNT(mv.id) as version_count,
  COUNT(DISTINCT mca.collection_id) as collection_count,
  COUNT(mf.id) as face_count,
  mq.moderation_status,
  ma.created_at
FROM media_assets ma
LEFT JOIN media_versions mv ON ma.id = mv.parent_asset_id
LEFT JOIN media_collection_assets mca ON ma.id = mca.asset_id
LEFT JOIN media_face_detections mf ON ma.id = mf.asset_id
LEFT JOIN (
  SELECT DISTINCT ON (asset_id) asset_id, moderation_status
  FROM media_moderation_queue
  ORDER BY asset_id, created_at DESC
) mq ON ma.id = mq.asset_id
GROUP BY ma.id, ma.original_filename, ma.mime_type, ma.file_size, ma.uploaded_by, mq.moderation_status, ma.created_at;

CREATE OR REPLACE VIEW consent_status_dashboard AS
SELECT
  mcs.id,
  mcs.model_name,
  mcs.model_email,
  mcs.consent_date,
  mcs.expiry_date,
  mcs.is_active,
  mcf.title as form_title,
  COUNT(bac.id) as associated_comparisons,
  CASE
    WHEN mcs.expiry_date <= NOW() THEN 'expired'
    WHEN mcs.expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END as status
FROM model_consent_signatures mcs
LEFT JOIN model_consent_forms mcf ON mcs.consent_form_id = mcf.id
LEFT JOIN before_after_comparisons bac ON mcs.id = bac.consent_signature_id
GROUP BY mcs.id, mcs.model_name, mcs.model_email, mcs.consent_date, mcs.expiry_date, mcs.is_active, mcf.title;

-- Insert default metadata tags
INSERT INTO media_metadata_tags (name, category, description, is_system) VALUES
  -- Content tags
  ('before', 'content', 'Before treatment photo', true),
  ('after', 'content', 'After treatment photo', true),
  ('portrait', 'content', 'Portrait orientation', true),
  ('close-up', 'content', 'Close-up shot', true),
  ('full-body', 'content', 'Full body shot', true),

  -- Treatment tags
  ('lips', 'treatment', 'Lip enhancement treatment', true),
  ('brows', 'treatment', 'Eyebrow treatment', true),
  ('contouring', 'treatment', 'Facial contouring', true),
  ('fitness', 'treatment', 'Fitness related', true),
  ('glutes', 'treatment', 'Glute enhancement', true),

  -- Technical tags
  ('high-resolution', 'technical', 'High resolution image', true),
  ('retouched', 'technical', 'Image has been retouched', true),
  ('watermarked', 'technical', 'Image contains watermark', true),
  ('verified', 'technical', 'C2PA verified', true),

  -- Legal tags
  ('consent-obtained', 'legal', 'Model consent obtained', true),
  ('commercial-use', 'legal', 'Commercial use permitted', true),
  ('age-verified', 'legal', 'Age verified', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON media_assets TO authenticated;
GRANT ALL ON c2pa_manifests TO authenticated;
GRANT ALL ON c2pa_assertions TO authenticated;
GRANT ALL ON model_consent_forms TO authenticated;
GRANT ALL ON model_consent_signatures TO authenticated;
GRANT ALL ON before_after_comparisons TO authenticated;
GRANT ALL ON comparison_analytics TO authenticated;
GRANT ALL ON media_versions TO authenticated;
GRANT ALL ON media_metadata_tags TO authenticated;
GRANT ALL ON media_asset_tags TO authenticated;
GRANT ALL ON media_processing_jobs TO authenticated;
GRANT ALL ON media_face_detections TO authenticated;
GRANT ALL ON media_privacy_controls TO authenticated;
GRANT ALL ON media_access_logs TO authenticated;
GRANT ALL ON media_moderation_queue TO authenticated;
GRANT ALL ON media_collections TO authenticated;
GRANT ALL ON media_collection_assets TO authenticated;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION generate_collection_slug TO authenticated;
GRANT EXECUTE ON FUNCTION check_consent_expiry TO authenticated;
GRANT EXECUTE ON FUNCTION set_consent_expiry TO authenticated;

-- Create public read access for views
GRANT SELECT ON media_asset_summary TO authenticated;
GRANT SELECT ON consent_status_dashboard TO authenticated;