// Comprehensive TypeScript types for the Feature Flags System

import { Json } from "./database.types";

// Core feature flag types
export interface FeatureFlag {
  id: string;
  flag_key: string;
  description: string | null;
  is_active: boolean;
  rollout_percentage: number;
  target_segments: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  environments: string[];
  start_date: string | null;
  end_date: string | null;
  metadata: Json;
}

export interface UserFlagAssignment {
  id: string;
  user_id: string;
  flag_key: string;
  is_enabled: boolean;
  variant: string | null;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
}

export interface FeatureFlagAuditLog {
  id: string;
  flag_key: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted';
  old_values: Json | null;
  new_values: Json | null;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

// Experiment and A/B testing types
export interface ExperimentAssignment {
  id: string;
  experiment_key: string;
  user_id: string;
  variant: string;
  assigned_at: string;
  converted: boolean;
  conversion_value: number;
  converted_at: string | null;
}

export interface ExperimentEvent {
  id: string;
  experiment_key: string;
  user_id: string | null;
  event_type: string;
  event_value: number | null;
  metadata: Json;
  created_at: string;
}

export interface TargetSegments {
  roles?: string[];
  segments?: string[];
  users?: string[];
  custom_rules?: CustomRule[];
}

export interface CustomRule {
  type: 'property' | 'behavior' | 'cohort';
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than' | 'between';
  field: string;
  value: any;
}

export interface ExperimentVariant {
  key: string;
  name: string;
  description: string;
  weight: number;
  config?: Json;
}

export interface ExperimentConfig {
  variants: Record<string, ExperimentVariant>;
  traffic_allocation: number; // 0-100
  success_metrics: string[];
  duration_days?: number;
  sample_size?: number;
  confidence_level?: number; // 0-1
}

// Feature flag management types
export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetSegments?: TargetSegments;
  startDate?: string;
  endDate?: string;
  environments?: string[];
  metadata?: Json;
}

export interface FeatureFlagStats {
  total_flags: number;
  active_flags: number;
  experiments_running: number;
  total_users_enrolled: number;
  conversion_rate: number;
  last_updated: string;
}

export interface ExperimentStats {
  experiment_key: string;
  total_users: number;
  variants: VariantStats[];
  conversion_rate: number;
  statistical_significance?: number;
  winner_variant?: string;
  confidence_interval?: ConfidenceInterval;
  start_date: string;
  days_running: number;
}

export interface VariantStats {
  variant: string;
  users: number;
  conversions: number;
  conversion_rate: number;
  revenue?: number;
  average_order_value?: number;
}

export interface ConfidenceInterval {
  lower_bound: number;
  upper_bound: number;
  confidence_level: number;
}

export interface FlagEvaluationContext {
  userId?: string;
  userRole?: string;
  userSegments?: string[];
  environment?: string;
  timestamp?: number;
  sessionId?: string;
  properties?: Record<string, any>;
}

export interface FlagEvaluationResult {
  flag_key: string;
  enabled: boolean;
  variant?: string;
  reason: string;
  evaluation_time: number;
  context: FlagEvaluationContext;
}

// UI Component Types
export interface FeatureFlagFormData {
  flag_key: string;
  description: string;
  is_active: boolean;
  rollout_percentage: number;
  target_segments: TargetSegments;
  environments: string[];
  start_date: string | null;
  end_date: string | null;
  metadata: Json;
}

export interface ExperimentFormData {
  experiment_key: string;
  description: string;
  variants: ExperimentVariant[];
  traffic_allocation: number;
  success_metrics: string[];
  duration_days: number;
  target_segments: TargetSegments;
}

// Analytics and reporting types
export interface FlagUsageMetrics {
  flag_key: string;
  total_evaluations: number;
  enabled_evaluations: number;
  disabled_evaluations: number;
  unique_users: number;
  average_evaluation_time: number;
  last_evaluation: string;
  error_rate: number;
}

export interface ExperimentMetrics {
  experiment_key: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  start_date: string;
  end_date?: string;
  total_participants: number;
  total_conversions: number;
  overall_conversion_rate: number;
  statistical_power?: number;
  min_sample_size?: number;
  achieved_sample_size: number;
  expected_completion_date?: string;
}

export interface CohortAnalysis {
  cohort_name: string;
  flag_key: string;
  cohort_size: number;
  conversion_rate: number;
  retention_rate: number;
  average_revenue: number;
  compared_to_baseline: number; // percentage difference
}

// Real-time updates types
export interface FlagUpdateEvent {
  type: 'flag_updated' | 'flag_deleted' | 'user_assignment_changed';
  flag_key: string;
  timestamp: string;
  changes: Partial<FeatureFlag>;
  affected_users?: string[];
}

export interface ExperimentUpdateEvent {
  type: 'experiment_started' | 'experiment_ended' | 'conversion_tracked';
  experiment_key: string;
  user_id?: string;
  variant?: string;
  timestamp: string;
  data?: Json;
}

// SDK and integration types
export interface FeatureFlagSDK {
  isEnabled(key: string, context?: FlagEvaluationContext): boolean;
  getVariant(key: string, context?: FlagEvaluationContext): string | null;
  getAllFlags(context?: FlagEvaluationContext): Record<string, boolean>;
  trackEvent(event: string, properties?: Record<string, any>): void;
  onFlagChange(callback: (event: FlagUpdateEvent) => void): () => void;
}

export interface ExperimentSDK {
  getVariant(experimentKey: string, context?: FlagEvaluationContext): string | null;
  trackConversion(experimentKey: string, value?: number, context?: FlagEvaluationContext): void;
  trackEvent(event: string, properties?: Record<string, any>): void;
  getRunningExperiments(): string[];
  getUserExperiments(context?: FlagEvaluationContext): Array<{
    experiment_key: string;
    variant: string;
    enrolled_at: string;
  }>;
}

// Admin interface types
export interface FeatureFlagManagement {
  createFlag(data: FeatureFlagFormData): Promise<FeatureFlag>;
  updateFlag(key: string, data: Partial<FeatureFlagFormData>): Promise<FeatureFlag>;
  deleteFlag(key: string): Promise<void>;
  toggleFlag(key: string, enabled: boolean): Promise<FeatureFlag>;
  rolloutPercentage(key: string, percentage: number): Promise<FeatureFlag>;
  assignUserToFlag(userId: string, flagKey: string, enabled: boolean, variant?: string): Promise<UserFlagAssignment>;
  removeUserFromFlag(userId: string, flagKey: string): Promise<void>;
  getFlagHistory(key: string): Promise<FeatureFlagAuditLog[]>;
}

export interface ExperimentManagement {
  createExperiment(data: ExperimentFormData): Promise<FeatureFlag>;
  startExperiment(experimentKey: string): Promise<void>;
  pauseExperiment(experimentKey: string): Promise<void>;
  stopExperiment(experimentKey: string, winnerVariant?: string): Promise<void>;
  getExperimentResults(experimentKey: string): Promise<ExperimentStats>;
  enrollUserInExperiment(userId: string, experimentKey: string, variant?: string): Promise<ExperimentAssignment>;
  getUserExperiments(userId: string): Promise<ExperimentAssignment[]>;
}

// Error handling types
export interface FeatureFlagError {
  code: string;
  message: string;
  details?: any;
  flag_key?: string;
  timestamp: string;
}

export interface ValidationError extends FeatureFlagError {
  field: string;
  value: any;
  constraint: string;
}

// Configuration types
export interface FeatureFlagConfig {
  api_url: string;
  api_key: string;
  environment: string;
  cache_ttl: number;
  retry_attempts: number;
  timeout: number;
  enable_real_time_updates: boolean;
  debug_mode: boolean;
}

// Export all types for easy importing
export type {
  // Core types
  FeatureFlag,
  UserFlagAssignment,
  FeatureFlagAuditLog,
  ExperimentAssignment,
  ExperimentEvent,

  // Configuration types
  TargetSegments,
  CustomRule,
  ExperimentVariant,
  ExperimentConfig,
  FeatureFlagConfig as FlagConfig,

  // Evaluation types
  FlagEvaluationContext,
  FlagEvaluationResult,

  // UI types
  FeatureFlagFormData,
  ExperimentFormData,

  // Analytics types
  FeatureFlagStats,
  ExperimentStats,
  VariantStats,
  ConfidenceInterval,
  FlagUsageMetrics,
  ExperimentMetrics,
  CohortAnalysis,

  // Real-time types
  FlagUpdateEvent,
  ExperimentUpdateEvent,

  // SDK types
  FeatureFlagSDK,
  ExperimentSDK,

  // Management types
  FeatureFlagManagement,
  ExperimentManagement,

  // Error types
  FeatureFlagError,
  ValidationError,

  // System configuration
  FeatureFlagConfig as SystemConfig,
};