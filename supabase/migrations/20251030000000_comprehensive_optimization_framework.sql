-- Comprehensive Continuous Optimization Framework Schema
-- Created: 2025-10-30
-- Purpose: Enterprise-grade optimization and monitoring system

-- ============================================================================
-- PERFORMANCE MONITORING & ALERTING
-- ============================================================================

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL, -- 'cwv', 'custom', 'business'
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit VARCHAR(20), -- 'ms', 'score', 'percentage', 'count'
  device_type VARCHAR(20) NOT NULL, -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(50),
  connection_type VARCHAR(30),
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  page_url TEXT,
  session_id UUID,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts configuration
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_name VARCHAR(200) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'regression', 'anomaly'
  metric_name VARCHAR(100) NOT NULL,
  condition_operator VARCHAR(10) NOT NULL, -- '>', '<', '>=', '<=', '!=', 'regex'
  threshold_value DECIMAL(10,4) NOT NULL,
  comparison_period_hours INTEGER DEFAULT 24,
  consecutive_violations INTEGER DEFAULT 3,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  notification_channels TEXT[], -- 'email', 'slack', 'sms', 'webhook'
  is_active BOOLEAN DEFAULT true,
  alert_cooldown_minutes INTEGER DEFAULT 60,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alert incidents
CREATE TABLE IF NOT EXISTS performance_alert_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES performance_alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  severity VARCHAR(20),
  current_value DECIMAL(10,4),
  threshold_value DECIMAL(10,4),
  affected_pages TEXT[],
  impact_assessment JSONB,
  resolution_notes TEXT,
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'resolved', 'false_positive'
);

-- ============================================================================
-- ISSUE DETECTION & RESOLUTION
-- ============================================================================

-- Automated issue detection
CREATE TABLE IF NOT EXISTS detected_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type VARCHAR(50) NOT NULL, -- 'performance', 'functionality', 'ux', 'security'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(300) NOT NULL,
  description TEXT,
  affected_pages TEXT[],
  affected_components TEXT[],
  detection_method VARCHAR(50), -- 'automated', 'user_reported', 'monitoring'
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reproducibility_score DECIMAL(3,2) CHECK (reproducibility_score >= 0 AND reproducibility_score <= 1),
  auto_fix_available BOOLEAN DEFAULT false,
  auto_fix_applied BOOLEAN DEFAULT false,
  fix_attempts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'detected', -- 'detected', 'investigating', 'fixing', 'resolved', 'false_positive'
  assigned_to UUID REFERENCES auth.users(id),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Issue resolution patterns
CREATE TABLE IF NOT EXISTS issue_resolution_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_pattern VARCHAR(500) NOT NULL,
  resolution_strategy TEXT NOT NULL,
  success_rate DECIMAL(3,2),
  auto_applicable BOOLEAN DEFAULT false,
  last_applied TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Self-healing actions log
CREATE TABLE IF NOT EXISTS self_healing_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES detected_issues(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'restart', 'rollback', 'cache_clear', 'config_update'
  action_description TEXT,
  action_status VARCHAR(20) DEFAULT 'attempted', -- 'attempted', 'success', 'failed'
  action_result JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_available BOOLEAN DEFAULT false,
  rollback_deadline TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- CONVERSION RATE OPTIMIZATION
-- ============================================================================

-- Conversion funnel tracking
CREATE TABLE IF NOT EXISTS conversion_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name VARCHAR(200) NOT NULL,
  funnel_type VARCHAR(50) NOT NULL, -- 'booking', 'lead', 'purchase', 'engagement'
  steps JSONB NOT NULL, -- Ordered array of funnel steps
  baseline_conversion_rate DECIMAL(5,4),
  current_conversion_rate DECIMAL(5,4),
  target_conversion_rate DECIMAL(5,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion events
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES conversion_funnels(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  step_name VARCHAR(100) NOT NULL,
  step_index INTEGER NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- 'enter', 'complete', 'exit', 'skip'
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  device_type VARCHAR(20),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  properties JSONB DEFAULT '{}'
);

-- CRO strategies and variations
CREATE TABLE IF NOT EXISTS cro_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name VARCHAR(200) NOT NULL,
  strategy_type VARCHAR(50) NOT NULL, -- 'personalization', 'ui_change', 'copy_change', 'offer_change'
  target_segment VARCHAR(100), -- 'new_users', 'returning', 'mobile', 'desktop', 'premium'
  description TEXT,
  hypothesis TEXT,
  implementation JSONB, -- Changes to be applied
  success_metrics TEXT[],
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'testing', 'active', 'paused', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User segmentation for personalization
CREATE TABLE IF NOT EXISTS user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name VARCHAR(200) NOT NULL,
  segment_criteria JSONB NOT NULL, -- Rules for segment membership
  segment_size INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5,4),
  avg_order_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- A/B TESTING & EXPERIMENTATION
-- ============================================================================

-- Experiments
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name VARCHAR(300) NOT NULL,
  experiment_type VARCHAR(50) NOT NULL, -- 'ab_test', 'multivariate', 'bandit'
  hypothesis TEXT,
  primary_metric VARCHAR(100) NOT NULL,
  secondary_metrics TEXT[],
  target_segments TEXT[],
  traffic_allocation DECIMAL(5,4) DEFAULT 1.0, -- Fraction of traffic to include
  min_sample_size INTEGER,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.95,
  duration_days INTEGER,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'aborted'
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  winner_variant VARCHAR(100),
  statistical_significance BOOLEAN,
  business_impact JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment variants
CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  variant_type VARCHAR(50) NOT NULL, -- 'control', 'treatment', 'variation'
  traffic_weight DECIMAL(5,4) NOT NULL,
  configuration JSONB NOT NULL, -- Variant-specific settings
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment results
CREATE TABLE IF NOT EXISTS experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4),
  sample_size INTEGER,
  conversion_rate DECIMAL(5,4),
  confidence_interval_lower DECIMAL(5,4),
  confidence_interval_upper DECIMAL(5,4),
  p_value DECIMAL(6,4),
  statistical_significance BOOLEAN,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment participant assignments
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2),
  properties JSONB DEFAULT '{}'
);

-- ============================================================================
-- SEO MONITORING & AUTOMATION
-- ============================================================================

-- SEO keyword tracking
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(500) NOT NULL,
  keyword_type VARCHAR(50) NOT NULL, -- 'service', 'location', 'question', 'competitor'
  target_location VARCHAR(100), -- 'Warsaw', 'Poland', 'global'
  target_language VARCHAR(10) DEFAULT 'pl',
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER,
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  cpc DECIMAL(10,4), -- Cost per click
  url_ranking TEXT,
  tracked_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO performance metrics
CREATE TABLE IF NOT EXISTS seo_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  organic_traffic INTEGER,
  keyword_rankings JSONB,
  backlinks_count INTEGER,
  domain_authority DECIMAL(3,1),
  page_authority DECIMAL(3,1),
  core_web_vitals JSONB,
  mobile_friendliness BOOLEAN,
  schema_markup_count INTEGER,
  content_score DECIMAL(3,1),
  technical_issues TEXT[],
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical SEO issues
CREATE TABLE IF NOT EXISTS technical_seo_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type VARCHAR(50) NOT NULL, -- 'meta', 'schema', 'speed', 'mobile', 'content'
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  affected_urls TEXT[],
  fix_priority INTEGER CHECK (fix_priority >= 1 AND fix_priority <= 10),
  auto_fixable BOOLEAN DEFAULT false,
  fix_suggestion TEXT,
  status VARCHAR(20) DEFAULT 'detected', -- 'detected', 'fixing', 'resolved', 'ignored'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- CONTENT PERFORMANCE INTELLIGENCE
-- ============================================================================

-- Content performance tracking
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'service', 'blog', 'landing', 'gallery'
  content_title VARCHAR(500),
  page_url TEXT,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER, -- seconds
  bounce_rate DECIMAL(5,4),
  conversion_rate DECIMAL(5,4),
  engagement_score DECIMAL(3,2),
  social_shares INTEGER DEFAULT 0,
  backlinks_acquired INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2),
  performance_period_start TIMESTAMP WITH TIME ZONE,
  performance_period_end TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content A/B tests
CREATE TABLE IF NOT EXISTS content_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  test_name VARCHAR(300) NOT NULL,
  test_type VARCHAR(50) NOT NULL, -- 'headline', 'description', 'image', 'cta'
  variants JSONB NOT NULL,
  metrics_tracked TEXT[],
  test_duration_days INTEGER,
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'inconclusive'
  winning_variant TEXT,
  confidence_level DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Media performance tracking
CREATE TABLE IF NOT EXISTS media_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  media_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'gif'
  file_name VARCHAR(500),
  file_size_bytes INTEGER,
  dimensions TEXT[], -- [width, height] for images, [duration] for videos
  load_time_ms INTEGER,
  compression_ratio DECIMAL(5,4),
    engagement_rate DECIMAL(5,4),
  a_test_score DECIMAL(3,1),
  page_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER FEEDBACK ANALYSIS
-- ============================================================================

-- User feedback collection
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  feedback_type VARCHAR(50) NOT NULL, -- 'rating', 'comment', 'complaint', 'suggestion', 'bug_report'
  source VARCHAR(50) NOT NULL, -- 'in_app', 'email', 'survey', 'review_site', 'social'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  feedback_text TEXT,
  feedback_text_processed TEXT, -- Cleaned and processed text
  categories TEXT[], -- AI-categorized tags
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'acknowledged', 'investigating', 'resolved', 'closed'
  assigned_to UUID REFERENCES auth.users(id),
  response_sent BOOLEAN DEFAULT false,
  response_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback sentiment analysis
CREATE TABLE IF NOT EXISTS feedback_sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE,
  sentiment_model VARCHAR(50) NOT NULL,
  sentiment_label VARCHAR(20) NOT NULL, -- 'positive', 'negative', 'neutral'
  sentiment_confidence DECIMAL(3,2),
  emotion_scores JSONB, -- {joy: 0.8, anger: 0.1, etc}
  key_phrases TEXT[],
  entities_mentioned TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback-driven improvements
CREATE TABLE IF NOT EXISTS feedback_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE,
  improvement_type VARCHAR(50) NOT NULL, -- 'ui_change', 'feature_add', 'bug_fix', 'process_improvement'
  description TEXT,
  implementation_status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'rejected'
  impact_assessment JSONB,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTINUOUS IMPROVEMENT ENGINE
-- ============================================================================

-- ML model training data
CREATE TABLE IF NOT EXISTS ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(50) NOT NULL, -- 'conversion_prediction', 'churn_prediction', 'performance_optimization'
  feature_set JSONB NOT NULL,
  target_variable VARCHAR(100),
  target_value DECIMAL(10,4),
  model_version VARCHAR(20),
  data_source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization recommendations
CREATE TABLE IF NOT EXISTS optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type VARCHAR(50) NOT NULL, -- 'performance', 'conversion', 'seo', 'content', 'ux'
  priority_score DECIMAL(3,2) CHECK (priority_score >= 0 AND priority_score <= 1),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  expected_impact JSONB, -- {conversion_lift: 0.15, revenue_impact: 5000}
  implementation_effort VARCHAR(20), -- 'low', 'medium', 'high'
  implementation_steps TEXT[],
  auto_implementable BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'implemented', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  implemented_at TIMESTAMP WITH TIME ZONE,
  results_measured_at TIMESTAMP WITH TIME ZONE,
  actual_impact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning and improvement tracking
CREATE TABLE IF NOT EXISTS improvement_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES optimization_recommendations(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  baseline_value DECIMAL(10,4),
  target_value DECIMAL(10,4),
  current_value DECIMAL(10,4),
  improvement_percentage DECIMAL(5,4),
  measurement_period_days INTEGER,
  statistical_significance BOOLEAN,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BUSINESS INTELLIGENCE & ROI TRACKING
-- ============================================================================

-- Optimization ROI tracking
CREATE TABLE IF NOT EXISTS optimization_roi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id UUID REFERENCES optimization_recommendations(id),
  investment_cost DECIMAL(12,2), -- Development time, tools, etc
  revenue_impact DECIMAL(12,2),
  cost_savings DECIMAL(12,2),
  conversion_lift DECIMAL(5,4),
  traffic_increase DECIMAL(5,4),
  customer_satisfaction_lift DECIMAL(3,2),
  measurement_period_days INTEGER,
  roi_ratio DECIMAL(5,2), -- Return on investment ratio
  payback_period_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executive KPIs
CREATE TABLE IF NOT EXISTS executive_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_category VARCHAR(50) NOT NULL, -- 'performance', 'conversion', 'revenue', 'satisfaction'
  kpi_name VARCHAR(100) NOT NULL,
  kpi_value DECIMAL(12,4),
  kpi_unit VARCHAR(20),
  target_value DECIMAL(12,4),
  previous_period_value DECIMAL(12,4),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
  trend_percentage DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive benchmarking
CREATE TABLE IF NOT EXISTS competitive_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name VARCHAR(200) NOT NULL,
  metric_category VARCHAR(50) NOT NULL, -- 'performance', 'seo', 'conversion', 'pricing'
  metric_name VARCHAR(100) NOT NULL,
  competitor_value DECIMAL(10,4),
  our_value DECIMAL(10,4),
  benchmark_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gap_analysis JSONB,
  opportunity_assessment JSONB
);

-- ============================================================================
-- AUTOMATION & WORKFLOW
-- ============================================================================

-- Automated workflows
CREATE TABLE IF NOT EXISTS automated_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name VARCHAR(200) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'schedule', 'event', 'threshold', 'manual'
  trigger_conditions JSONB,
  actions JSONB NOT NULL, -- Array of actions to execute
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES automated_workflows(id) ON DELETE CASCADE,
  execution_status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  trigger_data JSONB,
  execution_results JSONB,
  error_message TEXT,
  actions_executed INTEGER DEFAULT 0,
  actions_successful INTEGER DEFAULT 0
);

-- ============================================================================
-- INDICES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_name ON performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_device ON performance_metrics(device_type);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_performance_alerts_active ON performance_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_triggered ON performance_alert_incidents(triggered_at DESC);

-- Issue detection indexes
CREATE INDEX IF NOT EXISTS idx_detected_issues_status ON detected_issues(status);
CREATE INDEX IF NOT EXISTS idx_detected_issues_severity ON detected_issues(severity);
CREATE INDEX IF NOT EXISTS idx_detected_issues_detected ON detected_issues(detected_at DESC);

-- Conversion funnel indexes
CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_funnel ON conversion_events(funnel_id, timestamp);

-- A/B testing indexes
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_session ON experiment_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_variant ON experiment_results(variant_id);

-- SEO indexes
CREATE INDEX IF NOT EXISTS idx_seo_keywords_position ON seo_keywords(current_position);
CREATE INDEX IF NOT EXISTS idx_seo_performance_page ON seo_performance(page_url);

-- Content performance indexes
CREATE INDEX IF NOT EXISTS idx_content_performance_type ON content_performance(content_type);
CREATE INDEX IF NOT EXISTS idx_content_performance_updated ON content_performance(last_updated DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

-- Optimization indexes
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_status ON optimization_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_priority ON optimization_recommendations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_improvement_tracking_updated ON improvement_tracking(last_updated DESC);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started ON workflow_executions(started_at DESC);

-- ============================================================================
-- SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your requirements)
CREATE POLICY "Users can view their own session data" ON performance_metrics
  FOR SELECT USING (session_id IS NOT NULL);

CREATE POLICY "Admin full access to performance metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Additional RLS policies would be added based on specific access requirements

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update experiment status based on duration or sample size
CREATE OR REPLACE FUNCTION check_experiment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-complete experiments that have reached their duration or sample size
  IF NEW.status = 'running' THEN
    IF (
      (NEW.end_time IS NOT NULL AND NEW.end_time <= NOW()) OR
      (EXISTS (
        SELECT 1 FROM experiment_assignments
        WHERE experiment_id = NEW.id
        GROUP BY variant_id
        HAVING COUNT(*) >= NEW.min_sample_size
      ))
    ) THEN
      NEW.status = 'completed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_experiment_completion
  BEFORE UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION check_experiment_completion();

-- Function to calculate optimization ROI
CREATE OR REPLACE FUNCTION calculate_optimization_roi()
RETURNS TRIGGER AS $$
DECLARE
  roi_value DECIMAL;
BEGIN
  -- Calculate ROI when actual impact is measured
  IF NEW.actual_impact IS NOT NULL AND OLD.actual_impact IS NULL THEN
    SELECT
      COALESCE(
        (NEW.actual_impact->>'revenue_impact')::DECIMAL +
        (NEW.actual_impact->>'cost_savings')::DECIMAL, 0
      ) / NULLIF((SELECT investment_cost FROM optimization_roi WHERE optimization_id = NEW.id), 0)
    INTO roi_value;

    INSERT INTO optimization_roi (optimization_id, roi_ratio)
    VALUES (NEW.id, roi_value)
    ON CONFLICT (optimization_id)
    DO UPDATE SET roi_ratio = EXCLUDED.roi_ratio, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_optimization_roi
  AFTER UPDATE ON optimization_recommendations
  FOR EACH ROW EXECUTE FUNCTION calculate_optimization_roi();

-- Function to automatically categorize feedback using simple keyword matching
CREATE OR REPLACE FUNCTION auto_categorize_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple keyword-based categorization (can be enhanced with ML)
  IF NEW.feedback_text IS NOT NULL THEN
    NEW.categories = CASE
      WHEN LOWER(NEW.feedback_text) ~* '(slow|performance|speed|lag)' THEN
        array_append(COALESCE(NEW.categories, '{}'), 'performance')
      WHEN LOWER(NEW.feedback_text) ~* '(booking|appointment|schedule)' THEN
        array_append(COALESCE(NEW.categories, '{}'), 'booking')
      WHEN LOWER(NEW.feedback_text) ~* '(price|cost|expensive|cheap)' THEN
        array_append(COALESCE(NEW.categories, '{}'), 'pricing')
      WHEN LOWER(NEW.feedback_text) ~* '(design|ui|interface|layout)' THEN
        array_append(COALESCE(NEW.categories, '{}'), 'ui_ux')
      ELSE COALESCE(NEW.categories, '{}')
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_categorize_feedback
  BEFORE INSERT ON user_feedback
  FOR EACH ROW EXECUTE FUNCTION auto_categorize_feedback();

-- Function to update content performance periodically
CREATE OR REPLACE FUNCTION update_content_performance()
RETURNS void AS $$
BEGIN
  -- This would typically be called by a scheduled job
  UPDATE content_performance
  SET
    views = COALESCE(views, 0) + 1,
    last_updated = NOW()
  WHERE content_id IN (
    SELECT DISTINCT content_id
    FROM conversion_events
    WHERE timestamp >= NOW() - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active experiments view
CREATE OR REPLACE VIEW active_experiments AS
SELECT
  e.*,
  COUNT(DISTINCT ea.session_id) as total_participants,
  COUNT(DISTINCT CASE WHEN ea.converted = true THEN ea.session_id END) as total_conversions,
  MAX(ea.assigned_at) as last_assignment
FROM experiments e
LEFT JOIN experiment_assignments ea ON e.id = ea.experiment_id
WHERE e.status = 'running'
GROUP BY e.id;

-- Performance summary view
CREATE OR REPLACE VIEW performance_summary AS
SELECT
  DATE_TRUNC('day', timestamp) as metric_date,
  metric_type,
  metric_name,
  device_type,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as sample_count
FROM performance_metrics
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', timestamp), metric_type, metric_name, device_type
ORDER BY metric_date DESC;

-- Optimization impact view
CREATE OR REPLACE VIEW optimization_impact_summary AS
SELECT
  DATE_TRUNC('month', implemented_at) as implementation_month,
  recommendation_type,
  COUNT(*) as total_optimizations,
  AVG(
    CASE
      WHEN actual_impact->>'conversion_lift' IS NOT NULL
      THEN (actual_impact->>'conversion_lift')::DECIMAL
    END
  ) as avg_conversion_lift,
  SUM(
    CASE
      WHEN actual_impact->>'revenue_impact' IS NOT NULL
      THEN (actual_impact->>'revenue_impact')::DECIMAL
    END
  ) as total_revenue_impact
FROM optimization_recommendations
WHERE status = 'implemented' AND implemented_at IS NOT NULL
GROUP BY DATE_TRUNC('month', implemented_at), recommendation_type
ORDER BY implementation_month DESC;

COMMENT ON TABLE performance_metrics IS 'Core performance metrics collection for all platform monitoring';
COMMENT ON TABLE detected_issues IS 'Automated issue detection and tracking system';
COMMENT ON TABLE conversion_funnels IS 'Conversion funnel definitions and tracking';
COMMENT ON TABLE experiments IS 'A/B testing and experimentation framework';
COMMENT ON TABLE optimization_recommendations IS 'AI-powered optimization recommendations';
COMMENT ON TABLE user_feedback IS 'Comprehensive user feedback collection system';