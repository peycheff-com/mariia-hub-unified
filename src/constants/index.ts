// Application constants
export const APP_NAME = 'mariiaborysevych';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Premium beauty and fitness booking platform';

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

// Booking Constants
export const BOOKING = {
  SLOT_DURATION: 30, // 30 minutes
  MIN_BOOKING notice: 60 * 60 * 1000, // 1 hour in milliseconds
  MAX_BOOKING advance: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  CANCELLATION_DEADLINE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  HOLD_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
} as const;

// UI Constants
export const UI = {
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 5000, // 5 seconds
  MODAL_ANIMATION_DURATION: 200, // milliseconds
  SIDEBAR_WIDTH: 320, // pixels
  MOBILE_BREAKPOINT: 768, // pixels
  TABLET_BREAKPOINT: 1024, // pixels
  DESKTOP_BREAKPOINT: 1280, // pixels
} as const;

// Animation Constants
export const ANIMATION = {
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  DURATION_FAST: 150, // milliseconds
  DURATION_NORMAL: 300, // milliseconds
  DURATION_SLOW: 500, // milliseconds
} as const;

// Form Validation
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 500,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  POSTAL_CODE_REGEX: /^\d{2}-\d{3}$/, // Polish postal code format
} as const;

// Service Categories
export const SERVICE_CATEGORIES = {
  BEAUTY: 'beauty',
  FITNESS: 'fitness',
  LIFESTYLE: 'lifestyle',
} as const;

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Languages
export const LANGUAGES = {
  EN: 'en',
  PL: 'pl',
} as const;

// Currency
export const CURRENCY = {
  PLN: 'PLN',
  EUR: 'EUR',
  USD: 'USD',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Booking created successfully!',
  BOOKING_CANCELLED: 'Booking cancelled successfully.',
  PAYMENT_SUCCESSFUL: 'Payment processed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  REVIEW_SUBMITTED: 'Review submitted successfully!',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  BOOKING_DRAFT: 'booking_draft',
  LANGUAGE: 'language',
  THEME: 'theme',
  CURRENCY: 'currency',
} as const;

// Session Storage Keys
export const SESSION_KEYS = {
  BOOKING_PROGRESS: 'booking_progress',
  TEMP_HOLD_ID: 'temp_hold_id',
} as const;

// Social Media URLs
export const SOCIAL_MEDIA = {
  INSTAGRAM: 'https://instagram.com/mariiaborysevych',
  FACEBOOK: 'https://facebook.com/mariiaborysevych',
  YOUTUBE: 'https://youtube.com/mariiaborysevych',
  LINKEDIN: 'https://linkedin.com/in/mariiaborysevych',
} as const;

// Contact Information
export const CONTACT = {
  EMAIL: 'hi@mariiaborysevych.com',
  PHONE: '+48 123 456 789',
  ADDRESS: 'Warsaw, Poland',
} as const;

// Business Hours
export const BUSINESS_HOURS = {
  WEEKDAYS: { open: '09:00', close: '21:00' },
  SATURDAY: { open: '09:00', close: '18:00' },
  SUNDAY: { open: 'closed', close: 'closed' },
} as const;

// Map export for easier usage
export const CONSTANTS = {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  API_CONFIG,
  BOOKING,
  UI,
  ANIMATION,
  VALIDATION,
  SERVICE_CATEGORIES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  LANGUAGES,
  CURRENCY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  FILE_UPLOAD,
  STORAGE_KEYS,
  SESSION_KEYS,
  SOCIAL_MEDIA,
  CONTACT,
  BUSINESS_HOURS,
} as const;