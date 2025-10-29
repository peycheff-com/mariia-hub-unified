export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface PricingTables {
  pricing_rules: {
    Row: {
      id: string
      name: string
      rule_type: string
      conditions: Json
      actions: Json
      priority: number
      is_active: boolean
      valid_from: string
      valid_until: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      rule_type: string
      conditions: Json
      actions: Json
      priority?: number
      is_active?: boolean
      valid_from: string
      valid_until?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      rule_type?: string
      conditions?: Json
      actions?: Json
      priority?: number
      is_active?: boolean
      valid_from?: string
      valid_until?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  pricing_calculations: {
    Row: {
      id: string
      service_id: string
      base_price: number
      applied_rules: Json
      final_price: number
      discount_amount: number
      calculation_context: Json
      created_at: string
    }
    Insert: {
      id?: string
      service_id: string
      base_price: number
      applied_rules: Json
      final_price: number
      discount_amount: number
      calculation_context: Json
      created_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      base_price?: number
      applied_rules?: Json
      final_price?: number
      discount_amount?: number
      calculation_context?: Json
    }
    Relationships: []
  }

  price_snapshots: {
    Row: {
      id: string
      service_id: string
      price: number
      currency: string
      valid_from: string
      valid_until: string | null
      created_at: string
    }
    Insert: {
      id?: string
      service_id: string
      price: number
      currency: string
      valid_from: string
      valid_until?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      price?: number
      currency?: string
      valid_from?: string
      valid_until?: string | null
    }
    Relationships: []
  }
}