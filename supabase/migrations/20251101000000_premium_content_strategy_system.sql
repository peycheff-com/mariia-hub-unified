-- Premium Content Strategy System Migration
-- Creates comprehensive content strategy framework for thought leadership and authority building

-- Content Strategy Hub - Main planning and organization table
CREATE TABLE IF NOT EXISTS content_strategy_hub (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('beauty_thought_leadership', 'fitness_educational', 'warsaw_local', 'multi_format', 'seasonal_campaign', 'product_launch')),
  target_audience TEXT[],
  primary_goals TEXT[],
  key_messages TEXT[],
  content_pillars TEXT[], -- Main content themes/topics
  target_keywords TEXT[],
  competitive_positioning TEXT, -- How we position against competitors
  success_metrics JSONB DEFAULT '{}', -- KPIs and targets
  content_mix JSONB DEFAULT '{}', -- Percentage breakdown of content types
  language_distribution JSONB DEFAULT '{"en": 60, "pl": 40}', -- Content language mix

  -- Scheduling and planning
  start_date DATE,
  end_date DATE,
  content_frequency TEXT DEFAULT 'weekly' CHECK (content_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  publication_schedule JSONB DEFAULT '{}', -- Publication days/times

  -- Status and management
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
  priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
  budget_allocation DECIMAL(10,2) DEFAULT 0,
  assigned_team_members TEXT[],

  -- Analytics tracking
  performance_score DECIMAL(5,2) DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Calendar with advanced strategic planning
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES content_strategy_hub(id) ON DELETE SET NULL,

  -- Basic content info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'blog_post', 'video_tutorial', 'instagram_post', 'facebook_post', 'tiktok_video',
    'linkedin_article', 'email_newsletter', 'podcast_episode', 'webinar', 'infographic',
    'case_study', 'interview', 'behind_scenes', 'tutorial', 'guide', 'checklist',
    'interactive_quiz', 'assessment', 'downloadable_resource', 'testimonial', 'before_after'
  )),
  format_style TEXT CHECK (format_style IN ('educational', 'inspirational', 'promotional', 'entertaining', 'informational')),
  content_pillar TEXT, -- Links to strategy content pillars

  -- Multilingual content
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'pl', 'ru', 'uk')),
  title_pl TEXT,
  content_pl TEXT,

  -- Content details
  summary TEXT,
  content TEXT,
  key_takeaways TEXT[],
  call_to_action TEXT,
  target_keywords TEXT[],
  focus_keyword TEXT,

  -- Visual assets
  featured_image_url TEXT,
  additional_images TEXT[],
  video_url TEXT,
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,

  -- SEO and metadata
  meta_title TEXT,
  meta_description TEXT,
  social_media_title TEXT,
  social_media_description TEXT,
  alt_text TEXT,

  -- Distribution plan
  distribution_channels TEXT[] DEFAULT '{"website", "instagram", "facebook"}',
  publication_schedule TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Warsaw',
  has_reminder BOOLEAN DEFAULT false,

  -- Content lifecycle
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned', 'in_progress', 'review', 'scheduled', 'published',
    'promoted', 'archived', 'cancelled'
  )),
  version INTEGER DEFAULT 1,
  is_evergreen BOOLEAN DEFAULT false,
  expiry_date DATE,

  -- Performance tracking
  target_views INTEGER DEFAULT 0,
  target_engagement_rate DECIMAL(5,2) DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  actual_views INTEGER DEFAULT 0,
  actual_engagement_rate DECIMAL(5,2) DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,

  -- Content relationships
  related_content UUID[] DEFAULT '{}', -- IDs of related content
  translated_versions UUID[] DEFAULT '{}', -- IDs of translated versions
  repurposed_from UUID REFERENCES content_calendar(id) ON DELETE SET NULL,

  -- Quality control
  content_quality_score DECIMAL(5,2) DEFAULT 0 CHECK (content_quality_score BETWEEN 0 AND 100),
  seo_score DECIMAL(5,2) DEFAULT 0 CHECK (seo_score BETWEEN 0 AND 100),
  readability_score DECIMAL(5,2) DEFAULT 0 CHECK (readability_score BETWEEN 0 AND 100),

  -- Team and workflow
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_designer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Beauty Industry Thought Leadership Content
CREATE TABLE IF NOT EXISTS beauty_thought_leadership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- Beauty-specific categorization
  beauty_category TEXT NOT NULL CHECK (beauty_category IN (
    'lip_enhancements', 'brow_artistry', 'skincare_treatments', 'makeup_artistry',
    'beauty_trends', 'industry_insights', 'product_reviews', 'technique_tutorials',
    'client_education', 'business_growth', 'innovation_technology', 'sustainability'
  )),
  expertise_level TEXT DEFAULT 'intermediate' CHECK (expertise_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  -- Content specifics
  techniques_demonstrated TEXT[],
  products_mentioned TEXT[],
  tools_required TEXT[],
  skill_prerequisites TEXT[],
  learning_objectives TEXT[],

  -- Industry insights
  trend_analysis JSONB DEFAULT '{}',
  market_insights JSONB DEFAULT '{}',
  expert_opinions JSONB DEFAULT '{}',
  research_citations TEXT[],

  -- Visual content
  before_after_images TEXT[],
  step_by_step_images TEXT[],
  video_demonstration_url TEXT,

  -- Client education
  preparation_steps TEXT[],
  aftercare_instructions TEXT[],
  common_mistakes TEXT[],
  tips_tricks TEXT[],

  -- Business insights
  cost_analysis JSONB DEFAULT '{}',
  roi_metrics JSONB DEFAULT '{}',
  client_satisfaction_factors JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fitness & Wellness Educational Content
CREATE TABLE IF NOT EXISTS fitness_educational_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- Fitness-specific categorization
  fitness_category TEXT NOT NULL CHECK (fitness_category IN (
    'glutes_training', 'lower_body', 'strength_training', 'cardio_fitness',
    'flexibility_mobility', 'nutrition', 'recovery', 'mindset_wellness',
    'exercise_science', 'program_design', 'injury_prevention', 'performance_optimization'
  )),
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'elite')),

  -- Workout specifications
  primary_muscles TEXT[],
  secondary_muscles TEXT[],
  equipment_needed TEXT[],
  duration_minutes INTEGER,
  intensity_level TEXT CHECK (intensity_level IN ('low', 'moderate', 'high', 'maximum')),

  -- Exercise details
  exercises JSONB DEFAULT '{}', -- Array of exercise objects with name, sets, reps, rest
  progression_options JSONB DEFAULT '{}',
  modifications JSONB DEFAULT '{}',
  common_errors TEXT[],

  -- Scientific backing
  research_references TEXT[],
  biomechanics_explanation TEXT,
  physiological_benefits TEXT[],

  -- Educational content
  key_concepts TEXT[],
  learning_points TEXT[],
  practical_applications TEXT[],

  -- Nutrition and recovery
  nutrition_tips JSONB DEFAULT '{}',
  recovery_recommendations TEXT[],
  supplementation_notes TEXT[],

  -- Progress tracking
  progress_indicators JSONB DEFAULT '{}',
  testing_protocols JSONB DEFAULT '{}',
  expected_results_timeline TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Warsaw-Specific Local Content
CREATE TABLE IF NOT EXISTS warsaw_local_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- Local relevance
  local_context TEXT NOT NULL,
  target_neighborhoods TEXT[], -- Specific Warsaw districts
  seasonal_relevance TEXT CHECK (seasonal_relevance IN ('spring', 'summer', 'autumn', 'winter', 'year_round')),

  -- Cultural adaptation
  polish_beauty_standards JSONB DEFAULT '{}',
  local_preferences JSONB DEFAULT '{}',
  cultural_considerations TEXT[],

  -- Local events and collaborations
  related_warsaw_events JSONB DEFAULT '{}',
  local_partnerships TEXT[],
  community_initiatives TEXT[],

  -- Geotargeting
  location_tags TEXT[],
  venue_specific TEXT, -- If content is specific to certain locations
  accessibility_notes TEXT,

  -- Local SEO
  warsaw_keywords TEXT[],
  local_business_mentions TEXT[],
  neighborhood_references TEXT[],

  -- Community engagement
  local_call_to_actions TEXT[],
  community_involvement TEXT[],
  local_impact_story TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-Format Content Assets
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- Asset details
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'image', 'video', 'audio', 'document', 'presentation', 'infographic',
    'interactive_quiz', 'assessment', 'template', 'checklist', 'guide'
  )),
  title TEXT NOT NULL,
  description TEXT,

  -- File information
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes INTEGER,
  file_format TEXT,
  dimensions TEXT, -- For images/videos: "1920x1080"
  duration_seconds INTEGER, -- For videos/audio

  -- Asset metadata
  thumbnail_url TEXT,
  preview_url TEXT,
  download_url TEXT,

  -- Asset organization
  asset_category TEXT,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,

  -- Usage tracking
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Technical specifications
  quality_level TEXT CHECK (quality_level IN ('low', 'medium', 'high', 'ultra')),
  optimization_status TEXT DEFAULT 'pending' CHECK (optimization_status IN ('pending', 'optimized', 'needs_optimization')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interactive Content Components
CREATE TABLE IF NOT EXISTS interactive_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- Interactive type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'beauty_consultation_quiz', 'fitness_assessment', 'skin_analysis',
    'body_type_finder', 'routine_planner', 'progress_tracker',
    'knowledge_test', 'preference_matcher', 'budget_calculator'
  )),

  -- Quiz/assessment structure
  questions JSONB DEFAULT '{}', -- Array of question objects
  results_logic JSONB DEFAULT '{}', -- How results are calculated
  outcome_definitions JSONB DEFAULT '{}', -- Possible outcomes

  -- User experience
  estimated_time_minutes INTEGER DEFAULT 5,
  question_count INTEGER DEFAULT 10,
  has_progress_bar BOOLEAN DEFAULT true,
  immediate_feedback BOOLEAN DEFAULT true,

  -- Personalization
  personalization_factors TEXT[],
  adaptation_logic JSONB DEFAULT '{}',

  -- Lead generation
  collects_email BOOLEAN DEFAULT false,
  email_collection_point TEXT CHECK (email_collection_point IN ('beginning', 'middle', 'end', 'results')),
  follow_up_triggers JSONB DEFAULT '{}',

  -- Analytics tracking
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_completion_time_seconds INTEGER DEFAULT 0,
  drop_off_points JSONB DEFAULT '{}',

  -- Integration with services
  service_recommendations JSONB DEFAULT '{}', -- Recommend services based on results
  content_recommendations JSONB DEFAULT '{}', -- Recommend related content

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Performance Analytics
CREATE TABLE IF NOT EXISTS content_performance_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Engagement metrics
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  average_time_on_page_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,

  -- Social engagement
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  saves_bookmarks INTEGER DEFAULT 0,

  -- Conversion metrics
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,

  -- Platform-specific metrics
  website_visits INTEGER DEFAULT 0,
  instagram_engagement INTEGER DEFAULT 0,
  facebook_engagement INTEGER DEFAULT 0,
  tiktok_views INTEGER DEFAULT 0,
  newsletter_clicks INTEGER DEFAULT 0,

  -- Quality indicators
  quality_score DECIMAL(5,2) DEFAULT 0,
  relevance_score DECIMAL(5,2) DEFAULT 0,
  sentiment_score DECIMAL(5,2) DEFAULT 0,

  -- Audience insights
  demographic_data JSONB DEFAULT '{}',
  geographic_data JSONB DEFAULT '{}',
  behavior_data JSONB DEFAULT '{}',

  -- Content-specific metrics
  video_completion_rate DECIMAL(5,2) DEFAULT 0,
  audio_completion_rate DECIMAL(5,2) DEFAULT 0,
  quiz_completion_rate DECIMAL(5,2) DEFAULT 0,
  download_completion_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, date)
);

-- Content A/B Testing Framework
CREATE TABLE IF NOT EXISTS content_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  hypothesis TEXT,

  -- Test configuration
  content_a_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  content_b_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  traffic_split_percentage INTEGER DEFAULT 50 CHECK (traffic_split_percentage BETWEEN 1 AND 99),

  -- Test parameters
  test_variable TEXT CHECK (test_variable IN ('headline', 'featured_image', 'content_structure', 'call_to_action', 'format', 'tone')),
  start_date DATE NOT NULL,
  end_date DATE,
  sample_size_target INTEGER DEFAULT 1000,

  -- Success criteria
  primary_metric TEXT CHECK (primary_metric IN ('engagement_rate', 'conversion_rate', 'time_on_page', 'share_rate')),
  minimum_detectable_effect DECIMAL(5,2) DEFAULT 10,
  confidence_level INTEGER DEFAULT 95 CHECK (confidence_level IN (90, 95, 99)),

  -- Test status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'paused', 'completed', 'cancelled')),

  -- Results
  variant_a_performance JSONB DEFAULT '{}',
  variant_b_performance JSONB DEFAULT '{}',
  statistical_significance DECIMAL(5,2) DEFAULT 0,
  winner_variant TEXT CHECK (winner_variant IN ('variant_a', 'variant_b', 'inconclusive')),
  confidence_interval JSONB DEFAULT '{}',

  -- Insights
  key_learnings TEXT[],
  recommendations TEXT[],
  business_impact TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Content Performance Benchmarks
CREATE TABLE IF NOT EXISTS content_performance_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_category TEXT NOT NULL,
  content_format TEXT NOT NULL,
  target_audience TEXT,

  -- Industry benchmarks
  industry_average_views INTEGER DEFAULT 0,
  industry_average_engagement_rate DECIMAL(5,2) DEFAULT 0,
  industry_average_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Internal targets
  target_views INTEGER DEFAULT 0,
  target_engagement_rate DECIMAL(5,2) DEFAULT 0,
  target_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Top performers
  top_performing_content UUID[] DEFAULT '{}',
  best_practices JSONB DEFAULT '{}',

  -- Benchmark period
  benchmark_period_start DATE,
  benchmark_period_end DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_category, content_format, target_audience)
);

-- Content AI Insights and Recommendations
CREATE TABLE IF NOT EXISTS content_ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,

  -- AI analysis
  sentiment_analysis JSONB DEFAULT '{}',
  topic_modeling JSONB DEFAULT '{}',
  readability_analysis JSONB DEFAULT '{}',
  seo_analysis JSONB DEFAULT '{}',

  -- Predictions
  predicted_performance JSONB DEFAULT '{}',
  optimal_publication_time JSONB DEFAULT '{}',
  recommended_improvements JSONB DEFAULT '{}',

  -- Competitive analysis
  competitive_positioning JSONB DEFAULT '{}',
  content_gap_analysis JSONB DEFAULT '{}',
  trending_topics JSONB DEFAULT '{}',

  -- Audience insights
  audience_persona_alignment JSONB DEFAULT '{}',
  engagement_predictions JSONB DEFAULT '{}',

  -- Content recommendations
  recommended_topics JSONB DEFAULT '{}',
  recommended_formats JSONB DEFAULT '{}',
  recommended_distribution JSONB DEFAULT '{}',

  -- AI confidence scores
  analysis_confidence DECIMAL(5,2) DEFAULT 0 CHECK (analysis_confidence BETWEEN 0 AND 100),
  prediction_confidence DECIMAL(5,2) DEFAULT 0 CHECK (prediction_confidence BETWEEN 0 AND 100),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Workflow Automation
CREATE TABLE IF NOT EXISTS content_workflow_automation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  trigger_type TEXT CHECK (trigger_type IN ('content_published', 'performance_threshold', 'schedule', 'manual')),

  -- Automation rules
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}', -- What actions to perform

  -- Workflow steps
  workflow_steps JSONB DEFAULT '{}', -- Sequential steps to execute

  -- Notification settings
  notification_recipients TEXT[],
  notification_channels TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_content_strategy_hub_type ON content_strategy_hub(strategy_type);
CREATE INDEX IF NOT EXISTS idx_content_strategy_hub_status ON content_strategy_hub(status);
CREATE INDEX IF NOT EXISTS idx_content_strategy_hub_priority ON content_strategy_hub(priority_level DESC);

CREATE INDEX IF NOT EXISTS idx_content_calendar_strategy ON content_calendar(strategy_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_type ON content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_publication ON content_calendar(publication_schedule);
CREATE INDEX IF NOT EXISTS idx_content_calendar_pillar ON content_calendar(content_pillar);
CREATE INDEX IF NOT EXISTS idx_content_calendar_language ON content_calendar(language);
CREATE INDEX IF NOT EXISTS idx_content_calendar_featured ON content_calendar(publication_schedule) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_beauty_thought_leadership_category ON beauty_thought_leadership(beauty_category);
CREATE INDEX IF NOT EXISTS idx_beauty_thought_leadership_expertise ON beauty_thought_leadership(expertise_level);
CREATE INDEX IF NOT EXISTS idx_beauty_thought_leadership_content ON beauty_thought_leadership(content_id);

CREATE INDEX IF NOT EXISTS idx_fitness_educational_category ON fitness_educational_content(fitness_category);
CREATE INDEX IF NOT EXISTS idx_fitness_educational_difficulty ON fitness_educational_content(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_fitness_educational_content ON fitness_educational_content(content_id);

CREATE INDEX IF NOT EXISTS idx_warsaw_local_neighborhoods ON warsaw_local_content USING GIN(target_neighborhoods);
CREATE INDEX IF NOT EXISTS idx_warsaw_local_seasonal ON warsaw_local_content(seasonal_relevance);
CREATE INDEX IF NOT EXISTS idx_warsaw_local_content ON warsaw_local_content(content_id);

CREATE INDEX IF NOT EXISTS idx_content_assets_type ON content_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_content_assets_content ON content_assets(content_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_category ON content_assets(asset_category);

CREATE INDEX IF NOT EXISTS idx_interactive_content_type ON interactive_content(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactive_content_content ON interactive_content(content_id);

CREATE INDEX IF NOT EXISTS idx_content_performance_content ON content_performance_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance_analytics(date);
CREATE INDEX IF NOT EXISTS idx_content_performance_views ON content_performance_analytics(views DESC);

CREATE INDEX IF NOT EXISTS idx_content_ab_tests_status ON content_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_content_ab_tests_content_a ON content_ab_tests(content_a_id);
CREATE INDEX IF NOT EXISTS idx_content_ab_tests_content_b ON content_ab_tests(content_b_id);

CREATE INDEX IF NOT EXISTS idx_content_ai_insights_content ON content_ai_insights(content_id);
CREATE INDEX IF NOT EXISTS idx_content_ai_insights_confidence ON content_ai_insights(analysis_confidence DESC);

CREATE INDEX IF NOT EXISTS idx_content_workflow_active ON content_workflow_automation(is_active);
CREATE INDEX IF NOT EXISTS idx_content_workflow_trigger ON content_workflow_automation(trigger_type);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_search ON content_calendar USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_content_calendar_keywords ON content_calendar USING GIN(to_tsvector('english', array_to_string(target_keywords, ' ')));

-- Trigger for updating search vector and performance metrics
CREATE OR REPLACE FUNCTION update_content_calendar_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search vector will be handled by generated column in the table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_calendar_search
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_content_calendar_search_vector();

-- Function for automatic performance summary calculation
CREATE OR REPLACE FUNCTION calculate_content_performance_summary(content_uuid UUID)
RETURNS TABLE(
  total_views INTEGER,
  avg_engagement_rate DECIMAL(5,2),
  total_conversions INTEGER,
  avg_conversion_rate DECIMAL(5,2),
  performance_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(views), 0) as total_views,
    COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate,
    COALESCE(SUM(conversions), 0) as total_conversions,
    COALESCE(AVG(conversion_rate), 0) as avg_conversion_rate,
    -- Calculate a weighted performance score
    CASE
      WHEN COALESCE(SUM(views), 0) = 0 THEN 0
      ELSE ROUND(
        (COALESCE(AVG(engagement_rate), 0) * 0.4 +
         COALESCE(AVG(conversion_rate), 0) * 0.4 +
         LEAST(COALESCE(SUM(views), 0) / 1000.0, 100) * 0.2), 2
      )
    END as performance_score
  FROM content_performance_analytics
  WHERE content_id = content_uuid;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
CREATE TRIGGER update_content_strategy_hub_updated_at BEFORE UPDATE ON content_strategy_hub
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beauty_thought_leadership_updated_at BEFORE UPDATE ON beauty_thought_leadership
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fitness_educational_content_updated_at BEFORE UPDATE ON fitness_educational_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warsaw_local_content_updated_at BEFORE UPDATE ON warsaw_local_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_assets_updated_at BEFORE UPDATE ON content_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactive_content_updated_at BEFORE UPDATE ON interactive_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_performance_analytics_updated_at BEFORE UPDATE ON content_performance_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_ab_tests_updated_at BEFORE UPDATE ON content_ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_ai_insights_updated_at BEFORE UPDATE ON content_ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_workflow_automation_updated_at BEFORE UPDATE ON content_workflow_automation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE content_strategy_hub ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_thought_leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE warsaw_local_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_workflow_automation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Content Strategy Hub - Admin access
CREATE POLICY "Admins can manage content strategy" ON content_strategy_hub
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Content Calendar - Public read published, admin manage
CREATE POLICY "Anyone can view published content" ON content_calendar
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all content" ON content_calendar
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Beauty Thought Leadership - Public read published, admin manage
CREATE POLICY "Anyone can view published beauty content" ON beauty_thought_leadership
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM content_calendar c
        WHERE c.id = beauty_thought_leadership.content_id
        AND c.status = 'published'
      )
    );

CREATE POLICY "Admins can manage beauty content" ON beauty_thought_leadership
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Fitness Educational Content - Public read published, admin manage
CREATE POLICY "Anyone can view published fitness content" ON fitness_educational_content
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM content_calendar c
        WHERE c.id = fitness_educational_content.content_id
        AND c.status = 'published'
      )
    );

CREATE POLICY "Admins can manage fitness content" ON fitness_educational_content
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Warsaw Local Content - Public read published, admin manage
CREATE POLICY "Anyone can view published Warsaw content" ON warsaw_local_content
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM content_calendar c
        WHERE c.id = warsaw_local_content.content_id
        AND c.status = 'published'
      )
    );

CREATE POLICY "Admins can manage Warsaw content" ON warsaw_local_content
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Content Assets - Public read published, admin manage
CREATE POLICY "Anyone can view published content assets" ON content_assets
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM content_calendar c
        WHERE c.id = content_assets.content_id
        AND c.status = 'published'
      )
    );

CREATE POLICY "Admins can manage content assets" ON content_assets
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Interactive Content - Public read published, admin manage
CREATE POLICY "Anyone can view published interactive content" ON interactive_content
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM content_calendar c
        WHERE c.id = interactive_content.content_id
        AND c.status = 'published'
      )
    );

CREATE POLICY "Admins can manage interactive content" ON interactive_content
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Analytics - Admin only
CREATE POLICY "Admins can view content performance analytics" ON content_performance_analytics
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage A/B tests" ON content_ab_tests
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage performance benchmarks" ON content_performance_benchmarks
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage AI insights" ON content_ai_insights
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage workflow automation" ON content_workflow_automation
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default content strategy templates
INSERT INTO content_strategy_hub (title, description, strategy_type, target_audience, primary_goals, key_messages, content_pillars, target_keywords, status, priority_level) VALUES
('Beauty Industry Thought Leadership', 'Establish mariia-hub as the authoritative voice in Polish beauty industry', 'beauty_thought_leadership', ARRAY['beauty_professionals', 'beauty_enthusiasts', 'potential_clients'], ARRAY['brand_authority', 'education', 'client_acquisition'], ARRAY['expertise_innovation', 'premium_quality', 'trusted_authority'], ARRAY['lip_enhancements', 'brow_artistry', 'beauty_education', 'industry_trends'], ARRAY['lip enhancements Warsaw', 'brow artistry Poland', 'beauty expert', 'permanent makeup'], 'active', 5),
('Fitness Educational Content', 'Provide science-based fitness education focused on glutes and lower body training', 'fitness_educational', ARRAY['fitness_enthusiasts', 'beginners', 'advanced_athletes'], ARRAY['education', 'community_building', 'client_transformation'], ARRAY['scientific_approach', 'real_results', 'sustainable_fitness'], ARRAY['glute_training', 'lower_body_workouts', 'fitness_science', 'nutrition'], ARRAY['glute workout', 'lower body training', 'fitness Warsaw', 'personal trainer'], 'active', 4),
('Warsaw Local Market Authority', 'Dominate the Warsaw beauty and fitness market with localized content', 'warsaw_local', ARRAY['warsaw_residents', 'local_clients', 'beauty_professionals'], ARRAY['local_market_domination', 'community_engagement', 'local_partnerships'], ARRAY['warsaw_expertise', 'local_understanding', 'community_focus'], ARRAY['warsaw_beauty_trends', 'local_fitness_culture', 'seasonal_content'], ARRAY['beauty Warsaw', 'fitness Warsaw', 'beauty salon Mokotów', 'personal trainer Warsaw'], 'active', 5)
ON CONFLICT DO NOTHING;

-- Insert performance benchmarks
INSERT INTO content_performance_benchmarks (content_category, content_format, target_audience, industry_average_views, industry_average_engagement_rate, target_views, target_engagement_rate) VALUES
('beauty_education', 'blog_post', 'beauty_enthusiasts', 500, 3.5, 1000, 5.0),
('beauty_tutorial', 'video', 'beauty_professionals', 1200, 6.2, 2500, 8.0),
('fitness_education', 'blog_post', 'fitness_enthusiasts', 800, 4.1, 1500, 6.0),
('fitness_workout', 'video', 'general_audience', 2000, 5.5, 4000, 7.5),
('local_content', 'instagram_post', 'warsaw_residents', 300, 8.2, 600, 12.0),
('educational', 'interactive_quiz', 'potential_clients', 150, 15.5, 400, 25.0)
ON CONFLICT (content_category, content_format, target_audience) DO NOTHING;