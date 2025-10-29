export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface FeedbackTables {
  feedback_entries: {
    Row: {
      assigned_to: string | null
      auto_categorized: boolean | null
      booking_id: string | null
      category: string | null
      channel: Database["public"]["Enums"]["feedback_channel"]
      content: string | null
      created_at: string
      feedback_type: Database["public"]["Enums"]["feedback_type"]
      id: string
      ip_address: string | null
      keywords: string[] | null
      metadata: Json | null
      priority: Database["public"]["Enums"]["feedback_priority"]
      rating: number | null
      referrer: string | null
      resolved_at: string | null
      responded_at: string | null
      sentiment: Database["public"]["Enums"]["sentiment_analysis"] | null
      status: Database["public"]["Enums"]["feedback_status"]
      tags: string[] | null
      user_agent: string | null
      user_id: string | null
      visitor_id: string | null
    }
    Insert: {
      assigned_to?: string | null
      auto_categorized?: boolean | null
      booking_id?: string | null
      category?: string | null
      channel: Database["public"]["Enums"]["feedback_channel"]
      content?: string | null
      created_at?: string
      feedback_type: Database["public"]["Enums"]["feedback_type"]
      id?: string
      ip_address?: string | null
      keywords?: string[] | null
      metadata?: Json | null
      priority: Database["public"]["Enums"]["feedback_priority"]
      rating?: number | null
      referrer?: string | null
      resolved_at?: string | null
      responded_at?: string | null
      sentiment?: Database["public"]["Enums"]["sentiment_analysis"] | null
      status?: Database["public"]["Enums"]["feedback_status"]
      tags?: string[] | null
      user_agent?: string | null
      user_id?: string | null
      visitor_id?: string | null
    }
    Update: {
      assigned_to?: string | null
      auto_categorized?: boolean | null
      booking_id?: string | null
      category?: string | null
      channel?: Database["public"]["Enums"]["feedback_channel"]
      content?: string | null
      id?: string
      ip_address?: string | null
      keywords?: string[] | null
      metadata?: Json | null
      priority?: Database["public"]["Enums"]["feedback_priority"]
      rating?: number | null
      referrer?: string | null
      resolved_at?: string | null
      responded_at?: string | null
      sentiment?: Database["public"]["Enums"]["sentiment_analysis"] | null
      status?: Database["public"]["Enums"]["feedback_status"]
      tags?: string[] | null
      user_agent?: string | null
      user_id?: string | null
      visitor_id?: string | null
    }
    Relationships: []
  }

  feedback_attachments: {
    Row: {
      content_type: string | null
      created_at: string
      feedback_id: string
      file_name: string
      file_path: string
      file_size: number | null
      file_type: string | null
      id: string
      metadata: Json | null
      uploaded_by: string | null
    }
    Insert: {
      content_type?: string | null
      created_at?: string
      feedback_id: string
      file_name: string
      file_path: string
      file_size?: number | null
      file_type?: string | null
      id?: string
      metadata?: Json | null
      uploaded_by?: string | null
    }
    Update: {
      content_type?: string | null
      feedback_id?: string
      file_name?: string
      file_path?: string
      file_size?: number | null
      file_type?: string | null
      id?: string
      metadata?: Json | null
      uploaded_by?: string | null
    }
    Relationships: []
  }

  feedback_responses: {
    Row: {
      content: string | null
      created_at: string
      feedback_id: string
      id: string
      internal_notes: string | null
      is_internal: boolean | null
      response_type: Database["public"]["Enums"]["feedback_response_type"]
      responded_by: string | null
      sentiment_after: Database["public"]["Enums"]["sentiment_analysis"] | null
      status_after: Database["public"]["Enums"]["feedback_status"] | null
      updated_at: string
    }
    Insert: {
      content?: string | null
      created_at?: string
      feedback_id: string
      id?: string
      internal_notes?: string | null
      is_internal?: boolean | null
      response_type: Database["public"]["Enums"]["feedback_response_type"]
      responded_by?: string | null
      sentiment_after?: Database["public"]["Enums"]["sentiment_analysis"] | null
      status_after?: Database["public"]["Enums"]["feedback_status"] | null
      updated_at?: string
    }
    Update: {
      content?: string | null
      feedback_id?: string
      id?: string
      internal_notes?: string | null
      is_internal?: boolean | null
      response_type?: Database["public"]["Enums"]["feedback_response_type"]
      responded_by?: string | null
      sentiment_after?: Database["public"]["Enums"]["sentiment_analysis"] | null
      status_after?: Database["public"]["Enums"]["feedback_status"] | null
      updated_at?: string
    }
    Relationships: []
  }

  nps_surveys: {
    Row: {
      created_at: string
      customer_email: string | null
      customer_id: string | null
      customer_name: string | null
      id: string
      last_survey_date: string | null
      survey_frequency: number | null
      survey_sent_count: number | null
      survey_status: Database["public"]["Enums"]["survey_status"] | null
      updated_at: string
    }
    Insert: {
      created_at?: string
      customer_email?: string | null
      customer_id?: string | null
      customer_name?: string | null
      id?: string
      last_survey_date?: string | null
      survey_frequency?: number | null
      survey_sent_count?: number | null
      survey_status?: Database["public"]["Enums"]["survey_status"] | null
      updated_at?: string
    }
    Update: {
      created_at?: string
      customer_email?: string | null
      customer_id?: string | null
      customer_name?: string | null
      id?: string
      last_survey_date?: string | null
      survey_frequency?: number | null
      survey_sent_count?: number | null
      survey_status?: Database["public"]["Enums"]["survey_status"] | null
      updated_at?: string
    }
    Relationships: []
  }

  feedback_templates: {
    Row: {
      categories: Json | null
      created_at: string
      custom_fields: Json | null
      id: string
      is_active: boolean | null
      questions: Json | null
      template_name: string
      template_type: Database["public"]["Enums"]["feedback_template_type"]
      updated_at: string
    }
    Insert: {
      categories?: Json | null
      created_at?: string
      custom_fields?: Json | null
      id?: string
      is_active?: boolean | null
      questions?: Json | null
      template_name: string
      template_type: Database["public"]["Enums"]["feedback_template_type"]
      updated_at?: string
    }
    Update: {
      categories?: Json | null
      custom_fields?: Json | null
      id?: string
      is_active?: boolean | null
      questions?: Json | null
      template_name?: string
      template_type?: Database["public"]["Enums"]["feedback_template_type"]
      updated_at?: string
    }
    Relationships: []
  }

  feedback_campaigns: {
    Row: {
      auto_reminders: boolean | null
      campaign_end: string | null
      campaign_start: string | null
      channels: Json | null
      conditions: Json | null
      content: Json | null
      created_at: string
      end_date: string | null
      id: string
      is_active: boolean | null
      name: string | null
      sent_count: number | null
      start_date: string | null
      status: Database["public"]["Enums"]["campaign_status"] | null
      template_id: string | null
      target_criteria: Json | null
      updated_at: string
    }
    Insert: {
      auto_reminders?: boolean | null
      campaign_end?: string | null
      campaign_start?: string | null
      channels?: Json | null
      conditions?: Json | null
      content?: Json | null
      created_at?: string
      end_date?: string | null
      id?: string
      is_active?: boolean | null
      name?: string | null
      sent_count?: number | null
      start_date?: string | null
      status?: Database["public"]["Enums"]["campaign_status"] | null
      template_id?: string | null
      target_criteria?: Json | null
      updated_at?: string
    }
    Update: {
      auto_reminders?: boolean | null
      campaign_end?: string | null
      campaign_start?: string | null
      channels?: Json | null
      conditions?: Json | null
      content?: Json | null
      end_date?: string | null
      id?: string
      is_active?: boolean | null
      name?: string | null
      sent_count?: number | null
      start_date?: string | null
      status?: Database["public"]["Enums"]["campaign_status"] | null
      template_id?: string | null
      target_criteria?: Json | null
      updated_at?: string
    }
    Relationships: []
  }

  feedback_analytics: {
    Row: {
      average_rating: number | null
      category_distribution: Json | null
      created_at: string
      date: string
      feedback_count: number | null
      id: string
      resolution_rate: number | null
      response_time_avg: number | null
      sentiment_distribution: Json | null
      source_distribution: Json | null
      updated_at: string
    }
    Insert: {
      average_rating?: number | null
      category_distribution?: Json | null
      created_at?: string
      date: string
      feedback_count?: number | null
      id?: string
      resolution_rate?: number | null
      response_time_avg?: number | null
      sentiment_distribution?: Json | null
      source_distribution?: Json | null
      updated_at?: string
    }
    Update: {
      average_rating?: number | null
      category_distribution?: Json | null
      date?: string
      feedback_count?: number | null
      id?: string
      resolution_rate?: number | null
      response_time_avg?: number | null
      sentiment_distribution?: Json | null
      source_distribution?: Json | null
      updated_at?: string
    }
    Relationships: []
  }

  feedback_subscriptions: {
    Row: {
      created_at: string
      feedback_type: Database["public"]["Enums"]["feedback_type"]
      frequency: string | null
      id: string
      is_active: boolean | null
      last_sent: string | null
      notification_method: Database["public"]["Enums"]["notification_method"]
      subscription_criteria: Json | null
      subscribed_by: string | null
      updated_at: string
      user_id: string | null
    }
    Insert: {
      created_at?: string
      feedback_type: Database["public"]["Enums"]["feedback_type"]
      frequency?: string | null
      id?: string
      is_active?: boolean | null
      last_sent?: string | null
      notification_method: Database["public"]["Enums"]["notification_method"]
      subscription_criteria?: Json | null
      subscribed_by?: string | null
      updated_at?: string
      user_id?: string | null
    }
    Update: {
      created_at?: string
      feedback_type?: Database["public"]["Enums"]["feedback_type"]
      frequency?: string | null
      id?: string
      is_active?: boolean | null
      last_sent?: string | null
      notification_method?: Database["public"]["Enums"]["notification_method"]
      subscription_criteria?: Json | null
      subscribed_by?: string | null
      updated_at?: string
      user_id?: string | null
    }
    Relationships: []
  }

  feedback_integration_logs: {
    Row: {
      created_at: string
      data_sent: Json | null
      error_message: string | null
      feedback_id: string | null
      id: string
      integration_type: string | null
      request_id: string | null
      response_code: number | null
      response_data: Json | null
      status: Database["public"]["Enums"]["integration_status"]
      updated_at: string
    }
    Insert: {
      created_at?: string
      data_sent?: Json | null
      error_message?: string | null
      feedback_id?: string | null
      id?: string
      integration_type?: string | null
      request_id?: string | null
      response_code?: number | null
      response_data?: Json | null
      status: Database["public"]["Enums"]["integration_status"]
      updated_at?: string
    }
    Update: {
      created_at?: string
      data_sent?: Json | null
      error_message?: string | null
      feedback_id?: string | null
      id?: string
      integration_type?: string | null
      request_id?: string | null
      response_code?: number | null
      response_data?: Json | null
      status?: Database["public"]["Enums"]["integration_status"]
      updated_at?: string
    }
    Relationships: []
  }

  feedback_tags: {
    Row: {
      color: string | null
      created_at: string
      description: string | null
      id: string
      name: string
      usage_count: number | null
    }
    Insert: {
      color?: string | null
      created_at?: string
      description?: string | null
      id?: string
      name: string
      usage_count?: number | null
    }
    Update: {
      color?: string | null
      description?: string | null
      id?: string
      name?: string
      usage_count?: number | null
    }
    Relationships: []
  }
}

// Type imports for database dependencies
interface Database {
  public: {
    Enums: {
      feedback_channel: any
      feedback_type: any
      feedback_priority: any
      sentiment_analysis: any
      feedback_status: any
      feedback_response_type: any
      survey_status: any
      feedback_template_type: any
      campaign_status: any
      notification_method: any
      integration_status: any
    }
  }
}