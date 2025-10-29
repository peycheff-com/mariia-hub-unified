export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface LoyaltyTables {
  loyalty_programs: {
    Row: {
      id: string
      name: string
      points_per_currency: number
      tiers: Json
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      points_per_currency?: number
      tiers?: Json
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      points_per_currency?: number
      tiers?: Json
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  customer_loyalty: {
    Row: {
      id: string
      customer_id: string
      program_id: string
      current_points: number
      tier: string
      tier_expires_at: string | null
      total_earned: number
      total_redeemed: number
      last_activity: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      customer_id: string
      program_id: string
      current_points?: number
      tier?: string
      tier_expires_at?: string | null
      total_earned?: number
      total_redeemed?: number
      last_activity?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      program_id?: string
      current_points?: number
      tier?: string
      tier_expires_at?: string | null
      total_earned?: number
      total_redeemed?: number
      last_activity?: string
      updated_at?: string
    }
    Relationships: []
  }

  point_transactions: {
    Row: {
      id: string
      customer_id: string
      program_id: string
      points: number
      transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
      reference_id: string | null
      reference_type: string | null
      description: string | null
      metadata: Json
      expires_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      customer_id: string
      program_id: string
      points: number
      transaction_type?: 'earned' | 'redeemed' | 'expired' | 'adjusted'
      reference_id?: string | null
      reference_type?: string | null
      description?: string | null
      metadata?: Json
      expires_at?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      program_id?: string
      points?: number
      transaction_type?: 'earned' | 'redeemed' | 'expired' | 'adjusted'
      reference_id?: string | null
      reference_type?: string | null
      description?: string | null
      metadata?: Json
      expires_at?: string | null
    }
    Relationships: []
  }

  loyalty_tiers: {
    Row: {
      id: string
      program_id: string
      name: string
      level: number
      min_points: number
      benefits: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      program_id: string
      name: string
      level: number
      min_points: number
      benefits?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      program_id?: string
      name?: string
      level?: number
      min_points?: number
      benefits?: Json
      updated_at?: string
    }
    Relationships: []
  }

  achievement_badges: {
    Row: {
      id: string
      name: string
      description: string
      icon_url: string
      criteria: Json
      points_value: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      description: string
      icon_url: string
      criteria: Json
      points_value?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string
      icon_url?: string
      criteria?: Json
      points_value?: number
      updated_at?: string
    }
    Relationships: []
  }

  customer_achievements: {
    Row: {
      id: string
      customer_id: string
      badge_id: string
      earned_at: string
      expires_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      customer_id: string
      badge_id: string
      earned_at?: string
      expires_at?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      badge_id?: string
      earned_at?: string
      expires_at?: string | null
    }
    Relationships: []
  }

  referrals: {
    Row: {
      id: string
      referrer_id: string
      referred_id: string | null
      referral_code: string
      status: 'pending' | 'completed' | 'expired'
      reward_points: number
      completed_at: string | null
      expires_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      referrer_id: string
      referred_id?: string | null
      referral_code: string
      status?: 'pending' | 'completed' | 'expired'
      reward_points?: number
      completed_at?: string | null
      expires_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      referrer_id?: string
      referred_id?: string | null
      referral_code?: string
      status?: 'pending' | 'completed' | 'expired'
      reward_points?: number
      completed_at?: string | null
      expires_at?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  rewards_catalog: {
    Row: {
      id: string
      program_id: string
      name: string
      description: string
      points_cost: number
      reward_type: string
      reward_data: Json
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      program_id: string
      name: string
      description: string
      points_cost: number
      reward_type: string
      reward_data: Json
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      program_id?: string
      name?: string
      description?: string
      points_cost?: number
      reward_type?: string
      reward_data?: Json
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  customer_rewards: {
    Row: {
      id: string
      customer_id: string
      reward_id: string
      points_spent: number
      status: 'claimed' | 'used' | 'expired'
      claimed_at: string
      used_at: string | null
      expires_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      customer_id: string
      reward_id: string
      points_spent: number
      status?: 'claimed' | 'used' | 'expired'
      claimed_at?: string
      used_at?: string | null
      expires_at?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      reward_id?: string
      points_spent?: number
      status?: 'claimed' | 'used' | 'expired'
      claimed_at?: string
      used_at?: string | null
      expires_at?: string | null
    }
    Relationships: []
  }

  customer_streaks: {
    Row: {
      id: string
      customer_id: string
      program_id: string
      streak_type: string
      current_streak: number
      longest_streak: number
      last_activity: string
      streak_history: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      customer_id: string
      program_id: string
      streak_type: string
      current_streak?: number
      longest_streak?: number
      last_activity?: string
      streak_history?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      program_id?: string
      streak_type?: string
      current_streak?: number
      longest_streak?: number
      last_activity?: string
      streak_history?: Json
      updated_at?: string
    }
    Relationships: []
  }

  loyalty_events: {
    Row: {
      id: string
      program_id: string
      customer_id: string
      event_type: string
      event_data: Json
      points_earned: number
      created_at: string
    }
    Insert: {
      id?: string
      program_id: string
      customer_id: string
      event_type: string
      event_data: Json
      points_earned?: number
      created_at?: string
    }
    Update: {
      id?: string
      program_id?: string
      customer_id?: string
      event_type?: string
      event_data?: Json
      points_earned?: number
    }
    Relationships: []
  }
}