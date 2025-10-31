output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.mariia_hub.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.mariia_hub.name
}

output "production_url" {
  description = "Production application URL"
  value       = "https://${vercel_project_domain.production.domain}"
}

output "staging_url" {
  description = "Staging application URL"
  value       = var.environment == "production" ? "https://staging.${vercel_project_domain.production.domain}" : null
}

output "vercel_project_url" {
  description = "Vercel dashboard URL for the project"
  value       = "https://vercel.com/${var.vercel_team_id != null ? var.vercel_team_id : "ivanborysevych"}/${vercel_project.mariia_hub.name}"
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID for DNS management"
  value       = data.cloudflare_zone.main.id
}

output "edge_config_id" {
  description = "Vercel Edge Config ID"
  value       = vercel_edge_config.main.id
}

output "edge_config_url" {
  description = "Vercel Edge Config dashboard URL"
  value       = "https://vercel.com/${var.vercel_team_id != null ? var.vercel_team_id : "ivanborysevych"}/edge-config/${vercel_edge_config.main.id}"
}

output "deployment_protection_mode" {
  description = "Deployment protection mode"
  value       = vercel_deployment_protection.production.mode
}

output "function_regions" {
  description = "Deployment regions for functions"
  value       = local.project_config.regions
}

output "project_environment" {
  description = "Current environment"
  value       = var.environment
}

output "build_settings" {
  description = "Build configuration settings"
  value = {
    framework          = local.project_config.framework
    build_command      = local.project_config.buildCommand
    output_directory   = local.project_config.outputDirectory
    install_command    = local.project_config.installCommand
    dev_command        = local.project_config.devCommand
    regions            = local.project_config.regions
    build_timeout      = var.build_timeout
    function_memory    = var.function_memory
    function_timeout   = var.function_timeout
  }
}

output "analytics_settings" {
  description = "Analytics and monitoring settings"
  value = {
    analytics_enabled       = var.enable_analytics
    web_vitals_enabled      = var.enable_web_vitals
    speed_insights_enabled  = var.enable_speed_insights
    edge_functions_enabled  = var.enable_edge_functions
    image_optimization      = var.enable_image_optimization
  }
}

output "security_settings" {
  description = "Security and protection settings"
  value = {
    rate_limit_api           = var.rate_limit_api
    cache_ttl_assets         = var.cache_ttl_assets
    cache_ttl_pages          = var.cache_ttl_pages
    deployment_protection    = vercel_deployment_protection.production.mode
    protection_bypass        = vercel_protection_bypass.production.mode
  }
}

output "integration_status" {
  description = "Status of external integrations"
  value = {
    supabase_configured     = var.supabase_project_url != "" && var.supabase_anon_key != ""
    stripe_configured       = var.stripe_publishable_key != ""
    analytics_configured    = var.ga4_measurement_id != ""
    sentry_configured       = var.sentry_dsn != ""
    ai_features_enabled     = var.enable_ai_features
    social_integrations     = var.enable_social_integrations
    monitoring_enabled      = var.enable_monitoring
  }
}

output "dns_records" {
  description = "DNS configuration details"
  value = {
    main_domain = {
      name = cloudflare_record.vercel_dns.name
      type = cloudflare_record.vercel_dns.type
      value = cloudflare_record.vercel_dns.value
      ttl = cloudflare_record.vercel_dns.ttl
      proxied = cloudflare_record.vercel_dns.proxied
    }
    staging_domain = var.environment == "production" ? {
      name = cloudflare_record.vercel_dns_staging[0].name
      type = cloudflare_record.vercel_dns_staging[0].type
      value = cloudflare_record.vercel_dns_staging[0].value
      ttl = cloudflare_record.vercel_dns_staging[0].ttl
      proxied = cloudflare_record.vercel_dns_staging[0].proxied
    } : null
  }
}

output "environment_variables_count" {
  description = "Number of configured environment variables"
  value = {
    production = length([for var in vercel_project.mariia_hub.environment : var if contains(var.target, "production")])
    preview = length([for var in vercel_project.mariia_hub.environment : var if contains(var.target, "preview")])
    development = length([for var in vercel_project.mariia_hub.environment : var if contains(var.target, "development")])
  }
}

output "team_information" {
  description = "Team and collaboration information"
  value = {
    team_id = var.vercel_team_id
    collaborators = [vercel_project_collaborator.maintainer.username]
    webhook_count = 1 # vercel_project_webhook.deployments
  }
}

output "backup_and_recovery" {
  description = "Backup and disaster recovery information"
  value = {
    state_bucket = "mariia-hub-terraform-state"
    state_region = "eu-west-1"
    state_encrypted = true
    backup_notifications = var.enable_backup_notifications
  }
}

output "performance_optimization" {
  description = "Performance optimization settings"
  value = {
    cdn_enabled = true
    edge_caching = true
    image_optimization = var.enable_image_optimization
    custom_cdn = var.custom_cdn_url != "" ? var.custom_cdn_url : "Vercel Edge Network"
    cache_headers_configured = true
    compression_enabled = true
  }
}

output "compliance_and_governance" {
  description = "Compliance and governance information"
  value = {
    gdpr_compliant = true
    csp_headers = true
    security_headers = true
    access_control = vercel_deployment_protection.production.mode
    audit_logging = var.enable_monitoring
    tags = var.tags
  }
}