# Mariia Hub Emergency Runbook

## Overview

This emergency runbook provides step-by-step procedures for handling critical incidents affecting the Mariia Hub beauty and fitness booking platform. Follow these procedures systematically to minimize downtime and user impact.

## Incident Severity Levels

### CRITICAL (P0)
- Complete system outage
- Payment processing failures
- Data loss or corruption
- Security breach
- Impact: All users affected
- Response Time: 15 minutes

### HIGH (P1)
- Major functionality broken (booking system, payments)
- Performance severely degraded
- Authentication failures
- Impact: Most users affected
- Response Time: 1 hour

### MEDIUM (P2)
- Partial functionality issues
- Performance degradation
- Some features unavailable
- Impact: Some users affected
- Response Time: 4 hours

### LOW (P3)
- Minor issues
- Cosmetic problems
- Documentation updates
- Impact: Few users affected
- Response Time: 24 hours

## Immediate Response Procedures

### 1. System Outage (SEV-0)

**Detection:**
- Monitoring alerts (Sentry, UptimeRobot)
- Customer reports (email, social media)
- Internal team reports

**First 5 Minutes:**
1. **Acknowledge Alert**
   - Slack: `#incidents` channel
   - Message: "🚨 SEV-0 Incident detected. Investigating now."
   - Assign incident commander

2. **Initial Assessment**
   ```bash
   # Check service status
   curl -f https://mariia-hub.com/health
   curl -f https://api.mariia-hub.com/health

   # Check Vercel status
   curl https://www.vercel-status.com/api/v2/status.json

   # Check Supabase status
   curl https://status.supabase.com/api/v2/status.json
   ```

3. **Create Incident Channel**
   - Slack: `#incident-YYYY-MM-DD-HHMM`
   - Add incident response team
   - Pin important messages

**First 15 Minutes:**
1. **Identify Scope**
   - Check dashboard: https://sentry.io/mariia-hub
   - Review error rates and patterns
   - Check recent deployments

2. **Communicate**
   - Update Slack with findings
   - Prepare customer communication if needed
   - Set status page: https://status.mariia-hub.com

3. **Mitigation Actions**
   - If deployment-related: Rollback immediately
   - If database issue: Switch to read-only mode
   - If third-party: Implement fallback

### 2. High Severity Incident (SEV-1)

**First Hour:**
1. **Investigate Root Cause**
   - Review logs in Vercel
   - Check API response times
   - Analyze database performance

2. **Implement Fix**
   - Hotfix deployment
   - Configuration change
   - Temporary workaround

3. **Monitor**
   - Watch error rates
   - Monitor user reports
   - Check system metrics

## Common Incident Scenarios

### Database Connection Failure

**Symptoms:**
- 503 errors on booking endpoints
- Timeout errors
- Failed database queries

**Response:**
```bash
# 1. Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# 2. Test database connection
npx supabase db shell --command "SELECT 1;"

# 3. Check connection pool
SELECT * FROM pg_stat_activity WHERE state = 'active';

# 4. If connection pool exhausted:
-- Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < now() - interval '5 minutes';
```

**Recovery:**
1. Restart application if connection pool corrupted
2. Scale up database resources if needed
3. Implement connection retry logic

### Payment Processing Failure

**Symptoms:**
- Booking failures at payment step
- Stripe webhook errors
- Payment confirmation timeouts

**Response:**
```bash
# 1. Check Stripe status
curl https://status.stripe.com/api/v2/status.json

# 2. Verify Stripe keys
echo $VITE_STRIPE_PUBLIC_KEY
echo $STRIPE_SECRET_KEY

# 3. Check webhook endpoints
curl -X POST https://mariia-hub.com/api/webhooks/stripe \
  -H "Stripe-Signature: test"
```

**Recovery:**
1. Verify API keys are correct
2. Check webhook URL configuration
3. Review recent Stripe changes
4. Fallback to manual payment confirmation

### Authentication Failures

**Symptoms:**
- Login failures
- Session timeouts
- Auth token errors

**Response:**
```bash
# 1. Check Supabase Auth status
curl https://api.supabase.com/v1/projects/{project-id}/auth/status

# 2. Test auth flow
curl -X POST https://{project-ref}.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: {anon-key}" \
  -d '{"email": "test@example.com", "password": "test"}'

# 3. Check JWT settings
SELECT * FROM auth.config WHERE key LIKE '%jwt%';
```

**Recovery:**
1. Refresh JWT secret if expired
2. Check RLS policies
3. Verify auth configuration

### Performance Degradation

**Symptoms:**
- Slow page loads
- High response times
- Timeouts

**Response:**
```bash
# 1. Check Core Web Vitals
curl -s https://pagespeed.web.dev/report?url=https://mariia-hub.com

# 2. Analyze bundle size
npm run build:analyze

# 3. Check Vercel Edge performance
vercel logs --filter=error

# 4. Monitor database queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Recovery:**
1. Enable aggressive caching
2. Optimize database queries
3. Scale up infrastructure
4. Implement loading states

## Rollback Procedures

### Quick Rollback (5 minutes)
```bash
# 1. List recent deployments
vercel ls

# 2. Identify last stable deployment
vercel inspect {deployment-url}

# 3. Promote stable deployment
vercel promote {stable-deployment-url}

# 4. Verify rollback
curl -f https://mariia-hub.com/health
```

### Database Rollback
```bash
# 1. Create backup before rollback
npx supabase db dump --data-only > backup.sql

# 2. Rollback migration
npx supabase migration rollback

# 3. Verify data integrity
npx supabase db shell --command "SELECT COUNT(*) FROM bookings;"
```

## Communication Templates

### Initial Incident Notification
```
🚨 **SEV-{X} Incident Declared**

**Time**: {timestamp}
**Impact**: {affected systems/features}
**Current Status**: {investigating/mitigating/resolved}
**Next Update**: {time}

**Incident Commander**: @name
**Engineering Lead**: @name
**Communications Lead**: @name

#incident-{channel}
```

### Customer Communication (Email)
```
Subject: Service Issue - {Service Name}

Dear Customer,

We are currently experiencing technical difficulties with {service name}.
Our team has been alerted and is working to resolve the issue.

What's affected: {brief description}
Estimated resolution: {timeframe}

We apologize for the inconvenience and appreciate your patience.

Updates will be posted at: https://status.mariia-hub.com

Best regards,
Mariia Hub Team
```

### Post-Mortem Template
```
# Post-Mortem: {Incident Title}

## Summary
{Brief description of what happened and impact}

## Timeline
- {Time}: Incident detected
- {Time}: Response initiated
- {Time}: Mitigation implemented
- {Time}: Service restored

## Root Cause
{What caused the incident}

## Impact
- Number of users affected
- Duration of outage
- Business impact

## What Went Well
{Positive aspects of response}

## What Could Be Improved
{Areas for improvement}

## Action Items
- [ ] {Task 1} - Owner - Due date
- [ ] {Task 2} - Owner - Due date

## Prevention Measures
{How to prevent recurrence}
```

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Availability**
   - Uptime percentage
   - Error rate (5xx)
   - Response time (p95)

2. **Performance**
   - Core Web Vitals
   - Bundle size
   - API response time

3. **Business Metrics**
   - Booking success rate
   - Payment success rate
   - User conversion rate

### Alert Thresholds
- Error rate > 5% for 5 minutes
- Response time > 2 seconds for 10 minutes
- Uptime < 99.9% for 15 minutes

## Escalation Policy

### Escalation Contacts
| Time | Primary Contact | Secondary Contact |
|------|-----------------|------------------|
| Business Hours | On-call Engineer | Engineering Lead |
| After Hours | On-call Engineer | CTO |

### Escalation Triggers
1. No response after 30 minutes
2. Issue severity increases
3. Customer impact exceeds thresholds

## Training and Preparation

### Incident Commander Training
- Monthly incident simulations
- Chaos engineering exercises
- Communication drills

### On-Call Preparation
- Read this runbook thoroughly
- Participate in incident simulations
- Keep contact information updated

### Tools Access
Ensure access to:
- Sentry (error tracking)
- Vercel (deployment)
- Supabase (database)
- Stripe (payments)
- Status page (customer communication)

## Documentation Updates

After each incident:
1. Update this runbook with lessons learned
2. Create new playbooks for recurring issues
3. Review and improve monitoring
4. Update contact information

## Additional Resources

- [Internal Wiki](https://wiki.mariia-hub.com)
- [System Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Monitoring Dashboard](https://grafana.mariia-hub.com)
- [Alerting Rules](https://sentry.io/mariia-hub/alerts)

---
**Remember**: Stay calm, communicate clearly, and focus on restoring service quickly and safely.