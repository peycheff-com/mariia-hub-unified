// Re-export all types from the new domain-specific structure
export type {
  Json,
  Database,
  AuthTables,
  BookingTables,
  LoyaltyTables,
  CommunicationTables,
  ContentTables,
  FeedbackTables,
  PricingTables,
  ConsentTables,
  WaitlistTables,
  ReferralTables,
  NewsletterTables,
  ReviewsTables,
  LocationsTables,
  IntegrationTables
} from './types/index'

// Legacy exports for backward compatibility
export type {
  AuthTables as Auth,
  BookingTables as Booking,
  LoyaltyTables as Loyalty,
  CommunicationTables as Communication,
  ContentTables as Content,
  FeedbackTables as Feedback,
  PricingTables as Pricing,
  ConsentTables as Consent,
  WaitlistTables as Waitlist,
  ReferralTables as Referral,
  NewsletterTables as Newsletter,
  ReviewsTables as Reviews,
  LocationsTables as Locations,
  IntegrationTables as Integration
} from './types/index'