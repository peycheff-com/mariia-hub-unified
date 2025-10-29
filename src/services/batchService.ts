// Request Batching Service
// Combines multiple API requests into single calls for better performance

import { logger } from '@/lib/logger';

import { apiGateway, RequestOptions } from './apiGateway';

// Batch operation types
export interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchResponse {
  id: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

export interface BatchOperation {
  requests: BatchRequest[];
  executeInParallel?: boolean; // Default: false (sequential)
  retryOnFailure?: boolean;
  maxRetries?: number;
}

class BatchService {
  private static instance: BatchService;
  private pendingBatches = new Map<string, BatchRequest[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private readonly BATCH_DELAY = 50; // ms to wait before executing batch
  private readonly MAX_BATCH_SIZE = 25;

  static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService();
    }
    return BatchService.instance;
  }

  // Add request to batch
  async addToBatch(
    batchKey: string,
    request: BatchRequest,
    options?: {
      delay?: number;
      force?: boolean;
    }
  ): Promise<BatchResponse> {
    return new Promise((resolve, reject) => {
      // Get existing batch or create new one
      const batch = this.pendingBatches.get(batchKey) || [];

      // Add request to batch
      batch.push({
        ...request,
        id: request.id || crypto.randomUUID(),
      });

      this.pendingBatches.set(batchKey, batch);

      // Set up promise resolver
      (request as any)._resolve = resolve;
      (request as any)._reject = reject;

      // Check if we should execute immediately
      const shouldExecute = options?.force || batch.length >= this.MAX_BATCH_SIZE;

      if (shouldExecute) {
        // Clear any existing timer
        const timer = this.batchTimers.get(batchKey);
        if (timer) {
          clearTimeout(timer);
          this.batchTimers.delete(batchKey);
        }

        // Execute batch immediately
        this.executeBatch(batchKey);
      } else {
        // Set timer to execute batch after delay
        if (!this.batchTimers.has(batchKey)) {
          const delay = options?.delay || this.BATCH_DELAY;
          const timer = setTimeout(() => {
            this.executeBatch(batchKey);
          }, delay);
          this.batchTimers.set(batchKey, timer);
        }
      }
    });
  }

  // Execute batch of requests
  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Remove batch from pending
    this.pendingBatches.delete(batchKey);

    try {
      // Execute batch request
      const responses = await this.performBatchRequest(batch);

      // Resolve promises
      responses.forEach((response, index) => {
        const request = batch[index];
        if (response.success) {
          (request as any)._resolve(response);
        } else {
          (request as any)._reject(new Error(response.error));
        }
      });
    } catch (error) {
      // Reject all promises
      batch.forEach(request => {
        (request as any)._reject(error);
      });
    }
  }

  // Perform actual batch request
  private async performBatchRequest(requests: BatchRequest[]): Promise<BatchResponse[]> {
    // Group requests by type for optimization
    const getRequests = requests.filter(r => r.method === 'GET');
    const nonGetRequests = requests.filter(r => r.method !== 'GET');

    const responses: BatchResponse[] = [];

    // Handle GET requests with specialized batch endpoint
    if (getRequests.length > 0) {
      const getResponses = await this.executeGetBatch(getRequests);
      responses.push(...getResponses);
    }

    // Handle non-GET requests
    for (const request of nonGetRequests) {
      try {
        const response = await this.executeSingleRequest(request);
        responses.push(response);
      } catch (error) {
        responses.push({
          id: request.id,
          status: 500,
          success: false,
          error: error instanceof Error ? error.message : 'Request failed',
        });
      }
    }

    // Sort responses to match original request order
    const responseMap = new Map(responses.map(r => [r.id, r]));
    return requests.map(r => responseMap.get(r.id) || {
      id: r.id,
      status: 404,
      success: false,
      error: 'Response not found',
    });
  }

  // Execute batch of GET requests
  private async executeGetBatch(requests: BatchRequest[]): Promise<BatchResponse[]> {
    try {
      // Use specialized batch endpoint
      const response = await apiGateway.request('/batch', {
        method: 'POST',
        body: {
          requests: requests.map(r => ({
            id: r.id,
            endpoint: r.endpoint,
            headers: r.headers,
          })),
        },
        cache: true,
        cacheTTL: 300,
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      // Fallback: execute requests in parallel
      const promises = requests.map(r => this.executeSingleRequest(r));
      return Promise.all(promises);
    } catch (error) {
      // Fallback to individual requests
      const promises = requests.map(r => this.executeSingleRequest(r));
      return Promise.all(promises);
    }
  }

  // Execute single request
  private async executeSingleRequest(request: BatchRequest): Promise<BatchResponse> {
    try {
      const response = await apiGateway.request(request.endpoint, {
        method: request.method,
        body: request.body,
        headers: request.headers,
      });

      return {
        id: request.id,
        status: response.status,
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  // Execute multiple operations
  async executeBatchOperation(operation: BatchOperation): Promise<BatchResponse[]> {
    const { requests, executeInParallel = false, retryOnFailure = false, maxRetries = 3 } = operation;

    if (executeInParallel) {
      // Execute all requests in parallel
      const promises = requests.map(r => this.executeSingleRequest(r));
      const responses = await Promise.allSettled(promises);

      return responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            id: requests[index].id,
            status: 500,
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Request failed',
          };
        }
      });
    } else {
      // Execute requests sequentially
      const responses: BatchResponse[] = [];

      for (const request of requests) {
        let retries = 0;
        let lastError: Error | null = null;

        while (retries <= maxRetries) {
          try {
            const response = await this.executeSingleRequest(request);
            responses.push(response);
            break;
          } catch (error) {
            lastError = error as Error;
            retries++;

            if (retryOnFailure && retries <= maxRetries) {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
            } else {
              responses.push({
                id: request.id,
                status: 500,
                success: false,
                error: lastError?.message || 'Request failed',
              });
              break;
            }
          }
        }
      }

      return responses;
    }
  }

  // Preload data (batch multiple GET requests)
  async preloadData(requests: Array<{ key: string; endpoint: string }>): Promise<void> {
    const batchRequests: BatchRequest[] = requests.map(r => ({
      id: r.key,
      method: 'GET' as const,
      endpoint: r.endpoint,
    }));

    try {
      await this.executeBatchOperation({
        requests: batchRequests,
        executeInParallel: true,
      });
    } catch (error) {
      logger.warn('Preload failed:', error);
    }
  }

  // Cancel pending batch
  cancelBatch(batchKey: string): void {
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    const batch = this.pendingBatches.get(batchKey);
    if (batch) {
      // Reject all promises
      batch.forEach(request => {
        (request as any)._reject(new Error('Batch cancelled'));
      });
      this.pendingBatches.delete(batchKey);
    }
  }

  // Get pending batch status
  getBatchStatus(batchKey: string): {
    pending: number;
    hasTimer: boolean;
  } {
    const batch = this.pendingBatches.get(batchKey);
    const timer = this.batchTimers.has(batchKey);

    return {
      pending: batch?.length || 0,
      hasTimer: timer,
    };
  }

  // Clear all pending batches
  clearAllBatches(): void {
    // Clear all timers
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();

    // Reject all pending requests
    this.pendingBatches.forEach(batch => {
      batch.forEach(request => {
        (request as any)._reject(new Error('All batches cleared'));
      });
    });
    this.pendingBatches.clear();
  }
}

// Export singleton instance
export const batchService = BatchService.getInstance();

// Convenience methods for common batching scenarios
export const BatchOperations = {
  // Load multiple services
  loadServices: async (serviceIds: string[]): Promise<BatchResponse[]> => {
    const requests = serviceIds.map(id => ({
      id: `service-${id}`,
      method: 'GET' as const,
      endpoint: `/services/${id}`,
    }));

    return batchService.executeBatchOperation({
      requests,
      executeInParallel: true,
    });
  },

  // Load availability for multiple dates
  loadAvailability: async (
    serviceId: string,
    dates: string[],
    location: string = 'studio'
  ): Promise<BatchResponse[]> => {
    const requests = dates.map(date => ({
      id: `availability-${serviceId}-${date}`,
      method: 'GET' as const,
      endpoint: `/availability/slots`,
      body: { serviceId, date, location },
    }));

    return batchService.executeBatchOperation({
      requests,
      executeInParallel: true,
    });
  },

  // Load user bookings
  loadUserBookings: async (userId: string, statuses: string[]): Promise<BatchResponse[]> => {
    const requests = statuses.map(status => ({
      id: `bookings-${userId}-${status}`,
      method: 'GET' as const,
      endpoint: '/bookings',
      body: { userId, status },
    }));

    return batchService.executeBatchOperation({
      requests,
      executeInParallel: true,
    });
  },

  // Update multiple bookings (admin operation)
  updateBookings: async (
    updates: Array<{ id: string; status: string; reason?: string }>
  ): Promise<BatchResponse[]> => {
    const requests = updates.map(u => ({
      id: `update-${u.id}`,
      method: 'PATCH' as const,
      endpoint: `/bookings/${u.id}/status`,
      body: { status: u.status, reason: u.reason },
    }));

    return batchService.executeBatchOperation({
      requests,
      executeInParallel: false, // Sequential for data consistency
      retryOnFailure: true,
    });
  },
};

// React hook for batching
import { useCallback, useRef } from 'react';

export function useBatchService() {
  const mountedRef = useRef(true);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (!mountedRef.current) {
      batchService.clearAllBatches();
    }
  }, []);

  // Batch request with cleanup
  const batchRequest = useCallback(
    async (batchKey: string, request: BatchRequest) => {
      try {
        return await batchService.addToBatch(batchKey, request);
      } catch (error) {
        if (!mountedRef.current) {
          return null; // Component unmounted
        }
        throw error;
      }
    },
    []
  );

  return {
    batchRequest,
    executeBatchOperation: batchService.executeBatchOperation.bind(batchService),
    cancelBatch: batchService.cancelBatch.bind(batchService),
    getBatchStatus: batchService.getBatchStatus.bind(batchService),
    preloadData: batchService.preloadData.bind(batchService),
    cleanup,
  };
}