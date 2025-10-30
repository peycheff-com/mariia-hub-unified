/**
 * Core Web Vitals Monitoring and Performance Budgeting System
 * for luxury beauty and fitness booking platform
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP, Metric } from 'web-vitals';
import { trackRUMEvent, trackRUMInteraction } from './rum';
import { reportMessage } from './sentry';

// Performance budget configuration for luxury experience
interface PerformanceBudget {
  // Core Web Vitals thresholds (stricter for luxury experience)
  LCP: {
    good: 1600;      // 1.6s (Google recommends 2.5s, luxury = 1.6s)
    needsImprovement: 2500;
    poor: 4000;
  };
  FID: {
    good: 80;       // 80ms (Google recommends 100ms)
    needsImprovement: 200;
    poor: 300;
  };
  CLS: {
    good: 0.08;     // 0.08 (Google recommends 0.1)
    needsImprovement: 0.15;
    poor: 0.25;
  };
  TTFB: {
    good: 600;      // 600ms (Google recommends 800ms)
    needsImprovement: 1000;
    poor: 2000;
  };
  INP: {
    good: 160;      // 160ms (Google recommends 200ms)
    needsImprovement: 300;
    poor: 500;
  };
}

// Page-specific budgets for different user journeys
interface PageSpecificBudgets {
  landing: PerformanceBudget;
  beautyServices: PerformanceBudget;
  fitnessServices: PerformanceBudget;
  booking: PerformanceBudget;
  bookingSteps: {
    step1: PerformanceBudget; // Service selection
    step2: PerformanceBudget; // Time selection
    step3: PerformanceBudget; // Details form
    step4: PerformanceBudget; // Payment
  };
  confirmation: PerformanceBudget;
  admin: PerformanceBudget;
}

// Budget violation alert levels
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// Performance alert data structure
interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  budget: number;
  threshold: 'good' | 'needsImprovement' | 'poor';
  level: AlertLevel;
  pageType: string;
  url: string;
  timestamp: number;
  deviceInfo: any;
  networkInfo: any;
  impact: {
    conversionRisk: number; // 0-1
    userExperience: number; // 0-1
    brandPerception: number; // 0-1
  };
  recommendations: string[];
  resolved: boolean;
}

// Core Web Vitals data with additional context
interface EnrichedMetric extends Metric {
  pageType: string;
  deviceInfo: any;
  networkInfo: any;
  loadingExperience: 'fast' | 'moderate' | 'slow';
  conversionImpact: 'low' | 'medium' | 'high';
  brandRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Performance budget configuration
const LUXURY_PERFORMANCE_BUDGETS: PageSpecificBudgets = {
  landing: {
    LCP: { good: 1400, needsImprovement: 2000, poor: 3000 },
    FID: { good: 60, needsImprovement: 150, poor: 250 },
    CLS: { good: 0.06, needsImprovement: 0.12, poor: 0.20 },
    TTFB: { good: 500, needsImprovement: 800, poor: 1500 },
    INP: { good: 140, needsImprovement: 250, poor: 400 }
  },
  beautyServices: {
    LCP: { good: 1600, needsImprovement: 2200, poor: 3500 },
    FID: { good: 80, needsImprovement: 180, poor: 280 },
    CLS: { good: 0.08, needsImprovement: 0.14, poor: 0.22 },
    TTFB: { good: 600, needsImprovement: 900, poor: 1600 },
    INP: { good: 160, needsImprovement: 280, poor: 450 }
  },
  fitnessServices: {
    LCP: { good: 1600, needsImprovement: 2200, poor: 3500 },
    FID: { good: 80, needsImprovement: 180, poor: 280 },
    CLS: { good: 0.08, needsImprovement: 0.14, poor: 0.22 },
    TTFB: { good: 600, needsImprovement: 900, poor: 1600 },
    INP: { good: 160, needsImprovement: 280, poor: 450 }
  },
  booking: {
    LCP: { good: 1500, needsImprovement: 2100, poor: 3200 },
    FID: { good: 70, needsImprovement: 160, poor: 260 },
    CLS: { good: 0.07, needsImprovement: 0.13, poor: 0.21 },
    TTFB: { good: 550, needsImprovement: 850, poor: 1500 },
    INP: { good: 150, needsImprovement: 260, poor: 420 }
  },
  bookingSteps: {
    step1: {
      LCP: { good: 1400, needsImprovement: 2000, poor: 3000 },
      FID: { good: 60, needsImprovement: 150, poor: 250 },
      CLS: { good: 0.06, needsImprovement: 0.12, poor: 0.20 },
      TTFB: { good: 500, needsImprovement: 800, poor: 1400 },
      INP: { good: 140, needsImprovement: 250, poor: 400 }
    },
    step2: {
      LCP: { good: 1300, needsImprovement: 1900, poor: 2800 },
      FID: { good: 50, needsImprovement: 140, poor: 240 },
      CLS: { good: 0.05, needsImprovement: 0.11, poor: 0.19 },
      TTFB: { good: 450, needsImprovement: 750, poor: 1300 },
      INP: { good: 130, needsImprovement: 240, poors: 380 }
    },
    step3: {
      LCP: { good: 1400, needsImprovement: 2000, poor: 3000 },
      FID: { good: 60, needsImprovement: 150, poor: 250 },
      CLS: { good: 0.06, needsImprovement: 0.12, poor: 0.20 },
      TTFB: { good: 500, needsImprovement: 800, poor: 1400 },
      INP: { good: 140, needsImprovement: 250, poor: 400 }
    },
    step4: {
      LCP: { good: 1200, needsImprovement: 1800, poor: 2600 },
      FID: { good: 40, needsImprovement: 130, poor: 220 },
      CLS: { good: 0.04, needsImprovement: 0.10, poor: 0.18 },
      TTFB: { good: 400, needsImprovement: 700, poor: 1200 },
      INP: { good: 120, needsImprovement: 220, poor: 360 }
    }
  },
  confirmation: {
    LCP: { good: 1500, needsImprovement: 2100, poor: 3200 },
    FID: { good: 70, needsImprovement: 160, poor: 260 },
    CLS: { good: 0.07, needsImprovement: 0.13, poors: 0.21 },
    TTFB: { good: 550, needsImprovement: 850, poor: 1500 },
    INP: { good: 150, needsImprovement: 260, poor: 420 }
  },
  admin: {
    LCP: { good: 2000, needsImprovement: 2800, poor: 4000 },
    FID: { good: 100, needsImprovement: 200, poor: 300 },
    CLS: { good: 0.1, needsImprovement: 0.16, poor: 0.25 },
    TTFB: { good: 800, needsImprovement: 1200, poor: 2000 },
    INP: { good: 200, needsImprovement: 320, poor: 500 }
  }
};

class CoreWebVitalsMonitor {
  private static instance: CoreWebVitalsMonitor;
  private metrics: EnrichedMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private isInitialized = false;
  private deviceInfo: any = {};
  private networkInfo: any = {};
  private monitoringEnabled = true;
  private budgetViolations: Map<string, number> = new Map();
  private performanceBaseline: Map<string, number> = new Map();

  private constructor() {
    this.collectDeviceInfo();
    this.collectNetworkInfo();
  }

  static getInstance(): CoreWebVitalsMonitor {
    if (!CoreWebVitalsMonitor.instance) {
      CoreWebVitalsMonitor.instance = new CoreWebVitalsMonitor();
    }
    return CoreWebVitalsMonitor.instance;
  }

  // Initialize Core Web Vitals monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeCoreWebVitalsTracking();
      this.initializePerformanceBudgetMonitoring();
      this.initializeRealTimeAlerting();
      this.initializeConversionImpactAnalysis();
      this.initializeBrandRiskAssessment();

      this.isInitialized = true;
      console.log('[Core Web Vitals] Advanced monitoring initialized for luxury experience');

      // Set up performance baseline after page load
      this.establishPerformanceBaseline();
    } catch (error) {
      console.warn('[Core Web Vitals] Failed to initialize:', error);
    }
  }

  // Collect device information
  private collectDeviceInfo(): void {
    this.deviceInfo = {
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  // Collect network information
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
    } else {
      this.networkInfo = {
        effectiveType: 'unknown',
        downlink: 'unknown',
        rtt: 'unknown',
        saveData: false,
        type: 'unknown'
      };
    }
  }

  // Initialize Core Web Vitals tracking
  private initializeCoreWebVitalsTracking(): void {
    // Largest Contentful Paint (LCP)
    getCLS((metric) => {
      this.processMetric('CLS', metric);
    });

    getFID((metric) => {
      this.processMetric('FID', metric);
    });

    getFCP((metric) => {
      this.processMetric('FCP', metric);
    });

    getLCP((metric) => {
      this.processMetric('LCP', metric);
    });

    getTTFB((metric) => {
      this.processMetric('TTFB', metric);
    });

    // Interaction to Next Paint (INP) - if available
    if ('getINP' in window) {
      (window as any).getINP?.((metric: Metric) => {
        this.processMetric('INP', metric);
      });
    }

    // First Contentful Paint (FCP) for additional insight
    getFCP((metric) => {
      this.processMetric('FCP', metric);
    });
  }

  // Process and enrich metrics
  private processMetric(metricName: string, metric: Metric): void {
    if (!this.monitoringEnabled) return;

    const pageType = this.getPageType();
    const budget = this.getCurrentBudget(pageType);
    const budgetThresholds = budget[metricName as keyof PerformanceBudget] as any;

    if (!budgetThresholds) return;

    // Determine rating against budget
    let rating: 'good' | 'needsImprovement' | 'poor';
    if (metric.value <= budgetThresholds.good) {
      rating = 'good';
    } else if (metric.value <= budgetThresholds.needsImprovement) {
      rating = 'needsImprovement';
    } else {
      rating = 'poor';
    }

    // Create enriched metric
    const enrichedMetric: EnrichedMetric = {
      ...metric,
      pageType,
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
      loadingExperience: this.assessLoadingExperience(metricName, metric.value, budgetThresholds),
      conversionImpact: this.assessConversionImpact(metricName, rating, pageType),
      brandRisk: this.assessBrandRisk(metricName, rating, pageType),
      recommendations: this.generateRecommendations(metricName, rating, metric.value, pageType)
    };

    this.metrics.push(enrichedMetric);

    // Check for budget violations
    this.checkBudgetViolation(metricName, enrichedMetric, budgetThresholds);

    // Track metric event
    trackRUMEvent('core-web-vital', {
      metric: metricName,
      value: metric.value,
      rating: rating,
      pageType: pageType,
      deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop',
      networkType: this.networkInfo.effectiveType,
      conversionImpact: enrichedMetric.conversionImpact,
      brandRisk: enrichedMetric.brandRisk
    });

    // Report critical issues
    if (rating === 'poor' && (metricName === 'LCP' || metricName === 'INP')) {
      this.reportCriticalPerformanceIssue(metricName, enrichedMetric);
    }
  }

  // Get current page type
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'landing';
    if (path.includes('/beauty')) return 'beautyServices';
    if (path.includes('/fitness')) return 'fitnessServices';
    if (path.includes('/booking/step1')) return 'step1';
    if (path.includes('/booking/step2')) return 'step2';
    if (path.includes('/booking/step3')) return 'step3';
    if (path.includes('/booking/step4')) return 'step4';
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/confirmation')) return 'confirmation';
    if (path.includes('/admin')) return 'admin';
    return 'other';
  }

  // Get current budget based on page type
  private getCurrentBudget(pageType: string): PerformanceBudget {
    if (pageType === 'landing') return LUXURY_PERFORMANCE_BUDGETS.landing;
    if (pageType === 'beautyServices') return LUXURY_PERFORMANCE_BUDGETS.beautyServices;
    if (pageType === 'fitnessServices') return LUXURY_PERFORMANCE_BUDGETS.fitnessServices;
    if (pageType === 'booking') return LUXURY_PERFORMANCE_BUDGETS.booking;
    if (pageType === 'step1') return LUXURY_PERFORMANCE_BUDGETS.bookingSteps.step1;
    if (pageType === 'step2') return LUXURY_PERFORMANCE_BUDGETS.bookingSteps.step2;
    if (pageType === 'step3') return LUXURY_PERFORMANCE_BUDGETS.bookingSteps.step3;
    if (pageType === 'step4') return LUXURY_PERFORMANCE_BUDGETS.bookingSteps.step4;
    if (pageType === 'confirmation') return LUXURY_PERFORMANCE_BUDGETS.confirmation;
    if (pageType === 'admin') return LUXURY_PERFORMANCE_BUDGETS.admin;

    // Default to landing budget
    return LUXURY_PERFORMANCE_BUDGETS.landing;
  }

  // Assess loading experience
  private assessLoadingExperience(metricName: string, value: number, thresholds: any): 'fast' | 'moderate' | 'slow' {
    if (value <= thresholds.good) return 'fast';
    if (value <= thresholds.needsImprovement) return 'moderate';
    return 'slow';
  }

  // Assess conversion impact
  private assessConversionImpact(metricName: string, rating: string, pageType: string): 'low' | 'medium' | 'high' {
    // High impact metrics for conversion
    const highImpactMetrics = ['LCP', 'INP', 'FID'];
    const bookingPages = ['step1', 'step2', 'step3', 'step4', 'booking', 'confirmation'];

    if (rating === 'poor' && highImpactMetrics.includes(metricName) && bookingPages.includes(pageType)) {
      return 'high';
    }

    if (rating === 'needsImprovement' && (highImpactMetrics.includes(metricName) || bookingPages.includes(pageType))) {
      return 'medium';
    }

    if (rating === 'poor') {
      return 'medium';
    }

    return 'low';
  }

  // Assess brand risk
  private assessBrandRisk(metricName: string, rating: string, pageType: string): 'low' | 'medium' | 'high' {
    // High brand risk for luxury experience
    const luxuryCriticalPages = ['landing', 'beautyServices', 'fitnessServices'];
    const criticalMetrics = ['LCP', 'CLS', 'INP'];

    if (rating === 'poor' && criticalMetrics.includes(metricName) && luxuryCriticalPages.includes(pageType)) {
      return 'high';
    }

    if (rating === 'needsImprovement' && luxuryCriticalPages.includes(pageType)) {
      return 'medium';
    }

    if (rating === 'poor') {
      return 'medium';
    }

    return 'low';
  }

  // Generate recommendations
  private generateRecommendations(metricName: string, rating: string, value: number, pageType: string): string[] {
    const recommendations: string[] = [];

    switch (metricName) {
      case 'LCP':
        if (rating === 'poor') {
          recommendations.push('Optimize images for next-generation formats (WebP, AVIF)');
          recommendations.push('Implement critical CSS inlining');
          recommendations.push('Preload critical resources');
          recommendations.push('Optimize server response time');
        }
        break;

      case 'INP':
      case 'FID':
        if (rating === 'poor') {
          recommendations.push('Reduce JavaScript execution time');
          recommendations.push('Break up long tasks');
          recommendations.push('Optimize third-party scripts');
          recommendations.push('Use web workers for heavy computations');
        }
        break;

      case 'CLS':
        if (rating === 'poor') {
          recommendations.push('Reserve space for dynamic content');
          recommendations.push('Set explicit dimensions for images and videos');
          recommendations.push('Avoid inserting content above existing content');
          recommendations.push('Use transform animations instead of layout changes');
        }
        break;

      case 'TTFB':
        if (rating === 'poor') {
          recommendations.push('Optimize server response time');
          recommendations.push('Implement CDN for static assets');
          recommendations.push('Enable server-side caching');
          recommendations.push('Optimize database queries');
        }
        break;
    }

    return recommendations;
  }

  // Check budget violations
  private checkBudgetViolation(metricName: string, metric: EnrichedMetric, thresholds: any): void {
    const violationKey = `${metricName}_${metric.pageType}`;

    if (metric.rating === 'poor') {
      this.budgetViolations.set(violationKey, (this.budgetViolations.get(violationKey) || 0) + 1);

      this.createPerformanceAlert(metricName, metric, thresholds);
    } else {
      // Reset violation count if performance improves
      this.budgetViolations.delete(violationKey);
    }
  }

  // Create performance alert
  private createPerformanceAlert(metricName: string, metric: EnrichedMetric, thresholds: any): void {
    const alertId = `alert_${metricName}_${metric.pageType}_${Date.now()}`;

    const alert: PerformanceAlert = {
      id: alertId,
      metric: metricName,
      value: metric.value,
      budget: thresholds.good,
      threshold: metric.rating,
      level: this.determineAlertLevel(metricName, metric),
      pageType: metric.pageType,
      url: window.location.href,
      timestamp: Date.now(),
      deviceInfo: metric.deviceInfo,
      networkInfo: metric.networkInfo,
      impact: {
        conversionRisk: this.calculateConversionRisk(metric),
        userExperience: this.calculateUserExperienceImpact(metric),
        brandPerception: this.calculateBrandPerceptionImpact(metric)
      },
      recommendations: metric.recommendations,
      resolved: false
    };

    this.alerts.push(alert);

    // Track alert event
    trackRUMEvent('performance-alert', {
      alertId: alert.id,
      metric: alert.metric,
      level: alert.level,
      pageType: alert.pageType,
      conversionRisk: alert.impact.conversionRisk,
      brandRisk: alert.impact.brandPerception
    });

    // Send critical alerts immediately
    if (alert.level === AlertLevel.CRITICAL) {
      this.sendCriticalAlert(alert);
    }
  }

  // Determine alert level
  private determineAlertLevel(metricName: string, metric: EnrichedMetric): AlertLevel {
    const criticalMetrics = ['LCP', 'INP'];
    const bookingPages = ['step1', 'step2', 'step3', 'step4', 'booking', 'confirmation'];
    const luxuryPages = ['landing', 'beautyServices', 'fitnessServices'];

    // Critical for booking conversion
    if (criticalMetrics.includes(metricName) && bookingPages.includes(metric.pageType) && metric.rating === 'poor') {
      return AlertLevel.CRITICAL;
    }

    // High brand risk
    if (metric.brandRisk === 'high' && metric.rating === 'poor') {
      return AlertLevel.CRITICAL;
    }

    // Warning for needs improvement
    if (metric.rating === 'needsImprovement' && (bookingPages.includes(metric.pageType) || luxuryPages.includes(metric.pageType))) {
      return AlertLevel.WARNING;
    }

    return AlertLevel.INFO;
  }

  // Calculate conversion risk (0-1)
  private calculateConversionRisk(metric: EnrichedMetric): number {
    let risk = 0;

    if (metric.conversionImpact === 'high') risk += 0.7;
    else if (metric.conversionImpact === 'medium') risk += 0.4;
    else risk += 0.1;

    if (metric.rating === 'poor') risk += 0.3;
    else if (metric.rating === 'needsImprovement') risk += 0.15;

    return Math.min(risk, 1.0);
  }

  // Calculate user experience impact (0-1)
  private calculateUserExperienceImpact(metric: EnrichedMetric): number {
    let impact = 0;

    if (metric.loadingExperience === 'slow') impact += 0.6;
    else if (metric.loadingExperience === 'moderate') impact += 0.3;
    else impact += 0.1;

    if (metric.deviceInfo.isMobile) impact += 0.2; // Mobile users more sensitive

    return Math.min(impact, 1.0);
  }

  // Calculate brand perception impact (0-1)
  private calculateBrandPerceptionImpact(metric: EnrichedMetric): number {
    let impact = 0;

    if (metric.brandRisk === 'high') impact += 0.8;
    else if (metric.brandRisk === 'medium') impact += 0.4;
    else impact += 0.1;

    // Luxury users expect premium experience
    const luxuryPages = ['landing', 'beautyServices', 'fitnessServices'];
    if (luxuryPages.includes(metric.pageType)) {
      impact += 0.2;
    }

    return Math.min(impact, 1.0);
  }

  // Initialize performance budget monitoring
  private initializePerformanceBudgetMonitoring(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.monitorResourcePerformance(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'navigation') {
            this.monitorNavigationPerformance(entry as PerformanceNavigationTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['resource', 'navigation'] });
    }
  }

  // Monitor resource performance
  private monitorResourcePerformance(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const duration = entry.duration;

    // Define resource performance budgets
    const resourceBudgets = {
      'image': 2000,      // 2 seconds
      'script': 1000,     // 1 second
      'stylesheet': 500,  // 500ms
      'font': 1500,       // 1.5 seconds
      'api': 1000         // 1 second
    };

    const budget = resourceBudgets[resourceType as keyof typeof resourceBudgets] || 2000;

    if (duration > budget) {
      trackRUMEvent('resource-budget-violation', {
        resourceType,
        resourceName: entry.name.split('/').pop(),
        duration,
        budget,
        pageType: this.getPageType()
      });
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) return 'image';
    if (url.match(/\.(js|mjs)$/i)) return 'script';
    if (url.match(/\.css$/i)) return 'stylesheet';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/') || url.includes('supabase')) return 'api';
    return 'other';
  }

  // Monitor navigation performance
  private monitorNavigationPerformance(entry: PerformanceNavigationTiming): void {
    const pageLoadTime = entry.loadEventEnd - entry.navigationStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
    const firstPaint = entry.responseStart - entry.navigationStart;

    const navigationBudget = {
      pageLoadTime: 3000,        // 3 seconds
      domContentLoaded: 2000,    // 2 seconds
      firstPaint: 1000           // 1 second
    };

    if (pageLoadTime > navigationBudget.pageLoadTime) {
      trackRUMEvent('navigation-budget-violation', {
        metric: 'pageLoadTime',
        value: pageLoadTime,
        budget: navigationBudget.pageLoadTime,
        pageType: this.getPageType()
      });
    }
  }

  // Initialize real-time alerting
  private initializeRealTimeAlerting(): void {
    // Monitor for continuous poor performance
    setInterval(() => {
      this.checkContinuousPerformanceIssues();
    }, 30000); // Every 30 seconds

    // Monitor for performance regression
    setInterval(() => {
      this.checkPerformanceRegression();
    }, 300000); // Every 5 minutes
  }

  // Check for continuous performance issues
  private checkContinuousPerformanceIssues(): void {
    const recentMetrics = this.metrics.filter(m =>
      Date.now() - m.timestamp < 60000 // Last minute
    );

    const poorMetrics = recentMetrics.filter(m => m.rating === 'poor');

    if (poorMetrics.length > 3) {
      trackRUMEvent('continuous-performance-issues', {
        poorMetricsCount: poorMetrics.length,
        totalMetrics: recentMetrics.length,
        affectedMetrics: poorMetrics.map(m => m.name),
        pageType: this.getPageType()
      });
    }
  }

  // Check for performance regression
  private checkPerformanceRegression(): void {
    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    const baselineMetrics = this.metrics.slice(0, 10); // First 10 metrics as baseline

    if (recentMetrics.length < 5 || baselineMetrics.length < 5) return;

    const recentAverage = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
    const baselineAverage = baselineMetrics.reduce((sum, m) => sum + m.value, 0) / baselineMetrics.length;

    const regressionPercentage = ((recentAverage - baselineAverage) / baselineAverage) * 100;

    if (regressionPercentage > 20) { // 20% regression
      trackRUMEvent('performance-regression', {
        regressionPercentage: Math.round(regressionPercentage),
        recentAverage: Math.round(recentAverage),
        baselineAverage: Math.round(baselineAverage),
        pageType: this.getPageType()
      });
    }
  }

  // Initialize conversion impact analysis
  private initializeConversionImpactAnalysis(): void {
    // Track performance impact on conversion
    this.trackBookingConversionWithPerformance();
  }

  // Track booking conversion with performance
  private trackBookingConversionWithPerformance(): void {
    const checkBookingCompletion = () => {
      if (window.location.pathname === '/booking/confirmation') {
        const pageMetrics = this.metrics.filter(m =>
          m.pageType.includes('step') || m.pageType === 'booking'
        );

        const performanceScore = this.calculatePerformanceScore(pageMetrics);

        trackRUMEvent('booking-conversion-with-performance', {
          performanceScore,
          lcp: pageMetrics.find(m => m.name === 'LCP')?.value,
          inp: pageMetrics.find(m => m.name === 'INP')?.value,
          cls: pageMetrics.find(m => m.name === 'CLS')?.value,
          pageType: this.getPageType()
        });
      }
    };

    // Check on page load and route changes
    checkBookingCompletion();
    setInterval(checkBookingCompletion, 1000);
  }

  // Calculate performance score
  private calculatePerformanceScore(metrics: EnrichedMetric[]): number {
    if (metrics.length === 0) return 0;

    const weights = {
      'LCP': 0.3,
      'INP': 0.3,
      'CLS': 0.2,
      'TTFB': 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach(metric => {
      const weight = weights[metric.name as keyof typeof weights] || 0.1;
      let score = 0;

      if (metric.rating === 'good') score = 100;
      else if (metric.rating === 'needsImprovement') score = 60;
      else score = 30;

      totalScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // Initialize brand risk assessment
  private initializeBrandRiskAssessment(): void {
    // Track luxury experience perception
    this.trackLuxuryExperiencePerception();
  }

  // Track luxury experience perception
  private trackLuxuryExperiencePerception(): void {
    const luxuryPages = ['landing', 'beautyServices', 'fitnessServices'];
    const currentPageType = this.getPageType();

    if (luxuryPages.includes(currentPageType)) {
      const pageMetrics = this.metrics.filter(m => m.pageType === currentPageType);

      const luxuryScore = this.calculateLuxuryExperienceScore(pageMetrics);

      trackRUMEvent('luxury-experience-perception', {
        pageType: currentPageType,
        luxuryScore,
        brandRisk: this.calculateOverallBrandRisk(pageMetrics),
        deviceType: this.deviceInfo.isMobile ? 'mobile' : 'desktop'
      });
    }
  }

  // Calculate luxury experience score
  private calculateLuxuryExperienceScore(metrics: EnrichedMetric[]): number {
    if (metrics.length === 0) return 0;

    // Luxury experience has stricter requirements
    const luxuryThresholds = {
      'LCP': 1600,   // 1.6 seconds
      'INP': 140,    // 140ms
      'CLS': 0.06,   // 0.06
      'TTFB': 500    // 500ms
    };

    let score = 100;
    metrics.forEach(metric => {
      const threshold = luxuryThresholds[metric.name as keyof typeof luxuryThresholds];
      if (threshold && metric.value > threshold) {
        const overage = metric.value - threshold;
        const penalty = Math.min((overage / threshold) * 50, 70); // Max 70 point penalty per metric
        score -= penalty;
      }
    });

    return Math.max(Math.round(score), 0);
  }

  // Calculate overall brand risk
  private calculateOverallBrandRisk(metrics: EnrichedMetric[]): number {
    if (metrics.length === 0) return 0;

    const brandRisks = metrics.map(m => {
      if (m.brandRisk === 'high') return 0.8;
      if (m.brandRisk === 'medium') return 0.4;
      return 0.1;
    });

    return Math.round((brandRisks.reduce((sum, risk) => sum + risk, 0) / brandRisks.length) * 100);
  }

  // Establish performance baseline
  private establishPerformanceBaseline(): void {
    setTimeout(() => {
      const pageType = this.getPageType();
      const pageMetrics = this.metrics.filter(m => m.pageType === pageType);

      if (pageMetrics.length > 0) {
        pageMetrics.forEach(metric => {
          const baselineKey = `${metric.name}_${pageType}`;
          const currentBaseline = this.performanceBaseline.get(baselineKey);

          if (!currentBaseline) {
            this.performanceBaseline.set(baselineKey, metric.value);
          }
        });
      }
    }, 5000); // Wait 5 seconds for initial metrics
  }

  // Report critical performance issue
  private reportCriticalPerformanceIssue(metricName: string, metric: EnrichedMetric): void {
    reportMessage(`Critical performance issue: ${metricName} - ${Math.round(metric.value)}ms on ${metric.pageType}`, 'error', {
      metric: metricName,
      value: metric.value,
      pageType: metric.pageType,
      deviceInfo: metric.deviceInfo,
      networkInfo: metric.networkInfo,
      conversionImpact: metric.conversionImpact,
      brandRisk: metric.brandRisk,
      recommendations: metric.recommendations
    });
  }

  // Send critical alert
  private async sendCriticalAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch('/api/performance/critical-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('[Core Web Vitals] Failed to send critical alert:', error);
    }
  }

  // Public API methods

  // Get current performance score
  getCurrentPerformanceScore(): number {
    const recentMetrics = this.metrics.slice(-10);
    return this.calculatePerformanceScore(recentMetrics);
  }

  // Get luxury experience score
  getLuxuryExperienceScore(): number {
    const pageType = this.getPageType();
    const pageMetrics = this.metrics.filter(m => m.pageType === pageType);
    return this.calculateLuxuryExperienceScore(pageMetrics);
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const recentMetrics = this.metrics.slice(-20);
    const currentScore = this.getCurrentPerformanceScore();
    const luxuryScore = this.getLuxuryExperienceScore();

    const metricsByType = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    const averages: Record<string, number> = {};
    Object.entries(metricsByType).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return {
      currentScore,
      luxuryScore,
      averages,
      recentAlerts: this.alerts.slice(-5),
      budgetViolations: Object.fromEntries(this.budgetViolations),
      pageType: this.getPageType(),
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo
    };
  }

  // Get all alerts
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  // Get alerts by level
  getAlertsByLevel(level: AlertLevel): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.level === level);
  }

  // Clear resolved alerts
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved);
  }

  // Enable/disable monitoring
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  // Export metrics for analysis
  exportMetrics(): any {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      performanceBaseline: Object.fromEntries(this.performanceBaseline),
      budgetViolations: Object.fromEntries(this.budgetViolations),
      summary: this.getPerformanceSummary()
    };
  }
}

// Create and export singleton instance
export const coreWebVitalsMonitor = CoreWebVitalsMonitor.getInstance();

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
export const initializeCoreWebVitalsMonitoring = () => coreWebVitalsMonitor.initialize();
export const getCurrentPerformanceScore = () => coreWebVitalsMonitor.getCurrentPerformanceScore();
export const getLuxuryExperienceScore = () => coreWebVitalsMonitor.getLuxuryExperienceScore();
export const getPerformanceSummary = () => coreWebVitalsMonitor.getPerformanceSummary();
export const getPerformanceAlerts = () => coreWebVitalsMonitor.getAlerts();
export const exportPerformanceData = () => coreWebVitalsMonitor.exportMetrics();

// Export types
export { PerformanceAlert, EnrichedMetric, PerformanceBudget, AlertLevel };