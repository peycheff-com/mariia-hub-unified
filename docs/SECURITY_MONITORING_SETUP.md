# Security Monitoring Setup and Configuration

## Overview

This document provides comprehensive guidance for setting up and configuring security monitoring across the Mariia Hub platform. It covers technical implementation, monitoring strategies, alerting procedures, and ongoing management of security monitoring systems.

## 📋 Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Logging Configuration](#logging-configuration)
3. [Security Monitoring Tools](#security-monitoring-tools)
4. [Alert Configuration](#alert-configuration)
5. [Dashboard Setup](#dashboard-setup)
6. [Integration Configuration](#integration-configuration)
7. [Monitoring Procedures](#monitoring-procedures)
8. [Maintenance and Updates](#maintenance-and-updates)

---

## 1. Monitoring Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Monitoring Architecture              │
├─────────────────────────────────────────────────────────────────┤
│  Data Sources                                                   │
│  ├── Application Logs     ├── System Logs      ├── Network Logs │
│  ├── Security Events      ├── Access Logs      ├── Audit Logs   │
│  ├── Database Activity    ├── API Calls        ├── User Actions │
│  └── Third-Party Logs     └── Cloud Services   └── IoT Devices  │
├─────────────────────────────────────────────────────────────────┤
│  Data Collection Layer                                           │
│  ├── Log Forwarders        ├── Metrics Collectors                │
│  ├── Event Aggregators     ├── Security Agents                  │
│  └── Stream Processors     └── Data Normalizers                 │
├─────────────────────────────────────────────────────────────────┤
│  Processing Layer                                               │
│  ├── SIEM Platform         ├── Threat Detection                  │
│  ├── Analytics Engine      ├── Machine Learning                  │
│  └── Correlation Engine    └── Anomaly Detection                 │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer                                            │
│  ├── Security Dashboard    ├── Alerting System                  │
│  ├── Reporting Tools       ├── Mobile Apps                       │
│  └── API Endpoints         └── Integration Interfaces           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### Core Monitoring Platform
- **SIEM**: Custom security monitoring system
- **Log Management**: Structured logging with Elasticsearch
- **Metrics**: Prometheus + Grafana for system metrics
- **Alerting**: Custom alerting system with multiple channels
- **Storage**: Encrypted storage with appropriate retention

#### Integration Points
- **Supabase**: Database activity and authentication events
- **Vercel**: Application logs and performance metrics
- **Cloudflare**: Network security events and traffic analysis
- **Stripe**: Payment processing events and security alerts
- **Custom Applications**: Application-specific security events

### 1.3 Deployment Architecture

#### Production Environment
```yaml
# Docker Compose for Security Monitoring
version: '3.8'

services:
  security-monitoring:
    build: ./security-monitoring
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    ports:
      - "3000:3000"
    networks:
      - security-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=true
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - security-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - security-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - security-network

volumes:
  elasticsearch-data:
  prometheus-data:
  grafana-data:

networks:
  security-network:
    driver: bridge
```

---

## 2. Logging Configuration

### 2.1 Structured Logging Implementation

#### Node.js Application Logging
```typescript
// logging-config.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Log structure interface
interface SecurityLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
}

// Create logger configuration
const createSecurityLogger = (serviceName: string) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    },
    transports: [
      // Console output for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),

      // File output for application logs
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: winston.format.json()
      }),

      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        format: winston.format.json()
      }),

      // Elasticsearch for SIEM integration
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        },
        index: `security-logs-${serviceName}-${new Date().toISOString().slice(0, 7)}`,
        transform: (logData: any) => {
          // Add security-specific metadata
          return {
            ...logData,
            '@timestamp': logData.timestamp,
            log_type: 'security',
            environment: process.env.NODE_ENV
          };
        }
      })
    ],

    // Exception handling
    exceptionHandlers: [
      new winston.transports.File({
        filename: `logs/${serviceName}-exceptions.log`
      })
    ],

    // Rejection handling
    rejectionHandlers: [
      new winston.transports.File({
        filename: `logs/${serviceName}-rejections.log`
      })
    ]
  });

  return logger;
};

// Security-specific logging functions
export class SecurityLogger {
  private logger: winston.Logger;

  constructor(serviceName: string) {
    this.logger = createSecurityLogger(serviceName);
  }

  // Authentication events
  logAuthEvent(event: {
    user_id?: string;
    action: 'login' | 'logout' | 'register' | 'password_reset';
    result: 'success' | 'failure';
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.info('Authentication event', {
      event_type: 'authentication',
      ...event
    });
  }

  // Authorization events
  logAuthzEvent(event: {
    user_id: string;
    resource: string;
    action: string;
    result: 'allowed' | 'denied';
    metadata?: Record<string, any>;
  }) {
    this.logger.info('Authorization event', {
      event_type: 'authorization',
      ...event
    });
  }

  // Data access events
  logDataAccess(event: {
    user_id: string;
    data_type: string;
    action: string;
    result: 'success' | 'failure';
    metadata?: Record<string, any>;
  }) {
    this.logger.info('Data access event', {
      event_type: 'data_access',
      ...event
    });
  }

  // Security incidents
  logSecurityIncident(event: {
    incident_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected_systems: string[];
    metadata?: Record<string, any>;
  }) {
    this.logger.warn('Security incident', {
      event_type: 'security_incident',
      ...event
    });
  }

  // System security events
  logSystemEvent(event: {
    system: string;
    event_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.info('System security event', {
      ...event
    });
  }
}
```

#### Frontend Security Logging
```typescript
// client-security-logger.ts
interface ClientSecurityEvent {
  timestamp: string;
  session_id: string;
  user_id?: string;
  event_type: string;
  action?: string;
  result?: 'success' | 'failure';
  metadata?: Record<string, any>;
  browser_info: {
    user_agent: string;
    language: string;
    screen_resolution: string;
    timezone: string;
  };
}

export class ClientSecurityLogger {
  private sessionId: string;
  private userId?: string;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Log page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logEvent({
        event_type: 'page_visibility_change',
        metadata: {
          hidden: document.hidden,
          visibility_state: document.visibilityState
        }
      });
    });

    // Log CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.logEvent({
        event_type: 'csp_violation',
        action: event.violatedDirective,
        metadata: {
          blocked_uri: event.blockedURI,
          referrer: event.referrer,
          source_file: event.sourceFile
        }
      });
    });

    // Log console access attempts
    const originalLog = console.log;
    console.log = (...args) => {
      if (args.some(arg => typeof arg === 'string' && arg.includes('debug'))) {
        this.logEvent({
          event_type: 'console_debug_attempt',
          metadata: { args: args.slice(0, 3) }
        });
      }
      return originalLog.apply(console, args);
    };
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  logEvent(event: Partial<ClientSecurityEvent>): void {
    const fullEvent: ClientSecurityEvent = {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      event_type: event.event_type || 'unknown',
      action: event.action,
      result: event.result,
      metadata: event.metadata,
      browser_info: {
        user_agent: navigator.userAgent,
        language: navigator.language,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Send to server
    this.sendToServer(fullEvent).catch(error => {
      console.error('Failed to send security event:', error);
    });
  }

  private async sendToServer(event: ClientSecurityEvent): Promise<void> {
    try {
      await fetch(`${this.endpoint}/api/security-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': process.env.REACT_APP_VERSION || 'unknown'
        },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch (error) {
      // Fallback to localStorage for retry
      this.storeForRetry(event);
    }
  }

  private storeForRetry(event: ClientSecurityEvent): void {
    const pendingEvents = JSON.parse(localStorage.getItem('pendingSecurityEvents') || '[]');
    pendingEvents.push(event);

    // Keep only last 50 events
    if (pendingEvents.length > 50) {
      pendingEvents.splice(0, pendingEvents.length - 50);
    }

    localStorage.setItem('pendingSecurityEvents', JSON.stringify(pendingEvents));
  }

  retryPendingEvents(): void {
    const pendingEvents = JSON.parse(localStorage.getItem('pendingSecurityEvents') || '[]');

    pendingEvents.forEach(async (event: ClientSecurityEvent) => {
      try {
        await this.sendToServer(event);
      } catch (error) {
        console.error('Failed to retry security event:', error);
      }
    });

    localStorage.removeItem('pendingSecurityEvents');
  }
}
```

### 2.2 Database Activity Monitoring

#### PostgreSQL Audit Logging
```sql
-- Enable pgaudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit settings
-- Track all DDL statements
ALTER SYSTEM SET pgaudit.log = 'ddl, role, read, write';

-- Track connection and disconnection
ALTER SYSTEM SET pgaudit.log_connection = 'on';

-- Track session-level activities
ALTER SYSTEM SET pgaudit.log_parameter = 'on';

-- Apply configuration changes
SELECT pg_reload_conf();

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit table for custom tracking
CREATE TABLE audit.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT,
    database_name TEXT,
    schema_name TEXT,
    object_name TEXT,
    command TEXT,
    statement TEXT,
    client_ip INET,
    user_agent TEXT,
    session_id TEXT,
    application_name TEXT
);

-- Create function for custom audit logging
CREATE OR REPLACE FUNCTION audit.log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.security_events (
        username,
        database_name,
        schema_name,
        object_name,
        command,
        statement,
        client_ip,
        user_agent,
        session_id,
        application_name
    ) VALUES (
        current_user,
        current_database(),
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        TG_OP,
        current_query(),
        inet_client_addr(),
        current_setting('request.headers.user_agent', true),
        current_setting('request.session_id', true),
        current_setting('application_name', true)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for sensitive tables
CREATE TRIGGER audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit.log_security_event();

CREATE TRIGGER audit_bookings
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION audit.log_security_event();

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit.log_security_event();
```

#### Database Monitoring Queries
```sql
-- Monitor failed login attempts
SELECT
    event_time,
    username,
    client_ip,
    statement
FROM audit.security_events
WHERE command = 'LOGIN' AND statement LIKE '%failure%'
ORDER BY event_time DESC
LIMIT 100;

-- Monitor suspicious activities
SELECT
    username,
    COUNT(*) as activity_count,
    MAX(event_time) as last_activity,
    array_agg(DISTINCT client_ip) as ip_addresses
FROM audit.security_events
WHERE event_time > NOW() - INTERVAL '24 hours'
GROUP BY username
HAVING COUNT(*) > 1000 OR array_length(array_agg(DISTINCT client_ip), 1) > 5;

-- Monitor access to sensitive data
SELECT
    username,
    object_name,
    command,
    COUNT(*) as access_count,
    MAX(event_time) as last_access
FROM audit.security_events
WHERE schema_name = 'public'
    AND object_name IN ('customers', 'payments', 'users')
    AND event_time > NOW() - INTERVAL '7 days'
GROUP BY username, object_name, command
ORDER BY access_count DESC;
```

### 2.3 API Security Monitoring

#### Express.js Middleware
```typescript
// api-security-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { SecurityLogger } from './logging-config';

export class APISecurityMiddleware {
  private securityLogger: SecurityLogger;

  constructor() {
    this.securityLogger = new SecurityLogger('api-gateway');
  }

  // Request logging middleware
  requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Log request start
      this.securityLogger.logSystemEvent({
        system: 'api-gateway',
        event_type: 'api_request',
        severity: 'low',
        description: `API request: ${req.method} ${req.path}`,
        metadata: {
          method: req.method,
          path: req.path,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          user_id: req.user?.id,
          request_size: req.get('Content-Length') || 0
        }
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const responseTime = Date.now() - startTime;

        securityLogger.logSystemEvent({
          system: 'api-gateway',
          event_type: 'api_response',
          severity: 'low',
          description: `API response: ${res.statusCode} for ${req.method} ${req.path}`,
          metadata: {
            method: req.method,
            path: req.path,
            status_code: res.statusCode,
            response_time,
            user_id: req.user?.id,
            response_size: res.get('Content-Length') || 0
          }
        });

        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  // Rate limiting middleware
  rateLimiter(options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  }) {
    const requests = new Map<string, number[]>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Clean old requests
      const userRequests = requests.get(key) || [];
      const validRequests = userRequests.filter(time => time > windowStart);

      if (validRequests.length >= options.maxRequests) {
        this.securityLogger.logSecurityIncident({
          incident_type: 'rate_limit_exceeded',
          severity: 'medium',
          description: `Rate limit exceeded for IP: ${key}`,
          affected_systems: ['api-gateway'],
          metadata: {
            ip_address: key,
            request_count: validRequests.length,
            path: req.path
          }
        });

        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(options.windowMs / 1000)
        });
      }

      validRequests.push(now);
      requests.set(key, validRequests);

      next();
    };
  }

  // Suspicious activity detection
  suspiciousActivityDetector() {
    const suspiciousPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /drop\s+table/i,
      /<script/i,
      /javascript:/i,
      /onload\s*=/i
    ];

    return (req: Request, res: Response, next: NextFunction) => {
      const combinedInput = JSON.stringify(req.body) + req.path + req.get('User-Agent');

      const detectedPattern = suspiciousPatterns.find(pattern => pattern.test(combinedInput));

      if (detectedPattern) {
        this.securityLogger.logSecurityIncident({
          incident_type: 'suspicious_input_detected',
          severity: 'high',
          description: `Suspicious input pattern detected: ${detectedPattern}`,
          affected_systems: ['api-gateway'],
          metadata: {
            pattern: detectedPattern.source,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            path: req.path,
            input_preview: combinedInput.substring(0, 200)
          }
        });
      }

      next();
    };
  }
}
```

---

## 3. Security Monitoring Tools

### 3.1 SIEM Configuration

#### Elasticsearch Index Templates
```json
{
  "index_patterns": ["security-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "index.refresh_interval": "5s",
      "index.lifecycle.name": "security-logs-policy",
      "index.lifecycle.rollover_alias": "security-logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date",
          "format": "strict_date_optional_time||epoch_millis"
        },
        "level": {
          "type": "keyword"
        },
        "service": {
          "type": "keyword"
        },
        "event_type": {
          "type": "keyword"
        },
        "user_id": {
          "type": "keyword"
        },
        "ip_address": {
          "type": "ip"
        },
        "user_agent": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "session_id": {
          "type": "keyword"
        },
        "resource": {
          "type": "keyword"
        },
        "action": {
          "type": "keyword"
        },
        "result": {
          "type": "keyword"
        },
        "metadata": {
          "type": "object",
          "dynamic": true
        },
        "trace_id": {
          "type": "keyword"
        },
        "span_id": {
          "type": "keyword"
        },
        "severity": {
          "type": "keyword"
        },
        "environment": {
          "type": "keyword"
        }
      }
    }
  }
}
```

#### Logstash Configuration
```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }

  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  # Parse security events
  if [event_type] {
    mutate {
      add_field => { "[@metadata][log_type]" => "security" }
    }
  }

  # Parse IP addresses for geo-location
  if [ip_address] {
    geoip {
      source => "ip_address"
      target => "geoip"
    }
  }

  # Parse user agents
  if [user_agent] {
    useragent {
      source => "user_agent"
      target => "user_agent_parsed"
    }
  }

  # Enrich with threat intelligence
  if [ip_address] {
    http {
      url => "http://threat-intelligence/api/check"
      query => { "ip" => "%{ip_address}" }
      target => "threat_intelligence"
    }
  }

  # Add timestamp if missing
  if ![timestamp] {
    mutate {
      add_field => { "timestamp" => "%{@timestamp}" }
    }
  }

  # Convert timestamps
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }

  # Remove sensitive data from logs
  mutate {
    remove_field => [ "password", "token", "credit_card" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    user => "elastic"
    password => "changeme"
    index => "security-logs-%{+YYYY.MM}"
  }

  # Output to alerting system
  http {
    url => "http://alerting-system/api/events"
    http_method => "post"
    format => "json"
    mapping => {
      "severity" => "%{severity}"
      "event_type" => "%{event_type}"
      "description" => "%{message}"
      "source_ip" => "%{ip_address}"
      "user_id" => "%{user_id}"
    }
  }
}
```

### 3.2 Threat Detection Rules

#### Sigma Rule Format
```yaml
# Detection rule for brute force attacks
title: Brute Force Attack Detected
id: bf_attack_001
description: Multiple failed login attempts from the same IP
status: production
author: Security Team
date: 2025/10/30
logsource:
  product: mariia-hub
  service: authentication
detection:
  selection:
    event_type: authentication
    result: failure
  timeframe: 5m
  condition:
    selection and count() by ip_address > 5
fields:
  - ip_address
  - user_id
  - timestamp
  - user_agent
falsepositives:
  - Users with incorrect passwords
  - Automated password testing
level: high
tags:
  - attack.t1110
  - attack.brute_force

---
# Detection rule for suspicious SQL injection attempts
title: SQL Injection Attempt
id: sqli_001
description: Potential SQL injection attempt detected
status: production
author: Security Team
date: 2025/10/30
logsource:
  product: mariia-hub
  service: api_gateway
detection:
  keywords:
    - 'union select'
    - 'or 1=1'
    - 'drop table'
    - 'insert into'
    - 'update set'
    - 'delete from'
    - "' OR '1'='1"
    - "' UNION"
  condition: keywords
fields:
  - ip_address
  - user_agent
  - request_path
  - request_body
falsepositives:
  - Valid user input containing SQL keywords
  - Application names containing SQL keywords
level: high
tags:
  - attack.t1190
  - attack.sql_injection

---
# Detection rule for unauthorized data access
title: Unauthorized Data Access
id: data_access_001
description: User accessing data they don't have permission for
status: production
author: Security Team
date: 2025/10/30
logsource:
  product: mariia-hub
  service: authorization
detection:
  selection:
    event_type: authorization
    result: denied
    resource:
      - customers
      - payments
      - bookings
  timeframe: 1h
  condition:
    selection and count() by user_id > 10
fields:
  - user_id
  - ip_address
  - resource
  - action
  - timestamp
falsepositives:
  - Users testing permissions
  - Application bugs
level: medium
tags:
  - attack.t1083
  - attack.unauthorized_access
```

#### Custom Detection Logic
```typescript
// threat-detection-engine.ts
interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: DetectionCondition[];
  timeframe?: number; // in milliseconds
  aggregation?: {
    field: string;
    operator: 'count' | 'sum' | 'avg';
    threshold: number;
  };
  actions: DetectionAction[];
}

interface DetectionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'exists';
  value: any;
}

interface DetectionAction {
  type: 'alert' | 'block' | 'quarantine';
  parameters: Record<string, any>;
}

export class ThreatDetectionEngine {
  private rules: Map<string, ThreatDetectionRule> = new Map();
  private eventBuffer: Map<string, SecurityEvent[]> = new Map();

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules(): void {
    // Brute force detection
    this.addRule({
      id: 'brute_force_001',
      name: 'Multiple Failed Logins',
      description: 'Detect multiple failed login attempts from same IP',
      severity: 'high',
      conditions: [
        { field: 'event_type', operator: 'equals', value: 'authentication' },
        { field: 'result', operator: 'equals', value: 'failure' }
      ],
      timeframe: 5 * 60 * 1000, // 5 minutes
      aggregation: {
        field: 'ip_address',
        operator: 'count',
        threshold: 5
      },
      actions: [
        { type: 'alert', parameters: { level: 'high' } },
        { type: 'block', parameters: { duration: 3600000 } } // 1 hour
      ]
    });

    // Suspicious input detection
    this.addRule({
      id: 'suspicious_input_001',
      name: 'SQL Injection Attempt',
      description: 'Detect potential SQL injection attempts',
      severity: 'critical',
      conditions: [
        { field: 'event_type', operator: 'equals', value: 'api_request' },
        { field: 'request_body', operator: 'regex', value: '(?i)(union\\s+select|or\\s+1\\s*=\\s*1|drop\\s+table)' }
      ],
      actions: [
        { type: 'alert', parameters: { level: 'critical' } },
        { type: 'block', parameters: { duration: 86400000 } } // 24 hours
      ]
    });

    // Unauthorized access detection
    this.addRule({
      id: 'unauthorized_access_001',
      name: 'Repeated Authorization Failures',
      description: 'Detect repeated authorization failures',
      severity: 'medium',
      conditions: [
        { field: 'event_type', operator: 'equals', value: 'authorization' },
        { field: 'result', operator: 'equals', value: 'denied' }
      ],
      timeframe: 60 * 60 * 1000, // 1 hour
      aggregation: {
        field: 'user_id',
        operator: 'count',
        threshold: 10
      },
      actions: [
        { type: 'alert', parameters: { level: 'medium' } },
        { type: 'quarantine', parameters: { review_required: true } }
      ]
    });
  }

  addRule(rule: ThreatDetectionRule): void {
    this.rules.set(rule.id, rule);
  }

  async processEvent(event: SecurityEvent): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (const rule of this.rules.values()) {
      if (await this.evaluateRule(rule, event)) {
        const result = await this.createDetectionResult(rule, event);
        results.push(result);

        // Execute actions
        await this.executeActions(rule.actions, event);
      }
    }

    return results;
  }

  private async evaluateRule(rule: ThreatDetectionRule, event: SecurityEvent): Promise<boolean> {
    // Check basic conditions
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, event)) {
        return false;
      }
    }

    // Check aggregation if specified
    if (rule.aggregation && rule.timeframe) {
      return await this.evaluateAggregation(rule, event);
    }

    return true;
  }

  private evaluateCondition(condition: DetectionCondition, event: SecurityEvent): boolean {
    const fieldValue = this.getNestedValue(event, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(condition.value, 'i').test(fieldValue);
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private async evaluateAggregation(rule: ThreatDetectionRule, event: SecurityEvent): Promise<boolean> {
    const bufferKey = this.getBufferKey(rule, event);
    const now = Date.now();

    // Get or create buffer
    let events = this.eventBuffer.get(bufferKey) || [];

    // Filter events within timeframe
    events = events.filter(e => now - new Date(e.timestamp).getTime() < rule.timeframe);

    // Add current event
    events.push(event);

    // Evaluate aggregation
    const values = events.map(e => this.getNestedValue(e, rule.aggregation.field));
    let aggregatedValue: number;

    switch (rule.aggregation.operator) {
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + Number(val || 0), 0);
        break;
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + Number(val || 0), 0) / values.length;
        break;
      default:
        return false;
    }

    // Update buffer
    this.eventBuffer.set(bufferKey, events);

    return aggregatedValue > rule.aggregation.threshold;
  }

  private async executeActions(actions: DetectionAction[], event: SecurityEvent): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'alert':
          await this.triggerAlert(action.parameters, event);
          break;
        case 'block':
          await this.blockSource(action.parameters, event);
          break;
        case 'quarantine':
          await this.quarantineUser(action.parameters, event);
          break;
      }
    }
  }

  private async triggerAlert(parameters: any, event: SecurityEvent): Promise<void> {
    // Implementation to trigger security alert
    console.log(`ALERT: ${parameters.level} - ${event.event_type}`);
  }

  private async blockSource(parameters: any, event: SecurityEvent): Promise<void> {
    // Implementation to block IP address or user
    console.log(`BLOCK: ${event.ip_address} for ${parameters.duration}ms`);
  }

  private async quarantineUser(parameters: any, event: SecurityEvent): Promise<void> {
    // Implementation to quarantine user account
    console.log(`QUARANTINE: User ${event.user_id} requires review`);
  }

  private getBufferKey(rule: ThreatDetectionRule, event: SecurityEvent): string {
    return `${rule.id}_${event.ip_address}_${event.user_id}`;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async createDetectionResult(rule: ThreatDetectionRule, event: SecurityEvent): Promise<DetectionResult> {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      event,
      description: rule.description
    };
  }
}
```

---

## 4. Alert Configuration

### 4.1 Alert Management System

#### Alert Types and Severity
```typescript
interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  sourceIP?: string;
  userID?: string;
  affectedSystems: string[];
  metadata: Record<string, any>;
  status: AlertStatus;
  assignedTo?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  tags: string[];
}

enum AlertType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALICIOUS_REQUEST = 'malicious_request',
  SYSTEM_ANOMALY = 'system_anomaly',
  DATA_BREACH = 'data_breach',
  POLICY_VIOLATION = 'policy_violation',
  VULNERABILITY_DETECTED = 'vulnerability_detected',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}
```

#### Alert Configuration
```typescript
// alert-config.ts
interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  severity: AlertSeverity;
  cooldown: number; // milliseconds
  notifications: NotificationConfig[];
  escalation: EscalationConfig;
}

interface NotificationConfig {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty';
  enabled: boolean;
  settings: Record<string, any>;
  conditions?: {
    minSeverity?: AlertSeverity;
    timeOfDay?: {
      start: string;
      end: string;
    };
    dayOfWeek?: number[];
  };
}

interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
}

interface EscalationLevel {
  delay: number; // minutes
  recipients: string[];
  notificationType: NotificationConfig['type'];
}

export const alertRules: AlertRule[] = [
  {
    id: 'failed_login_brute_force',
    name: 'Brute Force Login Attempt',
    description: 'Multiple failed login attempts from same IP',
    enabled: true,
    conditions: [
      {
        field: 'event_type',
        operator: 'equals',
        value: 'authentication'
      },
      {
        field: 'result',
        operator: 'equals',
        value: 'failure'
      }
    ],
    severity: AlertSeverity.HIGH,
    cooldown: 15 * 60 * 1000, // 15 minutes
    notifications: [
      {
        type: 'slack',
        enabled: true,
        settings: {
          channel: '#security-alerts',
          webhook_url: process.env.SLACK_WEBHOOK_URL
        },
        conditions: {
          minSeverity: AlertSeverity.MEDIUM,
          timeOfDay: {
            start: '09:00',
            end: '17:00'
          }
        }
      },
      {
        type: 'email',
        enabled: true,
        settings: {
          recipients: ['security@mariia-hub.pl'],
          template: 'security-alert'
        }
      },
      {
        type: 'pagerduty',
        enabled: true,
        settings: {
          integration_key: process.env.PAGERDUTY_INTEGRATION_KEY
        },
        conditions: {
          minSeverity: AlertSeverity.HIGH
        }
      }
    ],
    escalation: {
      enabled: true,
      levels: [
        {
          delay: 5,
          recipients: ['security-lead@mariia-hub.pl'],
          notificationType: 'sms'
        },
        {
          delay: 15,
          recipients: ['cto@mariia-hub.pl', 'security-manager@mariia-hub.pl'],
          notificationType: 'phone'
        }
      ]
    }
  },
  {
    id: 'suspicious_api_requests',
    name: 'Suspicious API Requests',
    description: 'API requests with suspicious patterns',
    enabled: true,
    conditions: [
      {
        field: 'event_type',
        operator: 'equals',
        value: 'api_request'
      },
      {
        field: 'threat_score',
        operator: 'gt',
        value: 0.8
      }
    ],
    severity: AlertSeverity.MEDIUM,
    cooldown: 5 * 60 * 1000, // 5 minutes
    notifications: [
      {
        type: 'slack',
        enabled: true,
        settings: {
          channel: '#api-security',
          webhook_url: process.env.SLACK_WEBHOOK_URL
        }
      }
    ],
    escalation: {
      enabled: false,
      levels: []
    }
  }
];
```

#### Alert Processing Service
```typescript
// alert-service.ts
export class AlertService {
  private rules: Map<string, AlertRule> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    alertRules.forEach(rule => this.addRule(rule));
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  async processEvent(event: SecurityEvent): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.isInCooldown(rule.id)) continue;

      if (this.matchesConditions(rule.conditions, event)) {
        const alert = await this.createAlert(rule, event);
        alerts.push(alert);

        await this.sendNotifications(alert, rule.notifications);
        this.setCooldown(rule.id);
        this.setupEscalation(alert, rule.escalation);
      }
    }

    return alerts;
  }

  private matchesConditions(conditions: AlertCondition[], event: SecurityEvent): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(event, condition.field);

      switch (condition.operator) {
        case 'equals': return fieldValue === condition.value;
        case 'contains': return String(fieldValue).includes(condition.value);
        case 'gt': return Number(fieldValue) > Number(condition.value);
        case 'lt': return Number(fieldValue) < Number(condition.value);
        case 'regex': return new RegExp(condition.value, 'i').test(String(fieldValue));
        default: return false;
      }
    });
  }

  private async createAlert(rule: AlertRule, event: SecurityEvent): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: this.mapEventTypeToAlertType(event.event_type),
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, event),
      timestamp: new Date(),
      source: event.service || 'unknown',
      sourceIP: event.ip_address,
      userID: event.user_id,
      affectedSystems: [event.service],
      metadata: event.metadata || {},
      status: AlertStatus.OPEN,
      tags: this.generateAlertTags(event)
    };

    // Store alert in database
    await this.storeAlert(alert);

    return alert;
  }

  private async sendNotifications(alert: SecurityAlert, notifications: NotificationConfig[]): Promise<void> {
    for (const notification of notifications) {
      if (!notification.enabled) continue;

      // Check notification conditions
      if (!this.shouldSendNotification(notification, alert)) continue;

      try {
        await this.sendNotification(notification, alert);
      } catch (error) {
        console.error(`Failed to send ${notification.type} notification:`, error);
      }
    }
  }

  private async sendNotification(notification: NotificationConfig, alert: SecurityAlert): Promise<void> {
    switch (notification.type) {
      case 'email':
        await this.sendEmailNotification(notification.settings, alert);
        break;
      case 'sms':
        await this.sendSMSNotification(notification.settings, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(notification.settings, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(notification.settings, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(notification.settings, alert);
        break;
    }
  }

  private async sendSlackNotification(settings: any, alert: SecurityAlert): Promise<void> {
    const payload = {
      channel: settings.channel,
      username: 'Security Bot',
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: alert.title,
        text: alert.description,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Source', value: alert.source, short: true },
          { title: 'Source IP', value: alert.sourceIP || 'N/A', short: true },
          { title: 'User ID', value: alert.userID || 'N/A', short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ],
        actions: [{
          type: 'button',
          text: 'View Details',
          url: `https://security.mariia-hub.com/alerts/${alert.id}`
        }]
      }]
    };

    await fetch(settings.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendEmailNotification(settings: any, alert: SecurityAlert): Promise<void> {
    // Implementation for email notifications
    console.log(`Email alert sent to ${settings.recipients.join(', ')}: ${alert.title}`);
  }

  private async sendSMSNotification(settings: any, alert: SecurityAlert): Promise<void> {
    // Implementation for SMS notifications
    console.log(`SMS alert sent to ${settings.recipients.join(', ')}: ${alert.title}`);
  }

  private setupEscalation(alert: SecurityAlert, escalation: EscalationConfig): void {
    if (!escalation.enabled) return;

    escalation.levels.forEach((level, index) => {
      const timer = setTimeout(async () => {
        const currentAlert = await this.getAlert(alert.id);
        if (currentAlert.status === AlertStatus.OPEN) {
          await this.escalateAlert(currentAlert, level);
        }
      }, level.delay * 60 * 1000); // Convert minutes to milliseconds

      this.escalationTimers.set(`${alert.id}_${index}`, timer);
    });
  }

  private async escalateAlert(alert: SecurityAlert, level: EscalationLevel): Promise<void> {
    const escalationNotification: NotificationConfig = {
      type: level.notificationType,
      enabled: true,
      settings: {
        recipients: level.recipients,
        urgency: 'high'
      }
    };

    await this.sendNotification(escalationNotification, alert);

    // Update alert status
    await this.updateAlertStatus(alert.id, AlertStatus.ACKNOWLEDGED);
  }

  private isInCooldown(ruleId: string): boolean {
    const lastTriggered = this.cooldowns.get(ruleId);
    if (!lastTriggered) return false;

    const rule = this.rules.get(ruleId);
    return Date.now() - lastTriggered.getTime() < rule.cooldown;
  }

  private setCooldown(ruleId: string): void {
    this.cooldowns.set(ruleId, new Date());
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return ':rotating_light:';
      case AlertSeverity.HIGH: return ':warning:';
      case AlertSeverity.MEDIUM: return ':information_source:';
      case AlertSeverity.LOW: return ':white_check_mark:';
      default: return ':question:';
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'danger';
      case AlertSeverity.HIGH: return 'warning';
      case AlertSeverity.MEDIUM: return 'good';
      case AlertSeverity.LOW: return '#36a64f';
      default: return 'grey';
    }
  }

  // Additional helper methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapEventTypeToAlertType(eventType: string): AlertType {
    // Implementation to map event types to alert types
    return AlertType.SUSPICIOUS_ACTIVITY;
  }

  private generateAlertDescription(rule: AlertRule, event: SecurityEvent): string {
    return `${rule.description}\n\nEvent Details:\n- IP: ${event.ip_address}\n- User: ${event.user_id || 'N/A'}\n- Time: ${event.timestamp}`;
  }

  private generateAlertTags(event: SecurityEvent): string[] {
    return [
      event.event_type,
      event.service || 'unknown',
      event.ip_address || 'no-ip'
    ];
  }

  private shouldSendNotification(notification: NotificationConfig, alert: SecurityAlert): boolean {
    // Check severity condition
    if (notification.conditions?.minSeverity) {
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      const alertLevel = severityLevels[alert.severity];
      const minLevel = severityLevels[notification.conditions.minSeverity];
      if (alertLevel < minLevel) return false;
    }

    // Check time of day condition
    if (notification.conditions?.timeOfDay) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < notification.conditions.timeOfDay.start ||
          currentTime > notification.conditions.timeOfDay.end) {
        return false;
      }
    }

    // Check day of week condition
    if (notification.conditions?.dayOfWeek) {
      const currentDay = new Date().getDay();
      if (!notification.conditions.dayOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async storeAlert(alert: SecurityAlert): Promise<void> {
    // Implementation to store alert in database
  }

  private async getAlert(alertId: string): Promise<SecurityAlert> {
    // Implementation to retrieve alert from database
    return {} as SecurityAlert;
  }

  private async updateAlertStatus(alertId: string, status: AlertStatus): Promise<void> {
    // Implementation to update alert status
  }
}
```

---

## 5. Dashboard Setup

### 5.1 Grafana Dashboard Configuration

#### Security Overview Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Security Operations Center",
    "tags": ["security", "operations"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Security Events Trend",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(security_events_total[5m])",
            "legendFormat": "{{event_type}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Active Security Alerts",
        "type": "stat",
        "targets": [
          {
            "expr": "security_alerts_active{status=\"open\"}",
            "legendFormat": "Open Alerts"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 4,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Threat Sources",
        "type": "piechart",
        "targets": [
          {
            "expr": "topk(10, sum by (source_ip) (security_events_total))",
            "legendFormat": "{{source_ip}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 8,
          "x": 16,
          "y": 0
        }
      },
      {
        "id": 4,
        "title": "Failed Login Attempts",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(authentication_failures_total[5m])",
            "legendFormat": "Failed Logins"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 5,
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"security-services\"}",
            "legendFormat": "{{instance}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

#### Threat Detection Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Threat Detection",
    "tags": ["security", "threats"],
    "panels": [
      {
        "id": 1,
        "title": "Threat Score Distribution",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(threat_detection_score_bucket[5m])",
            "legendFormat": "{{le}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Top Attack Sources",
        "type": "table",
        "targets": [
          {
            "expr": "topk(20, sum by (source_ip, attack_type) (security_incidents_total))",
            "legendFormat": "{{source_ip}} - {{attack_type}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Detection Rule Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(detection_rule_matches_total[5m])",
            "legendFormat": "{{rule_id}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 8
        }
      }
    ]
  }
}
```

### 5.2 Custom Security Dashboard

#### React Security Dashboard Component
```typescript
// SecurityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react';

interface SecurityMetrics {
  totalEvents: number;
  activeAlerts: number;
  criticalAlerts: number;
  threatScore: number;
  systemHealth: number;
  blockedIPs: number;
}

interface RecentAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    threatScore: 0,
    systemHealth: 100,
    blockedIPs: 0
  });

  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityMetrics();
    fetchRecentAlerts();

    const interval = setInterval(() => {
      fetchSecurityMetrics();
      fetchRecentAlerts();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/security/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts?limit=10');
      const data = await response.json();
      setRecentAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch recent alerts:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' || severity === 'high' ? AlertTriangle : Shield;
  };

  if (loading) {
    return <div className="p-6">Loading security dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Operations Center</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={metrics.criticalAlerts > 0 ? "destructive" : "default"}>
            {metrics.criticalAlerts > 0 ? 'Critical Alerts Active' : 'All Systems Normal'}
          </Badge>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Live
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.criticalAlerts} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.threatScore * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Risk assessment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth}%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">
              Active blocks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent security alerts
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => {
                const Icon = getSeverityIcon(alert.severity);
                return (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant={alert.status === 'resolved' ? 'default' : 'secondary'}>
                        {alert.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-16">
          <div className="text-left">
            <div className="font-medium">View All Alerts</div>
            <div className="text-sm text-muted-foreground">Browse security alerts</div>
          </div>
        </Button>

        <Button variant="outline" className="h-16">
          <div className="text-left">
            <div className="font-medium">Security Reports</div>
            <div className="text-sm text-muted-foreground">Generate reports</div>
          </div>
        </Button>

        <Button variant="outline" className="h-16">
          <div className="text-left">
            <div className="font-medium">System Settings</div>
            <div className="text-sm text-muted-foreground">Configure monitoring</div>
          </div>
        </Button>
      </div>
    </div>
  );
};
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation Setup (Week 1-2)
- [ ] **Logging Infrastructure**: Deploy Elasticsearch, Logstash, and Kibana
- [ ] **Application Logging**: Implement structured logging in all applications
- [ ] **Security Events**: Define and implement security event schemas
- [ ] **Data Collection**: Set up log collection from all systems
- [ ] **Storage Configuration**: Configure encrypted storage with retention policies

### Phase 2: Detection System (Week 3-4)
- [ ] **Threat Detection Engine**: Implement custom threat detection logic
- [ ] **Detection Rules**: Define and implement security detection rules
- [ ] **SIEM Integration**: Integrate all security logs into SIEM
- [ ] **Correlation Engine**: Implement event correlation and analysis
- [ ] **Machine Learning**: Deploy anomaly detection and ML models

### Phase 3: Alerting System (Week 5-6)
- [ ] **Alert Management**: Implement alert processing and routing
- [ ] **Notification Channels**: Configure email, SMS, Slack, and PagerDuty
- [ ] **Escalation Policies**: Define and implement escalation procedures
- [ ] **Alert Templates**: Create standardized alert formats
- [ ] **Dashboard Integration**: Integrate alerts with monitoring dashboards

### Phase 4: Dashboard and Reporting (Week 7-8)
- [ ] **Security Dashboard**: Implement comprehensive security dashboard
- [ ] **Grafana Configuration**: Set up security metrics dashboards
- [ ] **Real-time Monitoring**: Implement real-time monitoring capabilities
- [ ] **Reporting System**: Create automated security reports
- [ ] **Mobile Access**: Implement mobile-friendly dashboard access

### Phase 5: Testing and Optimization (Week 9-10)
- [ ] **Integration Testing**: Test all monitoring integrations
- [ ] **Performance Testing**: Optimize system performance under load
- [ ] **Security Testing**: Test security of monitoring systems
- [ ] **User Acceptance**: Test dashboard usability and functionality
- [ ] **Documentation**: Complete system documentation and procedures

### Ongoing Maintenance
- [ ] **Regular Updates**: Keep monitoring systems updated
- [ ] **Rule Optimization**: Continuously optimize detection rules
- [ ] **Performance Monitoring**: Monitor system performance and health
- [ ] **Security Updates**: Apply security patches and updates
- [ ] **User Training**: Train security team on monitoring tools

---

**Document Version**: 1.0
**Last Updated**: 30 October 2025
**Next Review**: 30 January 2026
**Security Architect**: [Name], [Title]
**Approved By**: [Name], [Title]

This security monitoring setup provides comprehensive coverage for detecting, alerting, and responding to security incidents across the Mariia Hub platform. Regular maintenance and updates ensure continued effectiveness and alignment with evolving security requirements.