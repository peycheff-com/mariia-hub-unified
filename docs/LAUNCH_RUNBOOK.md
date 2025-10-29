# 🚀 Launch Runbook - Mariia Hub Platform

## Overview
This runbook provides step-by-step procedures for launching the Mariia Hub booking platform to production.

## Pre-Launch Checklist

### ✅ Code & Build Verification
- [ ] All tests passing (`npm run test`)
- [ ] Build successful (`npm run build`)
- [ ] Production build tested (`npm run preview`)
- [ ] No TypeScript errors or warnings
- [ ] ESLint passing (`npm run lint`)
- [ ] Bundle size optimized (< 2MB initial)
- [ ] Source maps generated for debugging

### ✅ Security Audit
- [ ] Security headers configured
- [ ] CSP policy implemented
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] Environment variables secured
- [ ] Database RLS policies verified
- [ ] API endpoints protected
- [ ] Authentication flows tested
- [ ] Payment security verified (Stripe PCI compliance)

### ✅ Performance Optimization
- [ ] Database queries optimized
- [ ] Indexes created for all queries
- [ ] Connection pooling configured
- [ ] CDN configured for assets
- [ ] Images optimized and compressed
- [ ] Service Worker registered
- [ ] Cache strategies implemented
- [ ] Lazy loading verified
- [ ] Core Web Vitals targets met (LCP < 2.5s, FID < 100ms, CLS < 0.1)

### ✅ Monitoring Setup
- [ ] Production monitoring initialized
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Alerts configured for critical issues
- [ ] Dashboard created for metrics
- [ ] Log aggregation setup
- [ ] Uptime monitoring configured

### ✅ Data & Migration
- [ ] Production database created
- [ ] Migration scripts tested
- [ ] Seed data prepared
- [ ] Backup strategy implemented
- [ ] Data retention policies set
- [ ] GDPR compliance verified

## Launch Day Procedures

### 🌅 24 Hours Before Launch (T-24h)

**Technical Lead Checklist:**
```bash
# 1. Final staging deployment
git checkout main
git pull origin main
npm run build:prod
npm run deploy:staging

# 2. End-to-end testing
npm run test:e2e:staging

# 3. Performance test
npm run test:performance
```

**Verification Steps:**
- [ ] All services running on staging
- [ ] Database performance verified
- [ ] Payment testing in sandbox mode
- [ ] Email notifications working
- [ ] Third-party integrations confirmed

### 🚀 1 Hour Before Launch (T-1h)

**Final Preparations:**
```bash
# 1. Take production database backup
pg_dump $PROD_DB_URL > pre-launch-backup.sql

# 2. Clear all caches
npm run cache:clear

# 3. Enable maintenance mode
npm run maintenance:enable

# 4. Deploy final version
git tag -a v1.0.0 -m "Production launch"
git push origin v1.0.0
npm run deploy:prod
```

**Team Communication:**
- [ ] All team members on standby
- [ ] Communication channels open (Slack/Teams)
- [ ] Emergency contacts verified
- [ ] Rollback plan reviewed

### ⏡ Launch Time (T+0)

**Launch Sequence:**
```bash
# 1. Run database migrations
npm run migrate:prod

# 2. Disable maintenance mode
npm run maintenance:disable

# 3. Verify deployment
curl -I https://mariia-hub.com

# 4. Warm up the cache
npm run cache:warm

# 5. Verify monitoring
curl https://mariia-hub.com/api/health
```

**Immediate Verification (First 5 minutes):**
- [ ] Homepage loads correctly
- [ ] Navigation working
- [ ] Authentication flow functional
- [ ] Booking wizard operational
- [ ] Payment processing active
- [ ] All monitoring dashboards green

### ⏱️ First Hour After Launch (T+1h)

**Continuous Monitoring:**
- [ ] Error rate < 0.1%
- [ ] Response time < 200ms
- [ ] CPU usage < 70%
- [ ] Memory usage stable
- [ ] Database connections normal
- [ ] No security alerts

**Functional Testing:**
- [ ] Complete booking flow test
- [ ] Payment transaction test
- [ ] Email notification verification
- [ ] Admin dashboard access
- [ ] Mobile responsiveness check

## Post-Launch Procedures

### 📊 First 24 Hours Monitoring

**Hourly Checks:**
- [ ] Traffic volume analysis
- [ ] Conversion rate tracking
- [ ] Error log review
- [ ] Performance metrics review
- [ ] User feedback collection

**Daily Report:**
```bash
# Generate daily report
npm run report:daily

# Check key metrics
npm run metrics:check
```

### 🔄 Rollback Procedures

**When to Rollback:**
- Critical security vulnerability discovered
- Payment processing failures > 5%
- Site availability < 99%
- Database corruption
- Major functional failures

**Rollback Steps:**
```bash
# 1. Enable maintenance mode immediately
npm run maintenance:enable

# 2. Stop new deployments
npm run deploy:lock

# 3. Restore database
pg_restore $PROD_DB_URL < pre-launch-backup.sql

# 4. Revert code
git checkout v0.9.0 # Last stable version
npm run deploy:prod

# 5. Verify rollback
npm run test:smoke

# 6. Disable maintenance mode
npm run maintenance:disable

# 7. Communicate with team
npm run alert:rollback-complete
```

**Partial Rollback (Feature-specific):**
```bash
# Disable specific feature
npm run feature:disable --name=problematic-feature

# Or use feature flags
curl -X POST https://api.mariia-hub.com/features/flag \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "new_booking_flow", "enabled": false}'
```

## Communication Plans

### 📢 Launch Announcement

**Internal Team (T-30min):**
```
🚀 LAUNCH IMMINENT
Platform launching in 30 minutes
All hands on deck
Standby channels: #launch-alerts
Rollback plan: https://docs.launch.com/rollback
```

**Stakeholders (T+0):**
```
✨ PLATFORM LIVE
Mariia Hub is now live at https://mariia-hub.com
Early access for VIP customers active
Public launch: [Time]
Status page: https://status.mariia-hub.com
```

**Public Launch (T+1h):**
```
💎 MARIIA HUB IS LIVE
Premium beauty & fitness booking platform
🎉 Launch discount: 20% off all services
👉 Book now: https://mariia-hub.com
#Warsaw #Beauty #Fitness #Launch
```

### 🚨 Incident Communication

**Critical Issue (All hands):**
```
🔥 CRITICAL INCIDENT
Service: [Service name]
Impact: [User impact]
ETR: [Estimated time to resolution]
Updates: #incidents
```

**Service Degradation:**
```
⚠️ SERVICE DEGRADATION
Performance issues detected
Team investigating
Follow updates: #status
```

## Monitoring Dashboards

### 📈 Key Metrics to Monitor

**Business Metrics:**
- Conversion rate (target: > 3%)
- Booking completion rate (target: > 80%)
- Average order value
- Customer acquisition cost
- User retention rate

**Technical Metrics:**
- Uptime (target: 99.9%)
- Page load time (target: < 2s)
- API response time (target: < 200ms)
- Error rate (target: < 0.1%)
- Database query time (target: < 100ms)

**Security Metrics:**
- Failed login attempts
- Suspicious activity events
- Security policy violations
- Rate limiting triggers

### 📊 Dashboard URLs

- Main Dashboard: https://dash.mariia-hub.com/main
- Performance Dashboard: https://dash.mariia-hub.com/performance
- Error Dashboard: https://dash.mariia-hub.com/errors
- Business Metrics: https://dash.mariia-hub.com/business
- Security Dashboard: https://dash.mariia-hub.com/security

## Emergency Contacts

### 👥 Primary Team
- **Technical Lead**: [Name] - [Phone] - [Slack]
- **DevOps Engineer**: [Name] - [Phone] - [Slack]
- **Database Admin**: [Name] - [Phone] - [Slack]
- **Security Lead**: [Name] - [Phone] - [Slack]

### 🏢 External Services
- **Hosting Provider**: [Support Line]
- **Database Service**: [Support Line]
- **Payment Gateway**: [Support Line]
- **CDN Provider**: [Support Line]
- **DNS Provider**: [Support Line]

## Post-Launch Optimization Plan

### Week 1: Stabilization
- Daily performance reviews
- Bug fix prioritization
- User feedback analysis
- A/B test setup

### Week 2-4: Optimization
- Performance tuning
- Conversion optimization
- Feature enhancements
- Security improvements

### Month 2-3: Scaling
- Capacity planning
- Feature expansion
- Market expansion
- Advanced analytics

## Success Metrics

### Technical Success
- ✅ 99.9% uptime maintained
- ✅ Page load times under 2 seconds
- ✅ Zero security incidents
- ✅ Seamless payment processing

### Business Success
- ✅ 100+ bookings in first week
- ✅ 20% conversion rate from traffic
- ✅ 4.8+ star rating from users
- ✅ 50% repeat customer rate

## Runbook Maintenance

- Review and update monthly
- After each incident/incident drill
- Quarterly major review
- Annual complete overhaul

---

**Remember**: Stay calm, communicate clearly, and follow procedures. The success of the launch depends on preparation and execution.

**Last Updated**: 2025-01-XX
**Version**: 1.0
**Next Review**: 2025-02-XX