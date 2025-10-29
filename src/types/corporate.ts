// B2B Corporate Wellness Platform Types
// Comprehensive type definitions for corporate wellness management

import { Service, Booking, Profile } from './supabase';

// =============================================
// CORPORATE ACCOUNT TYPES
// =============================================

export interface CorporateAccount {
  id: string;
  company_name: string;
  company_vat_number?: string;
  industry?: string;
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  billing_address: Address;
  shipping_address?: Address;
  contact_info: ContactInfo;
  subscription_plan: 'basic' | 'professional' | 'enterprise';
  subscription_limits: SubscriptionLimits;
  contract_start_date: string;
  contract_end_date: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  account_manager_id?: string;
  account_manager?: Profile;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface ContactInfo {
  primary_contact: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  billing_contact?: {
    name: string;
    email: string;
    phone: string;
  };
  technical_contact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface SubscriptionLimits {
  employees: number;
  budget_per_employee: number;
  programs: number;
  features: string[];
  api_access: boolean;
  custom_reporting: boolean;
  dedicated_support: boolean;
}

// =============================================
// DEPARTMENT TYPES
// =============================================

export interface CorporateDepartment {
  id: string;
  corporate_account_id: string;
  department_name: string;
  department_code?: string;
  manager_id?: string;
  manager?: Profile;
  parent_department_id?: string;
  parent_department?: CorporateDepartment;
  budget_allocation: number;
  employee_target?: number;
  description?: string;
  employees?: CorporateEmployee[];
  created_at: string;
  updated_at: string;
}

// =============================================
// EMPLOYEE TYPES
// =============================================

export interface CorporateEmployee {
  id: string;
  corporate_account_id: string;
  corporate_account?: CorporateAccount;
  department_id?: string;
  department?: CorporateDepartment;
  user_id?: string;
  user?: Profile;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  hire_date?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  location?: string;
  manager_id?: string;
  manager?: CorporateEmployee;
  wellness_budget: number;
  remaining_budget: number;
  benefits_tier: 'basic' | 'standard' | 'premium' | 'executive';
  is_active: boolean;
  preferences: EmployeePreferences;
  consent_data: ConsentData;
  benefit_allocations?: EmployeeBenefitAllocation[];
  bookings?: Booking[];
  program_enrollments?: ProgramEnrollment[];
  created_at: string;
  updated_at: string;
}

export interface EmployeePreferences {
  preferred_services: string[];
  schedule_preferences: {
    preferred_days: string[];
    preferred_times: string[];
    location_preferences: string[];
  };
  health_goals: string[];
  communication_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
}

export interface ConsentData {
  wellness_program: boolean;
  data_processing: boolean;
  health_tracking: boolean;
  marketing_communications: boolean;
  consent_date: string;
  consent_version: string;
  gdpr_compliant: boolean;
}

export interface EmployeeBenefitAllocation {
  id: string;
  employee_id: string;
  allocation_type: 'monthly_credit' | 'annual_allowance' | 'service_package' | 'special_bonus';
  allocated_amount: number;
  used_amount: number;
  remaining_amount: number;
  allocation_date: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'depleted' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// BUDGET MANAGEMENT TYPES
// =============================================

export interface CorporateBudget {
  id: string;
  corporate_account_id: string;
  corporate_account?: CorporateAccount;
  department_id?: string;
  department?: CorporateDepartment;
  budget_period: string; // Format: YYYY-Q1, YYYY-MM, etc.
  total_allocated: number;
  spent_amount: number;
  remaining_amount: number;
  budget_type: 'wellness' | 'training' | 'benefits' | 'events';
  status: 'planned' | 'active' | 'completed' | 'overrun';
  approved_by?: string;
  approved_by_profile?: Profile;
  notes?: string;
  transactions?: BudgetTransaction[];
  created_at: string;
  updated_at: string;
}

export interface BudgetTransaction {
  id: string;
  budget_id: string;
  budget?: CorporateBudget;
  employee_id?: string;
  employee?: CorporateEmployee;
  transaction_type: 'allocation' | 'spend' | 'adjustment' | 'refund';
  amount: number;
  running_balance: number;
  description?: string;
  reference_id?: string;
  category?: string;
  approved_by?: string;
  approved_by_profile?: Profile;
  transaction_date: string;
  created_at: string;
}

// =============================================
// WELLNESS PROGRAM TYPES
// =============================================

export interface CorporateWellnessProgram {
  id: string;
  corporate_account_id: string;
  corporate_account?: CorporateAccount;
  program_name: string;
  program_description: string;
  program_type: 'fitness_challenge' | 'mental_health' | 'nutrition' | 'preventive_care' | 'stress_management';
  duration_weeks?: number;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  current_participants: number;
  budget_per_participant?: number;
  total_budget?: number;
  requirements: ProgramRequirements;
  rewards: ProgramRewards;
  materials: ProgramMaterials;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by?: string;
  created_by_profile?: Profile;
  enrollments?: ProgramEnrollment[];
  created_at: string;
  updated_at: string;
}

export interface ProgramRequirements {
  minimum_participation?: number;
  health_check_required?: boolean;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  equipment_needed?: string[];
  time_commitment?: string; // hours per week
  prerequisites?: string[];
}

export interface ProgramRewards {
  completion_bonus?: number;
  milestones: {
    milestone: string;
    reward: string | number;
    achieved_by: number;
  }[];
  incentives: {
    type: string;
    value: string | number;
    condition: string;
  }[];
}

export interface ProgramMaterials {
  welcome_kit?: string;
  guides: string[];
  videos: string[];
  resources: string[];
  schedules: string[];
  tracking_tools: string[];
}

export interface ProgramEnrollment {
  id: string;
  program_id: string;
  program?: CorporateWellnessProgram;
  employee_id: string;
  employee?: CorporateEmployee;
  enrollment_date: string;
  completion_date?: string;
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended';
  progress_data: ProgramProgress;
  feedback?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramProgress {
  progress_percentage: number;
  milestones: {
    milestone: string;
    completed: boolean;
    completed_date?: string;
  }[];
  achievements: {
    achievement: string;
    date: string;
    value?: string | number;
  }[];
  health_metrics?: {
    [key: string]: number;
  };
  engagement_score?: number;
}

// =============================================
// PARTNER INTEGRATION TYPES
// =============================================

export interface B2BPartner {
  id: string;
  partner_name: string;
  partner_type: 'hotel' | 'spa' | 'insurance' | 'healthcare' | 'fitness' | 'nutrition';
  contact_info: ContactInfo;
  billing_address: Address;
  service_areas: ServiceArea[];
  integration_status: 'prospect' | 'active' | 'suspended' | 'terminated';
  contract_details: ContractDetails;
  commission_rate: number;
  api_credentials: ApiCredentials;
  supported_services: PartnerService[];
  pricing_structure: PricingStructure;
  status: 'active' | 'inactive' | 'pending';
  service_mappings?: PartnerServiceMapping[];
  integration_logs?: PartnerIntegrationLog[];
  created_at: string;
  updated_at: string;
}

export interface ServiceArea {
  city: string;
  country: string;
  radius_km?: number;
  postal_codes: string[];
}

export interface ContractDetails {
  contract_id: string;
  start_date: string;
  end_date?: string;
  terms: string;
  cancellation_notice_days: number;
  exclusivity: boolean;
  territories: string[];
  renewal_terms: string;
}

export interface ApiCredentials {
  api_key: string;
  api_secret?: string;
  webhook_url?: string;
  environment: 'sandbox' | 'production';
  rate_limit?: number;
  endpoints: {
    bookings: string;
    availability: string;
    pricing: string;
    cancellation: string;
  };
}

export interface PartnerService {
  service_id: string;
  service_name: string;
  category: string;
  duration_minutes: number;
  corporate_rate: number;
  standard_rate: number;
  availability: {
    days: string[];
    hours: string;
  };
}

export interface PricingStructure {
  corporate_discount: number; // percentage
  volume_discounts: {
    min_bookings: number;
    discount_percentage: number;
  }[];
  seasonal_pricing: {
    season: string;
    rate_adjustment: number;
  }[];
  payment_terms: string;
}

export interface PartnerServiceMapping {
  id: string;
  partner_id: string;
  partner?: B2BPartner;
  internal_service_id?: string;
  internal_service?: Service;
  external_service_id: string;
  service_name: string;
  corporate_rate: number;
  standard_rate: number;
  commission_amount: number;
  availability: AvailabilityMapping;
  booking_requirements: BookingRequirements;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AvailabilityMapping {
  priority_access: boolean;
  advance_booking_days: number;
  time_slots: {
    start: string;
    end: string;
    days: string[];
  }[];
  blocked_dates?: string[];
}

export interface BookingRequirements {
  minimum_notice_hours: number;
  cancellation_policy: string;
  special_instructions?: string;
  required_information: string[];
  approval_required: boolean;
}

export interface PartnerIntegrationLog {
  id: string;
  partner_id: string;
  partner?: B2BPartner;
  integration_type: string;
  direction: 'outbound' | 'inbound';
  endpoint: string;
  request_payload: any;
  response_payload?: any;
  status_code?: number;
  status: 'success' | 'error' | 'pending';
  error_message?: string;
  retry_count: number;
  processed_at?: string;
  created_at: string;
}

// =============================================
// ANALYTICS TYPES
// =============================================

export interface CorporateAnalytics {
  id: string;
  corporate_account_id: string;
  corporate_account?: CorporateAccount;
  department_id?: string;
  department?: CorporateDepartment;
  analytics_date: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  // Employee metrics
  total_employees: number;
  active_employees: number;
  new_employees: number;

  // Budget metrics
  total_budget: number;
  used_budget: number;
  remaining_budget: number;
  budget_utilization_rate: number;

  // Booking metrics
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_rate: number;

  // Service metrics
  popular_services: ServiceUsage[];
  service_category_breakdown: CategoryBreakdown[];

  // Wellness program metrics
  program_participations: number;
  program_completions: number;
  completion_rate: number;

  // Health metrics (anonymized)
  wellness_score: number;
  engagement_score: number;

  // Satisfaction metrics
  average_rating: number;
  feedback_count: number;

  created_at: string;
}

export interface ServiceUsage {
  service_id: string;
  service_name: string;
  booking_count: number;
  revenue: number;
  average_rating: number;
}

export interface CategoryBreakdown {
  category: string;
  booking_count: number;
  revenue: number;
  percentage: number;
}

// =============================================
// DASHBOARD VIEW TYPES
// =============================================

export interface CorporateDashboard {
  corporate_id: string;
  company_name: string;
  subscription_plan: string;
  total_employees: number;
  active_employees: number;
  total_budget: number;
  used_budget: number;
  budget_utilization_percentage: number;
  program_participants: number;
  active_programs: number;
  monthly_trends: {
    month: string;
    bookings: number;
    spending: number;
    satisfaction: number;
  }[];
  top_services: ServiceUsage[];
  department_performance: DepartmentPerformance[];
  upcoming_programs: CorporateWellnessProgram[];
  budget_alerts: BudgetAlert[];
}

export interface DepartmentPerformance {
  department_id: string;
  department_name: string;
  budget_allocation: number;
  employee_count: number;
  total_remaining_budget: number;
  program_enrollments: number;
  average_satisfaction: number;
  utilization_rate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetAlert {
  type: 'overspend' | 'underspend' | 'expiry' | 'allocation_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  department_id?: string;
  budget_id?: string;
  action_required: boolean;
  created_at: string;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface CreateCorporateAccountRequest {
  company_name: string;
  company_vat_number?: string;
  industry?: string;
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  billing_address: Address;
  contact_info: ContactInfo;
  subscription_plan: 'basic' | 'professional' | 'enterprise';
  contract_start_date: string;
  contract_end_date: string;
}

export interface UpdateCorporateAccountRequest {
  company_name?: string;
  billing_address?: Address;
  contact_info?: ContactInfo;
  subscription_plan?: string;
  status?: string;
}

export interface CreateDepartmentRequest {
  corporate_account_id: string;
  department_name: string;
  department_code?: string;
  manager_id?: string;
  parent_department_id?: string;
  budget_allocation?: number;
  employee_target?: number;
  description?: string;
}

export interface CreateEmployeeRequest {
  corporate_account_id: string;
  department_id?: string;
  user_id?: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  hire_date?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  location?: string;
  manager_id?: string;
  wellness_budget?: number;
  benefits_tier: 'basic' | 'standard' | 'premium' | 'executive';
  preferences?: Partial<EmployeePreferences>;
}

export interface CreateWellnessProgramRequest {
  corporate_account_id: string;
  program_name: string;
  program_description: string;
  program_type: 'fitness_challenge' | 'mental_health' | 'nutrition' | 'preventive_care' | 'stress_management';
  duration_weeks?: number;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  budget_per_participant?: number;
  total_budget?: number;
  requirements?: Partial<ProgramRequirements>;
  rewards?: Partial<ProgramRewards>;
  materials?: Partial<ProgramMaterials>;
}

export interface CreatePartnerRequest {
  partner_name: string;
  partner_type: 'hotel' | 'spa' | 'insurance' | 'healthcare' | 'fitness' | 'nutrition';
  contact_info: ContactInfo;
  billing_address: Address;
  service_areas: ServiceArea[];
  contract_details: ContractDetails;
  commission_rate: number;
  supported_services: PartnerService[];
  pricing_structure: PricingStructure;
}

export interface CorporateAnalyticsFilters {
  corporate_account_id: string;
  department_id?: string;
  date_from: string;
  date_to: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  metrics?: string[];
  departments?: string[];
  programs?: string[];
}

// =============================================
// NOTIFICATION TYPES
// =============================================

export interface CorporateNotification {
  id: string;
  type: 'budget_alert' | 'program_update' | 'enrollment_confirmation' | 'wellness_tip' | 'deadline_reminder';
  recipient_type: 'admin' | 'manager' | 'employee';
  recipient_id: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  scheduled_at?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

// =============================================
// EXPORT TYPES
// =============================================

export interface CorporateExportData {
  format: 'csv' | 'xlsx' | 'pdf';
  data_type: 'employees' | 'budget_report' | 'program_analytics' | 'bookings' | 'satisfaction_survey';
  filters: any;
  date_range: {
    start: string;
    end: string;
  };
  include_charts: boolean;
  include_raw_data: boolean;
}

export interface BulkEmployeeUpload {
  employees: CreateEmployeeRequest[];
  department_mappings: Record<string, string>;
  send_invitations: boolean;
  set_passwords: boolean;
  default_benefits_tier: 'basic' | 'standard' | 'premium' | 'executive';
}