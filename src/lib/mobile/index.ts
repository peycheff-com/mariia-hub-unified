/**
 * Mobile Performance Optimization System
 * Complete mobile optimization suite for the mariiaborysevych luxury beauty/fitness platform
 */

// Core optimization systems
export { coreWebVitalsOptimizer, initializeMobileOptimization, getMobileMetrics, getMobilePerformanceReport } from './core-web-vitals-optimizer';
export { adaptiveLoadingSystem, initializeAdaptiveLoading, updateLoadingPreferences, getAdaptiveStrategy, getAdaptiveConfig } from './adaptive-loading-system';
export { bundleOptimizer, initializeBundleOptimizer, loadChunk, getLoadingStatus, getOptimizationReport } from './bundle-optimizer';
export { mobilePerformanceMonitor, startMobileMonitoring, stopMobileMonitoring, getMobileMetrics as getPerformanceMetrics, getMobileReport as getPerformanceReport } from './mobile-performance-monitor';
export { networkOptimizer, initializeNetworkOptimizer, getNetworkCondition, getNetworkMetrics, getNetworkReport } from './network-optimizer';

// UI optimization system
export { mobileUIOptimizer, initializeMobileUIOptimizer, getMobileUIOptimizer } from './mobile-ui-optimizer';

// Device performance profiling system
export { devicePerformanceProfiler, initializeDevicePerformanceProfiler, getDevicePerformanceProfiler } from './device-performance-profiler';

// Adaptive image optimization system
export { adaptiveImageOptimizer, initializeAdaptiveImageOptimizer, getAdaptiveImageOptimizer } from './adaptive-image-optimizer';

// Platform-specific optimization system
export { platformSpecificOptimizer, initializePlatformSpecificOptimizer, getPlatformSpecificOptimizer } from './platform-specific-optimizer';

// Central coordination hub
export { mobileOptimizationHub, initializeMobileOptimizations, getMobileOptimizationStatus, getMobileOptimizationReport, subscribeToMobileEvents } from './mobile-optimization-hub';

// Re-export types
export type {
  DeviceCapabilities,
  PerformanceProfile,
  OptimizedImageConfig,
  OptimizationStrategy
} from './core-web-vitals-optimizer';

export type {
  AdaptiveConfig,
  LoadingStrategy,
  ResourcePriority
} from './adaptive-loading-system';

export type {
  BundleChunk,
  LoadingPlan,
  DeviceProfile as BundleDeviceProfile,
  ChunkLoadingStrategy
} from './bundle-optimizer';

export type {
  MobileDeviceInfo,
  NetworkInfo,
  MobilePerformanceMetrics,
  PerformanceAlert,
  PerformanceSnapshot
} from './mobile-performance-monitor';

export type {
  NetworkCondition,
  CompressionConfig,
  RequestOptimization,
  DataReduction,
  NetworkMetrics
} from './network-optimizer';

export type {
  MobileUIConfig,
  ViewportOptimization,
  ResponsiveBreakpoint,
  TouchOptimization,
  ScrollOptimization,
  FormOptimization,
  UIPerformanceMetrics
} from './mobile-ui-optimizer';

export type {
  DeviceProfile,
  BenchmarkResult,
  PerformanceProfile
} from './device-performance-profiler';

export type {
  ImageConfig,
  AdaptiveImageSettings,
  ImageOptimizationResult,
  ImageMetrics
} from './adaptive-image-optimizer';

export type {
  PlatformConfig,
  IOptimizations,
  AndroidOptimizations,
  PlatformPerformanceMetrics
} from './platform-specific-optimizer';

export type {
  OptimizationConfig,
  OptimizationStatus,
  MobileOptimizationReport
} from './mobile-optimization-hub';

// Main initialization function
export async function initializeMobilePerformanceSuite(config?: {
  enableCoreWebVitals?: boolean;
  enableAdaptiveLoading?: boolean;
  enableBundleOptimization?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableNetworkOptimization?: boolean;
  enableUIOptimization?: boolean;
  enableDeviceProfiling?: boolean;
  enableImageOptimization?: boolean;
  enablePlatformOptimization?: boolean;
  autoOptimize?: boolean;
  monitoringLevel?: 'basic' | 'detailed' | 'comprehensive';
  luxuryMode?: boolean;
  performanceProfile?: 'high' | 'medium' | 'low';
}): Promise<void> {
  console.log('🚀 Initializing Mobile Performance Suite for mariiaborysevych Luxury Platform');

  try {
    // Initialize device performance profiler first
    if (config?.enableDeviceProfiling !== false) {
      const profiler = initializeDevicePerformanceProfiler();
      console.log('✅ Device performance profiler initialized');

      // Wait for profiler to complete (async operation)
      await new Promise(resolve => {
        if (profiler.getProfile()) {
          resolve(true);
        } else {
          window.addEventListener('deviceProfileReady', resolve, { once: true });
        }
      });
    }

    // Initialize platform-specific optimizer
    if (config?.enablePlatformOptimization !== false) {
      const platformOptimizer = initializePlatformSpecificOptimizer();
      console.log('✅ Platform-specific optimizer initialized for', platformOptimizer.getPlatformConfig().platform);

      // Apply low-end optimizations if needed
      const deviceProfile = getDevicePerformanceProfiler()?.getDeviceProfile();
      if (deviceProfile?.tier === 'low' || deviceProfile?.tier === 'legacy') {
        platformOptimizer.optimizeForLowEndDevice();
      }
    }

    // Initialize network optimizer
    if (config?.enableNetworkOptimization !== false) {
      await initializeNetworkOptimizer();
      console.log('✅ Network optimizer initialized');
    }

    // Initialize adaptive image optimizer
    if (config?.enableImageOptimization !== false) {
      const deviceProfile = getDevicePerformanceProfiler()?.getDeviceProfile();
      const imageOptimizer = initializeAdaptiveImageOptimizer({
        formats: {
          webp: true,
          avif: true,
          jpeg2000: false,
          heic: false
        },
        quality: {
          premium: 90,
          high: 80,
          medium: 70,
          low: 60,
          adaptive: true
        },
        loading: {
          lazy: true,
          eagerAboveFold: true,
          threshold: 0.1,
          rootMargin: '50px'
        },
        placeholders: {
          enable: config?.luxuryMode !== false,
          lowQualityPreview: true,
          blurRadius: 10,
          pixelSize: 4
        },
        performance: {
          maxConcurrentLoads: deviceProfile?.tier === 'premium' ? 6 : 4,
          compressionLevel: deviceProfile?.tier === 'premium' ? 6 : 7,
          progressiveJPEG: true
        }
      });
      console.log('✅ Adaptive image optimizer initialized');
    }

    // Initialize UI optimizer with device profile
    if (config?.enableUIOptimization !== false) {
      const deviceProfile = getDevicePerformanceProfiler()?.getDeviceProfile();
      const uiOptimizer = initializeMobileUIOptimizer({
        enableResponsiveOptimizations: true,
        enableTouchOptimizations: true,
        enableViewportOptimizations: true,
        enableScrollOptimizations: true,
        enableFormOptimizations: true,
        luxuryMode: config?.luxuryMode !== false,
        targetDevice: 'mobile',
        performanceProfile: deviceProfile?.tier === 'premium' || deviceProfile?.tier === 'high' ? 'high' :
                         deviceProfile?.tier === 'medium' ? 'medium' : 'low'
      });
      await uiOptimizer.initialize();
      console.log('✅ Mobile UI optimizer initialized');
    }

    // Initialize the main mobile optimization hub
    await initializeMobileOptimizations({
      enableCoreWebVitals: config?.enableCoreWebVitals !== false,
      enableAdaptiveLoading: config?.enableAdaptiveLoading !== false,
      enableBundleOptimization: config?.enableBundleOptimization !== false,
      enablePerformanceMonitoring: config?.enablePerformanceMonitoring !== false,
      autoOptimize: config?.autoOptimize !== false,
      monitoringLevel: config?.monitoringLevel || 'detailed'
    });

    console.log('🎉 Mobile Performance Suite fully initialized');
    console.log('📱 Platform ready for optimal mobile performance');

    // Dispatch initialization complete event
    const event = new CustomEvent('mobilePerformanceSuiteInitialized', {
      detail: {
        timestamp: Date.now(),
        config,
        networkCondition: getNetworkCondition(),
        optimizationStatus: getMobileOptimizationStatus(),
        uiOptimizationReport: getMobileUIOptimizer()?.getUIOptimizationReport(),
        deviceProfile: getDevicePerformanceProfiler()?.getProfile(),
        imageOptimizationReport: getAdaptiveImageOptimizer()?.getOptimizationReport(),
        platformReport: getPlatformSpecificOptimizer()?.getOptimizationReport()
      }
    });
    window.dispatchEvent(event);

  } catch (error) {
    console.error('❌ Failed to initialize Mobile Performance Suite:', error);
    throw error;
  }
}

// Convenience function for quick setup
export function setupMobileOptimizations(): void {
  // Auto-initialize with default configuration
  initializeMobilePerformanceSuite({
    enableCoreWebVitals: true,
    enableAdaptiveLoading: true,
    enableBundleOptimization: true,
    enablePerformanceMonitoring: true,
    enableNetworkOptimization: true,
    enableUIOptimization: true,
    enableDeviceProfiling: true,
    enableImageOptimization: true,
    enablePlatformOptimization: true,
    autoOptimize: true,
    monitoringLevel: 'detailed',
    luxuryMode: true,
    performanceProfile: 'high'
  }).catch(error => {
    console.error('Failed to setup mobile optimizations:', error);
  });
}

// Performance monitoring utilities
export function monitorMobilePerformance(): void {
  // Subscribe to key performance events
  subscribeToMobileEvents('performanceAlert', (alert) => {
    console.warn('🚨 Mobile Performance Alert:', alert.title, alert.description);

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'mobile_performance_alert', {
        alert_type: alert.type,
        alert_category: alert.category,
        alert_title: alert.title
      });
    }
  });

  subscribeToMobileEvents('performanceSnapshot', (snapshot) => {
    console.log(`📊 Mobile Performance Score: ${snapshot.score} (${snapshot.grade})`);

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'mobile_performance_snapshot', {
        performance_score: snapshot.score,
        performance_grade: snapshot.grade,
        device_type: snapshot.deviceInfo.deviceType
      });
    }
  });

  subscribeToMobileEvents('chunkLoaded', (data) => {
    console.log(`📦 Chunk loaded: ${data.chunkName}`);
  });

  subscribeToMobileEvents('chunkError', (data) => {
    console.error(`❌ Chunk failed: ${data.chunkName}`, data.error);
  });

  console.log('📈 Mobile performance monitoring active');
}

// Development utilities
export function enableMobileDebugMode(): void {
  if (import.meta.env.DEV) {
    // Add mobile optimization controls to window
    (window as any).mobilePerformanceSuite = {
      // Core systems
      coreWebVitals: (window as any).mobileOptimizer,
      adaptiveLoading: (window as any).adaptiveLoading,
      bundleOptimizer: (window as any).bundleOptimizer,
      performanceMonitor: (window as any).mobilePerformance,
      networkOptimizer: (window as any).networkOptimizer,
      uiOptimizer: (window as any).mobileUIOptimizer,
      deviceProfiler: (window as any).devicePerformanceProfiler,
      imageOptimizer: (window as any).adaptiveImageOptimizer,
      platformOptimizer: (window as any).platformSpecificOptimizer,

      // Central hub
      hub: (window as any).mobileOptimizationHub,

      // Quick actions
      forceOptimization: (type?: string) => (window as any).mobileOptimizationHub.forceOptimization(type),
      getReport: () => (window as any).mobileOptimizationHub.getReport(),
      getStatus: () => (window as any).mobileOptimizationHub.getStatus(),

      // Network actions
      enableDataSaver: (enabled: boolean) => (window as any).networkOptimizer.enableDataSaver(enabled),
      updateImageQuality: (quality: number) => (window as any).networkOptimizer.updateImageQuality(quality),

      // Bundle actions
      loadChunk: (name: string) => (window as any).bundleOptimizer.load(name),
      retryChunk: (name?: string) => (window as any).bundleOptimizer.retry(name),

      // Performance actions
      getMetrics: () => (window as any).mobilePerformance.getMetrics(),
      getAlerts: () => (window as any).mobilePerformance.getAlerts(),

      // UI actions
      getUIReport: () => (window as any).mobileUIOptimizer?.getUIOptimizationReport(),
      updateUIConfig: (config: any) => (window as any).mobileUIOptimizer?.updateConfig(config),
      optimizeElement: (element: HTMLElement) => (window as any).mobileUIOptimizer?.optimizeElement(element),
      addScrollCallback: (id: string, callback: Function) => (window as any).mobileUIOptimizer?.addScrollCallback(id, callback),
      removeScrollCallback: (id: string) => (window as any).mobileUIOptimizer?.removeScrollCallback(id),

      // Device profiler actions
      getDeviceProfile: () => (window as any).devicePerformanceProfiler?.getProfile(),
      getDeviceTier: () => (window as any).devicePerformanceProfiler?.getDeviceTier(),
      getOptimizationSettings: () => (window as any).devicePerformanceProfiler?.getOptimizationSettings(),
      rebenchmark: () => (window as any).devicePerformanceProfiler?.rebenchmark(),

      // Image optimizer actions
      getImageReport: () => (window as any).adaptiveImageOptimizer?.getOptimizationReport(),
      optimizeExistingImages: () => (window as any).adaptiveImageOptimizer?.optimizeExistingImages(),
      getImageMetrics: (url: string) => (window as any).adaptiveImageOptimizer?.getImageMetrics(url),
      clearImageCache: () => (window as any).adaptiveImageOptimizer?.clearCache(),
      updateImageSettings: (settings: any) => (window as any).adaptiveImageOptimizer?.updateSettings(settings),

      // Platform optimizer actions
      getPlatformConfig: () => (window as any).platformSpecificOptimizer?.getPlatformConfig(),
      getPlatformReport: () => (window as any).platformSpecificOptimizer?.getOptimizationReport(),
      optimizeElement: (element: HTMLElement) => (window as any).platformSpecificOptimizer?.applyOptimizationsToElement(element),
      optimizeLowEnd: () => (window as any).platformSpecificOptimizer?.optimizeForLowEndDevice()
    };

    console.log('🔧 Mobile debug mode enabled. Access via window.mobilePerformanceSuite');
  }
}

// Auto-initialize in development mode
if (import.meta.env.DEV) {
  // Enable debug mode
  enableMobileDebugMode();

  // Auto-initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupMobileOptimizations, 100);
    });
  } else {
    setTimeout(setupMobileOptimizations, 100);
  }
}

// Performance monitoring for production
if (!import.meta.env.DEV) {
  // Initialize in production with conservative settings
  document.addEventListener('DOMContentLoaded', () => {
    initializeMobilePerformanceSuite({
      enableCoreWebVitals: true,
      enableAdaptiveLoading: true,
      enableBundleOptimization: true,
      enablePerformanceMonitoring: true,
      enableNetworkOptimization: true,
      enableUIOptimization: true,
      enableDeviceProfiling: true,
      enableImageOptimization: true,
      enablePlatformOptimization: true,
      autoOptimize: false, // Disable auto-optimization in production
      monitoringLevel: 'basic',
      luxuryMode: true,
      performanceProfile: 'medium'
    }).then(() => {
      monitorMobilePerformance();
    }).catch(error => {
      console.error('Failed to initialize mobile performance suite:', error);
    });
  });
}

// Export default for convenience
export default {
  initialize: initializeMobilePerformanceSuite,
  setup: setupMobileOptimizations,
  monitor: monitorMobilePerformance,
  enableDebugMode: enableMobileDebugMode,

  // Individual systems
  coreWebVitals: coreWebVitalsOptimizer,
  adaptiveLoading: adaptiveLoadingSystem,
  bundleOptimizer: bundleOptimizer,
  performanceMonitor: mobilePerformanceMonitor,
  networkOptimizer: networkOptimizer,
  uiOptimizer: mobileUIOptimizer,
  deviceProfiler: devicePerformanceProfiler,
  imageOptimizer: adaptiveImageOptimizer,
  platformOptimizer: platformSpecificOptimizer,
  hub: mobileOptimizationHub
};

// Version information
export const MOBILE_PERFORMANCE_SUITE_VERSION = '1.0.0';
export const MOBILE_PERFORMANCE_SUITE_COMPATIBILITY = {
  minReactVersion: '18.0.0',
  supportedBrowsers: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+'],
  mobileOptimizations: true,
  offlineSupport: true,
  pwaCompatible: true
};