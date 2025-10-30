import {
  ApiClientConfig,
  AuthenticationConfig,
  RateLimitConfig,
  CacheConfig,
  LoggingConfig
} from './api';
import { WebSocketOptions } from './websockets';
import { Currency, Language, TimeZone } from './common';

/**
 * SDK configuration interface
 */
export interface MariiaHubSDKConfig {
  /**
   * API configuration
   */
  api: ApiClientConfig;

  /**
   * WebSocket configuration
   */
  websockets?: WebSocketOptions;

  /**
   * SDK-specific configuration
   */
  sdk?: SDKConfig;

  /**
   * Regional configuration (Polish market focus)
   */
  regional?: RegionalConfig;

  /**
   * Feature flags
   */
  features?: FeatureFlags;

  /**
   * Environment configuration
   */
  environment?: EnvironmentConfig;
}

/**
 * SDK-specific configuration
 */
export interface SDKConfig {
  /**
   * SDK version
   */
  version: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Application name
   */
  applicationName?: string;

  /**
   * Application version
   */
  applicationVersion?: string;

  /**
   * Timeout for SDK operations (in milliseconds)
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed operations
   */
  maxRetries?: number;

  /**
   * Retry delay strategy
   */
  retryStrategy?: 'fixed' | 'exponential' | 'linear';

  /**
   * Base delay for retries (in milliseconds)
   */
  retryDelay?: number;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Enable metrics collection
   */
  enableMetrics?: boolean;

  /**
   * Enable analytics tracking
   */
  enableAnalytics?: boolean;

  /**
   * Custom headers for all requests
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Request/response interceptors
   */
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };

  /**
   * Error handling configuration
   */
  errorHandling?: ErrorHandlingConfig;

  /**
   * Event handlers
   */
  eventHandlers?: EventHandlerConfig;
}

/**
 * Regional configuration (Polish market focus)
 */
export interface RegionalConfig {
  /**
   * Default language
   */
  language: Language;

  /**
   * Default currency
   */
  currency: Currency;

  /**
   * Default time zone
   */
  timeZone: TimeZone;

  /**
   * Country code
   */
  countryCode: string;

  /**
   * Locale configuration
   */
  locale: LocaleConfig;

  /**
   * Localized payment methods
   */
  paymentMethods: RegionalPaymentConfig;

  /**
   * Localized business rules
   */
  businessRules: RegionalBusinessRules;

  /**
   * Compliance configuration
   */
  compliance: RegionalComplianceConfig;

  /**
   * Holiday and working days configuration
   */
  holidays: RegionalHolidayConfig;
}

/**
 * Locale configuration
 */
export interface LocaleConfig {
  /**
   * Date format
   */
  dateFormat: string;

  /**
   * Time format
   */
  timeFormat: '12h' | '24h';

  /**
   * Number format
   */
  numberFormat: {
    decimalSeparator: string;
    thousandsSeparator: string;
  };

  /**
   * Currency format
   */
  currencyFormat: {
    symbol: string;
    symbolPosition: 'before' | 'after';
    decimalPlaces: number;
  };

  /**
   * First day of week
   */
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday

  /**
   * Weekend days
   */
  weekendDays: number[];

  /**
   * Working days
   */
  workingDays: number[];

  /**
   * Measurement units
   */
  measurementUnits: 'metric' | 'imperial';
}

/**
 * Regional payment configuration
 */
export interface RegionalPaymentConfig {
  /**
   * Supported payment methods for this region
   */
  supportedMethods: string[];

  /**
   * Default payment method
   */
  defaultMethod?: string;

  /**
   * Currency conversion settings
   */
  currencyConversion: {
    autoConvert: boolean;
    preferredCurrency: Currency;
    conversionProvider?: string;
  };

  /**
   * Local payment gateways
   */
  localGateways: string[];

  /**
   * VAT configuration
   */
  vat: {
    included: boolean;
    defaultRate: number;
    showTax: boolean;
  };

  /**
   * Invoice requirements
   */
  invoiceRequirements: {
    requireInvoice: boolean;
    companyInvoicesOnly: boolean;
    electronicInvoices: boolean;
    proformaInvoices: boolean;
  };
}

/**
 * Regional business rules
 */
export interface RegionalBusinessRules {
  /**
   * Working hours configuration
   */
  workingHours: {
    standardBusinessHours: boolean;
    lunchBreakRequired: boolean;
    weekendWorkAllowed: boolean;
    holidayWorkAllowed: boolean;
  };

  /**
   * Cancellation policies
   */
  cancellationPolicies: {
    minimumNoticePeriod: number; // in hours
    cancellationFeePolicy: string;
    refundPolicy: string;
  };

  /**
   * Booking rules
   */
  bookingRules: {
    maximumAdvanceBooking: number; // in days
    minimumAdvanceBooking: number; // in hours
    groupBookingMaximumSize: number;
    depositRequired: boolean;
  };

  /**
   * Payment rules
   */
  paymentRules: {
    paymentDue: 'immediate' | 'on_arrival' | 'after_service';
    partialPaymentAllowed: boolean;
    installmentPlans: boolean;
    minimumPaymentAmount: number;
  };

  /**
   * Legal requirements
   */
  legalRequirements: {
    gdprCompliance: boolean;
    consumerRights: boolean;
    termsOfService: boolean;
    privacyPolicy: boolean;
  };
}

/**
 * Regional compliance configuration
 */
export interface RegionalComplianceConfig {
  /**
   * GDPR compliance
   */
  gdpr: {
    enabled: boolean;
    consentRequired: boolean;
    dataRetentionPeriod: number; // in days
    rightToBeForgotten: boolean;
    dataProcessingAgreement: boolean;
  };

  /**
   * Local regulations
   */
  localRegulations: {
    businessRegistration: boolean;
    taxIdentification: boolean;
    professionalLicenses: boolean;
    healthAndSafety: boolean;
  };

  /**
   * Financial compliance
   */
  financialCompliance: {
    amlKycRequired: boolean;
    sourceOfFundsVerification: boolean;
    transactionLimits: boolean;
    reportingRequirements: boolean;
  };

  /**
   * Industry-specific compliance
   */
  industryCompliance: {
    beautyIndustryLicense: boolean;
    fitnessIndustryCertification: boolean;
    insuranceRequirements: boolean;
    healthDepartmentCompliance: boolean;
  };
}

/**
 * Regional holiday configuration
 */
export interface RegionalHolidayConfig {
  /**
   * Public holidays
   */
  publicHolidays: Holiday[];

  /**
   * Working days adjustments
   */
  workingDayAdjustments: WorkingDayAdjustment[];

  /**
   * Special business days
   */
  specialBusinessDays: SpecialBusinessDay[];

  /**
   * Seasonal adjustments
   */
  seasonalAdjustments: SeasonalAdjustment[];
}

/**
 * Holiday
 */
export interface Holiday {
  date: string;
  name: string;
  namePl: string;
  type: 'public' | 'bank' | 'school';
  isWorkingDay: boolean;
  requiresSpecialPricing: boolean;
}

/**
 * Working day adjustment
 */
export interface WorkingDayAdjustment {
  date: string;
  type: 'makeup_day' | 'additional_day_off';
  originalDay: number;
  newDay: number;
  reason: string;
  reasonPl: string;
}

/**
 * Special business day
 */
export interface SpecialBusinessDay {
  date: string;
  name: string;
  namePl: string;
  businessHours: {
    open: string;
    close: string;
    breaks?: { start: string; end: string }[];
  };
  priceAdjustment?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  specialServices?: string[];
}

/**
 * Seasonal adjustment
 */
export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  startDate: string;
  endDate: string;
  adjustments: {
    pricing?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    availability?: {
      increaseCapacity: boolean;
      capacityPercentage: number;
    };
    operatingHours?: {
      extendedHours: boolean;
      newOpenTime?: string;
      newCloseTime?: string;
    };
    services?: {
      additionalServices: string[];
      seasonalServices: string[];
      discontinuedServices: string[];
    };
  };
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  /**
   * Polish market features
   */
  polishMarket: {
    enabled: boolean;
    polishLanguage: boolean;
    polishPaymentMethods: boolean;
    polishInvoicing: boolean;
    polishBusinessVerification: boolean;
    polishHolidays: boolean;
    polishBusinessHours: boolean;
  };

  /**
   * Real-time features
   */
  realTime: {
    enabled: boolean;
    websockets: boolean;
    liveAvailability: boolean;
    instantNotifications: boolean;
    realTimeBooking: boolean;
  };

  /**
   * Advanced features
   */
  advanced: {
    groupBookings: boolean;
    waitlistManagement: boolean;
    loyaltyProgram: boolean;
    referralProgram: boolean;
    advancedAnalytics: boolean;
    aiRecommendations: boolean;
  };

  /**
   * Integration features
   */
  integrations: {
    booksySync: boolean;
    googleCalendar: boolean;
    outlookCalendar: boolean;
    emailMarketing: boolean;
    socialMedia: boolean;
    paymentGateways: boolean;
  };

  /**
   * Beta features
   */
  beta: {
    videoConsultations: boolean;
    virtualTours: boolean;
    augmentedReality: boolean;
    mobileApp: boolean;
    apiV2: boolean;
  };

  /**
   * Experimental features
   */
  experimental: {
    aiBookingAssistant: boolean;
    predictiveScheduling: boolean;
    dynamicPricing: boolean;
    voiceBooking: boolean;
  };
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /**
   * Environment name
   */
  name: 'development' | 'staging' | 'production';

  /**
   * API environment
   */
  apiEnvironment: 'sandbox' | 'production';

  /**
   * Debug mode
   */
  debug: boolean;

  /**
   * Mock data
   */
  mockData: boolean;

  /**
   * Logging level
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Analytics tracking
   */
  analytics: {
    enabled: boolean;
    trackingId?: string;
    debugMode: boolean;
  };

  /**
   * Error reporting
   */
  errorReporting: {
    enabled: boolean;
    dsn?: string;
    environment?: string;
    release?: string;
  };

  /**
   * Performance monitoring
   */
  performanceMonitoring: {
    enabled: boolean;
    sampleRate: number;
    trackResources: boolean;
    trackLongTasks: boolean;
  };

  /**
   * Feature flags service
   */
  featureFlags: {
    provider: 'local' | 'launchdarkly' | 'optimizely' | 'custom';
    apiKey?: string;
    environment?: string;
  };

  /**
   * Cache configuration
   */
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'memory' | 'redis' | 'custom';
    redis?: {
      url: string;
      password?: string;
      db?: number;
    };
  };
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  /**
   * Global error handler
   */
  globalHandler?: (error: Error) => void;

  /**
   * Retry configuration for specific error types
   */
  retryConfig?: {
    networkErrors: number;
    timeoutErrors: number;
    serverErrors: number;
    rateLimitErrors: number;
  };

  /**
   * Error classification
   */
  classifyErrors: boolean;

  /**
   * Error reporting
   */
  reportErrors: boolean;

  /**
   * User-friendly error messages
   */
  userFriendlyMessages: boolean;

  /**
   * Error logging
   */
  logErrors: boolean;
}

/**
 * Event handler configuration
 */
export interface EventHandlerConfig {
  /**
   * Connection events
   */
  connection?: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onReconnect?: () => void;
    onError?: (error: Error) => void;
  };

  /**
   * Authentication events
   */
  authentication?: {
    onLogin?: (user: any) => void;
    onLogout?: () => void;
    onTokenRefresh?: (tokens: any) => void;
    onAuthError?: (error: any) => void;
  };

  /**
   * Booking events
   */
  booking?: {
    onBookingCreated?: (booking: any) => void;
    onBookingUpdated?: (booking: any) => void;
    onBookingCancelled?: (booking: any) => void;
    onBookingConfirmed?: (booking: any) => void;
  };

  /**
   * Payment events
   */
  payment?: {
    onPaymentInitiated?: (payment: any) => void;
    onPaymentCompleted?: (payment: any) => void;
    onPaymentFailed?: (payment: any) => void;
    onPaymentRefunded?: (payment: any) => void;
  };

  /**
   * Notification events
   */
  notification?: {
    onNotificationReceived?: (notification: any) => void;
    onNotificationRead?: (notification: any) => void;
    onNotificationDismissed?: (notification: any) => void;
  };

  /**
   * Custom events
   */
  custom?: Record<string, (data: any) => void>;
}

/**
 * Request interceptor
 */
export interface RequestInterceptor {
  /**
   * Interceptor function
   */
  fn: (config: any) => any;

  /**
   * Error handler
   */
  error?: (error: any) => any;

  /**
   * Run order (lower runs first)
   */
  order?: number;
}

/**
 * Response interceptor
 */
export interface ResponseInterceptor {
  /**
   * Success handler
   */
  success?: (response: any) => any;

  /**
   * Error handler
   */
  error?: (error: any) => any;

  /**
   * Run order (lower runs first)
   */
  order?: number;
}

/**
 * Default configuration factory
 */
export interface DefaultConfigFactory {
  /**
   * Create default configuration for development
   */
  createDevelopmentConfig(): MariiaHubSDKConfig;

  /**
   * Create default configuration for staging
   */
  createStagingConfig(): MariiaHubSDKConfig;

  /**
   * Create default configuration for production
   */
  createProductionConfig(): MariiaHubSDKConfig;

  /**
   * Create configuration for Polish market
   */
  createPolishMarketConfig(options?: PolishMarketOptions): MariiaHubSDKConfig;

  /**
   * Create configuration for specific use case
   */
  createUseCaseConfig(useCase: UseCase): MariiaHubSDKConfig;
}

/**
 * Polish market options
 */
export interface PolishMarketOptions {
  language?: Language;
  currency?: Currency;
  enablePolishPaymentMethods?: boolean;
  enablePolishInvoicing?: boolean;
  enablePolishVerification?: boolean;
  businessAccount?: boolean;
}

/**
 * Use case types
 */
export type UseCase =
  | 'customer_booking'
  | 'business_management'
  | 'admin_dashboard'
  | 'mobile_app'
  | 'web_integration'
  | 'api_client'
  | 'analytics_platform'
  | 'payment_gateway';