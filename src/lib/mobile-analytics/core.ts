// Cross-Platform Mobile Analytics System Core
// Unified analytics for web, iOS, and Android platforms

import type {
  AnalyticsEvent,
  UserSession,
  DeviceInfo,
  AppPerformance,
  BookingAnalytics,
  UserBehaviorAnalytics
} from '@/types/mobile-analytics';

export interface MobileAnalyticsConfig {
  // Platform Configuration
  platform: 'web' | 'ios' | 'android';
  appId: string;
  appVersion: string;

  // Analytics Services Configuration
  googleAnalytics: {
    measurementId: string;
    apiKey?: string;
  };
  firebaseAnalytics?: {
    apiKey: string;
    appId: string;
    measurementId: string;
    projectId: string;
  };
  appleAppAnalytics?: {
    teamId: string;
    keyId: string;
    privateKey: string;
  };

  // Privacy and Compliance
  privacy: {
    enableGDPR: boolean;
    enableCCPA: boolean;
    cookieConsentRequired: boolean;
    dataRetentionDays: number;
    anonymizeIp: boolean;
    enableConsentManagement: boolean;
  };

  // Performance Monitoring
  performance: {
    enableCoreWebVitals: boolean;
    enableCrashReporting: boolean;
    enableNetworkMonitoring: boolean;
    enableBatteryMonitoring: boolean;
    sampleRate: number; // 0-1
  };

  // Business Intelligence
  business: {
    enableRevenueTracking: boolean;
    enableConversionTracking: boolean;
    enableUserLifetimeValue: boolean;
    enablePredictiveAnalytics: boolean;
  };

  // Real-time Analytics
  realtime: {
    enableLiveDashboard: boolean;
    enableLiveEvents: boolean;
    enableLivePerformance: boolean;
    updateInterval: number; // milliseconds
  };
}

export interface AnalyticsConsent {
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
  personalization: boolean;
  functional: boolean;
  timestamp: string;
  userId?: string;
  version: string;
}

export interface CrossPlatformSession {
  sessionId: string;
  userId?: string;
  platform: string;
  deviceInfo: DeviceInfo;
  startTime: string;
  endTime?: string;
  duration?: number;
  events: AnalyticsEvent[];
  conversionEvents: AnalyticsEvent[];
  performanceMetrics: AppPerformance;
  bookingFlow?: {
    step: number;
    totalSteps: number;
    serviceType?: string;
    abandonedAt?: string;
    completedAt?: string;
  };
  location?: {
    country: string;
    city: string;
    timezone: string;
    coordinates?: { lat: number; lng: number };
  };
  consent: AnalyticsConsent;
  quality: {
    score: number; // 0-100
    factors: string[];
    issues: string[];
  };
}

export interface UnifiedAnalyticsEvent {
  // Core Event Properties
  id: string;
  name: string;
  category: 'user_action' | 'booking' | 'performance' | 'business' | 'engagement' | 'error';
  action: string;
  label?: string;
  value?: number;

  // Cross-Platform Properties
  platform: 'web' | 'ios' | 'android';
  sessionId: string;
  userId?: string;
  timestamp: string;
  timezone: string;

  // Device and Context
  deviceInfo: DeviceInfo;
  appInfo: {
    version: string;
    build: string;
    environment: 'development' | 'staging' | 'production';
  };

  // Location (if consented)
  location?: {
    country: string;
    city: string;
    region?: string;
    coordinates?: { lat: number; lng: number };
  };

  // Business Properties
  revenue?: {
    amount: number;
    currency: string;
    orderId?: string;
    paymentMethod?: string;
  };
  conversion?: {
    type: string;
    step?: number;
    funnel?: string;
    value?: number;
  };

  // Performance Properties
  performance?: {
    loadTime?: number;
    renderTime?: number;
    apiTime?: number;
    memoryUsage?: number;
    batteryLevel?: number;
    networkType?: string;
  };

  // Custom Properties
  properties: Record<string, any>;
  dimensions: Record<string, string>;
  metrics: Record<string, number>;

  // Privacy and Consent
  consent: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };

  // Quality Flags
  quality: {
    isValid: boolean;
    confidence: number; // 0-1
    issues: string[];
    processedAt?: string;
  };
}

export interface AnalyticsBatch {
  id: string;
  platform: string;
  events: UnifiedAnalyticsEvent[];
  metadata: {
    batchSize: number;
    compression: string;
    checksum: string;
    encryptionEnabled: boolean;
  };
  sent: boolean;
  sentAt?: string;
  retryCount: number;
  lastRetryAt?: string;
  error?: string;
}

export interface AnalyticsStorage {
  // Local storage interface for offline analytics
  storeEvent(event: UnifiedAnalyticsEvent): Promise<void>;
  storeBatch(batch: AnalyticsBatch): Promise<void>;
  getPendingEvents(): Promise<UnifiedAnalyticsEvent[]>;
  getPendingBatches(): Promise<AnalyticsBatch[]>;
  markBatchAsSent(batchId: string): Promise<void>;
  cleanupOldEvents(olderThanDays: number): Promise<void>;
  getEventCount(): Promise<number>;
  getStorageUsage(): Promise<{ used: number; available: number; percentage: number }>;
}

export interface AnalyticsTransport {
  // Network transport for sending analytics
  sendBatch(batch: AnalyticsBatch): Promise<{ success: boolean; error?: string }>;
  sendEvent(event: UnifiedAnalyticsEvent): Promise<{ success: boolean; error?: string }>;
  validateConnection(): Promise<boolean>;
  getConnectionType(): Promise<string>;
  getConnectionSpeed(): Promise<number>;
}

export interface AnalyticsProcessor {
  // Event processing and transformation
  validateEvent(event: UnifiedAnalyticsEvent): boolean;
  enrichEvent(event: UnifiedAnalyticsEvent): Promise<UnifiedAnalyticsEvent>;
  anonymizeEvent(event: UnifiedAnalyticsEvent): UnifiedAnalyticsEvent;
  aggregateEvents(events: UnifiedAnalyticsEvent[]): Promise<UnifiedAnalyticsEvent[]>;
  filterEvents(events: UnifiedAnalyticsEvent[], filters: any): UnifiedAnalyticsEvent[];
  transformForPlatform(events: UnifiedAnalyticsEvent[], platform: string): any[];
}

export interface ConsentManager {
  // Privacy consent management
  getCurrentConsent(): Promise<AnalyticsConsent | null>;
  updateConsent(consent: Partial<AnalyticsConsent>): Promise<void>;
  requestConsent(): Promise<AnalyticsConsent>;
  hasConsentForCategory(category: string): boolean;
  revokeConsent(): Promise<void>;
  exportUserData(userId: string): Promise<any>;
  deleteUserData(userId: string): Promise<void>;
}

export interface PerformanceMonitor {
  // Performance monitoring and metrics collection
  startPerformanceMonitoring(): void;
  stopPerformanceMonitoring(): void;
  recordMetric(name: string, value: number, unit?: string): void;
  recordCustomTiming(name: string, duration: number): void;
  recordError(error: Error, context?: any): void;
  recordCrash(crashReport: any): void;
  getMetrics(): Promise<AppPerformance>;
  generatePerformanceReport(): Promise<any>;
}

export interface CrossPlatformAnalytics {
  // Core Analytics Interface
  initialize(config: MobileAnalyticsConfig): Promise<void>;
  trackEvent(event: Omit<UnifiedAnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void>;
  trackPageView(page: string, title?: string, additional?: any): Promise<void>;
  trackUserAction(action: string, properties?: any): Promise<void>;
  trackBookingEvent(event: BookingAnalytics): Promise<void>;
  trackUserBehavior(behavior: UserBehaviorAnalytics): Promise<void>;

  // Session Management
  startSession(): Promise<string>;
  endSession(): Promise<void>;
  getCurrentSession(): Promise<CrossPlatformSession | null>;

  // User Identification
  identifyUser(userId: string, traits?: any): Promise<void>;
  anonymizeUser(): Promise<void>;

  // Privacy and Consent
  updateConsent(consent: Partial<AnalyticsConsent>): Promise<void>;
  hasConsent(): boolean;

  // Batching and Transmission
  flush(): Promise<void>;
  getPendingEventCount(): Promise<number>;

  // Performance
  getPerformanceMetrics(): Promise<AppPerformance>;

  // Real-time
  enableRealTime(enabled: boolean): void;

  // Configuration
  updateConfig(config: Partial<MobileAnalyticsConfig>): Promise<void>;
  getConfig(): MobileAnalyticsConfig;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
}

// Global analytics instance
let globalAnalytics: CrossPlatformAnalytics | null = null;

export function getGlobalAnalytics(): CrossPlatformAnalytics | null {
  return globalAnalytics;
}

export function setGlobalAnalytics(analytics: CrossPlatformAnalytics): void {
  globalAnalytics = analytics;
}

// Platform detection utilities
export function getPlatform(): 'web' | 'ios' | 'android' {
  if (typeof window === 'undefined') {
    return 'web'; // Default for SSR
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }

  // Web detection
  return 'web';
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for React Native bridge
  return !!(window as any).ReactNativeWebView ||
         !!(window as any).webkit?.messageHandlers?.ReactNativeWebView;
}

export function getAppVersion(): string {
  if (typeof window === 'undefined') {
    return '1.0.0';
  }

  // Try to get version from various sources
  return (window as any).appVersion ||
         (window as any).__APP_VERSION__ ||
         process.env.REACT_APP_VERSION ||
         '1.0.0';
}

// Default configuration
export const defaultAnalyticsConfig: Partial<MobileAnalyticsConfig> = {
  privacy: {
    enableGDPR: true,
    enableCCPA: false,
    cookieConsentRequired: true,
    dataRetentionDays: 365,
    anonymizeIp: true,
    enableConsentManagement: true,
  },
  performance: {
    enableCoreWebVitals: true,
    enableCrashReporting: true,
    enableNetworkMonitoring: true,
    enableBatteryMonitoring: false,
    sampleRate: 0.1,
  },
  business: {
    enableRevenueTracking: true,
    enableConversionTracking: true,
    enableUserLifetimeValue: true,
    enablePredictiveAnalytics: true,
  },
  realtime: {
    enableLiveDashboard: true,
    enableLiveEvents: true,
    enableLivePerformance: false,
    updateInterval: 30000, // 30 seconds
  },
};