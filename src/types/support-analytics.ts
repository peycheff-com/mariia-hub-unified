// Comprehensive Support Analytics Types for Luxury Beauty/Fitness Platform

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_id?: string;
  subject: string;
  description?: string;
  category_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed' | 'escalated';
  channel: 'email' | 'chat' | 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'in_person' | 'portal';
  agent_id?: string;
  assigned_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  sla_deadline?: string;
  customer_satisfaction_rating?: number;
  nps_score?: number;
  customer_effort_score?: number;
  first_contact_resolution: boolean;
  escalation_count: number;
  tags: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  category_type: 'technical' | 'billing' | 'booking' | 'service' | 'feedback' | 'complaint' | 'feature_request' | 'general';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: SupportCategory[];
}

export interface SupportInteraction {
  id: string;
  ticket_id: string;
  sender_id?: string;
  sender_type: 'customer' | 'agent' | 'system' | 'bot';
  message: string;
  message_type: 'text' | 'attachment' | 'system_update' | 'escalation' | 'resolution';
  internal_notes?: string;
  is_internal: boolean;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  reaction_sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: Record<string, number>;
  };
  processing_time_ms?: number;
  created_at: string;
}

export interface SupportAgentMetrics {
  id: string;
  agent_id: string;
  measurement_date: string;
  tickets_handled: number;
  tickets_resolved: number;
  first_response_time_seconds: number;
  average_response_time_seconds: number;
  resolution_time_seconds: number;
  customer_satisfaction_avg: number;
  nps_avg: number;
  ces_avg: number;
  first_contact_resolution_rate: number;
  escalation_rate: number;
  tickets_per_hour: number;
  utilization_rate: number;
  quality_score: number;
  adherence_percentage: number;
  knowledge_base_contributions: number;
  coaching_notes?: string;
  goals_achieved: Record<string, boolean>;
  created_at: string;
}

export interface SupportSLAPolicy {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  first_response_time_minutes: number;
  resolution_time_minutes: number;
  business_hours_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportSLACompliance {
  id: string;
  ticket_id: string;
  sla_policy_id: string;
  first_response_met: boolean;
  first_response_breach_minutes: number;
  resolution_met: boolean;
  resolution_breach_minutes: number;
  overall_compliance_score: number;
  created_at: string;
}

export interface SupportQAEvaluation {
  id: string;
  ticket_id: string;
  evaluator_id?: string;
  agent_id: string;
  evaluation_date: string;
  overall_score: number;
  communication_score: number;
  problem_solving_score: number;
  empathy_score: number;
  efficiency_score: number;
  knowledge_score: number;
  compliance_score: number;
  strengths: string[];
  improvement_areas: string[];
  action_items: string[];
  notes?: string;
  created_at: string;
}

export interface SupportKBAnalytics {
  id: string;
  article_id: string;
  article_title: string;
  views: number;
  unique_views: number;
  helpful_votes: number;
  not_helpful_votes: number;
  search_terms: string[];
  avg_time_on_page_seconds: number;
  bounce_rate: number;
  ticket_deflection_count: number;
  created_at: string;
  updated_at: string;
}

export interface SupportQueueMetrics {
  id: string;
  queue_name: string;
  channel: string;
  measurement_timestamp: string;
  active_tickets: number;
  waiting_tickets: number;
  average_wait_time_seconds: number;
  longest_wait_time_seconds: number;
  abandoned_tickets: number;
  service_level_percentage: number;
  agent_availability: number;
  created_at: string;
}

export interface SupportFeedbackSurvey {
  id: string;
  ticket_id: string;
  customer_id?: string;
  survey_type: 'csat' | 'nps' | 'ces' | 'custom';
  survey_response_date: string;
  overall_rating?: number;
  specific_ratings?: Record<string, number>;
  comments?: string;
  would_recommend?: boolean;
  effort_rating?: number;
  resolution_met_expectations?: boolean;
  agent_rating?: number;
  follow_up_required: boolean;
  follow_up_notes?: string;
  created_at: string;
}

export interface SupportTrainingRecord {
  id: string;
  agent_id: string;
  training_type: 'onboarding' | 'product_knowledge' | 'soft_skills' | 'system_training' | 'compliance' | 'coaching_session';
  training_topic: string;
  training_date: string;
  trainer_id?: string;
  duration_minutes: number;
  completion_status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  score?: number;
  feedback?: string;
  next_training_date?: string;
  skills_covered: string[];
  competency_level_before?: string;
  competency_level_after?: string;
  created_at: string;
}

export interface SupportAutomationAnalytics {
  id: string;
  automation_type: 'bot_response' | 'auto_categorization' | 'sentiment_analysis' | 'auto_routing' | 'suggested_responses' | 'auto_escalation';
  trigger_event: string;
  success_count: number;
  failure_count: number;
  accuracy_score: number;
  confidence_avg: number;
  processing_time_ms_avg: number;
  human_escalation_rate: number;
  customer_acceptance_rate: number;
  time_saved_minutes: number;
  measurement_date: string;
  created_at: string;
}

export interface SupportFinancialMetrics {
  id: string;
  measurement_date: string;
  total_interactions: number;
  total_cost: number;
  cost_per_interaction: number;
  revenue_protection_amount: number;
  upsell_opportunities: number;
  upsell_revenue_generated: number;
  churn_prevented_count: number;
  churn_prevention_value: number;
  customer_retention_value: number;
  automation_roi: number;
  created_at: string;
}

export interface SupportPrediction {
  id: string;
  prediction_type: 'ticket_volume' | 'churn_risk' | 'upsell_opportunity' | 'escalation_risk' | 'sla_breach_risk' | 'agent_performance';
  entity_id?: string;
  entity_type: string;
  predicted_value: number;
  confidence_score: number;
  prediction_date: string;
  actual_value?: number;
  model_version: string;
  features_used: Record<string, any>;
  created_at: string;
}

export interface SupportAlert {
  id: string;
  alert_type: 'sla_breach' | 'high_priority_queue' | 'customer_satisfaction_drop' | 'agent_performance' | 'volume_spike' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message?: string;
  entity_id?: string;
  entity_type?: string;
  threshold_value?: number;
  current_value?: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  auto_resolve_at?: string;
  created_at: string;
}

export interface SupportVIPTracking {
  id: string;
  customer_id: string;
  vip_level: 'standard' | 'silver' | 'gold' | 'platinum' | 'diamond';
  dedicated_agent_id?: string;
  white_glove_service: boolean;
  priority_support: boolean;
  personalized_follow_up: boolean;
  last_contact_date?: string;
  satisfaction_trend: Array<{
    date: string;
    score: number;
    rating_type: string;
  }>;
  lifetime_support_tickets: number;
  avg_resolution_time_minutes: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportAnalyticsSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  first_response_time_avg: number;
  resolution_time_avg: number;
  customer_satisfaction_avg: number;
  nps_avg: number;
  tickets_by_channel: Record<string, number>;
  tickets_by_category: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  agent_performance: Record<string, any>;
  sla_compliance_rate: number;
  automation_rate: number;
  cost_per_ticket: number;
  created_at: string;
}

export interface SupportTeamMetrics {
  id: string;
  team_name: string;
  measurement_date: string;
  total_agents: number;
  active_agents: number;
  tickets_handled: number;
  tickets_resolved: number;
  avg_response_time_seconds: number;
  avg_resolution_time_seconds: number;
  team_satisfaction_avg: number;
  team_utilization_rate: number;
  team_adherence_rate: number;
  first_contact_resolution_rate: number;
  escalation_rate: number;
  quality_score_avg: number;
  created_at: string;
}

// Dashboard and Analytics Types

export interface SupportDashboardMetrics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  avg_first_response_time: number;
  avg_resolution_time: number;
  customer_satisfaction_avg: number;
  nps_avg: number;
  sla_compliance_rate: number;
  tickets_by_channel: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  active_agents: number;
  automation_rate: number;
  trend_data: Array<{
    date: string;
    tickets: number;
    satisfaction: number;
    response_time: number;
  }>;
}

export interface AgentPerformanceDashboard {
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  current_status: 'online' | 'offline' | 'busy' | 'away';
  tickets_handled_today: number;
  tickets_resolved_today: number;
  avg_response_time_current: number;
  current_satisfaction_score: number;
  tickets_in_queue: number;
  active_tickets: Array<{
    id: string;
    ticket_number: string;
    subject: string;
    priority: string;
    wait_time: number;
  }>;
  performance_metrics: {
    tickets_per_hour: number;
    utilization_rate: number;
    quality_score: number;
    adherence_percentage: number;
  };
  weekly_performance: Array<{
    date: string;
    tickets_handled: number;
    satisfaction: number;
    response_time: number;
  }>;
}

export interface CustomerSatisfactionAnalytics {
  current_csat: number;
  current_nps: number;
  current_ces: number;
  satisfaction_trend: Array<{
    date: string;
    csat: number;
    nps: number;
    ces: number;
    survey_count: number;
  }>;
  satisfaction_by_channel: Record<string, number>;
  satisfaction_by_category: Record<string, number>;
  satisfaction_by_priority: Record<string, number>;
  driver_analysis: Array<{
    factor: string;
    impact: number;
    correlation: number;
  }>;
  top_issues: Array<{
    category: string;
    frequency: number;
    avg_satisfaction: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
}

export interface OperationalIntelligence {
  current_volume: number;
  predicted_volume: Array<{
    date: string;
    predicted: number;
    confidence: number;
  }>;
  staffing_recommendations: Array<{
    time_period: string;
    recommended_agents: number;
    current_agents: number;
    volume_prediction: number;
  }>;
  capacity_utilization: {
    current_utilization: number;
    optimal_utilization: number;
    overstaffed_periods: Array<string>;
    understaffed_periods: Array<string>;
  };
  skill_gap_analysis: Array<{
    skill: string;
    required_level: number;
    current_average: number;
    gap: number;
    recommended_training: string[];
  }>;
  automation_opportunities: Array<{
    process: string;
    current_manual_time: number;
    potential_automation_time: number;
    roi_estimate: number;
    implementation_complexity: 'low' | 'medium' | 'high';
  }>;
}

export interface VIPAnalytics {
  total_vip_customers: number;
  vip_distribution: Record<string, number>;
  vip_satisfaction: Record<string, number>;
  vip_retention_rate: number;
  vip_support_metrics: {
    avg_response_time: number;
    dedicated_agent_performance: number;
    white_glove_service_usage: number;
    personalized_follow_up_rate: number;
  };
  vip_tier_performance: Array<{
    tier: string;
    customer_count: number;
    avg_satisfaction: number;
    revenue_impact: number;
    support_cost: number;
    retention_rate: number;
  }>;
  high_value_insights: Array<{
    customer_id: string;
    customer_name: string;
    tier: string;
    recent_issues: string[];
    satisfaction_trend: 'improving' | 'declining' | 'stable';
    recommended_actions: string[];
  }>;
}

export interface SupportAlertRule {
  id: string;
  name: string;
  description: string;
  alert_type: string;
  condition: {
    metric: string;
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    time_window?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  notification_channels: string[];
  cooldown_period: number;
  escalation_rules: Array<{
    condition: string;
    action: string;
    delay_minutes: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface SupportReportConfig {
  id: string;
  name: string;
  description: string;
  report_type: 'performance' | 'satisfaction' | 'financial' | 'operational' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  recipients: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  metrics: string[];
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  custom_template?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportAnalyticsFilter {
  date_range: {
    start: string;
    end: string;
  };
  channels?: string[];
  categories?: string[];
  priorities?: string[];
  agents?: string[];
  teams?: string[];
  vip_levels?: string[];
  satisfaction_range?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface SupportAnalyticsResponse<T = any> {
  data: T;
  metadata: {
    total_records: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
    generated_at: string;
    cache_expires_at?: string;
  };
  filters: SupportAnalyticsFilter;
  performance: {
    query_time_ms: number;
    cache_hit: boolean;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ComparisonData {
  category: string;
  current_period: number;
  previous_period: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// API Request/Response Types
export interface CreateSupportTicketRequest {
  customer_id?: string;
  subject: string;
  description?: string;
  category_id?: string;
  priority: string;
  channel: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateSupportTicketRequest {
  status?: string;
  priority?: string;
  agent_id?: string;
  category_id?: string;
  tags?: string[];
  internal_notes?: string;
}

export interface SupportAnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters: SupportAnalyticsFilter;
  group_by?: string[];
  order_by?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

// Real-time Types
export interface SupportRealtimeUpdate {
  type: 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'ticket_resolved' | 'agent_status_change' | 'sla_breach' | 'new_message';
  data: any;
  timestamp: string;
  channel?: string;
}

export interface SupportKPIDefinition {
  name: string;
  description: string;
  calculation: string;
  target_value: number;
  threshold_min: number;
  threshold_max: number;
  unit: string;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  dimensions: string[];
}

export interface SupportBenchmarkData {
  industry_average: number;
  top_quartile: number;
  current_value: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
  period_over_period_change: number;
}

// Export all types for easy importing
export type {
  // Core entities
  SupportTicket,
  SupportCategory,
  SupportInteraction,
  SupportAgentMetrics,
  SupportSLAPolicy,
  SupportSLACompliance,
  SupportQAEvaluation,
  SupportKBAnalytics,
  SupportQueueMetrics,
  SupportFeedbackSurvey,
  SupportTrainingRecord,
  SupportAutomationAnalytics,
  SupportFinancialMetrics,
  SupportPrediction,
  SupportAlert,
  SupportVIPTracking,
  SupportAnalyticsSnapshot,
  SupportTeamMetrics,

  // Dashboard and analytics
  SupportDashboardMetrics,
  AgentPerformanceDashboard,
  CustomerSatisfactionAnalytics,
  OperationalIntelligence,
  VIPAnalytics,

  // Configuration
  SupportAlertRule,
  SupportReportConfig,
  SupportAnalyticsFilter,
  SupportAnalyticsResponse,

  // Data visualization
  ChartDataPoint,
  TimeSeriesData,
  ComparisonData,

  // API types
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
  SupportAnalyticsQuery,

  // Real-time
  SupportRealtimeUpdate,
  SupportKPIDefinition,
  SupportBenchmarkData,
};