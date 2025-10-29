export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ConsentTables {
  model_consent: {
    Row: {
      consent_given: boolean
      consent_ip: string
      consent_timestamp: string
      created_at: string
      id: string
      model_version: string
      updated_at: string
      user_id: string
    }
    Insert: {
      consent_given: boolean
      consent_ip: string
      consent_timestamp?: string
      created_at?: string
      id?: string
      model_version: string
      updated_at?: string
      user_id: string
    }
    Update: {
      consent_given?: boolean
      consent_ip?: string
      consent_timestamp?: string
      id?: string
      model_version?: string
      updated_at?: string
      user_id?: string
    }
    Relationships: []
  }

  consent_usage_log: {
    Row: {
      access_reason: string
      consent_uuid: string
      created_at: string
      id: string
      usage_context: string
      usage_timestamp: string
      usage_type: string
      user_id: string
    }
    Insert: {
      access_reason: string
      consent_uuid: string
      created_at?: string
      id?: string
      usage_context: string
      usage_timestamp?: string
      usage_type: string
      user_id: string
    }
    Update: {
      access_reason?: string
      consent_uuid?: string
      id?: string
      usage_context?: string
      usage_timestamp?: string
      usage_type?: string
      user_id?: string
    }
    Relationships: []
  }

  consent_requests: {
    Row: {
      consent_text: string
      consent_uuid: string
      created_at: string
      expires_at: string
      id: string
      is_active: boolean
      model_version: string
      request_context: string
      request_timestamp: string
      status: string
      updated_at: string
      user_id: string
    }
    Insert: {
      consent_text: string
      consent_uuid: string
      created_at?: string
      expires_at: string
      id?: string
      is_active?: boolean
      model_version: string
      request_context: string
      request_timestamp?: string
      status?: string
      updated_at?: string
      user_id: string
    }
    Update: {
      consent_text?: string
      consent_uuid?: string
      expires_at?: string
      id?: string
      is_active?: boolean
      model_version?: string
      request_context?: string
      status?: string
      updated_at?: string
      user_id?: string
    }
    Relationships: []
  }

  consent_templates: {
    Row: {
      consent_text: string
      created_at: string
      id: string
      is_active: boolean
      model_version: string
      template_name: string
      updated_at: string
    }
    Insert: {
      consent_text: string
      created_at?: string
      id?: string
      is_active?: boolean
      model_version: string
      template_name: string
      updated_at?: string
    }
    Update: {
      consent_text?: string
      id?: string
      is_active?: boolean
      model_version?: string
      template_name?: string
      updated_at?: string
    }
    Relationships: []
  }

  consent_revocations: {
    Row: {
      consent_uuid: string
      created_at: string
      id: string
      reason: string
      revocation_ip: string
      revocation_timestamp: string
      user_id: string
    }
    Insert: {
      consent_uuid: string
      created_at?: string
      id?: string
      reason: string
      revocation_ip: string
      revocation_timestamp?: string
      user_id: string
    }
    Update: {
      consent_uuid?: string
      id?: string
      reason?: string
      revocation_ip?: string
      revocation_timestamp?: string
      user_id?: string
    }
    Relationships: []
  }
}