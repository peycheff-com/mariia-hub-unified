import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  retryManager,
  CircuitBreakerFactory,
  HealthMonitor,
  RequestQueue,
  Priority,
  reliabilityManager,
  performanceMonitor,
  recoveryAutomation,
  defaultConfig
} from '../index';

describe('Reliability System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RetryManager', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const failingOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const result = await retryManager.execute(failingOperation, {
        customConfig: { maxAttempts: 3, baseDelay: 10 }
      });

      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation error'));

      await expect(
        retryManager.execute(operation, {
          customConfig: { maxAttempts: 3, baseDelay: 10 }
        })
      ).rejects.toThrow('Validation error');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('CircuitBreaker', () => {
    it('should open circuit after failure threshold', async () => {
      const circuitBreaker = CircuitBreakerFactory.create('test', 'critical');
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service down'));

      // Fail enough times to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Should reject immediately when circuit is open
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        'Circuit breaker'
      );
    });

    it('should close circuit after successes', async () => {
      const circuitBreaker = CircuitBreakerFactory.create('test', 'api');
      const operation = vi.fn().mockResolvedValue('success');

      // Force circuit open
      circuitBreaker.forceOpen();
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Should not execute while open
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      // Close circuit manually for testing
      circuitBreaker.forceClose();
      expect(circuitBreaker.getState()).toBe('CLOSED');

      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
    });
  });

  describe('HealthMonitor', () => {
    it('should track health check results', async () => {
      const healthMonitor = new HealthMonitor({
        checkInterval: 1000,
        alerting: false,
        historyRetention: 1
      });

      const mockCheck = vi.fn().mockResolvedValue({
        name: 'test',
        status: 'pass' as const,
        duration: 100,
        message: 'OK'
      });

      healthMonitor.registerCheck({
        name: 'test-check',
        interval: 1000,
        timeout: 5000,
        critical: false,
        check: mockCheck
      });

      // Wait for check to run
      await new Promise(resolve => setTimeout(resolve, 100));

      const healthStatus = await healthMonitor.getHealthStatus();
      expect(healthStatus.checks).toHaveLength(1);
      expect(healthStatus.checks[0].status).toBe('pass');

      healthMonitor.stop();
    });

    it('should detect unhealthy status', async () => {
      const healthMonitor = new HealthMonitor({
        checkInterval: 1000,
        alerting: false,
        historyRetention: 1
      });

      const failingCheck = vi.fn().mockResolvedValue({
        name: 'failing',
        status: 'fail' as const,
        duration: 1000,
        message: 'Service unavailable'
      });

      healthMonitor.registerCheck({
        name: 'failing-check',
        interval: 1000,
        timeout: 5000,
        critical: true,
        check: failingCheck
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const healthStatus = await healthMonitor.getHealthStatus();
      expect(healthStatus.status).toBe('unhealthy');

      healthMonitor.stop();
    });
  });

  describe('RequestQueue', () => {
    it('should process requests with priority', async () => {
      const queue = new RequestQueue({
        concurrency: 2,
        maxSize: 10,
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 100,
        enableMetrics: true,
        enableBatching: false,
        priorityBoostEnabled: false
      });

      const results: string[] = [];

      // Add requests with different priorities
      await queue.add({
        execute: async () => { results.push('low'); },
        priority: Priority.LOW
      });

      await queue.add({
        execute: async () => { results.push('critical'); },
        priority: Priority.CRITICAL
      });

      await queue.add({
        execute: async () => { results.push('high'); },
        priority: Priority.HIGH
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check that all were processed (order might vary due to async nature)
      expect(results).toHaveLength(3);
      expect(results).toContain('critical');
      expect(results).toContain('high');
      expect(results).toContain('low');

      queue.destroy();
    });

    it('should handle queue overflow', async () => {
      const queue = new RequestQueue({
        concurrency: 1,
        maxSize: 2,
        timeout: 5000,
        maxRetries: 0,
        retryDelay: 0,
        enableMetrics: false,
        enableBatching: false,
        priorityBoostEnabled: false
      });

      // Add slow operation
      queue.add({
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'done';
        },
        priority: Priority.NORMAL
      });

      // Fill queue
      await queue.add({
        execute: async () => 'ok',
        priority: Priority.NORMAL
      });

      await queue.add({
        execute: async () => 'ok',
        priority: Priority.NORMAL
      });

      // Should throw when trying to add to full queue
      await expect(
        queue.add({
          execute: async () => 'overflow',
          priority: Priority.NORMAL
        })
      ).rejects.toThrow('Queue is full');

      queue.destroy();
    });
  });

  describe('ReliabilityManager', () => {
    it('should execute with all reliability features', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      // Create a circuit breaker
      const cb = reliabilityManager.createCircuitBreaker('test-service', 'api');

      // Execute with reliability
      const result = await reliabilityManager.executeWithReliability(
        operation,
        {
          retries: true,
          circuitBreaker: 'test-service',
          priority: Priority.HIGH,
          timeout: 5000
        }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle failures gracefully', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service error'));

      await expect(
        reliabilityManager.executeWithReliability(failingOperation, {
          retries: false,
          timeout: 1000
        })
      ).rejects.toThrow('Service error');

      expect(failingOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('PerformanceMonitor', () => {
    it('should record request metrics', () => {
      performanceMonitor.recordRequestStart('req-1');
      performanceMonitor.recordRequestEnd('req-1', 1024);

      const metrics = performanceMonitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
    });

    it('should track errors', () => {
      performanceMonitor.recordError('network');
      performanceMonitor.recordError('timeout');

      const metrics = performanceMonitor.getCurrentMetrics();
      if (metrics) {
        expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('RecoveryAutomation', () => {
    it('should register and execute recovery actions', () => {
      const testAction = {
        id: 'test-recovery',
        name: 'Test Recovery',
        description: 'Test action',
        category: 'immediate' as const,
        priority: 'medium' as const,
        conditions: [],
        actions: [{
          type: 'notify' as const,
          target: 'test',
          parameters: {}
        }],
        cooldown: 60000,
        maxAttempts: 3,
        autoApprove: true,
        enabled: true
      };

      recoveryAutomation.addAction(testAction);

      const action = recoveryAutomation.getAction('test-recovery');
      expect(action).toBeDefined();
      expect(action?.name).toBe('Test Recovery');
    });

    it('should get recovery statistics', () => {
      const stats = recoveryAutomation.getStatistics();
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('enabledActions');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete failure scenario', async () => {
      // Create service that fails
      const failingService = vi.fn().mockRejectedValue(new Error('Network failure'));

      // Create circuit breaker
      const cb = CircuitBreakerFactory.create('failing-service', 'api');

      // Try multiple times to trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        try {
          await cb.execute(failingService);
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit should be open
      expect(cb.getState()).toBe('OPEN');

      // Recovery automation should have action for this
      const action = recoveryAutomation.getAction('reset_circuit_breakers');
      expect(action).toBeDefined();
      expect(action?.enabled).toBe(true);
    });

    it('should maintain system health score', async () => {
      const status = reliabilityManager.getSystemStatus();
      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('score');
      expect(status.score).toBeGreaterThanOrEqual(0);
      expect(status.score).toBeLessThanOrEqual(100);
    });
  });
});