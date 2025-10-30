variable "supabase_access_token" {
  type        = string
  description = "Supabase access token with organization management permissions"
  sensitive   = true
}

variable "project_name" {
  type        = string
  description = "Supabase project name"
  default     = "mariia-hub-unified"
}

variable "organization_id" {
  type        = string
  description = "Supabase organization ID"
}

variable "database_password" {
  type        = string
  description = "Database password. If empty, a random password will be generated."
  sensitive   = true
  default     = ""
}

variable "region" {
  type        = string
  description = "Supabase region for project deployment"
  default     = "eu-west-1"

  validation {
    condition = contains([
      "us-east-1", "us-west-1", "us-west-2", "ap-southeast-1", "ap-southeast-2",
      "ap-northeast-1", "ap-northeast-2", "eu-west-1", "eu-west-2", "eu-central-1"
    ], var.region)
    error_message = "Region must be a valid Supabase region."
  }
}

variable "plan" {
  type        = string
  description = "Supabase plan (free, pro, enterprise)"
  default     = "pro"

  validation {
    condition = contains(["free", "pro", "enterprise"], var.plan)
    error_message = "Plan must be one of: free, pro, enterprise."
  }
}

variable "enable_postgrest" {
  type        = bool
  description = "Enable PostgREST API"
  default     = true
}

variable "enable_database_backup" {
  type        = bool
  description = "Enable automatic database backups"
  default     = true
}

variable "enable_realtime" {
  type        = bool
  description = "Enable realtime subscriptions"
  default     = true
}

variable "enable_storage" {
  type        = bool
  description = "Enable storage API"
  default     = true
}

variable "enable_edge_functions" {
  type        = bool
  description = "Enable edge functions"
  default     = true
}

variable "custom_domain" {
  type        = string
  description = "Custom domain for Supabase API and storage"
  default     = ""
}

variable "jwt_expiry" {
  type        = string
  description = "JWT token expiry time in seconds"
  default     = "3600"
}

variable "refresh_token_expiry" {
  type        = string
  description = "Refresh token expiry time in seconds"
  default     = "2592000"
}

variable "site_url" {
  type        = string
  description = "Primary site URL for authentication redirects"
  default     = "https://mariaborysevych.com"
}

variable "redirect_urls" {
  type        = list(string)
  description = "Additional URLs allowed for authentication redirects"
  default     = [
    "https://staging.mariaborysevych.com",
    "http://localhost:8080",
    "https://mariaborysevych.vercel.app"
  ]
}

variable "enable_anonymous_signups" {
  type        = bool
  description = "Allow anonymous user signups"
  default     = false
}

variable "enable_email_confirmations" {
  type        = bool
  description = "Require email confirmation for new signups"
  default     = true
}

variable "email_template_confirm_signup" {
  type        = object({
    subject = string
    content = string
  })
  description = "Email template for signup confirmation"
  default = {
    subject = "Confirm your signup for Mariia Hub"
    content = "<h2>Confirm your signup</h2><p>Follow this link to confirm your signup:</p><p><a href=\"{{ .ConfirmationURL }}\">Confirm your email</a></p>"
  }
}

variable "email_template_reset_password" {
  type        = object({
    subject = string
    content = string
  })
  description = "Email template for password reset"
  default = {
    subject = "Reset your password for Mariia Hub"
    content = "<h2>Reset your password</h2><p>Follow this link to reset your password:</p><p><a href=\"{{ .ConfirmationURL }}\">Reset password</a></p>"
  }
}

variable "email_template_invite" {
  type        = object({
    subject = string
    content = string
  })
  description = "Email template for user invitations"
  default = {
    subject = "You've been invited to join Mariia Hub"
    content = "<h2>You're invited!</h2><p>Follow this link to accept your invitation:</p><p><a href=\"{{ .ConfirmationURL }}\">Accept invitation</a></p>"
  }
}

variable "email_template_change_email" {
  type        = object({
    subject = string
    content = string
  })
  description = "Email template for email change confirmation"
  default = {
    subject = "Confirm your new email address"
    content = "<h2>Confirm your email change</h2><p>Follow this link to confirm your new email address:</p><p><a href=\"{{ .ConfirmationURL }}\">Confirm email change</a></p>"
  }
}

variable "enable_phone_signups" {
  type        = bool
  description = "Enable phone number signups"
  default     = false
}

variable "enable_oauth_providers" {
  type        = object({
    google    = bool
    github    = bool
    facebook  = bool
    twitter   = bool
    apple     = bool
    azure     = bool
    bitbucket = bool
  })
  description = "Enable OAuth providers"
  default = {
    google   = false
    github   = false
    facebook = false
    twitter  = false
    apple    = false
    azure    = false
    bitbucket = false
  }
}

variable "database_extensions" {
  type        = list(string)
  description = "PostgreSQL extensions to enable in the database"
  default = [
    "uuid-ossp",
    "pgcrypto",
    "pg_stat_statements",
    "pg_trgm",
    "btree_gin",
    "btree_gist",
    "citext",
    "hstore",
    "pgjwt",
    "postgis"
  ]
}

variable "backup_retention_days" {
  type        = number
  description = "Number of days to retain database backups"
  default     = 30

  validation {
    condition = var.backup_retention_days >= 1 && var.backup_retention_days <= 90
    error_message = "Backup retention must be between 1 and 90 days."
  }
}

variable "enable_pitr" {
  type        = bool
  description = "Enable Point-in-Time Recovery"
  default     = true
}

variable "enable_connection_pooling" {
  type        = bool
  description = "Enable database connection pooling"
  default     = true
}

variable "connection_pool_size" {
  type        = number
  description = "Connection pool size"
  default     = 15

  validation {
    condition = var.connection_pool_size >= 1 && var.connection_pool_size <= 100
    error_message = "Connection pool size must be between 1 and 100."
  }
}

variable "storage_buckets" {
  type        = list(object({
    name = string
    public = bool
    allowed_mime_types = list(string)
    file_size_limit = number
  }))
  description = "Storage buckets configuration"
  default = [
    {
      name = "service-images"
      public = true
      allowed_mime_types = ["image/*"]
      file_size_limit = 5242880
    },
    {
      name = "profile-images"
      public = true
      allowed_mime_types = ["image/*"]
      file_size_limit = 2097152
    },
    {
      name = "documents"
      public = false
      allowed_mime_types = ["application/pdf", "image/*"]
      file_size_limit = 10485760
    }
  ]
}

variable "rate_limiting" {
  type        = object({
    enabled = bool
    requests_per_second = number
    burst_size = number
  })
  description = "Rate limiting configuration"
  default = {
    enabled = true
    requests_per_second = 100
    burst_size = 200
  }
}

variable "enable_security_headers" {
  type        = bool
  description = "Enable security headers"
  default     = true
}

variable "enable_rls" {
  type        = bool
  description = "Enable Row Level Security by default"
  default     = true
}

variable "enable_audit_logging" {
  type        = bool
  description = "Enable audit logging"
  default     = true
}

variable "log_level" {
  type        = string
  description = "Database log level"
  default     = "warn"

  validation {
    condition = contains(["debug", "info", "warn", "error", "fatal"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error, fatal."
  }
}

variable "custom_headers" {
  type        = map(string)
  description = "Custom HTTP headers for API responses"
  default = {
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
    "Referrer-Policy" = "strict-origin-when-cross-origin"
  }
}

variable "session_timeout" {
  type        = number
  description = "User session timeout in seconds"
  default     = 3600
}

variable "max_request_duration" {
  type        = number
  description = "Maximum request duration in seconds"
  default     = 300
}

variable "password_min_length" {
  type        = number
  description = "Minimum password length"
  default     = 8

  validation {
    condition = var.password_min_length >= 6 && var.password_min_length <= 128
    error_message = "Password minimum length must be between 6 and 128 characters."
  }
}

variable "password_required_chars" {
  type        = list(string)
  description = "Required character types in password"
  default = ["uppercase", "lowercase", "numbers"]

  validation {
    condition = length(var.password_required_chars) >= 1
    error_message = "At least one password requirement must be specified."
  }
}

variable "enable_smtp" {
  type        = bool
  description = "Enable custom SMTP configuration"
  default     = false
}

variable "smtp_config" {
  type = object({
    host = string
    port = number
    user = string
    password = string
    sender_name = string
    sender_email = string
  })
  description = "SMTP configuration for custom email provider"
  default = null
  sensitive = true
}

variable "enable_cors" {
  type        = bool
  description = "Enable CORS configuration"
  default     = true
}

variable "cors_origins" {
  type        = list(string)
  description = "Allowed CORS origins"
  default = [
    "https://mariaborysevych.com",
    "https://staging.mariaborysevych.com",
    "http://localhost:8080"
  ]
}

variable "cors_methods" {
  type        = list(string)
  description = "Allowed CORS methods"
  default = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_headers" {
  type        = list(string)
  description = "Allowed CORS headers"
  default = [
    "apikey",
    "authorization",
    "content-type",
    "x-client-info",
    "x-request-id"
  ]
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable project monitoring and alerts"
  default     = true
}

variable "alert_email" {
  type        = string
  description = "Email address for monitoring alerts"
  default     = ""
}

variable "enable_webhooks" {
  type        = bool
  description = "Enable database webhooks"
  default     = true
}

variable "webhook_events" {
  type        = list(string)
  description = "Database events to trigger webhooks"
  default = ["INSERT", "UPDATE", "DELETE"]
}

variable "tags" {
  type        = map(string)
  description = "Resource tags for organization and billing"
  default = {
    "project" = "mariia-hub"
    "environment" = "production"
    "managed_by" = "terraform"
  }
}