import { EventEmitter } from 'event-emitter3';

export interface PerformanceMetrics {
  // Timing metrics
  requestDuration: number;
  responseTime: number;
  throughput: number; // requests per second
  latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };

  // Resource metrics
  memory: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    available: number;
  };

  // Error metrics
  errorRate: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;

  // Business metrics
  activeUsers: number;
  conversionRate: number;
  bounceRate: number;

  // System metrics
  uptime: number;
  availability: number; // percentage
  healthScore: number;

  // Database metrics
  dbConnections: number;
  dbQueryTime: number;
  dbSlowQueries: number;

  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;
  cacheSize: number;

  // Network metrics
  bandwidth: {
    inbound: number;
    outbound: number;
  };
  requestSize: number;
  responseSize: number;

  timestamp: string;
}

export interface PerformanceThreshold {
  metric: keyof PerformanceMetrics;
  warning: number;
  critical: number;
  operator: 'gt' | 'lt' | 'eq';
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: PerformanceThreshold;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface PerformanceConfig {
  collectionInterval: number;
  retentionPeriod: number; // hours
  enableRealTimeAlerts: boolean;
  enableHistoricalAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  thresholds: PerformanceThreshold[];
  sampleSize: number;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private timers = new Map<string, number>();
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor(private config: PerformanceConfig) {
    super();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize default metrics
    this.counters.set('requests', 0);
    this.counters.set('errors', 0);
    this.histograms.set('responseTime', []);
    this.histograms.set('requestSize', []);
    this.histograms.set('responseSize', []);
  }

  start(): void {
    if (this.isCollecting) return;

    this.isCollecting = true;

    // Start periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);

    this.emit('started');
  }

  stop(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.emit('stopped');
  }

  private async collectMetrics(): Promise<void> {
    const now = new Date().toISOString();
    const metrics: PerformanceMetrics = {
      // Timing metrics
      requestDuration: 0,
      responseTime: this.calculatePercentiles(this.histograms.get('responseTime') || []),
      throughput: this.calculateThroughput(),
      latency: this.calculateLatency(),

      // Resource metrics
      memory: this.getMemoryMetrics(),
      cpu: await this.getCpuMetrics(),

      // Error metrics
      errorRate: this.calculateErrorRate(),
      errorsByType: this.getErrorBreakdown(),
      errorsByEndpoint: {},

      // Business metrics (simplified)
      activeUsers: this.getActiveUserCount(),
      conversionRate: this.getConversionRate(),
      bounceRate: this.getBounceRate(),

      // System metrics
      uptime: this.getUptime(),
      availability: this.getAvailability(),
      healthScore: this.getHealthScore(),

      // Database metrics
      dbConnections: this.getDbConnectionCount(),
      dbQueryTime: this.getAverageQueryTime(),
      dbSlowQueries: this.getSlowQueryCount(),

      // Cache metrics
      cacheHitRate: this.getCacheHitRate(),
      cacheMissRate: this.getCacheMissRate(),
      cacheSize: this.getCacheSize(),

      // Network metrics
      bandwidth: this.getBandwidthUsage(),
      requestSize: this.calculatePercentiles(this.histograms.get('requestSize') || []),
      responseSize: this.calculatePercentiles(this.histograms.get('responseSize') || []),

      timestamp: now
    };

    this.metrics.push(metrics);

    // Check thresholds and generate alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkThresholds(metrics);
    }

    // Maintain retention
    this.maintainRetention();

    this.emit('metricsCollected', metrics);
  }

  private calculatePercentiles(values: number[]): PerformanceMetrics['latency'] {
    if (values.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)] || 0,
      p90: sorted[Math.floor(len * 0.9)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
      max: sorted[len - 1] || 0,
      min: sorted[0] || 0
    };
  }

  private calculateThroughput(): number {
    // Calculate requests per second over the last minute
    const recentMetrics = this.getRecentMetrics(60 * 1000);
    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestDuration, 0);
    return totalRequests / 60;
  }

  private calculateLatency(): PerformanceMetrics['latency'] {
    const responseTimes = this.histograms.get('responseTime') || [];
    return this.calculatePercentiles(responseTimes);
  }

  private getMemoryMetrics(): PerformanceMetrics['memory'] {
    if (typeof window !== 'undefined') {
      // Browser environment
      const memory = (performance as any).memory;
      if (memory) {
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
      }
    } else {
      // Node.js environment
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        limit: 2 * 1024 * 1024 * 1024, // 2GB default limit
        percentage: (usage.heapUsed / usage.heapTotal) * 100
      };
    }

    return { used: 0, total: 0, limit: 0, percentage: 0 };
  }

  private async getCpuMetrics(): Promise<PerformanceMetrics['cpu']> {
    // Simplified CPU metrics
    // In a real implementation, you'd use system-specific APIs
    return {
      usage: 0,
      available: 100
    };
  }

  private calculateErrorRate(): number {
    const requests = this.counters.get('requests') || 0;
    const errors = this.counters.get('errors') || 0;
    return requests > 0 ? (errors / requests) * 100 : 0;
  }

  private getErrorBreakdown(): Record<string, number> {
    // In a real implementation, track errors by type
    return {
      'network': 0,
      'timeout': 0,
      'validation': 0,
      'system': 0
    };
  }

  private getActiveUserCount(): number {
    // Simplified - would track active sessions
    return 0;
  }

  private getConversionRate(): number {
    // Simplified - would track conversions
    return 0;
  }

  private getBounceRate(): number {
    // Simplified - would track bounce rate
    return 0;
  }

  private getUptime(): number {
    return process.uptime() * 1000; // milliseconds
  }

  private getAvailability(): number {
    // Calculate based on recent health checks
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    if (recentMetrics.length === 0) return 100;

    const healthyCount = recentMetrics.filter(m => m.healthScore > 80).length;
    return (healthyCount / recentMetrics.length) * 100;
  }

  private getHealthScore(): number {
    // Calculate overall health score
    const memory = this.getMemoryMetrics();
    const errorRate = this.calculateErrorRate();
    const availability = this.getAvailability();

    let score = 100;

    // Deduct points for high memory usage
    if (memory.percentage > 80) score -= 20;
    else if (memory.percentage > 60) score -= 10;

    // Deduct points for high error rate
    if (errorRate > 5) score -= 30;
    else if (errorRate > 1) score -= 10;

    // Deduct points for low availability
    if (availability < 95) score -= 20;
    else if (availability < 99) score -= 5;

    return Math.max(0, score);
  }

  private getDbConnectionCount(): number {
    // Would track actual DB connections
    return 0;
  }

  private getAverageQueryTime(): number {
    // Would track actual query times
    return 0;
  }

  private getSlowQueryCount(): number {
    // Would track slow queries
    return 0;
  }

  private getCacheHitRate(): number {
    // Would calculate from cache hits/misses
    return 0;
  }

  private getCacheMissRate(): number {
    return 0;
  }

  private getCacheSize(): number {
    return 0;
  }

  private getBandwidthUsage(): PerformanceMetrics['bandwidth'] {
    return {
      inbound: 0,
      outbound: 0
    };
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    for (const threshold of this.config.thresholds) {
      const value = this.getMetricValue(metrics, threshold.metric);
      const isWarning = this.checkThreshold(value, threshold, 'warning');
      const isCritical = this.checkThreshold(value, threshold, 'critical');

      if (isCritical || isWarning) {
        const alert: PerformanceAlert = {
          id: this.generateAlertId(),
          metric: threshold.metric,
          value,
          threshold,
          severity: isCritical ? 'critical' : 'warning',
          message: `${threshold.metric} is ${value} (threshold: ${isCritical ? threshold.critical : threshold.warning})`,
          timestamp: new Date().toISOString(),
          resolved: false
        };

        this.alerts.push(alert);
        this.emit('alert', alert);
      }
    }
  }

  private getMetricValue(metrics: PerformanceMetrics, metric: keyof PerformanceMetrics): number {
    const value = metrics[metric];
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'p50' in value) return value.p50; // For latency object
    if (typeof value === 'object' && 'percentage' in value) return value.percentage; // For memory object
    return 0;
  }

  private checkThreshold(value: number, threshold: PerformanceThreshold, level: 'warning' | 'critical'): boolean {
    const limit = level === 'critical' ? threshold.critical : threshold.warning;

    switch (threshold.operator) {
      case 'gt':
        return value > limit;
      case 'lt':
        return value < limit;
      case 'eq':
        return value === limit;
      default:
        return false;
    }
  }

  private maintainRetention(): void {
    const cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);

    // Limit to max sample size
    if (this.metrics.length > this.config.sampleSize) {
      this.metrics = this.metrics.slice(-this.config.sampleSize);
    }
  }

  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  // Record operations
  recordRequestStart(id: string): void {
    this.timers.set(id, Date.now());
    this.counters.set('requests', (this.counters.get('requests') || 0) + 1);
  }

  recordRequestEnd(id: string, responseSize?: number): void {
    const startTime = this.timers.get(id);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.histograms.get('responseTime')?.push(duration);
      this.timers.delete(id);

      if (responseSize) {
        this.histograms.get('responseSize')?.push(responseSize);
      }
    }
  }

  recordError(type: string): void {
    this.counters.set('errors', (this.counters.get('errors') || 0) + 1);
    // Track error by type
    const errorCounts = new Map(this.counters);
    const current = errorCounts.get(`error:${type}`) || 0;
    this.counters.set(`error:${type}`, current + 1);
  }

  recordRequestSize(size: number): void {
    this.histograms.get('requestSize')?.push(size);
  }

  // Metrics access
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(duration?: number): PerformanceMetrics[] {
    if (!duration) return [...this.metrics];

    const cutoff = Date.now() - duration;
    return this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  getAverageMetrics(duration?: number): Partial<PerformanceMetrics> {
    const history = this.getMetricsHistory(duration);
    if (history.length === 0) return {};

    // Calculate averages
    const avg: any = {};

    // Average numeric fields
    const numericFields = [
      'requestDuration', 'throughput', 'errorRate',
      'activeUsers', 'conversionRate', 'bounceRate',
      'uptime', 'availability', 'healthScore',
      'dbConnections', 'dbQueryTime', 'dbSlowQueries',
      'cacheHitRate', 'cacheMissRate', 'cacheSize'
    ];

    for (const field of numericFields) {
      const values = history.map(m => (m as any)[field]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        avg[field] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    }

    // Average latency percentiles
    const latencies = history.map(m => m.latency);
    if (latencies.length > 0) {
      avg.latency = {
        p50: latencies.reduce((sum, l) => sum + l.p50, 0) / latencies.length,
        p90: latencies.reduce((sum, l) => sum + l.p90, 0) / latencies.length,
        p95: latencies.reduce((sum, l) => sum + l.p95, 0) / latencies.length,
        p99: latencies.reduce((sum, l) => sum + l.p99, 0) / latencies.length,
        max: Math.max(...latencies.map(l => l.max)),
        min: Math.min(...latencies.map(l => l.min))
      };
    }

    return avg;
  }

  // Alert management
  getAlerts(status?: 'open' | 'resolved'): PerformanceAlert[] {
    if (status === 'open') {
      return this.alerts.filter(a => !a.resolved);
    } else if (status === 'resolved') {
      return this.alerts.filter(a => a.resolved);
    }
    return [...this.alerts];
  }

  resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  clearAlerts(): void {
    this.alerts = [];
    this.emit('alertsCleared');
  }

  // Threshold management
  addThreshold(threshold: PerformanceThreshold): void {
    this.config.thresholds.push(threshold);
    this.emit('thresholdAdded', threshold);
  }

  removeThreshold(metric: keyof PerformanceMetrics): boolean {
    const index = this.config.thresholds.findIndex(t => t.metric === metric);
    if (index !== -1) {
      this.config.thresholds.splice(index, 1);
      this.emit('thresholdRemoved', metric);
      return true;
    }
    return false;
  }

  getThresholds(): PerformanceThreshold[] {
    return [...this.config.thresholds];
  }

  // Predictive analysis (placeholder)
  predictPerformance(timeHorizon: number): any {
    if (!this.config.enablePredictiveAnalysis) {
      return null;
    }

    // Simple linear regression prediction
    // In a real implementation, use more sophisticated algorithms
    const recentMetrics = this.getRecentMetrics(60 * 60 * 1000); // Last hour
    if (recentMetrics.length < 2) return null;

    // This is a placeholder for predictive analysis
    return {
      predictedMetrics: null,
      confidence: 0,
      timeHorizon
    };
  }

  // Export data
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = this.metrics;

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV export
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(m => Object.values(m).join(','));
    return [headers, ...rows].join('\n');
  }

  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.timers.clear();
    this.counters.clear();
    this.histograms.clear();
    this.initializeMetrics();
    this.emit('reset');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor({
  collectionInterval: 10000, // 10 seconds
  retentionPeriod: 24, // 24 hours
  enableRealTimeAlerts: true,
  enableHistoricalAnalysis: true,
  enablePredictiveAnalysis: false, // Disabled by default
  thresholds: [
    { metric: 'errorRate', warning: 1, critical: 5, operator: 'gt' },
    { metric: 'availability', warning: 99, critical: 95, operator: 'lt' },
    { metric: 'healthScore', warning: 80, critical: 60, operator: 'lt' },
    { metric: 'memory', warning: 70, critical: 90, operator: 'gt' },
    { metric: 'throughput', warning: 100, critical: 50, operator: 'lt' }
  ],
  sampleSize: 1000
});