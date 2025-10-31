/**
 * Platform-Specific Performance Optimization System
 * for luxury beauty and fitness booking platform
 *
 * Provides specialized optimizations for iOS, Android, and PWA platforms
 * with device-specific tuning and feature optimization
 */

import { mobilePerformanceOptimizer, DevicePerformanceTier, NetworkQuality } from './mobile-performance-optimizer';
import { mobileNetworkOptimizer } from './mobile-network-optimizer';
import { trackRUMEvent } from '../rum';

// Platform types
export type PlatformType = 'ios' | 'android' | 'pwa' | 'web';

// Device capabilities
interface DeviceCapabilities {
  platform: PlatformType;
  version: string;
  model: string;
  screen: {
    width: number;
    height: number;
    density: number;
    type: 'lcd' | 'oled' | 'amoled';
  };
  hardware: {
    cpu: string;
    gpu: string;
    memory: number;
    storage: number;
    batteryLevel?: number;
  };
  features: {
    hapticFeedback: boolean;
    biometricAuth: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    offlineMode: boolean;
    camera: boolean;
    gps: boolean;
    bluetooth: boolean;
    nfc: boolean;
  };
  performance: {
    cpuScore: number;
    gpuScore: number;
    memoryScore: number;
    overallScore: number;
  };
}

// Platform-specific configuration
interface PlatformConfig {
  // iOS optimizations
  ios: {
    // Safari/iOS specific
    safari: {
      viewportScaling: boolean;
      applePayIntegration: boolean;
      siriShortcuts: boolean;
      spotlightSearch: boolean;
      handoffSupport: boolean;
      continuityCamera: boolean;
    };
    // Performance
    performance: {
      webkitOptimizations: boolean;
      memoryPressureHandling: boolean;
      thermalThrottling: boolean;
      batteryOptimization: boolean;
    };
    // Native features
    native: {
      coreHaptics: boolean;
      faceId: boolean;
      touchId: boolean;
      airDrop: boolean;
      walletIntegration: boolean;
    };
  };

  // Android optimizations
  android: {
    // Chrome/Android specific
    chrome: {
      customTabs: boolean;
      installPrompt: boolean;
      offlineFirst: boolean;
      backgroundSync: boolean;
      pushMessaging: boolean;
    };
    // Performance
    performance: {
      memoryManagement: boolean;
      cpuThrottling: boolean;
      batterySaver: boolean;
      dataSaver: boolean;
    };
    // Native features
    native: {
      fingerprintAuth: boolean;
      faceUnlock: boolean;
      nfcPayment: boolean;
      directShare: boolean;
      adaptiveIcons: boolean;
    };
  };

  // PWA optimizations
  pwa: {
    // Service Worker
    serviceWorker: {
      caching: 'networkFirst' | 'cacheFirst' | 'staleWhileRevalidate';
      backgroundSync: boolean;
      pushNotifications: boolean;
      periodicSync: boolean;
      updateStrategies: 'immediate' | 'relaxed' | 'lazy';
    };
    // App Shell
    appShell: {
      precaching: boolean;
      runtimeCaching: boolean;
      fallbacks: boolean;
      offlineFallback: boolean;
    };
    // Capabilities
    capabilities: {
      installable: boolean;
      standalone: boolean;
      fullscreen: boolean;
      displayMode: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
      orientation: 'any' | 'natural' | 'landscape' | 'portrait';
    };
  };

  // Web optimizations
  web: {
    // Browser optimizations
    browser: {
      progressiveEnhancement: boolean;
      gracefulDegradation: boolean;
      polyfills: boolean;
      featureDetection: boolean;
    };
    // Performance
    performance: {
      resourceHints: boolean;
      prefetching: boolean;
      preloading: boolean;
      compression: boolean;
    };
    // Compatibility
    compatibility: {
      crossBrowser: boolean;
      legacySupport: boolean;
      es6Transpilation: boolean;
      cssPrefixes: boolean;
    };
  };
}

// Performance optimization rules
interface OptimizationRule {
  id: string;
  platform: PlatformType;
  condition: (device: DeviceCapabilities) => boolean;
  action: (device: DeviceCapabilities) => void;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: {
    performance: number;    // 0-100%
    battery: number;        // 0-100%
    memory: number;         // 0-100%
    userExperience: number; // 0-100%
  };
}

// Platform metrics
interface PlatformMetrics {
  platform: PlatformType;
  timestamp: number;
  performance: {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
    memoryUsage: number;
    batteryDrain: number;
  };
  features: {
    enabled: string[];
    disabled: string[];
    failing: string[];
  };
  userExperience: {
    satisfaction: number;    // 0-100
    crashes: number;
    errors: number;
    anrRate: number;         // Application Not Responsive rate
  };
}

class PlatformPerformanceOptimizer {
  private static instance: PlatformPerformanceOptimizer;
  private isInitialized = false;
  private currentPlatform: PlatformType = 'web';
  private deviceCapabilities: DeviceCapabilities;
  private config: PlatformConfig;
  private optimizationRules: OptimizationRule[] = [];
  private metrics: PlatformMetrics[] = [];
  private activeOptimizations: Set<string> = new Set();

  private constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): PlatformPerformanceOptimizer {
    if (!PlatformPerformanceOptimizer.instance) {
      PlatformPerformanceOptimizer.instance = new PlatformPerformanceOptimizer();
    }
    return PlatformPerformanceOptimizer.instance;
  }

  // Initialize the platform optimizer
  initialize(config: Partial<PlatformConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };
    this.currentPlatform = this.detectPlatform();

    try {
      this.initializePlatformDetection();
      this.initializeOptimizationRules();
      this.initializePlatformSpecificOptimizations();
      this.initializePerformanceMonitoring();
      this.initializeAdaptiveOptimizations();
      this.initializeFeatureDetection();
      this.initializeCompatibilityLayer();

      this.isInitialized = true;
      console.log(`[Platform Performance Optimizer] Initialized for ${this.currentPlatform}`);

      // Apply platform-specific optimizations
      this.applyPlatformOptimizations();

      trackRUMEvent('platform-optimizer-initialized', {
        platform: this.currentPlatform,
        deviceCapabilities: this.deviceCapabilities,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Platform Performance Optimizer] Failed to initialize:', error);
    }
  }

  // Detect device capabilities
  private detectDeviceCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent;
    const platform = this.detectPlatform();

    return {
      platform,
      version: this.getPlatformVersion(userAgent, platform),
      model: this.getDeviceModel(userAgent, platform),
      screen: {
        width: screen.width,
        height: screen.height,
        density: window.devicePixelRatio || 1,
        type: this.detectScreenType()
      },
      hardware: {
        cpu: this.detectCPU(),
        gpu: this.detectGPU(),
        memory: (navigator as any).deviceMemory || 4,
        storage: this.estimateStorage(),
        batteryLevel: this.getBatteryLevel()
      },
      features: {
        hapticFeedback: this.detectHapticSupport(),
        biometricAuth: this.detectBiometricAuth(),
        pushNotifications: this.detectPushNotificationSupport(),
        backgroundSync: this.detectBackgroundSyncSupport(),
        offlineMode: 'serviceWorker' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        gps: 'geolocation' in navigator,
        bluetooth: 'bluetooth' in navigator,
        nfc: this.detectNFCSupport()
      },
      performance: {
        cpuScore: this.calculateCPUScore(),
        gpuScore: this.calculateGPUScore(),
        memoryScore: this.calculateMemoryScore(),
        overallScore: 0 // Calculated below
      }
    };
  }

  // Detect platform
  private detectPlatform(): PlatformType {
    const userAgent = navigator.userAgent;

    // Check for iOS
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    }

    // Check for Android
    if (/Android/.test(userAgent)) {
      return 'android';
    }

    // Check for PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone ||
        document.referrer.includes('android-app://')) {
      return 'pwa';
    }

    return 'web';
  }

  // Get platform version
  private getPlatformVersion(userAgent: string, platform: PlatformType): string {
    switch (platform) {
      case 'ios':
        const iOSMatch = userAgent.match(/OS (\d+[_\d]*)/);
        return iOSMatch ? iOSMatch[1].replace('_', '.') : 'unknown';
      case 'android':
        const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
        return androidMatch ? androidMatch[1] : 'unknown';
      default:
        return 'unknown';
    }
  }

  // Get device model
  private getDeviceModel(userAgent: string, platform: PlatformType): string {
    switch (platform) {
      case 'ios':
        if (/iPhone/.test(userAgent)) {
          const iPhoneMatch = userAgent.match(/iPhone; CPU iPhone OS .*like Mac OS X.* AppleWebKit.*Mobile\/(\w+)/);
          return iPhoneMatch ? `iPhone ${iPhoneMatch[1]}` : 'iPhone';
        } else if (/iPad/.test(userAgent)) {
          return 'iPad';
        }
        break;
      case 'android':
        const androidMatch = userAgent.match(/; ([^)]+)\)/);
        return androidMatch ? androidMatch[1] : 'Android Device';
      default:
        return 'Unknown Device';
    }
    return 'Unknown Device';
  }

  // Detect screen type
  private detectScreenType(): 'lcd' | 'oled' | 'amoled' {
    // This is a simplified detection - in reality would need more complex logic
    const platform = this.currentPlatform;

    if (platform === 'ios') {
      // Most newer iPhones use OLED
      const model = this.deviceCapabilities.model;
      if (model.includes('iPhone X') || model.includes('iPhone 1[1-9]')) {
        return 'oled';
      }
    }

    return 'lcd';
  }

  // Detect CPU
  private detectCPU(): string {
    const userAgent = navigator.userAgent;
    const platform = this.currentPlatform;

    if (platform === 'ios') {
      // Apple Silicon detection
      if (/Apple Silicon/.test(userAgent) || /arm64/.test(userAgent)) {
        return 'Apple Silicon';
      }
    } else if (platform === 'android') {
      // ARM processor detection for Android
      if (/arm64|aarch64/.test(userAgent)) {
        return 'ARM64';
      } else if (/arm/.test(userAgent)) {
        return 'ARM32';
      }
    }

    return 'Unknown';
  }

  // Detect GPU
  private detectGPU(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return renderer;
      }
    }

    return 'Unknown';
  }

  // Estimate storage
  private estimateStorage(): number {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return (estimate.quota || 0) / (1024 * 1024 * 1024); // GB
      }).catch(() => 0);
    }
    return 0;
  }

  // Get battery level
  private getBatteryLevel(): number | undefined {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return battery.level;
      }).catch(() => undefined);
    }
    return undefined;
  }

  // Detect haptic support
  private detectHapticSupport(): boolean {
    return 'vibrate' in navigator;
  }

  // Detect biometric authentication
  private detectBiometricAuth(): boolean {
    // This would typically use a dedicated biometric API
    return 'credentials' in navigator && 'PublicKeyCredential' in window;
  }

  // Detect push notification support
  private detectPushNotificationSupport(): boolean {
    return 'PushManager' in window && 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Detect background sync support
  private detectBackgroundSyncSupport(): boolean {
    return 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype;
  }

  // Detect NFC support
  private detectNFCSupport(): boolean {
    return 'nfc' in navigator;
  }

  // Calculate CPU score
  private calculateCPUScore(): number {
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const platform = this.currentPlatform;

    // Base score on CPU cores and platform
    let baseScore = (hardwareConcurrency / 12) * 100; // Normalize to 12 cores

    // Platform-specific adjustments
    if (platform === 'ios') {
      baseScore *= 1.2; // iOS devices generally have better CPU performance
    } else if (platform === 'android') {
      baseScore *= 0.9; // Android devices vary more in performance
    }

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  // Calculate GPU score
  private calculateGPUScore(): number {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) return 30; // Basic score if WebGL not available

    // Check for WebGL 2.0 support
    let score = (gl instanceof WebGL2RenderingContext) ? 70 : 50;

    // Check for specific extensions
    const extensions = [
      'WEBGL_depth_texture',
      'OES_texture_float',
      'WEBGL_draw_buffers',
      'OES_element_index_uint',
      'OES_standard_derivatives'
    ];

    extensions.forEach(ext => {
      if (gl.getExtension(ext)) {
        score += 6;
      }
    });

    return Math.min(100, score);
  }

  // Calculate memory score
  private calculateMemoryScore(): number {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    return Math.min(100, (deviceMemory / 16) * 100); // Normalize to 16GB
  }

  // Get default configuration
  private getDefaultConfig(): PlatformConfig {
    return {
      ios: {
        safari: {
          viewportScaling: true,
          applePayIntegration: true,
          siriShortcuts: true,
          spotlightSearch: true,
          handoffSupport: true,
          continuityCamera: true
        },
        performance: {
          webkitOptimizations: true,
          memoryPressureHandling: true,
          thermalThrottling: true,
          batteryOptimization: true
        },
        native: {
          coreHaptics: true,
          faceId: true,
          touchId: true,
          airDrop: true,
          walletIntegration: true
        }
      },
      android: {
        chrome: {
          customTabs: true,
          installPrompt: true,
          offlineFirst: true,
          backgroundSync: true,
          pushMessaging: true
        },
        performance: {
          memoryManagement: true,
          cpuThrottling: true,
          batterySaver: true,
          dataSaver: true
        },
        native: {
          fingerprintAuth: true,
          faceUnlock: true,
          nfcPayment: true,
          directShare: true,
          adaptiveIcons: true
        }
      },
      pwa: {
        serviceWorker: {
          caching: 'staleWhileRevalidate',
          backgroundSync: true,
          pushNotifications: true,
          periodicSync: true,
          updateStrategies: 'relaxed'
        },
        appShell: {
          precaching: true,
          runtimeCaching: true,
          fallbacks: true,
          offlineFallback: true
        },
        capabilities: {
          installable: true,
          standalone: false,
          fullscreen: false,
          displayMode: 'minimal-ui',
          orientation: 'any'
        }
      },
      web: {
        browser: {
          progressiveEnhancement: true,
          gracefulDegradation: true,
          polyfills: true,
          featureDetection: true
        },
        performance: {
          resourceHints: true,
          prefetching: true,
          preloading: true,
          compression: true
        },
        compatibility: {
          crossBrowser: true,
          legacySupport: true,
          es6Transpilation: true,
          cssPrefixes: true
        }
      }
    };
  }

  // Initialize platform detection
  private initializePlatformDetection(): void {
    // Update device capabilities with more accurate detection
    this.deviceCapabilities.performance.overallScore = this.calculateOverallScore();

    // Detect display mode for PWA
    if (this.currentPlatform === 'pwa') {
      this.updatePWADisplayMode();
    }

    // Monitor platform changes
    this.monitorPlatformChanges();
  }

  // Calculate overall performance score
  private calculateOverallScore(): number {
    const { cpuScore, gpuScore, memoryScore } = this.deviceCapabilities.performance;

    // Weight the scores based on importance for mobile experience
    const weights = {
      cpu: 0.3,
      gpu: 0.4,
      memory: 0.3
    };

    return Math.round(
      cpuScore * weights.cpu +
      gpuScore * weights.gpu +
      memoryScore * weights.memory
    );
  }

  // Update PWA display mode
  private updatePWADisplayMode(): void {
    const displayMode = this.getPWADisplayMode();
    this.config.pwa.capabilities.displayMode = displayMode;
    this.config.pwa.capabilities.standalone = displayMode !== 'browser';
  }

  // Get PWA display mode
  private getPWADisplayMode(): 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser' {
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    } else if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
      return 'standalone';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    return 'browser';
  }

  // Monitor platform changes
  private monitorPlatformChanges(): void {
    // Monitor display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.config.pwa.capabilities.standalone = e.matches;
      this.adaptToDisplayModeChange(e.matches);
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.handleConnectivityChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleConnectivityChange(false);
    });

    // Monitor screen orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });
  }

  // Initialize optimization rules
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // iOS-specific rules
      {
        id: 'ios-safari-viewport',
        platform: 'ios',
        condition: (device) => device.platform === 'ios',
        action: () => this.applyIOSViewportOptimizations(),
        priority: 'critical',
        description: 'Optimize Safari viewport settings for iOS',
        impact: { performance: 80, battery: 60, memory: 50, userExperience: 90 }
      },
      {
        id: 'ios-safari-scroll',
        platform: 'ios',
        condition: (device) => device.platform === 'ios',
        action: () => this.applyIOSScrollOptimizations(),
        priority: 'high',
        description: 'Optimize scrolling behavior for iOS Safari',
        impact: { performance: 70, battery: 40, memory: 30, userExperience: 85 }
      },
      {
        id: 'ios-memory-pressure',
        platform: 'ios',
        condition: (device) => device.platform === 'ios' && device.hardware.memory < 4,
        action: () => this.applyIOSMemoryOptimizations(),
        priority: 'high',
        description: 'Apply memory pressure handling for iOS',
        impact: { performance: 60, battery: 70, memory: 90, userExperience: 50 }
      },

      // Android-specific rules
      {
        id: 'android-chrome-custom-tabs',
        platform: 'android',
        condition: (device) => device.platform === 'android',
        action: () => this.applyAndroidChromeOptimizations(),
        priority: 'high',
        description: 'Optimize for Android Chrome Custom Tabs',
        impact: { performance: 75, battery: 50, memory: 40, userExperience: 80 }
      },
      {
        id: 'android-battery-saver',
        platform: 'android',
        condition: (device) => device.platform === 'android',
        action: () => this.applyAndroidBatteryOptimizations(),
        priority: 'medium',
        description: 'Adapt to Android Battery Saver mode',
        impact: { performance: 50, battery: 90, memory: 30, userExperience: 60 }
      },

      // PWA-specific rules
      {
        id: 'pwa-service-worker',
        platform: 'pwa',
        condition: (device) => device.platform === 'pwa',
        action: () => this.applyPWAOptimizations(),
        priority: 'critical',
        description: 'Optimize PWA service worker and caching',
        impact: { performance: 85, battery: 55, memory: 60, userExperience: 80 }
      },
      {
        id: 'pwa-install-prompt',
        platform: 'pwa',
        condition: (device) => device.platform === 'pwa' && !device.features.installable,
        action: () => this.setupPWAInstallPrompt(),
        priority: 'medium',
        description: 'Setup PWA install prompt for better engagement',
        impact: { performance: 30, battery: 20, memory: 20, userExperience: 70 }
      },

      // General performance rules
      {
        id: 'low-memory-device',
        platform: 'ios' | 'android' | 'pwa' | 'web',
        condition: (device) => device.hardware.memory < 3,
        action: () => this.applyLowMemoryOptimizations(),
        priority: 'high',
        description: 'Apply optimizations for low-memory devices',
        impact: { performance: 70, battery: 60, memory: 95, userExperience: 55 }
      },
      {
        id: 'slow-network-device',
        platform: 'ios' | 'android' | 'pwa' | 'web',
        condition: (device) => {
          const connection = (navigator as any).connection;
          return connection && connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
        },
        action: () => this.applySlowNetworkOptimizations(),
        priority: 'high',
        description: 'Apply optimizations for slow network connections',
        impact: { performance: 65, battery: 40, memory: 30, userExperience: 75 }
      }
    ];
  }

  // Initialize platform-specific optimizations
  private initializePlatformSpecificOptimizations(): void {
    switch (this.currentPlatform) {
      case 'ios':
        this.initializeIOSOptimizations();
        break;
      case 'android':
        this.initializeAndroidOptimizations();
        break;
      case 'pwa':
        this.initializePWAOptimizations();
        break;
      case 'web':
        this.initializeWebOptimizations();
        break;
    }
  }

  // Initialize iOS optimizations
  private initializeIOSOptimizations(): void {
    this.applyIOSViewportOptimizations();
    this.applyIOSScrollOptimizations();
    this.initializeApplePayIntegration();
    this.initializeCoreHaptics();
    this.initializeSiriShortcuts();
  }

  // Apply iOS viewport optimizations
  private applyIOSViewportOptimizations(): void {
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;

    if (viewport) {
      // iOS-specific viewport settings
      const content = viewport.content;
      const newContent = content + ', user-scalable=no, maximum-scale=1.0';
      viewport.content = newContent;
    } else {
      // Create viewport meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0';
      document.head.appendChild(meta);
    }

    // Add iOS-specific styles
    const style = document.createElement('style');
    style.textContent = `
      /* iOS Optimizations */
      body {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior: none;
      }

      input, textarea, select {
        -webkit-appearance: none;
        border-radius: 0;
      }

      .ios-scroll {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }

      /* Prevent zoom on input focus */
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        select, textarea, input[type="text"], input[type="password"],
        input[type="datetime"], input[type="datetime-local"],
        input[type="date"], input[type="month"], input[type="time"],
        input[type="week"], input[type="number"], input[type="email"],
        input[type="url"], input[type="search"], input[type="tel"],
        input[type="color"] {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);

    this.activeOptimizations.add('ios-viewport');
  }

  // Apply iOS scroll optimizations
  private applyIOSScrollOptimizations(): void {
    // Add momentum scrolling classes
    document.addEventListener('DOMContentLoaded', () => {
      const scrollableElements = document.querySelectorAll('.scrollable, .overflow-y-auto');
      scrollableElements.forEach(el => {
        el.classList.add('ios-scroll');
      });
    });

    this.activeOptimizations.add('ios-scroll');
  }

  // Initialize Apple Pay integration
  private initializeApplePayIntegration(): void {
    if (!this.config.ios.safari.applePayIntegration) return;

    if ('ApplePaySession' in window) {
      // Apple Pay is available
      window.addEventListener('load', () => {
        // Setup Apple Pay payment buttons
        const applePayButtons = document.querySelectorAll('.apple-pay-button');
        applePayButtons.forEach(button => {
          this.setupApplePayButton(button as Element);
        });
      });
    }

    this.activeOptimizations.add('apple-pay');
  }

  // Setup Apple Pay button
  private setupApplePayButton(button: Element): void {
    button.addEventListener('click', async () => {
      try {
        // Create Apple Pay session
        const session = new (window as any).ApplePaySession(3, {
          countryCode: 'PL',
          currencyCode: 'PLN',
          supportedNetworks: ['visa', 'masterCard', 'amex'],
          merchantCapabilities: ['supports3DS'],
          total: {
            label: 'mariiaborysevych',
            amount: '0.00'
          }
        });

        // Handle Apple Pay session events
        session.onvalidatemerchant = async (event: any) => {
          // Validate merchant with payment processor
          // This would integrate with your payment gateway
        };

        session.onpaymentauthorized = async (event: any) => {
          // Process payment
          const payment = event.payment;

          // Complete payment
          session.completePayment((window as any).ApplePaySession.STATUS_SUCCESS);
        };

        session.oncancel = () => {
          // Handle cancelled payment
        };

        session.begin();
      } catch (error) {
        console.error('Apple Pay setup failed:', error);
      }
    });
  }

  // Initialize Core Haptics
  private initializeCoreHaptics(): void {
    if (!this.config.ios.native.coreHaptics || !('vibrate' in navigator)) return;

    // Enhanced haptic feedback for iOS devices
    const hapticPatterns = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [10, 50],
      warning: [50, 100],
      error: [100, 50, 100]
    };

    (window as any).hapticFeedback = (type: keyof typeof hapticPatterns) => {
      if (navigator.vibrate) {
        navigator.vibrate(hapticPatterns[type]);
      }
    };

    this.activeOptimizations.add('core-haptics');
  }

  // Initialize Siri Shortcuts
  private initializeSiriShortcuts(): void {
    if (!this.config.ios.safari.siriShortcuts || !('webkitSpeechRecognition' in window)) return;

    // Setup Siri Shortcuts for common actions
    const shortcuts = [
      { phrase: 'Book appointment', action: 'open-booking' },
      { phrase: 'Check availability', action: 'check-availability' },
      { phrase: 'Cancel booking', action: 'cancel-booking' }
    ];

    // This would integrate with iOS Siri Shortcuts API
    // For now, we'll just set up voice recognition
    this.setupVoiceRecognition(shortcuts);

    this.activeOptimizations.add('siri-shortcuts');
  }

  // Setup voice recognition
  private setupVoiceRecognition(shortcuts: any[]): void {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pl-PL'; // Polish language support

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();

      // Check for matching shortcuts
      const matchingShortcut = shortcuts.find(shortcut =>
        transcript.includes(shortcut.phrase.toLowerCase())
      );

      if (matchingShortcut) {
        this.executeShortcut(matchingShortcut.action);
      }
    };

    (window as any).voiceRecognition = recognition;
  }

  // Execute shortcut
  private executeShortcut(action: string): void {
    switch (action) {
      case 'open-booking':
        window.location.href = '/booking';
        break;
      case 'check-availability':
        this.checkAvailability();
        break;
      case 'cancel-booking':
        this.cancelBooking();
        break;
    }
  }

  // Initialize Android optimizations
  private initializeAndroidOptimizations(): void {
    this.applyAndroidChromeOptimizations();
    this.initializeAndroidNotifications();
    this.initializeAndroidBiometrics();
    this.setupAndroidCustomTabs();
  }

  // Apply Android Chrome optimizations
  private applyAndroidChromeOptimizations(): void {
    // Add Android-specific meta tags
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#8B4513'; // Luxury brown theme
      document.head.appendChild(meta);
    }

    // Add Android optimizations styles
    const style = document.createElement('style');
    style.textContent = `
      /* Android Optimizations */
      body {
        overscroll-behavior: contain;
      }

      .android-button {
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .android-card {
        elevation: 2;
        border-radius: 4px;
      }

      /* Material Design ripple effect */
      .android-ripple {
        position: relative;
        overflow: hidden;
      }

      .android-ripple::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }

      .android-ripple:active::before {
        width: 200%;
        height: 200%;
      }
    `;
    document.head.appendChild(style);

    this.activeOptimizations.add('android-chrome');
  }

  // Initialize Android notifications
  private initializeAndroidNotifications(): void {
    if (!this.config.android.chrome.pushMessaging || !('PushManager' in window)) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.setupAndroidPushNotifications();
        }
      });
    }

    this.activeOptimizations.add('android-notifications');
  }

  // Setup Android push notifications
  private setupAndroidPushNotifications(): void {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'your-vapid-public-key-here' // Would be your actual VAPID key
          )
        }).then(subscription => {
          // Send subscription to server
          this.sendNotificationSubscription(subscription);
        });
      });
    }
  }

  // Convert URL base64 to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send notification subscription
  private sendNotificationSubscription(subscription: PushSubscription): void {
    // Send subscription to your server
    fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });
  }

  // Initialize Android biometrics
  private initializeAndroidBiometrics(): void {
    if (!this.config.android.native.fingerprintAuth) return;

    // Check for WebAuthn support
    if ('credentials' in navigator && 'PublicKeyCredential' in window) {
      // Setup biometric authentication
      this.setupBiometricAuth();
    }

    this.activeOptimizations.add('android-biometrics');
  }

  // Setup biometric authentication
  private setupBiometricAuth(): void {
    // This would integrate with Android's biometric authentication
    // For now, we'll just check for availability
    if (navigator.credentials) {
      console.log('Biometric authentication is available');
    }
  }

  // Setup Android Custom Tabs
  private setupAndroidCustomTabs(): void {
    if (!this.config.android.chrome.customTabs) return;

    // Add Custom Tabs support
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const url = (link as HTMLAnchorElement).href;
        this.openCustomTab(url);
        e.preventDefault();
      });
    });

    this.activeOptimizations.add('android-custom-tabs');
  }

  // Open custom tab
  private openCustomTab(url: string): void {
    // This would use Android Custom Tabs
    // For now, we'll just open in a new window
    window.open(url, '_blank');
  }

  // Initialize PWA optimizations
  private initializePWAOptimizations(): void {
    this.setupServiceWorker();
    this.setupPWACaching();
    this.setupPWAInstallPrompt();
    this.setupPWADisplayModes();
  }

  // Setup service worker
  private setupServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available, show update prompt
              this.showServiceWorkerUpdatePrompt();
            }
          });
        }
      });
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });

    this.activeOptimizations.add('pwa-service-worker');
  }

  // Show service worker update prompt
  private showServiceWorkerUpdatePrompt(): void {
    // Create update prompt UI
    const prompt = document.createElement('div');
    prompt.className = 'pwa-update-prompt';
    prompt.innerHTML = `
      <div class="pwa-update-content">
        <h3>Update Available</h3>
        <p>A new version of the app is available. Would you like to update?</p>
        <div class="pwa-update-buttons">
          <button id="pwa-update-yes">Update</button>
          <button id="pwa-update-no">Not Now</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-update-prompt {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1000;
      }

      .pwa-update-content h3 {
        margin: 0 0 8px 0;
        color: #333;
      }

      .pwa-update-content p {
        margin: 0 0 16px 0;
        color: #666;
      }

      .pwa-update-buttons {
        display: flex;
        gap: 8px;
      }

      .pwa-update-buttons button {
        flex: 1;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      #pwa-update-yes {
        background: #007bff;
        color: white;
      }

      #pwa-update-no {
        background: #f8f9fa;
        color: #333;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(prompt);

    // Handle button clicks
    document.getElementById('pwa-update-yes')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('pwa-update-no')?.addEventListener('click', () => {
      prompt.remove();
    });
  }

  // Setup PWA caching
  private setupPWACaching(): void {
    if (!('caches' in window)) return;

    // Preload critical resources
    const criticalResources = [
      '/',
      '/css/critical.css',
      '/js/app.js',
      '/images/logo.webp'
    ];

    caches.open('pwa-critical').then(cache => {
      cache.addAll(criticalResources);
    });

    this.activeOptimizations.add('pwa-caching');
  }

  // Setup PWA install prompt
  private setupPWAInstallPrompt(): void {
    if (!this.config.pwa.serviceWorker.installPrompt) return;

    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.trackPWAInstallation();
    });

    (window as any).deferredPrompt = deferredPrompt;
  }

  // Show install prompt
  private showInstallPrompt(): void {
    // Create install prompt UI
    const prompt = document.createElement('div');
    prompt.className = 'pwa-install-prompt';
    prompt.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-icon">📱</div>
        <h3>Install App</h3>
        <p>Install our app for a better experience with offline support and push notifications.</p>
        <div class="pwa-install-buttons">
          <button id="pwa-install-yes">Install</button>
          <button id="pwa-install-no">Not Now</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-prompt {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 20px;
        z-index: 1000;
        text-align: center;
      }

      .pwa-install-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .pwa-install-content h3 {
        margin: 0 0 8px 0;
        color: #333;
      }

      .pwa-install-content p {
        margin: 0 0 20px 0;
        color: #666;
      }

      .pwa-install-buttons {
        display: flex;
        gap: 12px;
      }

      .pwa-install-buttons button {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }

      #pwa-install-yes {
        background: #007bff;
        color: white;
      }

      #pwa-install-no {
        background: #f8f9fa;
        color: #333;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(prompt);

    // Handle button clicks
    document.getElementById('pwa-install-yes')?.addEventListener('click', () => {
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          deferredPrompt = null;
        });
      }
      prompt.remove();
    });

    document.getElementById('pwa-install-no')?.addEventListener('click', () => {
      prompt.remove();
    });
  }

  // Setup PWA display modes
  private setupPWADisplayModes(): void {
    // Add display mode specific optimizations
    const displayMode = this.getPWADisplayMode();

    switch (displayMode) {
      case 'fullscreen':
        document.body.classList.add('pwa-fullscreen');
        break;
      case 'standalone':
        document.body.classList.add('pwa-standalone');
        break;
      case 'minimal-ui':
        document.body.classList.add('pwa-minimal-ui');
        break;
    }

    this.activeOptimizations.add('pwa-display-modes');
  }

  // Track PWA installation
  private trackPWAInstallation(): void {
    trackRUMEvent('pwa-installed', {
      platform: this.currentPlatform,
      timestamp: Date.now()
    });
  }

  // Initialize web optimizations
  private initializeWebOptimizations(): void {
    this.applyWebCompatibilityFixes();
    this.setupWebResourceHints();
    this.initializeWebPerformanceOptimizations();
  }

  // Apply web compatibility fixes
  private applyWebCompatibilityFixes(): void {
    // Add polyfills and compatibility code
    const style = document.createElement('style');
    style.textContent = `
      /* Web Compatibility Fixes */
      @supports not (display: grid) {
        .grid { display: flex; flex-wrap: wrap; }
        .grid > * { width: 100%; }
      }

      @supports not (backdrop-filter: blur(10px)) {
        .blur-effect {
          background: rgba(255, 255, 255, 0.9);
        }
      }

      /* Fallback for older browsers */
      .no-js .js-only { display: none; }
      .js .no-js-only { display: none; }
    `;
    document.head.appendChild(style);

    this.activeOptimizations.add('web-compatibility');
  }

  // Setup web resource hints
  private setupWebResourceHints(): void {
    if (!this.config.web.performance.resourceHints) return;

    // Add DNS prefetch hints
    const dnsPrefetchDomains = [
      'fonts.googleapis.com',
      'cdn.jsdelivr.net',
      'api.mariaborysevych.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Add preconnect hints
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });

    this.activeOptimizations.add('web-resource-hints');
  }

  // Initialize web performance optimizations
  private initializeWebPerformanceOptimizations(): void {
    // Optimize loading performance
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.loadNonCriticalResources();
      });
    }

    this.activeOptimizations.add('web-performance');
  }

  // Load non-critical resources
  private loadNonCriticalResources(): void {
    // Load non-critical CSS
    const nonCriticalCSS = [
      '/css/non-critical.css',
      '/css/animations.css'
    ];

    nonCriticalCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });

    // Load non-critical JavaScript
    const nonCriticalJS = [
      '/js/analytics.js',
      '/js/social.js'
    ];

    nonCriticalJS.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    });
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor platform-specific performance metrics
    setInterval(() => {
      this.collectPlatformMetrics();
    }, 30000); // Every 30 seconds

    // Monitor performance changes
    this.monitorPerformanceChanges();
  }

  // Collect platform metrics
  private collectPlatformMetrics(): void {
    const metrics: PlatformMetrics = {
      platform: this.currentPlatform,
      timestamp: Date.now(),
      performance: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        renderTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        interactionTime: this.measureInteractionTime(),
        memoryUsage: this.measureMemoryUsage(),
        batteryDrain: this.measureBatteryDrain()
      },
      features: {
        enabled: Array.from(this.activeOptimizations),
        disabled: this.getDisabledFeatures(),
        failing: this.getFailingFeatures()
      },
      userExperience: {
        satisfaction: this.calculateUserSatisfaction(),
        crashes: 0, // Would be tracked separately
        errors: this.getErrorCount(),
        anrRate: this.calculateANRRate()
      }
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Track RUM event
    trackRUMEvent('platform-metrics-collected', {
      platform: this.currentPlatform,
      metrics,
      timestamp: Date.now()
    });
  }

  // Measure interaction time
  private measureInteractionTime(): number {
    // This would measure average time for user interactions
    return 150; // Placeholder
  }

  // Measure memory usage
  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  // Measure battery drain
  private measureBatteryDrain(): number {
    // This would measure battery consumption rate
    return 0; // Placeholder
  }

  // Get disabled features
  private getDisabledFeatures(): string[] {
    const features: string[] = [];

    if (!this.deviceCapabilities.features.hapticFeedback) features.push('haptic-feedback');
    if (!this.deviceCapabilities.features.pushNotifications) features.push('push-notifications');
    if (!this.deviceCapabilities.features.backgroundSync) features.push('background-sync');

    return features;
  }

  // Get failing features
  private getFailingFeatures(): string[] {
    // This would track features that are currently failing
    return [];
  }

  // Calculate user satisfaction
  private calculateUserSatisfaction(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 50;

    const avgLoadTime = recentMetrics.reduce((sum, m) => sum + m.performance.loadTime, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.performance.memoryUsage, 0) / recentMetrics.length;

    let satisfaction = 50;

    // Load time impact
    if (avgLoadTime < 1000) satisfaction += 30;
    else if (avgLoadTime > 3000) satisfaction -= 30;

    // Memory usage impact
    if (avgMemoryUsage < 60) satisfaction += 20;
    else if (avgMemoryUsage > 80) satisfaction -= 20;

    return Math.max(0, Math.min(100, satisfaction));
  }

  // Get error count
  private getErrorCount(): number {
    // This would track JavaScript errors
    return 0; // Placeholder
  }

  // Calculate ANR rate
  private calculateANRRate(): number {
    // This would calculate Application Not Responsive rate
    return 0; // Placeholder
  }

  // Monitor performance changes
  private monitorPerformanceChanges(): void {
    // Monitor for performance degradation
    setInterval(() => {
      this.checkPerformanceDegradation();
    }, 60000); // Every minute
  }

  // Check performance degradation
  private checkPerformanceDegradation(): void {
    if (this.metrics.length < 5) return;

    const recentMetrics = this.metrics.slice(-5);
    const olderMetrics = this.metrics.slice(-10, -5);

    if (olderMetrics.length === 0) return;

    const recentAvgPerformance = recentMetrics.reduce((sum, m) =>
      sum + (m.performance.loadTime + m.performance.renderTime), 0) / recentMetrics.length;
    const olderAvgPerformance = olderMetrics.reduce((sum, m) =>
      sum + (m.performance.loadTime + m.performance.renderTime), 0) / olderMetrics.length;

    const degradation = ((recentAvgPerformance - olderAvgPerformance) / olderAvgPerformance) * 100;

    if (degradation > 20) {
      this.handlePerformanceDegradation(degradation);
    }
  }

  // Handle performance degradation
  private handlePerformanceDegradation(degradation: number): void {
    // Apply more aggressive optimizations
    this.applyAggressiveOptimizations();

    trackRUMEvent('platform-performance-degradation', {
      platform: this.currentPlatform,
      degradation,
      timestamp: Date.now()
    });
  }

  // Initialize adaptive optimizations
  private initializeAdaptiveOptimizations(): void {
    // Adapt to device capabilities
    this.adaptToDeviceCapabilities();

    // Adapt to network conditions
    this.adaptToNetworkConditions();

    // Adapt to battery level
    this.adaptToBatteryLevel();

    // Continuously monitor and adapt
    setInterval(() => {
      this.adaptToCurrentConditions();
    }, 60000); // Every minute
  }

  // Adapt to device capabilities
  private adaptToDeviceCapabilities(): void {
    const { performance } = this.deviceCapabilities;

    if (performance.overallScore < 50) {
      this.applyLowPerformanceOptimizations();
    } else if (performance.overallScore > 80) {
      this.applyHighPerformanceOptimizations();
    }
  }

  // Apply low performance optimizations
  private applyLowPerformanceOptimizations(): void {
    // Disable expensive features
    this.config.luxury.premiumAnimations = false;
    this.config.luxury.particleEffects = false;
    this.config.performance.frameRate = 30;

    // Apply aggressive caching
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.updateConfiguration({
        caching: {
          strategy: 'cache-first',
          ttl: {
            api: 600, // 10 minutes
            images: 1209600 // 14 days
          }
        }
      });
    }
  }

  // Apply high performance optimizations
  private applyHighPerformanceOptimizations(): void {
    // Enable all features
    this.config.luxury.premiumAnimations = true;
    this.config.luxury.particleEffects = true;
    this.config.performance.frameRate = 60;

    // Optimize for speed
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.updateConfiguration({
        requests: {
          batching: {
            enabled: false
          }
        }
      });
    }
  }

  // Adapt to network conditions
  private adaptToNetworkConditions(): void {
    const networkQuality = mobileNetworkOptimizer?.getNetworkQuality() || NetworkQuality.MODERATE;

    switch (networkQuality) {
      case NetworkQuality.SLOW:
        this.applySlowNetworkOptimizations();
        break;
      case NetworkQuality.EXCELLENT:
        this.applyFastNetworkOptimizations();
        break;
    }
  }

  // Apply slow network optimizations
  private applySlowNetworkOptimizations(): void {
    // Reduce image quality
    if (mobileAssetOptimizer) {
      mobileAssetOptimizer.updateConfiguration({
        images: {
          quality: {
            excellent: 60,
            good: 50,
            moderate: 40,
            slow: 30
          }
        }
      });
    }

    // Enable aggressive caching
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.updateConfiguration({
        adaptive: {
          fallbackStrategies: {
            dataReduction: 70,
            imageQuality: 50,
            featureParity: 30
          }
        }
      });
    }
  }

  // Apply fast network optimizations
  private applyFastNetworkOptimizations(): void {
    // Increase image quality
    if (mobileAssetOptimizer) {
      mobileAssetOptimizer.updateConfiguration({
        images: {
          quality: {
            excellent: 95,
            good: 90,
            moderate: 80,
            slow: 70
          }
        }
      });
    }

    // Enable prefetching
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.updateConfiguration({
        predictive: {
          preloading: {
            enabled: true,
            maxResources: 10
          }
        }
      });
    }
  }

  // Adapt to battery level
  private adaptToBatteryLevel(): void {
    const batteryLevel = this.deviceCapabilities.hardware.batteryLevel;

    if (batteryLevel !== undefined && batteryLevel < 0.2) {
      this.applyLowBatteryOptimizations();
    }
  }

  // Apply low battery optimizations
  private applyLowBatteryOptimizations(): void {
    // Disable expensive features
    this.config.touch.hapticFeedback = false;
    this.config.luxury.premiumAnimations = false;
    this.config.performance.frameRate = 30;

    // Reduce background activity
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.updateConfiguration({
        offline: {
          sync: {
            interval: 120 // 2 minutes
          }
        }
      });
    }
  }

  // Adapt to current conditions
  private adaptToCurrentConditions(): void {
    // Re-evaluate current conditions and adapt
    this.adaptToDeviceCapabilities();
    this.adaptToNetworkConditions();
    this.adaptToBatteryLevel();
  }

  // Initialize feature detection
  private initializeFeatureDetection(): void {
    // Detect and log available features
    this.detectAvailableFeatures();

    // Monitor feature availability changes
    this.monitorFeatureChanges();
  }

  // Detect available features
  private detectAvailableFeatures(): void {
    const features = {
      webgl: !!((window as any).WebGLRenderingContext),
      webgl2: !!((window as any).WebGL2RenderingContext),
      webWorker: !!window.Worker,
      serviceWorker: !!('serviceWorker' in navigator),
      pushNotifications: !!('PushManager' in window),
      webBluetooth: !!('bluetooth' in navigator),
      webNFC: !!('nfc' in navigator),
      webShare: !!('share' in navigator),
      webVibration: !!('vibrate' in navigator),
      camera: !!('mediaDevices' in navigator),
      geolocation: !!('geolocation' in navigator)
    };

    trackRUMEvent('platform-features-detected', {
      platform: this.currentPlatform,
      features,
      timestamp: Date.now()
    });
  }

  // Monitor feature changes
  private monitorFeatureChanges(): void {
    // Monitor for changes in feature availability
    window.addEventListener('online', () => {
      this.detectAvailableFeatures();
    });

    window.addEventListener('offline', () => {
      this.detectAvailableFeatures();
    });
  }

  // Initialize compatibility layer
  private initializeCompatibilityLayer(): void {
    // Add polyfills for missing features
    this.addPolyfills();

    // Setup graceful degradation
    this.setupGracefulDegradation();

    // Add progressive enhancement
    this.setupProgressiveEnhancement();
  }

  // Add polyfills
  private addPolyfills(): void {
    // Add polyfills for missing Web APIs
    if (!('IntersectionObserver' in window)) {
      // Load Intersection Observer polyfill
      this.loadPolyfill('intersection-observer');
    }

    if (!('ResizeObserver' in window)) {
      // Load Resize Observer polyfill
      this.loadPolyfill('resize-observer');
    }

    if (!('fetch' in window)) {
      // Load fetch polyfill
      this.loadPolyfill('fetch');
    }
  }

  // Load polyfill
  private loadPolyfill(name: string): void {
    // This would load the appropriate polyfill from CDN
    const script = document.createElement('script');
    script.src = `https://polyfill.io/v3/polyfill.min.js?features=${name}`;
    script.async = true;
    document.head.appendChild(script);
  }

  // Setup graceful degradation
  private setupGracefulDegradation(): void {
    // Add fallbacks for unsupported features
    const style = document.createElement('style');
    style.textContent = `
      /* Graceful Degradation */
      .no-flexbox .flex-container {
        display: block;
      }

      .no-cssgrid .grid-container {
        display: block;
      }

      .no-js .js-only {
        display: none;
      }

      .no-webgl .webgl-content {
        display: none;
      }

      .no-webgl .webgl-fallback {
        display: block;
      }
    `;
    document.head.appendChild(style);

    // Add no-js class
    document.documentElement.className = document.documentElement.className.replace('no-js', 'js');

    // Add feature detection classes
    this.addFeatureDetectionClasses();
  }

  // Add feature detection classes
  private addFeatureDetectionClasses(): void {
    const features = {
      flexbox: CSS.supports('display', 'flex'),
      cssgrid: CSS.supports('display', 'grid'),
      webgl: !!((window as any).WebGLRenderingContext),
      webgl2: !!((window as any).WebGL2RenderingContext),
      touch: 'ontouchstart' in window
    };

    Object.entries(features).forEach(([feature, supported]) => {
      if (supported) {
        document.documentElement.classList.add(feature);
      } else {
        document.documentElement.classList.add(`no-${feature}`);
      }
    });
  }

  // Setup progressive enhancement
  private setupProgressiveEnhancement(): void {
    // Start with basic functionality and enhance progressively
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.enhanceProgressively();
      });
    } else {
      this.enhanceProgressively();
    }
  }

  // Enhance progressively
  private enhanceProgressively(): void {
    // Enhance based on available features
    if (CSS.supports('display', 'grid')) {
      this.enableGridLayouts();
    }

    if ('IntersectionObserver' in window) {
      this.enableLazyLoading();
    }

    if ('ResizeObserver' in window) {
      this.enableResponsiveComponents();
    }
  }

  // Enable grid layouts
  private enableGridLayouts(): void {
    document.querySelectorAll('.enhance-grid').forEach(element => {
      element.classList.add('grid-layout');
    });
  }

  // Enable lazy loading
  private enableLazyLoading(): void {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.getAttribute('data-src')!;
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // Enable responsive components
  private enableResponsiveComponents(): void {
    const responsiveElements = document.querySelectorAll('.responsive');
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target as Element;
        this.updateResponsiveElement(element, entry.contentRect);
      });
    });

    responsiveElements.forEach(element => resizeObserver.observe(element));
  }

  // Update responsive element
  private updateResponsiveElement(element: Element, rect: DOMRectReadOnly): void {
    const width = rect.width;

    // Update based on width
    if (width < 480) {
      element.classList.add('mobile-layout');
      element.classList.remove('tablet-layout', 'desktop-layout');
    } else if (width < 768) {
      element.classList.add('tablet-layout');
      element.classList.remove('mobile-layout', 'desktop-layout');
    } else {
      element.classList.add('desktop-layout');
      element.classList.remove('mobile-layout', 'tablet-layout');
    }
  }

  // Apply platform optimizations
  private applyPlatformOptimizations(): void {
    // Apply matching optimization rules
    const applicableRules = this.optimizationRules.filter(rule =>
      rule.platform === this.currentPlatform || rule.platform === 'web'
    );

    applicableRules
      .filter(rule => rule.condition(this.deviceCapabilities))
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
      .forEach(rule => {
        if (!this.activeOptimizations.has(rule.id)) {
          rule.action(this.deviceCapabilities);
          this.activeOptimizations.add(rule.id);

          trackRUMEvent('platform-optimization-applied', {
            ruleId: rule.id,
            platform: this.currentPlatform,
            priority: rule.priority,
            timestamp: Date.now()
          });
        }
      });
  }

  // Get priority score
  private getPriorityScore(priority: string): number {
    const scores = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };
    return scores[priority as keyof typeof scores] || 0;
  }

  // Handle connectivity change
  private handleConnectivityChange(isOnline: boolean): void {
    if (isOnline) {
      // Coming back online
      this.syncOfflineData();
      this.refreshData();
    } else {
      // Going offline
      this.enableOfflineMode();
    }
  }

  // Sync offline data
  private syncOfflineData(): void {
    if (mobileNetworkOptimizer) {
      mobileNetworkOptimizer.forceSyncOfflineData();
    }
  }

  // Refresh data
  private refreshData(): void {
    // Refresh critical data when coming back online
    this.refreshCriticalData();
  }

  // Refresh critical data
  private refreshCriticalData(): void {
    // Refresh essential data like services and availability
    fetch('/api/services')
      .then(response => response.json())
      .catch(error => console.error('Failed to refresh services:', error));

    fetch('/api/availability')
      .then(response => response.json())
      .catch(error => console.error('Failed to refresh availability:', error));
  }

  // Enable offline mode
  private enableOfflineMode(): void {
    document.body.classList.add('offline-mode');
  }

  // Handle orientation change
  private handleOrientationChange(): void {
    // Adjust layout for new orientation
    setTimeout(() => {
      this.adjustLayoutForOrientation();
    }, 100);
  }

  // Adjust layout for orientation
  private adjustLayoutForOrientation(): void {
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isLandscape) {
      document.body.classList.add('landscape-orientation');
      document.body.classList.remove('portrait-orientation');
    } else {
      document.body.classList.add('portrait-orientation');
      document.body.classList.remove('landscape-orientation');
    }
  }

  // Adapt to display mode change
  private adaptToDisplayModeChange(isStandalone: boolean): void {
    if (isStandalone) {
      document.body.classList.add('pwa-standalone');
      this.applyPWAStandaloneOptimizations();
    } else {
      document.body.classList.remove('pwa-standalone');
      this.applyPWABrowserOptimizations();
    }
  }

  // Apply PWA standalone optimizations
  private applyPWAStandaloneOptimizations(): void {
    // Hide browser-specific UI elements
    document.querySelectorAll('.browser-only').forEach(el => {
      el.classList.add('hidden');
    });

    // Enable PWA-specific features
    this.enablePWASpecificFeatures();
  }

  // Apply PWA browser optimizations
  private applyPWABrowserOptimizations(): void {
    // Show browser-specific UI elements
    document.querySelectorAll('.browser-only').forEach(el => {
      el.classList.remove('hidden');
    });

    // Show install prompt more prominently
    this.showInstallPrompt();
  }

  // Enable PWA-specific features
  private enablePWASpecificFeatures(): void {
    // Enable features that make sense in standalone mode
    if ('share' in navigator) {
      this.enableNativeSharing();
    }
  }

  // Enable native sharing
  private enableNativeSharing(): void {
    document.querySelectorAll('.share-button').forEach(button => {
      button.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'mariiaborysevych - Beauty & Fitness Booking',
            text: 'Book luxury beauty and fitness services in Warsaw',
            url: window.location.href
          });
        }
      });
    });
  }

  // Apply PWA optimizations
  private applyPWAOptimizations(): void {
    // Already handled in initializePWAOptimizations
  }

  // Apply aggressive optimizations
  private applyAggressiveOptimizations(): void {
    // Apply most aggressive settings
    this.applyLowPerformanceOptimizations();
    this.applySlowNetworkOptimizations();
    this.applyLowBatteryOptimizations();
  }

  // Apply low memory optimizations
  private applyLowMemoryOptimizations(): void {
    if (this.currentPlatform === 'ios') {
      this.applyIOSMemoryOptimizations();
    } else if (this.currentPlatform === 'android') {
      this.applyAndroidMemoryOptimizations();
    }

    // General memory optimizations
    this.clearUnusedMemory();
    this.reduceMemoryFootprint();
  }

  // Apply iOS memory optimizations
  private applyIOSMemoryOptimizations(): void {
    // iOS-specific memory handling
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usageRatio > 0.8) {
        // Trigger garbage collection hint
        if ((window as any).gc) {
          (window as any).gc();
        }

        // Reduce image quality and caching
        if (mobileAssetOptimizer) {
          mobileAssetOptimizer.updateConfiguration({
            images: {
              quality: {
                excellent: 50,
                good: 40,
                moderate: 30,
                slow: 25
              }
            }
          });
        }
      }
    }
  }

  // Apply Android memory optimizations
  private applyAndroidMemoryOptimizations(): void {
    // Android-specific memory handling
    document.body.classList.add('android-memory-optimized');

    // Reduce animation complexity
    this.config.feedback.animations.enabled = false;
  }

  // Clear unused memory
  private clearUnusedMemory(): void {
    // Clear caches and unused data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.open(cacheName).then(cache => {
            cache.keys().then(keys => {
              keys.forEach(key => {
                const url = key.url;
                if (url.includes('/temp/') || url.includes('/cache/')) {
                  cache.delete(key);
                }
              });
            });
          });
        });
      });
    }
  }

  // Reduce memory footprint
  private reduceMemoryFootprint(): void {
    // Remove unused DOM elements
    document.querySelectorAll('.temp-element').forEach(el => {
      el.remove();
    });

    // Clear event listeners on removed elements
    this.cleanupEventListeners();
  }

  // Cleanup event listeners
  private cleanupEventListeners(): void {
    // This would clean up event listeners on removed elements
    // Implementation would depend on your event tracking system
  }

  // Apply slow network optimizations
  private applySlowNetworkOptimizations(): void {
    // Already handled in adaptToNetworkConditions
  }

  // Check availability
  private checkAvailability(): void {
    fetch('/api/availability')
      .then(response => response.json())
      .then(data => {
        // Update availability UI
        this.updateAvailabilityUI(data);
      })
      .catch(error => {
        console.error('Failed to check availability:', error);
      });
  }

  // Update availability UI
  private updateAvailabilityUI(data: any): void {
    // Update availability display
    const availabilityElements = document.querySelectorAll('.availability-display');
    availabilityElements.forEach(el => {
      // Update element with availability data
      // Implementation depends on your UI structure
    });
  }

  // Cancel booking
  private cancelBooking(): void {
    // Handle booking cancellation
    window.location.href = '/booking/cancel';
  }

  // Public API methods

  // Get current platform
  getCurrentPlatform(): PlatformType {
    return this.currentPlatform;
  }

  // Get device capabilities
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  // Get configuration
  getConfiguration(): PlatformConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfiguration(config: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyPlatformOptimizations();
  }

  // Get active optimizations
  getActiveOptimizations(): string[] {
    return Array.from(this.activeOptimizations);
  }

  // Get platform metrics
  getPlatformMetrics(): PlatformMetrics[] {
    return [...this.metrics];
  }

  // Get optimization rules
  getOptimizationRules(): OptimizationRule[] {
    return [...this.optimizationRules];
  }

  // Add custom optimization rule
  addOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.push(rule);
  }

  // Remove optimization rule
  removeOptimizationRule(ruleId: string): void {
    this.optimizationRules = this.optimizationRules.filter(rule => rule.id !== ruleId);
  }

  // Apply custom optimization
  applyCustomOptimization(ruleId: string): void {
    const rule = this.optimizationRules.find(r => r.id === ruleId);
    if (rule && rule.condition(this.deviceCapabilities)) {
      rule.action(this.deviceCapabilities);
      this.activeOptimizations.add(ruleId);
    }
  }

  // Export optimizer data
  exportData(): any {
    return {
      currentPlatform: this.currentPlatform,
      deviceCapabilities: this.deviceCapabilities,
      config: this.config,
      activeOptimizations: Array.from(this.activeOptimizations),
      metrics: this.metrics,
      optimizationRules: this.optimizationRules,
      exportTimestamp: Date.now()
    };
  }
}

// Create and export singleton instance
export const platformPerformanceOptimizer = PlatformPerformanceOptimizer.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    platformPerformanceOptimizer.initialize();
  } else {
    window.addEventListener('load', () => {
      platformPerformanceOptimizer.initialize();
    });
  }
}

// Export helper functions
export const initializePlatformPerformanceOptimizer = (config?: Partial<PlatformConfig>) =>
  platformPerformanceOptimizer.initialize(config);
export const getCurrentPlatform = () => platformPerformanceOptimizer.getCurrentPlatform();
export const getDeviceCapabilities = () => platformPerformanceOptimizer.getDeviceCapabilities();
export const getPlatformMetrics = () => platformPerformanceOptimizer.getPlatformMetrics();
export const getActivePlatformOptimizations = () => platformPerformanceOptimizer.getActiveOptimizations();
export const applyCustomPlatformOptimization = (ruleId: string) =>
  platformPerformanceOptimizer.applyCustomOptimization(ruleId);
export const exportPlatformOptimizerData = () => platformPerformanceOptimizer.exportData();

// Export types
export {
  PlatformType,
  DeviceCapabilities,
  PlatformConfig,
  OptimizationRule,
  PlatformMetrics
};