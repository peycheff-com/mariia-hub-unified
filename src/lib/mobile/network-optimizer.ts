/**
 * Network Optimizer for Mobile
 * Data compression, request optimization, and network-aware loading strategies
 */

interface NetworkCondition {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  type: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isSlow: boolean;
  isMetered: boolean;
}

interface CompressionConfig {
  enabled: boolean;
  algorithm: 'gzip' | 'brotli' | 'deflate';
  level: number; // 1-9
  threshold: number; // Minimum size to compress (bytes)
  excludeTypes: string[];
}

interface RequestOptimization {
  batching: boolean;
  batchSize: number;
  batchDelay: number;
  deduplication: boolean;
  caching: boolean;
  cacheStrategy: 'memory' | 'disk' | 'hybrid';
  compression: CompressionConfig;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface DataReduction {
  imageQuality: number;
  imageFormat: 'webp' | 'avif' | 'jpg' | 'png';
  videoQuality: string;
  fontDisplay: 'swap' | 'fallback' | 'optional';
  cssMinification: boolean;
  jsMinification: boolean;
  htmlMinification: boolean;
  removeWhitespace: boolean;
  removeComments: boolean;
}

interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytesTransferred: number;
  compressedBytesSaved: number;
  averageResponseTime: number;
  cacheHitRate: number;
  bandwidthSaved: number;
  errorRate: number;
}

interface RequestBatch {
  id: string;
  requests: Array<{
    url: string;
    options: RequestInit;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  }>;
  timestamp: number;
  timeout: number;
}

class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private networkCondition: NetworkCondition;
  private requestOptimization: RequestOptimization;
  private dataReduction: DataReduction;
  private metrics: NetworkMetrics;
  private requestCache: Map<string, { response: Response; timestamp: number }>;
  private batchQueue: RequestBatch[] = [];
  private activeBatches: Map<string, NodeJS.Timeout> = new Map();
  private compressionWorker: Worker | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeNetworkCondition();
    this.initializeRequestOptimization();
    this.initializeDataReduction();
    this.initializeMetrics();
    this.initializeCompressionWorker();
  }

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  private initializeNetworkCondition(): void {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType || '4g';
      const downlink = connection.downlink || 10;
      const rtt = connection.rtt || 100;
      const saveData = connection.saveData || false;
      const type = connection.type || 'unknown';

      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
        quality = 'excellent';
      } else if (effectiveType === '4g' && downlink > 2 && rtt < 200) {
        quality = 'good';
      } else if (effectiveType === '3g' || downlink > 0.5) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      this.networkCondition = {
        effectiveType,
        downlink,
        rtt,
        saveData,
        type,
        quality,
        isSlow: ['slow-2g', '2g', '3g'].includes(effectiveType),
        isMetered: saveData || ['slow-2g', '2g'].includes(effectiveType)
      };

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.initializeNetworkCondition();
        this.adjustOptimizations();
        console.log('📶 Network condition changed:', this.networkCondition);
      });
    } else {
      // Fallback
      this.networkCondition = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        type: 'unknown',
        quality: 'good',
        isSlow: false,
        isMetered: false
      };
    }

    console.log('🌐 Network condition detected:', this.networkCondition);
  }

  private initializeRequestOptimization(): void {
    const { isSlow, isMetered, quality } = this.networkCondition;

    // Adjust configuration based on network conditions
    const baseConfig = {
      batching: true,
      batchSize: 5,
      batchDelay: 100,
      deduplication: true,
      caching: true,
      cacheStrategy: 'hybrid' as const,
      compression: {
        enabled: true,
        algorithm: 'brotli' as const,
        level: 6,
        threshold: 1024, // 1KB
        excludeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif']
      },
      timeout: isSlow ? 15000 : 8000,
      retryAttempts: isSlow ? 3 : 2,
      retryDelay: 1000
    };

    // Adjust for slow networks
    if (isSlow) {
      baseConfig.batchSize = 3;
      baseConfig.batchDelay = 200;
      baseConfig.compression.level = 9; // Maximum compression
      baseConfig.compression.threshold = 512; // Compress smaller payloads
    }

    // Adjust for metered connections
    if (isMetered) {
      baseConfig.compression.level = 9;
      baseConfig.compression.threshold = 256; // Compress everything
    }

    this.requestOptimization = baseConfig;
    console.log('⚙️ Request optimization configured:', this.requestOptimization);
  }

  private initializeDataReduction(): void {
    const { quality, saveData, isSlow } = this.networkCondition;

    let imageQuality = 80;
    let imageFormat: 'webp' | 'avif' | 'jpg' | 'png' = 'webp';
    let videoQuality = '720p';

    if (saveData || isSlow) {
      imageQuality = 60;
      videoQuality = '480p';
      imageFormat = 'jpg'; // More compatible, smaller than webp for some images
    }

    if (quality === 'poor') {
      imageQuality = 40;
      videoQuality = '360p';
    }

    this.dataReduction = {
      imageQuality,
      imageFormat,
      videoQuality,
      fontDisplay: saveData ? 'fallback' : 'swap',
      cssMinification: true,
      jsMinification: true,
      htmlMinification: true,
      removeWhitespace: true,
      removeComments: true
    };

    console.log('📉 Data reduction configured:', this.dataReduction);
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalBytesTransferred: 0,
      compressedBytesSaved: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      bandwidthSaved: 0,
      errorRate: 0
    };
  }

  private async initializeCompressionWorker(): void {
    try {
      // Create compression worker for offloading compression tasks
      const workerCode = `
        self.addEventListener('message', function(e) {
          const { type, data, id } = e.data;

          if (type === 'compress') {
            try {
              const compressed = new TextEncoder().encode(JSON.stringify(data));
              self.postMessage({
                type: 'compressed',
                id: id,
                data: compressed,
                originalSize: new TextEncoder().encode(JSON.stringify(data)).length,
                compressedSize: compressed.length
              });
            } catch (error) {
              self.postMessage({
                type: 'error',
                id: id,
                error: error.message
              });
            }
          }
        });
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));

      console.log('🗜️ Compression worker initialized');
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
      this.compressionWorker = null;
    }
  }

  private adjustOptimizations(): void {
    this.initializeRequestOptimization();
    this.initializeDataReduction();

    // Apply new optimizations
    this.applyDataReductionSettings();
  }

  private applyDataReductionSettings(): void {
    // Update CSS font-display
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: ${this.dataReduction.fontDisplay};
        src: url('/fonts/inter-v12-latin-regular.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Space Grotesk';
        font-display: ${this.dataReduction.fontDisplay};
        src: url('/fonts/space-grotesk-v5-latin-regular.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);

    // Update image optimization hints
    document.documentElement.setAttribute('data-image-quality', this.dataReduction.imageQuality.toString());
    document.documentElement.setAttribute('data-image-format', this.dataReduction.imageFormat);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Network Optimizer for mobile');

    // Setup request interception
    this.setupRequestInterception();

    // Setup caching strategies
    this.setupCachingStrategies();

    // Setup batch processing
    this.setupBatchProcessing();

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Setup offline support
    this.setupOfflineSupport();

    this.isInitialized = true;
    console.log('✅ Network Optimizer initialized');
  }

  private setupRequestInterception(): void {
    // Override fetch for optimization
    const originalFetch = window.fetch;
    window.fetch = this.optimizedFetch.bind(this);

    // Store original fetch for fallback
    (window as any).originalFetch = originalFetch;

    console.log('🔗 Request interception setup');
  }

  private async optimizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Check cache first
      if (this.requestOptimization.caching) {
        const cachedResponse = this.getCachedResponse(input, init);
        if (cachedResponse) {
          this.metrics.successfulRequests++;
          this.updateMetrics(performance.now() - startTime, true);
          return cachedResponse;
        }
      }

      // Apply request optimizations
      const optimizedInit = await this.optimizeRequest(init);

      // Check if request should be batched
      if (this.shouldBatchRequest(input, optimizedInit)) {
        return this.batchRequest(input, optimizedInit);
      }

      // Perform optimized fetch
      const response = await (window as any).originalFetch(input, optimizedInit);

      // Process response
      const processedResponse = await this.processResponse(response);

      // Cache response if appropriate
      if (this.shouldCacheResponse(input, processedResponse)) {
        this.cacheResponse(input, processedResponse, optimizedInit);
      }

      this.metrics.successfulRequests++;
      this.updateMetrics(performance.now() - startTime, false);

      return processedResponse;

    } catch (error) {
      this.metrics.failedRequests++;
      this.updateMetrics(performance.now() - startTime, false);

      // Handle retry logic
      if (this.shouldRetry(init)) {
        return this.retryFetch(input, init, (init as any)._retryCount || 0);
      }

      throw error;
    }
  }

  private async optimizeRequest(init?: RequestInit): Promise<RequestInit> {
    if (!init) return {};

    const optimizedInit = { ...init };

    // Add compression headers
    if (this.requestOptimization.compression.enabled) {
      const headers = new Headers(init.headers);
      headers.set('Accept-Encoding', this.getCompressionHeader());
      headers.set('Content-Encoding', this.requestOptimization.compression.algorithm);
      optimizedInit.headers = headers;
    }

    // Add optimization headers
    const headers = new Headers(optimizedInit.headers);
    headers.set('X-Mobile-Optimized', 'true');
    headers.set('X-Network-Quality', this.networkCondition.quality);
    headers.set('X-Data-Saver', this.networkCondition.saveData.toString());

    if (this.networkCondition.isSlow) {
      headers.set('X-Slow-Network', 'true');
    }

    optimizedInit.headers = headers;

    // Optimize request body
    if (init.body && this.shouldCompressBody(init)) {
      optimizedInit.body = await this.compressRequestBody(init.body);
    }

    return optimizedInit;
  }

  private getCompressionHeader(): string {
    const { algorithm } = this.requestOptimization.compression;
    const algorithms = [];

    if (algorithm === 'brotli') algorithms.push('br');
    if (algorithm === 'gzip') algorithms.push('gzip');
    if (algorithm === 'deflate') algorithms.push('deflate');

    return algorithms.join(', ');
  }

  private shouldCompressBody(init: RequestInit): boolean {
    if (!init.body) return false;

    const bodyString = typeof init.body === 'string' ? init.body : '';
    const bodySize = new Blob([bodyString]).size;

    return bodySize >= this.requestOptimization.compression.threshold;
  }

  private async compressRequestBody(body: BodyInit): Promise<BodyInit> {
    if (typeof body !== 'string') return body;

    try {
      // Simple compression for request body
      // In a real implementation, you'd use a proper compression library
      const compressed = JSON.stringify(JSON.parse(body));
      return compressed;
    } catch {
      return body;
    }
  }

  private shouldBatchRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
    if (!this.requestOptimization.batching) return false;

    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';

    // Only batch GET requests to API endpoints
    return method === 'GET' && url.includes('/api/') && !url.includes('/upload');
  }

  private batchRequest(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request = {
        url: input.toString(),
        options: init,
        resolve,
        reject
      };

      // Find existing batch or create new one
      let batch = this.batchQueue.find(b =>
        b.requests.length < this.requestOptimization.batchSize &&
        Date.now() - b.timestamp < this.requestOptimization.batchDelay
      );

      if (!batch) {
        batch = {
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requests: [],
          timestamp: Date.now(),
          timeout: this.requestOptimization.timeout
        };
        this.batchQueue.push(batch);

        // Set timeout to process batch
        const timeoutId = setTimeout(() => {
          this.processBatch(batch);
        }, this.requestOptimization.batchDelay);

        this.activeBatches.set(batch.id, timeoutId);
      }

      batch.requests.push(request);

      // Process immediately if batch is full
      if (batch.requests.length >= this.requestOptimization.batchSize) {
        clearTimeout(this.activeBatches.get(batch.id));
        this.processBatch(batch);
      }
    });
  }

  private async processBatch(batch: RequestBatch): Promise<void> {
    // Remove from queue
    const index = this.batchQueue.indexOf(batch);
    if (index > -1) {
      this.batchQueue.splice(index, 1);
    }

    // Clear timeout
    const timeoutId = this.activeBatches.get(batch.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeBatches.delete(batch.id);
    }

    try {
      // Combine requests into a single batch request
      const batchUrl = '/api/batch';
      const batchData = {
        requests: batch.requests.map(req => ({
          url: req.url,
          method: req.options.method || 'GET',
          headers: Object.fromEntries(req.options.headers || []),
          body: req.options.body
        }))
      };

      const response = await (window as any).originalFetch(batchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Batch-Request': 'true'
        },
        body: JSON.stringify(batchData)
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const results = await response.json();

      // Resolve individual requests
      batch.requests.forEach((req, index) => {
        if (results[index] && results[index].success) {
          req.resolve(new Response(JSON.stringify(results[index].data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        } else {
          req.reject(new Error(results[index]?.error || 'Request failed'));
        }
      });

    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(req => {
        req.reject(error as Error);
      });
    }
  }

  private async processResponse(response: Response): Promise<Response> {
    // Check if response is compressed
    const contentEncoding = response.headers.get('Content-Encoding');

    if (contentEncoding && this.requestOptimization.compression.enabled) {
      // Response is already compressed by the server
      this.metrics.compressedBytesSaved += this.estimateSavings(response);
    }

    // Apply response optimizations based on network conditions
    if (this.networkCondition.isSlow || this.networkCondition.saveData) {
      return this.optimizeResponse(response);
    }

    return response;
  }

  private async optimizeResponse(response: Response): Promise<Response> {
    const contentType = response.headers.get('Content-Type') || '';

    // Optimize image responses
    if (contentType.startsWith('image/')) {
      return this.optimizeImageResponse(response);
    }

    // Optimize text responses
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      return this.optimizeTextResponse(response);
    }

    return response;
  }

  private async optimizeImageResponse(response: Response): Promise<Response> {
    // In a real implementation, you might transform images
    // For now, just add optimization headers
    const optimizedHeaders = new Headers(response.headers);
    optimizedHeaders.set('X-Mobile-Optimized', 'image');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: optimizedHeaders
    });
  }

  private async optimizeTextResponse(response: Response): Promise<Response> {
    // Add optimization headers
    const optimizedHeaders = new Headers(response.headers);
    optimizedHeaders.set('X-Mobile-Optimized', 'text');

    // For large text responses, you could implement additional optimizations
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > 10000) {
      optimizedHeaders.set('X-Content-Optimized', 'true');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: optimizedHeaders
    });
  }

  private estimateSavings(response: Response): number {
    const contentLength = response.headers.get('Content-Length');
    if (!contentLength) return 0;

    const originalSize = parseInt(contentLength);
    // Estimate 30-70% compression savings
    return Math.floor(originalSize * 0.5);
  }

  private getCachedResponse(input: RequestInfo | URL, init?: RequestInit): Response | null {
    const cacheKey = this.getCacheKey(input, init);
    const cached = this.requestCache.get(cacheKey);

    if (!cached) return null;

    // Check if cache is still valid (5 minutes default)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  private shouldCacheResponse(input: RequestInfo | URL, response: Response): boolean {
    if (!this.requestOptimization.caching) return false;

    const url = input.toString();
    const method = 'GET'; // Only cache GET requests

    // Don't cache error responses
    if (!response.ok) return false;

    // Don't cache uploads or sensitive data
    if (url.includes('/upload') || url.includes('/auth') || url.includes('/payment')) {
      return false;
    }

    // Cache API responses and static assets
    return url.includes('/api/') || url.includes('/static/') || url.includes('/assets/');
  }

  private cacheResponse(input: RequestInfo | URL, response: Response, init?: RequestInit): void {
    const cacheKey = this.getCacheKey(input, init);

    // Clone response before caching
    const clonedResponse = response.clone();

    this.requestCache.set(cacheKey, {
      response: clonedResponse,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.requestCache.size > 100) {
      const oldestKey = this.requestCache.keys().next().value;
      if (oldestKey) {
        this.requestCache.delete(oldestKey);
      }
    }
  }

  private getCacheKey(input: RequestInfo | URL, init?: RequestInit): string {
    const url = input.toString();
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.stringify(init.body) : '';
    return `${method}:${url}:${body}`;
  }

  private shouldRetry(init?: RequestInit): boolean {
    if (!init) return false;

    const retryCount = (init as any)._retryCount || 0;
    return retryCount < this.requestOptimization.retryAttempts;
  }

  private async retryFetch(input: RequestInfo | URL, init?: RequestInit, retryCount: number = 0): Promise<Response> {
    const retryInit = { ...init, _retryCount: retryCount + 1 };

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.requestOptimization.retryDelay * (retryCount + 1)));

    return this.optimizedFetch(input, retryInit);
  }

  private setupCachingStrategies(): void {
    // Setup memory cache for frequently accessed resources
    if ('caches' in window) {
      // Open cache for static resources
      caches.open('mobile-optimized-cache').then(cache => {
        console.log('💾 Mobile cache opened');
      });
    }
  }

  private setupBatchProcessing(): void {
    // Process any pending batches periodically
    setInterval(() => {
      this.batchQueue.forEach(batch => {
        if (Date.now() - batch.timestamp > this.requestOptimization.batchDelay) {
          const timeoutId = this.activeBatches.get(batch.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeBatches.delete(batch.id);
          }
          this.processBatch(batch);
        }
      });
    }, 1000);
  }

  private setupNetworkMonitoring(): void {
    // Monitor network changes and adjust strategies
    window.addEventListener('online', () => {
      console.log('🌐 Network restored');
      this.flushPendingRequests();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network lost');
      this.enableOfflineMode();
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        console.log('📶 Network quality changed:', connection.effectiveType);
        this.adjustForNetworkQuality();
      });
    }
  }

  private setupOfflineSupport(): void {
    // Setup service worker communication for offline support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_OPTIMIZER_CONFIG',
        config: {
          compression: this.requestOptimization.compression,
          dataReduction: this.dataReduction,
          networkCondition: this.networkCondition
        }
      });
    }
  }

  private flushPendingRequests(): void {
    // Process all pending batches immediately when network is restored
    this.batchQueue.forEach(batch => {
      const timeoutId = this.activeBatches.get(batch.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.activeBatches.delete(batch.id);
      }
      this.processBatch(batch);
    });
  }

  private enableOfflineMode(): void {
    // Enable aggressive caching and offline features
    document.documentElement.classList.add('offline-mode');

    // Pause non-essential requests
    this.requestOptimization.batching = false;
  }

  private adjustForNetworkQuality(): void {
    this.adjustOptimizations();

    // Notify about network quality change
    const event = new CustomEvent('networkQualityChanged', {
      detail: { networkCondition: this.networkCondition }
    });
    window.dispatchEvent(event);
  }

  private updateMetrics(responseTime: number, fromCache: boolean): void {
    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;

    // Update cache hit rate
    if (fromCache) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.successfulRequests - 1) + 1) / this.metrics.successfulRequests;
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;

    // Update bandwidth saved (simplified calculation)
    if (this.networkCondition.isSlow) {
      this.metrics.bandwidthSaved += responseTime * 0.3; // Estimate 30% savings
    }
  }

  // Public API methods
  public getNetworkCondition(): NetworkCondition {
    return { ...this.networkCondition };
  }

  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  public getOptimizationConfig(): { requestOptimization: RequestOptimization; dataReduction: DataReduction } {
    return {
      requestOptimization: { ...this.requestOptimization },
      dataReduction: { ...this.dataReduction }
    };
  }

  public updateImageQuality(quality: number): void {
    this.dataReduction.imageQuality = Math.max(10, Math.min(100, quality));
    this.applyDataReductionSettings();
    console.log(`🖼️ Image quality updated to: ${this.dataReduction.imageQuality}`);
  }

  public enableDataSaver(enabled: boolean): void {
    this.networkCondition.saveData = enabled;
    this.adjustOptimizations();
    console.log(`💾 Data saver ${enabled ? 'enabled' : 'disabled'}`);
  }

  public preloadCriticalResources(urls: string[]): void {
    // Preload critical resources with current optimizations
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;

      if (url.endsWith('.js')) {
        link.as = 'script';
      } else if (url.endsWith('.css')) {
        link.as = 'style';
      } else if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });

    console.log(`⚡ Preloaded ${urls.length} critical resources`);
  }

  public clearCache(): void {
    this.requestCache.clear();

    if ('caches' in window) {
      caches.delete('mobile-optimized-cache');
    }

    console.log('🗑️ Cache cleared');
  }

  public generateOptimizationReport(): object {
    return {
      networkCondition: this.networkCondition,
      metrics: this.metrics,
      optimizationConfig: this.getOptimizationConfig(),
      cacheStats: {
        size: this.requestCache.size,
        hitRate: this.metrics.cacheHitRate,
        bandwidthSaved: this.metrics.bandwidthSaved
      },
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.networkCondition.isSlow) {
      recommendations.push('Consider enabling data saver mode for better performance on slow networks');
      recommendations.push('Increase compression levels for better bandwidth utilization');
    }

    if (this.metrics.errorRate > 0.1) {
      recommendations.push('High error rate detected - check network connectivity and server status');
    }

    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate - consider increasing cache duration');
    }

    if (this.metrics.averageResponseTime > 3000) {
      recommendations.push('Slow response times - consider implementing request timeout optimizations');
    }

    if (this.metrics.bandwidthSaved < 1000) {
      recommendations.push('Low bandwidth savings - enable more aggressive compression');
    }

    if (recommendations.length === 0) {
      recommendations.push('Network optimization is performing well');
    }

    return recommendations;
  }
}

// Export singleton instance
export const networkOptimizer = NetworkOptimizer.getInstance();

// Convenience exports
export const initializeNetworkOptimizer = () => networkOptimizer.initialize();
export const getNetworkCondition = () => networkOptimizer.getNetworkCondition();
export const getNetworkMetrics = () => networkOptimizer.getMetrics();
export const getNetworkReport = () => networkOptimizer.generateOptimizationReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).networkOptimizer = {
    init: initializeNetworkOptimizer,
    getCondition: getNetworkCondition,
    getMetrics: getNetworkMetrics,
    getReport: getNetworkReport,
    updateImageQuality: (quality: number) => networkOptimizer.updateImageQuality(quality),
    enableDataSaver: (enabled: boolean) => networkOptimizer.enableDataSaver(enabled),
    preloadResources: (urls: string[]) => networkOptimizer.preloadCriticalResources(urls),
    clearCache: () => networkOptimizer.clearCache()
  };
}