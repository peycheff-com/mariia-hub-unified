import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_NAME: z.string().default('Mariia Hub'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_URL: z.string().url().default('http://localhost:8080'),

  // Supabase
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),

  // Stripe
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_STRIPE_ACCOUNT_ID: z.string().min(1).optional(),

  // AI Services
  VITE_ANTHROPIC_API_KEY: z.string().min(1).optional(),
  VITE_OPENAI_API_KEY: z.string().min(1).optional(),
  VITE_GOOGLE_AI_API_KEY: z.string().min(1).optional(),

  // Analytics & Monitoring
  VITE_GA_TRACKING_ID: z.string().min(1).optional(),
  VITE_SENTRY_DSN: z.string().min(1).optional(),
  VITE_ENABLE_ANALYTICS: z.enum(['true', 'false']).transform(Boolean).default('false'),

  // Features
  VITE_ENABLE_AI: z.enum(['true', 'false']).transform(Boolean).default('true'),
  VITE_ENABLE_BOOKING: z.enum(['true', 'false']).transform(Boolean).default('true'),
  VITE_ENABLE_REVIEWS: z.enum(['true', 'false']).transform(Boolean).default('true'),
  VITE_ENABLE_PAYMENT: z.enum(['true', 'false']).transform(Boolean).default('false'),

  // Localization
  VITE_DEFAULT_LANGUAGE: z.enum(['en', 'pl']).default('en'),
  VITE_SUPPORTED_LANGUAGES: z.string().transform(val => val.split(',')).default('en,pl'),

  // Performance
  VITE_ENABLE_SW: z.enum(['true', 'false']).transform(Boolean).default('true'),
  VITE_CACHE_TTL: z.string().transform(Number).default('300000'), // 5 minutes
  VITE_API_TIMEOUT: z.string().transform(Number).default('10000'), // 10 seconds

  // Development
  VITE_DEBUG_MODE: z.enum(['true', 'false']).transform(Boolean).default('false'),
  VITE_ENABLE_MOCKS: z.enum(['true', 'false']).transform(Boolean).default('false'),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse({
      ...import.meta.env,
      // Transform string enums to proper types
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS || 'false',
      VITE_ENABLE_AI: import.meta.env.VITE_ENABLE_AI || 'true',
      VITE_ENABLE_BOOKING: import.meta.env.VITE_ENABLE_BOOKING || 'true',
      VITE_ENABLE_REVIEWS: import.meta.env.VITE_ENABLE_REVIEWS || 'true',
      VITE_ENABLE_PAYMENT: import.meta.env.VITE_ENABLE_PAYMENT || 'false',
      VITE_ENABLE_SW: import.meta.env.VITE_ENABLE_SW || 'true',
      VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE || 'false',
      VITE_ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS || 'false',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Export validated environment variables
export const env = parseEnv();

// Type inference for environment variables
export type Env = z.infer<typeof envSchema>;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof Pick<Env, 'VITE_ENABLE_AI' | 'VITE_ENABLE_BOOKING' | 'VITE_ENABLE_REVIEWS' | 'VITE_ENABLE_PAYMENT' | 'VITE_ENABLE_SW' | 'VITE_ENABLE_ANALYTICS'>): boolean {
  return env[feature];
}

// Helper function to get API key with fallback
export function getApiKey(service: 'anthropic' | 'openai' | 'google' | 'stripe'): string | undefined {
  switch (service) {
    case 'anthropic':
      return env.VITE_ANTHROPIC_API_KEY;
    case 'openai':
      return env.VITE_OPENAI_API_KEY;
    case 'google':
      return env.VITE_GOOGLE_AI_API_KEY;
    case 'stripe':
      return env.VITE_STRIPE_PUBLISHABLE_KEY;
    default:
      return undefined;
  }
}

// Development helper
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Export common environment values as constants
export const APP_CONFIG = {
  name: env.VITE_APP_NAME,
  version: env.VITE_APP_VERSION,
  url: env.VITE_APP_URL,
  supabaseUrl: env.VITE_SUPABASE_URL,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  defaultLanguage: env.VITE_DEFAULT_LANGUAGE,
  supportedLanguages: env.VITE_SUPPORTED_LANGUAGES,
  cacheTTL: env.VITE_CACHE_TTL,
  apiTimeout: env.VITE_API_TIMEOUT,
} as const;