export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface CommunicationTables {
  message_threads: {
    Row: {
      id: string
      client_id: string | null
      channel: 'email' | 'sms' | 'whatsapp' | 'in-app'
      subject: string | null
      last_message_at: string | null
      status: 'open' | 'closed' | 'archived' | 'spam'
      assigned_to: string | null
      priority: 'low' | 'normal' | 'high' | 'urgent'
      tags: string[]
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      client_id?: string | null
      channel: 'email' | 'sms' | 'whatsapp' | 'in-app'
      subject?: string | null
      last_message_at?: string | null
      status?: 'open' | 'closed' | 'archived' | 'spam'
      assigned_to?: string | null
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      tags?: string[]
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      client_id?: string | null
      channel?: 'email' | 'sms' | 'whatsapp' | 'in-app'
      subject?: string | null
      last_message_at?: string | null
      status?: 'open' | 'closed' | 'archived' | 'spam'
      assigned_to?: string | null
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      tags?: string[]
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  messages: {
    Row: {
      id: string
      thread_id: string
      sender_id: string | null
      recipient_id: string | null
      content: string
      message_type: 'text' | 'image' | 'file' | 'system'
      direction: 'inbound' | 'outbound'
      status: 'sent' | 'delivered' | 'read' | 'failed'
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      thread_id: string
      sender_id?: string | null
      recipient_id?: string | null
      content: string
      message_type?: 'text' | 'image' | 'file' | 'system'
      direction?: 'inbound' | 'outbound'
      status?: 'sent' | 'delivered' | 'read' | 'failed'
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      thread_id?: string
      sender_id?: string | null
      recipient_id?: string | null
      content?: string
      message_type?: 'text' | 'image' | 'file' | 'system'
      direction?: 'inbound' | 'outbound'
      status?: 'sent' | 'delivered' | 'read' | 'failed'
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  communication_templates: {
    Row: {
      id: string
      name: string
      type: 'email' | 'sms' | 'whatsapp'
      subject: string | null
      content: string
      variables: Json
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      type: 'email' | 'sms' | 'whatsapp'
      subject?: string | null
      content: string
      variables?: Json
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      type?: 'email' | 'sms' | 'whatsapp'
      subject?: string | null
      content?: string
      variables?: Json
      is_active?: boolean
      updated_at?: string
    }
    Relationships: []
  }

  campaigns: {
    Row: {
      id: string
      name: string
      type: 'email' | 'sms' | 'whatsapp' | 'push'
      template_id: string | null
      subject: string | null
      content: string
      target_audience: Json
      scheduled_at: string | null
      sent_at: string | null
      status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      type: 'email' | 'sms' | 'whatsapp' | 'push'
      template_id?: string | null
      subject?: string | null
      content: string
      target_audience: Json
      scheduled_at?: string | null
      sent_at?: string | null
      status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      type?: 'email' | 'sms' | 'whatsapp' | 'push'
      template_id?: string | null
      subject?: string | null
      content?: string
      target_audience?: Json
      scheduled_at?: string | null
      sent_at?: string | null
      status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  campaign_sends: {
    Row: {
      id: string
      campaign_id: string
      recipient_id: string
      recipient_type: 'user' | 'contact' | 'lead'
      status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      sent_at: string | null
      delivered_at: string | null
      opened_at: string | null
      clicked_at: string | null
      error_message: string | null
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      campaign_id: string
      recipient_id: string
      recipient_type: 'user' | 'contact' | 'lead'
      status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      sent_at?: string | null
      delivered_at?: string | null
      opened_at?: string | null
      clicked_at?: string | null
      error_message?: string | null
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      campaign_id?: string
      recipient_id?: string
      recipient_type?: 'user' | 'contact' | 'lead'
      status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      sent_at?: string | null
      delivered_at?: string | null
      opened_at?: string | null
      clicked_at?: string | null
      error_message?: string | null
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  message_attachments: {
    Row: {
      id: string
      message_id: string
      filename: string
      file_url: string
      file_size: number
      file_type: string
      created_at: string
    }
    Insert: {
      id?: string
      message_id: string
      filename: string
      file_url: string
      file_size: number
      file_type: string
      created_at?: string
    }
    Update: {
      id?: string
      message_id?: string
      filename?: string
      file_url?: string
      file_size?: number
      file_type?: string
    }
    Relationships: []
  }

  communication_settings: {
    Row: {
      id: string
      channel: 'email' | 'sms' | 'whatsapp' | 'push'
      is_enabled: boolean
      settings: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      channel: 'email' | 'sms' | 'whatsapp' | 'push'
      is_enabled?: boolean
      settings?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      channel?: 'email' | 'sms' | 'whatsapp' | 'push'
      is_enabled?: boolean
      settings?: Json
      updated_at?: string
    }
    Relationships: []
  }

  conversations: {
    Row: {
      id: string
      participant_1_id: string
      participant_2_id: string
      last_message_at: string | null
      last_message_preview: string | null
      is_archived: boolean
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      participant_1_id: string
      participant_2_id: string
      last_message_at?: string | null
      last_message_preview?: string | null
      is_archived?: boolean
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      participant_1_id?: string
      participant_2_id?: string
      last_message_at?: string | null
      last_message_preview?: string | null
      is_archived?: boolean
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  message_templates: {
    Row: {
      id: string
      name: string
      category: string
      subject: string | null
      content: string
      variables: Json
      language: string
      is_active: boolean
      usage_count: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      category: string
      subject?: string | null
      content: string
      variables?: Json
      language: string
      is_active?: boolean
      usage_count?: number
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      category?: string
      subject?: string | null
      content?: string
      variables?: Json
      language?: string
      is_active?: boolean
      usage_count?: number
      updated_at?: string
    }
    Relationships: []
  }

  automation_rules: {
    Row: {
      id: string
      name: string
      trigger_event: string
      trigger_conditions: Json
      actions: Json
      is_active: boolean
      execution_count: number
      last_executed: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      trigger_event: string
      trigger_conditions: Json
      actions: Json
      is_active?: boolean
      execution_count?: number
      last_executed?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      trigger_event?: string
      trigger_conditions?: Json
      actions?: Json
      is_active?: boolean
      execution_count?: number
      last_executed?: string | null
      updated_at?: string
    }
    Relationships: []
  }

  scheduled_messages: {
    Row: {
      id: string
      template_id: string | null
      recipient_id: string
      recipient_type: 'user' | 'contact' | 'lead'
      channel: 'email' | 'sms' | 'whatsapp' | 'push'
      scheduled_at: string
      sent_at: string | null
      status: 'scheduled' | 'sent' | 'failed' | 'cancelled'
      content: string
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      template_id?: string | null
      recipient_id: string
      recipient_type: 'user' | 'contact' | 'lead'
      channel: 'email' | 'sms' | 'whatsapp' | 'push'
      scheduled_at: string
      sent_at?: string | null
      status?: 'scheduled' | 'sent' | 'failed' | 'cancelled'
      content: string
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      template_id?: string | null
      recipient_id?: string
      recipient_type?: 'user' | 'contact' | 'lead'
      channel?: 'email' | 'sms' | 'whatsapp' | 'push'
      scheduled_at?: string
      sent_at?: string | null
      status?: 'scheduled' | 'sent' | 'failed' | 'cancelled'
      content?: string
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  message_analytics: {
    Row: {
      id: string
      message_id: string
      event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      timestamp: string
      data: Json
      created_at: string
    }
    Insert: {
      id?: string
      message_id: string
      event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      timestamp: string
      data?: Json
      created_at?: string
    }
    Update: {
      id?: string
      message_id?: string
      event_type?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      timestamp?: string
      data?: Json
    }
    Relationships: []
  }

  social_connections: {
    Row: {
      id: string
      platform: string
      platform_user_id: string
      user_id: string
      access_token: string
      refresh_token: string | null
      expires_at: string | null
      is_active: boolean
      metadata: Json
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      platform: string
      platform_user_id: string
      user_id: string
      access_token: string
      refresh_token?: string | null
      expires_at?: string | null
      is_active?: boolean
      metadata?: Json
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      platform?: string
      platform_user_id?: string
      user_id?: string
      access_token?: string
      refresh_token?: string | null
      expires_at?: string | null
      is_active?: boolean
      metadata?: Json
      updated_at?: string
    }
    Relationships: []
  }

  meta_conversions: {
    Row: {
      id: string
      event_name: string
      event_time: string
      event_id: string
      user_data: Json
      custom_data: Json
      action_source: string
      processing_status: 'pending' | 'sent' | 'failed'
      error_message: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      event_name: string
      event_time: string
      event_id: string
      user_data: Json
      custom_data: Json
      action_source: string
      processing_status?: 'pending' | 'sent' | 'failed'
      error_message?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      event_name?: string
      event_time?: string
      event_id?: string
      user_data?: Json
      custom_data?: Json
      action_source?: string
      processing_status?: 'pending' | 'sent' | 'failed'
      error_message?: string | null
      updated_at?: string
    }
    Relationships: []
  }
}