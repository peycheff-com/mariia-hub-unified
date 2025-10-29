# API Security Implementation Guide

## Overview

This document outlines the comprehensive API security implementation for the Mariia Hub application, following defense-in-depth principles and OWASP best practices.

## Security Architecture

### Multi-Layer Security Model

1. **Network Layer**: HTTPS enforcement, security headers, IP blocking
2. **Application Layer**: Input validation, authentication, authorization
3. **Data Layer**: Encryption, RLS policies, audit logging
4. **Monitoring Layer**: Security event logging, rate limiting, anomaly detection

### Key Security Components

- **Payment Security Manager** (`/src/lib/payment-security.ts`)
- **API Security Validator** (`/src/lib/api-security-validator.ts`)
- **Secure Error Handler** (`/src/lib/secure-error-handler.ts`)
- **Security Monitor** (`/src/lib/security.ts`)
- **Enhanced Security Manager** (`/src/lib/enhanced-security.ts`)

## Implementation Details

### 1. Payment Security

#### Features
- Enhanced webhook signature verification with timestamp validation
- Payment amount validation and fraud detection
- Rate limiting for payment attempts
- Session-based payment tracking
- Anomaly detection for payment patterns

#### Usage
```typescript
import {
  verifyWebhookSignature,
  validatePaymentAmount,
  createSecurePaymentIntent,
  verifyPaymentCompletion
} from '@/lib/payment-security';

// Verify webhook signature
const verification = verifyWebhookSignature(payload, signature);
if (!verification.isValid) {
  // Handle invalid webhook
}

// Create secure payment intent
const validation = createSecurePaymentIntent({
  amount: 10000,
  currency: 'PLN',
  customerId: 'customer_123',
  sessionId: 'session_456'
});

if (!validation.isAllowed) {
  // Handle blocked payment
}
```

### 2. API Security Validation

#### Features
- Request/response validation with Zod schemas
- Rate limiting with multiple windows
- IP-based security checks
- Origin validation
- Input sanitization and XSS prevention
- Suspicious pattern detection

#### Configuration
```typescript
import { apiSecurityValidator, validateApiRequest } from '@/lib/api-security-validator';

const config = {
  enableRateLimiting: true,
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  enableInputValidation: true,
  enableOutputSanitization: true,
  blockedCountries: ['CN', 'RU', 'KP'],
  allowedOrigins: ['https://mariia-hub.pl']
};
```

#### Usage
```typescript
const context = {
  userId: 'user_123',
  sessionId: 'session_456',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  origin: 'https://mariia-hub.pl',
  requestId: 'req_789',
  timestamp: Date.now()
};

const validation = validateApiRequest(request, context, validationSchema);
if (!validation.isValid) {
  // Handle security validation failure
}
```

### 3. Secure Error Handling

#### Features
- Information leakage prevention
- Secure error logging without sensitive data
- Client-safe error messages
- Error rate limiting
- Security event correlation

#### Usage
```typescript
import { handleSecureError } from '@/lib/secure-error-handler';

const context = {
  userId: 'user_123',
  sessionId: 'session_456',
  requestId: 'req_789',
  ipAddress: '192.168.1.1',
  endpoint: '/api/bookings',
  method: 'POST',
  statusCode: 500,
  timestamp: Date.now()
};

try {
  // Your code here
} catch (error) {
  const secureResponse = handleSecureError(error, context);
  // Return secureResponse to client
}
```

### 4. Database Security

#### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce principle of least privilege
- Admin-only access to sensitive data
- User-scoped data access

#### Audit Logging
- Comprehensive audit trails for all data changes
- Sensitive field masking
- IP address and user agent tracking
- Automated cleanup of old logs

#### Security Functions
```sql
-- Log security events
SELECT log_security_event('SUSPICIOUS_ACTIVITY', 'high', 'user_123', 'session_456', '192.168.1.1');

-- Check rate limits
SELECT * FROM check_rate_limit('user_123', 100, 60);

-- Block IP address
SELECT block_ip_address('192.168.1.1', 'Multiple failed login attempts', 'admin_456', NOW() + INTERVAL '1 day');
```

## Security Monitoring

### Security Events
All security events are automatically logged and can be monitored through:

1. **Client-side monitoring**: SecurityMonitor class in browser
2. **Server-side monitoring**: Database security_events table
3. **Real-time alerts**: Critical events trigger immediate notifications

### Metrics
- Security event counts by severity
- Rate limit violations
- Blocked IP addresses
- Payment fraud detection scores
- API abuse patterns

### Dashboard
A security dashboard view provides at-a-glance security metrics:
```sql
SELECT * FROM security_dashboard;
```

## Security Best Practices

### 1. Environment Variables
All sensitive configuration uses environment variables:
```bash
# Security configuration
CREDENTIALS_ENCRYPTION_KEY=your_32_byte_encryption_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Credential Management
- Encrypted storage for all third-party credentials
- Automatic credential rotation
- Audit logging for credential changes
- Secure key derivation with AES-256-GCM

### 3. Input Validation
- All API inputs validated with Zod schemas
- XSS prevention with content sanitization
- SQL injection prevention with parameterized queries
- File upload security with type and size validation

### 4. Authentication & Authorization
- JWT-based authentication with short expiration
- Role-based access control (RBAC)
- Session management with secure cookies
- Multi-factor authentication support

### 5. Rate Limiting
- Multi-level rate limiting (IP, user, endpoint)
- Exponential backoff for repeated violations
- Automatic IP blocking for abuse
- Configurable limits per service tier

## Security Testing

### 1. Automated Security Audit
Run the security audit script:
```bash
npm run security:audit
```

This script checks for:
- Hardcoded credentials
- Insecure dependencies
- File permission issues
- SQL injection vulnerabilities
- XSS risks
- Security misconfigurations

### 2. Penetration Testing
Regular penetration testing should include:
- API endpoint testing
- Authentication bypass attempts
- Input validation testing
- Rate limiting bypass attempts
- Webhook signature forgery attempts

### 3. Code Review Security Checklist
- [ ] No hardcoded secrets or credentials
- [ ] All user inputs validated
- [ ] Error messages don't leak sensitive information
- [ ] Proper authentication/authorization checks
- [ ] Rate limiting implemented
- [ ] Security events logged appropriately
- [ ] HTTPS enforced in production
- [ ] Security headers configured

## Incident Response

### Security Event Classification

#### Critical (Immediate Response Required)
- Authentication bypass attempts
- Payment fraud detection
- Data exfiltration attempts
- System compromise indicators

#### High (Response Within 1 Hour)
- Rate limit violations
- Suspicious API patterns
- Webhook signature failures
- Multiple failed authentication attempts

#### Medium (Response Within 4 Hours)
- Suspicious user activity
- Unusual payment patterns
- IP blocking required
- Security configuration issues

#### Low (Response Within 24 Hours)
- Minor security policy violations
- Outdated dependencies
- Configuration recommendations
- Security metric anomalies

### Response Procedures

1. **Immediate Isolation**: Block offending IP addresses
2. **Investigation**: Review security logs and patterns
3. **Containment**: Apply additional security measures
4. **Recovery**: Restore normal operations securely
5. **Post-mortem**: Document and improve procedures

## Compliance

### GDPR Compliance
- Data minimization principles
- Right to be forgotten implementation
- Data breach notification procedures
- Consent management system

### PCI DSS Compliance
- Payment card data encryption
- Secure credential storage
- Access control measures
- Regular security testing

### OWASP Compliance
- OWASP Top 10 vulnerability prevention
- Secure coding practices
- Security testing automation
- Incident response procedures

## Maintenance

### Regular Security Tasks
- [ ] Weekly: Review security event logs
- [ ] Monthly: Update security dependencies
- [ ] Quarterly: Run penetration testing
- [ ] Annually: Security architecture review

### Security Updates
- Monitor security advisories for all dependencies
- Apply security patches promptly
- Test security updates in staging
- Document all security changes

### Training
- Security awareness training for developers
- Incident response training for operations team
- Regular security best practices review
- Threat intelligence updates

## Troubleshooting

### Common Security Issues

#### Rate Limit Errors
```typescript
// Check current rate limit status
const rateLimit = apiSecurityValidator.checkRateLimit(context, 100, 60000);
if (!rateLimit.isAllowed) {
  console.log(`Retry after: ${rateLimit.retryAfter} seconds`);
}
```

#### Webhook Validation Failures
```typescript
// Verify webhook signature with debugging
const verification = verifyWebhookSignature(payload, signature);
if (!verification.isValid) {
  console.error('Webhook verification failed:', verification.error);
  // Log additional debugging information
}
```

#### Security Event Logging
```typescript
// Monitor security events
const monitor = SecurityMonitor.getInstance();
const events = monitor.getSecurityEvents();
console.log('Recent security events:', events);
```

### Debug Mode
Enable detailed security logging in development:
```typescript
const config = {
  enableDetailedLogging: true,
  enableStackTrace: true,
  logSecurityEvents: true
};
```

## Support

For security-related issues:
1. Check the security dashboard for ongoing issues
2. Review recent security event logs
3. Run the security audit script
4. Contact the security team for critical issues

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)