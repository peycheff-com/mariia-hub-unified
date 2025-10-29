// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User and profile types
export interface User extends BaseEntity {
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: 'en' | 'pl';
  currency: 'PLN' | 'EUR' | 'USD';
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  booking_reminders: boolean;
  promotions: boolean;
}

export type UserRole = 'admin' | 'user' | 'provider' | 'manager';

// Service types
export interface Service extends BaseEntity {
  title: string;
  description: string;
  category: ServiceCategory;
  subcategory?: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  image_urls?: string[];
  gallery?: ServiceGallery[];
  status: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, any>;
  translations?: Record<string, ServiceTranslation>;
}

export interface ServiceTranslation {
  title?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface ServiceGallery extends BaseEntity {
  service_id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
  is_featured: boolean;
}

export type ServiceCategory = 'beauty' | 'fitness' | 'lifestyle';

// Booking types
export interface Booking extends BaseEntity {
  user_id: string;
  service_id: string;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  total_price: number;
  currency: string;
  notes?: string;
  customer_info: CustomerInfo;
  payment_status: PaymentStatus;
  external_sync?: ExternalSync;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  preferences?: Record<string, any>;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

// Review types
export interface Review extends BaseEntity {
  service_id: string;
  user_id: string;
  booking_id?: string;
  rating: number; // 1-5
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  verified: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  response?: ReviewResponse;
}

export interface ReviewResponse {
  content: string;
  responded_by: string;
  responded_at: string;
}

// Availability types
export interface AvailabilitySlot extends BaseEntity {
  service_id: string;
  provider_id?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_available: boolean;
  location_id?: string;
  metadata?: Record<string, any>;
}

// Location types
export interface Location extends BaseEntity {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone: string;
  business_hours?: BusinessHours;
}

export interface BusinessHours {
  [key: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

// Payment types
export interface Payment extends BaseEntity {
  booking_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  refunded_at?: string;
  refund_amount?: number;
}

export type PaymentMethod =
  | 'card'
  | 'cash'
  | 'bank_transfer'
  | 'online'
  | 'gift_card'
  | 'loyalty_points';

// Blog/Content types
export interface BlogPost extends BaseEntity {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  author_id: string;
  category?: string;
  tags?: string[];
  seo?: SEOData;
  translations?: Record<string, BlogTranslation>;
}

export interface BlogTranslation {
  title?: string;
  content?: string;
  excerpt?: string;
}

export interface SEOData {
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  canonical_url?: string;
  structured_data?: Record<string, any>;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  user_id?: string;
  session_id?: string;
}

export interface BookingAnalytics {
  total_bookings: number;
  total_revenue: number;
  conversion_rate: number;
  average_booking_value: number;
  popular_services: Array<{
    service_id: string;
    count: number;
    revenue: number;
  }>;
  cancellation_rate: number;
  no_show_rate: number;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
}

export interface FormData {
  [key: string]: any;
}

// Configuration types
export interface AppConfig {
  app_name: string;
  app_version: string;
  api_base_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  stripe_publishable_key?: string;
  enable_booking: boolean;
  enable_payments: boolean;
  enable_ai: boolean;
  default_language: 'en' | 'pl';
  supported_languages: Array<'en' | 'pl'>;
  currencies: Array<'PLN' | 'EUR' | 'USD'>;
  business_info: {
    name: string;
    email: string;
    phone: string;
    address: string;
    vat_id?: string;
  };
}

// UI Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Common ID types
export type ID = string;
export type Timestamp = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

// Common status types
export type Status = 'active' | 'inactive' | 'pending' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Export all types as a namespace for convenience
export namespace SharedTypes {
  export type {
    BaseEntity,
    User,
    UserPreferences,
    NotificationSettings,
    UserRole,
    Service,
    ServiceTranslation,
    ServiceGallery,
    ServiceCategory,
    Booking,
    CustomerInfo,
    BookingStatus,
    PaymentStatus,
    Review,
    ReviewResponse,
    AvailabilitySlot,
    Location,
    BusinessHours,
    Payment,
    PaymentMethod,
    BlogPost,
    BlogTranslation,
    SEOData,
    AnalyticsEvent,
    BookingAnalytics,
    ApiResponse,
    ApiError,
    PaginatedResponse,
    FormField,
    ValidationRule,
    FormData,
    AppConfig,
    BaseComponentProps,
    ButtonProps,
    ModalProps,
    Optional,
    RequiredBy,
    DeepPartial,
    ID,
    Timestamp,
    JSONValue,
    JSONObject,
    JSONArray,
    Status,
    Priority,
  };
}