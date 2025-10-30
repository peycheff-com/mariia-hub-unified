/**
 * Mobile Bundle Optimizer
 * Advanced code splitting and bundle optimization for mobile devices
 */

interface BundleChunk {
  name: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

interface LoadingPlan {
  criticalChunks: string[];
  immediateChunks: string[];
  deferredChunks: string[];
  lazyChunks: string[];
  prefetchChunks: string[];
}

interface DeviceProfile {
  memory: number;
  cores: number;
  connectionSpeed: 'fast' | 'medium' | 'slow';
  batteryLevel: 'high' | 'medium' | 'low';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  performanceTier: 'high' | 'medium' | 'low';
}

interface ChunkLoadingStrategy {
  maxConcurrentLoads: number;
  timeoutDuration: number;
  retryAttempts: number;
  retryDelay: number;
  compressionEnabled: boolean;
  cacheStrategy: 'memory' | 'disk' | 'hybrid';
}

class BundleOptimizer {
  private static instance: BundleOptimizer;
  private deviceProfile: DeviceProfile;
  private chunks: Map<string, BundleChunk> = new Map();
  private loadingPlan: LoadingPlan;
  private loadingStrategy: ChunkLoadingStrategy;
  private loadingQueue: string[] = [];
  private activeLoads: Set<string> = new Set();
  private loadedChunks: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private retryCounters: Map<string, number> = new Map();

  private constructor() {
    this.analyzeDevice();
    this.defineChunkStructure();
    this.createLoadingPlan();
    this.setupLoadingStrategy();
  }

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  private analyzeDevice(): void {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = (navigator as any).connection || {};
    const userAgent = navigator.userAgent;

    // Determine device type
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Determine performance tier
    let performanceTier: 'high' | 'medium' | 'low';
    if (memory >= 8 && cores >= 8) {
      performanceTier = 'high';
    } else if (memory >= 4 && cores >= 4) {
      performanceTier = 'medium';
    } else {
      performanceTier = 'low';
    }

    // Adjust for mobile devices
    if (deviceType === 'mobile' && memory >= 6) {
      performanceTier = 'high';
    } else if (deviceType === 'mobile' && memory >= 4) {
      performanceTier = 'medium';
    } else if (deviceType === 'mobile') {
      performanceTier = 'low';
    }

    this.deviceProfile = {
      memory,
      cores,
      connectionSpeed: this.getConnectionSpeed(connection),
      batteryLevel: 'high', // Will be updated if Battery API is available
      deviceType,
      performanceTier
    };

    console.log('📱 Device profile analyzed:', this.deviceProfile);
  }

  private getConnectionSpeed(connection: any): 'fast' | 'medium' | 'slow' {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink || 10;

    if (effectiveType === '4g' && downlink > 2) return 'fast';
    if (effectiveType === '3g' || downlink > 0.5) return 'medium';
    return 'slow';
  }

  private defineChunkStructure(): void {
    // Define all application chunks with their characteristics
    const chunkDefinitions = [
      // Critical chunks - loaded immediately
      {
        name: 'runtime',
        priority: 'critical' as const,
        dependencies: [],
        estimatedSize: 50
      },
      {
        name: 'vendor-core',
        priority: 'critical' as const,
        dependencies: ['runtime'],
        estimatedSize: 200
      },
      {
        name: 'app-core',
        priority: 'critical' as const,
        dependencies: ['vendor-core'],
        estimatedSize: 100
      },

      // High priority chunks - loaded after critical
      {
        name: 'booking-core',
        priority: 'high' as const,
        dependencies: ['app-core'],
        estimatedSize: 150
      },
      {
        name: 'ui-components',
        priority: 'high' as const,
        dependencies: ['app-core'],
        estimatedSize: 120
      },
      {
        name: 'api-client',
        priority: 'high' as const,
        dependencies: ['app-core'],
        estimatedSize: 80
      },

      // Medium priority chunks - loaded on demand
      {
        name: 'booking-wizard',
        priority: 'medium' as const,
        dependencies: ['booking-core', 'ui-components'],
        estimatedSize: 100
      },
      {
        name: 'service-catalog',
        priority: 'medium' as const,
        dependencies: ['ui-components', 'api-client'],
        estimatedSize: 90
      },
      {
        name: 'user-dashboard',
        priority: 'medium' as const,
        dependencies: ['ui-components', 'api-client'],
        estimatedSize: 110
      },

      // Low priority chunks - loaded when needed
      {
        name: 'admin-dashboard',
        priority: 'low' as const,
        dependencies: ['user-dashboard'],
        estimatedSize: 200
      },
      {
        name: 'analytics',
        priority: 'low' as const,
        dependencies: ['admin-dashboard'],
        estimatedSize: 150
      },
      {
        name: 'cms-editor',
        priority: 'low' as const,
        dependencies: ['admin-dashboard'],
        estimatedSize: 180
      },

      // Feature-specific chunks
      {
        name: 'payment-processing',
        priority: 'high' as const,
        dependencies: ['booking-core', 'api-client'],
        estimatedSize: 100
      },
      {
        name: 'image-gallery',
        priority: 'medium' as const,
        dependencies: ['ui-components'],
        estimatedSize: 80
      },
      {
        name: 'notifications',
        priority: 'medium' as const,
        dependencies: ['api-client'],
        estimatedSize: 60
      },

      // Mobile-specific optimizations
      {
        name: 'mobile-ui',
        priority: 'high' as const,
        dependencies: ['ui-components'],
        estimatedSize: 70
      },
      {
        name: 'touch-gestures',
        priority: 'medium' as const,
        dependencies: ['mobile-ui'],
        estimatedSize: 40
      },
      {
        name: 'offline-support',
        priority: 'medium' as const,
        dependencies: ['api-client'],
        estimatedSize: 90
      },

      // Luxury features
      {
        name: 'luxury-animations',
        priority: 'low' as const,
        dependencies: ['mobile-ui'],
        estimatedSize: 60
      },
      {
        name: 'advanced-effects',
        priority: 'low' as const,
        dependencies: ['luxury-animations'],
        estimatedSize: 80
      },

      // External integrations
      {
        name: 'stripe-elements',
        priority: 'medium' as const,
        dependencies: ['payment-processing'],
        estimatedSize: 120
      },
      {
        name: 'google-analytics',
        priority: 'low' as const,
        dependencies: [],
        estimatedSize: 50
      },
      {
        name: 'social-widgets',
        priority: 'low' as const,
        dependencies: [],
        estimatedSize: 70
      }
    ];

    // Create chunk objects
    chunkDefinitions.forEach(def => {
      this.chunks.set(def.name, {
        ...def,
        size: def.estimatedSize,
        loaded: false,
        loading: false,
        error: false
      });
    });

    console.log(`📦 Defined ${this.chunks.size} application chunks`);
  }

  private createLoadingPlan(): void {
    const { performanceTier, connectionSpeed, deviceType } = this.deviceProfile;

    // Base loading plan
    const basePlan: LoadingPlan = {
      criticalChunks: ['runtime', 'vendor-core', 'app-core'],
      immediateChunks: ['booking-core', 'ui-components', 'api-client'],
      deferredChunks: ['booking-wizard', 'service-catalog', 'user-dashboard'],
      lazyChunks: ['admin-dashboard', 'analytics', 'cms-editor'],
      prefetchChunks: ['image-gallery', 'notifications']
    };

    // Adjust based on device profile
    if (deviceType === 'mobile') {
      basePlan.immediateChunks.push('mobile-ui');
      basePlan.deferredChunks.push('touch-gestures', 'offline-support');

      // Remove luxury features for low-end mobile devices
      if (performanceTier === 'low') {
        basePlan.lazyChunks = basePlan.lazyChunks.filter(c =>
          !['luxury-animations', 'advanced-effects'].includes(c)
        );
      }
    }

    // Adjust based on connection speed
    if (connectionSpeed === 'slow') {
      // Move some chunks to lazy loading on slow connections
      const moveToLazy = ['image-gallery', 'social-widgets'];
      moveToLazy.forEach(chunk => {
        const index = basePlan.deferredChunks.indexOf(chunk);
        if (index > -1) {
          basePlan.deferredChunks.splice(index, 1);
          basePlan.lazyChunks.push(chunk);
        }
      });

      // Disable prefetching on slow connections
      basePlan.prefetchChunks = [];
    }

    this.loadingPlan = basePlan;
    console.log('📋 Loading plan created:', this.loadingPlan);
  }

  private setupLoadingStrategy(): void {
    const { performanceTier, connectionSpeed, memory } = this.deviceProfile;

    // Determine max concurrent loads based on device capabilities
    let maxConcurrentLoads = 4;
    if (performanceTier === 'low') {
      maxConcurrentLoads = 2;
    } else if (performanceTier === 'medium') {
      maxConcurrentLoads = 3;
    }

    // Adjust timeout based on connection speed
    let timeoutDuration = 10000; // 10 seconds
    if (connectionSpeed === 'slow') {
      timeoutDuration = 20000;
    } else if (connectionSpeed === 'fast') {
      timeoutDuration = 5000;
    }

    // Determine cache strategy based on memory
    let cacheStrategy: 'memory' | 'disk' | 'hybrid' = 'hybrid';
    if (memory < 4) {
      cacheStrategy = 'disk'; // Low memory devices prefer disk cache
    } else if (memory > 8) {
      cacheStrategy = 'memory'; // High memory devices can use memory cache
    }

    this.loadingStrategy = {
      maxConcurrentLoads,
      timeoutDuration,
      retryAttempts: connectionSpeed === 'slow' ? 3 : 2,
      retryDelay: 1000,
      compressionEnabled: true,
      cacheStrategy
    };

    console.log('⚙️ Loading strategy configured:', this.loadingStrategy);
  }

  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Mobile Bundle Optimizer');

    // Load critical chunks immediately
    await this.loadCriticalChunks();

    // Start loading immediate chunks
    this.loadImmediateChunks();

    // Setup intelligent prefetching
    this.setupIntelligentPrefetching();

    // Monitor and optimize loading
    this.setupLoadingMonitoring();

    console.log('✅ Bundle Optimizer initialized');
  }

  private async loadCriticalChunks(): Promise<void> {
    console.log('🔥 Loading critical chunks...');

    const criticalPromises = this.loadingPlan.criticalChunks.map(chunkName =>
      this.loadChunk(chunkName, { critical: true })
    );

    try {
      await Promise.all(criticalPromises);
      console.log('✅ All critical chunks loaded');
    } catch (error) {
      console.error('❌ Failed to load critical chunks:', error);
      throw error;
    }
  }

  private loadImmediateChunks(): void {
    console.log('⚡ Loading immediate chunks...');

    // Use requestIdleCallback to avoid blocking main thread
    const loadImmediate = () => {
      this.loadingPlan.immediateChunks.forEach(chunkName => {
        this.scheduleChunkLoad(chunkName, 'immediate');
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadImmediate, { timeout: 2000 });
    } else {
      setTimeout(loadImmediate, 100);
    }
  }

  private scheduleChunkLoad(chunkName: string, priority: 'immediate' | 'deferred' | 'lazy'): void {
    // Check if chunk is already loaded or loading
    const chunk = this.chunks.get(chunkName);
    if (!chunk || chunk.loaded || chunk.loading) {
      return;
    }

    // Add to appropriate queue
    if (priority === 'immediate') {
      this.loadingQueue.unshift(chunkName);
    } else {
      this.loadingQueue.push(chunkName);
    }

    // Process queue
    this.processLoadingQueue();
  }

  private async processLoadingQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.activeLoads.size < this.loadingStrategy.maxConcurrentLoads) {
      const chunkName = this.loadingQueue.shift();
      if (chunkName) {
        this.loadChunk(chunkName);
      }
    }
  }

  private async loadChunk(chunkName: string, options: { critical?: boolean } = {}): Promise<any> {
    // Check if already loading or loaded
    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName);
    }

    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkName}`);
    }

    if (chunk.loaded) {
      return this.getLoadedModule(chunkName);
    }

    // Mark as loading
    chunk.loading = true;
    this.activeLoads.add(chunkName);

    const loadingPromise = this.performChunkLoad(chunkName, options);
    this.loadingPromises.set(chunkName, loadingPromise);

    try {
      const result = await loadingPromise;
      chunk.loaded = true;
      chunk.loading = false;
      chunk.error = false;
      this.loadedChunks.add(chunkName);
      this.activeLoads.delete(chunkName);

      // Continue processing queue
      this.processLoadingQueue();

      // Notify about successful load
      this.notifyChunkLoaded(chunkName, result);

      return result;
    } catch (error) {
      chunk.loading = false;
      chunk.error = true;
      this.activeLoads.delete(chunkName);
      this.loadingPromises.delete(chunkName);

      // Handle retry logic
      if (this.shouldRetry(chunkName)) {
        console.warn(`🔄 Retrying chunk load: ${chunkName}`);
        setTimeout(() => {
          this.scheduleChunkLoad(chunkName, 'immediate');
        }, this.loadingStrategy.retryDelay);
      } else {
        console.error(`❌ Failed to load chunk: ${chunkName}`, error);
        this.notifyChunkError(chunkName, error);
      }

      throw error;
    }
  }

  private async performChunkLoad(chunkName: string, options: { critical?: boolean }): Promise<any> {
    const chunk = this.chunks.get(chunkName);
    if (!chunk) throw new Error(`Chunk not found: ${chunkName}`);

    // Load dependencies first
    if (chunk.dependencies.length > 0) {
      await Promise.all(
        chunk.dependencies.map(dep => this.loadChunk(dep, options))
      );
    }

    // Create dynamic import with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Chunk loading timeout: ${chunkName}`));
      }, this.loadingStrategy.timeoutDuration);
    });

    // Perform actual dynamic import
    const importPromise = this.dynamicImportChunk(chunkName);

    return Promise.race([importPromise, timeoutPromise]);
  }

  private async dynamicImportChunk(chunkName: string): Promise<any> {
    // Map chunk names to actual module paths
    const chunkMap: Record<string, string> = {
      // Critical chunks
      'runtime': '/src/runtime.ts',
      'vendor-core': '/src/vendor-core.ts',
      'app-core': '/src/app-core.ts',

      // High priority chunks
      'booking-core': '/src/components/booking/index.ts',
      'ui-components': '/src/components/ui/index.ts',
      'api-client': '/src/services/api/index.ts',
      'mobile-ui': '/src/components/mobile/index.ts',

      // Medium priority chunks
      'booking-wizard': '/src/components/booking/wizard.ts',
      'service-catalog': '/src/components/services/catalog.ts',
      'user-dashboard': '/src/components/user/dashboard.ts',
      'payment-processing': '/src/services/payment/index.ts',
      'touch-gestures': '/src/lib/mobile/gestures.ts',
      'offline-support': '/src/lib/offline/index.ts',

      // Low priority chunks
      'admin-dashboard': '/src/components/admin/dashboard.ts',
      'analytics': '/src/components/analytics/index.ts',
      'cms-editor': '/src/components/cms/editor.ts',
      'luxury-animations': '/src/lib/animations/luxury.ts',
      'advanced-effects': '/src/lib/effects/advanced.ts',

      // External integrations
      'stripe-elements': '/src/integrations/stripe/index.ts',
      'google-analytics': '/src/integrations/analytics/google.ts',
      'social-widgets': '/src/integrations/social/index.ts'
    };

    const modulePath = chunkMap[chunkName];
    if (!modulePath) {
      throw new Error(`No module path found for chunk: ${chunkName}`);
    }

    try {
      // Use dynamic import with proper error handling
      const module = await import(/* webpackChunkName: "[request]" */ /* @vite-ignore */ modulePath);
      return module.default || module;
    } catch (error) {
      // Enhance error with chunk information
      const enhancedError = new Error(`Failed to load chunk ${chunkName}: ${error.message}`);
      enhancedError.stack = error.stack;
      throw enhancedError;
    }
  }

  private getLoadedModule(chunkName: string): any {
    // This would return the already loaded module
    // Implementation depends on the module system being used
    return null;
  }

  private shouldRetry(chunkName: string): boolean {
    const retryCount = this.retryCounters.get(chunkName) || 0;
    return retryCount < this.loadingStrategy.retryAttempts;
  }

  private notifyChunkLoaded(chunkName: string, module: any): void {
    // Dispatch custom event
    const event = new CustomEvent('chunkLoaded', {
      detail: { chunkName, module, timestamp: Date.now() }
    });
    window.dispatchEvent(event);

    // Update retry counter
    this.retryCounters.delete(chunkName);

    console.log(`✅ Chunk loaded: ${chunkName}`);
  }

  private notifyChunkError(chunkName: string, error: any): void {
    // Increment retry counter
    const retryCount = (this.retryCounters.get(chunkName) || 0) + 1;
    this.retryCounters.set(chunkName, retryCount);

    // Dispatch custom event
    const event = new CustomEvent('chunkError', {
      detail: { chunkName, error, retryCount, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private setupIntelligentPrefetching(): void {
    // Prefetch based on user behavior patterns
    this.setupBehavioralPrefetching();

    // Prefetch based on network conditions
    this.setupNetworkAwarePrefetching();

    // Prefetch based on battery level
    this.setupBatteryAwarePrefetching();
  }

  private setupBehavioralPrefetching(): void {
    // Prefetch booking-related chunks when user shows intent
    const bookingElements = document.querySelectorAll('[data-booking-trigger]');
    bookingElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        this.prefetchChunks(['booking-wizard', 'payment-processing']);
      }, { once: true });
    });

    // Prefetch admin chunks when accessing admin routes
    const adminElements = document.querySelectorAll('[data-admin-trigger]');
    adminElements.forEach(element => {
      element.addEventListener('click', () => {
        this.prefetchChunks(['admin-dashboard', 'analytics']);
      }, { once: true });
    });

    // Prefetch service catalog when browsing services
    const serviceElements = document.querySelectorAll('[data-service-trigger]');
    serviceElements.forEach(element => {
      element.addEventListener('click', () => {
        this.prefetchChunks(['service-catalog', 'image-gallery']);
      }, { once: true });
    });
  }

  private setupNetworkAwarePrefetching(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      connection.addEventListener('change', () => {
        const newSpeed = this.getConnectionSpeed(connection);
        this.deviceProfile.connectionSpeed = newSpeed;

        // Adjust prefetching strategy based on new network speed
        if (newSpeed === 'fast') {
          // Enable aggressive prefetching
          this.prefetchChunks(this.loadingPlan.prefetchChunks);
        } else {
          // Disable prefetching on slow connections
          console.log('📶 Slow connection detected, disabling prefetching');
        }
      });
    }
  }

  private setupBatteryAwarePrefetching(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          this.deviceProfile.batteryLevel = this.getBatteryLevel(battery.level);

          // Reduce prefetching on low battery
          if (battery.level < 0.2) {
            console.log('🔋 Low battery, reducing prefetching');
            this.pausePrefetching();
          }
        });

        battery.addEventListener('chargingchange', () => {
          if (battery.charging) {
            // Resume prefetching when charging
            this.resumePrefetching();
          }
        });
      });
    }
  }

  private getBatteryLevel(level: number): 'high' | 'medium' | 'low' {
    if (level > 0.5) return 'high';
    if (level > 0.2) return 'medium';
    return 'low';
  }

  private setupLoadingMonitoring(): void {
    // Monitor loading performance
    const monitor = setInterval(() => {
      this.analyzeLoadingPerformance();
    }, 5000);

    // Stop monitoring after 30 seconds
    setTimeout(() => {
      clearInterval(monitor);
    }, 30000);
  }

  private analyzeLoadingPerformance(): void {
    const totalChunks = this.chunks.size;
    const loadedChunks = this.loadedChunks.size;
    const errorChunks = Array.from(this.chunks.values()).filter(c => c.error).length;
    const loadingProgress = (loadedChunks / totalChunks) * 100;

    console.log(`📊 Loading progress: ${loadingProgress.toFixed(1)}% (${loadedChunks}/${totalChunks})`);

    if (errorChunks > 0) {
      console.warn(`⚠️ ${errorChunks} chunks failed to load`);
    }

    // Dispatch progress event
    const event = new CustomEvent('loadingProgress', {
      detail: {
        progress: loadingProgress,
        loaded: loadedChunks,
        total: totalChunks,
        errors: errorChunks,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  // Public API methods
  public async loadChunkOnDemand(chunkName: string): Promise<any> {
    return this.loadChunk(chunkName, { critical: false });
  }

  public prefetchChunks(chunkNames: string[]): void {
    if (this.deviceProfile.connectionSpeed === 'slow') {
      return; // Don't prefetch on slow connections
    }

    chunkNames.forEach(chunkName => {
      if (!this.loadedChunks.has(chunkName) && !this.activeLoads.has(chunkName)) {
        // Use low priority prefetching
        setTimeout(() => {
          this.scheduleChunkLoad(chunkName, 'lazy');
        }, 100);
      }
    });
  }

  public pausePrefetching(): void {
    // Remove deferred chunks from queue
    this.loadingQueue = this.loadingQueue.filter(name =>
      this.loadingPlan.criticalChunks.includes(name) ||
      this.loadingPlan.immediateChunks.includes(name)
    );
  }

  public resumePrefetching(): void {
    // Add deferred chunks back to queue
    this.loadingPlan.deferredChunks.forEach(chunkName => {
      if (!this.loadedChunks.has(chunkName)) {
        this.loadingQueue.push(chunkName);
      }
    });
  }

  public getLoadingStatus(): object {
    const chunks = Array.from(this.chunks.entries()).map(([name, chunk]) => ({
      name,
      size: chunk.size,
      priority: chunk.priority,
      loaded: chunk.loaded,
      loading: chunk.loading,
      error: chunk.error
    }));

    return {
      deviceProfile: this.deviceProfile,
      loadingStrategy: this.loadingStrategy,
      chunks,
      progress: (this.loadedChunks.size / this.chunks.size) * 100,
      activeLoads: this.activeLoads.size,
      queuedLoads: this.loadingQueue.length
    };
  }

  public forceRetry(chunkName?: string): void {
    if (chunkName) {
      const chunk = this.chunks.get(chunkName);
      if (chunk && chunk.error) {
        chunk.error = false;
        this.retryCounters.set(chunkName, 0);
        this.scheduleChunkLoad(chunkName, 'immediate');
      }
    } else {
      // Retry all failed chunks
      this.chunks.forEach((chunk, name) => {
        if (chunk.error) {
          chunk.error = false;
          this.retryCounters.set(name, 0);
          this.scheduleChunkLoad(name, 'immediate');
        }
      });
    }
  }

  public generateOptimizationReport(): object {
    const totalSize = Array.from(this.chunks.values()).reduce((sum, chunk) => sum + chunk.size, 0);
    const loadedSize = Array.from(this.chunks.values())
      .filter(chunk => chunk.loaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);

    const criticalSize = this.loadingPlan.criticalChunks
      .map(name => this.chunks.get(name)?.size || 0)
      .reduce((sum, size) => sum + size, 0);

    return {
      deviceProfile: this.deviceProfile,
      bundleAnalysis: {
        totalSize,
        loadedSize,
        criticalSize,
        compressionRatio: this.loadingStrategy.compressionEnabled ? 0.7 : 1.0,
        chunksLoaded: this.loadedChunks.size,
        chunksTotal: this.chunks.size,
        errors: Array.from(this.chunks.values()).filter(c => c.error).length
      },
      performanceMetrics: {
        loadingProgress: (this.loadedChunks.size / this.chunks.size) * 100,
        averageChunkSize: totalSize / this.chunks.size,
        cacheHitRate: this.calculateCacheHitRate(),
        retryRate: this.calculateRetryRate()
      },
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  private calculateCacheHitRate(): number {
    // This would be calculated based on actual cache usage
    return 0.85; // Placeholder
  }

  private calculateRetryRate(): number {
    const totalRetries = Array.from(this.retryCounters.values()).reduce((sum, count) => sum + count, 0);
    return this.chunks.size > 0 ? totalRetries / this.chunks.size : 0;
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const { deviceProfile } = this;

    if (deviceProfile.performanceTier === 'low') {
      recommendations.push('Consider reducing chunk sizes for low-end devices');
      recommendations.push('Enable more aggressive caching strategies');
    }

    if (deviceProfile.connectionSpeed === 'slow') {
      recommendations.push('Implement more aggressive compression');
      recommendations.push('Increase timeout durations for slow networks');
    }

    if (deviceProfile.deviceType === 'mobile') {
      recommendations.push('Optimize chunks for mobile-first experience');
      recommendations.push('Consider touch-specific optimizations');
    }

    const errorRate = this.calculateRetryRate();
    if (errorRate > 0.2) {
      recommendations.push('High error rate detected - review network reliability');
      recommendations.push('Consider implementing offline fallbacks');
    }

    return recommendations;
  }
}

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();

// Convenience exports
export const initializeBundleOptimizer = () => bundleOptimizer.initialize();
export const loadChunk = (name: string) => bundleOptimizer.loadChunkOnDemand(name);
export const getLoadingStatus = () => bundleOptimizer.getLoadingStatus();
export const getOptimizationReport = () => bundleOptimizer.generateOptimizationReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).bundleOptimizer = {
    init: initializeBundleOptimizer,
    load: loadChunk,
    getStatus: getLoadingStatus,
    getReport: getOptimizationReport,
    prefetch: (chunks: string[]) => bundleOptimizer.prefetchChunks(chunks),
    retry: (chunk?: string) => bundleOptimizer.forceRetry(chunk),
    pause: () => bundleOptimizer.pausePrefetching(),
    resume: () => bundleOptimizer.resumePrefetching()
  };
}