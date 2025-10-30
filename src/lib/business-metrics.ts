/**
 * Business Metrics Service
 * Tracks and analyzes business-critical metrics for Mariia Hub platform
 * Including revenue, conversion rates, customer acquisition, and retention
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { realTimeMonitoringService } from './real-time-monitoring';

// Business metrics interfaces
export interface BusinessMetrics {
  revenue: RevenueMetrics;
  bookings: BookingMetrics;
  customers: CustomerMetrics;
  services: ServiceMetrics;
  marketing: MarketingMetrics;
  operational: OperationalMetrics;
  timestamp: number;
}

export interface RevenueMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisQuarter: number;
  thisYear: number;
  total: number;
  averageOrderValue: number;
  revenueByService: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
  revenueGrowthRate: number; // Percentage change from previous period
  projectedMonthlyRevenue: number;
  churnedRevenue: number;
  recurringRevenue: number;
}

export interface BookingMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShows: number;
  conversionRate: number; // From session start to booking
  averageBookingValue: number;
  bookingsByService: Record<string, number>;
  bookingsByTimeSlot: Record<string, number>;
  bookingFunnelConversion: {
    views: number;
    serviceSelection: number;
    timeSelection: number;
    details: number;
    payment: number;
    completed: number;
  };
  cancellationRate: number;
  noShowRate: number;
  rescheduleRate: number;
  repeatBookingRate: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  activeCustomers: number; // Customers with bookings in last 30 days
  churnRate: number;
  retentionRate: number;
  customerLifetimeValue: number;
  averageSessionsPerCustomer: number;
  customerAcquisitionCost: number;
  customerSatisfactionScore: number;
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
    sources: Record<string, number>; // How they found the service
  };
}

export interface ServiceMetrics {
  totalServices: number;
  activeServices: number;
  mostPopularServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
  leastPopularServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  serviceUtilization: Record<string, number>; // Percentage of time slots booked
  serviceProfitability: Record<string, number>;
  seasonalTrends: Record<string, number>; // Bookings by month/season
}

export interface MarketingMetrics {
  websiteVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  conversionRate: number; // Visitor to booking
  costPerAcquisition: number;
  returnOnAdSpend: number;
  trafficSources: Record<string, number>;
  marketingChannels: Record<string, {
    visitors: number;
    conversions: number;
    cost: number;
    revenue: number;
    roas: number; // Return on Ad Spend
  }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
  }>;
}

export interface OperationalMetrics {
  staffUtilization: Record<string, number>;
  averageServiceDuration: Record<string, number>;
  inventoryUtilization: number;
  operationalEfficiency: number;
  customerWaitTime: number;
  staffPerformance: Record<string, {
    bookingsHandled: number;
    customerRating: number;
    punctuality: number;
    efficiency: number;
  }>;
  resourceUtilization: {
    rooms: number;
    equipment: number;
    products: number;
  };
}

export interface BusinessKPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number; // Percentage change
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: number;
}

export interface BusinessAlert {
  id: string;
  type: 'revenue' | 'booking' | 'customer' | 'marketing' | 'operational';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  kpi: string;
  currentValue: number;
  targetValue: number;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

class BusinessMetricsService {
  private static instance: BusinessMetricsService;
  private supabase: any;
  private metrics: BusinessMetrics | null = null;
  private kpis: Map<string, BusinessKPI> = new Map();
  private alerts: BusinessAlert[] = [];
  private updateInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): BusinessMetricsService {
    if (!BusinessMetricsService.instance) {
      BusinessMetricsService.instance = new BusinessMetricsService();
    }
    return BusinessMetricsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load initial metrics
      await this.calculateAllMetrics();

      // Initialize KPIs
      this.initializeKPIs();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      logger.info('Business metrics service initialized');

    } catch (error) {
      logger.error('Failed to initialize business metrics service', error);
      throw error;
    }
  }

  private async calculateAllMetrics(): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisQuarter = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );
      const thisYear = new Date(now.getFullYear(), 0, 1);

      // Calculate revenue metrics
      const revenueMetrics = await this.calculateRevenueMetrics(
        today, thisWeek, thisMonth, thisQuarter, thisYear
      );

      // Calculate booking metrics
      const bookingMetrics = await this.calculateBookingMetrics();

      // Calculate customer metrics
      const customerMetrics = await this.calculateCustomerMetrics();

      // Calculate service metrics
      const serviceMetrics = await this.calculateServiceMetrics();

      // Calculate marketing metrics
      const marketingMetrics = await this.calculateMarketingMetrics();

      // Calculate operational metrics
      const operationalMetrics = await this.calculateOperationalMetrics();

      this.metrics = {
        revenue: revenueMetrics,
        bookings: bookingMetrics,
        customers: customerMetrics,
        services: serviceMetrics,
        marketing: marketingMetrics,
        operational: operationalMetrics,
        timestamp: Date.now()
      };

      // Check for business alerts
      await this.checkBusinessAlerts();

      // Report to real-time monitoring
      realTimeMonitoringService.reportMetric({
        type: 'business',
        name: 'business_metrics_update',
        value: 'updated',
        metadata: this.metrics
      });

    } catch (error) {
      logger.error('Failed to calculate business metrics', error);
    }
  }

  private async calculateRevenueMetrics(
    today: Date,
    thisWeek: Date,
    thisMonth: Date,
    thisQuarter: Date,
    thisYear: Date
  ): Promise<RevenueMetrics> {
    try {
      // Helper function to calculate revenue for a date range
      const calculateRevenue = async (startDate: Date, endDate: Date = new Date()) => {
        const { data, error } = await this.supabase
          .from('bookings')
          .select('total_price, payment_method, service_id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('payment_status', 'completed');

        if (error) throw error;

        const total = data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
        const revenueByService = data?.reduce((acc, booking) => {
          acc[booking.service_id] = (acc[booking.service_id] || 0) + (booking.total_price || 0);
          return acc;
        }, {} as Record<string, number>) || {};

        const revenueByPaymentMethod = data?.reduce((acc, booking) => {
          const method = booking.payment_method || 'unknown';
          acc[method] = (acc[method] || 0) + (booking.total_price || 0);
          return acc;
        }, {} as Record<string, number>) || {};

        return { total, revenueByService, revenueByPaymentMethod };
      };

      // Calculate revenue for different periods
      const [todayRevenue, weekRevenue, monthRevenue, quarterRevenue, yearRevenue] = await Promise.all([
        calculateRevenue(today),
        calculateRevenue(thisWeek),
        calculateRevenue(thisMonth),
        calculateRevenue(thisQuarter),
        calculateRevenue(thisYear)
      ]);

      // Calculate total revenue (all time)
      const { data: totalRevenueData } = await this.supabase
        .from('bookings')
        .select('total_price')
        .eq('payment_status', 'completed');

      const totalRevenue = totalRevenueData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

      // Calculate average order value
      const { data: bookingCountData } = await this.supabase
        .from('bookings')
        .select('id')
        .eq('payment_status', 'completed');

      const totalBookings = bookingCountData?.length || 0;
      const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate revenue growth rate (month over month)
      const lastMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
      const lastMonthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 0);
      const lastMonthRevenue = await calculateRevenue(lastMonthStart, lastMonthEnd);

      const revenueGrowthRate = lastMonthRevenue.total > 0
        ? ((monthRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total) * 100
        : 0;

      // Project monthly revenue based on current month's performance
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysPassed = today.getDate();
      const projectedMonthlyRevenue = daysPassed > 0
        ? (monthRevenue.total / daysPassed) * daysInMonth
        : 0;

      // Calculate recurring revenue (customers with multiple bookings)
      const { data: repeatCustomers } = await this.supabase
        .from('bookings')
        .select('customer_id, total_price')
        .eq('payment_status', 'completed')
        .gte('created_at', thisMonth.toISOString());

      const customerRevenue = repeatCustomers?.reduce((acc, booking) => {
        acc[booking.customer_id] = (acc[booking.customer_id] || 0) + (booking.total_price || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      const recurringRevenue = Object.values(customerRevenue).reduce((sum, revenue) => {
        return revenue > 100 ? sum + revenue : sum; // Assume >100 means repeat customer
      }, 0);

      return {
        today: todayRevenue.total,
        thisWeek: weekRevenue.total,
        thisMonth: monthRevenue.total,
        thisQuarter: quarterRevenue.total,
        thisYear: yearRevenue.total,
        total: totalRevenue,
        averageOrderValue,
        revenueByService: monthRevenue.revenueByService,
        revenueByPaymentMethod: monthRevenue.revenueByPaymentMethod,
        revenueGrowthRate,
        projectedMonthlyRevenue,
        churnedRevenue: 0, // Would need more complex calculation
        recurringRevenue
      };

    } catch (error) {
      logger.error('Failed to calculate revenue metrics', error);
      return this.getDefaultRevenueMetrics();
    }
  }

  private async calculateBookingMetrics(): Promise<BookingMetrics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all bookings
      const { data: bookings, error } = await this.supabase
        .from('bookings')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
      const noShowBookings = bookings?.filter(b => b.status === 'no_show').length || 0;

      // Calculate conversion rate
      const { data: sessions } = await this.supabase
        .from('monitoring_sessions')
        .select('conversion_events')
        .gte('start_time', thirtyDaysAgo.toISOString());

      const totalSessions = sessions?.length || 0;
      const conversionEvents = sessions?.reduce((sum, s) => sum + (s.conversion_events || 0), 0) || 0;
      const conversionRate = totalSessions > 0 ? conversionEvents / totalSessions : 0;

      // Calculate average booking value
      const completedBookingRevenue = bookings
        ?.filter(b => b.status === 'completed')
        ?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const averageBookingValue = completedBookings > 0 ? completedBookingRevenue / completedBookings : 0;

      // Calculate bookings by service
      const bookingsByService = bookings?.reduce((acc, booking) => {
        acc[booking.service_id] = (acc[booking.service_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate booking funnel conversion
      const bookingFunnelConversion = await this.calculateBookingFunnel();

      // Calculate rates
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0;

      // Calculate reschedule rate
      const { data: rescheduledBookings } = await this.supabase
        .from('booking_reschedules')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const rescheduleRate = totalBookings > 0 ? ((rescheduledBookings?.length || 0) / totalBookings) * 100 : 0;

      // Calculate repeat booking rate
      const { data: repeatCustomers } = await this.supabase
        .from('bookings')
        .select('customer_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const customerBookingCounts = repeatCustomers?.reduce((acc, booking) => {
        acc[booking.customer_id] = (acc[booking.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const repeatCustomersCount = Object.values(customerBookingCounts).filter(count => count > 1).length;
      const uniqueCustomers = Object.keys(customerBookingCounts).length;
      const repeatBookingRate = uniqueCustomers > 0 ? (repeatCustomersCount / uniqueCustomers) * 100 : 0;

      return {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        noShows: noShowBookings,
        conversionRate,
        averageBookingValue,
        bookingsByService,
        bookingsByTimeSlot: {}, // Would need additional query
        bookingFunnelConversion,
        cancellationRate,
        noShowRate,
        rescheduleRate,
        repeatBookingRate
      };

    } catch (error) {
      logger.error('Failed to calculate booking metrics', error);
      return this.getDefaultBookingMetrics();
    }
  }

  private async calculateBookingFunnel(): Promise<{
    views: number;
    serviceSelection: number;
    timeSelection: number;
    details: number;
    payment: number;
    completed: number;
  }> {
    try {
      // This would require tracking funnel events in the monitoring_sessions table
      // For now, return mock data
      return {
        views: 1000,
        serviceSelection: 600,
        timeSelection: 400,
        details: 350,
        payment: 250,
        completed: 200
      };
    } catch (error) {
      logger.error('Failed to calculate booking funnel', error);
      return {
        views: 0,
        serviceSelection: 0,
        timeSelection: 0,
        details: 0,
        payment: 0,
        completed: 0
      };
    }
  }

  private async calculateCustomerMetrics(): Promise<CustomerMetrics> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get total customers
      const { data: customers, error } = await this.supabase
        .from('profiles')
        .select('id, created_at, location_data')
        .lt('created_at', new Date().toISOString());

      if (error) throw error;

      const totalCustomers = customers?.length || 0;

      // Get new customers (last 30 days)
      const newCustomers = customers?.filter(c =>
        new Date(c.created_at) > thirtyDaysAgo
      ).length || 0;

      // Get active customers (customers with bookings in last 30 days)
      const { data: recentBookings } = await this.supabase
        .from('bookings')
        .select('customer_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeCustomerIds = new Set(recentBookings?.map(b => b.customer_id) || []);
      const activeCustomers = activeCustomerIds.size;

      const returningCustomers = totalCustomers - newCustomers;

      // Calculate churn rate and retention rate
      const churnRate = totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0;
      const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

      // Calculate customer lifetime value
      const { data: customerRevenue } = await this.supabase
        .from('bookings')
        .select('customer_id, total_price')
        .eq('payment_status', 'completed');

      const revenueByCustomer = customerRevenue?.reduce((acc, booking) => {
        acc[booking.customer_id] = (acc[booking.customer_id] || 0) + (booking.total_price || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      const totalRevenue = Object.values(revenueByCustomer).reduce((sum, revenue) => sum + revenue, 0);
      const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // Calculate average sessions per customer
      const sessionsByCustomer = customerRevenue?.reduce((acc, booking) => {
        acc[booking.customer_id] = (acc[booking.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const averageSessionsPerCustomer = totalCustomers > 0
        ? Object.values(sessionsByCustomer).reduce((sum, sessions) => sum + sessions, 0) / totalCustomers
        : 0;

      // Calculate customer acquisition cost (mock data for now)
      const customerAcquisitionCost = 25; // Would need marketing spend data

      // Calculate customer satisfaction score (mock data for now)
      const customerSatisfactionScore = 4.5; // Would need review data

      // Calculate demographics
      const demographics = await this.calculateCustomerDemographics(customers || []);

      return {
        totalCustomers,
        newCustomers,
        returningCustomers,
        activeCustomers,
        churnRate,
        retentionRate,
        customerLifetimeValue,
        averageSessionsPerCustomer,
        customerAcquisitionCost,
        customerSatisfactionScore,
        demographics
      };

    } catch (error) {
      logger.error('Failed to calculate customer metrics', error);
      return this.getDefaultCustomerMetrics();
    }
  }

  private async calculateCustomerDemographics(customers: any[]): Promise<{
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
    sources: Record<string, number>;
  }> {
    // Mock demographics data - would need real data collection
    return {
      ageGroups: {
        '18-24': 15,
        '25-34': 35,
        '35-44': 30,
        '45-54': 15,
        '55+': 5
      },
      locations: {
        'Warsaw': 60,
        'Krakow': 15,
        'Gdansk': 10,
        'Other': 15
      },
      devices: {
        'mobile': 55,
        'desktop': 40,
        'tablet': 5
      },
      sources: {
        'organic': 40,
        'social': 25,
        'referral': 20,
        'paid': 15
      }
    };
  }

  private async calculateServiceMetrics(): Promise<ServiceMetrics> {
    try {
      // Get total services
      const { data: services, error } = await this.supabase
        .from('services')
        .select('id, name, is_active, base_price, rating, booking_count');

      if (error) throw error;

      const totalServices = services?.length || 0;
      const activeServices = services?.filter(s => s.is_active).length || 0;

      // Get most popular services
      const mostPopularServices = services
        ?.filter(s => s.is_active)
        ?.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0))
        ?.slice(0, 10)
        ?.map(service => ({
          id: service.id,
          name: service.name,
          bookings: service.booking_count || 0,
          revenue: (service.booking_count || 0) * (service.base_price || 0),
          rating: service.rating || 0
        })) || [];

      // Get least popular services
      const leastPopularServices = services
        ?.filter(s => s.is_active)
        ?.sort((a, b) => (a.booking_count || 0) - (b.booking_count || 0))
        ?.slice(0, 5)
        ?.map(service => ({
          id: service.id,
          name: service.name,
          bookings: service.booking_count || 0,
          revenue: (service.booking_count || 0) * (service.base_price || 0)
        })) || [];

      // Calculate service utilization and profitability (mock data for now)
      const serviceUtilization: Record<string, number> = {};
      const serviceProfitability: Record<string, number> = {};
      const seasonalTrends: Record<string, number> = {
        'January': 0.8,
        'February': 0.9,
        'March': 1.0,
        'April': 1.1,
        'May': 1.2,
        'June': 1.3,
        'July': 1.4,
        'August': 1.3,
        'September': 1.1,
        'October': 1.0,
        'November': 0.9,
        'December': 1.2
      };

      return {
        totalServices,
        activeServices,
        mostPopularServices,
        leastPopularServices,
        serviceUtilization,
        serviceProfitability,
        seasonalTrends
      };

    } catch (error) {
      logger.error('Failed to calculate service metrics', error);
      return this.getDefaultServiceMetrics();
    }
  }

  private async calculateMarketingMetrics(): Promise<MarketingMetrics> {
    try {
      // Mock marketing metrics - would need integration with analytics tools
      return {
        websiteVisitors: 10000,
        uniqueVisitors: 7000,
        pageViews: 45000,
        bounceRate: 35,
        averageSessionDuration: 180, // seconds
        conversionRate: 2.5,
        costPerAcquisition: 25,
        returnOnAdSpend: 3.5,
        trafficSources: {
          'organic': 40,
          'direct': 20,
          'social': 15,
          'referral': 10,
          'paid': 15
        },
        marketingChannels: {
          'google_ads': {
            visitors: 1500,
            conversions: 38,
            cost: 950,
            revenue: 2850,
            roas: 3.0
          },
          'facebook': {
            visitors: 1000,
            conversions: 25,
            cost: 500,
            revenue: 1875,
            roas: 3.75
          },
          'instagram': {
            visitors: 800,
            conversions: 20,
            cost: 400,
            revenue: 1500,
            roas: 3.75
          }
        },
        campaignPerformance: [
          {
            id: 'summer_campaign_2024',
            name: 'Summer Beauty Special',
            spend: 2000,
            impressions: 100000,
            clicks: 2000,
            conversions: 80,
            revenue: 6000,
            roas: 3.0
          }
        ]
      };

    } catch (error) {
      logger.error('Failed to calculate marketing metrics', error);
      return this.getDefaultMarketingMetrics();
    }
  }

  private async calculateOperationalMetrics(): Promise<OperationalMetrics> {
    try {
      // Mock operational metrics - would need staff and resource data
      return {
        staffUtilization: {
          'staff_1': 85,
          'staff_2': 75,
          'staff_3': 90
        },
        averageServiceDuration: {
          'service_1': 60,
          'service_2': 45,
          'service_3': 90
        },
        inventoryUtilization: 80,
        operationalEfficiency: 87,
        customerWaitTime: 5, // minutes
        staffPerformance: {
          'staff_1': {
            bookingsHandled: 120,
            customerRating: 4.8,
            punctuality: 95,
            efficiency: 90
          },
          'staff_2': {
            bookingsHandled: 100,
            customerRating: 4.6,
            punctuality: 90,
            efficiency: 85
          }
        },
        resourceUtilization: {
          rooms: 75,
          equipment: 80,
          products: 70
        }
      };

    } catch (error) {
      logger.error('Failed to calculate operational metrics', error);
      return this.getDefaultOperationalMetrics();
    }
  }

  private initializeKPIs(): void {
    // Define business KPIs with targets
    const kpiDefinitions = [
      { name: 'daily_revenue', target: 1000, unit: 'PLN', category: 'revenue' },
      { name: 'monthly_revenue', target: 30000, unit: 'PLN', category: 'revenue' },
      { name: 'booking_conversion_rate', target: 3.0, unit: '%', category: 'booking' },
      { name: 'customer_retention_rate', target: 80, unit: '%', category: 'customer' },
      { name: 'average_order_value', target: 250, unit: 'PLN', category: 'revenue' },
      { name: 'customer_satisfaction', target: 4.5, unit: 'stars', category: 'customer' },
      { name: 'website_conversion_rate', target: 3.0, unit: '%', category: 'marketing' },
      { name: 'return_on_ad_spend', target: 4.0, unit: 'x', category: 'marketing' },
      { name: 'operational_efficiency', target: 90, unit: '%', category: 'operational' },
      { name: 'staff_utilization', target: 85, unit: '%', category: 'operational' }
    ];

    kpiDefinitions.forEach(kpi => {
      this.kpis.set(kpi.name, {
        name: kpi.name,
        value: 0,
        target: kpi.target,
        unit: kpi.unit,
        trend: 'stable',
        change: 0,
        status: 'good',
        lastUpdated: Date.now()
      });
    });

    this.updateKPIs();
  }

  private updateKPIs(): void {
    if (!this.metrics) return;

    // Update revenue KPIs
    this.updateKPI('daily_revenue', this.metrics.revenue.today);
    this.updateKPI('monthly_revenue', this.metrics.revenue.thisMonth);
    this.updateKPI('average_order_value', this.metrics.revenue.averageOrderValue);

    // Update booking KPIs
    this.updateKPI('booking_conversion_rate', this.metrics.bookings.conversionRate * 100);

    // Update customer KPIs
    this.updateKPI('customer_retention_rate', this.metrics.customers.retentionRate);
    this.updateKPI('customer_satisfaction', this.metrics.customers.customerSatisfactionScore);

    // Update marketing KPIs
    this.updateKPI('website_conversion_rate', this.metrics.marketing.conversionRate);
    this.updateKPI('return_on_ad_spend', this.metrics.marketing.returnOnAdSpend);

    // Update operational KPIs
    this.updateKPI('operational_efficiency', this.metrics.operational.operationalEfficiency);

    // Calculate average staff utilization
    const staffUtilizations = Object.values(this.metrics.operational.staffUtilization);
    const avgStaffUtilization = staffUtilizations.length > 0
      ? staffUtilizations.reduce((sum, utilization) => sum + utilization, 0) / staffUtilizations.length
      : 0;
    this.updateKPI('staff_utilization', avgStaffUtilization);
  }

  private updateKPI(name: string, value: number): void {
    const kpi = this.kpis.get(name);
    if (!kpi) return;

    const previousValue = kpi.value;
    kpi.value = value;
    kpi.lastUpdated = Date.now();

    // Calculate trend and change
    if (previousValue > 0) {
      const change = ((value - previousValue) / previousValue) * 100;
      kpi.change = change;
      kpi.trend = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';
    }

    // Determine status
    const percentageOfTarget = (value / kpi.target) * 100;
    if (percentageOfTarget >= 100) {
      kpi.status = 'excellent';
    } else if (percentageOfTarget >= 85) {
      kpi.status = 'good';
    } else if (percentageOfTarget >= 70) {
      kpi.status = 'warning';
    } else {
      kpi.status = 'critical';
    }
  }

  private async checkBusinessAlerts(): Promise<void> {
    if (!this.metrics) return;

    const newAlerts: BusinessAlert[] = [];

    // Check revenue alerts
    if (this.metrics.revenue.today < 500) {
      newAlerts.push(this.createBusinessAlert('revenue', 'critical', 'Low Daily Revenue',
        `Daily revenue (${this.metrics.revenue.today} PLN) is below target (500 PLN)`,
        'daily_revenue', this.metrics.revenue.today, 500));
    }

    // Check booking conversion rate
    if (this.metrics.bookings.conversionRate < 0.02) {
      newAlerts.push(this.createBusinessAlert('booking', 'warning', 'Low Booking Conversion Rate',
        `Booking conversion rate (${(this.metrics.bookings.conversionRate * 100).toFixed(1)}%) is below target (2%)`,
        'booking_conversion_rate', this.metrics.bookings.conversionRate * 100, 2));
    }

    // Check customer retention
    if (this.metrics.customers.retentionRate < 70) {
      newAlerts.push(this.createBusinessAlert('customer', 'critical', 'Low Customer Retention',
        `Customer retention rate (${this.metrics.customers.retentionRate.toFixed(1)}%) is below target (70%)`,
        'customer_retention_rate', this.metrics.customers.retentionRate, 70));
    }

    // Check ROAS
    if (this.metrics.marketing.returnOnAdSpend < 2) {
      newAlerts.push(this.createBusinessAlert('marketing', 'warning', 'Low Return on Ad Spend',
        `Return on ad spend (${this.metrics.marketing.returnOnAdSpend.toFixed(1)}x) is below target (2x)`,
        'return_on_ad_spend', this.metrics.marketing.returnOnAdSpend, 2));
    }

    // Add new alerts
    newAlerts.forEach(alert => {
      if (!this.alerts.some(existing => existing.kpi === alert.kpi && existing.acknowledged === false)) {
        this.alerts.push(alert);
        realTimeMonitoringService.triggerAlert({
          type: 'business',
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metadata: {
            kpi: alert.kpi,
            currentValue: alert.currentValue,
            targetValue: alert.targetValue
          }
        });
      }
    });

    // Remove resolved alerts
    this.alerts = this.alerts.filter(alert => {
      const kpi = this.kpis.get(alert.kpi);
      if (kpi && kpi.status !== 'critical') {
        return false; // Remove alert if KPI is no longer critical
      }
      return true;
    });
  }

  private createBusinessAlert(
    type: BusinessAlert['type'],
    severity: BusinessAlert['severity'],
    title: string,
    message: string,
    kpi: string,
    currentValue: number,
    targetValue: number
  ): BusinessAlert {
    return {
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      message,
      kpi,
      currentValue,
      targetValue,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };
  }

  private startPeriodicUpdates(): void {
    // Update metrics every 5 minutes
    this.updateInterval = setInterval(() => {
      this.calculateAllMetrics().catch(error => {
        logger.error('Failed to update business metrics', error);
      });
    }, 5 * 60 * 1000);
  }

  // Default metrics methods (fallback values)
  private getDefaultRevenueMetrics(): RevenueMetrics {
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisQuarter: 0,
      thisYear: 0,
      total: 0,
      averageOrderValue: 0,
      revenueByService: {},
      revenueByPaymentMethod: {},
      revenueGrowthRate: 0,
      projectedMonthlyRevenue: 0,
      churnedRevenue: 0,
      recurringRevenue: 0
    };
  }

  private getDefaultBookingMetrics(): BookingMetrics {
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShows: 0,
      conversionRate: 0,
      averageBookingValue: 0,
      bookingsByService: {},
      bookingsByTimeSlot: {},
      bookingFunnelConversion: {
        views: 0,
        serviceSelection: 0,
        timeSelection: 0,
        details: 0,
        payment: 0,
        completed: 0
      },
      cancellationRate: 0,
      noShowRate: 0,
      rescheduleRate: 0,
      repeatBookingRate: 0
    };
  }

  private getDefaultCustomerMetrics(): CustomerMetrics {
    return {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      activeCustomers: 0,
      churnRate: 0,
      retentionRate: 0,
      customerLifetimeValue: 0,
      averageSessionsPerCustomer: 0,
      customerAcquisitionCost: 0,
      customerSatisfactionScore: 0,
      demographics: {
        ageGroups: {},
        locations: {},
        devices: {},
        sources: {}
      }
    };
  }

  private getDefaultServiceMetrics(): ServiceMetrics {
    return {
      totalServices: 0,
      activeServices: 0,
      mostPopularServices: [],
      leastPopularServices: [],
      serviceUtilization: {},
      serviceProfitability: {},
      seasonalTrends: {}
    };
  }

  private getDefaultMarketingMetrics(): MarketingMetrics {
    return {
      websiteVisitors: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      bounceRate: 0,
      averageSessionDuration: 0,
      conversionRate: 0,
      costPerAcquisition: 0,
      returnOnAdSpend: 0,
      trafficSources: {},
      marketingChannels: {},
      campaignPerformance: []
    };
  }

  private getDefaultOperationalMetrics(): OperationalMetrics {
    return {
      staffUtilization: {},
      averageServiceDuration: {},
      inventoryUtilization: 0,
      operationalEfficiency: 0,
      customerWaitTime: 0,
      staffPerformance: {},
      resourceUtilization: {
        rooms: 0,
        equipment: 0,
        products: 0
      }
    };
  }

  // Public API methods
  public getMetrics(): BusinessMetrics | null {
    return this.metrics;
  }

  public getKPIs(): Map<string, BusinessKPI> {
    return new Map(this.kpis);
  }

  public getActiveAlerts(): BusinessAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged && !alert.resolved);
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  public async refreshMetrics(): Promise<void> {
    await this.calculateAllMetrics();
    this.updateKPIs();
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const businessMetricsService = BusinessMetricsService.getInstance();

// Export convenience functions
export const initializeBusinessMetrics = () => businessMetricsService.initialize();
export const getBusinessMetrics = () => businessMetricsService.getMetrics();
export const getBusinessKPIs = () => businessMetricsService.getKPIs();
export const getBusinessAlerts = () => businessMetricsService.getActiveAlerts();
export const refreshBusinessMetrics = () => businessMetricsService.refreshMetrics();

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeBusinessMetrics().catch(console.error);
}