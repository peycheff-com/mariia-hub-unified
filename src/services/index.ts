// Core API Services
export { ApiService } from './api';
export type { ApiError, PaginationParams, PaginatedResponse } from './api/base.service';

// API Gateway
export { apiGateway, ApiGateway } from './api-gateway';

// Enhanced Booking Service
export { enhancedBookingService, EnhancedBookingService } from './enhanced-booking.service';
export type {
  CreateBookingRequest,
  BookingResponse,
  AvailabilityRequest,
  AvailabilityResponse
} from './enhanced-booking.service';

// Domain Services
export { bookingDomainService, BookingDomainService } from './bookingDomainService';
export { groupBookingService, GroupBookingService } from './groupBooking.service';
export { waitlistService, WaitlistService } from './waitlist.service';
export { paymentSystemService, PaymentSystemService } from './paymentSystemService';
export { loyaltyProgramService, LoyaltyProgramService } from './loyaltyProgramService';

// Specialized Services
export { dynamicPricingService } from './dynamicPricing.service';
export { rescheduleService } from './reschedule.service';
export { cancellationService } from './cancellation.service';
export { complianceService, ComplianceService } from './ComplianceService';
export { cacheService } from './cacheService';
export { featureFlagService } from './featureFlagService';

// Feature Flags System
export { experimentService } from './experimentService';
export { featureFlagRealtimeService } from './featureFlagRealtimeService';
export { featureFlagAuditService } from './featureFlagAuditService';
export type {
  FeatureFlag,
  UserFlagAssignment,
  FeatureFlagAuditLog,
  ExperimentAssignment,
  ExperimentEvent,
  TargetSegments,
  ExperimentConfig,
  FlagEvaluationContext,
  FlagEvaluationResult,
  ExperimentStats,
  VariantStats,
  ConfidenceInterval,
  FeatureFlagConfig,
  FlagUpdateEvent,
  ExperimentUpdateEvent,
  ExperimentFormData,
  FeatureFlagFormData,
  FeatureFlagSDK,
  ExperimentSDK
} from '../types/featureFlags';

// Extended Services
export { servicesService } from './services.service';
export { booksySyncService } from './booksy-sync.service';
export { batchService } from './batchService';

// Monitoring & Reliability
export { monitoringService } from './monitoringService';
export { realtimeMonitoringService } from './realtimeMonitoringService';
export { reliabilityService } from './reliability-service';
export { cqrsService } from './cqrsService';

// Location & Localization
export { LocationService } from './LocationService';
export { LocationServiceExtended } from './LocationServiceExtended';
export { LocalizationService } from './LocalizationService';
export { PricingService } from './PricingService';

// Communication Services
export { websocketService } from './websocketService';
export { offlineBookingService } from './offline-booking.service';

// Authentication
export { authService, AuthService } from './auth.service';

// API V1 Routes
export { default as bookingRoutes } from './api/v1/booking-routes';
export { default as paymentRoutes } from './api/v1/payment-routes';
export { default as adminRoutes } from './api/v1/admin-routes';
export { default as servicesRoutes } from './api/v1/services-routes';
export { default as usersRoutes } from './api/v1/users-routes';
export { default as v1Routes } from './api/v1';

// Middleware
export {
  ValidationMiddleware,
  CommonSchemas,
  RateLimitMiddleware,
  RateLimitConfigs,
  KeyGenerators,
  ErrorMiddleware,
  AuthMiddleware,
  Roles,
  Permissions,
  reliabilityMiddleware,
  fullReliabilityMiddleware,
  productionReliabilityMiddleware,
  developmentReliabilityMiddleware,
  minimalReliabilityMiddleware,
  registerCustomErrorHandler
} from './middleware';

// Type exports
export type {
  ValidationSchema,
  ValidationError,
  RateLimitConfig,
  RateLimitInfo,
  AuthMiddlewareOptions,
  AuthenticatedUser,
  ApiKeyInfo
} from './middleware';

// Legacy exports for backward compatibility
export * from './api/bookings';
export * from './api/services';

// Utility exports
export const Services = {
  // Core services
  api: ApiService,
  booking: enhancedBookingService,
  bookingDomain: bookingDomainService,
  groupBooking: groupBookingService,
  waitlist: waitlistService,
  payment: paymentSystemService,
  loyalty: loyaltyProgramService,

  // Extended services
  dynamicPricing: dynamicPricingService,
  reschedule: rescheduleService,
  cancellation: cancellationService,
  compliance: complianceService,
  cache: cacheService,
  featureFlags: featureFlagService,
  experiments: experimentService,
  realtimeFlags: featureFlagRealtimeService,
  auditFlags: featureFlagAuditService,
  services: servicesService,
  booksySync: booksySyncService,
  batch: batchService,

  // Monitoring
  monitoring: monitoringService,
  realtimeMonitoring: realtimeMonitoringService,
  reliability: reliabilityService,
  cqrs: cqrsService,

  // Location & localization
  location: LocationService,
  locationExtended: LocationServiceExtended,
  localization: LocalizationService,
  pricing: PricingService,

  // Communication
  websocket: websocketService,
  offlineBooking: offlineBookingService,

  // Authentication
  auth: authService,

  // API Gateway
  gateway: apiGateway
};

// Route exports
export const Routes = {
  v1: {
    bookings: bookingRoutes,
    payments: paymentRoutes,
    admin: adminRoutes,
    services: servicesRoutes,
    users: usersRoutes,
    all: v1Routes
  }
};

// Middleware exports
export const Middleware = {
  validation: ValidationMiddleware,
  rateLimit: RateLimitMiddleware,
  error: ErrorMiddleware,
  auth: AuthMiddleware,
  reliability: reliabilityMiddleware,
  schemas: CommonSchemas,
  configs: RateLimitConfigs,
  generators: KeyGenerators,
  roles: Roles,
  permissions: Permissions
};

// Initialize function to set up all services
export function initializeServices() {
  console.log('🚀 Initializing Mariia Hub Services...');

  // Start rate limit cleanup
  RateLimitMiddleware.startCleanupInterval();

  // Initialize cache service
  cacheService?.initialize?.();

  // Initialize feature flags
  featureFlagService?.initialize?.();

  // Initialize monitoring
  monitoringService?.initialize?.();

  // Initialize authentication service
  authService?.initialize?.();

  // Initialize WebSocket service
  websocketService?.initialize?.();

  console.log('✅ Services initialized successfully');
}

// Cleanup function to gracefully shutdown all services
export function cleanupServices() {
  console.log('🛑 Cleaning up Mariia Hub Services...');

  // Stop rate limit cleanup
  RateLimitMiddleware.stopCleanupInterval();

  // Close WebSocket connections
  websocketService?.cleanup?.();

  // Close database connections
  cacheService?.cleanup?.();

  // Flush monitoring data
  monitoringService?.flush?.();

  console.log('✅ Services cleaned up successfully');
}

// Default export - API Gateway
export default apiGateway;