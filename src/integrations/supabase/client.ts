// SECURITY NOTE: This file was automatically generated but modified for security
// Hardcoded credentials removed - now using environment variables with validation
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';
// Use validated environment variables for security - no hardcoded credentials
// Environment validation is handled in src/lib/env.ts with build-time failure
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development warning
if (import.meta.env.DEV && (
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_URL.includes('demo') ||
  SUPABASE_URL.includes('your-project')
)) {
  console.warn(`
⚠️  SUPABASE CONFIGURATION WARNING
Your Supabase configuration appears to be using placeholder values.
Please configure your Supabase project:

1. Create a free Supabase project at https://supabase.com
2. Copy your project URL and API keys from Settings > API
3. Update your .env file with the actual values
4. Run database migrations if needed

See SUPABASE_SETUP.md for detailed instructions.
Current URL: ${SUPABASE_URL}
`);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});