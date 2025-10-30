variable "vercel_api_token" {
  type        = string
  description = "Vercel API token for authentication"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel team ID (optional, for team projects)"
  default     = null
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token for DNS management"
  sensitive   = true
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "domain_name" {
  type        = string
  description = "Primary domain name for the application"
  default     = "mariaborysevych.com"
}

variable "project_name" {
  type        = string
  description = "Vercel project name"
  default     = "mariia-hub-unified"
}

variable "environment" {
  type        = string
  description = "Environment (development, staging, production)"
  default     = "production"

  validation {
    condition = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "supabase_project_url" {
  type        = string
  description = "Supabase project URL"
  sensitive   = true
}

variable "supabase_anon_key" {
  type        = string
  description = "Supabase anonymous key"
  sensitive   = true
}

variable "supabase_service_role_key" {
  type        = string
  description = "Supabase service role key (for server-side operations)"
  sensitive   = true
  default     = ""
}

variable "stripe_publishable_key" {
  type        = string
  description = "Stripe publishable key"
  sensitive   = true
}

variable "stripe_secret_key" {
  type        = string
  description = "Stripe secret key"
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  type        = string
  description = "Stripe webhook secret"
  sensitive   = true
  default     = ""
}

variable "ga4_measurement_id" {
  type        = string
  description = "Google Analytics 4 measurement ID"
  sensitive   = true
}

variable "ga4_api_secret" {
  type        = string
  description = "Google Analytics 4 API secret"
  sensitive   = true
  default     = ""
}

variable "sentry_dsn" {
  type        = string
  description = "Sentry DSN for error tracking"
  sensitive   = true
  default     = ""
}

variable "hotjar_id" {
  type        = string
  description = "Hotjar site ID for heatmaps and session recording"
  sensitive   = true
  default     = ""
}

variable "lovable_api_key" {
  type        = string
  description = "Lovable AI API key"
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  type        = string
  description = "OpenAI API key for AI features"
  sensitive   = true
  default     = ""
}

variable "resend_api_key" {
  type        = string
  description = "Resend API key for email services"
  sensitive   = true
  default     = ""
}

variable "google_places_api_key" {
  type        = string
  description = "Google Places API key for review integration"
  sensitive   = true
  default     = ""
}

variable "instagram_access_token" {
  type        = string
  description = "Instagram access token for social media integration"
  sensitive   = true
  default     = ""
}

variable "whatsapp_access_token" {
  type        = string
  description = "WhatsApp Business API access token"
  sensitive   = true
  default     = ""
}

variable "slack_webhook_url" {
  type        = string
  description = "Slack webhook URL for notifications"
  sensitive   = true
  default     = ""
}

variable "datadog_api_key" {
  type        = string
  description = "Datadog API key for log aggregation"
  sensitive   = true
  default     = ""
}

variable "github_token" {
  type        = string
  description = "GitHub token for repository access"
  sensitive   = true
  default     = null
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in format owner/repo"
  default     = "ivanborysevych/mariia-hub-unified"
}

variable "enable_analytics" {
  type        = bool
  description = "Enable analytics and tracking"
  default     = true
}

variable "enable_ai_features" {
  type        = bool
  description = "Enable AI-powered features"
  default     = true
}

variable "enable_social_integrations" {
  type        = bool
  description = "Enable social media integrations"
  default     = false
}

variable "enable_backup_notifications" {
  type        = bool
  description = "Enable backup status notifications"
  default     = true
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable monitoring and alerting"
  default     = true
}

variable "custom_cdn_url" {
  type        = string
  description = "Custom CDN URL for asset delivery"
  default     = ""
}

variable "staging_domain" {
  type        = string
  description = "Staging subdomain"
  default     = "staging"
}

variable "development_domain" {
  type        = string
  description = "Development subdomain"
  default     = "dev"
}

variable "deployment_regions" {
  type        = list(string)
  description = "Vercel deployment regions"
  default     = ["fra1", "iad1", "hnd1"]

  validation {
    condition = length(var.deployment_regions) > 0
    error_message = "At least one deployment region must be specified."
  }
}

variable "build_timeout" {
  type        = number
  description = "Build timeout in seconds"
  default     = 600

  validation {
    condition = var.build_timeout >= 60 && var.build_timeout <= 3600
    error_message = "Build timeout must be between 60 and 3600 seconds."
  }
}

variable "function_memory" {
  type        = number
  description = "Default function memory in MB"
  default     = 512

  validation {
    condition = contains([128, 256, 512, 1024, 1536, 2048, 3008], var.function_memory)
    error_message = "Function memory must be one of: 128, 256, 512, 1024, 1536, 2048, 3008 MB."
  }
}

variable "function_timeout" {
  type        = number
  description = "Default function timeout in seconds"
  default     = 30

  validation {
    condition = var.function_timeout >= 1 && var.function_timeout <= 300
    error_message = "Function timeout must be between 1 and 300 seconds."
  }
}

variable "rate_limit_api" {
  type        = number
  description = "Rate limit for API endpoints (requests per minute)"
  default     = 100

  validation {
    condition = var.rate_limit_api >= 10 && var.rate_limit_api <= 10000
    error_message = "Rate limit must be between 10 and 10000 requests per minute."
  }
}

variable "cache_ttl_assets" {
  type        = number
  description = "Cache TTL for static assets in seconds"
  default     = 31536000 # 1 year
}

variable "cache_ttl_pages" {
  type        = number
  description = "Cache TTL for HTML pages in seconds"
  default     = 300 # 5 minutes
}

variable "enable_edge_functions" {
  type        = bool
  description = "Enable edge functions for optimal performance"
  default     = true
}

variable "enable_image_optimization" {
  type        = bool
  description = "Enable Vercel Image Optimization"
  default     = true
}

variable "enable_web_vitals" {
  type        = bool
  description = "Enable Vercel Web Vitals analytics"
  default     = true
}

variable "enable_speed_insights" {
  type        = bool
  description = "Enable Vercel Speed Insights"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Tags for resource organization"
  default     = {
    "project"     = "mariia-hub"
    "environment" = "production"
    "managed_by"  = "terraform"
  }
}