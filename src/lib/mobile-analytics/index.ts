// Mobile Analytics System - Main Entry Point
// Comprehensive analytics solution for luxury beauty/fitness booking platform

export { default as MobileCrossPlatformAnalytics } from './cross-platform-analytics';
export { default as MobileMetricsTracker } from './mobile-metrics';
export { default as UserBehaviorAnalyticsTracker } from './user-behavior-analytics';
export { default as MobilePerformanceAnalytics } from './performance-analytics';
export { default as BusinessIntelligenceEngine } from './business-intelligence';
export { default as AnalyticsServicesManager } from './analytics-services';
export { default as DataGovernanceManager } from './data-governance';

export type {
  MobileAnalyticsConfig,
  UnifiedAnalyticsEvent,
  CrossPlatformSession,
  AnalyticsBatch,
  AnalyticsStorage,
  AnalyticsTransport,
  AnalyticsProcessor,
  ConsentManager,
  PerformanceMonitor
} from './core';

export type {
  DeviceInfo,
  AnalyticsEvent,
  UserSession,
  LocationInfo,
  SessionQuality,
  AppPerformance,
  BookingAnalytics,
  UserBehaviorAnalytics,
  MobileSpecificMetrics,
  BusinessIntelligenceMetrics,
  AnalyticsDashboard
} from '../types/mobile-analytics';

// Re-export commonly used utilities
export { getPlatform, isNativeApp, getAppVersion, defaultAnalyticsConfig } from './core';

// Main Mobile Analytics Manager Class
import MobileCrossPlatformAnalytics from './cross-platform-analytics';
import MobileMetricsTracker from './mobile-metrics';
import UserBehaviorAnalyticsTracker from './user-behavior-analytics';
import MobilePerformanceAnalytics from './performance-analytics';
import BusinessIntelligenceEngine from './business-intelligence';
import AnalyticsServicesManager from './analytics-services';
import DataGovernanceManager from './data-governance';
import type {
  MobileAnalyticsConfig,
  AnalyticsServicesConfig,
  BusinessIntelligenceConfig,
  DataGovernanceConfig
} from './core';

import type {
  MobileMetricsConfig,
  UserBehaviorConfig,
  PerformanceAnalyticsConfig
} from './mobile-metrics';

export interface MobileAnalyticsSystemConfig {
  core: MobileAnalyticsConfig;
  metrics: MobileMetricsConfig;
  behavior: UserBehaviorConfig;
  performance: PerformanceAnalyticsConfig;
  services: AnalyticsServicesConfig;
  business: BusinessIntelligenceConfig;
  governance: DataGovernanceConfig;
}

export class MobileAnalyticsSystem {
  // Core Analytics Components
  private crossPlatformAnalytics: MobileCrossPlatformAnalytics;
  private metricsTracker: MobileMetricsTracker;
  private behaviorTracker: UserBehaviorAnalyticsTracker;
  private performanceAnalytics: MobilePerformanceAnalytics;
  private businessIntelligence: BusinessIntelligenceEngine;
  private servicesManager: AnalyticsServicesManager;
  private governanceManager: DataGovernanceManager;

  private config: MobileAnalyticsSystemConfig;
  private initialized = false;

  constructor(config: MobileAnalyticsSystemConfig) {
    this.config = config;

    // Initialize components in dependency order
    this.initializeComponents();
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Mobile Analytics System...');

      // 1. Initialize core analytics platform
      await this.crossPlatformAnalytics.initialize(this.config.core);

      // 2. Initialize services integration
      await this.servicesManager.initializeServices();

      // 3. Initialize governance and consent
      await this.governanceManager.initialize(this.config.governance);

      // 4. Start performance monitoring
      this.performanceAnalytics.startPerformanceMonitoring();

      // 5. Start analytics system
      await this.crossPlatformAnalytics.start();

      // 6. Setup real-time monitoring if enabled
      if (this.config.services.customDashboard.realTimeUpdates) {
        this.servicesManager.startRealTimeMonitoring();
      }

      this.initialized = true;
      console.log('Mobile Analytics System initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Mobile Analytics System:', error);
      throw error;
    }
  }

  // High-level tracking methods
  async trackEvent(event: Omit<any, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.trackEvent(event);
  }

  async trackPageView(page: string, title?: string, properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.trackPageView(page, title, properties);
  }

  async trackUserAction(action: string, properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.trackUserAction(action, properties);
  }

  async trackBookingEvent(bookingData: any): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.trackBookingEvent(bookingData);
    await this.behaviorTracker.trackServiceBooking('current_user', bookingData);
  }

  async trackServiceView(userId: string, serviceData: any, context?: any): Promise<void> {
    this.ensureInitialized();
    await this.behaviorTracker.trackServiceView(userId, serviceData, context);
  }

  async trackServiceCompletion(userId: string, serviceId: string, rating?: number, feedback?: string): Promise<void> {
    this.ensureInitialized();
    await this.behaviorTracker.trackServiceCompletion(userId, serviceId, rating, feedback);
  }

  async trackContentEngagement(userId: string, contentType: string, contentId: string, engagementType: string, properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.behaviorTracker.trackContentEngagement(userId, contentType, contentId, engagementType, properties);
  }

  async trackAppBehavior(userId: string, behaviorType: string, properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.behaviorTracker.trackAppBehavior(userId, behaviorType, properties);
  }

  async trackAppInstallation(source?: string, campaign?: string): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackAppInstallation(source, campaign);
  }

  async trackAppLaunch(launchType: 'cold' | 'warm' | 'hot' = 'cold'): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackAppLaunch(launchType);
  }

  async trackScreenView(screenName: string, screenClass?: string, properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackScreenView(screenName, screenClass, properties);
  }

  async trackFeatureUsage(userId: string, featureName: string, featureCategory: string, action: 'start' | 'end' | 'interact', properties?: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackFeatureUsage(featureName, featureCategory, action, properties);
  }

  async trackPerformanceMetric(metricName: string, value: number, unit?: string, context?: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackPerformanceMetric(metricName, value, unit, context);
  }

  async trackCrash(error: Error, context?: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackCrash(error, context);
    await this.performanceAnalytics.recordError(error, context);
  }

  async trackPushNotification(notificationId: string, event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed', data: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackPushNotification(notificationId, event, data);
  }

  async trackInAppPurchase(transactionId: string, event: 'initiated' | 'completed' | 'failed' | 'refunded', data: any): Promise<void> {
    this.ensureInitialized();
    await this.metricsTracker.trackInAppPurchase(transactionId, event, data);
  }

  async trackJourneyTouchpoint(userId: string, touchpointData: any): Promise<void> {
    this.ensureInitialized();
    await this.behaviorTracker.trackJourneyTouchpoint(userId, touchpointData);
  }

  // User identification and consent
  async identifyUser(userId: string, traits?: any): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.identifyUser(userId, traits);
    await this.servicesManager.identifyUser(userId, traits);
  }

  async anonymizeUser(): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.anonymizeUser();
    await this.servicesManager.reset();
  }

  async updateConsent(consent: any): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.updateConsent(consent);
    await this.servicesManager.updateConsent(consent);
    await this.governanceManager.updateConsent(consent);
  }

  async hasConsent(): boolean {
    return this.crossPlatformAnalytics.hasConsent();
  }

  // Data retrieval and analytics
  async getUserBehaviorAnalytics(userId: string): Promise<any> {
    this.ensureInitialized();
    return await this.behaviorTracker.getUserBehaviorAnalytics(userId);
  }

  async getMobileMetrics(): Promise<any> {
    this.ensureInitialized();
    return await this.metricsTracker.getMobileMetrics();
  }

  async getPerformanceMetrics(): Promise<any> {
    this.ensureInitialized();
    return await this.performanceAnalytics.getMetrics();
  }

  async getRevenueAnalytics(dateRange: { start: string; end: string }): Promise<any> {
    this.ensureInitialized();
    return await this.businessIntelligence.getRevenueAnalytics(dateRange);
  }

  async getCustomerAnalytics(dateRange: { start: string; end: string }): Promise<any> {
    this.ensureInitialized();
    return await this.businessIntelligence.getCustomerAnalytics(dateRange);
  }

  async getOperationalAnalytics(dateRange: { start: string; end: string }): Promise<any> {
    this.ensureInitialized();
    return await this.businessIntelligence.getOperationalAnalytics(dateRange);
  }

  async getMarketAnalytics(): Promise<any> {
    this.ensureInitialized();
    return await this.businessIntelligence.getMarketAnalytics();
  }

  async getBusinessIntelligenceDashboard(): Promise<any> {
    this.ensureInitialized();
    return await this.businessIntelligence.getBusinessIntelligenceDashboard();
  }

  async getDashboardData(dashboardId: string, filters?: Record<string, any>): Promise<any> {
    this.ensureInitialized();
    return await this.servicesManager.getDashboardData(dashboardId, filters);
  }

  async getRealTimeMetrics(): Promise<any> {
    this.ensureInitialized();
    return this.servicesManager.getRealTimeMetrics();
  }

  // Data governance and compliance
  async exportUserData(userId: string): Promise<any> {
    this.ensureInitialized();
    return await this.governanceManager.exportUserData(userId);
  }

  async deleteUserData(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.governanceManager.deleteUserData(userId);
  }

  async generateComplianceReport(period: { start: string; end: string }): Promise<any> {
    this.ensureInitialized();
    return await this.governanceManager.generateComplianceReport(period);
  }

  // Dashboard management
  createDashboard(config: any): void {
    this.ensureInitialized();
    this.servicesManager.createDashboard(config);
  }

  getDashboard(id: string): any {
    this.ensureInitialized();
    return this.servicesManager.getDashboard(id);
  }

  getAllDashboards(): any[] {
    this.ensureInitialized();
    return this.servicesManager.getAllDashboards();
  }

  // System management
  async flush(): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.flush();
    await this.servicesManager.flush();
  }

  async reset(): Promise<void> {
    this.ensureInitialized();
    await this.crossPlatformAnalytics.reset();
    await this.servicesManager.reset();
  }

  async stop(): Promise<void> {
    if (!this.initialized) return;

    console.log('Stopping Mobile Analytics System...');

    await this.crossPlatformAnalytics.stop();
    this.performanceAnalytics.stopPerformanceMonitoring();
    this.servicesManager.stopRealTimeMonitoring();

    this.initialized = false;
    console.log('Mobile Analytics System stopped');
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.initialize();
  }

  getConfig(): MobileAnalyticsSystemConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<MobileAnalyticsSystemConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    if (newConfig.core) {
      await this.crossPlatformAnalytics.updateConfig(newConfig.core);
    }

    // Restart system with new configuration if needed
    if (this.initialized) {
      await this.restart();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Private helper methods
  private initializeComponents(): void {
    // Initialize governance first (required for consent)
    this.governanceManager = new DataGovernanceManager(null, this.config.governance);

    // Initialize core analytics
    this.crossPlatformAnalytics = new MobileCrossPlatformAnalytics(
      // Implementation would provide actual storage, transport, etc.
      {} as any,
      {} as any,
      {} as any,
      this.governanceManager,
      {} as any
    );

    // Initialize metrics tracker
    this.metricsTracker = new MobileMetricsTracker(this.crossPlatformAnalytics, this.config.metrics);

    // Initialize behavior tracker
    this.behaviorTracker = new UserBehaviorAnalyticsTracker(this.crossPlatformAnalytics, this.config.behavior);

    // Initialize performance analytics
    this.performanceAnalytics = new MobilePerformanceAnalytics(this.crossPlatformAnalytics, this.config.performance);

    // Initialize business intelligence
    this.businessIntelligence = new BusinessIntelligenceEngine(this.crossPlatformAnalytics, this.config.business);

    // Initialize services manager
    this.servicesManager = new AnalyticsServicesManager(this.config.services);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Mobile Analytics System not initialized. Call initialize() first.');
    }
  }
}

// Factory function for creating analytics system with default configuration
export function createMobileAnalyticsSystem(overrides: Partial<MobileAnalyticsSystemConfig> = {}): MobileAnalyticsSystem {
  const defaultConfig: MobileAnalyticsSystemConfig = {
    core: {
      platform: 'web', // Will be auto-detected
      appId: 'mariia-hub-analytics',
      appVersion: '1.0.0',
      googleAnalytics: {
        measurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID || '',
        debugMode: process.env.NODE_ENV === 'development',
        enhancedEcommerce: true,
        crossDomainTracking: false,
        anonymizeIp: true,
        allowAdFeatures: false,
        allowGoogleSignals: true,
        sampleRate: 100
      },
      firebaseAnalytics: {
        enabled: false,
        config: {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          measurementId: ''
        },
        debugMode: process.env.NODE_ENV === 'development',
        automaticScreenReporting: true,
        automaticPerformanceMonitoring: true,
        enableCrashlytics: true,
        enableRemoteConfig: false,
        enableABTesting: false
      },
      appleAnalytics: {
        enabled: false,
        teamId: '',
        keyId: '',
        privateKey: '',
        bundleId: '',
        enableAppStoreConnect: true,
        enableTestFlight: false,
        enableCustomEvents: true
      },
      customDashboard: {
        enabled: true,
        endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT || '/api/analytics',
        apiKey: process.env.REACT_APP_ANALYTICS_API_KEY || '',
        realTimeUpdates: true,
        batchSize: 20,
        retryAttempts: 3,
        encryption: true,
        compression: true
      },
      privacy: {
        enableGDPR: true,
        enableCCPA: false,
        cookieConsentRequired: true,
        dataRetentionDays: 365,
        anonymizeIp: true,
        enableConsentManagement: true
      },
      performance: {
        enableCoreWebVitals: true,
        enableCrashReporting: true,
        enableNetworkMonitoring: true,
        enableBatteryMonitoring: false,
        sampleRate: 0.1
      },
      business: {
        enableRevenueTracking: true,
        enableConversionTracking: true,
        enableUserLifetimeValue: true,
        enablePredictiveAnalytics: true
      },
      realtime: {
        enableLiveDashboard: true,
        enableLiveEvents: true,
        enableLivePerformance: false,
        updateInterval: 30000
      }
    },
    metrics: {
      enableInstallTracking: true,
      enableCampaignTracking: true,
      enableReferralTracking: true,
      enablePerformanceMetrics: true,
      enableCrashReporting: true,
      enableANRMonitoring: true,
      enableMemoryMonitoring: true,
      enableBatteryMonitoring: false,
      enableEngagementMetrics: true,
      enableScreenTracking: true,
      enableFeatureTracking: true,
      enableSessionTracking: true,
      enablePushAnalytics: true,
      enablePushDeliveryTracking: true,
      enablePushEngagementTracking: true,
      enablePurchaseTracking: true,
      enableRevenueTracking: true,
      enableSubscriptionTracking: true,
      enableQualityMetrics: true,
      enableAppStoreRatingTracking: true,
      enableUserFeedbackTracking: true,
      enableA/BTesting: false,
      performanceSampleRate: 1.0,
      crashSampleRate: 1.0,
      engagementSampleRate: 0.1
    },
    behavior: {
      enableServicePreferenceTracking: true,
      enableCategoryPreferenceTracking: true,
      enablePriceSensitivityTracking: true,
      enableTimeSlotPreferenceTracking: true,
      enableBookingPatternTracking: true,
      enableSeasonalAnalysis: true,
      enableCancellationAnalysis: true,
      enableAdvanceBookingAnalysis: true,
      enableContentEngagementTracking: true,
      enableSearchBehaviorTracking: true,
      enableSocialSharingTracking: true,
      enableDownloadTracking: true,
      enableAppBehaviorTracking: true,
      enablePushNotificationBehavior: true,
      enableOfflineUsageTracking: true,
      enableFeatureAdoptionTracking: true,
      enableJourneyTracking: true,
      enableTouchpointTracking: true,
      enableConversionPathAnalysis: true,
      enableSegmentation: true,
      enablePredictiveAnalytics: true,
      enableChurnPrediction: true,
      enableLifetimeValuePrediction: true,
      behaviorTrackingSampleRate: 1.0,
      predictionModelUpdateFrequency: 24,
      segmentUpdateFrequency: 6
    },
    performance: {
      enableCoreWebVitals: true,
      enableRenderPerformance: true,
      enableNetworkPerformance: true,
      enableMemoryMonitoring: true,
      enableBatteryMonitoring: false,
      enableCPUMonitoring: false,
      enableCrashReporting: true,
      enableANRMonitoring: true,
      enableJavaScriptErrorTracking: true,
      enableNetworkErrorTracking: true,
      enablePromiseRejectionTracking: true,
      enableResourceTiming: true,
      enableUserTiming: true,
      enableLongTaskMonitoring: true,
      enableLayoutShiftMonitoring: true,
      enableAppLaunchTime: true,
      enableScreenPerformance: true,
      enableDatabasePerformance: false,
      enableFileSystemPerformance: false,
      enableRealTimeMonitoring: true,
      enablePerformanceBudgets: true,
      enablePerformanceAlerts: true,
      performanceSampleRate: 1.0,
      crashSampleRate: 1.0,
      longTaskThreshold: 50,
      memoryThreshold: 100,
      batteryThreshold: 20,
      budgets: {
        firstContentfulPaint: 1800,
        largestContentfulPaint: 2500,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        timeToInteractive: 3800,
        memoryUsage: 100,
        bundleSize: 250,
        apiResponseTime: 2000
      }
    },
    services: {
      googleAnalytics: {
        enabled: !!process.env.REACT_APP_GA4_MEASUREMENT_ID,
        measurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID || '',
        debugMode: process.env.NODE_ENV === 'development',
        enhancedEcommerce: true,
        crossDomainTracking: false,
        anonymizeIp: true,
        allowAdFeatures: false,
        allowGoogleSignals: true,
        sampleRate: 100
      },
      firebaseAnalytics: {
        enabled: false,
        config: {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          measurementId: ''
        },
        debugMode: process.env.NODE_ENV === 'development',
        automaticScreenReporting: true,
        automaticPerformanceMonitoring: true,
        enableCrashlytics: true,
        enableRemoteConfig: false,
        enableABTesting: false
      },
      appleAnalytics: {
        enabled: false,
        teamId: '',
        keyId: '',
        privateKey: '',
        bundleId: '',
        enableAppStoreConnect: true,
        enableTestFlight: false,
        enableCustomEvents: true
      },
      customDashboard: {
        enabled: true,
        endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT || '/api/analytics',
        apiKey: process.env.REACT_APP_ANALYTICS_API_KEY || '',
        realTimeUpdates: true,
        batchSize: 20,
        retryAttempts: 3,
        encryption: true,
        compression: true
      },
      dataRetention: {
        googleAnalytics: 14,
        firebase: 30,
        customDashboard: 90
      },
      privacy: {
        enableConsentMode: true,
        defaultConsentState: 'denied',
        enableAdStorage: false,
        enableAnalyticsStorage: true,
        enableAdUserData: false,
        enableAdPersonalization: false
      }
    },
    business: {
      enableRevenueTracking: true,
      enableProfitabilityAnalysis: true,
      enableRevenueForecasting: true,
      enablePricingAnalytics: true,
      enableCustomerSegmentation: true,
      enableLifetimeValueAnalysis: true,
      enableChurnPrediction: true,
      enableAcquisitionAnalytics: true,
      enableServicePerformanceAnalysis: true,
      enableStaffPerformanceTracking: true,
      enableResourceUtilizationAnalysis: true,
      enableOperationalEfficiencyMonitoring: true,
      enableCompetitorAnalysis: true,
      enableMarketTrendAnalysis: true,
      enablePricingIntelligence: true,
      enableDemandForecasting: true,
      enablePredictiveModels: true,
      enableScenarioAnalysis: true,
      enableRecommendationEngine: true,
      enableAnomalyDetection: true,
      enableAutomatedReports: true,
      enableRealTimeAlerts: true,
      enableKPIDashboards: true,
      enableBusinessAlerts: true,
      historicalDataDays: 365,
      forecastDays: 90,
      modelUpdateFrequency: 24,
      confidenceThreshold: 0.8
    },
    governance: {
      gdpr: {
        enabled: true,
        requireConsent: true,
        consentAge: 16,
        dataRetentionDays: 365,
        anonymizationRequired: true,
        dpoContact: 'privacy@mariaborysevych.com',
        privacyPolicyUrl: '/privacy-policy',
        cookiePolicyUrl: '/cookie-policy',
        rightsRequestUrl: '/rights-request'
      },
      ccpa: {
        enabled: false,
        requireOptOut: false,
        dataRetentionDays: 365,
        doNotSell: false,
        personalInfoCategories: ['identifiers', 'preferences', 'commercial'],
        disclosureUrl: '/privacy-policy#california-privacy-rights',
        optOutUrl: '/privacy-policy#do-not-sell'
      },
      lgpd: {
        enabled: false,
        requireConsent: true,
        dataRetentionDays: 365,
        anonymizationRequired: true,
        rightsRequestUrl: '/lgpd-rights'
      },
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90,
        dataAtRest: true,
        dataInTransit: true,
        endToEndEncryption: false
      },
      dataMinimization: {
        enabled: true,
        collectOnlyNecessary: true,
        automaticPurging: true,
        piiDetection: true,
        sensitiveDataMasking: true
      },
      consent: {
        required: true,
        defaultState: 'denied',
        cookieConsent: true,
        analyticsConsent: true,
        marketingConsent: false,
        personalizationConsent: false,
        thirdPartyConsent: false,
        consentRecording: true,
        consentWithdrawalEasy: true
      },
      retention: {
        automaticDeletion: true,
        userInitiatedDeletion: true,
        hardDeletion: true,
        softDeleteRetentionDays: 30,
        auditTrail: true,
        deletionConfirmation: true
      },
      access: {
        userAccessRequests: true,
        dataExportFormats: ['json', 'csv', 'pdf'],
        exportTimeLimit: 30,
        accessVerificationRequired: true,
        bulkExportEnabled: true
      },
      security: {
        accessControl: true,
        auditLogging: true,
        breachDetection: true,
        breachNotification: true,
        securityTraining: false,
        penetrationTesting: false
      },
      monitoring: {
        complianceMonitoring: true,
        privacyImpactAssessments: true,
        reporting: true,
        metrics: true,
        alerts: true
      }
    }
  };

  const mergedConfig = this.mergeConfigs(defaultConfig, overrides);
  return new MobileAnalyticsSystem(mergedConfig);
}

// Helper function to deep merge configurations
function mergeConfigs<T extends Record<string, any>>(defaultConfig: T, overrides: Partial<T>): T {
  const result = { ...defaultConfig };

  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
        result[key] = mergeConfigs(defaultConfig[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }

  return result;
}

// Export default instance creator
export default createMobileAnalyticsSystem;