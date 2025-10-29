import { faker } from '@faker-js/faker';

import {
  Service,
  Booking,
  AvailabilitySlot,
  Profile,
  ServiceCategory,
  BookingStatus,
  PaymentStatus,
  ServiceType,
  LocationType
} from '@/integrations/supabase/types';

// Set a deterministic seed for reproducible tests
faker.seed(54321);

// ==================== SERVICE FACTORIES ====================

export const createServiceCategory = (overrides: Partial<ServiceCategory> = {}): ServiceCategory => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['Beauty', 'Fitness', 'Lifestyle', 'Wellness']),
  slug: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
  description: faker.lorem.paragraph(),
  icon: faker.helpers.arrayElement(['sparkles', 'dumbbell', 'heart', 'leaf']),
  color: faker.helpers.arrayElement(['#8B4513', '#D4AF37', '#F5DEB3', '#CD853F']),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createExtendedService = (overrides: Partial<Service> = {}): Service => ({
  id: faker.string.uuid(),
  title: faker.helpers.arrayElement([
    'Lash Enhancement',
    'Brow Lamination',
    'Lip Blush',
    'Personal Training',
    'Yoga Class',
    'Massage Therapy'
  ]),
  slug: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
  description: faker.lorem.paragraphs(2),
  category: faker.helpers.arrayElement(['beauty', 'fitness', 'lifestyle']),
  service_type: faker.helpers.arrayElement(['individual', 'group', 'consultation']),
  duration: faker.helpers.arrayElement([30, 45, 60, 90, 120]),
  price: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
  currency: faker.helpers.arrayElement(['PLN', 'EUR', 'USD']),
  price_display: {
    amount: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
    currency: faker.helpers.arrayElement(['PLN', 'EUR', 'USD']),
    formatted: `${faker.number.float({ min: 50, max: 500, precision: 0.01})} PLN`,
  },
  image_url: faker.image.url({ width: 800, height: 600 }),
  gallery_urls: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
    faker.image.url({ width: 800, height: 600 })
  ),
  video_url: faker.datatype.boolean(0.3) ? faker.internet.url() : null,
  is_active: true,
  featured: faker.datatype.boolean(0.2),
  tags: faker.helpers.arrayElements([
    'popular', 'new', 'limited', 'advanced', 'beginner',
    'anti-aging', 'relaxing', 'intensive', 'express'
  ], { min: 1, max: 4 }),
  faqs: Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () => ({
    question: faker.lorem.sentence() + '?',
    answer: faker.lorem.paragraph(),
    order: faker.number.int({ min: 1, max: 10 })
  })),
  preparation: faker.lorem.paragraphs(2),
  aftercare: faker.lorem.paragraphs(2),
  expectations: faker.lorem.paragraphs(2),
  contraindications: faker.lorem.paragraphs(2),
  pricing_details: faker.lorem.paragraphs(2),
  requirements: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
    faker.lorem.sentence()
  ),
  benefits: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () =>
    faker.lorem.sentence()
  ),
  meta_title: faker.lorem.sentence(),
  meta_description: faker.lorem.sentences(2),
  meta_keywords: faker.helpers.arrayElements([
    'beauty', 'warsaw', 'cosmetic', 'treatment', 'fitness',
    'wellness', 'spa', 'laser', 'brows', 'lashes'
  ], { min: 5, max: 10 }),
  locations: faker.helpers.arrayElements([
    'warsaw-center', 'warsaw-praga', 'warsaw-wola', 'online'
  ], { min: 1, max: 2 }),
  capacity: {
    min: 1,
    max: faker.helpers.arrayElement([1, 4, 8, 12])
  },
  booking_settings: {
    advance_notice: faker.number.int({ min: 24, max: 168 }), // hours
    cancellation_policy: faker.number.int({ min: 24, max: 72 }), // hours
    reschedule_policy: faker.number.int({ min: 12, max: 48 }), // hours
    deposit_required: faker.datatype.boolean(0.3),
    deposit_amount: faker.datatype.boolean(0.3) ? faker.number.float({ min: 20, max: 100, precision: 0.01 }) : null,
  },
  availability: {
    monday: faker.datatype.boolean(),
    tuesday: faker.datatype.boolean(),
    wednesday: faker.datatype.boolean(),
    thursday: faker.datatype.boolean(),
    friday: faker.datatype.boolean(),
    saturday: faker.datatype.boolean(0.6),
    sunday: faker.datatype.boolean(0.3),
  },
  created_at: faker.date.past({ years: 2 }).toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// ==================== BOOKING FACTORIES ====================

export const createExtendedBooking = (overrides: Partial<Booking> = {}): Booking => {
  const startTime = faker.date.soon({ days: 30, refDate: new Date() });
  const endTime = new Date(startTime.getTime() + faker.helpers.arrayElement([30, 60, 90, 120]) * 60000);

  return {
    id: faker.string.uuid(),
    service_id: faker.string.uuid(),
    client_id: faker.string.uuid(),
    client_email: faker.internet.email(),
    client_name: faker.person.fullName(),
    client_phone: faker.phone.number(),
    client_address: {
      street: faker.location.streetAddress(),
      city: 'Warsaw',
      postal_code: faker.location.zipCode('##-###'),
      country: 'Poland'
    },
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    timezone: 'Europe/Warsaw',
    status: faker.helpers.weightedArrayElement([
      { weight: 30, value: 'pending' },
      { weight: 40, value: 'confirmed' },
      { weight: 10, value: 'cancelled' },
      { weight: 15, value: 'completed' },
      { weight: 5, value: 'no_show' }
    ]) as BookingStatus,
    payment_status: faker.helpers.weightedArrayElement([
      { weight: 20, value: 'pending' },
      { weight: 40, value: 'paid' },
      { weight: 10, value: 'refunded' },
      { weight: 5, value: 'failed' },
      { weight: 25, value: 'not_required' }
    ]) as PaymentStatus,
    total_amount: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
    currency: 'PLN',
    discount_amount: faker.datatype.boolean(0.2) ? faker.number.float({ min: 5, max: 50, precision: 0.01 }) : null,
    deposit_amount: faker.datatype.boolean(0.3) ? faker.number.float({ min: 20, max: 100, precision: 0.01 }) : null,
    notes: faker.lorem.paragraphs(2),
    preferences: {
      style: faker.helpers.arrayElement(['natural', 'bold', 'dramatic', 'subtle']),
      intensity: faker.helpers.arrayElement(['light', 'medium', 'strong']),
      focus_areas: faker.helpers.arrayElements(['eyes', 'lips', 'brows', 'skin', 'body'], { min: 1, max: 3 }),
      allergies: faker.datatype.boolean(0.1) ? faker.lorem.words(3) : null,
      previous_treatments: faker.lorem.sentences(faker.number.int({ min: 0, max: 3 })),
    },
    source: faker.helpers.arrayElement([
      'direct', 'instagram', 'facebook', 'google', 'referral',
      'booksy', 'word_of_mouth', 'email', 'ads'
    ]),
    external_id: faker.datatype.boolean(0.3) ? faker.string.alphanumeric(10) : null,
    external_calendar: {
      booksy_id: faker.datatype.boolean(0.3) ? faker.string.uuid() : null,
      google_event_id: faker.datatype.boolean(0.4) ? faker.string.uuid() : null,
      synced_at: faker.datatype.boolean(0.5) ? faker.date.recent().toISOString() : null,
    },
    staff_id: faker.string.uuid(),
    location: faker.helpers.arrayElement([
      'warsaw-center', 'warsaw-praga', 'warsaw-wola', 'online'
    ]),
    room: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E']),
    reminder_sent: faker.datatype.boolean(),
    feedback_requested: faker.datatype.boolean(),
    feedback_rating: faker.datatype.boolean(0.6) ? faker.number.int({ min: 1, max: 5 }) : null,
    feedback_comment: faker.datatype.boolean(0.4) ? faker.lorem.paragraph() : null,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    cancelled_at: faker.datatype.boolean(0.2) ? faker.date.recent().toISOString() : null,
    cancellation_reason: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
    ...overrides,
  };
};

// ==================== AVAILABILITY FACTORIES ====================

export const createExtendedAvailabilitySlot = (overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot => {
  const startTime = faker.date.soon({ days: 30, refDate: new Date() });
  const duration = faker.helpers.arrayElement([30, 60, 90, 120]);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  return {
    id: faker.string.uuid(),
    service_id: faker.string.uuid(),
    service_type: faker.helpers.arrayElement(['individual', 'group', 'consultation']),
    staff_id: faker.string.uuid(),
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    is_available: faker.datatype.boolean(0.8),
    max_bookings: faker.helpers.arrayElement([1, 2, 4, 8]),
    current_bookings: faker.number.int({ min: 0, max: 4 }),
    resource_id: faker.string.uuid(),
    location: faker.helpers.arrayElement([
      'warsaw-center', 'warsaw-praga', 'warsaw-wola', 'online'
    ]),
    room: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E']),
    equipment: faker.helpers.arrayElements([
      'massage_table', 'laser_device', 'microscope', 'lights',
      'camera', 'mirrors', 'chairs', 'speakers'
    ], { min: 0, max: 4 }),
    special_notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
    priority_level: faker.helpers.arrayElement(['low', 'normal', 'high']),
    buffer_before: faker.number.int({ min: 0, max: 30 }),
    buffer_after: faker.number.int({ min: 0, max: 30 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
};

// ==================== PROFILE FACTORIES ====================

export const createExtendedProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  full_name: faker.person.fullName(),
  phone: faker.phone.number(),
  date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
  avatar_url: faker.image.avatar(),
  role: faker.helpers.weightedArrayElement([
    { weight: 90, value: 'client' },
    { weight: 5, value: 'staff' },
    { weight: 3, value: 'admin' },
    { weight: 2, value: 'super_admin' }
  ]),
  bio: faker.lorem.paragraphs(2),
  website: faker.datatype.boolean(0.2) ? faker.internet.url() : null,
  social_media: {
    instagram: faker.datatype.boolean(0.4) ? `@${faker.internet.displayName()}` : null,
    facebook: faker.datatype.boolean(0.3) ? faker.internet.url() : null,
    linkedin: faker.datatype.boolean(0.2) ? faker.internet.url() : null,
  },
  preferences: {
    language: faker.helpers.arrayElement(['en', 'pl']),
    currency: 'PLN',
    notifications: {
      email: faker.datatype.boolean(),
      sms: faker.datatype.boolean(0.7),
      push: faker.datatype.boolean(0.8),
    },
    marketing_emails: faker.datatype.boolean(0.4),
    appointment_reminders: true,
    newsletter: faker.datatype.boolean(0.5),
    theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
  },
  consents: {
    gdpr: true,
    marketing: faker.datatype.boolean(0.4),
    analytics: faker.datatype.boolean(0.6),
    cookies: true,
    data_processing: true,
  },
  addresses: [
    {
      type: 'billing',
      street: faker.location.streetAddress(),
      city: 'Warsaw',
      postal_code: faker.location.zipCode('##-###'),
      country: 'Poland',
      is_primary: true,
    }
  ],
  payment_methods: faker.datatype.boolean(0.6) ? [
    {
      type: 'card',
      last_four: faker.finance.creditCardNumber().slice(-4),
      brand: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
      expiry_month: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0'),
      expiry_year: (new Date().getFullYear() + faker.number.int({ min: 1, max: 5 })).toString(),
      is_default: true,
    }
  ] : [],
  stats: {
    total_bookings: faker.number.int({ min: 0, max: 100 }),
    total_spent: faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
    last_booking: faker.datatype.boolean(0.7) ? faker.date.past().toISOString() : null,
    favorite_services: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
      faker.string.uuid()
    ),
    loyalty_points: faker.number.int({ min: 0, max: 1000 }),
    membership_tier: faker.helpers.arrayElement(['bronze', 'silver', 'gold', 'platinum']),
    referral_count: faker.number.int({ min: 0, max: 10 }),
    cancellation_rate: faker.number.float({ min: 0, max: 0.3, precision: 0.01 }),
    no_show_rate: faker.number.float({ min: 0, max: 0.2, precision: 0.01 }),
  },
  membership: {
    tier: faker.helpers.arrayElement(['none', 'bronze', 'silver', 'gold', 'platinum']),
    joined_at: faker.datatype.boolean(0.6) ? faker.date.past().toISOString() : null,
    expires_at: faker.datatype.boolean(0.4) ? faker.date.future().toISOString() : null,
    benefits: faker.helpers.arrayElements([
      'priority_booking', 'discounts', 'free_cancellation',
      'exclusive_services', 'priority_support'
    ], { min: 0, max: 5 }),
  },
  created_at: faker.date.past({ years: 2 }).toISOString(),
  updated_at: faker.date.recent().toISOString(),
  last_sign_in_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

// ==================== SPECIALIZED FACTORIES ====================

export const createBookingFlowScenario = (type: 'new-client' | 'returning-client' | 'group-booking' | 'consultation') => {
  switch (type) {
    case 'new-client':
      return {
        client: createExtendedProfile({
          stats: { total_bookings: 0, total_spent: 0, last_booking: null }
        }),
        service: createExtendedService({
          category: 'beauty',
          service_type: 'individual',
          duration: 60,
          price: 200,
        }),
        slots: createAvailabilitySlots(5, {
          is_available: true,
          max_bookings: 1,
          current_bookings: 0,
        }),
        expectedBooking: createExtendedBooking({
          status: 'pending',
          source: 'direct',
        }),
      };

    case 'returning-client':
      return {
        client: createExtendedProfile({
          stats: {
            total_bookings: faker.number.int({ min: 5, max: 50 }),
            total_spent: faker.number.float({ min: 500, max: 5000, precision: 0.01 }),
            last_booking: faker.date.past().toISOString()
          }
        }),
        service: createExtendedService({
          featured: true,
          price: 250,
        }),
        slots: createAvailabilitySlots(3, {
          is_available: true,
        }),
        expectedBooking: createExtendedBooking({
          status: 'confirmed',
          source: 'referral',
        }),
      };

    case 'group-booking':
      return {
        client: createExtendedProfile(),
        service: createExtendedService({
          service_type: 'group',
          capacity: { min: 4, max: 8 },
          price: 150,
        }),
        slots: createAvailabilitySlots(2, {
          max_bookings: 8,
          current_bookings: faker.number.int({ min: 0, max: 4 }),
        }),
        participants: Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () =>
          createExtendedProfile({ role: 'client' })
        ),
        expectedBooking: createExtendedBooking({
          status: 'pending',
          notes: 'Group booking request',
        }),
      };

    case 'consultation':
      return {
        client: createExtendedProfile(),
        service: createExtendedService({
          service_type: 'consultation',
          duration: 30,
          price: 50,
          category: 'beauty',
        }),
        slots: createAvailabilitySlots(3, {
          location: 'online',
        }),
        expectedBooking: createExtendedBooking({
          status: 'confirmed',
          location: 'online',
          notes: 'Online consultation requested',
        }),
      };
  }
};

export const createAdminDashboardData = () => ({
  services: {
    total: faker.number.int({ min: 20, max: 50 }),
    active: faker.number.int({ min: 15, max: 40 }),
    featured: faker.number.int({ min: 5, max: 15 }),
    categories: faker.helpers.arrayElements(['beauty', 'fitness', 'lifestyle'], { min: 2, max: 3 }),
  },
  bookings: {
    today: createBookings(faker.number.int({ min: 5, max: 20 }), {
      start_time: new Date().toISOString(),
    }),
    thisWeek: createBookings(faker.number.int({ min: 30, max: 100 })),
    thisMonth: createBookings(faker.number.int({ min: 100, max: 400 })),
    pending: createBookings(faker.number.int({ min: 5, max: 15 }), {
      status: 'pending'
    }),
    cancelled: createBookings(faker.number.int({ min: 5, max: 20 }), {
      status: 'cancelled'
    }),
    completed: createBookings(faker.number.int({ min: 20, max: 80 }), {
      status: 'completed'
    }),
    revenue: {
      today: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
      thisWeek: faker.number.float({ min: 10000, max: 50000, precision: 0.01 }),
      thisMonth: faker.number.float({ min: 50000, max: 200000, precision: 0.01 }),
    },
  },
  clients: {
    total: faker.number.int({ min: 100, max: 500 }),
    new: createProfiles(faker.number.int({ min: 5, max: 20 })),
    returning: faker.number.int({ min: 50, max: 200 }),
    vip: faker.number.int({ min: 10, max: 50 }),
  },
  reviews: {
    average: faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 }),
    total: faker.number.int({ min: 50, max: 300 }),
    pending: faker.number.int({ min: 0, max: 10 }),
    recent: Array.from({ length: 5 }, () => ({
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.paragraph(),
      client: faker.person.fullName(),
      service: faker.helpers.arrayElement(['Lash Enhancement', 'Brow Lamination', 'Personal Training']),
      date: faker.date.recent().toISOString(),
    })),
  },
});

// ==================== BULK CREATION HELPERS ====================

export const createServices = (count: number, overrides?: Partial<Service>) =>
  Array.from({ length: count }, () => createExtendedService(overrides));

export const createBookings = (count: number, overrides?: Partial<Booking>) =>
  Array.from({ length: count }, () => createExtendedBooking(overrides));

export const createAvailabilitySlots = (count: number, overrides?: Partial<AvailabilitySlot>) =>
  Array.from({ length: count }, () => createExtendedAvailabilitySlot(overrides));

export const createProfiles = (count: number, overrides?: Partial<Profile>) =>
  Array.from({ length: count }, () => createExtendedProfile(overrides));

export const createServiceCategories = (count: number, overrides?: Partial<ServiceCategory>) =>
  Array.from({ length: count }, () => createServiceCategory(overrides));

// ==================== MOCK DATA GENERATORS ====================

export const generateMockDatabase = () => ({
  services: createServices(20),
  categories: createServiceCategories(4),
  bookings: createBookings(100),
  profiles: createProfiles(50),
  availabilitySlots: createAvailabilitySlots(200),
});

// Export all factories
export {
  createExtendedService as createService,
  createExtendedBooking as createBooking,
  createExtendedAvailabilitySlot as createAvailabilitySlot,
  createExtendedProfile as createProfile,
};

export default {
  createService: createExtendedService,
  createBooking: createExtendedBooking,
  createAvailabilitySlot: createExtendedAvailabilitySlot,
  createProfile: createExtendedProfile,
  createServiceCategory,
  createServices,
  createBookings,
  createAvailabilitySlots,
  createProfiles,
  createServiceCategories,
  createBookingFlowScenario,
  createAdminDashboardData,
  generateMockDatabase,
};