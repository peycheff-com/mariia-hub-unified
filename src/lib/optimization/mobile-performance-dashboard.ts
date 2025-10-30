/**
 * Mobile Performance Dashboard and Analytics System
 * for luxury beauty and fitness booking platform
 *
 * Provides real-time monitoring, visualization, and insights
 * for mobile performance across all platforms
 */

import { mobileExperienceMonitor, MobileExperienceScore } from '../mobile-experience-monitoring';
import { coreWebVitalsMonitor } from '../core-web-vitals-monitoring';
import { mobilePerformanceOptimizer, PerformanceContext } from './mobile-performance-optimizer';
import { trackRUMEvent } from '../rum';

// Dashboard configuration
interface DashboardConfig {
  refreshInterval: number;         // ms
  dataRetentionDays: number;      // Days to keep historical data
  alertThresholds: {
    performanceScore: number;     // Below this triggers alerts
    errorRate: number;            // Error rate threshold
    memoryUsage: number;          // Memory usage threshold
    networkLatency: number;       // Network latency threshold
  };
  widgets: DashboardWidget[];
}

// Dashboard widget types
interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'heatmap' | 'comparison';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  config: any;
  enabled: boolean;
}

// Performance metrics snapshot
interface PerformanceSnapshot {
  timestamp: number;
  context: PerformanceContext;
  mobileScore: MobileExperienceScore;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    inp: number;
  };
  userMetrics: {
    pageViews: number;
    uniqueUsers: number;
    bounceRate: number;
    conversionRate: number;
    sessionDuration: number;
  };
  technicalMetrics: {
    memoryUsage: number;
    batteryLevel: number;
    thermalState: string;
    networkLatency: number;
    frameRate: number;
  };
  platformMetrics: {
    ios: PlatformMetrics;
    android: PlatformMetrics;
    pwa: PlatformMetrics;
  };
}

// Platform-specific metrics
interface PlatformMetrics {
  performanceScore: number;
  userCount: number;
  errorRate: number;
  averageLoadTime: number;
  features: {
    pushNotifications: boolean;
    offlineSupport: boolean;
    backgroundSync: boolean;
    hapticFeedback: boolean;
  };
}

// Performance alert
interface PerformanceAlert {
  id: string;
  type: 'performance' | 'usability' | 'network' | 'platform' | 'critical';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  platform: 'all' | 'ios' | 'android' | 'pwa';
  context: any;
  recommendations: string[];
  acknowledged: boolean;
  resolved: boolean;
}

// Performance insights
interface PerformanceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'issue';
  title: string;
  description: string;
  impact: {
    userExperience: number;      // 0-100%
    conversionRate: number;      // 0-100%
    brandPerception: number;     // 0-100%
  };
  confidence: number;             // 0-100%
  actionable: boolean;
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    estimatedTime: string;
    resources: string[];
  };
}

// Performance trend
interface PerformanceTrend {
  metric: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  data: Array<{
    timestamp: number;
    value: number;
    platform?: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number;            // Percentage change
  forecast: Array<{
    timestamp: number;
    value: number;
    confidence: number;
  }>;
}

// Performance comparison
interface PerformanceComparison {
  metric: string;
  platforms: {
    ios: number;
    android: number;
    pwa: number;
    industry: number;
  };
  ranking: {
    ios: number;    // Rank among similar apps
    android: number;
    pwa: number;
  };
  gapAnalysis: {
    bestPlatform: string;
    worstPlatform: string;
    gap: number;    // Performance difference percentage
    improvement: string[];
  };
}

class MobilePerformanceDashboard {
  private static instance: MobilePerformanceDashboard;
  private isInitialized = false;
  private config: DashboardConfig;
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private insights: PerformanceInsight[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private comparisons: Map<string, PerformanceComparison> = new Map();
  private refreshTimer?: NodeJS.Timeout;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private platformData: Map<string, any> = new Map();

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): MobilePerformanceDashboard {
    if (!MobilePerformanceDashboard.instance) {
      MobilePerformanceDashboard.instance = new MobilePerformanceDashboard();
    }
    return MobilePerformanceDashboard.instance;
  }

  // Initialize dashboard
  initialize(config: Partial<DashboardConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    try {
      this.initializeDataCollection();
      this.initializeAlertSystem();
      this.initializeInsightEngine();
      this.initializeTrendAnalysis();
      this.initializePlatformMonitoring();
      this.startRealTimeMonitoring();
      this.initializeWidgets();

      this.isInitialized = true;
      console.log('[Mobile Performance Dashboard] Advanced monitoring dashboard initialized');

      // Load historical data
      this.loadHistoricalData();

      // Initial data collection
      this.collectPerformanceData();

      trackRUMEvent('mobile-dashboard-initialized', {
        config: this.config,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Mobile Performance Dashboard] Failed to initialize:', error);
    }
  }

  // Get default configuration
  private getDefaultConfig(): DashboardConfig {
    return {
      refreshInterval: 30000,        // 30 seconds
      dataRetentionDays: 30,
      alertThresholds: {
        performanceScore: 70,
        errorRate: 5,                // 5%
        memoryUsage: 80,             // 80%
        networkLatency: 1000         // 1 second
      },
      widgets: [
        {
          id: 'performance-score',
          type: 'metric',
          title: 'Overall Performance Score',
          size: 'medium',
          position: { x: 0, y: 0 },
          config: { metric: 'overallScore', unit: 'score' },
          enabled: true
        },
        {
          id: 'core-web-vitals',
          type: 'chart',
          title: 'Core Web Vitals',
          size: 'large',
          position: { x: 1, y: 0 },
          config: { metrics: ['lcp', 'fid', 'cls', 'ttfb'] },
          enabled: true
        },
        {
          id: 'platform-comparison',
          type: 'comparison',
          title: 'Platform Performance',
          size: 'medium',
          position: { x: 0, y: 1 },
          config: { platforms: ['ios', 'android', 'pwa'] },
          enabled: true
        },
        {
          id: 'performance-alerts',
          type: 'alert',
          title: 'Performance Alerts',
          size: 'medium',
          position: { x: 1, y: 1 },
          config: { maxAlerts: 10 },
          enabled: true
        },
        {
          id: 'user-experience-heatmap',
          type: 'heatmap',
          title: 'User Experience Heatmap',
          size: 'full',
          position: { x: 0, y: 2 },
          config: { metrics: ['navigation', 'interactions', 'load-times'] },
          enabled: true
        }
      ]
    };
  }

  // Initialize data collection
  private initializeDataCollection(): void {
    // Collect data from various sources
    setInterval(() => {
      this.collectPerformanceData();
    }, this.config.refreshInterval);

    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }

  // Initialize alert system
  private initializeAlertSystem(): void {
    // Check for performance alerts
    setInterval(() => {
      this.checkPerformanceAlerts();
    }, 60000); // Every minute

    // Check for critical alerts more frequently
    setInterval(() => {
      this.checkCriticalAlerts();
    }, 10000); // Every 10 seconds
  }

  // Initialize insight engine
  private initializeInsightEngine(): void {
    // Generate insights periodically
    setInterval(() => {
      this.generatePerformanceInsights();
    }, 300000); // Every 5 minutes
  }

  // Initialize trend analysis
  private initializeTrendAnalysis(): void {
    // Analyze trends periodically
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 600000); // Every 10 minutes
  }

  // Initialize platform monitoring
  private initializePlatformMonitoring(): void {
    // Monitor iOS performance
    this.monitorIOSPerformance();

    // Monitor Android performance
    this.monitorAndroidPerformance();

    // Monitor PWA performance
    this.monitorPWAPerformance();
  }

  // Start real-time monitoring
  private startRealTimeMonitoring(): void {
    this.refreshTimer = setInterval(() => {
      this.updateDashboard();
    }, this.config.refreshInterval);
  }

  // Initialize widgets
  private initializeWidgets(): void {
    this.config.widgets.forEach(widget => {
      if (widget.enabled) {
        this.initializeWidget(widget);
      }
    });
  }

  // Initialize individual widget
  private initializeWidget(widget: DashboardWidget): void {
    // Widget-specific initialization
    switch (widget.type) {
      case 'metric':
        this.initializeMetricWidget(widget);
        break;
      case 'chart':
        this.initializeChartWidget(widget);
        break;
      case 'alert':
        this.initializeAlertWidget(widget);
        break;
      case 'heatmap':
        this.initializeHeatmapWidget(widget);
        break;
      case 'comparison':
        this.initializeComparisonWidget(widget);
        break;
    }
  }

  // Initialize metric widget
  private initializeMetricWidget(widget: DashboardWidget): void {
    // Metric widget initialization
    trackRUMEvent('dashboard-widget-initialized', {
      widgetId: widget.id,
      widgetType: widget.type,
      timestamp: Date.now()
    });
  }

  // Initialize chart widget
  private initializeChartWidget(widget: DashboardWidget): void {
    // Chart widget initialization
    trackRUMEvent('dashboard-widget-initialized', {
      widgetId: widget.id,
      widgetType: widget.type,
      timestamp: Date.now()
    });
  }

  // Initialize alert widget
  private initializeAlertWidget(widget: DashboardWidget): void {
    // Alert widget initialization
    trackRUMEvent('dashboard-widget-initialized', {
      widgetId: widget.id,
      widgetType: widget.type,
      timestamp: Date.now()
    });
  }

  // Initialize heatmap widget
  private initializeHeatmapWidget(widget: DashboardWidget): void {
    // Heatmap widget initialization
    trackRUMEvent('dashboard-widget-initialized', {
      widgetId: widget.id,
      widgetType: widget.type,
      timestamp: Date.now()
    });
  }

  // Initialize comparison widget
  private initializeComparisonWidget(widget: DashboardWidget): void {
    // Comparison widget initialization
    trackRUMEvent('dashboard-widget-initialized', {
      widgetId: widget.id,
      widgetType: widget.type,
      timestamp: Date.now()
    });
  }

  // Collect performance data
  private collectPerformanceData(): void {
    try {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        context: mobilePerformanceOptimizer.getCurrentContext(),
        mobileScore: mobileExperienceMonitor.getMobileExperienceScore(),
        coreWebVitals: this.getCoreWebVitalsData(),
        userMetrics: this.getUserMetrics(),
        technicalMetrics: this.getTechnicalMetrics(),
        platformMetrics: this.getPlatformMetrics()
      };

      this.snapshots.push(snapshot);

      // Keep only recent data
      const retentionCutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
      this.snapshots = this.snapshots.filter(s => s.timestamp > retentionCutoff);

      // Notify subscribers
      this.notifySubscribers('snapshot', snapshot);

    } catch (error) {
      console.error('[Mobile Performance Dashboard] Failed to collect performance data:', error);
    }
  }

  // Get Core Web Vitals data
  private getCoreWebVitalsData(): any {
    const summary = coreWebVitalsMonitor.getPerformanceSummary();
    return {
      lcp: summary.averages.LCP || 0,
      fid: summary.averages.FID || 0,
      cls: summary.averages.CLS || 0,
      ttfb: summary.averages.TTFB || 0,
      inp: summary.averages.INP || 0
    };
  }

  // Get user metrics
  private getUserMetrics(): any {
    // This would typically come from analytics
    // For now, we'll use mock data
    return {
      pageViews: this.getSessionData('pageViews', Math.floor(Math.random() * 100) + 50),
      uniqueUsers: this.getSessionData('uniqueUsers', Math.floor(Math.random() * 50) + 20),
      bounceRate: this.getSessionData('bounceRate', Math.random() * 50),
      conversionRate: this.getSessionData('conversionRate', Math.random() * 10),
      sessionDuration: this.getSessionData('sessionDuration', Math.random() * 300 + 60)
    };
  }

  // Get technical metrics
  private getTechnicalMetrics(): any {
    const memory = (performance as any).memory;
    return {
      memoryUsage: memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0,
      batteryLevel: this.getBatteryLevel(),
      thermalState: this.getThermalState(),
      networkLatency: this.getNetworkLatency(),
      frameRate: this.getCurrentFrameRate()
    };
  }

  // Get platform metrics
  private getPlatformMetrics(): any {
    return {
      ios: this.getIOSMetrics(),
      android: this.getAndroidMetrics(),
      pwa: this.getPWAMetrics()
    };
  }

  // Get iOS metrics
  private getIOSMetrics(): PlatformMetrics {
    return this.platformData.get('ios') || {
      performanceScore: 85,
      userCount: 150,
      errorRate: 2,
      averageLoadTime: 1500,
      features: {
        pushNotifications: true,
        offlineSupport: true,
        backgroundSync: true,
        hapticFeedback: true
      }
    };
  }

  // Get Android metrics
  private getAndroidMetrics(): PlatformMetrics {
    return this.platformData.get('android') || {
      performanceScore: 80,
      userCount: 200,
      errorRate: 3,
      averageLoadTime: 1800,
      features: {
        pushNotifications: true,
        offlineSupport: true,
        backgroundSync: true,
        hapticFeedback: true
      }
    };
  }

  // Get PWA metrics
  private getPWAMetrics(): PlatformMetrics {
    return this.platformData.get('pwa') || {
      performanceScore: 75,
      userCount: 300,
      errorRate: 4,
      averageLoadTime: 2000,
      features: {
        pushNotifications: false,
        offlineSupport: true,
        backgroundSync: false,
        hapticFeedback: false
      }
    };
  }

  // Get session data
  private getSessionData(key: string, defaultValue: any): any {
    const sessionData = sessionStorage.getItem(`dashboard-${key}`);
    return sessionData ? JSON.parse(sessionData) : defaultValue;
  }

  // Get battery level
  private getBatteryLevel(): number {
    return this.getSessionData('batteryLevel', 1.0);
  }

  // Get thermal state
  private getThermalState(): string {
    return this.getSessionData('thermalState', 'nominal');
  }

  // Get network latency
  private getNetworkLatency(): number {
    return this.getSessionData('networkLatency', 100);
  }

  // Get current frame rate
  private getCurrentFrameRate(): number {
    return this.getSessionData('frameRate', 60);
  }

  // Monitor iOS performance
  private monitorIOSPerformance(): void {
    // iOS-specific monitoring
    setInterval(() => {
      // Simulate iOS metrics
      this.platformData.set('ios', this.generateIOSMetrics());
    }, 30000);
  }

  // Monitor Android performance
  private monitorAndroidPerformance(): void {
    // Android-specific monitoring
    setInterval(() => {
      // Simulate Android metrics
      this.platformData.set('android', this.generateAndroidMetrics());
    }, 30000);
  }

  // Monitor PWA performance
  private monitorPWAPerformance(): void {
    // PWA-specific monitoring
    setInterval(() => {
      // Simulate PWA metrics
      this.platformData.set('pwa', this.generatePWAMetrics());
    }, 30000);
  }

  // Generate iOS metrics
  private generateIOSMetrics(): PlatformMetrics {
    return {
      performanceScore: Math.random() * 20 + 80,
      userCount: Math.floor(Math.random() * 50) + 130,
      errorRate: Math.random() * 2,
      averageLoadTime: Math.random() * 500 + 1200,
      features: {
        pushNotifications: true,
        offlineSupport: true,
        backgroundSync: true,
        hapticFeedback: true
      }
    };
  }

  // Generate Android metrics
  private generateAndroidMetrics(): PlatformMetrics {
    return {
      performanceScore: Math.random() * 25 + 75,
      userCount: Math.floor(Math.random() * 60) + 170,
      errorRate: Math.random() * 3,
      averageLoadTime: Math.random() * 600 + 1500,
      features: {
        pushNotifications: true,
        offlineSupport: true,
        backgroundSync: true,
        hapticFeedback: true
      }
    };
  }

  // Generate PWA metrics
  private generatePWAMetrics(): PlatformMetrics {
    return {
      performanceScore: Math.random() * 30 + 65,
      userCount: Math.floor(Math.random() * 80) + 260,
      errorRate: Math.random() * 4,
      averageLoadTime: Math.random() * 800 + 1600,
      features: {
        pushNotifications: Math.random() > 0.5,
        offlineSupport: true,
        backgroundSync: Math.random() > 0.7,
        hapticFeedback: false
      }
    };
  }

  // Check performance alerts
  private checkPerformanceAlerts(): void {
    if (this.snapshots.length === 0) return;

    const latestSnapshot = this.snapshots[this.snapshots.length - 1];
    const { alertThresholds } = this.config;

    // Check performance score
    if (latestSnapshot.mobileScore.overall < alertThresholds.performanceScore) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Low Performance Score',
        description: `Performance score dropped to ${latestSnapshot.mobileScore.overall}`,
        platform: 'all',
        context: { score: latestSnapshot.mobileScore.overall },
        recommendations: [
          'Optimize images and assets',
          'Reduce JavaScript execution time',
          'Improve server response time'
        ]
      });
    }

    // Check memory usage
    if (latestSnapshot.technicalMetrics.memoryUsage > alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'High Memory Usage',
        description: `Memory usage at ${Math.round(latestSnapshot.technicalMetrics.memoryUsage)}%`,
        platform: 'all',
        context: { usage: latestSnapshot.technicalMetrics.memoryUsage },
        recommendations: [
          'Optimize memory allocation',
          'Reduce object creation',
          'Implement garbage collection hints'
        ]
      });
    }

    // Check network latency
    if (latestSnapshot.technicalMetrics.networkLatency > alertThresholds.networkLatency) {
      this.createAlert({
        type: 'network',
        severity: 'warning',
        title: 'High Network Latency',
        description: `Network latency at ${Math.round(latestSnapshot.technicalMetrics.networkLatency)}ms`,
        platform: 'all',
        context: { latency: latestSnapshot.technicalMetrics.networkLatency },
        recommendations: [
          'Use CDN for static assets',
          'Implement request batching',
          'Optimize API responses'
        ]
      });
    }
  }

  // Check critical alerts
  private checkCriticalAlerts(): void {
    if (this.snapshots.length === 0) return;

    const latestSnapshot = this.snapshots[this.snapshots.length - 1];

    // Critical performance issues
    if (latestSnapshot.mobileScore.overall < 50) {
      this.createAlert({
        type: 'critical',
        severity: 'critical',
        title: 'Critical Performance Issue',
        description: `Performance score critically low at ${latestSnapshot.mobileScore.overall}`,
        platform: 'all',
        context: { score: latestSnapshot.mobileScore.overall },
        recommendations: [
          'Immediately optimize critical rendering path',
          'Defer non-essential features',
          'Enable performance monitoring'
        ]
      });
    }

    // Critical Core Web Vitals
    if (latestSnapshot.coreWebVitals.lcp > 4000) {
      this.createAlert({
        type: 'critical',
        severity: 'critical',
        title: 'Critical LCP Issue',
        description: `LCP at ${Math.round(latestSnapshot.coreWebVitals.lcp)}ms -严重影响用户体验`,
        platform: 'all',
        context: { lcp: latestSnapshot.coreWebVitals.lcp },
        recommendations: [
          'Optimize largest contentful paint',
          'Preload critical resources',
          'Optimize server response time'
        ]
      });
    }
  }

  // Generate performance insights
  private generatePerformanceInsights(): void {
    if (this.snapshots.length < 10) return;

    const recentSnapshots = this.snapshots.slice(-20);
    const insights = this.analyzePerformanceData(recentSnapshots);

    insights.forEach(insight => {
      if (!this.insights.find(i => i.title === insight.title)) {
        this.insights.push(insight);
        this.notifySubscribers('insight', insight);
      }
    });

    // Keep only recent insights
    if (this.insights.length > 50) {
      this.insights = this.insights.slice(-50);
    }
  }

  // Analyze performance data
  private analyzePerformanceData(snapshots: PerformanceSnapshot[]): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];

    // Analyze performance trends
    const performanceScores = snapshots.map(s => s.mobileScore.overall);
    const trend = this.calculateTrend(performanceScores);

    if (trend < -0.1) {
      insights.push({
        id: `insight_${Date.now()}_trend`,
        type: 'trend',
        title: 'Declining Performance Trend',
        description: 'Performance has been declining over the recent period',
        impact: {
          userExperience: 30,
          conversionRate: 25,
          brandPerception: 20
        },
        confidence: 85,
        actionable: true,
        implementation: {
          complexity: 'medium',
          estimatedTime: '2-3 days',
          resources: ['Performance team', 'Infrastructure team']
        }
      });
    }

    // Analyze platform differences
    const platformScores = {
      ios: this.calculatePlatformAverage(snapshots, 'ios'),
      android: this.calculatePlatformAverage(snapshots, 'android'),
      pwa: this.calculatePlatformAverage(snapshots, 'pwa')
    };

    const bestPlatform = Object.entries(platformScores).reduce((a, b) =>
      platformScores[a[0] as keyof typeof platformScores] > platformScores[b[0] as keyof typeof platformScores] ? a : b
    )[0];

    const worstPlatform = Object.entries(platformScores).reduce((a, b) =>
      platformScores[a[0] as keyof typeof platformScores] < platformScores[b[0] as keyof typeof platformScores] ? a : b
    )[0];

    if (platformScores[bestPlatform as keyof typeof platformScores] - platformScores[worstPlatform as keyof typeof platformScores] > 15) {
      insights.push({
        id: `insight_${Date.now()}_platform`,
        type: 'opportunity',
        title: 'Platform Performance Gap',
        description: `${worstPlatform} performance significantly lags behind ${bestPlatform}`,
        impact: {
          userExperience: 20,
          conversionRate: 15,
          brandPerception: 25
        },
        confidence: 90,
        actionable: true,
        implementation: {
          complexity: 'high',
          estimatedTime: '1-2 weeks',
          resources: ['Platform teams', 'QA team']
        }
      });
    }

    return insights;
  }

  // Calculate trend
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const halfPoint = Math.floor(n / 2);
    const firstHalf = values.slice(0, halfPoint);
    const secondHalf = values.slice(halfPoint);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return (secondAvg - firstAvg) / firstAvg;
  }

  // Calculate platform average
  private calculatePlatformAverage(snapshots: PerformanceSnapshot[], platform: string): number {
    const platformSnapshots = snapshots.filter(s =>
      s.platformMetrics[platform as keyof typeof s.platformMetrics]
    );

    if (platformSnapshots.length === 0) return 0;

    return platformSnapshots.reduce((sum, snapshot) => {
      return sum + snapshot.platformMetrics[platform as keyof typeof snapshot.platformMetrics].performanceScore;
    }, 0) / platformSnapshots.length;
  }

  // Analyze performance trends
  private analyzePerformanceTrends(): void {
    if (this.snapshots.length < 20) return;

    const metrics = ['lcp', 'fid', 'cls', 'ttfb', 'performanceScore'];
    const timeframes = ['hour', 'day', 'week'];

    metrics.forEach(metric => {
      timeframes.forEach(timeframe => {
        const trend = this.calculateMetricTrend(metric, timeframe);
        this.trends.set(`${metric}_${timeframe}`, trend);
      });
    });
  }

  // Calculate metric trend
  private calculateMetricTrend(metric: string, timeframe: string): PerformanceTrend {
    const now = Date.now();
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }[timeframe];

    const relevantSnapshots = this.snapshots.filter(s =>
      now - s.timestamp <= timeframeMs
    );

    let data: Array<{ timestamp: number; value: number }> = [];

    if (metric === 'performanceScore') {
      data = relevantSnapshots.map(s => ({
        timestamp: s.timestamp,
        value: s.mobileScore.overall
      }));
    } else {
      data = relevantSnapshots.map(s => ({
        timestamp: s.timestamp,
        value: s.coreWebVitals[metric as keyof typeof s.coreWebVitals] as number
      }));
    }

    const trend = this.calculateTrend(data.map(d => d.value));
    let trendDirection: 'improving' | 'stable' | 'declining';
    if (trend > 0.05) trendDirection = 'improving';
    else if (trend < -0.05) trendDirection = 'declining';
    else trendDirection = 'stable';

    // Simple forecast (linear extrapolation)
    const forecast = data.slice(-5).map((point, index) => ({
      timestamp: point.timestamp + (index + 1) * timeframeMs / 10,
      value: point.value + trend * point.value * (index + 1),
      confidence: Math.max(0, 100 - index * 20)
    }));

    return {
      metric,
      timeframe,
      data,
      trend: trendDirection,
      changeRate: Math.abs(trend) * 100,
      forecast
    };
  }

  // Load historical data
  private loadHistoricalData(): void {
    try {
      const historicalData = localStorage.getItem('mobile-dashboard-historical');
      if (historicalData) {
        const parsed = JSON.parse(historicalData);
        this.snapshots = parsed.snapshots || [];
        this.alerts = parsed.alerts || [];
        this.insights = parsed.insights || [];
      }
    } catch (error) {
      console.warn('[Mobile Performance Dashboard] Failed to load historical data:', error);
    }
  }

  // Update dashboard
  private updateDashboard(): void {
    this.collectPerformanceData();
    this.notifySubscribers('dashboard-update', {
      timestamp: Date.now(),
      snapshots: this.snapshots.length,
      alerts: this.alerts.filter(a => !a.acknowledged).length,
      insights: this.insights.length
    });
  }

  // Clean up old data
  private cleanupOldData(): void {
    const retentionCutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

    this.snapshots = this.snapshots.filter(s => s.timestamp > retentionCutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > retentionCutoff && !a.acknowledged);
    this.insights = this.insights.filter(i => {
      const insightAge = Date.now() - parseInt(i.id.split('_')[1]);
      return insightAge < 7 * 24 * 60 * 60 * 1000; // Keep insights for 7 days
    });
  }

  // Create alert
  private createAlert(alertData: Partial<PerformanceAlert>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type || 'performance',
      severity: alertData.severity || 'warning',
      title: alertData.title || 'Performance Alert',
      description: alertData.description || '',
      timestamp: Date.now(),
      platform: alertData.platform || 'all',
      context: alertData.context || {},
      recommendations: alertData.recommendations || [],
      acknowledged: false,
      resolved: false
    };

    // Check for duplicates
    const exists = this.alerts.some(a =>
      a.title === alert.title &&
      a.type === alert.type &&
      Date.now() - a.timestamp < 300000 // Within 5 minutes
    );

    if (!exists) {
      this.alerts.push(alert);
      this.notifySubscribers('alert', alert);

      // Send critical alerts immediately
      if (alert.severity === 'critical') {
        this.sendCriticalAlert(alert);
      }
    }
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
      console.error('[Mobile Performance Dashboard] Failed to send critical alert:', error);
    }
  }

  // Notify subscribers
  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach((callback, id) => {
      try {
        callback({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.error(`[Mobile Performance Dashboard] Error notifying subscriber ${id}:`, error);
      }
    });
  }

  // Monitor iOS performance
  private monitorIOSPerformance(): void {
    // Implementation would track iOS-specific metrics
    setInterval(() => {
      this.platformData.set('ios', this.generateIOSMetrics());
    }, 30000);
  }

  // Monitor Android performance
  private monitorAndroidPerformance(): void {
    // Implementation would track Android-specific metrics
    setInterval(() => {
      this.platformData.set('android', this.generateAndroidMetrics());
    }, 30000);
  }

  // Monitor PWA performance
  private monitorPWAPerformance(): void {
    // Implementation would track PWA-specific metrics
    setInterval(() => {
      this.platformData.set('pwa', this.generatePWAMetrics());
    }, 30000);
  }

  // Public API methods

  // Get current dashboard data
  getDashboardData(): any {
    return {
      snapshots: this.snapshots.slice(-100), // Last 100 snapshots
      alerts: this.alerts.filter(a => !a.acknowledged).slice(-50),
      insights: this.insights.slice(-20),
      trends: Object.fromEntries(this.trends),
      comparisons: Object.fromEntries(this.comparisons),
      config: this.config,
      lastUpdate: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].timestamp : Date.now()
    };
  }

  // Get performance snapshots
  getSnapshots(limit?: number): PerformanceSnapshot[] {
    return limit ? this.snapshots.slice(-limit) : [...this.snapshots];
  }

  // Get alerts
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity && !a.acknowledged);
    }
    return this.alerts.filter(a => !a.acknowledged);
  }

  // Get insights
  getInsights(type?: PerformanceInsight['type']): PerformanceInsight[] {
    if (type) {
      return this.insights.filter(i => i.type === type);
    }
    return [...this.insights];
  }

  // Get trends
  getTrends(metric?: string): PerformanceTrend[] {
    if (metric) {
      return Array.from(this.trends.values()).filter(t => t.metric === metric);
    }
    return Array.from(this.trends.values());
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifySubscribers('alert-acknowledged', alert);
    }
  }

  // Resolve alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.notifySubscribers('alert-resolved', alert);
    }
  }

  // Subscribe to dashboard updates
  subscribe(id: string, callback: (data: any) => void): void {
    this.subscribers.set(id, callback);
  }

  // Unsubscribe from dashboard updates
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  // Update configuration
  updateConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring with new config
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.startRealTimeMonitoring();
  }

  // Export dashboard data
  exportData(): any {
    return {
      snapshots: this.snapshots,
      alerts: this.alerts,
      insights: this.insights,
      trends: Object.fromEntries(this.trends),
      comparisons: Object.fromEntries(this.comparisons),
      config: this.config,
      exportTimestamp: Date.now()
    };
  }

  // Save data to localStorage
  saveData(): void {
    try {
      const data = {
        snapshots: this.snapshots.slice(-1000), // Keep last 1000 snapshots
        alerts: this.alerts.filter(a => !a.resolved).slice(-100),
        insights: this.insights.slice(-50),
        lastSave: Date.now()
      };
      localStorage.setItem('mobile-dashboard-historical', JSON.stringify(data));
    } catch (error) {
      console.error('[Mobile Performance Dashboard] Failed to save data:', error);
    }
  }

  // Destroy dashboard
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.subscribers.clear();
    this.saveData();
  }
}

// Create and export singleton instance
export const mobilePerformanceDashboard = MobilePerformanceDashboard.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobilePerformanceDashboard.initialize();
  } else {
    window.addEventListener('load', () => {
      mobilePerformanceDashboard.initialize();
    });
  }

  // Save data before page unload
  window.addEventListener('beforeunload', () => {
    mobilePerformanceDashboard.saveData();
  });
}

// Export helper functions
export const initializeMobilePerformanceDashboard = (config?: Partial<DashboardConfig>) =>
  mobilePerformanceDashboard.initialize(config);
export const getMobileDashboardData = () => mobilePerformanceDashboard.getDashboardData();
export const getMobilePerformanceSnapshots = (limit?: number) => mobilePerformanceDashboard.getSnapshots(limit);
export const getMobilePerformanceAlerts = (severity?: PerformanceAlert['severity']) =>
  mobilePerformanceDashboard.getAlerts(severity);
export const getMobilePerformanceInsights = (type?: PerformanceInsight['type']) =>
  mobilePerformanceDashboard.getInsights(type);
export const getMobilePerformanceTrends = (metric?: string) => mobilePerformanceDashboard.getTrends(metric);
export const acknowledgeMobileAlert = (alertId: string) => mobilePerformanceDashboard.acknowledgeAlert(alertId);
export const resolveMobileAlert = (alertId: string) => mobilePerformanceDashboard.resolveAlert(alertId);
export const subscribeToMobileDashboard = (id: string, callback: (data: any) => void) =>
  mobilePerformanceDashboard.subscribe(id, callback);
export const unsubscribeFromMobileDashboard = (id: string) => mobilePerformanceDashboard.unsubscribe(id);
export const exportMobileDashboardData = () => mobilePerformanceDashboard.exportData();

// Export types
export {
  DashboardConfig,
  DashboardWidget,
  PerformanceSnapshot,
  PerformanceAlert,
  PerformanceInsight,
  PerformanceTrend,
  PerformanceComparison,
  PlatformMetrics
};