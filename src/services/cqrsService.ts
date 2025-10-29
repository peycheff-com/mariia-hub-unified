// Command Query Responsibility Segregation (CQRS) Service
// Separates read and write operations for optimized performance

import { supabase } from '@/integrations/supabase/client';

import { cacheService } from './cacheService';
import { BookingEvent, bookingDomainService } from './bookingDomainService';

// Command types (write operations)
export interface Command {
  id: string;
  type: string;
  aggregateId: string;
  data: any;
  timestamp: Date;
  userId?: string;
  version: number;
}

export interface CreateBookingCommand extends Command {
  type: 'CreateBooking';
  data: {
    serviceId: string;
    timeSlot: any;
    clientDetails: any;
    location: string;
  };
}

export interface UpdateBookingStatusCommand extends Command {
  type: 'UpdateBookingStatus';
  data: {
    status: string;
    reason?: string;
  };
}

export interface CancelBookingCommand extends Command {
  type: 'CancelBooking';
  data: {
    reason: string;
    refundAmount?: number;
  };
}

export interface CreateHoldCommand extends Command {
  type: 'CreateHold';
  data: {
    serviceId: string;
    slotId: string;
    userId: string;
    sessionId: string;
  };
}

// Query types (read operations)
export interface Query {
  id: string;
  type: string;
  parameters: any;
  timestamp: Date;
}

export interface GetBookingQuery extends Query {
  type: 'GetBooking';
  parameters: {
    bookingId: string;
  };
}

export interface GetBookingsQuery extends Query {
  type: 'GetBookings';
  parameters: {
    filters?: {
      status?: string;
      serviceType?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    };
    pagination?: {
      page: number;
      limit: number;
    };
  };
}

export interface GetAvailabilityQuery extends Query {
  type: 'GetAvailability';
  parameters: {
    serviceId: string;
    date: string;
    location?: string;
  };
}

export interface GetCalendarViewQuery extends Query {
  type: 'GetCalendarView';
  parameters: {
    serviceType?: string;
    startDate: string;
    endDate: string;
    view: 'month' | 'week' | 'day';
  };
}

// Event Store (for event sourcing)
interface Event {
  id: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  data: any;
  version: number;
  timestamp: Date;
  userId?: string;
}

// Read Models (optimized for queries)
interface BookingReadModel {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceType: string;
  status: string;
  clientName: string;
  clientEmail: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  // Denormalized fields for faster queries
  serviceImage?: string;
  serviceDuration: number;
  clientPhone?: string;
  notes?: string;
  adminNotes?: string;
}

interface AvailabilityReadModel {
  id: string;
  serviceId: string;
  serviceType: string;
  date: string;
  timeSlots: Array<{
    id: string;
    time: string;
    available: boolean;
    location: string;
    price?: number;
  }>;
  lastUpdated: Date;
}

interface CalendarReadModel {
  date: string;
  serviceType: string;
  bookings: Array<{
    id: string;
    time: string;
    service: string;
    client: string;
    status: string;
    location: string;
  }>;
  availableSlots: number;
  totalSlots: number;
  revenue: number;
}

class CQRSService {
  private static instance: CQRSService;
  private commandHandlers = new Map<string, (command: Command) => Promise<any>>();
  private queryHandlers = new Map<string, (query: Query) => Promise<any>>();
  private eventStore: Event[] = [];

  static getInstance(): CQRSService {
    if (!CQRSService.instance) {
      CQRSService.instance = new CQRSService();
      CQRSService.instance.setupHandlers();
    }
    return CQRSService.instance;
  }

  private setupHandlers(): void {
    // Command Handlers
    this.commandHandlers.set('CreateBooking', this.handleCreateBooking.bind(this));
    this.commandHandlers.set('UpdateBookingStatus', this.handleUpdateBookingStatus.bind(this));
    this.commandHandlers.set('CancelBooking', this.handleCancelBooking.bind(this));
    this.commandHandlers.set('CreateHold', this.handleCreateHold.bind(this));
    this.commandHandlers.set('ReleaseHold', this.handleReleaseHold.bind(this));

    // Query Handlers
    this.queryHandlers.set('GetBooking', this.handleGetBooking.bind(this));
    this.queryHandlers.set('GetBookings', this.handleGetBookings.bind(this));
    this.queryHandlers.set('GetAvailability', this.handleGetAvailability.bind(this));
    this.queryHandlers.set('GetCalendarView', this.handleGetCalendarView.bind(this));
    this.queryHandlers.set('GetBookingStats', this.handleGetBookingStats.bind(this));
  }

  // Command execution
  async executeCommand(command: Command): Promise<any> {
    const handler = this.commandHandlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler for command type: ${command.type}`);
    }

    try {
      // Validate command
      this.validateCommand(command);

      // Execute command
      const result = await handler(command);

      // Store event for event sourcing
      const event: Event = {
        id: crypto.randomUUID(),
        aggregateId: command.aggregateId,
        aggregateType: this.getAggregateType(command.type),
        type: command.type.replace('Command', 'Event'),
        data: command.data,
        version: command.version,
        timestamp: new Date(),
        userId: command.userId,
      };

      this.eventStore.push(event);

      // Update read models
      await this.updateReadModels(event);

      // Invalidate relevant caches
      await this.invalidateCaches(event);

      return result;
    } catch (error) {
      console.error(`Command execution failed: ${command.type}`, error);
      throw error;
    }
  }

  // Query execution
  async executeQuery(query: Query): Promise<any> {
    const handler = this.queryHandlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler for query type: ${query.type}`);
    }

    try {
      // Check cache first
      const cacheKey = this.getQueryCacheKey(query);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute query
      const result = await handler(query);

      // Cache result
      await this.setCache(cacheKey, result, this.getCacheTTL(query.type));

      return result;
    } catch (error) {
      console.error(`Query execution failed: ${query.type}`, error);
      throw error;
    }
  }

  // Command Handlers
  private async handleCreateBooking(command: CreateBookingCommand): Promise<any> {
    const { serviceId, timeSlot, clientDetails, location } = command.data;

    // Create booking in write model
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        service_id: serviceId,
        status: 'pending',
        booking_date: timeSlot.date,
        booking_time: timeSlot.time,
        client_name: clientDetails.name,
        client_email: clientDetails.email,
        client_phone: clientDetails.phone,
        location_type: location,
        metadata: {
          ...clientDetails,
          timeSlot,
          commandId: command.id,
        },
      })
      .select(`
        *,
        service:services(*)
      `)
      .single();

    if (error) throw error;

    // Emit domain event
    bookingDomainService.emit({
      type: 'booking.created',
      booking: {
        id: booking.id,
        service_id: serviceId,
        status: 'pending',
        service: booking.service,
        timeSlot,
        details: clientDetails,
      },
    });

    return booking;
  }

  private async handleUpdateBookingStatus(command: UpdateBookingStatusCommand): Promise<any> {
    const { status, reason } = command.data;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata: {
          statusChangeReason: reason,
          commandId: command.id,
        },
      })
      .eq('id', command.aggregateId)
      .single();

    if (error) throw error;

    // Emit domain event
    bookingDomainService.emit({
      type: 'booking.updated',
      bookingId: command.aggregateId,
      status,
    });

    return booking;
  }

  private async handleCancelBooking(command: CancelBookingCommand): Promise<any> {
    const { reason, refundAmount } = command.data;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        metadata: {
          cancellationReason: reason,
          refundAmount,
          commandId: command.id,
        },
      })
      .eq('id', command.aggregateId)
      .single();

    if (error) throw error;

    // Release any holds
    await this.releaseHoldsForBooking(command.aggregateId);

    // Emit domain event
    bookingDomainService.emit({
      type: 'booking.cancelled',
      bookingId: command.aggregateId,
      reason,
    });

    return booking;
  }

  private async handleCreateHold(command: CreateHoldCommand): Promise<any> {
    const { serviceId, slotId, userId, sessionId } = command.data;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { data: hold, error } = await supabase
      .from('holds')
      .insert({
        user_id: userId,
        service_id: serviceId,
        resource_id: 'mariia',
        start_time: new Date(),
        end_time: new Date(),
        expires_at: expiresAt.toISOString(),
        session_id: sessionId,
        metadata: {
          slotId,
          commandId: command.id,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Cache hold
    await cacheService.cacheHold({
      slotId,
      userId,
      expiresAt,
      sessionId,
    });

    // Emit domain event
    bookingDomainService.emit({
      type: 'slot.reserved',
      slotId,
      userId,
      expiresAt,
    });

    return hold;
  }

  private async handleReleaseHold(command: Command): Promise<any> {
    const { holdId } = command.data;

    // Get hold details before deleting
    const { data: hold } = await supabase
      .from('holds')
      .select('metadata->>slotId, user_id')
      .eq('id', holdId)
      .single();

    // Delete hold
    const { error } = await supabase
      .from('holds')
      .delete()
      .eq('id', holdId);

    if (error) throw error;

    // Remove from cache
    if (hold?.metadata?.slotId) {
      await cacheService.removeHoldFromCache(hold.metadata.slotId);

      // Emit domain event
      bookingDomainService.emit({
        type: 'slot.released',
        slotId: hold.metadata.slotId,
      });
    }

    return { success: true };
  }

  // Query Handlers
  private async handleGetBooking(query: GetBookingQuery): Promise<BookingReadModel | null> {
    const { bookingId } = query.parameters;

    // Use optimized read model query
    const { data, error } = await supabase
      .from('booking_read_model')
      .select(`
        *,
        service:services(title, image_url, duration_minutes)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !data) return null;

    // Transform to read model format
    return {
      id: data.id,
      serviceId: data.service_id,
      serviceTitle: data.service?.title || '',
      serviceType: data.service_type,
      status: data.status,
      clientName: data.client_name,
      clientEmail: data.client_email,
      bookingDate: data.booking_date,
      bookingTime: data.booking_time,
      location: data.location_type,
      amount: data.amount_paid,
      currency: data.currency,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      serviceImage: data.service?.image_url,
      serviceDuration: data.service?.duration_minutes || 0,
      clientPhone: data.client_phone,
      notes: data.metadata?.notes,
      adminNotes: data.metadata?.admin_notes,
    };
  }

  private async handleGetBookings(query: GetBookingsQuery): Promise<{
    bookings: BookingReadModel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { filters = {}, pagination = { page: 1, limit: 20 } } = query.parameters;

    let queryBuilder = supabase
      .from('booking_read_model')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status);
    }
    if (filters.serviceType) {
      queryBuilder = queryBuilder.eq('service_type', filters.serviceType);
    }
    if (filters.dateFrom) {
      queryBuilder = queryBuilder.gte('booking_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryBuilder = queryBuilder.lte('booking_date', filters.dateTo);
    }
    if (filters.userId) {
      queryBuilder = queryBuilder.eq('user_id', filters.userId);
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;

    const { data, error, count } = await queryBuilder
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      bookings: data || [],
      total: count || 0,
      page: pagination.page,
      totalPages: Math.ceil((count || 0) / pagination.limit),
    };
  }

  private async handleGetAvailability(query: GetAvailabilityQuery): Promise<AvailabilityReadModel> {
    const { serviceId, date, location = 'studio' } = query.parameters;

    // Check cache first
    const cacheKey = `availability:${serviceId}:${date}:${location}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get availability from database
    const { data: service } = await supabase
      .from('services')
      .select('service_type, duration_minutes')
      .eq('id', serviceId)
      .single();

    // Get available slots
    const slots = await this.getAvailableSlots(serviceId, date, location, service?.duration_minutes || 60);

    const result: AvailabilityReadModel = {
      id: `${serviceId}-${date}-${location}`,
      serviceId,
      serviceType: service?.service_type || 'beauty',
      date,
      timeSlots: slots,
      lastUpdated: new Date(),
    };

    // Cache result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  private async handleGetCalendarView(query: GetCalendarViewQuery): Promise<CalendarReadModel[]> {
    const { serviceType, startDate, endDate, view } = query.parameters;

    // Check cache
    const cacheKey = `calendar:${serviceType || 'all'}:${startDate}:${endDate}:${view}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    let queryBuilder = supabase
      .from('calendar_read_model')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (serviceType) {
      queryBuilder = queryBuilder.eq('service_type', serviceType);
    }

    const { data, error } = await queryBuilder.order('date');

    if (error) throw error;

    // Cache result
    await cacheService.set(cacheKey, data, 900); // 15 minutes

    return data || [];
  }

  private async handleGetBookingStats(query: Query): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Use optimized aggregation queries
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      recentBookings,
    ] = await Promise.all([
      supabase.from('booking_stats').select('value').eq('key', 'total_bookings').single(),
      supabase.from('booking_stats').select('value').eq('key', 'pending_bookings').single(),
      supabase.from('booking_stats').select('value').eq('key', 'confirmed_bookings').single(),
      supabase.from('booking_stats').select('value').eq('key', 'completed_bookings').single(),
      supabase.from('booking_stats').select('value').eq('key', 'cancelled_bookings').single(),
      supabase.from('booking_stats').select('value').eq('key', 'total_revenue').single(),
      supabase
        .from('booking_read_model')
        .select('*')
        .gte('booking_date', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return {
      total: totalBookings.data?.value || 0,
      pending: pendingBookings.data?.value || 0,
      confirmed: confirmedBookings.data?.value || 0,
      completed: completedBookings.data?.value || 0,
      cancelled: cancelledBookings.data?.value || 0,
      revenue: totalRevenue.data?.value || 0,
      recentBookings: recentBookings.data || [],
    };
  }

  // Helper methods
  private validateCommand(command: Command): void {
    if (!command.id || !command.type || !command.aggregateId) {
      throw new Error('Invalid command structure');
    }

    // Add more validation based on command type
    switch (command.type) {
      case 'CreateBooking':
        if (!command.data.serviceId || !command.data.clientDetails) {
          throw new Error('CreateBooking requires serviceId and clientDetails');
        }
        break;
      case 'UpdateBookingStatus':
        if (!command.data.status) {
          throw new Error('UpdateBookingStatus requires status');
        }
        break;
    }
  }

  private getAggregateType(commandType: string): string {
    if (commandType.includes('Booking')) return 'Booking';
    if (commandType.includes('Hold')) return 'Hold';
    return 'Unknown';
  }

  private async updateReadModels(event: Event): Promise<void> {
    // Update specific read models based on event type
    switch (event.type) {
      case 'CreateBookingEvent':
        await this.updateBookingReadModel(event.aggregateId);
        break;
      case 'UpdateBookingStatusEvent':
        await this.updateBookingReadModel(event.aggregateId);
        break;
      case 'CancelBookingEvent':
        await this.updateBookingReadModel(event.aggregateId);
        break;
    }
  }

  private async updateBookingReadModel(bookingId: string): Promise<void> {
    // Trigger materialized view refresh or direct update
    await supabase.rpc('refresh_booking_read_model', { p_booking_id: bookingId });
  }

  private async invalidateCaches(event: Event): Promise<void> {
    switch (event.type) {
      case 'CreateBookingEvent':
        await cacheService.invalidateDate(new Date());
        break;
      case 'UpdateBookingStatusEvent':
        await cacheService.invalidateDate(new Date());
        break;
      case 'CancelBookingEvent':
        await cacheService.invalidateDate(new Date());
        break;
    }
  }

  private async getAvailableSlots(
    serviceId: string,
    date: string,
    location: string,
    duration: number
  ): Promise<any[]> {
    // This would use the optimized availability functions
    const { data, error } = await supabase
      .rpc('get_available_slots_for_service', {
        p_service_id: serviceId,
        p_date: date,
        p_location: location,
        p_duration: duration,
      });

    if (error) throw error;

    return data || [];
  }

  private async releaseHoldsForBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('holds')
      .delete()
      .eq('metadata->>bookingId', bookingId);

    if (error) console.error('Failed to release holds:', error);
  }

  private getQueryCacheKey(query: Query): string {
    return `query:${query.type}:${JSON.stringify(query.parameters)}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    return cacheService.get(key);
  }

  private async setCache(key: string, value: any, ttl: number): Promise<void> {
    await cacheService.set(key, value, ttl);
  }

  private getCacheTTL(queryType: string): number {
    switch (queryType) {
      case 'GetBooking':
        return 300; // 5 minutes
      case 'GetBookings':
        return 120; // 2 minutes
      case 'GetAvailability':
        return 300; // 5 minutes
      case 'GetCalendarView':
        return 900; // 15 minutes
      case 'GetBookingStats':
        return 60; // 1 minute
      default:
        return 300;
    }
  }

  // Event sourcing methods
  async getEventsForAggregate(aggregateId: string): Promise<Event[]> {
    return this.eventStore.filter(e => e.aggregateId === aggregateId);
  }

  async replayEvents(aggregateId: string, fromVersion: number = 0): Promise<void> {
    const events = await this.getEventsForAggregate(aggregateId);
    const relevantEvents = events.filter(e => e.version > fromVersion);

    for (const event of relevantEvents) {
      await this.updateReadModels(event);
    }
  }
}

// Export singleton instance
export const cqrsService = CQRSService.getInstance();

// Convenience methods for common operations
export const Commands = {
  createBooking: (data: CreateBookingCommand['data'], userId?: string): CreateBookingCommand => ({
    id: crypto.randomUUID(),
    type: 'CreateBooking',
    aggregateId: crypto.randomUUID(), // Will be set after creation
    data,
    timestamp: new Date(),
    userId,
    version: 1,
  }),

  updateBookingStatus: (
    bookingId: string,
    status: string,
    reason?: string,
    userId?: string
  ): UpdateBookingStatusCommand => ({
    id: crypto.randomUUID(),
    type: 'UpdateBookingStatus',
    aggregateId: bookingId,
    data: { status, reason },
    timestamp: new Date(),
    userId,
    version: 1,
  }),

  cancelBooking: (
    bookingId: string,
    reason: string,
    userId?: string
  ): CancelBookingCommand => ({
    id: crypto.randomUUID(),
    type: 'CancelBooking',
    aggregateId: bookingId,
    data: { reason },
    timestamp: new Date(),
    userId,
    version: 1,
  }),
};

export const Queries = {
  getBooking: (bookingId: string): GetBookingQuery => ({
    id: crypto.randomUUID(),
    type: 'GetBooking',
    parameters: { bookingId },
    timestamp: new Date(),
  }),

  getBookings: (filters?: any, pagination?: any): GetBookingsQuery => ({
    id: crypto.randomUUID(),
    type: 'GetBookings',
    parameters: { filters, pagination },
    timestamp: new Date(),
  }),

  getAvailability: (
    serviceId: string,
    date: string,
    location?: string
  ): GetAvailabilityQuery => ({
    id: crypto.randomUUID(),
    type: 'GetAvailability',
    parameters: { serviceId, date, location },
    timestamp: new Date(),
  }),

  getCalendarView: (
    serviceType: string | undefined,
    startDate: string,
    endDate: string,
    view: 'month' | 'week' | 'day'
  ): GetCalendarViewQuery => ({
    id: crypto.randomUUID(),
    type: 'GetCalendarView',
    parameters: { serviceType, startDate, endDate, view },
    timestamp: new Date(),
  }),
};