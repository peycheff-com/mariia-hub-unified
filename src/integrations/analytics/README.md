# Advanced Analytics System for Beauty & Fitness Booking Platform

This comprehensive analytics system provides advanced tracking, analysis, and optimization capabilities specifically designed for the beauty and fitness booking platform targeting the premium Warsaw market.

## 🎯 Features

### 1. Google Analytics 4 Integration
- **E-commerce tracking** for service bookings and payments
- **Custom dimensions** for beauty/fitness service categories
- **Enhanced measurement** for booking flows
- **Real-time data collection** with automatic batch processing

### 2. Booking Funnel Analysis
- **4-step conversion tracking** (Choose Service → Select Time → Enter Details → Complete Payment)
- **Drop-off analysis** with detailed reasons
- **Step-by-step performance metrics**
- **Real-time conversion rate monitoring**

### 3. User Behavior Tracking
- **Click tracking** with rage click detection
- **Scroll depth analysis** at 25%, 50%, 75%, and 90%
- **Session recording** with user journey mapping
- **Service interaction tracking** (views, favorites, shares, comparisons)

### 4. A/B Testing Framework
- **Statistical significance testing** with confidence intervals
- **Multi-variant testing** support
- **Real-time results monitoring**
- **Automated winner determination**

### 5. Heat Maps & Session Recording
- **Click heat maps** for service selection pages
- **Scroll depth visualization**
- **Session replay** for booking funnel optimization
- **Device-specific behavior analysis**

### 6. Performance Metrics & Core Web Vitals
- **CLS, FID, FCP, LCP, TTFB, INP tracking**
- **Performance impact on conversions**
- **Real-time performance alerts**
- **Device-specific performance analysis**

### 7. GDPR Compliance & Data Privacy
- **Cookie consent management**
- **Data anonymization** (IP addresses, sensitive data)
- **User rights implementation** (access, portability, deletion)
- **Audit logging** for compliance monitoring

## 🚀 Quick Start

### 1. Environment Setup

Add these variables to your `.env` file:

```env
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_API_SECRET=your-ga4-api-secret
VITE_GA4_STREAM_ID=your-ga4-stream-id

# Hotjar (for heatmaps)
VITE_HOTJAR_ID=your-hotjar-site-id

# Analytics Configuration
VITE_ANALYTICS_ENABLED=true
VITE_BEHAVIOR_TRACKING_ENABLED=true
VITE_PERFORMANCE_TRACKING_ENABLED=true
VITE_AB_TESTING_ENABLED=true
VITE_SESSION_RECORDING_ENABLED=true

# GDPR Compliance
VITE_GDPR_ENABLED=true
VITE_COOKIE_CONSENT_REQUIRED=true
VITE_DATA_RETENTION_DAYS=730
```

### 2. Basic Usage

```tsx
import { useAnalytics } from '@/integrations/analytics';

function BookingPage() {
  const { trackEvent, trackPageView, trackConversion } = useAnalytics();

  useEffect(() => {
    trackPageView('/booking', 'Book Your Service');
  }, []);

  const handleServiceSelect = (service) => {
    trackEvent('service_selected', {
      service_id: service.id,
      service_category: service.category,
      service_price: service.price,
    });
  };

  const handleBookingComplete = (booking) => {
    trackConversion('booking_completed', booking.price, 'PLN');
  };

  return (
    // Your booking component
  );
}
```

### 3. Advanced Analytics Dashboard

```tsx
import AdvancedAnalyticsDashboard from '@/components/admin/AdvancedAnalyticsDashboard';

function AdminDashboard() {
  return (
    <div>
      <AdvancedAnalyticsDashboard />
    </div>
  );
}
```

## 📊 Analytics Components

### Core Tracking Services

#### GA4 Analytics (`ga4Analytics`)
- Handles Google Analytics 4 integration
- E-commerce event tracking
- Custom dimension management
- Real-time data reporting

#### Booking Tracker (`bookingTracker`)
- Tracks 4-step booking funnel
- Service selection events
- Conversion and abandonment tracking
- Step-by-step performance metrics

#### Behavior Tracker (`behaviorTracker`)
- User interaction tracking
- Scroll depth monitoring
- Session journey mapping
- Device and language analytics

#### Funnel Analyzer (`funnelAnalyzer`)
- Conversion funnel analysis
- Drop-off point identification
- Performance bottleneck detection
- Revenue impact analysis

#### Performance Tracker (`performanceTracker`)
- Core Web Vitals monitoring
- Performance-conversion correlation
- Real-time performance alerts
- Device-specific optimization

#### A/B Testing Framework (`abTestingFramework`)
- Statistical A/B testing
- Multi-variant experiments
- Automated result analysis
- Conversion optimization

#### Heatmap & Session Recorder (`heatmapSessionRecorder`)
- Click heat map generation
- Session recording and replay
- User behavior visualization
- Conversion optimization insights

#### GDPR Compliance Manager (`gdprComplianceManager`)
- Cookie consent management
- Data privacy compliance
- User rights implementation
- Audit logging

## 🔧 Database Schema

The analytics system requires the following database tables:

### Core Tables
- `analytics_events` - General analytics events
- `booking_analytics_events` - Booking-specific events
- `behavior_analytics_events` - User behavior events
- `session_recordings` - Session recording data
- `session_recording_events` - Individual session events
- `performance_metrics` - Core Web Vitals and performance data
- `performance_alerts` - Performance issue alerts
- `ab_tests` - A/B test configurations
- `ab_test_assignments` - User test assignments
- `funnel_analysis` - Conversion funnel data
- `user_journeys` - Complete user journeys

### Compliance Tables
- `consent_records` - User consent records
- `data_processing_records` - GDPR processing records
- `user_data_requests` - Data access/deletion requests
- `consent_activity_log` - Consent audit log
- `data_processing_activity_log` - Processing audit log

## 📈 Key Metrics Tracked

### Booking Metrics
- **Conversion Rate**: % of users completing booking
- **Funnel Drop-off**: Users lost at each step
- **Service Performance**: Popular services and categories
- **Revenue Analytics**: Total revenue and average order value
- **Time to Convert**: Average booking completion time

### User Behavior Metrics
- **Session Duration**: Time spent on platform
- **Pages per Session**: User engagement level
- **Click Patterns**: User interaction analysis
- **Device Performance**: Mobile vs desktop vs tablet
- **Geographic Insights**: Location-based preferences

### Performance Metrics
- **Core Web Vitals**: LCP, FID, CLS, INP, TTFB, FCP
- **Page Load Speed**: Impact on conversions
- **Device Performance**: Performance by device type
- **Network Performance**: Connection speed impact

### A/B Testing Metrics
- **Statistical Significance**: Confidence levels
- **Conversion Impact**: Test result analysis
- **Revenue Impact**: Financial impact of changes
- **User Segmentation**: Performance by user groups

## 🎯 Beauty & Fitness Specific Insights

### Service Category Analysis
- **Beauty vs Fitness Preferences**: Category performance comparison
- **Seasonal Trends**: Service demand patterns
- **Price Sensitivity**: Category-specific pricing analysis
- **Time Slot Preferences**: Optimal booking times

### Luxury Market Insights
- **Premium Service Performance**: High-value service analytics
- **Customer Journey Patterns**: Luxury booking behavior
- **Mobile vs Desktop**: Device preference for luxury bookings
- **Geographic Distribution**: Warsaw area analysis

### Conversion Optimization
- **Booking Friction Points**: Step-by-step bottleneck analysis
- **Payment Process Optimization**: Checkout flow improvements
- **Mobile Experience**: Mobile-specific conversion issues
- **Language Impact**: Polish vs English conversion rates

## 🔒 Privacy & Compliance

### GDPR Features
- **Explicit Consent**: Cookie consent management
- **Data Minimization**: Only collect necessary data
- **User Rights**: Access, portability, deletion rights
- **Anonymization**: IP and sensitive data masking

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Access Controls**: Role-based data access
- **Audit Logging**: Complete compliance audit trail
- **Data Retention**: Automated data cleanup

## 🚨 Real-time Alerts

### Performance Alerts
- **Core Web Vitals Thresholds**: Automatic alerts for poor performance
- **Conversion Impact**: Performance issues affecting conversions
- **Device-Specific Issues**: Targeted performance alerts
- **Revenue Impact**: Financial impact of performance issues

### Business Alerts
- **Conversion Rate Drops**: Unusual conversion patterns
- **Booking Abandonment Spikes**: Sudden increase in drop-offs
- **Revenue Anomalies**: Unexpected revenue changes
- **Technical Issues**: System performance problems

## 📱 Mobile Optimization

The analytics system is optimized for mobile-first booking experiences:

- **Touch Interaction Tracking**: Finger tap analysis
- **Mobile Performance**: Mobile-specific Core Web Vitals
- **App-like Experience**: Progressive Web App analytics
- **Offline Behavior**: Offline to online conversion tracking

## 🛠 Integration Guide

### React Components

```tsx
// Use analytics in any component
import { useAnalytics } from '@/integrations/analytics';

function ServiceCard({ service }) {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('service_card_click', {
      service_id: service.id,
      service_category: service.category,
      card_position: service.position,
    });
  };

  return <div onClick={handleClick}>{service.name}</div>;
}
```

### Custom Event Tracking

```tsx
// Track custom business events
import { analyticsSystem } from '@/integrations/analytics';

async function trackCustomBusinessEvent(eventData) {
  await analyticsSystem.trackEvent('custom_business_event', {
    event_category: 'business_metric',
    event_label: 'specific_action',
    value: eventData.value,
    custom_parameter: eventData.customData,
  });
}
```

### A/B Testing Integration

```tsx
import { useABTesting } from '@/integrations/analytics/ab-testing';

function PricingDisplay({ price }) {
  const { runTest, getVariant } = useABTesting();

  useEffect(() => {
    // Run A/B test for pricing display
    runTest('pricing_display_test');
  }, []);

  const variant = getVariant('pricing_display_test');

  if (variant === 'highlighted_savings') {
    return (
      <div className="price-highlighted">
        <span className="original-price">{price * 1.15} PLN</span>
        <span className="sale-price">{price} PLN</span>
        <span className="savings-badge">Save 15%</span>
      </div>
    );
  }

  return <div className="price-regular">{price} PLN</div>;
}
```

## 📊 Advanced Analytics Dashboard

The advanced analytics dashboard provides:

- **Real-time Metrics**: Live booking and performance data
- **Funnel Visualization**: Interactive conversion funnel
- **Revenue Analytics**: Financial performance insights
- **User Behavior Analysis**: Comprehensive user journey data
- **Performance Monitoring**: Core Web Vitals and alerts
- **A/B Testing Results**: Statistical test analysis
- **Heat Maps**: Visual interaction data
- **GDPR Compliance**: Consent and privacy monitoring

## 🔧 Configuration Options

### Analytics Configuration
```typescript
const analyticsConfig = {
  enabled: true,
  sampleRate: 10, // 10% of sessions for detailed tracking
  tracking: {
    clicks: true,
    scrolls: true,
    movements: false, // Disable for performance
    inputs: false, // Disable for privacy
  },
  privacy: {
    anonymizeIP: true,
    maskSensitiveData: true,
    respectDoNotTrack: true,
  },
  performance: {
    trackCoreWebVitals: true,
    performanceThresholds: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
    },
  },
};
```

### GDPR Configuration
```typescript
const gdprConfig = {
  enabled: true,
  cookieConsent: {
    required: true,
    expiryDays: 365,
    categories: ['essential', 'analytics', 'marketing', 'personalization'],
  },
  dataRetention: {
    analyticsData: 730, // 2 years
    sessionData: 30, // 30 days
    personalData: 2555, // 7 years
  },
  userRights: {
    dataPortability: true,
    rightToBeForgotten: true,
    consentWithdrawal: true,
  },
};
```

## 📚 Best Practices

### Implementation Guidelines
1. **Privacy First**: Always get consent before tracking
2. **Performance Impact**: Monitor analytics impact on site performance
3. **Data Quality**: Ensure clean, accurate data collection
4. **Compliance**: Follow GDPR and other privacy regulations
5. **Business Value**: Focus on metrics that drive business decisions

### Optimization Tips
1. **Sampling**: Use appropriate sampling rates for detailed tracking
2. **Batch Processing**: Configure efficient batch processing
3. **Caching**: Implement intelligent caching for analytics data
4. **Real-time Balance**: Balance real-time needs with performance
5. **Mobile Optimization**: Prioritize mobile analytics performance

This advanced analytics system provides comprehensive insights into user behavior, booking patterns, and performance metrics specifically tailored for the beauty and fitness booking platform, enabling data-driven decisions to optimize conversions and enhance the user experience.