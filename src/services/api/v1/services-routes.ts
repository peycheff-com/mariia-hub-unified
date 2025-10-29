import { Hono } from 'hono';

import { supabase } from '@/integrations/supabase/client';

import {
  ValidationMiddleware,
  RateLimitMiddleware,
  AuthMiddleware,
  CommonSchemas,
  RateLimitConfigs
} from '../middleware';

const app = new Hono();

// Apply rate limiting
app.use('*', RateLimitMiddleware.rateLimit(RateLimitConfigs.api));

/**
 * GET /api/v1/services
 * Get all services with filtering
 */
app.get('/',
  ValidationMiddleware.validate({
    query: CommonSchemas.serviceQuery
  }),
  async (c) => {
    try {
      const {
        type,
        category,
        active,
        limit = 50,
        offset = 0
      } = c.req.query();

      let query = supabase
        .from('services')
        .select(`
          *,
          service_gallery (
            id,
            image_url,
            caption,
            display_order
          )
        `)
        .order('display_order', { ascending: true })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply filters
      if (type) {
        query = query.eq('service_type', type);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (active !== undefined) {
        query = query.eq('is_active', active === 'true');
      } else {
        // Default to only active services
        query = query.eq('is_active', true);
      }

      const { data: services, error, count } = await query;

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        data: {
          services: services || [],
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: count || 0,
            hasMore: (count || 0) > parseInt(offset) + parseInt(limit)
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/services/:id
 * Get a specific service by ID
 */
app.get('/:id',
  ValidationMiddleware.validate({
    params: CommonSchemas.idParam.params
  }),
  async (c) => {
    try {
      const { id } = c.req.param();

      const { data: service, error } = await supabase
        .from('services')
        .select(`
          *,
          service_gallery (
            id,
            image_url,
            caption,
            display_order
          ),
          service_faqs (
            id,
            question,
            answer,
            display_order
          ),
          service_content (
            id,
            what_to_expect,
            preparation,
            aftercare,
            contraindications,
            duration_notes,
            pricing_notes
          ),
          availability_slots (
            id,
            day_of_week,
            start_time,
            end_time,
            is_available,
            capacity
          )
        `)
        .eq('id', id)
        .single();

      if (error || !service) {
        return c.json({
          success: false,
          error: 'Service not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: service
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/services/search
 * Search services
 */
app.get('/search',
  ValidationMiddleware.validate({
    query: {
      q: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100
      },
      type: {
        type: 'string',
        enum: ['beauty', 'fitness', 'lifestyle'],
        required: false
      },
      category: {
        type: 'string',
        maxLength: 50,
        required: false
      },
      limit: {
        type: 'number',
        min: 1,
        max: 50,
        required: false
      }
    }
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.search),
  async (c) => {
    try {
      const { q, type, category, limit = 20 } = c.req.query();

      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          slug,
          description,
          service_type,
          category,
          price_from,
          price_to,
          duration_minutes,
          image_url,
          is_active,
          display_order,
          service_gallery (
            id,
            image_url,
            caption,
            display_order
          )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(parseInt(limit));

      // Build search query
      const searchQuery = q!.trim();
      const searchConditions = [
        `title.ilike.%${searchQuery}%`,
        `description.ilike.%${searchQuery}%`,
        `category.ilike.%${searchQuery}%`
      ];

      query = query.or(searchConditions.join(','));

      if (type) {
        query = query.eq('service_type', type);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data: services, error } = await query;

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        data: {
          query: searchQuery,
          filters: { type, category },
          services: services || [],
          count: services?.length || 0
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/services/categories
 * Get service categories
 */
app.get('/categories',
  ValidationMiddleware.validate({
    query: {
      type: {
        type: 'string',
        enum: ['beauty', 'fitness', 'lifestyle'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { type } = c.req.query();

      let query = supabase
        .from('services')
        .select('category')
        .eq('is_active', true);

      if (type) {
        query = query.eq('service_type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Extract unique categories
      const categories = [...new Set(data?.map(s => s.category).filter(Boolean) || [])];

      return c.json({
        success: true,
        data: {
          categories,
          type: type || 'all'
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/services/featured
 * Get featured services
 */
app.get('/featured',
  async (c) => {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          service_gallery (
            id,
            image_url,
            caption,
            display_order
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        data: {
          services: services || [],
          count: services?.length || 0
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured services'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/services/:id/availability
 * Get availability for a specific service
 */
app.get('/:id/availability',
  ValidationMiddleware.validate({
    params: CommonSchemas.idParam.params,
    query: {
      date: {
        type: 'string',
        format: 'date',
        required: false
      },
      days: {
        type: 'number',
        min: 1,
        max: 30,
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { date, days = 7 } = c.req.query();

      // Get service details first
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (serviceError || !service) {
        return c.json({
          success: false,
          error: 'Service not found or inactive'
        }, 404);
      }

      // Calculate date range
      const startDate = date ? new Date(date) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(days.toString()));

      // Get availability slots
      const { data: availability, error: availabilityError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('service_type', service.service_type)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (availabilityError) {
        throw availabilityError;
      }

      // Get existing bookings for the date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_date, booking_time, duration_minutes')
        .eq('service_id', id)
        .in('status', ['pending', 'confirmed'])
        .gte('booking_date', startDate.toISOString().split('T')[0])
        .lte('booking_date', endDate.toISOString().split('T')[0]);

      if (bookingsError) {
        throw bookingsError;
      }

      // Process availability to return time slots
      const processedAvailability = processAvailabilitySlots(
        availability || [],
        bookings || [],
        service
      );

      return c.json({
        success: true,
        data: {
          service: {
            id: service.id,
            title: service.title,
            duration_minutes: service.duration_minutes,
            service_type: service.service_type
          },
          date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          availability: processedAvailability
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch availability'
      }, 500);
    }
  }
);

// Helper function to process availability slots
function processAvailabilitySlots(
  availability: any[],
  bookings: any[],
  service: any
): Array<{ date: string; slots: Array<{ time: string; available: boolean }> }> {
  const slotDuration = 30; // 30-minute slots
  const results: Array<{ date: string; slots: Array<{ time: string; available: boolean }> }> = [];

  // Group availability by date
  const availabilityByDate = availability.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, any[]>);

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = booking.booking_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, any[]>);

  // Process each date
  Object.keys(availabilityByDate).forEach(date => {
    const dayAvailability = availabilityByDate[date][0]; // Assume one slot per day for now
    const dayBookings = bookingsByDate[date] || [];

    if (!dayAvailability) {
      // If no explicit availability, use default hours
      const defaultSlots = generateDefaultSlots(date, service, dayBookings);
      if (defaultSlots.length > 0) {
        results.push({ date, slots: defaultSlots });
      }
      return;
    }

    const slots = generateTimeSlots(
      dayAvailability.start_time,
      dayAvailability.end_time,
      service.duration_minutes,
      dayBookings
    );

    results.push({ date, slots });
  });

  return results;
}

function generateDefaultSlots(
  date: string,
  service: any,
  bookings: any[]
): Array<{ time: string; available: boolean }> {
  // Default business hours (9 AM - 6 PM)
  const startTime = '09:00';
  const endTime = '18:00';

  return generateTimeSlots(startTime, endTime, service.duration_minutes, bookings);
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  serviceDuration: number,
  bookings: any[]
): Array<{ time: string; available: boolean }> {
  const slots = [];
  const slotDuration = Math.max(serviceDuration, 30); // Use service duration or 30 min, whichever is greater
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes + serviceDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Check if this slot conflicts with existing bookings
    const isAvailable = !bookings.some(booking => {
      const bookingMinutes = parseTimeToMinutes(booking.booking_time);
      const bookingEndMinutes = bookingMinutes + (booking.duration_minutes || serviceDuration);
      const slotEndMinutes = currentMinutes + serviceDuration;

      return (
        (currentMinutes >= bookingMinutes && currentMinutes < bookingEndMinutes) ||
        (slotEndMinutes > bookingMinutes && slotEndMinutes <= bookingEndMinutes) ||
        (currentMinutes <= bookingMinutes && slotEndMinutes >= bookingEndMinutes)
      );
    });

    slots.push({ time: timeStr, available: isAvailable });
    currentMinutes += slotDuration;
  }

  return slots;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default app;