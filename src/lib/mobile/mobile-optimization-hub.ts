/**
 * Mobile Optimization Hub
 * Central coordination point for all mobile performance optimizations
 */

import { coreWebVitalsOptimizer, initializeMobileOptimization } from './core-web-vitals-optimizer';
import { adaptiveLoadingSystem, initializeAdaptiveLoading } from './adaptive-loading-system';
import { bundleOptimizer, initializeBundleOptimizer } from './bundle-optimizer';
import { mobilePerformanceMonitor, startMobileMonitoring } from './mobile-performance-monitor';

interface OptimizationConfig {
  enableCoreWebVitals: boolean;
  enableAdaptiveLoading: boolean;
  enableBundleOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  autoOptimize: boolean;
  monitoringLevel: 'basic' | 'detailed' | 'comprehensive';
  reportInterval: number;
  enableAlerting: boolean;
  enableAutoTuning: boolean;
}

interface OptimizationStatus {
  initialized: boolean;
  coreWebVitalsOptimized: boolean;
  adaptiveLoadingActive: boolean;
  bundleOptimizerRunning: boolean;
  performanceMonitoringActive: boolean;
  lastOptimization: Date;
  optimizationCount: number;
  currentPerformanceScore: number;
  activeAlerts: number;
}

interface MobileOptimizationReport {
  timestamp: Date;
  deviceProfile: any;
  performanceMetrics: any;
  optimizationStatus: OptimizationStatus;
  bundleAnalysis: any;
  adaptiveLoadingConfig: any;
  alerts: any[];
  recommendations: string[];
  overallScore: number;
  grade: string;
}

class MobileOptimizationHub {
  private static instance: MobileOptimizationHub;
  private config: OptimizationConfig;
  private status: OptimizationStatus;
  private reportInterval: number | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.status = this.getInitialStatus();
  }

  static getInstance(): MobileOptimizationHub {
    if (!MobileOptimizationHub.instance) {
      MobileOptimizationHub.instance = new MobileOptimizationHub();
    }
    return MobileOptimizationHub.instance;
  }

  private getDefaultConfig(): OptimizationConfig {
    return {
      enableCoreWebVitals: true,
      enableAdaptiveLoading: true,
      enableBundleOptimization: true,
      enablePerformanceMonitoring: true,
      autoOptimize: true,
      monitoringLevel: 'detailed',
      reportInterval: 30000, // 30 seconds
      enableAlerting: true,
      enableAutoTuning: true
    };
  }

  private getInitialStatus(): OptimizationStatus {
    return {
      initialized: false,
      coreWebVitalsOptimized: false,
      adaptiveLoadingActive: false,
      bundleOptimizerRunning: false,
      performanceMonitoringActive: false,
      lastOptimization: new Date(),
      optimizationCount: 0,
      currentPerformanceScore: 0,
      activeAlerts: 0
    };
  }

  public async initialize(customConfig?: Partial<OptimizationConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('Mobile Optimization Hub already initialized');
      return;
    }

    console.log('🚀 Initializing Mobile Optimization Hub for mariiaborysevych Luxury Platform');

    // Apply custom configuration
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    try {
      // Initialize Core Web Vitals optimization
      if (this.config.enableCoreWebVitals) {
        console.log('📊 Initializing Core Web Vitals optimization...');
        await initializeMobileOptimization();
        this.status.coreWebVitalsOptimized = true;
        console.log('✅ Core Web Vitals optimization initialized');
      }

      // Initialize Adaptive Loading System
      if (this.config.enableAdaptiveLoading) {
        console.log('📱 Initializing Adaptive Loading System...');
        await initializeAdaptiveLoading();
        this.status.adaptiveLoadingActive = true;
        console.log('✅ Adaptive Loading System initialized');
      }

      // Initialize Bundle Optimizer
      if (this.config.enableBundleOptimization) {
        console.log('📦 Initializing Bundle Optimizer...');
        await initializeBundleOptimizer();
        this.status.bundleOptimizerRunning = true;
        console.log('✅ Bundle Optimizer initialized');
      }

      // Initialize Performance Monitoring
      if (this.config.enablePerformanceMonitoring) {
        console.log('📈 Initializing Performance Monitoring...');
        await startMobileMonitoring();
        this.status.performanceMonitoringActive = true;
        console.log('✅ Performance Monitoring initialized');
      }

      // Setup cross-system communication
      this.setupCrossSystemCommunication();

      // Setup periodic reporting
      this.setupPeriodicReporting();

      // Setup auto-tuning if enabled
      if (this.config.enableAutoTuning) {
        this.setupAutoTuning();
      }

      this.status.initialized = true;
      this.isInitialized = true;

      console.log('🎉 Mobile Optimization Hub fully initialized for luxury beauty platform');

      // Generate initial report
      this.generateAndNotifyReport();

      // Notify subscribers
      this.notifySubscribers('initialized', {
        timestamp: Date.now(),
        config: this.config,
        status: this.status
      });

    } catch (error) {
      console.error('❌ Failed to initialize Mobile Optimization Hub:', error);
      throw error;
    }
  }

  private setupCrossSystemCommunication(): void {
    console.log('🔗 Setting up cross-system communication...');

    // Listen to performance alerts
    window.addEventListener('performanceAlert', this.handlePerformanceAlert.bind(this));

    // Listen to chunk loading events
    window.addEventListener('chunkLoaded', this.handleChunkLoaded.bind(this));
    window.addEventListener('chunkError', this.handleChunkError.bind(this));

    // Listen to resource loading events
    window.addEventListener('resourceLoaded', this.handleResourceLoaded.bind(this));
    window.addEventListener('resourceError', this.handleResourceError.bind(this));

    // Listen to performance snapshots
    window.addEventListener('performanceSnapshot', this.handlePerformanceSnapshot.bind(this));

    // Listen to network condition changes
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));

    console.log('✅ Cross-system communication established');
  }

  private setupPeriodicReporting(): void {
    if (this.config.reportInterval > 0) {
      this.reportInterval = setInterval(() => {
        this.generateAndNotifyReport();
      }, this.config.reportInterval);
    }
  }

  private setupAutoTuning(): void {
    console.log('🎛️ Setting up auto-tuning...');

    // Listen for performance alerts and auto-adjust
    window.addEventListener('performanceAlert', (event: any) => {
      const alert = event.detail;
      this.handleAutoTuning(alert);
    });

    // Monitor performance trends and adjust accordingly
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 60000); // Every minute

    console.log('✅ Auto-tuning system active');
  }

  private handlePerformanceAlert(event: any): void {
    const alert = event.detail;

    console.warn(`🚨 Performance Alert: ${alert.title}`, alert);

    // Update status
    this.status.activeAlerts++;

    // Forward alert to subscribers
    this.notifySubscribers('performanceAlert', alert);

    // Check if auto-optimization should be triggered
    if (this.config.autoOptimize && alert.type === 'critical') {
      this.triggerAutoOptimization(alert);
    }
  }

  private handleChunkLoaded(event: any): void {
    const { chunkName, module } = event.detail;

    console.log(`📦 Chunk loaded: ${chunkName}`);

    // Notify subscribers
    this.notifySubscribers('chunkLoaded', { chunkName, module });

    // Update optimization count
    this.status.optimizationCount++;
  }

  private handleChunkError(event: any): void {
    const { chunkName, error } = event.detail;

    console.error(`❌ Chunk failed to load: ${chunkName}`, error);

    // Notify subscribers
    this.notifySubscribers('chunkError', { chunkName, error });

    // Trigger fallback strategy
    this.handleChunkFallback(chunkName);
  }

  private handleResourceLoaded(event: any): void {
    const { element } = event.detail;

    // Track resource loading performance
    this.trackResourcePerformance(element);
  }

  private handleResourceError(event: any): void {
    const { element, error } = event.detail;

    console.warn('⚠️ Resource loading error:', element, error);

    // Track resource errors
    this.trackResourceError(element, error);
  }

  private handlePerformanceSnapshot(event: any): void {
    const snapshot = event.detail;

    // Update current performance score
    this.status.currentPerformanceScore = snapshot.score;

    // Notify subscribers
    this.notifySubscribers('performanceSnapshot', snapshot);

    // Check if optimization is needed
    if (snapshot.score < 80 && this.config.autoOptimize) {
      this.triggerAutoOptimization({ category: 'performance', score: snapshot.score });
    }
  }

  private handleNetworkChange(): void {
    const isOnline = navigator.onLine;
    const connectionType = isOnline ? 'online' : 'offline';

    console.log(`📶 Network status changed: ${connectionType}`);

    // Adjust strategies based on network status
    if (!isOnline) {
      this.enableOfflineMode();
    } else {
      this.disableOfflineMode();
    }

    // Notify subscribers
    this.notifySubscribers('networkChange', { isOnline, connectionType });
  }

  private handleAutoTuning(alert: any): void {
    const { category, metric, value, threshold } = alert;

    console.log(`🎛️ Auto-tuning triggered by: ${category} - ${metric}`);

    switch (category) {
      case 'performance':
        this.tunePerformanceParameters(metric, value, threshold);
        break;
      case 'memory':
        this.tuneMemoryParameters(metric, value, threshold);
        break;
      case 'battery':
        this.tuneBatteryParameters(metric, value, threshold);
        break;
      case 'network':
        this.tuneNetworkParameters(metric, value, threshold);
        break;
      case 'user-experience':
        this.tuneUserExperienceParameters(metric, value, threshold);
        break;
    }
  }

  private tunePerformanceParameters(metric: string, value: number, threshold: number): void {
    if (metric === 'lcp' && value > threshold) {
      // Optimize for slow LCP
      adaptiveLoadingSystem.updatePreferences({
        imageQuality: 'low',
        enableAnimations: false,
        preloadContent: false
      });

      console.log('🎯 Tuned parameters for slow LCP');
    } else if (metric === 'fid' && value > threshold) {
      // Optimize for slow FID
      bundleOptimizer.pausePrefetching();

      console.log('🎯 Tuned parameters for slow FID');
    }
  }

  private tuneMemoryParameters(metric: string, value: number, threshold: number): void {
    if (metric === 'memoryPressure' && value > 0.8) {
      // Reduce memory usage
      document.documentElement.classList.add('memory-saving-mode');

      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      console.log('🎯 Tuned parameters for high memory pressure');
    }
  }

  private tuneBatteryParameters(metric: string, value: number, threshold: number): void {
    if (metric === 'batteryDrainRate' && value > threshold) {
      // Enable power saving mode
      document.documentElement.classList.add('power-saving-mode');

      // Reduce background processes
      adaptiveLoadingSystem.pauseBackgroundLoading();

      console.log('🎯 Tuned parameters for high battery drain');
    }
  }

  private tuneNetworkParameters(metric: string, value: number, threshold: number): void {
    if (metric === 'networkLatency' && value > threshold) {
      // Optimize for slow network
      adaptiveLoadingSystem.updatePreferences({
        enableBackgroundData: false,
        imageQuality: 'low'
      });

      console.log('🎯 Tuned parameters for slow network');
    }
  }

  private tuneUserExperienceParameters(metric: string, value: number, threshold: number): void {
    if (metric === 'scrollSmoothness' && value < threshold) {
      // Optimize scroll performance
      document.documentElement.classList.add('optimize-scroll');

      console.log('🎯 Tuned parameters for poor scroll performance');
    }
  }

  private triggerAutoOptimization(trigger: any): void {
    console.log('🔄 Triggering auto-optimization:', trigger);

    // Run optimization based on trigger
    switch (trigger.category) {
      case 'performance':
        this.optimizePerformance();
        break;
      case 'memory':
        this.optimizeMemory();
        break;
      case 'network':
        this.optimizeNetwork();
        break;
      default:
        this.optimizeGeneral();
    }

    this.status.lastOptimization = new Date();
    this.status.optimizationCount++;
  }

  private optimizePerformance(): void {
    console.log('⚡ Running performance optimization...');

    // Re-optimize Core Web Vitals
    coreWebVitalsOptimizer.forceReoptimization();

    // Clear caches and reload critical resources
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp-')) {
            caches.delete(name);
          }
        });
      });
    }

    // Notify about optimization
    this.notifySubscribers('autoOptimization', {
      type: 'performance',
      timestamp: Date.now()
    });
  }

  private optimizeMemory(): void {
    console.log('🧠 Running memory optimization...');

    // Trigger garbage collection
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear unnecessary data
    if (localStorage.length > 50) {
      // Keep only essential items
      const keysToKeep = ['user-preferences', 'auth-token', 'booking-draft'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    }

    // Notify about optimization
    this.notifySubscribers('autoOptimization', {
      type: 'memory',
      timestamp: Date.now()
    });
  }

  private optimizeNetwork(): void {
    console.log('🌐 Running network optimization...');

    // Pause non-critical network requests
    adaptiveLoadingSystem.pauseBackgroundLoading();

    // Reduce API call frequency
    // This would be implemented in the API client

    // Notify about optimization
    this.notifySubscribers('autoOptimization', {
      type: 'network',
      timestamp: Date.now()
    });
  }

  private optimizeGeneral(): void {
    console.log('🔧 Running general optimization...');

    // Apply general optimizations
    this.optimizePerformance();
    this.optimizeMemory();
  }

  private enableOfflineMode(): void {
    console.log('📴 Enabling offline mode');

    document.documentElement.classList.add('offline-mode');

    // Pause non-essential features
    adaptiveLoadingSystem.pauseBackgroundLoading();
    bundleOptimizer.pausePrefetching();

    // Enable service worker offline features
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ENABLE_OFFLINE_MODE'
      });
    }

    this.notifySubscribers('offlineMode', { enabled: true });
  }

  private disableOfflineMode(): void {
    console.log('🌐 Disabling offline mode');

    document.documentElement.classList.remove('offline-mode');

    // Resume normal operations
    adaptiveLoadingSystem.resumeBackgroundLoading();

    this.notifySubscribers('offlineMode', { enabled: false });
  }

  private handleChunkFallback(chunkName: string): void {
    console.log(`🔄 Implementing fallback for chunk: ${chunkName}`);

    // Implement fallback strategies
    if (chunkName.includes('admin')) {
      // Show simplified admin interface
      this.notifySubscribers('chunkFallback', {
        chunkName,
        fallbackType: 'simplified'
      });
    } else if (chunkName.includes('analytics')) {
      // Disable analytics temporarily
      this.notifySubscribers('chunkFallback', {
        chunkName,
        fallbackType: 'disabled'
      });
    }
  }

  private trackResourcePerformance(element: Element): void {
    // Track resource loading performance for optimization insights
    const loadTime = performance.now();
    const resourceType = element.tagName.toLowerCase();

    // Store performance data
    const performanceData = {
      element,
      resourceType,
      loadTime,
      timestamp: Date.now()
    };

    this.notifySubscribers('resourcePerformance', performanceData);
  }

  private trackResourceError(element: Element, error: any): void {
    // Track resource errors for optimization insights
    const errorData = {
      element,
      error,
      resourceType: element.tagName.toLowerCase(),
      timestamp: Date.now()
    };

    this.notifySubscribers('resourceError', errorData);
  }

  private analyzePerformanceTrends(): void {
    const snapshots = mobilePerformanceMonitor.getSnapshots(5);

    if (snapshots.length < 3) return;

    // Analyze performance trends
    const recentScores = snapshots.map(s => s.score);
    const trend = this.calculateTrend(recentScores);

    if (trend < -10) {
      console.warn('📉 Performance trend is declining');
      this.triggerAutoOptimization({ category: 'performance', trend });
    } else if (trend > 10) {
      console.log('📈 Performance trend is improving');
    }

    // Update status
    if (snapshots.length > 0) {
      this.status.currentPerformanceScore = snapshots[snapshots.length - 1].score;
    }
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    return ((last - first) / first) * 100;
  }

  private generateAndNotifyReport(): void {
    const report = this.generateComprehensiveReport();

    // Notify subscribers
    this.notifySubscribers('performanceReport', report);

    // Update status
    this.status.activeAlerts = report.alerts.length;
    this.status.currentPerformanceScore = report.overallScore;

    console.log('📊 Performance report generated:', report.overallScore, report.grade);
  }

  private generateComprehensiveReport(): MobileOptimizationReport {
    const deviceProfile = mobilePerformanceMonitor.getDeviceInfo();
    const performanceMetrics = mobilePerformanceMonitor.getCurrentMetrics();
    const alerts = mobilePerformanceMonitor.getAlerts();
    const bundleAnalysis = bundleOptimizer.getOptimizationReport();
    const adaptiveLoadingConfig = adaptiveLoadingSystem.getStrategy();

    return {
      timestamp: new Date(),
      deviceProfile,
      performanceMetrics,
      optimizationStatus: { ...this.status },
      bundleAnalysis,
      adaptiveLoadingConfig,
      alerts,
      recommendations: this.generateConsolidatedRecommendations(),
      overallScore: this.calculateOverallScore(),
      grade: this.calculateOverallGrade()
    };
  }

  private generateConsolidatedRecommendations(): string[] {
    const recommendations: string[] = [];

    // Get recommendations from all systems
    const webVitalsReport = coreWebVitalsOptimizer.generatePerformanceReport();
    const mobileReport = mobilePerformanceMonitor.generateReport();
    const bundleReport = bundleOptimizer.generateOptimizationReport();

    // Add Core Web Vitals recommendations
    if (webVitalsReport.recommendations) {
      recommendations.push(...webVitalsReport.recommendations);
    }

    // Add mobile-specific recommendations
    if (mobileReport.recommendations) {
      recommendations.push(...mobileReport.recommendations);
    }

    // Add bundle optimization recommendations
    if (bundleReport.recommendations) {
      recommendations.push(...bundleReport.recommendations);
    }

    // Remove duplicates and limit to top 10
    return [...new Set(recommendations)].slice(0, 10);
  }

  private calculateOverallScore(): number {
    const webVitalsScore = this.status.currentPerformanceScore;
    const bundleScore = this.calculateBundleScore();
    const adaptiveScore = this.calculateAdaptiveScore();
    const errorPenalty = this.calculateErrorPenalty();

    // Weighted average
    const overallScore = (webVitalsScore * 0.5) + (bundleScore * 0.2) + (adaptiveScore * 0.2) - errorPenalty;

    return Math.max(0, Math.min(100, overallScore));
  }

  private calculateBundleScore(): number {
    const bundleStatus = bundleOptimizer.getLoadingStatus();
    const progress = bundleStatus.progress || 0;
    const errorRate = bundleStatus.chunks ?
      bundleStatus.chunks.filter((c: any) => c.error).length / bundleStatus.chunks.length : 0;

    return progress * (1 - errorRate);
  }

  private calculateAdaptiveScore(): number {
    // Score based on how well adaptive loading is working
    const config = adaptiveLoadingSystem.getStrategy();
    let score = 100;

    if (!config.images.lazyLoading) score -= 10;
    if (!config.animations.enabled) score -= 5;
    if (!config.content.prefetchCritical) score -= 10;

    return Math.max(0, score);
  }

  private calculateErrorPenalty(): number {
    const metrics = mobilePerformanceMonitor.getCurrentMetrics();
    const totalErrors = metrics.jsErrors + metrics.networkErrors + metrics.resourceErrors;

    return totalErrors * 2; // 2 points per error
  }

  private calculateOverallGrade(): string {
    const score = this.calculateOverallScore();

    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber for ${event}:`, error);
        }
      });
    }
  }

  // Public API methods
  public subscribe(event: string, callback: Function): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    this.subscribers.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart periodic reporting if interval changed
    if (newConfig.reportInterval !== undefined) {
      if (this.reportInterval) {
        clearInterval(this.reportInterval);
      }
      this.setupPeriodicReporting();
    }

    console.log('📝 Configuration updated:', this.config);
  }

  public forceOptimization(type?: string): void {
    if (type) {
      this.triggerAutoOptimization({ category: type, manual: true });
    } else {
      this.optimizeGeneral();
    }

    console.log(`🔄 Manual optimization triggered: ${type || 'general'}`);
  }

  public getStatus(): OptimizationStatus {
    return { ...this.status };
  }

  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  public getReport(): MobileOptimizationReport {
    return this.generateComprehensiveReport();
  }

  public destroy(): void {
    console.log('🛑 Shutting down Mobile Optimization Hub');

    // Clear periodic reporting
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    // Stop monitoring
    mobilePerformanceMonitor.stopMonitoring();

    // Clear subscribers
    this.subscribers.clear();

    // Reset status
    this.status = this.getInitialStatus();
    this.isInitialized = false;

    console.log('✅ Mobile Optimization Hub destroyed');
  }
}

// Export singleton instance
export const mobileOptimizationHub = MobileOptimizationHub.getInstance();

// Convenience exports
export const initializeMobileOptimizations = (config?: Partial<OptimizationConfig>) =>
  mobileOptimizationHub.initialize(config);

export const getMobileOptimizationStatus = () => mobileOptimizationHub.getStatus();
export const getMobileOptimizationReport = () => mobileOptimizationHub.getReport();
export const subscribeToMobileEvents = (event: string, callback: Function) =>
  mobileOptimizationHub.subscribe(event, callback);

// Development debugging
if (import.meta.env.DEV) {
  (window as any).mobileOptimizationHub = {
    init: initializeMobileOptimizations,
    getStatus: getMobileOptimizationStatus,
    getReport: getMobileOptimizationReport,
    subscribe: subscribeToMobileEvents,
    forceOptimization: (type?: string) => mobileOptimizationHub.forceOptimization(type),
    updateConfig: (config: Partial<OptimizationConfig>) => mobileOptimizationHub.updateConfig(config),
    destroy: () => mobileOptimizationHub.destroy()
  };
}