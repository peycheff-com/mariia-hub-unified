import { Hono } from 'hono';
import { cors } from 'hono/cors';

import {
  supabase
} from '@/integrations/supabase/client';

import {
  ValidationMiddleware,
  RateLimitMiddleware,
  ErrorMiddleware,
  AuthMiddleware,
  CommonSchemas,
  RateLimitConfigs,
  Permissions
} from '../middleware';
import { enhancedBookingService } from '../../enhanced-booking.service';
import { bookingDomainService } from '../../bookingDomainService';
import { waitlistService } from '../../waitlist.service';
import { groupBookingService } from '../../groupBooking.service';

const app = new Hono();

// Apply CORS middleware
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Apply global middleware
app.use('*', ErrorMiddleware.handleErrors());
app.use('*', RateLimitMiddleware.rateLimit(RateLimitConfigs.api));

// Routes

/**
 * GET /api/v1/bookings/availability
 * Check availability for a service
 */
app.get('/availability',
  ValidationMiddleware.validate({
    query: {
      service_id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f-]{36}$/,
        patternMessage: 'Invalid service ID format'
      },
      date: {
        type: 'string',
        format: 'date',
        required: true
      },
      group_size: {
        type: 'number',
        min: 1,
        max: 20,
        required: false
      },
      location: {
        type: 'string',
        enum: ['studio', 'online', 'fitness'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { service_id, date, group_size, location } = c.req.query();

      const availability = await enhancedBookingService.checkAvailability({
        serviceId: service_id!,
        date: new Date(date!),
        groupSize: group_size ? parseInt(group_size) : undefined,
        location: location as any
      });

      return c.json({
        success: true,
        data: availability
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/bookings
 * Create a new booking
 */
app.post('/',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: CommonSchemas.createBooking.body
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.booking),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const bookingData = await c.req.json();

      const bookingRequest = {
        serviceId: bookingData.service_id,
        timeSlot: {
          id: `${bookingData.service_id}-${bookingData.booking_date}-${bookingData.booking_time}`,
          date: new Date(bookingData.booking_date),
          time: bookingData.booking_time,
          available: false,
          location: bookingData.location_type || 'studio'
        },
        details: {
          client_name: bookingData.client_name,
          client_email: bookingData.client_email,
          client_phone: bookingData.client_phone,
          notes: bookingData.notes,
          consent_terms: bookingData.consent_terms_accepted,
          consent_marketing: bookingData.consent_marketing_accepted
        },
        userId: user?.id,
        paymentDetails: bookingData.payment_details
      };

      const result = await enhancedBookingService.createBooking(bookingRequest);

      if (result.success) {
        return c.json({
          success: true,
          data: {
            booking: result.booking,
            requiresPayment: result.requiresPayment,
            paymentIntentId: result.paymentIntentId,
            loyaltyPointsEarned: result.loyaltyPointsEarned
          }
        }, 201);
      } else {
        return c.json({
          success: false,
          error: result.error
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/bookings
 * Get user's bookings (with pagination and filtering)
 */
app.get('/',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    query: {
      ...CommonSchemas.pagination.query,
      status: {
        type: 'string',
        enum: ['draft', 'pending', 'confirmed', 'completed', 'cancelled'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const { page = 1, limit = 20, status } = c.req.query();

      const result = await enhancedBookingService.getUserBookings(user!.id, {
        status: status as any,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return c.json({
        success: true,
        data: {
          bookings: result.bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bookings'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/bookings/:id
 * Get a specific booking
 */
app.get('/:id',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    params: CommonSchemas.idParam.params
  }),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = AuthMiddleware.getCurrentUser(c);

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(*)
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error || !booking) {
        return c.json({
          success: false,
          error: 'Booking not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: booking
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get booking'
      }, 500);
    }
  }
);

/**
 * PUT /api/v1/bookings/:id/reschedule
 * Reschedule a booking
 */
app.put('/:id/reschedule',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    params: CommonSchemas.idParam.params,
    body: {
      new_date: {
        type: 'string',
        format: 'date',
        required: true
      },
      new_time: {
        type: 'string',
        required: true,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        patternMessage: 'Time must be in HH:MM format'
      }
    }
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.strict),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = AuthMiddleware.getCurrentUser(c);
      const { new_date, new_time } = await c.req.json();

      const result = await enhancedBookingService.rescheduleBooking(
        id!,
        user!.id,
        new Date(new_date!),
        new_time!
      );

      if (result.success) {
        return c.json({
          success: true,
          data: {
            booking: result.booking
          }
        });
      } else {
        return c.json({
          success: false,
          error: result.error
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule booking'
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/bookings/:id
 * Cancel a booking
 */
app.delete('/:id',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    params: CommonSchemas.idParam.params,
    body: {
      reason: {
        type: 'string',
        maxLength: 500,
        required: false
      }
    }
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.strict),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = AuthMiddleware.getCurrentUser(c);
      const { reason } = await c.req.json();

      const result = await enhancedBookingService.cancelBooking(
        id!,
        user!.id,
        reason
      );

      if (result.success) {
        return c.json({
          success: true,
          data: {
            refundAmount: result.refundAmount
          }
        });
      } else {
        return c.json({
          success: false,
          error: result.error
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel booking'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/bookings/group
 * Create a group booking
 */
app.post('/group',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      service_id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f-]{36}$/
      },
      booking_date: {
        type: 'string',
        format: 'date',
        required: true
      },
      booking_time: {
        type: 'string',
        required: true,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      group_size: {
        type: 'number',
        required: true,
        min: 2,
        max: 20
      },
      primary_contact_name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100
      },
      primary_contact_email: {
        type: 'string',
        format: 'email',
        required: true
      },
      primary_contact_phone: {
        type: 'string',
        format: 'phone',
        required: true
      },
      participants: {
        type: 'array',
        minItems: 2,
        maxItems: 20,
        required: true
      }
    }
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.booking),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const groupData = await c.req.json();

      const groupBookingData = {
        step1: {
          serviceId: groupData.service_id,
          isGroupBooking: true,
          groupSize: groupData.group_size,
          participants: groupData.participants,
          specialRequests: groupData.special_requests
        },
        step2: {
          selectedDate: new Date(groupData.booking_date),
          selectedTime: groupData.booking_time
        },
        step3: {
          firstName: groupData.primary_contact_name.split(' ')[0],
          lastName: groupData.primary_contact_name.split(' ').slice(1).join(' '),
          email: groupData.primary_contact_email,
          phone: groupData.primary_contact_phone
        }
      };

      const groupBooking = await groupBookingService.createGroupBooking(groupBookingData);

      return c.json({
        success: true,
        data: groupBooking
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group booking'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/bookings/waitlist
 * Add to waitlist
 */
app.post('/waitlist',
  AuthMiddleware.optional(),
  ValidationMiddleware.validate({
    body: {
      service_id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f-]{36}$/
      },
      preferred_date: {
        type: 'string',
        format: 'date',
        required: true
      },
      preferred_time: {
        type: 'string',
        required: true,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      flexible_with_time: {
        type: 'boolean',
        required: false
      },
      contact_email: {
        type: 'string',
        format: 'email',
        required: true
      },
      contact_phone: {
        type: 'string',
        format: 'phone',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const waitlistData = await c.req.json();

      const waitlistEntry = await waitlistService.addToWaitlist({
        serviceId: waitlistData.service_id,
        userId: user?.id,
        preferredDate: new Date(waitlistData.preferred_date),
        preferredTime: waitlistData.preferred_time,
        locationType: 'studio',
        groupSize: 1,
        flexibleWithTime: waitlistData.flexible_with_time || false,
        flexibleWithLocation: false,
        contactEmail: waitlistData.contact_email,
        contactPhone: waitlistData.contact_phone,
        notes: waitlistData.notes,
        autoPromoteEligible: true,
        maxPromotionAttempts: 3
      });

      return c.json({
        success: true,
        data: waitlistEntry
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to waitlist'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/bookings/waitlist
 * Get user's waitlist entries
 */
app.get('/waitlist',
  AuthMiddleware.authenticate(),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);

      const entries = await waitlistService.getUserWaitlistEntries(user!.id);

      return c.json({
        success: true,
        data: entries
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get waitlist entries'
      }, 500);
    }
  }
);

export default app;