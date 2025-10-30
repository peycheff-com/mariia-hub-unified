import { z } from 'zod';

// Content Strategy Types from database schema
export const ContentStrategyTypeSchema = z.enum([
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
]);

export const ContentPillarSchema = z.enum([
  'beauty_innovation',
  'fitness_science',
  'wellness_education',
  'warsaw_lifestyle',
  'industry_standards',
  'client_education',
  'trend_analysis',
  'expert_opinion'
]);

export const TargetAudienceSegmentSchema = z.enum([
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
]);

export const ContentSeasonalitySchema = z.enum([
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
]);

export const ExpertiseLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'professional',
  'all_levels'
]);

export const WarsawFocusTypeSchema = z.enum([
  'local_events',
  'climate_specific',
  'cultural_beauty_standards',
  'warsaw_trends',
  'local_experts',
  'seasonal_adaptations',
  'neighborhood_focus',
  'city_lifestyle_integration'
]);

// Type exports
export type ContentStrategyType = z.infer<typeof ContentStrategyTypeSchema>;
export type ContentPillar = z.infer<typeof ContentPillarSchema>;
export type TargetAudienceSegment = z.infer<typeof TargetAudienceSegmentSchema>;
export type ContentSeasonality = z.infer<typeof ContentSeasonalitySchema>;
export type ExpertiseLevel = z.infer<typeof ExpertiseLevelSchema>;
export type WarsawFocusType = z.infer<typeof WarsawFocusTypeSchema>;

// Advanced Content Categorization System
export interface ContentTag {
  id: string;
  name: string;
  category: 'topic' | 'format' | 'audience' | 'expertise' | 'seasonal' | 'local' | 'authority';
  description: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  parent_id: string | null;
  description: string;
  content_pillar: ContentPillar;
  target_audience: TargetAudienceSegment;
  expertise_level: ExpertiseLevel;
  seasonal_relevance: ContentSeasonality[];
  warsaw_focus: WarsawFocusType | null;
  icon: string;
  color: string;
  content_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentTagging {
  content_id: string;
  tag_id: string;
  relevance_score: number; // 1-10
  auto_assigned: boolean;
  assigned_by: string | null;
  created_at: string;
}

// Content Classification for Authority Building
export interface ContentClassification {
  id: string;
  content_id: string;

  // Authority level classification
  authority_level: 'emerging' | 'established' | 'leading_expert' | 'industry_authority';
  trust_score: number; // 0-100
  expertise_verification: boolean;

  // Content depth classification
  depth_level: 'introductory' | 'intermediate' | 'advanced' | 'expert_level';
  research_intensity: 'low' | 'medium' | 'high' | 'original_research';
  practical_application: 'theoretical' | 'practical' | 'both';

  // Local relevance classification
  warsaw_relevance_score: number; // 0-100
  cultural_adaptation_level: 'global' | 'national' | 'regional' | 'local_warsaw';
  local_impact_potential: 'low' | 'medium' | 'high' | 'transformative';

  // Educational value classification
  educational_score: number; // 0-100
  learning_objectives_met: string[];
  practical_takeaways: number;

  // SEO performance classification
  seo_optimization_level: 'basic' | 'optimized' | 'highly_optimized' | 'perfectly_optimized';
  keyword_ranking_potential: number; // 0-100
  backlink_attraction_score: number; // 0-100

  // Engagement potential classification
  viral_potential: 'low' | 'medium' | 'high' | 'very_high';
  shareability_score: number; // 0-100
  comment_engagement_potential: number; // 0-100

  created_at: string;
  updated_at: string;
}

// Content Hierarchy and Relationships
export interface ContentRelationship {
  id: string;
  parent_content_id: string | null;
  child_content_id: string | null;
  relationship_type: 'series' | 'prerequisite' | 'follow_up' | 'related_topic' | 'deeper_dive' | 'practical_application' | 'case_study';
  strength: number; // 1-10 relationship strength
  bidirectional: boolean;
  created_at: string;
}

export interface ContentSeries {
  id: string;
  title: string;
  description: string;
  content_pillar: ContentPillar;
  target_audience: TargetAudienceSegment;
  total_parts: number;
  published_parts: number;
  estimated_completion: string;
  content_ids: string[];
  learning_pathway: boolean;
  certification_eligible: boolean;
  created_at: string;
  updated_at: string;
}

// Content Search and Discovery
export interface ContentSearchRequest {
  query?: string;
  filters: {
    strategy_type?: ContentStrategyType[];
    content_pillar?: ContentPillar[];
    target_audience?: TargetAudienceSegment[];
    expertise_level?: ExpertiseLevel[];
    seasonality?: ContentSeasonality[];
    warsaw_focus?: WarsawFocusType[];
    status?: string[];
    date_range?: {
      start: string;
      end: string;
    };
    tags?: string[];
    categories?: string[];
    quality_tier?: string[];
    authority_level?: string[];
  };
  sort_by: 'relevance' | 'created_at' | 'updated_at' | 'quality_score' | 'authority_score' | 'engagement_rate';
  sort_order: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface ContentSearchResult {
  content_id: string;
  title: string;
  content_type: string;
  relevance_score: number;
  quality_score: number;
  authority_score: number;
  local_relevance_score: number;
  matching_tags: string[];
  matching_categories: string[];
  preview: {
    title: string;
    excerpt: string;
    key_points: string[];
  };
  classification: ContentClassification;
}

// Content Recommendation Engine
export interface ContentRecommendation {
  content_id: string;
  recommendation_type: 'similar_content' | 'next_learning' | 'prerequisite' | 'practical_application' | 'deeper_dive';
  relevance_score: number;
  reason: string;
  based_on: string[]; // factors that influenced recommendation
  confidence: number; // 0-100
  created_at: string;
}

export interface PersonalizedRecommendations {
  user_id: string;
  user_profile: {
    expertise_level: ExpertiseLevel;
    interests: string[];
    learning_goals: string[];
    location_preference: string;
    content_preferences: {
      formats: string[];
      lengths: string[];
      topics: string[];
    };
  };
  recommendations: ContentRecommendation[];
  recommendation_context: {
    current_season: ContentSeasonality;
    local_events: string[];
    trending_topics: string[];
    user_progress: {
      completed_content: string[];
      in_progress_content: string[];
      bookmarked_content: string[];
    };
  };
  generated_at: string;
  valid_until: string;
}

// Export all new content strategy types
export type {
  ContentTag,
  ContentCategory,
  ContentTagging,
  ContentClassification,
  ContentRelationship,
  ContentSeries,
  ContentSearchRequest,
  ContentSearchResult,
  ContentRecommendation,
  PersonalizedRecommendations
};

// Base Content Strategy Types
export interface ContentStrategyHub {
  id: string;
  title: string;
  description?: string;
  strategy_type: 'beauty_thought_leadership' | 'fitness_educational' | 'warsaw_local' | 'multi_format' | 'seasonal_campaign' | 'product_launch';
  target_audience: string[];
  primary_goals: string[];
  key_messages: string[];
  content_pillars: string[];
  target_keywords: string[];
  competitive_positioning?: string;
  success_metrics: Json;
  content_mix: Json;
  language_distribution: Json;
  start_date?: string;
  end_date?: string;
  content_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  publication_schedule: Json;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority_level: number; // 1-5
  budget_allocation: number;
  assigned_team_members: string[];
  performance_score: number;
  engagement_rate: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendar {
  id: string;
  strategy_id?: string;
  title: string;
  slug: string;
  content_type: 'blog_post' | 'video_tutorial' | 'instagram_post' | 'facebook_post' | 'tiktok_video' | 'linkedin_article' | 'email_newsletter' | 'podcast_episode' | 'webinar' | 'infographic' | 'case_study' | 'interview' | 'behind_scenes' | 'tutorial' | 'guide' | 'checklist' | 'interactive_quiz' | 'assessment' | 'downloadable_resource' | 'testimonial' | 'before_after';
  format_style?: 'educational' | 'inspirational' | 'promotional' | 'entertaining' | 'informational';
  content_pillar?: string;
  language: 'en' | 'pl' | 'ru' | 'uk';
  title_pl?: string;
  content_pl?: string;
  summary?: string;
  content?: string;
  key_takeaways: string[];
  call_to_action?: string;
  target_keywords: string[];
  focus_keyword?: string;
  featured_image_url?: string;
  additional_images: string[];
  video_url?: string;
  video_duration_seconds?: number;
  thumbnail_url?: string;
  meta_title?: string;
  meta_description?: string;
  social_media_title?: string;
  social_media_description?: string;
  alt_text?: string;
  distribution_channels: string[];
  publication_schedule?: string;
  timezone: string;
  has_reminder: boolean;
  status: 'planned' | 'in_progress' | 'review' | 'scheduled' | 'published' | 'promoted' | 'archived' | 'cancelled';
  version: number;
  is_evergreen: boolean;
  expiry_date?: string;
  target_views: number;
  target_engagement_rate: number;
  target_conversions: number;
  actual_views: number;
  actual_engagement_rate: number;
  actual_conversions: number;
  related_content: string[];
  translated_versions: string[];
  repurposed_from?: string;
  content_quality_score: number; // 0-100
  seo_score: number; // 0-100
  readability_score: number; // 0-100
  author_id?: string;
  reviewer_id?: string;
  assigned_designer_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface BeautyThoughtLeadership {
  id: string;
  content_id: string;
  beauty_category: 'lip_enhancements' | 'brow_artistry' | 'skincare_treatments' | 'makeup_artistry' | 'beauty_trends' | 'industry_insights' | 'product_reviews' | 'technique_tutorials' | 'client_education' | 'business_growth' | 'innovation_technology' | 'sustainability';
  expertise_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  techniques_demonstrated: string[];
  products_mentioned: string[];
  tools_required: string[];
  skill_prerequisites: string[];
  learning_objectives: string[];
  trend_analysis: Json;
  market_insights: Json;
  expert_opinions: Json;
  research_citations: string[];
  before_after_images: string[];
  step_by_step_images: string[];
  video_demonstration_url?: string;
  preparation_steps: string[];
  aftercare_instructions: string[];
  common_mistakes: string[];
  tips_tricks: string[];
  cost_analysis: Json;
  roi_metrics: Json;
  client_satisfaction_factors: Json;
  created_at: string;
  updated_at: string;
}

export interface FitnessEducationalContent {
  id: string;
  content_id: string;
  fitness_category: 'glutes_training' | 'lower_body' | 'strength_training' | 'cardio_fitness' | 'flexibility_mobility' | 'nutrition' | 'recovery' | 'mindset_wellness' | 'exercise_science' | 'program_design' | 'injury_prevention' | 'performance_optimization';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment_needed: string[];
  duration_minutes: number;
  intensity_level: 'low' | 'moderate' | 'high' | 'maximum';
  exercises: Json; // Array of exercise objects
  progression_options: Json;
  modifications: Json;
  common_errors: string[];
  research_references: string[];
  biomechanics_explanation?: string;
  physiological_benefits: string[];
  key_concepts: string[];
  learning_points: string[];
  practical_applications: string[];
  nutrition_tips: Json;
  recovery_recommendations: string[];
  supplementation_notes: string[];
  progress_indicators: Json;
  testing_protocols: Json;
  expected_results_timeline?: string;
  created_at: string;
  updated_at: string;
}

export interface WarsawLocalContent {
  id: string;
  content_id: string;
  local_context: string;
  target_neighborhoods: string[];
  seasonal_relevance?: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round';
  polish_beauty_standards: Json;
  local_preferences: Json;
  cultural_considerations: string[];
  related_warsaw_events: Json;
  local_partnerships: string[];
  community_initiatives: string[];
  location_tags: string[];
  venue_specific?: string;
  accessibility_notes?: string;
  warsaw_keywords: string[];
  local_business_mentions: string[];
  neighborhood_references: string[];
  local_call_to_actions: string[];
  community_involvement: string[];
  local_impact_story?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAssets {
  id: string;
  content_id: string;
  asset_type: 'image' | 'video' | 'audio' | 'document' | 'presentation' | 'infographic' | 'interactive_quiz' | 'assessment' | 'template' | 'checklist' | 'guide';
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size_bytes?: number;
  file_format?: string;
  dimensions?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  preview_url?: string;
  download_url?: string;
  asset_category?: string;
  tags: string[];
  order_index: number;
  download_count: number;
  view_count: number;
  share_count: number;
  quality_level?: 'low' | 'medium' | 'high' | 'ultra';
  optimization_status: 'pending' | 'optimized' | 'needs_optimization';
  created_at: string;
  updated_at: string;
}

export interface InteractiveContent {
  id: string;
  content_id: string;
  interaction_type: 'beauty_consultation_quiz' | 'fitness_assessment' | 'skin_analysis' | 'body_type_finder' | 'routine_planner' | 'progress_tracker' | 'knowledge_test' | 'preference_matcher' | 'budget_calculator';
  questions: Json; // Array of question objects
  results_logic: Json;
  outcome_definitions: Json;
  estimated_time_minutes: number;
  question_count: number;
  has_progress_bar: boolean;
  immediate_feedback: boolean;
  personalization_factors: string[];
  adaptation_logic: Json;
  collects_email: boolean;
  email_collection_point?: 'beginning' | 'middle' | 'end' | 'results';
  follow_up_triggers: Json;
  completion_rate: number;
  average_completion_time_seconds: number;
  drop_off_points: Json;
  service_recommendations: Json;
  content_recommendations: Json;
  created_at: string;
  updated_at: string;
}

export interface ContentPerformanceAnalytics {
  id: string;
  content_id: string;
  date: string;
  views: number;
  unique_views: number;
  average_time_on_page_seconds: number;
  bounce_rate: number;
  likes: number;
  shares: number;
  comments: number;
  saves_bookmarks: number;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  revenue_generated: number;
  website_visits: number;
  instagram_engagement: number;
  facebook_engagement: number;
  tiktok_views: number;
  newsletter_clicks: number;
  quality_score: number;
  relevance_score: number;
  sentiment_score: number;
  demographic_data: Json;
  geographic_data: Json;
  behavior_data: Json;
  video_completion_rate: number;
  audio_completion_rate: number;
  quiz_completion_rate: number;
  download_completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ContentABTests {
  id: string;
  test_name: string;
  hypothesis?: string;
  content_a_id: string;
  content_b_id: string;
  traffic_split_percentage: number;
  test_variable?: 'headline' | 'featured_image' | 'content_structure' | 'call_to_action' | 'format' | 'tone';
  start_date: string;
  end_date?: string;
  sample_size_target: number;
  primary_metric?: 'engagement_rate' | 'conversion_rate' | 'time_on_page' | 'share_rate';
  minimum_detectable_effect: number;
  confidence_level: 90 | 95 | 99;
  status: 'planned' | 'running' | 'paused' | 'completed' | 'cancelled';
  variant_a_performance: Json;
  variant_b_performance: Json;
  statistical_significance: number;
  winner_variant?: 'variant_a' | 'variant_b' | 'inconclusive';
  confidence_interval: Json;
  key_learnings: string[];
  recommendations: string[];
  business_impact?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ContentPerformanceBenchmarks {
  id: string;
  content_category: string;
  content_format: string;
  target_audience?: string;
  industry_average_views: number;
  industry_average_engagement_rate: number;
  industry_average_conversion_rate: number;
  target_views: number;
  target_engagement_rate: number;
  target_conversion_rate: number;
  top_performing_content: string[];
  best_practices: Json;
  benchmark_period_start?: string;
  benchmark_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAIInsights {
  id: string;
  content_id: string;
  sentiment_analysis: Json;
  topic_modeling: Json;
  readability_analysis: Json;
  seo_analysis: Json;
  predicted_performance: Json;
  optimal_publication_time: Json;
  recommended_improvements: Json;
  competitive_positioning: Json;
  content_gap_analysis: Json;
  trending_topics: Json;
  audience_persona_alignment: Json;
  engagement_predictions: Json;
  recommended_topics: Json;
  recommended_formats: Json;
  recommended_distribution: Json;
  analysis_confidence: number; // 0-100
  prediction_confidence: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface ContentWorkflowAutomation {
  id: string;
  workflow_name: string;
  trigger_type: 'content_published' | 'performance_threshold' | 'schedule' | 'manual';
  trigger_conditions: Json;
  actions: Json;
  workflow_steps: Json;
  notification_recipients: string[];
  notification_channels: string[];
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
}

// Content Creation and Management Types
export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  content_type: ContentCalendar['content_type'];
  structure: Json; // Template structure and sections
  placeholders: Json; // Dynamic placeholders
  default_distribution_channels: string[];
  target_audience: string[];
  estimated_creation_time_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendarView {
  date: string;
  contents: ContentCalendar[];
  totalScheduled: number;
  totalPublished: number;
  performanceSummary: {
    totalViews: number;
    avgEngagementRate: number;
    totalConversions: number;
  };
}

export interface ContentPerformanceSummary {
  contentId: string;
  title: string;
  totalViews: number;
  avgEngagementRate: number;
  totalConversions: number;
  avgConversionRate: number;
  performanceScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ContentCreationRequest {
  strategyId?: string;
  contentType: ContentCalendar['content_type'];
  title: string;
  targetAudience: string[];
  contentPillar?: string;
  keywords: string[];
  targetPublicationDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
}

export interface ContentReviewRequest {
  contentId: string;
  reviewType: 'editorial' | 'technical' | 'seo' | 'legal' | 'final';
  requestedBy: string;
  requestedAt: string;
  deadline?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  feedback?: string;
  approved: boolean;
}

// Analytics and Reporting Types
export interface ContentAnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  contentType?: ContentCalendar['content_type'][];
  strategyType?: ContentStrategyHub['strategy_type'][];
  status?: ContentCalendar['status'][];
  language?: ('en' | 'pl')[];
  author?: string[];
  performanceScoreRange?: {
    min: number;
    max: number;
  };
}

export interface ContentAnalyticsDashboard {
  overview: {
    totalContent: number;
    publishedContent: number;
    scheduledContent: number;
    totalViews: number;
    avgEngagementRate: number;
    totalConversions: number;
    topPerformingContent: ContentPerformanceSummary[];
  };
  trends: {
    viewsTrend: Array<{ date: string; views: number }>;
    engagementTrend: Array<{ date: string; rate: number }>;
    conversionTrend: Array<{ date: string; rate: number }>;
  };
  contentMix: {
    byType: Array<{ type: string; count: number; performance: number }>;
    byStrategy: Array<{ strategy: string; count: number; performance: number }>;
    byLanguage: Array<{ language: string; count: number; performance: number }>;
  };
  topPerformers: {
    byViews: ContentPerformanceSummary[];
    byEngagement: ContentPerformanceSummary[];
    byConversions: ContentPerformanceSummary[];
  };
}

export interface ContentRecommendationEngine {
  suggestions: Array<{
    type: 'content_topic' | 'improvement' | 'distribution' | 'timing';
    title: string;
    description: string;
    expectedImpact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    priority: number;
    reasoning: string;
    implementation?: Json;
  }>;
  trendingTopics: Array<{
    topic: string;
    relevanceScore: number;
    searchVolume: number;
    competition: 'low' | 'medium' | 'high';
    suggestedAngles: string[];
  }>;
  contentGaps: Array<{
    gap: string;
    opportunity: 'high' | 'medium' | 'low';
    targetAudience: string[];
    suggestedContent: string[];
  }>;
}

// Content Workflow Types
export interface ContentWorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'creation' | 'review' | 'approval' | 'publication' | 'promotion' | 'analysis';
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dependencies: string[]; // Step IDs that must be completed first
  checklist: Array<{
    item: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
  }>;
  notes?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface ContentWorkflow {
  id: string;
  contentId: string;
  name: string;
  steps: ContentWorkflowStep[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  assignedTeam: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  created_at: string;
  updated_at: string;
}

// Content Types for Beauty Industry
export interface BeautyTrendAnalysis {
  trendName: string;
  category: string;
  description: string;
  popularityScore: number;
  seasonality: string[];
  targetDemographics: string[];
  relevantServices: string[];
  contentOpportunities: string[];
  marketSaturation: 'low' | 'medium' | 'high';
  innovationPotential: number;
  lifespanEstimate: string; // e.g., "3-6 months"
}

export interface BeautyTechnique {
  name: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  requiredSkills: string[];
  tools: string[];
  products: string[];
  stepByStepGuide: string[];
  commonMistakes: string[];
  tips: string[];
  variationOptions: string[];
  safetyConsiderations: string[];
  costRange: {
    min: number;
    max: number;
    currency: string;
  };
}

// Content Types for Fitness Industry
export interface FitnessExercise {
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  variations: string[];
  progressionSteps: string[];
  muscleActivationData?: Json;
  calorieBurnEstimate: {
    perMinute: number;
    for70kgPerson: number;
  };
}

export interface FitnessProgram {
  name: string;
  category: string;
  targetAudience: string[];
  durationWeeks: number;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  difficultyProgression: string[];
  equipmentRequired: string[];
  goals: string[];
  expectedResults: string[];
  nutritionalGuidelines: Json;
  recoveryProtocols: string[];
  assessmentMethods: string[];
  contraindications: string[];
}

// Content Distribution Types
export interface ContentDistributionPlan {
  contentId: string;
  channels: Array<{
    platform: 'website' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube' | 'email' | 'blog';
    publicationTime: string;
    format: string;
    caption: string;
    hashtags: string[];
    targeting?: Json;
    budget?: number;
    expectedReach: number;
    expectedEngagement: number;
  }>;
  crossPromotion: Array<{
    fromPlatform: string;
    toPlatform: string;
    strategy: string;
  }>;
  repurposing: Array<{
    originalFormat: string;
    newFormat: string;
    modifications: string[];
  }>;
}

// Export all types for easy importing
export type {
  ContentStrategyHub,
  ContentCalendar,
  BeautyThoughtLeadership,
  FitnessEducationalContent,
  WarsawLocalContent,
  ContentAssets,
  InteractiveContent,
  ContentPerformanceAnalytics,
  ContentABTests,
  ContentPerformanceBenchmarks,
  ContentAIInsights,
  ContentWorkflowAutomation,
  ContentTemplate,
  ContentCalendarView,
  ContentPerformanceSummary,
  ContentCreationRequest,
  ContentReviewRequest,
  ContentAnalyticsFilters,
  ContentAnalyticsDashboard,
  ContentRecommendationEngine,
  ContentWorkflowStep,
  ContentWorkflow,
  BeautyTrendAnalysis,
  BeautyTechnique,
  FitnessExercise,
  FitnessProgram,
  ContentDistributionPlan,
};