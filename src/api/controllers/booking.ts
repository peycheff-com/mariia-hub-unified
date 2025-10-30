/**
 * Booking Controller
 * Handles booking operations and management
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError, ConflictError, BusinessLogicError } from '../middleware/errorHandler';
import { supabaseService } from '../integrations/supabase';
import { logger } from '../utils/logger';
import { validateUUID, validateBookingDate, validateBookingTime } from '../middleware/validation';

export class BookingController {
  /**
   * Get user bookings
   */
  public async getUserBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const userId = req.user!.id;

    try {
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabaseService.getClient()
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price,
            currency,
            images
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (startDate) {
        query = query.gte('booking_date', startDate);
      }
      if (endDate) {
        query = query.lte('booking_date', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new ValidationError('Failed to fetch bookings');
      }

      const totalPages = Math.ceil((count || 0) / Number(limit));

      res.json({
        success: true,
        data: data || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get booking details
   */
  public async getBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const booking = await supabaseService.getClient()
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price,
            currency,
            description,
            images
          )
        `)
        .eq('id', id)
        .single();

      if (!booking.data) {
        throw new NotFoundError('Booking not found');
      }

      res.json({
        success: true,
        data: booking.data,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new booking
   */
  public async createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { serviceId, date, timeSlot, clientInfo, notes, preferences } = req.body;
    const userId = req.user!.id;

    try {
      // Validate inputs
      if (!validateUUID(serviceId)) {
        throw new ValidationError('Invalid service ID');
      }

      const bookingDate = new Date(date);
      if (!validateBookingDate(bookingDate)) {
        throw new ValidationError('Invalid booking date');
      }

      if (!validateBookingTime(timeSlot)) {
        throw new ValidationError('Invalid time slot');
      }

      // Check if service exists and is active
      const service = await supabaseService.getServiceWithContent(serviceId);
      if (!service || !service.is_active) {
        throw new NotFoundError('Service not available');
      }

      // Calculate end time
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startTime = new Date(bookingDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60 * 1000);

      // Check availability
      const existingBooking = await supabaseService.getClient()
        .from('bookings')
        .select('id')
        .eq('service_id', serviceId)
        .eq('booking_date', date)
        .eq('start_time', timeSlot)
        .in('status', ['confirmed', 'pending'])
        .single();

      if (existingBooking.data) {
        throw new ConflictError('Time slot already booked');
      }

      // Create booking
      const bookingData = {
        service_id: serviceId,
        user_id: userId,
        booking_date: date,
        start_time: timeSlot,
        end_time: endTime.toTimeString().slice(0, 5),
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone || null,
        status: 'pending',
        payment_status: 'pending',
        total_amount: service.price,
        currency: service.currency,
        notes: notes || null,
        preferences: preferences || null,
        location_type: service.location_type,
        metadata: {
          source: 'api',
          user_agent: req.get('User-Agent'),
          ip_address: req.ip,
        },
      };

      const { data: booking, error } = await supabaseService.getClient()
        .from('bookings')
        .insert(bookingData)
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price,
            currency,
            images
          )
        `)
        .single();

      if (error) {
        throw new ValidationError('Failed to create booking');
      }

      logger.business('booking_created', {
        bookingId: booking.id,
        serviceId: serviceId,
        userId,
        clientEmail: clientInfo.email,
        date,
        timeSlot,
        amount: service.price,
      });

      res.status(201).json({
        success: true,
        booking,
        message: 'Booking created successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  public async cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason, refundRequested } = req.body;
    const userId = req.user!.id;

    try {
      // Get booking
      const booking = await supabaseService.findById('bookings', id);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Check if booking can be cancelled
      if (['completed', 'cancelled'].includes(booking.status)) {
        throw new BusinessLogicError('Cannot cancel a completed or already cancelled booking');
      }

      // Check cancellation policy (24 hours in advance)
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 24) {
        throw new BusinessLogicError('Bookings must be cancelled at least 24 hours in advance');
      }

      // Update booking status
      const { error } = await supabaseService.getClient()
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: reason ? `${booking.notes || ''}\n\nCancellation reason: ${reason}`.trim() : booking.notes,
          metadata: {
            ...booking.metadata,
            cancelled_at: new Date().toISOString(),
            cancelled_by: userId,
            refund_requested: refundRequested || false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new ValidationError('Failed to cancel booking');
      }

      logger.business('booking_cancelled', {
        bookingId: id,
        userId,
        reason,
        refundRequested,
        hoursUntilBooking,
      });

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reschedule booking
   */
  public async rescheduleBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { newDate, newTimeSlot, reason } = req.body;
    const userId = req.user!.id;

    try {
      // Get current booking
      const booking = await supabaseService.findById('bookings', id);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Validate new date and time
      const newBookingDate = new Date(newDate);
      if (!validateBookingDate(newBookingDate)) {
        throw new ValidationError('Invalid new booking date');
      }

      if (!validateBookingTime(newTimeSlot)) {
        throw new ValidationError('Invalid new time slot');
      }

      // Get service to calculate new end time
      const service = await supabaseService.findById('services', booking.service_id);
      if (!service) {
        throw new NotFoundError('Service not found');
      }

      // Check if new slot is available
      const existingBooking = await supabaseService.getClient()
        .from('bookings')
        .select('id')
        .eq('service_id', booking.service_id)
        .eq('booking_date', newDate)
        .eq('start_time', newTimeSlot)
        .in('status', ['confirmed', 'pending'])
        .neq('id', id) // Exclude current booking
        .single();

      if (existingBooking.data) {
        throw new ConflictError('New time slot already booked');
      }

      // Calculate new end time
      const [hours, minutes] = newTimeSlot.split(':').map(Number);
      const startTime = new Date(newBookingDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60 * 1000);

      // Update booking
      const { error } = await supabaseService.getClient()
        .from('bookings')
        .update({
          booking_date: newDate,
          start_time: newTimeSlot,
          end_time: endTime.toTimeString().slice(0, 5),
          status: 'rescheduled',
          notes: reason ? `${booking.notes || ''}\n\nRescheduling reason: ${reason}`.trim() : booking.notes,
          metadata: {
            ...booking.metadata,
            rescheduled_at: new Date().toISOString(),
            rescheduled_by: userId,
            original_date: booking.booking_date,
            original_time: booking.start_time,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new ValidationError('Failed to reschedule booking');
      }

      logger.business('booking_rescheduled', {
        bookingId: id,
        userId,
        originalDate: booking.booking_date,
        originalTime: booking.start_time,
        newDate,
        newTimeSlot,
        reason,
      });

      res.json({
        success: true,
        message: 'Booking rescheduled successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get availability for a service
   */
  public async getAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { serviceId, date, timezone = 'Europe/Warsaw' } = req.query;

    try {
      if (!validateUUID(serviceId as string)) {
        throw new ValidationError('Invalid service ID');
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
        throw new ValidationError('Invalid date format');
      }

      // Check if service exists
      const service = await supabaseService.findById('services', serviceId as string);
      if (!service || !service.is_active) {
        throw new NotFoundError('Service not available');
      }

      // Get available slots
      const availableSlots = await supabaseService.findAvailableSlots(serviceId as string, date as string);

      res.json({
        success: true,
        date,
        serviceId,
        availableSlots,
        timezone,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hold a time slot
   */
  public async holdSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { serviceId, date, timeSlot } = req.body;
    const userId = req.user!.id;

    try {
      // Validate inputs
      if (!validateUUID(serviceId)) {
        throw new ValidationError('Invalid service ID');
      }

      const bookingDate = new Date(date);
      if (!validateBookingDate(bookingDate)) {
        throw new ValidationError('Invalid booking date');
      }

      if (!validateBookingTime(timeSlot)) {
        throw new ValidationError('Invalid time slot');
      }

      // Create hold
      const hold = await supabaseService.createBookingHold(
        serviceId,
        date,
        timeSlot,
        req.requestId!,
        userId
      );

      logger.info('Time slot held', {
        holdId: hold.id,
        serviceId,
        date,
        timeSlot,
        userId,
        expiresAt: hold.expires_at,
      });

      res.json({
        success: true,
        holdId: hold.id,
        expiresAt: hold.expires_at,
        message: 'Time slot held for 5 minutes',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Release a held time slot
   */
  public async releaseHold(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { holdId } = req.params;

    try {
      await supabaseService.releaseHold(holdId);

      logger.info('Time slot hold released', {
        holdId,
        userId: req.user!.id,
      });

      res.json({
        success: true,
        message: 'Time slot hold released',
      });
    } catch (error) {
      throw error;
    }
  }
}