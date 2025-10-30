terraform {
  required_version = ">= 1.5.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.16"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "mariia-hub-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "eu-west-1"
    encrypt = true
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team = var.vercel_team_id
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "random" {}

# Variables
variable "vercel_api_token" {
  type        = string
  description = "Vercel API token"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel team ID"
  default     = null
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token"
  sensitive   = true
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "domain_name" {
  type        = string
  description = "Primary domain name"
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

variable "stripe_publishable_key" {
  type        = string
  description = "Stripe publishable key"
  sensitive   = true
}

variable "ga4_measurement_id" {
  type        = string
  description = "Google Analytics 4 measurement ID"
  sensitive   = true
}

variable "sentry_dsn" {
  type        = string
  description = "Sentry DSN"
  sensitive   = true
  default     = ""
}

# Locals
locals {
  project_config = {
    name = var.project_name
    framework = "vite"
    buildCommand = "npm run build:production"
    outputDirectory = "dist"
    installCommand = "npm ci"
    devCommand = "npm run dev"

    regions = ["fra1", "iad1", "hnd1"]

    build = {
      env = {
        VITE_BUILD_DATE = "$(date +%Y-%m-%d)"
        VITE_BUILD_TIME = "$(date +%H:%M:%S)"
        VITE_BUILD_SHA = "$VERCEL_GIT_COMMIT_SHA"
        NODE_ENV = "production"
        VITE_BUILD_TARGET = "production"
      }
    }

    functions = {
      "app/api/**/*.ts" = {
        runtime = "edge"
        maxDuration = 30
        regions = ["iad1", "fra1", "hnd1"]
        memory = 512
      }
      "app/edge/**/*.ts" = {
        runtime = "edge"
        maxDuration = 60
        regions = ["iad1", "fra1", "hnd1"]
        memory = 1024
      }
    }
  }
}

# Vercel Project
resource "vercel_project" "mariia_hub" {
  name      = local.project_config.name
  framework = local.project_config.framework

  build_command = local.project_config.buildCommand
  output_directory = local.project_config.outputDirectory
  install_command = local.project_config.installCommand
  dev_command = local.project_config.devCommand

  git_repository = {
    type = "github"
    repo = "ivanborysevych/mariia-hub-unified"
  }

  root_directory = "."

  # Environment variables
  environment = var.environment == "production" ? [
    {
      key = "VITE_SUPABASE_URL"
      value = var.supabase_project_url
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_SUPABASE_ANON_KEY"
      value = var.supabase_anon_key
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_STRIPE_PUBLISHABLE_KEY"
      value = var.stripe_publishable_key
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_GA4_MEASUREMENT_ID"
      value = var.ga4_measurement_id
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_SENTRY_DSN"
      value = var.sentry_dsn
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_APP_NAME"
      value = "Mariia Hub"
      target = ["production", "preview", "development"]
    },
    {
      key = "VITE_APP_URL"
      value = "https://mariaborysevych.com"
      target = ["production"]
    },
    {
      key = "VITE_APP_URL"
      value = "https://staging.mariaborysevych.com"
      target = ["preview"]
    },
    {
      key = "VITE_APP_ENV"
      value = var.environment
      target = ["production", "preview", "development"]
    }
  ] : [
    {
      key = "VITE_SUPABASE_URL"
      value = "http://localhost:54321"
      target = ["development"]
    },
    {
      key = "VITE_SUPABASE_ANON_KEY"
      value = "your-local-anon-key"
      target = ["development"]
    },
    {
      key = "VITE_APP_NAME"
      value = "Mariia Hub"
      target = ["development"]
    },
    {
      key = "VITE_APP_URL"
      value = "http://localhost:8080"
      target = ["development"]
    },
    {
      key = "VITE_APP_ENV"
      value = "development"
      target = ["development"]
    }
  ]
}

# Production Domain
resource "vercel_project_domain" "production" {
  project_id = vercel_project.mariia_hub.id
  domain     = var.domain_name

  depends_on = [cloudflare_record.vercel_dns]
}

# Staging Domain
resource "vercel_project_domain" "staging" {
  count      = var.environment == "production" ? 1 : 0
  project_id = vercel_project.mariia_hub.id
  domain     = "staging.${var.domain_name}"
}

# Cloudflare DNS Records
resource "cloudflare_record" "vercel_dns" {
  zone_id = data.cloudflare_zone.main.id
  name    = "@"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  ttl     = 3600
  proxied = true
}

resource "cloudflare_record" "vercel_dns_staging" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = data.cloudflare_zone.main.id
  name    = "staging"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  ttl     = 3600
  proxied = true
}

# Data sources
data "cloudflare_zone" "main" {
  name = var.domain_name
}

# Alias Record for Vercel
resource "cloudflare_record" "vercel_alias" {
  zone_id = data.cloudflare_zone.main.id
  name    = "_domainconnect"
  value   = "domainconnect.cloudflare.com"
  type    = "TXT"
  ttl     = 3600
}

# Edge Functions Configuration
resource "vercel_edge_config" "main" {
  project_id = vercel_project.mariia_hub.id

  config = {
    "CSP_NONCE" = random_id.csp_nonce.hex
    "BUILD_TIME" = timestamp()
    "ENVIRONMENT" = var.environment
  }
}

# Random ID for CSP nonce
resource "random_id" "csp_nonce" {
  byte_length = 16
}

# Environment Variables for different environments
resource "vercel_environment_variable" "supabase_url_prod" {
  project_id = vercel_project.mariia_hub.id
  key        = "VITE_SUPABASE_URL"
  value      = var.supabase_project_url
  target     = ["production"]
}

resource "vercel_environment_variable" "supabase_anon_key_prod" {
  project_id = vercel_project.mariia_hub.id
  key        = "VITE_SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production"]
}

resource "vercel_environment_variable" "stripe_key_prod" {
  project_id = vercel_project.mariia_hub.id
  key        = "VITE_STRIPE_PUBLISHABLE_KEY"
  value      = var.stripe_publishable_key
  target     = ["production"]
}

resource "vercel_environment_variable" "ga4_prod" {
  project_id = vercel_project.mariia_hub.id
  key        = "VITE_GA4_MEASUREMENT_ID"
  value      = var.ga4_measurement_id
  target     = ["production"]
}

resource "vercel_environment_variable" "sentry_prod" {
  project_id = vercel_project.mariia_hub.id
  key        = "VITE_SENTRY_DSN"
  value      = var.sentry_dsn
  target     = ["production"]
}

# Project Teams and Collaborators
resource "vercel_project_collaborator" "maintainer" {
  project_id = vercel_project.mariia_hub.id
  username   = "ivanborysevych"
  role       = "ADMIN"
}

# Webhook Configuration for deployments
resource "vercel_project_webhook" "deployments" {
  project_id = vercel_project.mariia_hub.id
  name       = "Deployment Webhook"
  url        = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  events     = ["deployment.created", "deployment.ready", "deployment.error"]
}

# Protection Rules
resource "vercel_protection_bypass" "production" {
  project_id = vercel_project.mariia_hub.id
  mode       = "protection"

  protection_bypass = {
    "type" = "ip"
    "value" = ["0.0.0.0/0"] # Allow all IPs during development
  }
}

# Deployment Protection
resource "vercel_deployment_protection" "production" {
  project_id = vercel_project.mariia_hub.id
  mode       = var.environment == "production" ? "production" : "preview"
}

# Analytics
resource "vercel_analytics_webhook" "main" {
  project_id = vercel_project.mariia_hub.id
  url        = "https://analytics.example.com/webhook"
  events     = ["deployment.created", "deployment.succeeded", "deployment.failed"]
}

# Log Drains for centralized logging
resource "vercel_log_drain" "datadog" {
  project_id = vercel_project.mariia_hub.id
  name       = "Datadog Log Drain"
  url        = "https://http-intake.logs.datadoghq.com/v1/input"
  secret     = "your-datadog-api-key"
  formats    = ["json", "text"]
}

# Rate Limiting
resource "vercel_rate_limit" "api" {
  project_id = vercel_project.mariia_hub.id
  path       = "/api/*"
  window     = "60s"
  limit      = 100
}

# Security Headers (additional to those in vercel.json)
resource "vercel_project_custom_header" "security" {
  project_id = vercel_project.mariia_hub.id
  source     = "/**"
  headers = {
    "X-Content-Type-Options" = "nosniff"
    "X-Frame-Options"        = "DENY"
    "X-XSS-Protection"       = "1; mode=block"
    "Referrer-Policy"        = "strict-origin-when-cross-origin"
    "Permissions-Policy"     = "geolocation=(), microphone=(), camera=()"
  }
}