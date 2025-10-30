// Comprehensive Client Feedback and Satisfaction System Types
// For luxury beauty/fitness platform

export interface FeedbackSurvey {
  id: string;
  title_en: string;
  title_pl: string;
  description_en?: string;
  description_pl?: string;
  survey_type: SurveyType;
  service_type?: ServiceType | 'all';
  trigger_events: string[];
  is_active: boolean;
  is_template: boolean;
  config: SurveyConfig;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text_en: string;
  question_text_pl: string;
  question_type: QuestionType;
  display_order: number;
  is_required: boolean;
  config: QuestionConfig;
  conditional_logic: ConditionalLogic;
  validation_rules: ValidationRules;
  created_at: string;
}

export interface FeedbackSubmission {
  id: string;
  survey_id?: string;
  booking_id?: string;
  client_id: string;
  service_id?: string;
  staff_id?: string;
  submission_source: SubmissionSource;
  submission_channel: string;
  session_id?: string;
  is_complete: boolean;
  completion_rate: number;
  started_at: string;
  completed_at?: string;
  time_to_complete?: number;
  client_ip_address?: string;
  user_agent?: string;
  device_info: DeviceInfo;
  created_at: string;
}

export interface FeedbackResponse {
  id: string;
  submission_id: string;
  question_id: string;
  response_value?: string;
  response_number?: number;
  response_array?: string[];
  response_metadata: Record<string, any>;
  answered_at: string;
  response_time_seconds?: number;
}

export interface SatisfactionMetric {
  id: string;
  client_id: string;
  service_id?: string;
  booking_id?: string;
  staff_id?: string;
  metric_type: SatisfactionMetricType;
  score: number;
  max_score: number;
  measurement_date: string;
  measurement_source: string;
  context: Record<string, any>;
  created_at: string;
}

export interface NPSMeasurement {
  id: string;
  client_id: string;
  service_category?: ServiceType;
  score: number; // 0-10
  promoter_category: 'detractor' | 'passive' | 'promoter';
  feedback_text?: string;
  reason?: string;
  measurement_date: string;
  measurement_source: string;
  created_at: string;
}

export interface CESMeasurement {
  id: string;
  client_id: string;
  interaction_type: CESInteractionType;
  effort_score: number; // 1-7
  effort_level: CESEffortLevel;
  feedback_text?: string;
  measurement_date: string;
  measurement_source: string;
  created_at: string;
}

export interface SentimentAnalysis {
  id: string;
  source_id: string;
  source_type: SentimentSourceType;
  text_content: string;
  sentiment_score: number; // -1 to 1
  sentiment_label: 'positive' | 'negative' | 'neutral';
  confidence_score: number; // 0-1
  emotions: Record<string, number>;
  keywords: string[];
  themes: string[];
  entities: Record<string, any>;
  language_detected?: string;
  processed_at: string;
  model_version: string;
  created_at: string;
}

export interface FeedbackTheme {
  id: string;
  theme_name_en: string;
  theme_name_pl: string;
  theme_category: ThemeCategory;
  is_positive?: boolean;
  is_active: boolean;
  parent_theme_id?: string;
  keywords: string[];
  description_en?: string;
  description_pl?: string;
  created_at: string;
}

export interface FeedbackThemeLink {
  id: string;
  feedback_id: string;
  feedback_type: 'submission' | 'response' | 'review' | 'external_review';
  theme_id: string;
  relevance_score: number;
  auto_detected: boolean;
  manually_verified: boolean;
  created_at: string;
}

export interface ServiceRecoveryCase {
  id: string;
  client_id: string;
  trigger_feedback_id?: string;
  booking_id?: string;
  service_id?: string;
  staff_id?: string;
  recovery_priority: RecoveryPriority;
  recovery_status: RecoveryStatus;
  satisfaction_before?: number;
  satisfaction_after?: number;
  recovery_cost?: number;
  recovery_actions: Record<string, any>;
  follow_up_required: boolean;
  follow_up_scheduled_at?: string;
  follow_up_completed_at?: string;
  assigned_to?: string;
  case_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecoveryTask {
  id: string;
  recovery_case_id: string;
  task_type: RecoveryTaskType;
  task_description: string;
  task_status: TaskStatus;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  completion_notes?: string;
  task_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RecoveryCompensation {
  id: string;
  recovery_case_id: string;
  compensation_type: CompensationType;
  compensation_value?: number;
  compensation_details?: string;
  offer_status: CompensationStatus;
  client_response?: string;
  offered_by?: string;
  offered_at: string;
  expires_at?: string;
  created_at: string;
}

export interface SatisfactionAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  alert_title: string;
  alert_description?: string;
  trigger_data: Record<string, any>;
  source_feedback_id?: string;
  client_id?: string;
  service_id?: string;
  staff_id?: string;
  location_id?: string;
  alert_status: AlertStatus;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertRecipient {
  id: string;
  user_id: string;
  alert_types: AlertType[];
  severity_levels: AlertSeverity[];
  notification_methods: NotificationMethod[];
  notification_preferences: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalReview {
  id: string;
  platform: ReviewPlatform;
  external_review_id: string;
  client_name?: string;
  rating: number;
  review_text?: string;
  review_date?: string;
  response_text?: string;
  response_date?: string;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'negative' | 'neutral';
  is_verified: boolean;
  response_required: boolean;
  response_sent: boolean;
  metadata: Record<string, any>;
  last_synced_at: string;
  created_at: string;
}

export interface FeedbackAggregation {
  id: string;
  client_id: string;
  aggregation_period_start: string;
  aggregation_period_end: string;
  total_feedback_entries: number;
  average_satisfaction_score?: number;
  average_nps_score?: number;
  average_ces_score?: number;
  sentiment_distribution: Record<string, number>;
  top_themes: string[];
  improvement_areas: string[];
  strength_areas: string[];
  trend_data: Record<string, any>;
  created_at: string;
}

export interface ClientSatisfactionPrediction {
  id: string;
  client_id: string;
  prediction_type: PredictionType;
  prediction_score: number; // 0-1
  risk_level: RiskLevel;
  confidence_level?: number;
  influencing_factors: Record<string, any>;
  recommended_actions: string[];
  prediction_date: string;
  valid_until?: string;
  model_version: string;
  created_at: string;
}

export interface ServicePerformanceInsight {
  id: string;
  service_id?: string;
  insight_type: InsightType;
  insight_title: string;
  insight_description: string;
  impact_potential: ImpactPotential;
  implementation_effort: ImplementationEffort;
  priority_score: number; // 0-10
  supporting_data: Record<string, any>;
  recommended_actions: string[];
  expected_outcomes: Record<string, any>;
  status: InsightStatus;
  created_at: string;
  updated_at: string;
}

export interface StaffFeedbackPerformance {
  id: string;
  staff_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  total_reviews: number;
  average_rating?: number;
  average_satisfaction_score?: number;
  client_compliment_count: number;
  client_complaint_count: number;
  nps_contribution?: number;
  ces_score?: number;
  strength_areas: string[];
  improvement_areas: string[];
  client_themes: Record<string, any>;
  performance_trend?: 'improving' | 'stable' | 'declining';
  ranking_position?: number;
  total_staff_compared?: number;
  created_at: string;
}

export interface StaffTrainingRecommendation {
  id: string;
  staff_id: string;
  training_category: TrainingCategory;
  training_priority: TrainingPriority;
  training_reason: string;
  supporting_feedback: Record<string, any>;
  recommended_training_programs: Record<string, any>;
  target_completion_date?: string;
  status: TrainingStatus;
  completion_date?: string;
  effectiveness_score?: number; // 0-10
  created_at: string;
  updated_at: string;
}

// Enums and Union Types
export type SurveyType = 'post_service' | 'nps' | 'ces' | 'general_satisfaction' | 'staff_evaluation' | 'facility_feedback';
export type ServiceType = 'beauty' | 'fitness' | 'lifestyle';
export type QuestionType = 'rating' | 'nps' | 'ces' | 'multiple_choice' | 'text' | 'emoji' | 'star_rating';
export type SubmissionSource = 'email' | 'sms' | 'in_app' | 'qr_code' | 'tablet' | 'website' | 'mobile_app';
export type SatisfactionMetricType =
  | 'overall_satisfaction'
  | 'service_quality'
  | 'staff_professionalism'
  | 'facility_cleanliness'
  | 'value_for_money'
  | 'likelihood_to_return'
  | 'likelihood_to_recommend'
  | 'emotional_satisfaction'
  | 'luxury_experience'
  | 'personalization'
  | 'convenience'
  | 'digital_experience'
  | 'communication_quality';

export type CESInteractionType =
  | 'booking_process'
  | 'rescheduling'
  | 'cancellation'
  | 'payment'
  | 'support_interaction'
  | 'service_completion'
  | 'feedback_submission';

export type CESEffortLevel = 'very_difficult' | 'difficult' | 'neutral' | 'easy' | 'very_easy';
export type SentimentSourceType = 'feedback_response' | 'review' | 'support_interaction' | 'social_media';
export type ThemeCategory =
  | 'service_quality'
  | 'staff_behavior'
  | 'facility'
  | 'pricing'
  | 'communication'
  | 'technology'
  | 'scheduling'
  | 'products'
  | 'atmosphere'
  | 'cleanliness'
  | 'professionalism'
  | 'other';

export type RecoveryPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecoveryStatus = 'new' | 'assigned' | 'in_progress' | 'client_contacted' | 'resolved' | 'closed' | 'escalated';
export type RecoveryTaskType = 'client_contact' | 'staff_training' | 'process_improvement' | 'compensation' | 'follow_up' | 'escalation';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type CompensationType = 'discount' | 'free_service' | 'refund' | 'gift' | 'upgrade' | 'loyalty_points';
export type CompensationStatus = 'offered' | 'accepted' | 'declined' | 'expired';

export type AlertType =
  | 'low_score'
  | 'negative_sentiment'
  | 'multiple_complaints'
  | 'trend_decline'
  | 'staff_performance'
  | 'service_issue'
  | 'facility_problem';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertStatus = 'active' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
export type NotificationMethod = 'email' | 'sms' | 'in_app' | 'push' | 'webhook';
export type ReviewPlatform = 'google' | 'facebook' | 'booksy' | 'yelp' | 'tripadvisor' | 'local_directory';

export type PredictionType =
  | 'churn_risk'
  | 'satisfaction_decline'
  | 'complaint_likelihood'
  | 'recommendation_probability'
  | 'repeat_business_probability';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type InsightType =
  | 'performance_improvement'
  | 'staff_training'
  | 'process_optimization'
  | 'client_retention'
  | 'revenue_optimization'
  | 'competitive_advantage';

export type ImpactPotential = 'low' | 'medium' | 'high' | 'critical';
export type ImplementationEffort = 'low' | 'medium' | 'high';
export type InsightStatus = 'new' | 'acknowledged' | 'in_progress' | 'implemented' | 'measuring' | 'closed';

export type TrainingCategory =
  | 'customer_service'
  | 'technical_skills'
  | 'communication'
  | 'upselling'
  | 'complaint_handling'
  | 'product_knowledge'
  | 'time_management'
  | 'luxury_service_standards';

export type TrainingPriority = 'low' | 'medium' | 'high' | 'critical';
export type TrainingStatus = 'recommended' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Configuration and Data Types
export interface SurveyConfig {
  auto_trigger?: boolean;
  trigger_delay_hours?: number;
  max_reminders?: number;
  frequency_days?: number;
  exclude_recent_negative?: boolean;
  measure_booking_process?: boolean;
  measure_service_experience?: boolean;
  custom_branding?: boolean;
  incentive_offered?: boolean;
  timing_optimization?: boolean;
  adaptive_logic?: boolean;
  branding_config?: Record<string, any>;
  completion_incentive?: Record<string, any>;
  thank_you_message?: {
    en: string;
    pl: string;
  };
}

export interface QuestionConfig {
  scale?: {
    min: number;
    max: number;
    step?: number;
    labels?: {
      en: string[];
      pl: string[];
    };
  };
  options?: {
    en: Array<{
      value: string;
      label: string;
    }>;
    pl: Array<{
      value: string;
      label: string;
    }>;
  };
  placeholder?: {
    en: string;
    pl: string;
  };
  max_length?: number;
  allow_multiple?: boolean;
}

export interface ConditionalLogic {
  show_if?: Array<{
    question_id: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: any;
  }>;
  hide_if?: Array<{
    question_id: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: any;
  }>;
}

export interface ValidationRules {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  custom_validation?: string;
}

export interface DeviceInfo {
  device_type?: 'desktop' | 'tablet' | 'mobile';
  operating_system?: string;
  browser?: string;
  screen_resolution?: string;
  language?: string;
  timezone?: string;
}

// Analytics and Reporting Types
export interface SatisfactionOverview {
  month: string;
  metric_type: SatisfactionMetricType;
  average_score: number;
  measurement_count: number;
  score_stddev: number;
  min_score: number;
  max_score: number;
  median_score: number;
  unique_services: number;
  unique_clients: number;
  unique_staff: number;
}

export interface NPSTrend {
  month: string;
  total_respondents: number;
  promoters: number;
  detractors: number;
  passives: number;
  nps_score: number;
  average_score: number;
  service_category?: ServiceType;
}

export interface StaffPerformanceRanking {
  staff_id: string;
  staff_name: string;
  evaluation_period_end: string;
  average_rating?: number;
  average_satisfaction_score?: number;
  total_reviews: number;
  client_compliment_count: number;
  client_complaint_count: number;
  nps_contribution?: number;
  ces_score?: number;
  ranking_position?: number;
  total_staff_compared?: number;
  overall_rank: number;
  feedback_volume_rank: number;
  nps_rank: number;
}

export interface ServiceRecoveryEffectiveness {
  month: string;
  total_cases: number;
  resolved_cases: number;
  improvement_cases: number;
  avg_satisfaction_before?: number;
  avg_satisfaction_after?: number;
  avg_improvement?: number;
  total_compensation_cost: number;
  avg_compensation_cost: number;
  critical_cases: number;
  high_priority_cases: number;
}

// Dashboard and UI Types
export interface FeedbackDashboard {
  summary: {
    total_submissions: number;
    average_satisfaction: number;
    nps_score: number;
    ces_score: number;
    active_alerts: number;
    recovery_cases: number;
  };
  trends: {
    satisfaction_trend: Array<{ date: string; score: number }>;
    nps_trend: Array<{ date: string; score: number }>;
    submission_volume: Array<{ date: string; count: number }>;
  };
  top_issues: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    trend: 'improving' | 'stable' | 'declining';
  }>;
  staff_rankings: StaffPerformanceRanking[];
  recent_alerts: SatisfactionAlert[];
  recovery_cases: ServiceRecoveryCase[];
}

export interface SurveyResponseData {
  submission_id: string;
  survey_id?: string;
  responses: Array<{
    question_id: string;
    response: any;
    response_time?: number;
  }>;
  completion_time: number;
  device_info: DeviceInfo;
}

export interface FeedbackWidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'brand';
  auto_trigger: boolean;
  trigger_delay: number;
  show_on_pages: string[];
  exclude_pages: string[];
  custom_styling: Record<string, any>;
  branding: {
    logo_url?: string;
    primary_color?: string;
    font_family?: string;
  };
}

// =====================================================
// VIP AND PREMIUM FEATURES
// =====================================================

export interface VIPFeedbackPreferences {
  client_id: string;
  preferred_contact_methods: NotificationMethod[];
  preferred_survey_types: SurveyType[];
  personalized_questions: PersonalizedQuestion[];
  white_glove_service: boolean;
  executive_review_required: boolean;
  feedback_timing: FeedbackTimingPreferences;
  incentive_preferences: IncentivePreferences;
  created_at: string;
  updated_at: string;
}

export interface PersonalizedQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  is_active: boolean;
  trigger_conditions: LogicCondition[];
}

export interface FeedbackTimingPreferences {
  preferred_days: number[]; // 0-6 (Sunday-Saturday)
  preferred_times: string[]; // HH:mm format
  timezone: string;
  avoid_periods: AvoidPeriod[];
}

export interface AvoidPeriod {
  start_date: string;
  end_date: string;
  reason: string;
}

export interface IncentivePreferences {
  prefers_offers: boolean;
  offer_types: CompensationType[];
  minimum_value_threshold?: number;
  prefers_early_access: boolean;
  prefers_exclusive_events: boolean;
}

export interface LogicCondition {
  question_id: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

export interface SatisfactionDashboard {
  overview: SatisfactionOverview;
  real_time_metrics: RealTimeMetrics;
  trend_analysis: TrendAnalysis;
  staff_performance: StaffPerformanceOverview;
  service_recovery: ServiceRecoveryOverview;
  client_insights: ClientInsights;
  alerts: AlertOverview;
}

export interface RealTimeMetrics {
  current_satisfaction_score: number;
  today_submissions: number;
  active_alerts: number;
  pending_recovery_cases: number;
  average_response_time: number;
  current_trend: 'improving' | 'stable' | 'declining';
}

export interface TrendAnalysis {
  satisfaction_trend: MonthlyTrend[];
  nps_trend: MonthlyTrend[];
  ces_trend: MonthlyTrend[];
  volume_trend: MonthlyTrend[];
  sentiment_trend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  value: number;
  change_from_previous: number;
  forecast?: number;
  confidence_interval?: [number, number];
}

export interface StaffPerformanceOverview {
  top_performers: StaffMember[];
  improvement_needed: StaffMember[];
  team_average_score: number;
  total_staff_evaluated: number;
  performance_distribution: PerformanceDistribution;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  average_score: number;
  total_reviews: number;
  ranking: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceDistribution {
  excellent: number;
  good: number;
  average: number;
  needs_improvement: number;
  poor: number;
}

export interface ServiceRecoveryOverview {
  active_cases: number;
  resolved_today: number;
  average_resolution_time: number;
  success_rate: number;
  total_cost_this_month: number;
  priority_breakdown: PriorityBreakdown;
}

export interface PriorityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ClientInsights {
  at_risk_clients: ClientRisk[];
  vip_clients: VIPClientSummary[];
  satisfaction_segments: SatisfactionSegment[];
  churn_predictions: ChurnPrediction[];
}

export interface ClientRisk {
  client_id: string;
  client_name: string;
  risk_level: RiskLevel;
  last_satisfaction_score: number;
  risk_factors: string[];
  recommended_actions: string[];
}

export interface VIPClientSummary {
  client_id: string;
  client_name: string;
  lifetime_value: number;
  satisfaction_score: number;
  recent_feedback: string;
  special_attention_needed: boolean;
}

export interface SatisfactionSegment {
  segment_name: string;
  client_count: number;
  average_satisfaction: number;
  revenue_contribution: number;
  growth_potential: string;
}

export interface ChurnPrediction {
  client_id: string;
  client_name: string;
  churn_probability: number;
  contributing_factors: string[];
  retention_cost_estimate: number;
  recommended_retention_strategy: string;
}

export interface AlertOverview {
  total_active: number;
  by_severity: SeverityBreakdown;
  by_type: TypeBreakdown;
  average_resolution_time: number;
  overdue_alerts: number;
}

export interface SeverityBreakdown {
  emergency: number;
  critical: number;
  warning: number;
  info: number;
}

export interface TypeBreakdown {
  [alert_type: string]: number;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateSurveyRequest {
  title_en: string;
  title_pl: string;
  description_en?: string;
  description_pl?: string;
  survey_type: SurveyType;
  service_type?: ServiceType | 'all';
  trigger_events: string[];
  config: SurveyConfig;
  questions: CreateSurveyQuestionRequest[];
}

export interface CreateSurveyQuestionRequest {
  question_text_en: string;
  question_text_pl: string;
  question_type: QuestionType;
  display_order: number;
  is_required: boolean;
  config: QuestionConfig;
  conditional_logic: ConditionalLogic;
  validation_rules: ValidationRules;
}

export interface SubmitFeedbackRequest {
  survey_id?: string;
  booking_id?: string;
  service_id?: string;
  staff_id?: string;
  submission_source: SubmissionSource;
  responses: CreateFeedbackResponseRequest[];
  device_info?: DeviceInfo;
}

export interface CreateFeedbackResponseRequest {
  question_id: string;
  response_value?: string;
  response_number?: number;
  response_array?: string[];
  response_metadata?: Partial<Record<string, any>>;
}

export interface FeedbackAnalyticsQuery {
  date_range?: {
    start: string;
    end: string;
  };
  service_types?: ServiceType[];
  staff_ids?: string[];
  client_segments?: string[];
  metric_types?: SatisfactionMetricType[];
  sentiment_filters?: ('positive' | 'negative' | 'neutral')[];
  theme_filters?: string[];
  group_by?: string[];
  aggregation_level?: 'daily' | 'weekly' | 'monthly';
}

export interface FeedbackAnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  summary: SatisfactionOverview;
  metrics: SatisfactionMetric[];
  trends: TrendAnalysis;
  insights: ServicePerformanceInsight[];
  recommendations: RecommendedAction[];
  staff_performance: StaffFeedbackPerformance[];
  recovery_cases: ServiceRecoveryCase[];
  alerts: SatisfactionAlert[];
}

export interface RecommendedAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_impact: number;
  implementation_effort: 'low' | 'medium' | 'high';
  timeframe: string;
  resources_needed?: string[];
}

// =====================================================
// FORM AND VALIDATION TYPES
// =====================================================

export interface SurveyFormData {
  title_en: string;
  title_pl: string;
  description_en?: string;
  description_pl?: string;
  survey_type: SurveyType;
  service_type: ServiceType | 'all';
  trigger_events: string[];
  config: Partial<SurveyConfig>;
}

export interface QuestionFormData {
  question_text_en: string;
  question_text_pl: string;
  question_type: QuestionType;
  display_order: number;
  is_required: boolean;
  config: Partial<QuestionConfig>;
  conditional_logic: Partial<ConditionalLogic>;
  validation_rules: Partial<ValidationRules>;
}

export interface FeedbackFormErrors {
  [field: string]: string | undefined;
}

export interface SurveyValidationResult {
  is_valid: boolean;
  errors: FeedbackFormErrors;
  warnings: string[];
  suggestions: string[];
}

// Export all types
export type FeedbackSystem = {
  surveys: FeedbackSurvey[];
  submissions: FeedbackSubmission[];
  metrics: SatisfactionMetric[];
  nps: NPSMeasurement[];
  ces: CESMeasurement[];
  sentiment: SentimentAnalysis[];
  themes: FeedbackTheme[];
  recovery: ServiceRecoveryCase[];
  alerts: SatisfactionAlert[];
  vip_preferences: VIPFeedbackPreferences[];
  analytics: SatisfactionDashboard;
};