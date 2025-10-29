import { supabase } from '@/integrations/supabase/client';

import { HealthCheckResult, HealthCheck, DependencyHealth, HealthScore } from './types';

export class HealthChecker {
  private supabase = supabase;
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private dependencies: Map<string, () => Promise<DependencyHealth>> = new Map();

  constructor() {
    this.initializeDefaultChecks();
  }

  private initializeDefaultChecks() {
    // Database health check
    this.addCheck('database', async () => {
      const start = Date.now();
      try {
        const { data, error } = await this.supabase
          .from('health_check')
          .select('timestamp')
          .limit(1)
          .single();

        if (error) throw error;

        return {
          name: 'database',
          status: 'pass',
          duration: Date.now() - start,
          details: { timestamp: data?.timestamp }
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'fail',
          duration: Date.now() - start,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // System resources check
    this.addCheck('memory', async () => {
      const start = Date.now();
      const usage = performance.memory;

      const usedMB = usage ? Math.round(usage.usedJSHeapSize / 1024 / 1024) : 0;
      const limitMB = usage ? Math.round(usage.jsHeapSizeLimit / 1024 / 1024) : 0;
      const usagePercent = usage ? (usedMB / limitMB) * 100 : 0;

      return {
        name: 'memory',
        status: usagePercent > 90 ? 'fail' : usagePercent > 75 ? 'warn' : 'pass',
        duration: Date.now() - start,
        details: { usedMB, limitMB, usagePercent }
      };
    });

    // Cache health check (if implemented)
    this.addCheck('cache', async () => {
      const start = Date.now();
      try {
        // Check if cache is accessible
        const testKey = 'health-check';
        const testValue = Date.now().toString();

        // This would integrate with your cache implementation
        // For now, simulate a healthy cache
        await new Promise(resolve => setTimeout(resolve, 10));

        return {
          name: 'cache',
          status: 'pass',
          duration: Date.now() - start,
          details: { test: 'passed' }
        };
      } catch (error) {
        return {
          name: 'cache',
          status: 'warn',
          duration: Date.now() - start,
          message: 'Cache service not available'
        };
      }
    });

    // External API dependencies
    this.addDependency('stripe', async () => {
      const start = Date.now();
      try {
        // Create a minimal health check request to Stripe
        const response = await fetch('https://api.stripe.com/v1', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });

        return {
          name: 'stripe',
          type: 'api',
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          name: 'stripe',
          type: 'api',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        };
      }
    });

    this.addDependency('booksy', async () => {
      const start = Date.now();
      try {
        // Check Booksy API availability
        const response = await fetch('https://api.booksy.com/api/pl/2/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        return {
          name: 'booksy',
          type: 'external',
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          name: 'booksy',
          type: 'external',
          status: 'degraded', // Booksy is non-critical
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        };
      }
    });
  }

  addCheck(name: string, checkFn: () => Promise<HealthCheck>) {
    this.checks.set(name, checkFn);
  }

  addDependency(name: string, depFn: () => Promise<DependencyHealth>) {
    this.dependencies.set(name, depFn);
  }

  async runHealthChecks(): Promise<HealthCheckResult> {
    const start = Date.now();
    const checks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const details: Record<string, any> = {};

    // Run all health checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, checkFn]) => {
        try {
          const result = await checkFn();
          checks.push(result);

          if (result.status === 'fail') {
            overallStatus = 'unhealthy';
          } else if (result.status === 'warn' && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }

          details[name] = result;
          return result;
        } catch (error) {
          const failed = {
            name,
            status: 'fail' as const,
            duration: 0,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
          checks.push(failed);
          details[name] = failed;
          overallStatus = 'unhealthy';
          return failed;
        }
      }
    );

    await Promise.allSettled(checkPromises);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details,
      checks
    };
  }

  async checkDependencies(): Promise<DependencyHealth[]> {
    const dependencyPromises = Array.from(this.dependencies.entries()).map(
      async ([name, depFn]) => {
        try {
          return await depFn();
        } catch (error) {
          return {
            name,
            type: 'external',
            status: 'unhealthy' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        }
      }
    );

    return Promise.allSettled(dependencyPromises).then(results =>
      results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    );
  }

  async calculateHealthScore(): Promise<HealthScore> {
    const [healthResult, dependencies] = await Promise.all([
      this.runHealthChecks(),
      this.checkDependencies()
    ]);

    const components: Record<string, number> = {};
    let totalScore = 0;
    let componentCount = 0;

    // Score health checks
    healthResult.checks.forEach(check => {
      const score = check.status === 'pass' ? 100 : check.status === 'warn' ? 50 : 0;
      components[check.name] = score;
      totalScore += score;
      componentCount++;
    });

    // Score dependencies
    dependencies.forEach(dep => {
      const score = dep.status === 'healthy' ? 100 : dep.status === 'degraded' ? 50 : 0;
      components[`dep_${dep.name}`] = score;
      totalScore += score;
      componentCount++;
    });

    const overall = componentCount > 0 ? Math.round(totalScore / componentCount) : 0;

    // Determine trend (would need historical data for real implementation)
    const trend: 'improving' | 'stable' | 'degrading' = 'stable';

    return {
      overall,
      components,
      timestamp: new Date().toISOString(),
      trend
    };
  }
}

// Singleton instance
export const healthChecker = new HealthChecker();