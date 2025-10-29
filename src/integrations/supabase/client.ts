// SECURITY NOTE: This file was automatically generated but modified for security
// Hardcoded credentials removed - now using environment variables with validation
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';
// Use validated environment variables for security - no hardcoded credentials
// Environment validation is handled in src/lib/env.ts with build-time failure
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});