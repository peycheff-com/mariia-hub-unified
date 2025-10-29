import { supabase } from '@/integrations/supabase/client';

import { HealthCheckResult, DependencyHealth } from './types';
import { healthChecker } from './health-checker';
import { dependencyMonitor } from './dependency-monitor';

interface RecoveryAction {
  id: string;
  name: string;
  condition: string;
  action: () => Promise<boolean>;
  cooldown: number; // milliseconds
  maxAttempts: number;
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
}

interface RecoveryAttempt {
  actionId: string;
  timestamp: string;
  success: boolean;
  error?: string;
  duration: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class AutomatedRecovery {
  private client = supabase;
  private actions: Map<string, RecoveryAction> = new Map();
  private attempts: Map<string, RecoveryAttempt[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private running = false;

  constructor() {
    this.initializeRecoveryActions();
  }

  private initializeRecoveryActions() {
    // Database recovery actions
    this.addAction({
      id: 'database-reconnect',
      name: 'Reconnect to database',
      condition: 'database.status === "fail"',
      action: async () => {
        // Attempt to reconnect to database
        try {
          const { data, error } = await this.client
            .rpc('force_reconnect');

          return !error;
        } catch {
          return false;
        }
      },
      cooldown: 30000, // 30 seconds
      maxAttempts: 3,
      severity: 'high',
      enabled: true
    });

    // Cache recovery
    this.addAction({
      id: 'cache-clear',
      name: 'Clear and reset cache',
      condition: 'cache.status === "fail"',
      action: async () => {
        try {
          // Clear cache entries
          await this.client.rpc('clear_all_cache');
          return true;
        } catch {
          return false;
        }
      },
      cooldown: 60000, // 1 minute
      maxAttempts: 5,
      severity: 'medium',
      enabled: true
    });

    // Memory recovery
    this.addAction({
      id: 'memory-gc',
      name: 'Force garbage collection',
      condition: 'memory.status === "fail" && memory.details.usagePercent > 90',
      action: async () => {
        try {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            return true;
          }

          // Alternative: clear caches
          if (caches) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }

          return true;
        } catch {
          return false;
        }
      },
      cooldown: 10000, // 10 seconds
      maxAttempts: 10,
      severity: 'medium',
      enabled: true
    });

    // Stripe API recovery
    this.addAction({
      id: 'stripe-reconnect',
      name: 'Reconnect to Stripe',
      condition: 'dep_stripe.status === "unhealthy"',
      action: async () => {
        try {
          // Test Stripe connectivity
          const response = await fetch('https://api.stripe.com/v1', {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      cooldown: 60000, // 1 minute
      maxAttempts: 3,
      severity: 'high',
      enabled: true
    });

    // Service restart simulation (for non-critical services)
    this.addAction({
      id: 'booksy-reset',
      name: 'Reset Booksy integration',
      condition: 'dep_booksy.status === "unhealthy" && timeSinceFailure > 300000',
      action: async () => {
        try {
          // Reset Booksy connection state
          await this.client
            .from('integration_settings')
            .update({
              status: 'reset',
              last_reset: new Date().toISOString()
            })
            .eq('service', 'booksy');

          return true;
        } catch {
          return false;
        }
      },
      cooldown: 300000, // 5 minutes
      maxAttempts: 2,
      severity: 'low',
      enabled: true
    });

    // Queue recovery
    this.addAction({
      id: 'queue-drain',
      name: 'Drain failed queue items',
      condition: 'queue.status === "fail"',
      action: async () => {
        try {
          // Move failed items to dead letter queue
          await this.client.rpc('drain_failed_queue_items');
          return true;
        } catch {
          return false;
        }
      },
      cooldown: 120000, // 2 minutes
      maxAttempts: 3,
      severity: 'medium',
      enabled: true
    });
  }

  addAction(action: RecoveryAction) {
    this.actions.set(action.id, action);
    this.circuitBreakers.set(action.id, {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    });
  }

  async runRecovery(): Promise<RecoveryAttempt[]> {
    if (this.running) {
      return [];
    }

    this.running = true;
    const attempts: RecoveryAttempt[] = [];

    try {
      // Get current health status
      const [healthResult, dependencies] = await Promise.all([
        healthChecker.runHealthChecks(),
        dependencyMonitor.checkAllDependencies()
      ]);

      // Create context for condition evaluation
      const context = {
        database: healthResult.checks.find(c => c.name === 'database'),
        cache: healthResult.checks.find(c => c.name === 'cache'),
        memory: healthResult.checks.find(c => c.name === 'memory'),
        dep_stripe: dependencies.find(d => d.name === 'stripe'),
        dep_booksy: dependencies.find(d => d.name === 'booksy'),
        dep_queue: dependencies.find(d => d.name === 'queue')
      };

      // Check each recovery action
      for (const [actionId, action] of this.actions) {
        if (!action.enabled) continue;

        // Check if action is in cooldown
        if (this.isInCooldown(actionId)) continue;

        // Check circuit breaker
        if (this.isCircuitBreakerOpen(actionId)) continue;

        // Evaluate condition
        if (this.evaluateCondition(action.condition, context)) {
          const attempt = await this.executeAction(action);
          attempts.push(attempt);
        }
      }

    } catch (error) {
      console.error('Error in automated recovery:', error);
    } finally {
      this.running = false;
    }

    return attempts;
  }

  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // Simple condition evaluation (consider using a proper expression parser)
      // This is a simplified version - in production, use a safer evaluation method

      // Replace context variables with actual values
      const evalCondition = condition;

      // Check status conditions
      if (condition.includes('database.status === "fail"')) {
        return context.database?.status === 'fail';
      }
      if (condition.includes('cache.status === "fail"')) {
        return context.cache?.status === 'fail';
      }
      if (condition.includes('dep_stripe.status === "unhealthy"')) {
        return context.dep_stripe?.status === 'unhealthy';
      }
      if (condition.includes('dep_booksy.status === "unhealthy"')) {
        return context.dep_booksy?.status === 'unhealthy';
      }

      // Check memory usage
      if (condition.includes('memory.status === "fail"')) {
        return context.memory?.status === 'fail';
      }
      if (condition.includes('memory.details.usagePercent > 90')) {
        return context.memory?.details?.usagePercent > 90;
      }

      // Time-based conditions
      if (condition.includes('timeSinceFailure > 300000')) {
        // This would need proper time tracking
        return false; // Simplified for now
      }

      return false;
    } catch {
      return false;
    }
  }

  private async executeAction(action: RecoveryAction): Promise<RecoveryAttempt> {
    const start = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      console.log(`Executing recovery action: ${action.name}`);
      success = await action.action();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      success = false;
    }

    const attempt: RecoveryAttempt = {
      actionId: action.id,
      timestamp: new Date().toISOString(),
      success,
      error,
      duration: Date.now() - start
    };

    // Record attempt
    this.recordAttempt(attempt);

    // Update circuit breaker
    this.updateCircuitBreaker(action.id, success);

    // Log to database
    await this.logRecoveryAttempt(attempt, action);

    return attempt;
  }

  private isInCooldown(actionId: string): boolean {
    const attempts = this.attempts.get(actionId) || [];
    const action = this.actions.get(actionId);
    if (!action || attempts.length === 0) return false;

    const lastAttempt = attempts[attempts.length - 1];
    const timeSinceLastAttempt = Date.now() - new Date(lastAttempt.timestamp).getTime();
    return timeSinceLastAttempt < action.cooldown;
  }

  private isCircuitBreakerOpen(actionId: string): boolean {
    const cb = this.circuitBreakers.get(actionId);
    if (!cb) return false;

    const now = Date.now();

    if (cb.state === 'open') {
      if (now >= cb.nextAttemptTime) {
        cb.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  private updateCircuitBreaker(actionId: string, success: boolean) {
    const cb = this.circuitBreakers.get(actionId);
    if (!cb) return;

    const action = this.actions.get(actionId);
    if (!action) return;

    if (success) {
      // Reset circuit breaker on success
      cb.state = 'closed';
      cb.failures = 0;
    } else {
      // Increment failures
      cb.failures++;
      cb.lastFailureTime = Date.now();

      // Check if we should open the circuit breaker
      if (cb.failures >= action.maxAttempts) {
        cb.state = 'open';
        cb.nextAttemptTime = Date.now() + (action.cooldown * 2);
      }
    }
  }

  private recordAttempt(attempt: RecoveryAttempt) {
    const attempts = this.attempts.get(attempt.actionId) || [];
    attempts.push(attempt);

    // Keep only last 100 attempts
    if (attempts.length > 100) {
      attempts.splice(0, attempts.length - 100);
    }

    this.attempts.set(attempt.actionId, attempts);
  }

  private async logRecoveryAttempt(attempt: RecoveryAttempt, action: RecoveryAction) {
    try {
      await this.client
        .from('recovery_attempts')
        .insert({
          action_id: attempt.actionId,
          action_name: action.name,
          success: attempt.success,
          error: attempt.error,
          duration: attempt.duration,
          timestamp: attempt.timestamp,
          severity: action.severity
        });
    } catch (error) {
      console.error('Failed to log recovery attempt:', error);
    }
  }

  getAttempts(actionId?: string): RecoveryAttempt[] {
    if (actionId) {
      return this.attempts.get(actionId) || [];
    }

    const allAttempts: RecoveryAttempt[] = [];
    this.attempts.forEach(attempts => {
      allAttempts.push(...attempts);
    });

    return allAttempts.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getCircuitBreakerStatus(actionId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(actionId);
  }

  enableAction(actionId: string) {
    const action = this.actions.get(actionId);
    if (action) {
      action.enabled = true;
    }
  }

  disableAction(actionId: string) {
    const action = this.actions.get(actionId);
    if (action) {
      action.enabled = false;
    }
  }

  async getRecoveryStats(hours: number = 24): Promise<{
    totalAttempts: number;
    successRate: number;
    mostTriggered: string;
    mostFailed: string;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const allAttempts = this.getAttempts()
      .filter(a => new Date(a.timestamp) > since);

    const totalAttempts = allAttempts.length;
    const successRate = totalAttempts > 0
      ? (allAttempts.filter(a => a.success).length / totalAttempts) * 100
      : 100;

    // Count attempts by action
    const actionCounts: Record<string, { total: number; failed: number }> = {};
    allAttempts.forEach(attempt => {
      if (!actionCounts[attempt.actionId]) {
        actionCounts[attempt.actionId] = { total: 0, failed: 0 };
      }
      actionCounts[attempt.actionId].total++;
      if (!attempt.success) {
        actionCounts[attempt.actionId].failed++;
      }
    });

    const mostTriggered = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b.total - a.total)[0]?.[0] || '';

    const mostFailed = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b.failed - a.failed)[0]?.[0] || '';

    return {
      totalAttempts,
      successRate,
      mostTriggered,
      mostFailed
    };
  }
}

export const automatedRecovery = new AutomatedRecovery();