export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface IntegrationTables {
  integration_settings: {
    Row: {
      id: string
      integration_type: string
      settings: Json
      is_active: boolean
      last_sync_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      integration_type: string
      settings: Json
      is_active?: boolean
      last_sync_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      integration_type?: string
      settings?: Json
      is_active?: boolean
      last_sync_at?: string | null
      updated_at?: string
    }
    Relationships: []
  }
}