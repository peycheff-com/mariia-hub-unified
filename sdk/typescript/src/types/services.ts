import {
  ApiResponse,
  LocationType,
  ServiceCategory,
  Currency,
  Language,
  PolishAddress,
  ListParams,
  FileUploadOptions
} from './common';

/**
 * Service interface
 */
export interface Service {
  id: string;
  name: string;
  namePl?: string;
  description: string;
  descriptionPl?: string;
  category: ServiceCategory;
  subcategory: string;
  subcategoryPl?: string;

  // Pricing
  basePrice: number;
  currency: Currency;
  pricingModel: 'fixed' | 'hourly' | 'package' | 'consultation';
  priceVariations?: PriceVariation[];
  depositRequired: boolean;
  depositAmount?: number;
  depositPercentage?: number;

  // Duration and scheduling
  duration: number; // in minutes
  bufferTime?: number; // in minutes
  preparationTime?: number; // in minutes
  cleanupTime?: number; // in minutes
  maxAdvanceBooking?: number; // in days
  minAdvanceBooking?: number; // in hours

  // Capacity and location
  maxGroupSize: number;
  minGroupSize: number;
  locationTypes: LocationType[];
  onlineAvailable: boolean;
  mobileServiceAvailable: boolean;
  studioOnly?: boolean;

  // Availability
  schedule: ServiceSchedule;
  availabilityPattern: AvailabilityPattern;
  seasonalAvailability?: SeasonalAvailability[];

  // Service details
  requirements: ServiceRequirement[];
  whatToBring: string[];
  whatToExpect: string[];
  aftercareInstructions: string[];
  contraindications: string[];
  benefits: string[];
  targetAudience: string[];

  // Media and content
  images: ServiceImage[];
  videos: ServiceVideo[];
  gallery: ServiceGallery;

  // Polish market specific
  polishCertifications?: PolishCertification[];
  polishRequirements?: PolishRequirement[];
  polishPrice?: number;
  polishSpecialOffers?: PolishSpecialOffer[];

  // SEO and marketing
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  featured: boolean;
  popular: boolean;
  newService: boolean;
  promotional: boolean;

  // Business rules
  cancellationPolicy: CancellationPolicyInfo;
  reschedulePolicy: ReschedulePolicyInfo;
  noShowPolicy: NoShowPolicyInfo;
  paymentTerms: PaymentTermsInfo;

  // Integration
  booksyServiceId?: string;
  externalServiceIds?: Record<string, string>;

  // Status and metadata
  status: 'active' | 'inactive' | 'draft' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;

  // Analytics
  bookingCount: number;
  revenueGenerated: number;
  averageRating: number;
  reviewCount: number;
  conversionRate: number;

  // Additional metadata
  metadata?: Record<string, any>;
  tags: string[];
  attributes: ServiceAttribute[];
}

/**
 * Price variation
 */
export interface PriceVariation {
  id: string;
  name: string;
  namePl?: string;
  price: number;
  currency: Currency;
  conditions: PriceCondition[];
  description?: string;
}

/**
 * Price condition
 */
export interface PriceCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

/**
 * Service schedule
 */
export interface ServiceSchedule {
  monday: DayServiceSchedule;
  tuesday: DayServiceSchedule;
  wednesday: DayServiceSchedule;
  thursday: DayServiceSchedule;
  friday: DayServiceSchedule;
  saturday: DayServiceSchedule;
  sunday: DayServiceSchedule;
  holidays: ServiceHoliday[];
  specialDates: ServiceSpecialDate[];
}

/**
 * Day service schedule
 */
export interface DayServiceSchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
  maxBookingsPerSlot?: number;
  requiresAdvanceBooking?: boolean;
  minAdvanceHours?: number;
}

/**
 * Time slot for service
 */
export interface TimeSlot {
  startTime: string;
  endTime: string;
  maxBookings: number;
  requiresBufferTime?: boolean;
  specialConditions?: string[];
}

/**
 * Service holiday
 */
export interface ServiceHoliday {
  date: string;
  name: string;
  namePl?: string;
  isClosed: boolean;
  specialSchedule?: DayServiceSchedule;
}

/**
 * Service special date
 */
export interface ServiceSpecialDate {
  date: string;
  name: string;
  schedule: DayServiceSchedule;
  priceVariation?: {
    percentage: number;
    type: 'increase' | 'decrease';
  };
}

/**
 * Availability pattern
 */
export interface AvailabilityPattern {
  type: 'recurring' | 'custom' | 'on_demand';
  recurringPattern?: RecurringPattern;
  customDates?: string[];
  blackoutDates?: string[];
  seasonalAdjustments?: SeasonalAdjustment[];
}

/**
 * Recurring pattern
 */
export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  startDate: string;
  endDate?: string;
}

/**
 * Seasonal adjustment
 */
export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  year?: number;
  priceAdjustment: {
    percentage: number;
    type: 'increase' | 'decrease';
  };
  availabilityAdjustment?: {
    increaseCapacity: boolean;
    capacityPercentage: number;
  };
}

/**
 * Seasonal availability
 */
export interface SeasonalAvailability {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  available: boolean;
  schedule?: ServiceSchedule;
  priceAdjustment?: number;
  specialRequirements?: string[];
}

/**
 * Service requirement
 */
export interface ServiceRequirement {
  type: 'age' | 'health' | 'preparation' | 'equipment' | 'documentation';
  description: string;
  descriptionPl?: string;
  required: boolean;
  validation?: ValidationRule;
}

/**
 * Validation rule for requirements
 */
export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  errorMessage: string;
  errorMessagePl?: string;
}

/**
 * Service image
 */
export interface ServiceImage {
  id: string;
  url: string;
  alt: string;
  altPl?: string;
  caption?: string;
  captionPl?: string;
  order: number;
  featured: boolean;
  metadata?: ImageMetadata;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  dominantColor?: string;
  tags?: string[];
}

/**
 * Service video
 */
export interface ServiceVideo {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  titlePl?: string;
  description?: string;
  descriptionPl?: string;
  duration?: number;
  order: number;
  featured: boolean;
}

/**
 * Service gallery
 */
export interface ServiceGallery {
  images: ServiceImage[];
  videos: ServiceVideo[];
  beforeAfterImages?: BeforeAfterImage[];
  virtualTours?: VirtualTour[];
}

/**
 * Before and after image
 */
export interface BeforeAfterImage {
  id: string;
  beforeImage: ServiceImage;
  afterImage: ServiceImage;
  description?: string;
  descriptionPl?: string;
  treatmentDate: string;
  recoveryTime?: number;
}

/**
 * Virtual tour
 */
export interface VirtualTour {
  id: string;
  title: string;
  titlePl?: string;
  url: string;
  thumbnail?: string;
  description?: string;
  descriptionPl?: string;
  duration?: number;
  interactive: boolean;
}

/**
 * Polish certification
 */
export interface PolishCertification {
  id: string;
  name: string;
  namePl: string;
  issuingAuthority: string;
  issuingAuthorityPl: string;
  certificateNumber?: string;
  validFrom?: string;
  validTo?: string;
  documentUrl?: string;
  verified: boolean;
}

/**
 * Polish requirement
 */
export interface PolishRequirement {
  type: 'legal' | 'safety' | 'sanitary' | 'administrative';
  description: string;
  descriptionPl: string;
  applicable: boolean;
  documentation?: string[];
  complianceStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
}

/**
 * Polish special offer
 */
export interface PolishSpecialOffer {
  id: string;
  title: string;
  titlePl: string;
  description: string;
  descriptionPl: string;
  discountType: 'percentage' | 'fixed_amount' | 'package_deal';
  discountValue: number;
  validFrom: string;
  validTo: string;
  conditions?: string[];
  conditionsPl?: string[];
  terms?: string;
  termsPl?: string;
  targetAudience?: string[];
  promotionalCode?: string;
  maxUses?: number;
  currentUses: number;
}

/**
 * Cancellation policy info
 */
export interface CancellationPolicyInfo {
  policyId: string;
  freeCancellationPeriod: number; // hours before booking
  cancellationFee: number;
  feeType: 'fixed' | 'percentage';
  refundPolicy: string;
  refundPolicyPl?: string;
  exceptions?: string[];
}

/**
 * Reschedule policy info
 */
export interface ReschedulePolicyInfo {
  freeReschedulePeriod: number; // hours before booking
  rescheduleFee?: number;
  feeType?: 'fixed' | 'percentage';
  maxReschedules: number;
  advanceNotice: number; // hours
}

/**
 * No show policy info
 */
export interface NoShowPolicyInfo {
  noShowFee: number;
  feeType: 'fixed' | 'percentage' | 'full_price';
  waiverConditions?: string[];
  notificationRequirement: number; // hours before
}

/**
 * Payment terms info
 */
export interface PaymentTermsInfo {
  paymentTiming: 'immediate' | 'on_arrival' | 'after_service';
  depositRequired: boolean;
  depositAmount?: number;
  depositPercentage?: number;
  paymentMethods: PaymentMethod[];
  installmentOptions?: InstallmentOption[];
  refundPolicy: string;
  refundPolicyPl?: string;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  type: 'card' | 'cash' | 'bank_transfer' | 'online_payment' | 'installment';
  enabled: boolean;
  additionalFee?: number;
  feeType?: 'fixed' | 'percentage';
}

/**
 * Installment option
 */
export interface InstallmentOption {
  provider: string;
  minAmount: number;
  maxInstallments: number;
  interestRate?: number;
  terms?: string;
  termsPl?: string;
}

/**
 * Service attribute
 */
export interface ServiceAttribute {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
  searchable: boolean;
  filterable: boolean;
}

/**
 * Service creation request
 */
export interface CreateServiceRequest {
  name: string;
  namePl?: string;
  description: string;
  descriptionPl?: string;
  category: ServiceCategory;
  subcategory: string;
  subcategoryPl?: string;
  basePrice: number;
  currency: Currency;
  duration: number;
  maxGroupSize: number;
  minGroupSize: number;
  locationTypes: LocationType[];
  schedule: ServiceSchedule;
  requirements?: ServiceRequirement[];
  images?: FileUploadOptions[];
  metadata?: Record<string, any>;
}

/**
 * Service update request
 */
export interface UpdateServiceRequest {
  name?: string;
  namePl?: string;
  description?: string;
  descriptionPl?: string;
  basePrice?: number;
  duration?: number;
  maxGroupSize?: number;
  locationTypes?: LocationType[];
  schedule?: ServiceSchedule;
  status?: 'active' | 'inactive' | 'draft';
  metadata?: Record<string, any>;
}

/**
 * Service search filters
 */
export interface ServiceSearchFilters {
  category?: ServiceCategory;
  subcategory?: string;
  locationType?: LocationType;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  groupSize?: number;
  features?: string[];
  tags?: string[];
  availableOnly?: boolean;
  featuredOnly?: boolean;
  polishServicesOnly?: boolean;
}

/**
 * Service analytics
 */
export interface ServiceAnalytics {
  totalServices: number;
  servicesByCategory: Record<ServiceCategory, number>;
  servicesByLocation: Record<LocationType, number>;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  popularServices: ServicePopularity[];
  bookingConversionRates: Record<string, number>;
  revenueByService: Record<string, number>;
  polishMarketMetrics: PolishServiceMetrics;
}

/**
 * Service popularity
 */
export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  conversionRate: number;
}

/**
 * Polish service metrics
 */
export interface PolishServiceMetrics {
  polishServices: number;
  polishLanguageBookings: number;
  plnRevenue: number;
  polishCertifiedServices: number;
  complianceRate: number;
  averageRatingPoland: number;
}

/**
 * Services API interface
 */
export interface ServicesApi {
  /**
   * Get a list of services
   */
  list(params?: ListServicesParams): Promise<ApiResponse<Service[]>>;

  /**
   * Get a specific service
   */
  get(id: string, params?: GetServiceParams): Promise<ApiResponse<Service>>;

  /**
   * Create a new service
   */
  create(service: CreateServiceRequest): Promise<ApiResponse<Service>>;

  /**
   * Update a service
   */
  update(id: string, service: UpdateServiceRequest): Promise<ApiResponse<Service>>;

  /**
   * Delete a service
   */
  delete(id: string): Promise<ApiResponse<void>>;

  /**
   * Search services
   */
  search(query: string, filters?: ServiceSearchFilters, params?: ListParams): Promise<ApiResponse<Service[]>>;

  /**
   * Get service availability
   */
  getAvailability(serviceId: string, params: AvailabilityParams): Promise<ApiResponse<ServiceAvailability>>;

  /**
   * Upload service images
   */
  uploadImages(serviceId: string, images: FileUploadOptions[]): Promise<ApiResponse<ServiceImage[]>>;

  /**
   * Update service gallery
   */
  updateGallery(serviceId: string, gallery: Partial<ServiceGallery>): Promise<ApiResponse<ServiceGallery>>;

  /**
   * Get service analytics
   */
  getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<ServiceAnalytics>>;

  /**
   * Get related services
   */
  getRelated(serviceId: string, params?: ListParams): Promise<ApiResponse<Service[]>>;

  /**
   * Get service reviews
   */
  getReviews(serviceId: string, params?: ListParams): Promise<ApiResponse<ServiceReview[]>>;

  /**
   * Add service review
   */
  addReview(serviceId: string, review: CreateServiceReview): Promise<ApiResponse<ServiceReview>>;

  /**
   * Get service categories
   */
  getCategories(): Promise<ApiResponse<ServiceCategory[]>>;

  /**
   * Get service subcategories
   */
  getSubcategories(category?: ServiceCategory): Promise<ApiResponse<string[]>>;

  /**
   * Duplicate a service
   */
  duplicate(id: string, options?: DuplicateServiceOptions): Promise<ApiResponse<Service>>;

  /**
   * Export services
   */
  export(params: ExportServicesParams): Promise<ApiResponse<Blob>>;

  /**
   * Import services
   */
  import(file: File, options: ImportServicesOptions): Promise<ApiResponse<ServiceImportResult>>;
}

/**
 * List services parameters
 */
export interface ListServicesParams extends ListParams {
  category?: ServiceCategory;
  subcategory?: string;
  locationType?: LocationType;
  featured?: boolean;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  language?: Language;
}

/**
 * Get service parameters
 */
export interface GetServiceParams {
  includeGallery?: boolean;
  includeReviews?: boolean;
  includeAvailability?: boolean;
  language?: Language;
}

/**
 * Service availability
 */
export interface ServiceAvailability {
  serviceId: string;
  availableDates: AvailableDate[];
  unavailableDates: string[];
  nextAvailability?: string;
  seasonalAvailability?: SeasonalAvailability[];
}

/**
 * Available date
 */
export interface AvailableDate {
  date: string;
  timeSlots: TimeSlot[];
  availableSlots: number;
  totalSlots: number;
}

/**
 * Availability parameters
 */
export interface AvailabilityParams {
  startDate: string;
  endDate: string;
  locationType?: LocationType;
  groupSize?: number;
  includeSeasonal?: boolean;
}

/**
 * Service review
 */
export interface ServiceReview {
  id: string;
  serviceId: string;
  userId?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  verified: boolean;
  helpful: number;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create service review
 */
export interface CreateServiceReview {
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
}

/**
 * Duplicate service options
 */
export interface DuplicateServiceOptions {
  copyImages?: boolean;
  copySchedule?: boolean;
  copyPricing?: boolean;
  copyRequirements?: boolean;
  newName?: string;
}

/**
 * Export services parameters
 */
export interface ExportServicesParams {
  format: 'csv' | 'excel' | 'json';
  category?: ServiceCategory;
  includeImages?: boolean;
  includeAnalytics?: boolean;
  language?: Language;
}

/**
 * Import services options
 */
export interface ImportServicesOptions {
  updateExisting?: boolean;
  validateOnly?: boolean;
  importImages?: boolean;
  language?: Language;
}

/**
 * Service import result
 */
export interface ServiceImportResult {
  total: number;
  imported: number;
  updated: number;
  failed: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

/**
 * Import error
 */
export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Import warning
 */
export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}