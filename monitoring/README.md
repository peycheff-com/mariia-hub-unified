# mariiaborysevych Production Monitoring Setup

This directory contains the complete monitoring infrastructure for mariiaborysevych production systems.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Sentry        │    Grafana      │      Alertmanager       │
│   (Errors)      │  (Dashboards)   │       (Alerts)          │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Prometheus    │     Loki        │     Uptime Kuma         │
│  (Metrics)      │    (Logs)       │    (Uptime Checks)      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 📁 Directory Structure

```
monitoring/
├── grafana/
│   └── dashboards/
│       ├── business-metrics.json    # Business KPIs dashboard
│       └── technical-performance.json # Technical metrics dashboard
├── loki/
│   ├── config.yml                  # Loki configuration
│   └── promtail-config.yml         # Log collection configuration
├── uptime/
│   ├── docker-compose.yml          # Full monitoring stack
│   ├── prometheus.yml              # Prometheus configuration
│   ├── alert_rules.yml            # Alert rules definition
│   └── alertmanager.yml           # Alert routing configuration
├── status-page/
│   └── config.json                # Status page configuration
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Access to mariiaborysevych repositories
- Production environment variables configured

### 1. Clone and Navigate

```bash
cd /Users/ivan/Code/mariia-hub-unified/monitoring
```

### 2. Start All Services

```bash
cd uptime
docker-compose up -d
```

This will start:
- Grafana (port 3000)
- Prometheus (port 9090)
- Loki (port 3100)
- Promtail (port 9080)
- Alertmanager (port 9093)
- Uptime Kuma (port 3001)

### 3. Access Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin/admin123 |
| Prometheus | http://localhost:9090 | - |
| Loki | http://localhost:3100 | - |
| Alertmanager | http://localhost:9093 | - |
| Uptime Kuma | http://localhost:3001 | admin/admin123 |

### 4. Import Grafana Dashboards

1. Open Grafana
2. Navigate to Dashboards > Import
3. Upload the JSON files from `grafana/dashboards/`

## 📊 Components

### 1. Sentry - Error Tracking
- **Purpose**: Real-time error tracking and performance monitoring
- **Configuration**: `src/lib/sentry.ts`
- **Dashboard**: https://sentry.io

### 2. Prometheus - Metrics Collection
- **Purpose**: Time-series data collection
- **Config**: `uptime/prometheus.yml`
- **Port**: 9090

### 3. Grafana - Visualization
- **Purpose**: Metrics visualization and dashboards
- **Dashboards**: `grafana/dashboards/`
- **Port**: 3000

### 4. Loki - Log Aggregation
- **Purpose**: Centralized log collection
- **Config**: `loki/config.yml`
- **Port**: 3100

### 5. Promtail - Log Collection
- **Purpose**: Log shipping to Loki
- **Config**: `loki/promtail-config.yml`
- **Port**: 9080

### 6. Alertmanager - Alerting
- **Purpose**: Alert routing and notifications
- **Config**: `uptime/alertmanager.yml`
- **Port**: 9093

### 7. Uptime Kuma - Uptime Monitoring
- **Purpose**: External uptime monitoring
- **Port**: 3001

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the monitoring directory:

```bash
# Sentry
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Alert Configuration
ALERT_EMAIL_TO=team@mariia-hub.com
ALERT_EMAIL_FROM=alerts@mariia-hub.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Grafana
GF_SECURITY_ADMIN_PASSWORD=your-secure-password

# Prometheus
PROMETHEUS_RETENTION=15d

# Loki
LOKI_RETENTION=30d
```

### Email Alerts (Gmail Example)

Update `alertmanager.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@mariia-hub.com'
  smtp_auth_username: 'alerts@mariia-hub.com'
  smtp_auth_password: 'your-app-password'
```

### Slack Integration

1. Create a Slack webhook
2. Update `alertmanager.yml`:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
```

## 📈 Key Metrics

### Business Metrics
- Booking conversion rate
- Revenue tracking
- User registrations
- Service popularity
- Customer satisfaction

### Technical Metrics
- Core Web Vitals (LCP, FID, CLS)
- API response times
- Error rates
- System resource usage
- Database performance

### Alert Thresholds
- Error rate > 5%
- Response time > 2s
- CPU usage > 80%
- Memory usage > 85%
- Disk space < 10%

## 🚨 Alerting

### Alert Severity Levels
- **Critical**: Immediate action required (< 15 min)
- **Warning**: Attention needed (< 1 hour)
- **Info**: Informational

### Notification Channels
- Email: team@mariia-hub.com
- Slack: #alerts, #alerts-critical
- Pager: oncall@mariia-hub.com

### Alert Rules

See `uptime/alert_rules.yml` for complete list of alert rules.

## 🔍 Monitoring Usage

### Adding New Metrics

1. **Frontend**:
```typescript
import { log } from '@/lib/logger';
log.performance('custom-metric', value, { context: 'data' });
```

2. **API**:
```typescript
// Add custom metrics to Prometheus endpoint
```

### Creating New Dashboards

1. Design dashboard in Grafana
2. Export as JSON
3. Save to `grafana/dashboards/`
4. Commit to repository

### Adding New Alerts

1. Define rule in `uptime/alert_rules.yml`
2. Configure notification in `uptime/alertmanager.yml`
3. Reload Prometheus: `docker-compose restart prometheus`

## 🛠️ Maintenance

### Daily Tasks
- [ ] Check active alerts
- [ ] Review error rates
- [ ] Monitor performance

### Weekly Tasks
- [ ] Update dashboards
- [ ] Review alert rules
- [ ] Check quotas

### Monthly Tasks
- [ ] Update documentation
- [ ] Review retention policies
- [ ] Performance tuning

## 🔒 Security

### Access Control
- Grafana: Role-based access control
- All services: Require authentication in production
- Network: VPN access for internal dashboards

### PII Protection
- No personal data in logs
- Mask sensitive information
- Use user IDs instead of names

## 📝 Troubleshooting

### Common Issues

1. **No data in Grafana**
   - Check Prometheus targets: `curl http://localhost:9090/api/v1/targets`
   - Verify data source configuration

2. **Alerts not firing**
   - Check Alertmanager config
   - Verify alert rules syntax
   - Check notification channel settings

3. **Logs not appearing**
   - Check Promtail configuration
   - Verify log file paths
   - Check Loki logs

### Performance Tuning

1. **Reduce resource usage**:
   - Adjust Prometheus retention
   - Optimize Loki index
   - Tune scrape intervals

2. **Improve query performance**:
   - Use recording rules
   - Optimize PromQL queries
   - Add metric labels

## 📞 Support

- **Monitoring Team**: monitoring@mariia-hub.com
- **On-Call**: oncall@mariia-hub.com
- **Slack**: #monitoring-mariia-hub

## 📚 Additional Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

## 🔄 Updates

### Version History

- **v1.0.0**: Initial monitoring setup
- **v1.1.0**: Added business metrics dashboard
- **v1.2.0**: Integrated Loki for log aggregation
- **v1.3.0**: Added status page configuration

### Updating Configuration

1. Make changes to config files
2. Restart affected services:
```bash
docker-compose restart [service-name]
```
3. Verify changes in dashboards

## 📄 License

This monitoring configuration is proprietary to mariiaborysevych.