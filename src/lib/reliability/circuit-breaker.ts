import { EventEmitter } from 'events';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds to wait before transitioning from OPEN to HALF_OPEN
  monitoringPeriod: number; // milliseconds
  resetTimeout: number; // milliseconds to fully reset after success
  enabled: boolean;
  metrics?: boolean;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  currentFailureCount: number;
  currentSuccessCount: number;
  stateChanges: number;
  averageResponseTime: number;
  lastStateChange: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private metrics: CircuitBreakerMetrics;
  private responseTimes: number[] = [];
  private stateChanges = 0;
  private lastStateChange = Date.now();

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig
  ) {
    super();
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      currentFailureCount: 0,
      currentSuccessCount: 0,
      stateChanges: 0,
      averageResponseTime: 0,
      lastStateChange: new Date().toISOString()
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    if (!this.canExecute()) {
      const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
      this.emit('rejected', error);
      throw error;
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordSuccess(duration);
      this.emit('success', result, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure();
      this.emit('failure', error, duration);
      throw error;
    }
  }

  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= this.nextAttempt) {
          this.transitionTo('HALF_OPEN');
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }

  private recordSuccess(duration: number): void {
    this.totalSuccesses++;
    this.metrics.totalSuccesses++;
    this.updateResponseTime(duration);

    const now = Date.now();

    switch (this.state) {
      case 'HALF_OPEN':
        this.successCount++;
        this.metrics.currentSuccessCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transitionTo('CLOSED');
        }
        break;

      case 'CLOSED':
        // Gradually reduce failure count on success
        const recentFailures = this.getRecentFailures(now);
        if (recentFailures === 0) {
          this.failureCount = Math.max(0, this.failureCount - 1);
          this.metrics.currentFailureCount = this.failureCount;
        }
        break;
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureCount++;
    this.metrics.totalFailures++;
    this.metrics.currentFailureCount = this.failureCount;

    switch (this.state) {
      case 'HALF_OPEN':
        this.transitionTo('OPEN');
        break;

      case 'CLOSED':
        if (this.failureCount >= this.config.failureThreshold) {
          this.transitionTo('OPEN');
        }
        break;
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.stateChanges++;
    this.metrics.stateChanges = this.stateChanges;
    this.lastStateChange = Date.now();
    this.metrics.lastStateChange = new Date().toISOString();

    // Reset counters on state change
    switch (newState) {
      case 'CLOSED':
        this.failureCount = 0;
        this.successCount = 0;
        this.metrics.currentFailureCount = 0;
        this.metrics.currentSuccessCount = 0;
        break;

      case 'OPEN':
        this.nextAttempt = Date.now() + this.config.timeout;
        this.successCount = 0;
        this.metrics.currentSuccessCount = 0;
        break;

      case 'HALF_OPEN':
        this.successCount = 0;
        this.metrics.currentSuccessCount = 0;
        break;
    }

    console.warn(`Circuit breaker '${this.name}' transitioned from ${oldState} to ${newState}`);
    this.emit('stateChange', { from: oldState, to: newState });
  }

  private updateResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private getRecentFailures(now: number): number {
    if (now - this.lastFailureTime > this.config.monitoringPeriod) {
      return 0;
    }
    return this.failureCount;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      ...this.metrics,
      totalRequests: this.metrics.totalRequests,
      totalFailures: this.metrics.totalFailures,
      totalSuccesses: this.metrics.totalSuccesses,
      currentFailureCount: this.failureCount,
      currentSuccessCount: this.successCount,
      stateChanges: this.stateChanges,
      averageResponseTime: this.metrics.averageResponseTime,
      lastStateChange: this.metrics.lastStateChange
    };
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    this.stateChanges++;
    this.lastStateChange = Date.now();
    this.responseTimes = [];

    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      currentFailureCount: 0,
      currentSuccessCount: 0,
      stateChanges: this.stateChanges,
      averageResponseTime: 0,
      lastStateChange: new Date().toISOString()
    };

    this.emit('reset');
  }

  forceOpen(): void {
    this.transitionTo('OPEN');
  }

  forceClose(): void {
    this.transitionTo('CLOSED');
  }

  isHealthy(): boolean {
    return this.state !== 'OPEN';
  }

  getFailureRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return this.metrics.totalFailures / this.metrics.totalRequests;
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return this.metrics.totalSuccesses / this.metrics.totalRequests;
  }

  timeToNextAttempt(): number {
    if (this.state !== 'OPEN') return 0;
    return Math.max(0, this.nextAttempt - Date.now());
  }
}

// Factory for creating circuit breakers with default configurations
export class CircuitBreakerFactory {
  private static readonly defaultConfigs = {
    api: {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000,
      monitoringPeriod: 300000,
      resetTimeout: 120000,
      enabled: true,
      metrics: true
    },
    database: {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
      monitoringPeriod: 180000,
      resetTimeout: 60000,
      enabled: true,
      metrics: true
    },
    external: {
      failureThreshold: 10,
      successThreshold: 5,
      timeout: 120000,
      monitoringPeriod: 600000,
      resetTimeout: 300000,
      enabled: true,
      metrics: true
    },
    critical: {
      failureThreshold: 2,
      successThreshold: 1,
      timeout: 15000,
      monitoringPeriod: 60000,
      resetTimeout: 30000,
      enabled: true,
      metrics: true
    }
  };

  static create(
    name: string,
    type: keyof typeof CircuitBreakerFactory.defaultConfigs,
    customConfig?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const config = {
      ...this.defaultConfigs[type],
      ...customConfig
    };

    return new CircuitBreaker(name, config);
  }

  static createCustom(
    name: string,
    config: CircuitBreakerConfig
  ): CircuitBreaker {
    return new CircuitBreaker(name, config);
  }
}

// Registry for managing multiple circuit breakers
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  register(circuitBreaker: CircuitBreaker): void {
    this.circuitBreakers.set(circuitBreaker['name'], circuitBreaker);
  }

  get(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, cb] of this.circuitBreakers) {
      metrics[name] = cb.getMetrics();
    }
    return metrics;
  }

  getHealthyCount(): number {
    let count = 0;
    for (const cb of this.circuitBreakers.values()) {
      if (cb.isHealthy()) count++;
    }
    return count;
  }

  getUnhealthyCount(): number {
    return this.circuitBreakers.size - this.getHealthyCount();
  }

  resetAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }

  forceOpenAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.forceOpen();
    }
  }

  forceCloseAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.forceClose();
    }
  }
}

// Export singleton registry
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();