import { Database } from '@/integrations/supabase/types'

export type PricingRule = Database['public']['Tables']['pricing_rules']['Row']
export type PricingRuleInsert = Database['public']['Tables']['pricing_rules']['Insert']
export type PricingRuleUpdate = Database['public']['Tables']['pricing_rules']['Update']
export type PricingCalculation = Database['public']['Tables']['pricing_calculations']['Row']
export type PriceSnapshot = Database['public']['Tables']['price_snapshots']['Row']

export interface PricingRuleConditions {
  // Time-based conditions
  time_range?: {
    time_start: string
    time_end: string
  }
  date_range?: {
    start_date: string
    end_date: string
  }
  days_of_week?: number[] // 0-6, Sunday = 0
  months?: number[] // 1-12

  // Demand-based conditions
  min_demand_level?: number
  max_demand_level?: number
  min_bookings?: number
  max_bookings?: number

  // Group conditions
  min_group_size?: number
  max_group_size?: number

  // Seasonal conditions
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  holiday_period?: boolean

  // Event-based conditions
  event_type?: 'concert' | 'festival' | 'holiday' | 'special_event'
  event_proximity?: number // kilometers

  // Weather conditions (if integrating weather API)
  weather_condition?: 'sunny' | 'rainy' | 'snowy' | 'cloudy'
  temperature_range?: {
    min: number
    max: number
  }

  // Custom conditions
  custom_condition?: string
  condition_value?: any
}

export interface PriceCalculationContext {
  date: string
  group_size?: number
  demand_level?: number
  customer_id?: string
  location_id?: string
  season?: string
  event?: string
  custom_data?: Record<string, any>
}

export interface PriceBreakdown {
  base_price: number
  final_price: number
  total_modifier: number
  applied_rules: Array<{
    id: string
    name: string
    type: string
    modifier_value: number
    modified_price: number
  }>
  calculation_context: PriceCalculationContext
}

export interface PricingAnalytics {
  service_id: string
  service_name: string
  current_price: number
  average_price_7d: number
  average_price_30d: number
  price_trend: 'increasing' | 'decreasing' | 'stable'
  demand_level: number
  occupancy_rate: number
  revenue_impact: number
  suggested_price: number
  recommendation: string
}

export interface PriceOptimizationSuggestion {
  service_id: string
  current_price: number
  suggested_price: number
  potential_change: number
  potential_change_percent: number
  occupancy_rate: number
  target_occupancy: number
  expected_revenue_change: number
  confidence: number // 0-100
  reasoning: string[]
  implementation_date: string
}

export interface PricingSimulationRequest {
  service_id: string
  rules: Array<{
    name: string
    rule_type: PricingRule['rule_type']
    conditions: PricingRuleConditions
    modifier_type: PricingRule['modifier_type']
    modifier_value: number
    priority?: number
  }>
  simulation_period: {
    start_date: string
    end_date: string
  }
  variables: {
    demand_levels: number[]
    group_sizes: number[]
    booking_rates: number[]
  }
}

export interface PricingSimulationResult {
  service_id: string
  simulation_period: {
    start_date: string
    end_date: string
  }
  scenarios: Array<{
    scenario_name: string
    rules: Array<{
      name: string
      modifier_value: number
    }>
    results: {
      average_price: number
      price_range: {
        min: number
        max: number
      }
      expected_revenue: number
      booking_count: number
      occupancy_rate: number
    }
  }>
  recommendations: string[]
}

export interface PricingRuleTemplate {
  name: string
  description: string
  rule_type: PricingRule['rule_type']
  modifier_type: PricingRule['modifier_type']
  default_modifier_value: number
  default_conditions: PricingRuleConditions
  priority: number
  is_recommended: boolean
}

export const PRICING_RULE_TEMPLATES: PricingRuleTemplate[] = [
  {
    name: 'Weekend Premium',
    description: 'Increase prices for weekend appointments',
    rule_type: 'time_based',
    modifier_type: 'percentage',
    default_modifier_value: 15,
    default_conditions: {
      days_of_week: [5, 6] // Friday, Saturday
    },
    priority: 50,
    is_recommended: true
  },
  {
    name: 'Early Bird Discount',
    description: 'Discount for early morning appointments',
    rule_type: 'time_based',
    modifier_type: 'percentage',
    default_modifier_value: -10,
    default_conditions: {
      time_range: {
        time_start: '08:00',
        time_end: '10:00'
      }
    },
    priority: 60,
    is_recommended: true
  },
  {
    name: 'High Demand Surcharge',
    description: 'Increase price when demand is high',
    rule_type: 'demand',
    modifier_type: 'percentage',
    default_modifier_value: 20,
    default_conditions: {
      min_demand_level: 8
    },
    priority: 30,
    is_recommended: true
  },
  {
    name: 'Group Discount',
    description: 'Discount for group bookings',
    rule_type: 'group',
    modifier_type: 'percentage',
    default_modifier_value: -15,
    default_conditions: {
      min_group_size: 3
    },
    priority: 70,
    is_recommended: true
  },
  {
    name: 'Holiday Season Premium',
    description: 'Increase prices during holiday season',
    rule_type: 'seasonal',
    modifier_type: 'percentage',
    default_modifier_value: 25,
    default_conditions: {
      date_range: {
        start_date: '2024-12-15',
        end_date: '2025-01-15'
      }
    },
    priority: 40,
    is_recommended: false
  },
  {
    name: 'Last Minute Deal',
    description: 'Discount for bookings within 24 hours',
    rule_type: 'custom',
    modifier_type: 'percentage',
    default_modifier_value: -20,
    default_conditions: {
      custom_condition: 'booking_within_24h'
    },
    priority: 20,
    is_recommended: false
  }
]

export interface PricingNotification {
  type: 'price_change' | 'rule_activated' | 'rule_expired' | 'optimization_alert'
  service_id: string
  service_name: string
  message: string
  timestamp: string
  metadata: Record<string, any>
}

export interface PricingDashboardStats {
  total_rules: number
  active_rules: number
  total_calculations: number
  average_price_change: number
  revenue_impact: number
  most_profitable_service: string
  least_profitable_service: string
  top_performing_rule: string
  upcoming_rule_changes: number
}