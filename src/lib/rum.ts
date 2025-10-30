/**
 * Comprehensive Real User Monitoring (RUM) System
 * for luxury beauty and fitness booking platform
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import { reportMessage } from './sentry';

// RUM Configuration for luxury experience
const RUM_CONFIG = {
  // Sampling rates (higher for luxury market monitoring)
  sampleRate: import.meta.env.PROD ? 0.2 : 1.0, // 20% in production for comprehensive data

  // Performance budgets for luxury experience
  budgets: {
    LCP: 2000,      // 2 seconds for luxury feel
    FID: 100,       // 100ms for responsive interactions
    CLS: 0.1,       // Minimal layout shifts
    TTFB: 800,      // Fast server responses
    INP: 200,       // Interaction to next paint
  },

  // Geographic focus (Warsaw luxury market)
  regions: ['europe-central', 'europe-west'],

  // Critical user journeys to monitor
  criticalJourneys: [
    'landing-to-booking',
    'service-selection',
    'time-slot-selection',
    'payment-completion',
    'booking-confirmation'
  ]
};

// Performance measurement storage
class PerformanceStorage {
  private storage: Map<string, any[]> = new Map();

  set(key: string, data: any): void {
    if (!this.storage.has(key)) {
      this.storage.set(key, []);
    }
    this.storage.get(key)!.push(data);

    // Keep only last 100 entries per key to prevent memory issues
    const entries = this.storage.get(key)!;
    if (entries.length > 100) {
      this.storage.set(key, entries.slice(-100));
    }
  }

  get(key: string): any[] {
    return this.storage.get(key) || [];
  }

  getAll(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    this.storage.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  clear(): void {
    this.storage.clear();
  }
}

// Global performance storage
const performanceStorage = new PerformanceStorage();

// RUM Metrics Collector
export class RUMCollector {
  private initialized = false;
  private metrics: Metric[] = [];
  private journeySteps: string[] = [];
  private sessionStartTime = performance.now();
  private lastInteractionTime = performance.now();
  private deviceInfo: any = {};
  private networkInfo: any = {};

  constructor() {
    this.collectDeviceInfo();
    this.collectNetworkInfo();
  }

  // Initialize RUM collection
  initialize(): void {
    if (this.initialized || !this.shouldSample()) return;

    try {
      this.initCoreWebVitals();
      this.initGeographicMonitoring();
      this.initBookingFlowTracking();
      this.initAPIPerformanceTracking();
      this.initUserInteractionTracking();

      this.initialized = true;
      console.log('[RUM] Real User Monitoring initialized');

      // Track session start
      this.trackSessionStart();
    } catch (error) {
      console.warn('[RUM] Failed to initialize:', error);
    }
  }

  // Check if user should be sampled
  private shouldSample(): boolean {
    return Math.random() < RUM_CONFIG.sampleRate;
  }

  // Collect device information for mobile experience tracking
  private collectDeviceInfo(): void {
    this.deviceInfo = {
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  // Collect network information for performance analysis
  private collectNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        type: connection.type
      };
    }
  }

  // Initialize Core Web Vitals monitoring
  private initCoreWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      this.processMetric(metric);
    };

    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);

    // Initialize INP if available (experimental)
    if ('getINP' in window) {
      (window as any).getINP?.(handleMetric);
    }
  }

  // Process and analyze metrics
  private processMetric(metric: Metric): void {
    // Add enrichment data
    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
      pageType: this.getPageType(),
      journeySteps: [...this.journeySteps],
      timeOnPage: performance.now() - this.sessionStartTime
    };

    // Store metric
    performanceStorage.set('core-web-vitals', enrichedMetric);
    this.metrics.push(enrichedMetric);

    // Check against luxury performance budgets
    this.checkPerformanceBudgets(metric);

    // Report to monitoring
    this.reportMetric(enrichedMetric);
  }

  // Check performance against luxury budgets
  private checkPerformanceBudgets(metric: Metric): void {
    const budget = RUM_CONFIG.budgets[metric.name as keyof typeof RUM_CONFIG.budgets];
    if (!budget) return;

    if (metric.value > budget) {
      const severity = metric.value > budget * 1.5 ? 'critical' : 'warning';

      reportMessage(`Performance budget exceeded: ${metric.name}`, severity as any, {
        metric: metric.name,
        value: metric.value,
        budget: budget,
        pageType: this.getPageType(),
        deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop',
        networkType: this.networkInfo.effectiveType || 'unknown'
      });
    }
  }

  // Initialize geographic monitoring
  private initGeographicMonitoring(): void {
    // Monitor performance by geographic region
    this.trackGeographicPerformance();

    // Monitor CDN performance for Warsaw market
    this.trackCDNPerformance();
  }

  // Track geographic performance
  private trackGeographicPerformance(): void {
    // Get user location (with consent)
    if ('geolocation' in navigator && localStorage.getItem('analytics-consent') === 'true') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          performanceStorage.set('geographic', {
            ...locationData,
            performanceMetrics: this.metrics,
            networkInfo: this.networkInfo
          });
        },
        () => {
          // Silently fail if location denied
        }
      );
    }
  }

  // Track CDN performance
  private trackCDNPerformance(): void {
    // Monitor resource loading performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;

            // Track image loading for service galleries
            if (resource.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
              this.trackImagePerformance(resource);
            }

            // Track API performance
            if (resource.name.includes('/api/') || resource.name.includes('supabase')) {
              this.trackAPIPerformance(resource);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Track image loading performance
  private trackImagePerformance(resource: PerformanceResourceTiming): void {
    const imageMetric = {
      name: 'image-load',
      value: resource.duration,
      timestamp: Date.now(),
      imageName: resource.name.split('/').pop(),
      size: resource.transferSize,
      cached: resource.transferSize === 0,
      pageType: this.getPageType(),
      deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
    };

    performanceStorage.set('image-performance', imageMetric);

    // Report slow images
    if (resource.duration > 3000) { // 3 seconds
      reportMessage('Slow image loading detected', 'warning', imageMetric);
    }
  }

  // Track API performance
  private trackAPIPerformance(resource: PerformanceResourceTiming): void {
    const apiMetric = {
      name: 'api-response',
      value: resource.duration,
      timestamp: Date.now(),
      endpoint: resource.name,
      method: 'GET', // Default, would need more sophisticated detection
      status: 0, // Not available in resource timing
      pageType: this.getPageType(),
      isBookingFlow: this.isInBookingFlow()
    };

    performanceStorage.set('api-performance', apiMetric);

    // Report slow API calls
    if (resource.duration > 2000) { // 2 seconds
      reportMessage('Slow API response detected', 'warning', apiMetric);
    }
  }

  // Initialize booking flow tracking
  private initBookingFlowTracking(): void {
    // Track booking funnel progression
    this.trackBookingFunnel();

    // Track booking abandonment
    this.trackBookingAbandonment();

    // Track payment performance
    this.trackPaymentPerformance();
  }

  // Track booking funnel
  private trackBookingFunnel(): void {
    // Define booking steps
    const bookingSteps = [
      '/booking/step1',
      '/booking/step2',
      '/booking/step3',
      '/booking/step4',
      '/booking/confirmation'
    ];

    // Track navigation between booking steps
    let currentStep = '';

    const checkStep = () => {
      const currentPath = window.location.pathname;
      const step = bookingSteps.find(s => currentPath.includes(s));

      if (step && step !== currentStep) {
        currentStep = step;
        this.journeySteps.push(step);

        // Track step transition
        const transitionMetric = {
          step: step,
          timestamp: Date.now(),
          timeFromStart: performance.now() - this.sessionStartTime,
          userAgent: this.deviceInfo.userAgent,
          mobile: this.deviceInfo.isMobile
        };

        performanceStorage.set('booking-funnel', transitionMetric);
      }
    };

    // Check step on load and route change
    checkStep();
    setInterval(checkStep, 1000);
  }

  // Track booking abandonment
  private trackBookingAbandonment(): void {
    // Monitor for abandonment patterns
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);

      if (this.isInBookingFlow()) {
        inactivityTimer = setTimeout(() => {
          // Track abandonment after 5 minutes of inactivity
          performanceStorage.set('booking-abandonment', {
            lastStep: this.journeySteps[this.journeySteps.length - 1] || 'unknown',
            timeOnPage: performance.now() - this.sessionStartTime,
            deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop',
            networkType: this.networkInfo.effectiveType || 'unknown'
          });
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();
  }

  // Track payment performance
  private trackPaymentPerformance(): void {
    // Monitor Stripe and payment processing performance
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const start = performance.now();
      const url = args[0] as string;

      // Track payment API calls
      if (url.includes('stripe') || url.includes('payment')) {
        try {
          const response = await originalFetch(...args);
          const duration = performance.now() - start;

          performanceStorage.set('payment-performance', {
            url: url,
            duration: duration,
            status: response.status,
            timestamp: Date.now(),
            success: response.ok
          });

          return response;
        } catch (error) {
          const duration = performance.now() - start;

          performanceStorage.set('payment-errors', {
            url: url,
            duration: duration,
            error: error,
            timestamp: Date.now()
          });

          throw error;
        }
      }

      return originalFetch(...args);
    };
  }

  // Initialize API performance tracking
  private initAPIPerformanceTracking(): void {
    // Track Supabase performance specifically
    this.trackSupabasePerformance();

    // Track external service performance
    this.trackExternalServicePerformance();
  }

  // Track Supabase performance
  private trackSupabasePerformance(): void {
    // Monitor database query performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name.includes('supabase')) {
            const supabaseMetric = {
              operation: this.extractSupabaseOperation(entry.name),
              duration: entry.duration,
              size: entry.transferSize,
              timestamp: Date.now(),
              success: true
            };

            performanceStorage.set('supabase-performance', supabaseMetric);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Extract Supabase operation from URL
  private extractSupabaseOperation(url: string): string {
    if (url.includes('/rest/v1/')) return 'query';
    if (url.includes('/auth/v1/')) return 'auth';
    if (url.includes('/storage/v1/')) return 'storage';
    if (url.includes('/functions/v1/')) return 'function';
    return 'unknown';
  }

  // Track external service performance
  private trackExternalServicePerformance(): void {
    const services = ['stripe.com', 'googletagmanager.com', 'fonts.googleapis.com'];

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (services.some(service => entry.name.includes(service))) {
            const serviceMetric = {
              service: services.find(s => entry.name.includes(s)),
              duration: entry.duration,
              size: entry.transferSize,
              timestamp: Date.now()
            };

            performanceStorage.set('external-service-performance', serviceMetric);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Initialize user interaction tracking
  private initUserInteractionTracking(): void {
    // Track perceived performance
    this.trackPerceivedPerformance();

    // Track interaction delays
    this.trackInteractionDelays();

    // Track mobile touch performance
    this.trackTouchPerformance();
  }

  // Track perceived performance
  private trackPerceivedPerformance(): void {
    // Monitor when key elements become visible
    const elements = ['[data-hero]', '[data-booking-card]', '[data-loading]'];

    elements.forEach(selector => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const loadTime = performance.now() - this.sessionStartTime;

            performanceStorage.set('perceived-performance', {
              element: selector,
              visibleTime: loadTime,
              timestamp: Date.now()
            });
          }
        });
      });

      document.querySelectorAll(selector).forEach(el => observer.observe(el));
    });
  }

  // Track interaction delays
  private trackInteractionDelays(): void {
    // Track click-to-response times
    let clickStart = 0;

    document.addEventListener('mousedown', () => {
      clickStart = performance.now();
    });

    document.addEventListener('click', () => {
      if (clickStart > 0) {
        const responseTime = performance.now() - clickStart;

        if (responseTime > 100) { // Only track slow interactions
          performanceStorage.set('interaction-delays', {
            type: 'click',
            delay: responseTime,
            timestamp: Date.now(),
            pageType: this.getPageType()
          });
        }

        clickStart = 0;
      }
    });
  }

  // Track touch performance on mobile
  private trackTouchPerformance(): void {
    if (!this.deviceInfo.isMobile) return;

    let touchStart = 0;

    document.addEventListener('touchstart', () => {
      touchStart = performance.now();
    });

    document.addEventListener('touchend', () => {
      if (touchStart > 0) {
        const responseTime = performance.now() - touchStart;

        performanceStorage.set('touch-performance', {
          responseTime: responseTime,
          timestamp: Date.now(),
          pageType: this.getPageType()
        });

        touchStart = 0;
      }
    });
  }

  // Track session start
  private trackSessionStart(): void {
    performanceStorage.set('session-start', {
      timestamp: Date.now(),
      userAgent: this.deviceInfo.userAgent,
      referrer: document.referrer,
      landingPage: window.location.pathname,
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo
    });
  }

  // Report metrics to monitoring service
  private reportMetric(metric: any): void {
    if (import.meta.env.PROD) {
      // Send to analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'web_vital', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.value),
          custom_map: {
            custom_parameter_1: metric.pageType,
            custom_parameter_2: metric.deviceInfo?.isMobile ? 'mobile' : 'desktop'
          }
        });
      }

      // Report to Sentry for performance issues
      if (metric.value > RUM_CONFIG.budgets[metric.name as keyof typeof RUM_CONFIG.budgets]) {
        reportMessage(`Performance issue: ${metric.name}`, 'warning', metric);
      }
    }
  }

  // Helper methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('rum-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('rum-session-id', sessionId);
    }
    return sessionId;
  }

  private getPageType(): string {
    const path = window.location.pathname;
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/blog')) return 'blog';
    if (path === '/') return 'landing';
    return 'other';
  }

  private isInBookingFlow(): boolean {
    return window.location.pathname.includes('/booking');
  }

  // Public API methods

  // Get all collected metrics
  getMetrics(): Record<string, any[]> {
    return performanceStorage.getAll();
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const allMetrics = performanceStorage.getAll();
    const summary: any = {};

    // Process Core Web Vitals
    const vitals = allMetrics['core-web-vitals'] || [];
    if (vitals.length > 0) {
      const latestVitals = vitals.slice(-5); // Last 5 metrics

      ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(vitalName => {
        const vitalMetrics = latestVitals.filter(m => m.name === vitalName);
        if (vitalMetrics.length > 0) {
          const latest = vitalMetrics[vitalMetrics.length - 1];
          summary[vitalName] = {
            value: latest.value,
            rating: latest.rating,
            budget: RUM_CONFIG.budgets[vitalName as keyof typeof RUM_CONFIG.budgets],
            withinBudget: latest.value <= RUM_CONFIG.budgets[vitalName as keyof typeof RUM_CONFIG.budgets]
          };
        }
      });
    }

    // Add device and network info
    summary.deviceInfo = this.deviceInfo;
    summary.networkInfo = this.networkInfo;
    summary.sessionDuration = performance.now() - this.sessionStartTime;

    return summary;
  }

  // Track custom event
  trackEvent(eventName: string, data?: any): void {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      data: data || {},
      pageType: this.getPageType(),
      journeySteps: [...this.journeySteps],
      deviceInfo: this.deviceInfo
    };

    performanceStorage.set('custom-events', event);
  }

  // Track user interaction
  trackInteraction(element: string, action: string, value?: any): void {
    const interaction = {
      element: element,
      action: action,
      value: value,
      timestamp: Date.now(),
      pageType: this.getPageType(),
      timeOnPage: performance.now() - this.sessionStartTime
    };

    performanceStorage.set('user-interactions', interaction);
  }

  // Clear all stored data
  clearData(): void {
    performanceStorage.clear();
    this.metrics = [];
    this.journeySteps = [];
    this.sessionStartTime = performance.now();
  }
}

// Create and export singleton instance
export const rumCollector = new RUMCollector();

// Initialize automatically in production
if (import.meta.env.PROD) {
  rumCollector.initialize();
}

// Export helper functions
export const initializeRUM = () => rumCollector.initialize();
export const getRUMMetrics = () => rumCollector.getMetrics();
export const getRUMSummary = () => rumCollector.getPerformanceSummary();
export const trackRUMEvent = (name: string, data?: any) => rumCollector.trackEvent(name, data);
export const trackRUMInteraction = (element: string, action: string, value?: any) =>
  rumCollector.trackInteraction(element, action, value);

// Export types
export interface RUMMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  pageType: string;
  deviceInfo: any;
  networkInfo: any;
}