# Security Architecture Documentation

## Overview

This document provides a comprehensive overview of the security architecture implemented at Mariia Hub, detailing the multi-layered approach to protecting our digital assets, customer data, and business operations.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Network Security Architecture](#network-security-architecture)
3. [Application Security Architecture](#application-security-architecture)
4. [Data Security Architecture](#data-security-architecture)
5. [Identity and Access Management](#identity-and-access-management)
6. [Cloud Security Architecture](#cloud-security-architecture)
7. [Security Monitoring Architecture](#security-monitoring-architecture)
8. [Compliance Architecture](#compliance-architecture)
9. [Security Controls Matrix](#security-controls-matrix)

---

## 1. Architecture Overview

### 1.1 Security Principles

Our security architecture is built upon the following core principles:

#### Defense in Depth
Multiple layers of security controls to provide redundancy and protection against various attack vectors. If one layer fails, others continue to provide protection.

#### Zero Trust
Never trust, always verify. All access requests are authenticated, authorized, and encrypted regardless of source.

#### Least Privilege
Users and systems only have the minimum access rights necessary to perform their functions.

#### Secure by Design
Security is built into systems from the ground up, not added as an afterthought.

### 1.2 Architecture Domains

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│  Network Security  │  Application Security  │  Data Security │
├─────────────────────────────────────────────────────────────┤
│  Identity & Access │  Cloud Security       │  Monitoring     │
├─────────────────────────────────────────────────────────────┤
│  Compliance        │  Physical Security     │  Business      │
│                     │                       │  Continuity    │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Deployment**: Vercel (CDN + Edge Functions)
- **Security**: Content Security Policy (CSP), Security Headers
- **CDN**: Cloudflare (DDoS Protection, WAF)

#### Backend
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth + JWT tokens
- **Storage**: Supabase Storage (encrypted object storage)
- **API**: RESTful APIs with GraphQL endpoints

#### Infrastructure
- **Hosting**: Vercel (Frontend), Supabase (Backend)
- **Monitoring**: Sentry (Error Tracking), Custom Monitoring
- **Security**: Cloudflare WAF, Supabase RLS
- **Backup**: Automated backups with point-in-time recovery

---

## 2. Network Security Architecture

### 2.1 Network Segmentation

#### DMZ Zone
```
Internet → Cloudflare WAF → Vercel Edge → Application Layer
```

#### Application Zone
```
Vercel Edge → Supabase API → Database Layer
```

#### Data Zone
```
Supabase Database → Encrypted Storage → Backup Systems
```

### 2.2 Firewall Configuration

#### Cloudflare WAF Rules
- **OWASP Top 10 Protection**: SQL injection, XSS, CSRF protection
- **Rate Limiting**: Configured per endpoint and user
- **Geo-blocking**: Restricted access from high-risk countries
- **Bot Protection**: Automated bot detection and blocking

#### Network Access Controls
- **IP Whitelisting**: Administrative access from approved IPs only
- **Port Security**: Only necessary ports open and monitored
- **Protocol Filtering**: Unnecessary protocols blocked
- **Traffic Monitoring**: Real-time traffic analysis and alerting

### 2.3 Secure Communication

#### Transport Layer Security (TLS)
- **Version**: TLS 1.3 only
- **Cipher Suites**: Strong, modern cipher suites only
- **Certificate Management**: Automated certificate rotation
- **HSTS**: HTTP Strict Transport Security enforced

#### VPN and Remote Access
- **Corporate VPN**: Required for all administrative access
- **Multi-Factor Authentication**: MFA required for VPN access
- **Session Management**: Automatic session timeout and renewal
- **Device Compliance**: Only compliant devices allowed

### 2.4 DNS Security

#### DNS Configuration
- **DNSSEC**: DNS Security Extensions enabled
- **DNS over HTTPS**: Secure DNS resolution
- **DNS Filtering**: Malicious domain blocking
- **DNS Monitoring**: DNS query logging and analysis

---

## 3. Application Security Architecture

### 3.1 Secure Software Development Lifecycle (SSDLC)

#### Development Phase
- **Secure Coding Standards**: OWASP secure coding practices
- **Code Review**: Security-focused peer reviews
- **Static Analysis**: Automated security code scanning
- **Dependency Scanning**: Third-party vulnerability scanning

#### Testing Phase
- **Security Testing**: Penetration testing and vulnerability assessment
- **Dynamic Analysis**: Runtime application security testing
- **API Testing**: Security testing of all API endpoints
- **Configuration Review**: Security configuration validation

#### Deployment Phase
- **Security Validation**: Pre-deployment security checks
- **Environment Hardening**: Secure deployment configuration
- **Monitoring Setup**: Security monitoring and alerting
- **Rollback Planning**: Secure rollback procedures

### 3.2 Application Security Controls

#### Input Validation and Output Encoding
```typescript
// Example: Input validation
const validateInput = (input: string): boolean => {
  // Length validation
  if (input.length > 1000) return false;

  // Pattern validation
  const safePattern = /^[a-zA-Z0-9\s\-_.@]+$/;
  return safePattern.test(input);
};

// Example: Output encoding
const sanitizeOutput = (output: string): string => {
  return output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
```

#### Authentication and Authorization
```typescript
// Example: JWT token validation
const validateToken = (token: string): boolean => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
};

// Example: Role-based access control
const checkPermission = (user: User, resource: string, action: string): boolean => {
  const permissions = getRolePermissions(user.role);
  return permissions.some(p => p.resource === resource && p.actions.includes(action));
};
```

#### Session Management
```typescript
// Example: Secure session configuration
const sessionConfig = {
  name: 'mariia-hub-session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'strict'
  }
};
```

### 3.3 API Security

#### API Gateway Security
- **Authentication**: API key or OAuth 2.0 for all API calls
- **Rate Limiting**: Configured per API endpoint and user
- **Input Validation**: Strict validation of all API inputs
- **Output Filtering**: Sensitive data filtering in API responses

#### GraphQL Security
```typescript
// Example: GraphQL security configuration
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Authentication
    const token = req.headers.authorization || '';
    const user = authenticateToken(token);

    // Authorization
    if (!user) {
      throw new AuthenticationError('You must be logged in');
    }

    return { user };
  },
  // Query depth limiting
  validationRules: [depthLimit(10), createComplexityLimit(1000)],
  // Introspection disabled in production
  introspection: process.env.NODE_ENV === 'development'
});
```

---

## 4. Data Security Architecture

### 4.1 Data Classification Framework

```
PUBLIC DATA
├── Marketing materials
├── Press releases
└── General company information

INTERNAL DATA
├── Internal policies
├── Project documentation
└── Internal communications

CONFIDENTIAL DATA
├── Customer personal information
├── Financial data
├── Business plans
└── Employee information

RESTRICTED DATA
├── Payment card information
├── Health information
├── Security credentials
└── Legal documents
```

### 4.2 Encryption Architecture

#### Encryption at Rest
```sql
-- Example: Database column encryption
CREATE TABLE customer_data (
  id UUID PRIMARY KEY,
  personal_info JSONB,
  -- Encrypted columns
  ssn_encrypted BYTEA,
  credit_card_encrypted BYTEA,
  -- Encryption metadata
  encryption_key_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example: Encryption using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt data
INSERT INTO customer_data (personal_info, ssn_encrypted, encryption_key_id)
VALUES (
  '{"name": "John Doe"}',
  pgp_sym_encrypt('123-45-6789', current_setting('app.encryption_key')),
  gen_random_uuid()
);
```

#### Encryption in Transit
```typescript
// Example: Secure API client
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // HTTPS only
  httpsAgent: new https.Agent({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.3'
  })
});

// Request/Response interceptors for security
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication headers
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### Key Management
```typescript
// Example: Key management service
class KeyManagementService {
  private keys: Map<string, string> = new Map();

  async generateKey(keyId: string): Promise<string> {
    const key = crypto.randomBytes(32).toString('hex');
    this.keys.set(keyId, key);

    // Store key in secure storage
    await this.storeSecureKey(keyId, key);

    return key;
  }

  async encryptData(data: string, keyId: string): Promise<string> {
    const key = await this.getKey(keyId);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(keyId));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyId
    });
  }

  async decryptData(encryptedData: string): Promise<string> {
    const { encrypted, iv, authTag, keyId } = JSON.parse(encryptedData);
    const key = await this.getKey(keyId);

    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from(keyId));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 4.3 Database Security

#### Row Level Security (RLS)
```sql
-- Example: RLS policies
-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can see their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Service providers can see bookings for their services
CREATE POLICY "Providers can view service bookings" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = bookings.service_id
      AND services.provider_id = auth.uid()
    )
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

#### Database Auditing
```sql
-- Example: Audit trigger
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_values, ip_address, user_agent)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), inet_client_addr(), current_setting('request.headers.user_agent'));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_values, new_values, ip_address, user_agent)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW), inet_client_addr(), current_setting('request.headers.user_agent'));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, new_values, ip_address, user_agent)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW), inet_client_addr(), current_setting('request.headers.user_agent'));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER bookings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 5. Identity and Access Management

### 5.1 Authentication Architecture

#### Multi-Factor Authentication (MFA)
```typescript
// Example: MFA implementation
interface MFAService {
  generateSecret(userId: string): Promise<string>;
  generateQRCode(secret: string, userEmail: string): Promise<string>;
  verifyToken(userId: string, token: string): Promise<boolean>;
  sendSMSCode(userId: string, phoneNumber: string): Promise<void>;
  verifySMSCode(userId: string, code: string): Promise<boolean>;
}

class TOTPService implements MFAService {
  async generateSecret(userId: string): Promise<string> {
    return speakeasy.generateSecret({
      name: `Mariia Hub (${userId})`,
      issuer: 'Mariia Hub',
      length: 32
    }).base32;
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const userSecret = await this.getUserSecret(userId);
    return speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2-step time window
    });
  }
}
```

#### Single Sign-On (SSO) Integration
```typescript
// Example: SSO with SAML
const samlStrategy = new SamlStrategy({
  entryPoint: process.env.SSO_ENTRY_POINT,
  issuer: process.env.SSO_ISSUER,
  cert: process.env.SSO_CERTIFICATE,
  callbackUrl: process.env.SSO_CALLBACK_URL
}, async (profile: any, done: any) => {
  try {
    // Find or create user
    let user = await findUserBySAMLId(profile.id);

    if (!user) {
      user = await createUser({
        samlId: profile.id,
        email: profile.email,
        name: profile.displayName,
        roles: ['user']
      });
    }

    // Update user information
    await updateUser(user.id, {
      lastLoginAt: new Date(),
      loginCount: user.loginCount + 1
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
```

### 5.2 Authorization Architecture

#### Role-Based Access Control (RBAC)
```typescript
// Example: RBAC implementation
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

class AuthorizationService {
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    const user = await getUserWithRoles(userId);

    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (permission.resource === resource &&
            permission.actions.includes(action)) {

          // Check conditions if any
          if (permission.conditions) {
            if (await this.evaluateConditions(permission.conditions, context, user)) {
              return true;
            }
          } else {
            return true;
          }
        }
      }
    }

    return false;
  }

  private async evaluateConditions(
    conditions: Record<string, any>,
    context: any,
    user: User
  ): Promise<boolean> {
    // Example: Owner-based condition
    if (conditions.ownerOnly) {
      return context.resourceOwnerId === user.id;
    }

    // Example: Time-based condition
    if (conditions.businessHoursOnly) {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 9 && hour <= 17;
    }

    // Example: IP-based condition
    if (conditions.allowedIPs) {
      return conditions.allowedIPs.includes(context.clientIP);
    }

    return true;
  }
}
```

#### Attribute-Based Access Control (ABAC)
```typescript
// Example: ABAC implementation
interface Attribute {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface Policy {
  id: string;
  name: string;
  target: {
    subjects: Attribute[];
    resources: Attribute[];
    actions: Attribute[];
    environment: Attribute[];
  };
  effect: 'Permit' | 'Deny';
  obligation?: string[];
}

class ABACService {
  async evaluatePolicy(
    subject: Attribute[],
    resource: Attribute[],
    action: Attribute[],
    environment: Attribute[]
  ): Promise<boolean> {
    const applicablePolicies = await this.getApplicablePolicies(
      subject, resource, action, environment
    );

    // Default deny
    let decision = false;

    for (const policy of applicablePolicies) {
      if (policy.effect === 'Deny') {
        return false; // Deny overrides permit
      } else if (policy.effect === 'Permit') {
        decision = true;

        // Execute obligations if any
        if (policy.obligation) {
          await this.executeObligations(policy.obligation);
        }
      }
    }

    return decision;
  }

  private async getApplicablePolicies(
    subject: Attribute[],
    resource: Attribute[],
    action: Attribute[],
    environment: Attribute[]
  ): Promise<Policy[]> {
    // Implementation to find matching policies based on attributes
    return [];
  }
}
```

---

## 6. Cloud Security Architecture

### 6.1 Multi-Cloud Strategy

#### Frontend Hosting (Vercel)
```
Vercel Architecture:
├── Global CDN (Edge Network)
├── Edge Functions (Serverless compute)
├── Security Headers (CSP, HSTS, etc.)
├── Rate Limiting (Built-in protection)
└── Deployment Security (Git integration)
```

#### Backend Services (Supabase)
```
Supabase Architecture:
├── PostgreSQL Database (RLS enabled)
├── Authentication Service (JWT-based)
├── Storage Service (Encrypted)
├── Real-time Engine (WebSocket)
└── Edge Functions (Serverless)
```

#### Security Services (Cloudflare)
```
Cloudflare Security:
├── Web Application Firewall (WAF)
├── DDoS Protection
├── Bot Management
├── DNS Security (DNSSEC)
└── SSL/TLS Termination
```

### 6.2 Cloud Security Controls

#### Infrastructure as Code (IaC) Security
```yaml
# Example: Terraform security configuration
resource "supabase_project" "main" {
  name = "mariia-hub-production"
  database_password = var.db_password

  # Security settings
  db_port = 5432
  db_version = "15.1.0.88"
  region = "eu-west-1"

  # Enable security features
  rest_api_enabled = true
  storage_enabled = true
  auth_enabled = true

  # Security headers and policies
  jwt_expiry = 3600
  refresh_token_rotation_enabled = true
  security_updates_enabled = true
}

# Network security rules
resource "supabase_network_ban" "block_suspicious_ips" {
  for_each = var.suspicious_ips

  project_id = supabase_project.main.id
  ipv4_address = each.value
  reason = "Suspicious activity detected"
}
```

#### Container Security (if applicable)
```dockerfile
# Example: Secure Dockerfile
FROM node:18-alpine AS base

# Security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with security checks
RUN npm ci --only=production && npm audit fix

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove development dependencies
RUN npm prune --production

# Security scanning
RUN npx audit-ci --moderate

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### 6.3 Cloud Monitoring and Logging

#### Centralized Logging
```typescript
// Example: Structured logging with security events
interface SecurityLogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

class SecurityLogger {
  async logSecurityEvent(event: Partial<SecurityLogEvent>): Promise<void> {
    const logEvent: SecurityLogEvent = {
      timestamp: new Date().toISOString(),
      level: event.level || 'info',
      event_type: event.event_type,
      user_id: event.user_id,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      resource: event.resource,
      action: event.action,
      result: event.result || 'success',
      metadata: event.metadata
    };

    // Send to logging service
    await this.sendToLogService(logEvent);

    // Send to SIEM for security monitoring
    await this.sendToSIEM(logEvent);

    // Store for audit purposes
    await this.storeAuditLog(logEvent);
  }

  private async sendToLogService(event: SecurityLogEvent): Promise<void> {
    // Implementation to send to centralized logging
  }

  private async sendToSIEM(event: SecurityLogEvent): Promise<void> {
    // Implementation to send to SIEM system
  }

  private async storeAuditLog(event: SecurityLogEvent): Promise<void> {
    // Implementation to store in audit database
  }
}
```

---

## 7. Security Monitoring Architecture

### 7.1 Security Information and Event Management (SIEM)

#### Log Collection Architecture
```
Log Sources:
├── Application Logs (JSON format)
├── Access Logs (Nginx, Cloudflare)
├── Database Logs (PostgreSQL audit logs)
├── Authentication Logs (Supabase Auth)
├── System Logs (Cloud providers)
└── Security Tool Logs (WAF, Antivirus)
```

#### SIEM Integration
```typescript
// Example: SIEM integration
interface SIEMEvent {
  timestamp: string;
  source: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  details: Record<string, any>;
}

class SIEMIntegration {
  async sendEvent(event: SIEMEvent): Promise<void> {
    // Normalize event data
    const normalizedEvent = this.normalizeEvent(event);

    // Add threat intelligence
    const enrichedEvent = await this.enrichWithThreatIntelligence(normalizedEvent);

    // Send to SIEM
    await this.sendToSIEM(enrichedEvent);

    // Check for alert conditions
    await this.checkAlertConditions(enrichedEvent);
  }

  private async enrichWithThreatIntelligence(event: SIEMEvent): Promise<SIEMEvent> {
    if (event.ip_address) {
      const threatInfo = await this.checkThreatIntelligence(event.ip_address);
      event.details.threat_intelligence = threatInfo;
    }

    return event;
  }

  private async checkAlertConditions(event: SIEMEvent): Promise<void> {
    // Example: Multiple failed logins from same IP
    if (event.event_type === 'login_failure') {
      const recentFailures = await this.countRecentFailures(event.ip_address);
      if (recentFailures >= 5) {
        await this.triggerAlert({
          type: 'brute_force_attack',
          severity: 'high',
          ip_address: event.ip_address,
          details: { failure_count: recentFailures }
        });
      }
    }
  }
}
```

### 7.2 Threat Detection

#### Anomaly Detection
```typescript
// Example: User behavior analytics
class UserBehaviorAnalytics {
  async analyzeUserActivity(userId: string, activity: UserActivity): Promise<AnomalyResult> {
    const baseline = await this.getUserBaseline(userId);
    const riskScore = this.calculateRiskScore(baseline, activity);

    if (riskScore > 0.8) {
      return {
        isAnomaly: true,
        riskScore,
        reasons: this.getAnomalyReasons(baseline, activity),
        recommendedAction: 'require_mfa'
      };
    }

    return { isAnomaly: false, riskScore };
  }

  private calculateRiskScore(baseline: UserBaseline, activity: UserActivity): number {
    let riskScore = 0;

    // Check for unusual login location
    if (this.isNewLocation(activity.ipAddress, baseline.locations)) {
      riskScore += 0.3;
    }

    // Check for unusual login time
    if (this.isUnusualTime(activity.timestamp, baseline.loginTimes)) {
      riskScore += 0.2;
    }

    // Check for unusual device
    if (this.isNewDevice(activity.device, baseline.devices)) {
      riskScore += 0.3;
    }

    // Check for unusual behavior pattern
    if (this.isUnusualPattern(activity.actions, baseline.behaviorPatterns)) {
      riskScore += 0.2;
    }

    return Math.min(riskScore, 1.0);
  }
}
```

#### Real-time Threat Monitoring
```typescript
// Example: Real-time threat monitoring
class ThreatMonitoringService {
  private monitoringRules: MonitoringRule[] = [
    {
      name: 'SQL Injection Attempt',
      condition: (event) => this.detectSQLInjection(event),
      severity: 'high',
      action: 'block_ip'
    },
    {
      name: 'XSS Attempt',
      condition: (event) => this.detectXSS(event),
      severity: 'medium',
      action: 'log_and_alert'
    },
    {
      name: 'Brute Force Attack',
      condition: (event) => this.detectBruteForce(event),
      severity: 'high',
      action: 'block_ip_and_alert'
    }
  ];

  async processEvent(event: SecurityEvent): Promise<void> {
    for (const rule of this.monitoringRules) {
      if (rule.condition(event)) {
        await this.executeAction(rule.action, event, rule);
      }
    }
  }

  private detectSQLInjection(event: SecurityEvent): boolean {
    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /update\s+set/i,
      /delete\s+from/i
    ];

    const input = JSON.stringify(event.details);
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private detectXSS(event: SecurityEvent): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /<img/i,
      /<iframe/i
    ];

    const input = JSON.stringify(event.details);
    return xssPatterns.some(pattern => pattern.test(input));
  }
}
```

### 7.3 Security Metrics and KPIs

#### Key Security Metrics
```typescript
interface SecurityMetrics {
  // Authentication metrics
  totalLoginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  mfaUsage: number;

  // Incident metrics
  securityIncidents: number;
  dataBreaches: number;
  averageIncidentResponseTime: number;
  averageIncidentResolutionTime: number;

  // Vulnerability metrics
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  vulnerabilitiesFixed: number;
  averageVulnerabilityFixTime: number;

  // Compliance metrics
  complianceScore: number;
  auditFindings: number;
  policyViolations: number;
  trainingCompletion: number;
}

class SecurityMetricsService {
  async calculateMetrics(timeRange: TimeRange): Promise<SecurityMetrics> {
    const metrics: SecurityMetrics = {
      totalLoginAttempts: await this.countLoginAttempts(timeRange),
      successfulLogins: await this.countSuccessfulLogins(timeRange),
      failedLogins: await this.countFailedLogins(timeRange),
      mfaUsage: await this.calculateMFAUsage(timeRange),
      securityIncidents: await this.countSecurityIncidents(timeRange),
      dataBreaches: await this.countDataBreaches(timeRange),
      averageIncidentResponseTime: await this.calculateAverageResponseTime(timeRange),
      averageIncidentResolutionTime: await this.calculateAverageResolutionTime(timeRange),
      criticalVulnerabilities: await this.countCriticalVulnerabilities(timeRange),
      highVulnerabilities: await this.countHighVulnerabilities(timeRange),
      vulnerabilitiesFixed: await this.countVulnerabilitiesFixed(timeRange),
      averageVulnerabilityFixTime: await this.calculateAverageFixTime(timeRange),
      complianceScore: await this.calculateComplianceScore(timeRange),
      auditFindings: await this.countAuditFindings(timeRange),
      policyViolations: await this.countPolicyViolations(timeRange),
      trainingCompletion: await this.calculateTrainingCompletion(timeRange)
    };

    return metrics;
  }
}
```

---

## 8. Compliance Architecture

### 8.1 GDPR Compliance Architecture

#### Data Protection by Design
```typescript
// Example: GDPR compliance implementation
class GDPRComplianceService {
  // Right to be forgotten
  async deleteUserData(userId: string): Promise<void> {
    // Delete user data from all systems
    await this.deleteFromDatabase(userId);
    await this.deleteFromBackup(userId);
    await this.deleteFromLogs(userId);
    await this.deleteFromAnalytics(userId);

    // Document deletion for audit purposes
    await this.logDataDeletion(userId, new Date());

    // Notify third parties if applicable
    await this.notifyThirdPartiesOfDeletion(userId);
  }

  // Right to data portability
  async exportUserData(userId: string): Promise<UserDataExport> {
    const userData = {
      personalInfo: await this.getPersonalInfo(userId),
      bookingHistory: await this.getBookingHistory(userId),
      preferences: await this.getUserPreferences(userId),
      communicationHistory: await this.getCommunicationHistory(userId)
    };

    return {
      format: 'json',
      data: userData,
      exportDate: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  // Consent management
  async updateConsent(userId: string, consentData: ConsentData): Promise<void> {
    await this.saveConsent(userId, consentData);
    await this.logConsentUpdate(userId, consentData);

    if (!consentData.marketing) {
      await this.unsubscribeFromMarketing(userId);
    }

    if (!consentData.analytics) {
      await this.stopAnalyticsTracking(userId);
    }
  }
}
```

#### Data Breach Notification
```typescript
// Example: Data breach notification system
class DataBreachNotificationService {
  async assessBreach(breach: DataBreach): Promise<BreachAssessment> {
    const affectedUsers = await this.identifyAffectedUsers(breach);
    const riskLevel = await this.assessRisk(breach, affectedUsers);
    const notificationRequired = await this.isNotificationRequired(riskLevel);

    return {
      affectedUsersCount: affectedUsers.length,
      riskLevel,
      notificationRequired,
      deadline: this.calculateNotificationDeadline(riskLevel)
    };
  }

  async notifySupervisoryAuthority(breach: DataBreach, assessment: BreachAssessment): Promise<void> {
    const notification = {
      breachDescription: this.describeBreach(breach),
      categoriesOfData: this.getDataCategories(breach),
      affectedUsersCount: assessment.affectedUsersCount,
      measuresTaken: this.getMeasuresTaken(breach),
      contactInformation: this.getDPOContact()
    };

    await this.sendToUODO(notification);
    await this.logNotification('supervisory_authority', notification);
  }

  async notifyDataSubjects(breach: DataBreach, affectedUsers: string[]): Promise<void> {
    const notification = await this.createSubjectNotification(breach);

    for (const userId of affectedUsers) {
      const user = await this.getUser(userId);
      await this.sendNotification(user.email, notification);
      await this.logNotification('data_subject', { userId, notification });
    }
  }
}
```

### 8.2 PCI DSS Compliance

#### Payment Card Security
```typescript
// Example: PCI DSS compliance implementation
class PCIComplianceService {
  // Tokenization of payment card data
  async tokenizePaymentCard(cardData: PaymentCardData): Promise<string> {
    // Never store raw card data
    const token = await this.generateSecureToken();

    // Send card data to PCI-compliant payment processor
    const paymentProcessorResponse = await this.sendToPaymentProcessor({
      cardData,
      token
    });

    // Store only token
    await this.storePaymentToken(token, paymentProcessorResponse.customerId);

    return token;
  }

  // Secure payment processing
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    // Validate request
    await this.validatePaymentRequest(paymentRequest);

    // Use stored token, never raw card data
    const token = await this.getPaymentToken(paymentRequest.customerId);

    // Process through PCI-compliant payment processor
    const result = await this.chargePaymentToken(token, paymentRequest.amount);

    // Log payment for audit purposes
    await this.logPaymentTransaction({
      transactionId: result.transactionId,
      customerId: paymentRequest.customerId,
      amount: paymentRequest.amount,
      timestamp: new Date(),
      status: result.status
    });

    return result;
  }
}
```

### 8.3 Compliance Monitoring

#### Automated Compliance Checking
```typescript
// Example: Compliance monitoring
class ComplianceMonitoringService {
  async checkGDPRCompliance(): Promise<ComplianceReport> {
    const checks = [
      { name: 'Consent Management', check: () => this.checkConsentManagement() },
      { name: 'Data Minimization', check: () => this.checkDataMinimization() },
      { name: 'Data Retention', check: () => this.checkDataRetention() },
      { name: 'Data Subject Rights', check: () => this.checkDataSubjectRights() },
      { name: 'Data Protection Impact Assessment', check: () => this.checkDPIA() },
      { name: 'Breach Notification Procedures', check: () => this.checkBreachNotification() }
    ];

    const results = await Promise.all(
      checks.map(async check => ({
        name: check.name,
        status: await check.check(),
        lastChecked: new Date()
      }))
    );

    const overallScore = results.filter(r => r.status === 'compliant').length / results.length;

    return {
      framework: 'GDPR',
      overallScore,
      checks: results,
      recommendations: this.generateRecommendations(results)
    };
  }

  async checkDataRetention(): Promise<ComplianceStatus> {
    const retentionPolicies = await this.getRetentionPolicies();
    const nonCompliantData = [];

    for (const policy of retentionPolicies) {
      const expiredData = await this.findExpiredData(policy);
      if (expiredData.length > 0) {
        nonCompliantData.push({
          policy: policy.name,
          expiredRecordsCount: expiredData.length
        });
      }
    }

    return nonCompliantData.length === 0 ? 'compliant' : 'non_compliant';
  }
}
```

---

## 9. Security Controls Matrix

### 9.1 Control Framework Mapping

| Security Domain | NIST CSF | ISO 27001 | SOC 2 | PCI DSS | GDPR |
|-----------------|----------|------------|-------|---------|------|
| Access Control | AC | A.9 | CC6.1-8 | Requirement 7 | Article 25 |
| Incident Response | PR | A.16 | CC7.1-4 | Requirement 12 | Article 33 |
| Data Protection | DS | A.8 | CC6.6-7 | Requirement 3-4 | Article 32 |
| Risk Management | RM | A.6 | CC1.2-4 | Requirement 12 | Article 32 |
| Business Continuity | RC | A.17 | CC7.5-6 | Requirement 12 | Article 32 |

### 9.2 Control Implementation Status

#### Implemented Controls
- [x] Multi-factor authentication for all administrative access
- [x] Network segmentation with firewall rules
- [x] Data encryption at rest and in transit
- [x] Regular security monitoring and alerting
- [x] Incident response procedures and testing
- [x] Employee security training programs
- [x] Vulnerability management program
- [x] Access control and least privilege principle
- [x] Security awareness programs
- [x] Business continuity and disaster recovery

#### Controls in Progress
- [ ] Advanced threat detection with AI/ML
- [ ] Security orchestration and automation (SOAR)
- [ ] Cloud security posture management (CSPM)
- [ ] DevSecOps pipeline integration
- [ ] Zero trust architecture implementation

#### Planned Controls
- [ ] Security analytics platform
- [ ] Deception technology implementation
- [ ] Quantum-resistant cryptography
- [ ] Blockchain-based audit trails
- [ ] Advanced biometric authentication

### 9.3 Security Metrics Dashboard

#### Key Performance Indicators (KPIs)
```typescript
interface SecurityKPIs {
  // Detection and Response
  meanTimeToDetect (MTTD): number; // Target: < 4 hours
  meanTimeToRespond (MTTR): number; // Target: < 24 hours

  // Prevention
  vulnerabilityRemediationTime: number; // Target: < 30 days
  securityAwarenessScore: number; // Target: > 90%

  // Compliance
  complianceScore: number; // Target: 100%
  auditFindingsCount: number; // Target: 0 critical findings

  // Operational
  securityIncidentCount: number; // Target: < 5 per year
  falsePositiveRate: number; // Target: < 10%
}
```

#### Real-time Monitoring Dashboard
```typescript
// Example: Dashboard data structure
interface SecurityDashboard {
  threatLandscape: {
    activeThreats: Threat[];
    riskScore: number;
    topVulnerabilities: Vulnerability[];
  };

  operationalStatus: {
    systemAvailability: number;
    securityToolStatus: ToolStatus[];
    recentIncidents: Incident[];
  };

  complianceStatus: {
    gdprCompliance: number;
    pciDssCompliance: number;
    iso27001Compliance: number;
    upcomingAudits: Audit[];
  };

  userActivity: {
    loginAttempts: number;
    failedLogins: number;
    mfaUsage: number;
    suspiciousActivity: Activity[];
  };
}
```

---

## 🔒 Security Architecture Summary

### Key Security Achievements

1. **Multi-layered Security**: Defense-in-depth architecture with controls at network, application, and data layers
2. **Zero Trust Implementation**: Continuous verification and least privilege access
3. **Cloud-Native Security**: Leveraging cloud provider security capabilities with additional controls
4. **Compliance by Design**: Built-in GDPR, PCI DSS, and other regulatory compliance
5. **Real-time Monitoring**: Comprehensive security monitoring with automated threat detection
6. **Incident Response**: Well-defined incident response procedures with regular testing

### Security Technology Stack

```
Frontend Security:
├── Cloudflare WAF + DDoS Protection
├── Content Security Policy (CSP)
├── Security Headers (HSTS, XSS Protection, etc.)
└── Regular Dependency Scanning

Backend Security:
├── Supabase Row Level Security (RLS)
├── PostgreSQL with Transparent Data Encryption
├── JWT-based Authentication + MFA
└── API Rate Limiting and Input Validation

Data Security:
├── AES-256 Encryption at Rest
├── TLS 1.3 Encryption in Transit
├── Tokenized Payment Processing
└── Regular Data Backups with Encryption

Monitoring & Compliance:
├── Real-time Security Monitoring
├── Automated Vulnerability Scanning
├── Compliance Automation (GDPR, PCI DSS)
└── Security Metrics and Reporting
```

### Future Security Roadmap

#### Short-term (6 months)
- Enhanced threat detection with machine learning
- Security orchestration and automation (SOAR)
- Advanced security analytics platform
- Cloud security posture management (CSPM)

#### Medium-term (12 months)
- Zero trust network architecture (ZTNA)
- DevSecOps pipeline integration
- Advanced user behavior analytics
- Quantum-resistant cryptography preparation

#### Long-term (18+ months)
- AI-powered security operations
- Blockchain-based security logging
- Advanced biometric authentication
- Security innovation and research initiatives

---

**Document Version**: 1.0
**Last Updated**: 30 October 2025
**Next Review**: 30 April 2026
**Security Architect**: [Name], [Title]
**Approved By**: [Name], [Title]

This security architecture document provides a comprehensive overview of Mariia Hub's security controls and practices. Regular reviews and updates ensure continued alignment with evolving threats, business requirements, and regulatory obligations.