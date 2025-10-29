import { EventEmitter } from 'events';

import {
  HealthCheckResult,
  HealthCheck,
  DependencyHealth,
  HealthScore,
  AlertRule,
  Alert
} from './types';

export interface HealthCheckDefinition {
  name: string;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  critical: boolean;
  check: () => Promise<HealthCheck>;
}

export interface HealthMonitorConfig {
  checkInterval: number;
  alerting: boolean;
  historyRetention: number; // hours
  scoreCalculation: {
    weightCritical: number;
    weightWarning: number;
    weightInfo: number;
  };
}

export class HealthMonitor extends EventEmitter {
  private checks = new Map<string, HealthCheckDefinition>();
  private dependencies = new Map<string, DependencyHealth>();
  private history: HealthCheckResult[] = [];
  private scores: HealthScore[] = [];
  private alerts: Alert[] = [];
  private alertRules = new Map<string, AlertRule>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private lastHealthCheck: HealthCheckResult | null = null;

  constructor(private config: HealthMonitorConfig) {
    super();
  }

  registerCheck(definition: HealthCheckDefinition): void {
    this.checks.set(definition.name, definition);

    // Start periodic health check
    const interval = setInterval(() => {
      this.runCheck(definition.name);
    }, definition.interval);

    this.intervals.set(definition.name, interval);

    // Run initial check
    this.runCheck(definition.name);
  }

  unregisterCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
    this.checks.delete(name);
  }

  private async runCheck(name: string): Promise<void> {
    const definition = this.checks.get(name);
    if (!definition) return;

    const startTime = Date.now();
    let healthCheck: HealthCheck;

    try {
      // Add timeout wrapper
      healthCheck = await Promise.race([
        definition.check(),
        new Promise<HealthCheck>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), definition.timeout);
        })
      ]);
    } catch (error) {
      const duration = Date.now() - startTime;
      healthCheck = {
        name,
        status: 'fail',
        duration,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error: String(error) }
      };
    }

    // Update dependency health
    const dependency: DependencyHealth = {
      name,
      type: this.inferDependencyType(name),
      status: healthCheck.status === 'pass' ? 'healthy' :
              healthCheck.status === 'warn' ? 'degraded' : 'unhealthy',
      responseTime: healthCheck.duration,
      error: healthCheck.message,
      lastChecked: new Date().toISOString()
    };

    this.dependencies.set(name, dependency);
    this.emit('checkComplete', healthCheck, dependency);

    // Trigger alerts if configured
    if (this.config.alerting && healthCheck.status !== 'pass') {
      this.evaluateAlertRules(healthCheck, dependency);
    }
  }

  private inferDependencyType(name: string): DependencyHealth['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('db') || lowerName.includes('database') || lowerName.includes('postgres')) {
      return 'database';
    }
    if (lowerName.includes('cache') || lowerName.includes('redis') || lowerName.includes('memcached')) {
      return 'cache';
    }
    if (lowerName.includes('queue') || lowerName.includes('sqs') || lowerName.includes('rabbitmq')) {
      return 'queue';
    }
    if (lowerName.includes('api') || lowerName.includes('service') || lowerName.includes('external')) {
      return 'api';
    }
    return 'external';
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // Run all health checks
    for (const [name] of this.checks) {
      const dependency = this.dependencies.get(name);
      if (dependency) {
        checks.push({
          name,
          status: dependency.status === 'healthy' ? 'pass' :
                  dependency.status === 'degraded' ? 'warn' : 'fail',
          duration: dependency.responseTime || 0,
          message: dependency.error,
          details: { type: dependency.type }
        });
      }
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const criticalFails = checks.filter(c =>
      this.checks.get(c.name)?.critical && c.status === 'fail'
    ).length;

    const warnings = checks.filter(c => c.status === 'warn').length;
    const fails = checks.filter(c => c.status === 'fail').length;

    if (criticalFails > 0 || fails > 0) {
      status = 'unhealthy';
    } else if (warnings > 0) {
      status = 'degraded';
    }

    const duration = Date.now() - startTime;
    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      duration,
      checks,
      details: {
        totalChecks: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        warnings,
        failed: fails,
        criticalFailures: criticalFails
      }
    };

    this.lastHealthCheck = result;
    this.addToHistory(result);

    // Calculate health score
    const score = this.calculateHealthScore(result);
    this.scores.push(score);

    // Keep only recent scores
    const maxScores = 100;
    if (this.scores.length > maxScores) {
      this.scores = this.scores.slice(-maxScores);
    }

    this.emit('healthUpdate', result, score);
    return result;
  }

  private calculateHealthScore(result: HealthCheckResult): HealthScore {
    const components: Record<string, number> = {};
    let totalWeight = 0;
    let weightedScore = 0;

    for (const check of result.checks) {
      const definition = this.checks.get(check.name);
      const weight = definition?.critical ?
        this.config?.scoreCalculation?.weightCritical || 0.6 :
        check.status === 'warn' ?
          this.config?.scoreCalculation?.weightWarning || 0.3 :
          this.config?.scoreCalculation?.weightInfo || 0.1;

      let score = 100;
      if (check.status === 'fail') {
        score = definition?.critical ? 0 : 50;
      } else if (check.status === 'warn') {
        score = 75;
      }

      components[check.name] = score;
      totalWeight += weight;
      weightedScore += score * weight;
    }

    const overall = totalWeight > 0 ? weightedScore / totalWeight : 100;

    // Calculate trend
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (this.scores.length > 1) {
      const previousScore = this.scores[this.scores.length - 2].overall;
      if (overall > previousScore + 5) {
        trend = 'improving';
      } else if (overall < previousScore - 5) {
        trend = 'degrading';
      }
    }

    return {
      overall: Math.round(overall),
      components,
      timestamp: new Date().toISOString(),
      trend
    };
  }

  private addToHistory(result: HealthCheckResult): void {
    this.history.push(result);

    // Retain only recent history
    const maxAge = this.config.historyRetention * 60 * 60 * 1000; // Convert hours to milliseconds
    const cutoff = Date.now() - maxAge;

    this.history = this.history.filter(h =>
      new Date(h.timestamp).getTime() > cutoff
    );

    // Limit history size
    const maxHistory = 1000;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }

  // Dependency management
  addDependency(name: string, type: DependencyHealth['type']): void {
    const dependency: DependencyHealth = {
      name,
      type,
      status: 'healthy',
      lastChecked: new Date().toISOString()
    };
    this.dependencies.set(name, dependency);
  }

  getDependencies(): DependencyHealth[] {
    return Array.from(this.dependencies.values());
  }

  getDependency(name: string): DependencyHealth | undefined {
    return this.dependencies.get(name);
  }

  // Alert management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlertRule(id: string): void {
    this.alertRules.delete(id);
  }

  private evaluateAlertRules(healthCheck: HealthCheck, dependency: DependencyHealth): void {
    for (const [id, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      let shouldAlert = false;
      let message = '';

      switch (rule.condition) {
        case 'dependency_unhealthy':
          shouldAlert = dependency.status === 'unhealthy';
          message = `Dependency ${dependency.name} is unhealthy`;
          break;

        case 'response_time_high':
          shouldAlert = (dependency.responseTime || 0) > rule.threshold;
          message = `Dependency ${dependency.name} response time is ${dependency.responseTime}ms (threshold: ${rule.threshold}ms)`;
          break;

        case 'consecutive_failures':
          // This would require tracking consecutive failures
          break;

        case 'health_score_low':
          const latestScore = this.scores[this.scores.length - 1];
          shouldAlert = (latestScore?.overall || 100) < rule.threshold;
          message = `Health score is ${latestScore?.overall || 100}% (threshold: ${rule.threshold}%)`;
          break;
      }

      if (shouldAlert) {
        this.createAlert(id, rule, message);
      }
    }
  }

  private createAlert(ruleId: string, rule: AlertRule, message: string): void {
    // Check if alert already exists and is open
    const existingAlert = this.alerts.find(a =>
      a.ruleId === ruleId && a.status === 'open'
    );

    if (existingAlert) {
      return; // Avoid duplicate alerts
    }

    const alert: Alert = {
      id: `${ruleId}-${Date.now()}`,
      ruleId,
      severity: rule.severity,
      status: 'open',
      message,
      timestamp: new Date().toISOString(),
      enrichment: {
        ruleName: rule.name,
        tags: rule.tags
      }
    };

    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  getAlerts(status?: Alert['status']): Alert[] {
    if (status) {
      return this.alerts.filter(a => a.status === status);
    }
    return this.alerts;
  }

  acknowledgeAlert(id: string, acknowledgedBy: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert && alert.status === 'open') {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = acknowledgedBy;
      this.emit('alertAcknowledged', alert);
    }
  }

  resolveAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert && (alert.status === 'open' || alert.status === 'acknowledged')) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      this.emit('alertResolved', alert);
    }
  }

  // Metrics and monitoring
  getHealthScore(): HealthScore | undefined {
    return this.scores[this.scores.length - 1];
  }

  getHealthTrend(): HealthScore[] {
    return this.scores.slice(-10); // Return last 10 scores
  }

  getHistory(): HealthCheckResult[] {
    return this.history;
  }

  getMetrics() {
    const dependencies = Array.from(this.dependencies.values());
    const healthy = dependencies.filter(d => d.status === 'healthy').length;
    const degraded = dependencies.filter(d => d.status === 'degraded').length;
    const unhealthy = dependencies.filter(d => d.status === 'unhealthy').length;

    return {
      totalDependencies: dependencies.length,
      healthy,
      degraded,
      unhealthy,
      lastCheck: this.lastHealthCheck?.timestamp,
      overallScore: this.getHealthScore()?.overall || 100,
      openAlerts: this.alerts.filter(a => a.status === 'open').length,
      activeRules: this.alertRules.size,
      checksRunning: this.intervals.size
    };
  }

  // Lifecycle
  start(): void {
    for (const [name] of this.checks) {
      this.runCheck(name);
    }
  }

  stop(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  reset(): void {
    this.history = [];
    this.scores = [];
    this.alerts = [];
    this.lastHealthCheck = null;

    // Reset all dependencies to healthy
    for (const dependency of this.dependencies.values()) {
      dependency.status = 'healthy';
      dependency.error = undefined;
      dependency.responseTime = undefined;
      dependency.lastChecked = new Date().toISOString();
    }
  }
}

// Default health check implementations
export class HealthChecks {
  static async database(url: string): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Simple connection test - adjust based on your database
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      const duration = Date.now() - startTime;
      return {
        name: 'database',
        status: response.ok ? 'pass' : 'fail',
        duration,
        message: response.ok ? 'Database connection successful' : `HTTP ${response.status}`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: 'database',
        status: 'fail',
        duration,
        message: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  static async httpService(url: string): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      const duration = Date.now() - startTime;
      return {
        name: 'http-service',
        status: response.ok ? 'pass' : 'fail',
        duration,
        message: response.ok ? 'Service healthy' : `HTTP ${response.status}`,
        details: { status: response.status }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: 'http-service',
        status: 'fail',
        duration,
        message: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }

  static async memoryUsage(thresholdMB = 500): Promise<HealthCheck> {
    const startTime = Date.now();

    if (typeof window !== 'undefined') {
      // Browser environment
      const memory = (performance as any).memory;
      if (!memory) {
        const duration = Date.now() - startTime;
        return {
          name: 'memory',
          status: 'warn',
          duration,
          message: 'Memory API not available'
        };
      }

      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const duration = Date.now() - startTime;

      return {
        name: 'memory',
        status: usedMB > thresholdMB ? 'fail' : 'pass',
        duration,
        message: `Memory usage: ${usedMB.toFixed(2)}MB`,
        details: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
      };
    } else {
      // Node.js environment
      const usage = process.memoryUsage();
      const usedMB = usage.heapUsed / 1024 / 1024;
      const duration = Date.now() - startTime;

      return {
        name: 'memory',
        status: usedMB > thresholdMB ? 'fail' : 'pass',
        duration,
        message: `Memory usage: ${usedMB.toFixed(2)}MB`,
        details: usage
      };
    }
  }

  static async customCheck(
    name: string,
    checkFn: () => Promise<boolean>,
    errorMessage?: string
  ): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await checkFn();
      const duration = Date.now() - startTime;

      return {
        name,
        status: result ? 'pass' : 'fail',
        duration,
        message: result ? 'Custom check passed' : errorMessage || 'Custom check failed'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name,
        status: 'fail',
        duration,
        message: error instanceof Error ? error.message : 'Custom check error'
      };
    }
  }
}