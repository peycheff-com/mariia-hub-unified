/**
 * Real User Monitoring (RUM) for Performance Tracking
 * Implements Core Web Vitals, user experience metrics, and geographic performance analysis
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  // Sampling rates (percentage of users to track)
  sampling: {
    coreWebVitals: 100,    // Track all users for Core Web Vitals
    userExperience: 25,     // 25% of users for detailed UX metrics
    resourceTiming: 10,     // 10% of users for resource timing
    errors: 100,           // Track all errors
  },

  // Performance budgets and thresholds
  thresholds: {
    LCP: 2500,  // Largest Contentful Paint (2.5s)
    FID: 100,   // First Input Delay (100ms)
    INP: 200,   // Interaction to Next Paint (200ms)
    CLS: 0.1,   // Cumulative Layout Shift (0.1)
    FCP: 1800,  // First Contentful Paint (1.8s)
    TTFB: 600,  // Time to First Byte (600ms)
  },

  // Geographic performance thresholds (adjust for different regions)
  geographicThresholds: {
    // Premium markets (Europe, North America)
    'EU': { LCP: 2000, FID: 80, INP: 160, CLS: 0.08, FCP: 1500, TTFB: 400 },
    'US': { LCP: 2000, FID: 80, INP: 160, CLS: 0.08, FCP: 1500, TTFB: 400 },
    'CA': { LCP: 2000, FID: 80, INP: 160, CLS: 0.08, FCP: 1500, TTFB: 400 },

    // Emerging markets (higher tolerance)
    'APAC': { LCP: 3000, FID: 120, INP: 240, CLS: 0.15, FCP: 2200, TTFB: 800 },
    'LATAM': { LCP: 3000, FID: 120, INP: 240, CLS: 0.15, FCP: 2200, TTFB: 800 },
    'AF': { LCP: 3500, FID: 150, INP: 300, CLS: 0.2, FCP: 2500, TTFB: 1000 },
  },

  // Device type thresholds
  deviceThresholds: {
    'desktop': { LCP: 2000, FID: 50, INP: 100, CLS: 0.05, FCP: 1400, TTFB: 300 },
    'mobile': { LCP: 3000, FID: 120, INP: 200, CLS: 0.1, FCP: 2000, TTFB: 600 },
    'tablet': { LCP: 2500, FID: 80, INP: 150, CLS: 0.08, FCP: 1700, TTFB: 500 },
  },

  // Network condition thresholds
  networkThresholds: {
    '4g': { LCP: 2000, FID: 50, INP: 100, CLS: 0.05, FCP: 1400, TTFB: 300 },
    '3g': { LCP: 4000, FID: 200, INP: 300, CLS: 0.15, FCP: 3000, TTFB: 1000 },
    '2g': { LCP: 8000, FID: 500, INP: 600, CLS: 0.25, FCP: 6000, TTFB: 2000 },
    'slow-2g': { LCP: 12000, FID: 1000, INP: 1000, CLS: 0.3, FCP: 9000, TTFB: 3000 },
  }
};

class RealUserMonitoring {
  constructor() {
    this.metrics = {};
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.geoData = null;
    this.deviceInfo = this.getDeviceInfo();
    this.networkInfo = this.getNetworkInfo();
    this.sampleRates = PERFORMANCE_CONFIG.sampling;

    this.init();
  }

  init() {
    // Only initialize if we should sample this session
    if (!this.shouldSample()) return;

    // Initialize Core Web Vitals monitoring
    this.initializeCoreWebVitals();

    // Initialize user experience metrics
    this.initializeUserExperienceMetrics();

    // Initialize resource timing monitoring
    this.initializeResourceTiming();

    // Initialize error monitoring
    this.initializeErrorMonitoring();

    // Initialize performance observer
    this.initializePerformanceObserver();

    // Get geographic data
    this.fetchGeoData();

    // Set up reporting interval
    this.setupPeriodicReporting();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserId() {
    // Get user ID from localStorage or generate anonymous ID
    let userId = localStorage.getItem('rum_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 12);
      localStorage.setItem('rum_user_id', userId);
    }
    return userId;
  }

  shouldSample() {
    return Math.random() * 100 < this.sampleRates.coreWebVitals;
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;

    let deviceType = 'desktop';
    if (/Mobi|Android/i.test(userAgent)) {
      deviceType = screenWidth < 768 ? 'mobile' : 'tablet';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    return {
      type: deviceType,
      userAgent,
      screenWidth,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
    };
  }

  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      return { type: 'unknown', effectiveType: 'unknown', downlink: 'unknown', rtt: 'unknown' };
    }

    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 'unknown',
      rtt: connection.rtt || 'unknown',
      saveData: connection.saveData || false,
    };
  }

  async fetchGeoData() {
    try {
      // Use a free geolocation API or implement your own
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      this.geoData = {
        country: data.country_code || 'unknown',
        region: data.region || 'unknown',
        city: data.city || 'unknown',
        timezone: data.timezone || 'unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.org || 'unknown',
      };
    } catch (error) {
      console.warn('Failed to fetch geographic data:', error);
      this.geoData = { country: 'unknown', region: 'unknown', city: 'unknown' };
    }
  }

  initializeCoreWebVitals() {
    // Note: Using new web-vitals v5+ API with 'on' functions
    // FID has been replaced by INP in modern browsers

    // Largest Contentful Paint
    onLCP((metric) => {
      this.recordMetric('LCP', metric);
      this.evaluatePerformance('LCP', metric.value);
    });

    // Interaction to Next Paint (replaces FID in modern browsers)
    onINP((metric) => {
      this.recordMetric('INP', metric);
      this.evaluatePerformance('INP', metric.value);
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.recordMetric('CLS', metric);
      this.evaluatePerformance('CLS', metric.value);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.recordMetric('FCP', metric);
      this.evaluatePerformance('FCP', metric.value);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.recordMetric('TTFB', metric);
      this.evaluatePerformance('TTFB', metric.value);
    });
  }

  initializeUserExperienceMetrics() {
    if (Math.random() * 100 > this.sampleRates.userExperience) return;

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.recordMetric('PageLoadTime', {
            value: navigation.loadEventEnd - navigation.fetchStart,
            name: 'Page Load Time',
            navigationType: navigation.type,
          });
        }
      }, 0);
    });

    // Track DOM content loaded
    window.addEventListener('DOMContentLoaded', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.recordMetric('DOMContentLoaded', {
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          name: 'DOM Content Loaded',
        });
      }
    });

    // Track long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.recordMetric('LongTask', {
              value: entry.duration,
              name: 'Long Task',
              startTime: entry.startTime,
              attribution: entry.attribution || [],
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }

    // Track user interactions
    this.trackUserInteractions();
  }

  initializeResourceTiming() {
    if (Math.random() * 100 > this.sampleRates.resourceTiming) return;

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordResourceTiming(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  initializeErrorMonitoring() {
    if (Math.random() * 100 > this.sampleRates.errors) return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  initializePerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('Paint', {
            name: entry.name,
            value: entry.startTime,
            type: entry.entryType,
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Paint timing not supported');
    }

    // Observe layout shift
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            this.recordMetric('LayoutShift', {
              value: entry.value,
              sources: entry.sources || [],
            });
          }
        });
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('Layout shift not supported');
    }
  }

  trackUserInteractions() {
    // Track click interactions
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track-interaction]');
      if (target) {
        const interactionName = target.dataset.trackInteraction || 'unknown';
        this.recordMetric('Click', {
          name: interactionName,
          value: 0, // Clicks don't have duration
          element: target.tagName,
          timestamp: Date.now(),
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target;
      if (target.tagName === 'FORM') {
        this.recordMetric('FormSubmit', {
          name: target.id || target.className || 'unknown-form',
          value: 0,
          timestamp: Date.now(),
        });
      }
    });
  }

  recordMetric(type, metric) {
    const timestamp = Date.now();
    const record = {
      type,
      timestamp,
      sessionId: this.sessionId,
      userId: this.userId,
      ...metric,
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
      geoData: this.geoData,
    };

    // Store metric locally
    this.metrics[type] = this.metrics[type] || [];
    this.metrics[type].push(record);

    // Send metric immediately for critical metrics
    if (['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB'].includes(type)) {
      this.sendMetric(record);
    }
  }

  recordResourceTiming(entry) {
    const resourceType = this.getResourceType(entry.name);
    const record = {
      type: 'ResourceTiming',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      resourceType,
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || 0,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
    };

    this.metrics.ResourceTiming = this.metrics.ResourceTiming || [];
    this.metrics.ResourceTiming.push(record);
  }

  recordError(type, error) {
    const record = {
      type: 'Error',
      errorType: type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...error,
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
      geoData: this.geoData,
    };

    this.metrics.Error = this.metrics.Error || [];
    this.metrics.Error.push(record);

    // Send errors immediately
    this.sendMetric(record);
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)$/i.test(url)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  evaluatePerformance(metricType, value) {
    // Get appropriate thresholds based on user context
    const thresholds = this.getAppropriateThresholds(metricType);
    const threshold = thresholds[metricType];

    let rating = 'good';
    if (value > threshold * 1.5) {
      rating = 'poor';
    } else if (value > threshold) {
      rating = 'needs-improvement';
    }

    this.recordMetric('PerformanceRating', {
      name: `${metricType}_rating`,
      value: rating,
      actualValue: value,
      threshold,
      metricType,
    });
  }

  getAppropriateThresholds(metricType) {
    // Start with base thresholds
    let thresholds = { ...PERFORMANCE_CONFIG.thresholds };

    // Adjust based on device type
    if (this.deviceInfo.type && PERFORMANCE_CONFIG.deviceThresholds[this.deviceInfo.type]) {
      thresholds = { ...thresholds, ...PERFORMANCE_CONFIG.deviceThresholds[this.deviceInfo.type] };
    }

    // Adjust based on network
    if (this.networkInfo.effectiveType && PERFORMANCE_CONFIG.networkThresholds[this.networkInfo.effectiveType]) {
      thresholds = { ...thresholds, ...PERFORMANCE_CONFIG.networkThresholds[this.networkInfo.effectiveType] };
    }

    // Adjust based on geography
    if (this.geoData?.country) {
      const region = this.getRegionFromCountry(this.geoData.country);
      if (region && PERFORMANCE_CONFIG.geographicThresholds[region]) {
        thresholds = { ...thresholds, ...PERFORMANCE_CONFIG.geographicThresholds[region] };
      }
    }

    return thresholds;
  }

  getRegionFromCountry(countryCode) {
    const regionMap = {
      // Europe
      'DE': 'EU', 'FR': 'EU', 'IT': 'EU', 'ES': 'EU', 'GB': 'EU', 'PL': 'EU', 'NL': 'EU',
      'SE': 'EU', 'NO': 'EU', 'DK': 'EU', 'FI': 'EU', 'AT': 'EU', 'CH': 'EU', 'BE': 'EU',
      'IE': 'EU', 'PT': 'EU', 'GR': 'EU', 'CZ': 'EU', 'HU': 'EU', 'RO': 'EU', 'BG': 'EU',

      // North America
      'US': 'US', 'CA': 'CA', 'MX': 'LATAM',

      // Asia-Pacific
      'CN': 'APAC', 'JP': 'APAC', 'KR': 'APAC', 'AU': 'APAC', 'IN': 'APAC', 'SG': 'APAC',

      // Latin America
      'BR': 'LATAM', 'AR': 'LATAM', 'CL': 'LATAM', 'CO': 'LATAM', 'PE': 'LATAM',

      // Africa
      'ZA': 'AF', 'NG': 'AF', 'EG': 'AF', 'KE': 'AF', 'MA': 'AF',
    };

    return regionMap[countryCode] || null;
  }

  async sendMetric(metric) {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
      // Store locally for retry
      this.storeFailedMetric(metric);
    }
  }

  storeFailedMetric(metric) {
    const failedMetrics = JSON.parse(localStorage.getItem('rum_failed_metrics') || '[]');
    failedMetrics.push(metric);

    // Keep only last 50 failed metrics
    if (failedMetrics.length > 50) {
      failedMetrics.splice(0, failedMetrics.length - 50);
    }

    localStorage.setItem('rum_failed_metrics', JSON.stringify(failedMetrics));
  }

  setupPeriodicReporting() {
    // Send batch metrics every 30 seconds
    setInterval(() => {
      this.flushMetrics();
    }, 30000);

    // Flush metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics(true);
    });
  }

  flushMetrics(isPageUnload = false) {
    // Try to send any failed metrics first
    this.retryFailedMetrics();

    // Send current batch of metrics
    const metricsToSend = this.prepareBatchMetrics();
    if (metricsToSend.length > 0) {
      if (isPageUnload) {
        // Use sendBeacon for page unload to ensure delivery
        navigator.sendBeacon('/api/analytics/performance-batch', JSON.stringify(metricsToSend));
      } else {
        fetch('/api/analytics/performance-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metricsToSend),
        }).catch(error => {
          console.warn('Failed to send batch metrics:', error);
          this.storeFailedMetrics(metricsToSend);
        });
      }
    }
  }

  retryFailedMetrics() {
    const failedMetrics = JSON.parse(localStorage.getItem('rum_failed_metrics') || '[]');
    if (failedMetrics.length > 0) {
      // Attempt to resend failed metrics
      failedMetrics.forEach(metric => {
        this.sendMetric(metric);
      });

      // Clear failed metrics after attempting retry
      localStorage.removeItem('rum_failed_metrics');
    }
  }

  prepareBatchMetrics() {
    const batchMetrics = [];

    Object.entries(this.metrics).forEach(([type, metrics]) => {
      // Don't include metrics that are sent immediately
      if (!['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB', 'Error'].includes(type)) {
        batchMetrics.push(...metrics);
      }
    });

    // Clear sent metrics
    Object.keys(this.metrics).forEach(type => {
      if (!['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB', 'Error'].includes(type)) {
        this.metrics[type] = [];
      }
    });

    return batchMetrics;
  }

  storeFailedMetrics(metrics) {
    const failedMetrics = JSON.parse(localStorage.getItem('rum_failed_metrics') || '[]');
    failedMetrics.push(...metrics);

    // Keep only last 50 failed metrics
    if (failedMetrics.length > 50) {
      failedMetrics.splice(0, failedMetrics.length - 50);
    }

    localStorage.setItem('rum_failed_metrics', JSON.stringify(failedMetrics));
  }
}

// Initialize RUM when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new RealUserMonitoring();
    });
  } else {
    new RealUserMonitoring();
  }
}

export default RealUserMonitoring;