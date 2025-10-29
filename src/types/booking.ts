// Enhanced interfaces for booking system
export interface Service {
  id: string;
  title: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  duration_minutes: number;
  price_from: number;
  price_to?: number;
  category: string;
  description?: string;
  active: boolean;
  allows_groups?: boolean;
  max_group_size?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'studio' | 'gym' | 'online';
  address?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Step1Data {
  serviceId: string;
  serviceType: 'beauty' | 'fitness';
  durationMinutes: number;
  locationId: string;
  selectedAddOns: string[];
  specialRequests?: string;
  // Group booking support
  isGroupBooking?: boolean;
  groupSize?: number;
  participants?: GroupParticipant[];
}

export interface GroupParticipant {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Step2Data {
  selectedDate: Date;
  selectedTime: string;
  slotId?: string;
  bookingId?: string;
}

export interface Step3Data {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappConsent: boolean;
  marketingConsent: boolean;
  notes?: string;
}

export interface BookingData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

// Enhanced interfaces for new features

export interface TimeSlot {
  id: string;
  date: Date;
  time: string;
  available: boolean;
  location: 'studio' | 'online' | 'fitness';
  price?: number;
  currency?: string;
  capacity?: number;
  currentBookings?: number;
  remainingCapacity?: number;
  allowsGroups?: boolean;
  maxGroupSize?: number;
}

export interface TimeSlotWithCapacity extends TimeSlot {
  capacity: number;
  currentBookings: number;
  remainingCapacity: number;
  allowsGroups: boolean;
  maxGroupSize: number;
}

export interface WaitlistEntry {
  id: string;
  serviceId: string;
  userId?: string;
  preferredDate: Date;
  preferredTime: string;
  preferredTimeRangeStart?: string;
  preferredTimeRangeEnd?: string;
  locationType: 'studio' | 'online' | 'fitness';
  groupSize: number;
  flexibleWithTime: boolean;
  flexibleWithLocation: boolean;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  status: 'active' | 'promoted' | 'cancelled' | 'expired';
  priorityScore: number;
  autoPromoteEligible: boolean;
  promotionAttempts: number;
  maxPromotionAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingRule {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  ruleType: 'group_discount' | 'time_based' | 'seasonal' | 'demand_based' | 'early_bird' | 'last_minute';
  configuration: Record<string, any>;
  minGroupSize?: number;
  maxGroupSize?: number;
  validFrom?: Date;
  validUntil?: Date;
  validDays?: string[];
  validTimeStart?: string;
  validTimeEnd?: string;
  priority: number;
  isStackable: boolean;
  isActive: boolean;
}

export interface AppliedPricingRule {
  ruleId: string;
  ruleType: string;
  discountPercentage?: number;
  appliedAmount: number;
  description?: string;
}

export interface GroupBooking {
  id: string;
  groupName?: string;
  groupSize: number;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  serviceId: string;
  bookingDate: Date;
  bookingTime: string;
  locationType: 'studio' | 'online' | 'fitness';
  basePricePerPerson: number;
  discountPercentage: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  depositRequired: boolean;
  depositAmount: number;
  depositPaid: boolean;
  participants: GroupParticipant[];
  createdAt: Date;
  updatedAt: Date;
  creatorUserId?: string;
}

export interface BookingChange {
  id: string;
  bookingId: string;
  userId?: string;
  changeType: 'created' | 'rescheduled' | 'cancelled' | 'modified_details' | 'status_changed';
  oldDate?: Date;
  oldTime?: string;
  oldServiceId?: string;
  oldStatus?: string;
  newDate?: Date;
  newTime?: string;
  newServiceId?: string;
  newStatus?: string;
  reason?: string;
  changedBy?: string;
  systemGenerated: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface EnhancedBooking extends BookingData {
  // Group booking support
  isGroupBooking?: boolean;
  groupSize?: number;
  groupBookingId?: string;
  participants?: GroupParticipant[];

  // Dynamic pricing
  originalPrice?: number;
  discountAmount?: number;
  appliedPricingRules?: AppliedPricingRule[];
  finalPrice?: number;

  // Waitlist
  waitlistEntryId?: string;

  // Rescheduling
  rescheduleCount?: number;
  lastRescheduledAt?: Date;

  // Capacity and availability
  capacityInfo?: TimeSlotWithCapacity;
}

