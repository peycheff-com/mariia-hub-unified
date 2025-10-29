import { supabase } from '@/integrations/supabase/client';

import { DependencyHealth } from './types';

interface DependencyConfig {
  name: string;
  type: 'database' | 'api' | 'cache' | 'queue' | 'external';
  endpoint?: string;
  timeout: number;
  critical: boolean;
  checkInterval: number; // milliseconds
}

interface DependencyMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastFailure: string | null;
  uptime: number; // percentage
  lastUpdated: string;
}

export class DependencyMonitor {
  private supabase = createClient();
  private dependencies: Map<string, DependencyConfig> = new Map();
  private metrics: Map<string, DependencyMetrics> = new Map();
  private monitoring: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDependencies();
  }

  private initializeDependencies() {
    // Database dependency
    this.addDependency({
      name: 'supabase',
      type: 'database',
      timeout: 5000,
      critical: true,
      checkInterval: 30000 // 30 seconds
    });

    // Payment gateway
    this.addDependency({
      name: 'stripe',
      type: 'api',
      endpoint: 'https://api.stripe.com/v1',
      timeout: 10000,
      critical: true,
      checkInterval: 60000 // 1 minute
    });

    // Booking system
    this.addDependency({
      name: 'booksy',
      type: 'external',
      endpoint: 'https://api.booksy.com',
      timeout: 10000,
      critical: false,
      checkInterval: 120000 // 2 minutes
    });

    // Analytics service
    this.addDependency({
      name: 'google-analytics',
      type: 'external',
      endpoint: 'https://www.google-analytics.com',
      timeout: 5000,
      critical: false,
      checkInterval: 300000 // 5 minutes
    });

    // CDN (for assets)
    this.addDependency({
      name: 'cdn',
      type: 'external',
      endpoint: 'https://cdn.your-domain.com',
      timeout: 5000,
      critical: false,
      checkInterval: 60000 // 1 minute
    });
  }

  addDependency(config: DependencyConfig) {
    this.dependencies.set(config.name, config);
    this.metrics.set(config.name, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastFailure: null,
      uptime: 100,
      lastUpdated: new Date().toISOString()
    });
  }

  async checkDependency(name: string): Promise<DependencyHealth> {
    const config = this.dependencies.get(name);
    if (!config) {
      throw new Error(`Dependency ${name} not found`);
    }

    const start = Date.now();
    const metrics = this.metrics.get(name)!;

    try {
      metrics.totalRequests++;

      let health: DependencyHealth;

      switch (config.type) {
        case 'database':
          health = await this.checkDatabase(name, config);
          break;
        case 'api':
        case 'external':
          health = await this.checkApi(name, config);
          break;
        case 'cache':
          health = await this.checkCache(name, config);
          break;
        case 'queue':
          health = await this.checkQueue(name, config);
          break;
        default:
          health = await this.checkGeneric(name, config);
      }

      const duration = Date.now() - start;
      health.responseTime = duration;
      health.lastChecked = new Date().toISOString();

      // Update metrics
      if (health.status === 'healthy') {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
        metrics.lastFailure = new Date().toISOString();
      }

      // Calculate average response time
      metrics.averageResponseTime =
        ((metrics.averageResponseTime * (metrics.totalRequests - 1)) + duration) / metrics.totalRequests;

      // Calculate uptime
      metrics.uptime = (metrics.successfulRequests / metrics.totalRequests) * 100;
      metrics.lastUpdated = new Date().toISOString();

      // Store metrics in database for historical tracking
      await this.storeMetrics(name, metrics);

      return health;

    } catch (error) {
      metrics.failedRequests++;
      metrics.lastFailure = new Date().toISOString();
      metrics.averageResponseTime = Date.now() - start;
      metrics.uptime = (metrics.successfulRequests / metrics.totalRequests) * 100;
      metrics.lastUpdated = new Date().toISOString();

      await this.storeMetrics(name, metrics);

      return {
        name,
        type: config.type,
        status: config.critical ? 'unhealthy' : 'degraded',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkDatabase(name: string, config: DependencyConfig): Promise<DependencyHealth> {
    try {
      const { data, error } = await this.supabase
        .rpc('health_check', { service_name: name })
        .single();

      if (error) throw error;

      return {
        name,
        type: 'database',
        status: data?.healthy ? 'healthy' : 'degraded',
        details: data
      } as DependencyHealth;
    } catch (error) {
      return {
        name,
        type: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkApi(name: string, config: DependencyHealth): Promise<DependencyHealth> {
    const response = await fetch(config.endpoint!, {
      method: 'HEAD',
      signal: AbortSignal.timeout(config.timeout)
    });

    if (response.status >= 200 && response.status < 400) {
      return {
        name,
        type: config.type,
        status: 'healthy'
      };
    } else if (response.status >= 400 && response.status < 500) {
      return {
        name,
        type: config.type,
        status: 'degraded',
        error: `HTTP ${response.status}`
      };
    } else {
      return {
        name,
        type: config.type,
        status: 'unhealthy',
        error: `HTTP ${response.status}`
      };
    }
  }

  private async checkCache(name: string, config: DependencyConfig): Promise<DependencyHealth> {
    // Implement cache-specific health check
    // This would integrate with your cache implementation (Redis, etc.)
    try {
      // Simulate cache check
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        name,
        type: 'cache',
        status: 'healthy'
      };
    } catch (error) {
      return {
        name,
        type: 'cache',
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Cache unavailable'
      };
    }
  }

  private async checkQueue(name: string, config: DependencyConfig): Promise<DependencyHealth> {
    // Implement queue-specific health check
    // This would integrate with your queue system
    try {
      // Simulate queue check
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        name,
        type: 'queue',
        status: 'healthy'
      };
    } catch (error) {
      return {
        name,
        type: 'queue',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Queue unavailable'
      };
    }
  }

  private async checkGeneric(name: string, config: DependencyConfig): Promise<DependencyHealth> {
    if (!config.endpoint) {
      return {
        name,
        type: config.type,
        status: 'healthy',
        lastChecked: new Date().toISOString()
      };
    }

    return this.checkApi(name, config as DependencyHealth);
  }

  private async storeMetrics(name: string, metrics: DependencyMetrics) {
    try {
      await this.supabase
        .from('dependency_metrics')
        .upsert({
          dependency_name: name,
          metrics,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store dependency metrics:', error);
    }
  }

  async checkAllDependencies(): Promise<DependencyHealth[]> {
    const checks = Array.from(this.dependencies.keys()).map(name =>
      this.checkDependency(name)
    );

    return Promise.allSettled(checks).then(results =>
      results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    );
  }

  getMetrics(name: string): DependencyMetrics | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, DependencyMetrics> {
    const result: Record<string, DependencyMetrics> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  startMonitoring(name?: string) {
    const depsToMonitor = name ? [name] : Array.from(this.dependencies.keys());

    depsToMonitor.forEach(depName => {
      const config = this.dependencies.get(depName);
      if (!config) return;

      // Clear existing timer
      if (this.monitoring.has(depName)) {
        clearInterval(this.monitoring.get(depName)!);
      }

      // Start new timer
      const timer = setInterval(() => {
        this.checkDependency(depName).catch(error => {
          console.error(`Error monitoring dependency ${depName}:`, error);
        });
      }, config.checkInterval);

      this.monitoring.set(depName, timer);
    });
  }

  stopMonitoring(name?: string) {
    const depsToStop = name ? [name] : Array.from(this.monitoring.keys());

    depsToStop.forEach(depName => {
      const timer = this.monitoring.get(depName);
      if (timer) {
        clearInterval(timer);
        this.monitoring.delete(depName);
      }
    });
  }

  getCriticalDependencies(): string[] {
    return Array.from(this.dependencies.entries())
      .filter(([_, config]) => config.critical)
      .map(([name, _]) => name);
  }

  async getHistoricalMetrics(name: string, hours: number = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('dependency_metrics')
        .select('*')
        .eq('dependency_name', name)
        .gte('timestamp', since)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch historical metrics:', error);
      return [];
    }
  }
}

export const dependencyMonitor = new DependencyMonitor();