import { performance } from 'perf_hooks';

/**
 * Support Performance Monitor
 * Real-time performance monitoring and optimization for luxury support systems
 */

interface PerformanceMetrics {
  // Response time metrics
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  responseTimeTrend: number[];

  // System performance
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  databaseQueryTime: number;
  apiResponseTime: number;

  // User experience metrics
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;

  // Support operations metrics
  ticketsProcessed: number;
  resolutionRate: number;
  escalationsRate: number;
  automationRate: number;

  // Error and reliability
  errorRate: number;
  uptime: number;
  availability: number;
  failedRequests: number;

  // Mobile specific
  mobilePerformanceScore: number;
  touchResponseTime: number;
  batteryUsage: number;
  networkQuality: string;

  timestamp: number;
}

interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

interface OptimizationRecommendation {
  id: string;
  category: 'performance' | 'user_experience' | 'mobile' | 'server' | 'database';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  implementation: string[];
}

class SupportPerformanceMonitor {
  private static instance: SupportPerformanceMonitor;
  private metrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private observers: PerformanceObserver[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Performance thresholds
  private readonly THRESHOLDS = {
    avgResponseTime: 2000, // ms
    p95ResponseTime: 5000, // ms
    errorRate: 0.01, // 1%
    cpuUsage: 80, // %
    memoryUsage: 85, // %
    availability: 99.9, // %
    mobilePerformanceScore: 85, // %
    firstContentfulPaint: 2000, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100 // ms
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.setupWebVitalsMonitoring();
    this.setupResourceMonitoring();
    this.generateInitialRecommendations();
  }

  public static getInstance(): SupportPerformanceMonitor {
    if (!SupportPerformanceMonitor.instance) {
      SupportPerformanceMonitor.instance = new SupportPerformanceMonitor();
    }
    return SupportPerformanceMonitor.instance;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      responseTimeTrend: [],
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0,
      databaseQueryTime: 0,
      apiResponseTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      ticketsProcessed: 0,
      resolutionRate: 0,
      escalationsRate: 0,
      automationRate: 0,
      errorRate: 0,
      uptime: 100,
      availability: 100,
      failedRequests: 0,
      mobilePerformanceScore: 100,
      touchResponseTime: 0,
      batteryUsage: 0,
      networkQuality: 'unknown',
      timestamp: Date.now()
    };
  }

  // ========== MONITORING SETUP ==========

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🚀 Support Performance Monitor started');

    // Start continuous monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.checkThresholds();
    }, 5000); // Collect metrics every 5 seconds

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Monitor network changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', this.handleNetworkChange);
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      this.monitorMemoryUsage();
    }
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if ('connection' in navigator) {
      (navigator as any).connection.removeEventListener('change', this.handleNetworkChange);
    }

    console.log('⏹️ Support Performance Monitor stopped');
  }

  private setupWebVitalsMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cumulativeLayoutShift += clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Some performance observers not supported:', error);
      }
    }
  }

  private setupResourceMonitoring(): void {
    // Monitor API calls and resource loading
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        // Track API response time
        this.metrics.apiResponseTime = this.calculateMovingAverage(
          this.metrics.apiResponseTime,
          duration,
          10
        );

        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.metrics.failedRequests++;
        this.metrics.errorRate = this.metrics.failedRequests / this.metrics.ticketsProcessed;
        throw error;
      }
    };
  }

  // ========== METRICS COLLECTION ==========

  private collectMetrics(): void {
    const now = Date.now();

    // Update timestamp
    this.metrics.timestamp = now;

    // Collect system metrics
    this.collectSystemMetrics();

    // Collect mobile-specific metrics
    this.collectMobileMetrics();

    // Collect support operation metrics
    this.collectSupportMetrics();

    // Store in history (keep last 100 entries)
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
  }

  private collectSystemMetrics(): void {
    // CPU Usage (approximation based on performance timing)
    const cpuUsage = this.calculateCPUUsage();
    this.metrics.cpuUsage = this.calculateMovingAverage(this.metrics.cpuUsage, cpuUsage, 5);

    // Memory Usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100;
      this.metrics.memoryUsage = this.calculateMovingAverage(this.metrics.memoryUsage, usedMemory, 5);
    }

    // Network Quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.networkQuality = connection.effectiveType || 'unknown';
      this.metrics.networkLatency = connection.rtt || 0;
    }
  }

  private collectMobileMetrics(): void {
    // Touch response time
    if ('ontouchstart' in window) {
      // This would be measured through actual touch interactions
      // For now, we'll use a placeholder
      this.metrics.touchResponseTime = 50; // ms
    }

    // Battery usage (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.metrics.batteryUsage = battery.level * 100;
      });
    }

    // Calculate mobile performance score
    this.metrics.mobilePerformanceScore = this.calculateMobilePerformanceScore();
  }

  private collectSupportMetrics(): void {
    // These would be populated from actual support system data
    // For now, we'll use mock values that would come from the support services

    // Response time trends
    const mockResponseTime = 800 + Math.random() * 400; // 800-1200ms
    this.metrics.responseTimeTrend.push(mockResponseTime);
    if (this.metrics.responseTimeTrend.length > 20) {
      this.metrics.responseTimeTrend.shift();
    }

    // Calculate statistics
    const sortedTimes = [...this.metrics.responseTimeTrend].sort((a, b) => a - b);
    this.metrics.avgResponseTime = this.calculateAverage(this.metrics.responseTimeTrend);
    this.metrics.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    this.metrics.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    // Mock support operation metrics
    this.metrics.resolutionRate = 95 + Math.random() * 4; // 95-99%
    this.metrics.escalationsRate = 2 + Math.random() * 3; // 2-5%
    this.metrics.automationRate = 60 + Math.random() * 20; // 60-80%
  }

  // ========== PERFORMANCE ANALYSIS ==========

  private analyzePerformance(): void {
    // Analyze trends and patterns
    this.analyzeResponseTimeTrends();
    this.analyzeErrorRates();
    this.analyzeUserExperience();
    this.analyzeMobilePerformance();
  }

  private analyzeResponseTimeTrends(): void {
    if (this.metrics.responseTimeTrend.length < 10) return;

    const recent = this.metrics.responseTimeTrend.slice(-5);
    const previous = this.metrics.responseTimeTrend.slice(-10, -5);

    const recentAvg = this.calculateAverage(recent);
    const previousAvg = this.calculateAverage(previous);

    const trend = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (trend > 10) {
      this.createAlert('warning', 'avgResponseTime', recentAvg, this.THRESHOLDS.avgResponseTime,
        `Response time increased by ${trend.toFixed(1)}%`);
    }
  }

  private analyzeErrorRates(): void {
    if (this.metrics.errorRate > this.THRESHOLDS.errorRate) {
      this.createAlert('critical', 'errorRate', this.metrics.errorRate, this.THRESHOLDS.errorRate,
        `Error rate ${(this.metrics.errorRate * 100).toFixed(2)}% exceeds threshold`);
    }
  }

  private analyzeUserExperience(): void {
    // Check Core Web Vitals
    if (this.metrics.largestContentfulPaint > this.THRESHOLDS.largestContentfulPaint) {
      this.createAlert('warning', 'largestContentfulPaint', this.metrics.largestContentfulPaint,
        this.THRESHOLDS.largestContentfulPaint, 'LCP threshold exceeded');
    }

    if (this.metrics.cumulativeLayoutShift > this.THRESHOLDS.cumulativeLayoutShift) {
      this.createAlert('warning', 'cumulativeLayoutShift', this.metrics.cumulativeLayoutShift,
        this.THRESHOLDS.cumulativeLayoutShift, 'CLS threshold exceeded');
    }

    if (this.metrics.firstInputDelay > this.THRESHOLDS.firstInputDelay) {
      this.createAlert('warning', 'firstInputDelay', this.metrics.firstInputDelay,
        this.THRESHOLDS.firstInputDelay, 'FID threshold exceeded');
    }
  }

  private analyzeMobilePerformance(): void {
    if (this.metrics.mobilePerformanceScore < this.THRESHOLDS.mobilePerformanceScore) {
      this.createAlert('warning', 'mobilePerformanceScore', this.metrics.mobilePerformanceScore,
        this.THRESHOLDS.mobilePerformanceScore, 'Mobile performance score below threshold');
    }
  }

  // ========== THRESHOLD MONITORING ==========

  private checkThresholds(): void {
    Object.entries(this.THRESHOLDS).forEach(([metric, threshold]) => {
      const value = (this.metrics as any)[metric];
      if (value > threshold) {
        this.createAlert('warning', metric, value, threshold, `${metric} exceeded threshold`);
      }
    });
  }

  // ========== OPTIMIZATION RECOMMENDATIONS ==========

  private generateInitialRecommendations(): void {
    this.recommendations = [
      {
        id: 'opt1',
        category: 'performance',
        priority: 'high',
        title: 'Implement Response Caching',
        description: 'Cache frequently accessed support data to reduce API response times',
        impact: 'Reduce average response time by 30-40%',
        effort: 'medium',
        estimatedImprovement: '200-300ms faster response times',
        implementation: [
          'Implement Redis caching for frequently accessed data',
          'Cache agent availability status',
          'Cache knowledge base articles',
          'Implement client-side caching for static data'
        ]
      },
      {
        id: 'opt2',
        category: 'mobile',
        priority: 'high',
        title: 'Optimize Mobile Touch Interactions',
        description: 'Improve touch response times and mobile user experience',
        impact: 'Better mobile user experience and higher satisfaction',
        effort: 'low',
        estimatedImprovement: '50ms faster touch response',
        implementation: [
          'Optimize touch event handlers',
          'Implement touch-specific CSS optimizations',
          'Reduce animation complexity on mobile',
          'Optimize image loading for mobile'
        ]
      },
      {
        id: 'opt3',
        category: 'user_experience',
        priority: 'medium',
        title: 'Implement Progressive Loading',
        description: 'Load support interface progressively for faster initial render',
        impact: 'Faster perceived load times and better user experience',
        effort: 'medium',
        estimatedImprovement: '40-50% faster initial render',
        implementation: [
          'Implement lazy loading for non-critical components',
          'Use code splitting for support features',
          'Optimize critical rendering path',
          'Implement skeleton loading states'
        ]
      },
      {
        id: 'opt4',
        category: 'performance',
        priority: 'medium',
        title: 'Database Query Optimization',
        description: 'Optimize database queries for better support system performance',
        impact: 'Faster data retrieval and improved system responsiveness',
        effort: 'high',
        estimatedImprovement: '50-60% faster database operations',
        implementation: [
          'Add appropriate database indexes',
          'Optimize complex queries',
          'Implement query result caching',
          'Use database connection pooling'
        ]
      },
      {
        id: 'opt5',
        category: 'server',
        priority: 'low',
        title: 'Implement CDN for Static Assets',
        description: 'Use CDN to deliver static assets faster to global users',
        impact: 'Faster asset loading and improved global performance',
        effort: 'low',
        estimatedImprovement: '30-40% faster asset loading',
        implementation: [
          'Configure CDN for static assets',
          'Implement asset versioning',
          'Optimize asset compression',
          'Use modern image formats'
        ]
      }
    ];
  }

  // ========== UTILITY METHODS ==========

  private calculateMovingAverage(current: number, newValue: number, period: number): number {
    return (current * (period - 1) + newValue) / period;
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateCPUUsage(): number {
    // Simplified CPU usage calculation based on performance timing
    const start = performance.now();
    const iterations = 1000000;
    let result = 0;

    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }

    const duration = performance.now() - start;
    return Math.min((duration / 10) * 100, 100); // Normalize to percentage
  }

  private calculateMobilePerformanceScore(): number {
    let score = 100;

    // Factor in touch response time
    if (this.metrics.touchResponseTime > 100) {
      score -= 20;
    }

    // Factor in network quality
    if (this.metrics.networkQuality === 'slow-2g' || this.metrics.networkQuality === '2g') {
      score -= 30;
    } else if (this.metrics.networkQuality === '3g') {
      score -= 15;
    }

    // Factor in battery usage
    if (this.metrics.batteryUsage < 20) {
      score -= 10;
    }

    // Factor in Core Web Vitals
    if (this.metrics.largestContentfulPaint > 4000) {
      score -= 25;
    } else if (this.metrics.largestContentfulPaint > 2500) {
      score -= 15;
    }

    if (this.metrics.cumulativeLayoutShift > 0.25) {
      score -= 20;
    } else if (this.metrics.cumulativeLayoutShift > 0.1) {
      score -= 10;
    }

    if (this.metrics.firstInputDelay > 300) {
      score -= 20;
    } else if (this.metrics.firstInputDelay > 100) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private createAlert(type: 'critical' | 'warning' | 'info', metric: string, value: number, threshold: number, message: string): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (type === 'critical') {
      console.error('🚨 Performance Alert:', alert);
    } else if (type === 'warning') {
      console.warn('⚠️ Performance Warning:', alert);
    }
  }

  private monitorMemoryUsage(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100;

      if (usage > 90) {
        this.createAlert('critical', 'memoryUsage', usage, 90, 'Memory usage critically high');
      }
    };

    setInterval(checkMemory, 10000); // Check every 10 seconds
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Page is hidden, pause non-essential monitoring
      console.log('📱 Page hidden, reducing monitoring frequency');
    } else {
      // Page is visible, resume normal monitoring
      console.log('📱 Page visible, resuming normal monitoring');
    }
  };

  private handleNetworkChange = (): void => {
    const connection = (navigator as any).connection;
    console.log('🌐 Network changed:', connection.effectiveType);

    // Adjust monitoring frequency based on network quality
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Reduce monitoring frequency on slow networks
      console.log('📶 Slow network detected, reducing monitoring overhead');
    }
  };

  // ========== PUBLIC API ==========

  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  public recordSupportOperation(duration: number, success: boolean): void {
    this.metrics.ticketsProcessed++;

    if (!success) {
      this.metrics.failedRequests++;
    }

    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.ticketsProcessed;

    // Update response time trend
    this.metrics.responseTimeTrend.push(duration);
    if (this.metrics.responseTimeTrend.length > 20) {
      this.metrics.responseTimeTrend.shift();
    }
  }

  public getPerformanceReport(): {
    summary: any;
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: OptimizationRecommendation[];
    trends: any;
  } {
    return {
      summary: {
        overallScore: this.calculateOverallScore(),
        status: this.getSystemStatus(),
        criticalIssues: this.getActiveAlerts().filter(a => a.type === 'critical').length,
        warnings: this.getActiveAlerts().filter(a => a.type === 'warning').length
      },
      metrics: this.getCurrentMetrics(),
      alerts: this.getActiveAlerts(),
      recommendations: this.getRecommendations(),
      trends: {
        responseTime: this.metrics.responseTimeTrend,
        errorRate: this.metricsHistory.map(h => h.errorRate),
        performance: this.metricsHistory.map(h => h.mobilePerformanceScore)
      }
    };
  }

  private calculateOverallScore(): number {
    let score = 100;

    // Response time impact
    if (this.metrics.avgResponseTime > this.THRESHOLDS.avgResponseTime) {
      score -= 20;
    }

    // Error rate impact
    if (this.metrics.errorRate > this.THRESHOLDS.errorRate) {
      score -= 25;
    }

    // Mobile performance impact
    score -= (100 - this.metrics.mobilePerformanceScore) * 0.3;

    // Core Web Vitals impact
    if (this.metrics.largestContentfulPaint > this.THRESHOLDS.largestContentfulPaint) {
      score -= 15;
    }

    if (this.metrics.cumulativeLayoutShift > this.THRESHOLDS.cumulativeLayoutShift) {
      score -= 10;
    }

    if (this.metrics.firstInputDelay > this.THRESHOLDS.firstInputDelay) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  private getSystemStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    const criticalAlerts = this.getActiveAlerts().filter(a => a.type === 'critical').length;
    const warningAlerts = this.getActiveAlerts().filter(a => a.type === 'warning').length;

    if (criticalAlerts > 0) return 'critical';
    if (warningAlerts > 3) return 'warning';
    if (warningAlerts > 0) return 'good';
    return 'excellent';
  }
}

// Export singleton instance
export const supportPerformanceMonitor = SupportPerformanceMonitor.getInstance();