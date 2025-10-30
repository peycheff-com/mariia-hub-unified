// Supabase type definitions to avoid using 'any'

export interface Database {
  public: {
    Tables: {
      // Existing tables
      blog_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'approved' | 'rejected';
        };
        Insert: Omit<Database['public']['Tables']['blog_comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_comments']['Insert']>;
      };
      service_gallery: {
        Row: {
          id: string;
          service_id: string;
          image_url: string;
          caption: string | null;
          display_order: number;
          is_featured: boolean;
          created_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          service_type: 'beauty' | 'fitness' | 'lifestyle';
          category: string | null;
          description: string | null;
          price: number;
          duration_minutes: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };

      // Support Infrastructure Tables
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          user_id: string | null;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          subject: string;
          description: string;
          category: 'booking_issue' | 'payment_problem' | 'service_inquiry' | 'technical_support' | 'complaint' | 'feature_request' | 'general' | 'billing' | 'account_management';
          priority: 'urgent' | 'high' | 'medium' | 'low';
          status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed' | 'escalated';
          channel: 'email' | 'chat' | 'phone' | 'web' | 'mobile_app' | 'social_media';
          assigned_agent_id: string | null;
          assigned_team_id: string | null;
          escalation_level: number;
          sla_status: 'on_track' | 'at_risk' | 'breached' | 'exceeded';
          sla_response_deadline: string | null;
          sla_resolution_deadline: string | null;
          first_response_at: string | null;
          resolved_at: string | null;
          booking_id: string | null;
          service_id: string | null;
          tags: string[] | null;
          metadata: Record<string, any>;
          internal_notes: string | null;
          customer_satisfaction_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_tickets']['Row'], 'id' | 'ticket_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
      };
      ticket_conversations: {
        Row: {
          id: string;
          ticket_id: string;
          message: string;
          message_type: 'customer_message' | 'agent_message' | 'system_note' | 'internal_note' | 'email_sent' | 'email_received';
          channel: 'email' | 'chat' | 'phone' | 'web' | 'mobile_app' | 'social_media';
          sender_id: string | null;
          sender_name: string;
          sender_email: string | null;
          is_internal: boolean;
          attachments: string[] | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ticket_conversations']['Insert']>;
      };
      kb_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          parent_id: string | null;
          icon: string | null;
          color: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kb_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kb_categories']['Insert']>;
      };
      kb_articles: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          title: string;
          meta_description: string | null;
          content_en: string | null;
          content_pl: string | null;
          summary_en: string | null;
          summary_pl: string | null;
          tags: string[] | null;
          difficulty_level: string;
          estimated_read_time: number | null;
          featured_image_url: string | null;
          video_url: string | null;
          attachments: string[] | null;
          view_count: number;
          helpful_count: number;
          not_helpful_count: number;
          status: 'draft' | 'published' | 'archived';
          is_featured: boolean;
          related_service_ids: string[] | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['kb_articles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kb_articles']['Insert']>;
      };
      kb_search_analytics: {
        Row: {
          id: string;
          search_query: string;
          search_language: string;
          results_count: number | null;
          clicked_article_id: string | null;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kb_search_analytics']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kb_search_analytics']['Insert']>;
      };
      support_teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          team_email: string | null;
          specialty_areas: string[] | null;
          working_hours: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_teams']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['support_teams']['Insert']>;
      };
      support_agents: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          agent_level: 'agent' | 'senior_agent' | 'team_lead' | 'manager' | 'specialist';
          specializations: string[] | null;
          languages: string[] | null;
          max_concurrent_tickets: number;
          avg_response_time: number | null;
          customer_satisfaction_avg: number | null;
          tickets_resolved: number;
          is_active: boolean;
          is_on_break: boolean;
          break_reason: string | null;
          working_hours: Record<string, any>;
          auto_assign_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_agents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['support_agents']['Insert']>;
      };
      sla_policies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          first_response_target: number;
          resolution_target: number;
          priority: 'urgent' | 'high' | 'medium' | 'low';
          category: 'booking_issue' | 'payment_problem' | 'service_inquiry' | 'technical_support' | 'complaint' | 'feature_request' | 'general' | 'billing' | 'account_management' | null;
          customer_tier: string | null;
          business_hours: Record<string, any>;
          holiday_calendar: Record<string, any>;
          warning_threshold_percentage: number;
          critical_threshold_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sla_policies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sla_policies']['Insert']>;
      };
      ticket_escalations: {
        Row: {
          id: string;
          ticket_id: string;
          from_agent_id: string | null;
          to_agent_id: string | null;
          from_team_id: string | null;
          to_team_id: string | null;
          escalation_reason: string;
          escalation_type: 'manual' | 'automatic' | 'sla_breach' | 'customer_request';
          status: 'pending' | 'accepted' | 'rejected';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_escalations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ticket_escalations']['Insert']>;
      };
      satisfaction_surveys: {
        Row: {
          id: string;
          ticket_id: string;
          overall_rating: number;
          response_time_rating: number | null;
          agent_rating: number | null;
          resolution_rating: number | null;
          feedback: string | null;
          would_recommend: boolean | null;
          suggestions: string | null;
          survey_sent_at: string | null;
          survey_completed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['satisfaction_surveys']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['satisfaction_surveys']['Insert']>;
      };
      support_metrics: {
        Row: {
          id: string;
          metric_date: string;
          new_tickets: number;
          resolved_tickets: number;
          escalated_tickets: number;
          avg_first_response_time: number;
          avg_resolution_time: number;
          customer_satisfaction_avg: number;
          first_contact_resolution_rate: number;
          sla_compliance_rate: number;
          active_agents: number;
          agent_utilization_rate: number;
          channel_breakdown: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_metrics']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['support_metrics']['Insert']>;
      };
      canned_responses: {
        Row: {
          id: string;
          title: string;
          category: 'booking_issue' | 'payment_problem' | 'service_inquiry' | 'technical_support' | 'complaint' | 'feature_request' | 'general' | 'billing' | 'account_management';
          shortcut: string | null;
          content_en: string;
          content_pl: string | null;
          variables: string[] | null;
          usage_count: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['canned_responses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['canned_responses']['Insert']>;
      };
      support_integrations: {
        Row: {
          id: string;
          integration_type: string;
          integration_name: string;
          configuration: Record<string, any>;
          webhook_url: string | null;
          is_active: boolean;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_integrations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['support_integrations']['Insert']>;
      };
    };
  };
}

// Helper types for joins
export interface ServiceGalleryWithService {
  id: string;
  service_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  services: Database['public']['Tables']['services']['Row'];
}

export interface BlogCommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: {
    full_name: string | null;
  };
}

// Support infrastructure helper types
export interface SupportTicketWithDetails extends Database['public']['Tables']['support_tickets']['Row'] {
  conversations?: Database['public']['Tables']['ticket_conversations']['Row'][];
  assigned_agent?: {
    id: string;
    user_metadata: Record<string, any>;
    full_name: string | null;
  };
  customer?: {
    id: string;
    email: string;
    user_metadata: Record<string, any>;
  };
  booking?: Database['public']['Tables']['bookings']['Row'];
  service?: Database['public']['Tables']['services']['Row'];
  escalations?: Database['public']['Tables']['ticket_escalations']['Row'][];
  satisfaction_survey?: Database['public']['Tables']['satisfaction_surveys']['Row'];
}

export interface KnowledgeBaseArticleWithCategory extends Database['public']['Tables']['kb_articles']['Row'] {
  category: Database['public']['Tables']['kb_categories']['Row'];
  search_analytics?: Database['public']['Tables']['kb_search_analytics']['Row'][];
}

export interface SupportAgentWithTeam extends Database['public']['Tables']['support_agents']['Row'] {
  team?: Database['public']['Tables']['support_teams']['Row'];
  user?: {
    id: string;
    email: string;
    user_metadata: Record<string, any>;
  };
  active_tickets?: SupportTicketWithDetails[];
}

export interface SupportTicketMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  overdueTickets: number;
  avgResponseTime: number;
  customerSatisfactionAvg: number;
  slaComplianceRate: number;
}

export interface SupportDashboardData {
  metrics: SupportTicketMetrics;
  recentTickets: SupportTicketWithDetails[];
  teamPerformance: SupportAgentWithTeam[];
  priorityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  channelBreakdown: Record<string, number>;
}

// Supabase client with typing
export interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: SupabaseUser | null }, error: any }>;
  };
  channel: (name: string) => any;
  removeChannel: (channel: any) => void;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}