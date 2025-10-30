output "project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main.id
}

output "project_name" {
  description = "Supabase project name"
  value       = supabase_project.main.name
}

output "project_url" {
  description = "Supabase project URL"
  value       = supabase_project.main.api_url
}

output "database_url" {
  description = "Database connection URL"
  value       = supabase_project.main.database_url
  sensitive   = true
}

output "database_password" {
  description = "Database password (generated or provided)"
  value       = var.database_password != "" ? var.database_password : random_password.db_password[0].result
  sensitive   = true
}

output "anon_key" {
  description = "Anonymous API key"
  value       = supabase_project_api_key.anon.key
  sensitive   = true
}

output "service_role_key" {
  description = "Service role API key"
  value       = supabase_project_api_key.service_role.key
  sensitive   = true
}

output "jwt_secret" {
  description = "JWT secret"
  value       = supabase_jwt_secret.main.jwt_secret
  sensitive   = true
}

output "rest_url" {
  description = "REST API endpoint URL"
  value       = supabase_project.main.api_rest_url
}

output "graphql_url" {
  description = "GraphQL endpoint URL"
  value       = supabase_project.main.api_graphql_url
}

output "storage_url" {
  description = "Storage API URL"
  value       = supabase_project.main.api_storage_url
}

output "functions_url" {
  description = "Edge Functions URL"
  value       = supabase_project.main.api_functions_url
}

output "realtime_url" {
  description = "Realtime WebSocket URL"
  value       = supabase_project.main.api_realtime_url
}

output "status" {
  description = "Project status"
  value       = supabase_project.main.status
}

output "region" {
  description = "Project region"
  value       = supabase_project.main.region
}

output "plan" {
  description = "Project plan"
  value       = supabase_project.main.plan
}

output "storage_buckets" {
  description = "Storage bucket information"
  value = {
    for bucket in supabase_storage_bucket.buckets : bucket.name => {
      id = bucket.id
      name = bucket.name
      public = bucket.public
      allowed_mime_types = bucket.allowed_mime_types
      file_size_limit = bucket.file_size_limit
      created_at = bucket.created_at
    }
  }
}

output "auth_settings" {
  description = "Authentication configuration"
  value = {
    site_url = supabase_auth_setting.main.site_url
    redirect_urls = supabase_auth_setting.main.redirect_urls
    enable_signup = supabase_auth_setting.main.enable_signup
    enable_email_confirmations = supabase_auth_setting.main.enable_email_confirmations
    enable_phone_signups = supabase_auth_setting.main.enable_phone_signups
    password_min_length = supabase_auth_setting.main.password_min_length
    session_timeout = supabase_auth_setting.main.session_timeout
    max_request_duration = supabase_auth_setting.main.max_request_duration
  }
}

output "jwt_configuration" {
  description = "JWT token configuration"
  value = {
    jwt_expiry = supabase_jwt_secret.main.jwt_expiry
    refresh_token_expiry = supabase_jwt_secret.main.refresh_token_expiry
  }
}

output "database_configuration" {
  description = "Database configuration"
  value = {
    enable_postgrest = supabase_project.main.enable_postgrest
    enable_database_backup = supabase_project.main.enable_database_backup
    backup_retention_days = supabase_project.main.backup_retention_days
    enable_pitr = supabase_project.main.enable_pitr
    enable_connection_pooling = supabase_project.main.enable_connection_pooling
    connection_pool_size = supabase_project.main.connection_pool_size
    log_level = supabase_project.main.log_level
  }
}

output "feature_flags" {
  description = "Enabled features"
  value = {
    enable_realtime = supabase_project.main.enable_realtime
    enable_storage = supabase_project.main.enable_storage
    enable_edge_functions = supabase_project.main.enable_edge_functions
    enable_rls = supabase_project.main.enable_rls
    enable_audit_logging = supabase_project.main.enable_audit_logging
    enable_security_headers = supabase_project.main.enable_security_headers
    enable_cors = var.enable_cors
  }
}

output "security_configuration" {
  description = "Security settings"
  value = {
    enable_security_headers = supabase_project.main.enable_security_headers
    enable_rls = supabase_project.main.enable_rls
    enable_audit_logging = supabase_project.main.enable_audit_logging
    rate_limiting_enabled = supabase_project.main.rate_limiting_enabled
    rate_limiting_requests_per_second = supabase_project.main.rate_limiting_requests_per_second
    rate_limiting_burst_size = supabase_project.main.rate_limiting_burst_size
    custom_headers = supabase_project.main.custom_headers
  }
}

output "oauth_providers" {
  description = "OAuth providers configuration"
  value = {
    for provider in supabase_oauth_provider.* : provider.provider_name => {
      enabled = true
      provider_name = provider.provider_name
    }
  }
}

output "edge_functions" {
  description = "Edge functions configuration"
  value = var.enable_edge_functions ? {
    webhook_handler = {
      name = supabase_edge_function.webhook_handler[0].name
      verify_jwt = supabase_edge_function.webhook_handler[0].verify_jwt
      created_at = supabase_edge_function.webhook_handler[0].created_at
    }
    ai_processor = {
      name = supabase_edge_function.ai_processor[0].name
      verify_jwt = supabase_edge_function.ai_processor[0].verify_jwt
      created_at = supabase_edge_function.ai_processor[0].created_at
    }
  } : {}
}

output "backup_configuration" {
  description = "Backup configuration"
  value = var.enable_database_backup ? {
    daily_backup_id = supabase_database_backup.daily[0].id
    retention_days = supabase_database_backup.daily[0].retention_days
    description = supabase_database_backup.daily[0].description
    created_at = supabase_database_backup.daily[0].created_at
  } : null
}

output "email_templates" {
  description = "Email templates configuration"
  value = {
    signup_confirmation = {
      subject = supabase_auth_template.signup_confirmation.subject
      template_type = supabase_auth_template.signup_confirmation.template_type
    }
    password_reset = {
      subject = supabase_auth_template.password_reset.subject
      template_type = supabase_auth_template.password_reset.template_type
    }
  }
}

output "cors_configuration" {
  description = "CORS configuration"
  value = var.enable_cors ? {
    enabled = var.enable_cors
    origins = var.cors_origins
    methods = var.cors_methods
    headers = var.cors_headers
  } : null
}

output "connection_info" {
  description = "Connection information summary"
  value = {
    project_id = supabase_project.main.id
    api_url = supabase_project.main.api_url
    database_url = "${supabase_project.main.database_url}?sslmode=require"
    storage_url = supabase_project.main.api_storage_url
    functions_url = supabase_project.main.api_functions_url
    realtime_url = supabase_project.main.api_realtime_url
  }
  sensitive = true
}

output "project_dashboard_url" {
  description = "URL to Supabase project dashboard"
  value       = "https://app.supabase.com/project/${supabase_project.main.id}"
}

output "api_keys_summary" {
  description = "API keys summary for documentation"
  value = {
    public_anon_key = "anon_key"
    service_role_key = "service_role_key"
    jwt_secret = "jwt_secret"
  }
}

output "monitoring_status" {
  description = "Monitoring and alerting status"
  value = {
    monitoring_enabled = var.enable_monitoring
    audit_logging_enabled = supabase_project.main.enable_audit_logging
    alert_email = var.alert_email
    log_level = supabase_project.main.log_level
  }
}

output "compliance_status" {
  description = "Compliance and security status"
  value = {
    rls_enabled = supabase_project.main.enable_rls
    audit_logging_enabled = supabase_project.main.enable_audit_logging
    security_headers_enabled = supabase_project.main.enable_security_headers
    rate_limiting_enabled = supabase_project.main.rate_limiting_enabled
    backup_enabled = supabase_project.main.enable_database_backup
    pitr_enabled = supabase_project.main.enable_pitr
  }
}

output "database_extensions" {
  description = "Enabled database extensions"
  value = {
    for ext in supabase_database_extension.extensions : ext.name => {
      name = ext.name
      version = ext.version
      enabled = true
    }
  }
}

output "storage_policies" {
  description = "Storage access policies"
  value = {
    service_images_policy = {
      bucket_id = supabase_storage_policy.service_images_policy.bucket_id
      name = supabase_storage_policy.service_images_policy.name
      operation = supabase_storage_policy.service_images_policy.operation
    }
    profile_images_policy = {
      bucket_id = supabase_storage_policy.profile_images_policy.bucket_id
      name = supabase_storage_policy.profile_images_policy.name
      operation = supabase_storage_policy.profile_images_policy.operation
    }
    documents_policy = {
      bucket_id = supabase_storage_policy.documents_policy.bucket_id
      name = supabase_storage_policy.documents_policy.name
      operation = supabase_storage_policy.documents_policy.operation
    }
  }
}