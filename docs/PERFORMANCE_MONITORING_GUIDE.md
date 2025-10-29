# Enterprise Performance Monitoring System

## Overview

The Mariia Hub platform now includes a comprehensive enterprise-grade performance monitoring system that provides real-time insights, alerting, SLA tracking, and security integration. This system is designed to ensure optimal performance, proactive issue detection, and compliance with service level agreements.

## Architecture

The performance monitoring system consists of several interconnected components:

### Core Components

1. **Performance Monitoring Service** (`/src/lib/performance-monitoring.ts`)
   - Real-time metrics collection (Web Vitals, API performance, resource monitoring)
   - Automatic performance data aggregation and analysis
   - Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
   - User behavior and interaction monitoring

2. **Performance Alerting System** (`/src/lib/performance-alerts.ts`)
   - Intelligent alerting with escalation policies
   - Configurable thresholds and notification channels
   - Automatic correlation and suppression rules
   - Multi-channel notifications (email, Slack, SMS, webhooks)

3. **Performance Dashboard** (`/src/components/admin/PerformanceDashboard.tsx`)
   - Real-time performance visualization
   - Interactive charts and trend analysis
   - Geographic and device performance breakdowns
   - SLA compliance monitoring

4. **API Infrastructure** (`/src/api/performance-api.ts`)
   - RESTful API endpoints for performance data collection
   - Batch processing and data aggregation
   - Health check and monitoring endpoints
   - Integration with existing systems

5. **Security Integration** (`/src/lib/security-performance-integration.ts`)
   - Security-performance correlation analysis
   - Threat detection through performance anomalies
   - Unified incident response
   - Risk assessment and mitigation

6. **SLA Management** (`/src/lib/sla-management.ts`)
   - Comprehensive SLA definition and tracking
   - Automated compliance reporting
   - Penalty calculation and breach notification
   - Performance guarantees monitoring

## Quick Start

### 1. Initialize the System

```typescript
import {
  initializePerformanceMonitoring,
  initializePerformanceAlerting,
  initializeSecurityPerformanceIntegration,
  initializeSLAManagement
} from '@/lib/performance-monitoring';

// Initialize all components
await initializePerformanceMonitoring();
await initializePerformanceAlerting();
await initializeSecurityPerformanceIntegration();
await initializeSLAManagement();
```

### 2. Access the Dashboard

Navigate to `/admin/performance` in your application to view the performance dashboard.

### 3. Monitor Key Metrics

The system automatically tracks:
- **Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **API Performance**: Response times, error rates, throughput
- **Resource Performance**: Load times, sizes, caching efficiency
- **User Experience**: Page views, bounce rates, engagement metrics

## Configuration

### Performance Monitoring Configuration

```typescript
import { performanceMonitoringService } from '@/lib/performance-monitoring';

// Configure monitoring settings
performanceMonitoringService.updateConfig({
  enabled: true,
  sampleRate: 1.0, // 100% sampling
  thresholds: {
    lcp: { good: 2500, needsImprovement: 4000, poor: 6000 },
    fid: { good: 100, needsImprovement: 300, poor: 500 },
    cls: { good: 0.1, needsImprovement: 0.25, poor: 0.5 }
  },
  alerting: {
    enabled: true,
    channels: ['email', 'slack'],
    thresholds: {
      responseTime: { good: 500, needsImprovement: 1500, poor: 3000 }
    }
  }
});
```

### Alert Rules Configuration

```typescript
import { performanceAlertingService } from '@/lib/performance-alerts';

// Create custom alert rule
const ruleId = await performanceAlertingService.addAlertRule({
  name: 'High Response Time Alert',
  description: 'Alert when API response time exceeds 2 seconds',
  enabled: true,
  metric: 'apiResponseTime',
  condition: 'gt',
  threshold: 2000,
  duration: 300000, // 5 minutes
  severity: 'warning',
  businessImpact: 'medium',
  tags: ['api', 'performance'],
  actions: [
    {
      type: 'notification',
      config: { channels: ['email', 'slack'] },
      delay: 0
    }
  ],
  cooldown: 900000, // 15 minutes
  notificationChannels: []
});
```

### SLA Definition

```typescript
import { slaManagementService } from '@/lib/sla-management';

// Create SLA definition
const slaId = await slaManagementService.createSLA({
  name: 'Premium Customer SLA',
  description: 'Enhanced performance guarantees for premium customers',
  version: '1.0',
  status: 'active',
  serviceLevel: 'premium',
  customerSegment: 'premium',
  validityPeriod: {
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  metrics: [
    {
      id: 'availability-99.99',
      name: 'Service Availability',
      type: 'availability',
      target: { value: 99.99, unit: '%', operator: 'gte' },
      measurement: {
        method: 'continuous',
        interval: 1,
        window: 5,
        aggregation: 'avg'
      },
      weight: 40,
      critical: true
    },
    {
      id: 'response-time-500',
      name: 'API Response Time',
      type: 'response_time',
      target: { value: 500, unit: 'ms', operator: 'lte' },
      measurement: {
        method: 'continuous',
        interval: 1,
        window: 5,
        aggregation: 'p95'
      },
      weight: 30,
      critical: true
    }
  ],
  penalties: {
    enabled: true,
    structure: {
      breachThreshold: 5,
      penaltyType: 'credit',
      calculation: { basis: 'percentage', value: 15 }
    }
  },
  reporting: {
    frequency: 'weekly',
    recipients: ['premium-support@mariia.com'],
    format: 'email'
  }
});
```

## API Endpoints

### Data Collection Endpoints

#### Web Vitals
```http
POST /api/performance/web-vitals
Content-Type: application/json

{
  "sessionId": "uuid",
  "userId": "optional-user-id",
  "url": "https://mariia.com/booking",
  "vitals": {
    "lcp": 2100,
    "fid": 45,
    "cls": 0.08,
    "fcp": 1200,
    "ttfb": 350
  },
  "navigation": {
    "type": "navigate",
    "domContentLoaded": 1500,
    "loadComplete": 2100
  },
  "device": {
    "type": "desktop",
    "cores": 8,
    "connection": "4g"
  }
}
```

#### API Performance
```http
POST /api/performance/api-metrics
Content-Type: application/json

{
  "sessionId": "uuid",
  "endpoint": "/api/bookings",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 450,
  "requestSize": 1024,
  "responseSize": 2048,
  "cacheHit": false,
  "retries": 0
}
```

#### Error Reporting
```http
POST /api/performance/error
Content-Type: application/json

{
  "sessionId": "uuid",
  "type": "javascript",
  "message": "TypeError: Cannot read property 'x' of undefined",
  "stack": "Error stack trace",
  "url": "https://mariia.com/booking",
  "businessContext": {
    "userImpact": "medium",
    "feature": "booking-form"
  }
}
```

### Monitoring Endpoints

#### Health Check
```http
GET /api/performance/health

Response:
{
  "status": "healthy",
  "score": 95,
  "checks": [
    {
      "name": "Database",
      "status": "pass",
      "message": "Database connection successful (45ms)",
      "duration": 45
    },
    {
      "name": "API",
      "status": "pass",
      "message": "API health check successful (120ms)",
      "duration": 120
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Performance Report
```http
GET /api/performance/report?startDate=2025-01-14&endDate=2025-01-15

Response:
{
  "summary": {
    "totalPageViews": 15420,
    "uniqueUsers": 3420,
    "avgResponseTime": 485,
    "errorRate": 0.8,
    "availability": 99.92
  },
  "webVitals": {
    "lcp": { "avg": 2100, "p95": 3200 },
    "fid": { "avg": 65, "p95": 120 },
    "cls": { "avg": 0.12, "p95": 0.25 }
  },
  "apiPerformance": {
    "avgResponseTime": 485,
    "errorRate": 0.8,
    "throughput": 1250
  }
}
```

## Dashboard Usage

### Main Dashboard Sections

1. **Overview**
   - Overall health score and system status
   - Active alerts and their severity
   - Key performance indicators
   - Recent activity summary

2. **Web Vitals**
   - Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB)
   - Performance scores and trends
   - Resource analysis (slow/large resources)
   - Geographic performance breakdown

3. **API Performance**
   - Response time distribution
   - Error rate tracking
   - Cache hit rates
   - Endpoint performance analysis

4. **Alerts Management**
   - Active alerts list with filtering
   - Alert acknowledgment and resolution
   - Alert history and trends
   - Notification channel management

5. **SLA Tracking**
   - SLA compliance status
   - Performance vs targets comparison
   - Breach notifications and penalties
   - Historical compliance reports

6. **Geographic Analysis**
   - Performance by region/country
   - User distribution and experience
   - Network performance insights
   - Device type breakdown

## Integration Examples

### React Component Integration

```typescript
import { usePerformanceMonitor } from '@/lib/performance-monitoring';

function BookingForm() {
  const { measure } = usePerformanceMonitor();

  const handleSubmit = async (data: BookingData) => {
    // Measure booking submission performance
    await measure('booking-submission', async () => {
      const result = await submitBooking(data);
      return result;
    }, {
      logResults: true,
      threshold: 2000 // Alert if takes longer than 2 seconds
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Custom Metric Tracking

```typescript
import { recordCustomMetric } from '@/lib/performance-monitoring';

// Track custom business metrics
recordCustomMetric('booking-completion-rate', 85.5, {
  category: 'business',
  period: 'daily',
  segment: 'premium'
});

// Track user interactions
recordCustomMetric('search-response-time', 150, {
  feature: 'search',
  queryType: 'autocomplete'
});
```

### Error Boundary Integration

```typescript
import { performanceMonitoringService } from '@/lib/performance-monitoring';

class PerformanceErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Record error with performance context
    performanceMonitoringService.recordError({
      type: 'react',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now()
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackUI />;
    }
    return this.props.children;
  }
}
```

## Testing and Validation

### Running Validation Tests

```typescript
import {
  validatePerformanceMonitoring,
  runPerformanceTests,
  benchmarkPerformance,
  getPerformanceReport
} from '@/lib/performance-monitoring-integration';

// Validate system health
const validation = await validatePerformanceMonitoring();
console.log('System Status:', validation.overall.status);
console.log('Score:', validation.overall.score);

// Run performance tests
const testResults = await runPerformanceTests();
console.log('Tests Passed:', Array.from(testResults.values()).filter(r => r.passed).length);

// Run performance benchmarks
const benchmark = await benchmarkPerformance('api');
console.log('P95 Response Time:', benchmark.metrics.responseTime.p95 + 'ms');

// Generate comprehensive report
const report = getPerformanceReport();
console.log(report);
```

### Manual Testing

1. **Load Performance Testing**
   - Open browser developer tools
   - Navigate to various pages
   - Monitor Network and Performance tabs
   - Check Core Web Vitals scores

2. **API Testing**
   - Use tools like Postman or curl
   - Test various API endpoints
   - Monitor response times and error rates
   - Verify data collection in dashboard

3. **Alert Testing**
   - Trigger performance thresholds
   - Verify alert notifications
   - Test escalation policies
   - Validate alert resolution workflow

## Best Practices

### Performance Monitoring

1. **Set Appropriate Thresholds**
   ```typescript
   // Good thresholds for web applications
   const thresholds = {
     lcp: { good: 2500, needsImprovement: 4000, poor: 6000 },
     fid: { good: 100, needsImprovement: 300, poor: 500 },
     cls: { good: 0.1, needsImprovement: 0.25, poor: 0.5 }
   };
   ```

2. **Use Meaningful Segments**
   - Segment metrics by user type, geography, device
   - Track performance for critical user journeys
   - Monitor performance during peak hours

3. **Implement Proper Sampling**
   - Use 100% sampling for critical paths
   - Reduce sampling for non-critical metrics
   - Adjust sampling based on traffic volume

### Alert Management

1. **Configure Escalation Policies**
   ```typescript
   const escalationPolicy = {
     enabled: true,
     levels: [
       {
         level: 1,
         delay: 600000, // 10 minutes
         actions: [notificationAction]
       },
       {
         level: 2,
         delay: 300000, // 5 minutes
         actions: [smsAction, escalationAction]
       }
     ]
   };
   ```

2. **Set Up Suppression Rules**
   - Prevent alert fatigue during maintenance
   - Group related alerts
   - Use correlation to reduce duplicates

3. **Choose Appropriate Channels**
   - Email for non-critical alerts
   - SMS/Slack for critical issues
   - Webhooks for automated responses

### SLA Management

1. **Define Realistic Targets**
   ```typescript
   const slaMetrics = [
     {
       name: 'Availability',
       target: 99.9, // Be realistic
       measurement: 'continuous'
     },
     {
       name: 'Response Time',
       target: 1000, // Based on user expectations
       measurement: 'p95' // Use percentiles
     }
   ];
   ```

2. **Include Business Context**
   - Define business hours and maintenance windows
   - Specify excluded periods
   - Document calculation methods

3. **Automate Reporting**
   - Generate regular compliance reports
   - Send automatic breach notifications
   - Track trends and improvements

## Troubleshooting

### Common Issues

1. **Missing Data in Dashboard**
   - Check browser console for errors
   - Verify monitoring service initialization
   - Ensure proper API key configuration

2. **False Alerts**
   - Review threshold configurations
   - Check suppression rules
   - Adjust measurement windows

3. **High Resource Usage**
   - Monitor sampling rates
   - Optimize data retention
   - Check for memory leaks

### Debug Information

```typescript
// Enable debug logging
import { logger } from '@/services/logger.service';

// Check service status
console.log('Performance Monitoring Status:', {
  initialized: performanceMonitoringService.getCurrentMetrics() !== null,
  alerts: performanceAlertingService.getActiveAlerts().length,
  slas: slaManagementService.getAllSLAs().length
});

// Get detailed metrics
const metrics = performanceMonitoringService.getCurrentMetrics();
console.log('Current Metrics:', metrics);

// Check for errors
const alerts = performanceAlertingService.getActiveAlerts();
console.log('Active Alerts:', alerts);
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Review and Update Thresholds**
   - Monthly review of performance targets
   - Adjust based on user feedback and business needs
   - Update seasonal expectations

2. **Monitor System Health**
   - Check dashboard functionality
   - Verify alert delivery
   - Validate data accuracy

3. **Optimize Performance**
   - Review monitoring overhead
   - Optimize database queries
   - Clean up historical data

### Getting Help

For issues or questions about the performance monitoring system:

1. Check the dashboard for system status
2. Review browser console for errors
3. Consult this documentation
4. Contact the development team with specific error details

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Maintainer:** Performance Engineering Team