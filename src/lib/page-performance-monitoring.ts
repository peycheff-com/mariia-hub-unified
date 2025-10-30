/**
 * Page Performance Monitoring and Regression Detection
 * Comprehensive performance monitoring for luxury beauty and fitness platform
 */

import { trackRUMEvent } from './rum';
import { reportMessage } from './sentry';

// Performance monitoring configuration
interface PerformanceConfig {
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
  enableNavigationTiming: boolean;
  enablePaintTiming: boolean;
  enableLayoutShift: boolean;
  enableLongTaskMonitoring: boolean;
  regressionThreshold: number; // Percentage threshold for regression detection
  baselinePerformanceWindow: number; // Hours to establish baseline
  enableRealTimeMonitoring: boolean;
  performanceBudgets: PerformanceBudget[];
}

// Performance budget definitions
interface PerformanceBudget {
  metric: string;
  maxDuration: number; // milliseconds
  warningThreshold: number; // percentage of budget
  critical: boolean;
  category: 'loading' | 'interaction' | 'rendering' | 'network';
}

// Page performance metrics
interface PagePerformanceMetrics {
  navigation: NavigationTimingMetrics | null;
  paint: PaintTimingMetrics | null;
  resources: PerformanceResourceTiming[];
  userTiming: PerformanceMeasure[];
  layoutShift: PerformanceEntry[];
  longTasks: PerformanceEntry[];
  memory?: PerformanceMemory;
  vitals: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    TTFB?: number;
    FCP?: number;
    TTI?: number;
  };
  custom: Record<string, number>;
}

// Performance regression data
interface PerformanceRegression {
  metric: string;
  baseline: number;
  current: number;
  regressionPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  pageType: string;
  deviceInfo: any;
}

// Performance Monitor Class
export class PagePerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PagePerformanceMetrics;
  private baselines: Map<string, number[]> = new Map();
  private regressions: PerformanceRegression[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private performanceMarks: Map<string, number> = new Map();
  private pageLoadStartTime: number = 0;
  private routeChangeStartTime: number = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableResourceTiming: true,
      enableUserTiming: true,
      enableNavigationTiming: true,
      enablePaintTiming: true,
      enableLayoutShift: true,
      enableLongTaskMonitoring: true,
      regressionThreshold: 20, // 20% regression threshold
      baselinePerformanceWindow: 24, // 24 hours
      enableRealTimeMonitoring: true,
      performanceBudgets: this.getDefaultPerformanceBudgets(),
      ...config
    };

    this.metrics = this.initializeMetrics();
  }

  // Initialize metrics structure
  private initializeMetrics(): PagePerformanceMetrics {
    return {
      navigation: null,
      paint: null,
      resources: [],
      userTiming: [],
      layoutShift: [],
      longTasks: [],
      vitals: {},
      custom: {}
    };
  }

  // Initialize performance monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.pageLoadStartTime = performance.now();

      if (this.config.enableNavigationTiming) {
        this.initializeNavigationTiming();
      }

      if (this.config.enablePaintTiming) {
        this.initializePaintTiming();
      }

      if (this.config.enableResourceTiming) {
        this.initializeResourceTiming();
      }

      if (this.config.enableUserTiming) {
        this.initializeUserTiming();
      }

      if (this.config.enableLayoutShift) {
        this.initializeLayoutShiftMonitoring();
      }

      if (this.config.enableLongTaskMonitoring) {
        this.initializeLongTaskMonitoring();
      }

      this.initializeRouteChangeMonitoring();
      this.initializeMemoryMonitoring();
      this.initializePerformanceBudgets();
      this.initializeRegressionDetection();

      this.isInitialized = true;
      console.log('[Page Performance] Performance monitoring initialized');

      // Start collecting baseline data
      this.collectBaselineMetrics();
    } catch (error) {
      console.warn('[Page Performance] Failed to initialize:', error);
    }
  }

  // Initialize navigation timing
  private initializeNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          this.metrics.navigation = navigationEntries[0] as NavigationTimingMetrics;
          this.analyzeNavigationTiming();
        }
      }, 0);
    });
  }

  // Analyze navigation timing
  private analyzeNavigationTiming(): void {
    if (!this.metrics.navigation) return;

    const nav = this.metrics.navigation;
    const navigationData = {
      timestamp: Date.now(),
      domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
      loadComplete: nav.loadEventEnd - nav.navigationStart,
      firstByte: nav.responseStart - nav.requestStart,
      domInteractive: nav.domInteractive - nav.navigationStart,
      domComplete: nav.domComplete - nav.navigationStart,
      redirectTime: nav.redirectEnd - nav.redirectStart,
      dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
      connectTime: nav.connectEnd - nav.connectStart,
      sslTime: nav.connectEnd - nav.secureConnectionStart,
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo()
    };

    trackRUMEvent('navigation-timing', navigationData);

    // Check against performance budgets
    this.checkPerformanceBudget('navigation', navigationData.domContentLoaded, 'loading');
  }

  // Initialize paint timing
  private initializePaintTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            this.metrics.paint = entry as PaintTimingMetrics;
            this.analyzePaintTiming(entry as PerformancePaintTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    }
  }

  // Analyze paint timing
  private analyzePaintTiming(entry: PerformancePaintTiming): void {
    const paintData = {
      timestamp: Date.now(),
      name: entry.name,
      time: entry.startTime,
      pageType: this.getPageType()
    };

    trackRUMEvent('paint-timing', paintData);

    // Check paint performance
    if (entry.name === 'first-contentful-paint') {
      this.metrics.vitals.FCP = entry.startTime;
      this.checkPerformanceBudget('FCP', entry.startTime, 'loading');
    }
  }

  // Initialize resource timing
  private initializeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.metrics.resources.push(entry as PerformanceResourceTiming);
            this.analyzeResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // Analyze resource timing
  private analyzeResourceTiming(resource: PerformanceResourceTiming): void {
    const resourceData = {
      timestamp: Date.now(),
      name: resource.name,
      type: this.getResourceType(resource.name),
      duration: resource.duration,
      size: resource.transferSize,
      cached: resource.transferSize === 0,
      protocol: resource.nextHopProtocol,
      pageType: this.getPageType(),
      isCritical: this.isCriticalResource(resource.name)
    };

    trackRUMEvent('resource-timing', resourceData);

    // Check for slow resources
    if (resourceData.duration > 3000 && resourceData.isCritical) {
      this.reportPerformanceIssue({
        metric: 'resource-load',
        value: resourceData.duration,
        threshold: 3000,
        severity: 'high',
        description: `Critical resource loading slowly: ${resource.name}`,
        context: resourceData
      });
    }
  }

  // Get resource type
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/') || url.includes('supabase')) return 'api';
    return 'other';
  }

  // Check if resource is critical
  private isCriticalResource(url: string): boolean {
    // Critical resources for above-the-fold content
    if (url.includes('critical') || url.includes('above-fold')) return true;
    if (url.includes('bootstrap') || url.includes('main')) return true;
    if (url.includes('font')) return true; // Fonts are critical for text rendering
    return false;
  }

  // Initialize user timing
  private initializeUserTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            this.metrics.userTiming.push(entry as PerformanceMeasure);
            this.analyzeUserTiming(entry as PerformanceMeasure);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    }
  }

  // Analyze user timing
  private analyzeUserTiming(measure: PerformanceMeasure): void {
    const timingData = {
      timestamp: Date.now(),
      name: measure.name,
      duration: measure.duration,
      startTime: measure.startTime,
      pageType: this.getPageType()
    };

    trackRUMEvent('user-timing', timingData);

    // Store custom metric
    this.metrics.custom[measure.name] = measure.duration;

    // Check against custom performance budgets
    const budget = this.config.performanceBudgets.find(b => b.metric === measure.name);
    if (budget) {
      this.checkPerformanceBudget(measure.name, measure.duration, budget.category);
    }
  }

  // Initialize layout shift monitoring
  private initializeLayoutShiftMonitoring(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.metrics.layoutShift.push(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);

      // Report CLS on page unload
      window.addEventListener('beforeunload', () => {
        if (clsValue > 0) {
          this.metrics.vitals.CLS = clsValue;
          this.checkPerformanceBudget('CLS', clsValue, 'rendering');
        }
      });
    }
  }

  // Initialize long task monitoring
  private initializeLongTaskMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'longtask') {
            this.metrics.longTasks.push(entry);
            this.analyzeLongTask(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  // Analyze long task
  private analyzeLongTask(task: PerformanceEntry): void {
    const longTaskData = {
      timestamp: Date.now(),
      duration: task.duration,
      startTime: task.startTime,
      attribution: (task as any).attribution || [],
      pageType: this.getPageType()
    };

    trackRUMEvent('long-task', longTaskData);

    // Report significant long tasks
    if (task.duration > 100) {
      this.reportPerformanceIssue({
        metric: 'long-task',
        value: task.duration,
        threshold: 100,
        severity: task.duration > 200 ? 'high' : 'medium',
        description: `Long task detected: ${task.duration.toFixed(0)}ms`,
        context: longTaskData
      });
    }
  }

  // Initialize route change monitoring
  private initializeRouteChangeMonitoring(): void {
    // Override history methods to track route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.trackRouteChangeStart('pushState');
      const result = originalPushState.apply(history, args);
      this.trackRouteChangeEnd(args[2]);
      return result;
    };

    history.replaceState = (...args) => {
      this.trackRouteChangeStart('replaceState');
      const result = originalReplaceState.apply(history, args);
      this.trackRouteChangeEnd(args[2]);
      return result;
    };

    window.addEventListener('popstate', () => {
      this.trackRouteChangeStart('popstate');
      setTimeout(() => this.trackRouteChangeEnd(), 0);
    });
  }

  // Track route change start
  private trackRouteChangeStart(type: string): void {
    this.routeChangeStartTime = performance.now();
    this.markPerformance('route-change-start');
  }

  // Track route change end
  private trackRouteChangeEnd(path?: string): void {
    if (this.routeChangeStartTime === 0) return;

    const duration = performance.now() - this.routeChangeStartTime;
    this.markPerformance('route-change-end');

    const routeChangeData = {
      timestamp: Date.now(),
      duration: duration,
      path: path || window.location.pathname,
      pageType: this.getPageType(),
      fromPath: this.getCurrentPath()
    };

    trackRUMEvent('route-change', routeChangeData);

    // Check route change performance
    this.checkPerformanceBudget('route-change', duration, 'interaction');

    this.routeChangeStartTime = 0;
  }

  // Initialize memory monitoring
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;

        const memoryData = {
          timestamp: Date.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          pageType: this.getPageType()
        };

        trackRUMEvent('memory-usage', memoryData);

        // Check for memory leaks
        const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (memoryUsageRatio > 0.8) {
          this.reportPerformanceIssue({
            metric: 'memory-usage',
            value: memoryUsageRatio * 100,
            threshold: 80,
            severity: 'high',
            description: `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`,
            context: memoryData
          });
        }
      }, 30000); // Every 30 seconds
    }
  }

  // Initialize performance budgets
  private initializePerformanceBudgets(): void {
    // Check existing metrics against budgets
    setTimeout(() => {
      this.checkAllPerformanceBudgets();
    }, 5000);
  }

  // Get default performance budgets
  private getDefaultPerformanceBudgets(): PerformanceBudget[] {
    return [
      // Loading performance
      { metric: 'navigation', maxDuration: 3000, warningThreshold: 80, critical: true, category: 'loading' },
      { metric: 'FCP', maxDuration: 2000, warningThreshold: 75, critical: true, category: 'loading' },
      { metric: 'LCP', maxDuration: 2500, warningThreshold: 80, critical: true, category: 'loading' },
      { metric: 'TTFB', maxDuration: 800, warningThreshold: 75, critical: true, category: 'loading' },

      // Interaction performance
      { metric: 'route-change', maxDuration: 500, warningThreshold: 80, critical: false, category: 'interaction' },
      { metric: 'FID', maxDuration: 100, warningThreshold: 75, critical: true, category: 'interaction' },
      { metric: 'INP', maxDuration: 200, warningThreshold: 80, critical: true, category: 'interaction' },

      // Rendering performance
      { metric: 'CLS', maxDuration: 0.1, warningThreshold: 75, critical: true, category: 'rendering' },
      { metric: 'long-task', maxDuration: 50, warningThreshold: 75, critical: false, category: 'rendering' },

      // Network performance
      { metric: 'api-response', maxDuration: 1000, warningThreshold: 80, critical: false, category: 'network' },
      { metric: 'image-load', maxDuration: 2000, warningThreshold: 75, critical: false, category: 'network' }
    ];
  }

  // Initialize regression detection
  private initializeRegressionDetection(): void {
    // Set up periodic regression checks
    setInterval(() => {
      this.checkForRegressions();
    }, 60000); // Every minute

    // Check for regressions on page load
    window.addEventListener('load', () => {
      setTimeout(() => this.checkForRegressions(), 5000);
    });
  }

  // Collect baseline metrics
  private collectBaselineMetrics(): void {
    // Store current metrics as baseline
    this.storeMetricsBaseline();
  }

  // Store metrics baseline
  private storeMetricsBaseline(): void {
    const currentMetrics = this.getCurrentMetrics();

    Object.entries(currentMetrics).forEach(([metric, value]) => {
      if (!this.baselines.has(metric)) {
        this.baselines.set(metric, []);
      }

      const baseline = this.baselines.get(metric)!;
      baseline.push(value);

      // Keep only last 100 measurements for baseline
      if (baseline.length > 100) {
        baseline.shift();
      }
    });
  }

  // Get current metrics
  private getCurrentMetrics(): Record<string, number> {
    const current: Record<string, number> = {};

    // Navigation metrics
    if (this.metrics.navigation) {
      current['domContentLoaded'] = this.metrics.navigation.domContentLoadedEventEnd - this.metrics.navigation.navigationStart;
      current['loadComplete'] = this.metrics.navigation.loadEventEnd - this.metrics.navigation.navigationStart;
      current['firstByte'] = this.metrics.navigation.responseStart - this.metrics.navigation.requestStart;
    }

    // Paint metrics
    if (this.metrics.paint) {
      current['firstContentfulPaint'] = this.metrics.paint.startTime;
    }

    // Core Web Vitals
    Object.entries(this.metrics.vitals).forEach(([vital, value]) => {
      if (value !== undefined) {
        current[vital] = value;
      }
    });

    // Custom metrics
    Object.entries(this.metrics.custom).forEach(([metric, value]) => {
      current[metric] = value;
    });

    return current;
  }

  // Check for regressions
  private checkForRegressions(): void {
    const currentMetrics = this.getCurrentMetrics();

    Object.entries(currentMetrics).forEach(([metric, currentValue]) => {
      const baseline = this.baselines.get(metric);
      if (!baseline || baseline.length < 5) return; // Need at least 5 data points for baseline

      const baselineAverage = baseline.reduce((sum, val) => sum + val, 0) / baseline.length;
      const regressionPercentage = ((currentValue - baselineAverage) / baselineAverage) * 100;

      if (regressionPercentage > this.config.regressionThreshold) {
        this.reportRegression(metric, baselineAverage, currentValue, regressionPercentage);
      }
    });
  }

  // Report regression
  private reportRegression(metric: string, baseline: number, current: number, regressionPercentage: number): void {
    const regression: PerformanceRegression = {
      metric: metric,
      baseline: baseline,
      current: current,
      regressionPercentage: regressionPercentage,
      severity: this.getRegressionSeverity(regressionPercentage),
      timestamp: Date.now(),
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo()
    };

    this.regressions.push(regression);

    // Track regression event
    trackRUMEvent('performance-regression', regression);

    // Report significant regressions
    if (regression.severity === 'high' || regression.severity === 'critical') {
      reportMessage(`Performance regression detected: ${metric}`, 'warning', regression);
    }
  }

  // Get regression severity
  private getRegressionSeverity(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage > 100) return 'critical';
    if (percentage > 50) return 'high';
    if (percentage > 30) return 'medium';
    return 'low';
  }

  // Check performance budget
  private checkPerformanceBudget(metric: string, value: number, category: string): void {
    const budget = this.config.performanceBudgets.find(b => b.metric === metric);
    if (!budget) return;

    const budgetPercentage = (value / budget.maxDuration) * 100;
    const isOverBudget = value > budget.maxDuration;
    const isOverWarning = budgetPercentage > budget.warningThreshold;

    const budgetData = {
      timestamp: Date.now(),
      metric: metric,
      value: value,
      budget: budget.maxDuration,
      budgetPercentage: budgetPercentage,
      isOverBudget: isOverBudget,
      isOverWarning: isOverWarning,
      category: category,
      critical: budget.critical,
      pageType: this.getPageType()
    };

    trackRUMEvent('performance-budget-check', budgetData);

    if (isOverBudget && budget.critical) {
      this.reportPerformanceIssue({
        metric: metric,
        value: value,
        threshold: budget.maxDuration,
        severity: 'high',
        description: `Performance budget exceeded: ${metric} (${value.toFixed(0)}ms > ${budget.maxDuration}ms)`,
        context: budgetData
      });
    } else if (isOverWarning) {
      this.reportPerformanceIssue({
        metric: metric,
        value: value,
        threshold: budget.maxDuration,
        severity: 'medium',
        description: `Performance budget warning: ${metric} (${value.toFixed(0)}ms > ${budget.maxDuration * budget.warningThreshold / 100}ms)`,
        context: budgetData
      });
    }
  }

  // Check all performance budgets
  private checkAllPerformanceBudgets(): void {
    const currentMetrics = this.getCurrentMetrics();

    this.config.performanceBudgets.forEach(budget => {
      const value = currentMetrics[budget.metric];
      if (value !== undefined) {
        this.checkPerformanceBudget(budget.metric, value, budget.category);
      }
    });
  }

  // Report performance issue
  private reportPerformanceIssue(issue: {
    metric: string;
    value: number;
    threshold: number;
    severity: string;
    description: string;
    context: any;
  }): void {
    const performanceIssue = {
      timestamp: Date.now(),
      metric: issue.metric,
      value: issue.value,
      threshold: issue.threshold,
      severity: issue.severity,
      description: issue.description,
      context: issue.context,
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo()
    };

    trackRUMEvent('performance-issue', performanceIssue);

    if (issue.severity === 'high' || issue.severity === 'critical') {
      reportMessage(`Performance issue: ${issue.description}`, 'warning', performanceIssue);
    }
  }

  // Performance marking utilities
  markPerformance(name: string): void {
    this.performanceMarks.set(name, performance.now());
    performance.mark(name);
  }

  measurePerformance(name: string, startMark?: string): number {
    const startTime = startMark ? this.performanceMarks.get(startMark) : 0;
    const duration = performance.now() - startTime;

    performance.measure(name, startMark);
    this.metrics.custom[name] = duration;

    return duration;
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

  private getCurrentPath(): string {
    return window.location.pathname;
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  // Public API methods

  // Get performance metrics
  getPerformanceMetrics(): PagePerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const currentMetrics = this.getCurrentMetrics();
    const budgetStatus = this.checkAllBudgets();

    return {
      timestamp: Date.now(),
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo(),
      metrics: currentMetrics,
      budgets: budgetStatus,
      regressions: this.regressions.slice(-10), // Last 10 regressions
      overallScore: this.calculateOverallPerformanceScore(currentMetrics),
      baselineStatus: this.getBaselineStatus()
    };
  }

  // Check all budgets status
  private checkAllBudgets(): any {
    const currentMetrics = this.getCurrentMetrics();
    const budgetStatus: any = {
      passed: [],
      warning: [],
      failed: [],
      critical: []
    };

    this.config.performanceBudgets.forEach(budget => {
      const value = currentMetrics[budget.metric];
      if (value === undefined) return;

      const budgetPercentage = (value / budget.maxDuration) * 100;
      const status = this.getBudgetStatus(budgetPercentage, budget.warningThreshold, budget.critical);

      const budgetInfo = {
        metric: budget.metric,
        value: value,
        budget: budget.maxDuration,
        percentage: budgetPercentage,
        category: budget.category,
        critical: budget.critical
      };

      budgetStatus[status].push(budgetInfo);
    });

    return budgetStatus;
  }

  // Get budget status
  private getBudgetStatus(percentage: number, warningThreshold: number, critical: boolean): string {
    if (percentage > 100) return critical ? 'critical' : 'failed';
    if (percentage > warningThreshold) return 'warning';
    return 'passed';
  }

  // Get baseline status
  private getBaselineStatus(): any {
    const baselineStatus: any = {};

    this.baselines.forEach((values, metric) => {
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const current = this.getCurrentMetrics()[metric];

        baselineStatus[metric] = {
          baseline: average,
          current: current,
          samples: values.length,
          trend: current ? ((current - average) / average) * 100 : 0
        };
      }
    });

    return baselineStatus;
  }

  // Calculate overall performance score
  private calculateOverallPerformanceScore(metrics: Record<string, number>): number {
    const weights: Record<string, number> = {
      LCP: 0.25,
      FID: 0.20,
      CLS: 0.20,
      FCP: 0.15,
      TTFB: 0.10,
      navigation: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = metrics[metric];
      if (value !== undefined) {
        const budget = this.config.performanceBudgets.find(b => b.metric === metric);
        if (budget) {
          const score = Math.max(0, Math.min(100, (1 - (value / budget.maxDuration)) * 100));
          totalScore += score * weight;
          totalWeight += weight;
        }
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // Get regression analysis
  getRegressionAnalysis(): any {
    const recentRegressions = this.regressions.slice(-20);
    const regressionsByMetric = new Map<string, PerformanceRegression[]>();

    recentRegressions.forEach(regression => {
      if (!regressionsByMetric.has(regression.metric)) {
        regressionsByMetric.set(regression.metric, []);
      }
      regressionsByMetric.get(regression.metric)!.push(regression);
    });

    return {
      totalRegressions: this.regressions.length,
      recentRegressions: recentRegressions,
      regressionsByMetric: Object.fromEntries(regressionsByMetric),
      criticalRegressions: recentRegressions.filter(r => r.severity === 'critical').length,
      highRegressions: recentRegressions.filter(r => r.severity === 'high').length,
      mostProblematicMetrics: this.getMostProblematicMetrics(regressionsByMetric)
    };
  }

  // Get most problematic metrics
  private getMostProblematicMetrics(regressionsByMetric: Map<string, PerformanceRegression[]>): string[] {
    const metricsWithRegressions: Array<{ metric: string; count: number; avgRegression: number }> = [];

    regressionsByMetric.forEach((regressions, metric) => {
      const avgRegression = regressions.reduce((sum, r) => sum + r.regressionPercentage, 0) / regressions.length;
      metricsWithRegressions.push({
        metric,
        count: regressions.length,
        avgRegression
      });
    });

    return metricsWithRegressions
      .sort((a, b) => b.avgRegression - a.avgRegression)
      .slice(0, 5)
      .map(m => m.metric);
  }

  // Add custom performance budget
  addPerformanceBudget(budget: PerformanceBudget): void {
    this.config.performanceBudgets.push(budget);
  }

  // Update performance budget
  updatePerformanceBudget(metric: string, budget: Partial<PerformanceBudget>): void {
    const existingBudget = this.config.performanceBudgets.find(b => b.metric === metric);
    if (existingBudget) {
      Object.assign(existingBudget, budget);
    }
  }

  // Clear all data
  clearData(): void {
    this.metrics = this.initializeMetrics();
    this.regressions = [];
    this.performanceMarks.clear();
  }

  // Disconnect monitoring
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Type definitions
interface PerformanceBudget {
  metric: string;
  maxDuration: number;
  warningThreshold: number;
  critical: boolean;
  category: 'loading' | 'interaction' | 'rendering' | 'network';
}

// Create and export singleton instance
export const pagePerformanceMonitor = new PagePerformanceMonitor();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    pagePerformanceMonitor.initialize();
  } else {
    window.addEventListener('load', () => {
      pagePerformanceMonitor.initialize();
    });
  }
}

// Export helper functions
export const initializePagePerformanceMonitoring = () => pagePerformanceMonitor.initialize();
export const getPerformanceMetrics = () => pagePerformanceMonitor.getPerformanceMetrics();
export const getPerformanceSummary = () => pagePerformanceMonitor.getPerformanceSummary();
export const getRegressionAnalysis = () => pagePerformanceMonitor.getRegressionAnalysis();
export const markPerformance = (name: string) => pagePerformanceMonitor.markPerformance(name);
export const measurePerformance = (name: string, startMark?: string) => pagePerformanceMonitor.measurePerformance(name, startMark);

// Export types
export { PagePerformanceMetrics, PerformanceRegression, PerformanceBudget };