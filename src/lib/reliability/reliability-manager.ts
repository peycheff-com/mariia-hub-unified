import { EventEmitter } from 'events';

import { retryManager } from './retry-manager';
import { CircuitBreaker, circuitBreakerRegistry, CircuitBreakerFactory } from './circuit-breaker';
import { HealthMonitor, HealthChecks } from './health-monitor';
import { RequestQueue, QueueFactory, Priority } from './request-queue';
import { ErrorAnalyzer } from './error-analyzer';
import { HealthCheck, Alert } from './types';
import { getEnvVar } from '@/lib/runtime-env';

export interface ReliabilityConfig {
  // Retry configuration
  retry: {
    enabled: boolean;
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };

  // Circuit breaker configuration
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    timeout: number;
  };

  // Health monitoring configuration
  healthMonitor: {
    enabled: boolean;
    checkInterval: number;
    alerting: boolean;
  };

  // Request queue configuration
  requestQueue: {
    enabled: boolean;
    concurrency: number;
    maxSize: number;
  };

  // Error analysis configuration
  errorAnalyzer: {
    enabled: boolean;
    enableLearning: boolean;
  };
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  components: {
    retries: {
      active: number;
      failed: number;
      successRate: number;
    };
    circuitBreakers: {
      total: number;
      open: number;
      healthy: number;
    };
    healthChecks: {
      passing: number;
      failing: number;
      warnings: number;
    };
    requestQueues: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    errors: {
      total: number;
      critical: number;
      rate: number;
    };
  };
  alerts: Alert[];
  lastUpdated: string;
}

export class ReliabilityManager extends EventEmitter {
  private healthMonitor: HealthMonitor;
  private errorAnalyzer: ErrorAnalyzer;
  private requestQueues = new Map<string, RequestQueue>();
  private isStarted = false;
  private metrics = {
    requests: 0,
    successes: 0,
    failures: 0,
    retries: 0,
    circuitBreakerTrips: 0,
    healthChecksPassed: 0,
    healthChecksFailed: 0
  };

  constructor(private config: ReliabilityConfig) {
    super();

    // Initialize health monitor
    this.healthMonitor = new HealthMonitor({
      checkInterval: config.healthMonitor.checkInterval,
      alerting: config.healthMonitor.alerting,
      historyRetention: 24, // 24 hours
      scoreCalculation: {
        weightCritical: 0.6,
        weightWarning: 0.3,
        weightInfo: 0.1
      }
    });

    // Initialize error analyzer
    this.errorAnalyzer = new ErrorAnalyzer({
      enableLearning: config.errorAnalyzer.enableLearning,
      retainHistoryFor: 72, // 72 hours
      similarErrorThreshold: 0.7,
      maxPatterns: 100,
      enableAutoClassification: true,
      enableRecommendations: true
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Health monitor events
    this.healthMonitor.on('alert', (alert: Alert) => {
      this.emit('alert', alert);
    });

    // Error analyzer events
    this.errorAnalyzer.on('errorAnalyzed', (error, classification) => {
      this.metrics.failures++;
      this.emit('errorAnalyzed', error, classification);
    });
  }

  async start(): Promise<void> {
    if (this.isStarted) return;

    this.isStarted = true;

    // Start health monitoring if enabled
    if (this.config.healthMonitor.enabled) {
      this.registerDefaultHealthChecks();
      this.healthMonitor.start();
    }

    // Set up periodic status updates
    setInterval(() => {
      this.emitStatusUpdate();
    }, 5000); // Every 5 seconds

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

    this.isStarted = false;

    // Stop health monitor
    this.healthMonitor.stop();

    // Stop all request queues
    for (const queue of this.requestQueues.values()) {
      queue.destroy();
    }
    this.requestQueues.clear();

    // Reset circuit breakers
    circuitBreakerRegistry.resetAll();

    this.emit('stopped');
  }

  private registerDefaultHealthChecks(): void {
    // Memory usage check
    this.healthMonitor.registerCheck({
      name: 'memory',
      interval: 30000, // 30 seconds
      timeout: 5000,
      critical: true,
      check: () => HealthChecks.memoryUsage(500) // Alert if > 500MB
    });

    // Database health check (example)
    const supabaseUrl = getEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
    if (supabaseUrl) {
      this.healthMonitor.registerCheck({
        name: 'database',
        interval: 60000, // 1 minute
        timeout: 10000,
        critical: true,
        check: () => HealthChecks.database(supabaseUrl)
      });
    }

    // Custom application health check
    this.healthMonitor.registerCheck({
      name: 'application',
      interval: 30000,
      timeout: 5000,
      critical: false,
      check: () => HealthChecks.customCheck(
        'application',
        async () => {
          // Check if basic app functionality works
          return this.metrics.requests > 0 || !this.isStarted;
        },
        'Application not responding'
      )
    });
  }

  private emitStatusUpdate(): void {
    const status = this.getSystemStatus();
    this.emit('statusUpdate', status);
  }

  // Public API methods

  async executeWithReliability<T>(
    operation: () => Promise<T>,
    options: {
      retries?: boolean;
      circuitBreaker?: string;
      queue?: string;
      priority?: Priority;
      timeout?: number;
    } = {}
  ): Promise<T> {
    this.metrics.requests++;

    // Wrap operation with error analysis
    const wrappedOperation = async (): Promise<T> => {
      try {
        const result = await operation();
        this.metrics.successes++;
        return result;
      } catch (error) {
        // Analyze the error
        this.errorAnalyzer.analyze(error as Error, {
          operation: operation.name || 'anonymous',
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };

    // Apply circuit breaker if specified
    if (options.circuitBreaker && this.config.circuitBreaker.enabled) {
      const cb = circuitBreakerRegistry.get(options.circuitBreaker);
      if (cb) {
        return cb.execute(wrappedOperation);
      }
    }

    // Apply retry logic if enabled
    if (options.retries !== false && this.config.retry.enabled) {
      return retryManager.execute(wrappedOperation, {
        customConfig: {
          maxAttempts: config.retry.maxAttempts,
          baseDelay: config.retry.baseDelay,
          maxDelay: config.retry.maxDelay
        }
      });
    }

    // Use request queue if specified
    if (options.queue && this.config.requestQueue.enabled) {
      const queue = this.getOrCreateQueue(options.queue);
      return queue.add({
        execute: wrappedOperation,
        priority: options.priority || Priority.NORMAL,
        timeout: options.timeout
      });
    }

    return wrappedOperation();
  }

  // Circuit breaker management
  createCircuitBreaker(
    name: string,
    type: 'api' | 'database' | 'external' | 'critical' = 'api'
  ): CircuitBreaker {
    const cb = CircuitBreakerFactory.create(name, type, {
      enabled: this.config.circuitBreaker.enabled,
      failureThreshold: this.config.circuitBreaker.failureThreshold,
      timeout: this.config.circuitBreaker.timeout
    });

    circuitBreakerRegistry.register(cb);

    cb.on('stateChange', ({ from, to }) => {
      if (to === 'OPEN') {
        this.metrics.circuitBreakerTrips++;
      }
      this.emit('circuitBreakerStateChange', name, { from, to });
    });

    return cb;
  }

  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return circuitBreakerRegistry.get(name);
  }

  // Request queue management
  getOrCreateQueue(
    name: string,
    type: 'priority' | 'background' | 'critical' = 'priority'
  ): RequestQueue {
    if (!this.requestQueues.has(name)) {
      const queue = QueueFactory.create(type, {
        enabled: this.config.requestQueue.enabled,
        concurrency: this.config.requestQueue.concurrency,
        maxSize: this.config.requestQueue.maxSize
      });

      queue.on('completed', () => {
        this.metrics.successes++;
      });

      queue.on('failed', () => {
        this.metrics.failures++;
      });

      queue.on('retry', () => {
        this.metrics.retries++;
      });

      this.requestQueues.set(name, queue);
    }

    return this.requestQueues.get(name)!;
  }

  getQueue(name: string): RequestQueue | undefined {
    return this.requestQueues.get(name);
  }

  // Health monitoring
  registerHealthCheck(check: {
    name: string;
    interval?: number;
    timeout?: number;
    critical?: boolean;
    check: () => Promise<HealthCheck>;
  }): void {
    if (this.config.healthMonitor.enabled) {
      this.healthMonitor.registerCheck(check);
    }
  }

  async getHealthStatus() {
    return this.healthMonitor.getHealthStatus();
  }

  getHealthScore() {
    return this.healthMonitor.getHealthScore();
  }

  // Error analysis
  analyzeError(error: Error, context?: Record<string, any>) {
    if (this.config.errorAnalyzer.enabled) {
      return this.errorAnalyzer.analyze(error, context);
    }
  }

  getErrorMetrics() {
    return this.errorAnalyzer.getMetrics();
  }

  getRecentErrors(count?: number) {
    return this.errorAnalyzer.getRecentErrors(count);
  }

  // System status
  getSystemStatus(): SystemStatus {
    const healthStatus = this.healthMonitor.getHealthStatus();
    const healthScore = this.healthMonitor.getHealthScore();
    const cbMetrics = circuitBreakerRegistry.getAllMetrics();
    const errorMetrics = this.errorAnalyzer.getMetrics();

    // Calculate queue metrics
    let totalPending = 0;
    let totalProcessing = 0;
    let totalCompleted = 0;
    let totalFailed = 0;

    for (const queue of this.requestQueues.values()) {
      const queueMetrics = queue.getMetrics();
      totalPending += queueMetrics.queueLength;
      totalProcessing += queueMetrics.processingCount;
      totalCompleted += queueMetrics.completedRequests;
      totalFailed += queueMetrics.failedRequests;
    }

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const score = healthScore?.overall || 100;

    if (score < 50 || healthStatus.status === 'unhealthy') {
      overall = 'unhealthy';
    } else if (score < 80 || healthStatus.status === 'degraded') {
      overall = 'degraded';
    }

    // Calculate success rate
    const totalRequests = this.metrics.successes + this.metrics.failures;
    const successRate = totalRequests > 0 ? (this.metrics.successes / totalRequests) * 100 : 100;

    return {
      overall,
      score,
      components: {
        retries: {
          active: retryManager.getStats().activeRetries,
          failed: this.metrics.failures,
          successRate
        },
        circuitBreakers: {
          total: Object.keys(cbMetrics).length,
          open: circuitBreakerRegistry.getUnhealthyCount(),
          healthy: circuitBreakerRegistry.getHealthyCount()
        },
        healthChecks: {
          passing: healthStatus.details?.passed || 0,
          failing: healthStatus.details?.failed || 0,
          warnings: healthStatus.details?.warnings || 0
        },
        requestQueues: {
          pending: totalPending,
          processing: totalProcessing,
          completed: totalCompleted,
          failed: totalFailed
        },
        errors: {
          total: errorMetrics.totalErrors,
          critical: errorMetrics.errorsBySeverity.critical,
          rate: errorMetrics.errorRate
        }
      },
      alerts: this.healthMonitor.getAlerts('open'),
      lastUpdated: new Date().toISOString()
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: this.isStarted ? Date.now() - (this as any).startTime : 0,
      systemStatus: this.getSystemStatus()
    };
  }

  // Recovery actions
  async attemptRecovery(): Promise<void> {
    console.log('Initiating automatic recovery...');

    // Reset circuit breakers
    for (const [name, cb] of circuitBreakerRegistry.getAll()) {
      if (!cb.isHealthy()) {
        console.log(`Resetting circuit breaker: ${name}`);
        cb.reset();
      }
    }

    // Clear request queues that might be stuck
    for (const [name, queue] of this.requestQueues) {
      if (queue.getQueueLength() > 1000) {
        console.log(`Clearing stuck queue: ${name}`);
        queue.clear();
      }
    }

    // Clear old error history if too large
    const errorMetrics = this.errorAnalyzer.getMetrics();
    if (errorMetrics.totalErrors > 10000) {
      console.log('Clearing old error history');
      this.errorAnalyzer.clearHistory();
    }

    this.emit('recoveryAttempted');
  }

  // Configuration updates
  updateConfig(updates: Partial<ReliabilityConfig>): void {
    Object.assign(this.config, updates);
    this.emit('configUpdated', updates);
  }

  getConfig(): ReliabilityConfig {
    return { ...this.config };
  }
}

// Create singleton instance with default configuration
export const defaultConfig: ReliabilityConfig = {
  retry: {
    enabled: true,
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    timeout: 60000
  },
  healthMonitor: {
    enabled: true,
    checkInterval: 30000,
    alerting: true
  },
  requestQueue: {
    enabled: true,
    concurrency: 5,
    maxSize: 1000
  },
  errorAnalyzer: {
    enabled: true,
    enableLearning: true
  }
};

export const reliabilityManager = new ReliabilityManager(defaultConfig);

// Export convenience functions
export function withReliability<T>(
  operation: () => Promise<T>,
  options?: Parameters<typeof reliabilityManager.executeWithReliability>[1]
): Promise<T> {
  return reliabilityManager.executeWithReliability(operation, options);
}

// Auto-start the manager
if (typeof window === 'undefined') {
  // Node.js environment - start immediately
  reliabilityManager.start().catch(console.error);
} else {
  // Browser environment - start on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      reliabilityManager.start().catch(console.error);
    });
  } else {
    reliabilityManager.start().catch(console.error);
  }
}
