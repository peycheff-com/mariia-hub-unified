/**
 * Customer Segmentation System
 * Advanced algorithms for customer categorization and behavioral analysis
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type CustomerSegment = Database['public']['Tables']['customer_segments']['Row']
type CustomerSegmentMembership = Database['public']['Tables']['customer_segment_memberships']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']

interface SegmentationCriteria {
  minBookings?: number
  maxBookings?: number
  minRevenue?: number
  maxRevenue?: number
  serviceTypes?: string[]
  locationTypes?: string[]
  daysSinceLastBooking?: number
  bookingFrequency?: 'high' | 'medium' | 'low'
  averageBookingValue?: 'high' | 'medium' | 'low'
  preferredDays?: string[]
  preferredTimes?: string[]
  churnRisk?: 'high' | 'medium' | 'low'
  loyaltyScore?: number
  engagementScore?: number
  customRules?: Array<{
    field: string
    operator: 'gt' | 'lt' | 'eq' | 'in' | 'not_in'
    value: any
  }>
}

interface CustomerProfile {
  userId: string
  totalBookings: number
  totalRevenue: number
  averageBookingValue: number
  firstBookingDate: string | null
  lastBookingDate: string | null
  daysSinceLastBooking: number | null
  bookingFrequency: number // bookings per month
  preferredServiceTypes: string[]
  preferredLocationTypes: string[]
  preferredDays: string[]
  preferredTimes: string[]
  churnRisk: 'high' | 'medium' | 'low'
  loyaltyScore: number
  engagementScore: number
  lifetimeValue: number
  customAttributes: Record<string, any>
}

interface SegmentDefinition {
  name: string
  description: string
  segmentType: 'behavioral' | 'demographic' | 'value_based' | 'predictive'
  criteria: SegmentationCriteria
  priority: number
  autoUpdate: boolean
}

class CustomerSegmentationEngine {
  private static instance: CustomerSegmentationEngine

  private constructor() {}

  public static getInstance(): CustomerSegmentationEngine {
    if (!CustomerSegmentationEngine.instance) {
      CustomerSegmentationEngine.instance = new CustomerSegmentationEngine()
    }
    return CustomerSegmentationEngine.instance
  }

  /**
   * Build comprehensive customer profile from booking and analytics data
   */
  public async buildCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    try {
      // Get user's booking data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(service_type, title, price),
          availability_slots(location_type)
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'completed'])
        .order('booking_date', { ascending: false })

      if (bookingsError) throw bookingsError

      if (!bookings || bookings.length === 0) {
        return null
      }

      // Get user's analytics events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (eventsError) throw eventsError

      // Calculate basic metrics
      const totalBookings = bookings.length
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0)
      const averageBookingValue = totalRevenue / totalBookings
      const firstBookingDate = bookings[bookings.length - 1]?.booking_date
      const lastBookingDate = bookings[0]?.booking_date

      // Calculate days since last booking
      const daysSinceLastBooking = lastBookingDate
        ? Math.floor((new Date().getTime() - new Date(lastBookingDate).getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Calculate booking frequency (bookings per month)
      const bookingSpan = firstBookingDate
        ? (new Date(lastBookingDate!).getTime() - new Date(firstBookingDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 1
      const bookingFrequency = totalBookings / Math.max(bookingSpan, 1)

      // Analyze preferences
      const serviceTypeCounts = this.countOccurrences(
        bookings.map(b => b.services?.service_type).filter(Boolean) as string[]
      )
      const locationTypeCounts = this.countOccurrences(
        bookings.map(b => b.availability_slots?.location_type).filter(Boolean) as string[]
      )

      // Extract preferred days and times from booking dates
      const { preferredDays, preferredTimes } = this.extractTimePreferences(bookings)

      // Calculate churn risk
      const churnRisk = this.calculateChurnRisk(daysSinceLastBooking, bookingFrequency, totalRevenue)

      // Calculate loyalty and engagement scores
      const loyaltyScore = this.calculateLoyaltyScore(totalBookings, totalRevenue, daysSinceLastBooking)
      const engagementScore = this.calculateEngagementScore(events || [])

      // Calculate customer lifetime value (CLV)
      const lifetimeValue = this.calculateLifetimeValue(totalBookings, averageBookingValue, bookingFrequency)

      return {
        userId,
        totalBookings,
        totalRevenue,
        averageBookingValue,
        firstBookingDate,
        lastBookingDate,
        daysSinceLastBooking,
        bookingFrequency,
        preferredServiceTypes: Object.keys(serviceTypeCounts).sort((a, b) => serviceTypeCounts[b] - serviceTypeCounts[a]),
        preferredLocationTypes: Object.keys(locationTypeCounts).sort((a, b) => locationTypeCounts[b] - locationTypeCounts[a]),
        preferredDays,
        preferredTimes,
        churnRisk,
        loyaltyScore,
        engagementScore,
        lifetimeValue,
        customAttributes: {}
      }
    } catch (error) {
      console.error('Error building customer profile:', error)
      return null
    }
  }

  /**
   * Check if a customer profile matches segmentation criteria
   */
  public matchesCriteria(profile: CustomerProfile, criteria: SegmentationCriteria): boolean {
    // Booking count criteria
    if (criteria.minBookings !== undefined && profile.totalBookings < criteria.minBookings) {
      return false
    }
    if (criteria.maxBookings !== undefined && profile.totalBookings > criteria.maxBookings) {
      return false
    }

    // Revenue criteria
    if (criteria.minRevenue !== undefined && profile.totalRevenue < criteria.minRevenue) {
      return false
    }
    if (criteria.maxRevenue !== undefined && profile.totalRevenue > criteria.maxRevenue) {
      return false
    }

    // Service type preferences
    if (criteria.serviceTypes && criteria.serviceTypes.length > 0) {
      const hasPreferredService = criteria.serviceTypes.some(service =>
        profile.preferredServiceTypes.includes(service)
      )
      if (!hasPreferredService) return false
    }

    // Location type preferences
    if (criteria.locationTypes && criteria.locationTypes.length > 0) {
      const hasPreferredLocation = criteria.locationTypes.some(location =>
        profile.preferredLocationTypes.includes(location)
      )
      if (!hasPreferredLocation) return false
    }

    // Recency criteria
    if (criteria.daysSinceLastBooking !== undefined && profile.daysSinceLastBooking !== null) {
      if (criteria.daysSinceLastBooking < 0) {
        // Last booking within X days
        if (profile.daysSinceLastBooking > Math.abs(criteria.daysSinceLastBooking)) return false
      } else {
        // Last booking more than X days ago
        if (profile.daysSinceLastBooking < criteria.daysSinceLastBooking) return false
      }
    }

    // Booking frequency criteria
    if (criteria.bookingFrequency) {
      const frequencyThreshold = criteria.bookingFrequency === 'high' ? 2 : criteria.bookingFrequency === 'medium' ? 1 : 0.5
      if (criteria.bookingFrequency === 'high' && profile.bookingFrequency < frequencyThreshold) return false
      if (criteria.bookingFrequency === 'low' && profile.bookingFrequency > frequencyThreshold) return false
    }

    // Average booking value criteria
    if (criteria.averageBookingValue) {
      const valueThreshold = criteria.averageBookingValue === 'high' ? 500 : criteria.averageBookingValue === 'medium' ? 250 : 100
      if (criteria.averageBookingValue === 'high' && profile.averageBookingValue < valueThreshold) return false
      if (criteria.averageBookingValue === 'low' && profile.averageBookingValue > valueThreshold) return false
    }

    // Churn risk criteria
    if (criteria.churnRisk && profile.churnRisk !== criteria.churnRisk) {
      return false
    }

    // Loyalty score criteria
    if (criteria.loyaltyScore !== undefined && profile.loyaltyScore < criteria.loyaltyScore) {
      return false
    }

    // Engagement score criteria
    if (criteria.engagementScore !== undefined && profile.engagementScore < criteria.engagementScore) {
      return false
    }

    // Custom rules
    if (criteria.customRules) {
      for (const rule of criteria.customRules) {
        const fieldValue = (profile as any)[rule.field]
        if (!this.evaluateRule(fieldValue, rule.operator, rule.value)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Create predefined customer segments
   */
  public async createPredefinedSegments(): Promise<void> {
    const segments: SegmentDefinition[] = [
      {
        name: 'VIP Customers',
        description: 'High-value customers with 10+ bookings and 5000+ PLN revenue',
        segmentType: 'value_based',
        criteria: {
          minBookings: 10,
          minRevenue: 5000,
          loyaltyScore: 80
        },
        priority: 100,
        autoUpdate: true
      },
      {
        name: 'Loyal Regulars',
        description: 'Customers with 5+ bookings and regular repeat business',
        segmentType: 'behavioral',
        criteria: {
          minBookings: 5,
          bookingFrequency: 'high',
          daysSinceLastBooking: -90 // Within last 90 days
        },
        priority: 90,
        autoUpdate: true
      },
      {
        name: 'High Value Newcomers',
        description: 'New customers with high initial booking value',
        segmentType: 'value_based',
        criteria: {
          minBookings: 1,
          maxBookings: 3,
          averageBookingValue: 'high'
        },
        priority: 80,
        autoUpdate: true
      },
      {
        name: 'Beauty Enthusiasts',
        description: 'Customers who primarily book beauty services',
        segmentType: 'behavioral',
        criteria: {
          serviceTypes: ['beauty'],
          minBookings: 2
        },
        priority: 70,
        autoUpdate: true
      },
      {
        name: 'Fitness Devotees',
        description: 'Customers who primarily book fitness services',
        segmentType: 'behavioral',
        criteria: {
          serviceTypes: ['fitness'],
          minBookings: 2
        },
        priority: 70,
        autoUpdate: true
      },
      {
        name: 'At Risk Customers',
        description: 'Customers with high churn risk',
        segmentType: 'predictive',
        criteria: {
          churnRisk: 'high',
          minBookings: 2 // Has at least some history
        },
        priority: 95,
        autoUpdate: true
      },
      {
        name: 'Recent Newcomers',
        description: 'Customers who booked in the last 30 days',
        segmentType: 'behavioral',
        criteria: {
          minBookings: 1,
          maxBookings: 2,
          daysSinceLastBooking: -30
        },
        priority: 60,
        autoUpdate: true
      },
      {
        name: 'Weekend Warriors',
        description: 'Customers who prefer weekend bookings',
        segmentType: 'behavioral',
        criteria: {
          preferredDays: ['Saturday', 'Sunday'],
          minBookings: 2
        },
        priority: 50,
        autoUpdate: true
      },
      {
        name: 'Mobile Service Fans',
        description: 'Customers who prefer mobile/at-home services',
        segmentType: 'behavioral',
        criteria: {
          locationTypes: ['mobile'],
          minBookings: 2
        },
        priority: 60,
        autoUpdate: true
      },
      {
        name: 'Dormant Customers',
        description: 'Customers who haven\'t booked in 90+ days',
        segmentType: 'predictive',
        criteria: {
          minBookings: 1,
          daysSinceLastBooking: 90
        },
        priority: 85,
        autoUpdate: true
      }
    ]

    // Insert segments into database
    for (const segment of segments) {
      try {
        const { error } = await supabase
          .from('customer_segments')
          .upsert({
            name: segment.name,
            description: segment.description,
            segment_type: segment.segmentType,
            criteria: segment.criteria,
            priority: segment.priority,
            auto_update: segment.autoUpdate,
            is_active: true
          }, {
            onConflict: 'name'
          })

        if (error) {
          console.error(`Error creating segment ${segment.name}:`, error)
        }
      } catch (error) {
        console.error(`Error creating segment ${segment.name}:`, error)
      }
    }
  }

  /**
   * Run segmentation for all customers
   */
  public async runSegmentation(): Promise<void> {
    try {
      console.log('Starting customer segmentation...')

      // Get all active segments
      const { data: segments, error: segmentsError } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (segmentsError) throw segmentsError

      if (!segments || segments.length === 0) {
        console.log('No active segments found')
        return
      }

      // Get all users with bookings
      const { data: users, error: usersError } = await supabase
        .from('bookings')
        .select('user_id')
        .not('user_id', 'is', null)
        .in('status', ['confirmed', 'completed'])

      if (usersError) throw usersError

      const uniqueUserIds = [...new Set(users?.map(u => u.user_id) || [])]

      console.log(`Processing ${uniqueUserIds.length} customers against ${segments.length} segments`)

      let processedCount = 0

      // Process each customer
      for (const userId of uniqueUserIds) {
        try {
          const profile = await this.buildCustomerProfile(userId)
          if (!profile) continue

          // Check against each segment
          for (const segment of segments) {
            const matches = this.matchesCriteria(profile, segment.criteria as SegmentationCriteria)
            const confidenceScore = this.calculateConfidenceScore(profile, segment.criteria as SegmentationCriteria)

            if (matches) {
              // Update or insert segment membership
              await supabase
                .from('customer_segment_memberships')
                .upsert({
                  user_id: userId,
                  segment_id: segment.id,
                  confidence_score: confidenceScore,
                  assigned_at: new Date().toISOString(),
                  metadata: {
                    profile_snapshot: {
                      totalBookings: profile.totalBookings,
                      totalRevenue: profile.totalRevenue,
                      churnRisk: profile.churnRisk,
                      loyaltyScore: profile.loyaltyScore
                    }
                  }
                }, {
                  onConflict: 'user_id,segment_id'
                })
            } else {
              // Remove from segment if no longer matches
              await supabase
                .from('customer_segment_memberships')
                .delete()
                .eq('user_id', userId)
                .eq('segment_id', segment.id)
            }
          }

          processedCount++
          if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount}/${uniqueUserIds.length} customers`)
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error)
        }
      }

      console.log(`Segmentation completed. Processed ${processedCount} customers.`)

      // Clean up expired memberships
      await this.cleanupExpiredMemberships()

    } catch (error) {
      console.error('Error running segmentation:', error)
    }
  }

  /**
   * Get segment insights and analytics
   */
  public async getSegmentInsights(segmentId: string): Promise<any> {
    try {
      // Get segment details
      const { data: segment, error: segmentError } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('id', segmentId)
        .single()

      if (segmentError) throw segmentError

      // Get segment members
      const { data: members, error: membersError } = await supabase
        .from('customer_segment_memberships')
        .select(`
          user_id,
          confidence_score,
          assigned_at,
          profiles(
            email,
            full_name
          )
        `)
        .eq('segment_id', segmentId)

      if (membersError) throw membersError

      // Get booking data for segment members
      const userIds = members?.map(m => m.user_id) || []
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('user_id', userIds)
        .in('status', ['confirmed', 'completed'])

      if (bookingsError) throw bookingsError

      // Calculate segment metrics
      const totalRevenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0
      const totalBookings = bookings?.length || 0
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

      return {
        segment,
        memberCount: members?.length || 0,
        totalRevenue,
        totalBookings,
        averageBookingValue,
        averageConfidence: members?.reduce((sum, m) => sum + m.confidence_score, 0) / (members?.length || 1),
        recentGrowth: await this.calculateSegmentGrowth(segmentId),
        topMembers: members?.slice(0, 10).map(m => ({
          ...m,
          totalBookings: bookings?.filter(b => b.user_id === m.user_id).length || 0,
          totalRevenue: bookings?.filter(b => b.user_id === m.user_id).reduce((sum, b) => sum + b.total_amount, 0) || 0
        }))
      }
    } catch (error) {
      console.error('Error getting segment insights:', error)
      return null
    }
  }

  // Helper methods
  private countOccurrences(arr: string[]): Record<string, number> {
    return arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})
  }

  private extractTimePreferences(bookings: any[]): { preferredDays: string[]; preferredTimes: string[] } {
    const dayCounts = this.countOccurrences(
      bookings.map(b => new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'long' }))
    )
    const timeCounts = this.countOccurrences(
      bookings.map(b => {
        const hour = parseInt(b.start_time.split(':')[0])
        if (hour < 12) return 'Morning'
        if (hour < 17) return 'Afternoon'
        return 'Evening'
      })
    )

    return {
      preferredDays: Object.keys(dayCounts).sort((a, b) => dayCounts[b] - dayCounts[a]),
      preferredTimes: Object.keys(timeCounts).sort((a, b) => timeCounts[b] - timeCounts[a])
    }
  }

  private calculateChurnRisk(daysSinceLastBooking: number | null, bookingFrequency: number, totalRevenue: number): 'high' | 'medium' | 'low' {
    if (daysSinceLastBooking === null) return 'medium'

    // High churn risk: no booking in 90+ days or low frequency
    if (daysSinceLastBooking > 90 || bookingFrequency < 0.5) {
      return 'high'
    }

    // Medium churn risk: no booking in 30-90 days
    if (daysSinceLastBooking > 30) {
      return 'medium'
    }

    // Low churn risk: recent booking with good frequency
    return 'low'
  }

  private calculateLoyaltyScore(totalBookings: number, totalRevenue: number, daysSinceLastBooking: number | null): number {
    let score = 0

    // Booking frequency component (40%)
    score += Math.min((totalBookings / 10) * 40, 40)

    // Revenue component (30%)
    score += Math.min((totalRevenue / 5000) * 30, 30)

    // Recency component (30%)
    if (daysSinceLastBooking !== null) {
      if (daysSinceLastBooking <= 30) score += 30
      else if (daysSinceLastBooking <= 90) score += 20
      else if (daysSinceLastBooking <= 180) score += 10
    }

    return Math.min(score, 100)
  }

  private calculateEngagementScore(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0

    // Score based on event types and recency
    let score = 0
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Recent events (last 30 days)
    const recentEvents = events.filter(e => new Date(e.timestamp) > thirtyDaysAgo)
    score += Math.min(recentEvents.length * 2, 40)

    // Event diversity
    const uniqueEventTypes = new Set(events.map(e => e.event_type)).size
    score += Math.min(uniqueEventTypes * 5, 30)

    // High-value interactions
    const highValueEvents = events.filter(e =>
      ['booking_completed', 'payment_completed', 'service_purchase_completed'].includes(e.event_type)
    )
    score += Math.min(highValueEvents.length * 10, 30)

    return Math.min(score, 100)
  }

  private calculateLifetimeValue(totalBookings: number, averageBookingValue: number, bookingFrequency: number): number {
    // Simple CLV calculation: average value * expected future bookings
    const customerLifetimeMonths = 24 // Assume 2-year customer lifetime
    const expectedFutureBookings = bookingFrequency * customerLifetimeMonths
    return averageBookingValue * expectedFutureBookings
  }

  private calculateConfidenceScore(profile: CustomerProfile, criteria: SegmentationCriteria): number {
    let confidence = 1.0

    // Reduce confidence for edge cases
    if (profile.totalBookings === 1) confidence *= 0.7 // New customer
    if (profile.daysSinceLastBooking === null) confidence *= 0.8 // No recency data
    if (profile.bookingFrequency < 0.5) confidence *= 0.9 // Low frequency

    return confidence
  }

  private evaluateRule(fieldValue: any, operator: string, ruleValue: any): boolean {
    switch (operator) {
      case 'gt':
        return fieldValue > ruleValue
      case 'lt':
        return fieldValue < ruleValue
      case 'eq':
        return fieldValue === ruleValue
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue)
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue)
      default:
        return false
    }
  }

  private async calculateSegmentGrowth(segmentId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

      // Get members from last 30 days
      const { data: recentMembers } = await supabase
        .from('customer_segment_memberships')
        .select('*')
        .eq('segment_id', segmentId)
        .gte('assigned_at', thirtyDaysAgo.toISOString())

      // Get members from 30-60 days ago
      const { data: previousMembers } = await supabase
        .from('customer_segment_memberships')
        .select('*')
        .eq('segment_id', segmentId)
        .gte('assigned_at', sixtyDaysAgo.toISOString())
        .lt('assigned_at', thirtyDaysAgo.toISOString())

      const recentCount = recentMembers?.length || 0
      const previousCount = previousMembers?.length || 0

      return previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0
    } catch (error) {
      console.error('Error calculating segment growth:', error)
      return 0
    }
  }

  private async cleanupExpiredMemberships(): Promise<void> {
    try {
      // Remove memberships for segments that don't auto-update and are older than 30 days
      const { error } = await supabase
        .from('customer_segment_memberships')
        .delete()
        .lt('assigned_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        console.error('Error cleaning up expired memberships:', error)
      }
    } catch (error) {
      console.error('Error cleaning up expired memberships:', error)
    }
  }
}

// Export singleton instance
export const customerSegmentation = CustomerSegmentationEngine.getInstance()

// Export types
export type {
  CustomerProfile,
  SegmentationCriteria,
  SegmentDefinition
}