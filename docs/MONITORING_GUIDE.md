# Mariia Hub Production Monitoring Guide

## Overview

This guide covers the comprehensive monitoring setup for Mariia Hub production systems, including error tracking, performance monitoring, log aggregation, and alerting.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vite)  │    │   (Node.js)     │    │   (Supabase)    │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼────┐              ┌───▼────┐
    │ Sentry  │              │Prometheus│            │ Loki   │
    │(Errors) │              │(Metrics) │            │(Logs)  │
    └────┬────┘              └────┬────┘              └──┬────┘
         │                       │                       │
         └───────────┬───────────┴───────────────────────┘
                     │
              ┌──────▼──────┐
              │  Grafana    │
              │ (Dashboards)│
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │Alertmanager │
              │ (Alerts)    │
              └─────────────┘
```

## Components

### 1. Sentry - Error Tracking

**Purpose**: Real-time error tracking and performance monitoring

**Configuration**: Located in `src/lib/sentry.ts`

**Features**:
- Automatic error capturing
- Performance tracing
- Session replay
- Release tracking
- Custom error context

**Setup**:
```bash
# Environment variables
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

**Manual Error Reporting**:
```typescript
import { reportError, setUserContext } from '@/lib/sentry';

// Set user context
setUserContext({
  id: 'user-123',
  email: 'user@example.com'
});

// Report error
reportError(new Error('Custom error'), {
  component: 'booking',
  action: 'submit-booking'
});
```

**Sentry Dashboard**: https://sentry.io/organizations/mariia-hub

### 2. Web Vitals - Performance Metrics

**Purpose**: Track Core Web Vitals and custom performance metrics

**Configuration**: Integrated in `src/lib/monitoring.ts`

**Metrics Tracked**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

**Performance Thresholds**:
- LCP: < 2.5s (good), 2.5s-4s (needs improvement), > 4s (poor)
- FID: < 100ms (good), 100ms-300ms (needs improvement), > 300ms (poor)
- CLS: < 0.1 (good), 0.1-0.25 (needs improvement), > 0.25 (poor)

### 3. Loki - Log Aggregation

**Purpose**: Centralized log collection and querying

**Configuration**:
- Loki config: `monitoring/loki/config.yml`
- Promtail config: `monitoring/loki/promtail-config.yml`
- Logger: `src/lib/logger.ts`

**Log Levels**:
- DEBUG: Detailed debugging info
- INFO: General information
- WARN: Warning messages
- ERROR: Error messages

**Log Format**:
```json
{
  "timestamp": "2025-01-24T10:00:00Z",
  "level": "info",
  "message": "User action: booking-service-selected",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456",
    "component": "booking",
    "action": "service-select",
    "serviceId": "svc-789"
  }
}
```

**Usage**:
```typescript
import { log } from '@/lib/logger';

// Log user action
log.user('service-selected', { serviceId: 'svc-789', category: 'beauty' });

// Log performance
log.performance('booking-submit', 1250, { step: 'payment' });

// Log API call
log.api('POST', '/api/bookings', 200, 450, { endpoint: 'create-booking' });
```

### 4. Grafana Dashboards

**Purpose**: Visualization of metrics and logs

**Access**: http://localhost:3000 (admin/admin123)

**Available Dashboards**:
1. **Business Metrics** (`mariia-hub-business`)
   - Bookings over time
   - Revenue tracking
   - Conversion funnel
   - Top services
   - User registrations
   - Customer satisfaction

2. **Technical Performance** (`mariia-hub-technical`)
   - Core Web Vitals
   - API response times
   - Error rates
   - Memory usage
   - CPU usage
   - Recent errors

### 5. Prometheus - Metrics Collection

**Purpose**: Collect and store time-series metrics

**Configuration**: `monitoring/uptime/prometheus.yml`

**Key Metrics**:
- `http_requests_total`: API request count
- `http_request_duration_seconds`: API response time
- `mariia_hub_web_vitals_*`: Web Vitals metrics
- `booking_*`: Business metrics
- `node_*`: System metrics

### 6. Alertmanager - Alerting

**Purpose**: Route and send alerts based on metrics

**Configuration**: `monitoring/uptime/alertmanager.yml`

**Alert Channels**:
- Email: team@mariia-hub.com
- Slack: #alerts-critical, #alerts-warning
- Pager: oncall@mariia-hub.com (critical only)

**Alert Rules**:
- High error rate (> 5%)
- High response time (> 2s)
- Service down
- High CPU (> 80%)
- High memory (> 85%)
- Low disk space (< 10%)
- Poor Web Vitals

## Quick Start

### 1. Start Monitoring Stack

```bash
cd monitoring/uptime
docker-compose up -d
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100
- **Alertmanager**: http://localhost:9093
- **Uptime Kuma**: http://localhost:3001

### 3. Verify Monitoring

Check that all services are reporting metrics:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana data sources
# Navigate to Configuration > Data Sources in Grafana
```

## Environment Configuration

### Development
```bash
# .env.development
VITE_SENTRY_DSN=
VITE_APP_VERSION=dev
```

### Production
```bash
# .env.production
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

## Monitoring Best Practices

### 1. Error Handling
- Always report errors with context
- Use error boundaries for React components
- Include user ID and session ID in error reports
- Don't report PII (personally identifiable information)

### 2. Performance Monitoring
- Monitor Core Web Vitals
- Track custom business metrics
- Set up performance budgets
- Monitor API response times

### 3. Logging
- Use structured logging with context
- Include relevant metadata (userId, sessionId, component)
- Use appropriate log levels
- Don't log sensitive data

### 4. Alerting
- Set meaningful thresholds
- Use escalation policies
- Include actionable information in alerts
- Avoid alert fatigue

## Incident Response

### Severity Levels

1. **Critical**
   - Service completely down
   - Payment processing failures
   - Data loss or corruption
   - Response required: < 15 minutes

2. **High**
   - Degraded performance
   - Partial functionality issues
   - High error rates
   - Response required: < 1 hour

3. **Medium**
   - Non-critical bugs
   - Performance issues
   - Low error rates
   - Response required: < 4 hours

4. **Low**
   - Minor issues
   - Documentation updates
   - Future improvements
   - Response required: < 24 hours

### On-Call Rotation

- Primary: Weekdays 9AM-5PM
- Secondary: 24/7 backup
- Escalation: After 30 minutes without response

### Incident Playbook

1. **Acknowledge Alert**
   - Respond in Slack channel
   - Update incident status

2. **Assess Impact**
   - Check dashboards
   - Verify scope of issue
   - Determine affected users

3. **Investigate**
   - Review logs in Loki
   - Check errors in Sentry
   - Analyze metrics in Grafana

4. **Mitigate**
   - Apply fix or rollback
   - Monitor recovery
   - Verify resolution

5. **Post-Mortem**
   - Document root cause
   - Create action items
   - Update monitoring if needed

## Troubleshooting

### Common Issues

1. **Sentry not receiving errors**
   - Check DSN configuration
   - Verify network connectivity
   - Check error filtering rules

2. **Grafana no data**
   - Verify Prometheus is scraping
   - Check data source configuration
   - Review query syntax

3. **Loki not collecting logs**
   - Check Promtail configuration
   - Verify log file paths
   - Review pipeline stages

4. **Alerts not firing**
   - Check Alertmanager configuration
   - Verify alert rules
   - Review routing configuration

### Performance Tuning

1. **Reduce Sentry sample rate** if over-quota:
   ```typescript
   tracesSampleRate: 0.1 // 10% sampling
   ```

2. **Optimize Loki retention**:
   ```yaml
   retention:
     enabled: true
     period: 30d
   ```

3. **Tune Prometheus storage**:
   ```yaml
   storage.tsdb.retention.time: 15d
   ```

## Security Considerations

1. **PII Protection**
   - Never log passwords or tokens
   - Mask email addresses
   - Use user IDs instead of names

2. **Access Control**
   - Role-based access in Grafana
   - VPN for internal dashboards
   - 2FA for admin accounts

3. **Data Encryption**
   - TLS in transit
   - Encryption at rest
   - Secure secret management

## Scaling Guide

### High Traffic
- Increase sampling rates
- Add Prometheus sharding
- Scale Loki horizontally
- Use caching layers

### Multiple Environments
- Separate Grafana instances
- Environment-specific labels
- Isolated Prometheus servers
- Different Sentry projects

## Maintenance

### Daily
- Check alert status
- Review error rates
- Monitor performance

### Weekly
- Update dashboards
- Review alert rules
- Check quotas

### Monthly
- Update documentation
- Review retention policies
- Performance tuning

## Contact

- **Monitoring Team**: monitoring@mariia-hub.com
- **On-Call**: oncall@mariia-hub.com
- **Slack**: #monitoring-mariia-hub

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)