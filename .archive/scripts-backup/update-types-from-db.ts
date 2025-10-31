#!/usr/bin/env tsx

/**
 * This script reads the database schema and updates the TypeScript types file
 * It's needed when new tables are added manually
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { getEnvVar } from '../src/lib/runtime-env';

// Configuration
const SUPABASE_URL = getEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
const SUPABASE_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', ['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const TYPES_FILE_PATH = join(__dirname, '../src/integrations/supabase/types.ts');

async function updateTypes() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials. Please set SUPABASE_URL/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all tables information
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (error) {
    console.error('Error fetching tables:', error);
    process.exit(1);
  }

  // Read existing types file
  const existingContent = readFileSync(TYPES_FILE_PATH, 'utf8');

  // Find where to insert new tables (before the Views section)
  const viewsIndex = existingContent.indexOf('    Views: {');

  if (viewsIndex === -1) {
    console.error('Could not find Views section in types file');
    process.exit(1);
  }

  // Check which new tables need to be added
  const existingTables = [
    'availability_slots', 'blog_categories', 'blog_comments', 'blog_posts',
    'bookings', 'booking_drafts', 'booking_events', 'campaigns', 'communication_logs',
    'contact_submissions', 'conversion_events', 'email_campaigns', 'email_logs',
    'gallery_categories', 'gallery_images', 'holds', 'loyalty_rewards',
    'loyalty_transactions', 'page_views', 'profiles', 'service_categories',
    'service_content', 'service_gallery', 'services', 'site_images',
    'social_posts', 'time_slot_analytics', 'user_consents', 'user_favorites',
    'user_mode_preferences', 'user_preferences', 'user_roles'
  ];

  // Add new tables that aren't in the existing list
  const newTables = tables?.map(t => t.table_name).filter(t => !existingTables.includes(t));

  if (newTables && newTables.length > 0) {
    console.log('New tables detected:', newTables);

    // Generate TypeScript types for new tables
    let newTypes = '';

    // Add conversations table
    if (newTables.includes('conversations')) {
      newTypes += `
      conversations: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          customer_name: string | null;
          last_message_at: string;
          last_message_content: string | null;
          status: "active" | "archived" | "spam" | "blocked";
          priority: "low" | "normal" | "high" | "urgent";
          assigned_to: string | null;
          tags: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          customer_id?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          customer_name?: string | null;
          last_message_at?: string | null;
          last_message_content?: string | null;
          status?: "active" | "archived" | "spam" | "blocked" | null;
          priority?: "low" | "normal" | "high" | "urgent" | null;
          assigned_to?: string | null;
          tags?: Json | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          id?: string | null;
        }
        Update: {
          customer_id?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          customer_name?: string | null;
          last_message_at?: string | null;
          last_message_content?: string | null;
          status?: "active" | "archived" | "spam" | "blocked" | null;
          priority?: "low" | "normal" | "high" | "urgent" | null;
          assigned_to?: string | null;
          tags?: Json | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          id?: string | null;
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
`;
    }

    // Add messages table
    if (newTables.includes('messages')) {
      newTypes += `
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          content: string;
          direction: "inbound" | "outbound";
          channel: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web";
          channel_message_id: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_contact: string | null;
          status: "draft" | "queued" | "sent" | "delivered" | "read" | "failed";
          attachments: Json | null;
          metadata: Json | null;
          created_at: string;
        }
        Insert: {
          conversation_id: string;
          content: string;
          direction: "inbound" | "outbound";
          channel: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web";
          channel_message_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_contact?: string | null;
          status?: "draft" | "queued" | "sent" | "delivered" | "read" | "failed" | null;
          attachments?: Json | null;
          metadata?: Json | null;
          created_at?: string | null;
          id?: string | null;
        }
        Update: {
          conversation_id?: string | null;
          content?: string | null;
          direction?: "inbound" | "outbound" | null;
          channel?: "whatsapp" | "sms" | "email" | "instagram" | "facebook" | "web" | null;
          channel_message_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_contact?: string | null;
          status?: "draft" | "queued" | "sent" | "delivered" | "read" | "failed" | null;
          attachments?: Json | null;
          metadata?: Json | null;
          created_at?: string | null;
          id?: string | null;
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
`;
    }

    // Add other new tables
    const otherTables = [
      'message_templates', 'automation_rules', 'scheduled_messages',
      'referral_programs', 'referral_codes', 'referrals',
      'meta_conversions', 'social_connections',
      'message_analytics', 'referral_analytics'
    ];

    for (const table of otherTables) {
      if (newTables.includes(table)) {
        // Basic structure for other tables
        newTypes += `
      ${table}: {
        Row: {
          id: string;
          created_at: string;
          // Add specific fields based on table
        }
        Insert: {
          id?: string | null;
          created_at?: string | null;
          // Add specific fields based on table
        }
        Update: {
          id?: string | null;
          created_at?: string | null;
          // Add specific fields based on table
        }
        Relationships: []
      }
`;
      }
    }

    // Insert new types before Views section
    const beforeViews = existingContent.substring(0, viewsIndex);
    const afterViews = existingContent.substring(viewsIndex);

    const updatedContent = beforeViews + newTypes + afterViews;

    // Write back to file
    writeFileSync(TYPES_FILE_PATH, updatedContent);
    console.log('Updated types file with new tables');
  } else {
    console.log('No new tables to add');
  }
}

updateTypes().catch(console.error);
