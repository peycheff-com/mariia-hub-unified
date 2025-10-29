import { EventEmitter } from 'events';

export enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  BACKGROUND = 4
}

export interface QueuedRequest<T = any> {
  id: string;
  priority: Priority;
  execute: () => Promise<T>;
  timeout?: number;
  retries?: number;
  maxRetries?: number;
  createdAt: number;
  scheduledAt?: number;
  context?: Record<string, any>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  onRetry?: (attempt: number) => void;
}

export interface QueueMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  timedOutRequests: number;
  retryCount: number;
  averageWaitTime: number;
  averageExecutionTime: number;
  queueLength: number;
  processingRate: number; // requests per second
}

export interface RequestQueueConfig {
  concurrency: number;
  maxSize?: number;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableMetrics: boolean;
  enableBatching: boolean;
  batchSize?: number;
  batchTimeout?: number;
  priorityBoostEnabled: boolean;
  priorityBoostDelay?: number; // milliseconds after which to boost priority
}

export class RequestQueue extends EventEmitter {
  private queue: QueuedRequest[] = [];
  private processing = new Set<string>();
  private completed = new Set<string>();
  private metrics: QueueMetrics;
  private processingTimes: number[] = [];
  private waitTimes: number[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private currentBatch: QueuedRequest[] = [];
  private processingRateTimer: NodeJS.Timeout | null = null;
  private recentCompleted = 0;

  constructor(private config: RequestQueueConfig) {
    super();
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      timedOutRequests: 0,
      retryCount: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      queueLength: 0,
      processingRate: 0
    };

    // Start processing rate calculator
    if (config.enableMetrics) {
      this.startProcessingRateCalculator();
    }
  }

  async add<T>(
    request: Omit<QueuedRequest<T>, 'id' | 'createdAt'> & { id?: string }
  ): Promise<string> {
    // Check queue size limit
    if (this.config.maxSize && this.queue.length >= this.config.maxSize) {
      throw new Error('Queue is full');
    }

    const queuedRequest: QueuedRequest<T> = {
      id: request.id || this.generateId(),
      priority: request.priority,
      execute: request.execute,
      timeout: request.timeout ?? this.config.timeout,
      retries: 0,
      maxRetries: request.maxRetries ?? this.config.maxRetries,
      createdAt: Date.now(),
      scheduledAt: request.scheduledAt,
      context: request.context,
      onSuccess: request.onSuccess,
      onError: request.onError,
      onTimeout: request.onTimeout,
      onRetry: request.onRetry
    };

    // Insert in priority order
    this.insertByPriority(queuedRequest);

    this.metrics.totalRequests++;
    this.metrics.queueLength = this.queue.length;

    this.emit('queued', queuedRequest);

    // Try to process if there's capacity
    this.process();

    return queuedRequest.id;
  }

  private insertByPriority(request: QueuedRequest): void {
    let insertIndex = this.queue.length;

    // Find the correct position based on priority
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > request.priority) {
        insertIndex = i;
        break;
      }
    }

    // Insert at the found position
    this.queue.splice(insertIndex, 0, request);
  }

  private async process(): Promise<void> {
    while (this.processing.size < this.config.concurrency && this.queue.length > 0) {
      const request = this.getNextRequest();
      if (!request) break;

      // Check if scheduled for future
      if (request.scheduledAt && request.scheduledAt > Date.now()) {
        continue; // Skip for now, will be processed later
      }

      this.processing.add(request.id);
      this.queue = this.queue.filter(r => r.id !== request.id);
      this.metrics.queueLength = this.queue.length;

      // Process asynchronously
      this.processRequest(request);
    }

    // Handle batching if enabled
    if (this.config.enableBatching && this.config.batchSize && this.config.batchTimeout) {
      this.processBatch();
    }
  }

  private getNextRequest(): QueuedRequest | undefined {
    // Priority boost for old requests
    if (this.config.priorityBoostEnabled && this.config.priorityBoostDelay) {
      const now = Date.now();
      const boostThreshold = now - this.config.priorityBoostDelay;

      for (let i = 0; i < this.queue.length; i++) {
        const request = this.queue[i];
        if (request.createdAt < boostThreshold && request.priority > Priority.HIGH) {
          // Boost priority
          request.priority = Priority.HIGH;
          // Re-sort queue
          this.queue.sort((a, b) => a.priority - b.priority);
          break;
        }
      }
    }

    return this.queue[0];
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();
    const waitTime = startTime - request.createdAt;

    try {
      // Update wait time metrics
      this.waitTimes.push(waitTime);
      if (this.waitTimes.length > 100) {
        this.waitTimes = this.waitTimes.slice(-100);
      }
      this.metrics.averageWaitTime = this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length;

      // Execute with timeout
      const result = await this.executeWithTimeout(request);

      const executionTime = Date.now() - startTime;
      this.updateExecutionMetrics(executionTime);

      this.metrics.completedRequests++;
      this.completed.add(request.id);

      request.onSuccess?.(result);
      this.emit('completed', request, result);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateExecutionMetrics(executionTime);

      // Handle retries
      if (request.retries < (request.maxRetries || 0)) {
        request.retries++;
        this.metrics.retryCount++;

        request.onRetry?.(request.retries);

        // Calculate retry delay
        const retryDelay = this.calculateRetryDelay(request.retries);

        // Reschedule with delay
        request.scheduledAt = Date.now() + retryDelay;
        this.insertByPriority(request);

        this.emit('retry', request, error as Error);
      } else {
        // Max retries exceeded
        this.metrics.failedRequests++;

        request.onError?.(error as Error);
        this.emit('failed', request, error as Error);
      }
    } finally {
      this.processing.delete(request.id);
      this.recentCompleted++;

      // Continue processing
      this.process();
    }
  }

  private async executeWithTimeout(request: QueuedRequest): Promise<any> {
    if (!request.timeout) {
      return request.execute();
    }

    return Promise.race([
      request.execute(),
      new Promise((_, reject) => {
        setTimeout(() => {
          this.metrics.timedOutRequests++;
          request.onTimeout?.();
          reject(new Error('Request timeout'));
        }, request.timeout);
      })
    ]);
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    let delay = baseDelay * Math.pow(2, attempt - 1);
    delay = Math.min(delay, maxDelay);

    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  private updateExecutionMetrics(executionTime: number): void {
    this.processingTimes.push(executionTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-100);
    }
    this.metrics.averageExecutionTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  private processBatch(): void {
    if (!this.config.batchSize || !this.config.batchTimeout) return;

    // Collect requests for batching
    while (this.currentBatch.length < this.config.batchSize && this.queue.length > 0) {
      const request = this.getNextRequest();
      if (!request) break;

      if (request.priority <= Priority.HIGH) {
        // Don't batch high priority requests
        break;
      }

      this.currentBatch.push(request);
      this.queue = this.queue.filter(r => r.id !== request.id);
    }

    if (this.currentBatch.length > 0) {
      // Process batch immediately or wait for more
      if (this.currentBatch.length >= this.config.batchSize) {
        this.executeBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.executeBatch();
        }, this.config.batchTimeout);
      }
    }
  }

  private async executeBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = this.currentBatch.splice(0);
    if (batch.length === 0) return;

    // Process all requests in the batch concurrently
    await Promise.allSettled(
      batch.map(request => this.processRequest(request))
    );

    this.emit('batchProcessed', batch);
  }

  private startProcessingRateCalculator(): void {
    this.processingRateTimer = setInterval(() => {
      this.metrics.processingRate = this.recentCompleted;
      this.recentCompleted = 0;
    }, 1000);
  }

  // Public methods
  getQueueLength(): number {
    return this.queue.length;
  }

  getProcessingCount(): number {
    return this.processing.size;
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  getQueueSnapshot(): QueuedRequest[] {
    return [...this.queue];
  }

  getProcessingSnapshot(): string[] {
    return [...this.processing];
  }

  pause(): void {
    // Implementation for pausing the queue
    this.emit('paused');
  }

  resume(): void {
    // Implementation for resuming the queue
    this.emit('resumed');
    this.process();
  }

  clear(): void {
    // Clear all pending requests
    const cleared = this.queue.splice(0);
    this.metrics.queueLength = 0;
    this.emit('cleared', cleared);
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(r => r.id === id);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      this.metrics.queueLength = this.queue.length;
      this.emit('removed', removed);
      return true;
    }
    return false;
  }

  getPriority(id: string): Priority | undefined {
    const request = this.queue.find(r => r.id === id) ||
                   Array.from(this.processing).find(pid => {
                     // This would need tracking of processing requests
                     return false;
                   });

    return request?.priority;
  }

  updatePriority(id: string, newPriority: Priority): boolean {
    const index = this.queue.findIndex(r => r.id === id);
    if (index !== -1) {
      const request = this.queue[index];
      request.priority = newPriority;

      // Remove and re-insert to maintain order
      this.queue.splice(index, 1);
      this.insertByPriority(request);

      this.emit('priorityUpdated', id, newPriority);
      return true;
    }
    return false;
  }

  // Statistics
  getStatsByPriority(): Record<Priority, number> {
    const stats: Record<Priority, number> = {
      [Priority.CRITICAL]: 0,
      [Priority.HIGH]: 0,
      [Priority.NORMAL]: 0,
      [Priority.LOW]: 0,
      [Priority.BACKGROUND]: 0
    };

    for (const request of this.queue) {
      stats[request.priority]++;
    }

    return stats;
  }

  getEstimatedWaitTime(priority: Priority): number {
    if (this.config.concurrency === 0) return Infinity;

    // Calculate based on current queue and average execution time
    const higherOrEqualPriority = this.queue.filter(r => r.priority <= priority).length;
    const avgExecutionTime = this.metrics.averageExecutionTime || 1000;

    return (higherOrEqualPriority / this.config.concurrency) * avgExecutionTime;
  }

  // Lifecycle
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.processingRateTimer) {
      clearInterval(this.processingRateTimer);
      this.processingRateTimer = null;
    }

    // Clear all pending requests
    this.clear();
    this.removeAllListeners();
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Specialized queue classes
export class PriorityRequestQueue extends RequestQueue {
  constructor(config: Partial<RequestQueueConfig> = {}) {
    super({
      concurrency: 5,
      maxSize: 1000,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true,
      enableBatching: false,
      priorityBoostEnabled: true,
      priorityBoostDelay: 5000,
      ...config
    });
  }
}

export class BackgroundTaskQueue extends RequestQueue {
  constructor(config: Partial<RequestQueueConfig> = {}) {
    super({
      concurrency: 2,
      maxSize: 500,
      timeout: 60000,
      maxRetries: 5,
      retryDelay: 5000,
      enableMetrics: true,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 5000,
      priorityBoostEnabled: false,
      ...config
    });
  }
}

export class CriticalRequestQueue extends RequestQueue {
  constructor(config: Partial<RequestQueueConfig> = {}) {
    super({
      concurrency: 10,
      maxSize: 100,
      timeout: 5000,
      maxRetries: 1,
      retryDelay: 100,
      enableMetrics: true,
      enableBatching: false,
      priorityBoostEnabled: false,
      ...config
    });
  }
}

// Factory for creating appropriate queues
export class QueueFactory {
  static create(
    type: 'priority' | 'background' | 'critical' | 'custom',
    config?: Partial<RequestQueueConfig>
  ): RequestQueue {
    switch (type) {
      case 'priority':
        return new PriorityRequestQueue(config);
      case 'background':
        return new BackgroundTaskQueue(config);
      case 'critical':
        return new CriticalRequestQueue(config);
      case 'custom':
        return new RequestQueue({
          concurrency: 5,
          maxSize: 1000,
          timeout: 30000,
          maxRetries: 3,
          retryDelay: 1000,
          enableMetrics: true,
          enableBatching: false,
          priorityBoostEnabled: true,
          priorityBoostDelay: 5000,
          ...config
        });
      default:
        throw new Error(`Unknown queue type: ${type}`);
    }
  }
}