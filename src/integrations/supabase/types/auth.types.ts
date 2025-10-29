export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AuthTables {
  profiles: {
    Row: {
      avatar_url: string | null
      created_at: string
      date_of_birth: string | null
      email: string
      full_name: string
      id: string
      phone: string | null
      preferred_language: string | null
      updated_at: string
    }
    Insert: {
      avatar_url?: string | null
      created_at?: string
      date_of_birth?: string | null
      email: string
      full_name: string
      id: string
      phone?: string | null
      preferred_language?: string | null
      updated_at?: string
    }
    Update: {
      avatar_url?: string | null
      created_at?: string
      date_of_birth?: string | null
      email?: string
      full_name?: string
      id?: string
      phone?: string | null
      preferred_language?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  user_roles: {
    Row: {
      created_at: string
      id: string
      role: Database["public"]["Enums"]["app_role"]
      user_id: string
    }
    Insert: {
      created_at?: string
      id?: string
      role: Database["public"]["Enums"]["app_role"]
      user_id: string
    }
    Update: {
      created_at?: string
      id?: string
      role?: Database["public"]["Enums"]["app_role"]
      user_id?: string
    }
    Relationships: []
  }

  user_preferences: {
    Row: {
      created_at: string
      email_notifications: boolean | null
      last_visited: string | null
      newsletter_subscribed: boolean | null
      preferred_service_type:
        | Database["public"]["Enums"]["service_type"]
        | null
      sms_notifications: boolean | null
      updated_at: string
      user_id: string
      visit_count: number | null
    }
    Insert: {
      created_at?: string
      email_notifications?: boolean | null
      last_visited?: string | null
      newsletter_subscribed?: boolean | null
      preferred_service_type?:
        | Database["public"]["Enums"]["service_type"]
        | null
      sms_notifications?: boolean | null
      updated_at?: string
      user_id: string
      visit_count?: number | null
    }
    Update: {
      created_at?: string
      email_notifications?: boolean | null
      last_visited?: string | null
      newsletter_subscribed?: boolean | null
      preferred_service_type?:
        | Database["public"]["Enums"]["service_type"]
        | null
      sms_notifications?: boolean | null
      updated_at?: string
      user_id?: string
      visit_count?: number | null
    }
    Relationships: []
  }

  user_mode_preferences: {
    Row: {
      created_at: string | null
      id: string
      last_service_id: string | null
      last_visited: string | null
      preferred_mode: string | null
      session_id: string | null
      user_id: string | null
      utm_campaign: string | null
      utm_medium: string | null
      utm_source: string | null
      visit_count: number | null
    }
    Insert: {
      created_at?: string | null
      id?: string
      last_service_id?: string | null
      last_visited?: string | null
      preferred_mode?: string | null
      session_id?: string | null
      user_id?: string | null
      utm_campaign?: string | null
      utm_medium?: string | null
      utm_source?: string | null
      visit_count?: number | null
    }
    Update: {
      created_at?: string | null
      id?: string
      last_service_id?: string | null
      last_visited?: string | null
      preferred_mode?: string | null
      session_id?: string | null
      user_id?: string | null
      utm_campaign?: string | null
      utm_medium?: string | null
      utm_source?: string | null
      visit_count?: number | null
    }
    Relationships: []
  }

  user_favorites: {
    Row: {
      created_at: string
      id: string
      service_id: string
      user_id: string
    }
    Insert: {
      created_at?: string
      id?: string
      service_id: string
      user_id: string
    }
    Update: {
      created_at?: string
      id?: string
      service_id?: string
      user_id?: string
    }
    Relationships: [
      {
        foreignKeyName: "user_favorites_service_id_fkey"
        columns: ["service_id"]
        isOneToOne: false
        referencedRelation: "services"
        referencedColumns: ["id"]
      },
    ]
  }

  user_consents: {
    Row: {
      consent_given_at: string
      consent_ip: string | null
      created_at: string
      email: string | null
      email_marketing_opt_in: boolean | null
      id: string
      language_preference: string | null
      phone: string | null
      sms_opt_in: boolean | null
      updated_at: string
      user_id: string | null
      whatsapp_opt_in: boolean | null
    }
    Insert: {
      consent_given_at?: string
      consent_ip?: string | null
      created_at?: string
      email?: string | null
      email_marketing_opt_in?: boolean | null
      id?: string
      language_preference?: string | null
      phone?: string | null
      sms_opt_in?: boolean | null
      updated_at?: string
      user_id?: string | null
      whatsapp_opt_in?: boolean | null
    }
    Update: {
      consent_given_at?: string
      consent_ip?: string | null
      created_at?: string
      email?: string | null
      email_marketing_opt_in?: boolean | null
      id?: string
      language_preference?: string | null
      phone?: string | null
      sms_opt_in?: boolean | null
      updated_at?: string
      user_id?: string | null
      whatsapp_opt_in?: boolean | null
    }
    Relationships: []
  }
}

// Type imports for database dependencies
interface Database {
  public: {
    Enums: {
      app_role: any
      service_type: any
    }
  }
}