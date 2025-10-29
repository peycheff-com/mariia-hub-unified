export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface LocationsTables {
  locations: {
    Row: {
      id: string
      name: string
      address: string
      city: string
      postal_code: string
      country: string
      latitude: number | null
      longitude: number | null
      phone: string | null
      email: string | null
      description: string | null
      amenities: Json | null
      opening_hours: Json | null
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      address: string
      city: string
      postal_code: string
      country: string
      latitude?: number | null
      longitude?: number | null
      phone?: string | null
      email?: string | null
      description?: string | null
      amenities?: Json | null
      opening_hours?: Json | null
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      address?: string
      city?: string
      postal_code?: string
      country?: string
      latitude?: number | null
      longitude?: number | null
      phone?: string | null
      email?: string | null
      description?: string | null
      amenities?: Json | null
      opening_hours?: Json | null
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }
}