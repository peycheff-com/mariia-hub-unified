/**
 * Advanced Performance Metrics Collection System
 * Enhanced RUM with business-specific metrics for Mariia Hub luxury platform
 */

interface PerformanceMetric {
  id: string;
  type: 'cwv' | 'custom' | 'business' | 'technical' | 'user-experience';
  name: string;
  value: number;
  unit: 'ms' | 'score' | 'percentage' | 'bytes' | 'count';
  timestamp: number;
  context: PerformanceContext;
  threshold?: MetricThreshold;
  tags?: string[];
}

interface PerformanceContext {
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
  geographicRegion: string;
  pageType: 'homepage' | 'service-listing' | 'booking-flow' | 'admin' | 'content';
  viewport: { width: number; height: number };
  screenDensity: number;
  isMobileApp: boolean;
  platform: 'ios' | 'android' | 'web';
}

interface MetricThreshold {
  good: number;
  needsImprovement: number;
  poor: number;
  deviceSpecific?: {
    mobile?: { good: number; needsImprovement: number; poor: number };
    desktop?: { good: number; needsImprovement: number; poor: number };
  };
}

interface BusinessMetric {
  bookingFunnelStep: 'landing' | 'service-selection' | 'time-slot-selection' | 'details' | 'payment' | 'confirmation';
  conversionRate: number;
  dropOffRate: number;
  averageTimeInStep: number;
  abandonmentReasons?: string[];
}

interface UserExperienceMetric {
  interactionLatency: number;
  touchResponsiveness: number;
  scrollPerformance: number;
  visualStability: number;
  perceivedPerformance: number;
  userSatisfactionPrediction: number;
}

class AdvancedPerformanceMetricsCollection {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Map<string, any> = new Map();
  private config: MetricsConfig;
  private sessionContext: PerformanceContext;
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private isInitialized = false;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      samplingRate: 100,
      enableBusinessMetrics: true,
      enableUserExperienceMetrics: true,
      enableTechnicalMetrics: true,
      enableGeographicTracking: true,
      enableDeviceSpecificTracking: true,
      batchSize: 50,
      flushInterval: 30000,
      ...config
    };

    this.sessionContext = this.initializeContext();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Advanced Performance Metrics Collection...');

    try {
      // Initialize Core Web Vitals monitoring
      await this.initializeCoreWebVitals();

      // Initialize business metrics tracking
      if (this.config.enableBusinessMetrics) {
        await this.initializeBusinessMetrics();
      }

      // Initialize user experience metrics
      if (this.config.enableUserExperienceMetrics) {
        await this.initializeUserExperienceMetrics();
      }

      // Initialize technical metrics
      if (this.config.enableTechnicalMetrics) {
        await this.initializeTechnicalMetrics();
      }

      // Initialize custom business flow tracking
      await this.initializeBusinessFlowTracking();

      // Initialize geographic and device-specific tracking
      await this.initializeAdvancedTracking();

      // Start metrics collection and reporting
      this.startMetricsCollection();

      this.isInitialized = true;
      console.log('✅ Advanced Performance Metrics Collection initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Advanced Performance Metrics Collection:', error);
      throw error;
    }
  }

  private async initializeCoreWebVitals(): Promise<void> {
    // Import vitals library dynamically
    const { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } = await import('web-vitals');

    // Largest Contentful Paint (LCP)
    getCLS((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'Cumulative Layout Shift',
        value: metric.value,
        unit: 'score',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 0.1,
          needsImprovement: 0.25,
          poor: 0.25
        },
        tags: ['cwv', 'visual-stability', 'layout-shift']
      });
    });

    // First Input Delay (FID) - deprecated, replaced by INP
    getFID((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'First Input Delay',
        value: metric.value,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 100,
          needsImprovement: 300,
          poor: 300
        },
        tags: ['cwv', 'interactivity', 'input-delay']
      });
    });

    // Interaction to Next Paint (INP) - replacement for FID
    getINP((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'Interaction to Next Paint',
        value: metric.value,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 200,
          needsImprovement: 500,
          poor: 500,
          deviceSpecific: {
            mobile: { good: 200, needsImprovement: 500, poor: 500 },
            desktop: { good: 100, needsImprovement: 300, poor: 300 }
          }
        },
        tags: ['cwv', 'interactivity', 'inp']
      });
    });

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'First Contentful Paint',
        value: metric.value,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 1800,
          needsImprovement: 3000,
          poor: 3000
        },
        tags: ['cwv', 'loading', 'contentful-paint']
      });
    });

    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'Largest Contentful Paint',
        value: metric.value,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 2500,
          needsImprovement: 4000,
          poor: 4000,
          deviceSpecific: {
            mobile: { good: 4000, needsImprovement: 6000, poor: 6000 },
            desktop: { good: 2500, needsImprovement: 4000, poor: 4000 }
          }
        },
        tags: ['cwv', 'loading', 'largest-contentful-paint']
      });
    });

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'cwv',
        name: 'Time to First Byte',
        value: metric.value,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        threshold: {
          good: 600,
          needsImprovement: 1000,
          poor: 1000
        },
        tags: ['cwv', 'network', 'server-response']
      });
    });

    console.log('✅ Core Web Vitals monitoring initialized');
  }

  private async initializeBusinessMetrics(): Promise<void> {
    // Track booking funnel performance
    this.trackBookingFunnelMetrics();

    // Track user engagement metrics
    this.trackUserEngagementMetrics();

    // Track conversion metrics
    this.trackConversionMetrics();

    console.log('✅ Business metrics tracking initialized');
  }

  private trackBookingFunnelMetrics(): void {
    // Landing page metrics
    this.trackPageEngagement('landing', {
      timeToEngagement: true,
      scrollDepth: true,
      interactionEvents: ['click-service-category', 'view-service-details']
    });

    // Service selection metrics
    this.trackBookingStep('service-selection', {
      timeToSelection: true,
      selectionChanges: true,
      filterUsage: true
    });

    // Time slot selection metrics
    this.trackBookingStep('time-slot-selection', {
      timeToSelection: true,
      calendarInteractions: true,
      alternativeOptions: true
    });

    // Details form metrics
    this.trackBookingStep('details', {
      formCompletionTime: true,
      validationErrors: true,
      fieldCompletionOrder: true
    });

    // Payment metrics
    this.trackBookingStep('payment', {
      paymentMethodSelection: true,
      paymentFormCompletion: true,
      paymentProcessingTime: true
    });
  }

  private trackBookingStep(stepName: string, options: any): void {
    const stepStartTime = performance.now();
    let stepInteractions = 0;
    let stepErrors = 0;

    // Track step start
    performance.mark(`booking-${stepName}-start`);

    // Track interactions
    const interactionHandler = () => {
      stepInteractions++;
      performance.mark(`booking-${stepName}-interaction-${stepInteractions}`);
    };

    // Track errors
    const errorHandler = () => {
      stepErrors++;
      performance.mark(`booking-${stepName}-error-${stepErrors}`);
    };

    // Add listeners
    document.addEventListener('click', interactionHandler);
    window.addEventListener('error', errorHandler);

    // Track step completion
    const stepCompleteHandler = () => {
      const stepEndTime = performance.now();
      const stepDuration = stepEndTime - stepStartTime;

      performance.mark(`booking-${stepName}-complete`);
      performance.measure(
        `booking-${stepName}-duration`,
        `booking-${stepName}-start`,
        `booking-${stepName}-complete`
      );

      // Record business metric
      this.recordBusinessMetric(stepName, {
        stepDuration,
        interactions: stepInteractions,
        errors: stepErrors,
        conversionRate: stepErrors === 0 ? 1 : 0.8
      });

      // Cleanup listeners
      document.removeEventListener('click', interactionHandler);
      window.removeEventListener('error', errorHandler);
    };

    // Listen for step completion
    window.addEventListener(`booking-${stepName}-complete`, stepCompleteHandler);
  }

  private trackUserEngagementMetrics(): void {
    // Track session duration
    this.trackSessionDuration();

    // Track page interactions
    this.trackPageInteractions();

    // Track scroll performance
    this.trackScrollPerformance();

    // Track touch responsiveness (mobile)
    this.trackTouchResponsiveness();
  }

  private trackSessionDuration(): void {
    const sessionStart = Date.now();

    // Send session duration when user leaves
    const sendSessionDuration = () => {
      const sessionDuration = Date.now() - sessionStart;

      this.recordMetric({
        id: this.generateMetricId(),
        type: 'business',
        name: 'Session Duration',
        value: sessionDuration,
        unit: 'ms',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['engagement', 'session', 'duration']
      });
    };

    // Track on page unload
    window.addEventListener('beforeunload', sendSessionDuration);

    // Track on visibility change (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendSessionDuration();
      }
    });
  }

  private trackPageInteractions(): void {
    let interactionCount = 0;
    let lastInteractionTime = Date.now();
    let totalEngagementTime = 0;

    const interactionHandler = (event: Event) => {
      const currentTime = Date.now();
      const timeSinceLastInteraction = currentTime - lastInteractionTime;

      // Only count interactions that are at least 100ms apart
      if (timeSinceLastInteraction > 100) {
        interactionCount++;
        totalEngagementTime += Math.min(timeSinceLastInteraction, 30000); // Cap at 30 seconds per gap

        lastInteractionTime = currentTime;

        // Record interaction latency
        const startTime = performance.now();
        requestAnimationFrame(() => {
          const latency = performance.now() - startTime;

          this.recordMetric({
            id: this.generateMetricId(),
            type: 'user-experience',
            name: 'Interaction Latency',
            value: latency,
            unit: 'ms',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['interaction', 'latency', 'responsiveness']
          });
        });
      }
    };

    document.addEventListener('click', interactionHandler);
    document.addEventListener('touchstart', interactionHandler);
    document.addEventListener('keydown', interactionHandler);

    // Report engagement metrics every 30 seconds
    setInterval(() => {
      if (interactionCount > 0) {
        this.recordMetric({
          id: this.generateMetricId(),
          type: 'business',
          name: 'Page Engagement',
          value: totalEngagementTime,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['engagement', 'interaction', 'time']
        });
      }
    }, 30000);
  }

  private trackScrollPerformance(): void {
    let scrollEventCount = 0;
    let totalScrollDelay = 0;
    let lastScrollTime = 0;

    const scrollHandler = () => {
      const currentTime = performance.now();

      if (lastScrollTime > 0) {
        const scrollDelay = currentTime - lastScrollTime;
        totalScrollDelay += scrollDelay;
        scrollEventCount++;

        // Record scroll performance if delay is significant
        if (scrollDelay > 16) { // More than one frame at 60fps
          this.recordMetric({
            id: this.generateMetricId(),
            type: 'user-experience',
            name: 'Scroll Jank',
            value: scrollDelay,
            unit: 'ms',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['scroll', 'performance', 'jank']
          });
        }
      }

      lastScrollTime = currentTime;
    };

    // Use passive listeners for better performance
    document.addEventListener('scroll', scrollHandler, { passive: true });

    // Report average scroll performance
    setInterval(() => {
      if (scrollEventCount > 0) {
        const averageScrollDelay = totalScrollDelay / scrollEventCount;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'user-experience',
          name: 'Average Scroll Delay',
          value: averageScrollDelay,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['scroll', 'performance', 'average']
        });

        // Reset counters
        scrollEventCount = 0;
        totalScrollDelay = 0;
      }
    }, 10000);
  }

  private trackTouchResponsiveness(): void {
    if (!('ontouchstart' in window)) return; // Only on touch devices

    let touchStartTime = 0;
    let touchResponseTime = 0;

    const touchStartHandler = (event: TouchEvent) => {
      touchStartTime = performance.now();
    };

    const touchEndHandler = (event: TouchEvent) => {
      if (touchStartTime > 0) {
        touchResponseTime = performance.now() - touchStartTime;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'user-experience',
          name: 'Touch Response Time',
          value: touchResponseTime,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          threshold: {
            good: 50,
            needsImprovement: 100,
            poor: 200
          },
          tags: ['touch', 'responsiveness', 'mobile']
        });

        touchStartTime = 0;
      }
    };

    document.addEventListener('touchstart', touchStartHandler, { passive: true });
    document.addEventListener('touchend', touchEndHandler, { passive: true });
  }

  private async initializeUserExperienceMetrics(): Promise<void> {
    // Track perceived performance
    this.trackPerceivedPerformance();

    // Track visual stability beyond CLS
    this.trackVisualStability();

    // Track resource loading performance
    this.trackResourceLoading();

    console.log('✅ User experience metrics initialized');
  }

  private trackPerceivedPerformance(): void {
    // Track when main content becomes visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const loadTime = performance.now();

          this.recordMetric({
            id: this.generateMetricId(),
            type: 'user-experience',
            name: 'Perceived Load Time',
            value: loadTime,
            unit: 'ms',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['perceived', 'performance', 'loading']
          });

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Observe main content areas
    const mainContent = document.querySelector('main') || document.querySelector('#content') || document.body;
    observer.observe(mainContent);
  }

  private trackVisualStability(): void {
    let layoutShiftCount = 0;
    let totalLayoutShiftScore = 0;

    // Use PerformanceObserver for layout shift detection
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            layoutShiftCount++;
            totalLayoutShiftScore += (entry as any).value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }

    // Report visual stability metrics
    setInterval(() => {
      if (layoutShiftCount > 0) {
        this.recordMetric({
          id: this.generateMetricId(),
          type: 'user-experience',
          name: 'Layout Shift Events',
          value: layoutShiftCount,
          unit: 'count',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['visual', 'stability', 'layout-shift']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'user-experience',
          name: 'Total Layout Shift Score',
          value: totalLayoutShiftScore,
          unit: 'score',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['visual', 'stability', 'layout-shift']
        });

        // Reset counters
        layoutShiftCount = 0;
        totalLayoutShiftScore = 0;
      }
    }, 10000);
  }

  private trackResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;

            // Categorize resources
            let resourceType = 'other';
            if (resource.name.includes('.js')) resourceType = 'script';
            else if (resource.name.includes('.css')) resourceType = 'stylesheet';
            else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) resourceType = 'image';
            else if (resource.name.includes('/api/')) resourceType = 'api';

            this.recordMetric({
              id: this.generateMetricId(),
              type: 'technical',
              name: `Resource Load Time - ${resourceType}`,
              value: resource.responseEnd - resource.requestStart,
              unit: 'ms',
              timestamp: Date.now(),
              context: this.sessionContext,
              tags: ['resource', 'loading', resourceType],
              threshold: {
                good: resourceType === 'image' ? 1000 : 500,
                needsImprovement: resourceType === 'image' ? 3000 : 1500,
                poor: resourceType === 'image' ? 5000 : 3000
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private async initializeTechnicalMetrics(): Promise<void> {
    // Track memory usage
    this.trackMemoryUsage();

    // Track CPU usage
    this.trackCPUUsage();

    // Track network performance
    this.trackNetworkPerformance();

    // Track bundle size and loading
    this.trackBundleMetrics();

    console.log('✅ Technical metrics initialized');
  }

  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Memory Usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['memory', 'heap', 'usage']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Memory Usage Limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['memory', 'limit']
        });

        // Memory usage percentage
        const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Memory Usage Percentage',
          value: memoryUsagePercentage,
          unit: 'percentage',
          timestamp: Date.now(),
          context: this.sessionContext,
          threshold: {
            good: 50,
            needsImprovement: 75,
            poor: 90
          },
          tags: ['memory', 'percentage']
        });
      };

      // Check memory every 30 seconds
      setInterval(checkMemory, 30000);
      checkMemory(); // Initial check
    }
  }

  private trackCPUUsage(): Promise<void> {
    return new Promise((resolve) => {
      // Measure frame rate as CPU indicator
      let frameCount = 0;
      let lastTime = performance.now();

      const measureFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

          this.recordMetric({
            id: this.generateMetricId(),
            type: 'technical',
            name: 'Frame Rate',
            value: fps,
            unit: 'count',
            timestamp: Date.now(),
            context: this.sessionContext,
            threshold: {
              good: 55,
              needsImprovement: 30,
              poor: 15
            },
            tags: ['cpu', 'fps', 'performance']
          });

          frameCount = 0;
          lastTime = currentTime;
        }

        requestAnimationFrame(measureFrameRate);
      };

      requestAnimationFrame(measureFrameRate);
      resolve();
    });
  }

  private trackNetworkPerformance(): void {
    // Track navigator.connection if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const recordConnectionInfo = () => {
        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Network Effective Type',
          value: connection.effectiveType,
          unit: 'score',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['network', 'connection-type']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Network Downlink',
          value: connection.downlink,
          unit: 'score',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['network', 'downlink']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'technical',
          name: 'Network RTT',
          value: connection.rtt,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['network', 'rtt']
        });
      };

      recordConnectionInfo();
      connection.addEventListener('change', recordConnectionInfo);
    }

    // Track API response times
    this.trackAPIPerformance();
  }

  private trackAPIPerformance(): void {
    // Intercept fetch calls to measure API performance
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Only track API calls
        if (url.includes('/api/')) {
          const endpoint = url.split('/api/')[1]?.split('?')[0] || 'unknown';

          this.recordMetric({
            id: this.generateMetricId(),
            type: 'technical',
            name: `API Response Time - ${endpoint}`,
            value: duration,
            unit: 'ms',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['api', 'response-time', endpoint],
            threshold: {
              good: 200,
              needsImprovement: 500,
              poor: 1000
            }
          });

          // Track success rate
          this.recordMetric({
            id: this.generateMetricId(),
            type: 'technical',
            name: `API Success Rate - ${endpoint}`,
            value: response.ok ? 1 : 0,
            unit: 'score',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['api', 'success-rate', endpoint]
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (url.includes('/api/')) {
          const endpoint = url.split('/api/')[1]?.split('?')[0] || 'unknown';

          this.recordMetric({
            id: this.generateMetricId(),
            type: 'technical',
            name: `API Error Rate - ${endpoint}`,
            value: 1,
            unit: 'score',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['api', 'error-rate', endpoint]
          });
        }

        throw error;
      }
    };
  }

  private trackBundleMetrics(): void {
    // Track bundle loading performance
    window.addEventListener('load', () => {
      // Get resource timing for JavaScript bundles
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      resources.forEach(resource => {
        if (resource.name.includes('.js') && !resource.name.includes('node_modules')) {
          this.recordMetric({
            id: this.generateMetricId(),
            type: 'technical',
            name: 'Bundle Load Time',
            value: resource.responseEnd - resource.requestStart,
            unit: 'ms',
            timestamp: Date.now(),
            context: this.sessionContext,
            tags: ['bundle', 'loading', 'javascript']
          });

          // Track bundle size if available
          if (resource.transferSize) {
            this.recordMetric({
              id: this.generateMetricId(),
              type: 'technical',
              name: 'Bundle Size',
              value: resource.transferSize,
              unit: 'bytes',
              timestamp: Date.now(),
              context: this.sessionContext,
              tags: ['bundle', 'size', 'javascript'],
              threshold: {
                good: 50000,
                needsImprovement: 150000,
                poor: 300000
              }
            });
          }
        }
      });
    });
  }

  private async initializeBusinessFlowTracking(): Promise<void> {
    // Track specific business flows for the beauty/fitness platform
    this.trackBeautyServiceFlow();
    this.trackFitnessProgramFlow();
    this.trackBookingConversionFlow();
    this.trackPaymentFlow();

    console.log('✅ Business flow tracking initialized');
  }

  private trackBeautyServiceFlow(): void {
    // Track beauty service discovery and selection
    const trackServiceInteraction = (serviceName: string, action: string) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'business',
        name: `Beauty Service - ${action}`,
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['beauty', 'service', action, serviceName]
      });
    };

    // Listen for beauty service interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const serviceElement = target.closest('[data-service-type="beauty"]');

      if (serviceElement) {
        const serviceName = serviceElement.getAttribute('data-service-name') || 'unknown';

        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
          trackServiceInteraction(serviceName, 'click');
        }
      }
    });
  }

  private trackFitnessProgramFlow(): void {
    // Track fitness program discovery and selection
    const trackProgramInteraction = (programName: string, action: string) => {
      this.recordMetric({
        id: this.generateMetricId(),
        type: 'business',
        name: `Fitness Program - ${action}`,
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['fitness', 'program', action, programName]
      });
    };

    // Listen for fitness program interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const programElement = target.closest('[data-service-type="fitness"]');

      if (programElement) {
        const programName = programElement.getAttribute('data-service-name') || 'unknown';

        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
          trackProgramInteraction(programName, 'click');
        }
      }
    });
  }

  private trackBookingConversionFlow(): void {
    // Track booking conversion metrics
    let bookingStartTime = 0;
    let currentStep = 'landing';

    const startBooking = () => {
      bookingStartTime = performance.now();
      currentStep = 'started';

      this.recordMetric({
        id: this.generateMetricId(),
        type: 'business',
        name: 'Booking Started',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['booking', 'conversion', 'started']
      });
    };

    const completeBooking = () => {
      if (bookingStartTime > 0) {
        const bookingDuration = performance.now() - bookingStartTime;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'business',
          name: 'Booking Completed',
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['booking', 'conversion', 'completed']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'business',
          name: 'Booking Duration',
          value: bookingDuration,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['booking', 'duration', 'conversion']
        });

        bookingStartTime = 0;
      }
    };

    // Listen for booking events
    window.addEventListener('booking-started', startBooking);
    window.addEventListener('booking-completed', completeBooking);
  }

  private trackPaymentFlow(): void {
    // Track payment performance metrics
    let paymentStartTime = 0;

    const startPayment = () => {
      paymentStartTime = performance.now();

      this.recordMetric({
        id: this.generateMetricId(),
        type: 'business',
        name: 'Payment Started',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['payment', 'started']
      });
    };

    const completePayment = (success: boolean) => {
      if (paymentStartTime > 0) {
        const paymentDuration = performance.now() - paymentStartTime;

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'business',
          name: `Payment ${success ? 'Completed' : 'Failed'}`,
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['payment', success ? 'completed' : 'failed']
        });

        this.recordMetric({
          id: this.generateMetricId(),
          type: 'business',
          name: 'Payment Processing Time',
          value: paymentDuration,
          unit: 'ms',
          timestamp: Date.now(),
          context: this.sessionContext,
          tags: ['payment', 'processing-time'],
          threshold: {
            good: 2000,
            needsImprovement: 5000,
            poor: 10000
          }
        });

        paymentStartTime = 0;
      }
    };

    // Listen for payment events
    window.addEventListener('payment-started', startPayment);
    window.addEventListener('payment-completed', () => completePayment(true));
    window.addEventListener('payment-failed', () => completePayment(false));
  }

  private async initializeAdvancedTracking(): Promise<void> {
    // Initialize geographic tracking
    if (this.config.enableGeographicTracking) {
      await this.initializeGeographicTracking();
    }

    // Initialize device-specific tracking
    if (this.config.enableDeviceSpecificTracking) {
      await this.initializeDeviceSpecificTracking();
    }

    console.log('✅ Advanced tracking initialized');
  }

  private async initializeGeographicTracking(): Promise<void> {
    try {
      // Get geographic information from IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const geoData = await response.json();

      // Update session context with geographic data
      this.sessionContext.geographicRegion = `${geoData.country_name || 'Unknown'}, ${geoData.region || geoData.city || 'Unknown'}`;

      this.recordMetric({
        id: this.generateMetricId(),
        type: 'custom',
        name: 'Geographic Region',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: this.sessionContext,
        tags: ['geographic', 'region', geoData.country || 'unknown']
      });

    } catch (error) {
      console.warn('Could not fetch geographic data:', error);
      this.sessionContext.geographicRegion = 'Unknown';
    }
  }

  private async initializeDeviceSpecificTracking(): Promise<void> {
    // Track device-specific performance metrics
    const deviceInfo = this.getDeviceInfo();

    this.recordMetric({
      id: this.generateMetricId(),
      type: 'custom',
      name: 'Device Type',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      context: this.sessionContext,
      tags: ['device', deviceInfo.type, deviceInfo.os]
    });

    this.recordMetric({
      id: this.generateMetricId(),
      type: 'custom',
      name: 'Screen Density',
      value: deviceInfo.pixelRatio,
      unit: 'score',
      timestamp: Date.now(),
      context: this.sessionContext,
      tags: ['device', 'screen-density']
    });

    // Track viewport dimensions
    this.recordMetric({
      id: this.generateMetricId(),
      type: 'custom',
      name: 'Viewport Size',
      value: window.innerWidth * window.innerHeight,
      unit: 'count',
      timestamp: Date.now(),
      context: this.sessionContext,
      tags: ['device', 'viewport']
    });
  }

  private getDeviceInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    let type = 'desktop';
    let os = 'unknown';

    // Detect device type
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      type = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    // Detect OS
    if (/windows/i.test(userAgent)) os = 'windows';
    else if (/mac|os x/i.test(userAgent)) os = 'macos';
    else if (/android/i.test(userAgent)) os = 'android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'ios';
    else if (/linux/i.test(userAgent)) os = 'linux';

    return {
      type,
      os,
      pixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }

  private startMetricsCollection(): void {
    // Set up periodic metrics flushing
    setInterval(() => {
      this.flushMetrics();
    }, this.config.flushInterval || 30000);

    console.log('✅ Metrics collection started');
  }

  public recordMetric(metric: PerformanceMetric): void {
    const typeKey = metric.type;

    if (!this.metrics.has(typeKey)) {
      this.metrics.set(typeKey, []);
    }

    this.metrics.get(typeKey)!.push(metric);

    // Emit metric event for other systems
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: metric
    }));

    // Check if metric exceeds thresholds and create alert
    this.checkMetricThresholds(metric);
  }

  public recordBusinessMetric(stepName: string, data: any): void {
    const businessMetric: BusinessMetric = {
      bookingFunnelStep: stepName as any,
      conversionRate: data.conversionRate || 0,
      dropOffRate: data.dropOffRate || 0,
      averageTimeInStep: data.stepDuration || 0,
      abandonmentReasons: data.abandonmentReasons || []
    };

    this.businessMetrics.set(stepName, businessMetric);

    // Record as performance metric
    this.recordMetric({
      id: this.generateMetricId(),
      type: 'business',
      name: `Booking Funnel - ${stepName}`,
      value: data.conversionRate || 0,
      unit: 'percentage',
      timestamp: Date.now(),
      context: this.sessionContext,
      tags: ['booking', 'funnel', stepName]
    });
  }

  private checkMetricThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    const { value, threshold } = metric;
    let status: 'good' | 'needs-improvement' | 'poor' = 'good';

    if (value > threshold.poor) {
      status = 'poor';
    } else if (value > threshold.needsImprovement) {
      status = 'needs-improvement';
    }

    if (status !== 'good') {
      // Create alert for metric threshold violation
      window.dispatchEvent(new CustomEvent('performance-alert', {
        detail: {
          type: 'threshold-violation',
          metric: metric.name,
          value,
          threshold,
          status,
          severity: status === 'poor' ? 'critical' : 'warning',
          context: metric.context,
          timestamp: Date.now()
        }
      }));
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.size === 0) return;

    try {
      // Prepare metrics batch
      const metricsBatch: PerformanceMetric[] = [];

      this.metrics.forEach((metricArray) => {
        metricsBatch.push(...metricArray);
      });

      if (metricsBatch.length === 0) return;

      // Send metrics to analytics endpoint
      await this.sendMetricsToAnalytics(metricsBatch);

      // Clear sent metrics
      this.metrics.clear();

      console.log(`✅ Flushed ${metricsBatch.length} metrics to analytics`);

    } catch (error) {
      console.error('❌ Failed to flush metrics:', error);
    }
  }

  private async sendMetricsToAnalytics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      await fetch('/api/analytics/performance-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          sessionContext: this.sessionContext,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Could not send metrics to analytics:', error);
    }
  }

  private initializeContext(): PerformanceContext {
    return {
      sessionId: this.generateSessionId(),
      userId: undefined, // Will be set when user logs in
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      geographicRegion: 'Unknown',
      pageType: this.getPageType(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screenDensity: window.devicePixelRatio || 1,
      isMobileApp: this.isMobileApp(),
      platform: this.getPlatform()
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getPageType(): 'homepage' | 'service-listing' | 'booking-flow' | 'admin' | 'content' {
    const path = window.location.pathname.toLowerCase();

    if (path === '/' || path === '/home') return 'homepage';
    if (path.includes('/beauty') || path.includes('/fitness')) return 'service-listing';
    if (path.includes('/booking')) return 'booking-flow';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/blog') || path.includes('/about')) return 'content';

    return 'homepage';
  }

  private isMobileApp(): boolean {
    return /wv|webkit|android|iphone|ipad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getPlatform(): 'ios' | 'android' | 'web' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    return 'web';
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackPageEngagement(pageType: string, options: any): void {
    // Page-specific engagement tracking implementation
    // This would be customized based on the page type and options
  }

  // Public API methods
  public getMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  public getBusinessMetrics(): Map<string, BusinessMetric> {
    return new Map(this.businessMetrics);
  }

  public getSessionContext(): PerformanceContext {
    return this.sessionContext;
  }

  public updateContext(updates: Partial<PerformanceContext>): void {
    this.sessionContext = { ...this.sessionContext, ...updates };
  }

  public forceFlush(): Promise<void> {
    return this.flushMetrics();
  }

  public destroy(): void {
    // Stop all monitoring
    this.observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });

    this.observers.clear();

    // Flush remaining metrics
    this.flushMetrics();

    console.log('✅ Advanced Performance Metrics Collection destroyed');
  }
}

interface MetricsConfig {
  samplingRate: number;
  enableBusinessMetrics: boolean;
  enableUserExperienceMetrics: boolean;
  enableTechnicalMetrics: boolean;
  enableGeographicTracking: boolean;
  enableDeviceSpecificTracking: boolean;
  batchSize: number;
  flushInterval: number;
}

export default AdvancedPerformanceMetricsCollection;
export { PerformanceMetric, PerformanceContext, BusinessMetric, UserExperienceMetric };