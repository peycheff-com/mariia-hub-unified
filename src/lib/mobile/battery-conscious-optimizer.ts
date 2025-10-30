/**
 * Battery Conscious Optimizer
 * Intelligent power management and performance modes for mobile devices
 */

interface BatteryInfo {
  level: number; // 0-1
  charging: boolean;
  chargingTime: number | null; // seconds until fully charged
  dischargingTime: number | null; // seconds until empty
  supported: boolean;
}

interface PowerMode {
  type: 'performance' | 'balanced' | 'power-saving' | 'emergency';
  batteryThreshold: number;
  enabled: boolean;
  autoSwitch: boolean;
}

interface PowerOptimizationSettings {
  cpuThrottling: boolean;
  animationReduction: boolean;
  backgroundProcessLimit: boolean;
  networkRequestLimiting: boolean;
  imageCompressionAggressive: boolean;
  videoPlaybackDisabled: boolean;
  locationServicesDisabled: boolean;
  bluetoothDisabled: boolean;
  wifiOptimization: boolean;
  hapticFeedbackDisabled: boolean;
  screenBrightnessReduction: boolean;
}

interface PerformanceImpact {
  cpuUsage: number;
  memoryUsage: number;
  networkRequests: number;
  frameRate: number;
  animationsActive: boolean;
  backgroundProcesses: number;
  batteryDrainRate: number; // % per hour
  estimatedBatteryLife: number; // minutes
}

interface BatteryOptimizationRule {
  id: string;
  name: string;
  condition: (battery: BatteryInfo, impact: PerformanceImpact) => boolean;
  action: () => void;
  priority: number;
  enabled: boolean;
}

class BatteryConsciousOptimizer {
  private static instance: BatteryConsciousOptimizer;
  private batteryInfo: BatteryInfo;
  private currentPowerMode: PowerMode;
  private settings: PowerOptimizationSettings;
  private performanceImpact: PerformanceImpact;
  private optimizationRules: BatteryOptimizationRule[] = [];
  private batteryAPI: any = null;
  private monitoringInterval: number | null = null;
  private lastBatteryCheck: number = 0;
  private powerModeHistory: Array<{ timestamp: number; mode: PowerMode; batteryLevel: number }> = [];
  private isInitialized = false;

  private constructor() {
    this.initializeBatteryInfo();
    this.initializePowerModes();
    this.initializeSettings();
    this.initializePerformanceImpact();
    this.initializeOptimizationRules();
  }

  static getInstance(): BatteryConsciousOptimizer {
    if (!BatteryConsciousOptimizer.instance) {
      BatteryConsciousOptimizer.instance = new BatteryConsciousOptimizer();
    }
    return BatteryConsciousOptimizer.instance;
  }

  private initializeBatteryInfo(): void {
    this.batteryInfo = {
      level: 1,
      charging: false,
      chargingTime: null,
      dischargingTime: null,
      supported: false
    };
  }

  private initializePowerModes(): void {
    this.currentPowerMode = {
      type: 'balanced',
      batteryThreshold: 0.5,
      enabled: true,
      autoSwitch: true
    };
  }

  private initializeSettings(): void {
    this.settings = {
      cpuThrottling: true,
      animationReduction: true,
      backgroundProcessLimit: true,
      networkRequestLimiting: true,
      imageCompressionAggressive: true,
      videoPlaybackDisabled: false,
      locationServicesDisabled: false,
      bluetoothDisabled: false,
      wifiOptimization: true,
      hapticFeedbackDisabled: false,
      screenBrightnessReduction: true
    };
  }

  private initializePerformanceImpact(): void {
    this.performanceImpact = {
      cpuUsage: 0,
      memoryUsage: 0,
      networkRequests: 0,
      frameRate: 60,
      animationsActive: true,
      backgroundProcesses: 0,
      batteryDrainRate: 0,
      estimatedBatteryLife: 0
    };
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'low-battery-emergency',
        name: 'Emergency Power Saving',
        condition: (battery, impact) => battery.level < 0.15 && !battery.charging,
        action: () => this.switchToEmergencyMode(),
        priority: 100,
        enabled: true
      },
      {
        id: 'low-battery-extreme',
        name: 'Extreme Power Saving',
        condition: (battery, impact) => battery.level < 0.3 && !battery.charging,
        action: () => this.switchToPowerSavingMode(),
        priority: 90,
        enabled: true
      },
      {
        id: 'low-battery-moderate',
        name: 'Moderate Power Saving',
        condition: (battery, impact) => battery.level < 0.5 && !battery.charging,
        action: () => this.switchToBalancedMode(),
        priority: 80,
        enabled: true
      },
      {
        id: 'high-drain-detection',
        name: 'High Drain Detection',
        condition: (battery, impact) => impact.batteryDrainRate > 20 && !battery.charging,
        action: () => this.handleHighDrain(),
        priority: 70,
        enabled: true
      },
      {
        id: 'charging-optimization',
        name: 'Charging Optimization',
        condition: (battery, impact) => battery.charging && battery.level > 0.8,
        action: () => this.switchToPerformanceMode(),
        priority: 60,
        enabled: true
      },
      {
        id: 'memory-pressure-response',
        name: 'Memory Pressure Response',
        condition: (battery, impact) => impact.memoryUsage > 80,
        action: () => this.handleMemoryPressure(),
        priority: 50,
        enabled: true
      },
      {
        id: 'thermal-throttling',
        name: 'Thermal Throttling',
        condition: (battery, impact) => impact.cpuUsage > 80,
        action: () => this.handleThermalThrottling(),
        priority: 40,
        enabled: true
      }
    ];
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔋 Initializing Battery Conscious Optimizer');

    try {
      // Initialize Battery API
      await this.initializeBatteryAPI();

      // Setup monitoring
      this.setupBatteryMonitoring();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Apply initial optimizations
      this.applyInitialOptimizations();

      // Setup auto-switching
      if (this.currentPowerMode.autoSwitch) {
        this.setupAutoSwitching();
      }

      this.isInitialized = true;
      console.log('✅ Battery Conscious Optimizer initialized');

      // Dispatch initialization event
      const event = new CustomEvent('batteryOptimizerInitialized', {
        detail: {
          batteryInfo: this.batteryInfo,
          powerMode: this.currentPowerMode,
          settings: this.settings
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('❌ Failed to initialize Battery Optimizer:', error);
      throw error;
    }
  }

  private async initializeBatteryAPI(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        this.batteryAPI = await (navigator as any).getBattery();
        this.batteryInfo.supported = true;

        console.log('🔋 Battery API available');

        // Listen for battery events
        this.batteryAPI.addEventListener('levelchange', () => {
          this.handleBatteryLevelChange();
        });

        this.batteryAPI.addEventListener('chargingchange', () => {
          this.handleChargingStateChange();
        });

        this.batteryAPI.addEventListener('chargingtimechange', () => {
          this.handleChargingTimeChange();
        });

        this.batteryAPI.addEventListener('dischargingtimechange', () => {
          this.handleDischargingTimeChange();
        });

        // Update initial battery info
        this.updateBatteryInfo();

      } catch (error) {
        console.warn('Battery API available but failed to initialize:', error);
        this.batteryInfo.supported = false;
      }
    } else {
      console.warn('Battery API not available');
      this.batteryInfo.supported = false;

      // Fallback: estimate battery level from performance
      this.setupBatteryEstimation();
    }
  }

  private setupBatteryEstimation(): void {
    // Fallback battery estimation based on usage patterns
    let totalUsageTime = 0;
    let totalDrainRate = 0;
    let drainMeasurements: number[] = [];

    const estimateFromUsage = () => {
      // Simple estimation based on time since page load and activity
      const timeSinceLoad = performance.now() / 1000 / 60; // minutes
      const activityFactor = this.estimateActivityFactor();

      // Estimate battery drain based on usage
      const estimatedDrain = timeSinceLoad * activityFactor * 0.1; // % per minute
      const estimatedLevel = Math.max(0, 1 - estimatedDrain);

      this.batteryInfo.level = estimatedLevel;
      this.batteryInfo.charging = false;

      console.log(`🔋 Estimated battery level: ${(estimatedLevel * 100).toFixed(1)}%`);
    };

    // Monitor usage and estimate battery
    setInterval(() => {
      const now = performance.now();
      const activityFactor = this.estimateActivityFactor();
      drainMeasurements.push(activityFactor);

      // Keep only last 10 measurements
      if (drainMeasurements.length > 10) {
        drainMeasurements = drainMeasurements.slice(-10);
      }

      totalUsageTime = now / 1000;
      estimateFromUsage();
    }, 30000); // Every 30 seconds
  }

  private estimateActivityFactor(): number {
    // Estimate activity level based on various factors
    let factor = 0.5; // Base activity

    // Factor in animations
    if (this.performanceImpact.animationsActive) {
      factor += 0.2;
    }

    // Factor in network requests (simplified)
    factor += Math.min(0.3, this.performanceImpact.networkRequests * 0.01);

    // Factor in frame rate
    if (this.performanceImpact.frameRate < 30) {
      factor += 0.3; // Low frame rate indicates heavy processing
    }

    // Factor in time of day (people use their devices more during certain hours)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      factor += 0.1; // Business hours
    } else if (hour >= 19 && hour <= 23) {
      factor += 0.15; // Evening usage
    }

    return Math.min(1, factor);
  }

  private setupBatteryMonitoring(): void {
    if (!this.batteryInfo.supported) return;

    this.monitoringInterval = window.setInterval(() => {
      this.updateBatteryInfo();
      this.checkOptimizationRules();
    }, 5000); // Check every 5 seconds

    console.log('📊 Battery monitoring active');
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance metrics for battery impact calculation
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let networkRequestCount = 0;

    // Monitor frame rate
    const measureFrameRate = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;
      frameCount++;

      if (deltaTime >= 1000) {
        this.performanceImpact.frameRate = Math.round((frameCount * 1000) / deltaTime);
        frameCount = 0;
        lastFrameTime = now;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);

    // Monitor network requests (simplified)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      networkRequestCount++;
      this.performanceImpact.networkRequests = networkRequestCount;

      try {
        const result = await originalFetch(...args);
        return result;
      } finally {
        networkRequestCount = Math.max(0, networkRequestCount - 1);
      }
    };

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.performanceImpact.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      }, 10000); // Every 10 seconds
    }

    console.log('📈 Performance monitoring active');
  }

  private updateBatteryInfo(): void {
    if (!this.batteryAPI) return;

    this.batteryInfo.level = this.batteryAPI.level;
    this.batteryInfo.charging = this.batteryAPI.charging;
    this.batteryInfo.chargingTime = this.batteryAPI.chargingTime;
    this.batteryInfo.dischargingTime = this.batteryAPI.dischargingTime;

    this.lastBatteryCheck = Date.now();

    // Calculate estimated battery life
    this.calculateEstimatedBatteryLife();

    console.log(`🔋 Battery: ${(this.batteryInfo.level * 100).toFixed(1)}% ${this.batteryInfo.charging ? '(Charging)' : ''}`);
  }

  private calculateEstimatedBatteryLife(): void {
    if (this.batteryInfo.charging && this.batteryInfo.chargingTime) {
      this.performanceImpact.estimatedBatteryLife = this.batteryInfo.chargingTime / 60; // Convert to minutes
    } else if (!this.batteryInfo.charging && this.performanceImpact.batteryDrainRate > 0) {
      const remainingPercent = this.batteryInfo.level;
      this.performanceImpact.estimatedBatteryLife = (remainingPercent / this.performanceImpact.batteryDrainRate) * 60; // Convert to minutes
    } else {
      this.performanceImpact.estimatedBatteryLife = 0;
    }
  }

  private applyInitialOptimizations(): void {
    // Apply initial optimizations based on current battery level
    if (this.batteryInfo.level < 0.2) {
      this.switchToEmergencyMode();
    } else if (this.batteryInfo.level < 0.5 && !this.batteryInfo.charging) {
      this.switchToPowerSavingMode();
    } else if (this.batteryInfo.charging && this.batteryInfo.level > 0.8) {
      this.switchToPerformanceMode();
    } else {
      this.switchToBalancedMode();
    }
  }

  private setupAutoSwitching(): void {
    // Auto-switch power modes based on battery level
    setInterval(() => {
      if (this.currentPowerMode.autoSwitch) {
        this.checkAndSwitchPowerMode();
      }
    }, 10000); // Check every 10 seconds
  }

  private checkAndSwitchPowerMode(): void {
    const { level, charging } = this.batteryInfo;
    const { type, batteryThreshold } = this.currentPowerMode;

    let shouldSwitch = false;
    let newMode: PowerMode['type'] | null = null;

    // Check if we should switch to a different power mode
    if (charging && level > 0.8 && type !== 'performance') {
      newMode = 'performance';
      shouldSwitch = true;
    } else if (!charging && level < 0.2 && type !== 'emergency') {
      newMode = 'emergency';
      shouldSwitch = true;
    } else if (!charging && level < 0.4 && type === 'performance') {
      newMode = 'balanced';
      shouldSwitch = true;
    } else if (!charging && level < 0.3 && type === 'balanced') {
      newMode = 'power-saving';
      shouldSwitch = true;
    }

    if (shouldSwitch && newMode) {
      this.switchPowerMode(newMode);
    }
  }

  private switchToPerformanceMode(): void {
    console.log('⚡ Switching to Performance Mode');

    this.currentPowerMode = {
      type: 'performance',
      batteryThreshold: 0.8,
      enabled: true,
      autoSwitch: this.currentPowerMode.autoSwitch
    };

    this.applyPowerModeOptimizations();

    // Notify about power mode change
    this.notifyPowerModeChange();
  }

  private switchToBalancedMode(): void {
    console.log('⚖️ Switching to Balanced Mode');

    this.currentPowerMode = {
      type: 'balanced',
      batteryThreshold: 0.5,
      enabled: true,
      autoSwitch: this.currentPowerMode.autoSwitch
    };

    this.applyPowerModeOptimizations();

    // Notify about power mode change
    this.notifyPowerModeChange();
  }

  private switchToPowerSavingMode(): void {
    console.log('🔋 Switching to Power Saving Mode');

    this.currentPowerMode = {
      type: 'power-saving',
      batteryThreshold: 0.3,
      enabled: true,
      autoSwitch: this.currentPowerMode.autoSwitch
    };

    this.applyPowerModeOptimizations();

    // Notify about power mode change
    this.notifyPowerModeChange();
  }

  private switchToEmergencyMode(): void {
    console.log('🚨 Switching to Emergency Mode');

    this.currentPowerMode = {
      type: 'emergency',
      batteryThreshold: 0.15,
      enabled: true,
      autoSwitch: this.currentPowerMode.autoSwitch
    };

    this.applyPowerModeOptimizations();

    // Notify about power mode change
    this.notifyPowerModeChange();
  }

  private switchPowerMode(type: PowerMode['type']): void {
    switch (type) {
      case 'performance':
        this.switchToPerformanceMode();
        break;
      case 'balanced':
        this.switchToBalancedMode();
        break;
      case 'power-saving':
        this.switchToPowerSavingMode();
        break;
      case 'emergency':
        this.switchToEmergencyMode();
        break;
    }
  }

  private applyPowerModeOptimizations(): void {
    const { type } = this.currentPowerMode;

    // Add power mode class to document
    document.documentElement.className = document.documentElement.className.replace(
      /power-mode-\w+/g,
      ''
    );
    document.documentElement.classList.add(`power-mode-${type}`);

    switch (type) {
      case 'performance':
        this.enablePerformanceMode();
        break;
      case 'balanced':
        this.enableBalancedMode();
        break;
      case 'power-saving':
        this.enablePowerSavingMode();
        break;
      case 'emergency':
        this.enableEmergencyMode();
        break;
    }

    // Update settings based on power mode
    this.updateSettingsForPowerMode();

    // Apply optimizations to DOM
    this.applyDOMOptimizations();
  }

  private enablePerformanceMode(): void {
    this.settings.cpuThrottling = false;
    this.settings.animationReduction = false;
    this.settings.backgroundProcessLimit = false;
    this.settings.networkRequestLimiting = false;
    this.settings.imageCompressionAggressive = false;
    this.settings.videoPlaybackDisabled = false;
    this.settings.locationServicesDisabled = false;
    this.settings.bluetoothDisabled = false;
    this.settings.wifiOptimization = false;
    this.settings.hapticFeedbackDisabled = false;
    this.settings.screenBrightnessReduction = false;
  }

  private enableBalancedMode(): void {
    this.settings.cpuThrottling = false;
    this.settings.animationReduction = false;
    this.settings.backgroundProcessLimit = true;
    this.settings.networkRequestLimiting = true;
    this.settings.imageCompressionAggressive = false;
    this.settings.videoPlaybackDisabled = false;
    this.settings.locationServicesDisabled = false;
    this.settings.bluetoothDisabled = false;
    this.settings.wifiOptimization = true;
    this.settings.hapticFeedbackDisabled = false;
    this.settings.screenBrightnessReduction = false;
  }

  private enablePowerSavingMode(): void {
    this.settings.cpuThrottling = true;
    this.settings.animationReduction = true;
    this.settings.backgroundProcessLimit = true;
    this.settings.networkRequestLimiting = true;
    this.settings.imageCompressionAggressive = true;
    this.settings.videoPlaybackDisabled = false;
    this.settings.locationServicesDisabled = false;
    this.settings.bluetoothDisabled = false;
    this.settings.wifiOptimization = true;
    this.settings.hapticFeedbackDisabled = false;
    this.settings.screenBrightnessReduction = true;
  }

  private enableEmergencyMode(): void {
    this.settings.cpuThrottling = true;
    this.settings.animationReduction = true;
    this.settings.backgroundProcessLimit = true;
    this.settings.networkRequestLimiting = true;
    this.settings.imageCompressionAggressive = true;
    this.settings.videoPlaybackDisabled = true;
    this.settings.locationServicesDisabled = true;
    this.settings.bluetoothDisabled = true;
    this.settings.wifiOptimization = true;
    this.settings.hapticFeedbackDisabled = true;
    this.settings.screenBrightnessReduction = true;
  }

  private updateSettingsForPowerMode(): void {
    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--animation-speed-multiplier', this.getAnimationSpeedMultiplier());
    root.style.setProperty('--image-quality-multiplier', this.getImageQualityMultiplier());
    root.style.setProperty('--frame-rate-limit', this.getFrameRateLimit().toString());
  }

  private getAnimationSpeedMultiplier(): number {
    switch (this.currentPowerMode.type) {
      case 'performance':
        return 1.0;
      case 'balanced':
        return 0.8;
      case 'power-saving':
        return 0.5;
      case 'emergency':
        return 0.2;
      default:
        return 1.0;
    }
  }

  private getImageQualityMultiplier(): number {
    switch (this.currentPowerMode.type) {
      case 'performance':
        return 1.0;
      case 'balanced':
        return 0.8;
      case 'power-saving':
        return 0.6;
      case 'emergency':
        return 0.4;
      default:
        return 1.0;
    }
  }

  private getFrameRateLimit(): number {
    switch (this.currentPowerMode.type) {
      case 'performance':
        return 60;
      case 'balanced':
        return 50;
      case 'power-saving':
        return 30;
      case 'emergency':
        return 15;
      default:
        return 60;
    }
  }

  private applyDOMOptimizations(): void {
    // Apply optimizations to document
    this.optimizeAnimations();
    this.optimizeImages();
    this.optimizeVideos();
    this.optimizeBackgroundProcesses();
    this.optimizeNetworkRequests();
    this.optimizeScreenBrightness();
  }

  private optimizeAnimations(): void {
    const animations = document.querySelectorAll('.animate, [data-animate], .transition');

    animations.forEach(element => {
      if (this.settings.animationReduction) {
        element.style.animationPlayState = 'paused';
        element.classList.add('animation-paused');
      } else {
        element.style.animationPlayState = 'running';
        element.classList.remove('animation-paused');
      }
    });

    // Update CSS animation speed
    const style = document.createElement('style');
    style.textContent = `
      .power-mode-emergency .animate,
      .power-mode-emergency [data-animate],
      .power-mode-emergency .transition {
        animation-duration: 0.2s !important;
        transition-duration: 0.1s !important;
      }

      .power-mode-power-saving .animate,
      .power-mode-power-saving [data-animate],
      .power-mode-power-saving .transition {
        animation-duration: 0.5s !important;
        transition-duration: 0.3s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeImages(): void {
    const images = document.querySelectorAll('img[data-src], img[data-progressive]');

    images.forEach(img => {
      const currentSrc = img.getAttribute('src') || img.getAttribute('data-src');
      if (!currentSrc) return;

      // Adjust image quality based on power mode
      const adjustedSrc = this.adjustImageURLForPowerMode(currentSrc);
      if (adjustedSrc !== currentSrc) {
        img.setAttribute('data-original-src', currentSrc);
        img.src = adjustedSrc;
      }
    });
  }

  private adjustImageURLForPowerMode(url: string): string {
    const multiplier = this.getImageQualityMultiplier();
    const urlObj = new URL(url, window.location.origin);

    // Add quality parameter
    urlObj.searchParams.set('quality', (multiplier * 100).toString());

    // Add power mode parameter
    urlObj.searchParams.set('power-mode', this.currentPowerMode.type);

    return urlObj.toString();
  }

  private optimizeVideos(): void {
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
      if (this.settings.videoPlaybackDisabled) {
        video.pause();
        video.style.display = 'none';
      } else {
        video.style.display = '';
      }
    });
  }

  private optimizeBackgroundProcesses(): void {
    // Limit background processes
    if (this.settings.backgroundProcessLimit) {
      // Cancel background fetches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'LIMIT_BACKGROUND_PROCESSES',
          powerMode: this.currentPowerMode.type
        });
      }

      // Clear some caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(name => {
            if (name.includes('temp-') || name.includes('background-')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }

  private optimizeNetworkRequests(): void {
    // Limit network requests
    if (this.settings.networkRequestLimiting) {
      // Add network request throttling
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'THROTTLE_NETWORK_REQUESTS',
          powerMode: this.currentPowerMode.type
        });
      }
    }
  }

  private optimizeScreenBrightness(): void {
    if (this.settings.screenBrightnessReduction && 'screen' in (window as any)) {
      try {
        // Reduce screen brightness to save battery
        (window as any).screen.brightness = 0.7;
      } catch (error) {
        console.warn('Could not adjust screen brightness:', error);
      }
    }
  }

  private handleBatteryLevelChange(): void {
    console.log(`🔋 Battery level changed: ${(this.batteryInfo.level * 100).toFixed(1)}%`);
    this.updateBatteryInfo();
    this.checkOptimizationRules();
  }

  private handleChargingStateChange(): void {
    console.log(`🔌 Charging state changed: ${this.batteryInfo.charging ? 'Charging' : 'Not charging'}`);
    this.updateBatteryInfo();
    this.checkOptimizationRules();

    // When charging, we can be less aggressive with power saving
    if (this.batteryInfo.charging) {
      this.handleChargingOptimizations();
    }
  }

  private handleChargingTimeChange(): void {
    if (this.batteryInfo.chargingTime) {
      const minutes = Math.floor(this.batteryInfo.chargingTime / 60);
      console.log(`⏱️ Full charge in: ${minutes} minutes`);
    }
  }

  private handleDischargingTimeChange(): void {
    if (this.batteryInfo.dischargingTime) {
      const minutes = Math.floor(this.batteryInfo.dischargingTime / 60);
      console.log(`⏱️ Battery empty in: ${minutes} minutes`);
    }
  }

  private handleChargingOptimizations(): void {
    // When charging, we can temporarily disable some power saving features
    if (this.batteryInfo.level > 0.9) {
      // Enable high performance temporarily
      this.switchToPerformanceMode();

      // Set a timer to return to normal mode
      setTimeout(() => {
        if (!this.batteryInfo.charging) {
          this.checkAndSwitchPowerMode();
        }
      }, 30000); // 30 minutes
    }
  }

  private handleHighDrain(): void {
    console.warn('⚠️ High battery drain detected');

    // Switch to more aggressive power saving
    if (this.currentPowerMode.type !== 'emergency') {
      this.switchToPowerSavingMode();
    }

    // Additional high drain optimizations
    this.applyHighDrainOptimizations();
  }

  private applyHighDrainOptimizations(): void {
    // Reduce frame rate further
    if ('requestAnimationFrame' in window) {
      const originalRAF = window.requestAnimationFrame;
      let frameCount = 0;
      let lastFrameTime = performance.now();

      window.requestAnimationFrame = (callback) => {
        const now = performance.now();
        const deltaTime = now - lastFrameTime;

        // Limit to 15 FPS for emergency mode
        if (deltaTime < 66) { // ~15 FPS
          frameCount++;
          return originalRAF(callback);
        }

        lastFrameTime = now;
        return setTimeout(() => originalRAF(callback), 66 - deltaTime);
      };
    }

    // Pause all animations
    document.querySelectorAll('.animate, [data-animate]').forEach(el => {
      (el as HTMLElement).style.animationPlayState = 'paused';
    });
  }

  private handleMemoryPressure(): void {
    console.warn('🧠 Memory pressure detected');

    // Free up memory
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Switch to power saving mode if not already
    if (this.currentPowerMode.type !== 'power-saving' && this.currentPowerMode.type !== 'emergency') {
      this.switchToPowerSavingMode();
    }
  }

  private handleThermalThrottling(): void {
    console.warn('🌡️ Thermal throttling detected');

    // Reduce CPU usage
    if (this.settings.cpuThrottling) {
      // Implement CPU throttling
      this.applyCPUThrottling();
    }

    // Switch to power saving mode if not already
    if (this.currentPowerMode.type !== 'power-saving' && this.currentPowerMode.type !== 'emergency') {
      this.switchToPowerSavingMode();
    }
  }

  private applyCPUThrottling(): void {
    // Implement CPU throttling by reducing computational work
    // This would need to be implemented based on your specific needs
    console.log('🔧 Applying CPU throttling');
  }

  private checkOptimizationRules(): void {
    // Check all optimization rules and apply appropriate actions
    this.optimizationRules.forEach(rule => {
      if (rule.enabled && rule.condition(this.batteryInfo, this.performanceImpact)) {
        console.log(`🔧 Applying optimization rule: ${rule.name}`);
        rule.action();
      }
    });
  }

  private notifyPowerModeChange(): void {
    const event = new CustomEvent('powerModeChange', {
      detail: {
        powerMode: this.currentPowerMode,
        batteryInfo: this.batteryInfo,
        settings: this.settings,
        performanceImpact: this.performanceImpact,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);

    // Store in history
    this.powerModeHistory.push({
      timestamp: Date.now(),
      mode: { ...this.currentPowerMode },
      batteryLevel: this.batteryInfo.level
    });

    // Keep only last 10 entries
    if (this.powerModeHistory.length > 10) {
      this.powerModeHistory = this.powerModeHistory.slice(-10);
    }
  }

  // Public API methods
  public getBatteryInfo(): BatteryInfo {
    return { ...this.batteryInfo };
  }

  public getCurrentPowerMode(): PowerMode {
    return { ...this.currentPowerMode };
  }

  public getSettings(): PowerOptimizationSettings {
    return { ...this.settings };
  }

  public getPerformanceImpact(): PerformanceImpact {
    return { ...this.performanceImpact };
  }

  public setPowerMode(type: PowerMode['type'], autoSwitch?: boolean): void {
    this.currentPowerMode.type = type;
    if (autoSwitch !== undefined) {
      this.currentPowerMode.autoSwitch = autoSwitch;
    }
    this.applyPowerModeOptimizations();
    console.log(`🔋 Power mode manually set to: ${type}`);
  }

  public updateSettings(newSettings: Partial<PowerOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applyPowerModeOptimizations();
    console.log('⚙️ Battery settings updated');
  }

  public addOptimizationRule(rule: Omit<BatteryOptimizationRule, 'id'>): void {
    this.optimizationRules.push({ ...rule, id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` });
    console.log('📝 Optimization rule added:', rule.name);
  }

  public removeOptimizationRule(ruleId: string): void {
    const index = this.optimizationRules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      this.optimizationRules.splice(index, 1);
      console.log('🗑️ Optimization rule removed:', ruleId);
    }
  }

  public enableAutoSwitching(enabled: boolean): void {
    this.currentPowerMode.autoSwitch = enabled;
    console.log(`🔄 Auto-switching ${enabled ? 'enabled' : 'disabled'}`);
  }

  public getBatteryOptimizationReport(): object {
    return {
      batteryInfo: this.batteryInfo,
      currentPowerMode: this.powerModeHistory[this.powerModeHistory.length - 1],
      settings: this.settings,
      performanceImpact: this.performanceImpact,
      activeRules: this.optimizationRules.filter(rule => rule.enabled).length,
      history: this.powerModeHistory.slice(-10),
      recommendations: this.generateBatteryRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  private generateBatteryRecommendations(): string[] {
    const recommendations: string[] = [];
    const { level, charging, supported } = this.batteryInfo;
    const { type } = this.currentPowerMode;

    if (!supported) {
      recommendations.push('Consider implementing battery estimation for devices without Battery API support');
    }

    if (level < 0.1 && !charging) {
      recommendations.push('Connect device to charger - critically low battery');
    } else if (level < 0.2 && !charging) {
      recommendations.push('Save work and consider charging soon - very low battery');
    } else if (level < 0.4 && !charging) {
      recommendations.push('Consider charging soon to maintain performance');
    }

    if (type === 'emergency') {
      recommendations.push('Emergency power saving mode active - consider charging');
      recommendations.push('Disable non-essential features to conserve battery');
    }

    if (this.performanceImpact.batteryDrainRate > 15) {
      recommendations.push('High battery drain detected - investigate background processes');
    }

    if (this.performanceImpact.estimatedBatteryLife < 30) {
      recommendations.push('Low estimated battery life - consider immediate charging');
    }

    if (this.settings.hapticFeedbackDisabled && this.batteryInfo.level > 0.5) {
      recommendations.push('Consider enabling haptic feedback for better user experience');
    }

    if (recommendations.length === 0) {
      recommendations.push('Battery optimization is performing optimally');
    }

    return recommendations;
  }

  public destroy(): void {
    console.log('🛑 Shutting down Battery Conscious Optimizer');

    // Clear monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Reset to default state
    this.initializeBatteryInfo();
    this.initializePowerModes();
    this.initializeSettings();
    this.initializePerformanceImpact();

    // Remove power mode class
    document.documentElement.className = document.documentElement.className.replace(
      /power-mode-\w+/g,
      ''
    );

    // Remove optimization rules
    this.optimizationRules = [];

    this.isInitialized = false;
    console.log('✅ Battery Conscious Optimizer destroyed');
  }
}

// Export singleton instance
export const batteryConsciousOptimizer = BatteryConsciousOptimizer.getInstance();

// Convenience exports
export const initializeBatteryOptimizer = () => batteryConsciousOptimizer.initialize();
export const getBatteryInfo = () => batteryConsciousOptimizer.getBatteryInfo();
export const getPowerMode = () => batteryConsciousOptimizer.getCurrentPowerMode();
export const getBatteryReport = () => batteryConsciousOptimizer.getBatteryOptimizationReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).batteryOptimizer = {
    init: initializeBatteryOptimizer,
    getInfo: getBatteryInfo,
    getPowerMode: getPowerMode,
    getReport: getBatteryReport,
    setPowerMode: (type: PowerMode['type']) => batteryConsciousOptimizer.setPowerMode(type),
    updateSettings: (settings: Partial<PowerOptimizationSettings>) => batteryConsciousOptimizer.updateSettings(settings),
    enableAutoSwitching: (enabled: boolean) => batteryConsciousOptimizer.enableAutoSwitching(enabled),
    addRule: (rule: Omit<BatteryOptimizationRule, 'id'>) => batteryConsciousOptimizer.addOptimizationRule(rule),
    removeRule: (ruleId: string) => batteryConsciousOptimizer.removeOptimizationRule(ruleId)
  };
}