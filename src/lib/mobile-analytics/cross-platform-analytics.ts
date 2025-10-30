// Cross-Platform Analytics Implementation
// Unified analytics system for web, iOS, and Android

import type {
  CrossPlatformAnalytics,
  MobileAnalyticsConfig,
  UnifiedAnalyticsEvent,
  CrossPlatformSession,
  AnalyticsConsent,
  AnalyticsBatch,
  AnalyticsStorage,
  AnalyticsTransport,
  AnalyticsProcessor,
  ConsentManager,
  PerformanceMonitor,
  DeviceInfo,
  BookingAnalytics,
  UserBehaviorAnalytics,
  AppPerformance
} from './core';

import type {
  AnalyticsEvent,
  UserSession,
  MobileSpecificMetrics,
  BusinessIntelligenceMetrics,
  AnalyticsDashboard,
  AnalyticsError
} from '@/types/mobile-analytics';

import { getPlatform, isNativeApp, getAppVersion } from './core';

export class MobileCrossPlatformAnalytics implements CrossPlatformAnalytics {
  private config: MobileAnalyticsConfig;
  private storage: AnalyticsStorage;
  private transport: AnalyticsTransport;
  private processor: AnalyticsProcessor;
  private consentManager: ConsentManager;
  private performanceMonitor: PerformanceMonitor;

  private currentSession: CrossPlatformSession | null = null;
  private isInitialized = false;
  private isStarted = false;
  private isEnabled = true;
  private realTimeEnabled = false;

  // Batch management
  private eventQueue: UnifiedAnalyticsEvent[] = [];
  private batchSize = 20;
  private flushInterval = 30000; // 30 seconds
  private maxRetries = 3;
  private flushTimer: NodeJS.Timeout | null = null;

  // Device info
  private deviceInfo: DeviceInfo;

  constructor(
    storage: AnalyticsStorage,
    transport: AnalyticsTransport,
    processor: AnalyticsProcessor,
    consentManager: ConsentManager,
    performanceMonitor: PerformanceMonitor
  ) {
    this.storage = storage;
    this.transport = transport;
    this.processor = processor;
    this.consentManager = consentManager;
    this.performanceMonitor = performanceMonitor;

    this.deviceInfo = this.collectDeviceInfo();
  }

  async initialize(config: MobileAnalyticsConfig): Promise<void> {
    try {
      this.config = {
        platform: getPlatform(),
        appId: config.appId,
        appVersion: config.appVersion || getAppVersion(),
        ...config
      };

      // Initialize consent manager
      await this.consentManager.initialize?.(config.privacy);

      // Initialize performance monitoring
      if (config.performance.enableCoreWebVitals) {
        this.performanceMonitor.startPerformanceMonitoring();
      }

      // Setup periodic flush
      this.setupPeriodicFlush();

      // Restore previous session if exists
      await this.restorePreviousSession();

      this.isInitialized = true;
      console.log('Mobile Analytics initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Mobile Analytics:', error);
      throw error;
    }
  }

  async trackEvent(eventData: Omit<UnifiedAnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    if (!this.isInitialized || !this.isEnabled) return;

    try {
      // Check consent
      const consent = await this.consentManager.getCurrentConsent();
      if (!consent || !consent.analytics) return;

      // Ensure we have an active session
      if (!this.currentSession) {
        await this.startSession();
      }

      // Create unified event
      const event: UnifiedAnalyticsEvent = {
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession!.id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceInfo: this.deviceInfo,
        appInfo: {
          version: this.config.appVersion,
          build: this.config.appVersion,
          environment: process.env.NODE_ENV as any || 'development'
        },
        consent: {
          analytics: consent.analytics,
          marketing: consent.marketing,
          personalization: consent.personalization
        },
        quality: {
          isValid: true,
          confidence: 1.0,
          issues: []
        },
        ...eventData
      };

      // Validate and process event
      if (this.processor.validateEvent(event)) {
        const processedEvent = await this.processor.enrichEvent(event);
        await this.queueEvent(processedEvent);
      }

    } catch (error) {
      console.error('Failed to track event:', error);
      this.recordError(error as Error, { eventData });
    }
  }

  async trackPageView(page: string, title?: string, additional?: any): Promise<void> {
    await this.trackEvent({
      name: 'page_view',
      category: 'navigation',
      action: 'view',
      label: page,
      properties: {
        page,
        title: title || page,
        referrer: document?.referrer,
        ...additional
      },
      dimensions: {
        page_type: this.getPageType(page),
        section: this.getPageSection(page)
      }
    });
  }

  async trackUserAction(action: string, properties?: any): Promise<void> {
    await this.trackEvent({
      name: 'user_action',
      category: 'user_action',
      action,
      properties,
      dimensions: {
        action_category: this.categorizeAction(action)
      }
    });
  }

  async trackBookingEvent(bookingData: BookingAnalytics): Promise<void> {
    await this.trackEvent({
      name: 'booking_funnel',
      category: 'booking',
      action: bookingData.funnelEvent,
      label: bookingData.serviceInfo.serviceName,
      value: bookingData.serviceInfo.price,
      properties: bookingData,
      dimensions: {
        service_type: bookingData.serviceInfo.serviceType,
        funnel_step: bookingData.funnelStep.toString(),
        is_converted: (bookingData.funnelEvent === 'booking_completed').toString()
      },
      metrics: {
        booking_value: bookingData.serviceInfo.price,
        time_spent: bookingData.behavior.timeSpentOnStep,
        hesitations: bookingData.behavior.hesitations
      },
      conversion: {
        type: 'booking',
        step: bookingData.funnelStep,
        funnel: 'main_booking_flow',
        value: bookingData.serviceInfo.price
      }
    });
  }

  async trackUserBehavior(behaviorData: UserBehaviorAnalytics): Promise<void> {
    await this.trackEvent({
      name: 'user_behavior',
      category: 'engagement',
      action: 'behavior_update',
      properties: behaviorData,
      dimensions: {
        engagement_segment: behaviorData.segments.engagementSegment,
        value_segment: behaviorData.segments.valueSegment,
        preferred_service_type: behaviorData.servicePreferences.preferredServiceType
      },
      metrics: {
        total_bookings: behaviorData.customerJourney.totalBookings,
        total_spent: behaviorData.customerJourney.totalSpent,
        booking_frequency: behaviorData.bookingPatterns.averageBookingFrequency,
        churn_risk: behaviorData.predictions.riskOfChurn
      }
    });
  }

  async startSession(): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      const consent = await this.consentManager.getCurrentConsent();

      const session: CrossPlatformSession = {
        sessionId,
        userId: undefined, // Will be set when user is identified
        platform: this.config.platform,
        deviceInfo: this.deviceInfo,
        startTime: new Date().toISOString(),
        events: [],
        conversionEvents: [],
        performanceMetrics: await this.performanceMonitor.getMetrics(),
        consent: consent || {
          analytics: false,
          marketing: false,
          personalization: false,
          functional: false,
          timestamp: new Date().toISOString(),
          version: '1.0'
        },
        quality: {
          score: 100,
          factors: [],
          issues: []
        }
      };

      this.currentSession = session;
      await this.storage.storeSession?.(session);

      // Track session start
      await this.trackEvent({
        name: 'session_start',
        category: 'session',
        action: 'start',
        properties: {
          sessionId,
          isNewUser: await this.isNewUser(),
          entryPage: window.location.pathname
        }
      });

      return sessionId;

    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Update session end time
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.duration = Date.now() - new Date(this.currentSession.startTime).getTime();

      // Calculate session quality
      this.currentSession.quality = this.calculateSessionQuality(this.currentSession);

      // Store final session data
      await this.storage.storeSession?.(this.currentSession);

      // Track session end
      await this.trackEvent({
        name: 'session_end',
        category: 'session',
        action: 'end',
        properties: {
          sessionId: this.currentSession.sessionId,
          duration: this.currentSession.duration,
          eventCount: this.currentSession.events.length,
          quality: this.currentSession.quality.score
        }
      });

      // Flush remaining events
      await this.flush();

      this.currentSession = null;

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  async getCurrentSession(): Promise<CrossPlatformSession | null> {
    return this.currentSession;
  }

  async identifyUser(userId: string, traits?: any): Promise<void> {
    try {
      // Update current session
      if (this.currentSession) {
        this.currentSession.userId = userId;
      }

      // Track user identification
      await this.trackEvent({
        name: 'identify',
        category: 'user',
        action: 'identify',
        properties: {
          userId,
          traits,
          isNewUser: await this.isNewUser(userId)
        }
      });

      // Store user profile
      await this.storage.storeUserProfile?.(userId, traits);

    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  async anonymizeUser(): Promise<void> {
    try {
      const userId = this.currentSession?.userId;
      if (userId) {
        // Track user anonymization
        await this.trackEvent({
          name: 'anonymize',
          category: 'privacy',
          action: 'anonymize_user',
          properties: { userId }
        });

        // Clear user data
        await this.storage.deleteUserData?.(userId);
      }

      // Clear current session user ID
      if (this.currentSession) {
        this.currentSession.userId = undefined;
      }

    } catch (error) {
      console.error('Failed to anonymize user:', error);
    }
  }

  async updateConsent(consent: Partial<AnalyticsConsent>): Promise<void> {
    try {
      await this.consentManager.updateConsent(consent);

      // Track consent update
      await this.trackEvent({
        name: 'consent_update',
        category: 'privacy',
        action: 'update_consent',
        properties: {
          categories: Object.keys(consent),
          timestamp: new Date().toISOString()
        }
      });

      // If analytics consent is revoked, clear queue
      const currentConsent = await this.consentManager.getCurrentConsent();
      if (!currentConsent?.analytics) {
        this.eventQueue = [];
        await this.storage.clearEvents?.();
      }

    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  }

  hasConsent(): boolean {
    // Check current consent status
    return this.consentManager.hasConsentForCategory('analytics');
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      // Create batch
      const batch: AnalyticsBatch = {
        id: this.generateBatchId(),
        platform: this.config.platform,
        events: [...this.eventQueue],
        metadata: {
          batchSize: this.eventQueue.length,
          compression: 'gzip',
          checksum: this.calculateChecksum(this.eventQueue),
          encryptionEnabled: false
        },
        sent: false,
        retryCount: 0
      };

      // Store batch
      await this.storage.storeBatch(batch);

      // Send batch
      const result = await this.transport.sendBatch(batch);

      if (result.success) {
        // Clear queue on success
        this.eventQueue = [];
        batch.sent = true;
        batch.sentAt = new Date().toISOString();
        await this.storage.markBatchAsSent(batch.id);
      } else {
        // Mark for retry
        batch.retryCount++;
        batch.error = result.error;
        if (batch.retryCount < this.maxRetries) {
          await this.storage.storeBatch(batch);
        }
      }

    } catch (error) {
      console.error('Failed to flush events:', error);
      this.recordError(error as Error, { eventType: 'flush' });
    }
  }

  async getPendingEventCount(): Promise<number> {
    return this.eventQueue.length + (await this.storage.getPendingEvents()).length;
  }

  async getPerformanceMetrics(): Promise<AppPerformance> {
    return this.performanceMonitor.getMetrics();
  }

  enableRealTime(enabled: boolean): void {
    this.realTimeEnabled = enabled;

    if (enabled) {
      this.setupRealTimeUpdates();
    } else {
      this.clearRealTimeUpdates();
    }
  }

  async updateConfig(config: Partial<MobileAnalyticsConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Restart components if needed
    if (config.performance) {
      this.performanceMonitor.stopPerformanceMonitoring();
      if (config.performance.enableCoreWebVitals) {
        this.performanceMonitor.startPerformanceMonitoring();
      }
    }
  }

  getConfig(): MobileAnalyticsConfig {
    return this.config;
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Analytics not initialized. Call initialize() first.');
    }

    this.isEnabled = true;
    this.isStarted = true;

    // Start session if not already active
    if (!this.currentSession) {
      await this.startSession();
    }

    // Setup page tracking
    this.setupPageTracking();

    // Setup error tracking
    this.setupErrorTracking();

    console.log('Mobile Analytics started');
  }

  async stop(): Promise<void> {
    this.isEnabled = false;
    this.isStarted = false;

    // End current session
    if (this.currentSession) {
      await this.endSession();
    }

    // Clear timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    await this.flush();

    console.log('Mobile Analytics stopped');
  }

  async reset(): Promise<void> {
    await this.stop();

    // Clear all stored data
    await this.storage.clearAll?.();

    // Reset internal state
    this.currentSession = null;
    this.eventQueue = [];

    console.log('Mobile Analytics reset');
  }

  // Private helper methods
  private async queueEvent(event: UnifiedAnalyticsEvent): Promise<void> {
    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);

      if (event.category === 'booking' && event.conversion) {
        this.currentSession.conversionEvents.push(event);
      }
    }

    // Add to queue
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.flush();
      }
    }, this.flushInterval);
  }

  private setupPageTracking(): void {
    if (typeof window !== 'undefined') {
      // Track initial page load
      this.trackPageView(window.location.pathname, document.title);

      // Setup SPA navigation tracking
      let lastPath = window.location.pathname;
      const observer = new MutationObserver(() => {
        if (window.location.pathname !== lastPath) {
          lastPath = window.location.pathname;
          this.trackPageView(window.location.pathname, document.title);
        }
      });

      observer.observe(document, { subtree: true, childList: true });
    }
  }

  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      // Track JavaScript errors
      window.addEventListener('error', (event) => {
        this.performanceMonitor.recordError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      // Track promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.performanceMonitor.recordError(new Error(event.reason), {
          type: 'unhandled_promise_rejection'
        });
      });
    }
  }

  private setupRealTimeUpdates(): void {
    // Implementation for real-time dashboard updates
    if (this.config.realtime.enableLiveDashboard) {
      // Connect to real-time analytics service
      this.connectToRealTimeService();
    }
  }

  private clearRealTimeUpdates(): void {
    // Disconnect from real-time service
    this.disconnectFromRealTimeService();
  }

  private async connectToRealTimeService(): Promise<void> {
    // WebSocket or SSE connection for real-time updates
    console.log('Connecting to real-time analytics service');
  }

  private disconnectFromRealTimeService(): void {
    console.log('Disconnecting from real-time analytics service');
  }

  private collectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return this.getDefaultDeviceInfo();
    }

    const navigator = window.navigator;
    const screen = window.screen;

    return {
      platform: this.config.platform,
      deviceId: this.getOrCreateDeviceId(),
      osVersion: this.getOSVersion(),
      appVersion: this.config.appVersion,
      screenWidth: screen.width,
      screenHeight: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type?.includes('portrait') ? 'portrait' : 'landscape',
      colorDepth: screen.colorDepth,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      connectionType: this.getConnectionType(),
      effectiveConnectionType: this.getEffectiveConnectionType(),
      downlink: (navigator as any).connection?.downlink,
      rtt: (navigator as any).connection?.rtt,
      saveData: (navigator as any).connection?.saveData || false,
      browser: this.getBrowserInfo(),
      capabilities: this.getDeviceCapabilities(),
      security: this.getSecurityInfo()
    };
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      platform: 'web',
      deviceId: 'server-side',
      osVersion: 'unknown',
      appVersion: this.config.appVersion,
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
      orientation: 'landscape',
      colorDepth: 24,
      maxTouchPoints: 0,
      connectionType: 'wifi',
      effectiveConnectionType: '4g',
      saveData: false,
      capabilities: this.getDeviceCapabilities(),
      security: {
        https: false,
        secureContext: false,
        permissions: {}
      }
    };
  }

  private getOrCreateDeviceId(): string {
    const storageKey = 'analytics_device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(events: UnifiedAnalyticsEvent[]): string {
    // Simple checksum implementation
    const content = events.map(e => e.id).join('');
    return btoa(content).slice(0, 16);
  }

  private calculateSessionQuality(session: CrossPlatformSession): any {
    // Calculate session quality score based on various factors
    const factors = {
      duration: Math.min(session.duration || 0, 1800000) / 1800000, // Max 30 minutes
      engagement: Math.min(session.events.length, 50) / 50, // Max 50 events
      conversions: Math.min(session.conversionEvents.length, 5) / 5, // Max 5 conversions
      errors: 1 - Math.min((session.performanceMetrics.errors?.javascriptErrors || 0), 10) / 10
    };

    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;

    return {
      score: Math.round(score * 100),
      factors: Object.keys(factors),
      issues: factors.errors < 0.5 ? ['High error rate'] : []
    };
  }

  private getPageType(page: string): string {
    if (page.includes('/booking')) return 'booking';
    if (page.includes('/beauty')) return 'services';
    if (page.includes('/fitness')) return 'services';
    if (page.includes('/admin')) return 'admin';
    return 'content';
  }

  private getPageSection(page: string): string {
    return page.split('/')[1] || 'home';
  }

  private categorizeAction(action: string): string {
    if (action.includes('click')) return 'interaction';
    if (action.includes('scroll')) return 'engagement';
    if (action.includes('search')) return 'navigation';
    if (action.includes('share')) return 'social';
    return 'general';
  }

  private getOSVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;
    const osMatch = userAgent.match(/(Windows|Mac|Linux|iOS|Android)[\s\/]([\d\.]+)/i);
    return osMatch ? `${osMatch[1]} ${osMatch[2]}` : 'unknown';
  }

  private getConnectionType(): any {
    if (typeof navigator === 'undefined' || !(navigator as any).connection) {
      return 'wifi';
    }
    return (navigator as any).connection.type || 'wifi';
  }

  private getEffectiveConnectionType(): any {
    if (typeof navigator === 'undefined' || !(navigator as any).connection) {
      return '4g';
    }
    return (navigator as any).connection.effectiveType || '4g';
  }

  private getBrowserInfo(): any {
    if (typeof navigator === 'undefined') return undefined;

    const ua = navigator.userAgent;
    let name = 'unknown';
    let version = 'unknown';
    let engine = 'unknown';

    // Browser detection
    if (ua.includes('Chrome')) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/([\d\.]+)/);
      version = match ? match[1] : 'unknown';
      engine = 'Blink';
    } else if (ua.includes('Safari')) {
      name = 'Safari';
      const match = ua.match(/Version\/([\d\.]+)/);
      version = match ? match[1] : 'unknown';
      engine = 'WebKit';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/([\d\.]+)/);
      version = match ? match[1] : 'unknown';
      engine = 'Gecko';
    }

    return { name, version, engine };
  }

  private getDeviceCapabilities(): any {
    if (typeof document === 'undefined') {
      return {
        webgl: false,
        webgl2: false,
        webp: false,
        avif: false,
        pushNotifications: false,
        backgroundSync: false,
        offline: false,
        camera: false,
        microphone: false,
        geolocation: false,
        vibration: false,
        bluetooth: false,
        nfc: false
      };
    }

    const canvas = document.createElement('canvas');

    return {
      webgl: !!(canvas.getContext('webgl')),
      webgl2: !!(canvas.getContext('webgl2')),
      webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      avif: false, // Will need to check when support is better
      pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offline: 'serviceWorker' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      vibration: 'vibrate' in navigator,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'nfc' in navigator
    };
  }

  private getSecurityInfo(): any {
    if (typeof window === 'undefined') {
      return {
        https: false,
        secureContext: false,
        permissions: {}
      };
    }

    return {
      https: window.location.protocol === 'https:',
      secureContext: window.isSecureContext,
      permissions: navigator.permissions ? {} : {}
    };
  }

  private async isNewUser(userId?: string): Promise<boolean> {
    // Check if user exists in storage
    if (!userId) return true;
    const profile = await this.storage.getUserProfile?.(userId);
    return !profile;
  }

  private async restorePreviousSession(): Promise<void> {
    try {
      // Try to restore previous session if it's recent
      const previousSession = await this.storage.getCurrentSession?.();
      if (previousSession && !previousSession.endTime) {
        const timeSinceLastActivity = Date.now() - new Date(previousSession.startTime).getTime();

        // Restore if less than 30 minutes old
        if (timeSinceLastActivity < 30 * 60 * 1000) {
          this.currentSession = previousSession;
        }
      }
    } catch (error) {
      console.error('Failed to restore previous session:', error);
    }
  }

  private recordError(error: Error, context?: any): void {
    this.performanceMonitor.recordError(error, context);
  }
}

export default MobileCrossPlatformAnalytics;