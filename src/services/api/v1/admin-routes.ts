import { Hono } from 'hono';

import { supabase } from '@/integrations/supabase/client';

import {
  ValidationMiddleware,
  RateLimitMiddleware,
  AuthMiddleware,
  RateLimitConfigs,
  Permissions
} from '../middleware';
import { waitlistService } from '../../waitlist.service';
import { loyaltyProgramService } from '../../loyaltyProgramService';

const app = new Hono();

// Apply admin-only middleware
app.use('*', AuthMiddleware.requireRole('admin'));
app.use('*', RateLimitMiddleware.rateLimit(RateLimitConfigs.api));

/**
 * GET /api/v1/admin/dashboard/stats
 * Get dashboard statistics
 */
app.get('/dashboard/stats',
  AuthMiddleware.requirePermission(Permissions.ANALYTICS_READ),
  async (c) => {
    try {
      // Get booking stats
      const { data: bookingStats } = await supabase
        .from('bookings')
        .select('status, created_at, price_from')
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      // Get service stats
      const { data: serviceStats } = await supabase
        .from('services')
        .select('service_type, is_active, created_at');

      // Get user stats
      const { data: userStats } = await supabase
        .from('user_profiles')
        .select('role, created_at')
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      // Get revenue stats
      const { data: revenueStats } = await supabase
        .from('bookings')
        .select('amount_paid, currency, created_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      // Calculate statistics
      const totalBookings = bookingStats?.length || 0;
      const completedBookings = bookingStats?.filter(b => b.status === 'completed').length || 0;
      const pendingBookings = bookingStats?.filter(b => b.status === 'pending').length || 0;
      const cancelledBookings = bookingStats?.filter(b => b.status === 'cancelled').length || 0;

      const totalRevenue = revenueStats?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      const totalUsers = userStats?.length || 0;
      const activeServices = serviceStats?.filter(s => s.is_active).length || 0;
      const totalServices = serviceStats?.length || 0;

      // Calculate trends (last 7 days vs previous 7 days)
      const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
      const fourteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 14));

      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', fourteenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString());

      const bookingTrend = {
        current: recentBookings?.length || 0,
        previous: previousBookings?.length || 0,
        change: previousBookings?.length ?
          ((recentBookings?.length || 0) - previousBookings.length) / previousBookings.length * 100 : 0
      };

      // Service type breakdown
      const serviceTypeBreakdown = serviceStats?.reduce((acc, service) => {
        acc[service.service_type] = (acc[service.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return c.json({
        success: true,
        data: {
          overview: {
            totalBookings,
            completedBookings,
            pendingBookings,
            cancelledBookings,
            totalRevenue,
            totalUsers,
            activeServices,
            totalServices
          },
          trends: {
            bookings: bookingTrend
          },
          breakdowns: {
            serviceTypes: serviceTypeBreakdown
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/bookings
 * Get all bookings with filtering and pagination
 */
app.get('/bookings',
  AuthMiddleware.requirePermission(Permissions.BOOKING_READ_ALL),
  ValidationMiddleware.validate({
    query: {
      ...CommonSchemas.pagination.query,
      status: {
        type: 'string',
        enum: ['draft', 'pending', 'confirmed', 'completed', 'cancelled'],
        required: false
      },
      service_type: {
        type: 'string',
        enum: ['beauty', 'fitness', 'lifestyle'],
        required: false
      },
      date_from: {
        type: 'string',
        format: 'date',
        required: false
      },
      date_to: {
        type: 'string',
        format: 'date',
        required: false
      },
      user_id: {
        type: 'string',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        service_type,
        date_from,
        date_to,
        user_id
      } = c.req.query();

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            price_from
          ),
          user_profiles (
            id,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (service_type) {
        query = query.eq('services.service_type', service_type);
      }

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (date_from) {
        query = query.gte('booking_date', date_from);
      }

      if (date_to) {
        query = query.lte('booking_date', date_to);
      }

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data: bookings, error, count } = await query;

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        data: {
          bookings: bookings || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / parseInt(limit))
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/analytics/revenue
 * Get revenue analytics
 */
app.get('/analytics/revenue',
  AuthMiddleware.requirePermission(Permissions.ANALYTICS_READ),
  ValidationMiddleware.validate({
    query: {
      period: {
        type: 'string',
        enum: ['7d', '30d', '90d', '1y'],
        required: false
      },
      group_by: {
        type: 'string',
        enum: ['day', 'week', 'month'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { period = '30d', group_by = 'day' } = c.req.query();

      // Calculate date range
      let daysBack = 30;
      switch (period) {
        case '7d': daysBack = 7; break;
        case '30d': daysBack = 30; break;
        case '90d': daysBack = 90; break;
        case '1y': daysBack = 365; break;
      }

      const startDate = new Date(new Date().setDate(new Date().getDate() - daysBack));

      // Get completed bookings with revenue data
      const { data: revenueData, error } = await supabase
        .from('bookings')
        .select('amount_paid, currency, created_at, services(service_type)')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Group revenue by specified period
      const groupedRevenue = revenueData?.reduce((acc, booking) => {
        const date = new Date(booking.created_at);
        let key: string;

        switch (group_by) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = date.toISOString().substring(0, 7); // YYYY-MM
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!acc[key]) {
          acc[key] = {
            period: key,
            revenue: 0,
            bookings: 0,
            serviceTypes: {}
          };
        }

        acc[key].revenue += booking.amount_paid || 0;
        acc[key].bookings += 1;
        acc[key].serviceTypes[booking.services.service_type] =
          (acc[key].serviceTypes[booking.services.service_type] || 0) + 1;

        return acc;
      }, {} as Record<string, any>) || {};

      const revenueArray = Object.values(groupedRevenue);

      return c.json({
        success: true,
        data: {
          period,
          groupBy: group_by,
          revenue: revenueArray,
          summary: {
            totalRevenue: revenueArray.reduce((sum, r) => sum + r.revenue, 0),
            totalBookings: revenueArray.reduce((sum, r) => sum + r.bookings, 0),
            averageRevenuePerBooking: revenueArray.length > 0 ?
              revenueArray.reduce((sum, r) => sum + r.revenue, 0) / revenueArray.length : 0
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch revenue analytics'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/analytics/services
 * Get service performance analytics
 */
app.get('/analytics/services',
  AuthMiddleware.requirePermission(Permissions.ANALYTICS_READ),
  ValidationMiddleware.validate({
    query: {
      period: {
        type: 'string',
        enum: ['7d', '30d', '90d', '1y'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { period = '30d' } = c.req.query();

      // Calculate date range
      let daysBack = 30;
      switch (period) {
        case '7d': daysBack = 7; break;
        case '30d': daysBack = 30; break;
        case '90d': daysBack = 90; break;
        case '1y': daysBack = 365; break;
      }

      const startDate = new Date(new Date().setDate(new Date().getDate() - daysBack));

      // Get service performance data
      const { data: serviceData, error } = await supabase
        .from('bookings')
        .select(`
          services (
            id,
            title,
            service_type,
            price_from
          ),
          status,
          created_at,
          amount_paid
        `)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      // Group by service
      const servicePerformance = serviceData?.reduce((acc, booking) => {
        const serviceId = booking.services.id;
        const serviceTitle = booking.services.title;
        const serviceType = booking.services.service_type;

        if (!acc[serviceId]) {
          acc[serviceId] = {
            id: serviceId,
            title: serviceTitle,
            serviceType,
            priceFrom: booking.services.price_from,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            pendingBookings: 0,
            totalRevenue: 0,
            completionRate: 0,
            averageRevenue: 0
          };
        }

        acc[serviceId].totalBookings += 1;

        switch (booking.status) {
          case 'completed':
            acc[serviceId].completedBookings += 1;
            acc[serviceId].totalRevenue += booking.amount_paid || 0;
            break;
          case 'cancelled':
            acc[serviceId].cancelledBookings += 1;
            break;
          case 'pending':
          case 'confirmed':
            acc[serviceId].pendingBookings += 1;
            break;
        }

        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate completion rates and averages
      Object.values(servicePerformance).forEach(service => {
        service.completionRate = service.totalBookings > 0 ?
          (service.completedBookings / service.totalBookings) * 100 : 0;
        service.averageRevenue = service.completedBookings > 0 ?
          service.totalRevenue / service.completedBookings : 0;
      });

      const performanceArray = Object.values(servicePerformance);

      return c.json({
        success: true,
        data: {
          period,
          services: performanceArray,
          summary: {
            totalServices: performanceArray.length,
            totalBookings: performanceArray.reduce((sum, s) => sum + s.totalBookings, 0),
            totalRevenue: performanceArray.reduce((sum, s) => sum + s.totalRevenue, 0),
            averageCompletionRate: performanceArray.length > 0 ?
              performanceArray.reduce((sum, s) => sum + s.completionRate, 0) / performanceArray.length : 0
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service analytics'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/waitlist/stats
 * Get waitlist statistics
 */
app.get('/waitlist/stats',
  AuthMiddleware.requirePermission(Permissions.BOOKING_READ_ALL),
  async (c) => {
    try {
      const stats = await waitlistService.getWaitlistStats();

      return c.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch waitlist stats'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/loyalty/stats
 * Get loyalty program statistics
 */
app.get('/loyalty/stats',
  AuthMiddleware.requirePermission(Permissions.ANALYTICS_READ),
  async (c) => {
    try {
      // Get loyalty program stats
      const { data: loyaltyStats, error } = await supabase
        .from('customer_points')
        .select(`
          current_balance,
          total_earned,
          total_redeemed,
          loyalty_tiers (
            name,
            min_points
          )
        `);

      if (error) {
        throw error;
      }

      // Get tier breakdown
      const tierBreakdown = loyaltyStats?.reduce((acc, customer) => {
        const tierName = customer.loyalty_tiers.name;
        acc[tierName] = (acc[tierName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate totals
      const totalPointsIssued = loyaltyStats?.reduce((sum, c) => sum + c.total_earned, 0) || 0;
      const totalPointsRedeemed = loyaltyStats?.reduce((sum, c) => sum + c.total_redeemed, 0) || 0;
      const totalActivePoints = loyaltyStats?.reduce((sum, c) => sum + c.current_balance, 0) || 0;
      const totalCustomers = loyaltyStats?.length || 0;

      return c.json({
        success: true,
        data: {
          overview: {
            totalCustomers,
            totalPointsIssued,
            totalPointsRedeemed,
            totalActivePoints,
            averagePointsPerCustomer: totalCustomers > 0 ? totalActivePoints / totalCustomers : 0
          },
          tierBreakdown
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch loyalty stats'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/admin/health/system
 * Get system health metrics
 */
app.get('/health/system',
  AuthMiddleware.requirePermission(Permissions.SYSTEM_HEALTH),
  async (c) => {
    try {
      // Database health check
      const { data: dbHealth, error: dbError } = await supabase
        .from('services')
        .select('id')
        .limit(1);

      // Recent activity check
      const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000);
      const { data: recentActivity } = await supabase
        .from('bookings')
        .select('id')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(1);

      // Error rate check (last hour)
      const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);
      const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('id')
        .gte('created_at', oneHourAgo.toISOString());

      const healthStatus = {
        database: {
          status: !dbError ? 'healthy' : 'unhealthy',
          responseTime: dbHealth ? 'fast' : 'slow'
        },
        activity: {
          status: recentActivity && recentActivity.length > 0 ? 'active' : 'low',
          lastActivity: recentActivity?.[0]?.id || 'none'
        },
        errors: {
          count: errorLogs?.length || 0,
          status: (errorLogs?.length || 0) < 10 ? 'normal' : 'elevated'
        },
        overall: !dbError && (errorLogs?.length || 0) < 10 ? 'healthy' : 'degraded'
      };

      return c.json({
        success: true,
        data: {
          status: healthStatus.overall,
          checks: healthStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check system health'
      }, 500);
    }
  }
);

export default app;