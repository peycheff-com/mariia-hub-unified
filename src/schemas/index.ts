import { z } from 'zod';

// Common schemas
export const EmailSchema = z.string().email('Please enter a valid email address');
export const PhoneSchema = z.string()
  .min(9, 'Phone number must be at least 9 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number');
export const NameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Booking schemas
export const BookingStep1Schema = z.object({
  serviceId: z.string().uuid('Please select a valid service'),
  serviceType: z.enum(['beauty', 'fitness'], {
    required_error: 'Please select a service type'
  }),
  locationId: z.string().uuid('Please select a location'),
  durationMinutes: z.number().positive('Duration must be positive'),
  selectedAddOns: z.array(z.string().uuid()).optional().default([])
});

export const BookingStep2Schema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Please select a future date'),
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please select a valid time')
});

export const BookingStep3Schema = z.object({
  fullName: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
  consent: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  marketingConsent: z.boolean().optional()
});

export const BookingStep4Schema = z.object({
  paymentMethod: z.enum(['card', 'cash'], {
    required_error: 'Please select a payment method'
  }),
  stripePaymentIntentId: z.string().optional()
});

// Complete booking schema
export const CreateBookingSchema = z.object({
  service_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string(),
  time: z.string(),
  client_name: NameSchema,
  client_email: EmailSchema,
  client_phone: PhoneSchema,
  notes: z.string().max(500).optional(),
  payment_method: z.enum(['card', 'cash']).optional(),
  stripe_payment_intent_id: z.string().optional()
});

// Service schemas
export const CreateServiceSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  service_type: z.enum(['beauty', 'fitness', 'lifestyle']),
  duration_minutes: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must not exceed 8 hours'),
  price_from: z.number()
    .min(0, 'Price must be positive')
    .max(999999, 'Price is too high'),
  price_to: z.number()
    .min(0, 'Price must be positive')
    .max(999999, 'Price is too high')
    .optional(),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters'),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true)
}).refine(
  (data) => !data.price_to || data.price_to >= data.price_from,
  {
    message: 'Price to must be greater than or equal to price from',
    path: ['price_to']
  }
);

// User schemas
export const UpdateProfileSchema = z.object({
  full_name: NameSchema.optional(),
  phone: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  preferences: z.object({
    language: z.enum(['en', 'pl']).optional(),
    currency: z.enum(['PLN', 'EUR', 'USD']).optional(),
    marketing_consent: z.boolean().optional()
  }).optional()
});

// Review schemas
export const CreateReviewSchema = z.object({
  service_id: z.string().uuid(),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  comment: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review must not exceed 1000 characters'),
  is_public: z.boolean().default(true)
});

// Contact schemas
export const ContactFormSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  consent: z.boolean().refine(val => val === true, 'You must agree to the privacy policy')
});

// Admin schemas
export const AdminLoginSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
});

// Newsletter subscription
export const NewsletterSchema = z.object({
  email: EmailSchema,
  consent: z.boolean().refine(val => val === true, 'You must agree to receive newsletters')
});

// Export all schemas for easy importing
export const schemas = {
  Email: EmailSchema,
  Phone: PhoneSchema,
  Name: NameSchema,
  BookingStep1: BookingStep1Schema,
  BookingStep2: BookingStep2Schema,
  BookingStep3: BookingStep3Schema,
  BookingStep4: BookingStep4Schema,
  CreateBooking: CreateBookingSchema,
  CreateService: CreateServiceSchema,
  UpdateProfile: UpdateProfileSchema,
  CreateReview: CreateReviewSchema,
  ContactForm: ContactFormSchema,
  AdminLogin: AdminLoginSchema,
  Newsletter: NewsletterSchema
};

// Type inference from schemas
export type BookingStep1Type = z.infer<typeof BookingStep1Schema>;
export type BookingStep2Type = z.infer<typeof BookingStep2Schema>;
export type BookingStep3Type = z.infer<typeof BookingStep3Schema>;
export type BookingStep4Type = z.infer<typeof BookingStep4Schema>;
export type CreateBookingType = z.infer<typeof CreateBookingSchema>;
export type CreateServiceType = z.infer<typeof CreateServiceSchema>;
export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>;
export type CreateReviewType = z.infer<typeof CreateReviewSchema>;
export type ContactFormType = z.infer<typeof ContactFormSchema>;
export type AdminLoginType = z.infer<typeof AdminLoginSchema>;
export type NewsletterType = z.infer<typeof NewsletterSchema>;