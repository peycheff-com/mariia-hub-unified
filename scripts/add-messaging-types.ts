import { writeFileSync, readFileSync } from 'fs';

// Read the existing types file
const typesPath = './src/integrations/supabase/types.ts';
const content = readFileSync(typesPath, 'utf8');

// Find the position after user_roles table
const userRolesEnd = content.indexOf('      Relationships: []\n      }\n    }\n    Views: {');

if (userRolesEnd !== -1) {
  // Add new tables before the Views section
  const newTables = `
      conversations: {
        Row: {
          id: string
          customer_id: string | null
          customer_email: string | null
          customer_phone: string | null
          customer_name: string | null
          last_message_at: string
          last_message_content: string | null
          status: "active" | "archived" | "spam" | "blocked"
          priority: "low" | "normal" | "high" | "urgent"
          assigned_to: string | null
          tags: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_id?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_name?: string | null
          last_message_at?: string | null
          last_message_content?: string | null
          status?: "active" | "archived" | "spam" | "blocked" | null
          priority?: "low" | "normal" | "high" | "urgent" | null
          assigned_to?: string | null
          tags?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          customer_id?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_name?: string | null
          last_message_at?: string | null
          last_message_content?: string | null
          status?: "active" | "archived" | "spam" | "blocked" | null
          priority?: "low" | "normal" | "high" | "urgent" | null
          assigned_to?: string | null
          tags?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          direction: "inbound" | "outbound"
          channel: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web"
          channel_message_id: string | null
          sender_id: string | null
          sender_name: string | null
          sender_contact: string | null
          status: "draft" | "queued" | "sent" | "delivered" | "read" | "failed"
          attachments: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          conversation_id: string
          content: string
          direction: "inbound" | "outbound"
          channel: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web"
          channel_message_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_contact?: string | null
          status?: "draft" | "queued" | "sent" | "delivered" | "read" | "failed" | null
          attachments?: Json | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          conversation_id?: string | null
          content?: string | null
          direction?: "inbound" | "outbound" | null
          channel?: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web" | null
          channel_message_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_contact?: string | null
          status?: "draft" | "queued" | "sent" | "delivered" | "read" | "failed" | null
          attachments?: Json | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          id: string
          name: string
          category: "booking" | "reminder" | "aftercare" | "promotion" | "review" | "referral" | "general"
          channel: "whatsapp" | "sms" | "email"
          language: "en" | "pl"
          subject: string | null
          content: string
          variables: Json | null
          is_active: boolean | null
          template_type: "custom" | "template"
          template_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          category: "booking" | "reminder" | "aftercare" | "promotion" | "review" | "referral" | "general"
          channel: "whatsapp" | "sms" | "email"
          language?: "en" | "pl" | null
          subject?: string | null
          content: string
          variables?: Json | null
          is_active?: boolean | null
          template_type?: "custom" | "template" | null
          template_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          name?: string | null
          category?: "booking" | "reminder" | "aftercare" | "promotion" | "review" | "referral" | "general" | null
          channel?: "whatsapp" | "sms" | "email" | null
          language?: "en" | "pl" | null
          subject?: string | null
          content?: string | null
          variables?: Json | null
          is_active?: boolean | null
          template_type?: "custom" | "template" | null
          template_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          id: string
          name: string
          description: string | null
          trigger_type: "booking_created" | "booking_confirmed" | "booking_completed" | "booking_cancelled" | "payment_completed" | "aftercare_period" | "birthday" | "no_activity" | "abandoned_cart"
          trigger_config: Json | null
          actions: Json | null
          conditions: Json | null
          is_active: boolean | null
          priority: number | null
          run_at: "immediate" | "scheduled" | "recurring"
          schedule_config: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          trigger_type: "booking_created" | "booking_confirmed" | "booking_completed" | "booking_cancelled" | "payment_completed" | "aftercare_period" | "birthday" | "no_activity" | "abandoned_cart"
          trigger_config?: Json | null
          actions?: Json | null
          conditions?: Json | null
          is_active?: boolean | null
          priority?: number | null
          run_at?: "immediate" | "scheduled" | "recurring" | null
          schedule_config?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          name?: string | null
          description?: string | null
          trigger_type?: "booking_created" | "booking_confirmed" | "booking_completed" | "booking_cancelled" | "payment_completed" | "aftercare_period" | "birthday" | "no_activity" | "abandoned_cart" | null
          trigger_config?: Json | null
          actions?: Json | null
          conditions?: Json | null
          is_active?: boolean | null
          priority?: number | null
          run_at?: "immediate" | "scheduled" | "recurring" | null
          schedule_config?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          id: string
          conversation_id: string | null
          template_id: string | null
          content: string
          channel: "whatsapp" | "sms" | "email"
          recipient: string
          scheduled_for: string
          status: "scheduled" | "sent" | "delivered" | "failed" | "cancelled"
          automation_rule_id: string | null
          retry_count: number | null
          last_retry_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          conversation_id?: string | null
          template_id?: string | null
          content: string
          channel: "whatsapp" | "sms" | "email"
          recipient: string
          scheduled_for: string
          status?: "scheduled" | "sent" | "delivered" | "failed" | "cancelled" | null
          automation_rule_id?: string | null
          retry_count?: number | null
          last_retry_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          conversation_id?: string | null
          template_id?: string | null
          content?: string | null
          channel?: "whatsapp" | "sms" | "email" | null
          recipient?: string | null
          scheduled_for?: string | null
          status?: "scheduled" | "sent" | "delivered" | "failed" | "cancelled" | null
          automation_rule_id?: string | null
          retry_count?: number | null
          last_retry_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      referral_programs: {
        Row: {
          id: string
          name: string
          description: string | null
          reward_type: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash"
          reward_value: number | null
          referrer_reward_type: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash"
          referrer_reward_value: number | null
          max_uses_per_referrer: number | null
          max_uses_total: number | null
          expiry_days: number | null
          is_active: boolean | null
          conditions: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          reward_type: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash"
          reward_value: number
          referrer_reward_type: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash"
          referrer_reward_value: number
          max_uses_per_referrer?: number | null
          max_uses_total?: number | null
          expiry_days?: number | null
          is_active?: boolean | null
          conditions?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          name?: string | null
          description?: string | null
          reward_type?: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash" | null
          reward_value?: number | null
          referrer_reward_type?: "discount_percentage" | "discount_fixed" | "free_service" | "points" | "cash" | null
          referrer_reward_value?: number | null
          max_uses_per_referrer?: number | null
          max_uses_total?: number | null
          expiry_days?: number | null
          is_active?: boolean | null
          conditions?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          id: string
          program_id: string
          referrer_id: string
          code: string
          share_url: string
          usage_count: number | null
          status: "active" | "expired" | "suspended"
          expires_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          program_id: string
          referrer_id: string
          code: string
          share_url: string
          usage_count?: number | null
          status?: "active" | "expired" | "suspended" | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          program_id?: string | null
          referrer_id?: string | null
          code?: string | null
          share_url?: string | null
          usage_count?: number | null
          status?: "active" | "expired" | "suspended" | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          id: string
          referral_code_id: string
          referrer_id: string
          referred_id: string | null
          referred_email: string | null
          referred_name: string | null
          status: "pending" | "registered" | "first_booking" | "completed" | "rewarded" | "expired" | "cancelled"
          conversion_booking_id: string | null
          referral_source: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          ip_address: string | null
          referral_date: string
          conversion_date: string | null
          reward_date: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          referral_code_id: string
          referrer_id: string
          referred_id?: string | null
          referred_email?: string | null
          referred_name?: string | null
          status?: "pending" | "registered" | "first_booking" | "completed" | "rewarded" | "expired" | "cancelled" | null
          conversion_booking_id?: string | null
          referral_source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          ip_address?: string | null
          conversion_date?: string | null
          reward_date?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          referral_code_id?: string | null
          referrer_id?: string | null
          referred_id?: string | null
          referred_email?: string | null
          referred_name?: string | null
          status?: "pending" | "registered" | "first_booking" | "completed" | "rewarded" | "expired" | "cancelled" | null
          conversion_booking_id?: string | null
          referral_source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          ip_address?: string | null
          conversion_date?: string | null
          reward_date?: string | null
          metadata?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_conversions: {
        Row: {
          id: string
          event_name: string
          event_id: string | null
          event_time: number
          user_data: Json | null
          custom_data: Json | null
          action_source: string | null
          event_source_url: string | null
          data_processing_options: Json | null
          test_event_code: string | null
          original_event_data: Json | null
          conversion_value: number | null
          currency: string | null
          status: "pending" | "sent" | "failed" | "retry"
          retry_count: number | null
          last_retry_at: string | null
          meta_response: Json | null
          created_at: string
        }
        Insert: {
          event_name: string
          event_id?: string | null
          event_time: number
          user_data?: Json | null
          custom_data?: Json | null
          action_source?: string | null
          event_source_url?: string | null
          data_processing_options?: Json | null
          test_event_code?: string | null
          original_event_data?: Json | null
          conversion_value?: number | null
          currency?: string | null
          status?: "pending" | "sent" | "failed" | "retry" | null
          retry_count?: number | null
          last_retry_at?: string | null
          meta_response?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          event_name?: string | null
          event_id?: string | null
          event_time?: number | null
          user_data?: Json | null
          custom_data?: Json | null
          action_source?: string | null
          event_source_url?: string | null
          data_processing_options?: Json | null
          test_event_code?: string | null
          original_event_data?: Json | null
          conversion_value?: number | null
          currency?: string | null
          status?: "pending" | "sent" | "failed" | "retry" | null
          retry_count?: number | null
          last_retry_at?: string | null
          meta_response?: Json | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          id: string
          platform: "instagram" | "facebook" | "tiktok" | "linkedin"
          account_id: string
          account_name: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          is_active: boolean | null
          webhook_secret: string | null
          last_sync_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          platform: "instagram" | "facebook" | "tiktok" | "linkedin"
          account_id: string
          account_name: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean | null
          webhook_secret?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          platform?: "instagram" | "facebook" | "tiktok" | "linkedin" | null
          account_id?: string | null
          account_name?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean | null
          webhook_secret?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      message_analytics: {
        Row: {
          id: string
          date: string
          channel: string
          direction: string
          total_messages: number | null
          delivered: number | null
          read: number | null
          failed: number | null
          average_response_time_minutes: number | null
          conversation_count: number | null
          created_at: string
        }
        Insert: {
          date: string
          channel: string
          direction: string
          total_messages?: number | null
          delivered?: number | null
          read?: number | null
          failed?: number | null
          average_response_time_minutes?: number | null
          conversation_count?: number | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          date?: string | null
          channel?: string | null
          direction?: string | null
          total_messages?: number | null
          delivered?: number | null
          read?: number | null
          failed?: number | null
          average_response_time_minutes?: number | null
          conversation_count?: number | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      referral_analytics: {
        Row: {
          id: string
          date: string
          program_id: string | null
          total_referrals: number | null
          successful_referrals: number | null
          conversion_rate: number | null
          total_rewards_given: number | null
          created_at: string
        }
        Insert: {
          date: string
          program_id?: string | null
          total_referrals?: number | null
          successful_referrals?: number | null
          conversion_rate?: number | null
          total_rewards_given?: number | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          date?: string | null
          program_id?: string | null
          total_referrals?: number | null
          successful_referrals?: number | null
          conversion_rate?: number | null
          total_rewards_given?: number | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }`;

  // Insert the new tables before Views
  const updatedContent = content.slice(0, userRolesEnd) + newTables + content.slice(userRolesEnd);

  // Write the updated content back
  writeFileSync(typesPath, updatedContent);
  console.log('Added new messaging and referral types to types.ts');
} else {
  console.error('Could not find user_roles table definition in types.ts');
}