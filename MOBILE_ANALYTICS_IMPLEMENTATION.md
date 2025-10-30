# Mobile Analytics Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the mobile analytics and usage tracking system for the luxury beauty/fitness booking platform. The system provides unified analytics across web, iOS, and Android platforms with privacy compliance, real-time monitoring, and business intelligence capabilities.

## Architecture Overview

### Core Components

1. **Cross-Platform Analytics** (`cross-platform-analytics.ts`)
   - Unified event tracking across platforms
   - Session management and user identification
   - Consent management integration
   - Real-time data processing

2. **Mobile-Specific Metrics** (`mobile-metrics.ts`)
   - App installation and acquisition tracking
   - Performance metrics (launch time, crashes, ANR)
   - User engagement analytics
   - Push notification and in-app purchase tracking

3. **User Behavior Analytics** (`user-behavior-analytics.ts`)
   - Beauty/fitness service preferences
   - Booking pattern analysis
   - Content engagement tracking
   - Behavioral segmentation and predictions

4. **Performance Analytics** (`performance-analytics.ts`)
   - Core Web Vitals monitoring
   - Crash reporting and error tracking
   - Resource performance analysis
   - Performance budgets and alerts

5. **Business Intelligence** (`business-intelligence.ts`)
   - Revenue analytics and forecasting
   - Customer lifetime value analysis
   - Operational efficiency metrics
   - Market intelligence and competitive analysis

6. **Analytics Services Integration** (`analytics-services.ts`)
   - Google Analytics 4 integration
   - Firebase Analytics support
   - Apple Analytics integration
   - Custom dashboard with real-time updates

7. **Data Governance** (`data-governance.ts`)
   - GDPR/CCPA compliance
   - Consent management
   - Data retention and deletion
   - Privacy impact assessments

## Quick Start

### 1. Installation and Setup

```typescript
import { createMobileAnalyticsSystem } from '@/lib/mobile-analytics';

// Create analytics system with default configuration
const analyticsSystem = createMobileAnalyticsSystem();

// Initialize the system
await analyticsSystem.initialize();
```

### 2. Basic Event Tracking

```typescript
// Track page views
await analyticsSystem.trackPageView('/beauty/lip-enhancements', 'Lip Enhancements');

// Track user actions
await analyticsSystem.trackUserAction('service_bookmarked', {
  serviceId: 'lip-enhancement-premium',
  serviceName: 'Premium Lip Enhancement',
  category: 'beauty'
});

// Track service views
await analyticsSystem.trackServiceView('user123', {
  id: 'lip-enhancement-premium',
  name: 'Premium Lip Enhancement',
  type: 'beauty',
  category: 'lip-enhancements',
  price: 800,
  currency: 'PLN'
});
```

### 3. Booking Flow Tracking

```typescript
// Track booking start
await analyticsSystem.trackBookingEvent({
  funnelEvent: 'booking_started',
  funnelStep: 1,
  totalSteps: 4,
  serviceInfo: {
    serviceId: 'lip-enhancement-premium',
    serviceName: 'Premium Lip Enhancement',
    serviceType: 'beauty',
    category: 'lip-enhancements',
    price: 800,
    currency: 'PLN',
    duration: 90
  },
  context: {
    source: 'organic_search',
    medium: 'google',
    campaign: 'spring_beauty',
    previousBookingCount: 2,
    isReturningCustomer: true
  },
  behavior: {
    timeSpentOnStep: 120,
    hesitations: 0,
    formErrors: 0
  }
});

// Track service selection
await analyticsSystem.trackBookingEvent({
  funnelEvent: 'service_selected',
  funnelStep: 2,
  totalSteps: 4,
  // ... rest of booking data
});

// Track booking completion
await analyticsSystem.trackBookingEvent({
  funnelEvent: 'booking_completed',
  funnelStep: 4,
  totalSteps: 4,
  bookingDetails: {
    bookingId: 'bk_123456',
    appointmentTime: '2024-02-15T14:00:00Z',
    duration: 90,
    totalAmount: 800,
    currency: 'PLN',
    paymentMethod: 'card'
  }
});
```

### 4. Performance Monitoring

```typescript
// Track app launch
await analyticsSystem.trackAppLaunch('cold');

// Track screen views
await analyticsSystem.trackScreenView('ServiceList', 'ServiceListScreen', {
  category: 'beauty',
  itemCount: 12
});

// Track feature usage
await analyticsSystem.trackFeatureUsage('user123', 'photo_upload', 'user_profile', 'start', {
  fileSize: 2048576,
  fileType: 'image/jpeg'
});

// Track performance metrics
await analyticsSystem.trackPerformanceMetric('api_response_time', 450, 'ms', {
  endpoint: '/api/services',
  method: 'GET'
});
```

### 5. User Identification and Consent

```typescript
// Identify user
await analyticsSystem.identifyUser('user123', {
  name: 'Anna Kowalska',
  email: 'anna@example.com',
  phone: '+48 123 456 789',
  preferences: {
    serviceType: 'beauty',
    preferredTime: 'morning'
  }
});

// Update consent
await analyticsSystem.updateConsent({
  analytics: true,
  marketing: false,
  personalization: true,
  functional: true
});
```

## Advanced Configuration

### Custom Analytics Configuration

```typescript
import { createMobileAnalyticsSystem, MobileAnalyticsSystemConfig } from '@/lib/mobile-analytics';

const customConfig: Partial<MobileAnalyticsSystemConfig> = {
  core: {
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX',
      debugMode: process.env.NODE_ENV === 'development',
      enhancedEcommerce: true,
      anonymizeIp: true
    }
  },
  metrics: {
    enableCrashReporting: true,
    enableANRMonitoring: true,
    enableMemoryMonitoring: true,
    performanceSampleRate: 0.1
  },
  behavior: {
    enablePredictiveAnalytics: true,
    enableChurnPrediction: true,
    predictionModelUpdateFrequency: 12
  },
  performance: {
    enableCoreWebVitals: true,
    enablePerformanceAlerts: true,
    budgets: {
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2000,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1
    }
  },
  business: {
    enableRevenueForecasting: true,
    enablePredictiveModels: true,
    enableRealTimeAlerts: true
  },
  governance: {
    gdpr: {
      enabled: true,
      requireConsent: true,
      dataRetentionDays: 365
    }
  }
};

const analyticsSystem = createMobileAnalyticsSystem(customConfig);
await analyticsSystem.initialize();
```

### Custom Dashboard Configuration

```typescript
// Create custom dashboard
analyticsSystem.createDashboard({
  id: 'beauty-services-performance',
  name: 'Beauty Services Performance',
  category: 'operational',
  layout: 'grid',
  widgets: [
    {
      id: 'service-popularity',
      type: 'chart',
      title: 'Most Popular Beauty Services',
      dataSource: 'customDashboard',
      query: {
        metrics: ['service_views', 'bookings', 'revenue'],
        dimensions: ['service_name', 'category'],
        filters: {
          service_type: 'beauty',
          date_range: '30d'
        }
      },
      visualization: {
        type: 'bar',
        options: {
          xAxis: 'service_name',
          yAxis: 'bookings',
          groupBy: 'category'
        }
      },
      position: { x: 0, y: 0, width: 6, height: 4 }
    },
    {
      id: 'revenue-by-service',
      type: 'chart',
      title: 'Revenue by Beauty Service',
      dataSource: 'customDashboard',
      query: {
        metrics: ['revenue'],
        dimensions: ['service_name'],
        filters: {
          service_type: 'beauty',
          date_range: '30d'
        }
      },
      visualization: {
        type: 'pie',
        options: {
          groupBy: 'service_name',
          metric: 'revenue'
        }
      },
      position: { x: 6, y: 0, width: 3, height: 4 }
    }
  ],
  filters: [
    {
      name: 'dateRange',
      type: 'date',
      defaultValue: { start: '30d', end: 'today' }
    },
    {
      name: 'category',
      type: 'select',
      options: ['lip-enhancements', 'brows-lashes', 'facial-treatments'],
      defaultValue: 'all'
    }
  ],
  refreshInterval: 300,
  permissions: ['admin', 'beauty_manager'],
  sharing: { public: false, users: ['admin@mariaborysevych.com'], export: true }
});
```

## Integration Examples

### React Hook for Analytics

```typescript
// hooks/useAnalytics.ts
import { useCallback, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

export const useAnalytics = () => {
  const analytics = useAnalytics();

  const trackPageView = useCallback((page: string, title?: string) => {
    analytics.trackPageView(page, title);
  }, [analytics]);

  const trackEvent = useCallback((name: string, properties?: any) => {
    analytics.trackUserAction(name, properties);
  }, [analytics]);

  const trackServiceView = useCallback((serviceId: string, serviceData: any) => {
    // Get current user ID from auth context
    const userId = getCurrentUserId();
    analytics.trackServiceView(userId, serviceData);
  }, [analytics]);

  const trackBookingStep = useCallback((step: string, bookingData: any) => {
    analytics.trackBookingEvent({
      funnelEvent: step,
      funnelStep: getStepNumber(step),
      totalSteps: 4,
      ...bookingData
    });
  }, [analytics]);

  return {
    trackPageView,
    trackEvent,
    trackServiceView,
    trackBookingStep
  };
};

// Usage in component
import { useAnalytics } from '@/hooks/useAnalytics';

const ServiceDetailPage = ({ service }) => {
  const { trackServiceView, trackEvent } = useAnalytics();

  useEffect(() => {
    trackServiceView(service.id, service);
  }, [service, trackServiceView]);

  const handleBookmark = () => {
    trackEvent('service_bookmarked', {
      serviceId: service.id,
      serviceName: service.name
    });
  };

  return (
    <div>
      <h1>{service.name}</h1>
      <button onClick={handleBookmark}>Bookmark</button>
    </div>
  );
};
```

### Booking Flow Integration

```typescript
// components/BookingWizard.tsx
import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const BookingWizard = ({ service }) => {
  const { trackBookingStep } = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Track booking start when wizard loads
    trackBookingStep('booking_started', {
      serviceInfo: {
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type,
        category: service.category,
        price: service.price,
        currency: service.currency,
        duration: service.duration
      },
      context: {
        source: document.referrer,
        timestamp: new Date().toISOString()
      }
    });
  }, [service, trackBookingStep]);

  const handleStepComplete = async (step: number, stepData: any) => {
    const stepName = getStepName(step);

    await trackBookingStep(stepName, {
      ...stepData,
      behavior: {
        timeSpentOnStep: calculateTimeOnStep(step),
        hesitations: countHesitations(step)
      }
    });

    if (step === 4) {
      // Booking completed
      await trackBookingStep('booking_completed', stepData);
    }
  };

  return (
    <div>
      {/* Booking wizard implementation */}
    </div>
  );
};
```

### Performance Monitoring Integration

```typescript
// utils/performance.ts
import { analyticsSystem } from '@/lib/analytics';

export const measurePageLoad = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        analyticsSystem.trackPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.navigationStart, 'ms', {
          url: window.location.pathname,
          resource_count: performance.getEntriesByType('resource').length
        });

        // Track Core Web Vitals
        analyticsSystem.trackPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.navigationStart, 'ms');
        analyticsSystem.trackPerformanceMetric('first_byte', navigation.responseStart - navigation.requestStart, 'ms');
      }, 0);
    });
  }
};

// API response time tracking
export const trackAPIResponse = (url: string, method: string, duration: number, status: number) => {
  analyticsSystem.trackPerformanceMetric('api_response_time', duration, 'ms', {
    url,
    method,
    status,
    success: status >= 200 && status < 400
  });
};
```

## Privacy and Compliance

### GDPR Consent Implementation

```typescript
// components/ConsentBanner.tsx
import { useState } from 'react';
import { analyticsSystem } from '@/lib/analytics';

export const ConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAcceptAll = async () => {
    await analyticsSystem.updateConsent({
      analytics: true,
      marketing: true,
      personalization: true,
      functional: true
    });
    setIsVisible(false);
  };

  const handleAcceptEssential = async () => {
    await analyticsSystem.updateConsent({
      analytics: false,
      marketing: false,
      personalization: false,
      functional: true
    });
    setIsVisible(false);
  };

  const handleCustomize = () => {
    // Show detailed consent preferences
  };

  if (!isVisible) return null;

  return (
    <div className="consent-banner">
      <p>
        We use analytics and marketing cookies to improve your experience.
        By continuing to use our site, you agree to our use of cookies.
      </p>
      <button onClick={handleAcceptAll}>Accept All</button>
      <button onClick={handleAcceptEssential}>Essential Only</button>
      <button onClick={handleCustomize}>Customize</button>
    </div>
  );
};
```

### Data Subject Rights Implementation

```typescript
// api/privacy.ts
import { analyticsSystem } from '@/lib/analytics';

export const privacyAPI = {
  // Export user data (GDPR Right to Access)
  exportUserData: async (userId: string) => {
    try {
      const userData = await analyticsSystem.exportUserData(userId);
      return {
        success: true,
        data: userData,
        format: 'json'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete user data (GDPR Right to Erasure)
  deleteUserData: async (userId: string) => {
    try {
      await analyticsSystem.deleteUserData(userId);
      return {
        success: true,
        message: 'User data deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate compliance report
  generateComplianceReport: async (period: { start: string; end: string }) => {
    try {
      const report = await analyticsSystem.generateComplianceReport(period);
      return {
        success: true,
        report
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
```

## Monitoring and Alerting

### Real-time Dashboard Setup

```typescript
// components/AnalyticsDashboard.tsx
import { useState, useEffect } from 'react';
import { analyticsSystem } from '@/lib/analytics';

export const AnalyticsDashboard = () => {
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Fetch real-time metrics
    const fetchRealTimeData = async () => {
      const metrics = await analyticsSystem.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      const data = await analyticsSystem.getBusinessIntelligenceDashboard();
      setDashboardData(data);
    };

    fetchRealTimeData();
    fetchDashboardData();

    // Set up real-time updates
    const interval = setInterval(fetchRealTimeData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!realTimeMetrics || !dashboardData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="metrics-overview">
        <div className="metric">
          <h3>Active Users</h3>
          <p>{realTimeMetrics.activeUsers}</p>
        </div>
        <div className="metric">
          <h3>Today's Revenue</h3>
          <p>{realTimeMetrics.revenue.today} PLN</p>
        </div>
        <div className="metric">
          <h3>Current Sessions</h3>
          <p>{realTimeMetrics.currentSessions}</p>
        </div>
      </div>

      <div className="charts">
        {/* Render dashboard charts */}
      </div>
    </div>
  );
};
```

### Custom Alert Configuration

```typescript
// utils/analytics-alerts.ts
import { analyticsSystem } from '@/lib/analytics';

export const setupCustomAlerts = () => {
  // Monitor for revenue drops
  analyticsSystem.on('revenue_decline', (data) => {
    if (data.percentageChange < -20) {
      sendAlert({
        type: 'revenue_alert',
        severity: 'critical',
        message: `Revenue dropped by ${data.percentageChange}%`,
        data
      });
    }
  });

  // Monitor for high error rates
  analyticsSystem.on('error_rate_high', (data) => {
    if (data.errorRate > 5) {
      sendAlert({
        type: 'performance_alert',
        severity: 'warning',
        message: `Error rate is ${data.errorRate}%`,
        data
      });
    }
  });

  // Monitor for low conversion rates
  analyticsSystem.on('conversion_rate_low', (data) => {
    if (data.conversionRate < 2) {
      sendAlert({
        type: 'business_alert',
        severity: 'warning',
        message: `Conversion rate dropped to ${data.conversionRate}%`,
        data
      });
    }
  });
};

const sendAlert = (alert) => {
  // Send alert to monitoring system, email, Slack, etc.
  console.log('ALERT:', alert);
};
```

## Deployment Considerations

### Environment Variables

```bash
# Google Analytics 4
REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Analytics (optional)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Custom Analytics Dashboard
REACT_APP_ANALYTICS_ENDPOINT=https://api.mariaborysevych.com/analytics
REACT_APP_ANALYTICS_API_KEY=your_api_key

# App Configuration
REACT_APP_VERSION=1.0.0
NODE_ENV=production
```

### Analytics Initialization in App

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { createMobileAnalyticsSystem } from '@/lib/mobile-analytics';
import { BrowserRouter } from 'react-router-dom';

const App = () => {
  useEffect(() => {
    const initializeAnalytics = async () => {
      const analyticsSystem = createMobileAnalyticsSystem({
        // Custom configuration if needed
      });

      try {
        await analyticsSystem.initialize();

        // Make analytics available globally
        window.analytics = analyticsSystem;

        console.log('Analytics initialized successfully');
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);

  return (
    <BrowserRouter>
      {/* Your app components */}
    </BrowserRouter>
  );
};

export default App;
```

### Error Handling and Fallbacks

```typescript
// utils/analytics-fallback.ts
export const createFallbackAnalytics = () => {
  // Fallback analytics implementation when main system fails
  return {
    trackEvent: async (event) => {
      console.log('Analytics (fallback):', event);
      // Store in localStorage for later sync
      const stored = JSON.parse(localStorage.getItem('analytics_fallback') || '[]');
      stored.push({ ...event, timestamp: new Date().toISOString() });
      localStorage.setItem('analytics_fallback', JSON.stringify(stored));
    },
    trackPageView: async (page, title) => {
      console.log('Page view (fallback):', page, title);
    },
    // Implement fallback methods for all required functions
  };
};

// Usage in error boundary
class AnalyticsErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Analytics error:', error);
    // Initialize fallback analytics
    window.analytics = createFallbackAnalytics();
  }

  render() {
    return this.props.children;
  }
}
```

## Best Practices

### 1. Event Naming Conventions

```typescript
// Use consistent naming conventions
analytics.trackEvent({
  name: 'booking_step_completed',
  category: 'booking',
  action: 'step_complete',
  label: 'service_selection',
  properties: {
    step: 2,
    stepName: 'service_selection',
    serviceCategory: 'beauty'
  }
});
```

### 2. Performance Considerations

```typescript
// Batch events for better performance
const events = [
  { name: 'service_view', properties: { serviceId: '1' } },
  { name: 'service_view', properties: { serviceId: '2' } },
  { name: 'service_view', properties: { serviceId: '3' } }
];

// Send as batch
await Promise.all(events.map(event => analytics.trackEvent(event)));
```

### 3. Data Quality

```typescript
// Validate data before tracking
const validateBookingData = (data) => {
  const required = ['serviceId', 'serviceName', 'price', 'currency'];
  const missing = required.filter(field => !data[field]);

  if (missing.length > 0) {
    console.warn('Missing required fields:', missing);
    return false;
  }

  return true;
};

const trackBookingEvent = (bookingData) => {
  if (validateBookingData(bookingData)) {
    analytics.trackBookingEvent(bookingData);
  }
};
```

### 4. Testing Analytics

```typescript
// __tests__/analytics.test.ts
import { createMobileAnalyticsSystem } from '@/lib/mobile-analytics';

describe('Analytics System', () => {
  let analyticsSystem;

  beforeEach(() => {
    analyticsSystem = createMobileAnalyticsSystem({
      core: {
        googleAnalytics: { enabled: false }, // Disable external services for testing
        customDashboard: { enabled: false }
      }
    });
  });

  test('should track events', async () => {
    await analyticsSystem.initialize();

    const eventSpy = jest.spyOn(analyticsSystem, 'trackEvent');

    await analyticsSystem.trackEvent({
      name: 'test_event',
      category: 'test',
      action: 'test_action'
    });

    expect(eventSpy).toHaveBeenCalled();
  });

  test('should handle consent', async () => {
    await analyticsSystem.initialize();

    await analyticsSystem.updateConsent({
      analytics: true,
      marketing: false
    });

    const hasConsent = await analyticsSystem.hasConsent();
    expect(hasConsent).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Analytics not initializing**
   - Check environment variables
   - Verify API keys and configuration
   - Check browser console for errors

2. **Events not being tracked**
   - Verify consent is granted
   - Check network connectivity
   - Review event validation

3. **Performance impact**
   - Adjust sampling rates
   - Review batch sizes
   - Check for memory leaks

4. **Privacy compliance issues**
   - Verify consent implementation
   - Check data retention settings
   - Review data anonymization

### Debug Mode

```typescript
// Enable debug mode for development
const analyticsSystem = createMobileAnalyticsSystem({
  core: {
    googleAnalytics: {
      debugMode: true
    }
  }
});
```

### Analytics Health Check

```typescript
// utils/analytics-health.ts
export const performAnalyticsHealthCheck = async () => {
  const health = {
    initialized: false,
    services: {},
    lastEvent: null,
    errorCount: 0
  };

  try {
    // Check if analytics is initialized
    health.initialized = window.analytics?.isInitialized();

    // Check service status
    if (health.initialized) {
      health.services = await window.analytics.getServiceStatus();
    }

    // Test event tracking
    await window.analytics.trackEvent({
      name: 'health_check',
      category: 'system',
      action: 'test'
    });
    health.lastEvent = new Date().toISOString();

  } catch (error) {
    health.errorCount++;
    console.error('Analytics health check failed:', error);
  }

  return health;
};
```

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Review analytics dashboards and performance metrics
2. **Monthly**: Generate compliance reports and review data retention
3. **Quarterly**: Update analytics configuration and review privacy policies
4. **Annually**: Conduct privacy impact assessments and security audits

### Documentation Updates

- Maintain this implementation guide
- Update configuration documentation when adding new features
- Document any custom implementations or integrations

### Monitoring

- Set up alerts for critical metrics
- Monitor system performance and error rates
- Review data quality and compliance status regularly

This comprehensive mobile analytics system provides all the tools needed to track user behavior, monitor performance, ensure privacy compliance, and gain valuable business insights for the luxury beauty/fitness booking platform.