export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface NewsletterTables {
  newsletter_subscribers: {
    Row: {
      created_at: string
      email: string
      id: string
      is_active: boolean
      language_preference: string | null
      name: string | null
      source: string | null
      subscribed_at: string
      updated_at: string
    }
    Insert: {
      created_at?: string
      email: string
      id?: string
      is_active?: boolean
      language_preference?: string | null
      name?: string | null
      source?: string | null
      subscribed_at?: string
      updated_at?: string
    }
    Update: {
      created_at?: string
      email?: string
      id?: string
      is_active?: boolean
      language_preference?: string | null
      name?: string | null
      source?: string | null
      subscribed_at?: string
      updated_at?: string
    }
    Relationships: []
  }
}