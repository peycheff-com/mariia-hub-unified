# Security Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for handling security incidents in the Mariia Hub booking platform. All personnel should familiarize themselves with these procedures and conduct regular drills.

## Emergency Contacts

### Primary Security Team
- **Security Lead**: security@mariiahub.com (24/7)
- **DevOps Lead**: devops@mariiahub.com (24/7)
- **Engineering Lead**: engineering@mariiahub.com (Business hours)
- **Executive Team**: exec@mariiahub.com (Critical incidents only)

### External Contacts
- **Legal Counsel**: legal@mariiahub.com
- **PR/Communications**: pr@mariiahub.com
- **Cloud Provider Support**: [AWS/Azure/GCP Support Contacts]
- **Payment Processor**: Stripe Support (24/7)
- **Security Consultant**: [External Security Firm]

## Incident Severity Levels

### 🔴 CRITICAL (Response Time: 15 minutes)
- Production data breach
- Complete service outage due to security incident
- Ransomware attack
- Massive data exposure (>1000 users)
- Payment data compromise

### 🟠 HIGH (Response Time: 1 hour)
- Limited data breach
- Privilege escalation attack
- Successful injection attack
- Major service degradation
- Compliance violation

### 🟡 MEDIUM (Response Time: 4 hours)
- Failed attack attempts
- Minor data exposure
- Configuration security issues
- Suspicious activity patterns
- Vulnerability in production

### 🟢 LOW (Response Time: 24 hours)
- Minor security misconfigurations
- Low-risk vulnerabilities
- Development environment issues
- Documentation updates needed

## Immediate Response Procedures

### Step 1: Detection & Triage (First 15 minutes)

**Who**: On-call engineer or monitoring system

**Actions**:
1. **Verify Alert Legitimacy**
   ```bash
   # Check monitoring systems
   kubectl get pods -n production
   # Verify service health
   curl -f https://api.mariiahub.com/health
   # Check error logs
   kubectl logs -n production deployment/api --tail=100
   ```

2. **Assess Impact Scope**
   - Number of affected users
   - Data types potentially exposed
   - Service functionality impacted
   - Geographic distribution affected

3. **Initial Classification**
   - Assign severity level based on impact
   - Determine if incident is security-related
   - Assess business continuity requirements

4. **Activate Response Team**
   ```bash
   # PagerDuty alert (or equivalent)
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H "Content-Type: application/json" \
     -d '{
       "routing_key": "YOUR_INTEGRATION_KEY",
       "event_action": "trigger",
       "payload": {
         "summary": "Security Incident: [DESCRIPTION]",
         "severity": "critical",
         "source": "production"
       }
     }'
   ```

### Step 2: Containment (First 1 hour)

**Who**: Security Lead + DevOps Team

**Immediate Containment Actions**:

1. **Isolate Affected Systems**
   ```bash
   # Block suspicious IPs
   iptables -A INPUT -s [SUSPICIOUS_IP] -j DROP

   # Scale down affected services
   kubectl scale deployment api --replicas=0 -n production

   # Enable maintenance mode
   kubectl patch config maintenance -n production -p '{"data":{"enabled":"true"}}'
   ```

2. **Protect Sensitive Data**
   ```bash
   # Rotate database credentials
   psql -h [DB_HOST] -U postgres -c "ALTER USER app_user WITH PASSWORD '[NEW_PASSWORD]';"

   # Invalidate active sessions
   UPDATE user_sessions SET valid = false WHERE created_at < NOW() - INTERVAL '1 hour';

   # Block API access temporarily
   kubectl patch ingress api-ingress -p '{"metadata":{"annotations":{"nginx.ingress.kubernetes.io/whitelist-source-range":"0.0.0.0/0"}}}'
   ```

3. **Preserve Evidence**
   ```bash
   # Create forensic snapshot
   gcloud compute disks snapshot [DISK_NAME] --snapshot-names="forensic-$(date +%Y%m%d%H%M%S)"

   # Export relevant logs
   kubectl logs -n production deployment/api --since=24h > /tmp/api-logs-$(date +%s).json

   # Capture system state
   ps aux > /tmp/processes-$(date +%s).txt
   netstat -tulpn > /tmp/connections-$(date +%s).txt
   ```

4. **Communication Initial Notification**
   ```markdown
   Subject: URGENT: Security Incident - [SEVERITY] - [TIME]

   Status: ACTIVE
   Severity: [CRITICAL/HIGH/MEDIUM/LOW]
   First Detected: [Timestamp]
   Systems Affected: [List]
   Current Impact: [Description]

   Actions Taken:
   - [List immediate actions]

   Next Steps:
   - [Planned actions]

   ETA for Update: [Time]
   ```

### Step 3: Investigation & Analysis (First 4-8 hours)

**Who**: Security Team + Engineering Team

**Detailed Investigation**:

1. **Root Cause Analysis**
   ```sql
   -- Analyze database access logs
   SELECT * FROM security_audit_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;

   -- Check for unusual API access patterns
   SELECT ip_address, COUNT(*) as request_count
   FROM api_key_usage
   WHERE created_at >= NOW() - INTERVAL '1 hour'
   GROUP BY ip_address
   HAVING COUNT(*) > 1000;

   -- Review failed login attempts
   SELECT email, COUNT(*) as failed_attempts, ip_address
   FROM failed_login_attempts
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY email, ip_address
   HAVING COUNT(*) > 5;
   ```

2. **Data Impact Assessment**
   ```sql
   -- Identify potentially exposed user data
   SELECT COUNT(DISTINCT user_id) as affected_users,
          COUNT(*) as total_records,
          MAX(created_at) as last_access
   FROM [AFFECTED_TABLE]
   WHERE created_at BETWEEN [START_TIME] AND [END_TIME];

   -- Check for data exfiltration patterns
   SELECT user_id, COUNT(*) as export_count, SUM(data_size) as total_bytes
   FROM data_export_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY user_id
   HAVING COUNT(*) > 100 OR SUM(data_size) > 104857600; -- 100MB
   ```

3. **Network Traffic Analysis**
   ```bash
   # Analyze NGINX logs for suspicious patterns
   awk '$9 >= 400' /var/log/nginx/access.log | \
     awk '{print $1}' | sort | uniq -c | sort -nr | head -20

   # Check for large data transfers
   awk '$10 > 1048576' /var/log/nginx/access.log | \
     awk '{print $7, $10}' | sort -nr | head -20

   # Analyze user agent strings for anomalies
   awk '{print $12}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
   ```

4. **Forensic Evidence Collection**
   ```bash
   # Create evidence archive
   mkdir -p /tmp/security-incident-$(date +%s)
   cd /tmp/security-incident-$(date +%s)

   # Collect system information
   uname -a > system-info.txt
   df -h > disk-usage.txt
   free -h > memory-info.txt

   # Copy relevant logs
   cp /var/log/nginx/access.log .
   cp /var/log/mysql/error.log .
   cp /var/log/auth.log .

   # Hash all evidence files
   sha256sum * > evidence-hashes.txt
   tar -czf ../security-evidence-$(date +%s).tar.gz .
   ```

### Step 4: Eradication & Recovery (Next 24-48 hours)

**Who**: Security Team + Engineering Team

**Eradication Steps**:

1. **Remove Malicious Components**
   ```bash
   # Remove malicious files
   find /var/www/html -name "*.php" -mtime -1 -exec rm {} \;

   # Clean compromised accounts
   UPDATE users SET
     password_reset_required = true,
     status = 'suspended'
   WHERE id IN [COMPROMISED_USER_IDS];

   # Revoke suspicious API keys
   UPDATE api_keys SET is_active = false
   WHERE user_id IN [COMPROMISED_USER_IDS];
   ```

2. **Patch Vulnerabilities**
   ```bash
   # Update vulnerable packages
   npm audit fix --force
   apt-get update && apt-get upgrade -y

   # Apply security patches
   kubectl set image deployment/api api=mariiahub/api:secure-v1.2.3 -n production

   # Restart services with new configurations
   kubectl rollout restart deployment/api -n production
   ```

3. **Validate Security Fixes**
   ```bash
   # Run security scan
   npm audit

   # Check for open ports
   nmap -sS -O localhost

   # Verify file permissions
   find /var/www/html -type f -perm /o+w -ls

   # Test authentication
   curl -X POST https://api.mariiahub.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

4. **Restore Services**
   ```bash
   # Gradual service restoration
   kubectl scale deployment api --replicas=1 -n production
   sleep 300  # 5 minutes monitoring
   kubectl scale deployment api --replicas=3 -n production

   # Disable maintenance mode
   kubectl patch config maintenance -n production -p '{"data":{"enabled":"false"}}'

   # Monitor service health
   while true; do
     curl -f https://api.mariiahub.com/health || break
     sleep 30
   done
   ```

## Specific Incident Types

### Data Breach Response

**Scenario**: Customer data has been exfiltrated or exposed

1. **Immediate Actions**
   - Identify scope of exposed data
   - Determine number of affected users
   - Assess if notification requirements are triggered
   - Preserve all evidence

2. **Legal & Compliance**
   - Notify legal team immediately
   - Determine GDPR/CCPA notification obligations
   - Document timeline and impact
   - Prepare regulatory notifications

3. **Customer Communication**
   ```markdown
   Subject: Important Security Notice About Your Account

   Dear [Customer Name],

   We recently became aware of a security incident that may have
   affected your personal information. This notice contains important
   information about what happened and what steps you should take.

   [Detailed incident description]
   [What data was affected]
   [What we're doing]
   [Recommended actions]

   We sincerely apologize for this incident and are taking
   additional steps to strengthen our security.

   Sincerely,
   The Mariia Hub Security Team
   ```

### Ransomware Attack Response

**Scenario**: Systems encrypted by ransomware

1. **DO NOT PAY THE RANSOM**
   - Contact law enforcement immediately
   - Isolate affected systems from network
   - Preserve encrypted systems for forensic analysis
   - Activate disaster recovery plan

2. **Recovery Process**
   ```bash
   # Restore from clean backups
   gcloud compute disks create restore-disk --source-snapshot=[CLEAN_SNAPSHOT]
   gcloud compute instances attach-disk production-vm --disk=restore-disk

   # Verify backup integrity
   md5sum /path/to/backup/file
   sha256sum /path/to/backup/file
   ```

### DDoS Attack Response

**Scenario**: Distributed Denial of Service attack

1. **Immediate Mitigation**
   ```bash
   # Activate DDoS protection
   kubectl patch ingress api-ingress -p '{
     "metadata": {
       "annotations": {
         "nginx.ingress.kubernetes.io/rate-limit": "100",
         "nginx.ingress.kubernetes.io/rate-limit-window": "1m"
       }
     }
   }'

   # Enable caching
   kubectl patch ingress api-ingress -p '{
     "metadata": {
       "annotations": {
         "nginx.ingress.kubernetes.io/proxy-buffering": "on"
       }
     }
   }'
   ```

2. **Contact Cloud Provider**
   - Enable DDoS protection services
   - Request traffic scrubbing
   - Consider increasing resource limits
   - Monitor attack patterns

## Communication Procedures

### Internal Communication

**Slack Channels**:
- `#security-incidents` - Real-time incident coordination
- `#security-updates` - Status updates for all staff
- `#exec-updates` - Executive-level updates

**Update Frequency**:
- **Critical**: Every 15 minutes
- **High**: Every 30 minutes
- **Medium**: Every 2 hours
- **Low**: Every 12 hours

### External Communication

**Customer Communication**:
- Initial notification within 1 hour (critical incidents)
- Regular updates every 4 hours
- Final incident report within 7 days

**Media Communication**:
- Designated spokesperson only
- Approved talking points only
- No speculation about cause or impact

## Post-Incident Procedures

### Incident Review Meeting (Within 7 days)

**Attendees**:
- Security Lead
- Engineering Lead
- DevOps Lead
- Legal Counsel
- Executive Sponsor

**Agenda**:
1. Timeline reconstruction
2. Root cause analysis
3. Impact assessment
4. Response effectiveness
5. Lessons learned
6. Preventive measures
7. Documentation updates

### Follow-up Actions

**Security Improvements**:
```sql
-- Create security improvement tasks
INSERT INTO security_improvements (
  title, description, priority, assigned_to, due_date
) VALUES (
  'Implement MFA for all admin accounts',
  'Add multi-factor authentication requirement for administrative access',
  'HIGH',
  'security-team',
  NOW() + INTERVAL '30 days'
);
```

**Documentation Updates**:
- Update incident response procedures
- Revise security policies
- Enhance monitoring configurations
- Update security training materials

## Security Monitoring & Alerting

### Key Metrics to Monitor

**Authentication Metrics**:
- Failed login attempts per minute
- Unusual login locations
- Multiple concurrent sessions
- Password reset requests

**Application Metrics**:
- Error rate increases
- Response time anomalies
- Unusual API call patterns
- Data export volumes

**Infrastructure Metrics**:
- CPU/memory spikes
- Network traffic patterns
- Disk I/O anomalies
- Unusual process executions

### Alert Thresholds

```yaml
# Prometheus alerting rules
groups:
  - name: security
    rules:
      - alert: HighFailedLogins
        expr: rate(failed_logins_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High rate of failed login attempts"

      - alert: UnusualDataExport
        expr: rate(data_export_bytes_total[10m]) > 100000000  # 100MB/min
        for: 1m
        labels:
          severity: high
        annotations:
          summary: "Unusual data export activity detected"

      - alert: SuspiciousAPICalls
        expr: rate(api_requests_total[5m]) > 1000
        for: 3m
        labels:
          severity: medium
        annotations:
          summary: "Suspicious API call pattern detected"
```

## Training & Drills

### Quarterly Security Drills

**Scenario Types**:
1. **Data breach simulation**
2. **Ransomware attack drill**
3. **DDoS attack response**
4. **Insider threat scenario**
5. **Third-party compromise**

**Drill Evaluation Criteria**:
- Response time accuracy
- Communication effectiveness
- Technical containment success
- Recovery time objectives
- Documentation completeness

### Annual Full-Scale Exercise

**Multi-Team Coordination**:
- Security team
- Engineering team
- DevOps team
- Customer support
- Legal team
- Executive team
- External consultants

**Success Metrics**:
- No production data loss
- Recovery within SLA
- Proper notification procedures
- Lessons learned documented
- Security improvements implemented

## Appendices

### A. Incident Response Checklist

**Phase 1: Detection (0-15 mins)**
- [ ] Verify alert legitimacy
- [ ] Assess initial impact
- [ ] Classify severity level
- [ ] Notify security team
- [ ] Initiate documentation

**Phase 2: Containment (15-60 mins)**
- [ ] Isolate affected systems
- [ ] Block suspicious IPs
- [ ] Protect sensitive data
- [ ] Preserve evidence
- [ ] Update stakeholders

**Phase 3: Investigation (1-4 hours)**
- [ ] Root cause analysis
- [ ] Data impact assessment
- [ ] Evidence collection
- [ ] Forensic analysis
- [ ] Determine scope

**Phase 4: Eradication (4-24 hours)**
- [ ] Remove malicious code
- [ ] Patch vulnerabilities
- [ ] Update configurations
- [ ] Test security fixes
- [ ] Prepare for recovery

**Phase 5: Recovery (24-48 hours)**
- [ ] Restore services
- [ ] Validate functionality
- [ ] Monitor systems
- [ ] Gradual service restoration
- [ ] Post-incident review

### B. Contact Information Template

```
Primary Security Team:
Security Lead: [Name] - [Phone] - [Email]
DevOps Lead: [Name] - [Phone] - [Email]
Engineering Lead: [Name] - [Phone] - [Email]

External Contacts:
Legal: [Name] - [Phone] - [Email]
PR: [Name] - [Phone] - [Email]
Cloud Provider: [Support Number]
Payment Processor: [Support Number]
Security Consultant: [Name] - [Phone] - [Email]

Escalation Matrix:
Level 1: Security Team (15 mins)
Level 2: Management (1 hour)
Level 3: Executive (4 hours)
Level 4: Board (Critical incidents only)
```

### C. Communication Templates

**Initial Incident Notification**:
```markdown
SECURITY INCIDENT NOTIFICATION

Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Status: ACTIVE
Time: [Timestamp]
Incident ID: [Generated ID]

Description:
[Brief description of incident]

Impact:
[What systems/users are affected]

Actions Taken:
[List of immediate actions]

Next Steps:
[Planned next actions]

ETA for Update: [Time]

Contact:
[Security team contact information]
```

**Customer Communication Template**:
```markdown
Important Security Notice

Dear [Customer Name],

We are writing to inform you of a recent security incident
that may have affected your account.

What happened:
[Clear, non-technical explanation]

What information was affected:
[Specific data types, if known]

What we are doing:
[Protective measures taken]

What you should do:
[Recommended customer actions]

We sincerely apologize for this incident and are taking
additional steps to prevent this from happening again.

For questions, please contact: [Support contact information]

Sincerely,
The Mariia Hub Team
```

---

**Runbook Version**: 2.0
**Last Updated**: October 23, 2025
**Next Review**: January 23, 2026
**Classification**: Internal - Confidential

This runbook should be reviewed and updated regularly based on lessons learned from incidents and changes in the security landscape.