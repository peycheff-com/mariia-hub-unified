/**
 * Mobile-Specific Performance Monitoring
 * Comprehensive monitoring for mobile devices including touch interactions, battery usage, and network optimization
 */

interface MobilePerformanceMetrics {
  device: {
    type: 'mobile' | 'tablet' | 'phablet';
    screenSize: { width: number; height: number };
    pixelRatio: number;
    memory: number;
    cores: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };
  network: {
    type: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    online: boolean;
  };
  interactions: {
    touchResponseTime: number;
    tapAccuracy: number;
    gesturePerformance: number;
    scrollPerformance: number;
    inputLag: number;
  };
  rendering: {
    frameRate: number;
    droppedFrames: number;
    paintTime: number;
    layoutTime: number;
    compositingTime: number;
  };
  battery: {
    level: number;
    charging: boolean;
    dischargeTime?: number;
    impact: 'low' | 'medium' | 'high';
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    pressure: 'low' | 'medium' | 'high';
  };
  networkPerformance: {
    dnsLookup: number;
    tcpConnect: number;
    sslNegotiation: number;
    timeToFirstByte: number;
    contentDownload: number;
  };
}

interface MobilePerformanceAlert {
  id: string;
  type: 'performance' | 'battery' | 'memory' | 'network' | 'interaction';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  context: string;
  recommendations: string[];
  timestamp: number;
}

interface MobileOptimization {
  category: 'touch' | 'rendering' | 'network' | 'battery' | 'memory';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  expectedImpact: string;
  codeExample?: string;
}

const MOBILE_PERFORMANCE_THRESHOLDS = {
  // Touch interaction thresholds
  touchResponseTime: 100, // Maximum 100ms for touch response
  tapAccuracy: 95, // Minimum 95% tap accuracy
  gesturePerformance: 90, // Minimum 90% smooth gestures
  scrollPerformance: 55, // Minimum 55fps for scrolling

  // Rendering thresholds for mobile
  frameRate: 55, // Minimum 55fps (lower than desktop)
  droppedFrames: 5, // Maximum 5% dropped frames
  paintTime: 16, // Maximum 16ms per frame
  layoutTime: 10, // Maximum 10ms for layout

  // Battery impact thresholds
  batteryDrainRate: 5, // Maximum 5% battery drain per hour
  cpuUsage: 30, // Maximum 30% CPU usage
  networkActivity: 50, // Maximum 50KB per minute background activity

  // Memory thresholds
  memoryUsage: 150 * 1024 * 1024, // Maximum 150MB memory usage
  memoryPressure: 80, // Maximum 80% memory pressure

  // Network thresholds
  slowNetworkThreshold: 1500, // 1.5s threshold for slow networks
  resourceTimeout: 10000, // 10s timeout for resources
  maxConcurrentRequests: 6, // Maximum concurrent requests on mobile
};

const MOBILE_OPTIMIZATIONS: MobileOptimization[] = [
  {
    category: 'touch',
    priority: 'high',
    title: 'Optimize Touch Interactions',
    description: 'Improve touch response time and accuracy for mobile users',
    implementation: 'Use touch-action CSS, optimize event handlers, and implement proper touch feedback',
    expectedImpact: '50-80% improvement in touch responsiveness',
    codeExample: `/* Optimize touch interactions */
.button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.fast-tap {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  pointer-events: auto;
}`
  },
  {
    category: 'rendering',
    priority: 'high',
    title: 'Optimize Mobile Rendering',
    description: 'Reduce rendering overhead and maintain 60fps on mobile devices',
    implementation: 'Use CSS transforms, avoid layout thrashing, and implement efficient animations',
    expectedImpact: '40-60% improvement in rendering performance',
    codeExample: `/* Mobile-optimized animations */
.mobile-animation {
  will-change: transform;
  contain: layout style paint;
  transform: translateZ(0); /* Hardware acceleration */
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}`
  },
  {
    category: 'network',
    priority: 'high',
    title: 'Optimize for Slow Networks',
    description: 'Reduce data usage and improve performance on slow mobile networks',
    implementation: 'Implement adaptive loading, compression, and efficient data fetching',
    expectedImpact: '60-80% reduction in data usage, faster load times on 3G'
  },
  {
    category: 'battery',
    priority: 'medium',
    title: 'Reduce Battery Impact',
    description: 'Optimize application to minimize battery drain on mobile devices',
    implementation: 'Reduce background processing, optimize animations, and minimize network requests',
    expectedImpact: '30-50% reduction in battery consumption'
  },
  {
    category: 'memory',
    priority: 'medium',
    title: 'Optimize Memory Usage',
    description: 'Reduce memory footprint to prevent crashes on low-end devices',
    implementation: 'Implement efficient data structures, cleanup unused objects, and monitor memory pressure',
    expectedImpact: '40-60% reduction in memory usage'
  }
];

class MobilePerformanceMonitoring {
  private metrics: MobilePerformanceMetrics | null = null;
  private alerts: MobilePerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private frameRateMonitor: number | null = null;
  private touchListeners: EventListener[] = [];
  private networkObserver: NetworkInformation | null = null;
  private batteryManager: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!this.isMobileDevice()) {
      console.log('📱 Mobile Performance Monitoring: Not a mobile device, skipping...');
      return;
    }

    console.log('📱 Initializing Mobile Performance Monitoring...');

    // Initialize device and network information
    await this.collectDeviceInformation();
    await this.collectNetworkInformation();

    // Set up monitoring systems
    this.setupTouchMonitoring();
    this.setupRenderingMonitoring();
    this.setupBatteryMonitoring();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();

    // Start continuous monitoring
    this.startContinuousMonitoring();

    this.isMonitoring = true;
    console.log('✅ Mobile performance monitoring initialized');
  }

  private isMobileDevice(): boolean {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  private async collectDeviceInformation() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    this.metrics = {
      device: {
        type: this.getDeviceType(),
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        pixelRatio: window.devicePixelRatio || 1,
        memory: (navigator as any).deviceMemory || 4,
        cores: navigator.hardwareConcurrency || 4,
        batteryLevel: 0,
        isCharging: false
      },
      network: {
        type: 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
        online: navigator.onLine
      },
      interactions: {
        touchResponseTime: 0,
        tapAccuracy: 0,
        gesturePerformance: 0,
        scrollPerformance: 0,
        inputLag: 0
      },
      rendering: {
        frameRate: 60,
        droppedFrames: 0,
        paintTime: 0,
        layoutTime: 0,
        compositingTime: 0
      },
      battery: {
        level: 1,
        charging: true,
        impact: 'low'
      },
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        pressure: 'low'
      },
      networkPerformance: {
        dnsLookup: 0,
        tcpConnect: 0,
        sslNegotiation: 0,
        timeToFirstByte: 0,
        contentDownload: 0
      }
    };

    // Get battery information if available
    if ('getBattery' in navigator) {
      try {
        this.batteryManager = await (navigator as any).getBattery();
        this.updateBatteryInfo();
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'phablet' {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = 'ontouchstart' in window;

    if (!isTouch) return 'mobile';

    if (width >= 768) return 'tablet';
    if (width >= 414) return 'phablet';
    return 'mobile';
  }

  private async collectNetworkInformation() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      this.networkObserver = connection;

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.updateNetworkInfo();
        this.checkNetworkPerformance();
      });

      this.updateNetworkInfo();
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.handleNetworkChange('online');
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange('offline');
    });
  }

  private updateNetworkInfo() {
    if (!this.metrics || !this.networkObserver) return;

    this.metrics.network = {
      ...this.metrics.network,
      type: this.networkObserver.type || 'unknown',
      effectiveType: this.networkObserver.effectiveType || 'unknown',
      downlink: this.networkObserver.downlink || 0,
      rtt: this.networkObserver.rtt || 0,
      saveData: this.networkObserver.saveData || false,
      online: navigator.onLine
    };
  }

  private updateBatteryInfo() {
    if (!this.metrics || !this.batteryManager) return;

    this.metrics.battery = {
      level: this.batteryManager.level,
      charging: this.batteryManager.charging,
      impact: this.calculateBatteryImpact(this.batteryManager.level)
    };

    // Listen for battery changes
    this.batteryManager.addEventListener('levelchange', () => {
      this.updateBatteryInfo();
      this.checkBatteryImpact();
    });

    this.batteryManager.addEventListener('chargingchange', () => {
      this.updateBatteryInfo();
      this.checkBatteryImpact();
    });
  }

  private calculateBatteryImpact(level: number): 'low' | 'medium' | 'high' {
    if (level > 0.5) return 'low';
    if (level > 0.2) return 'medium';
    return 'high';
  }

  private setupTouchMonitoring() {
    if (!this.metrics) return;

    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchResponses: number[] = [];

    const touchStart = (event: TouchEvent) => {
      touchStartTime = performance.now();
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };

    const touchEnd = (event: TouchEvent) => {
      if (touchStartTime === 0) return;

      const responseTime = performance.now() - touchStartTime;
      touchResponses.push(responseTime);

      // Calculate tap accuracy
      const touch = event.changedTouches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStartX, 2) +
        Math.pow(touch.clientY - touchStartY, 2)
      );

      // Update metrics
      this.metrics.interactions.touchResponseTime =
        touchResponses.reduce((sum, time) => sum + time, 0) / touchResponses.length;

      // Keep only last 50 measurements
      if (touchResponses.length > 50) {
        touchResponses.splice(0, touchResponses.length - 50);
      }

      // Check for performance issues
      if (responseTime > MOBILE_PERFORMANCE_THRESHOLDS.touchResponseTime) {
        this.createAlert({
          type: 'interaction',
          severity: responseTime > 200 ? 'critical' : 'warning',
          title: 'Slow Touch Response',
          message: `Touch response time: ${responseTime.toFixed(1)}ms`,
          value: responseTime,
          threshold: MOBILE_PERFORMANCE_THRESHOLDS.touchResponseTime,
          context: 'touch-interaction',
          recommendations: [
            'Optimize event handlers',
            'Reduce JavaScript execution time',
            'Use CSS touch-action property'
          ]
        });
      }

      touchStartTime = 0;
    };

    // Add touch listeners
    document.addEventListener('touchstart', touchStart, { passive: true });
    document.addEventListener('touchend', touchEnd, { passive: true });

    this.touchListeners.push(
      { handleEvent: touchStart } as EventListener,
      { handleEvent: touchEnd } as EventListener
    );
  }

  private setupRenderingMonitoring() {
    if (!this.metrics) return;

    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    let droppedFrames = 0;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.rendering.frameRate = fps;

        // Check for dropped frames
        if (fps < MOBILE_PERFORMANCE_THRESHOLDS.frameRate) {
          droppedFrames++;
          this.createAlert({
            type: 'performance',
            severity: fps < 45 ? 'critical' : 'warning',
            title: 'Low Frame Rate',
            message: `Frame rate: ${fps}fps (threshold: ${MOBILE_PERFORMANCE_THRESHOLDS.frameRate}fps)`,
            value: fps,
            threshold: MOBILE_PERFORMANCE_THRESHOLDS.frameRate,
            context: 'rendering',
            recommendations: [
              'Optimize animations',
              'Reduce layout calculations',
              'Use CSS transforms instead of layout properties',
              'Implement object pooling for complex animations'
            ]
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
      }
    };

    this.frameRateMonitor = requestAnimationFrame(measureFrameRate);

    // Monitor paint performance
    this.setupPaintMonitoring();
  }

  private setupPaintMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            this.metrics!.rendering.paintTime = Math.max(
              this.metrics!.rendering.paintTime,
              entry.startTime
            );
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Paint monitoring not supported:', error);
    }
  }

  private setupBatteryMonitoring() {
    if (!this.batteryManager) return;

    // Monitor battery drain over time
    let lastBatteryLevel = this.batteryManager.level;
    let lastCheckTime = Date.now();

    setInterval(() => {
      const currentLevel = this.batteryManager.level;
      const timeDiff = (Date.now() - lastCheckTime) / 1000 / 3600; // hours
      const drainRate = (lastBatteryLevel - currentLevel) / timeDiff * 100; // percentage per hour

      if (drainRate > MOBILE_PERFORMANCE_THRESHOLDS.batteryDrainRate && !this.batteryManager.charging) {
        this.createAlert({
          type: 'battery',
          severity: drainRate > 10 ? 'critical' : 'warning',
          title: 'High Battery Drain',
          message: `Battery drain rate: ${drainRate.toFixed(1)}% per hour`,
          value: drainRate,
          threshold: MOBILE_PERFORMANCE_THRESHOLDS.batteryDrainRate,
          context: 'battery-usage',
          recommendations: [
            'Reduce background processing',
            'Optimize animations and transitions',
            'Decrease network request frequency',
            'Implement adaptive quality based on battery level'
          ]
        });
      }

      lastBatteryLevel = currentLevel;
      lastCheckTime = Date.now();
    }, 60000); // Check every minute
  }

  private setupMemoryMonitoring() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;

      this.metrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        pressure: this.calculateMemoryPressure(memory.usedJSHeapSize, memory.jsHeapSizeLimit)
      };

      // Check for memory pressure
      if (memory.usedJSHeapSize > MOBILE_PERFORMANCE_THRESHOLDS.memoryUsage) {
        this.createAlert({
          type: 'memory',
          severity: memory.usedJSHeapSize > MOBILE_PERFORMANCE_THRESHOLDS.memoryUsage * 1.5 ? 'critical' : 'warning',
          title: 'High Memory Usage',
          message: `Memory usage: ${this.formatBytes(memory.usedJSHeapSize)}`,
          value: memory.usedJSHeapSize,
          threshold: MOBILE_PERFORMANCE_THRESHOLDS.memoryUsage,
          context: 'memory-usage',
          recommendations: [
            'Clear unused objects and references',
            'Implement object pooling',
            'Optimize data structures',
            'Use lazy loading for large datasets'
          ]
        });
      }
    }, 10000); // Check every 10 seconds
  }

  private calculateMemoryPressure(used: number, limit: number): 'low' | 'medium' | 'high' {
    const percentage = (used / limit) * 100;
    if (percentage > 80) return 'high';
    if (percentage > 60) return 'medium';
    return 'low';
  }

  private setupNetworkMonitoring() {
    // Monitor resource loading performance
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.analyzeResourcePerformance(entry as PerformanceResourceTiming);
            }
          });
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource monitoring not supported:', error);
      }
    }

    // Monitor long API calls
    this.setupAPIMonitoring();
  }

  private analyzeResourcePerformance(entry: PerformanceResourceTiming) {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.requestStart;

    // Check for slow resources on mobile
    if (loadTime > MOBILE_PERFORMANCE_THRESHOLDS.slowNetworkThreshold) {
      this.createAlert({
        type: 'network',
        severity: loadTime > MOBILE_PERFORMANCE_THRESHOLDS.slowNetworkThreshold * 2 ? 'critical' : 'warning',
        title: 'Slow Resource Loading',
        message: `${resourceType} load time: ${loadTime.toFixed(1)}ms`,
        value: loadTime,
        threshold: MOBILE_PERFORMANCE_THRESHOLDS.slowNetworkThreshold,
        context: `resource-${resourceType}`,
        recommendations: [
          'Optimize resource size',
          'Implement resource compression',
          'Use CDN for static assets',
          'Implement resource preloading for critical resources'
        ]
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)$/i.test(url)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private setupAPIMonitoring() {
    // Intercept fetch calls to monitor API performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [url, options] = args;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Check API response time
        if (duration > 2000 && url.includes('/api/')) {
          this.createAlert({
            type: 'network',
            severity: duration > 5000 ? 'critical' : 'warning',
            title: 'Slow API Response',
            message: `API call to ${url} took ${duration.toFixed(1)}ms`,
            value: duration,
            threshold: 2000,
            context: 'api-response',
            recommendations: [
              'Optimize database queries',
              'Implement API response caching',
              'Use request batching',
              'Implement pagination for large datasets'
            ]
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.createAlert({
          type: 'network',
          severity: 'critical',
          title: 'API Request Failed',
          message: `API call to ${url} failed after ${duration.toFixed(1)}ms: ${error.message}`,
          value: duration,
          threshold: 10000,
          context: 'api-error',
          recommendations: [
            'Check network connectivity',
            'Implement retry logic with exponential backoff',
            'Add offline support for critical features',
            'Monitor API health and availability'
          ]
        });

        throw error;
      }
    };
  }

  private startContinuousMonitoring() {
    // Collect comprehensive metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectComprehensiveMetrics();
    }, 30000);

    // Initial collection
    this.collectComprehensiveMetrics();
  }

  private async collectComprehensiveMetrics() {
    if (!this.metrics) return;

    // Update device metrics
    this.metrics.device.batteryLevel = this.batteryManager?.level || 1;
    this.metrics.device.isCharging = this.batteryManager?.charging || true;

    // Update network metrics
    this.updateNetworkInfo();

    // Check overall performance
    this.checkOverallPerformance();

    // Send metrics to analytics
    await this.sendMetrics();
  }

  private checkOverallPerformance() {
    if (!this.metrics) return;

    // Calculate overall performance score
    let score = 100;

    // Deduct points for poor metrics
    if (this.metrics.rendering.frameRate < MOBILE_PERFORMANCE_THRESHOLDS.frameRate) {
      score -= 20;
    }

    if (this.metrics.interactions.touchResponseTime > MOBILE_PERFORMANCE_THRESHOLDS.touchResponseTime) {
      score -= 15;
    }

    if (this.metrics.memory.pressure === 'high') {
      score -= 15;
    }

    if (this.metrics.battery.impact === 'high') {
      score -= 10;
    }

    // Generate overall performance alert
    if (score < 70) {
      this.createAlert({
        type: 'performance',
        severity: score < 50 ? 'critical' : 'warning',
        title: 'Poor Mobile Performance',
        message: `Overall mobile performance score: ${score}/100`,
        value: score,
        threshold: 70,
        context: 'overall-performance',
        recommendations: [
          'Implement mobile-specific optimizations',
          'Reduce animation complexity',
          'Optimize asset loading for mobile networks',
          'Consider progressive enhancement for low-end devices'
        ]
      });
    }
  }

  private async sendMetrics() {
    if (!this.metrics) return;

    try {
      await fetch('/api/analytics/mobile-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          metrics: this.metrics,
          alerts: this.alerts.filter(alert => Date.now() - alert.timestamp < 300000) // Last 5 minutes
        })
      });
    } catch (error) {
      console.warn('Failed to send mobile performance metrics:', error);
    }
  }

  private handleNetworkChange(status: 'online' | 'offline') {
    if (!this.metrics) return;

    this.metrics.network.online = status === 'online';

    this.createAlert({
      type: 'network',
      severity: 'info',
      title: `Network Status: ${status.toUpperCase()}`,
      message: `Device is now ${status}`,
      value: status === 'online' ? 1 : 0,
      threshold: 0,
      context: 'network-status',
      recommendations: status === 'offline' ? [
        'Enable offline functionality',
        'Cache critical resources',
        'Implement service worker',
        'Show user-friendly offline message'
      ] : []
    });
  }

  private checkNetworkPerformance() {
    if (!this.metrics) return;

    const { effectiveType, saveData } = this.metrics.network;

    if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
      this.createAlert({
        type: 'network',
        severity: 'warning',
        title: 'Slow Network Detected',
        message: `Network type: ${effectiveType}, Data saver: ${saveData}`,
        value: 0,
        threshold: 0,
        context: 'network-performance',
        recommendations: [
          'Enable data-saving mode',
          'Reduce image quality',
          'Minimize JavaScript bundles',
          'Implement adaptive loading based on network speed'
        ]
      });
    }
  }

  private checkBatteryImpact() {
    if (!this.metrics) return;

    const { battery, charging } = this.metrics;

    if (!charging && battery.impact === 'high') {
      this.createAlert({
        type: 'battery',
        severity: 'warning',
        title: 'Low Battery - High Impact',
        message: `Battery level: ${(battery.level * 100).toFixed(1)}%`,
        value: battery.level * 100,
        threshold: 20,
        context: 'battery-low',
        recommendations: [
          'Reduce animation frequency',
          'Decrease update intervals',
          'Disable non-essential features',
          'Show battery optimization prompts'
        ]
      });
    }
  }

  private createAlert(alert: Omit<MobilePerformanceAlert, 'id' | 'timestamp'>) {
    const fullAlert: MobilePerformanceAlert = {
      id: `mobile_alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...alert
    };

    this.alerts.push(fullAlert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.splice(0, this.alerts.length - 50);
    }

    // Send immediate notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendAlertNotification(fullAlert);
    }

    // Dispatch event for UI components
    window.dispatchEvent(new CustomEvent('mobile-performance-alert', {
      detail: fullAlert
    }));
  }

  private async sendAlertNotification(alert: MobilePerformanceAlert) {
    try {
      await fetch('/api/notifications/mobile-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.warn('Failed to send mobile performance alert:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public API methods
  public getMetrics(): MobilePerformanceMetrics | null {
    return this.metrics;
  }

  public getAlerts(): MobilePerformanceAlert[] {
    return this.alerts;
  }

  public getActiveAlerts(): MobilePerformanceAlert[] {
    const fiveMinutesAgo = Date.now() - 300000;
    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
  }

  public getOptimizations(): MobileOptimization[] {
    return MOBILE_OPTIMIZATIONS;
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      // Mark as acknowledged (would need to extend interface)
      console.log(`Alert acknowledged: ${alert.title}`);
    }
  }

  public forcePerformanceCheck(): void {
    this.collectComprehensiveMetrics();
  }

  public destroy(): void {
    this.isMonitoring = false;

    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }

    // Remove event listeners
    this.touchListeners.forEach(listener => {
      document.removeEventListener('touchstart', listener);
      document.removeEventListener('touchend', listener);
    });
    this.touchListeners = [];

    console.log('📱 Mobile performance monitoring destroyed');
  }
}

// Global instance
let mobilePerformanceInstance: MobilePerformanceMonitoring | null = null;

export const initializeMobilePerformanceMonitoring = () => {
  if (!mobilePerformanceInstance && typeof window !== 'undefined') {
    mobilePerformanceInstance = new MobilePerformanceMonitoring();
  }
  return mobilePerformanceInstance;
};

export const getMobilePerformanceMonitoring = () => mobilePerformanceInstance;

export { MobilePerformanceMonitoring };
export default MobilePerformanceMonitoring;