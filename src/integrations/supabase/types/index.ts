// Import all domain-specific types
export type { Json } from './auth.types'
export type { AuthTables } from './auth.types'
export type { BookingTables } from './booking.types'
export type { LoyaltyTables } from './loyalty.types'
export type { CommunicationTables } from './communication.types'
export type { ContentTables } from './content.types'
export type { FeedbackTables } from './feedback.types'
export type { PricingTables } from './pricing.types'
export type { ConsentTables } from './consent.types'
export type { WaitlistTables } from './waitlist.types'
export type { ReferralTables } from './referral.types'
export type { NewsletterTables } from './newsletter.types'
export type { ReviewsTables } from './reviews.types'
export type { LocationsTables } from './locations.types'
export type { IntegrationTables } from './integration.types'

// Combine all table types into a single Database interface
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: AuthTables & BookingTables & LoyaltyTables &
            CommunicationTables & ContentTables & FeedbackTables &
            PricingTables & ConsentTables & WaitlistTables &
            ReferralTables & NewsletterTables & ReviewsTables &
            LocationsTables & IntegrationTables
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}