import { Service, ServiceType, BookingStatus } from './booking';

// User Portal Types
export interface UserAddress {
  id: string;
  user_id: string;
  label: 'home' | 'work' | 'other';
  address: {
    street: string;
    city: string;
    postal_code: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  service_id: string;
  provider_id?: string;
  notes?: string;
  created_at: string;
  service?: Service;
  provider?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: 'booking_reminder' | 'booking_confirmation' | 'promotional' | 'review_request' | 'new_message';
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserDashboardStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_services: number;
  favorite_services: number;
  loyalty_points?: number;
  next_appointment?: {
    id: string;
    service_name: string;
    date: string;
    time: string;
    location: string;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  color: string;
}

export interface BookingHistoryFilter {
  status?: BookingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  serviceType?: ServiceType[];
  provider?: string;
}

export interface ServiceComparison {
  services: Service[];
  criteria: {
    price: boolean;
    duration: boolean;
    location: boolean;
    rating: boolean;
    features: boolean;
  };
}

export interface PersonalizedRecommendation {
  service: Service;
  reason: string;
  confidence: number;
  category: 'similar' | 'popular' | 'trending' | 'recommended';
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    notifications: NotificationPreference[];
  };
  created_at: string;
  updated_at: string;
}

export interface BookingCard {
  id: string;
  service_name: string;
  provider_name: string;
  date: string;
  time: string;
  duration: number;
  status: BookingStatus;
  price: number;
  location: string;
  image_url?: string;
  can_reschedule: boolean;
  can_cancel: boolean;
  review_submitted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: number;
  type: 'booking' | 'reminder' | 'unavailable';
  status?: BookingStatus;
  location?: string;
  service_id?: string;
}