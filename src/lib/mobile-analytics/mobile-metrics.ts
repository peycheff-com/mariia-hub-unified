// Mobile-Specific Metrics Tracking System
// Comprehensive metrics for mobile app performance and user engagement

import type {
  MobileSpecificMetrics,
  DeviceInfo,
  AppPerformance,
  AnalyticsEvent,
  BookingAnalytics,
  UserBehaviorAnalytics
} from '@/types/mobile-analytics';

import type {
  CrossPlatformAnalytics,
  UnifiedAnalyticsEvent
} from './core';

export interface MobileMetricsConfig {
  // App Installation Tracking
  enableInstallTracking: boolean;
  enableCampaignTracking: boolean;
  enableReferralTracking: boolean;

  // Performance Monitoring
  enablePerformanceMetrics: boolean;
  enableCrashReporting: boolean;
  enableANRMonitoring: boolean; // Application Not Responding
  enableMemoryMonitoring: boolean;
  enableBatteryMonitoring: boolean;
  enableNetworkMonitoring: boolean;

  // User Engagement
  enableEngagementMetrics: boolean;
  enableScreenTracking: boolean;
  enableFeatureTracking: boolean;
  enableSessionTracking: boolean;

  // Push Notifications
  enablePushAnalytics: boolean;
  enablePushDeliveryTracking: boolean;
  enablePushEngagementTracking: boolean;

  // In-App Purchases
  enablePurchaseTracking: boolean;
  enableRevenueTracking: boolean;
  enableSubscriptionTracking: boolean;

  // Quality Metrics
  enableQualityMetrics: boolean;
  enableAppStoreRatingTracking: boolean;
  enableUserFeedbackTracking: boolean;
  enableA/BTesting: boolean;

  // Sampling
  performanceSampleRate: number; // 0-1
  crashSampleRate: number; // 0-1
  engagementSampleRate: number; // 0-1
}

export interface AppLaunchMetrics {
  coldLaunchTime: number; // Time from app start to first meaningful frame
  warmLaunchTime: number; // Time from app resume to first meaningful frame
  hotLaunchTime: number; // Time from app resume when in memory
  firstRenderTime: number; // Time to first visual update
  timeToInteractive: number; // Time when app becomes interactive
  jsBundleLoadTime: number; // Time to load JavaScript bundle
  nativeModuleLoadTime: number; // Time to initialize native modules
  resourceLoadTime: number; // Time to load critical resources
}

export interface ScreenMetrics {
  screenName: string;
  screenClass: string;
  loadTime: number; // Time to load screen
  renderTime: number; // Time to render screen
  interactionTime: number; // Time until first user interaction
  visibleTime: number; // Time screen was visible
  exitTime?: number; // Time when user left screen
  bounceRate: number; // Percentage of users who leave immediately
  conversionEvents: number; // Number of conversions on this screen
  errorCount: number; // Number of errors on this screen
  userInteractions: number; // Number of user interactions
}

export interface FeatureUsageMetrics {
  featureName: string;
  featureCategory: string;
  usageCount: number;
  uniqueUsers: number;
  totalUsageTime: number; // milliseconds
  averageUsageTime: number; // milliseconds
  usageFrequency: number; // uses per user per day
  adoptionRate: number; // percentage of users who used feature
  retentionRate: number; // percentage of users who returned to feature
  errorRate: number; // percentage of usage that resulted in errors
  satisfactionScore?: number; // 1-5 rating
  lastUsed: string;
  firstUsed: string;
}

export interface PushNotificationMetrics {
  notificationId: string;
  campaignId?: string;
  title: string;
  body: string;
  category: string;
  scheduledTime: string;
  sentTime: string;
  deliveredTime?: string;
  openedTime?: string;
  clickedTime?: string;
  conversionTime?: string;
  platform: 'ios' | 'android';
  deviceType: string;
  userId?: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed';
  errorCode?: string;
  errorMessage?: string;
  properties: Record<string, any>;
}

export interface InAppPurchaseMetrics {
  transactionId: string;
  productId: string;
  productName: string;
  productType: 'consumable' | 'non_consumable' | 'subscription';
  price: number;
  currency: string;
  quantity: number;
  userId?: string;
  platform: 'ios' | 'android';
  status: 'initiated' | 'completed' | 'failed' | 'refunded';
  purchaseTime: string;
  refundTime?: string;
  failureReason?: string;
  campaignId?: string;
  properties: Record<string, any>;
}

export class MobileMetricsTracker {
  private analytics: CrossPlatformAnalytics;
  private config: MobileMetricsConfig;
  private metrics: Map<string, any> = new Map();

  // Performance tracking
  private launchStartTime: number = 0;
  private screenLoadStartTime: number = 0;
  private currentScreen: string | null = null;
  private screenMetrics: Map<string, ScreenMetrics> = new Map();

  // Feature tracking
  private featureUsage: Map<string, FeatureUsageMetrics> = new Map();
  private featureStartTime: Map<string, number> = new Map();

  // Push notification tracking
  private pushMetrics: Map<string, PushNotificationMetrics> = new Map();

  // Purchase tracking
  private purchaseMetrics: Map<string, InAppPurchaseMetrics> = new Map();

  constructor(analytics: CrossPlatformAnalytics, config: MobileMetricsConfig) {
    this.analytics = analytics;
    this.config = config;

    this.initializeTracking();
  }

  // App Installation and Acquisition Tracking
  async trackAppInstallation(source?: string, campaign?: string): Promise<void> {
    if (!this.config.enableInstallTracking) return;

    const installData = {
      installSource: source || this.getInstallSource(),
      installDate: new Date().toISOString(),
      campaign,
      appVersion: this.getAppVersion(),
      platform: this.getPlatform(),
      deviceId: this.getDeviceId(),
      isFirstLaunch: this.isFirstLaunch(),
      totalLaunches: this.getTotalLaunches()
    };

    await this.analytics.trackEvent({
      name: 'app_installation',
      category: 'acquisition',
      action: 'install',
      properties: installData,
      dimensions: {
        install_source: installData.installSource,
        platform: installData.platform,
        is_first_launch: installData.isFirstLaunch.toString()
      }
    });

    // Track acquisition cost if available
    if (campaign) {
      await this.trackCampaignAttribution(campaign, source);
    }
  }

  async trackAppLaunch(launchType: 'cold' | 'warm' | 'hot' = 'cold'): Promise<void> {
    this.launchStartTime = performance.now();

    const launchMetrics: AppLaunchMetrics = {
      coldLaunchTime: 0,
      warmLaunchTime: 0,
      hotLaunchTime: 0,
      firstRenderTime: 0,
      timeToInteractive: 0,
      jsBundleLoadTime: 0,
      nativeModuleLoadTime: 0,
      resourceLoadTime: 0
    };

    this.metrics.set('appLaunch', launchMetrics);

    await this.analytics.trackEvent({
      name: 'app_launch',
      category: 'performance',
      action: 'launch',
      label: launchType,
      properties: {
        launchType,
        timestamp: new Date().toISOString(),
        appVersion: this.getAppVersion(),
        osVersion: this.getOSVersion(),
        deviceModel: this.getDeviceModel()
      },
      dimensions: {
        launch_type: launchType,
        app_version: this.getAppVersion()
      }
    });

    // Track launch metrics over time
    this.scheduleLaunchMetricsTracking();
  }

  recordLaunchCompletion(launchType: 'cold' | 'warm' | 'hot', totalTime: number): void {
    const launchMetrics = this.metrics.get('appLaunch') as AppLaunchMetrics;
    if (launchMetrics) {
      switch (launchType) {
        case 'cold':
          launchMetrics.coldLaunchTime = totalTime;
          break;
        case 'warm':
          launchMetrics.warmLaunchTime = totalTime;
          break;
        case 'hot':
          launchMetrics.hotLaunchTime = totalTime;
          break;
      }
    }

    this.analytics.trackEvent({
      name: 'app_launch_completed',
      category: 'performance',
      action: 'launch_complete',
      label: launchType,
      value: Math.round(totalTime),
      properties: {
        launchType,
        totalTime,
        appVersion: this.getAppVersion()
      },
      metrics: {
        launch_time_ms: totalTime
      }
    });
  }

  // Screen and Navigation Tracking
  async trackScreenView(screenName: string, screenClass?: string, properties?: any): Promise<void> {
    if (!this.config.enableScreenTracking) return;

    // End previous screen tracking
    if (this.currentScreen) {
      await this.endScreenTracking();
    }

    this.currentScreen = screenName;
    this.screenLoadStartTime = performance.now();

    const screenMetrics: ScreenMetrics = {
      screenName,
      screenClass: screenClass || screenName,
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      visibleTime: 0,
      bounceRate: 0,
      conversionEvents: 0,
      errorCount: 0,
      userInteractions: 0
    };

    this.screenMetrics.set(screenName, screenMetrics);

    await this.analytics.trackEvent({
      name: 'screen_view',
      category: 'navigation',
      action: 'view',
      label: screenName,
      properties: {
        screenName,
        screenClass,
        ...properties
      },
      dimensions: {
        screen_name: screenName,
        screen_class: screenClass || screenName
      }
    });
  }

  async trackScreenInteraction(interactionType: string, properties?: any): Promise<void> {
    if (!this.currentScreen) return;

    const screenMetrics = this.screenMetrics.get(this.currentScreen);
    if (screenMetrics) {
      screenMetrics.userInteractions++;

      if (screenMetrics.interactionTime === 0) {
        screenMetrics.interactionTime = performance.now() - this.screenLoadStartTime;
      }
    }

    await this.analytics.trackEvent({
      name: 'screen_interaction',
      category: 'engagement',
      action: interactionType,
      label: this.currentScreen,
      properties: {
        screenName: this.currentScreen,
        interactionType,
        ...properties
      }
    });
  }

  async trackScreenExit(exitType: string = 'navigation'): Promise<void> {
    if (!this.currentScreen) return;

    await this.endScreenTracking(exitType);

    await this.analytics.trackEvent({
      name: 'screen_exit',
      category: 'navigation',
      action: 'exit',
      label: this.currentScreen,
      properties: {
        screenName: this.currentScreen,
        exitType,
        timeOnScreen: this.screenLoadStartTime ? performance.now() - this.screenLoadStartTime : 0
      },
      metrics: {
        screen_duration_ms: this.screenLoadStartTime ? performance.now() - this.screenLoadStartTime : 0
      }
    });

    this.currentScreen = null;
  }

  // Feature Usage Tracking
  async trackFeatureUsage(
    featureName: string,
    featureCategory: string,
    action: 'start' | 'end' | 'interact',
    properties?: any
  ): Promise<void> {
    if (!this.config.enableFeatureTracking) return;

    const featureKey = `${featureCategory}:${featureName}`;

    if (action === 'start') {
      this.featureStartTime.set(featureKey, performance.now());

      // Initialize feature metrics if not exists
      if (!this.featureUsage.has(featureKey)) {
        const metrics: FeatureUsageMetrics = {
          featureName,
          featureCategory,
          usageCount: 0,
          uniqueUsers: new Set().size,
          totalUsageTime: 0,
          averageUsageTime: 0,
          usageFrequency: 0,
          adoptionRate: 0,
          retentionRate: 0,
          errorRate: 0,
          lastUsed: new Date().toISOString(),
          firstUsed: new Date().toISOString()
        };

        this.featureUsage.set(featureKey, metrics);
      }

      await this.analytics.trackEvent({
        name: 'feature_start',
        category: 'feature',
        action: 'start',
        label: featureName,
        properties: {
          featureName,
          featureCategory,
          ...properties
        },
        dimensions: {
          feature_name: featureName,
          feature_category: featureCategory
        }
      });

    } else if (action === 'end') {
      const startTime = this.featureStartTime.get(featureKey);
      if (startTime) {
        const duration = performance.now() - startTime;
        this.featureStartTime.delete(featureKey);

        const metrics = this.featureUsage.get(featureKey);
        if (metrics) {
          metrics.usageCount++;
          metrics.totalUsageTime += duration;
          metrics.averageUsageTime = metrics.totalUsageTime / metrics.usageCount;
          metrics.lastUsed = new Date().toISOString();
        }

        await this.analytics.trackEvent({
          name: 'feature_end',
          category: 'feature',
          action: 'end',
          label: featureName,
          value: Math.round(duration),
          properties: {
            featureName,
            featureCategory,
            duration,
            ...properties
          },
          metrics: {
            feature_duration_ms: duration
          }
        });
      }
    } else if (action === 'interact') {
      await this.analytics.trackEvent({
        name: 'feature_interaction',
        category: 'feature',
        action: 'interact',
        label: featureName,
        properties: {
          featureName,
          featureCategory,
          ...properties
        }
      });
    }
  }

  // Performance Monitoring
  async trackPerformanceMetric(
    metricName: string,
    value: number,
    unit: string = 'ms',
    context?: any
  ): Promise<void> {
    if (!this.config.enablePerformanceMetrics) return;

    await this.analytics.trackEvent({
      name: 'performance_metric',
      category: 'performance',
      action: 'measure',
      label: metricName,
      value: Math.round(value),
      properties: {
        metricName,
        value,
        unit,
        ...context
      },
      metrics: {
        [metricName]: value
      }
    });
  }

  async trackCrash(error: Error, context?: any): Promise<void> {
    if (!this.config.enableCrashReporting) return;

    const crashData = {
      errorMessage: error.message,
      stackTrace: error.stack,
      context: context || {},
      timestamp: new Date().toISOString(),
      appVersion: this.getAppVersion(),
      osVersion: this.getOSVersion(),
      deviceModel: this.getDeviceModel(),
      userId: await this.getCurrentUserId(),
      sessionId: await this.getCurrentSessionId()
    };

    await this.analytics.trackEvent({
      name: 'app_crash',
      category: 'error',
      action: 'crash',
      properties: crashData,
      dimensions: {
        error_type: error.constructor.name,
        app_version: this.getAppVersion()
      }
    });
  }

  async trackANR(duration: number, context?: any): Promise<void> {
    if (!this.config.enableANRMonitoring) return;

    await this.analytics.trackEvent({
      name: 'app_anr',
      category: 'performance',
      action: 'anr',
      value: Math.round(duration),
      properties: {
        duration,
        context: context || {},
        appVersion: this.getAppVersion()
      },
      metrics: {
        anr_duration_ms: duration
      }
    });
  }

  async trackMemoryUsage(usage: number, available: number, pressure: string): Promise<void> {
    if (!this.config.enableMemoryMonitoring) return;

    await this.analytics.trackEvent({
      name: 'memory_usage',
      category: 'performance',
      action: 'memory',
      properties: {
        usage,
        available,
        pressure,
        usagePercentage: (usage / available) * 100
      },
      metrics: {
        memory_usage_mb: usage,
        memory_available_mb: available,
        memory_usage_percentage: (usage / available) * 100
      },
      dimensions: {
        memory_pressure: pressure
      }
    });
  }

  async trackBatteryUsage(level: number, state: string): Promise<void> {
    if (!this.config.enableBatteryMonitoring) return;

    await this.analytics.trackEvent({
      name: 'battery_usage',
      category: 'performance',
      action: 'battery',
      properties: {
        level,
        state, // charging, discharging, full, unknown
        timestamp: new Date().toISOString()
      },
      metrics: {
        battery_level: level
      },
      dimensions: {
        battery_state: state
      }
    });
  }

  async trackNetworkPerformance(
    url: string,
    method: string,
    responseTime: number,
    statusCode: number,
    responseSize?: number
  ): Promise<void> {
    if (!this.config.enableNetworkMonitoring) return;

    await this.analytics.trackEvent({
      name: 'network_request',
      category: 'performance',
      action: 'network',
      label: url,
      value: Math.round(responseTime),
      properties: {
        url,
        method,
        statusCode,
        responseSize,
        success: statusCode >= 200 && statusCode < 400
      },
      metrics: {
        response_time_ms: responseTime,
        response_size_bytes: responseSize || 0
      },
      dimensions: {
        request_method: method,
        response_status_code: statusCode.toString(),
        success_status: (statusCode >= 200 && statusCode < 400).toString()
      }
    });
  }

  // Push Notification Analytics
  async trackPushNotification(
    notificationId: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed',
    data: Partial<PushNotificationMetrics>
  ): Promise<void> {
    if (!this.config.enablePushAnalytics) return;

    let metrics = this.pushMetrics.get(notificationId);
    if (!metrics) {
      metrics = {
        notificationId,
        platform: this.getPlatform() as 'ios' | 'android',
        deviceType: this.getDeviceType(),
        status: event,
        title: data.title || '',
        body: data.body || '',
        category: data.category || 'general',
        scheduledTime: data.scheduledTime || new Date().toISOString(),
        sentTime: new Date().toISOString(),
        properties: data.properties || {}
      };
      this.pushMetrics.set(notificationId, metrics);
    }

    // Update metrics based on event
    switch (event) {
      case 'sent':
        metrics.sentTime = new Date().toISOString();
        metrics.status = 'sent';
        break;
      case 'delivered':
        metrics.deliveredTime = new Date().toISOString();
        metrics.status = 'delivered';
        break;
      case 'opened':
        metrics.openedTime = new Date().toISOString();
        metrics.status = 'opened';
        break;
      case 'clicked':
        metrics.clickedTime = new Date().toISOString();
        metrics.status = 'clicked';
        break;
      case 'converted':
        metrics.conversionTime = new Date().toISOString();
        metrics.status = 'converted';
        break;
      case 'failed':
        metrics.status = 'failed';
        metrics.errorMessage = data.errorMessage;
        metrics.errorCode = data.errorCode;
        break;
    }

    await this.analytics.trackEvent({
      name: 'push_notification',
      category: 'engagement',
      action: event,
      label: metrics.category,
      properties: {
        notificationId,
        campaignId: metrics.campaignId,
        category: metrics.category,
        timeToOpen: metrics.openedTime && metrics.sentTime ?
          new Date(metrics.openedTime).getTime() - new Date(metrics.sentTime).getTime() : undefined,
        timeToClick: metrics.clickedTime && metrics.sentTime ?
          new Date(metrics.clickedTime).getTime() - new Date(metrics.sentTime).getTime() : undefined,
        timeToConvert: metrics.conversionTime && metrics.sentTime ?
          new Date(metrics.conversionTime).getTime() - new Date(metrics.sentTime).getTime() : undefined
      }
    });
  }

  // In-App Purchase Analytics
  async trackInAppPurchase(
    transactionId: string,
    event: 'initiated' | 'completed' | 'failed' | 'refunded',
    data: Partial<InAppPurchaseMetrics>
  ): Promise<void> {
    if (!this.config.enablePurchaseTracking) return;

    let metrics = this.purchaseMetrics.get(transactionId);
    if (!metrics) {
      metrics = {
        transactionId,
        productId: data.productId || '',
        productName: data.productName || '',
        productType: data.productType || 'consumable',
        price: data.price || 0,
        currency: data.currency || 'USD',
        quantity: data.quantity || 1,
        platform: this.getPlatform() as 'ios' | 'android',
        status: event,
        purchaseTime: new Date().toISOString(),
        properties: data.properties || {}
      };
      this.purchaseMetrics.set(transactionId, metrics);
    }

    // Update metrics based on event
    switch (event) {
      case 'initiated':
        metrics.status = 'initiated';
        break;
      case 'completed':
        metrics.status = 'completed';
        metrics.purchaseTime = new Date().toISOString();
        break;
      case 'failed':
        metrics.status = 'failed';
        metrics.failureReason = data.failureReason;
        break;
      case 'refunded':
        metrics.status = 'refunded';
        metrics.refundTime = new Date().toISOString();
        break;
    }

    await this.analytics.trackEvent({
      name: 'in_app_purchase',
      category: 'revenue',
      action: event,
      label: metrics.productType,
      value: metrics.price * metrics.quantity,
      properties: {
        transactionId,
        productId: metrics.productId,
        productName: metrics.productName,
        productType: metrics.productType,
        price: metrics.price,
        currency: metrics.currency,
        quantity: metrics.quantity,
        campaignId: metrics.campaignId,
        failureReason: metrics.failureReason
      },
      metrics: {
        purchase_amount: metrics.price * metrics.quantity,
        purchase_quantity: metrics.quantity
      },
      dimensions: {
        product_type: metrics.productType,
        product_category: metrics.productCategory || 'general',
        currency: metrics.currency
      }
    });
  }

  // User Engagement Metrics
  async trackUserEngagement(engagementType: string, properties?: any): Promise<void> {
    if (!this.config.enableEngagementMetrics) return;

    await this.analytics.trackEvent({
      name: 'user_engagement',
      category: 'engagement',
      action: engagementType,
      properties: {
        engagementType,
        ...properties
      },
      dimensions: {
        engagement_type: engagementType
      }
    });
  }

  // Quality Metrics
  async trackAppQuality(
    qualityType: 'rating' | 'feedback' | 'satisfaction',
    data: any
  ): Promise<void> {
    if (!this.config.enableQualityMetrics) return;

    await this.analytics.trackEvent({
      name: 'app_quality',
      category: 'quality',
      action: qualityType,
      value: data.rating || data.score,
      properties: {
        qualityType,
        ...data
      },
      metrics: {
        quality_score: data.rating || data.score
      },
      dimensions: {
        quality_type: qualityType
      }
    });
  }

  // Get comprehensive mobile metrics
  async getMobileMetrics(): Promise<MobileSpecificMetrics> {
    // Aggregate all tracked metrics
    const performanceMetrics = await this.getAggregatedPerformanceMetrics();
    const engagementMetrics = await this.getAggregatedEngagementMetrics();
    const featureMetrics = this.getAggregatedFeatureMetrics();
    const pushMetrics = this.getAggregatedPushMetrics();
    const purchaseMetrics = this.getAggregatedPurchaseMetrics();
    const qualityMetrics = await this.getAggregatedQualityMetrics();

    return {
      acquisition: {
        installSource: this.getInstallSource(),
        installDate: this.getInstallDate(),
        campaign: this.getCampaign(),
        costPerInstall: this.getCostPerInstall(),
        organicInstall: this.isOrganicInstall(),
        referralSource: this.getReferralSource()
      },
      performance: {
        launchTime: this.getAverageLaunchTime(),
        crashFreeUsers: this.getCrashFreeUsers(),
        crashFreeSessions: this.getCrashFreeSessions(),
        appNotRespondingRate: this.getANRRate(),
        memoryUsage: this.getAverageMemoryUsage(),
        batteryUsage: this.getAverageBatteryUsage(),
        networkLatency: this.getAverageNetworkLatency(),
        apiResponseTime: this.getAverageAPIResponseTime()
      },
      engagement: {
        dailyActiveUsers: engagementMetrics.dailyActiveUsers,
        monthlyActiveUsers: engagementMetrics.monthlyActiveUsers,
        sessionLength: engagementMetrics.averageSessionLength,
        sessionFrequency: engagementMetrics.averageSessionFrequency,
        screenViewsPerSession: engagementMetrics.averageScreenViewsPerSession,
        retentionRate: engagementMetrics.retentionRate,
        churnRate: engagementMetrics.churnRate
      },
      featureAdoption: {
        totalFeatures: featureMetrics.totalFeatures,
        adoptedFeatures: featureMetrics.adoptedFeatures,
        adoptionRate: featureMetrics.adoptionRate,
        featureUsage: featureMetrics.featureUsage,
        powerUserFeatures: featureMetrics.powerUserFeatures
      },
      pushNotifications: {
        sent: pushMetrics.sent,
        delivered: pushMetrics.delivered,
        opened: pushMetrics.opened,
        clicked: pushMetrics.clicked,
        conversionRate: pushMetrics.conversionRate,
        optOutRate: pushMetrics.optOutRate,
        averageTimeToOpen: pushMetrics.averageTimeToOpen
      },
      inAppPurchases: purchaseMetrics,
      quality: {
        anrRate: this.getANRRate(),
        exceptionRate: this.getExceptionRate(),
        userSatisfaction: qualityMetrics.userSatisfaction,
        appStoreRating: qualityMetrics.appStoreRating,
        reviewsCount: qualityMetrics.reviewsCount,
        positiveSentiment: qualityMetrics.positiveSentiment
      }
    };
  }

  // Private helper methods
  private initializeTracking(): void {
    // Setup performance observers
    if (typeof window !== 'undefined') {
      this.setupPerformanceObservers();
    }

    // Setup error tracking
    this.setupErrorTracking();

    // Setup lifecycle tracking
    this.setupLifecycleTracking();
  }

  private setupPerformanceObservers(): void {
    // Observe performance metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric(entry.name, entry.duration, 'ms', {
            entryType: entry.entryType,
            startTime: entry.startTime
          });
        }
      });

      observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
    }
  }

  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackCrash(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackCrash(new Error(event.reason), {
          type: 'unhandled_promise_rejection'
        });
      });
    }
  }

  private setupLifecycleTracking(): void {
    // Track app lifecycle events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackAppBackground();
      } else {
        this.trackAppForeground();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.trackAppExit();
    });
  }

  private async endScreenTracking(exitType?: string): Promise<void> {
    if (!this.currentScreen) return;

    const screenMetrics = this.screenMetrics.get(this.currentScreen);
    if (screenMetrics && this.screenLoadStartTime) {
      screenMetrics.visibleTime = performance.now() - this.screenLoadStartTime;
      screenMetrics.exitTime = new Date().toISOString();
    }
  }

  private scheduleLaunchMetricsTracking(): void {
    // Schedule launch metrics completion tracking
    setTimeout(() => {
      if (this.launchStartTime) {
        const totalTime = performance.now() - this.launchStartTime;
        this.recordLaunchCompletion('cold', totalTime);
      }
    }, 10000); // 10 seconds
  }

  private async trackCampaignAttribution(campaign: string, source?: string): Promise<void> {
    await this.analytics.trackEvent({
      name: 'campaign_attribution',
      category: 'marketing',
      action: 'attribute',
      properties: {
        campaign,
        source,
        timestamp: new Date().toISOString()
      },
      dimensions: {
        campaign_name: campaign,
        attribution_source: source || 'unknown'
      }
    });
  }

  private async trackAppBackground(): Promise<void> {
    await this.analytics.trackEvent({
      name: 'app_background',
      category: 'lifecycle',
      action: 'background',
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  }

  private async trackAppForeground(): Promise<void> {
    await this.analytics.trackEvent({
      name: 'app_foreground',
      category: 'lifecycle',
      action: 'foreground',
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  }

  private async trackAppExit(): Promise<void> {
    await this.analytics.trackEvent({
      name: 'app_exit',
      category: 'lifecycle',
      action: 'exit',
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Metric aggregation methods
  private async getAggregatedPerformanceMetrics(): Promise<any> {
    // Implementation for aggregating performance metrics
    return {};
  }

  private async getAggregatedEngagementMetrics(): Promise<any> {
    // Implementation for aggregating engagement metrics
    return {};
  }

  private getAggregatedFeatureMetrics(): any {
    // Implementation for aggregating feature metrics
    return {};
  }

  private getAggregatedPushMetrics(): any {
    // Implementation for aggregating push metrics
    return {};
  }

  private getAggregatedPurchaseMetrics(): any {
    // Implementation for aggregating purchase metrics
    return {};
  }

  private async getAggregatedQualityMetrics(): Promise<any> {
    // Implementation for aggregating quality metrics
    return {};
  }

  // Helper getters
  private getInstallSource(): string {
    return localStorage.getItem('install_source') || 'organic';
  }

  private getInstallDate(): string {
    return localStorage.getItem('install_date') || new Date().toISOString();
  }

  private getCampaign(): string | undefined {
    return localStorage.getItem('campaign') || undefined;
  }

  private getCostPerInstall(): number | undefined {
    const cost = localStorage.getItem('cost_per_install');
    return cost ? parseFloat(cost) : undefined;
  }

  private isOrganicInstall(): boolean {
    const source = this.getInstallSource();
    return source === 'organic' || source === 'direct';
  }

  private getReferralSource(): string | undefined {
    return localStorage.getItem('referral_source') || undefined;
  }

  private getAppVersion(): string {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  private getPlatform(): string {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' :
           /Android/i.test(navigator.userAgent) ? 'android' : 'web';
  }

  private getDeviceId(): string {
    return localStorage.getItem('device_id') || 'unknown';
  }

  private getDeviceModel(): string {
    return navigator.userAgent.includes('iPhone') ? 'iPhone' :
           navigator.userAgent.includes('iPad') ? 'iPad' :
           navigator.userAgent.includes('Android') ? 'Android' : 'Unknown';
  }

  private getOSVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(OS|Android|Windows) ([\d._]+)/);
    return match ? `${match[1]} ${match[2]}` : 'Unknown';
  }

  private getDeviceType(): string {
    return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  }

  private isFirstLaunch(): boolean {
    const hasLaunched = localStorage.getItem('has_launched');
    if (!hasLaunched) {
      localStorage.setItem('has_launched', 'true');
      return true;
    }
    return false;
  }

  private getTotalLaunches(): number {
    const launches = parseInt(localStorage.getItem('total_launches') || '0');
    localStorage.setItem('total_launches', (launches + 1).toString());
    return launches + 1;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    // Get current user ID from analytics service
    return undefined; // Implementation depends on analytics service
  }

  private async getCurrentSessionId(): Promise<string | undefined> {
    // Get current session ID from analytics service
    return undefined; // Implementation depends on analytics service
  }

  // Metric calculation methods
  private getAverageLaunchTime(): number {
    // Calculate average launch time from metrics
    return 0; // Implementation needed
  }

  private getCrashFreeUsers(): number {
    return 0; // Implementation needed
  }

  private getCrashFreeSessions(): number {
    return 0; // Implementation needed
  }

  private getANRRate(): number {
    return 0; // Implementation needed
  }

  private getAverageMemoryUsage(): number {
    return 0; // Implementation needed
  }

  private getAverageBatteryUsage(): number {
    return 0; // Implementation needed
  }

  private getAverageNetworkLatency(): number {
    return 0; // Implementation needed
  }

  private getAverageAPIResponseTime(): number {
    return 0; // Implementation needed
  }

  private getExceptionRate(): number {
    return 0; // Implementation needed
  }
}

export default MobileMetricsTracker;