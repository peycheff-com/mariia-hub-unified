// Enhanced Types for Booking System

export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ServiceType = 'beauty' | 'fitness';
export type LocationType = 'studio' | 'online' | 'fitness';

export interface TimeSlot {
  id: string;
  date: Date;
  time: string;
  available: boolean;
  location: LocationType;
  price?: number;
  currency?: string;
  capacity?: number;
  currentBookings?: number;
  remainingCapacity?: number;
  allowsGroups?: boolean;
  maxGroupSize?: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  service_type: ServiceType;
  price_from: number;
  price_to?: number;
  duration_minutes: number;
  image_url?: string;
  description?: string;
  features?: string[];
  location_rules?: {
    allowed_locations: LocationType[];
  };
  allows_groups?: boolean;
  max_group_size?: number;
  capacity_settings?: {
    default_capacity?: number;
    group_capacity?: number;
  };
}

export interface BookingDetails {
  client_name: string;
  client_email: string;
  client_phone: string;
  notes?: string;
  consent_terms: boolean;
  consent_marketing: boolean;
  // Group booking support
  is_group_booking?: boolean;
  group_size?: number;
  participants?: Array<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>;
}

export interface PaymentDetails {
  method: 'card' | 'cash';
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
}

export interface Booking {
  id?: string;
  service_id: string;
  user_id?: string;
  status: BookingStatus;
  service: Service;
  timeSlot: TimeSlot;
  details: BookingDetails;
  payment?: PaymentDetails;
  created_at?: Date;
  updated_at?: Date;
  // Enhanced booking features
  is_group_booking?: boolean;
  group_booking_id?: string;
  group_participant_count?: number;
  original_price?: number;
  discount_amount?: number;
  applied_pricing_rules?: Array<{
    rule_id: string;
    rule_type: string;
    discount_percentage?: number;
    applied_amount: number;
  }>;
  waitlist_entry_id?: string;
  reschedule_count?: number;
  last_rescheduled_at?: Date;
  capacity_info?: TimeSlot;
}

// Base Booking State Interface
export interface BaseBookingState {
  currentBooking: Booking | null;
  selectedService: Service | null;
  selectedTimeSlot: TimeSlot | null;
  bookingDetails: Partial<BookingDetails> | null;
  isCreating: boolean;
  error: string | null;
  step: number;
  canProceed: boolean;
  totalPrice: number;
}

// Group Booking State Interface
export interface GroupBookingState {
  isGroupBooking: boolean;
  groupSize: number;
  groupParticipants: Array<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>;
}

// Pricing State Interface
export interface PricingState {
  appliedPricingRules: Array<{
    rule_id: string;
    rule_type: string;
    discount_percentage?: number;
    applied_amount: number;
  }>;
  originalPrice: number;
  discountAmount: number;
}

// Capacity State Interface
export interface CapacityState {
  capacityInfo: {
    available: boolean;
    remainingCapacity: number;
    allowsGroups: boolean;
    maxGroupSize: number;
  } | null;
  waitlistMode: boolean;
  waitlistEntry: {
    serviceId: string;
    preferredDate: Date;
    preferredTime: string;
    flexibleWithTime: boolean;
    contactEmail: string;
    contactPhone?: string;
  } | null;
}

// Real-time State Interface
export interface RealtimeState {
  isConnected: boolean;
  realtimeChannel: any; // RealtimeChannel from Supabase
  optimisticUpdates: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    status: 'pending' | 'success' | 'error';
  }>;
  conflictDetected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: Date | null;
}

// Calendar State Interface
export interface CalendarState {
  calendarView: 'day' | 'week' | 'month';
  calendarDate: Date;
  availableTimeSlots: TimeSlot[];
  calendarLoading: boolean;
}

// History State Interface
export interface HistoryState {
  bookingHistory: any[];
  historyLoading: boolean;
  historyTotalCount: number;
  cancellationInProgress: boolean;
  resourceAllocations: any[];
  resourceConflicts: any[];
}

// Actions interfaces
export interface BaseBookingActions {
  selectService: (service: Service) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  updateDetails: (details: Partial<BookingDetails>) => void;
  setPaymentDetails: (payment: PaymentDetails) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetBooking: () => void;
  createBooking: () => Promise<void>;
  updateBookingStatus: (status: BookingStatus) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface GroupBookingActions {
  setGroupBooking: (isGroup: boolean) => void;
  setGroupSize: (size: number) => void;
  setGroupParticipants: (participants: Array<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>) => void;
  addGroupParticipant: (participant: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => void;
  removeGroupParticipant: (index: number) => void;
  updateGroupParticipant: (index: number, participant: Partial<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>) => void;
}

export interface PricingActions {
  applyPricingRules: (rules: Array<{
    rule_id: string;
    rule_type: string;
    discount_percentage?: number;
    applied_amount: number;
  }>) => void;
  calculatePrice: () => Promise<void>;
}

export interface CapacityActions {
  checkCapacity: (serviceId: string, date: Date, time: string, groupSize?: number) => Promise<void>;
  setWaitlistMode: (enabled: boolean) => void;
  setWaitlistEntry: (entry: {
    serviceId: string;
    preferredDate: Date;
    preferredTime: string;
    flexibleWithTime: boolean;
    contactEmail: string;
    contactPhone?: string;
  }) => void;
  joinWaitlist: () => Promise<void>;
}

export interface RealtimeActions {
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  addOptimisticUpdate: (type: 'create' | 'update' | 'delete', data: any) => string;
  resolveOptimisticUpdate: (id: string, success: boolean, result?: any) => void;
  detectConflict: (booking1: Booking, booking2: Booking) => boolean;
  handleRealtimeEvent: (event: any) => void;
  syncWithServer: () => Promise<void>;
  retryFailedUpdates: () => Promise<void>;
}

export interface CalendarActions {
  setCalendarView: (view: 'day' | 'week' | 'month') => void;
  setCalendarDate: (date: Date) => void;
  refreshAvailability: () => Promise<void>;
}

export interface HistoryActions {
  getBookingHistory: (options?: {
    page?: number;
    limit?: number;
    filters?: any;
  }) => Promise<any>;
  rebookFromHistory: (bookingId: string) => Promise<{
    success: boolean;
    newBookingId?: string;
    error?: string;
  }>;
  exportBookingHistory: (format: 'pdf' | 'csv' | 'excel') => Promise<{
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
  }>;
  rescheduleBooking: (newDate: Date, newTime: string) => Promise<boolean>;
  quickReschedule: (action: 'next_week' | 'next_day' | 'same_time_next_week') => Promise<boolean>;
  cancelBooking: (reason: string, specialCondition?: string, documentation?: File[]) => Promise<{
    success: boolean;
    refundAmount?: number;
    error?: string;
  }>;
  allocateResources: (bookingId: string, requirements: any[]) => Promise<{
    success: boolean;
    allocations?: any[];
    conflicts?: any[];
    error?: string;
  }>;
}

// Combined store interfaces
export interface BookingBaseStore extends BaseBookingState, BaseBookingActions {}
export interface BookingGroupStore extends GroupBookingState, GroupBookingActions {}
export interface BookingPricingStore extends PricingState, PricingActions {}
export interface BookingCapacityStore extends CapacityState, CapacityActions {}
export interface BookingRealtimeStore extends RealtimeState, RealtimeActions {}
export interface BookingCalendarStore extends CalendarState, CalendarActions {}
export interface BookingHistoryStore extends HistoryState, HistoryActions {}

// Event emitter for cross-component communication
export const bookingEvents = {
  listeners: new Map<string, Set<Function>>(),

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  },

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  },

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  },
};

// Global window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}