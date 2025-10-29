import { supabase } from '@/integrations/supabase/client';

// Types for recurring appointments
export interface RecurringPattern {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly patterns
  dayOfMonth?: number; // 1-31 for monthly patterns
  weekOfMonth?: number; // 1-5 (first, second, etc. week)
  customPattern?: {
    description: string;
    recurrenceRule: string; // RRULE format for complex patterns
  };
  maxOccurrences?: number;
  endDate?: Date;
}

export interface RecurringAppointment {
  id: string;
  serviceId: string;
  clientId: string;
  pattern: RecurringPattern;
  baseBookingData: {
    preferredTime: string;
    location: string;
    duration: number;
    notes?: string;
  };
  paymentMethod: 'card' | 'cash' | 'subscription';
  autoPayment: boolean;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  nextBookingDate?: Date;
  lastBookingDate?: Date;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringException {
  id: string;
  recurringAppointmentId: string;
  exceptionDate: Date;
  type: 'skip' | 'reschedule' | 'cancel';
  newDate?: Date;
  newTime?: string;
  reason?: string;
  rescheduledBookingId?: string;
  createdAt: Date;
  createdBy: string;
}

export interface HolidayDate {
  id: string;
  name: string;
  date: Date;
  type: 'public' | 'business' | 'personal';
  affectsServices: string[]; // Service IDs affected
  isRecurring: boolean;
  recurrenceRule?: string;
  autoReschedule: boolean;
  notificationDays: number;
}

export interface RecurringBookingSeries {
  id: string;
  recurringAppointmentId: string;
  bookings: Array<{
    id: string;
    date: Date;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    revenue: number;
    exceptionId?: string;
  }>;
  upcomingBookings: number;
  nextBooking: {
    date: Date;
    time: string;
  } | null;
}

class RecurringAppointmentsService {
  // Recurring pattern management
  async createRecurringPattern(pattern: Omit<RecurringPattern, 'id'>): Promise<RecurringPattern> {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .insert([{
        name: pattern.name,
        type: pattern.type,
        interval: pattern.interval,
        days_of_week: pattern.daysOfWeek,
        day_of_month: pattern.dayOfMonth,
        week_of_month: pattern.weekOfMonth,
        custom_pattern: pattern.customPattern,
        max_occurrences: pattern.maxOccurrences,
        end_date: pattern.endDate?.toISOString(),
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create recurring pattern: ${error.message}`);

    return this.mapPatternFromDB(data);
  }

  async getRecurringPatterns(): Promise<RecurringPattern[]> {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch recurring patterns: ${error.message}`);

    return (data || []).map(this.mapPatternFromDB);
  }

  async updateRecurringPattern(id: string, updates: Partial<RecurringPattern>): Promise<RecurringPattern> {
    const updateData: any = {
      ...(updates.name && { name: updates.name }),
      ...(updates.type && { type: updates.type }),
      ...(updates.interval && { interval: updates.interval }),
      ...(updates.daysOfWeek && { days_of_week: updates.daysOfWeek }),
      ...(updates.dayOfMonth && { day_of_month: updates.dayOfMonth }),
      ...(updates.weekOfMonth && { week_of_month: updates.weekOfMonth }),
      ...(updates.customPattern && { custom_pattern: updates.customPattern }),
      ...(updates.maxOccurrences && { max_occurrences: updates.maxOccurrences }),
      ...(updates.endDate && { end_date: updates.endDate.toISOString() }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('recurring_patterns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update recurring pattern: ${error.message}`);

    return this.mapPatternFromDB(data);
  }

  // Recurring appointment management
  async createRecurringAppointment(
    appointment: Omit<RecurringAppointment, 'id' | 'totalBookings' | 'completedBookings' | 'cancelledBookings' | 'revenue' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringAppointment> {
    const { data, error } = await supabase
      .from('recurring_appointments')
      .insert([{
        service_id: appointment.serviceId,
        client_id: appointment.clientId,
        pattern_id: appointment.pattern.id,
        base_booking_data: appointment.baseBookingData,
        payment_method: appointment.paymentMethod,
        auto_payment: appointment.autoPayment,
        start_date: appointment.startDate.toISOString(),
        end_date: appointment.endDate?.toISOString(),
        status: appointment.status,
        next_booking_date: appointment.nextBookingDate?.toISOString(),
        last_booking_date: appointment.lastBookingDate?.toISOString(),
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create recurring appointment: ${error.message}`);

    return this.mapRecurringAppointmentFromDB(data);
  }

  async getRecurringAppointments(clientId?: string, status?: string): Promise<RecurringAppointment[]> {
    let query = supabase
      .from('recurring_appointments')
      .select(`
        *,
        recurring_patterns (*)
      `)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch recurring appointments: ${error.message}`);

    return (data || []).map(this.mapRecurringAppointmentFromDB);
  }

  async updateRecurringAppointment(
    id: string,
    updates: Partial<RecurringAppointment>
  ): Promise<RecurringAppointment> {
    const updateData: any = {
      ...(updates.status && { status: updates.status }),
      ...(updates.nextBookingDate && { next_booking_date: updates.nextBookingDate.toISOString() }),
      ...(updates.lastBookingDate && { last_booking_date: updates.lastBookingDate.toISOString() }),
      ...(updates.endDate && { end_date: updates.endDate.toISOString() }),
      ...(updates.baseBookingData && { base_booking_data: updates.baseBookingData }),
      ...(updates.autoPayment !== undefined && { auto_payment: updates.autoPayment }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('recurring_appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update recurring appointment: ${error.message}`);

    return this.mapRecurringAppointmentFromDB(data);
  }

  // Exception management
  async createException(exception: Omit<RecurringException, 'id' | 'createdAt'>): Promise<RecurringException> {
    const { data, error } = await supabase
      .from('recurring_appointment_exceptions')
      .insert([{
        recurring_appointment_id: exception.recurringAppointmentId,
        exception_date: exception.exceptionDate.toISOString(),
        type: exception.type,
        new_date: exception.newDate?.toISOString(),
        new_time: exception.newTime,
        reason: exception.reason,
        rescheduled_booking_id: exception.rescheduledBookingId,
        created_by: exception.createdBy,
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create exception: ${error.message}`);

    return this.mapExceptionFromDB(data);
  }

  async getExceptions(recurringAppointmentId: string): Promise<RecurringException[]> {
    const { data, error } = await supabase
      .from('recurring_appointment_exceptions')
      .select('*')
      .eq('recurring_appointment_id', recurringAppointmentId)
      .order('exception_date', { ascending: true });

    if (error) throw new Error(`Failed to fetch exceptions: ${error.message}`);

    return (data || []).map(this.mapExceptionFromDB);
  }

  // Holiday management
  async createHoliday(holiday: Omit<HolidayDate, 'id'>): Promise<HolidayDate> {
    const { data, error } = await supabase
      .from('holiday_dates')
      .insert([{
        name: holiday.name,
        date: holiday.date.toISOString(),
        type: holiday.type,
        affects_services: holiday.affectsServices,
        is_recurring: holiday.isRecurring,
        recurrence_rule: holiday.recurrenceRule,
        auto_reschedule: holiday.autoReschedule,
        notification_days: holiday.notificationDays,
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create holiday: ${error.message}`);

    return this.mapHolidayFromDB(data);
  }

  async getHolidays(dateRange?: { from: Date; to: Date }): Promise<HolidayDate[]> {
    let query = supabase
      .from('holiday_dates')
      .select('*')
      .order('date', { ascending: true });

    if (dateRange) {
      query = query
        .gte('date', dateRange.from.toISOString())
        .lte('date', dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch holidays: ${error.message}`);

    return (data || []).map(this.mapHolidayFromDB);
  }

  // Series generation and management
  async generateBookingSeries(
    recurringAppointmentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RecurringBookingSeries> {
    const { data: appointment, error: appointmentError } = await supabase
      .from('recurring_appointments')
      .select(`
        *,
        recurring_patterns (*)
      `)
      .eq('id', recurringAppointmentId)
      .single();

    if (appointmentError) throw new Error(`Failed to fetch recurring appointment: ${appointmentError.message}`);

    // Generate series based on pattern
    const bookings = await this.generateBookingsFromPattern(
      appointment,
      startDate || new Date(),
      endDate || appointment.end_date ? new Date(appointment.end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );

    // Apply exceptions
    const exceptions = await this.getExceptions(recurringAppointmentId);
    const filteredBookings = this.applyExceptionsToBookings(bookings, exceptions);

    // Check existing bookings
    const { data: existingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('recurring_appointment_id', recurringAppointmentId)
      .in('status', ['pending', 'confirmed']);

    if (bookingError) throw new Error(`Failed to fetch existing bookings: ${bookingError.message}`);

    // Merge with existing bookings
    const mergedBookings = this.mergeWithExistingBookings(filteredBookings, existingBookings || []);

    return {
      id: recurringAppointmentId,
      recurringAppointmentId,
      bookings: mergedBookings,
      upcomingBookings: mergedBookings.filter(b => b.status === 'scheduled').length,
      nextBooking: mergedBookings
        .filter(b => b.status === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null,
    };
  }

  // Auto-processing
  async processAutoBookings(): Promise<{ processed: number; errors: string[] }> {
    const appointments = await this.getRecurringAppointments(undefined, 'active');
    const processed: string[] = [];
    const errors: string[] = [];

    for (const appointment of appointments) {
      try {
        if (this.shouldCreateNextBooking(appointment)) {
          const series = await this.generateBookingSeries(appointment.id);

          for (const booking of series.bookings.filter(b => b.status === 'scheduled')) {
            // Create actual booking
            await this.createBookingFromSeries(booking, appointment);
            processed.push(booking.id);
          }

          // Update next booking date
          await this.updateRecurringAppointment(appointment.id, {
            nextBookingDate: series.nextBooking?.date,
          });
        }
      } catch (error) {
        errors.push(`Failed to process appointment ${appointment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { processed: processed.length, errors };
  }

  // Pause/Resume functionality
  async pauseRecurringAppointment(id: string, reason?: string): Promise<RecurringAppointment> {
    return this.updateRecurringAppointment(id, {
      status: 'paused',
    });
  }

  async resumeRecurringAppointment(id: string): Promise<RecurringAppointment> {
    return this.updateRecurringAppointment(id, {
      status: 'active',
    });
  }

  // Analytics
  async getRecurringAppointmentAnalytics(
    clientId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    totalAppointments: number;
    activeAppointments: number;
    pausedAppointments: number;
    completedBookings: number;
    upcomingBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    cancellationRate: number;
  }> {
    let query = supabase
      .from('recurring_appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: appointments, error: appointmentError } = await query;

    if (appointmentError) throw new Error(`Failed to fetch appointments: ${appointmentError.message}`);

    const totalAppointments = appointments?.length || 0;
    const activeAppointments = appointments?.filter(a => a.status === 'active').length || 0;
    const pausedAppointments = appointments?.filter(a => a.status === 'paused').length || 0;

    // Get booking statistics
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('status, amount, recurring_appointment_id')
      .in('recurring_appointment_id', appointments?.map(a => a.id) || []);

    if (bookingError) throw new Error(`Failed to fetch bookings: ${bookingError.message}`);

    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const upcomingBookings = bookings?.filter(b => ['pending', 'confirmed'].includes(b.status)).length || 0;
    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const cancellationRate = bookings?.length ? (cancelledBookings / bookings.length) * 100 : 0;

    return {
      totalAppointments,
      activeAppointments,
      pausedAppointments,
      completedBookings,
      upcomingBookings,
      totalRevenue,
      averageBookingValue,
      cancellationRate,
    };
  }

  // Helper methods
  private async generateBookingsFromPattern(
    appointment: any,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; time: string; status: string; paymentStatus: string; revenue: number }>> {
    const pattern = appointment.recurring_patterns;
    const bookings: Array<{ date: Date; time: string; status: string; paymentStatus: string; revenue: number }> = [];

    const baseDate = new Date(appointment.start_date);
    const bookingData = appointment.base_booking_data;
    const interval = pattern.interval || 1;

    const currentDate = new Date(Math.max(baseDate.getTime(), startDate.getTime()));

    while (currentDate <= endDate) {
      if (this.matchesPattern(currentDate, pattern)) {
        // Check if date is a holiday
        const holidays = await this.getHolidays({ from: currentDate, to: currentDate });
        const isHoliday = holidays.some(holiday =>
          holiday.affectsServices.includes(appointment.service_id)
        );

        if (!isHoliday || holiday.auto_reschedule) {
          bookings.push({
            date: new Date(currentDate),
            time: bookingData.preferredTime,
            status: 'scheduled',
            paymentStatus: appointment.auto_payment ? 'paid' : 'pending',
            revenue: appointment.base_booking_data.amount || 0,
          });
        }
      }

      // Increment based on pattern type
      switch (pattern.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        default:
          // Custom patterns would need RRULE parsing
          currentDate.setDate(currentDate.getDate() + interval);
          break;
      }
    }

    return bookings;
  }

  private matchesPattern(date: Date, pattern: any): boolean {
    switch (pattern.type) {
      case 'daily':
        return true;

      case 'weekly':
        if (pattern.days_of_week && pattern.days_of_week.length > 0) {
          return pattern.days_of_week.includes(date.getDay());
        }
        return date.getDay() === new Date(pattern.created_at).getDay();

      case 'monthly':
        if (pattern.day_of_month) {
          return date.getDate() === pattern.day_of_month;
        }
        return true;

      default:
        return true;
    }
  }

  private applyExceptionsToBookings(
    bookings: Array<{ date: Date; time: string; status: string; paymentStatus: string; revenue: number }>,
    exceptions: RecurringException[]
  ): Array<{ date: Date; time: string; status: string; paymentStatus: string; revenue: number }> {
    return bookings.filter(booking => {
      const exception = exceptions.find(ex =>
        new Date(ex.exceptionDate).toDateString() === booking.date.toDateString()
      );

      if (!exception) return true;

      switch (exception.type) {
        case 'skip':
          return false;
        case 'cancel':
          booking.status = 'cancelled';
          return true;
        case 'reschedule':
          if (exception.newDate && exception.newTime) {
            booking.date = exception.newDate;
            booking.time = exception.newTime;
          }
          return true;
        default:
          return true;
      }
    });
  }

  private mergeWithExistingBookings(
    generatedBookings: Array<{ date: Date; time: string; status: string; paymentStatus: string; revenue: number }>,
    existingBookings: any[]
  ): Array<{ id: string; date: Date; time: string; status: string; paymentStatus: string; revenue: number; exceptionId?: string }> {
    return generatedBookings.map(generatedBooking => {
      const existing = existingBookings.find(eb =>
        new Date(eb.booking_date).toDateString() === generatedBooking.date.toDateString()
      );

      if (existing) {
        return {
          id: existing.id,
          date: new Date(existing.booking_date),
          time: existing.booking_time,
          status: existing.status,
          paymentStatus: existing.payment_status || 'pending',
          revenue: existing.amount || 0,
        };
      }

      return {
        id: crypto.randomUUID(),
        ...generatedBooking,
      };
    });
  }

  private shouldCreateNextBooking(appointment: RecurringAppointment): boolean {
    if (!appointment.nextBookingDate) return true;

    const nextBooking = new Date(appointment.nextBookingDate);
    const now = new Date();
    const daysUntilBooking = Math.ceil((nextBooking.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Create next booking if it's within 7 days
    return daysUntilBooking <= 7 && appointment.status === 'active';
  }

  private async createBookingFromSeries(
    seriesBooking: { id: string; date: Date; time: string },
    appointment: RecurringAppointment
  ): Promise<any> {
    const bookingData = {
      service_id: appointment.serviceId,
      client_id: appointment.clientId,
      booking_date: seriesBooking.date.toISOString().split('T')[0],
      booking_time: seriesBooking.time,
      status: 'confirmed',
      recurring_appointment_id: appointment.id,
      payment_method: appointment.paymentMethod,
      payment_status: appointment.autoPayment ? 'paid' : 'pending',
      amount: appointment.baseBookingData.amount || 0,
      location: appointment.baseBookingData.location,
      notes: appointment.baseBookingData.notes,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create booking: ${error.message}`);

    return data;
  }

  // Database mapping helpers
  private mapPatternFromDB(data: any): RecurringPattern {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      interval: data.interval,
      daysOfWeek: data.days_of_week,
      dayOfMonth: data.day_of_month,
      weekOfMonth: data.week_of_month,
      customPattern: data.custom_pattern,
      maxOccurrences: data.max_occurrences,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
    };
  }

  private mapRecurringAppointmentFromDB(data: any): RecurringAppointment {
    return {
      id: data.id,
      serviceId: data.service_id,
      clientId: data.client_id,
      pattern: this.mapPatternFromDB(data.recurring_patterns),
      baseBookingData: data.base_booking_data,
      paymentMethod: data.payment_method,
      autoPayment: data.auto_payment,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      status: data.status,
      nextBookingDate: data.next_booking_date ? new Date(data.next_booking_date) : undefined,
      lastBookingDate: data.last_booking_date ? new Date(data.last_booking_date) : undefined,
      totalBookings: data.total_bookings || 0,
      completedBookings: data.completed_bookings || 0,
      cancelledBookings: data.cancelled_bookings || 0,
      revenue: data.revenue || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapExceptionFromDB(data: any): RecurringException {
    return {
      id: data.id,
      recurringAppointmentId: data.recurring_appointment_id,
      exceptionDate: new Date(data.exception_date),
      type: data.type,
      newDate: data.new_date ? new Date(data.new_date) : undefined,
      newTime: data.new_time,
      reason: data.reason,
      rescheduledBookingId: data.rescheduled_booking_id,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by,
    };
  }

  private mapHolidayFromDB(data: any): HolidayDate {
    return {
      id: data.id,
      name: data.name,
      date: new Date(data.date),
      type: data.type,
      affectsServices: data.affects_services,
      isRecurring: data.is_recurring,
      recurrenceRule: data.recurrence_rule,
      autoReschedule: data.auto_reschedule,
      notificationDays: data.notification_days,
    };
  }
}

export const recurringAppointmentsService = new RecurringAppointmentsService();