/**
 * Analytics Service API
 * Provides comprehensive analytics data access with caching and optimization
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

// Types
type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']
type AnalyticsMetric = Database['public']['Tables']['analytics_metrics']['Row']
type RevenueAnalytics = Database['public']['Tables']['revenue_analytics']['Row']
type CustomerSegment = Database['public']['Tables']['customer_segments']['Row']
type PerformanceKPI = Database['public']['Tables']['performance_kpis']['Row']
type AnalyticsAlert = Database['public']['Tables']['analytics_alerts']['Row']

interface AnalyticsQueryOptions {
  startDate?: string
  endDate?: string
  serviceType?: string
  locationType?: string
  limit?: number
  offset?: number
  orderBy?: string
  groupBy?: string[]
  filters?: Record<string, any>
}

interface RevenueMetrics {
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  growthRate: number
  revenueByServiceType: Array<{ serviceType: string; revenue: number; bookings: number }>
  revenueByLocation: Array<{ locationType: string; revenue: number; bookings: number }>
  dailyRevenue: Array<{ date: string; revenue: number; bookings: number }>
}

interface BookingMetrics {
  totalBookings: number
  conversionRate: number
  averageBookingValue: number
  bookingsByStatus: Array<{ status: string; count: number; percentage: number }>
  bookingsByServiceType: Array<{ serviceType: string; count: number; revenue: number }>
  funnelMetrics: {
    views: number
    initiations: number
    completions: number
    dropoffRates: Array<{ step: string; rate: number }>
  }
}

interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerSegments: Array<{
    segmentName: string
    count: number
    percentage: number
    averageValue: number
  }>
  customerLifetimeValue: number
  retentionRate: number
  churnRate: number
}

interface PerformanceMetrics {
  overallScore: number
  kpis: Array<{
    name: string
    value: number
    target: number
    achievement: number
    trend: 'up' | 'down' | 'stable'
    status: 'critical' | 'warning' | 'normal' | 'good' | 'excellent'
  }>
  alerts: AnalyticsAlert[]
  trends: Array<{
    metric: string
    direction: 'up' | 'down'
    percentage: number
    period: string
  }>
}

class AnalyticsService {
  private static instance: AnalyticsService
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultCacheTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private async executeQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultCacheTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Execute query
    const result = await queryFn()

    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    })

    return result
  }

  private generateCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`
  }

  // Revenue Analytics
  public async getRevenueMetrics(options: AnalyticsQueryOptions = {}): Promise<RevenueMetrics> {
    const cacheKey = this.generateCacheKey('getRevenueMetrics', options)

    return this.executeQuery(cacheKey, async () => {
      const { startDate, endDate, serviceType, locationType } = options

      // Build base query
      let query = supabase
        .from('revenue_analytics')
        .select('*')

      // Apply filters
      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }
      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }
      if (locationType) {
        query = query.eq('location_type', locationType)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        return this.getEmptyRevenueMetrics()
      }

      // Calculate metrics
      const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0)
      const totalBookings = data.reduce((sum, item) => sum + item.bookings_count, 0)
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

      // Calculate growth rate (compare with previous period)
      const growthRate = await this.calculateGrowthRate(data, options)

      // Group by service type
      const revenueByServiceType = this.groupBy(data, 'service_type', (items) => ({
        revenue: items.reduce((sum, item) => sum + item.total_revenue, 0),
        bookings: items.reduce((sum, item) => sum + item.bookings_count, 0)
      }))

      // Group by location type
      const revenueByLocation = this.groupBy(data, 'location_type', (items) => ({
        revenue: items.reduce((sum, item) => sum + item.total_revenue, 0),
        bookings: items.reduce((sum, item) => sum + item.bookings_count, 0)
      }))

      // Daily revenue data
      const dailyRevenue = data
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          date: item.date,
          revenue: item.total_revenue,
          bookings: item.bookings_count
        }))

      return {
        totalRevenue,
        totalBookings,
        averageBookingValue,
        growthRate,
        revenueByServiceType: Object.entries(revenueByServiceType).map(([serviceType, data]) => ({
          serviceType: serviceType || 'unknown',
          ...data
        })),
        revenueByLocation: Object.entries(revenueByLocation).map(([locationType, data]) => ({
          locationType: locationType || 'unknown',
          ...data
        })),
        dailyRevenue
      }
    })
  }

  // Booking Analytics
  public async getBookingMetrics(options: AnalyticsQueryOptions = {}): Promise<BookingMetrics> {
    const cacheKey = this.generateCacheKey('getBookingMetrics', options)

    return this.executeQuery(cacheKey, async () => {
      const { startDate, endDate, serviceType } = options

      // Get booking data
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          services(
            service_type,
            title,
            price
          )
        `)

      if (startDate) {
        bookingsQuery = bookingsQuery.gte('booking_date', startDate)
      }
      if (endDate) {
        bookingsQuery = bookingsQuery.lte('booking_date', endDate)
      }
      if (serviceType) {
        bookingsQuery = bookingsQuery.eq('services.service_type', serviceType)
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery

      if (bookingsError) throw bookingsError

      // Get analytics events for funnel metrics
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .in('event_type', ['booking_viewed', 'booking_initiated', 'booking_completed'])

      if (eventsError) throw eventsError

      const totalBookings = bookings?.length || 0
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
      const conversionRate = events && events.length > 0
        ? (completedBookings / events.filter(e => e.event_type === 'booking_viewed').length) * 100
        : 0

      const averageBookingValue = bookings && bookings.length > 0
        ? bookings.reduce((sum, b) => sum + b.total_amount, 0) / bookings.length
        : 0

      // Bookings by status
      const bookingsByStatus = this.groupBy(bookings || [], 'status', (items) => ({
        count: items.length,
        percentage: (items.length / totalBookings) * 100
      }))

      // Bookings by service type
      const bookingsByServiceType = bookings ?
        this.groupBy(bookings.filter(b => b.services), 'services.service_type', (items) => ({
          count: items.length,
          revenue: items.reduce((sum, item) => sum + item.total_amount, 0)
        })) : {}

      // Funnel metrics
      const funnelEvents = {
        views: events?.filter(e => e.event_type === 'booking_viewed').length || 0,
        initiations: events?.filter(e => e.event_type === 'booking_initiated').length || 0,
        completions: completedBookings
      }

      const dropoffRates = [
        {
          step: 'view_to_initiation',
          rate: funnelEvents.views > 0
            ? ((funnelEvents.views - funnelEvents.initiations) / funnelEvents.views) * 100
            : 0
        },
        {
          step: 'initiation_to_completion',
          rate: funnelEvents.initiations > 0
            ? ((funnelEvents.initiations - funnelEvents.completions) / funnelEvents.initiations) * 100
            : 0
        }
      ]

      return {
        totalBookings,
        conversionRate,
        averageBookingValue,
        bookingsByStatus: Object.entries(bookingsByStatus).map(([status, data]) => ({
          status: status || 'unknown',
          ...data
        })),
        bookingsByServiceType: Object.entries(bookingsByServiceType).map(([serviceType, data]) => ({
          serviceType: serviceType || 'unknown',
          ...data
        })),
        funnelMetrics: {
          ...funnelEvents,
          dropoffRates
        }
      }
    })
  }

  // Customer Analytics
  public async getCustomerMetrics(options: AnalyticsQueryOptions = {}): Promise<CustomerMetrics> {
    const cacheKey = this.generateCacheKey('getCustomerMetrics', options)

    return this.executeQuery(cacheKey, async () => {
      // Get customer segments
      const { data: segments, error: segmentsError } = await supabase
        .from('customer_segments')
        .select(`
          *,
          customer_segment_memberships(
            user_id,
            confidence_score
          )
        `)
        .eq('is_active', true)

      if (segmentsError) throw segmentsError

      // Get customer journey data
      const { data: journeys, error: journeysError } = await supabase
        .from('customer_journey_analytics')
        .select('*')

      if (journeysError) throw journeysError

      // Get booking data for LTV calculation
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('user_id, total_amount, created_at')
        .not('user_id', 'is', null)

      if (bookingsError) throw bookingsError

      // Calculate metrics
      const totalCustomers = new Set(journeys?.map(j => j.user_id).filter(Boolean)).size
      const customerSegments = segments?.map(segment => ({
        segmentName: segment.name,
        count: segment.customer_segment_memberships?.length || 0,
        percentage: totalCustomers > 0
          ? ((segment.customer_segment_memberships?.length || 0) / totalCustomers) * 100
          : 0,
        averageValue: 0 // Would need additional calculation
      })) || []

      // Calculate customer lifetime value
      const customerLifetimeValue = this.calculateLTV(bookings || [])

      // Calculate retention and churn rates
      const { retentionRate, churnRate } = this.calculateRetentionChurn(journeys || [])

      return {
        totalCustomers,
        newCustomers: 0, // Would need new customer identification logic
        returningCustomers: 0, // Would need repeat customer logic
        customerSegments,
        customerLifetimeValue,
        retentionRate,
        churnRate
      }
    })
  }

  // Performance KPIs
  public async getPerformanceMetrics(options: AnalyticsQueryOptions = {}): Promise<PerformanceMetrics> {
    const cacheKey = this.generateCacheKey('getPerformanceMetrics', options)

    return this.executeQuery(cacheKey, async () => {
      // Get active KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('performance_kpis')
        .select('*')
        .order('priority', { ascending: false })

      if (kpisError) throw kpisError

      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('analytics_alerts')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false })

      if (alertsError) throw alertsError

      // Calculate overall score
      const overallScore = this.calculateOverallScore(kpis || [])

      // Format KPIs
      const formattedKPIs = (kpis || []).map(kpi => ({
        name: kpi.kpi_name,
        value: kpi.current_value,
        target: kpi.target_value,
        achievement: kpi.target_value > 0
          ? (kpi.current_value / kpi.target_value) * 100
          : 0,
        trend: kpi.trend_direction as 'up' | 'down' | 'stable',
        status: kpi.status as 'critical' | 'warning' | 'normal' | 'good' | 'excellent'
      }))

      return {
        overallScore,
        kpis: formattedKPIs,
        alerts: alerts || [],
        trends: [] // Would need trend calculation logic
      }
    })
  }

  // Helper methods
  private async calculateGrowthRate(
    data: RevenueAnalytics[],
    options: AnalyticsQueryOptions
  ): Promise<number> {
    // Simplified growth rate calculation
    if (data.length < 2) return 0

    const currentPeriod = data.slice(0, Math.ceil(data.length / 2))
    const previousPeriod = data.slice(Math.ceil(data.length / 2))

    const currentRevenue = currentPeriod.reduce((sum, item) => sum + item.total_revenue, 0)
    const previousRevenue = previousPeriod.reduce((sum, item) => sum + item.total_revenue, 0)

    return previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0
  }

  private groupBy<T, R>(
    items: T[],
    key: string,
    aggregator: (items: T[]) => R
  ): Record<string, R> {
    return items.reduce((groups, item) => {
      const groupKey = this.getNestedValue(item, key) || 'unknown'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)

    // Apply aggregator to each group
    Object.keys(groups).forEach(key => {
      groups[key] = aggregator(groups[key])
    })

    return groups
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private calculateLTV(bookings: any[]): number {
    // Simple LTV calculation
    const customerRevenue = new Map<string, number>()

    bookings.forEach(booking => {
      const current = customerRevenue.get(booking.user_id) || 0
      customerRevenue.set(booking.user_id, current + booking.total_amount)
    })

    const revenues = Array.from(customerRevenue.values())
    return revenues.length > 0
      ? revenues.reduce((sum, revenue) => sum + revenue, 0) / revenues.length
      : 0
  }

  private calculateRetentionChurn(journeys: any[]): { retentionRate: number; churnRate: number } {
    // Simplified retention/churn calculation
    const totalUsers = new Set(journeys.map(j => j.user_id)).size
    const retainedUsers = journeys.filter(j => j.is_converted).length

    const retentionRate = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0
    const churnRate = 100 - retentionRate

    return { retentionRate, churnRate }
  }

  private calculateOverallScore(kpis: PerformanceKPI[]): number {
    if (kpis.length === 0) return 0

    const weightedScores = kpis.map(kpi => {
      const achievement = kpi.target_value > 0
        ? Math.min((kpi.current_value / kpi.target_value) * 100, 150) // Cap at 150%
        : 0

      // Weight based on status
      let weight = 1
      switch (kpi.status) {
        case 'critical': weight = 2; break
        case 'warning': weight = 1.5; break
        case 'good': weight = 1.2; break
        case 'excellent': weight = 1.1; break
      }

      return achievement * weight
    })

    return weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length
  }

  private getEmptyRevenueMetrics(): RevenueMetrics {
    return {
      totalRevenue: 0,
      totalBookings: 0,
      averageBookingValue: 0,
      growthRate: 0,
      revenueByServiceType: [],
      revenueByLocation: [],
      dailyRevenue: []
    }
  }

  // Public API methods for specific data needs
  public async getTopPerformingServices(limit: number = 10): Promise<any[]> {
    const cacheKey = this.generateCacheKey('getTopPerformingServices', { limit })

    return this.executeQuery(cacheKey, async () => {
      const { data, error } = await supabase
        .rpc('get_top_performing_services', { limit_count: limit })

      if (error) throw error
      return data || []
    })
  }

  public async getRecentEvents(limit: number = 50): Promise<AnalyticsEvent[]> {
    const cacheKey = this.generateCacheKey('getRecentEvents', { limit })

    return this.executeQuery(cacheKey, async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    }, 60000) // Cache for 1 minute for real-time data
  }

  public async getMetricsByTimeRange(
    metricName: string,
    startDate: string,
    endDate: string,
    timePeriod: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<AnalyticsMetric[]> {
    const cacheKey = this.generateCacheKey('getMetricsByTimeRange', {
      metricName,
      startDate,
      endDate,
      timePeriod
    })

    return this.executeQuery(cacheKey, async () => {
      const { data, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .eq('time_period', timePeriod)
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .order('period_start', { ascending: true })

      if (error) throw error
      return data || []
    })
  }

  public clearCache(): void {
    this.cache.clear()
  }

  public getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance()

// Export types
export type {
  AnalyticsQueryOptions,
  RevenueMetrics,
  BookingMetrics,
  CustomerMetrics,
  PerformanceMetrics
}