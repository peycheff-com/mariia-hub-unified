// Mobile Performance Analytics with Crash Reporting and Optimization Monitoring
// Comprehensive performance monitoring for mobile apps and web

import type {
  AppPerformance,
  DeviceInfo,
  AnalyticsEvent
} from '@/types/mobile-analytics';

import type {
  CrossPlatformAnalytics,
  UnifiedAnalyticsEvent,
  PerformanceMonitor
} from './core';

export interface PerformanceAnalyticsConfig {
  // Core Performance Monitoring
  enableCoreWebVitals: boolean;
  enableRenderPerformance: boolean;
  enableNetworkPerformance: boolean;
  enableMemoryMonitoring: boolean;
  enableBatteryMonitoring: boolean;
  enableCPUMonitoring: boolean;

  // Crash and Error Reporting
  enableCrashReporting: boolean;
  enableANRMonitoring: boolean; // Application Not Responding
  enableJavaScriptErrorTracking: boolean;
  enableNetworkErrorTracking: boolean;
  enablePromiseRejectionTracking: boolean;

  // Resource Monitoring
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
  enableLongTaskMonitoring: boolean;
  enableLayoutShiftMonitoring: boolean;

  // Mobile-Specific Performance
  enableAppLaunchTime: boolean;
  enableScreenPerformance: boolean;
  enableDatabasePerformance: boolean;
  enableFileSystemPerformance: boolean;

  // Real-time Monitoring
  enableRealTimeMonitoring: boolean;
  enablePerformanceBudgets: boolean;
  enablePerformanceAlerts: boolean;

  // Sampling and Collection
  performanceSampleRate: number; // 0-1
  crashSampleRate: number; // 0-1
  longTaskThreshold: number; // milliseconds
  memoryThreshold: number; // MB
  batteryThreshold: number; // percentage

  // Performance Budgets
  budgets: {
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number; // ms
    firstInputDelay: number; // ms
    cumulativeLayoutShift: number;
    timeToInteractive: number; // ms
    memoryUsage: number; // MB
    bundleSize: number; // KB
    apiResponseTime: number; // ms
  };
}

export interface PerformanceMetrics {
  // Core Web Vitals
  coreWebVitals: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToFirstByte: number;
    firstMeaningfulPaint?: number;
    speedIndex?: number;
    interactionToNextPaint?: number;
  };

  // Navigation Timing
  navigationTiming: {
    domContentLoaded: number;
    loadEvent: number;
    domInteractive: number;
    domComplete: number;
    redirectTime: number;
    dnsLookupTime: number;
    tcpConnectTime: number;
    sslTime: number;
    requestTime: number;
    responseTime: number;
    processingTime: number;
  };

  // Resource Performance
  resourcePerformance: {
    totalResources: number;
    totalSize: number; // bytes
    cachedResources: number;
    failedResources: number;
    slowResources: ResourcePerformanceEntry[];
    largestResources: ResourcePerformanceEntry[];
    criticalResources: ResourcePerformanceEntry[];
  };

  // Network Performance
  networkPerformance: {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    slowRequests: NetworkRequestEntry[];
    retryCount: number;
    timeoutCount: number;
    offlineRequests: number;
    bandwidthEstimate?: number; // Mbps
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };

  // Runtime Performance
  runtimePerformance: {
    longTasks: LongTaskEntry[];
    totalBlockingTime: number;
    scriptExecutionTime: number;
    renderingTime: number;
    paintingTime: number;
    styleRecalculationTime: number;
    layoutTime: number;
  };

  // Memory Usage
  memoryUsage: {
    usedJSHeapSize: number; // MB
    totalJSHeapSize: number; // MB
    jsHeapSizeLimit: number; // MB
    memoryPressure: 'low' | 'medium' | 'high' | 'critical';
    memoryGrowthRate: number; // MB per minute
    gcPauses: GCPauseEntry[];
  };

  // Battery and Power
  batteryUsage: {
    level: number; // 0-1
    charging: boolean;
    dischargingTime: number; // seconds
    powerConsumption: number; // estimated mW
    thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
    batteryDrainRate: number; // percentage per hour
  };

  // Mobile App Performance
  appPerformance?: {
    launchTime: number;
    coldStart: number;
    warmStart: number;
    hotStart: number;
    firstRenderTime: number;
    timeToInteractive: number;
    jsBundleLoadTime: number;
    nativeModuleLoadTime: number;
    screenTransitionTime: number;
    databaseQueryTime: number;
    fileSystemAccessTime: number;
  };

  // User Experience Metrics
  userExperience: {
    totalBlockingTime: number;
    interactionLatency: InteractionLatencyEntry[];
    scrollPerformance: ScrollPerformanceEntry[];
    tapResponseTime: number;
    gestureResponseTime: number;
    animationPerformance: AnimationPerformanceEntry[];
  };

  // Errors and Crashes
  errorMetrics: {
    javascriptErrors: JSErrorEntry[];
    networkErrors: NetworkErrorEntry[];
    promiseRejections: PromiseRejectionEntry[];
    unhandledErrors: JSErrorEntry[];
    resourceLoadErrors: ResourceErrorEntry[];
    anrCount: number;
    crashCount: number;
    errorRate: number; // errors per minute
  };

  // Timestamp and Metadata
  timestamp: string;
  sessionId?: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  pageUrl?: string;
  appVersion?: string;
}

export interface ResourcePerformanceEntry {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
  startTime: number;
  responseEnd: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface NetworkRequestEntry {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  success: boolean;
  retryCount: number;
  timeout: boolean;
  cached: boolean;
  protocol: string;
  serverTiming?: any;
}

export interface LongTaskEntry {
  duration: number;
  startTime: number;
  attribution: Array<{
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
  }>;
}

export interface GCPauseEntry {
  duration: number;
  type: 'minor' | 'major';
  timestamp: number;
  heapSizeBefore: number;
  heapSizeAfter: number;
}

export interface InteractionLatencyEntry {
  type: 'click' | 'tap' | 'scroll' | 'keyboard';
  duration: number;
  startTime: number;
  target: string;
  processingTime: number;
    presentationTime: number;
}

export interface ScrollPerformanceEntry {
  scrollType: 'vertical' | 'horizontal';
  distance: number;
  duration: number;
  fps: number;
  jankFrames: number;
  startTime: number;
}

export interface AnimationPerformanceEntry {
  name: string;
  type: 'css' | 'js' | 'canvas';
  duration: number;
  frames: number;
  droppedFrames: number;
  averageFPS: number;
  startTime: number;
}

export interface JSErrorEntry {
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  stack: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  context?: any;
}

export interface NetworkErrorEntry {
  url: string;
  method: string;
  status: number;
  error: string;
  timestamp: number;
  retryCount: number;
  timeout: boolean;
  aborted: boolean;
  corsError?: boolean;
}

export interface PromiseRejectionEntry {
  reason: string;
  stack?: string;
  timestamp: number;
  handled: boolean;
  promise?: any;
  userId?: string;
  sessionId?: string;
}

export interface ResourceErrorEntry {
  url: string;
  type: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export interface PerformanceBudget {
  name: string;
  metric: string;
  threshold: number;
  current: number;
  status: 'pass' | 'warn' | 'fail';
  percentage: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'regression' | 'spike' | 'pattern';
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  context?: any;
  resolved: boolean;
  resolvedAt?: string;
}

export class MobilePerformanceAnalytics implements PerformanceMonitor {
  private analytics: CrossPlatformAnalytics;
  private config: PerformanceAnalyticsConfig;
  private isMonitoring = false;
  private metrics: PerformanceMetrics;
  private performanceObserver: PerformanceObserver | null = null;
  private longTaskObserver: PerformanceObserver | null = null;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private batteryMonitorInterval: NodeJS.Timeout | null = null;
  private networkMonitorInterval: NodeJS.Timeout | null = null;
  private errorBuffer: any[] = [];
  private performanceBudgets: Map<string, PerformanceBudget> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();

  constructor(analytics: CrossPlatformAnalytics, config: PerformanceAnalyticsConfig) {
    this.analytics = analytics;
    this.config = config;

    this.metrics = this.initializeMetrics();
    this.setupPerformanceBudgets();
  }

  startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Setup performance observers
    this.setupPerformanceObservers();

    // Setup resource monitoring
    this.setupResourceMonitoring();

    // Setup memory monitoring
    this.setupMemoryMonitoring();

    // Setup battery monitoring
    this.setupBatteryMonitoring();

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Setup error tracking
    this.setupErrorTracking();

    // Setup periodic metrics collection
    this.setupPeriodicCollection();

    console.log('Performance monitoring started');
  }

  stopPerformanceMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Disconnect observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }

    // Clear intervals
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }

    if (this.batteryMonitorInterval) {
      clearInterval(this.batteryMonitorInterval);
      this.batteryMonitorInterval = null;
    }

    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  recordMetric(name: string, value: number, unit?: string): void {
    this.metrics.runtimePerformance.scriptExecutionTime += value;

    this.analytics.trackEvent({
      name: 'custom_performance_metric',
      category: 'performance',
      action: 'measure',
      label: name,
      value: Math.round(value),
      properties: {
        metricName: name,
        value,
        unit: unit || 'ms'
      },
      metrics: {
        [name]: value
      }
    });
  }

  recordCustomTiming(name: string, duration: number): void {
    this.recordMetric(name, duration, 'ms');
  }

  recordError(error: Error, context?: any): void {
    const errorEntry: JSErrorEntry = {
      message: error.message,
      filename: (error as any).filename || 'unknown',
      lineno: (error as any).lineno || 0,
      colno: (error as any).colno || 0,
      stack: error.stack || 'No stack trace available',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    this.metrics.errorMetrics.javascriptErrors.push(errorEntry);
    this.errorBuffer.push(errorEntry);

    // Track error event
    this.analytics.trackEvent({
      name: 'javascript_error',
      category: 'error',
      action: 'javascript_error',
      properties: {
        errorMessage: error.message,
        filename: errorEntry.filename,
        lineno: errorEntry.lineno,
        stack: error.stack,
        context
      },
      dimensions: {
        error_type: 'javascript',
        error_file: errorEntry.filename
      }
    });

    // Check if we need to flush error buffer
    if (this.errorBuffer.length >= 10) {
      this.flushErrorBuffer();
    }
  }

  recordCrash(crashReport: any): void {
    this.metrics.errorMetrics.crashCount++;

    this.analytics.trackEvent({
      name: 'app_crash',
      category: 'error',
      action: 'crash',
      properties: {
        crashReport,
        timestamp: new Date().toISOString(),
        appVersion: this.config.appVersion
      },
      dimensions: {
        crash_type: crashReport.type || 'unknown',
        app_version: this.config.appVersion
      }
    });
  }

  async getMetrics(): Promise<AppPerformance> {
    // Update current metrics
    await this.updateCurrentMetrics();

    return {
      coreWebVitals: this.metrics.coreWebVitals,
      appPerformance: this.metrics.appPerformance,
      resources: this.metrics.resourcePerformance,
      network: this.metrics.networkPerformance,
      system: {
        memoryUsage: this.metrics.memoryUsage.usedJSHeapSize,
        memoryPressure: this.metrics.memoryUsage.memoryPressure,
        cpuUsage: 0, // Would need separate monitoring
        batteryLevel: this.metrics.batteryUsage.level * 100,
        thermalState: this.metrics.batteryUsage.thermalState
      },
      errors: this.metrics.errorMetrics,
      userExperience: this.metrics.userExperience,
      timestamp: this.metrics.timestamp,
      sampleRate: this.config.performanceSampleRate
    };
  }

  async generatePerformanceReport(): Promise<any> {
    const currentMetrics = await this.getMetrics();
    const budgets = Array.from(this.performanceBudgets.values());
    const alerts = Array.from(this.alerts.values());

    return {
      summary: {
        overallScore: this.calculatePerformanceScore(currentMetrics),
        coreWebVitalsScore: this.calculateCoreWebVitalsScore(currentMetrics.coreWebVitals),
        budgetCompliance: budgets.filter(b => b.status === 'pass').length / budgets.length,
        activeAlerts: alerts.filter(a => !a.resolved).length,
        lastUpdated: new Date().toISOString()
      },
      metrics: currentMetrics,
      budgets: budgets,
      alerts: alerts,
      recommendations: this.generateRecommendations(currentMetrics),
      trends: this.getPerformanceTrends()
    };
  }

  // Private implementation methods
  private initializeMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToFirstByte: 0
      },
      navigationTiming: {
        domContentLoaded: 0,
        loadEvent: 0,
        domInteractive: 0,
        domComplete: 0,
        redirectTime: 0,
        dnsLookupTime: 0,
        tcpConnectTime: 0,
        sslTime: 0,
        requestTime: 0,
        responseTime: 0,
        processingTime: 0
      },
      resourcePerformance: {
        totalResources: 0,
        totalSize: 0,
        cachedResources: 0,
        failedResources: 0,
        slowResources: [],
        largestResources: [],
        criticalResources: []
      },
      networkPerformance: {
        totalRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        slowRequests: [],
        retryCount: 0,
        timeoutCount: 0,
        offlineRequests: 0,
        connectionQuality: 'good'
      },
      runtimePerformance: {
        longTasks: [],
        totalBlockingTime: 0,
        scriptExecutionTime: 0,
        renderingTime: 0,
        paintingTime: 0,
        styleRecalculationTime: 0,
        layoutTime: 0
      },
      memoryUsage: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        memoryPressure: 'low',
        memoryGrowthRate: 0,
        gcPauses: []
      },
      batteryUsage: {
        level: 1,
        charging: false,
        dischargingTime: Infinity,
        powerConsumption: 0,
        thermalState: 'nominal',
        batteryDrainRate: 0
      },
      userExperience: {
        totalBlockingTime: 0,
        interactionLatency: [],
        scrollPerformance: [],
        tapResponseTime: 0,
        gestureResponseTime: 0,
        animationPerformance: []
      },
      errorMetrics: {
        javascriptErrors: [],
        networkErrors: [],
        promiseRejections: [],
        unhandledErrors: [],
        resourceLoadErrors: [],
        anrCount: 0,
        crashCount: 0,
        errorRate: 0
      },
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo()
    };
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Core Web Vitals observer
    if (this.config.enableCoreWebVitals) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    }

    // Long task observer
    if (this.config.enableLongTaskMonitoring) {
      this.longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processLongTask(entry as PerformanceEntry);
        }
      });

      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  private setupResourceMonitoring(): void {
    if (!this.config.enableResourceTiming) return;

    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.processResourceEntry(entry as PerformanceResourceTiming);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private setupMemoryMonitoring(): void {
    if (!this.config.enableMemoryMonitoring) return;

    this.memoryMonitorInterval = setInterval(() => {
      this.collectMemoryMetrics();
    }, 5000); // Every 5 seconds

    // Monitor garbage collection if available
    if ('gc' in performance) {
      (performance as any).addEventListener('gc', (event: any) => {
        this.processGCEvent(event);
      });
    }
  }

  private setupBatteryMonitoring(): void {
    if (!this.config.enableBatteryMonitoring) return;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryMonitorInterval = setInterval(() => {
          this.collectBatteryMetrics(battery);
        }, 30000); // Every 30 seconds

        // Listen for battery events
        battery.addEventListener('levelchange', () => {
          this.collectBatteryMetrics(battery);
        });

        battery.addEventListener('chargingchange', () => {
          this.collectBatteryMetrics(battery);
        });
      });
    }
  }

  private setupNetworkMonitoring(): void {
    if (!this.config.enableNetworkPerformance) return;

    this.networkMonitorInterval = setInterval(() => {
      this.collectNetworkMetrics();
    }, 10000); // Every 10 seconds

    // Monitor network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.collectNetworkMetrics();
      });
    }
  }

  private setupErrorTracking(): void {
    // JavaScript errors
    if (this.config.enableJavaScriptErrorTracking) {
      window.addEventListener('error', (event) => {
        this.recordError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
    }

    // Promise rejections
    if (this.config.enablePromiseRejectionTracking) {
      window.addEventListener('unhandledrejection', (event) => {
        const rejectionEntry: PromiseRejectionEntry = {
          reason: event.reason?.toString() || 'Unknown promise rejection',
          stack: event.reason?.stack,
          timestamp: Date.now(),
          handled: false
        };

        this.metrics.errorMetrics.promiseRejections.push(rejectionEntry);

        this.analytics.trackEvent({
          name: 'promise_rejection',
          category: 'error',
          action: 'unhandled_rejection',
          properties: {
            reason: rejectionEntry.reason,
            stack: rejectionEntry.stack
          }
        });
      });
    }

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const resourceError: ResourceErrorEntry = {
          url: (target as any).src || (target as any).href || 'unknown',
          type: target.tagName.toLowerCase(),
          error: event.error?.toString() || 'Resource loading failed',
          timestamp: Date.now(),
          retryCount: 0
        };

        this.metrics.errorMetrics.resourceLoadErrors.push(resourceError);
      }
    }, true);
  }

  private setupPeriodicCollection(): void {
    // Collect comprehensive metrics every minute
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.collectComprehensiveMetrics();
      }
    }, 60000);
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.processLCPEntry(entry as any);
        break;
      case 'first-input':
        this.processFIDEntry(entry as any);
        break;
      case 'layout-shift':
        this.processLayoutShiftEntry(entry as any);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.navigationTiming = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadEvent: entry.loadEventEnd - entry.navigationStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      domComplete: entry.domComplete - entry.navigationStart,
      redirectTime: entry.redirectEnd - entry.redirectStart,
      dnsLookupTime: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnectTime: entry.connectEnd - entry.connectStart,
      sslTime: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      requestTime: entry.responseStart - entry.requestStart,
      responseTime: entry.responseEnd - entry.responseStart,
      processingTime: entry.domComplete - entry.responseEnd
    };

    this.metrics.coreWebVitals.timeToFirstByte = entry.responseStart - entry.navigationStart;
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.coreWebVitals.firstContentfulPaint = entry.startTime;
    }
  }

  private processLCPEntry(entry: any): void {
    this.metrics.coreWebVitals.largestContentfulPaint = entry.startTime;
  }

  private processFIDEntry(entry: any): void {
    this.metrics.coreWebVitals.firstInputDelay = entry.processingStart - entry.startTime;
  }

  private processLayoutShiftEntry(entry: any): void {
    if (!entry.hadRecentInput) {
      this.metrics.coreWebVitals.cumulativeLayoutShift += entry.value;
    }
  }

  private processLongTask(entry: PerformanceEntry): void {
    const longTask: LongTaskEntry = {
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: (entry as any).attribution || []
    };

    this.metrics.runtimePerformance.longTasks.push(longTask);
    this.metrics.runtimePerformance.totalBlockingTime += entry.duration;

    // Check against budget
    if (entry.duration > this.config.longTaskThreshold) {
      this.checkPerformanceBudget('longTask', entry.duration, this.config.longTaskThreshold);
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceEntry: ResourcePerformanceEntry = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.responseEnd - entry.startTime,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize
    };

    this.metrics.resourcePerformance.totalResources++;
    this.metrics.resourcePerformance.totalSize += resourceEntry.size;

    if (resourceEntry.cached) {
      this.metrics.resourcePerformance.cachedResources++;
    }

    if (resourceEntry.duration > 2000) { // Slow resource threshold
      this.metrics.resourcePerformance.slowResources.push(resourceEntry);
    }

    // Track network performance
    if (this.config.enableNetworkPerformance) {
      this.trackNetworkRequest(entry.name, 'GET', entry.responseEnd - entry.startTime, 200, resourceEntry.size);
    }
  }

  private processGCEvent(event: any): void {
    const gcPause: GCPauseEntry = {
      duration: event.duration || 0,
      type: event.type || 'minor',
      timestamp: Date.now(),
      heapSizeBefore: event.usedHeapSizeBefore || 0,
      heapSizeAfter: event.usedHeapSizeAfter || 0
    };

    this.metrics.memoryUsage.gcPauses.push(gcPause);
  }

  private collectMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedHeapSize = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

      this.metrics.memoryUsage = {
        usedJSHeapSize: usedHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
        jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024),
        memoryPressure: this.calculateMemoryPressure(usedHeapSize),
        memoryGrowthRate: this.calculateMemoryGrowthRate(usedHeapSize),
        gcPauses: this.metrics.memoryUsage.gcPauses
      };

      // Check against memory budget
      if (usedHeapSize > this.config.memoryThreshold) {
        this.checkPerformanceBudget('memoryUsage', usedHeapSize, this.config.memoryThreshold);
      }
    }
  }

  private collectBatteryMetrics(battery: any): void {
    const level = battery.level;
    const charging = battery.charging;
    const dischargingTime = battery.dischargingTime;

    this.metrics.batteryUsage = {
      level,
      charging,
      dischargingTime,
      powerConsumption: this.estimatePowerConsumption(),
      thermalState: this.getThermalState(),
      batteryDrainRate: this.calculateBatteryDrainRate(level)
    };

    // Check against battery budget
    if (level < this.config.batteryThreshold / 100) {
      this.checkPerformanceBudget('batteryLevel', level * 100, this.config.batteryThreshold);
    }
  }

  private collectNetworkMetrics(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;
      const rtt = connection.rtt;

      // Update connection quality
      this.metrics.networkPerformance.connectionQuality = this.getConnectionQuality(effectiveType, downlink, rtt);

      // Track bandwidth estimate
      if (downlink) {
        this.metrics.networkPerformance.bandwidthEstimate = downlink;
      }
    }
  }

  private collectComprehensiveMetrics(): Promise<void> {
    return new Promise((resolve) => {
      // Collect all current metrics
      this.updateCurrentMetrics().then(() => {
        // Check performance budgets
        this.checkAllPerformanceBudgets();

        // Generate alerts if needed
        this.generatePerformanceAlerts();

        resolve();
      });
    });
  }

  private async updateCurrentMetrics(): Promise<void> {
    this.metrics.timestamp = new Date().toISOString();

    // Update user experience metrics
    this.metrics.userExperience.totalBlockingTime = this.metrics.runtimePerformance.totalBlockingTime;

    // Calculate error rate
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const recentErrors = [
      ...this.metrics.errorMetrics.javascriptErrors,
      ...this.metrics.errorMetrics.networkErrors,
      ...this.metrics.errorMetrics.promiseRejections
    ].filter(error => now - error.timestamp < timeWindow);

    this.metrics.errorMetrics.errorRate = recentErrors.length / (timeWindow / (60 * 1000)); // errors per minute

    // Update network performance averages
    this.updateNetworkPerformanceAverages();
  }

  private updateNetworkPerformanceAverages(): void {
    if (this.metrics.networkPerformance.totalRequests > 0) {
      const totalTime = this.metrics.networkPerformance.slowRequests.reduce((sum, req) => sum + req.duration, 0);
      this.metrics.networkPerformance.averageResponseTime = totalTime / this.metrics.networkPerformance.totalRequests;
    }
  }

  private setupPerformanceBudgets(): void {
    const budgets = this.config.budgets;

    this.performanceBudgets.set('firstContentfulPaint', {
      name: 'First Contentful Paint',
      metric: 'firstContentfulPaint',
      threshold: budgets.firstContentfulPaint,
      current: 0,
      status: 'pass',
      percentage: 0,
      impact: 'high'
    });

    this.performanceBudgets.set('largestContentfulPaint', {
      name: 'Largest Contentful Paint',
      metric: 'largestContentfulPaint',
      threshold: budgets.largestContentfulPaint,
      current: 0,
      status: 'pass',
      percentage: 0,
      impact: 'high'
    });

    this.performanceBudgets.set('firstInputDelay', {
      name: 'First Input Delay',
      metric: 'firstInputDelay',
      threshold: budgets.firstInputDelay,
      current: 0,
      status: 'pass',
      percentage: 0,
      impact: 'medium'
    });

    this.performanceBudgets.set('cumulativeLayoutShift', {
      name: 'Cumulative Layout Shift',
      metric: 'cumulativeLayoutShift',
      threshold: budgets.cumulativeLayoutShift,
      current: 0,
      status: 'pass',
      percentage: 0,
      impact: 'high'
    });

    this.performanceBudgets.set('memoryUsage', {
      name: 'Memory Usage',
      metric: 'memoryUsage',
      threshold: budgets.memoryUsage,
      current: 0,
      status: 'pass',
      percentage: 0,
      impact: 'medium'
    });
  }

  private checkPerformanceBudget(metric: string, value: number, threshold: number): void {
    const budget = this.performanceBudgets.get(metric);
    if (!budget) return;

    budget.current = value;
    budget.percentage = (value / threshold) * 100;

    if (value <= threshold) {
      budget.status = 'pass';
    } else if (value <= threshold * 1.2) {
      budget.status = 'warn';
    } else {
      budget.status = 'fail';
    }

    // Generate alert if threshold exceeded
    if (budget.status !== 'pass') {
      this.generateBudgetAlert(budget);
    }
  }

  private checkAllPerformanceBudgets(): void {
    for (const [metric, budget] of this.performanceBudgets) {
      let currentValue = 0;

      switch (metric) {
        case 'firstContentfulPaint':
          currentValue = this.metrics.coreWebVitals.firstContentfulPaint;
          break;
        case 'largestContentfulPaint':
          currentValue = this.metrics.coreWebVitals.largestContentfulPaint;
          break;
        case 'firstInputDelay':
          currentValue = this.metrics.coreWebVitals.firstInputDelay;
          break;
        case 'cumulativeLayoutShift':
          currentValue = this.metrics.coreWebVitals.cumulativeLayoutShift;
          break;
        case 'memoryUsage':
          currentValue = this.metrics.memoryUsage.usedJSHeapSize;
          break;
      }

      this.checkPerformanceBudget(metric, currentValue, budget.threshold);
    }
  }

  private generateBudgetAlert(budget: PerformanceBudget): void {
    const alertId = `budget_${budget.metric}`;
    const existingAlert = this.alerts.get(alertId);

    if (existingAlert && !existingAlert.resolved) {
      return; // Alert already exists and is active
    }

    const alert: PerformanceAlert = {
      id: alertId,
      type: 'threshold',
      severity: budget.status === 'fail' ? 'error' : 'warning',
      metric: budget.metric,
      value: budget.current,
      threshold: budget.threshold,
      message: `Performance budget exceeded for ${budget.name}: ${Math.round(budget.current)}ms (threshold: ${budget.threshold}ms)`,
      timestamp: new Date().toISOString(),
      resolved: false,
      context: {
        budgetName: budget.name,
        percentage: budget.percentage,
        impact: budget.impact
      }
    };

    this.alerts.set(alertId, alert);

    // Track alert event
    this.analytics.trackEvent({
      name: 'performance_alert',
      category: 'performance',
      action: 'budget_exceeded',
      label: budget.metric,
      properties: {
        budgetName: budget.name,
        currentValue: budget.current,
        threshold: budget.threshold,
        percentage: budget.percentage,
        severity: alert.severity
      },
      dimensions: {
        alert_type: 'budget_exceeded',
        metric: budget.metric,
        severity: alert.severity
      }
    });
  }

  private generatePerformanceAlerts(): void {
    // Check for performance regressions and spikes
    this.checkPerformanceRegressions();
    this.checkPerformanceSpikes();
  }

  private checkPerformanceRegressions(): void {
    // Implementation for detecting performance regressions
    // This would involve comparing current metrics with historical data
  }

  private checkPerformanceSpikes(): void {
    // Implementation for detecting performance spikes
    // This would involve checking for sudden increases in metrics
  }

  private trackNetworkRequest(url: string, method: string, duration: number, status: number, size: number): void {
    const requestEntry: NetworkRequestEntry = {
      url,
      method,
      status,
      duration,
      size,
      success: status >= 200 && status < 400,
      retryCount: 0,
      timeout: duration > 30000,
      cached: false,
      protocol: 'unknown'
    };

    this.metrics.networkPerformance.totalRequests++;

    if (!requestEntry.success) {
      this.metrics.networkPerformance.failedRequests++;
    }

    if (requestEntry.duration > 5000) { // Slow request threshold
      this.metrics.networkPerformance.slowRequests.push(requestEntry);
    }

    // Track API response time budget
    if (this.config.bundles.apiResponseTime > 0) {
      this.checkPerformanceBudget('apiResponseTime', duration, this.config.bundles.apiResponseTime);
    }
  }

  private flushErrorBuffer(): void {
    if (this.errorBuffer.length === 0) return;

    // Track batch of errors
    this.analytics.trackEvent({
      name: 'error_batch',
      category: 'error',
      action: 'batch_report',
      properties: {
        errorCount: this.errorBuffer.length,
        errors: this.errorBuffer,
        timestamp: new Date().toISOString()
      },
      metrics: {
        error_batch_size: this.errorBuffer.length
      }
    });

    // Clear buffer
    this.errorBuffer = [];
  }

  // Helper methods
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'script';
      case 'css': return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'avif': return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf': return 'font';
      case 'mp4':
      case 'webm':
      case 'ogg': return 'video';
      case 'mp3':
      case 'wav':
      case 'ogg': return 'audio';
      default: return 'other';
    }
  }

  private calculateMemoryPressure(memoryUsage: number): 'low' | 'medium' | 'high' | 'critical' {
    const totalMemory = this.metrics.memoryUsage.jsHeapSizeLimit;
    const usagePercentage = (memoryUsage / totalMemory) * 100;

    if (usagePercentage < 50) return 'low';
    if (usagePercentage < 75) return 'medium';
    if (usagePercentage < 90) return 'high';
    return 'critical';
  }

  private calculateMemoryGrowthRate(currentUsage: number): number {
    // Calculate growth rate based on historical data
    // This is a simplified implementation
    return 0; // Would need to track historical memory usage
  }

  private estimatePowerConsumption(): number {
    // Estimate power consumption based on CPU usage, screen brightness, network activity, etc.
    // This is a simplified implementation
    return 0; // Would need device-specific APIs
  }

  private getThermalState(): 'nominal' | 'fair' | 'serious' | 'critical' {
    // Get thermal state if available
    if ('thermal' in navigator) {
      return (navigator as any).thermal.state || 'nominal';
    }
    return 'nominal';
  }

  private calculateBatteryDrainRate(currentLevel: number): number {
    // Calculate battery drain rate based on historical data
    // This is a simplified implementation
    return 0; // Would need to track historical battery levels
  }

  private getConnectionQuality(effectiveType: string, downlink?: number, rtt?: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (effectiveType === '4g' && downlink && downlink > 5 && rtt && rtt < 100) return 'excellent';
    if (effectiveType === '4g' || (downlink && downlink > 2)) return 'good';
    if (effectiveType === '3g' || (downlink && downlink > 0.5)) return 'fair';
    return 'poor';
  }

  private calculatePerformanceScore(metrics: AppPerformance): number {
    // Calculate overall performance score (0-100)
    let score = 100;

    // Core Web Vitals impact
    if (metrics.coreWebVitals) {
      const cwv = metrics.coreWebVitals;
      if (cwv.largestContentfulPaint > 2500) score -= 20;
      if (cwv.firstInputDelay > 100) score -= 20;
      if (cwv.cumulativeLayoutShift > 0.1) score -= 20;
    }

    // Memory usage impact
    if (metrics.system?.memoryUsage && metrics.system.memoryUsage > 100) {
      score -= 15;
    }

    // Error rate impact
    if (metrics.errors?.errorRate && metrics.errors.errorRate > 1) {
      score -= 15;
    }

    return Math.max(score, 0);
  }

  private calculateCoreWebVitalsScore(coreWebVitals: any): number {
    // Calculate Core Web Vitals score
    let score = 100;

    if (coreWebVitals.largestContentfulPaint > 2500) score -= 30;
    if (coreWebVitals.firstInputDelay > 100) score -= 35;
    if (coreWebVitals.cumulativeLayoutShift > 0.1) score -= 35;

    return Math.max(score, 0);
  }

  private generateRecommendations(metrics: AppPerformance): string[] {
    const recommendations: string[] = [];

    if (metrics.coreWebVitals?.largestContentfulPaint > 2500) {
      recommendations.push('Optimize images and reduce server response time to improve LCP');
    }

    if (metrics.coreWebVitals?.firstInputDelay > 100) {
      recommendations.push('Reduce JavaScript execution time to improve FID');
    }

    if (metrics.coreWebVitals?.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reserve space for dynamic content to reduce CLS');
    }

    if (metrics.system?.memoryUsage && metrics.system.memoryUsage > 100) {
      recommendations.push('Optimize memory usage by reducing object allocations');
    }

    if (metrics.errors?.errorRate && metrics.errors.errorRate > 1) {
      recommendations.push('Investigate and fix recurring JavaScript errors');
    }

    return recommendations;
  }

  private getPerformanceTrends(): any {
    // Return performance trends data
    // This would involve storing and analyzing historical data
    return {
      lcpTrend: [],
      fidTrend: [],
      clsTrend: [],
      memoryTrend: [],
      errorRateTrend: []
    };
  }

  private getDeviceInfo(): DeviceInfo {
    // Get current device info
    return {
      platform: 'web', // Would need proper detection
      deviceId: 'unknown',
      osVersion: 'unknown',
      appVersion: this.config.appVersion,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: 'landscape',
      colorDepth: window.screen.colorDepth,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      connectionType: 'wifi',
      effectiveConnectionType: '4g',
      saveData: false,
      capabilities: {
        webgl: false,
        webgl2: false,
        webp: false,
        avif: false,
        pushNotifications: false,
        backgroundSync: false,
        offline: false,
        camera: false,
        microphone: false,
        geolocation: false,
        vibration: false,
        bluetooth: false,
        nfc: false
      },
      security: {
        https: window.isSecureContext,
        secureContext: window.isSecureContext,
        permissions: {}
      }
    };
  }
}

export default MobilePerformanceAnalytics;