/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean

  // Supabase
  readonly VITE_SUPABASE_PROJECT_ID: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_SUPABASE_URL: string

  // Stripe
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string

  // App
  readonly VITE_APP_URL: string

  // Security
  readonly VITE_SECURITY_HEADERS_ENABLED: string
  readonly VITE_CSP_NONCE_GENERATION: string
  readonly VITE_HMR: string
  readonly VITE_SOURCE_MAP: string

  // AI/ML
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GOOGLE_AI_API_KEY: string

  // Location
  readonly VITE_IPINFO_TOKEN: string

  // QR
  readonly VITE_QR_SECRET: string

  // Push notifications
  readonly VITE_VAPID_PUBLIC_KEY: string

  // Meta
  readonly VITE_META_ACCESS_TOKEN: string
  readonly VITE_META_PIXEL_ID: string
  readonly VITE_META_TEST_CODE?: string
  readonly VITE_META_API_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
