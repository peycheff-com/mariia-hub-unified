export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ReferralTables {
  referral_programs: {
    Row: {
      id: string
      name: string
      description: string
      referrer_reward: Json
      referred_reward: Json
      conditions: Json
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      description: string
      referrer_reward: Json
      referred_reward: Json
      conditions: Json
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string
      referrer_reward?: Json
      referred_reward?: Json
      conditions?: Json
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  referral_codes: {
    Row: {
      id: string
      code: string
      program_id: string
      referrer_id: string
      max_uses: number | null
      current_uses: number
      expires_at: string | null
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      code: string
      program_id: string
      referrer_id: string
      max_uses?: number | null
      current_uses?: number
      expires_at?: string | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      code?: string
      program_id?: string
      referrer_id?: string
      max_uses?: number | null
      current_uses?: number
      expires_at?: string | null
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  referrals: {
    Row: {
      id: string
      program_id: string
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
      program_id: string
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
      program_id?: string
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

  referral_analytics: {
    Row: {
      id: string
      program_id: string
      date: string
      total_referrals: number
      successful_referrals: number
      pending_referrals: number
      expired_referrals: number
      conversion_rate: number
      total_rewards_given: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      program_id: string
      date: string
      total_referrals?: number
      successful_referrals?: number
      pending_referrals?: number
      expired_referrals?: number
      conversion_rate?: number
      total_rewards_given?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      program_id?: string
      date?: string
      total_referrals?: number
      successful_referrals?: number
      pending_referrals?: number
      expired_referrals?: number
      conversion_rate?: number
      total_rewards_given?: number
      updated_at?: string
    }
    Relationships: []
  }
}