# Reliability Engineering System

This comprehensive reliability engineering system provides health monitoring, alerting, automated recovery, audit logging, and SLO tracking for the mariiaborysevych application.

## Features

### 🔍 Health Monitoring
- Real-time health checks for all system components
- Dependency monitoring for external services
- Health scoring with trend analysis
- Kubernetes-ready liveness and readiness probes

### 🚨 Alerting & Escalation
- Configurable alert rules with severity levels
- Multi-channel notifications (Email, Slack, SMS, PagerDuty)
- Automatic escalation policies
- Alert acknowledgment and resolution tracking

### 🔧 Automated Recovery
- Self-healing mechanisms for common failures
- Circuit breaker patterns to prevent cascading failures
- Configurable recovery actions with cooldown periods
- Recovery attempt tracking and analytics

### 📊 SLO Monitoring
- Service Level Objectives with error budget tracking
- Real-time burn rate calculation
- Automated alerts for budget exhaustion
- Historical trend analysis and reporting

### 📝 Audit Logging
- Comprehensive audit trail for all system events
- Structured logging with retention policies
- Compliance reporting capabilities
- Export functionality (JSON/CSV)

## Architecture

```
/src/lib/reliability/
├── types.ts                 # Type definitions
├── health-checker.ts        # Health check orchestration
├── dependency-monitor.ts     # External dependency monitoring
├── health-scorer.ts        # Health scoring and analytics
├── automated-recovery.ts   # Self-healing mechanisms
├── alerting.ts             # Alert management and notifications
├── audit-logger.ts         # Audit logging system
├── slo-monitor.ts          # SLO and error budget tracking
└── README.md              # This file
```

## Getting Started

### 1. Initialize the Reliability Service

```typescript
import { reliabilityService } from '@/services/reliability-service';

// Start all reliability systems
await reliabilityService.initialize();

// Check status
const status = await reliabilityService.getStatus();
console.log('Reliability Status:', status);
```

### 2. Add Health Checks

```typescript
import { healthChecker } from '@/lib/reliability/health-checker';

// Add a custom health check
healthChecker.addCheck('custom-service', async () => {
  const start = Date.now();
  try {
    // Perform health check
    await checkCustomService();

    return {
      name: 'custom-service',
      status: 'pass',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'custom-service',
      status: 'fail',
      duration: Date.now() - start,
      message: error.message
    };
  }
});
```

### 3. Monitor Dependencies

```typescript
import { dependencyMonitor } from '@/lib/reliability/dependency-monitor';

// Add external dependency to monitor
dependencyMonitor.addDependency({
  name: 'payment-gateway',
  type: 'api',
  endpoint: 'https://api.payment-provider.com/health',
  timeout: 5000,
  critical: true,
  checkInterval: 60000 // 1 minute
});

// Start monitoring
dependencyMonitor.startMonitoring();
```

### 4. Configure Alerts

```typescript
import { alertingSystem } from '@/lib/reliability/alerting';

// Add custom alert rule
alertingSystem.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate',
  condition: 'errorRate > 5',
  threshold: 5,
  severity: 'high',
  enabled: true,
  tags: ['performance', 'critical']
});

// Configure notification channel
alertingSystem.addNotificationChannel({
  id: 'slack-critical',
  name: 'Critical Slack Alerts',
  type: 'slack',
  config: {
    webhook: 'https://hooks.slack.com/...',
    channel: '#alerts'
  },
  enabled: true
});
```

### 5. Track SLOs

```typescript
import { sloMonitor } from '@/lib/reliability/slo-monitor';

// Define SLO
sloMonitor.addSLO({
  id: 'api-availability',
  name: 'API Availability',
  description: 'API should be available 99.9% of the time',
  service: 'api',
  indicator: 'availability',
  objective: 99.9,
  timeWindow: 30, // days
  alertingBurnRate: 2,
  errorBudgetPolicy: {
    fastBurn: 10,
    slowBurn: 2,
    windowShort: 1,
    windowLong: 6
  }
});

// Record events
await sloMonitor.recordEvent('api', 'availability', true);
```

### 6. Use Audit Logging

```typescript
import { auditLogger } from '@/lib/reliability/audit-logger';

// Log authentication events
auditLogger.logAuthEvent(
  userId,
  'login',
  'success',
  { method: 'password', mfa: true }
);

// Log data operations
auditLogger.logDataEvent(
  userId,
  'create',
  'booking',
  'success',
  { bookingId: '123', service: 'hair-styling' }
);

// Log security events
auditLogger.logSecurityEvent(
  'failed_login_attempt',
  'auth',
  'failure',
  { ip: '192.168.1.1', reason: 'invalid_password' }
);
```

## API Endpoints

### Health Check Endpoints
- `GET /api/health` - Basic health status
- `GET /api/health/detailed` - Detailed health information
- `GET /api/health/score` - Current health score
- `GET /api/health/dependencies` - Dependency status
- `GET /api/ready` - Readiness probe
- `GET /api/live` - Liveness probe

### Reliability Dashboard
- `GET /api/reliability/dashboard` - Combined reliability dashboard data

### Dependencies
- `GET /api/reliability/dependencies` - All dependency statuses
- `GET /api/reliability/dependencies/:name/history` - Dependency metrics history

### Alerts
- `GET /api/reliability/alerts` - Active alerts
- `POST /api/reliability/alerts/:id/acknowledge` - Acknowledge an alert
- `GET /api/reliability/alerts/stats` - Alert statistics

### Audit Logs
- `GET /api/reliability/audit/events` - Query audit events
- `GET /api/reliability/audit/stats` - Audit statistics
- `GET /api/reliability/audit/compliance` - Compliance report
- `GET /api/reliability/audit/export` - Export audit data

### SLO Monitoring
- `GET /api/reliability/slo/status` - All SLO statuses
- `GET /api/reliability/slo/:id` - Detailed SLO report
- `POST /api/reliability/slo/events` - Record SLO event

## Configuration

### Environment Variables

```bash
# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# PagerDuty
PAGERDUTY_WEBHOOK_URL=https://events.pagerduty.com/...
PAGERDUTY_SERVICE_KEY=...

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=...

# SMS (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Database Tables

The system creates several tables in Supabase:

- `health_scores` - Health score history
- `dependency_metrics` - Dependency performance metrics
- `recovery_attempts` - Automated recovery actions
- `alerts` - Alert records
- `slo_events` - SLO event tracking
- `error_budget_status` - Error budget calculations
- `audit_logs` - Audit trail (recent events)
- `audit_logs_archive` - Long-term audit storage

## Best Practices

### Health Checks
1. Keep health checks lightweight and fast
2. Set appropriate timeouts
3. Distinguish between critical and non-critical services
4. Use circuit breakers for external dependencies

### Alerting
1. Alert on symptoms, not causes
2. Use severity levels appropriately
3. Include actionable information in alerts
4. Implement proper escalation policies

### SLO Monitoring
1. Define measurable and meaningful SLOs
2. Set realistic error budgets
3. Monitor burn rates continuously
4. Review SLOs regularly

### Audit Logging
1. Log all security-relevant events
2. Include sufficient context
3. Follow data retention policies
4. Regular compliance reviews

### Automated Recovery
1. Implement idempotent recovery actions
2. Use circuit breakers to prevent loops
3. Track recovery effectiveness
4. Manual override capabilities

## Monitoring Dashboard

Use the `ReliabilityDashboard` component to monitor system health:

```tsx
import { ReliabilityDashboard } from '@/components/ReliabilityDashboard';

function AdminPanel() {
  return (
    <div>
      <ReliabilityDashboard />
    </div>
  );
}
```

The dashboard provides:
- Overall health score visualization
- Dependency status overview
- Active alerts management
- SLO status monitoring
- Audit log statistics
- Recovery metrics

## Troubleshooting

### Common Issues

1. **Health checks failing**
   - Check service connectivity
   - Verify timeout configurations
   - Review service logs

2. **Alerts not firing**
   - Verify alert rule conditions
   - Check notification channel configurations
   - Review alert evaluation logs

3. **High error budget consumption**
   - Identify failing services
   - Review recent deployments
   - Check dependency health

4. **Audit logs not recording**
   - Verify database connectivity
   - Check table permissions
   - Review log buffer size

### Diagnostic Tools

Run a diagnostic report:

```typescript
await reliabilityService.runDiagnostic();
```

This will output a comprehensive report of all reliability systems.

## Contributing

When adding new reliability features:

1. Follow the existing code patterns
2. Add comprehensive error handling
3. Include proper logging
4. Write unit tests
5. Update documentation

## License

This reliability system is part of the mariiaborysevych project and follows the same license terms.