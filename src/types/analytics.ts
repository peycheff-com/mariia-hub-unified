// Comprehensive Business Intelligence and Analytics Types
// For luxury beauty/fitness platform business intelligence system

export interface DailyBusinessMetrics {
  id: string;
  date: string;
  total_revenue: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  new_customers: number;
  returning_customers: number;
  average_booking_value: number;
  peak_hour: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryPerformance {
  id: string;
  date: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  category: string;
  total_bookings: number;
  completed_bookings: number;
  revenue: number;
  costs: number;
  profit_margin: number;
  average_rating: number;
  average_duration_minutes: number;
  created_at: string;
}

export interface CustomerLifetimeValue {
  id: string;
  customer_id: string;
  acquisition_date: string;
  total_spend: number;
  total_bookings: number;
  average_booking_value: number;
  last_booking_date: string | null;
  booking_frequency_days: number | null;
  predicted_next_booking: string | null;
  churn_risk_score: number; // 0-1 scale
  loyalty_score: number; // 0-1 scale
  preferred_service_type: 'beauty' | 'fitness' | 'lifestyle' | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueTracking {
  id: string;
  date: string;
  service_id: string;
  booking_id: string;
  revenue_type: 'service_fee' | 'deposit' | 'cancellation_fee' | 'product_sale';
  amount: number;
  currency: string;
  cost_center: string | null;
  profit_center: string | null;
  created_at: string;
}

export interface ExpenseTracking {
  id: string;
  date: string;
  expense_category: 'rent' | 'salaries' | 'products' | 'marketing' | 'utilities' | 'software';
  expense_type: string;
  amount: number;
  currency: string;
  description: string | null;
  vendor: string | null;
  receipt_url: string | null;
  allocated_to_service_type: 'beauty' | 'fitness' | 'lifestyle' | null;
  is_recurring: boolean;
  recurrence_pattern: 'monthly' | 'quarterly' | 'annually' | null;
  created_at: string;
}

export interface CashFlowTracking {
  id: string;
  date: string;
  opening_balance: number;
  cash_inflows: number;
  cash_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface ServiceCosts {
  id: string;
  service_id: string;
  cost_type: 'labor' | 'materials' | 'overhead' | 'marketing';
  cost_basis: 'per_booking' | 'per_hour' | 'fixed_monthly';
  amount: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceAnalytics {
  id: string;
  service_id: string;
  date: string;
  views: number;
  booking_conversion_rate: number;
  search_impressions: number;
  click_through_rate: number;
  average_booking_lead_time_days: number;
  seasonality_factor: number;
  competitor_price_index: number;
  demand_score: number; // 0-10 scale
  profitability_score: number; // 0-10 scale
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  employee_id: string;
  role: 'beautician' | 'trainer' | 'therapist' | 'consultant';
  specialization: string | null;
  hourly_rate: number;
  commission_rate: number; // 0-100 scale
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  hire_date: string;
  termination_date: string | null;
  is_active: boolean;
  skills: string[];
  certifications: Record<string, any>;
  max_daily_bookings: number;
  preferred_working_hours: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StaffPerformance {
  id: string;
  staff_id: string;
  date: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_bookings: number;
  total_revenue_generated: number;
  total_earnings: number;
  average_rating: number;
  total_working_hours: number;
  utilization_rate: number;
  punctuality_score: number;
  customer_satisfaction_score: number;
  upsell_revenue: number;
  created_at: string;
}

export interface ProductInventory {
  id: string;
  product_name: string;
  product_code: string;
  category: string;
  supplier: string | null;
  unit_cost: number;
  selling_price: number | null;
  current_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number | null;
  reorder_point: number;
  unit_of_measure: string;
  shelf_life_months: number | null;
  storage_location: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'waste' | 'return';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_type: 'booking' | 'purchase_order' | 'adjustment' | null;
  reference_id: string | null;
  performed_by: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
}

export interface ResourceUtilization {
  id: string;
  date: string;
  resource_type: 'room' | 'equipment' | 'station';
  resource_id: string;
  total_available_hours: number;
  booked_hours: number;
  maintenance_hours: number;
  utilization_rate: number;
  revenue_per_hour: number;
  created_at: string;
}

export interface Competitor {
  id: string;
  name: string;
  business_type: 'beauty_salon' | 'fitness_studio' | 'spa';
  location_address: string | null;
  website: string | null;
  phone: string | null;
  price_tier: 'budget' | 'mid_range' | 'premium' | 'luxury';
  specialties: string[];
  market_position: string | null;
  estimated_monthly_revenue: number | null;
  strengths: string[];
  weaknesses: string[];
  threat_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface CompetitorPricing {
  id: string;
  competitor_id: string;
  service_name: string;
  service_category: string | null;
  price: number;
  currency: string;
  duration_minutes: number | null;
  collected_date: string;
  source: 'website' | 'mystery_shopper' | 'social_media' | 'customer_report';
  confidence_score: number; // 0-1 scale
  created_at: string;
}

export interface MarketTrend {
  id: string;
  date: string;
  trend_category: 'beauty' | 'fitness' | 'wellness' | 'technology';
  trend_name: string;
  trend_type: 'emerging' | 'growing' | 'declining' | 'stable';
  market_impact: number; // -10 to 10 scale
  adoption_rate: number; // 0-100 percentage
  time_to_maturity_months: number | null;
  relevance_score: number; // 0-10 scale
  actionable_insights: string | null;
  created_at: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  report_type: 'financial' | 'operational' | 'marketing' | 'performance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  parameters: Record<string, any>;
  recipients: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedReport {
  id: string;
  template_id: string;
  title: string;
  report_data: Record<string, any>;
  format: 'json' | 'pdf' | 'excel' | 'csv';
  file_url: string | null;
  report_period_start: string | null;
  report_period_end: string | null;
  generated_by: string | null;
  status: 'generating' | 'generated' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
}

export interface AlertConfiguration {
  id: string;
  name: string;
  description: string | null;
  metric_name: string;
  condition_operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  threshold_value: number;
  severity: 'info' | 'warning' | 'critical';
  notification_channels: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TriggeredAlert {
  id: string;
  configuration_id: string;
  metric_value: number;
  threshold_value: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
}

export interface BusinessScenario {
  id: string;
  name: string;
  description: string | null;
  scenario_type: 'expansion' | 'pricing' | 'marketing' | 'investment';
  baseline_metrics: Record<string, any>;
  assumed_changes: Record<string, any>;
  projected_outcomes: Record<string, any>;
  confidence_level: number; // 0-1 scale
  time_horizon_months: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioAnalysis {
  id: string;
  scenario_id: string;
  analysis_type: 'roi' | 'break_even' | 'sensitivity' | 'risk';
  time_period: string;
  projected_revenue: number | null;
  projected_costs: number | null;
  projected_profit: number | null;
  key_assumptions: Record<string, any>;
  risk_factors: Record<string, any>;
  confidence_interval: {
    min: number;
    max: number;
    probability: number;
  } | null;
  created_at: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description: string | null;
  category: 'financial' | 'operational' | 'customer' | 'growth';
  calculation_formula: string;
  unit_of_measure: string | null;
  target_value: number | null;
  minimum_acceptable_value: number | null;
  reporting_frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPIValue {
  id: string;
  kpi_id: string;
  date: string;
  actual_value: number;
  target_value: number | null;
  variance_percentage: number;
  performance_rating: 'excellent' | 'good' | 'average' | 'poor' | 'critical' | null;
  notes: string | null;
  created_at: string;
}

// Dashboard and analytics specific types
export interface ExecutiveDashboardData {
  revenueMetrics: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    growthRate: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  };
  bookingMetrics: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    completionRate: number;
    cancellationRate: number;
  };
  customerMetrics: {
    newCustomers: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      thisYear: number;
    };
    returningCustomers: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      thisYear: number;
    };
    averageLifetimeValue: number;
    retentionRate: number;
  };
  servicePerformance: {
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      bookings: number;
      profitMargin: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      serviceType: string;
      revenue: number;
      bookings: number;
      growthRate: number;
    }>;
  };
  financialHealth: {
    profitMargin: number;
    operatingExpenses: number;
    cashFlow: number;
    burnRate: number;
    runway: number; // months
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface FinancialDashboardData {
  revenueStreams: Array<{
    type: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    budget: number;
    variance: number;
  }>;
  profitMetrics: {
    grossProfit: number;
    grossMargin: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
  };
  cashFlowAnalysis: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    cashPosition: number;
  };
  financialRatios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquityRatio: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
}

export interface ServiceProfitabilityData {
  services: Array<{
    id: string;
    name: string;
    category: string;
    serviceType: string;
    price: number;
    estimatedCosts: number;
    estimatedProfit: number;
    profitMargin: number;
    totalBookings: number;
    revenue: number;
    demandScore: number;
    profitabilityScore: number;
  }>;
  categorySummary: Array<{
    category: string;
    serviceType: string;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMargin: number;
    bookingCount: number;
  }>;
  trends: Array<{
    date: string;
    serviceId: string;
    profitMargin: number;
    revenue: number;
    bookings: number;
  }>;
}

export interface StaffPerformanceData {
  staff: Array<{
    id: string;
    name: string;
    role: string;
    specialization: string;
    averageRating: number;
    totalBookings: number;
    totalRevenue: number;
    utilizationRate: number;
    customerSatisfaction: number;
    earnings: number;
  }>;
  teamMetrics: {
    averageRating: number;
    totalUtilization: number;
    totalRevenue: number;
    averageBookingValue: number;
    customerSatisfaction: number;
  };
  performanceTrends: Array<{
    date: string;
    staffId: string;
    utilizationRate: number;
    customerSatisfaction: number;
    revenue: number;
  }>;
}

export interface MarketIntelligenceData {
  marketOverview: {
    totalMarketSize: number;
    marketGrowthRate: number;
    competitorCount: number;
    averagePricing: number;
  };
  competitorAnalysis: Array<{
    id: string;
    name: string;
    threatLevel: string;
    marketShare: number;
    averagePricing: number;
    specialties: string[];
    strengths: string[];
    weaknesses: string[];
  }>;
  pricingIntelligence: Array<{
    serviceName: string;
    ourPrice: number;
    competitorAverage: number;
    pricePosition: 'premium' | 'competitive' | 'budget';
    marketDemand: number;
  }>;
  trends: Array<{
    category: string;
    trendName: string;
    type: string;
    impact: number;
    adoptionRate: number;
    relevanceScore: number;
    actionableInsights: string;
  }>;
}

// Chart and visualization types
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  period: string;
  value: number;
  target?: number;
  variance?: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'kpi' | 'alert';
  title: string;
  data: any;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Filter and query types
export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  serviceTypes?: string[];
  categories?: string[];
  staffIds?: string[];
  customerSegments?: string[];
  revenueTypes?: string[];
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters: AnalyticsFilters;
  timeGranularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  orderBy?: string;
  limit?: number;
}

// Response types for API endpoints
export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    totalRows?: number;
    executionTime?: number;
    cacheHit?: boolean;
  };
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Export types for business intelligence exports
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeHeaders: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  selectedMetrics: string[];
  filters?: Record<string, any>;
}

export interface ScheduledExport {
  id: string;
  name: string;
  config: ExportConfig;
  frequency: string;
  recipients: string[];
  isActive: boolean;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}