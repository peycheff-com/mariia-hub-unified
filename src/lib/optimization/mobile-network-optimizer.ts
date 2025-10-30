/**
 * Advanced Mobile Network Optimization and Offline Strategy System
 * for luxury beauty and fitness booking platform
 *
 * Provides intelligent network optimization, offline support,
 * and adaptive loading strategies for mobile users
 */

import { mobilePerformanceOptimizer, NetworkQuality } from './mobile-performance-optimizer';
import { trackRUMEvent } from '../rum';

// Network optimization configuration
interface NetworkOptimizationConfig {
  // Adaptive loading
  adaptive: {
    enabled: boolean;
    qualityThresholds: {
      excellent: number;    // Mbps
      good: number;         // Mbps
      moderate: number;     // Mbps
      slow: number;         // Mbps
    };
    fallbackStrategies: {
      dataReduction: number;     // Percentage reduction
      imageQuality: number;      // Quality reduction
      featureParity: number;     // Feature reduction
    };
  };

  // Request optimization
  requests: {
    batching: {
      enabled: boolean;
      maxBatchSize: number;
      batchTimeout: number;       // ms
      endpoints: string[];
    };
    compression: {
      enabled: boolean;
      algorithm: 'gzip' | 'brotli' | 'auto';
      threshold: number;          // Bytes
    };
    retries: {
      enabled: boolean;
      maxRetries: number;
      backoffStrategy: 'exponential' | 'linear' | 'fixed';
      initialDelay: number;       // ms
      maxDelay: number;           // ms
    };
    timeout: {
      connect: number;            // ms
      read: number;               // ms
      total: number;              // ms
    };
  };

  // Caching strategy
  caching: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    ttl: {
      api: number;                // seconds
      images: number;             // seconds
      static: number;             // seconds
      critical: number;           // seconds
    };
    quota: {
      maxStorage: number;         // MB
      perResource: number;        // MB
      cleanupThreshold: number;   // Percentage
    };
  };

  // Offline support
  offline: {
    enabled: boolean;
    sync: {
      enabled: boolean;
      interval: number;           // seconds
      retryAttempts: number;
      conflictResolution: 'client' | 'server' | 'manual';
    };
    storage: {
      strategy: 'indexeddb' | 'localstorage' | 'memory';
      maxEntries: number;
      compression: boolean;
    };
    indicators: {
      showStatus: boolean;
      position: 'top' | 'bottom' | 'inline';
      autoHide: boolean;
      hideDelay: number;          // ms
    };
  };

  // Predictive optimization
  predictive: {
    enabled: boolean;
    preloading: {
      enabled: boolean;
      confidence: number;         // 0-1
      maxResources: number;
      priority: 'critical' | 'important' | 'optional';
    };
    prefetching: {
      enabled: boolean;
      idleTime: number;           // ms
      maxConcurrent: number;
    };
  };
}

// Network request queue
interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  priority: 'critical' | 'high' | 'normal' | 'low';
  batch?: string;
  retries: number;
  timestamp: number;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

// Network performance metrics
interface NetworkPerformanceMetrics {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  duration: number;
  size: {
    request: number;
    response: number;
    compressed: number;
  };
  cache: {
    hit: boolean;
    stale: boolean;
  };
  network: {
    quality: NetworkQuality;
    type: string;
    downlink: number;
    rtt: number;
  };
  performance: {
    ttfb: number;
    download: number;
    processing: number;
  };
}

// Offline data sync
interface OfflineDataSync {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
  conflict?: any;
}

// Predictive data
interface PredictiveData {
  url: string;
  probability: number;        // 0-1
  lastAccessed: number;
  accessCount: number;
  priority: number;
  size: number;
}

class MobileNetworkOptimizer {
  private static instance: MobileNetworkOptimizer;
  private isInitialized = false;
  private config: NetworkOptimizationConfig;
  private networkQuality: NetworkQuality = NetworkQuality.MODERATE;
  private isOnline = true;
  private requestQueue: QueuedRequest[] = [];
  private performanceMetrics: NetworkPerformanceMetrics[] = [];
  private offlineSyncQueue: OfflineDataSync[] = [];
  private predictiveCache: Map<string, PredictiveData> = new Map();
  private batchTimers: Map<string, number> = new Map();
  private networkMonitor?: NetworkInformation;
  private offlineIndicator?: HTMLElement;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): MobileNetworkOptimizer {
    if (!MobileNetworkOptimizer.instance) {
      MobileNetworkOptimizer.instance = new MobileNetworkOptimizer();
    }
    return MobileNetworkOptimizer.instance;
  }

  // Initialize the network optimizer
  initialize(config: Partial<NetworkOptimizationConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    try {
      this.initializeNetworkMonitoring();
      this.initializeRequestInterception();
      this.initializeBatching();
      this.initializeCaching();
      this.initializeOfflineSupport();
      this.initializePredictiveOptimization();
      this.initializePerformanceMonitoring();
      this.initializeAdaptiveStrategies();

      this.isInitialized = true;
      console.log('[Mobile Network Optimizer] Advanced network optimization initialized');

      trackRUMEvent('mobile-network-optimizer-initialized', {
        config: this.config,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Mobile Network Optimizer] Failed to initialize:', error);
    }
  }

  // Get default configuration
  private getDefaultConfig(): NetworkOptimizationConfig {
    return {
      adaptive: {
        enabled: true,
        qualityThresholds: {
          excellent: 5,      // 5 Mbps
          good: 2,          // 2 Mbps
          moderate: 0.5,    // 0.5 Mbps
          slow: 0.15        // 0.15 Mbps
        },
        fallbackStrategies: {
          dataReduction: 50,    // 50% reduction
          imageQuality: 30,     // 30% quality reduction
          featureParity: 20     // 20% feature reduction
        }
      },
      requests: {
        batching: {
          enabled: true,
          maxBatchSize: 10,
          batchTimeout: 100,    // 100ms
          endpoints: ['/api/booking', '/api/services', '/api/analytics']
        },
        compression: {
          enabled: true,
          algorithm: 'auto',
          threshold: 1024       // 1KB
        },
        retries: {
          enabled: true,
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,   // 1 second
          maxDelay: 30000       // 30 seconds
        },
        timeout: {
          connect: 5000,        // 5 seconds
          read: 15000,          // 15 seconds
          total: 30000          // 30 seconds
        }
      },
      caching: {
        strategy: 'stale-while-revalidate',
        ttl: {
          api: 300,            // 5 minutes
          images: 604800,      // 7 days
          static: 2592000,     // 30 days
          critical: 86400      // 1 day
        },
        quota: {
          maxStorage: 100,     // 100MB
          perResource: 10,     // 10MB
          cleanupThreshold: 80 // 80%
        }
      },
      offline: {
        enabled: true,
        sync: {
          enabled: true,
          interval: 30,        // 30 seconds
          retryAttempts: 5,
          conflictResolution: 'client'
        },
        storage: {
          strategy: 'indexeddb',
          maxEntries: 1000,
          compression: true
        },
        indicators: {
          showStatus: true,
          position: 'top',
          autoHide: true,
          hideDelay: 3000      // 3 seconds
        }
      },
      predictive: {
        enabled: true,
        preloading: {
          enabled: true,
          confidence: 0.7,     // 70% confidence
          maxResources: 5,
          priority: 'important'
        },
        prefetching: {
          enabled: true,
          idleTime: 2000,      // 2 seconds
          maxConcurrent: 3
        }
      }
    };
  }

  // Initialize network monitoring
  private initializeNetworkMonitoring(): void {
    this.networkMonitor = (navigator as any).connection;

    if (this.networkMonitor) {
      this.updateNetworkQuality();
      this.networkMonitor.addEventListener('change', () => {
        this.updateNetworkQuality();
        this.adaptToNetworkChange();
      });

      this.networkMonitor.addEventListener('typechange', () => {
        this.updateNetworkQuality();
        this.adaptToNetworkChange();
      });
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });

    // Initial status
    this.isOnline = navigator.onLine;
  }

  // Update network quality
  private updateNetworkQuality(): void {
    if (!this.networkMonitor) {
      this.networkQuality = NetworkQuality.MODERATE;
      return;
    }

    const { downlink, effectiveType, rtt } = this.networkMonitor;

    if (downlink >= this.config.adaptive.qualityThresholds.excellent || effectiveType === '5g') {
      this.networkQuality = NetworkQuality.EXCELLENT;
    } else if (downlink >= this.config.adaptive.qualityThresholds.good || effectiveType === '4g') {
      this.networkQuality = NetworkQuality.GOOD;
    } else if (downlink >= this.config.adaptive.qualityThresholds.moderate || effectiveType === '3g') {
      this.networkQuality = NetworkQuality.MODERATE;
    } else {
      this.networkQuality = NetworkQuality.SLOW;
    }

    trackRUMEvent('mobile-network-quality-updated', {
      quality: this.networkQuality,
      downlink,
      effectiveType,
      rtt,
      timestamp: Date.now()
    });
  }

  // Adapt to network change
  private adaptToNetworkChange(): void {
    // Adjust request strategies
    this.adjustRequestStrategies();

    // Adjust caching strategies
    this.adjustCachingStrategies();

    // Update offline capabilities
    this.updateOfflineCapabilities();

    // Notify about adaptation
    trackRUMEvent('mobile-network-adaptation', {
      networkQuality: this.networkQuality,
      adaptations: this.getAdaptations(),
      timestamp: Date.now()
    });
  }

  // Handle online status change
  private handleOnlineStatusChange(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    if (isOnline && !wasOnline) {
      // We're back online
      this.handleConnectionRestored();
    } else if (!isOnline && wasOnline) {
      // We went offline
      this.handleConnectionLost();
    }

    this.updateOfflineIndicator();

    trackRUMEvent('mobile-connection-status-change', {
      isOnline,
      previousStatus: wasOnline,
      timestamp: Date.now()
    });
  }

  // Handle connection restored
  private handleConnectionRestored(): void {
    // Process queued requests
    this.processRequestQueue();

    // Sync offline data
    if (this.config.offline.sync.enabled) {
      this.syncOfflineData();
    }

    // Clear stale cache entries
    this.clearStaleCache();

    // Show online indicator
    this.showStatusIndicator('online', 'Connection restored');
  }

  // Handle connection lost
  private handleConnectionLost(): void {
    // Pause non-critical requests
    this.pauseNonCriticalRequests();

    // Enable offline mode
    this.enableOfflineMode();

    // Show offline indicator
    this.showStatusIndicator('offline', 'No internet connection');
  }

  // Initialize request interception
  private initializeRequestInterception(): void {
    // Override fetch for optimization
    const originalFetch = window.fetch;

    (window as any).optimizedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      return this.performOptimizedRequest(input, init);
    };

    // For development, also override the global fetch
    if (import.meta.env.DEV) {
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        return (window as any).optimizedFetch(input, init);
      };
    }
  }

  // Perform optimized request
  private async performOptimizedRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    const startTime = performance.now();

    try {
      // Check if request should be batched
      if (this.shouldBatchRequest(url, init)) {
        return this.batchRequest(url, init);
      }

      // Check cache first
      const cachedResponse = await this.checkCache(url, init);
      if (cachedResponse) {
        this.recordNetworkMetrics(url, init?.method || 'GET', cachedResponse, startTime, true);
        return cachedResponse;
      }

      // If offline, queue the request
      if (!this.isOnline && this.isOfflineCapable(url)) {
        return this.queueOfflineRequest(url, init);
      }

      // Perform the request with optimizations
      const response = await this.performRequest(url, init);

      // Cache the response
      await this.cacheResponse(url, init, response);

      // Record metrics
      this.recordNetworkMetrics(url, init?.method || 'GET', response, startTime, false);

      return response;
    } catch (error) {
      // Handle request failure
      return this.handleRequestError(url, init, error as Error, startTime);
    }
  }

  // Check if request should be batched
  private shouldBatchRequest(url: string, init?: RequestInit): boolean {
    if (!this.config.requests.batching.enabled) return false;

    const method = init?.method || 'GET';
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') return false;

    return this.config.requests.batching.endpoints.some(endpoint =>
      url.includes(endpoint)
    );
  }

  // Batch request
  private batchRequest(url: string, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const batchId = this.getBatchId(url);
      const request: QueuedRequest = {
        id: this.generateRequestId(),
        url,
        options: init || {},
        priority: 'normal',
        batch: batchId,
        retries: 0,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.requestQueue.push(request);

      // Start or reset batch timer
      if (this.batchTimers.has(batchId)) {
        clearTimeout(this.batchTimers.get(batchId)!);
      }

      const timer = setTimeout(() => {
        this.processBatch(batchId);
        this.batchTimers.delete(batchId);
      }, this.config.requests.batching.batchTimeout);

      this.batchTimers.set(batchId, timer);
    });
  }

  // Process batch
  private async processBatch(batchId: string): void {
    const batchRequests = this.requestQueue.filter(req => req.batch === batchId);

    if (batchRequests.length === 0) return;

    try {
      // Create batch request
      const batchData = batchRequests.map(req => ({
        id: req.id,
        url: req.url,
        method: req.options.method || 'POST',
        headers: req.options.headers,
        body: req.options.body
      }));

      const batchResponse = await fetch('/api/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Batch-Size': batchRequests.length.toString()
        },
        body: JSON.stringify(batchData)
      });

      if (!batchResponse.ok) {
        throw new Error(`Batch request failed: ${batchResponse.status}`);
      }

      const batchResults = await batchResponse.json();

      // Resolve individual requests
      batchRequests.forEach(req => {
        const result = batchResults.results.find((r: any) => r.id === req.id);
        if (result) {
          if (result.success) {
            req.resolve(new Response(JSON.stringify(result.data), {
              status: result.status,
              headers: result.headers
            }));
          } else {
            req.reject(new Error(result.error));
          }
        } else {
          req.reject(new Error('Request not found in batch response'));
        }
      });

      // Remove processed requests from queue
      this.requestQueue = this.requestQueue.filter(req => req.batch !== batchId);

      trackRUMEvent('mobile-batch-request-completed', {
        batchId,
        requestCount: batchRequests.length,
        timestamp: Date.now()
      });

    } catch (error) {
      // Handle batch error
      batchRequests.forEach(req => {
        req.reject(error as Error);
      });

      this.requestQueue = this.requestQueue.filter(req => req.batch !== batchId);
    }
  }

  // Check cache
  private async checkCache(url: string, init?: RequestInit): Promise<Response | null> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open('mobile-network-cache');
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const cachedTime = parseInt(cachedResponse.headers.get('X-Cache-Time') || '0');
        const now = Date.now();
        const age = (now - cachedTime) / 1000; // seconds

        // Check if still valid based on TTL
        const ttl = this.getTTLForUrl(url);
        if (age < ttl) {
          // Return cached response
          trackRUMEvent('mobile-cache-hit', {
            url,
            age,
            ttl,
            timestamp: Date.now()
          });
          return cachedResponse;
        } else {
          // Stale cache, revalidate in background
          this.revalidateCache(url, init, cachedResponse);
          return cachedResponse;
        }
      }
    } catch (error) {
      console.warn('Cache check failed:', error);
    }

    return null;
  }

  // Get TTL for URL
  private getTTLForUrl(url: string): number {
    if (url.includes('/api/')) return this.config.caching.ttl.api;
    if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return this.config.caching.ttl.images;
    if (url.includes('/css/') || url.includes('/js/')) return this.config.caching.ttl.static;
    return this.config.caching.ttl.critical;
  }

  // Revalidate cache
  private async revalidateCache(url: string, init?: RequestInit, cachedResponse?: Response): Promise<void> {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        await this.cacheResponse(url, init, response);
        trackRUMEvent('mobile-cache-revalidated', {
          url,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('Cache revalidation failed:', error);
    }
  }

  // Cache response
  private async cacheResponse(url: string, init?: RequestInit, response?: Response): Promise<void> {
    if (!('caches' in window) || !response) return;

    try {
      const cache = await caches.open('mobile-network-cache');

      // Add cache timestamp
      const headers = new Headers(response.headers);
      headers.set('X-Cache-Time', Date.now().toString());

      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

      await cache.put(url, cachedResponse);

      // Check cache quota
      await this.checkCacheQuota();

    } catch (error) {
      console.warn('Cache storage failed:', error);
    }
  }

  // Check cache quota
  private async checkCacheQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercentage = (usage / quota) * 100;

        if (usagePercentage > this.config.caching.quota.cleanupThreshold) {
          await this.cleanupCache();
        }
      } catch (error) {
        console.warn('Storage quota check failed:', error);
      }
    }
  }

  // Cleanup cache
  private async cleanupCache(): Promise<void> {
    try {
      const cache = await caches.open('mobile-network-cache');
      const keys = await cache.keys();

      // Sort by access time (oldest first)
      const keysWithTime = await Promise.all(
        keys.map(async key => {
          const response = await cache.match(key);
          const timestamp = parseInt(response?.headers.get('X-Cache-Time') || '0');
          return { key, timestamp };
        })
      );

      keysWithTime.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries until under quota
      const toRemove = Math.floor(keysWithTime.length * 0.2); // Remove 20%
      for (let i = 0; i < toRemove; i++) {
        await cache.delete(keysWithTime[i].key);
      }

      trackRUMEvent('mobile-cache-cleaned', {
        removedCount: toRemove,
        timestamp: Date.now()
      });

    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Check if request is offline capable
  private isOfflineCapable(url: string): boolean {
    return url.includes('/api/') && !url.includes('/auth/');
  }

  // Queue offline request
  private queueOfflineRequest(url: string, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const offlineRequest: OfflineDataSync = {
        id: this.generateRequestId(),
        type: 'create',
        endpoint: url,
        data: {
          method: init?.method || 'GET',
          headers: init?.headers,
          body: init?.body
        },
        timestamp: Date.now(),
        retries: 0
      };

      this.offlineSyncQueue.push(offlineRequest);

      // Store in offline storage
      this.storeOfflineRequest(offlineRequest);

      // Return mock response
      resolve(new Response(JSON.stringify({
        offline: true,
        queued: true,
        requestId: offlineRequest.id
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  }

  // Store offline request
  private async storeOfflineRequest(request: OfflineDataSync): Promise<void> {
    try {
      if (this.config.offline.storage.strategy === 'indexeddb' && 'indexedDB' in window) {
        await this.storeInIndexedDB('offlineRequests', request);
      } else {
        // Fallback to localStorage
        const existing = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
        existing.push(request);
        localStorage.setItem('offlineRequests', JSON.stringify(existing));
      }
    } catch (error) {
      console.warn('Failed to store offline request:', error);
    }
  }

  // Store in IndexedDB
  private async storeInIndexedDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MobileNetworkOptimizer', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(data);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Perform request with optimizations
  private async performRequest(url: string, init?: RequestInit): Promise<Response> {
    const options = { ...init };

    // Add compression headers
    if (this.config.requests.compression.enabled) {
      options.headers = {
        ...options.headers,
        'Accept-Encoding': this.getCompressionHeader()
      };
    }

    // Add timeout
    const controller = new AbortController();
    options.signal = controller.signal;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.requests.timeout.total);

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Get compression header
  private getCompressionHeader(): string {
    const { algorithm } = this.config.requests.compression;

    switch (algorithm) {
      case 'gzip':
        return 'gzip';
      case 'brotli':
        return 'br';
      case 'auto':
        return 'br, gzip, deflate';
      default:
        return 'gzip, deflate';
    }
  }

  // Handle request error
  private async handleRequestError(
    url: string,
    init?: RequestInit,
    error: Error,
    startTime: number
  ): Promise<Response> {
    // Check if should retry
    if (this.shouldRetry(error, init)) {
      return this.retryRequest(url, init, startTime);
    }

    // Record error metrics
    this.recordNetworkMetrics(url, init?.method || 'GET', null, startTime, false, error);

    // If offline and capable, queue for later
    if (!this.isOnline && this.isOfflineCapable(url)) {
      return this.queueOfflineRequest(url, init);
    }

    throw error;
  }

  // Should retry request
  private shouldRetry(error: Error, init?: RequestInit): boolean {
    if (!this.config.requests.retries.enabled) return false;

    const retryableErrors = [
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      'TimeoutError'
    ];

    const isRetryable = retryableErrors.some(err => error.message.includes(err));
    const isGetOrHead = !init?.method || ['GET', 'HEAD'].includes(init.method);

    return isRetryable && isGetOrHead;
  }

  // Retry request
  private async retryRequest(url: string, init?: RequestInit, startTime: number): Promise<Response> {
    const retryCount = parseInt(init?.headers?.['X-Retry-Count'] || '0') + 1;

    if (retryCount > this.config.requests.retries.maxRetries) {
      throw new Error(`Max retries exceeded for ${url}`);
    }

    // Calculate delay
    const delay = this.calculateRetryDelay(retryCount);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Add retry header
    const options = {
      ...init,
      headers: {
        ...init?.headers,
        'X-Retry-Count': retryCount.toString()
      }
    };

    trackRUMEvent('mobile-request-retry', {
      url,
      retryCount,
      delay,
      timestamp: Date.now()
    });

    return this.performOptimizedRequest(url, options);
  }

  // Calculate retry delay
  private calculateRetryDelay(retryCount: number): number {
    const { backoffStrategy, initialDelay, maxDelay } = this.config.requests.retries;

    switch (backoffStrategy) {
      case 'exponential':
        return Math.min(initialDelay * Math.pow(2, retryCount - 1), maxDelay);
      case 'linear':
        return Math.min(initialDelay * retryCount, maxDelay);
      case 'fixed':
        return initialDelay;
      default:
        return initialDelay;
    }
  }

  // Record network metrics
  private recordNetworkMetrics(
    url: string,
    method: string,
    response: Response | null,
    startTime: number,
    cacheHit: boolean,
    error?: Error
  ): void {
    const duration = performance.now() - startTime;

    const metrics: NetworkPerformanceMetrics = {
      timestamp: Date.now(),
      url,
      method,
      status: response?.status || 0,
      duration,
      size: {
        request: 0, // Would be measured from request
        response: response?.headers.get('content-length') ?
          parseInt(response.headers.get('content-length')!) : 0,
        compressed: response?.headers.get('content-encoding') ?
          parseInt(response.headers.get('content-length')!) : 0
      },
      cache: {
        hit: cacheHit,
        stale: cacheHit && response?.headers.get('X-Cache-Stale') === 'true'
      },
      network: {
        quality: this.networkQuality,
        type: this.networkMonitor?.type || 'unknown',
        downlink: this.networkMonitor?.downlink || 0,
        rtt: this.networkMonitor?.rtt || 0
      },
      performance: {
        ttfb: 0, // Would be measured from performance timing
        download: 0,
        processing: 0
      }
    };

    this.performanceMetrics.push(metrics);

    // Keep only recent metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    // Track RUM event
    trackRUMEvent('mobile-network-request', {
      url,
      method,
      status: metrics.status,
      duration,
      cacheHit,
      networkQuality: this.networkQuality,
      error: error?.message,
      timestamp: Date.now()
    });
  }

  // Initialize batching
  private initializeBatching(): void {
    if (!this.config.requests.batching.enabled) return;

    // Process any pending batches on page load
    setTimeout(() => {
      this.processPendingBatches();
    }, 1000);
  }

  // Process pending batches
  private processPendingBatches(): void {
    // This would restore any batches that were interrupted
    // during page navigation or crashes
  }

  // Initialize caching
  private initializeCaching(): void {
    if (!('caches' in window)) return;

    // Create cache
    caches.open('mobile-network-cache').then(cache => {
      // Pre-cache critical resources
      this.preCacheCriticalResources(cache);
    });
  }

  // Pre-cache critical resources
  private async preCacheCriticalResources(cache: Cache): Promise<void> {
    const criticalResources = [
      '/',
      '/api/services',
      '/api/availability'
    ];

    try {
      await cache.addAll(criticalResources);
    } catch (error) {
      console.warn('Failed to pre-cache critical resources:', error);
    }
  }

  // Initialize offline support
  private initializeOfflineSupport(): void {
    if (!this.config.offline.enabled) return;

    // Create offline indicator
    if (this.config.offline.indicators.showStatus) {
      this.createOfflineIndicator();
    }

    // Start offline sync
    if (this.config.offline.sync.enabled) {
      this.startOfflineSync();
    }

    // Load offline data
    this.loadOfflineData();
  }

  // Create offline indicator
  private createOfflineIndicator(): void {
    this.offlineIndicator = document.createElement('div');
    this.offlineIndicator.id = 'offline-indicator';
    this.offlineIndicator.className = 'offline-indicator';
    this.offlineIndicator.innerHTML = `
      <div class="offline-indicator-content">
        <span class="offline-icon">📶</span>
        <span class="offline-text">No internet connection</span>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .offline-indicator {
        position: fixed;
        ${this.config.offline.indicators.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 9999;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      }

      .offline-indicator.online {
        background: #51cf66;
      }

      .offline-indicator.show {
        transform: translateY(0);
      }

      .offline-indicator-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .offline-icon {
        font-size: 18px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.offlineIndicator);
  }

  // Update offline indicator
  private updateOfflineIndicator(): void {
    if (!this.offlineIndicator) return;

    if (this.isOnline) {
      this.offlineIndicator.className = 'offline-indicator online show';
      if (this.config.offline.indicators.autoHide) {
        setTimeout(() => {
          this.offlineIndicator!.className = 'offline-indicator online';
        }, this.config.offline.indicators.hideDelay);
      }
    } else {
      this.offlineIndicator.className = 'offline-indicator show';
    }
  }

  // Show status indicator
  private showStatusIndicator(type: 'online' | 'offline', message: string): void {
    if (!this.offlineIndicator) return;

    this.offlineIndicator.className = `offline-indicator ${type} show`;
    const textElement = this.offlineIndicator.querySelector('.offline-text');
    if (textElement) {
      textElement.textContent = message;
    }

    if (this.config.offline.indicators.autoHide) {
      setTimeout(() => {
        this.offlineIndicator!.className = `offline-indicator ${type}`;
      }, this.config.offline.indicators.hideDelay);
    }
  }

  // Start offline sync
  private startOfflineSync(): void {
    setInterval(() => {
      if (this.isOnline && this.offlineSyncQueue.length > 0) {
        this.syncOfflineData();
      }
    }, this.config.offline.sync.interval * 1000);
  }

  // Sync offline data
  private async syncOfflineData(): Promise<void> {
    if (this.offlineSyncQueue.length === 0) return;

    const requestsToSync = [...this.offlineSyncQueue];
    const results = await Promise.allSettled(
      requestsToSync.map(request => this.syncOfflineRequest(request))
    );

    // Remove successful syncs from queue
    this.offlineSyncQueue = this.offlineSyncQueue.filter((_, index) =>
      results[index].status === 'rejected'
    );

    // Update storage
    await this.updateOfflineStorage();

    trackRUMEvent('mobile-offline-sync', {
      totalRequests: requestsToSync.length,
      successfulRequests: results.filter(r => r.status === 'fulfilled').length,
      failedRequests: results.filter(r => r.status === 'rejected').length,
      timestamp: Date.now()
    });
  }

  // Sync offline request
  private async syncOfflineRequest(request: OfflineDataSync): Promise<void> {
    try {
      const response = await fetch(request.endpoint, request.data);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      trackRUMEvent('mobile-offline-request-synced', {
        requestId: request.id,
        endpoint: request.endpoint,
        timestamp: Date.now()
      });

    } catch (error) {
      request.retries++;

      if (request.retries < this.config.offline.sync.retryAttempts) {
        throw error; // Retry next time
      } else {
        // Max retries reached, mark as failed
        console.error(`Failed to sync offline request after ${request.retries} attempts:`, error);

        trackRUMEvent('mobile-offline-request-failed', {
          requestId: request.id,
          endpoint: request.endpoint,
          retries: request.retries,
          error: (error as Error).message,
          timestamp: Date.now()
        });
      }
    }
  }

  // Update offline storage
  private async updateOfflineStorage(): Promise<void> {
    try {
      if (this.config.offline.storage.strategy === 'indexeddb' && 'indexedDB' in window) {
        // Update IndexedDB
        await this.updateIndexedDB('offlineRequests', this.offlineSyncQueue);
      } else {
        // Update localStorage
        localStorage.setItem('offlineRequests', JSON.stringify(this.offlineSyncQueue));
      }
    } catch (error) {
      console.warn('Failed to update offline storage:', error);
    }
  }

  // Update IndexedDB
  private async updateIndexedDB(storeName: string, data: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MobileNetworkOptimizer', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        // Clear existing data
        store.clear();

        // Add new data
        data.forEach(item => {
          store.put(item);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Load offline data
  private loadOfflineData(): void {
    try {
      if (this.config.offline.storage.strategy === 'indexeddb' && 'indexedDB' in window) {
        this.loadFromIndexedDB('offlineRequests');
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('offlineRequests');
        if (stored) {
          this.offlineSyncQueue = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }
  }

  // Load from IndexedDB
  private async loadFromIndexedDB(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MobileNetworkOptimizer', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.getAll();

        getRequest.onsuccess = () => {
          this.offlineSyncQueue = getRequest.result;
          resolve();
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Initialize predictive optimization
  private initializePredictiveOptimization(): void {
    if (!this.config.predictive.enabled) return;

    // Track user behavior for predictions
    this.trackUserBehavior();

    // Start prefetching
    if (this.config.predictive.prefetching.enabled) {
      this.startPrefetching();
    }

    // Load predictive data
    this.loadPredictiveData();
  }

  // Track user behavior
  private trackUserBehavior(): void {
    // Track clicks and navigation
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        this.recordUserIntent(link.href, 'click');
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const action = form.action;

      if (action) {
        this.recordUserIntent(action, 'form');
      }
    });
  }

  // Record user intent
  private recordUserIntent(url: string, action: string): void {
    const existing = this.predictiveCache.get(url);
    const now = Date.now();

    if (existing) {
      existing.accessCount++;
      existing.lastAccessed = now;

      // Update probability based on access pattern
      const timeSinceLastAccess = now - existing.lastAccessed;
      const recencyScore = Math.max(0, 1 - timeSinceLastAccess / (7 * 24 * 60 * 60 * 1000)); // 7 days
      const frequencyScore = Math.min(existing.accessCount / 10, 1);

      existing.probability = (recencyScore + frequencyScore) / 2;
    } else {
      this.predictiveCache.set(url, {
        url,
        probability: 0.5, // Initial probability
        lastAccessed: now,
        accessCount: 1,
        priority: 1,
        size: 0
      });
    }

    // Update storage
    this.savePredictiveData();
  }

  // Start prefetching
  private startPrefetching(): void {
    // Use requestIdleCallback for prefetching
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.performPrefetching();
      });
    } else {
      setTimeout(() => {
        this.performPrefetching();
      }, this.config.predictive.prefetching.idleTime);
    }
  }

  // Perform prefetching
  private async performPrefetching(): Promise<void> {
    const candidates = Array.from(this.predictiveCache.values())
      .filter(data => data.probability >= this.config.predictive.preloading.confidence)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, this.config.predictive.preloading.maxResources);

    const prefetchPromises = candidates.map(data => this.prefetchResource(data));

    try {
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.warn('Prefetching failed:', error);
    }
  }

  // Prefetch resource
  private async prefetchResource(data: PredictiveData): Promise<void> {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = data.url;

      if (data.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        link.as = 'image';
      } else if (data.url.match(/\.css$/i)) {
        link.as = 'style';
      } else if (data.url.match(/\.js$/i)) {
        link.as = 'script';
      }

      document.head.appendChild(link);

      trackRUMEvent('mobile-resource-prefetched', {
        url: data.url,
        probability: data.probability,
        timestamp: Date.now()
      });

    } catch (error) {
      console.warn(`Failed to prefetch ${data.url}:`, error);
    }
  }

  // Load predictive data
  private loadPredictiveData(): void {
    try {
      const stored = localStorage.getItem('predictiveCache');
      if (stored) {
        const data = JSON.parse(stored);
        this.predictiveCache = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load predictive data:', error);
    }
  }

  // Save predictive data
  private savePredictiveData(): void {
    try {
      const data = Object.fromEntries(this.predictiveCache);
      localStorage.setItem('predictiveCache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save predictive data:', error);
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor network performance trends
    setInterval(() => {
      this.analyzeNetworkPerformance();
    }, 60000); // Every minute
  }

  // Analyze network performance
  private analyzeNetworkPerformance(): void {
    if (this.performanceMetrics.length < 10) return;

    const recentMetrics = this.performanceMetrics.slice(-50);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const cacheHitRate = recentMetrics.filter(m => m.cache.hit).length / recentMetrics.length;
    const errorRate = recentMetrics.filter(m => m.status >= 400).length / recentMetrics.length;

    trackRUMEvent('mobile-network-performance-analysis', {
      averageDuration: Math.round(avgDuration),
      cacheHitRate: Math.round(cacheHitRate * 100),
      errorRate: Math.round(errorRate * 100),
      networkQuality: this.networkQuality,
      timestamp: Date.now()
    });

    // Adjust strategies based on performance
    if (avgDuration > 3000) {
      this.increaseOptimizationLevel();
    } else if (avgDuration < 500 && cacheHitRate > 0.8) {
      this.decreaseOptimizationLevel();
    }
  }

  // Initialize adaptive strategies
  private initializeAdaptiveStrategies(): void {
    // Monitor and adapt continuously
    setInterval(() => {
      this.adaptStrategies();
    }, 300000); // Every 5 minutes
  }

  // Adapt strategies
  private adaptStrategies(): void {
    const context = this.getCurrentNetworkContext();

    // Adjust request strategies
    this.adjustRequestStrategies();

    // Adjust caching strategies
    this.adjustCachingStrategies();

    trackRUMEvent('mobile-strategies-adapted', {
      context,
      adaptations: this.getAdaptations(),
      timestamp: Date.now()
    });
  }

  // Get current network context
  private getCurrentNetworkContext(): any {
    return {
      networkQuality: this.networkQuality,
      isOnline: this.isOnline,
      connectionType: this.networkMonitor?.type,
      downlink: this.networkMonitor?.downlink,
      rtt: this.networkMonitor?.rtt,
      performanceScore: this.calculateNetworkPerformanceScore()
    };
  }

  // Calculate network performance score
  private calculateNetworkPerformanceScore(): number {
    if (this.performanceMetrics.length === 0) return 50;

    const recentMetrics = this.performanceMetrics.slice(-20);

    // Calculate various factors
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const cacheHitRate = recentMetrics.filter(m => m.cache.hit).length / recentMetrics.length;
    const errorRate = recentMetrics.filter(m => m.status >= 400).length / recentMetrics.length;

    // Score calculation (0-100)
    let score = 50;

    // Duration score (faster is better)
    if (avgDuration < 500) score += 30;
    else if (avgDuration < 1500) score += 15;
    else if (avgDuration > 3000) score -= 20;

    // Cache hit rate score
    score += cacheHitRate * 20;

    // Error rate penalty
    score -= errorRate * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Get adaptations
  private getAdaptations(): string[] {
    const adaptations: string[] = [];

    if (this.networkQuality === NetworkQuality.SLOW) {
      adaptations.push('reduced-image-quality', 'aggressive-caching', 'request-batching');
    }

    if (!this.isOnline) {
      adaptations.push('offline-mode', 'request-queueing', 'local-storage');
    }

    if (this.config.requests.batching.enabled) {
      adaptations.push('batch-requests');
    }

    if (this.config.predictive.enabled) {
      adaptations.push('predictive-prefetching');
    }

    return adaptations;
  }

  // Helper methods

  // Generate request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get batch ID
  private getBatchId(url: string): string {
    const endpoints = this.config.requests.batching.endpoints;
    for (const endpoint of endpoints) {
      if (url.includes(endpoint)) {
        return endpoint;
      }
    }
    return 'default';
  }

  // Process request queue
  private processRequestQueue(): void {
    const criticalRequests = this.requestQueue.filter(req => req.priority === 'critical');

    criticalRequests.forEach(request => {
      this.performOptimizedRequest(request.url, request.options)
        .then(response => request.resolve(response))
        .catch(error => request.reject(error));
    });

    this.requestQueue = this.requestQueue.filter(req => req.priority !== 'critical');
  }

  // Pause non-critical requests
  private pauseNonCriticalRequests(): void {
    // This would pause background requests, analytics, etc.
    trackRUMEvent('mobile-non-critical-requests-paused', {
      timestamp: Date.now()
    });
  }

  // Enable offline mode
  private enableOfflineMode(): void {
    // Enable offline-specific features
    document.body.classList.add('offline-mode');

    trackRUMEvent('mobile-offline-mode-enabled', {
      timestamp: Date.now()
    });
  }

  // Update offline capabilities
  private updateOfflineCapabilities(): void {
    // Adjust offline features based on network quality
    if (this.networkQuality === NetworkQuality.SLOW) {
      // More aggressive offline support
      this.config.offline.sync.interval = 60; // 1 minute
    } else {
      this.config.offline.sync.interval = 30; // 30 seconds
    }
  }

  // Clear stale cache
  private clearStaleCache(): void {
    if ('caches' in window) {
      caches.open('mobile-network-cache').then(cache => {
        // This would clear very stale entries
        trackRUMEvent('mobile-stale-cache-cleared', {
          timestamp: Date.now()
        });
      });
    }
  }

  // Adjust request strategies
  private adjustRequestStrategies(): void {
    if (this.networkQuality === NetworkQuality.SLOW) {
      this.config.requests.batching.enabled = true;
      this.config.requests.batching.maxBatchSize = 5;
      this.config.requests.batching.batchTimeout = 200;
    } else if (this.networkQuality === NetworkQuality.EXCELLENT) {
      this.config.requests.batching.enabled = false;
    }
  }

  // Adjust caching strategies
  private adjustCachingStrategies(): void {
    if (this.networkQuality === NetworkQuality.SLOW) {
      this.config.caching.ttl.api = 600; // 10 minutes
      this.config.caching.ttl.images = 1209600; // 14 days
    } else {
      this.config.caching.ttl.api = 300; // 5 minutes
      this.config.caching.ttl.images = 604800; // 7 days
    }
  }

  // Increase optimization level
  private increaseOptimizationLevel(): void {
    this.config.requests.batching.enabled = true;
    this.config.caching.ttl.api = Math.min(this.config.caching.ttl.api * 2, 1800);
    this.config.predictive.preloading.confidence = Math.max(
      this.config.predictive.preloading.confidence - 0.1,
      0.5
    );
  }

  // Decrease optimization level
  private decreaseOptimizationLevel(): void {
    this.config.requests.batching.enabled = false;
    this.config.caching.ttl.api = Math.max(this.config.caching.ttl.api / 2, 60);
    this.config.predictive.preloading.confidence = Math.min(
      this.config.predictive.preloading.confidence + 0.05,
      0.9
    );
  }

  // Public API methods

  // Get network quality
  getNetworkQuality(): NetworkQuality {
    return this.networkQuality;
  }

  // Get online status
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get performance metrics
  getPerformanceMetrics(): NetworkPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  // Get configuration
  getConfiguration(): NetworkOptimizationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfiguration(config: Partial<NetworkOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Force sync offline data
  async forceSyncOfflineData(): Promise<void> {
    if (this.isOnline) {
      await this.syncOfflineData();
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      await caches.delete('mobile-network-cache');
    }
    this.predictiveCache.clear();
    localStorage.removeItem('predictiveCache');
  }

  // Export optimizer data
  exportData(): any {
    return {
      config: this.config,
      networkQuality: this.networkQuality,
      isOnline: this.isOnline,
      performanceMetrics: this.performanceMetrics,
      offlineSyncQueue: this.offlineSyncQueue,
      predictiveCache: Object.fromEntries(this.predictiveCache),
      exportTimestamp: Date.now()
    };
  }
}

// Create and export singleton instance
export const mobileNetworkOptimizer = MobileNetworkOptimizer.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobileNetworkOptimizer.initialize();
  } else {
    window.addEventListener('load', () => {
      mobileNetworkOptimizer.initialize();
    });
  }
}

// Export helper functions
export const initializeMobileNetworkOptimizer = (config?: Partial<NetworkOptimizationConfig>) =>
  mobileNetworkOptimizer.initialize(config);
export const getMobileNetworkQuality = () => mobileNetworkOptimizer.getNetworkQuality();
export const isMobileOnline = () => mobileNetworkOptimizer.isOnlineStatus();
export const getMobileNetworkMetrics = () => mobileNetworkOptimizer.getPerformanceMetrics();
export const syncMobileOfflineData = () => mobileNetworkOptimizer.forceSyncOfflineData();
export const clearMobileNetworkCache = () => mobileNetworkOptimizer.clearCache();
export const exportMobileNetworkOptimizerData = () => mobileNetworkOptimizer.exportData();

// Export optimized fetch
export const optimizedFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  (window as any).optimizedFetch(input, init);

// Export types
export {
  NetworkOptimizationConfig,
  QueuedRequest,
  NetworkPerformanceMetrics,
  OfflineDataSync,
  PredictiveData
};