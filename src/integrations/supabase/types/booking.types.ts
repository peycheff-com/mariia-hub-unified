export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface BookingTables {
  bookings: {
    Row: {
      admin_notes: string | null
      amount_paid: number | null
      balance_due: number | null
      booking_date: string
      booking_source: string | null
      booking_type: string | null
      client_email: string | null
      client_name: string | null
      client_notes: string | null
      client_phone: string | null
      created_at: string
      currency: string | null
      deposit_paid: number | null
      duration_minutes: number | null
      external_calendar_event_id: string | null
      group_booking_id: string | null
      group_participant_count: number | null
      id: string
      is_group_booking: boolean | null
      is_package: boolean | null
      language_preference: string | null
      location_id: string | null
      location_type: string | null
      mirror_notes: string | null
      mirror_status: string | null
      mirrored_at: string | null
      mirrored_by: string | null
      notes: string | null
      on_site_address: string | null
      original_price: number | null
      payment_method: string | null
      payment_status: string
      policy_accepted_at: string | null
      price_id: string | null
      reschedule_count: number | null
      last_rescheduled_at: string | null
      resource_id: string | null
      selected_add_ons: Json | null
      service_id: string
      sessions_remaining: number | null
      status: Database["public"]["Enums"]["booking_status"]
      stripe_checkout_session_id: string | null
      stripe_payment_intent_id: string | null
      travel_time_minutes: number | null
      updated_at: string
      user_id: string
      waitlist_entry_id: string | null
      discount_amount: number | null
      applied_pricing_rules: Json | null
    }
    Insert: {
      id?: string
      admin_notes?: string | null
      amount_paid?: number | null
      balance_due?: number | null
      booking_date: string
      booking_source?: string | null
      booking_type?: string | null
      client_email?: string | null
      client_name?: string | null
      client_notes?: string | null
      client_phone?: string | null
      created_at?: string
      currency?: string | null
      deposit_paid?: number | null
      duration_minutes?: number | null
      external_calendar_event_id?: string | null
      group_booking_id?: string | null
      group_participant_count?: number | null
      is_group_booking?: boolean | null
      is_package?: boolean | null
      language_preference?: string | null
      location_id?: string | null
      location_type?: string | null
      mirror_notes?: string | null
      mirror_status?: string | null
      mirrored_at?: string | null
      mirrored_by?: string | null
      notes?: string | null
      on_site_address?: string | null
      original_price?: number | null
      payment_method?: string | null
      payment_status?: string
      policy_accepted_at?: string | null
      price_id?: string | null
      reschedule_count?: number | null
      last_rescheduled_at?: string | null
      resource_id?: string | null
      selected_add_ons?: Json | null
      service_id: string
      sessions_remaining?: number | null
      status?: Database["public"]["Enums"]["booking_status"]
      stripe_checkout_session_id?: string | null
      stripe_payment_intent_id?: string | null
      travel_time_minutes?: number | null
      updated_at?: string
      user_id: string
      waitlist_entry_id?: string | null
      discount_amount?: number | null
      applied_pricing_rules?: Json | null
    }
    Update: {
      id?: string
      admin_notes?: string | null
      amount_paid?: number | null
      balance_due?: number | null
      booking_date?: string
      booking_source?: string | null
      booking_type?: string | null
      client_email?: string | null
      client_name?: string | null
      client_notes?: string | null
      client_phone?: string | null
      created_at?: string
      currency?: string | null
      deposit_paid?: number | null
      duration_minutes?: number | null
      external_calendar_event_id?: string | null
      group_booking_id?: string | null
      group_participant_count?: number | null
      is_group_booking?: boolean | null
      is_package?: boolean | null
      language_preference?: string | null
      location_id?: string | null
      location_type?: string | null
      mirror_notes?: string | null
      mirror_status?: string | null
      mirrored_at?: string | null
      mirrored_by?: string | null
      notes?: string | null
      on_site_address?: string | null
      original_price?: number | null
      payment_method?: string | null
      payment_status?: string
      policy_accepted_at?: string | null
      price_id?: string | null
      reschedule_count?: number | null
      last_rescheduled_at?: string | null
      resource_id?: string | null
      selected_add_ons?: Json | null
      service_id?: string
      sessions_remaining?: number | null
      status?: Database["public"]["Enums"]["booking_status"]
      stripe_checkout_session_id?: string | null
      stripe_payment_intent_id?: string | null
      travel_time_minutes?: number | null
      updated_at?: string
      user_id?: string
      waitlist_entry_id?: string | null
      discount_amount?: number | null
      applied_pricing_rules?: Json | null
    }
    Relationships: []
  }

  booking_drafts: {
    Row: {
      booking_date: string | null
      booking_time: string | null
      created_at: string | null
      id: string
      notes: string | null
      service_id: string | null
      service_type: string | null
      session_id: string
      step_completed: number | null
      updated_at: string | null
      user_id: string | null
    }
    Insert: {
      booking_date?: string | null
      booking_time?: string | null
      created_at?: string | null
      id?: string
      notes?: string | null
      service_id?: string | null
      service_type?: string | null
      session_id: string
      step_completed?: number | null
      updated_at?: string | null
      user_id?: string | null
    }
    Update: {
      booking_date?: string | null
      booking_time?: string | null
      created_at?: string | null
      id?: string
      notes?: string | null
      service_id?: string | null
      service_type?: string | null
      session_id?: string
      step_completed?: number | null
      updated_at?: string | null
      user_id?: string | null
    }
    Relationships: []
  }

  holds: {
    Row: {
      created_at: string | null
      end_time: string
      expires_at: string
      id: string
      resource_id: string | null
      service_id: string | null
      session_id: string
      start_time: string
      user_id: string | null
      version: number
    }
    Insert: {
      created_at?: string | null
      end_time: string
      expires_at: string
      id?: string
      resource_id?: string | null
      service_id?: string | null
      session_id: string
      start_time: string
      user_id?: string | null
      version?: number
    }
    Update: {
      created_at?: string | null
      end_time?: string
      expires_at?: string
      id?: string
      resource_id?: string | null
      service_id?: string | null
      session_id?: string
      start_time?: string
      user_id?: string | null
      version?: number
    }
    Relationships: []
  }

  availability_slots: {
    Row: {
      created_at: string
      day_of_week: number
      end_time: string
      id: string
      is_active: boolean
      location_type: string
      max_parallel: number
      resource_id: string | null
      service_id: string | null
      start_time: string
      updated_at: string
    }
    Insert: {
      created_at?: string
      day_of_week: number
      end_time: string
      id?: string
      is_active?: boolean
      location_type: string
      max_parallel?: number
      resource_id?: string | null
      service_id?: string | null
      start_time: string
      updated_at?: string
    }
    Update: {
      created_at?: string
      day_of_week?: number
      end_time?: string
      id?: string
      is_active?: boolean
      location_type?: string
      max_parallel?: number
      resource_id?: string | null
      service_id?: string | null
      start_time?: string
      updated_at?: string
    }
    Relationships: []
  }

  calendar_blocks: {
    Row: {
      created_at: string
      end_datetime: string
      id: string
      is_recurring: boolean
      location_type: string
      reason: string
      resource_id: string | null
      service_id: string | null
      start_datetime: string
      updated_at: string
    }
    Insert: {
      created_at?: string
      end_datetime: string
      id?: string
      is_recurring?: boolean
      location_type: string
      reason: string
      resource_id?: string | null
      service_id?: string | null
      start_datetime: string
      updated_at?: string
    }
    Update: {
      created_at?: string
      end_datetime?: string
      id?: string
      is_recurring?: boolean
      location_type?: string
      reason?: string
      resource_id?: string | null
      service_id?: string | null
      start_datetime?: string
      updated_at?: string
    }
    Relationships: []
  }

  buffers: {
    Row: {
      buffer_after: number
      buffer_before: number
      created_at: string
      id: string
      location_type: string
      resource_id: string | null
      service_id: string | null
      updated_at: string
    }
    Insert: {
      buffer_after?: number
      buffer_before?: number
      created_at?: string
      id?: string
      location_type: string
      resource_id?: string | null
      service_id?: string | null
      updated_at?: string
    }
    Update: {
      buffer_after?: number
      buffer_before?: number
      created_at?: string
      id?: string
      location_type?: string
      resource_id?: string | null
      service_id?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  external_sync: {
    Row: {
      created_at: string
      external_id: string
      external_system: string
      id: string
      last_sync_at: string
      sync_data: Json
      sync_status: string
      table_name: string
      updated_at: string
    }
    Insert: {
      created_at?: string
      external_id: string
      external_system: string
      id?: string
      last_sync_at?: string
      sync_data?: Json
      sync_status?: string
      table_name: string
      updated_at?: string
    }
    Update: {
      created_at?: string
      external_id?: string
      external_system?: string
      id?: string
      last_sync_at?: string
      sync_data?: Json
      sync_status?: string
      table_name?: string
      updated_at?: string
    }
    Relationships: []
  }

  resources: {
    Row: {
      created_at: string | null
      id: string
      is_active: boolean | null
      max_parallel: number
      name: string
      skills: string[]
      updated_at: string | null
    }
    Insert: {
      created_at?: string | null
      id?: string
      is_active?: boolean | null
      max_parallel?: number
      name: string
      skills?: string[]
      updated_at?: string | null
    }
    Update: {
      created_at?: string | null
      id?: string
      is_active?: boolean | null
      max_parallel?: number
      name?: string
      skills?: string[]
      updated_at?: string | null
    }
    Relationships: []
  }

  booking_packages: {
    Row: {
      id: string
      booking_id: string
      package_id: string
      sessions_total: number
      sessions_used: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      booking_id: string
      package_id: string
      sessions_total: number
      sessions_used?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      booking_id?: string
      package_id?: string
      sessions_total?: number
      sessions_used?: number
      updated_at?: string
    }
    Relationships: []
  }

  group_bookings: {
    Row: {
      id: string
      group_name: string | null
      group_size: number
      primary_contact_name: string
      primary_contact_email: string
      primary_contact_phone: string
      service_id: string
      booking_date: string
      booking_time: string
      location_type: string
      base_price_per_person: number
      discount_percentage: number
      total_price: number
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      participants: Json
      creator_user_id: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      group_name?: string | null
      group_size: number
      primary_contact_name: string
      primary_contact_email: string
      primary_contact_phone: string
      service_id: string
      booking_date: string
      booking_time: string
      location_type: string
      base_price_per_person: number
      discount_percentage?: number
      total_price: number
      status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      participants: Json
      creator_user_id?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      group_name?: string | null
      group_size?: number
      primary_contact_name?: string
      primary_contact_email?: string
      primary_contact_phone?: string
      service_id?: string
      booking_date?: string
      booking_time?: string
      location_type?: string
      base_price_per_person?: number
      discount_percentage?: number
      total_price?: number
      status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      participants?: Json
      creator_user_id?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  booking_changes: {
    Row: {
      id: string
      booking_id: string
      change_type: string
      old_values: Json
      new_values: Json
      reason: string | null
      changed_by: string
      created_at: string
    }
    Insert: {
      id?: string
      booking_id: string
      change_type: string
      old_values: Json
      new_values: Json
      reason?: string | null
      changed_by: string
      created_at?: string
    }
    Update: {
      id?: string
      booking_id?: string
      change_type?: string
      old_values?: Json
      new_values?: Json
      reason?: string | null
      changed_by?: string
    }
    Relationships: []
  }

  time_slot_analytics: {
    Row: {
      id: string
      slot_date: string
      slot_time: string
      service_id: string
      resource_id: string | null
      total_bookings: number
      completed_bookings: number
      cancelled_bookings: number
      no_shows: number
      revenue: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      slot_date: string
      slot_time: string
      service_id: string
      resource_id?: string | null
      total_bookings?: number
      completed_bookings?: number
      cancelled_bookings?: number
      no_shows?: number
      revenue?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      slot_date?: string
      slot_time?: string
      service_id?: string
      resource_id?: string | null
      total_bookings?: number
      completed_bookings?: number
      cancelled_bookings?: number
      no_shows?: number
      revenue?: number
      updated_at?: string
    }
    Relationships: []
  }

  service_analytics: {
    Row: {
      id: string
      service_id: string
      date: string
      total_views: number
      unique_views: number
      bookings_count: number
      conversion_rate: number
      revenue: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      service_id: string
      date: string
      total_views?: number
      unique_views?: number
      bookings_count?: number
      conversion_rate?: number
      revenue?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      service_id?: string
      date?: string
      total_views?: number
      unique_views?: number
      bookings_count?: number
      conversion_rate?: number
      revenue?: number
      updated_at?: string
    }
    Relationships: []
  }
}

// Type imports for database dependencies
interface Database {
  public: {
    Enums: {
      booking_status: any
    }
  }
}