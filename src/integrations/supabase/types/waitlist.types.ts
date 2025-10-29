export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface WaitlistTables {
  waitlist_entries: {
    Row: {
      id: string
      service_id: string
      user_id: string | null
      email: string
      phone: string | null
      name: string | null
      preferred_date: string | null
      preferred_time: string | null
      location_type: string | null
      group_size: number | null
      notes: string | null
      status: 'active' | 'contacted' | 'booked' | 'cancelled' | 'expired'
      contacted_at: string | null
      booked_at: string | null
      expires_at: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      user_id?: string | null
      email: string
      phone?: string | null
      name?: string | null
      preferred_date?: string | null
      preferred_time?: string | null
      location_type?: string | null
      group_size?: number | null
      notes?: string | null
      status?: 'active' | 'contacted' | 'booked' | 'cancelled' | 'expired'
      contacted_at?: string | null
      booked_at?: string | null
      expires_at: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      user_id?: string | null
      email?: string
      phone?: string | null
      name?: string | null
      preferred_date?: string | null
      preferred_time?: string | null
      location_type?: string | null
      group_size?: number | null
      notes?: string | null
      status?: 'active' | 'contacted' | 'booked' | 'cancelled' | 'expired'
      contacted_at?: string | null
      booked_at?: string | null
      expires_at?: string
      updated_at?: string
    }
    Relationships: []
  }
}