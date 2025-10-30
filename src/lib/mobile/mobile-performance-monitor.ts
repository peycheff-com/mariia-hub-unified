/**
 * Mobile Performance Monitor
 * Comprehensive performance monitoring specifically designed for mobile devices
 */

interface MobileDeviceInfo {
  userAgent: string;
  platform: string;
  deviceMemory: number;
  hardwareConcurrency: number;
  screenResolution: { width: number; height: number };
  pixelRatio: number;
  viewportSize: { width: number; height: number };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isLowEndDevice: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  connectionType: string;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface MobilePerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint

  // Mobile-specific metrics
  fmp: number; // First Meaningful Paint
  tti: number; // Time to Interactive
  si: number; // Speed Index
  tbt: number; // Total Blocking Time
  clsMobile: number; // Mobile-specific CLS
  renderTime: number; // Render time
  paintTime: number; // Paint time

  // Resource metrics
  resourceLoadTime: number;
  scriptExecutionTime: number;
  styleCalculationTime: number;
  layoutTime: number;
  compositeTime: number;

  // Network metrics
  dnsLookupTime: number;
  tcpConnectTime: number;
  sslTime: number;
  requestResponseTime: number;
  domProcessingTime: number;

  // Memory metrics
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  memoryPressure: 'low' | 'medium' | 'high';

  // Battery metrics
  batteryDrainRate: number;
  powerUsage: 'low' | 'medium' | 'high';

  // Touch performance
  firstTouchDelay: number;
  touchResponseTime: number;
  gesturePerformance: number;

  // Scroll performance
  scrollJank: number;
  scrollFPS: number;
  scrollSmoothness: number;

  // App-specific metrics
  bookingFlowTime: number;
  serviceLoadTime: number;
  imageLoadTime: number;
  apiResponseTime: number;

  // Error metrics
  jsErrors: number;
  networkErrors: number;
  resourceErrors: number;
  userExperienceScore: number;
}

interface PerformanceThresholds {
  excellent: Partial<MobilePerformanceMetrics>;
  good: Partial<MobilePerformanceMetrics>;
  needsImprovement: Partial<MobilePerformanceMetrics>;
  poor: Partial<MobilePerformanceMetrics>;
}

interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'network' | 'memory' | 'battery' | 'user-experience';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
  timestamp: Date;
  deviceInfo: MobileDeviceInfo;
}

interface PerformanceSnapshot {
  timestamp: Date;
  url: string;
  metrics: MobilePerformanceMetrics;
  deviceInfo: MobileDeviceInfo;
  networkInfo: NetworkInfo;
  alerts: PerformanceAlert[];
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

class MobilePerformanceMonitor {
  private static instance: MobilePerformanceMonitor;
  private deviceInfo: MobileDeviceInfo;
  private networkInfo: NetworkInfo;
  private metrics: MobilePerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private observers: PerformanceObserver[] = [];
  private monitoringActive = false;
  private batteryInfo: any = null;
  private touchStartTime = 0;
  private scrollMetrics = { frames: 0, jankCount: 0, startTime: 0 };

  private constructor() {
    this.initializeDeviceInfo();
    this.initializeNetworkInfo();
    this.initializeMetrics();
    this.initializeThresholds();
    this.setupBatteryMonitoring();
  }

  static getInstance(): MobilePerformanceMonitor {
    if (!MobilePerformanceMonitor.instance) {
      MobilePerformanceMonitor.instance = new MobilePerformanceMonitor();
    }
    return MobilePerformanceMonitor.instance;
  }

  private initializeDeviceInfo(): void {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const pixelRatio = window.devicePixelRatio || 1;
    const screenResolution = {
      width: screen.width,
      height: screen.height
    };
    const viewportSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Determine device type
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Determine if it's a low-end device
    const isLowEndDevice = deviceMemory <= 2 || hardwareConcurrency <= 2 ||
                          (deviceType === 'mobile' && deviceMemory <= 3);

    this.deviceInfo = {
      userAgent,
      platform,
      deviceMemory,
      hardwareConcurrency,
      screenResolution,
      pixelRatio,
      viewportSize,
      deviceType,
      isLowEndDevice
    };

    console.log('📱 Device info initialized:', this.deviceInfo);
  }

  private initializeNetworkInfo(): void {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType || '4g';
      const downlink = connection.downlink || 10;
      const rtt = connection.rtt || 100;
      const saveData = connection.saveData || false;
      const connectionType = connection.type || 'unknown';

      let networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
      if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
        networkQuality = 'excellent';
      } else if (effectiveType === '4g' && downlink > 2 && rtt < 200) {
        networkQuality = 'good';
      } else if (effectiveType === '3g' || downlink > 0.5) {
        networkQuality = 'fair';
      } else {
        networkQuality = 'poor';
      }

      this.networkInfo = {
        effectiveType,
        downlink,
        rtt,
        saveData,
        connectionType,
        networkQuality
      };

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.initializeNetworkInfo();
        console.log('📶 Network conditions changed:', this.networkInfo);
      });
    } else {
      // Fallback for browsers without Network Information API
      this.networkInfo = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        connectionType: 'unknown',
        networkQuality: 'good'
      };
    }

    console.log('🌐 Network info initialized:', this.networkInfo);
  }

  private initializeMetrics(): void {
    this.metrics = {
      // Core Web Vitals (will be measured)
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      inp: 0,

      // Mobile-specific metrics (will be measured)
      fmp: 0,
      tti: 0,
      si: 0,
      tbt: 0,
      clsMobile: 0,
      renderTime: 0,
      paintTime: 0,

      // Resource metrics
      resourceLoadTime: 0,
      scriptExecutionTime: 0,
      styleCalculationTime: 0,
      layoutTime: 0,
      compositeTime: 0,

      // Network metrics
      dnsLookupTime: 0,
      tcpConnectTime: 0,
      sslTime: 0,
      requestResponseTime: 0,
      domProcessingTime: 0,

      // Memory metrics
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      memoryPressure: 'low',

      // Battery metrics
      batteryDrainRate: 0,
      powerUsage: 'low',

      // Touch performance
      firstTouchDelay: 0,
      touchResponseTime: 0,
      gesturePerformance: 0,

      // Scroll performance
      scrollJank: 0,
      scrollFPS: 0,
      scrollSmoothness: 0,

      // App-specific metrics
      bookingFlowTime: 0,
      serviceLoadTime: 0,
      imageLoadTime: 0,
      apiResponseTime: 0,

      // Error metrics
      jsErrors: 0,
      networkErrors: 0,
      resourceErrors: 0,
      userExperienceScore: 0
    };
  }

  private initializeThresholds(): void {
    // Mobile-specific thresholds (more lenient than desktop)
    this.thresholds = {
      excellent: {
        lcp: 1200,
        fid: 50,
        cls: 0.05,
        fcp: 1000,
        ttfb: 400,
        inp: 100,
        tti: 2800,
        tbt: 100,
        memoryPressure: 'low',
        scrollJank: 5,
        scrollFPS: 55
      },
      good: {
        lcp: 2000,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 600,
        inp: 200,
        tti: 3800,
        tbt: 200,
        memoryPressure: 'medium',
        scrollJank: 10,
        scrollFPS: 50
      },
      needsImprovement: {
        lcp: 3000,
        fid: 250,
        cls: 0.2,
        fcp: 3000,
        ttfb: 1000,
        inp: 400,
        tti: 5000,
        tbt: 400,
        memoryPressure: 'high',
        scrollJank: 20,
        scrollFPS: 40
      },
      poor: {
        lcp: 4000,
        fid: 500,
        cls: 0.3,
        fcp: 4000,
        ttfb: 1500,
        inp: 600,
        tti: 6500,
        tbt: 600,
        memoryPressure: 'high',
        scrollJank: 30,
        scrollFPS: 30
      }
    };
  }

  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryInfo = battery;
        this.deviceInfo.batteryLevel = battery.level;
        this.deviceInfo.isCharging = battery.charging;

        // Monitor battery changes
        battery.addEventListener('levelchange', () => {
          this.deviceInfo.batteryLevel = battery.level;
          this.analyzeBatteryPerformance();
        });

        battery.addEventListener('chargingchange', () => {
          this.deviceInfo.isCharging = battery.charging;
          this.adjustPerformanceForBattery();
        });
      });
    }
  }

  public async startMonitoring(): Promise<void> {
    if (this.monitoringActive) return;

    console.log('🚀 Starting Mobile Performance Monitoring');

    this.monitoringActive = true;

    // Setup performance observers
    this.setupPerformanceObservers();

    // Setup mobile-specific monitoring
    this.setupMobileSpecificMonitoring();

    // Setup error tracking
    this.setupErrorTracking();

    // Setup memory monitoring
    this.setupMemoryMonitoring();

    // Start periodic monitoring
    this.startPeriodicMonitoring();

    console.log('✅ Mobile Performance Monitoring started');
  }

  public stopMonitoring(): void {
    if (!this.monitoringActive) return;

    console.log('🛑 Stopping Mobile Performance Monitoring');

    this.monitoringActive = false;

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Remove event listeners
    this.removeEventListeners();

    console.log('✅ Mobile Performance Monitoring stopped');
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    this.observeLCP();

    // First Input Delay
    this.observeFID();

    // Cumulative Layout Shift
    this.observeCLS();

    // First Contentful Paint
    this.observeFCP();

    // Time to First Byte
    this.observeTTFB();

    // Interaction to Next Paint
    this.observeINP();

    // Resource timing
    this.observeResourceTiming();

    // Navigation timing
    this.observeNavigationTiming();

    // Paint timing
    this.observePaintTiming();

    // Long tasks
    this.observeLongTasks();
  }

  private observeLCP(): void {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;

      // Check against mobile threshold
      const threshold = this.thresholds.good.lcp || 2000;
      if (this.metrics.lcp > threshold) {
        this.createAlert({
          type: 'warning',
          category: 'performance',
          title: 'Slow Largest Contentful Paint',
          description: `LCP is ${Math.round(this.metrics.lcp)}ms on mobile`,
          metric: 'lcp',
          value: this.metrics.lcp,
          threshold,
          recommendation: 'Optimize images, reduce server response time, and eliminate render-blocking resources'
        });
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);
  }

  private observeFID(): void {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.metrics.fid = fid;

        const threshold = this.thresholds.good.fid || 100;
        if (fid > threshold) {
          this.createAlert({
            type: 'warning',
            category: 'performance',
            title: 'High First Input Delay',
            description: `FID is ${Math.round(fid)}ms on mobile`,
            metric: 'fid',
            value: fid,
            threshold,
            recommendation: 'Reduce JavaScript execution time and break up long tasks'
          });
        }
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);
  }

  private observeCLS(): void {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }

      this.metrics.cls = clsValue;
      this.metrics.clsMobile = clsValue * 1.2; // Mobile-specific adjustment

      const threshold = this.thresholds.good.cls || 0.1;
      if (clsValue > threshold) {
        this.createAlert({
          type: 'warning',
          category: 'user-experience',
          title: 'High Cumulative Layout Shift',
          description: `CLS is ${clsValue.toFixed(3)} on mobile`,
          metric: 'cls',
          value: clsValue,
          threshold,
          recommendation: 'Ensure images have dimensions and avoid inserting content above existing content'
        });
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);
  }

  private observeFCP(): void {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;

          const threshold = this.thresholds.good.fcp || 1800;
          if (this.metrics.fcp > threshold) {
            this.createAlert({
              type: 'warning',
              category: 'performance',
              title: 'Slow First Contentful Paint',
              description: `FCP is ${Math.round(this.metrics.fcp)}ms on mobile`,
              metric: 'fcp',
              value: this.metrics.fcp,
              threshold,
              recommendation: 'Reduce server response time and optimize critical rendering path'
            });
          }
        }
      }
    });

    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(fcpObserver);
  }

  private observeTTFB(): void {
    const ttfbObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;

          const threshold = this.thresholds.good.ttfb || 600;
          if (this.metrics.ttfb > threshold) {
            this.createAlert({
              type: 'warning',
              category: 'network',
              title: 'High Time to First Byte',
              description: `TTFB is ${Math.round(this.metrics.ttfb)}ms on mobile`,
              metric: 'ttfb',
              value: this.metrics.ttfb,
              threshold,
              recommendation: 'Optimize server response time and use CDN'
            });
          }
        }
      }
    });

    ttfbObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(ttfbObserver);
  }

  private observeINP(): void {
    // Check if INP is supported
    if ('InteractionEvent' in window) {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.inp = entry.duration;

          const threshold = this.thresholds.good.inp || 200;
          if (this.metrics.inp > threshold) {
            this.createAlert({
              type: 'warning',
              category: 'performance',
              title: 'High Interaction to Next Paint',
              description: `INP is ${Math.round(this.metrics.inp)}ms on mobile`,
              metric: 'inp',
              value: this.metrics.inp,
              threshold,
              recommendation: 'Reduce input delay and processing time for interactions'
            });
          }
        }
      });

      inpObserver.observe({ entryTypes: ['interaction'] });
      this.observers.push(inpObserver);
    }
  }

  private observeResourceTiming(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalLoadTime = 0;
      let scriptLoadTime = 0;
      let imageLoadTime = 0;
      let apiLoadTime = 0;

      for (const entry of entries) {
        const resource = entry as PerformanceResourceTiming;
        const loadTime = resource.responseEnd - resource.requestStart;
        totalLoadTime += loadTime;

        // Categorize resources
        if (resource.initiatorType === 'script') {
          scriptLoadTime += loadTime;
        } else if (resource.initiatorType === 'img') {
          imageLoadTime += loadTime;
        } else if (resource.name.includes('/api/')) {
          apiLoadTime += loadTime;
        }
      }

      this.metrics.resourceLoadTime = totalLoadTime / entries.length;
      this.metrics.scriptExecutionTime = scriptLoadTime;
      this.metrics.imageLoadTime = imageLoadTime / Math.max(1, entries.filter(e => e.initiatorType === 'img').length);
      this.metrics.apiResponseTime = apiLoadTime / Math.max(1, entries.filter(e => e.name.includes('/api/')).length);
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  private observeNavigationTiming(): void {
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;

          // Network timing breakdown
          this.metrics.dnsLookupTime = navEntry.domainLookupEnd - navEntry.domainLookupStart;
          this.metrics.tcpConnectTime = navEntry.connectEnd - navEntry.connectStart;
          this.metrics.sslTime = navEntry.secureConnectionStart > 0 ?
            navEntry.connectEnd - navEntry.secureConnectionStart : 0;
          this.metrics.requestResponseTime = navEntry.responseEnd - navEntry.requestStart;
          this.metrics.domProcessingTime = navEntry.domComplete - navEntry.domLoading;

          // Calculate Total Blocking Time (simplified)
          const domInteractive = navEntry.domInteractive - navEntry.navigationStart;
          const loadComplete = navEntry.loadEventEnd - navEntry.navigationStart;
          this.metrics.tbt = Math.max(0, loadComplete - domInteractive - 200);
        }
      }
    });

    navObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navObserver);
  }

  private observePaintTiming(): void {
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.paintTime = entry.startTime;
        } else if (entry.name === 'first-meaningful-paint') {
          this.metrics.fmp = entry.startTime;
        }
      }
    });

    paintObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(paintObserver);
  }

  private observeLongTasks(): void {
    if ('PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Long tasks block the main thread and affect responsiveness
          const duration = entry.duration;
          this.metrics.tbt += duration;

          if (duration > 100) {
            this.createAlert({
              type: 'warning',
              category: 'performance',
              title: 'Long Task Detected',
              description: `A task blocked the main thread for ${Math.round(duration)}ms`,
              metric: 'tbt',
              value: duration,
              threshold: 100,
              recommendation: 'Break up long tasks and use web workers for heavy computations'
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  private setupMobileSpecificMonitoring(): void {
    // Monitor touch performance
    this.setupTouchMonitoring();

    // Monitor scroll performance
    this.setupScrollMonitoring();

    // Monitor device orientation changes
    this.setupOrientationMonitoring();

    // Monitor app visibility changes
    this.setupVisibilityMonitoring();
  }

  private setupTouchMonitoring(): void {
    let touchStartTime = 0;

    document.addEventListener('touchstart', (event) => {
      touchStartTime = performance.now();
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (touchStartTime > 0) {
        const touchResponseTime = performance.now() - touchStartTime;
        this.metrics.touchResponseTime = Math.max(this.metrics.touchResponseTime, touchResponseTime);

        if (this.metrics.firstTouchDelay === 0) {
          this.metrics.firstTouchDelay = touchStartTime;
        }

        if (touchResponseTime > 200) {
          this.createAlert({
            type: 'warning',
            category: 'user-experience',
            title: 'Slow Touch Response',
            description: `Touch response took ${Math.round(touchResponseTime)}ms`,
            metric: 'touchResponseTime',
            value: touchResponseTime,
            threshold: 200,
            recommendation: 'Optimize touch event handlers and reduce main thread blocking'
          });
        }

        touchStartTime = 0;
      }
    }, { passive: true });
  }

  private setupScrollMonitoring(): void {
    let scrollStartTime = 0;
    let frameCount = 0;
    let lastFrameTime = 0;

    const measureScrollPerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      // Calculate FPS
      if (lastFrameTime > 0) {
        const fps = 1000 / (currentTime - lastFrameTime);
        this.metrics.scrollFPS = Math.max(this.metrics.scrollFPS, fps);

        // Detect jank (low FPS frames)
        if (fps < 30) {
          this.metrics.scrollJank++;
        }
      }

      lastFrameTime = currentTime;

      if (scrollStartTime > 0 && currentTime - scrollStartTime < 1000) {
        requestAnimationFrame(measureScrollPerformance);
      }
    };

    document.addEventListener('scroll', () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now();
        frameCount = 0;
        this.metrics.scrollJank = 0;
        requestAnimationFrame(measureScrollPerformance);
      } else {
        // Reset scroll metrics after period of inactivity
        clearTimeout((window as any).scrollTimeout);
        (window as any).scrollTimeout = setTimeout(() => {
          scrollStartTime = 0;

          // Calculate scroll smoothness score
          const smoothness = (frameCount - this.metrics.scrollJank) / frameCount;
          this.metrics.scrollSmoothness = smoothness;

          if (smoothness < 0.8) {
            this.createAlert({
              type: 'info',
              category: 'user-experience',
              title: 'Scroll Performance Issues',
              description: `Scroll smoothness is ${(smoothness * 100).toFixed(1)}%`,
              metric: 'scrollSmoothness',
              value: smoothness,
              threshold: 0.8,
              recommendation: 'Optimize scroll event handlers and use passive listeners'
            });
          }
        }, 500);
      }
    }, { passive: true });
  }

  private setupOrientationMonitoring(): void {
    window.addEventListener('orientationchange', () => {
      // Measure orientation change performance
      const startTime = performance.now();

      setTimeout(() => {
        const orientationChangeTime = performance.now() - startTime;

        if (orientationChangeTime > 1000) {
          this.createAlert({
            type: 'info',
            category: 'performance',
            title: 'Slow Orientation Change',
            description: `Orientation change took ${Math.round(orientationChangeTime)}ms`,
            metric: 'orientationChangeTime',
            value: orientationChangeTime,
            threshold: 1000,
            recommendation: 'Optimize layout recalculation for orientation changes'
          });
        }
      }, 100);
    });
  }

  private setupVisibilityMonitoring(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause monitoring
        this.pauseMonitoring();
      } else {
        // Page is visible, resume monitoring
        this.resumeMonitoring();
      }
    });
  }

  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.metrics.jsErrors++;

      this.createAlert({
        type: 'critical',
        category: 'user-experience',
        title: 'JavaScript Error',
        description: event.message,
        metric: 'jsErrors',
        value: this.metrics.jsErrors,
        threshold: 1,
        recommendation: 'Fix JavaScript errors to improve user experience'
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.jsErrors++;

      this.createAlert({
        type: 'critical',
        category: 'user-experience',
        title: 'Unhandled Promise Rejection',
        description: event.reason?.message || 'Unknown promise rejection',
        metric: 'jsErrors',
        value: this.metrics.jsErrors,
        threshold: 1,
        recommendation: 'Handle promise rejections properly'
      });
    });

    // Resource errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.metrics.resourceErrors++;
      }
    }, true);
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;

        this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
        this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
        this.metrics.usedJSHeapSize = memory.usedJSHeapSize;

        // Calculate memory pressure
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (memoryUsage > 0.8) {
          this.metrics.memoryPressure = 'high';

          this.createAlert({
            type: 'warning',
            category: 'memory',
            title: 'High Memory Usage',
            description: `Memory usage is ${(memoryUsage * 100).toFixed(1)}%`,
            metric: 'memoryPressure',
            value: memoryUsage,
            threshold: 0.8,
            recommendation: 'Optimize memory usage and implement memory cleanup'
          });
        } else if (memoryUsage > 0.6) {
          this.metrics.memoryPressure = 'medium';
        } else {
          this.metrics.memoryPressure = 'low';
        }
      };

      // Check memory periodically
      setInterval(checkMemory, 10000);
      checkMemory();
    }
  }

  private startPeriodicMonitoring(): void {
    // Generate performance snapshots every 30 seconds
    setInterval(() => {
      if (this.monitoringActive) {
        this.generateSnapshot();
      }
    }, 30000);

    // Generate initial snapshot after 5 seconds
    setTimeout(() => {
      if (this.monitoringActive) {
        this.generateSnapshot();
      }
    }, 5000);
  }

  private generateSnapshot(): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      url: window.location.href,
      metrics: { ...this.metrics },
      deviceInfo: { ...this.deviceInfo },
      networkInfo: { ...this.networkInfo },
      alerts: [...this.alerts.filter(a =>
        Date.now() - a.timestamp.getTime() < 60000 // Only recent alerts
      )],
      score: this.calculatePerformanceScore(),
      grade: this.calculatePerformanceGrade()
    };

    this.snapshots.push(snapshot);

    // Keep only last 10 snapshots
    if (this.snapshots.length > 10) {
      this.snapshots = this.snapshots.slice(-10);
    }

    // Dispatch snapshot event
    const event = new CustomEvent('performanceSnapshot', { detail: snapshot });
    window.dispatchEvent(event);

    console.log('📊 Performance snapshot generated:', snapshot.score, snapshot.grade);
  }

  private calculatePerformanceScore(): number {
    let score = 100;

    // Core Web Vitals scoring
    if (this.metrics.lcp > this.thresholds.poor.lcp) score -= 25;
    else if (this.metrics.lcp > this.thresholds.needsImprovement.lcp) score -= 15;
    else if (this.metrics.lcp > this.thresholds.good.lcp) score -= 5;

    if (this.metrics.fid > this.thresholds.poor.fid) score -= 20;
    else if (this.metrics.fid > this.thresholds.needsImprovement.fid) score -= 10;
    else if (this.metrics.fid > this.thresholds.good.fid) score -= 3;

    if (this.metrics.cls > this.thresholds.poor.cls) score -= 20;
    else if (this.metrics.cls > this.thresholds.needsImprovement.cls) score -= 10;
    else if (this.metrics.cls > this.thresholds.good.cls) score -= 3;

    // Mobile-specific metrics
    if (this.metrics.tti > this.thresholds.poor.tti) score -= 15;
    else if (this.metrics.tti > this.thresholds.needsImprovement.tti) score -= 8;
    else if (this.metrics.tti > this.thresholds.good.tti) score -= 2;

    if (this.metrics.tbt > this.thresholds.poor.tbt) score -= 10;
    else if (this.metrics.tbt > this.thresholds.needsImprovement.tbt) score -= 5;
    else if (this.metrics.tbt > this.thresholds.good.tbt) score -= 2;

    // User experience factors
    if (this.metrics.jsErrors > 0) score -= this.metrics.jsErrors * 5;
    if (this.metrics.networkErrors > 0) score -= this.metrics.networkErrors * 3;
    if (this.metrics.resourceErrors > 0) score -= this.metrics.resourceErrors * 2;

    // Device-specific adjustments
    if (this.deviceInfo.isLowEndDevice) {
      score = Math.min(score + 10, 100); // Bonus points for performing well on low-end devices
    }

    if (this.networkInfo.networkQuality === 'poor') {
      score = Math.min(score + 5, 100); // Bonus points for performing well on poor networks
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformanceGrade(): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.calculatePerformanceScore();

    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private analyzeBatteryPerformance(): void {
    if (!this.batteryInfo) return;

    // Analyze battery drain rate (simplified)
    const currentLevel = this.batteryInfo.level;
    const timeDiff = Date.now() - (this.batteryInfo.lastChecked || Date.now());

    if (timeDiff > 60000) { // Only analyze after 1 minute
      const drainRate = (this.batteryInfo.initialLevel - currentLevel) / (timeDiff / 3600000);
      this.metrics.batteryDrainRate = drainRate;

      if (drainRate > 0.1) { // 10% per hour
        this.metrics.powerUsage = 'high';
        this.createAlert({
          type: 'warning',
          category: 'battery',
          title: 'High Battery Drain',
          description: `Battery is draining at ${(drainRate * 100).toFixed(1)}% per hour`,
          metric: 'batteryDrainRate',
          value: drainRate,
          threshold: 0.1,
          recommendation: 'Optimize CPU usage and reduce background processes'
        });
      } else if (drainRate > 0.05) {
        this.metrics.powerUsage = 'medium';
      } else {
        this.metrics.powerUsage = 'low';
      }

      this.batteryInfo.lastChecked = Date.now();
    }
  }

  private adjustPerformanceForBattery(): void {
    if (!this.batteryInfo) return;

    if (this.batteryInfo.level < 0.2 && !this.batteryInfo.charging) {
      // Low battery mode
      console.log('🔋 Low battery detected, enabling power saving mode');
      document.documentElement.classList.add('power-saving-mode');

      // Reduce animation frequency
      this.metrics.powerUsage = 'high';
    } else if (this.batteryInfo.charging) {
      // Normal mode when charging
      document.documentElement.classList.remove('power-saving-mode');
      this.metrics.powerUsage = 'low';
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'deviceInfo'>): void {
    const alert: PerformanceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      deviceInfo: { ...this.deviceInfo }
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Dispatch alert event
    const event = new CustomEvent('performanceAlert', { detail: alert });
    window.dispatchEvent(event);

    console.warn(`🚨 Performance Alert: ${alert.title}`, alert);
  }

  private pauseMonitoring(): void {
    // Pauses intensive monitoring when page is hidden
    this.monitoringActive = false;
  }

  private resumeMonitoring(): void {
    // Resumes monitoring when page becomes visible
    this.monitoringActive = true;
  }

  private removeEventListeners(): void {
    // Remove all event listeners when stopping monitoring
    // Implementation would store references to listeners
  }

  // Public API methods
  public getCurrentMetrics(): MobilePerformanceMetrics {
    return { ...this.metrics };
  }

  public getDeviceInfo(): MobileDeviceInfo {
    return { ...this.deviceInfo };
  }

  public getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  public getAlerts(limit?: number): PerformanceAlert[] {
    if (limit) {
      return this.alerts.slice(-limit);
    }
    return [...this.alerts];
  }

  public getSnapshots(limit?: number): PerformanceSnapshot[] {
    if (limit) {
      return this.snapshots.slice(-limit);
    }
    return [...this.snapshots];
  }

  public generateReport(): object {
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];

    return {
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      networkInfo: this.networkInfo,
      currentMetrics: this.metrics,
      performanceScore: latestSnapshot?.score || this.calculatePerformanceScore(),
      performanceGrade: latestSnapshot?.grade || this.calculatePerformanceGrade(),
      recentAlerts: this.getAlerts(10),
      recommendations: this.generateRecommendations(),
      summary: this.generateSummary()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.lcp > this.thresholds.good.lcp) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response time and optimizing images');
    }

    if (this.metrics.fid > this.thresholds.good.fid) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (this.metrics.cls > this.thresholds.good.cls) {
      recommendations.push('Improve Cumulative Layout Shift by ensuring images have dimensions and avoiding content jumps');
    }

    if (this.metrics.tbt > this.thresholds.good.tbt) {
      recommendations.push('Reduce Total Blocking Time by breaking up long tasks and using web workers');
    }

    if (this.metrics.memoryPressure === 'high') {
      recommendations.push('Optimize memory usage by implementing proper cleanup and reducing memory leaks');
    }

    if (this.metrics.powerUsage === 'high') {
      recommendations.push('Implement power-saving features to reduce battery drain');
    }

    if (this.deviceInfo.isLowEndDevice) {
      recommendations.push('Consider progressive enhancement for low-end devices with reduced features');
    }

    if (this.networkInfo.networkQuality === 'poor') {
      recommendations.push('Implement data compression and offline support for poor network conditions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great performance! All metrics are within recommended thresholds.');
    }

    return recommendations;
  }

  private generateSummary(): object {
    const score = this.calculatePerformanceScore();
    const grade = this.calculatePerformanceGrade();

    return {
      overallScore: score,
      grade,
      status: score >= 90 ? 'excellent' : score >= 80 ? 'good' : score >= 70 ? 'fair' : 'poor',
      keyInsights: {
        devicePerformance: this.deviceInfo.isLowEndDevice ? 'Low-end device' : 'Capable device',
        networkCondition: this.networkInfo.networkQuality,
        memoryPressure: this.metrics.memoryPressure,
        batteryUsage: this.metrics.powerUsage,
        errorCount: this.metrics.jsErrors + this.metrics.networkErrors + this.metrics.resourceErrors
      },
      actionItems: this.generateActionItems()
    };
  }

  private generateActionItems(): string[] {
    const actions: string[] = [];

    if (this.metrics.lcp > 2500) actions.push('Optimize hero images and critical resources');
    if (this.metrics.fid > 100) actions.push('Reduce main thread blocking tasks');
    if (this.metrics.cls > 0.1) actions.push('Fix layout shifts with proper dimensions');
    if (this.metrics.tbt > 300) actions.push('Implement code splitting and web workers');
    if (this.metrics.jsErrors > 0) actions.push('Fix JavaScript errors immediately');
    if (this.metrics.memoryPressure === 'high') actions.push('Investigate memory leaks');
    if (this.metrics.powerUsage === 'high') actions.push('Optimize for battery life');

    return actions;
  }
}

// Export singleton instance
export const mobilePerformanceMonitor = MobilePerformanceMonitor.getInstance();

// Convenience exports
export const startMobileMonitoring = () => mobilePerformanceMonitor.startMonitoring();
export const stopMobileMonitoring = () => mobilePerformanceMonitor.stopMonitoring();
export const getMobileMetrics = () => mobilePerformanceMonitor.getCurrentMetrics();
export const getMobileReport = () => mobilePerformanceMonitor.generateReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).mobilePerformance = {
    start: startMobileMonitoring,
    stop: stopMobileMonitoring,
    getMetrics: getMobileMetrics,
    getReport: getMobileReport,
    getAlerts: (limit?: number) => mobilePerformanceMonitor.getAlerts(limit),
    getSnapshots: (limit?: number) => mobilePerformanceMonitor.getSnapshots(limit),
    getDeviceInfo: () => mobilePerformanceMonitor.getDeviceInfo(),
    getNetworkInfo: () => mobilePerformanceMonitor.getNetworkInfo()
  };
}