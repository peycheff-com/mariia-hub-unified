-- Content Strategy System Migration for mariia-hub
-- Establishing authority in Warsaw beauty and fitness market

-- Enums for content strategy
CREATE TYPE content_strategy_type AS ENUM (
  'thought_leadership',
  'educational',
  'seasonal_campaign',
  'local_warsaw_focus',
  'trend_forecasting',
  'expert_interviews',
  'case_studies',
  'research_analysis',
  'industry_insights',
  'community_spotlight'
);

CREATE TYPE content_pillar AS ENUM (
  'beauty_innovation',
  'fitness_science',
  'wellness_education',
  'warsaw_lifestyle',
  'industry_standards',
  'client_education',
  'trend_analysis',
  'expert_opinion'
);

CREATE TYPE target_audience_segment AS ENUM (
  'beauty_professionals',
  'fitness_enthusiasts',
  'luxury_clients',
  'wellness_seekers',
  'local_warsaw_residents',
  'international_clients',
  'medical_professionals',
  'beauty_students',
  'fitness_beginners',
  'seasonal_clients'
);

CREATE TYPE content_seasonality AS ENUM (
  'spring_prep',
  'summer_ready',
  'autumn_wellness',
  'winter_recovery',
  'holiday_season',
  'new_year',
  'valentines_special',
  'summer_body',
  'winter_skin',
  'year_round'
);

CREATE TYPE expertise_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'professional',
  'all_levels'
);

CREATE TYPE warsaw_focus_type AS ENUM (
  'local_events',
  'climate_specific',
  'cultural_beauty_standards',
  'warsaw_trends',
  'local_experts',
  'seasonal_adaptations',
  'neighborhood_focus',
  'city_lifestyle_integration'
);

-- Content strategy master table
CREATE TABLE content_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  strategy_type content_strategy_type NOT NULL,
  content_pillar content_pillar NOT NULL,
  target_audience target_audience_segment NOT NULL,
  expertise_level expertise_level DEFAULT 'all_levels',
  seasonality content_seasonality,
  warsaw_focus warsaw_focus_type,

  -- Strategic positioning
  unique_value_proposition TEXT,
  key_differentiators TEXT[],
  authority_building_elements JSONB,
  trust_signals JSONB,

  -- Content requirements
  minimum_word_count INTEGER DEFAULT 800,
  maximum_word_count INTEGER DEFAULT 2000,
  required_sections TEXT[],
  required_media_types TEXT[],
  data_sources TEXT[],
  expert_citations_required BOOLEAN DEFAULT false,

  -- SEO and discovery
  primary_keywords TEXT[],
  secondary_keywords TEXT[],
  local_seo_keywords TEXT[],
  competitor_analysis JSONB,
  search_intent TEXT,

  -- Measurement criteria
  success_metrics JSONB,
  kpi_targets JSONB,
  conversion_goals JSONB,
  engagement_targets JSONB,

  -- Status and workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'active', 'paused', 'completed')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  assigned_to UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),

  -- Scheduling
  campaign_start_date DATE,
  campaign_end_date DATE,
  publishing_schedule JSONB,
  content_frequency TEXT,

  -- Localization
  language_preference TEXT DEFAULT 'en',
  target_regions TEXT[],
  cultural_adaptations JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1
);

-- Content strategy execution items
CREATE TABLE content_strategy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES content_strategy(id) ON DELETE CASCADE,

  -- Content details
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'social_media', 'video_script', 'email_newsletter', 'landing_page', 'case_study', 'interview', 'research_summary')),
  format TEXT,
  word_count_target INTEGER,

  -- Topic and angle
  main_topic TEXT NOT NULL,
  specific_angle TEXT,
  key_messages TEXT[],
  evidence_points TEXT[],
  call_to_action TEXT,

  -- Expert involvement
  required_expertise TEXT[],
  interview_subjects TEXT[],
  data_requirements JSONB,
  source_materials TEXT[],

  -- Warsaw-specific elements
  local_relevance TEXT,
  warsaw_context JSONB,
  seasonal_adaptation TEXT,
  cultural_considerations TEXT[],

  -- SEO optimization
  target_keywords TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  content_outline JSONB,
  internal_linking_opportunities TEXT[],

  -- Visual requirements
  required_images TEXT[],
  image_specs JSONB,
  brand_guidelines JSONB,
  visual_style TEXT,

  -- Distribution plan
  primary_channels TEXT[],
  secondary_channels TEXT[],
  social_media_variations JSONB,
  email_subject_lines TEXT[],

  -- Timeline
  draft_due_date DATE,
  review_date DATE,
  publish_date DATE,
  promotion_start_date DATE,

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'draft', 'review', 'approved', 'scheduled', 'published', 'promoted')),
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for content items
  UNIQUE(strategy_id, title)
);

-- Expert and authority sources
CREATE TABLE expert_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  credentials TEXT[],
  expertise_areas TEXT[],
  warsaw_relevance BOOLEAN DEFAULT false,
  bio TEXT,
  photo_url TEXT,
  contact_info JSONB,
  social_media JSONB,

  -- Content contributions
  contributed_topics TEXT[],
  interview_topics TEXT[],
  quote_database JSONB,
  collaboration_history JSONB,

  -- Verification and authority
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  authority_score INTEGER CHECK (authority_score BETWEEN 1 AND 100),
  citation_count INTEGER DEFAULT 0,

  -- Relationship management
  partnership_status TEXT DEFAULT 'prospect' CHECK (partnership_status IN ('prospect', 'contacted', 'active', 'featured', 'expired')),
  last_contact_date DATE,
  contact_frequency TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content performance and authority metrics
CREATE TABLE content_authority_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_strategy_items(id),

  -- Authority building metrics
  expert_citations INTEGER DEFAULT 0,
  backlinks_earned INTEGER DEFAULT 0,
  media_mentions INTEGER DEFAULT 0,
  social_shares INTEGER DEFAULT 0,

  -- Local Warsaw metrics
  local_engagement_rate DECIMAL(5,2),
  warsaw_search_rankings JSONB,
  local_business_organic_traffic INTEGER DEFAULT 0,

  -- Thought leadership indicators
  industry_influencer_shares INTEGER DEFAULT 0,
  professional_network_engagement INTEGER DEFAULT 0,
  speaking_opportunities_generated INTEGER DEFAULT 0,
  media_interview_requests INTEGER DEFAULT 0,

  -- Educational impact
  reader_comprehension_score DECIMAL(5,2),
  educational_value_votes INTEGER DEFAULT 0,
  practical_application_shares INTEGER DEFAULT 0,
  bookmark_saves INTEGER DEFAULT 0,

  -- Trust and credibility signals
  expertise_rating DECIMAL(3,2) CHECK (expertise_rating BETWEEN 1 AND 5),
  trustworthiness_rating DECIMAL(3,2) CHECK (trustworthiness_rating BETWEEN 1 AND 5),
  accuracy_verifications INTEGER DEFAULT 0,
  expert_endorsements INTEGER DEFAULT 0,

  -- Business impact
  lead_quality_score DECIMAL(5,2),
  consultation_requests INTEGER DEFAULT 0,
  service_inquiries INTEGER DEFAULT 0,
  booking_conversion_rate DECIMAL(5,2),

  measurement_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal content campaigns
CREATE TABLE seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  seasonality content_seasonality NOT NULL,
  campaign_year INTEGER,
  theme TEXT NOT NULL,

  -- Warsaw-specific seasonal data
  warsaw_seasonal_context JSONB,
  local_events_alignment TEXT[],
  weather_based_recommendations JSONB,
  cultural_seasonal_elements JSONB,

  -- Campaign objectives
  primary_objective TEXT,
  secondary_objectives TEXT[],
  target_audience_shifts JSONB,
  service_promotions JSONB,

  -- Content requirements
  content_themes TEXT[],
  required_content_pillars content_pillar[],
  content_mix JSONB,
  local_storytelling_elements TEXT[],

  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  key_content_dates JSONB,
  promotional_pushes JSONB,

  -- Performance targets
  awareness_targets JSONB,
  engagement_targets JSONB,
  conversion_targets JSONB,
  authority_building_targets JSONB,

  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Content strategy to services linking
CREATE TABLE content_service_linking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES content_strategy_items(id),
  service_id UUID REFERENCES services(id),

  linking_type TEXT NOT NULL CHECK (linking_type IN ('direct_promotion', 'educational_prerequisite', 'case_study_example', 'testimonial_content', 'preparation_guide', 'aftercare_education')),
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
  contextual_placement TEXT,

  -- Business impact tracking
  leads_generated INTEGER DEFAULT 0,
  bookings_attributed INTEGER DEFAULT 0,
  revenue_impact DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_item_id, service_id)
);

-- Competitor analysis and benchmarking
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  competitor_type TEXT CHECK (competitor_type IN ('direct_competitor', 'indirect_competitor', 'industry_leader', 'international_benchmark')),
  warsaw_location BOOLEAN DEFAULT false,

  -- Content analysis
  content_themes_covered TEXT[],
  authority_topics TEXT[],
  content_frequency JSONB,
  engagement_patterns JSONB,

  -- SEO analysis
  ranking_keywords TEXT[],
  content_gaps_identified TEXT[],
  backlink_profile JSONB,
  local_seo_strength INTEGER CHECK (local_seo_strength BETWEEN 1 AND 100),

  -- Strengths and weaknesses
  competitive_strengths TEXT[],
  competitive_weaknesses TEXT[],
  market_positioning TEXT,
  unique_value_propositions TEXT[],

  -- Learning opportunities
  content_opportunities TEXT[],
  angle_ideas TEXT[],
  differentiation_strategies JSONB,

  analysis_date DATE,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content localization and cultural adaptation
CREATE TABLE content_localization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_strategy_items(id),
  target_language TEXT NOT NULL,
  target_region TEXT DEFAULT 'poland',

  -- Cultural adaptation elements
  cultural_beauty_standards JSONB,
  local_preferences JSONB,
  seasonal_adaptations JSONB,
  terminology_adaptations JSONB,

  -- Local SEO
  local_keywords TEXT[],
  regional_search_terms TEXT[],
  city_specific_references TEXT[],

  -- Translation quality
  translation_quality_score DECIMAL(5,2) CHECK (translation_quality_score BETWEEN 0 AND 100),
  cultural_appropriateness_score DECIMAL(5,2) CHECK (cultural_appropriateness_score BETWEEN 0 AND 100),
  localization_completeness DECIMAL(5,2) CHECK (localization_completeness BETWEEN 0 AND 100),

  -- Local expert review
  local_expert_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content template library for thought leadership
CREATE TABLE thought_leadership_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_category content_pillar NOT NULL,
  target_audience target_audience_segment NOT NULL,

  -- Template structure
  section_structure JSONB NOT NULL,
  required_elements JSONB,
  optional_elements JSONB,
  word_count_guidelines JSONB,

  -- Authority building elements
  credibility_requirements JSONB,
  evidence_requirements JSONB,
  expert_integration_points JSONB,

  -- Warsaw-specific adaptations
  local_context_elements JSONB,
  seasonal_variations JSONB,
  cultural_integration_points JSONB,

  -- SEO guidelines
  seo_checklist JSONB,
  keyword_integration_rules JSONB,
  internal_linking_strategy JSONB,

  -- Visual guidelines
  visual_requirements JSONB,
  brand_integration_points JSONB,
  image_guidelines JSONB,

  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Content performance benchmarks
CREATE TABLE content_performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_pillar content_pillar NOT NULL,
  content_type TEXT NOT NULL,
  target_audience target_audience_segment NOT NULL,

  -- Industry benchmarks
  industry_avg_engagement_rate DECIMAL(5,2),
  industry_avg_read_time INTEGER,
  industry_avg_share_rate DECIMAL(5,2),
  industry_avg_conversion_rate DECIMAL(5,2),

  -- Warsaw-specific benchmarks
  warsaw_avg_engagement_rate DECIMAL(5,2),
  warsaw_local_readership DECIMAL(5,2),
  local_conversion_rate DECIMAL(5,2),

  -- Authority building benchmarks
  thought_leadership_metrics JSONB,
  expert_citation_rates JSONB,
  backlink_acquisition_rates JSONB,

  -- Seasonal benchmarks
  seasonal_multipliers JSONB,
  weather_impact_factors JSONB,
  local_event_impacts JSONB,

  benchmark_quarter INTEGER,
  benchmark_year INTEGER,
  data_source TEXT,
  reliability_score DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_content_strategy_type ON content_strategy(strategy_type);
CREATE INDEX idx_content_strategy_pillar ON content_strategy(content_pillar);
CREATE INDEX idx_content_strategy_audience ON content_strategy(target_audience);
CREATE INDEX idx_content_strategy_status ON content_strategy(status);
CREATE INDEX idx_content_strategy_priority ON content_strategy(priority);
CREATE INDEX idx_content_strategy_seasonality ON content_strategy(seasonality);

CREATE INDEX idx_content_strategy_items_strategy ON content_strategy_items(strategy_id);
CREATE INDEX idx_content_strategy_items_status ON content_strategy_items(status);
CREATE INDEX idx_content_strategy_items_type ON content_strategy_items(content_type);
CREATE INDEX idx_content_strategy_items_publish_date ON content_strategy_items(publish_date);

CREATE INDEX idx_expert_sources_expertise ON expert_sources USING GIN(expertise_areas);
CREATE INDEX idx_expert_sources_warsaw ON expert_sources(warsaw_relevance);
CREATE INDEX idx_expert_sources_authority ON expert_sources(authority_score);

CREATE INDEX idx_content_authority_metrics_content ON content_authority_metrics(content_id);
CREATE INDEX idx_content_authority_metrics_date ON content_authority_metrics(measurement_date);

CREATE INDEX idx_seasonal_campaigns_season ON seasonal_campaigns(seasonality);
CREATE INDEX idx_seasonal_campaigns_year ON seasonal_campaigns(campaign_year);
CREATE INDEX idx_seasonal_campaigns_dates ON seasonal_campaigns(start_date, end_date);

CREATE INDEX idx_content_service_linking_content ON content_service_linking(content_item_id);
CREATE INDEX idx_content_service_linking_service ON content_service_linking(service_id);

CREATE INDEX idx_competitor_analysis_warsaw ON competitor_analysis(warsaw_location);
CREATE INDEX idx_competitor_analysis_type ON competitor_analysis(competitor_type);

CREATE INDEX idx_content_localization_content ON content_localization(content_id);
CREATE INDEX idx_content_localization_language ON content_localization(target_language);
CREATE INDEX idx_content_localization_region ON content_localization(target_region);

CREATE INDEX idx_thought_leadership_templates_category ON thought_leadership_templates(template_category);
CREATE INDEX idx_thought_leadership_templates_audience ON thought_leadership_templates(target_audience);

CREATE INDEX idx_content_performance_benchmarks_pillar ON content_performance_benchmarks(content_pillar);
CREATE INDEX idx_content_performance_benchmarks_type ON content_performance_benchmarks(content_type);
CREATE INDEX idx_content_performance_benchmarks_year_quarter ON content_performance_benchmarks(benchmark_year, benchmark_quarter);

-- Row Level Security (RLS) policies
ALTER TABLE content_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_strategy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_authority_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_service_linking ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_localization ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_leadership_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content strategy
CREATE POLICY "Content strategy: Full access for authenticated users" ON content_strategy
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Content strategy items: Full access for authenticated users" ON content_strategy_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Public read access for expert sources
CREATE POLICY "Expert sources: Public read access" ON expert_sources
  FOR SELECT USING (true);

CREATE POLICY "Expert sources: Full access for authenticated users" ON expert_sources
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS for other tables
CREATE POLICY "Content authority metrics: Full access for authenticated users" ON content_authority_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Seasonal campaigns: Full access for authenticated users" ON seasonal_campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Content service linking: Full access for authenticated users" ON content_service_linking
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Competitor analysis: Full access for authenticated users" ON competitor_analysis
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Content localization: Full access for authenticated users" ON content_localization
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Thought leadership templates: Full access for authenticated users" ON thought_leadership_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Content performance benchmarks: Full access for authenticated users" ON content_performance_benchmarks
  FOR ALL USING (auth.role() = 'authenticated');

-- Helper functions for content strategy management
CREATE OR REPLACE FUNCTION calculate_content_priority_score(
  strategy_id UUID,
  priority_weight DECIMAL DEFAULT 1.0,
  seasonal_weight DECIMAL DEFAULT 0.8,
  authority_weight DECIMAL DEFAULT 1.2
) RETURNS DECIMAL AS $$
DECLARE
  base_priority INTEGER;
  seasonal_relevance INTEGER;
  authority_potential INTEGER;
  final_score DECIMAL;
BEGIN
  -- Get base priority from strategy
  SELECT p.priority INTO base_priority
  FROM content_strategy p
  WHERE p.id = strategy_id;

  -- Calculate seasonal relevance (higher if current or upcoming season)
  SELECT CASE
    WHEN p.seasonality = 'year_round' THEN 8
    WHEN p.campaign_start_date <= CURRENT_DATE AND p.campaign_end_date >= CURRENT_DATE THEN 10
    WHEN p.campaign_start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 9
    WHEN p.campaign_start_date BETWEEN CURRENT_DATE + INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '60 days' THEN 7
    ELSE 5
  END INTO seasonal_relevance
  FROM content_strategy p
  WHERE p.id = strategy_id;

  -- Calculate authority building potential
  SELECT CASE
    WHEN p.strategy_type IN ('thought_leadership', 'expert_interviews', 'research_analysis') THEN 10
    WHEN p.strategy_type IN ('educational', 'industry_insights') THEN 8
    WHEN p.strategy_type IN ('case_studies', 'community_spotlight') THEN 7
    ELSE 5
  END INTO authority_potential
  FROM content_strategy p
  WHERE p.id = strategy_id;

  -- Calculate final weighted score
  final_score := (
    (base_priority * priority_weight) +
    (seasonal_relevance * seasonal_weight) +
    (authority_potential * authority_weight)
  ) / (priority_weight + seasonal_weight + authority_weight);

  RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content recommendations based on seasonality and trends
CREATE OR REPLACE FUNCTION get_seasonal_content_recommendations(
  target_season content_seasonality,
  target_pillar content_pillar,
  limit_count INTEGER DEFAULT 5
) RETURNS TABLE (
  content_idea TEXT,
  target_audience target_audience_segment,
  warsaw_context TEXT,
  authority_potential INTEGER,
  estimated_impact INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CONCAT('Create ', s.strategy_type, ' content focused on ', s.unique_value_proposition) as content_idea,
    s.target_audience,
    CASE
      WHEN s.warsaw_focus IS NOT NULL THEN 'High - specifically tailored for Warsaw market'
      ELSE 'Moderate - general relevance with local adaptations needed'
    END as warsaw_context,
    CASE
      WHEN s.strategy_type IN ('thought_leadership', 'expert_interviews', 'research_analysis') THEN 10
      WHEN s.strategy_type IN ('educational', 'industry_insights') THEN 8
      ELSE 6
    END as authority_potential,
    (s.priority + s.success_metrics->>'engagement_target')::INTEGER as estimated_impact
  FROM content_strategy s
  WHERE s.seasonality = target_season
    OR s.seasonality = 'year_round'
    AND s.content_pillar = target_pillar
    AND s.status = 'active'
  ORDER BY
    authority_potential DESC,
    estimated_impact DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify content gaps based on competitor analysis
CREATE OR REPLACE FUNCTION identify_content_gaps(
  pillar content_pillar,
  target_segment target_audience_segment
) RETURNS TABLE (
  gap_type TEXT,
  opportunity_description TEXT,
  market_demand INTEGER,
  competition_level INTEGER,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Content gap in ' || pillar || ' for ' || target_segment as gap_type,
    'Identified opportunity: ' || s.unique_value_proposition as opportunity_description,
    COALESCE(s.success_metrics->>'reach_target', '1000')::INTEGER as market_demand,
    (SELECT COUNT(*) FROM competitor_analysis c WHERE c.content_themes_covered @> ARRAY[pillar::text]) as competition_level,
    CASE
      WHEN (SELECT COUNT(*) FROM competitor_analysis c WHERE c.content_themes_covered @> ARRAY[pillar::text]) < 3
      THEN 'High opportunity - low competition'
      WHEN (SELECT COUNT(*) FROM competitor_analysis c WHERE c.content_themes_covered @> ARRAY[pillar::text]) < 6
      THEN 'Medium opportunity - moderate competition'
      ELSE 'Low opportunity - high competition'
    END as recommendation
  FROM content_strategy s
  WHERE s.content_pillar = pillar
    AND s.target_audience = target_segment
    AND s.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_content_strategy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_content_strategy_updated_at
  BEFORE UPDATE ON content_strategy
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

CREATE TRIGGER update_content_strategy_items_updated_at
  BEFORE UPDATE ON content_strategy_items
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

CREATE TRIGGER update_expert_sources_updated_at
  BEFORE UPDATE ON expert_sources
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

CREATE TRIGGER update_seasonal_campaigns_updated_at
  BEFORE UPDATE ON seasonal_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

CREATE TRIGGER update_competitor_analysis_updated_at
  BEFORE UPDATE ON competitor_analysis
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

CREATE TRIGGER update_content_localization_updated_at
  BEFORE UPDATE ON content_localization
  FOR EACH ROW EXECUTE FUNCTION update_content_strategy_updated_at();

-- Insert initial thought leadership templates
INSERT INTO thought_leadership_templates (
  template_name,
  template_category,
  target_audience,
  section_structure,
  required_elements,
  optional_elements,
  word_count_guidelines,
  credibility_requirements,
  evidence_requirements,
  expert_integration_points,
  local_context_elements,
  seasonal_variations,
  cultural_integration_points,
  seo_checklist,
  keyword_integration_rules,
  internal_linking_strategy,
  visual_requirements,
  brand_integration_points,
  image_guidelines
) VALUES
(
  'Warsaw Beauty Innovation Analysis',
  'beauty_innovation',
  'beauty_professionals',
  '{
    "introduction": {"title": "Industry Context", "word_count": 150},
    "trend_analysis": {"title": "Current Trends", "word_count": 300},
    "innovation_spotlight": {"title": "Innovation Deep Dive", "word_count": 400},
    "warsaw_market_impact": {"title": "Local Market Impact", "word_count": 250},
    "expert_predictions": {"title": "Future Predictions", "word_count": 200},
    "actionable_insights": {"title": "Professional Takeaways", "word_count": 200},
    "conclusion": {"title": "Summary & Next Steps", "word_count": 100}
  }',
  '{
    "data_sources": true,
    "expert_quotes": true,
    "case_examples": true,
    "market_analysis": true
  }',
  '{
    "interviews": true,
    "infographics": true,
    "video_content": true,
    "social_media_snippets": true
  }',
  '{
    "minimum": 1200,
    "optimal": 1600,
    "maximum": 2500
  }',
  '{
    "industry_certifications": true,
    "expert_credentials": true,
    "data_sources_cited": true,
    "peer_review_preferred": true
  }',
  '{
    "scientific_studies": 2,
    "market_data": 1,
    "expert_testimonials": 2,
    "case_studies": 1
  }',
  '{
    "introduction_section": true,
    "innovation_analysis": true,
    "market_impact_section": true,
    "conclusion_quotes": true
  }',
  '{
    "local_expert_opinions": true,
    "warsaw_market_data": true,
    "local_client_preferences": true,
    "regulatory_context": true
  }',
  '{
    "spring": {"focus": "pre-summer prep", "local_events": ["Warsaw Beauty Week"]},
    "summer": {"focus": "protective treatments", "local_events": ["Open Air Festivals"]},
    "autumn": {"focus": "recovery treatments", "local_events": ["Warsaw Fashion Week"]},
    "winter": {"focus": "intensive treatments", "local_events": ["New Year Preparation"]}
  }',
  '{
    "beauty_standards": true,
    "cultural_preferences": true,
    "local_aesthetics": true,
    "historical_context": true
  }',
  '{
    "meta_title": true,
    "meta_description": true,
    "h1_tag": true,
    "h2_tags": true,
    "image_alt_text": true,
    "internal_links": true,
    "external_authority_links": true
  }',
  '{
    "primary_keyword_density": "1-2%",
    "secondary_keywords": "3-5 variations",
    "long_tail_keywords": "natural integration",
    "local_seo_terms": "warsaw-specific"
  }',
  '{
    "service_pages": 3,
    "related_blog_posts": 2,
    "expert_profiles": 1,
    "booking_system": 1
  }',
  '{
    "featured_image": true,
    "infographics": 2,
    "expert_photos": true,
    "before_after_examples": true
  }',
  '{
    "logo_placement": true,
    "brand_colors": true,
    "luxury_aesthetics": true,
    "consistent_messaging": true
  }',
  '{
    "style": "professional_luxury",
    "color_palette": "champagne_cocoa",
    "composition": "clean_editorial",
    "brand_consistency": "high"
  }'
),
(
  'Fitness Science Education',
  'fitness_science',
  'fitness_enthusiasts',
  '{
    "introduction": {"title": "Understanding the Science", "word_count": 150},
    "physiology_basics": {"title": "How It Works", "word_count": 300},
    "practical_application": {"title": "Real-World Application", "word_count": 400},
    "warsaw_lifestyle_integration": {"title": "Integration with Warsaw Lifestyle", "word_count": 250},
    "common_mistakes": {"title": "Common Pitfalls to Avoid", "word_count": 200},
    "success_stories": {"title": "Local Success Stories", "word_count": 200},
    "next_steps": {"title": "Your Action Plan", "word_count": 100}
  }',
  '{
    "scientific_explanations": true,
    "practical_examples": true,
    "step_by_step_instructions": true,
    "safety_considerations": true
  }',
  '{
    "workout_videos": true,
    "progress_photos": true,
    "downloadable_guides": true,
    "community_forum": true
  }',
  '{
    "minimum": 1000,
    "optimal": 1400,
    "maximum": 2000
  }',
  '{
    "fitness_certifications": true,
    "scientific_sources": true,
    "professional_review": true,
    "safety_guidelines": true
  }',
  '{
    "research_studies": 2,
    "expert_guidelines": 1,
    "anatomical_references": 1,
    "safety_protocols": 1
  }',
  '{
    "introduction_expertise": true,
    "science_explanation": true,
    "practical_application": true,
    "success_stories": true
  }',
  '{
    "local_fitness_culture": true,
    "warsaw_weather_considerations": true,
    "local_facilities_reference": true,
    "community_activities": true
  }',
  '{
    "spring": {"focus": "outdoor_fitness_prep", "local_activities": ["Parks running", "Vistula cycling"]},
    "summer": {"focus": "heat_acclimation", "local_activities": ["Outdoor pools", "Park fitness"]},
    "autumn": {"focus": "indoor_transition", "local_activities": ["Gym preparation", "Home workouts"]},
    "winter": {"focus": "maintenance_motivation", "local_activities": ["Indoor sports", "Home fitness"]}
  }',
  '{
    "local_fitness_culture": true,
    "weather_adaptations": true,
    "lifestyle_integration": true,
    "community_fitness_events": true
  }',
  '{
    "meta_title": true,
    "meta_description": true,
    "h1_tag": true,
    "h2_tags": true,
    "exercise_instructions": true,
    "image_alt_text": true,
    "internal_links": true
  }',
  '{
    "primary_keyword_density": "1-2%",
    "exercise_terms": "natural_integration",
    "fitness_level_keywords": "beginner_intermediate_advanced",
    "local_fitness_terms": "warsaw_specific"
  }',
  '{
    "service_pages": 3,
    "related_exercises": 2,
    "trainer_profiles": 1,
    "booking_system": 1
  }',
  '{
    "exercise_demonstrations": true,
    "anatomical_illustrations": true,
    "progress_charts": true,
    "facility_photos": true
  }',
  '{
    "logo_placement": true,
    "brand_colors": true,
    "motivational_style": true,
    "educational_focus": true
  }',
  '{
    "style": "educational_fitness",
    "color_palette": "energetic_champagne",
    "composition": "action_educational",
    "brand_consistency": "high"
  }'
);

-- Comments for documentation
COMMENT ON TABLE content_strategy IS 'Master strategy table for establishing mariia-hub as industry authority in Warsaw beauty and fitness market';
COMMENT ON TABLE content_strategy_items IS 'Individual content pieces that execute the overall content strategy';
COMMENT ON TABLE expert_sources IS 'Database of experts and authorities for citation and collaboration';
COMMENT ON TABLE content_authority_metrics IS 'Metrics tracking authority building and thought leadership impact';
COMMENT ON TABLE seasonal_campaigns IS 'Seasonal content campaigns tailored for Warsaw climate and events';
COMMENT ON TABLE content_service_linking IS 'Links between content strategy and actual services offered';
COMMENT ON TABLE competitor_analysis IS 'Analysis of competitors for content gap identification and positioning';
COMMENT ON TABLE content_localization IS 'Cultural and regional adaptation of content for Polish market';
COMMENT ON TABLE thought_leadership_templates IS 'Templates for creating consistent thought leadership content';
COMMENT ON TABLE content_performance_benchmarks IS 'Industry and local benchmarks for content performance evaluation';