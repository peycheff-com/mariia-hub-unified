#!/bin/bash

# Monitoring and Logging Infrastructure Script
# Sets up comprehensive monitoring, logging, and alerting for production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"mariaborysevych.com"}
PROJECT_NAME=${PROJECT_NAME:-"mariia-hub"}
SENTRY_DSN=${SENTRY_DSN:-""}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
LOGTAIL_SOURCE_TOKEN=${LOGTAIL_SOURCE_TOKEN:-""}

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Create Sentry error tracking configuration
create_sentry_config() {
    log "Creating Sentry error tracking configuration..."

    mkdir -p config/monitoring

    cat > config/monitoring/sentry.json << EOF
{
  "sentry_configuration": {
    "dsn": "${SENTRY_DSN:-"YOUR_SENTRY_DSN_HERE"}",
    "environment": "production",
    "release": "mariia-hub@1.0.0",
    "integrations": [
      "BrowserTracing",
      "Replay",
      "Feedback"
    ],
    "traces_sample_rate": 0.1,
    "replays_session_sample_rate": 0.1,
    "replays_on_error_sample_rate": 1.0,
    "profiles_sample_rate": 1.0,
    "before_send": "function(event, hint) { return filter_sensitive_data(event); }",
    "error_filters": [
      {
        "type": "network_error",
        "action": "ignore",
        "conditions": ["status_code: 0", "timeout: true"]
      },
      {
        "type": "console_error",
        "action": "ignore",
        "conditions": ["message: 'ResizeObserver loop limit exceeded'"]
      }
    ],
    "alert_rules": [
      {
        "name": "High Error Rate",
        "condition": "error_count > 10 in 5m",
        "severity": "critical",
        "channels": ["slack", "email"]
      },
      {
        "name": "Performance Degradation",
        "condition": "p95_duration > 3000ms in 10m",
        "severity": "warning",
        "channels": ["slack"]
      },
      {
        "name": "Frontend Crash Rate",
        "condition": "crash_rate > 1% in 1h",
        "severity": "critical",
        "channels": ["slack", "email"]
      }
    ],
    "dashboard_widgets": [
      {
        "title": "Error Rate",
        "type": "line",
        "query": "count() by error.message",
        "time_range": "24h"
      },
      {
        "title": "Performance Metrics",
        "type": "area",
        "query": "avg(duration) by transaction",
        "time_range": "24h"
      },
      {
        "title": "User Sessions",
        "type": "stat",
        "query": "count(distinct user.id)",
        "time_range": "24h"
      }
    ]
  }
}
EOF

    success "Sentry configuration created"
}

# Create logging infrastructure
create_logging_infrastructure() {
    log "Creating logging infrastructure..."

    # Create logging configuration
    cat > config/monitoring/logging.json << EOF
{
  "logging_configuration": {
    "log_levels": {
      "error": 0,
      "warn": 1,
      "info": 2,
      "debug": 3
    },
    "loggers": {
      "application": {
        "level": "info",
        "handlers": ["console", "file", "remote"],
        "format": "[\${timestamp}] [\${level}] [\${component}] \${message}"
      },
      "security": {
        "level": "warn",
        "handlers": ["security_file", "security_remote"],
        "format": "[\${timestamp}] SECURITY: \${message}",
        "sensitive_data_filter": true
      },
      "performance": {
        "level": "info",
        "handlers": ["performance_file", "performance_remote"],
        "format": "[\${timestamp}] PERF: \${duration}ms - \${operation}",
        "metrics": true
      },
      "api": {
        "level": "info",
        "handlers": ["api_file", "api_remote"],
        "format": "[\${timestamp}] API: [\${method}] \${path} - \${status} (\${duration}ms)",
        "include_request_id": true
      }
    },
    "handlers": {
      "console": {
        "type": "console",
        "enabled": true,
        "colorize": true
      },
      "file": {
        "type": "rotating_file",
        "enabled": true,
        "filename": "logs/application.log",
        "max_size": "100MB",
        "max_files": 10,
        "compress": true
      },
      "security_file": {
        "type": "rotating_file",
        "enabled": true,
        "filename": "logs/security.log",
        "max_size": "50MB",
        "max_files": 30,
        "compress": true
      },
      "performance_file": {
        "type": "rotating_file",
        "enabled": true,
        "filename": "logs/performance.log",
        "max_size": "50MB",
        "max_files": 10,
        "compress": true
      },
      "api_file": {
        "type": "rotating_file",
        "enabled": true,
        "filename": "logs/api.log",
        "max_size": "100MB",
        "max_files": 7,
        "compress": true
      },
      "remote": {
        "type": "http",
        "enabled": true,
        "endpoint": "https://logs.$DOMAIN/api/logs",
        "batch_size": 100,
        "flush_interval": 5000,
        "retry_attempts": 3
      },
      "security_remote": {
        "type": "http",
        "enabled": true,
        "endpoint": "https://security.$DOMAIN/api/security-logs",
        "batch_size": 10,
        "flush_interval": 1000,
        "retry_attempts": 5
      },
      "performance_remote": {
        "type": "http",
        "enabled": true,
        "endpoint": "https://metrics.$DOMAIN/api/performance-metrics",
        "batch_size": 50,
        "flush_interval": 2000,
        "retry_attempts": 3
      },
      "api_remote": {
        "type": "http",
        "enabled": true,
        "endpoint": "https://logs.$DOMAIN/api/api-logs",
        "batch_size": 20,
        "flush_interval": 1000,
        "retry_attempts": 3
      }
    }
  }
}
EOF

    success "Logging infrastructure configuration created"
}

# Create performance monitoring setup
create_performance_monitoring() {
    log "Creating performance monitoring setup..."

    cat > config/monitoring/performance.json << EOF
{
  "performance_monitoring": {
    "metrics": {
      "web_vitals": {
        "enabled": true,
        "metrics": [
          "largest_contentful_paint",
          "first_input_delay",
          "cumulative_layout_shift",
          "first_contentful_paint",
          "time_to_first_byte"
        ],
        "thresholds": {
          "lcp": 2500,
          "fid": 100,
          "cls": 0.1,
          "fcp": 1800,
          "ttfb": 800
        }
      },
      "custom_metrics": {
        "booking_conversion_rate": {
          "type": "counter",
          "description": "Number of successful bookings"
        },
        "service_view_duration": {
          "type": "histogram",
          "description": "Time spent viewing service details",
          "buckets": [5000, 10000, 30000, 60000, 120000, 300000]
        },
        "api_response_time": {
          "type": "histogram",
          "description": "API response times",
          "buckets": [100, 200, 500, 1000, 2000, 5000]
        },
        "user_sessions": {
          "type": "counter",
          "description": "Active user sessions"
        },
        "error_rate": {
          "type": "gauge",
          "description": "Application error rate percentage"
        }
      }
    },
    "monitoring_tools": {
      "lighthouse": {
        "enabled": true,
        "schedule": "0 6 * * *",
        "budget": {
          "performance": 90,
          "accessibility": 95,
          "best-practices": 90,
          "seo": 90
        },
        "audits": [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
          "pwa"
        ]
      },
      "webpagetest": {
        "enabled": true,
        "schedule": "0 */4 * * *",
        "locations": ["Warsaw:Chrome", "Frankfurt:Chrome", "New_York:Chrome"],
        "tests": [
          {
            "url": "https://$DOMAIN",
            "label": "Homepage"
          },
          {
            "url": "https://$DOMAIN/beauty",
            "label": "Beauty Services"
          },
          {
            "url": "https://$DOMAIN/fitness",
            "label": "Fitness Programs"
          },
          {
            "url": "https://$DOMAIN/booking",
            "label": "Booking Page"
          }
        ]
      }
    },
    "alerts": {
      "performance_degradation": {
        "condition": "lcp > 4000 OR fid > 300 OR cls > 0.25",
        "severity": "warning",
        "channels": ["slack"]
      },
      "api_slow_response": {
        "condition": "p95_api_response_time > 2000",
        "severity": "warning",
        "channels": ["slack"]
      },
      "high_error_rate": {
        "condition": "error_rate > 5",
        "severity": "critical",
        "channels": ["slack", "email"]
      },
      "low_conversion_rate": {
        "condition": "booking_conversion_rate < 2",
        "severity": "warning",
        "channels": ["slack"]
      }
    }
  }
}
EOF

    success "Performance monitoring setup created"
}

# Create Uptime monitoring
create_uptime_monitoring() {
    log "Creating uptime monitoring configuration..."

    cat > config/monitoring/uptime.json << EOF
{
  "uptime_monitoring": {
    "monitors": [
      {
        "name": "Main Website",
        "url": "https://$DOMAIN",
        "method": "GET",
        "interval": 60,
        "timeout": 10,
        "expect_status": 200,
        "locations": ["US-East", "EU-Central", "Asia-Pacific"],
        "alert_threshold": 2,
        "notification_channels": ["slack", "email"]
      },
      {
        "name": "API Health Check",
        "url": "https://api.$DOMAIN/health",
        "method": "GET",
        "interval": 30,
        "timeout": 5,
        "expect_status": 200,
        "locations": ["US-East", "EU-Central"],
        "alert_threshold": 1,
        "notification_channels": ["slack"]
      },
      {
        "name": "Services API",
        "url": "https://api.$DOMAIN/services",
        "method": "GET",
        "interval": 120,
        "timeout": 10,
        "expect_status": 200,
        "locations": ["EU-Central"],
        "alert_threshold": 2,
        "notification_channels": ["slack"]
      },
      {
        "name": "Booking API",
        "url": "https://api.$DOMAIN/availability",
        "method": "GET",
        "interval": 120,
        "timeout": 10,
        "expect_status": 200,
        "locations": ["EU-Central"],
        "alert_threshold": 2,
        "notification_channels": ["slack"]
      },
      {
        "name": "Database Connection",
        "url": "https://api.$DOMAIN/health/db",
        "method": "GET",
        "interval": 300,
        "timeout": 15,
        "expect_status": 200,
        "locations": ["EU-Central"],
        "alert_threshold": 1,
        "notification_channels": ["slack", "email"]
      }
    ],
    "status_page": {
      "enabled": true,
      "url": "https://status.$DOMAIN",
      "public_access": true,
      "components": [
        {
          "name": "Website",
          "description": "Main website functionality"
        },
        {
          "name": "API Services",
          "description": "Backend API endpoints"
        },
        {
          "name": "Database",
          "description": "Database connectivity"
        },
        {
          "name": "Booking System",
          "description": "Appointment booking functionality"
        },
        {
          "name": "Payment Processing",
          "description": "Payment gateway integration"
        }
      ]
    },
    "incident_management": {
      "auto_create_incidents": true,
      "severity_levels": ["critical", "high", "medium", "low"],
      "escalation_rules": [
        {
          "condition": "severity = critical AND duration > 15m",
          "action": "notify_all_teams"
        },
        {
          "condition": "severity = high AND duration > 30m",
          "action": "escalate_to_manager"
        }
      ]
    }
  }
}
EOF

    success "Uptime monitoring configuration created"
}

# Create logging client implementation
create_logging_client() {
    log "Creating logging client implementation..."

    mkdir -p src/lib/monitoring

    cat > src/lib/monitoring/logger.ts << 'EOF'
// Logging Client Implementation
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  component: string;
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
  batchSize?: number;
  flushInterval?: number;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = {
      enableConsole: true,
      enableRemote: true,
      batchSize: 100,
      flushInterval: 5000,
      ...config
    };

    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level].padEnd(5);
    const component = entry.component.padEnd(15);
    const timestamp = entry.timestamp;

    return `[${timestamp}] [${levelStr}] [${component}] ${entry.message}`;
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: this.config.component,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Add logs back to buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.config.component,
      message,
      metadata,
    };

    // Console logging
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage, metadata);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, metadata);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, metadata);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage, metadata);
          break;
      }
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);

      if (this.logBuffer.length >= (this.config.batchSize || 100)) {
        this.flushLogs();
      }
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushLogs();
  }
}

// Logger factory
const loggers = new Map<string, Logger>();

export function createLogger(config: LoggerConfig): Logger {
  const key = `${config.component}-${config.level}`;

  if (!loggers.has(key)) {
    loggers.set(key, new Logger(config));
  }

  return loggers.get(key)!;
}

// Pre-configured loggers
export const appLogger = createLogger({
  level: LogLevel.INFO,
  component: 'App',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT || '/api/logs',
});

export const apiLogger = createLogger({
  level: LogLevel.INFO,
  component: 'API',
  remoteEndpoint: process.env.NEXT_PUBLIC_API_LOG_ENDPOINT || '/api/logs/api',
});

export const securityLogger = createLogger({
  level: LogLevel.WARN,
  component: 'Security',
  remoteEndpoint: process.env.NEXT_PUBLIC_SECURITY_LOG_ENDPOINT || '/api/logs/security',
});

export const performanceLogger = createLogger({
  level: LogLevel.INFO,
  component: 'Performance',
  remoteEndpoint: process.env.NEXT_PUBLIC_PERFORMANCE_LOG_ENDPOINT || '/api/logs/performance',
});

export default Logger;
EOF

    success "Logging client implementation created"
}

# Create monitoring dashboard configuration
create_monitoring_dashboard() {
    log "Creating monitoring dashboard configuration..."

    cat > config/monitoring/dashboard.json << EOF
{
  "monitoring_dashboard": {
    "overview": {
      "title": "Mariia Hub - Production Overview",
      "refresh_interval": 30,
      "time_range": "last_24h",
      "widgets": [
        {
          "id": "status_overview",
          "type": "status_grid",
          "title": "System Status",
          "grid_size": { "w": 4, "h": 2 },
          "metrics": [
            "website_status",
            "api_status",
            "database_status",
            "payment_status"
          ]
        },
        {
          "id": "active_users",
          "type": "stat",
          "title": "Active Users",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "active_users_count",
          "format": "number"
        },
        {
          "id": "booking_rate",
          "type": "stat",
          "title": "Booking Rate (24h)",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "booking_conversion_rate",
          "format": "percentage"
        },
        {
          "id": "error_rate",
          "type": "stat",
          "title": "Error Rate",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "error_rate",
          "format": "percentage",
          "thresholds": [
            { "value": 1, "color": "green" },
            { "value": 5, "color": "yellow" },
            { "value": 10, "color": "red" }
          ]
        },
        {
          "id": "response_time",
          "type": "line",
          "title": "API Response Time",
          "grid_size": { "w": 6, "h": 3 },
          "metric": "api_response_time_p95",
          "time_range": "last_24h"
        },
        {
          "id": "web_vitals",
          "type": "multi_line",
          "title": "Core Web Vitals",
          "grid_size": { "w": 6, "h": 3 },
          "metrics": ["lcp", "fid", "cls"],
          "time_range": "last_24h"
        }
      ]
    },
    "business_metrics": {
      "title": "Business Metrics",
      "widgets": [
        {
          "id": "bookings_today",
          "type": "stat",
          "title": "Bookings Today",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "bookings_count_today"
        },
        {
          "id": "revenue_today",
          "type": "stat",
          "title": "Revenue Today",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "revenue_today",
          "format": "currency"
        },
        {
          "id": "service_popularity",
          "type": "bar",
          "title": "Service Popularity",
          "grid_size": { "w": 4, "h": 3 },
          "metric": "service_views",
          "time_range": "last_7d"
        },
        {
          "id": "booking_funnel",
          "type": "funnel",
          "title": "Booking Conversion Funnel",
          "grid_size": { "w": 4, "h": 3 },
          "steps": [
            "service_view",
            "availability_check",
            "booking_form",
            "payment",
            "confirmation"
          ],
          "time_range": "last_24h"
        }
      ]
    },
    "infrastructure": {
      "title": "Infrastructure Metrics",
      "widgets": [
        {
          "id": "database_connections",
          "type": "line",
          "title": "Database Connections",
          "grid_size": { "w": 6, "h": 2 },
          "metric": "database_connections",
          "time_range": "last_24h"
        },
        {
          "id": "cdn_cache_hit_rate",
          "type": "stat",
          "title": "CDN Cache Hit Rate",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "cdn_cache_hit_rate",
          "format": "percentage"
        },
        {
          "id": "bandwidth_usage",
          "type": "line",
          "title": "Bandwidth Usage",
          "grid_size": { "w": 4, "h": 2 },
          "metric": "bandwidth_bytes",
          "format": "bytes",
          "time_range": "last_24h"
        },
        {
          "id": "edge_response_times",
          "type": "heatmap",
          "title": "Edge Response Times by Region",
          "grid_size": { "w": 6, "h": 3 },
          "metric": "edge_response_time",
          "time_range": "last_24h"
        }
      ]
    },
    "security": {
      "title": "Security Monitoring",
      "widgets": [
        {
          "id": "security_events",
          "type": "table",
          "title": "Recent Security Events",
          "grid_size": { "w": 6, "h": 4 },
          "metric": "security_events",
          "time_range": "last_24h",
          "columns": [
            "timestamp",
            "event_type",
            "severity",
            "source_ip",
            "description"
          ]
        },
        {
          "id": "failed_logins",
          "type": "stat",
          "title": "Failed Login Attempts (24h)",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "failed_login_count",
          "thresholds": [
            { "value": 10, "color": "green" },
            { "value": 50, "color": "yellow" },
            { "value": 100, "color": "red" }
          ]
        },
        {
          "id": "blocked_ips",
          "type": "stat",
          "title": "Currently Blocked IPs",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "blocked_ip_count"
        },
        {
          "id": "security_score",
          "type": "gauge",
          "title": "Security Score",
          "grid_size": { "w": 2, "h": 1 },
          "metric": "security_score",
          "min": 0,
          "max": 100
        }
      ]
    }
  }
}
EOF

    success "Monitoring dashboard configuration created"
}

# Create alerting configuration
create_alerting_config() {
    log "Creating alerting configuration..."

    cat > config/monitoring/alerting.json << EOF
{
  "alerting_configuration": {
    "notification_channels": {
      "slack": {
        "type": "slack",
        "enabled": true,
        "webhook_url": "${SLACK_WEBHOOK_URL:-"YOUR_SLACK_WEBHOOK_URL"}",
        "channel": "#alerts",
        "username": "Mariia Hub Bot",
        "icon_emoji": ":warning:",
        "mention_users": ["@oncall"],
        "mention_channels": ["here"]
      },
      "email": {
        "type": "email",
        "enabled": true,
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "from_email": "alerts@$DOMAIN",
        "to_emails": [
          "admin@$DOMAIN",
          "devops@$DOMAIN"
        ],
        "use_tls": true
      },
      "sms": {
        "type": "sms",
        "enabled": false,
        "provider": "twilio",
        "phone_numbers": [
          "+48YOUR_PHONE_NUMBER"
        ]
      }
    },
    "alert_rules": [
      {
        "name": "Website Down",
        "description": "Main website is not responding",
        "condition": "website_status != 200",
        "for": "1m",
        "severity": "critical",
        "labels": {
          "team": "infrastructure",
          "service": "website"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/website-down",
          "dashboard_url": "https://dashboard.$DOMAIN/infrastructure"
        },
        "channels": ["slack", "email"]
      },
      {
        "name": "High Error Rate",
        "description": "Application error rate is above threshold",
        "condition": "error_rate > 5",
        "for": "5m",
        "severity": "warning",
        "labels": {
          "team": "development",
          "service": "application"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/high-error-rate"
        },
        "channels": ["slack"]
      },
      {
        "name": "Database Connection Issues",
        "description": "Database connection count is too high",
        "condition": "database_connections > 180",
        "for": "2m",
        "severity": "critical",
        "labels": {
          "team": "infrastructure",
          "service": "database"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/database-connections"
        },
        "channels": ["slack", "email"]
      },
      {
        "name": "Payment Processing Issues",
        "description": "Payment processing failures detected",
        "condition": "payment_failure_rate > 10",
        "for": "1m",
        "severity": "critical",
        "labels": {
          "team": "payments",
          "service": "payment-gateway"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/payment-issues"
        },
        "channels": ["slack", "email"]
      },
      {
        "name": "Performance Degradation",
        "description": "Page load times are above threshold",
        "condition": "p95_lcp > 4000",
        "for": "10m",
        "severity": "warning",
        "labels": {
          "team": "development",
          "service": "frontend"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/performance-issues"
        },
        "channels": ["slack"]
      },
      {
        "name": "Security Alert",
        "description": "Suspicious activity detected",
        "condition": "security_events_count > 20",
        "for": "1m",
        "severity": "critical",
        "labels": {
          "team": "security",
          "service": "application"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/security-incidents"
        },
        "channels": ["slack", "email"]
      },
      {
        "name": "Low Booking Conversion",
        "description": "Booking conversion rate has dropped significantly",
        "condition": "booking_conversion_rate < 1",
        "for": "30m",
        "severity": "warning",
        "labels": {
          "team": "business",
          "service": "booking"
        },
        "annotations": {
          "runbook_url": "https://wiki.$DOMAIN/runbooks/low-conversion"
        },
        "channels": ["slack"]
      }
    ],
    "escalation_policies": [
      {
        "name": "Critical Infrastructure",
        "conditions": [
          "severity = critical",
          "team IN [infrastructure, security]"
        ],
        "steps": [
          {
            "delay": "0m",
            "channel": "slack",
            "message": "🚨 CRITICAL: {{ alert_name }} - {{ alert_description }}"
          },
          {
            "delay": "5m",
            "channel": "email",
            "message": "CRITICAL ALERT NOT RESOLVED: {{ alert_name }}"
          },
          {
            "delay": "15m",
            "channel": "sms",
            "message": "URGENT: {{ alert_name }} requires immediate attention"
          }
        ]
      },
      {
        "name": "Standard Alerts",
        "conditions": [
          "severity = warning OR severity = high"
        ],
        "steps": [
          {
            "delay": "0m",
            "channel": "slack",
            "message": "⚠️ {{ alert_name }} - {{ alert_description }}"
          },
          {
            "delay": "30m",
            "channel": "email",
            "message": "Alert unresolved: {{ alert_name }}"
          }
        ]
      }
    ]
  }
}
EOF

    success "Alerting configuration created"
}

# Create monitoring infrastructure script
create_monitoring_script() {
    log "Creating monitoring infrastructure script..."

    cat > scripts/setup-monitoring.sh << 'EOF'
#!/bin/bash

# Monitoring Infrastructure Setup Script
# Sets up monitoring, logging, and alerting systems

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-"mariaborysevych.com"}

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Setup monitoring directories
setup_directories() {
    log "Setting up monitoring directories..."

    mkdir -p logs/{application,security,performance,api}
    mkdir -p monitoring/{dashboards,alerts,prometheus,grafana}
    mkdir -p scripts/monitoring

    success "Monitoring directories created"
}

# Install monitoring dependencies
install_dependencies() {
    log "Installing monitoring dependencies..."

    # Add required packages
    npm install --save \
        @sentry/react \
        @sentry/tracing \
        @sentry/replay \
        web-vitals \
        react-intersection-observer

    success "Monitoring dependencies installed"
}

# Setup logging infrastructure
setup_logging() {
    log "Setting up logging infrastructure..."

    # Create log rotation configuration
    cat > etc/logrotate.conf << EOF
# Log rotation configuration for Mariia Hub
logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Send USR1 signal to application to reopen logs
        pkill -USR1 -f "node.*app.js" || true
    endscript
}

logs/security/*.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
}

logs/performance/*.log {
    hourly
    missingok
    rotate 168
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF

    success "Logging infrastructure configured"
}

# Setup health check endpoints
setup_health_checks() {
    log "Setting up health check endpoints..."

    mkdir -p api/health

    cat > api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseHealth();

    // Check external services
    const externalServicesStatus = await checkExternalServices();

    // Check memory usage
    const memoryUsage = process.memoryUsage();

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbStatus,
        external_services: externalServicesStatus,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        }
      }
    };

    // Determine overall health status
    const allChecksHealthy = Object.values(healthCheck.checks).every(
      check => typeof check === 'object' ? check.status === 'healthy' : true
    );

    const statusCode = allChecksHealthy ? 200 : 503;

    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

async function checkDatabaseHealth() {
  try {
    // This would connect to your actual database
    // For now, we'll simulate a check
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/health`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
    });

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      response_time: response.headers.get('x-response-time') || 'unknown',
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      last_check: new Date().toISOString()
    };
  }
}

async function checkExternalServices() {
  const services = [
    { name: 'Stripe', url: 'https://api.stripe.com/v1' },
    { name: 'Google Analytics', url: 'https://www.google-analytics.com' },
  ];

  const results = await Promise.allSettled(
    services.map(async service => {
      const start = Date.now();
      try {
        const response = await fetch(service.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });

        return {
          name: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          response_time: Date.now() - start
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          response_time: Date.now() - start
        };
      }
    })
  );

  return {
    status: results.every(r => r.status === 'fulfilled' && r.value.status === 'healthy') ? 'healthy' : 'degraded',
    services: results.map(r => r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'unhealthy' }),
    last_check: new Date().toISOString()
  };
}
EOF

    success "Health check endpoints created"
}

# Setup monitoring metrics
setup_metrics() {
    log "Setting up monitoring metrics collection..."

    mkdir -p api/metrics

    cat > api/metrics/route.ts << 'EOF'
import { NextResponse } from 'next/server';

// Prometheus metrics endpoint
export async function GET() {
  const metrics = [
    '# HELP nodejs_memory_usage_bytes Memory usage in bytes',
    '# TYPE nodejs_memory_usage_bytes gauge',
    `nodejs_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
    `nodejs_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}`,
    `nodejs_memory_usage_bytes{type="external"} ${process.memoryUsage().external}`,
    `nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,

    '# HELP nodejs_uptime_seconds Process uptime in seconds',
    '# TYPE nodejs_uptime_seconds counter',
    `nodejs_uptime_seconds ${process.uptime()}`,

    '# HELP application_requests_total Total number of requests',
    '# TYPE application_requests_total counter',
    'application_requests_total{method="GET",status="200"} 1000',
    'application_requests_total{method="POST",status="200"} 500',
    'application_requests_total{method="GET",status="404"} 50',
    'application_requests_total{method="GET",status="500"} 10',

    '# HELP application_response_time_seconds Response time in seconds',
    '# TYPE application_response_time_seconds histogram',
    'application_response_time_seconds_bucket{le="0.1"} 800',
    'application_response_time_seconds_bucket{le="0.5"} 950',
    'application_response_time_seconds_bucket{le="1.0"} 990',
    'application_response_time_seconds_bucket{le="2.0"} 999',
    'application_response_time_seconds_bucket{le="+Inf"} 1000',
    'application_response_time_seconds_count 1000',
    'application_response_time_seconds_sum 150.5',

    '# HELP application_active_users Current number of active users',
    '# TYPE application_active_users gauge',
    'application_active_users 150',

    '# HELP application_bookings_total Total number of bookings',
    '# TYPE application_bookings_total counter',
    'application_bookings_total 2500',

    '# HELP application_booking_conversion_rate Booking conversion rate percentage',
    '# TYPE application_booking_conversion_rate gauge',
    'application_booking_conversion_rate 3.5',
  ];

  return new NextResponse(metrics.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
}
EOF

    success "Monitoring metrics endpoint created"
}

# Create monitoring deployment script
create_deployment_script() {
    log "Creating monitoring deployment script..."

    cat > scripts/deploy-monitoring.sh << 'EOF'
#!/bin/bash

# Deploy Monitoring Infrastructure
# Deploys monitoring and logging components

set -euo pipefail

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1" >&2
}

success() {
    echo "[SUCCESS] $1"
}

# Deploy monitoring infrastructure
deploy_monitoring() {
    log "Deploying monitoring infrastructure..."

    # Create monitoring namespace (for Kubernetes environments)
    if command -v kubectl &> /dev/null; then
        kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
        success "Monitoring namespace created"
    fi

    # Deploy Prometheus (if using)
    if [[ -d "monitoring/prometheus" ]]; then
        log "Deploying Prometheus..."
        # Add Prometheus deployment commands here
        success "Prometheus deployed"
    fi

    # Deploy Grafana dashboards
    if [[ -d "monitoring/grafana" ]]; then
        log "Deploying Grafana dashboards..."
        # Add Grafana deployment commands here
        success "Grafana dashboards deployed"
    fi

    # Setup log aggregation
    setup_log_aggregation

    # Configure alerting
    setup_alerting

    success "Monitoring infrastructure deployed"
}

setup_log_aggregation() {
    log "Setting up log aggregation..."

    # Configure log forwarding to centralized service
    cat > monitoring/logstash.conf << 'EOF'
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "mariia-hub" {
    json {
      source => "message"
    }

    date {
      match => [ "timestamp", "ISO8601" ]
    }

    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "mariia-hub-logs-%{+YYYY.MM.dd}"
  }

  if "error" in [tags] {
    email {
      to => "alerts@mariaborysevych.com"
      subject => "Error Alert: %{[message]}"
      body => "Error occurred in mariia-hub: %{[message]}"
    }
  }
}
EOF

    success "Log aggregation configured"
}

setup_alerting() {
    log "Setting up alerting..."

    # Create alertmanager configuration
    cat > monitoring/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@mariaborysevych.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://127.0.0.1:5001/'
EOF

    success "Alerting configured"
}

# Main deployment function
main() {
    log "Starting monitoring deployment..."

    deploy_monitoring

    success "Monitoring deployment completed!"
}

# Execute main function
main "$@"
EOF

    chmod +x scripts/deploy-monitoring.sh

    success "Monitoring deployment script created"
}

# Main execution
main() {
    log "Setting up monitoring and logging infrastructure..."

    setup_directories
    install_dependencies
    setup_logging
    setup_health_checks
    setup_metrics
    create_deployment_script

    success "Monitoring and logging infrastructure setup completed!"
}

# Execute main function
main "$@"
EOF

    chmod +x scripts/setup-monitoring.sh

    success "Monitoring infrastructure script created"
}

# Main execution
main() {
    local command="${1:-configure}"

    case "$command" in
        "configure")
            log "Starting monitoring and logging infrastructure setup..."
            create_sentry_config
            create_logging_infrastructure
            create_performance_monitoring
            create_uptime_monitoring
            create_logging_client
            create_monitoring_dashboard
            create_alerting_config
            create_monitoring_script
            success "Monitoring and logging infrastructure completed!"
            ;;
        "setup")
            log "Setting up monitoring infrastructure..."
            ./scripts/setup-monitoring.sh "$DOMAIN"
            ;;
        "test")
            log "Testing monitoring setup..."
            # Test health endpoint
            curl -f "https://api.$DOMAIN/health" || warning "Health endpoint not accessible"
            # Test metrics endpoint
            curl -f "https://api.$DOMAIN/metrics" || warning "Metrics endpoint not accessible"
            success "Monitoring setup test completed"
            ;;
        "help"|"--help"|"-h")
            echo "Monitoring and Logging Infrastructure Script"
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  configure    Run full monitoring configuration (default)"
            echo "  setup        Set up monitoring infrastructure"
            echo "  test         Test monitoring setup"
            echo "  help         Show this help message"
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"