import { faker } from '@faker-js/faker';

import { Service, Booking, AvailabilitySlot, Profile } from '@/integrations/supabase/types';

// Seed faker for consistent test data
faker.seed(12345);

export const createService = (overrides: Partial<Service> = {}): Service => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  category: faker.helpers.arrayElement(['beauty', 'fitness', 'lifestyle']),
  duration: faker.helpers.arrayElement([30, 60, 90, 120]),
  price: faker.number.int({ min: 50, max: 500 }),
  currency: faker.helpers.arrayElement(['PLN', 'EUR', 'USD']),
  image_url: faker.image.url(),
  gallery_urls: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
    faker.image.url()
  ),
  is_active: faker.datatype.boolean(),
  featured: faker.datatype.boolean(),
  tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
    faker.lorem.word()
  ),
  faqs: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    question: faker.lorem.sentence(),
    answer: faker.lorem.paragraph(),
  })),
  preparation: faker.lorem.paragraph(),
  aftercare: faker.lorem.paragraph(),
  expectations: faker.lorem.paragraph(),
  contraindications: faker.lorem.paragraph(),
  pricing_details: faker.lorem.paragraph(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: faker.string.uuid(),
  service_id: faker.string.uuid(),
  client_email: faker.internet.email(),
  client_name: faker.person.fullName(),
  client_phone: faker.phone.number(),
  start_time: faker.date.future().toISOString(),
  end_time: faker.date.future({ refDate: faker.date.future() }).toISOString(),
  status: faker.helpers.arrayElement([
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
  ]),
  total_amount: faker.number.int({ min: 50, max: 500 }),
  currency: faker.helpers.arrayElement(['PLN', 'EUR', 'USD']),
  notes: faker.lorem.paragraph(),
  preferences: faker.lorem.words(5),
  source: faker.helpers.arrayElement(['direct', 'instagram', 'referral', 'google', 'word_of_mouth']),
  external_id: faker.string.alphanumeric(10),
  payment_intent_id: faker.string.alphanumeric(20),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createAvailabilitySlot = (overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot => ({
  id: faker.string.uuid(),
  service_id: faker.string.uuid(),
  start_time: faker.date.future().toISOString(),
  end_time: faker.date.future({ refDate: faker.date.future() }).toISOString(),
  is_available: faker.datatype.boolean(),
  max_bookings: faker.number.int({ min: 1, max: 5 }),
  current_bookings: faker.number.int({ min: 0, max: 4 }),
  resource_id: faker.string.uuid(),
  location: faker.helpers.arrayElement(['warsaw-center', 'warsaw-praga', 'online']),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  full_name: faker.person.fullName(),
  phone: faker.phone.number(),
  avatar_url: faker.image.url(),
  role: 'client',
  preferences: {
    language: faker.helpers.arrayElement(['en', 'pl']),
    currency: faker.helpers.arrayElement(['PLN', 'EUR', 'USD']),
    notifications: faker.datatype.boolean(),
    marketing_emails: faker.datatype.boolean(),
  },
  consents: {
    gdpr: faker.datatype.boolean(),
    marketing: faker.datatype.boolean(),
    analytics: faker.datatype.boolean(),
  },
  stats: {
    total_bookings: faker.number.int({ min: 0, max: 100 }),
    total_spent: faker.number.int({ min: 0, max: 10000 }),
    last_booking: faker.date.past().toISOString(),
    favorite_services: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
      faker.string.uuid()
    ),
  },
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  last_sign_in_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Create arrays of test data
export const createServices = (count: number, overrides?: Partial<Service>) =>
  Array.from({ length: count }, () => createService(overrides));

export const createBookings = (count: number, overrides?: Partial<Booking>) =>
  Array.from({ length: count }, () => createBooking(overrides));

export const createAvailabilitySlots = (count: number, overrides?: Partial<AvailabilitySlot>) =>
  Array.from({ length: count }, () => createAvailabilitySlot(overrides));

// Specific test scenarios
export const createBookingFlowData = () => ({
  service: createService({
    category: 'beauty',
    duration: 60,
    price: 200,
    currency: 'PLN',
  }),
  slots: createAvailabilitySlots(5, {
    is_available: true,
    max_bookings: 1,
    current_bookings: 0,
  }),
  existingBooking: createBooking({
    status: 'confirmed',
  }),
});

export const createAdminTestData = () => ({
  services: createServices(10),
  bookings: createBookings(20),
  pendingBookings: createBookings(5, { status: 'pending' }),
  todayBookings: createBookings(3, {
    start_time: new Date().toISOString(),
  }),
});

export default {
  createService,
  createBooking,
  createAvailabilitySlot,
  createProfile,
  createServices,
  createBookings,
  createAvailabilitySlots,
  createBookingFlowData,
  createAdminTestData,
};