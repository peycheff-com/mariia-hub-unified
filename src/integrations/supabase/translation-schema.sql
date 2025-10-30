-- Comprehensive Translation Management System Schema
-- For beauty and fitness booking platform targeting Polish and English markets

-- =============================================
-- CORE TRANSLATION MANAGEMENT TABLES
-- =============================================

-- Translation keys registry
CREATE TABLE IF NOT EXISTS translation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  namespace TEXT NOT NULL DEFAULT 'common',
  category TEXT NOT NULL DEFAULT 'general',
  context TEXT,
  description TEXT,
  is_html BOOLEAN DEFAULT false,
  has_placeholders BOOLEAN DEFAULT false,
  max_length INTEGER,
  is_sensitive BOOLEAN DEFAULT false, -- For personal data, legal content, etc.
  source TEXT DEFAULT 'manual', -- manual, automated, import, api
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT translation_keys_key_format CHECK (key_name ~ '^[a-zA-Z0-9_.-]+$'),
  CONSTRAINT translation_keys_priority_range CHECK (priority >= 1 AND priority <= 10)
);

-- Translation values for each language
CREATE TABLE IF NOT EXISTS translation_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  translator_notes TEXT,
  reviewer_notes TEXT,
  word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(trim(value), ' '), 1)) STORED,
  character_count INTEGER GENERATED ALWAYS AS (length(trim(value))) STORED,

  -- Metadata
  translation_method TEXT DEFAULT 'manual', -- manual, ai, machine, hybrid
  translator_id UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Version control
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES translation_values(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(key_id, language_code, version)
);

-- Translation memory for consistency and reuse
CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_text TEXT NOT NULL,
  target_language TEXT NOT NULL,
  context TEXT,
  domain TEXT DEFAULT 'general', -- beauty, fitness, legal, marketing, etc.
  usage_count INTEGER DEFAULT 1,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Full text search capabilities
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', source_text), 'A') ||
    setweight(to_tsvector('english', target_text), 'B') ||
    setweight(to_tsvector('english', COALESCE(context, '')), 'C')
  ) STORED,

  -- Unique constraint for exact matches
  UNIQUE(source_text, source_language, target_language, context)
);

-- =============================================
-- INDUSTRY TERMINOLOGY MANAGEMENT
-- =============================================

-- Industry-specific term dictionary
CREATE TABLE IF NOT EXISTS industry_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  language_code TEXT NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN ('beauty', 'fitness', 'medical', 'general')),
  definition TEXT,
  context_usage TEXT,
  synonyms TEXT[], -- Array of synonyms
  related_terms TEXT[], -- Related concept terms
  is_premium BOOLEAN DEFAULT false, -- Professional terminology
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  pronunciation_guide TEXT,
  etymology TEXT,
  usage_notes TEXT,
  cultural_notes TEXT, -- Important for Polish market
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(term, language_code, industry)
);

-- Standardized translations for key terms
CREATE TABLE IF NOT EXISTS standardized_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES industry_terminology(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  standard_translation TEXT NOT NULL,
  alternative_translations TEXT[], -- Accepted alternatives
  usage_context TEXT,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(term_id, language_code)
);

-- =============================================
-- WORKFLOW AND APPROVAL SYSTEM
-- =============================================

-- Translation projects and batches
CREATE TABLE IF NOT EXISTS translation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_language TEXT NOT NULL,
  target_languages TEXT[] NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  deadline TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(10,2),
  client_name TEXT,
  project_type TEXT DEFAULT 'content' CHECK (project_type IN ('content', 'ui', 'legal', 'marketing', 'technical')),

  -- Metadata
  total_keys INTEGER DEFAULT 0,
  completed_keys INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN total_keys > 0 THEN ROUND((completed_keys::DECIMAL / total_keys::DECIMAL) * 100, 2)
      ELSE 0
    END
  ) STORED,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id)
);

-- Translation tasks within projects
CREATE TABLE IF NOT EXISTS translation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES translation_projects(id) ON DELETE CASCADE,
  key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
  translator_id UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'review', 'approved', 'rejected')),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_effort INTEGER, -- in minutes
  actual_effort INTEGER, -- in minutes

  -- Task notes
  translator_notes TEXT,
  reviewer_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(project_id, key_id)
);

-- =============================================
-- QUALITY ASSURANCE SYSTEM
-- =============================================

-- Translation quality checks
CREATE TABLE IF NOT EXISTS translation_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_value_id UUID NOT NULL REFERENCES translation_values(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN (
    'completeness', 'grammar', 'terminology', 'consistency',
    'length', 'format', 'placeholders', 'cultural', 'legal'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'warning')),
  score DECIMAL(3,2) CHECK (score >= 0 AND score <= 1),
  details JSONB, -- Detailed check results
  auto_fixable BOOLEAN DEFAULT false,
  fixed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(translation_value_id, check_type)
);

-- Translation validation rules
CREATE TABLE IF NOT EXISTS translation_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'regex', 'length', 'required_terms', 'forbidden_terms', 'format', 'placeholder'
  )),
  pattern TEXT, -- Regex pattern or format specification
  parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  applies_to_languages TEXT[],
  applies_to_categories TEXT[],
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- EMAIL AND NOTIFICATION TEMPLATES
-- =============================================

-- Email templates with multilingual support
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'booking', 'confirmation', 'reminder', 'cancellation', 'marketing', 'newsletter', 'support'
  )),
  language_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default template for fallback

  -- Email metadata
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,

  -- Approval status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(template_name, language_code)
);

-- SMS templates (shorter format)
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'booking', 'confirmation', 'reminder', 'cancellation', 'alert'
  )),
  language_code TEXT NOT NULL,
  message TEXT NOT NULL,
  max_length INTEGER DEFAULT 160,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(template_name, language_code)
);

-- =============================================
-- LEGAL DOCUMENT TRANSLATIONS
-- =============================================

-- Legal documents requiring precise translations
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'privacy_policy', 'terms_of_service', 'gdpr_compliance', 'consent_form',
    'disclaimer', 'refund_policy', 'cancellation_policy', 'data_protection'
  )),
  version TEXT NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,

  -- Legal compliance
  jurisdiction TEXT DEFAULT 'PL', -- PL for Poland, EU for EU-wide
  is_legally_binding BOOLEAN DEFAULT false,
  legal_review_status TEXT DEFAULT 'pending' CHECK (legal_review_status IN (
    'pending', 'in_review', 'approved', 'rejected', 'requires_changes'
  )),
  legal_reviewer_id UUID REFERENCES auth.users(id),
  legal_review_date TIMESTAMP WITH TIME ZONE,
  legal_review_notes TEXT,

  -- Translation metadata
  translation_method TEXT DEFAULT 'professional', -- professional, machine, hybrid
  translator_qualification TEXT, -- certified_translator, legal_expert, etc.
  qa_passed BOOLEAN DEFAULT false,

  -- Version control
  parent_document_id UUID REFERENCES legal_documents(id),
  is_current BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(document_type, version, language_code)
);

-- =============================================
-- AUTOMATION AND AI FEATURES
-- =============================================

-- Translation automation rules
CREATE TABLE IF NOT EXISTS translation_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'new_content', 'content_update', 'schedule', 'manual'
  )),
  trigger_conditions JSONB,
  actions JSONB NOT NULL, -- Array of actions to perform
  is_active BOOLEAN DEFAULT true,

  -- AI integration
  ai_model TEXT, -- gpt-4, claude, etc.
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  auto_approve_threshold DECIMAL(3,2) DEFAULT 0.95,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Translation analytics and metrics
CREATE TABLE IF NOT EXISTS translation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  language_code TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'translations_completed', 'quality_score', 'review_time',
    'automation_rate', 'user_satisfaction', 'error_rate'
  )),
  metric_value DECIMAL(10,2) NOT NULL,
  additional_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(date, language_code, metric_type)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Translation keys indexes
CREATE INDEX IF NOT EXISTS idx_translation_keys_namespace ON translation_keys(namespace);
CREATE INDEX IF NOT EXISTS idx_translation_keys_category ON translation_keys(category);
CREATE INDEX IF NOT EXISTS idx_translation_keys_priority ON translation_keys(priority);
CREATE INDEX IF NOT EXISTS idx_translation_keys_source ON translation_keys(source);

-- Translation values indexes
CREATE INDEX IF NOT EXISTS idx_translation_values_key_id ON translation_values(key_id);
CREATE INDEX IF NOT EXISTS idx_translation_values_language ON translation_values(language_code);
CREATE INDEX IF NOT EXISTS idx_translation_values_status ON translation_values(status);
CREATE INDEX IF NOT EXISTS idx_translation_values_reviewer ON translation_values(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_translation_values_created_at ON translation_values(created_at);

-- Translation memory indexes
CREATE INDEX IF NOT EXISTS idx_translation_memory_search ON translation_memory USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_translation_memory_source_lang ON translation_memory(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_translation_memory_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_translation_memory_usage ON translation_memory(usage_count DESC);

-- Industry terminology indexes
CREATE INDEX IF NOT EXISTS idx_industry_terminology_term ON industry_terminology(term);
CREATE INDEX IF NOT EXISTS idx_industry_terminology_industry ON industry_terminology(industry);
CREATE INDEX IF NOT EXISTS idx_industry_terminology_language ON industry_terminology(language_code);

-- Project and task indexes
CREATE INDEX IF NOT EXISTS idx_translation_projects_status ON translation_projects(status);
CREATE INDEX IF NOT EXISTS idx_translation_projects_assigned ON translation_projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_translation_tasks_project ON translation_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_translation_tasks_translator ON translation_tasks(translator_id);
CREATE INDEX IF NOT EXISTS idx_translation_tasks_status ON translation_tasks(status);

-- Quality assurance indexes
CREATE INDEX IF NOT EXISTS idx_quality_checks_translation ON translation_quality_checks(translation_value_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_type ON translation_quality_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON translation_quality_checks(status);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON email_templates(language_code);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Legal documents indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_version ON legal_documents(version);
CREATE INDEX IF NOT EXISTS idx_legal_documents_language ON legal_documents(language_code);
CREATE INDEX IF NOT EXISTS idx_legal_documents_current ON legal_documents(is_current);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_translation_analytics_date ON translation_analytics(date);
CREATE INDEX IF NOT EXISTS idx_translation_analytics_metric ON translation_analytics(metric_type, language_code);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE translation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardized_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_analytics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for authenticated users
-- Translation keys - read access for all authenticated users
CREATE POLICY "Authenticated users can view translation keys" ON translation_keys
  FOR SELECT USING (auth.role() = 'authenticated');

-- Translation values - different access levels
CREATE POLICY "Authenticated users can view approved translations" ON translation_values
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'approved');

CREATE POLICY "Translators can view assigned translations" ON translation_values
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (translator_id = auth.uid() OR reviewer_id = auth.uid())
  );

-- Translation memory - read access for authenticated users
CREATE POLICY "Authenticated users can view translation memory" ON translation_memory
  FOR SELECT USING (auth.role() = 'authenticated');

-- Industry terminology - read access for authenticated users
CREATE POLICY "Authenticated users can view terminology" ON industry_terminology
  FOR SELECT USING (auth.role() = 'authenticated');

-- Email templates - read access for authenticated users
CREATE POLICY "Authenticated users can view active email templates" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Legal documents - read access for authenticated users
CREATE POLICY "Authenticated users can view current legal documents" ON legal_documents
  FOR SELECT USING (auth.role() = 'authenticated' AND is_current = true);

-- Admin policies for full access (would need to implement admin role check)
CREATE POLICY "Admins can manage all translations" ON translation_keys
  FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage all translation values" ON translation_values
  FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_translation_keys_updated_at BEFORE UPDATE ON translation_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_values_updated_at BEFORE UPDATE ON translation_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_memory_updated_at BEFORE UPDATE ON translation_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_terminology_updated_at BEFORE UPDATE ON industry_terminology
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Translation memory usage counter
CREATE OR REPLACE FUNCTION increment_translation_memory_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE translation_memory
  SET usage_count = usage_count + 1, last_used = NOW()
  WHERE source_text = NEW.value AND target_language = NEW.language_code;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Project progress update trigger
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE translation_projects
  SET
    completed_keys = (
      SELECT COUNT(*)
      FROM translation_tasks
      WHERE project_id = NEW.project_id AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_progress_trigger
  AFTER UPDATE ON translation_tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for approved translations with metadata
CREATE OR REPLACE VIEW approved_translations AS
SELECT
  tk.key_name,
  tk.namespace,
  tk.category,
  tk.description,
  tv.language_code,
  tv.value,
  tv.quality_score,
  it.industry,
  tv.updated_at,
  tv.approved_at
FROM translation_keys tk
JOIN translation_values tv ON tk.id = tv.key_id
LEFT JOIN industry_terminology it ON
  LOWER(tk.key_name) = LOWER(it.term) AND tv.language_code = it.language_code
WHERE tv.status = 'approved'
ORDER BY tk.namespace, tk.key_name, tv.language_code;

-- View for translation statistics
CREATE OR REPLACE VIEW translation_statistics AS
SELECT
  tv.language_code,
  COUNT(*) as total_translations,
  COUNT(*) FILTER (WHERE tv.status = 'approved') as approved_translations,
  COUNT(*) FILTER (WHERE tv.status = 'pending_review') as pending_translations,
  ROUND(AVG(tv.quality_score), 2) as avg_quality_score,
  ROUND(AVG(tv.word_count), 0) as avg_word_count
FROM translation_values tv
GROUP BY tv.language_code
ORDER BY tv.language_code;

-- View for project progress
CREATE OR REPLACE VIEW project_progress_view AS
SELECT
  tp.id,
  tp.name,
  tp.status,
  tp.target_languages,
  tp.total_keys,
  tp.completed_keys,
  tp.progress_percentage,
  tp.deadline,
  tp.created_at,
  COUNT(tt.id) as total_tasks,
  COUNT(tt.id) FILTER (WHERE tt.status = 'approved') as completed_tasks,
  COUNT(tt.id) FILTER (WHERE tt.status = 'in_progress') as in_progress_tasks
FROM translation_projects tp
LEFT JOIN translation_tasks tt ON tp.id = tt.project_id
GROUP BY tp.id, tp.name, tp.status, tp.target_languages, tp.total_keys,
         tp.completed_keys, tp.progress_percentage, tp.deadline, tp.created_at
ORDER BY tp.created_at DESC;