/**
 * Enhanced Core Web Vitals Monitoring
 * for luxury beauty and fitness booking platform
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP, Metric } from 'web-vitals';
import { reportMessage } from './sentry';
import { trackRUMEvent } from './rum';

// Luxury experience thresholds (stricter than standard)
const LUXURY_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 1600, poor: 2400 },        // 1.6s / 2.4s (vs standard 2.5s / 4s)
  FID: { good: 80, poor: 200 },           // 80ms / 200ms (vs standard 100ms / 300ms)
  CLS: { good: 0.05, poor: 0.15 },        // 0.05 / 0.15 (vs standard 0.1 / 0.25)
  TTFB: { good: 600, poor: 1200 },        // 600ms / 1.2s (vs standard 800ms / 1.8s)
  INP: { good: 150, poor: 300 },          // 150ms / 300ms (experimental)

  // Additional luxury metrics
  FCP: { good: 1000, poor: 1800 },        // First Contentful Paint
  TTI: { good: 2000, poor: 3800 },        // Time to Interactive
  SI: { good: 1500, poor: 2500 },         // Speed Index
  RT: { good: 100, poor: 300 },           // Response Time for interactions

  // Mobile-specific thresholds
  MOBILE_LCP: { good: 2000, poor: 3000 },
  MOBILE_FID: { good: 100, poor: 250 },
  MOBILE_TTI: { good: 3000, poor: 5000 },
};

// Performance budget configuration
interface PerformanceBudget {
  metric: string;
  budget: number;
  critical: boolean;
  luxuryTier: 'premium' | 'standard';
}

const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Critical user experience metrics (premium tier)
  { metric: 'LCP', budget: 1600, critical: true, luxuryTier: 'premium' },
  { metric: 'FID', budget: 80, critical: true, luxuryTier: 'premium' },
  { metric: 'CLS', budget: 0.05, critical: true, luxuryTier: 'premium' },
  { metric: 'INP', budget: 150, critical: true, luxuryTier: 'premium' },

  // Supporting metrics (standard tier)
  { metric: 'FCP', budget: 1000, critical: false, luxuryTier: 'standard' },
  { metric: 'TTFB', budget: 600, critical: false, luxuryTier: 'standard' },
  { metric: 'TTI', budget: 2000, critical: false, luxuryTier: 'standard' },
];

// Core Web Vitals Monitor
export class CoreWebVitalsMonitor {
  private metrics: Metric[] = [];
  private performanceEntries: any[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private deviceInfo: any = {};

  constructor() {
    this.collectDeviceInfo();
  }

  // Initialize monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initCoreWebVitals();
      this.initAdditionalMetrics();
      this.initPerformanceObserver();
      this.initLuxuryExperienceTracking();

      this.isInitialized = true;
      console.log('[Core Web Vitals] Enhanced monitoring initialized');
    } catch (error) {
      console.warn('[Core Web Vitals] Failed to initialize:', error);
    }
  }

  // Collect device information
  private collectDeviceInfo(): void {
    this.deviceInfo = {
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      pixelRatio: window.devicePixelRatio
    };
  }

  // Initialize Core Web Vitals
  private initCoreWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      this.processMetric(metric);
    };

    // Core Web Vitals
    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);

    // Experimental metrics
    if ('getINP' in window) {
      (window as any).getINP?.(handleMetric);
    }

    // Track initialization
    trackRUMEvent('core-web-vitals-initialized', { deviceInfo: this.deviceInfo });
  }

  // Initialize additional performance metrics
  private initAdditionalMetrics(): void {
    // Track Time to Interactive (TTI)
    this.trackTTI();

    // Track Speed Index (SI) using navigation timing
    this.trackSpeedIndex();

    // Track render times for critical elements
    this.trackCriticalRenderTimes();

    // Track image loading performance
    this.trackImagePerformance();
  }

  // Track Time to Interactive
  private trackTTI(): void {
    // Use Performance Observer for long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastLongTask = entries[entries.length - 1];

        if (lastLongTask) {
          const tti = lastLongTask.startTime + lastLongTask.duration;

          const ttiMetric: Metric = {
            name: 'TTI',
            value: tti,
            rating: this.calculateRating('TTI', tti),
            delta: 0,
            id: `tti-${Date.now()}`,
            entries: [],
            navigationType: 'navigate'
          };

          this.processMetric(ttiMetric);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  // Track Speed Index
  private trackSpeedIndex(): void {
    // Simplified Speed Index calculation
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const si = navigation.loadEventEnd;

        const siMetric: Metric = {
          name: 'SI',
          value: si,
          rating: this.calculateRating('SI', si),
          delta: 0,
          id: `si-${Date.now()}`,
          entries: [],
          navigationType: 'navigate'
        };

        this.processMetric(siMetric);
      }, 0);
    });
  }

  // Track critical render times
  private trackCriticalRenderTimes(): void {
    // Track Largest Contentful Paint elements
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            const element = (entry as any).element;
            const renderTime = (entry as any).renderTime || entry.startTime;

            trackRUMEvent('critical-element-render', {
              element: element?.tagName || 'unknown',
              renderTime: renderTime,
              size: (entry as any).size || 0,
              url: (entry as any).url || window.location.href
            });
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  // Track image performance specifically for service galleries
  private trackImagePerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource' && (entry as PerformanceResourceTiming).name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
            const resource = entry as PerformanceResourceTiming;

            const imageMetric = {
              name: 'image-load',
              value: resource.duration,
              url: resource.name,
              size: resource.transferSize,
              cached: resource.transferSize === 0,
              pageType: this.getPageType(),
              isAboveFold: this.isAboveFold(resource.name),
              timestamp: Date.now()
            };

            trackRUMEvent('image-performance', imageMetric);

            // Report slow images
            if (resource.duration > 2000 && imageMetric.isAboveFold) {
              reportMessage('Above-fold image loading slowly', 'warning', imageMetric);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // Initialize Performance Observer for comprehensive monitoring
  private initPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    // Monitor all performance entry types
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.performanceEntries.push(...entries);

      // Process different entry types
      entries.forEach(entry => {
        switch (entry.entryType) {
          case 'navigation':
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
            break;
          case 'resource':
            this.processResourceEntry(entry as PerformanceResourceTiming);
            break;
          case 'measure':
            this.processMeasureEntry(entry as PerformanceMeasure);
            break;
          case 'paint':
            this.processPaintEntry(entry as PerformancePaintTiming);
            break;
        }
      });
    });

    observer.observe({
      entryTypes: ['navigation', 'resource', 'measure', 'paint', 'largest-contentful-paint']
    });

    this.observers.push(observer);
  }

  // Process navigation entry
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const navigationMetrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
      firstByte: entry.responseStart - entry.requestStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      pageType: this.getPageType()
    };

    trackRUMEvent('navigation-timing', navigationMetrics);
  }

  // Process resource entry
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Track API calls specifically
    if (entry.name.includes('/api/') || entry.name.includes('supabase')) {
      const apiMetric = {
        name: 'api-response-time',
        value: entry.duration,
        endpoint: entry.name,
        size: entry.transferSize,
        cached: entry.transferSize === 0,
        pageType: this.getPageType(),
        timestamp: Date.now()
      };

      trackRUMEvent('api-performance', apiMetric);

      // Report slow API calls
      if (entry.duration > 1500) {
        reportMessage('Slow API response detected', 'warning', apiMetric);
      }
    }
  }

  // Process measure entry (custom performance marks)
  private processMeasureEntry(entry: PerformanceMeasure): void {
    trackRUMEvent('custom-measure', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    });
  }

  // Process paint entry
  private processPaintEntry(entry: PerformancePaintTiming): void {
    trackRUMEvent('paint-timing', {
      name: entry.name,
      time: entry.startTime,
      pageType: this.getPageType()
    });
  }

  // Initialize luxury experience tracking
  private initLuxuryExperienceTracking(): void {
    // Track 60fps maintenance
    this.trackFrameRate();

    // Track interaction responsiveness
    this.trackInteractionResponsiveness();

    // Track booking flow specific performance
    this.trackBookingFlowPerformance();

    // Track mobile experience quality
    this.trackMobileExperience();
  }

  // Track frame rate for smooth animations
  private trackFrameRate(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        trackRUMEvent('frame-rate', {
          fps: fps,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });

        // Report frame rate issues
        if (fps < 55) {
          reportMessage(`Low frame rate detected: ${fps}fps`, 'warning', {
            fps: fps,
            pageType: this.getPageType(),
            deviceInfo: this.deviceInfo
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  // Track interaction responsiveness
  private trackInteractionResponsiveness(): void {
    let interactionStart = 0;

    ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStart = performance.now();
      });
    });

    ['click', 'touchend', 'keyup'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (interactionStart > 0) {
          const responseTime = performance.now() - interactionStart;

          trackRUMEvent('interaction-response', {
            event: eventType,
            responseTime: responseTime,
            pageType: this.getPageType(),
            timestamp: Date.now()
          });

          // Report slow interactions
          if (responseTime > 100) {
            reportMessage(`Slow interaction response: ${responseTime}ms`, 'warning', {
              responseTime: responseTime,
              event: eventType,
              pageType: this.getPageType()
            });
          }

          interactionStart = 0;
        }
      });
    });
  }

  // Track booking flow specific performance
  private trackBookingFlowPerformance(): void {
    // Monitor booking wizard performance
    const bookingPaths = ['/booking/step1', '/booking/step2', '/booking/step3', '/booking/step4'];

    const checkBookingPerformance = () => {
      const currentPath = window.location.pathname;
      if (bookingPaths.some(path => currentPath.includes(path))) {
        // Track booking-specific metrics
        const bookingMetric = {
          path: currentPath,
          timestamp: Date.now(),
          pageLoadTime: performance.now(),
          deviceInfo: this.deviceInfo
        };

        trackRUMEvent('booking-performance', bookingMetric);
      }
    };

    // Check on load and route changes
    checkBookingPerformance();
    setInterval(checkBookingPerformance, 1000);
  }

  // Track mobile experience quality
  private trackMobileExperience(): void {
    if (!this.deviceInfo.isMobile) return;

    // Track touch responsiveness
    let touchStart = 0;

    document.addEventListener('touchstart', () => {
      touchStart = performance.now();
    });

    document.addEventListener('touchend', () => {
      if (touchStart > 0) {
        const touchResponse = performance.now() - touchStart;

        trackRUMEvent('touch-performance', {
          responseTime: touchResponse,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });

        touchStart = 0;
      }
    });

    // Track viewport performance
    this.trackViewportPerformance();
  }

  // Track viewport performance for mobile
  private trackViewportPerformance(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const element = entry.target as HTMLElement;
          const viewportTime = performance.now();

          trackRUMEvent('viewport-interaction', {
            element: element.tagName,
            intersectionRatio: entry.intersectionRatio,
            timeToInteract: viewportTime,
            elementId: element.id
          });
        }
      });
    }, { threshold: 0.5 });

    // Observe key interactive elements
    document.querySelectorAll('button, a, input, select').forEach(el => {
      observer.observe(el);
    });
  }

  // Process Core Web Vital metrics
  private processMetric(metric: Metric): void {
    // Enrich metric with additional data
    const enrichedMetric = {
      ...metric,
      deviceInfo: this.deviceInfo,
      pageType: this.getPageType(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Store metric
    this.metrics.push(enrichedMetric);

    // Check against luxury thresholds
    this.checkLuxuryThresholds(enrichedMetric);

    // Check performance budgets
    this.checkPerformanceBudgets(enrichedMetric);

    // Track metric
    trackRUMEvent('core-web-vital', enrichedMetric);
  }

  // Check against luxury thresholds
  private checkLuxuryThresholds(metric: Metric): void {
    const thresholds = this.getLuxuryThresholds(metric.name);
    if (!thresholds) return;

    const exceedsBudget = metric.value > thresholds.poor;
    const needsImprovement = metric.value > thresholds.good;

    if (exceedsBudget) {
      reportMessage(`Luxury threshold exceeded: ${metric.name}`, 'error', {
        metric: metric.name,
        value: metric.value,
        threshold: thresholds.poor,
        pageType: this.getPageType(),
        deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
      });
    } else if (needsImprovement) {
      reportMessage(`Luxury performance needs improvement: ${metric.name}`, 'warning', {
        metric: metric.name,
        value: metric.value,
        threshold: thresholds.good,
        pageType: this.getPageType()
      });
    }
  }

  // Check performance budgets
  private checkPerformanceBudgets(metric: Metric): void {
    const budget = PERFORMANCE_BUDGETS.find(b => b.metric === metric.name);
    if (!budget) return;

    if (metric.value > budget.budget) {
      const severity = budget.critical ? 'critical' : 'warning';

      trackRUMEvent('performance-budget-exceeded', {
        metric: metric.name,
        value: metric.value,
        budget: budget.budget,
        severity: severity,
        luxuryTier: budget.luxuryTier,
        pageType: this.getPageType()
      });

      if (budget.critical) {
        reportMessage(`Critical performance budget exceeded: ${metric.name}`, 'error', {
          metric: metric.name,
          value: metric.value,
          budget: budget.budget,
          luxuryTier: budget.luxuryTier
        });
      }
    }
  }

  // Get luxury thresholds for metric
  private getLuxuryThresholds(metricName: string): { good: number; poor: number } | null {
    const isMobile = this.deviceInfo.isMobile;

    if (isMobile && (LUXURY_THRESHOLDS as any)[`MOBILE_${metricName}`]) {
      return (LUXURY_THRESHOLDS as any)[`MOBILE_${metricName}`];
    }

    return (LUXURY_THRESHOLDS as any)[metricName] || null;
  }

  // Calculate performance rating
  private calculateRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.getLuxuryThresholds(metricName);
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  // Helper methods
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

  private isAboveFold(url: string): boolean {
    // Simple heuristic - would need to be more sophisticated
    return !url.includes('lazy') && !url.includes('defer');
  }

  // Public API methods

  // Get all metrics
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const summary: any = {
      overallScore: 0,
      metrics: {},
      deviceInfo: this.deviceInfo,
      luxuryCompliance: false,
      criticalIssues: [],
      warnings: []
    };

    // Process latest metrics for each type
    const latestMetrics = new Map<string, Metric>();
    this.metrics.forEach(metric => {
      if (!latestMetrics.has(metric.name) || latestMetrics.get(metric.name)!.timestamp < metric.timestamp) {
        latestMetrics.set(metric.name, metric);
      }
    });

    let totalScore = 0;
    let metricCount = 0;

    latestMetrics.forEach((metric, name) => {
      const budget = PERFORMANCE_BUDGETS.find(b => b.metric === name);
      const thresholds = this.getLuxuryThresholds(name);

      const metricSummary = {
        value: metric.value,
        rating: metric.rating,
        budget: budget?.budget,
        luxuryThreshold: thresholds,
        withinBudget: budget ? metric.value <= budget.budget : true,
        luxuryCompliant: thresholds ? metric.value <= thresholds.good : true
      };

      summary.metrics[name] = metricSummary;

      // Calculate score
      if (metricSummary.luxuryCompliant) {
        totalScore += 100;
      } else if (metricSummary.withinBudget) {
        totalScore += 70;
      } else {
        totalScore += 30;
      }
      metricCount++;

      // Track issues
      if (budget?.critical && metric.value > budget.budget) {
        summary.criticalIssues.push(name);
      }
      if (thresholds && metric.value > thresholds.good) {
        summary.warnings.push(name);
      }
    });

    summary.overallScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
    summary.luxuryCompliance = summary.overallScore >= 90;

    return summary;
  }

  // Get performance budget status
  getBudgetStatus(): any {
    const status: any = {
      passed: [],
      failed: [],
      critical: [],
      luxuryTier: { passed: [], failed: [] }
    };

    PERFORMANCE_BUDGETS.forEach(budget => {
      const metric = this.metrics
        .filter(m => m.name === budget.metric)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (!metric) return;

      const passed = metric.value <= budget.budget;

      if (passed) {
        status.passed.push({
          metric: budget.metric,
          value: metric.value,
          budget: budget.budget,
          luxuryTier: budget.luxuryTier
        });

        if (budget.luxuryTier === 'premium') {
          status.luxuryTier.passed.push(budget.metric);
        }
      } else {
        status.failed.push({
          metric: budget.metric,
          value: metric.value,
          budget: budget.budget,
          luxuryTier: budget.luxuryTier,
          critical: budget.critical
        });

        if (budget.critical) {
          status.critical.push(budget.metric);
        }

        if (budget.luxuryTier === 'premium') {
          status.luxuryTier.failed.push(budget.metric);
        }
      }
    });

    return status;
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create and export singleton instance
export const coreWebVitalsMonitor = new CoreWebVitalsMonitor();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    coreWebVitalsMonitor.initialize();
  } else {
    window.addEventListener('load', () => {
      coreWebVitalsMonitor.initialize();
    });
  }
}

// Export helper functions
export const initializeCoreWebVitals = () => coreWebVitalsMonitor.initialize();
export const getCoreWebVitalsMetrics = () => coreWebVitalsMonitor.getMetrics();
export const getCoreWebVitalsSummary = () => coreWebVitalsMonitor.getPerformanceSummary();
export const getPerformanceBudgetStatus = () => coreWebVitalsMonitor.getBudgetStatus();

// Export types
export interface CoreWebVitalsSummary {
  overallScore: number;
  metrics: Record<string, any>;
  deviceInfo: any;
  luxuryCompliance: boolean;
  criticalIssues: string[];
  warnings: string[];
}