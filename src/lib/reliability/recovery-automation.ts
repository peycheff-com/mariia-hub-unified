import { EventEmitter } from 'events';

import { reliabilityManager } from './reliability-manager';
import { performanceMonitor } from './performance-monitor';
import { circuitBreakerRegistry } from './circuit-breaker';
import { Alert } from './types';

export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  category: 'immediate' | 'gradual' | 'manual';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: RecoveryCondition[];
  actions: RecoveryStep[];
  rollback?: RecoveryStep[];
  cooldown: number; // milliseconds before action can run again
  maxAttempts: number;
  autoApprove: boolean;
  enabled: boolean;
}

export interface RecoveryCondition {
  type: 'metric' | 'alert' | 'circuit_breaker' | 'health_check' | 'custom';
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'in' | 'contains';
  value: any;
  duration?: number; // milliseconds
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryStep {
  type: 'reset' | 'restart' | 'scale' | 'notify' | 'custom' | 'script' | 'api_call';
  target: string; // what to act on
  parameters: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

export interface RecoveryExecution {
  id: string;
  actionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startTime: string;
  endTime?: string;
  triggeredBy: string;
  steps: RecoveryStepExecution[];
  error?: string;
  metrics: {
    duration: number;
    success: boolean;
    impact: Record<string, any>;
  };
}

export interface RecoveryStepExecution {
  step: RecoveryStep;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
}

export interface RecoveryConfig {
  enabled: boolean;
  requireApproval: boolean;
  approvalThreshold: number; // minimum severity for approval
  dryRun: boolean; // simulate actions without executing
  logging: boolean;
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    recipients: string[];
  };
  limits: {
    maxConcurrentRecoveries: number;
    maxRecoveryAttempts: number;
    recoveryTimeWindow: number; // milliseconds
  };
}

export class RecoveryAutomation extends EventEmitter {
  private actions = new Map<string, RecoveryAction>();
  private executions = new Map<string, RecoveryExecution>();
  private executionHistory: RecoveryExecution[] = [];
  private cooldowns = new Map<string, number>();
  private running = false;

  constructor(private config: RecoveryConfig) {
    super();
    this.initializeDefaultActions();
    this.setupEventListeners();
  }

  private initializeDefaultActions(): void {
    // Circuit breaker reset
    this.addAction({
      id: 'reset_circuit_breakers',
      name: 'Reset Circuit Breakers',
      description: 'Reset all open circuit breakers to restore service',
      category: 'immediate',
      priority: 'high',
      conditions: [
        {
          type: 'circuit_breaker',
          field: 'state',
          operator: 'eq',
          value: 'open',
          severity: 'high'
        }
      ],
      actions: [
        {
          type: 'reset',
          target: 'circuit_breakers',
          parameters: {},
          timeout: 5000
        }
      ],
      cooldown: 60000, // 1 minute
      maxAttempts: 3,
      autoApprove: true,
      enabled: true
    });

    // Clear stuck request queues
    this.addAction({
      id: 'clear_stuck_queues',
      name: 'Clear Stuck Request Queues',
      description: 'Clear request queues that have exceeded size threshold',
      category: 'immediate',
      priority: 'medium',
      conditions: [
        {
          type: 'metric',
          field: 'queueLength',
          operator: 'gt',
          value: 1000
        }
      ],
      actions: [
        {
          type: 'custom',
          target: 'request_queues',
          parameters: {
            action: 'clear',
            threshold: 1000
          },
          timeout: 10000
        }
      ],
      cooldown: 300000, // 5 minutes
      maxAttempts: 2,
      autoApprove: true,
      enabled: true
    });

    // Restart failing services
    this.addAction({
      id: 'restart_service',
      name: 'Restart Failing Service',
      description: 'Restart service that has failed health checks',
      category: 'gradual',
      priority: 'critical',
      conditions: [
        {
          type: 'health_check',
          field: 'status',
          operator: 'eq',
          value: 'unhealthy',
          duration: 60000, // 1 minute
          severity: 'critical'
        }
      ],
      actions: [
        {
          type: 'restart',
          target: 'service',
          parameters: {
            graceful: true,
            timeout: 30000
          },
          timeout: 60000,
          retryAttempts: 2
        }
      ],
      cooldown: 300000, // 5 minutes
      maxAttempts: 3,
      autoApprove: false,
      enabled: true
    });

    // Scale resources
    this.addAction({
      id: 'scale_up_resources',
      name: 'Scale Up Resources',
      description: 'Increase resources when under high load',
      category: 'gradual',
      priority: 'medium',
      conditions: [
        {
          type: 'metric',
          field: 'cpu',
          operator: 'gt',
          value: 80
        },
        {
          type: 'metric',
          field: 'memory',
          operator: 'gt',
          value: 80
        }
      ],
      actions: [
        {
          type: 'scale',
          target: 'resources',
          parameters: {
            direction: 'up',
            percentage: 50
          },
          timeout: 120000
        }
      ],
      rollback: [
        {
          type: 'scale',
          target: 'resources',
          parameters: {
            direction: 'down',
            percentage: 50
          },
          timeout: 120000
        }
      ],
      cooldown: 600000, // 10 minutes
      maxAttempts: 5,
      autoApprove: true,
      enabled: true
    });

    // Send notification
    this.addAction({
      id: 'notify_critical_failure',
      name: 'Notify Critical Failure',
      description: 'Send notification for critical system failures',
      category: 'immediate',
      priority: 'critical',
      conditions: [
        {
          type: 'alert',
          field: 'severity',
          operator: 'eq',
          value: 'critical'
        }
      ],
      actions: [
        {
          type: 'notify',
          target: 'operators',
          parameters: {
            message: 'Critical system failure detected',
            channels: this.config.notifications.channels
          },
          timeout: 30000
        }
      ],
      cooldown: 300000, // 5 minutes
      maxAttempts: 1,
      autoApprove: true,
      enabled: true
    });
  }

  private setupEventListeners(): void {
    // Listen to reliability manager events
    reliabilityManager.on('alert', (alert: Alert) => {
      this.evaluateConditions('alert', alert);
    });

    reliabilityManager.on('statusUpdate', (status) => {
      this.evaluateConditions('status', status);
    });

    // Listen to performance monitor events
    performanceMonitor.on('alert', (alert) => {
      this.evaluateConditions('metric', alert);
    });

    // Listen to circuit breaker events
    circuitBreakerRegistry.getAll().forEach(cb => {
      cb.on('stateChange', ({ from, to }) => {
        if (to === 'OPEN') {
          this.evaluateConditions('circuit_breaker', {
            name: cb['name'],
            state: to,
            from
          });
        }
      });
    });
  }

  private async evaluateConditions(trigger: string, data: any): Promise<void> {
    if (!this.config.enabled || this.running) return;

    for (const action of this.actions.values()) {
      if (!action.enabled) continue;

      // Check cooldown
      if (this.isInCooldown(action.id)) continue;

      // Check if conditions are met
      if (await this.checkConditions(action.conditions, data, trigger)) {
        await this.executeAction(action, trigger, data);
      }
    }
  }

  private async checkConditions(
    conditions: RecoveryCondition[],
    data: any,
    trigger: string
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.checkCondition(condition, data, trigger)) {
        return false;
      }
    }
    return true;
  }

  private async checkCondition(
    condition: RecoveryCondition,
    data: any,
    trigger: string
  ): Promise<boolean> {
    // Skip if condition type doesn't match trigger
    if (condition.type === 'alert' && trigger !== 'alert') return false;
    if (condition.type === 'metric' && trigger !== 'metric') return false;
    if (condition.type === 'circuit_breaker' && trigger !== 'circuit_breaker') return false;

    let value: any;

    // Extract value based on condition type
    switch (condition.type) {
      case 'alert':
        value = data[condition.field];
        break;

      case 'metric':
        const metrics = performanceMonitor.getCurrentMetrics();
        value = metrics?.[condition.field as keyof typeof metrics];
        break;

      case 'circuit_breaker':
        value = data[condition.field];
        break;

      case 'health_check':
        const healthStatus = await reliabilityManager.getHealthStatus();
        value = healthStatus[condition.field];
        break;

      case 'custom':
        // Custom condition evaluation
        return this.evaluateCustomCondition(condition, data, trigger);

      default:
        return false;
    }

    // Check operator
    return this.compareValues(value, condition.operator, condition.value);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private evaluateCustomCondition(
    condition: RecoveryCondition,
    data: any,
    trigger: string
  ): boolean {
    // Custom logic for complex conditions
    // This could be extended with a rule engine
    return false;
  }

  private isInCooldown(actionId: string): boolean {
    const lastExecution = this.cooldowns.get(actionId);
    if (!lastExecution) return false;

    const action = this.actions.get(actionId);
    if (!action) return false;

    return (Date.now() - lastExecution) < action.cooldown;
  }

  private async executeAction(
    action: RecoveryAction,
    trigger: string,
    data: any
  ): Promise<void> {
    const executionId = this.generateExecutionId();

    // Check if approval is required
    if (!action.autoApprove && this.config.requireApproval) {
      const severity = this.getExecutionSeverity(action, data);
      if (severity >= this.config.approvalThreshold) {
        await this.requestApproval(action, executionId, trigger, data);
        return;
      }
    }

    const execution: RecoveryExecution = {
      id: executionId,
      actionId: action.id,
      status: 'pending',
      startTime: new Date().toISOString(),
      triggeredBy: trigger,
      steps: [],
      metrics: {
        duration: 0,
        success: false,
        impact: {}
      }
    };

    this.executions.set(executionId, execution);
    this.executionHistory.push(execution);

    try {
      this.running = true;
      execution.status = 'running';

      // Log execution start
      if (this.config.logging) {
        console.log(`[Recovery] Executing action: ${action.name}`, {
          executionId,
          trigger,
          action
        });
      }

      // Execute steps
      for (const step of action.actions) {
        const stepExecution: RecoveryStepExecution = {
          step,
          status: 'pending',
          startTime: Date.now()
        };

        execution.steps.push(stepExecution);

        try {
          stepExecution.status = 'running';

          if (this.config.dryRun) {
            // Simulate execution
            await this.simulateStep(step);
            stepExecution.result = { simulated: true };
          } else {
            // Real execution
            stepExecution.result = await this.executeStep(step);
          }

          stepExecution.status = 'completed';
          stepExecution.endTime = Date.now();

        } catch (error) {
          stepExecution.status = 'failed';
          stepExecution.error = error instanceof Error ? error.message : String(error);
          stepExecution.endTime = Date.now();

          // Decide whether to continue or abort
          if (step.step.retryAttempts && step.step.retryAttempts > 0) {
            // Retry logic
            continue;
          }

          throw error;
        }
      }

      execution.status = 'completed';
      execution.metrics.success = true;

      // Update cooldown
      this.cooldowns.set(action.id, Date.now());

      this.emit('actionCompleted', execution, action);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);

      // Attempt rollback if defined
      if (action.rollback) {
        await this.executeRollback(execution, action);
      }

      this.emit('actionFailed', execution, action, error);

    } finally {
      execution.endTime = new Date().toISOString();
      execution.metrics.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();

      this.running = false;

      // Send notification if configured
      if (this.config.notifications.enabled) {
        await this.sendNotification(execution, action);
      }
    }
  }

  private async executeStep(step: RecoveryStep): Promise<any> {
    switch (step.type) {
      case 'reset':
        return this.executeReset(step);
      case 'restart':
        return this.executeRestart(step);
      case 'scale':
        return this.executeScale(step);
      case 'notify':
        return this.executeNotify(step);
      case 'custom':
        return this.executeCustom(step);
      case 'script':
        return this.executeScript(step);
      case 'api_call':
        return this.executeApiCall(step);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeReset(step: RecoveryStep): Promise<any> {
    switch (step.target) {
      case 'circuit_breakers':
        circuitBreakerRegistry.resetAll();
        return { reset: 'all_circuit_breakers' };
      default:
        throw new Error(`Unknown reset target: ${step.target}`);
    }
  }

  private async executeRestart(step: RecoveryStep): Promise<any> {
    // Implementation depends on your deployment environment
    console.log(`[Recovery] Restarting service: ${step.target}`);
    // This would integrate with your orchestration system (Kubernetes, Docker, etc.)
    return { restarted: step.target };
  }

  private async executeScale(step: RecoveryStep): Promise<any> {
    // Implementation depends on your scaling mechanism
    console.log(`[Recovery] Scaling ${step.target}: ${JSON.stringify(step.parameters)}`);
    // This would integrate with your autoscaling system
    return { scaled: step.target, parameters: step.parameters };
  }

  private async executeNotify(step: RecoveryStep): Promise<any> {
    const message = step.parameters.message || 'Recovery action executed';
    const channels = step.parameters.channels || this.config.notifications.channels;

    console.log(`[Recovery] Sending notification to ${channels.join(', ')}: ${message}`);

    // This would integrate with your notification system
    return {
      notified: step.target,
      message,
      channels
    };
  }

  private async executeCustom(step: RecoveryStep): Promise<any> {
    // Execute custom recovery logic
    console.log(`[Recovery] Executing custom action: ${JSON.stringify(step.parameters)}`);
    return { custom: step.parameters };
  }

  private async executeScript(step: RecoveryStep): Promise<any> {
    // Execute recovery script (dangerous - requires validation)
    console.log(`[Recovery] Executing script: ${step.target}`);
    return { script: step.target };
  }

  private async executeApiCall(step: RecoveryStep): Promise<any> {
    const url = step.parameters.url;
    const method = step.parameters.method || 'POST';
    const body = step.parameters.body;

    if (!url) {
      throw new Error('API call requires URL parameter');
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return { apiCall: url, status: response.status };
  }

  private async simulateStep(step: RecoveryStep): Promise<void> {
    const delay = step.timeout || 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async executeRollback(execution: RecoveryExecution, action: RecoveryAction): Promise<void> {
    if (!action.rollback) return;

    console.log(`[Recovery] Rolling back action: ${action.name}`);

    for (const step of action.rollback) {
      try {
        await this.executeStep(step);
      } catch (error) {
        console.error(`[Recovery] Rollback step failed:`, error);
      }
    }

    execution.status = 'rolled_back';
  }

  private async requestApproval(
    action: RecoveryAction,
    executionId: string,
    trigger: string,
    data: any
  ): Promise<void> {
    this.emit('approvalRequired', {
      action,
      executionId,
      trigger,
      data,
      severity: this.getExecutionSeverity(action, data)
    });
  }

  private getExecutionSeverity(action: RecoveryAction, data: any): number {
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityMap[action.priority] || 2;
  }

  private async sendNotification(execution: RecoveryExecution, action: RecoveryAction): Promise<void> {
    const message = `Recovery action "${action.name}" ${execution.status}`;
    console.log(`[Recovery] Notification: ${message}`);
    // This would integrate with your notification channels
  }

  private generateExecutionId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  addAction(action: RecoveryAction): void {
    this.actions.set(action.id, action);
    this.emit('actionAdded', action);
  }

  removeAction(id: string): boolean {
    const removed = this.actions.delete(id);
    if (removed) {
      this.emit('actionRemoved', id);
    }
    return removed;
  }

  getAction(id: string): RecoveryAction | undefined {
    return this.actions.get(id);
  }

  getActions(): RecoveryAction[] {
    return Array.from(this.actions.values());
  }

  async executeActionManually(
    actionId: string,
    context?: Record<string, any>
  ): Promise<RecoveryExecution> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    if (!action.enabled) {
      throw new Error(`Action is disabled: ${actionId}`);
    }

    if (this.isInCooldown(actionId)) {
      throw new Error(`Action is in cooldown: ${actionId}`);
    }

    await this.executeAction(action, 'manual', context || {});
    const execution = Array.from(this.executions.values())
      .find(e => e.actionId === actionId && e.triggeredBy === 'manual');

    if (!execution) {
      throw new Error('Execution not found');
    }

    return execution;
  }

  getExecution(id: string): RecoveryExecution | undefined {
    return this.executions.get(id);
  }

  getExecutions(status?: RecoveryExecution['status']): RecoveryExecution[] {
    if (status) {
      return this.executionHistory.filter(e => e.status === status);
    }
    return [...this.executionHistory];
  }

  updateConfig(updates: Partial<RecoveryConfig>): void {
    Object.assign(this.config, updates);
    this.emit('configUpdated', updates);
  }

  getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  // Statistics
  getStatistics() {
    const total = this.executionHistory.length;
    const completed = this.executionHistory.filter(e => e.status === 'completed').length;
    const failed = this.executionHistory.filter(e => e.status === 'failed').length;
    const rolledBack = this.executionHistory.filter(e => e.status === 'rolled_back').length;

    const avgDuration = this.executionHistory
      .filter(e => e.metrics.duration > 0)
      .reduce((sum, e) => sum + e.metrics.duration, 0) / (completed || 1);

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalExecutions: total,
      completed,
      failed,
      rolledBack,
      successRate,
      averageDuration: avgDuration,
      running: this.running,
      enabledActions: Array.from(this.actions.values()).filter(a => a.enabled).length
    };
  }

  reset(): void {
    this.executions.clear();
    this.executionHistory = [];
    this.cooldowns.clear();
    this.running = false;
    this.emit('reset');
  }
}

// Create singleton instance
export const recoveryAutomation = new RecoveryAutomation({
  enabled: true,
  requireApproval: false, // Auto-approve by default
  approvalThreshold: 3, // Require approval for high and critical severity
  dryRun: false, // Execute actions for real
  logging: true,
  notifications: {
    enabled: true,
    channels: ['console'], // Add email, slack, webhook as needed
    recipients: []
  },
  limits: {
    maxConcurrentRecoveries: 1,
    maxRecoveryAttempts: 10,
    recoveryTimeWindow: 3600000 // 1 hour
  }
});