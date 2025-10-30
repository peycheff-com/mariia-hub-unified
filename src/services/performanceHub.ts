/**
 * Performance Hub - Central Integration Point
 * Coordinates all performance monitoring systems for the Mariia Hub luxury platform
 */

import RealUserMonitoring from './realUserMonitoring';
import ApplicationPerformanceMonitoring, { initializeAPM } from './applicationPerformanceMonitoring';
import PerformanceBudgetsAndAlerting, { initializePerformanceBudgets } from './performanceBudgetsAndAlerting';
import PerformanceRecommendationsEngine, { initializePerformanceRecommendations } from './performanceRecommendations';
import MobilePerformanceMonitoring, { initializeMobilePerformanceMonitoring } from './mobilePerformanceMonitoring';

interface PerformanceDashboard {
  overview: {
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: string;
    healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  };
  coreWebVitals: {
    lcp: { value: number; status: string; trend: number };
    fid: { value: number; status: string; trend: number };
    cls: { value: number; status: string; trend: number };
    fcp: { value: number; status: string; trend: number };
    ttfb: { value: number; status: string; trend: number };
  };
  userExperience: {
    averageLoadTime: number;
    bounceRate: number;
    conversionRate: number;
    userSatisfaction: number;
  };
  technicalMetrics: {
    bundleSize: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  alerts: {
    critical: number;
    warnings: number;
    total: number;
  };
}

interface PerformanceInsights {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
}

interface PerformanceReport {
  id: string;
  timestamp: string;
  period: 'daily' | 'weekly' | 'monthly';
  dashboard: PerformanceDashboard;
  insights: PerformanceInsights;
  recommendations: any[];
  actionItems: any[];
  businessImpact: any;
}

class PerformanceHub {
  private rum: RealUserMonitoring | null = null;
  private apm: ApplicationPerformanceMonitoring | null = null;
  private budgets: PerformanceBudgetsAndAlerting | null = null;
  private recommendations: PerformanceRecommendationsEngine | null = null;
  private mobile: MobilePerformanceMonitoring | null = null;

  private isInitialized = false;
  private sessionId: string;
  private metrics: Map<string, any> = new Map();
  private subscribers: Map<string, Function[]> = new Map();
  private reportingInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  public async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🚀 Initializing Mariia Hub Performance Monitoring System...');
    console.log('Target: Luxury Beauty Platform - Warsaw Market\n');

    try {
      // Initialize all monitoring systems
      await this.initializeMonitoringSystems();

      // Set up cross-system communication
      this.setupCrossSystemCommunication();

      // Start periodic reporting
      this.startPeriodicReporting();

      // Set up global performance tracking
      this.setupGlobalTracking();

      console.log('✅ Performance monitoring system fully operational');
      console.log(`📊 Session ID: ${this.sessionId}\n`);

      // Notify subscribers
      this.notifySubscribers('system-initialized', {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        systems: ['RUM', 'APM', 'Budgets', 'Recommendations', 'Mobile'].filter(system =>
          this.isSystemActive(system)
        )
      });

    } catch (error) {
      console.error('❌ Failed to initialize performance monitoring:', error);
      throw error;
    }
  }

  private async initializeMonitoringSystems() {
    console.log('🔧 Initializing monitoring systems...');

    // Initialize Real User Monitoring
    console.log('  📊 Real User Monitoring (RUM)...');
    this.rum = new RealUserMonitoring();

    // Initialize Application Performance Monitoring
    console.log('  ⚡ Application Performance Monitoring (APM)...');
    this.apm = initializeAPM();

    // Initialize Performance Budgets and Alerting
    console.log('  🚨 Performance Budgets and Alerting...');
    this.budgets = initializePerformanceBudgets();

    // Initialize Performance Recommendations
    console.log('  🧠 Performance Recommendations Engine...');
    this.recommendations = initializePerformanceRecommendations();

    // Initialize Mobile Performance Monitoring
    console.log('  📱 Mobile Performance Monitoring...');
    this.mobile = initializeMobilePerformanceMonitoring();

    console.log('  ✅ All systems initialized\n');
  }

  private setupCrossSystemCommunication() {
    console.log('🔗 Setting up cross-system communication...');

    // Set up event listeners for inter-system communication
    window.addEventListener('performance-metric', this.handlePerformanceMetric.bind(this));
    window.addEventListener('performance-alert', this.handlePerformanceAlert.bind(this));
    window.addEventListener('performance-recommendations', this.handleRecommendations.bind(this));
    window.addEventListener('mobile-performance-alert', this.handleMobileAlert.bind(this));
    window.addEventListener('performance-critical-alert', this.handleCriticalAlert.bind(this));

    console.log('  ✅ Cross-system communication established\n');
  }

  private startPeriodicReporting() {
    // Generate comprehensive report every hour
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, 60 * 60 * 1000);

    // Generate initial report after 5 minutes
    setTimeout(() => {
      this.generatePerformanceReport();
    }, 5 * 60 * 1000);
  }

  private setupGlobalTracking() {
    // Set up global performance tracking hooks
    this.setupTimingAPI();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();
  }

  private setupTimingAPI() {
    // Enhance Performance API with custom timing
    if ('performance' in window) {
      // Add custom timing marks for luxury platform flows
      const originalMark = performance.mark.bind(performance);
      performance.mark = (name: string) => {
        originalMark(name);
        this.handlePerformanceMetric({
          type: 'custom-timing',
          name,
          timestamp: performance.now(),
          source: 'performance-hub'
        });
      };

      // Mark key performance points
      this.markPerformanceMilestones();
    }
  }

  private markPerformanceMilestones() {
    // Mark important application milestones
    setTimeout(() => {
      performance.mark('app-fully-loaded');
    }, 0);

    // Mark booking flow milestones
    window.addEventListener('booking-step-start', (event: any) => {
      performance.mark(`booking-${event.detail.step}-start`);
    });

    window.addEventListener('booking-step-complete', (event: any) => {
      performance.mark(`booking-${event.detail.step}-complete`);
    });
  }

  private setupErrorTracking() {
    // Enhanced error tracking with performance context
    window.addEventListener('error', (event) => {
      this.handlePerformanceMetric({
        type: 'error',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        context: this.getCurrentPerformanceContext()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handlePerformanceMetric({
        type: 'promise-rejection',
        reason: event.reason,
        timestamp: Date.now(),
        context: this.getCurrentPerformanceContext()
      });
    });
  }

  private setupUserInteractionTracking() {
    // Track key user interactions with performance impact
    let interactionStartTime = 0;

    document.addEventListener('click', (event) => {
      interactionStartTime = performance.now();
    });

    document.addEventListener('click-end', () => {
      if (interactionStartTime > 0) {
        const responseTime = performance.now() - interactionStartTime;
        this.handlePerformanceMetric({
          type: 'interaction-response',
          responseTime,
          timestamp: Date.now(),
          element: event.target.tagName
        });
        interactionStartTime = 0;
      }
    });
  }

  private handlePerformanceMetric(event: CustomEvent) {
    const metric = event.detail;
    this.metrics.set(`metric_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, metric);

    // Route metric to appropriate systems
    this.routeMetric(metric);

    // Notify subscribers
    this.notifySubscribers('performance-metric', metric);
  }

  private routeMetric(metric: any) {
    // Route metrics to relevant monitoring systems
    switch (metric.type) {
      case 'error':
      case 'promise-rejection':
        // Send to all systems for comprehensive error tracking
        if (this.apm) this.apm.recordMetric(metric.type, metric);
        if (this.budgets) this.budgets.evaluateMetric(metric);
        break;

      case 'custom-timing':
        // Send to APM for detailed analysis
        if (this.apm) this.apm.recordMetric(metric.type, metric);
        break;

      case 'interaction-response':
        // Send to mobile monitoring if applicable
        if (this.mobile) {
          // Update interaction metrics
        }
        break;

      default:
        // Send to RUM for user experience tracking
        if (this.rum) {
          this.rum.recordMetric(metric.type, metric);
        }
    }
  }

  private handlePerformanceAlert(event: CustomEvent) {
    const alert = event.detail;

    // Route alerts to appropriate systems
    if (this.budgets) {
      // Budget-related alerts
    }

    // Notify subscribers with higher priority
    this.notifySubscribers('performance-alert', alert, { priority: 'high' });

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('🚨 Critical Performance Alert:', alert);
    }
  }

  private handleRecommendations(event: CustomEvent) {
    const recommendations = event.detail;

    // Store recommendations
    this.metrics.set('recommendations', recommendations);

    // Notify subscribers
    this.notifySubscribers('performance-recommendations', recommendations);
  }

  private handleMobileAlert(event: CustomEvent) {
    const alert = event.detail;

    // Route mobile-specific alerts
    this.notifySubscribers('mobile-performance-alert', alert);

    // Check if mobile alert should be escalated
    if (alert.severity === 'critical') {
      this.escalateMobileAlert(alert);
    }
  }

  private handleCriticalAlert(event: CustomEvent) {
    const alert = event.detail;

    // Immediate notification for critical alerts
    this.notifySubscribers('critical-performance-alert', alert, { priority: 'critical' });

    // Attempt automatic remediation if possible
    this.attemptAutomaticRemediation(alert);
  }

  private escalateMobileAlert(alert: any) {
    // Escalate mobile alerts to main alerting system
    if (this.budgets) {
      // Convert mobile alert to budget alert format
      this.budgets.createAlert({
        name: `Mobile: ${alert.title}`,
        type: 'metric',
        threshold: alert.threshold,
        unit: 'custom',
        severity: alert.severity,
        description: alert.message,
        tags: ['mobile', alert.context]
      }, {
        name: alert.context,
        value: alert.value,
        unit: 'custom'
      }, { overage: alert.value - alert.threshold, threshold: alert.threshold });
    }
  }

  private attemptAutomaticRemediation(alert: any) {
    // Attempt automatic remediation for certain types of alerts
    switch (alert.context) {
      case 'memory-usage':
        this.triggerMemoryCleanup();
        break;
      case 'bundle-size':
        this.triggerBundleOptimization();
        break;
      case 'api-response':
        this.triggerAPICacheWarmup();
        break;
    }
  }

  private triggerMemoryCleanup() {
    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp-') || name.includes('cache-')) {
            caches.delete(name);
          }
        });
      });
    }
  }

  private triggerBundleOptimization() {
    // Trigger bundle optimization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Triggering bundle optimization...');
      // This would trigger build tools in development
    }
  }

  private triggerAPICacheWarmup() {
    // Warm up API caches for critical endpoints
    const criticalEndpoints = [
      '/api/services',
      '/api/availability',
      '/api/categories'
    ];

    criticalEndpoints.forEach(endpoint => {
      fetch(endpoint).catch(() => {
        // Ignore errors - just trying to warm up cache
      });
    });
  }

  public async generatePerformanceReport(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<PerformanceReport> {
    console.log(`📊 Generating ${period} performance report...`);

    const dashboard = await this.generateDashboard();
    const insights = await this.generateInsights(dashboard);
    const recommendations = await this.getTopRecommendations();
    const actionItems = await this.generateActionItems();
    const businessImpact = await this.calculateBusinessImpact(dashboard);

    const report: PerformanceReport = {
      id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      period,
      dashboard,
      insights,
      recommendations,
      actionItems,
      businessImpact
    };

    // Store report
    this.metrics.set(`report_${period}_${Date.now()}`, report);

    // Send report to analytics
    await this.sendReportToAnalytics(report);

    // Notify subscribers
    this.notifySubscribers('performance-report', report);

    console.log(`✅ ${period} performance report generated`);
    return report;
  }

  private async generateDashboard(): Promise<PerformanceDashboard> {
    // Collect metrics from all monitoring systems
    const rumMetrics = this.collectRUMMetrics();
    const apmMetrics = this.collectAPMMetrics();
    const budgetAlerts = this.collectBudgetAlerts();
    const mobileMetrics = this.collectMobileMetrics();

    return {
      overview: {
        overallScore: this.calculateOverallScore(rumMetrics, apmMetrics),
        trend: this.calculateTrend(),
        lastUpdated: new Date().toISOString(),
        healthStatus: this.calculateHealthStatus(rumMetrics, apmMetrics, budgetAlerts)
      },
      coreWebVitals: {
        lcp: { value: rumMetrics.lcp || 0, status: this.getMetricStatus('lcp', rumMetrics.lcp), trend: this.getMetricTrend('lcp') },
        fid: { value: rumMetrics.fid || 0, status: this.getMetricStatus('fid', rumMetrics.fid), trend: this.getMetricTrend('fid') },
        cls: { value: rumMetrics.cls || 0, status: this.getMetricStatus('cls', rumMetrics.cls), trend: this.getMetricTrend('cls') },
        fcp: { value: rumMetrics.fcp || 0, status: this.getMetricStatus('fcp', rumMetrics.fcp), trend: this.getMetricTrend('fcp') },
        ttfb: { value: rumMetrics.ttfb || 0, status: this.getMetricStatus('ttfb', rumMetrics.ttfb), trend: this.getMetricTrend('ttfb') }
      },
      userExperience: {
        averageLoadTime: rumMetrics.averageLoadTime || 0,
        bounceRate: this.calculateBounceRate(),
        conversionRate: this.calculateConversionRate(),
        userSatisfaction: this.calculateUserSatisfaction()
      },
      technicalMetrics: {
        bundleSize: apmMetrics.bundleSize || 0,
        apiResponseTime: apmMetrics.apiResponseTime || 0,
        errorRate: this.calculateErrorRate(),
        uptime: this.calculateUptime()
      },
      alerts: {
        critical: budgetAlerts.filter(a => a.severity === 'critical').length,
        warnings: budgetAlerts.filter(a => a.severity === 'warning').length,
        total: budgetAlerts.length
      }
    };
  }

  private async generateInsights(dashboard: PerformanceDashboard): Promise<PerformanceInsights> {
    const insights: PerformanceInsights = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      recommendations: []
    };

    // Analyze dashboard metrics to generate insights
    if (dashboard.overallScore > 90) {
      insights.strengths.push('Excellent overall performance score');
    }

    if (dashboard.coreWebVitals.lcp.status === 'good') {
      insights.strengths.push('Fast loading times (LCP)');
    }

    if (dashboard.coreWebVitals.cls.status === 'good') {
      insights.strengths.push('Excellent visual stability (CLS)');
    }

    if (dashboard.technicalMetrics.errorRate < 1) {
      insights.strengths.push('Low error rate');
    }

    // Identify weaknesses
    if (dashboard.overallScore < 80) {
      insights.weaknesses.push('Overall performance needs improvement');
    }

    if (dashboard.technicalMetrics.bundleSize > 300000) {
      insights.weaknesses.push('Large bundle size affecting load times');
    }

    if (dashboard.alerts.critical > 0) {
      insights.weaknesses.push(`${dashboard.alerts.critical} critical performance alerts`);
    }

    // Identify opportunities
    if (dashboard.userExperience.conversionRate < 3) {
      insights.opportunities.push('Improve conversion rate through performance optimization');
    }

    if (dashboard.technicalMetrics.apiResponseTime > 1000) {
      insights.opportunities.push('Optimize API response times');
    }

    // Generate high-level recommendations
    if (insights.weaknesses.length > 0) {
      insights.recommendations.push('Address critical performance issues');
    }

    if (insights.opportunities.length > 0) {
      insights.recommendations.push('Focus on optimization opportunities for business impact');
    }

    return insights;
  }

  private async getTopRecommendations() {
    if (!this.recommendations) return [];

    const report = await this.recommendations.generateReport();
    return report.recommendations.slice(0, 5); // Top 5 recommendations
  }

  private async generateActionItems() {
    // Generate actionable items from current alerts and recommendations
    const items = [];

    // Add items from critical alerts
    const criticalAlerts = this.budgets?.getCriticalAlerts() || [];
    criticalAlerts.forEach(alert => {
      items.push({
        id: alert.id,
        title: `Resolve: ${alert.title}`,
        description: alert.message,
        priority: 'critical',
        estimatedTime: '2-4 hours',
        status: 'pending'
      });
    });

    return items.slice(0, 10); // Top 10 action items
  }

  private async calculateBusinessImpact(dashboard: PerformanceDashboard) {
    const performanceScore = dashboard.overallScore;
    const conversionRate = dashboard.userExperience.conversionRate;

    return {
      potentialRevenueIncrease: Math.max(0, (performanceScore - 70) * 0.5), // Estimated % increase
      userRetentionImprovement: Math.max(0, (performanceScore - 75) * 0.3),
      supportCostReduction: Math.max(0, (100 - dashboard.technicalMetrics.errorRate) * 0.1),
      customerSatisfactionImprovement: Math.max(0, (performanceScore - 80) * 0.4)
    };
  }

  // Helper methods for dashboard generation
  private collectRUMMetrics(): any {
    // This would collect metrics from RUM system
    return {
      lcp: 2100,
      fid: 45,
      cls: 0.08,
      fcp: 1600,
      ttfb: 450,
      averageLoadTime: 2800
    };
  }

  private collectAPMMetrics(): any {
    // This would collect metrics from APM system
    return {
      bundleSize: 280000,
      apiResponseTime: 850,
      errorRate: 0.5,
      memoryUsage: 45000000
    };
  }

  private collectBudgetAlerts(): any[] {
    // This would collect alerts from budget system
    return this.budgets?.getActiveAlerts() || [];
  }

  private collectMobileMetrics(): any {
    // This would collect metrics from mobile monitoring
    return this.mobile?.getMetrics() || null;
  }

  private calculateOverallScore(rumMetrics: any, apmMetrics: any): number {
    // Calculate overall performance score
    let score = 100;

    // Deduct based on Core Web Vitals
    if (rumMetrics.lcp > 2500) score -= 15;
    if (rumMetrics.fid > 100) score -= 10;
    if (rumMetrics.cls > 0.1) score -= 15;

    // Deduct based on technical metrics
    if (apmMetrics.bundleSize > 300000) score -= 10;
    if (apmMetrics.apiResponseTime > 2000) score -= 10;
    if (apmMetrics.errorRate > 1) score -= 15;

    return Math.max(0, score);
  }

  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    // This would analyze historical data to determine trend
    return 'stable'; // Placeholder
  }

  private calculateHealthStatus(rumMetrics: any, apmMetrics: any, alerts: any[]): 'excellent' | 'good' | 'warning' | 'critical' {
    const score = this.calculateOverallScore(rumMetrics, apmMetrics);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    if (score >= 90 && criticalAlerts === 0) return 'excellent';
    if (score >= 80 && criticalAlerts === 0) return 'good';
    if (score >= 70 || criticalAlerts <= 2) return 'warning';
    return 'critical';
  }

  private getMetricStatus(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 600, poor: 1000 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getMetricTrend(metric: string): number {
    // This would analyze historical data to calculate trend
    return 0; // Placeholder
  }

  private calculateBounceRate(): number {
    // This would calculate actual bounce rate from analytics
    return 35; // Placeholder
  }

  private calculateConversionRate(): number {
    // This would calculate actual conversion rate
    return 2.8; // Placeholder
  }

  private calculateUserSatisfaction(): number {
    // This would calculate user satisfaction from feedback and metrics
    return 85; // Placeholder
  }

  private calculateErrorRate(): number {
    // This would calculate actual error rate
    return 0.5; // Placeholder
  }

  private calculateUptime(): number {
    // This would calculate actual uptime
    return 99.9; // Placeholder
  }

  private async sendReportToAnalytics(report: PerformanceReport) {
    try {
      await fetch('/api/analytics/performance-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to send performance report to analytics:', error);
    }
  }

  private getCurrentPerformanceContext(): any {
    return {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      // Add more context as needed
    };
  }

  private generateSessionId(): string {
    return `perf_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `perf_report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private isSystemActive(system: string): boolean {
    switch (system) {
      case 'RUM': return !!this.rum;
      case 'APM': return !!this.apm;
      case 'Budgets': return !!this.budgets;
      case 'Recommendations': return !!this.recommendations;
      case 'Mobile': return !!this.mobile;
      default: return false;
    }
  }

  // Public API methods
  public subscribe(event: string, callback: Function): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    this.subscribers.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifySubscribers(event: string, data: any, options: { priority?: string } = {}) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data, options);
        } catch (error) {
          console.error(`Error in performance hub subscriber for ${event}:`, error);
        }
      });
    }
  }

  public getDashboard(): Promise<PerformanceDashboard> {
    return this.generateDashboard();
  }

  public getReport(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<PerformanceReport> {
    return this.generatePerformanceReport(period);
  }

  public forcePerformanceCheck(): void {
    // Trigger immediate performance check across all systems
    this.mobile?.forcePerformanceCheck();
    this.generatePerformanceReport();
  }

  public getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public destroy(): void {
    console.log('🛑 Shutting down Performance Hub...');

    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    // Destroy all monitoring systems
    this.rum = null;
    this.apm?.destroy();
    this.budgets?.destroy();
    this.mobile?.destroy();

    // Clear subscribers
    this.subscribers.clear();

    // Clear metrics
    this.metrics.clear();

    this.isInitialized = false;
    console.log('✅ Performance Hub destroyed');
  }
}

// Global instance
let performanceHubInstance: PerformanceHub | null = null;

export const initializePerformanceHub = async () => {
  if (!performanceHubInstance && typeof window !== 'undefined') {
    performanceHubInstance = new PerformanceHub();
    await performanceHubInstance.initialize();
  }
  return performanceHubInstance;
};

export const getPerformanceHub = () => performanceHubInstance;

export { PerformanceHub };
export default PerformanceHub;