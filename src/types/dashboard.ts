import { User } from "@supabase/supabase-js";

// Dashboard-related types
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_language: string;
  preferred_currency: string;
  marketing_emails: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserConsents {
  id: string;
  user_id: string;
  analytics_consent: boolean;
  marketing_consent: boolean;
  essential_consent: boolean;
  consent_date: string;
  consent_version: string;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

export interface PreferencesUpdate {
  preferred_language?: string;
  preferred_currency?: string;
  marketing_emails?: boolean;
  sms_notifications?: boolean;
  whatsapp_notifications?: boolean;
}

export interface ConsentsUpdate {
  analytics_consent?: boolean;
  marketing_consent?: boolean;
  essential_consent?: boolean;
}