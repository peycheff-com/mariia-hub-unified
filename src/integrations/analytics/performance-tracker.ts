import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { ga4Analytics } from './ga4';
import { behaviorTracker } from './behavior-tracker';

// Performance Metrics Interface
export interface CoreWebVitals {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

export interface PerformanceMetrics {
  page_url: string;
  timestamp: number;
  core_web_vitals: CoreWebVitals;
  navigation_timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  };
  resource_timing: Array<{
    name: string;
    type: string;
    duration: number;
    size: number;
    cached: boolean;
  }>;
  user_experience: {
    totalClicks: number;
    totalScrolls: number;
    rageClicks: number;
    deadClicks: number;
    formErrors: number;
    javascriptErrors: number;
  };
  conversion_impact: {
    bookingStarted: boolean;
    bookingCompleted: boolean;
    conversionTime: number;
    abandonmentPoint?: number;
  };
  device_info: {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string;
    memoryLimit?: number;
    hardwareConcurrency: number;
  };
  environmental_factors: {
    pageViews: number;
    sessionDuration: number;
    browserTabs: number;
    batteryLevel?: number;
  };
}

export interface PerformanceAlert {
  id: string;
  metric_name: string;
  threshold_violated: number;
  current_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  page_url: string;
  device_type: string;
  timestamp: number;
  user_impact: {
    affected_users: number;
    conversion_rate_impact: number;
    revenue_impact: number;
  };
  recommended_actions: string[];
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Partial<CoreWebVitals> = {};
  private navigationStartTime: number = 0;
  private resourceEntries: PerformanceResourceTiming[] = [];
  private userInteractions: {
    clicks: number;
    scrolls: number;
    rageClicks: number;
    deadClicks: number;
    formErrors: number;
    jsErrors: number;
  } = {
    clicks: 0,
    scrolls: 0,
    rageClicks: 0,
    deadClicks: 0,
    formErrors: 0,
    jsErrors: 0,
  };
  private conversionTracking: {
    bookingStarted: boolean;
    bookingCompleted: boolean;
    bookingStartTime?: number;
    bookingCompletionTime?: number;
    abandonmentPoint?: number;
  } = {
    bookingStarted: false,
    bookingCompleted: false,
  };
  private isTracking: boolean = false;
  private performanceThresholds = {
    cls: { poor: 0.25, needs_improvement: 0.1 },
    fid: { poor: 300, needs_improvement: 100 },
    fcp: { poor: 3000, needs_improvement: 1800 },
    lcp: { poor: 4000, needs_improvement: 2500 },
    ttfb: { poor: 1000, needs_improvement: 600 },
    inp: { poor: 500, needs_improvement: 200 },
  };

  constructor() {
    this.initializeTracking();
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  private async initializeTracking(): Promise<void> {
    if (this.isTracking) return;

    this.isTracking = true;
    this.navigationStartTime = performance.now();

    // Track Core Web Vitals
    this.trackCoreWebVitals();

    // Track Navigation Timing
    this.trackNavigationTiming();

    // Track Resource Timing
    this.trackResourceTiming();

    // Track User Interactions
    this.trackUserInteractions();

    // Track Conversion Impact
    this.trackConversionImpact();

    // Track Environmental Factors
    this.trackEnvironmentalFactors();

    // Set up error tracking
    this.setupErrorTracking();

    // Report metrics when page is fully loaded
    if (document.readyState === 'complete') {
      setTimeout(() => this.reportMetrics(), 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.reportMetrics(), 1000);
      });
    }
  }

  private trackCoreWebVitals(): void {
    // Cumulative Layout Shift
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.evaluateMetricThreshold('CLS', metric.value);
    });

    // First Input Delay
    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.evaluateMetricThreshold('FID', metric.value);
    });

    // First Contentful Paint
    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.evaluateMetricThreshold('FCP', metric.value);
    });

    // Largest Contentful Paint
    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.evaluateMetricThreshold('LCP', metric.value);
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.evaluateMetricThreshold('TTFB', metric.value);
    });

    // Interaction to Next Paint
    getINP((metric) => {
      this.metrics.inp = metric.value;
      this.evaluateMetricThreshold('INP', metric.value);
    });
  }

  private trackNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        // Navigation timing data will be collected when reporting metrics
      }
    }
  }

  private trackResourceTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        this.resourceEntries.push(...entries);
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private trackUserInteractions(): void {
    // Track clicks
    document.addEventListener('click', () => {
      this.userInteractions.clicks++;
    }, true);

    // Track scrolls (throttled)
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.userInteractions.scrolls++;
      }, 100);
    });

    // Track form errors
    document.addEventListener('invalid', (event) => {
      this.userInteractions.formErrors++;
    }, true);

    // Track JavaScript errors
    window.addEventListener('error', () => {
      this.userInteractions.jsErrors++;
    });

    // Track rage clicks (multiple rapid clicks in same area)
    this.trackRageClicks();
  }

  private trackRageClicks(): void {
    const clickTimestamps: Map<string, number[]> = new Map();

    document.addEventListener('click', (event) => {
      const x = Math.floor(event.clientX / 50);
      const y = Math.floor(event.clientY / 50);
      const key = `${x}_${y}`;
      const now = Date.now();

      if (!clickTimestamps.has(key)) {
        clickTimestamps.set(key, []);
      }

      const timestamps = clickTimestamps.get(key)!;
      timestamps.push(now);

      // Remove old timestamps (older than 1 second)
      const recentTimestamps = timestamps.filter(t => now - t < 1000);
      clickTimestamps.set(key, recentTimestamps);

      // Check for rage clicks (3+ clicks in 1 second in same area)
      if (recentTimestamps.length >= 3) {
        this.userInteractions.rageClicks++;
      }
    }, true);
  }

  private trackConversionImpact(): void {
    // Listen for booking start events
    const bookingStartObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const bookingWizard = document.querySelector('[data-booking-wizard]');
          if (bookingWizard && !this.conversionTracking.bookingStarted) {
            this.conversionTracking.bookingStarted = true;
            this.conversionTracking.bookingStartTime = Date.now();
          }
        }
      });
    });

    bookingStartObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Listen for booking completion
    document.addEventListener('booking_completed', (event: any) => {
      this.conversionTracking.bookingCompleted = true;
      this.conversionTracking.bookingCompletionTime = Date.now();
    });

    // Listen for booking abandonment
    document.addEventListener('booking_abandoned', (event: any) => {
      this.conversionTracking.abandonmentPoint = event.detail.step;
    });
  }

  private trackEnvironmentalFactors(): void {
    // Track page visibility changes
    let visibilityStartTime = Date.now();
    let totalVisibleTime = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        totalVisibleTime += Date.now() - visibilityStartTime;
      } else {
        visibilityStartTime = Date.now();
      }
    });

    // Track browser tab count (approximation)
    const tabCount = this.estimateBrowserTabCount();
  }

  private setupErrorTracking(): void {
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.userInteractions.jsErrors++;
      console.error('Unhandled promise rejection:', event.reason);
    });

    // Track resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.userInteractions.jsErrors++;
        console.error('Resource loading error:', event.target);
      }
    }, true);
  }

  private evaluateMetricThreshold(metricName: string, value: number): void {
    const threshold = this.performanceThresholds[metricName.toLowerCase() as keyof typeof this.performanceThresholds];
    if (!threshold) return;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let status = 'good';

    if (value >= threshold.poor) {
      severity = 'critical';
      status = 'poor';
    } else if (value >= threshold.needs_improvement) {
      severity = 'high';
      status = 'needs_improvement';
    }

    if (status !== 'good') {
      this.createPerformanceAlert({
        metric_name: metricName,
        threshold_violated: threshold.needs_improvement,
        current_value: value,
        severity,
        page_url: window.location.href,
        device_type: this.getDeviceType(),
        timestamp: Date.now(),
        user_impact: {
          affected_users: 1, // Would be calculated from aggregate data
          conversion_rate_impact: this.calculateConversionImpact(metricName, value),
          revenue_impact: this.calculateRevenueImpact(metricName, value),
        },
        recommended_actions: this.getRecommendedActions(metricName, value),
      });
    }

    // Track to GA4
    ga4Analytics.trackCustomEvent({
      event_name: 'core_web_vital',
      parameters: {
        metric_name: metricName.toLowerCase(),
        metric_value: value,
        metric_rating: status,
        page_location: window.location.href,
        device_type: this.getDeviceType(),
        booking_step: 0,
        total_steps: 0,
        currency: 'PLN',
        user_session_id: behaviorTracker.getSessionId(),
        language: navigator.language,
      },
    });
  }

  private calculateConversionImpact(metricName: string, value: number): number {
    // Based on industry research, calculate estimated conversion rate impact
    const impacts: Record<string, { poor: number; needs_improvement: number }> = {
      'CLS': { poor: -5, needs_improvement: -2 },
      'FID': { poor: -8, needs_improvement: -3 },
      'FCP': { poor: -12, needs_improvement: -5 },
      'LCP': { poor: -10, needs_improvement: -4 },
      'TTFB': { poor: -7, needs_improvement: -3 },
      'INP': { poor: -9, needs_improvement: -4 },
    };

    const threshold = this.performanceThresholds[metricName.toLowerCase() as keyof typeof this.performanceThresholds];
    if (!threshold) return 0;

    if (value >= threshold.poor) {
      return impacts[metricName]?.poor || 0;
    } else if (value >= threshold.needs_improvement) {
      return impacts[metricName]?.needs_improvement || 0;
    }

    return 0;
  }

  private calculateRevenueImpact(metricName: string, value: number): number {
    // Estimate revenue impact based on conversion impact and average order value
    const conversionImpact = this.calculateConversionImpact(metricName, value);
    const averageOrderValue = 350; // Placeholder - would come from business data
    const dailyVisitors = 1000; // Placeholder - would come from analytics data

    return Math.abs(conversionImpact * dailyVisitors * averageOrderValue / 100);
  }

  private getRecommendedActions(metricName: string, value: number): string[] {
    const actions: Record<string, string[]> = {
      'CLS': [
        'Always include dimensions for images and videos',
        'Reserve space for ad slots and dynamic content',
        'Avoid inserting content above existing content',
        'Use CSS transforms for animations instead of changing top/left properties',
      ],
      'FID': [
        'Minimize main thread work',
        'Reduce JavaScript execution time',
        'Break up long tasks into smaller chunks',
        'Use web workers for heavy computations',
      ],
      'FCP': [
        'Optimize server response time',
        'Implement resource hints (preload, prefetch)',
        'Optimize CSS delivery',
        'Minimize render-blocking resources',
      ],
      'LCP': [
        'Optimize images and videos',
        'Use modern image formats (WebP, AVIF)',
        'Implement lazy loading for below-the-fold content',
        'Use a CDN for static assets',
      ],
      'TTFB': [
        'Optimize server performance',
        'Implement caching strategies',
        'Use HTTP/2 or HTTP/3',
        'Minimize server-side processing time',
      ],
      'INP': [
        'Optimize event handlers',
        'Avoid long-running JavaScript tasks',
        'Debounce non-critical event handlers',
        'Use requestIdleCallback for non-urgent work',
      ],
    };

    return actions[metricName] || ['Consult performance optimization guidelines'];
  }

  private async createPerformanceAlert(alert: Omit<PerformanceAlert, 'id'>): Promise<void> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await supabase.from('performance_alerts').insert({
        id: alertId,
        ...alert,
        created_at: new Date().toISOString(),
      });

      console.warn(`Performance Alert: ${alert.metric_name} = ${alert.current_value} (${alert.severity})`);
    } catch (error) {
      console.error('Failed to create performance alert:', error);
    }
  }

  private async reportMetrics(): Promise<void> {
    if (!this.isTracking) return;

    const performanceMetrics: PerformanceMetrics = {
      page_url: window.location.href,
      timestamp: Date.now(),
      core_web_vitals: this.metrics as CoreWebVitals,
      navigation_timing: this.getNavigationTiming(),
      resource_timing: this.getResourceTiming(),
      user_experience: this.userInteractions,
      conversion_impact: this.getConversionImpact(),
      device_info: this.getDeviceInfo(),
      environmental_factors: this.getEnvironmentalFactors(),
    };

    try {
      // Store metrics in database
      await supabase.from('performance_metrics').insert({
        session_id: behaviorTracker.getSessionId(),
        page_url: performanceMetrics.page_url,
        metrics: performanceMetrics,
        created_at: new Date().toISOString(),
      });

      console.log('Performance metrics reported:', performanceMetrics);
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  private getNavigationTiming(): PerformanceMetrics['navigation_timing'] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: 0, // Would need Paint Timing API
          firstContentfulPaint: nav.responseStart - nav.requestStart,
          largestContentfulPaint: this.metrics.lcp || 0,
          timeToInteractive: 0, // Would need more complex calculation
        };
      }
    }

    return {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0,
    };
  }

  private getResourceTiming(): PerformanceMetrics['resource_timing'] {
    return this.resourceEntries.map(entry => ({
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    }));
  }

  private getResourceType(url: string): string {
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  private getConversionImpact(): PerformanceMetrics['conversion_impact'] {
    const conversionTime = this.conversionTracking.bookingCompletionTime && this.conversionTracking.bookingStartTime
      ? this.conversionTracking.bookingCompletionTime - this.conversionTracking.bookingStartTime
      : 0;

    return {
      bookingStarted: this.conversionTracking.bookingStarted,
      bookingCompleted: this.conversionTracking.bookingCompleted,
      conversionTime,
      abandonmentPoint: this.conversionTracking.abandonmentPoint,
    };
  }

  private getDeviceInfo(): PerformanceMetrics['device_info'] {
    return {
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      memoryLimit: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
    };
  }

  private getEnvironmentalFactors(): PerformanceMetrics['environmental_factors'] {
    return {
      pageViews: 1, // Would be tracked across session
      sessionDuration: Date.now() - this.navigationStartTime,
      browserTabs: this.estimateBrowserTabCount(),
      batteryLevel: this.getBatteryLevel(),
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private estimateBrowserTabCount(): number {
    // This is a rough estimation - actual tab count is not available for privacy reasons
    return 1;
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      const battery = await (navigator as any).getBattery?.();
      return battery?.level * 100;
    } catch {
      return undefined;
    }
  }

  // Public API methods
  async getPerformanceInsights(
    startDate: string,
    endDate: string,
    filters?: {
      device_type?: string;
      page_url?: string;
      metric_name?: string;
    }
  ): Promise<{
    metrics_summary: {
      average_performance_score: number;
      critical_issues_count: number;
      recommendations_count: number;
      pages_analyzed: number;
    };
    top_issues: Array<{
      metric_name: string;
      severity: string;
      affected_pages: number;
      estimated_impact: number;
    }>;
    device_performance: Record<string, {
      average_score: number;
      issue_count: number;
      user_count: number;
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      expected_improvement: string;
    }>;
  }> {
    try {
      const { data: metrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const { data: alerts, error: alertsError } = await supabase
        .from('performance_alerts')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (alertsError) throw alertsError;

      return this.generateInsights(metrics || [], alerts || []);
    } catch (error) {
      console.error('Failed to get performance insights:', error);
      throw error;
    }
  }

  private generateInsights(metrics: any[], alerts: any[]): any {
    // Calculate performance scores
    const scores = metrics.map(m => this.calculatePerformanceScore(m.metrics.core_web_vitals));
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Group issues by severity
    const criticalIssues = alerts.filter(a => a.severity === 'critical').length;
    const highIssues = alerts.filter(a => a.severity === 'high').length;

    // Top issues
    const topIssues = this.analyzeTopIssues(alerts);

    // Device performance breakdown
    const devicePerformance = this.analyzeDevicePerformance(metrics, alerts);

    // Generate recommendations
    const recommendations = this.generateRecommendations(alerts, metrics);

    return {
      metrics_summary: {
        average_performance_score: averageScore,
        critical_issues_count: criticalIssues,
        recommendations_count: recommendations.length,
        pages_analyzed: new Set(metrics.map(m => m.page_url)).size,
      },
      top_issues,
      device_performance,
      recommendations,
    };
  }

  private calculatePerformanceScore(vitals: CoreWebVitals): number {
    let score = 100;

    // Deduct points based on how far each metric is from ideal
    if (vitals.cls > 0.1) score -= Math.min(40, vitals.cls * 100);
    if (vitals.fid > 100) score -= Math.min(30, (vitals.fid - 100) / 10);
    if (vitals.fcp > 1800) score -= Math.min(25, (vitals.fcp - 1800) / 100);
    if (vitals.lcp > 2500) score -= Math.min(25, (vitals.lcp - 2500) / 100);
    if (vitals.ttfb > 600) score -= Math.min(20, (vitals.ttfb - 600) / 50);
    if (vitals.inp > 200) score -= Math.min(30, (vitals.inp - 200) / 20);

    return Math.max(0, Math.round(score));
  }

  private analyzeTopIssues(alerts: any[]): any[] {
    const issueCounts = alerts.reduce((acc, alert) => {
      const key = alert.metric_name;
      if (!acc[key]) {
        acc[key] = { count: 0, severity: alert.severity, impact: 0 };
      }
      acc[key].count++;
      acc[key].impact += alert.user_impact.revenue_impact;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(issueCounts)
      .map(([metric_name, data]) => ({
        metric_name,
        severity: data.severity,
        affected_pages: data.count,
        estimated_impact: data.impact,
      }))
      .sort((a, b) => b.estimated_impact - a.estimated_impact)
      .slice(0, 5);
  }

  private analyzeDevicePerformance(metrics: any[], alerts: any[]): Record<string, any> {
    const deviceData: Record<string, any> = {};

    metrics.forEach(metric => {
      const deviceType = metric.metrics.device_info.deviceType;
      if (!deviceData[deviceType]) {
        deviceData[deviceType] = { scores: [], issueCount: 0, userCount: 0 };
      }

      deviceData[deviceType].scores.push(this.calculatePerformanceScore(metric.metrics.core_web_vitals));
      deviceData[deviceType].userCount++;
    });

    alerts.forEach(alert => {
      const deviceType = alert.device_type;
      if (deviceData[deviceType]) {
        deviceData[deviceType].issueCount++;
      }
    });

    const result: Record<string, any> = {};
    Object.entries(deviceData).forEach(([deviceType, data]) => {
      result[deviceType] = {
        average_score: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
        issue_count: data.issueCount,
        user_count: data.userCount,
      };
    });

    return result;
  }

  private generateRecommendations(alerts: any[], metrics: any[]): any[] {
    const recommendations: any[] = [];

    // Image optimization recommendations
    const lcpIssues = alerts.filter(a => a.metric_name === 'LCP' && a.severity === 'critical');
    if (lcpIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Image Optimization',
        action: 'Implement modern image formats (WebP, AVIF) and lazy loading',
        expected_improvement: 'Reduce LCP by 30-50%',
      });
    }

    // JavaScript optimization recommendations
    const fidIssues = alerts.filter(a => a.metric_name === 'FID' && a.severity === 'critical');
    if (fidIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'JavaScript Optimization',
        action: 'Minimize and defer non-critical JavaScript, use code splitting',
        expected_improvement: 'Reduce FID by 40-60%',
      });
    }

    // Server optimization recommendations
    const ttfbIssues = alerts.filter(a => a.metric_name === 'TTFB' && a.severity === 'critical');
    if (ttfbIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Server Performance',
        action: 'Implement server-side caching and optimize database queries',
        expected_improvement: 'Reduce TTFB by 50-70%',
      });
    }

    // CLS recommendations
    const clsIssues = alerts.filter(a => a.metric_name === 'CLS' && a.severity === 'critical');
    if (clsIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Layout Stability',
        action: 'Reserve space for dynamic content and optimize font loading',
        expected_improvement: 'Reduce CLS by 80-90%',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Manual tracking methods
  trackCustomPerformanceMetric(name: string, value: number, metadata?: Record<string, any>): void {
    ga4Analytics.trackCustomEvent({
      event_name: 'custom_performance_metric',
      parameters: {
        metric_name: name,
        metric_value: value,
        page_location: window.location.href,
        device_type: this.getDeviceType(),
        booking_step: 0,
        total_steps: 0,
        currency: 'PLN',
        user_session_id: behaviorTracker.getSessionId(),
        language: navigator.language,
        additional_data: metadata,
      },
    });
  }

  trackResourceLoadTime(resourceName: string, loadTime: number, resourceType: string): void {
    this.trackCustomPerformanceMetric(`resource_load_time_${resourceType}`, loadTime, {
      resource_name: resourceName,
      resource_type: resourceType,
    });
  }

  trackUserInteractionTiming(interactionType: string, responseTime: number): void {
    this.trackCustomPerformanceMetric(`interaction_time_${interactionType}`, responseTime, {
      interaction_type: interactionType,
    });
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// React hook for easy integration
export const usePerformanceTracking = () => {
  const trackPageLoadTime = (pageName: string) => {
    if ('performance' in window) {
      const loadTime = performance.now();
      performanceTracker.trackCustomPerformanceMetric(`page_load_${pageName}`, loadTime, {
        page_name: pageName,
      });
    }
  };

  const trackComponentRenderTime = (componentName: string, renderTime: number) => {
    performanceTracker.trackCustomPerformanceMetric(`component_render_${componentName}`, renderTime, {
      component_name: componentName,
    });
  };

  const trackApiResponseTime = (endpoint: string, responseTime: number) => {
    performanceTracker.trackCustomPerformanceMetric(`api_response_${endpoint}`, responseTime, {
      endpoint: endpoint,
    });
  };

  return {
    trackPageLoadTime,
    trackComponentRenderTime,
    trackApiResponseTime,
  };
};