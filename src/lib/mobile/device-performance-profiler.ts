/**
 * Device Performance Profiler
 * Implements performance profiles for different device tiers with adaptive optimization
 */

export interface DeviceProfile {
  tier: 'premium' | 'high' | 'medium' | 'low' | 'legacy';
  score: number; // 0-100
  capabilities: {
    memory: number; // Estimated RAM in GB
    cpuCores: number;
    gpuTier: 'high' | 'medium' | 'low';
    networkSpeed: 'fast' | 'medium' | 'slow';
    batteryLevel?: number;
    isLowPowerMode?: boolean;
  };
  optimizations: {
    imageQuality: number; // 1-100
    animationLevel: 'full' | 'reduced' | 'minimal' | 'disabled';
    lazyLoading: boolean;
    prefetching: boolean;
    compressionLevel: number; // 1-9
    maxConcurrentRequests: number;
    cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
    renderMethod: 'client' | 'hybrid' | 'server';
  };
  performanceTargets: {
    maxFirstPaint: number; // ms
    maxFirstContentfulPaint: number; // ms
    maxLargestContentfulPaint: number; // ms
    maxFirstInputDelay: number; // ms
    maxCumulativeLayoutShift: number;
    maxTotalBlockingTime: number; // ms
  };
  uiSettings: {
    enableAnimations: boolean;
    enableParallax: boolean;
    enableBlur: boolean;
    enableShadows: boolean;
    enableTransitions: boolean;
    maxAnimationDuration: number; // ms
  };
}

export interface BenchmarkResult {
  name: string;
  value: number;
  unit: string;
  category: 'cpu' | 'gpu' | 'memory' | 'network' | 'storage';
  score: number; // 0-100
}

export interface PerformanceProfile {
  deviceInfo: {
    userAgent: string;
    hardware: {
      cores: number;
      memory: number;
      devicePixelRatio: number;
      screenSize: { width: number; height: number };
      orientation: string;
    };
    software: {
      os: string;
      osVersion: string;
      browser: string;
      browserVersion: string;
      isWebView: boolean;
    };
  };
  benchmarks: BenchmarkResult[];
  profile: DeviceProfile;
  confidence: number; // 0-100
  timestamp: number;
}

export class DevicePerformanceProfiler {
  private profile: PerformanceProfile | null = null;
  private isInitialized: boolean = false;
  private performanceObserver: PerformanceObserver | null = null;
  private benchmarks: Map<string, BenchmarkResult> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🔧 Initializing Device Performance Profiler');

    try {
      // Collect device information
      const deviceInfo = this.collectDeviceInfo();

      // Run benchmarks
      await this.runBenchmarks();

      // Calculate performance profile
      this.profile = await this.calculatePerformanceProfile(deviceInfo);

      // Apply optimizations based on profile
      this.applyProfileOptimizations();

      // Set up monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      console.log('✅ Device Performance Profiler initialized', this.profile.profile.tier);

    } catch (error) {
      console.error('❌ Failed to initialize Device Performance Profiler:', error);
      // Fallback to basic profile
      this.profile = this.createFallbackProfile();
      this.isInitialized = true;
    }
  }

  private collectDeviceInfo(): PerformanceProfile['deviceInfo'] {
    const ua = navigator.userAgent;
    const screen = window.screen;

    // Extract hardware information
    const hardware = {
      cores: navigator.hardwareConcurrency || 4,
      memory: this.estimateDeviceMemory(),
      devicePixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: screen.width,
        height: screen.height
      },
      orientation: screen.orientation?.type || 'unknown'
    };

    // Extract software information
    const software = {
      os: this.detectOS(ua),
      osVersion: this.detectOSVersion(ua),
      browser: this.detectBrowser(ua),
      browserVersion: this.detectBrowserVersion(ua),
      isWebView: this.detectWebView(ua)
    };

    return {
      userAgent: ua,
      hardware,
      software
    };
  }

  private estimateDeviceMemory(): number {
    // Use the Device Memory API if available
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }

    // Fallback estimation based on heuristics
    const cores = navigator.hardwareConcurrency || 4;
    const isHighEnd = cores >= 8 || this.detectHighEndDevice();

    if (isHighEnd) return 8; // High-end devices typically have 8GB+
    if (cores >= 4) return 4; // Mid-range typically have 4GB+
    return 2; // Low-end typically have 2GB or less
  }

  private detectHighEndDevice(): boolean {
    const ua = navigator.userAgent;

    // Check for high-end device indicators
    const highEndPatterns = [
      /iPhone1[4-9]/, // iPhone 14 and newer
      /iPad(13|14|15)/, // iPad Pro 13, iPad Air/Pro 14-15
      /SM-G99[1-8]/, // Samsung Galaxy S21-S23
      /SM-G9[8-9][0-9]/, // Samsung Galaxy S20-S24
      /Pixel [6-9]/, // Google Pixel 6-9
    ];

    return highEndPatterns.some(pattern => pattern.test(ua));
  }

  private detectOS(ua: string): string {
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  private detectOSVersion(ua: string): string {
    // iOS version
    const iOSMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iOSMatch) return `${iOSMatch[1]}.${iOSMatch[2]}`;

    // Android version
    const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/);
    if (androidMatch) return androidMatch[1];

    return 'Unknown';
  }

  private detectBrowser(ua: string): string {
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Edg/.test(ua)) return 'Edge';
    if (/Opera/.test(ua)) return 'Opera';
    return 'Unknown';
  }

  private detectBrowserVersion(ua: string): string {
    const versionMatch = ua.match(/(?:Chrome|Firefox|Safari|Edg|Opera)\/(\d+(?:\.\d+)?)/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  }

  private detectWebView(ua: string): boolean {
    const webViewPatterns = [
      /wv/, // Android WebView
      /Version\/.*Mobile\/.*Safari/, // iOS WebView
      /FBAN|FBAV/, // Facebook WebView
      /Twitter|Instagram/, // Social media WebViews
    ];

    return webViewPatterns.some(pattern => pattern.test(ua));
  }

  private async runBenchmarks(): Promise<void> {
    console.log('🏃 Running device performance benchmarks');

    const benchmarkTasks = [
      this.benchmarkCPU(),
      this.benchmarkMemory(),
      this.benchmarkGPU(),
      this.benchmarkNetwork(),
      this.benchmarkStorage()
    ];

    const results = await Promise.allSettled(benchmarkTasks);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const benchmark = result.value as BenchmarkResult;
        this.benchmarks.set(benchmark.name, benchmark);
      } else {
        console.warn(`Benchmark ${index} failed:`, result.reason);
      }
    });
  }

  private async benchmarkCPU(): Promise<BenchmarkResult> {
    const startTime = performance.now();

    // Simple computational benchmark
    const iterations = 1000000;
    let result = 0;

    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Score based on performance (lower is better)
    const score = Math.max(0, Math.min(100, 100 - (duration / 10)));

    return {
      name: 'CPU Computation',
      value: duration,
      unit: 'ms',
      category: 'cpu',
      score
    };
  }

  private async benchmarkMemory(): Promise<BenchmarkResult> {
    const startTime = performance.now();

    // Memory allocation benchmark
    const arrays: number[][] = [];
    const arraySize = 10000;
    const arrayCount = 100;

    for (let i = 0; i < arrayCount; i++) {
      arrays.push(new Array(arraySize).fill(0).map(() => Math.random()));
    }

    // Sort all arrays to force memory access
    arrays.forEach(array => array.sort());

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Score based on memory performance
    const score = Math.max(0, Math.min(100, 100 - (duration / 20)));

    return {
      name: 'Memory Allocation',
      value: duration,
      unit: 'ms',
      category: 'memory',
      score
    };
  }

  private async benchmarkGPU(): Promise<BenchmarkResult> {
    const startTime = performance.now();

    // Canvas rendering benchmark
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1000;
    canvas.height = 1000;

    // Draw complex shapes
    for (let i = 0; i < 1000; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`;
      ctx.fill();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Score based on GPU performance
    const score = Math.max(0, Math.min(100, 100 - (duration / 30)));

    return {
      name: 'GPU Rendering',
      value: duration,
      unit: 'ms',
      category: 'gpu',
      score
    };
  }

  private async benchmarkNetwork(): Promise<BenchmarkResult> {
    const startTime = performance.now();

    // Network benchmark by fetching a small resource
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Score based on network speed
      const score = Math.max(0, Math.min(100, 100 - (duration / 100)));

      return {
        name: 'Network Latency',
        value: duration,
        unit: 'ms',
        category: 'network',
        score
      };
    } catch (error) {
      // Fallback score if network request fails
      return {
        name: 'Network Latency',
        value: 1000,
        unit: 'ms',
        category: 'network',
        score: 0
      };
    }
  }

  private async benchmarkStorage(): Promise<BenchmarkResult> {
    const startTime = performance.now();

    try {
      // Storage benchmark using localStorage
      const testData = 'x'.repeat(10000);
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        localStorage.setItem(`benchmark_${i}`, testData);
        localStorage.removeItem(`benchmark_${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Score based on storage performance
      const score = Math.max(0, Math.min(100, 100 - (duration / 50)));

      return {
        name: 'Storage Speed',
        value: duration,
        unit: 'ms',
        category: 'storage',
        score
      };
    } catch (error) {
      return {
        name: 'Storage Speed',
        value: 1000,
        unit: 'ms',
        category: 'storage',
        score: 50 // Neutral score for storage errors
      };
    }
  }

  private async calculatePerformanceProfile(deviceInfo: PerformanceProfile['deviceInfo']): Promise<PerformanceProfile> {
    const benchmarkResults = Array.from(this.benchmarks.values());
    const averageScore = benchmarkResults.reduce((sum, b) => sum + b.score, 0) / benchmarkResults.length;

    // Determine device tier based on score and capabilities
    const tier = this.determineDeviceTier(averageScore, deviceInfo);

    // Create device profile
    const deviceProfile = this.createDeviceProfile(tier, deviceInfo, benchmarkResults);

    return {
      deviceInfo,
      benchmarks: benchmarkResults,
      profile: deviceProfile,
      confidence: this.calculateConfidence(benchmarkResults, deviceInfo),
      timestamp: Date.now()
    };
  }

  private determineDeviceTier(score: number, deviceInfo: PerformanceProfile['deviceInfo']): DeviceProfile['tier'] {
    const { hardware, software } = deviceInfo;

    // Premium tier flagships
    if (
      score >= 85 &&
      hardware.memory >= 6 &&
      hardware.cores >= 6 &&
      this.isRecentBrowser(software.browser, software.browserVersion)
    ) {
      return 'premium';
    }

    // High tier modern devices
    if (
      score >= 70 &&
      hardware.memory >= 4 &&
      hardware.cores >= 4 &&
      this.isRecentBrowser(software.browser, software.browserVersion)
    ) {
      return 'high';
    }

    // Medium tier capable devices
    if (
      score >= 50 &&
      hardware.memory >= 2 &&
      hardware.cores >= 2
    ) {
      return 'medium';
    }

    // Low tier older devices
    if (score >= 30) {
      return 'low';
    }

    // Legacy very old devices
    return 'legacy';
  }

  private isRecentBrowser(browser: string, version: string): boolean {
    const versionNum = parseInt(version);

    switch (browser) {
      case 'Chrome': return versionNum >= 90;
      case 'Safari': return versionNum >= 14;
      case 'Firefox': return versionNum >= 88;
      case 'Edge': return versionNum >= 90;
      default: return true; // Unknown browsers assumed to be recent
    }
  }

  private createDeviceProfile(
    tier: DeviceProfile['tier'],
    deviceInfo: PerformanceProfile['deviceInfo'],
    benchmarks: BenchmarkResult[]
  ): DeviceProfile {
    const { hardware } = deviceInfo;

    // Calculate scores for each category
    const cpuScore = benchmarks.find(b => b.category === 'cpu')?.score || 50;
    const gpuScore = benchmarks.find(b => b.category === 'gpu')?.score || 50;
    const networkScore = benchmarks.find(b => b.category === 'network')?.score || 50;

    // Determine GPU tier
    const gpuTier = gpuScore >= 80 ? 'high' : gpuScore >= 50 ? 'medium' : 'low';

    // Determine network speed
    const networkSpeed = networkScore >= 70 ? 'fast' : networkScore >= 40 ? 'medium' : 'slow';

    // Get battery information if available
    const batteryLevel = this.getBatteryLevel();
    const isLowPowerMode = await this.getLowPowerMode();

    const baseProfile: DeviceProfile = {
      tier,
      score: Math.round(benchmarks.reduce((sum, b) => sum + b.score, 0) / benchmarks.length),
      capabilities: {
        memory: hardware.memory,
        cpuCores: hardware.cores,
        gpuTier,
        networkSpeed,
        batteryLevel,
        isLowPowerMode
      },
      optimizations: this.getOptimizationsForTier(tier),
      performanceTargets: this.getPerformanceTargetsForTier(tier),
      uiSettings: this.getUISettingsForTier(tier)
    };

    return baseProfile;
  }

  private getOptimizationsForTier(tier: DeviceProfile['tier']): DeviceProfile['optimizations'] {
    const presets = {
      premium: {
        imageQuality: 90,
        animationLevel: 'full' as const,
        lazyLoading: true,
        prefetching: true,
        compressionLevel: 6,
        maxConcurrentRequests: 10,
        cacheStrategy: 'aggressive' as const,
        renderMethod: 'client' as const
      },
      high: {
        imageQuality: 80,
        animationLevel: 'full' as const,
        lazyLoading: true,
        prefetching: true,
        compressionLevel: 7,
        maxConcurrentRequests: 8,
        cacheStrategy: 'aggressive' as const,
        renderMethod: 'client' as const
      },
      medium: {
        imageQuality: 70,
        animationLevel: 'reduced' as const,
        lazyLoading: true,
        prefetching: false,
        compressionLevel: 8,
        maxConcurrentRequests: 6,
        cacheStrategy: 'balanced' as const,
        renderMethod: 'hybrid' as const
      },
      low: {
        imageQuality: 60,
        animationLevel: 'minimal' as const,
        lazyLoading: true,
        prefetching: false,
        compressionLevel: 9,
        maxConcurrentRequests: 4,
        cacheStrategy: 'conservative' as const,
        renderMethod: 'hybrid' as const
      },
      legacy: {
        imageQuality: 50,
        animationLevel: 'disabled' as const,
        lazyLoading: true,
        prefetching: false,
        compressionLevel: 9,
        maxConcurrentRequests: 2,
        cacheStrategy: 'conservative' as const,
        renderMethod: 'server' as const
      }
    };

    return presets[tier];
  }

  private getPerformanceTargetsForTier(tier: DeviceProfile['tier']): DeviceProfile['performanceTargets'] {
    const targets = {
      premium: {
        maxFirstPaint: 800,
        maxFirstContentfulPaint: 1200,
        maxLargestContentfulPaint: 2000,
        maxFirstInputDelay: 100,
        maxCumulativeLayoutShift: 0.1,
        maxTotalBlockingTime: 200
      },
      high: {
        maxFirstPaint: 1000,
        maxFirstContentfulPaint: 1500,
        maxLargestContentfulPaint: 2500,
        maxFirstInputDelay: 150,
        maxCumulativeLayoutShift: 0.15,
        maxTotalBlockingTime: 300
      },
      medium: {
        maxFirstPaint: 1500,
        maxFirstContentfulPaint: 2000,
        maxLargestContentfulPaint: 3500,
        maxFirstInputDelay: 200,
        maxCumulativeLayoutShift: 0.2,
        maxTotalBlockingTime: 400
      },
      low: {
        maxFirstPaint: 2000,
        maxFirstContentfulPaint: 3000,
        maxLargestContentfulPaint: 4000,
        maxFirstInputDelay: 300,
        maxCumulativeLayoutShift: 0.25,
        maxTotalBlockingTime: 600
      },
      legacy: {
        maxFirstPaint: 3000,
        maxFirstContentfulPaint: 4000,
        maxLargestContentfulPaint: 6000,
        maxFirstInputDelay: 500,
        maxCumulativeLayoutShift: 0.3,
        maxTotalBlockingTime: 1000
      }
    };

    return targets[tier];
  }

  private getUISettingsForTier(tier: DeviceProfile['tier']): DeviceProfile['uiSettings'] {
    const settings = {
      premium: {
        enableAnimations: true,
        enableParallax: true,
        enableBlur: true,
        enableShadows: true,
        enableTransitions: true,
        maxAnimationDuration: 500
      },
      high: {
        enableAnimations: true,
        enableParallax: true,
        enableBlur: true,
        enableShadows: true,
        enableTransitions: true,
        maxAnimationDuration: 300
      },
      medium: {
        enableAnimations: true,
        enableParallax: false,
        enableBlur: false,
        enableShadows: true,
        enableTransitions: true,
        maxAnimationDuration: 200
      },
      low: {
        enableAnimations: false,
        enableParallax: false,
        enableBlur: false,
        enableShadows: true,
        enableTransitions: true,
        maxAnimationDuration: 150
      },
      legacy: {
        enableAnimations: false,
        enableParallax: false,
        enableBlur: false,
        enableShadows: false,
        enableTransitions: false,
        maxAnimationDuration: 0
      }
    };

    return settings[tier];
  }

  private calculateConfidence(benchmarks: BenchmarkResult[], deviceInfo: PerformanceProfile['deviceInfo']): number {
    let confidence = 100;

    // Reduce confidence if benchmarks failed
    if (benchmarks.length < 5) {
      confidence -= (5 - benchmarks.length) * 20;
    }

    // Reduce confidence for web views (harder to detect capabilities)
    if (deviceInfo.software.isWebView) {
      confidence -= 10;
    }

    // Reduce confidence for unknown browsers
    if (deviceInfo.software.browser === 'Unknown') {
      confidence -= 15;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  private getBatteryLevel(): number | undefined {
    // Try to get battery level if Battery API is available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return battery.level * 100;
      });
    }
    return undefined;
  }

  private async getLowPowerMode(): Promise<boolean | undefined> {
    // Try to detect low power mode (limited API support)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.saveData) return true;
    }

    // Battery API might indicate low power mode
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return battery.level < 0.2;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private createFallbackProfile(): PerformanceProfile {
    const fallbackDeviceProfile: DeviceProfile = {
      tier: 'medium',
      score: 50,
      capabilities: {
        memory: 4,
        cpuCores: 4,
        gpuTier: 'medium',
        networkSpeed: 'medium'
      },
      optimizations: this.getOptimizationsForTier('medium'),
      performanceTargets: this.getPerformanceTargetsForTier('medium'),
      uiSettings: this.getUISettingsForTier('medium')
    };

    return {
      deviceInfo: this.collectDeviceInfo(),
      benchmarks: [],
      profile: fallbackDeviceProfile,
      confidence: 50,
      timestamp: Date.now()
    };
  }

  private applyProfileOptimizations(): void {
    if (!this.profile) return;

    const { profile } = this.profile;

    // Apply CSS custom properties for optimizations
    this.applyCSSOptimizations(profile);

    // Configure image loading
    this.configureImageOptimizations(profile);

    // Set up animation preferences
    this.configureAnimationSettings(profile);

    // Configure network settings
    this.configureNetworkSettings(profile);

    // Dispatch profile ready event
    window.dispatchEvent(new CustomEvent('deviceProfileReady', {
      detail: this.profile
    }));
  }

  private applyCSSOptimizations(profile: DeviceProfile): void {
    const root = document.documentElement;

    // Animation settings
    root.style.setProperty('--enable-animations', profile.uiSettings.enableAnimations ? '1' : '0');
    root.style.setProperty('--enable-parallax', profile.uiSettings.enableParallax ? '1' : '0');
    root.style.setProperty('--enable-blur', profile.uiSettings.enableBlur ? '1' : '0');
    root.style.setProperty('--enable-shadows', profile.uiSettings.enableShadows ? '1' : '0');
    root.style.setProperty('--max-animation-duration', `${profile.uiSettings.maxAnimationDuration}ms`);

    // Performance settings
    root.style.setProperty('--image-quality', `${profile.optimizations.imageQuality}%`);
    root.style.setProperty('--max-concurrent-requests', profile.optimizations.maxConcurrentRequests.toString());

    // Device tier indicator
    root.setAttribute('device-tier', profile.tier);
    root.setAttribute('device-score', profile.score.toString());
  }

  private configureImageOptimizations(profile: DeviceProfile): void {
    // Set up image loading strategy
    const images = document.querySelectorAll('img[data-src]');

    if (profile.optimizations.lazyLoading) {
      images.forEach(img => {
        if (!img.getAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }

    // Apply quality settings
    if (profile.optimizations.imageQuality < 100) {
      document.documentElement.style.setProperty('--image-filter', `brightness(${profile.optimizations.imageQuality / 100})`);
    }
  }

  private configureAnimationSettings(profile: DeviceProfile): void {
    if (!profile.uiSettings.enableAnimations) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Configure parallax
    if (!profile.uiSettings.enableParallax) {
      document.querySelectorAll('[data-parallax]').forEach(element => {
        element.removeAttribute('data-parallax');
      });
    }
  }

  private configureNetworkSettings(profile: DeviceProfile): void {
    // Configure request concurrency
    if ('serviceWorker' in navigator && profile.optimizations.cacheStrategy === 'aggressive') {
      // Enable aggressive caching
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({
          type: 'SET_CACHE_STRATEGY',
          strategy: profile.optimizations.cacheStrategy
        });
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    this.performanceObserver.observe({
      entryTypes: ['measure', 'navigation', 'paint', 'layout-shift', 'largest-contentful-paint', 'first-input']
    });
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.profile) return;

    const { performanceTargets } = this.profile.profile;

    switch (entry.entryType) {
      case 'paint':
        this.checkPaintPerformance(entry as PerformancePaintTiming, performanceTargets);
        break;
      case 'largest-contentful-paint':
        this.checkLCPPerformance(entry as any, performanceTargets);
        break;
      case 'layout-shift':
        this.checkLayoutShiftPerformance(entry as any, performanceTargets);
        break;
      case 'first-input':
        this.checkInputDelayPerformance(entry as any, performanceTargets);
        break;
    }
  }

  private checkPaintPerformance(entry: PerformancePaintTiming, targets: DeviceProfile['performanceTargets']): void {
    if (entry.name === 'first-paint' && entry.startTime > targets.maxFirstPaint) {
      this.reportPerformanceIssue('First Paint too slow', {
        value: entry.startTime,
        target: targets.maxFirstPaint,
        unit: 'ms'
      });
    }

    if (entry.name === 'first-contentful-paint' && entry.startTime > targets.maxFirstContentfulPaint) {
      this.reportPerformanceIssue('First Contentful Paint too slow', {
        value: entry.startTime,
        target: targets.maxFirstContentfulPaint,
        unit: 'ms'
      });
    }
  }

  private checkLCPPerformance(entry: any, targets: DeviceProfile['performanceTargets']): void {
    if (entry.startTime > targets.maxLargestContentfulPaint) {
      this.reportPerformanceIssue('Largest Contentful Paint too slow', {
        value: entry.startTime,
        target: targets.maxLargestContentfulPaint,
        unit: 'ms'
      });
    }
  }

  private checkLayoutShiftPerformance(entry: any, targets: DeviceProfile['performanceTargets']): void {
    if (entry.value > targets.maxCumulativeLayoutShift) {
      this.reportPerformanceIssue('Cumulative Layout Shift too high', {
        value: entry.value,
        target: targets.maxCumulativeLayoutShift,
        unit: 'score'
      });
    }
  }

  private checkInputDelayPerformance(entry: any, targets: DeviceProfile['performanceTargets']): void {
    if (entry.processingStart - entry.startTime > targets.maxFirstInputDelay) {
      this.reportPerformanceIssue('First Input Delay too high', {
        value: entry.processingStart - entry.startTime,
        target: targets.maxFirstInputDelay,
        unit: 'ms'
      });
    }
  }

  private reportPerformanceIssue(issue: string, details: any): void {
    console.warn(`⚠️ Performance Issue: ${issue}`, details);

    // Dispatch performance issue event
    window.dispatchEvent(new CustomEvent('performanceIssue', {
      detail: {
        issue,
        details,
        profile: this.profile?.profile,
        timestamp: Date.now()
      }
    }));

    // Call listeners
    this.callListeners('performanceIssue', { issue, details, profile: this.profile });
  }

  private callListeners(event: string, data: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in performance listener for ${event}:`, error);
      }
    });
  }

  // Public API methods

  getProfile(): PerformanceProfile | null {
    return this.profile;
  }

  getDeviceProfile(): DeviceProfile | null {
    return this.profile?.profile || null;
  }

  getDeviceTier(): DeviceProfile['tier'] | null {
    return this.profile?.profile.tier || null;
  }

  getOptimizationSettings(): DeviceProfile['optimizations'] | null {
    return this.profile?.profile.optimizations || null;
  }

  addEventListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async rebenchmark(): Promise<void> {
    console.log('🔄 Re-running device benchmarks');

    // Clear previous benchmarks
    this.benchmarks.clear();

    // Run new benchmarks
    await this.runBenchmarks();

    // Recalculate profile
    if (this.profile) {
      this.profile.benchmarks = Array.from(this.benchmarks.values());
      this.profile.profile = this.createDeviceProfile(
        this.determineDeviceTier(0, this.profile.deviceInfo),
        this.profile.deviceInfo,
        this.profile.benchmarks
      );
      this.profile.timestamp = Date.now();

      // Apply new optimizations
      this.applyProfileOptimizations();
    }
  }

  destroy(): void {
    this.performanceObserver?.disconnect();
    this.benchmarks.clear();
    this.listeners.clear();
    this.profile = null;
    this.isInitialized = false;

    console.log('🧹 Device Performance Profiler cleaned up');
  }
}

// Singleton instance
let devicePerformanceProfiler: DevicePerformanceProfiler | null = null;

export function initializeDevicePerformanceProfiler(): DevicePerformanceProfiler {
  if (!devicePerformanceProfiler) {
    devicePerformanceProfiler = new DevicePerformanceProfiler();
  }
  return devicePerformanceProfiler;
}

export function getDevicePerformanceProfiler(): DevicePerformanceProfiler | null {
  return devicePerformanceProfiler;
}

// Global access for debugging
declare global {
  interface Window {
    devicePerformanceProfiler: DevicePerformanceProfiler;
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const profiler = initializeDevicePerformanceProfiler();
    window.devicePerformanceProfiler = profiler;
    console.log('🔧 Device Performance Profiler available via window.devicePerformanceProfiler');
  });
}