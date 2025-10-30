import { deviceOptimizationService, PerformanceMetrics, DeviceCapabilities } from './device-optimization.service';
import { crossPlatformSyncService } from './cross-platform-sync.service';
import { UserDevice } from '@/services/cross-platform-sync.service';

export interface AnalyticsEvent {
  eventName: string;
  eventType: 'page_view' | 'user_action' | 'system_event' | 'performance' | 'error';
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceId?: string;
  platform: string;
  deviceCapabilities?: DeviceCapabilities;
  performanceMetrics?: PerformanceMetrics;
}

export interface UserJourney {
  id: string;
  userId?: string;
  sessionId: string;
  steps: JourneyStep[];
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'abandoned';
  conversionType?: string;
  conversionValue?: number;
}

export interface JourneyStep {
  stepNumber: number;
  stepName: string;
  timestamp: number;
  duration?: number;
  properties?: Record<string, any>;
  error?: string;
}

export interface CrossPlatformMetrics {
  // Platform distribution
  platformUsage: Record<string, number>;

  // Cross-platform behavior
  multiDeviceUsage: number;
  sessionSyncRate: number;
  conflictRate: number;
  offlineUsageRate: number;

  // Performance comparison
  platformPerformance: Record<string, PerformanceMetrics>;

  // Feature adoption
  featureAdoption: Record<string, number>;
  notificationOptIn: Record<string, number>;
  backupUsage: Record<string, number>;

  // User engagement
  crossPlatformRetention: number;
  deviceSwitchingFrequency: number;
  sessionContinuityRate: number;
}

class CrossPlatformAnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private currentJourney: UserJourney | null = null;
  private sessionId: string;
  private deviceId: string | null = null;
  private userId: string | null = null;
  private isOnline: boolean = navigator.onLine;
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private maxRetries = 3;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeEventTracking();
    this.setupEventListeners();
    this.startPeriodicFlush();
    this.loadUserId();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize event tracking
   */
  private initializeEventTracking(): void {
    // Get device information
    this.loadDeviceId();

    // Track page view
    this.trackPageView();

    // Track performance metrics
    this.trackPerformanceMetrics();

    // Track device capabilities
    this.trackDeviceCapabilities();

    // Track cross-platform features
    this.trackCrossPlatformFeatures();
  }

  /**
   * Load device ID from storage or generate new one
   */
  private loadDeviceId(): void {
    let storedDeviceId = localStorage.getItem('analytics_device_id');
    if (!storedDeviceId) {
      storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_device_id', storedDeviceId);
    }
    this.deviceId = storedDeviceId;
  }

  /**
   * Load user ID from auth
   */
  private async loadUserId(): Promise<void> {
    try {
      // Try to get user ID from auth context or localStorage
      const storedUserId = localStorage.getItem('analytics_user_id');
      if (storedUserId) {
        this.userId = storedUserId;
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    }
  }

  /**
   * Setup event listeners for cross-platform events
   */
  private setupEventListeners(): void {
    // Network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('system_event', 'network_status_changed', {
        status: 'online'
      });
      this.flushEvents(); // Flush queued events when coming back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('system_event', 'network_status_changed', {
        status: 'offline'
      });
    });

    // Cross-platform sync events
    window.addEventListener('syncConflictResolution', (event: CustomEvent) => {
      this.trackEvent('system_event', 'sync_conflict_resolved', {
        conflictType: event.detail.entityType,
        resolution: event.detail.resolutionStrategy
      });
    });

    window.addEventListener('stateUpdate', (event: CustomEvent) => {
      this.trackEvent('system_event', 'cross_platform_state_update', {
        entityId: event.detail.entityId,
        source: 'remote_device'
      });
    });

    window.addEventListener('crossPlatformNotification', (event: CustomEvent) => {
      this.trackEvent('user_action', 'notification_received', {
        type: event.detail.type,
        priority: event.detail.priority
      });
    });

    // Performance events
    window.addEventListener('bookingFlowStart', () => {
      this.startJourney('booking_flow');
    });

    window.addEventListener('bookingFlowComplete', (event: CustomEvent) => {
      this.completeJourney('booking_flow', {
        bookingId: event.detail.bookingId,
        value: event.detail.value
      });
    });

    window.addEventListener('bookingFlowAbandon', () => {
      this.abandonJourney('booking_flow');
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', 'unhandled_promise_rejection', {
        reason: event.reason
      });
    });
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    this.trackEvent('page_view', 'page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(): void {
    // Track initial page load metrics
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];

        this.trackEvent('performance', 'page_load', {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: this.getMetricByName('first-paint')?.startTime || 0,
          firstContentfulPaint: this.getMetricByName('first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: this.getLCP(),
          firstInputDelay: this.getFID(),
          cumulativeLayoutShift: this.getCLS()
        });
      }
    }

    // Track ongoing performance metrics
    setInterval(() => {
      const metrics = deviceOptimizationService.getMetrics();

      this.trackEvent('performance', 'runtime_performance', {
        memoryUsage: metrics.memoryUsage,
        frameRate: metrics.animationFrameRate,
        errorRate: metrics.errorRate,
        sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1])
      });
    }, 60000); // Every minute
  }

  /**
   * Get performance metric by name
   */
  private getMetricByName(name: string): PerformanceEntry | undefined {
    const entries = performance.getEntriesByName(name);
    return entries[entries.length - 1];
  }

  /**
   * Get Largest Contentful Paint
   */
  private getLCP(): number {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
  }

  /**
   * Get First Input Delay
   */
  private getFID(): number {
    const entries = performance.getEntriesByType('first-input');
    return entries.length > 0 ? (entries[0] as any).processingStart - (entries[0] as any).startTime : 0;
  }

  /**
   * Get Cumulative Layout Shift
   */
  private getCLS(): number {
    let clsValue = 0;
    const entries = performance.getEntriesByType('layout-shift');
    entries.forEach(entry => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    });
    return clsValue;
  }

  /**
   * Track device capabilities
   */
  private trackDeviceCapabilities(): void {
    const capabilities = deviceOptimizationService.getCapabilities();
    if (!capabilities) return;

    this.trackEvent('system_event', 'device_capabilities', {
      performanceScore: capabilities.performanceScore,
      cpuCores: capabilities.cpuCores,
      memory: capabilities.memory,
      connectionType: capabilities.connectionType,
      supportsTouch: capabilities.hasTouch,
      supportsWebGL: capabilities.supportsWebGL,
      supportsWebAssembly: capabilities.supportsWebAssembly,
      supportsServiceWorker: capabilities.supportsServiceWorker,
      platform: this.detectPlatform(),
      isNativeApp: this.isNativeApp()
    });
  }

  /**
   * Track cross-platform features usage
   */
  private trackCrossPlatformFeatures(): void {
    // Track feature adoption
    this.trackEvent('user_action', 'feature_engagement', {
      syncEnabled: true,
      notificationsEnabled: 'Notification' in window && Notification.permission === 'granted',
      offlineModeEnabled: 'serviceWorker' in navigator,
      backupFeatureUsed: localStorage.getItem('backup_used') === 'true'
    });

    // Track multi-device usage
    const deviceCount = parseInt(localStorage.getItem('device_count') || '1');
    if (deviceCount > 1) {
      this.trackEvent('user_action', 'multi_device_usage', {
        deviceCount,
        currentDevice: this.deviceId
      });
    }
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/electron/.test(userAgent)) return 'desktop';
    return 'web';
  }

  /**
   * Check if running in native app
   */
  private isNativeApp(): boolean {
    return window.hasOwnProperty('webkit') || window.hasOwnProperty('cordova') ||
           window.hasOwnProperty('NativeApplication') || this.detectPlatform() !== 'web';
  }

  /**
   * Track custom event
   */
  public trackEvent(
    eventType: AnalyticsEvent['eventType'],
    eventName: string,
    properties: Record<string, any> = {}
  ): void {
    const event: AnalyticsEvent = {
      eventName,
      eventType,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      deviceId: this.deviceId || undefined,
      platform: this.detectPlatform(),
      deviceCapabilities: deviceOptimizationService.getCapabilities() || undefined,
      performanceMetrics: eventType === 'performance' ? deviceOptimizationService.getMetrics() : undefined
    };

    this.eventQueue.push(event);

    // Flush immediately for critical events
    if (eventType === 'error' || eventName.includes('booking')) {
      this.flushEvents();
    }
  }

  /**
   * Start tracking a user journey
   */
  public startJourney(journeyName: string, properties: Record<string, any> = {}): void {
    this.currentJourney = {
      id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      steps: [{
        stepNumber: 1,
        stepName: 'start',
        timestamp: Date.now(),
        properties
      }],
      startTime: Date.now(),
      status: 'active'
    };

    this.trackEvent('user_action', 'journey_started', {
      journeyName,
      journeyId: this.currentJourney.id,
      ...properties
    });
  }

  /**
   * Add step to current journey
   */
  public addJourneyStep(stepName: string, properties: Record<string, any> = {}): void {
    if (!this.currentJourney) return;

    const step: JourneyStep = {
      stepNumber: this.currentJourney.steps.length + 1,
      stepName,
      timestamp: Date.now(),
      duration: Date.now() - this.currentJourney.startTime,
      properties
    };

    this.currentJourney.steps.push(step);

    this.trackEvent('user_action', 'journey_step_completed', {
      journeyName: this.currentJourney.id,
      stepName,
      stepNumber: step.stepNumber,
      duration: step.duration,
      ...properties
    });
  }

  /**
   * Complete a journey
   */
  public completeJourney(
    journeyName: string,
    properties: Record<string, any> = {}
  ): void {
    if (!this.currentJourney) return;

    this.currentJourney.status = 'completed';
    this.currentJourney.endTime = Date.now();
    this.currentJourney.conversionType = journeyName;
    this.currentJourney.conversionValue = properties.value;

    const totalDuration = this.currentJourney.endTime - this.currentJourney.startTime;

    this.trackEvent('user_action', 'journey_completed', {
      journeyName,
      journeyId: this.currentJourney.id,
      totalDuration,
      stepCount: this.currentJourney.steps.length,
      ...properties
    });

    this.currentJourney = null;
  }

  /**
   * Abandon a journey
   */
  public abandonJourney(journeyName: string, properties: Record<string, any> = {}): void {
    if (!this.currentJourney) return;

    this.currentJourney.status = 'abandoned';
    this.currentJourney.endTime = Date.now();

    const totalDuration = this.currentJourney.endTime - this.currentJourney.startTime;
    const lastStep = this.currentJourney.steps[this.currentJourney.steps.length - 1];

    this.trackEvent('user_action', 'journey_abandoned', {
      journeyName,
      journeyId: this.currentJourney.id,
      totalDuration,
      stepCount: this.currentJourney.steps.length,
      lastStep: lastStep?.stepName,
      ...properties
    });

    this.currentJourney = null;
  }

  /**
   * Flush events to server
   */
  public async flushEvents(): Promise<void> {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    const eventsToSend = this.eventQueue.slice(0, this.batchSize);
    const remainingEvents = this.eventQueue.slice(this.batchSize);

    try {
      await this.sendEvents(eventsToSend);

      // Remove successfully sent events
      this.eventQueue = remainingEvents;

      // Mark backup as used if this is a backup-related event
      if (eventsToSend.some(e => e.eventName.includes('backup'))) {
        localStorage.setItem('backup_used', 'true');
      }

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Events remain in queue for retry
    }
  }

  /**
   * Send events to server
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Implementation would send events to your analytics service
    // For now, we'll just simulate the API call

    const payload = {
      events,
      metadata: {
        sdkVersion: '1.0.0',
        platform: this.detectPlatform(),
        timestamp: Date.now()
      }
    };

    // Simulate API call
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * Get cross-platform metrics
   */
  public async getCrossPlatformMetrics(): Promise<CrossPlatformMetrics> {
    // Implementation would fetch aggregated metrics from your analytics service
    // For now, return mock data

    return {
      platformUsage: {
        web: 45,
        ios: 30,
        android: 25
      },
      multiDeviceUsage: 0.65,
      sessionSyncRate: 0.92,
      conflictRate: 0.03,
      offlineUsageRate: 0.15,
      platformPerformance: {
        web: deviceOptimizationService.getMetrics(),
        ios: deviceOptimizationService.getMetrics(),
        android: deviceOptimizationService.getMetrics()
      },
      featureAdoption: {
        sync: 0.85,
        notifications: 0.72,
        backup: 0.45,
        offlineMode: 0.68
      },
      notificationOptIn: {
        web: 0.65,
        ios: 0.78,
        android: 0.71
      },
      backupUsage: {
        web: 0.38,
        ios: 0.52,
        android: 0.41
      },
      crossPlatformRetention: 0.87,
      deviceSwitchingFrequency: 2.3,
      sessionContinuityRate: 0.79
    };
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('analytics_user_id', userId);

    this.trackEvent('system_event', 'user_identified', {
      userId,
      previousUserId: localStorage.getItem('analytics_user_id')
    });
  }

  /**
   * Reset user ID
   */
  public resetUserId(): void {
    this.trackEvent('system_event', 'user_reset', {
      previousUserId: this.userId
    });

    this.userId = null;
    localStorage.removeItem('analytics_user_id');
  }

  /**
   * Update device count
   */
  public updateDeviceCount(count: number): void {
    localStorage.setItem('device_count', count.toString());

    if (count > 1) {
      this.trackEvent('system_event', 'multi_device_detected', {
        deviceCount: count
      });
    }
  }

  /**
   * Get current session info
   */
  public getSessionInfo(): {
    sessionId: string;
    startTime: number;
    duration: number;
    eventCount: number;
  } {
    const startTime = parseInt(this.sessionId.split('_')[1]);

    return {
      sessionId: this.sessionId,
      startTime,
      duration: Date.now() - startTime,
      eventCount: this.eventQueue.length
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Flush remaining events
    this.flushEvents();

    // Clear intervals and timeouts
    // (implementation depends on your setup)
  }
}

// Export singleton instance
export const crossPlatformAnalyticsService = new CrossPlatformAnalyticsService();

export default CrossPlatformAnalyticsService;