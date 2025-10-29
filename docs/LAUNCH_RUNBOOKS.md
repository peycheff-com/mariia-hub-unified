# Launch Runbooks

## Table of Contents
1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Launch Day Runbook](#launch-day-runbook)
3. [Post-Launch Monitoring](#post-launch-monitoring)
4. [Emergency Procedures](#emergency-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Communication Templates](#communication-templates)

---

## Pre-Launch Checklist

### 7 Days Before Launch

#### Technical Validation
- [ ] **Database Migration**
  - [ ] All migrations tested in staging
  - [ ] Backup procedures verified
  - [ ] Rollback scripts prepared
  - [ ] Performance tests completed

- [ ] **Infrastructure**
  - [ ] CDN configured and warmed
  - [ ] SSL certificates installed and valid
  - [ ] Load balancer configured
  - [ ] Auto-scaling rules tested
  - [ ] Monitoring dashboards live
  - [ ] Alert notifications tested

- [ ] **Security**
  - [ ] Security audit completed
  - [ ] Vulnerabilities remediated
  - [ ] Firewall rules configured
  - [ ] Rate limiting enabled
  - [ ] CORS settings verified
  - [ ] Security headers configured

- [ ] **Third-party Integrations**
  - [ ] Stripe production keys configured
  - [ ] Stripe webhook endpoints verified
  - [ ] Supabase production configured
  - [ ] Email service verified
  - [ ] SMS service credits purchased
  - [ ] Meta CAPI test events sent

#### Content & Localization
- [ ] **Polish Language**
  - [ ] All UI translated and reviewed
  - [ ] Email templates translated
  - [ ] SMS templates translated
  - [ ] Legal documents translated
  - [ ] Date/time formats configured

- [ ] **Service Catalog**
  - [ ] All services configured with pricing
  - [ ] Images optimized and uploaded
  - [ ] Descriptions finalized
  - [ ] FAQ sections populated

#### Compliance
- [ ] **Polish Market Requirements**
  - [ ] VAT calculation rules implemented
  - [ ] NIP validation configured
  - [ ] Invoice templates ready
  - [ ] Privacy policy updated
  - [ ] Terms of service finalized
  - [ ] GDPR consent management active

### 1 Day Before Launch

#### Final Verification
- [ ] **Production Environment**
  - [ ] Environment variables verified
  - [ ] Database connection tested
  - [ ] Cache cleared and warmed
  - [ ] Build process verified
  - [ ] Service workers tested

- [ ] **Team Preparation**
  - [ ] On-call schedule set
  - [ ] Emergency contacts verified
  - [ ] Communication channels ready
  - [ ] Access permissions verified
  - [ ] Documentation accessible

---

## Launch Day Runbook

### T-4 Hours: Final Preparations

#### Team Actions
- [ ] **All Hands Meeting** (30 minutes)
  - Review launch timeline
  - Confirm roles and responsibilities
  - Verify communication channels
  - Last-minute questions

- [ ] **Technical Checks**
  - [ ] Verify monitoring dashboards
  - [ ] Check alert notifications
  - [ ] Validate backup integrity
  - [ ] Test rollback procedures

### T-2 Hours: Go/No-Go Decision

#### Launch Criteria Checklist
- [ ] All critical bugs resolved
- [ ] Monitoring green for 1 hour
- [ ] Team ready and available
- [ ] No external incidents
- [ ] Final smoke test passed

#### Decision Process
1. Technical Lead confirms system health
2. Product Lead confirms business readiness
3. CEO makes final Go/No-Go decision
4. Team notified of decision

### T-0: Launch Execution

#### Step-by-Step Launch
1. **Database Migration**
   ```bash
   # Run production migration
   npx supabase db push
   ```

2. **Deploy Application**
   ```bash
   # Build and deploy
   npm run build
   # Deploy to production
   ```

3. **Update DNS** (if needed)
   - Verify DNS propagation
   - Check SSL certificates

4. **Warm Up Systems**
   - Hit key endpoints
   - Preload critical pages
   - Warm up cache

5. **Enable Features**
   - Turn on feature flags
   - Enable booking system
   - Activate payment processing

6. **Verification Steps**
   - [ ] Homepage loads correctly
   - [ ] Booking flow works end-to-end
   - [ ] Payment processing successful
   - [ ] Polish language functional
   - [ ] Monitoring shows green
   - [ ] No error spikes

### T+30 Minutes: Stability Check

#### System Health Verification
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms (p95)
- [ ] Payment success rate > 95%
- [ ] No database alerts
- [ ] No third-party service issues

#### Business Metrics Check
- [ ] Bookings being created
- [ ] Payments processing
- [ ] User registrations working
- [ ] Email/SMS sending successfully

### T+2 Hours: Post-Launch Review

#### Team Standup
- Review system performance
- Discuss any issues
- Address user feedback
- Plan next steps

---

## Post-Launch Monitoring

### First 24 Hours

#### Critical Monitoring (Check every hour)
- [ ] **System Health**
  - Error rate and volume
  - Response times
  - Database performance
  - Third-party service status

- [ ] **Business Metrics**
  - Booking conversion rate
  - Payment success rate
  - User registration rate
  - Revenue tracking

- [ ] **User Experience**
  - Support tickets
  - Social media mentions
  - App store reviews (if applicable)
  - User feedback submissions

#### Automated Alerts
- Error rate > 1% (critical)
- Payment failures > 5% (critical)
- Response time > 2s (warning)
- Database CPU > 80% (warning)
- New security vulnerabilities (critical)

### First Week

#### Daily Reports
- System performance summary
- Business KPI dashboard
- User feedback analysis
- Issue tracking and resolution

#### Weekly Review
- Performance analysis
- User behavior insights
- Conversion funnel analysis
- Revenue and growth metrics
- Technical debt assessment

---

## Emergency Procedures

### Severity Levels

#### SEV-0 (Critical)
- Site completely down
- Payment processing failed
- Data breach suspected
- Major legal/compliance issue

**Response Time**: 15 minutes
**Escalation**: Immediate to CEO

#### SEV-1 (High)
- Significant feature broken
- Payment issues for some users
- Security vulnerability
- Performance degradation > 50%

**Response Time**: 30 minutes
**Escalation**: 1 hour to CTO

#### SEV-2 (Medium)
- Minor feature broken
- Performance degradation < 50%
- UI issues affecting usability
- Third-party service degraded

**Response Time**: 2 hours
**Escalation**: 4 hours to Engineering Lead

#### SEV-3 (Low)
- Cosmetic UI issues
- Documentation errors
- Minor performance issues
- Feature requests

**Response Time**: 24 hours
**Escalation**: As needed

### Incident Response Process

#### 1. Detection & Triage
1. Alert received or issue reported
2. Assess severity level
3. Create incident channel
4. Notify appropriate team members

#### 2. Investigation
1. Reproduce the issue
2. Identify root cause
3. Assess impact scope
4. Estimate fix time

#### 3. Resolution
1. Implement fix (if possible)
2. Test solution
3. Deploy fix
4. Verify resolution

#### 4. Communication
1. Internal status updates
2. External notification (if needed)
3. Post-mortem creation
4. Share learnings

### Common Scenarios

#### Site Down
1. **Immediate Actions**
   - Check CDN status
   - Verify server health
   - Check DNS propagation
   - Review recent deployments

2. **Quick Fixes**
   - Restart services
   - Rollback last deployment
   - Switch to backup systems
   - Enable maintenance mode

#### Payment Issues
1. **Immediate Actions**
   - Check Stripe status
   - Review webhook logs
   - Verify API keys
   - Check error rates

2. **User Communication**
   - Disable affected payment methods
   - Display clear error messages
   - Offer alternative payment options

#### Performance Issues
1. **Diagnosis**
   - Check APM dashboard
   - Review database queries
   - Analyze CDN performance
   - Check for traffic spikes

2. **Mitigation**
   - Scale up resources
   - Enable aggressive caching
   - Disable non-critical features
   - Rate limit traffic

---

## Rollback Procedures

### When to Rollback
- Security vulnerability discovered
- Critical functionality broken
- Data corruption risk
- Regulatory compliance issue
- User impact > 25%

### Rollback Types

#### Full Rollback (Complete System)
1. **Stop New Deployments**
   - Lock deployment pipeline
   - Notify all engineers

2. **Database Rollback**
   ```bash
   # Identify migration to rollback
   npx supabase migration list

   # Rollback to previous version
   npx supabase db rollback <version>
   ```

3. **Application Rollback**
   ```bash
   # Switch to previous tag
   git checkout <previous_tag>

   # Deploy previous version
   npm run build && npm run deploy
   ```

4. **Verification**
   - Health checks pass
   - Critical functionality restored
   - No data loss

#### Feature Flag Rollback
1. **Disable Feature**
   - Turn off feature flag
   - Clear CDN cache
   - Restart application

2. **Verify**
   - Feature no longer accessible
   - System stability restored
   - User experience normalized

### Rollback Communication

#### Internal Team
- Rollback initiated notification
- Reason for rollback
- Expected recovery time
- Next steps and timeline

#### External Users (if needed)
- Acknowledge the issue
- Explain what happened
- Confirm resolution
- Offer compensation (if appropriate)

---

## Communication Templates

### Internal Notifications

#### Launch Start (Slack/Teams)
```
🚀 LAUNCH INITIATED 🚀

Status: IN PROGRESS
Started: {timestamp}
Lead: {name}
Channel: {comms_channel}

Next Update: T+30 minutes

Good luck team! 🙏
```

#### Incident Alert
```
🚨 SEVITY-{level} INCIDENT DECLARED 🚨

Issue: {brief_description}
Impact: {affected_systems/users}
Started: {timestamp}
Lead: {incident_lead}
Channel: {incident_channel}

Team standup in {time}
```

#### Resolution Notification
```
✅ INCIDENT RESOLVED ✅

Issue: {issue_description}
Duration: {start_time} to {end_time}
Resolution: {fix_description}
Post-mortem: {link}

Thank you to everyone who helped! 🎉
```

### External Communications

#### Launch Announcement (Email/Social)
```
Subject: Exciting News! BM Beauty Studio is Now Live! 🎉

Dear [Customer Name],

We're thrilled to announce that our new booking platform is now live!

✨ What's new:
- Easy online booking 24/7
- Polish language support
- Secure payment processing
- Mobile-friendly design

Book your appointment today: [website_link]

Thank you for your patience during this transition. We can't wait to serve you!

Best regards,
The BM Beauty Studio Team
```

#### Service Issue (Banner/Email)
```
Subject: Temporary Service Disruption

Dear Customers,

We're currently experiencing technical difficulties with our booking system.
Our team is working to resolve this as quickly as possible.

Current Status: [status]
Estimated Resolution: [timeframe]

For immediate assistance:
- Call: [phone_number]
- Email: [support_email]

We apologize for any inconvenience and appreciate your patience.

Sincerely,
The BM Beauty Studio Team
```

#### Maintenance Notice
```
Subject: Scheduled Maintenance Notice

Dear Customers,

We'll be performing scheduled maintenance to improve our service.

When: [date] from [start_time] to [end_time]
Duration: [duration]
Impact: [affected_services]

What to expect:
- Unable to book new appointments
- Can still access existing bookings
- Emergency contact available at [phone]

We appreciate your understanding as we work to serve you better.

Best regards,
The BM Beauty Studio Team
```

---

## Contacts and Resources

### Emergency Contacts
- **CEO**: [phone] | [email]
- **CTO/Engineering Lead**: [phone] | [email]
- **Product Lead**: [phone] | [email]
- **Support Lead**: [phone] | [email]

### Service Providers
- **Stripe Support**: [link] | [phone]
- **Supabase Support**: [link] | [email]
- **CDN Provider**: [link] | [support_page]
- **Domain Registrar**: [link] | [support]

### Key Links
- **Production Dashboard**: [link]
- **Monitoring Dashboard**: [link]
- **Error Tracking**: [link]
- **Infrastructure**: [link]
- **Documentation**: [link]

---

## Quick Reference

### One-Click Actions
- [Health Check Dashboard](link)
- [Error Log Viewer](link)
- [Performance Metrics](link)
- [User Analytics](link)
- [Revenue Dashboard](link)
- [Incident Response Guide](link)

### Critical Commands
```bash
# Quick health check
curl -X GET https://api.example.com/health

# Check error rates
grep "ERROR" application.log | wc -l

# Database connection test
psql -h host -U user -d database -c "SELECT 1;"

# Restart services
systemctl restart application

# Clear cache
redis-cli FLUSHALL
```

### Decision Tree

```
Is the site down?
├─ Yes → Check CDN, servers, DNS
│  └─ Still down? → Rollback deployment
└─ No → Check functionality
   ├─ Payments broken? → Check Stripe, webhooks
   ├─ Booking broken? → Check database, APIs
   └─ Performance slow? → Check resources, cache
```

---

*Last Updated: 2025-01-22*
*Version: 1.0*