# Mariia Hub Platform - Operational Runbooks

**Version:** 1.0
**Last Updated:** 2025-10-30
**Owner:** Operations Team
**Review Date:** Monthly

## Overview

This document contains operational runbooks for common scenarios that may occur during the operation of the Mariia Hub platform. Each runbook provides step-by-step procedures for diagnosing, responding to, and resolving operational issues.

## Table of Contents

1. [Incident Response Procedures](#incident-response-procedures)
2. [Performance Troubleshooting](#performance-troubleshooting)
3. [Security Incident Handling](#security-incident-handling)
4. [Service Availability Issues](#service-availability-issues)
5. [Database Issues](#database-issues)
6. [Payment Processing Issues](#payment-processing-issues)
7. [Third-Party Integration Issues](#third-party-integration-issues)
8. [Monitoring and Alerting Response](#monitoring-and-alerting-response)
9. [Scaling Procedures](#scaling-procedures)
10. [Communication Procedures](#communication-procedures)

## Incident Response Procedures

### Incident Classification

#### Severity Levels
- **SEV-0 (Critical):** Complete service outage, business impact severe
- **SEV-1 (High):** Major functionality broken, significant user impact
- **SEV-2 (Medium):** Partial functionality degraded, moderate user impact
- **SEV-3 (Low):** Minor issues, limited user impact
- **SEV-4 (Info):** Cosmetic issues, no functional impact

#### Response Times
- **SEV-0:** Immediate response (< 5 minutes), resolution within 1 hour
- **SEV-1:** Response within 15 minutes, resolution within 4 hours
- **SEV-2:** Response within 1 hour, resolution within 24 hours
- **SEV-3:** Response within 4 hours, resolution within 72 hours
- **SEV-4:** Response within 24 hours, resolution in next sprint

### General Incident Response Process

#### Phase 1: Detection and Assessment (0-15 minutes)

```bash
# 1.1 Alert verification
# Check monitoring dashboards
# Review alert notifications
# Verify scope and impact

# 1.2 Initial assessment
npm run monitoring:status
npm run health-check:comprehensive

# 1.3 Severity determination
# Use impact matrix to classify severity
# Document initial findings
```

#### Phase 2: Triage and Coordination (15-60 minutes)

```bash
# 2.1 Incident commander assignment
# Establish incident channel (Slack/Teams)
# Identify stakeholders

# 2.2 Initial investigation
vercel logs --limit=100 --since=15m
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID
npm run monitoring:quick-scan

# 2.3 Communication setup
# Send incident notification
# Set status page updates
# Establish external communication plan
```

#### Phase 3: Investigation and Resolution (Variable)

```bash
# 3.1 Deep investigation
# Follow specific runbooks based on symptoms
# Collect diagnostic data
# Identify root cause

# 3.2 Resolution implementation
# Apply fix or workaround
# Test solution
# Deploy changes if needed

# 3.3 Verification
npm run test:smoke
npm run monitoring:verify
# Manual user journey testing
```

#### Phase 4: Recovery and Post-Incident (60-120 minutes)

```bash
# 4.1 Service restoration verification
# Monitor for regression
# Validate all functionality
# Confirm performance baseline

# 4.2 Documentation
# Complete incident report
# Update runbooks
# Schedule post-mortem

# 4.3 Communication closure
# Update status page
# Send resolution notification
# Close incident channels
```

## Performance Troubleshooting

### High Response Times

#### Symptoms
- Page load times > 5 seconds
- API response times > 2 seconds
- Database query timeouts
- Core Web Vitals degradation

#### Diagnostic Steps

```bash
# 1. Check overall application performance
curl -w "@curl-format.txt" -o /dev/null -s "https://mariaborysevych.com"

# 2. Analyze Vercel performance metrics
vercel logs --since=1h --filter=function

# 3. Check database performance
supabase db debug --project-ref $VITE_SUPABASE_PROJECT_ID

# 4. Run Lighthouse audit
npm run lighthouse:audit

# 5. Check bundle size and loading
npm run build:analyze
```

#### Common Causes and Solutions

**Frontend Performance Issues**
```bash
# Bundle size optimization
npm run analyze:bundle
# Identify large chunks and optimize imports

# Image optimization
# Check for unoptimized images
npm run audit:images

# JavaScript execution issues
# Check for memory leaks
npm run monitor:memory
```

**Backend Performance Issues**
```bash
# Database query optimization
supabase db shell --command "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;
"

# Index optimization
# Check missing indexes
supabase db shell --command "
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';
"

# Connection pooling
# Verify connection limits
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID
```

#### Performance Monitoring Commands

```bash
# Real-time performance monitoring
npm run monitoring:realtime

# Performance baseline comparison
npm run monitoring:compare-baseline

# Set up performance alerts
npm run alerts:configure-performance
```

### Memory Usage Issues

#### Detection
```bash
# Check Vercel function memory usage
vercel logs --filter=function --since=1h

# Monitor browser memory usage
# Use Chrome DevTools Performance tab

# Database memory usage
supabase db shell --command "
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database;
"
```

#### Resolution Steps
```bash
# Frontend optimization
# Implement code splitting
npm run optimize:code-splitting

# Implement lazy loading
npm run optimize:lazy-loading

# Clean up unused dependencies
npm run cleanup:dependencies

# Backend optimization
# Optimize database queries
# Implement connection pooling
# Add caching layers
```

## Security Incident Handling

### Security Incident Types

#### Data Breach
**Symptoms:**
- Unauthorized data access
- Data exfiltration detected
- Suspicious API activity
- User reports of unauthorized access

#### Response Procedure

```bash
# 1. Immediate containment (first 15 minutes)
# Block suspicious IPs
curl -X POST https://mariaborysevych.com/api/admin/security/block-ip \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"ip": "suspicious-ip", "reason": "security-incident"}'

# Rotate compromised credentials
npm run security:rotate-credentials

# Enable enhanced monitoring
npm run security:enhanced-monitoring
```

```bash
# 2. Investigation (15-60 minutes)
# Review access logs
vercel logs --since=24h --filter=security

# Check database access patterns
supabase db shell --command "
SELECT
    user_id,
    action,
    created_at,
    metadata
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
"

# Identify affected users
npm run security:identify-affected-users
```

```bash
# 3. Eradication and Recovery (1-4 hours)
# Patch vulnerabilities
npm run security:patch-vulnerabilities

# Reset user sessions
npm run security:reset-sessions

# Notify affected users
npm run security:notify-users

# Update security configurations
npm run security:harden-configurations
```

#### DDoS Attack
**Symptoms:**
- Sudden traffic spikes
- Service degradation
- High error rates
- Resource exhaustion

**Response Procedure**
```bash
# 1. Detection
npm run monitoring:ddos-detection

# 2. Mitigation
# Enable rate limiting
npm run security:enable-rate-limiting

# Block attack patterns
npm run security:block-attack-patterns

# Scale resources if needed
npm run scaling:emergency-scale

# 3. Monitoring
npm run monitoring:ddos-monitoring
```

### Security Monitoring

```bash
# Continuous security monitoring
npm run security:monitor

# Vulnerability scanning
npm run security:scan

# Security audit
npm run security:audit
```

## Service Availability Issues

### Complete Service Outage

#### Detection
```bash
# 1. Check service status
curl -f https://mariaborysevych.com/api/health-check
curl -f https://mariaborysevych.com
curl -f https://api.supabase.io/rest/v1/

# 2. Check hosting provider status
curl https://www.vercel-status.com/
curl https://status.supabase.io/

# 3. Check domain and DNS
nslookup mariaborysevych.com
dig mariaborysevych.com
```

#### Immediate Response
```bash
# 1. Check Vercel deployment status
vercel list

# 2. Check recent deployments
vercel logs --since=1h

# 3. Check for automatic rollback
vercel rollback

# 4. Manual redeploy if needed
vercel --prod --force
```

### Partial Service Degradation

#### Specific Service Issues

**Database Issues**
```bash
# Check database status
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID

# Check database connections
npm run test:db:connection

# Check query performance
supabase db debug --project-ref $VITE_SUPABASE_PROJECT_ID
```

**Payment Processing Issues**
```bash
# Check Stripe status
curl https://status.stripe.com/

# Test payment flow
npm run test:payment:staging

# Check Stripe webhook delivery
stripe listen --list-forwarded-events
```

**Email Service Issues**
```bash
# Check email delivery
npm run test:email:delivery

# Review email logs
npm run logs:email-service

# Test email configuration
npm run test:email:config
```

## Database Issues

### Database Connection Problems

#### Diagnosis
```bash
# 1. Check database status
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID

# 2. Test connectivity
npm run test:db:connection

# 3. Check connection limits
supabase db shell --command "
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
"

# 4. Check database size
supabase db shell --command "
SELECT pg_size_pretty(pg_database_size('postgres'));
"
```

#### Resolution
```bash
# 1. Increase connection pool size
# Via Supabase dashboard

# 2. Optimize long-running queries
supabase db shell --command "
SELECT
    now() - query_start as duration,
    query,
    state
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes';
"

# 3. Kill problematic connections
supabase db shell --command "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%problematic-query%';
"
```

### Database Performance Issues

#### Slow Query Resolution
```bash
# 1. Identify slow queries
supabase db shell --command "
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY total_time DESC;
"

# 2. Analyze query execution plans
supabase db shell --command "
EXPLAIN ANALYZE [SLOW_QUERY];
"

# 3. Add missing indexes
supabase migration new add-performance-indexes
# Add appropriate CREATE INDEX statements

# 4. Update statistics
supabase db shell --command "ANALYZE;"
```

### Database Backup and Recovery

#### Manual Backup
```bash
# Create backup
npx supabase db dump \
  --project-ref $VITE_SUPABASE_PROJECT_ID \
  --data-only \
  --exclude-table audit_logs \
  > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
head backup-$(date +%Y%m%d-%H%M%S).sql
```

#### Point-in-Time Recovery
```bash
# Restore from backup
npx supabase db restore \
  --project-ref $VITE_SUPABASE_PROJECT_ID \
  --backup-url [backup-url]

# Verify data integrity
npm run test:data:integrity
```

## Payment Processing Issues

### Stripe Integration Problems

#### Payment Failures
```bash
# 1. Check Stripe status
curl https://status.stripe.com/

# 2. Review recent webhook events
stripe listen --list-forwarded-events

# 3. Check payment intent status
stripe payment_intents list --limit=10

# 4. Test payment flow
npm run test:payment:staging
```

#### Webhook Issues
```bash
# 1. Check webhook configuration
stripe webhook_endpoints list

# 2. Test webhook delivery
stripe trigger payment_intent.succeeded

# 3. Check webhook logs
vercel logs --filter=webhook --since=1h

# 4. Recreate webhook if needed
stripe webhook_endpoints create \
  --url "https://mariaborysevych.com/api/stripe/webhook" \
  --enabled-events "payment_intent.succeeded,payment_intent.payment_failed"
```

### Refund and Dispute Issues

#### Manual Refund Process
```bash
# Process refund via Stripe CLI
stripe refunds create \
  --payment-intent pi_1234567890 \
  --amount 10000 \
  --reason "requested_by_customer"

# Verify refund
stripe refunds list --limit=5
```

## Third-Party Integration Issues

### Booksy Synchronization Issues

#### Diagnosis
```bash
# 1. Test Booksy API connection
npm run test:booksy:connection

# 2. Check synchronization logs
npm run logs:booksy-sync

# 3. Review recent sync attempts
npm run booksy:sync-status
```

#### Resolution
```bash
# 1. Refresh Booksy authentication
npm run booksy:refresh-auth

# 2. Manual synchronization
npm run booksy:sync-manual

# 3. Reset synchronization state
npm run booksy:reset-sync-state
```

### Google Analytics Issues

#### Tracking Verification
```bash
# 1. Check GA configuration
npm run test:analytics:config

# 2. Verify tracking events
npm run test:analytics:events

# 3. Check data collection
npm run analytics:verify-collection
```

## Monitoring and Alerting Response

### Alert Types and Response

#### High Error Rate Alert
```bash
# 1. Check error logs
vercel logs --since=1h --filter=error

# 2. Identify error patterns
npm run monitoring:analyze-errors

# 3. Check specific endpoints
curl -I https://mariaborysevych.com/api/problematic-endpoint

# 4. Deploy hotfix if needed
# Follow hotfix deployment procedure
```

#### High Memory Usage Alert
```bash
# 1. Check memory metrics
npm run monitoring:memory-usage

# 2. Identify memory leaks
npm run monitoring:memory-leak-detection

# 3. Restart affected services
vercel restart

# 4. Optimize memory usage
npm run optimize:memory
```

#### Database Connection Limit Alert
```bash
# 1. Check connection count
supabase db shell --command "
SELECT count(*) as total_connections
FROM pg_stat_activity;
"

# 2. Kill idle connections
supabase db shell --command "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND now() - query_start > interval '1 hour';
"

# 3. Increase connection pool
# Via Supabase dashboard
```

### Custom Alert Setup

```bash
# Create custom alert
npm run alerts:create \
  --name "high-response-time" \
  --condition "response-time > 2000ms" \
  --duration "5m" \
  --severity "warning"

# Test alert
npm run alerts:test --name "high-response-time"
```

## Scaling Procedures

### Auto-scaling Configuration

#### Vercel Scaling
```bash
# 1. Check current scaling limits
vercel limits

# 2. Configure scaling rules
vercel scale configure \
  --min-instances 1 \
  --max-instances 10 \
  --scale-threshold 70

# 3. Enable edge functions scaling
vercel functions scale \
  --name "api/bookings" \
  --min-instances 2 \
  --max-instances 20
```

#### Database Scaling
```bash
# 1. Monitor database load
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID

# 2. Enable connection pooling
# Via Supabase dashboard

# 3. Upgrade compute resources
supabase projects update \
  --project-ref $VITE_SUPABASE_PROJECT_ID \
  --tier "pro"
```

### Load Testing Before Scaling

```bash
# 1. Run load test
npm run test:load --users=1000 --duration=10m

# 2. Analyze results
npm run analyze:load-test-results

# 3. Identify bottlenecks
npm run monitoring:identify-bottlenecks

# 4. Scale appropriately
# Based on test results
```

## Communication Procedures

### Internal Communication

#### Incident Communication Protocol
```bash
# 1. Create incident channel
# Slack: #incident-YYYY-MM-DD

# 2. Initial notification
npm run notify:incident \
  --severity "SEV-1" \
  --description "Service degradation detected" \
  --impact "Users experiencing slow booking times"

# 3. Status updates (every 15 minutes)
npm run notify:status-update \
  --message "Investigation in progress, no ETA yet"

# 4. Resolution notification
npm run notify:resolution \
  --resolution "Deployed fix, monitoring for regression"
```

### External Communication

#### Customer Communication
```bash
# 1. Update status page
npm run status-page:update \
  --status "degraded" \
  --message "We're experiencing issues with booking system"

# 2. Send customer notification
npm run notify:customers \
  --type "email" \
  --subject "Service Status Update" \
  --message "We're working to resolve the issue"

# 3. Social media updates
# Post updates on relevant platforms
```

### Stakeholder Communication

#### Management Updates
```bash
# 1. Executive summary
npm run report:incident-summary \
  --severity "SEV-1" \
  --impact "Revenue impact estimated at X%" \
  --resolution-time "45 minutes"

# 2. Post-incident report
npm run report:post-incident \
  --root-cause "Database connection pool exhaustion" \
  --preventive-measures "Added connection pooling and monitoring"
```

## Documentation and Knowledge Management

### Runbook Maintenance

#### Regular Updates
- Review runbooks monthly
- Update after each incident
- Incorporate lessons learned
- Validate procedures quarterly

#### Runbook Testing
```bash
# Test runbook procedures
npm run runbook:test \
  --scenario "database-connection-issue" \
  --environment "staging"

# Validate contact information
npm run contacts:verify

# Test communication channels
npm run communication:test
```

## Tools and Commands Reference

### Essential Commands

```bash
# Application Health
npm run health-check:full
npm run monitoring:status
npm run test:smoke

# Log Analysis
vercel logs --since=1h --filter=error
npm run logs:analyze

# Database Operations
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID
supabase db debug --project-ref $VITE_SUPABASE_PROJECT_ID

# Performance Analysis
npm run lighthouse:audit
npm run performance:monitor

# Security Operations
npm run security:scan
npm run security:audit

# Communication
npm run notify:incident
npm run status-page:update
```

### Monitoring Dashboards

- **Vercel Analytics:** Application performance and usage
- **Supabase Dashboard:** Database performance and usage
- **Stripe Dashboard:** Payment processing and transactions
- **Custom Dashboards:** Business metrics and KPIs

## Contact Information

### Primary Contacts
- **Incident Commander:** [Name] - [Email] - [Phone]
- **Technical Lead:** [Name] - [Email] - [Phone]
- **DevOps Engineer:** [Name] - [Email] - [Phone]
- **Security Officer:** [Name] - [Email] - [Phone]

### Service Providers
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.io
- **Stripe Support:** support@stripe.com

### Escalation Contacts
- **CTO:** [Name] - [Email] - [Phone]
- **CEO:** [Name] - [Email] - [Phone]
- **PR/Comms:** [Name] - [Email] - [Phone]

---

**Document Status:** Active
**Next Review Date:** 2025-11-30
**Approved By:** Operations Team Lead