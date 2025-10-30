import {
  ApiResponse,
  TimeSlot,
  LocationType,
  BookingStatus,
  PaymentStatus,
  Currency,
  Language,
  TimeZone,
  PolishAddress,
  PolishPhoneNumber,
  ConsentTypes,
  AuditTrail,
  ListParams
} from './common';

/**
 * Booking interface
 */
export interface Booking {
  id: string;
  serviceId: string;
  userId?: string;
  status: BookingStatus;
  bookingDate: string;
  bookingTime: string;
  endTime: string;
  locationType: LocationType;

  // Client information
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: PolishAddress;

  // Service details
  serviceName: string;
  serviceCategory: 'beauty' | 'fitness' | 'lifestyle';
  duration: number; // in minutes
  price: number;
  currency: Currency;

  // Booking details
  notes?: string;
  specialRequests?: string;
  groupSize?: number;
  isGroupBooking: boolean;
  participants?: Participant[];

  // Payment information
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentIntentId?: string;
  depositAmount?: number;
  totalAmount: number;
  refundAmount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  // Additional metadata
  source: 'web' | 'mobile' | 'admin' | 'api' | 'booksy_sync';
  externalId?: string;
  calendarEventId?: string;

  // Polish market specific
  polishInvoiceRequired?: boolean;
  polishNIP?: string;
  polishCompanyDetails?: PolishCompanyDetails;

  // Consent and compliance
  consents: ConsentTypes;
  gdprCompliant: boolean;

  // Metadata
  metadata?: Record<string, any>;
  auditTrail?: AuditTrail[];
}

/**
 * Participant for group bookings
 */
export interface Participant {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  specialRequirements?: string;
}

/**
 * Polish company details for invoicing
 */
export interface PolishCompanyDetails {
  companyName: string;
  nip: string;
  regon?: string;
  address: PolishAddress;
  email?: string;
  phone?: string;
  bankAccount?: string;
}

/**
 * Booking creation request
 */
export interface CreateBookingRequest {
  serviceId: string;
  timeSlot: TimeSlot;
  details: BookingDetails;
  userId?: string;
  paymentDetails?: PaymentDetails;
  metadata?: Record<string, any>;
}

/**
 * Booking details
 */
export interface BookingDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: PolishAddress;
  notes?: string;
  specialRequests?: string;
  consentTerms: boolean;
  consentMarketing: boolean;
  consentDataProcessing: boolean;
  polishCompanyDetails?: PolishCompanyDetails;
}

/**
 * Payment details for booking
 */
export interface PaymentDetails {
  method: 'card' | 'bank_transfer' | 'cash' | 'online_payment';
  currency: Currency;
  depositAmount?: number;
  useLoyaltyPoints?: number;
  voucherCode?: string;
  polishPaymentMethod?: PolishPaymentMethod;
}

/**
 * Polish payment methods
 */
export interface PolishPaymentMethod {
  type: 'przelewy24' | 'blik' | 'pbl' | 'card' | 'bank_transfer';
  bankId?: string;
  blikCode?: string;
  pblBank?: string;
}

/**
 * Booking availability response
 */
export interface BookingAvailability {
  serviceId: string;
  date: string;
  availableSlots: TimeSlot[];
  alternativeDates: AlternativeDate[];
  locationType: LocationType;
  maxGroupSize: number;
  currentAvailability: number;
  polishBusinessHours?: PolishBusinessHours;
}

/**
 * Alternative date with availability
 */
export interface AlternativeDate {
  date: string;
  availableSlots: number;
  earliestTime?: string;
  latestTime?: string;
}

/**
 * Polish business hours
 */
export interface PolishBusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  holidays: HolidaySchedule[];
}

/**
 * Day schedule
 */
export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  appointmentsOnly?: boolean;
}

/**
 * Holiday schedule
 */
export interface HolidaySchedule {
  date: string;
  name: string;
  isClosed: boolean;
  specialHours?: DaySchedule;
}

/**
 * Booking reschedule request
 */
export interface RescheduleBookingRequest {
  newDate: string;
  newTime: string;
  newLocationType?: LocationType;
  reason?: string;
  waiveFee?: boolean;
}

/**
 * Booking reschedule response
 */
export interface RescheduleBookingResponse {
  booking: Booking;
  rescheduleFee?: number;
  feeWaived: boolean;
  confirmationRequired: boolean;
  timeSlotAvailable: boolean;
  alternativeSlots?: TimeSlot[];
}

/**
 * Booking cancellation request
 */
export interface CancelBookingRequest {
  reason: string;
  refundRequested: boolean;
  waiveCancellationFee?: boolean;
  cancellationPolicy?: string;
}

/**
 * Booking cancellation response
 */
export interface CancelBookingResponse {
  booking: Booking;
  refundAmount?: number;
  cancellationFee?: number;
  refundStatus: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedRefundDate?: string;
  cancellationPolicy: CancellationPolicy;
}

/**
 * Cancellation policy
 */
export interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  rules: CancellationRule[];
  currency: Currency;
}

/**
 * Cancellation rule
 */
export interface CancellationRule {
  hoursBeforeBooking: number;
  cancellationFee: number;
  feeType: 'fixed' | 'percentage';
  refundable: boolean;
  description: string;
}

/**
 * Group booking request
 */
export interface CreateGroupBookingRequest {
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  groupSize: number;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    address?: PolishAddress;
  };
  participants: Participant[];
  specialRequests?: string;
  paymentDetails?: PaymentDetails;
  consents: ConsentTypes;
}

/**
 * Waitlist entry
 */
export interface WaitlistEntry {
  id: string;
  serviceId: string;
  userId?: string;
  preferredDate: string;
  preferredTime: string;
  locationType: LocationType;
  groupSize: number;
  flexibleWithTime: boolean;
  flexibleWithLocation: boolean;
  flexibleWithDate: boolean;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  status: 'active' | 'promoted' | 'expired' | 'cancelled';
  priority: number;
  autoPromoteEligible: boolean;
  maxPromotionAttempts: number;
  promotionAttempts: number;
  lastPromotionAttempt?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  promotedAt?: string;
  cancelledAt?: string;
}

/**
 * Add to waitlist request
 */
export interface AddToWaitlistRequest {
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  locationType?: LocationType;
  groupSize?: number;
  flexibleWithTime?: boolean;
  flexibleWithLocation?: boolean;
  flexibleWithDate?: boolean;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  autoPromoteEligible?: boolean;
  maxPromotionAttempts?: number;
}

/**
 * Booking analytics
 */
export interface BookingAnalytics {
  totalBookings: number;
  bookingsByStatus: Record<BookingStatus, number>;
  bookingsByService: Record<string, number>;
  bookingsByLocation: Record<LocationType, number>;
  revenueByCurrency: Record<Currency, number>;
  averageBookingValue: number;
  cancellationRate: number;
  noShowRate: number;
  rescheduleRate: number;
  groupBookingRate: number;
  popularTimeSlots: TimeSlotAnalytics[];
  customerRetention: CustomerRetentionMetrics;
  polishMarketMetrics: PolishMarketMetrics;
}

/**
 * Time slot analytics
 */
export interface TimeSlotAnalytics {
  timeSlot: string;
  bookings: number;
  revenue: number;
  occupancyRate: number;
  cancellationRate: number;
}

/**
 * Customer retention metrics
 */
export interface CustomerRetentionMetrics {
  newCustomers: number;
  returningCustomers: number;
  repeatBookingRate: number;
  averageBookingsPerCustomer: number;
  customerLifetimeValue: number;
}

/**
 * Polish market specific metrics
 */
export interface PolishMarketMetrics {
  polishLanguageBookings: number;
  englishLanguageBookings: number;
  plnTransactions: number;
  euroTransactions: number;
  companyBookings: number;
  individualBookings: number;
  invoiceRequests: number;
  averageBookingValuePLN: number;
  averageBookingValueEUR: number;
}

/**
 * Booking calendar response
 */
export interface BookingCalendar {
  month: string;
  year: number;
  bookings: BookingCalendarDay[];
  availability: DayAvailability[];
  polishHolidays: PolishHoliday[];
}

/**
 * Booking calendar day
 */
export interface BookingCalendarDay {
  date: string;
  bookings: Booking[];
  totalRevenue: number;
  currency: Currency;
  hasAvailability: boolean;
  isWorkingDay: boolean;
}

/**
 * Day availability
 */
export interface DayAvailability {
  date: string;
  locationType: LocationType;
  availableSlots: TimeSlot[];
  totalSlots: number;
  bookedSlots: number;
  availableCapacity: number;
}

/**
 * Polish holiday
 */
export interface PolishHoliday {
  date: string;
  name: string;
  namePl: string;
  type: 'public' | 'observance';
  isWorkingDay: boolean;
}

/**
 * Booking interface
 */
export interface BookingsApi {
  /**
   * Check availability for a service
   */
  checkAvailability(params: CheckAvailabilityParams): Promise<ApiResponse<BookingAvailability>>;

  /**
   * Create a new booking
   */
  create(booking: CreateBookingRequest): Promise<ApiResponse<Booking>>;

  /**
   * Get user's bookings
   */
  list(params?: ListBookingsParams): Promise<ApiResponse<Booking[]>>;

  /**
   * Get a specific booking
   */
  get(id: string): Promise<ApiResponse<Booking>>;

  /**
   * Reschedule a booking
   */
  reschedule(id: string, request: RescheduleBookingRequest): Promise<ApiResponse<RescheduleBookingResponse>>;

  /**
   * Cancel a booking
   */
  cancel(id: string, request: CancelBookingRequest): Promise<ApiResponse<CancelBookingResponse>>;

  /**
   * Create a group booking
   */
  createGroup(request: CreateGroupBookingRequest): Promise<ApiResponse<Booking>>;

  /**
   * Add to waitlist
   */
  addToWaitlist(request: AddToWaitlistRequest): Promise<ApiResponse<WaitlistEntry>>;

  /**
   * Get waitlist entries
   */
  getWaitlist(params?: ListParams): Promise<ApiResponse<WaitlistEntry[]>>;

  /**
   * Get booking analytics
   */
  getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<BookingAnalytics>>;

  /**
   * Get booking calendar
   */
  getCalendar(params: CalendarParams): Promise<ApiResponse<BookingCalendar>>;

  /**
   * Confirm a booking
   */
  confirm(id: string): Promise<ApiResponse<Booking>>;

  /**
   * Complete a booking
   */
  complete(id: string, notes?: string): Promise<ApiResponse<Booking>>;

  /**
   * Mark as no-show
   */
  markNoShow(id: string, reason?: string): Promise<ApiResponse<Booking>>;

  /**
   * Send booking reminders
   */
  sendReminders(id: string): Promise<ApiResponse<boolean>>;

  /**
   * Get booking history
   */
  getHistory(params?: ListParams): Promise<ApiResponse<Booking[]>>;

  /**
   * Export bookings
   */
  export(params: ExportBookingsParams): Promise<ApiResponse<Blob>>;

  /**
   * Search bookings
   */
  search(query: string, params?: ListParams): Promise<ApiResponse<Booking[]>>;
}

/**
 * Check availability parameters
 */
export interface CheckAvailabilityParams {
  serviceId: string;
  date: string;
  groupSize?: number;
  location?: LocationType;
  includeAlternatives?: boolean;
  language?: Language;
}

/**
 * List bookings parameters
 */
export interface ListBookingsParams extends ListParams {
  status?: BookingStatus;
  serviceId?: string;
  userId?: string;
  locationType?: LocationType;
  dateFrom?: string;
  dateTo?: string;
  language?: Language;
}

/**
 * Analytics parameters
 */
export interface AnalyticsParams {
  dateFrom: string;
  dateTo: string;
  serviceIds?: string[];
  locationTypes?: LocationType[];
  groupBy?: 'day' | 'week' | 'month' | 'service' | 'location';
  includePolishMetrics?: boolean;
}

/**
 * Calendar parameters
 */
export interface CalendarParams {
  month: number;
  year: number;
  locationTypes?: LocationType[];
  serviceIds?: string[];
  includeAvailability?: boolean;
  language?: Language;
}

/**
 * Export bookings parameters
 */
export interface ExportBookingsParams {
  format: 'csv' | 'excel' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus;
  serviceIds?: string[];
  includePolishData?: boolean;
  language?: Language;
}