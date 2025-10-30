terraform {
  required_version = ">= 1.5.0"
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 0.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.18"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "random" {}

provider "time" {}

# Variables
variable "supabase_access_token" {
  type        = string
  description = "Supabase access token"
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
  description = "Database password"
  sensitive   = true
}

variable "region" {
  type        = string
  description = "Supabase region"
  default     = "eu-west-1"

  validation {
    condition = contains([
      "us-east-1", "us-west-1", "us-west-2", "ap-southeast-1", "ap-southeast-2",
      "ap-northeast-1", "ap-northeast-2", "eu-west-1", "eu-west-2", "eu-central-1"
    ], var.region)
    error_message = "Region must be a valid Supabase region."
  }
}

variable "enable_postgrest" {
  type        = bool
  description = "Enable PostgREST API"
  default     = true
}

variable "enable_database_backup" {
  type        = bool
  description = "Enable database backups"
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
  description = "Custom domain for Supabase"
  default     = ""
}

variable "jwt_expiry" {
  type        = string
  description = "JWT expiry time"
  default     = "3600"
}

variable "refresh_token_expiry" {
  type        = string
  description = "Refresh token expiry time"
  default     = "2592000" # 30 days
}

variable "site_url" {
  type        = string
  description = "Site URL for redirects"
  default     = "https://mariaborysevych.com"
}

variable "redirect_urls" {
  type        = list(string)
  description = "Additional redirect URLs"
  default     = [
    "https://staging.mariaborysevych.com",
    "http://localhost:8080",
    "https://mariaborysevych.vercel.app"
  ]
}

variable "enable_anonymous_signups" {
  type        = bool
  description = "Enable anonymous user signups"
  default     = false
}

variable "enable_email_confirmations" {
  type        = bool
  description = "Enable email confirmations"
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
    content = "<h2>Confirm your signup</h2><p>Follow this link to confirm your signup:</p><p><a href>{{ .ConfirmationURL }}>Confirm your email</a></p>"
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
    content = "<h2>Reset your password</h2><p>Follow this link to reset your password:</p><p><a href={{ .ConfirmationURL }}>Reset password</a></p>"
  }
}

variable "enable_phone_signups" {
  type        = bool
  description = "Enable phone signups"
  default     = false
}

variable "enable_oauth_providers" {
  type        = object({
    google    = bool
    github    = bool
    facebook  = bool
    twitter   = bool
    apple     = bool
  })
  description = "Enable OAuth providers"
  default = {
    google   = false
    github   = false
    facebook = false
    twitter  = false
    apple    = false
  }
}

variable "database_extensions" {
  type        = list(string)
  description = "PostgreSQL extensions to enable"
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
  description = "Number of days to retain backups"
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
  description = "Enable connection pooling"
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
      file_size_limit = 5242880 # 5MB
    },
    {
      name = "profile-images"
      public = true
      allowed_mime_types = ["image/*"]
      file_size_limit = 2097152 # 2MB
    },
    {
      name = "documents"
      public = false
      allowed_mime_types = ["application/pdf", "image/*"]
      file_size_limit = 10485760 # 10MB
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
  description = "Custom HTTP headers"
  default = {
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
    "Referrer-Policy" = "strict-origin-when-cross-origin"
  }
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default = {
    "project" = "mariia-hub"
    "environment" = "production"
    "managed_by" = "terraform"
  }
}

# Locals
locals {
  project_config = {
    name = var.project_name
    organization_id = var.organization_id
    region = var.region
    database_password = var.database_password
    db_pass = var.database_password
  }
}

# Supabase Project
resource "supabase_project" "main" {
  name           = local.project_config.name
  organization_id = local.project_config.organization_id
  region         = local.project_config.region
  database_password = local.project_config.database_password
  db_pass       = local.project_config.db_pass

  # Instance configuration
  plan = "pro"

  # Database configuration
  enable_postgrest = var.enable_postgrest
  enable_database_backup = var.enable_database_backup
  backup_retention_days = var.backup_retention_days
  enable_pitr = var.enable_pitr

  # Features
  enable_realtime = var.enable_realtime
  enable_storage = var.enable_storage
  enable_edge_functions = var.enable_edge_functions

  # Connection pooling
  enable_connection_pooling = var.enable_connection_pooling
  connection_pool_size = var.connection_pool_size

  # Custom domain
  custom_domain = var.custom_domain != "" ? var.custom_domain : null

  # Rate limiting
  rate_limiting_enabled = var.rate_limiting.enabled
  rate_limiting_requests_per_second = var.rate_limiting.requests_per_second
  rate_limiting_burst_size = var.rate_limiting.burst_size

  # Security
  enable_security_headers = var.enable_security_headers
  enable_rls = var.enable_rls
  enable_audit_logging = var.enable_audit_logging

  # Logging
  log_level = var.log_level

  # Custom headers
  custom_headers = var.custom_headers

  # Tags
  tags = var.tags
}

# JWT Configuration
resource "supabase_jwt_secret" "main" {
  project_id = supabase_project.main.id
  jwt_expiry = var.jwt_expiry
  refresh_token_expiry = var.refresh_token_expiry
}

# Auth Configuration
resource "supabase_auth_setting" "main" {
  project_id = supabase_project.main.id

  site_url = var.site_url
  redirect_urls = var.redirect_urls

  # User settings
  enable_signup = var.enable_anonymous_signups
  enable_email_confirmations = var.enable_email_confirmations
  enable_phone_signups = var.enable_phone_signups

  # Email templates
  mailer_auto_confirm = !var.enable_email_confirmations

  # Password policy
  password_min_length = 8
  password_required_chars = ["uppercase", "lowercase", "numbers"]

  # Security
  session_timeout = 3600
  max_request_duration = 300
}

# Email Templates
resource "supabase_auth_template" "signup_confirmation" {
  project_id = supabase_project.main.id
  template_type = "signup"
  subject = var.email_template_confirm_signup.subject
  content = var.email_template_confirm_signup.content
}

resource "supabase_auth_template" "password_reset" {
  project_id = supabase_project.main.id
  template_type = "recovery"
  subject = var.email_template_reset_password.subject
  content = var.email_template_reset_password.content
}

# OAuth Providers (conditionally created)
resource "supabase_oauth_provider" "google" {
  count = var.enable_oauth_providers.google ? 1 : 0
  project_id = supabase_project.main.id
  provider_name = "google"
  # Additional configuration would be provided via Terraform variables
}

resource "supabase_oauth_provider" "github" {
  count = var.enable_oauth_providers.github ? 1 : 0
  project_id = supabase_project.main.id
  provider_name = "github"
}

# Database Extensions
resource "supabase_database_extension" "extensions" {
  for_each = toset(var.database_extensions)
  project_id = supabase_project.main.id
  name = each.value
}

# Storage Buckets
resource "supabase_storage_bucket" "buckets" {
  for_each = {
    for bucket in var.storage_buckets : bucket.name => bucket
  }
  project_id = supabase_project.main.id
  name = each.value.name
  public = each.value.public
  allowed_mime_types = each.value.allowed_mime_types
  file_size_limit = each.value.file_size_limit
}

# Storage Policies
resource "supabase_storage_policy" "service_images_policy" {
  project_id = supabase_project.main.id
  bucket_id = supabase_storage_bucket.buckets["service-images"].id
  name = "Service Images Access"
  definition = "true" # Allow all access to public bucket
  operation = "INSERT"
}

resource "supabase_storage_policy" "profile_images_policy" {
  project_id = supabase_project.main.id
  bucket_id = supabase_storage_bucket.buckets["profile-images"].id
  name = "Profile Images Access"
  definition = "true" # Allow all access to public bucket
  operation = "INSERT"
}

resource "supabase_storage_policy" "documents_policy" {
  project_id = supabase_project.main.id
  bucket_id = supabase_storage_bucket.buckets["documents"].id
  name = "Documents Access"
  definition = "auth.role() = 'authenticated'"
  operation = "INSERT"
}

# Edge Functions
resource "supabase_edge_function" "webhook_handler" {
  count = var.enable_edge_functions ? 1 : 0
  project_id = supabase_project.main.id
  name = "webhook-handler"
  file_path = "${path.module}/functions/webhook-handler/index.ts"
  verify_jwt = false
}

resource "supabase_edge_function" "ai_processor" {
  count = var.enable_edge_functions ? 1 : 0
  project_id = supabase_project.main.id
  name = "ai-processor"
  file_path = "${path.module}/functions/ai-processor/index.ts"
  verify_jwt = true
}

# API Keys Management
resource "supabase_project_api_key" "anon" {
  project_id = supabase_project.main.id
  name = "anon"
}

resource "supabase_project_api_key" "service_role" {
  project_id = supabase_project.main.id
  name = "service_role"
}

# Backup Configuration
resource "time_static" "backup_time" {}

resource "supabase_database_backup" "daily" {
  count = var.enable_database_backup ? 1 : 0
  project_id = supabase_project.main.id
  description = "Daily backup - ${time_static.backup_time.rfc3339}"
  retention_days = var.backup_retention_days
}

# Random password generation (if not provided)
resource "random_password" "db_password" {
  count = var.database_password == "" ? 1 : 0
  length = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Custom domain SSL (if custom domain is provided)
resource "supabase_custom_domain_ssl" "main" {
  count = var.custom_domain != "" ? 1 : 0
  project_id = supabase_project.main.id
  custom_domain = var.custom_domain
}