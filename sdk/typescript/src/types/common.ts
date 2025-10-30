/**
 * Common types used across the SDK
 */

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  timestamp: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  stack?: string;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  rateLimit?: RateLimitMeta;
  requestId?: string;
  version?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Rate limit metadata
 */
export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Generic query parameters
 */
export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filtering parameters
 */
export interface FilterParams {
  filters?: Record<string, any>;
  search?: string;
}

/**
 * Generic list request parameters
 */
export interface ListParams extends PaginationParams, SortParams, FilterParams {}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request configuration
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  file: File | Blob;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

/**
 * Location types
 */
export type LocationType = 'studio' | 'online' | 'fitness' | 'mobile';

/**
 * Service categories
 */
export type ServiceCategory = 'beauty' | 'fitness' | 'lifestyle' | 'wellness';

/**
 * Booking statuses
 */
export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/**
 * Payment statuses
 */
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

/**
 * Currency types (with Polish market support)
 */
export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP';

/**
 * Language codes (with Polish market support)
 */
export type Language = 'pl' | 'en' | 'de' | 'fr';

/**
 * Time zone types (with Polish market support)
 */
export type TimeZone = 'Europe/Warsaw' | 'UTC' | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin';

/**
 * Date range
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Time slot
 */
export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  available: boolean;
  location?: LocationType;
  capacity?: number;
  currentBookings?: number;
}

/**
 * Address (Polish format)
 */
export interface PolishAddress {
  street: string;
  buildingNumber: string;
  apartmentNumber?: string;
  postalCode: string;
  city: string;
  voivodeship?: string;
  country?: string;
}

/**
 * Polish phone number
 */
export interface PolishPhoneNumber {
  number: string;
  prefix?: string;
  verified?: boolean;
}

/**
 * Polish NIP (Tax Identification Number)
 */
export type NIP = string; // 10 digits, format: XXX-XXX-XX-XX

/**
 * Polish PESEL (Universal Electronic System for Registration of the Population)
 */
export type PESEL = string; // 11 digits

/**
 * Polish REGON (Statistical Identification Number)
 */
export type REGON = string; // 9 or 14 digits

/**
 * Business hours
 */
export interface BusinessHours {
  dayOfWeek: number; // 0-6, Sunday = 0
  open: string; // HH:MM format
  close: string; // HH:MM format
  isOpen: boolean;
}

/**
 * Coordinates for location services
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Geographic location
 */
export interface Location {
  type: LocationType;
  name: string;
  address?: PolishAddress;
  coordinates?: Coordinates;
  businessHours?: BusinessHours[];
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp?: boolean;
  language: Language;
  timeZone: TimeZone;
}

/**
 * Consent types (GDPR compliance)
 */
export interface ConsentTypes {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  analytics: boolean;
  cookies: boolean;
  newsletter?: boolean;
  smsMarketing?: boolean;
  whatsappMarketing?: boolean;
}

/**
 * Audit trail
 */
export interface AuditTrail {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Webhook event
 */
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: Date;
}

/**
 * API version information
 */
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  migrationGuide?: string;
}

/**
 * Health check result
 */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, HealthCheckResult>;
  responseTime: number;
}

/**
 * Individual health check result
 */
export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Feature flag
 */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage?: number;
}

/**
 * Feature flag condition
 */
export interface FeatureFlagCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: string | string[] | number | number[] | boolean;
}