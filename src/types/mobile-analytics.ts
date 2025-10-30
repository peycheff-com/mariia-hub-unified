// Mobile Analytics Types for Cross-Platform Beauty/Fitness Booking System

export interface DeviceInfo {
  // Basic Device Information
  platform: 'web' | 'ios' | 'android';
  deviceId: string;
  model?: string;
  manufacturer?: string;
  osVersion: string;
  appVersion: string;
  buildNumber?: string;

  // Screen and Display
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  colorDepth: number;

  // Memory and Performance
  deviceMemory?: number; // GB
  hardwareConcurrency?: number; // CPU cores
  maxTouchPoints: number;

  // Network
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'none';
  effectiveConnectionType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData: boolean;

  // Browser (Web only)
  browser?: {
    name: string;
    version: string;
    engine: string;
  };

  // App (Native only)
  app?: {
    bundleId: string;
    installDate: string;
    updateDate: string;
    isFirstLaunch: boolean;
    launchCount: number;
  };

  // Capabilities
  capabilities: {
    webgl: boolean;
    webgl2: boolean;
    webp: boolean;
    avif: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    offline: boolean;
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    vibration: boolean;
    bluetooth: boolean;
    nfc: boolean;
  };

  // Security
  security: {
    https: boolean;
    secureContext: boolean;
    userAgentData?: any;
    permissions: Record<string, 'granted' | 'denied' | 'prompt'>;
  };
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
  sessionId: string;
  userId?: string;
  platform: string;
  properties: Record<string, any>;
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  platform: string;
  deviceInfo: DeviceInfo;
  events: AnalyticsEvent[];
  pageViews: number;
  conversions: number;
  revenue?: number;
  bounced: boolean;
  entryPage?: string;
  exitPage?: string;
  location?: LocationInfo;
  quality: SessionQuality;
}

export interface LocationInfo {
  country: string;
  countryIso2: string;
  countryIso3: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone: string;
  timezoneOffset: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  continent?: string;
  currency?: string;
  language?: string;
}

export interface SessionQuality {
  score: number; // 0-100
  factors: {
    engagement: number;
    navigation: number;
    performance: number;
    errors: number;
    duration: number;
  };
  issues: string[];
  strengths: string[];
}

export interface AppPerformance {
  // Core Web Vitals (Web)
  coreWebVitals?: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };

  // Mobile App Performance
  appPerformance?: {
    launchTime: number; // App launch time
    firstRenderTime: number; // Time to first meaningful render
    jsBundleLoadTime: number; // JavaScript bundle loading time
    nativeModuleLoadTime: number; // Native modules initialization time
    app responsiveness: number; // UI responsiveness score
  };

  // Resource Performance
  resources?: {
    totalResources: number;
    totalSize: number; // bytes
    cachedResources: number;
    failedResources: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size: number;
    }>;
  };

  // Network Performance
  network?: {
    apiRequests: number;
    apiErrors: number;
    averageResponseTime: number;
    slowRequests: Array<{
      url: string;
      duration: number;
      method: string;
      status?: number;
    }>;
    dataTransferred: number; // bytes
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };

  // Memory and CPU
  system?: {
    memoryUsage: number; // MB
    memoryPressure: 'low' | 'medium' | 'high' | 'critical';
    cpuUsage: number; // percentage
    batteryLevel?: number; // percentage
    thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  };

  // Error Tracking
  errors?: {
    javascriptErrors: number;
    networkErrors: number;
    promiseRejections: number;
    unhandledErrors: Array<{
      message: string;
      stack: string;
      timestamp: string;
      userAgent: string;
      url: string;
    }>;
  };

  // User Experience
  userExperience?: {
    longTasks: number; // Tasks > 50ms
    totalBlockingTime: number;
    firstMeaningfulPaint?: number;
    speedIndex?: number;
    interactionToNextPaint?: number;
  };

  // Timestamp
  timestamp: string;
  sampleRate: number;
}

export interface BookingAnalytics {
  // Booking Funnel Events
  funnelEvent: 'booking_started' | 'service_selected' | 'time_selected' | 'details_filled' | 'payment_started' | 'booking_completed' | 'booking_cancelled' | 'booking_abandoned';
  funnelStep: number;
  totalSteps: number;

  // Service Information
  serviceInfo: {
    serviceId: string;
    serviceName: string;
    serviceType: 'beauty' | 'fitness' | 'lifestyle';
    category: string;
    price: number;
    currency: string;
    duration: number; // minutes
  };

  // Booking Details
  bookingDetails?: {
    bookingId?: string;
    appointmentTime: string;
    duration: number;
    totalAmount: number;
    currency: string;
    paymentMethod?: string;
    depositAmount?: number;
    staffId?: string;
    staffName?: string;
  };

  // User Journey Context
  context: {
    source: string; // Where user came from
    medium: string; // How they arrived
    campaign?: string;
    previousBookingCount: number;
    timeSinceLastBooking?: number; // days
    isReturningCustomer: boolean;
    customerSegment?: string;
  };

  // Behavioral Data
  behavior: {
    timeSpentOnStep: number; // seconds
    hesitations: number; // Number of times user went back
    formErrors: number;
    abandonedReason?: string;
    completionTime?: number; // Total time to complete booking
  };

  // Platform Specific
  platform: {
    type: 'web' | 'ios' | 'android';
    deviceCategory: 'mobile' | 'tablet' | 'desktop';
    appVersion?: string;
    browser?: string;
    osVersion?: string;
  };

  // Location Context
  location?: {
    country: string;
    city: string;
    timezone: string;
    distanceToVenue?: number; // km
  };

  // Revenue Impact
  revenue?: {
    bookingValue: number;
    projectedLifetimeValue: number;
    acquisitionCost?: number;
    profitMargin?: number;
  };
}

export interface UserBehaviorAnalytics {
  // Service Preferences
  servicePreferences: {
    preferredServiceType: 'beauty' | 'fitness' | 'lifestyle';
    preferredCategories: string[];
    preferredServices: Array<{
      serviceId: string;
      serviceName: string;
      viewCount: number;
      bookingCount: number;
      lastInteraction: string;
    }>;
    priceSensitivity: 'budget' | 'mid_range' | 'premium' | 'luxury';
    preferredTimeSlots: string[];
  };

  // Booking Patterns
  bookingPatterns: {
    averageBookingFrequency: number; // bookings per month
    preferredBookingDays: string[]; // ['monday', 'wednesday', etc.]
    preferredBookingTimes: string[]; // ['morning', 'afternoon', etc.]
    seasonalPreferences: Record<string, number>; // month -> booking count
    advanceBookingDays: number; // average days in advance
    cancellationRate: number; // percentage
    noShowRate: number; // percentage
  };

  // Content Engagement
  contentEngagement: {
    pagesViewed: number;
    timeSpentOnSite: number; // total minutes
    contentCategoriesViewed: string[];
    downloads: number;
    shares: number;
    bookmarks: number;
    searchesPerformed: number;
    searchTerms: Array<{
      term: string;
      frequency: number;
      resultsFound: boolean;
    }>;
  };

  // Mobile App Behavior
  appBehavior?: {
    sessionFrequency: number; // sessions per week
    averageSessionDuration: number; // minutes
    featuresUsed: string[];
    pushNotificationOpenRate: number;
    offlineUsagePercentage: number;
    crashCount: number;
    lastCrashDate?: string;
  };

  // Demographics and Profile
  demographics?: {
    ageGroup?: string;
    gender?: string;
    language: string;
    location: LocationInfo;
    devicePreferences: {
      preferredPlatform: 'web' | 'ios' | 'android';
      deviceTypes: string[];
      browsersUsed: string[];
    };
  };

  // Customer Journey
  customerJourney: {
    acquisitionSource: string;
    acquisitionDate: string;
    firstBookingDate?: string;
    totalBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    loyaltyScore: number; // 0-100
    churnRisk: number; // 0-1
    nextPredictedBooking?: string;
    lifetimeValue: number;
  };

  // Behavioral Segments
  segments: {
    engagementSegment: 'new' | 'active' | 'at_risk' | 'churned';
    valueSegment: 'low' | 'medium' | 'high' | 'vip';
    behavioralSegment: 'bargain_hunter' | 'quality_seeker' | 'variety_seeker' | 'loyal_customer';
    demographicSegment?: string;
    seasonalSegment?: string;
  };

  // Predictions
  predictions: {
    likelihoodToBook: number; // 0-1
    likelyNextService?: string;
    likelyTimeframe?: string; // days
    priceSensitivityScore: number; // 0-1
    preferredCommunicationChannel: string;
    riskOfChurn: number; // 0-1
  };
}

export interface MobileSpecificMetrics {
  // App Installation and Acquisition
  acquisition: {
    installSource: string;
    installDate: string;
    campaign?: string;
    adGroup?: string;
    keyword?: string;
    costPerInstall?: number;
    organicInstall: boolean;
    referralSource?: string;
  };

  // App Performance
  performance: {
    launchTime: number; // milliseconds
    crashFreeUsers: number; // percentage
    crashFreeSessions: number; // percentage
    appNotRespondingRate: number; // percentage
    memoryUsage: number; // average MB
    batteryUsage: number; // percentage per session
    networkLatency: number; // average ms
    apiResponseTime: number; // average ms
  };

  // User Engagement
  engagement: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionLength: number; // average minutes
    sessionFrequency: number; // sessions per user per week
    screenViewsPerSession: number;
    retentionRate: {
      day1: number;
      day7: number;
      day30: number;
    };
    churnRate: number; // percentage
  };

  // Feature Adoption
  featureAdoption: {
    totalFeatures: number;
    adoptedFeatures: number;
    adoptionRate: number; // percentage
    featureUsage: Record<string, {
      users: number;
      usageCount: number;
      averageUsage: number;
    }>;
    powerUserFeatures: string[];
  };

  // Push Notifications
  pushNotifications: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    conversionRate: number; // percentage
    optOutRate: number; // percentage
    averageTimeToOpen: number; // minutes
  };

  // In-App Purchases (if applicable)
  inAppPurchases?: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
    conversionRate: number; // percentage
    topProducts: Array<{
      productId: string;
      productName: string;
      revenue: number;
      units: number;
    }>;
  };

  // Quality Metrics
  quality: {
    anrRate: number; // Application Not Responding
    exceptionRate: number; // crashes per 1000 sessions
    userSatisfaction: number; // 1-5 rating
    appStoreRating: number;
    reviewsCount: number;
    positiveSentiment: number; // percentage
  };
}

export interface BusinessIntelligenceMetrics {
  // Revenue Analytics
  revenue: {
    totalRevenue: number;
    revenueByServiceType: Record<string, number>;
    revenueByCategory: Record<string, number>;
    averageBookingValue: number;
    revenueGrowth: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
    recurringRevenue: number;
    oneTimeRevenue: number;
  };

  // Customer Analytics
  customers: {
    totalCustomers: number;
    newCustomers: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      thisYear: number;
    };
    returningCustomers: number;
    customerRetentionRate: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    averageRevenuePerCustomer: number;
  };

  // Service Performance
  services: {
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      bookings: number;
      profitMargin: number;
      rating: number;
    }>;
    serviceDemand: Record<string, number>;
    serviceUtilization: Record<string, number>;
    seasonalTrends: Record<string, number[]>;
  };

  // Operational Efficiency
  operations: {
    bookingCompletionRate: number;
    cancellationRate: number;
    noShowRate: number;
    averageBookingTime: number; // minutes
    staffUtilization: number;
    resourceUtilization: Record<string, number>;
  };

  // Market Intelligence
  market: {
    marketShare: number;
    competitorCount: number;
    averagePricing: number;
    pricePosition: 'premium' | 'competitive' | 'budget';
    marketTrends: Array<{
      trend: string;
      impact: number;
      confidence: number;
    }>;
  };

  // Predictive Analytics
  predictions: {
    revenueForecast: Record<string, number>; // period -> amount
    bookingVolumeForecast: Record<string, number>;
    churnPrediction: number; // percentage at risk
    demandForecast: Record<string, number>; // service -> demand
    resourceOptimization: Record<string, any>;
  };
}

export interface AnalyticsDashboard {
  // Executive Overview
  overview: {
    totalRevenue: number;
    totalBookings: number;
    activeUsers: number;
    conversionRate: number;
    satisfactionScore: number;
    growthRate: number;
  };

  // Real-time Metrics
  realtime: {
    activeUsers: number;
    currentBookings: number;
    pendingPayments: number;
    serverLoad: number;
    responseTime: number;
    errorRate: number;
  };

  // Performance Trends
  trends: {
    revenue: Array<{ date: string; value: number; target?: number }>;
    bookings: Array<{ date: string; value: number; target?: number }>;
    users: Array<{ date: string; value: number; target?: number }>;
    satisfaction: Array<{ date: string; value: number; target?: number }>;
  };

  // Mobile App Metrics
  mobile: {
    downloads: number;
    activeUsers: number;
    crashes: number;
    rating: number;
    sessionLength: number;
    retentionRate: number;
  };

  // Alerts and Notifications
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
}

export interface AnalyticsExport {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
  filters: Record<string, any>;
  includeCharts: boolean;
  includeRawData: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Error and Exception Types
export interface AnalyticsError {
  id: string;
  type: 'validation' | 'network' | 'processing' | 'storage' | 'consent';
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  platform: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ValidationError extends AnalyticsError {
  field: string;
  value: any;
  constraint: string;
}

export interface NetworkError extends AnalyticsError {
  url: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
}

export interface ProcessingError extends AnalyticsError {
  stage: string;
  inputData: any;
  outputData?: any;
}