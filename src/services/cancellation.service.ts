/**
 * Cancellation Policy Service with Fee Calculation
 * Handles booking cancellations, policy enforcement, and fee calculations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { bookingDomainService } from './bookingDomainService';
import { waitlistService } from './waitlist.service';
import { groupBookingService } from './groupBooking.service';

export interface CancellationPolicy {
  id: string;
  serviceId: string;
  name: string;
  deadlineHours: number; // Hours before appointment
  feePercentage: number;
  feeAmount?: number; // Fixed fee alternative
  feeType: 'percentage' | 'fixed' | 'hybrid';
  exceptions: Array<{
    condition: string;
    feePercentage: number;
    feeAmount?: number;
  }>;
  isActive: boolean;
  description?: string;
}

export interface CancellationRequest {
  bookingId: string;
  reason?: string;
  refundPolicy?: 'full' | 'partial' | 'deposit_only' | 'none';
  waiveFee?: boolean;
  waiveReason?: string;
  userId: string;
}

export interface CancellationResult {
  success: boolean;
  bookingId: string;
  cancelledAt: Date;
  refundInfo?: {
    originalAmount: number;
    refundAmount: number;
    feeAmount: number;
    feePercentage: number;
    feeWaived: boolean;
    refundMethod: 'original' | 'credit' | 'partial';
  };
  waitlistPromoted?: {
    promotedCount: number;
    promotedBookingIds: string[];
  };
  conflicts?: Array<{
    type: string;
    description: string;
    resolvable: boolean;
  }>;
  error?: string;
}

export interface CancellationStatistics {
  totalCancellations: number;
  cancellationRate: number;
  averageCancellationNotice: number; // Hours
  refundAmountTotal: number;
  feeRevenueTotal: number;
  cancellationsByReason: Record<string, number>;
  cancellationsByService: Record<string, number>;
  lateCancellations: number; // Within policy deadline
  sameDayCancellations: number;
}

export class CancellationService {
  /**
   * Cancel booking with policy enforcement
   */
  async cancelBooking(request: CancellationRequest): Promise<CancellationResult> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (*),
          group_bookings (*),
          payments (*)
        `)
        .eq('id', request.bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      // Check cancellation eligibility
      const eligibilityCheck = await this.checkCancellationEligibility(booking, request.userId);
      if (!eligibilityCheck.canCancel) {
        return {
          success: false,
          bookingId: request.bookingId,
          error: eligibilityCheck.reason,
        };
      }

      // Get applicable cancellation policy
      const policy = await this.getApplicablePolicy(booking.service_id);
      if (!policy) {
        throw new Error('No cancellation policy found for this service');
      }

      // Calculate fees and refund
      const refundInfo = await this.calculateRefund(
        booking,
        policy,
        request.waiveFee,
        request.waiveReason,
        request.refundPolicy
      );

      // Check for conflicts (group bookings, payments, etc.)
      const conflicts = await this.checkCancellationConflicts(booking);

      // Process the cancellation
      const cancellationResult = await this.processCancellation(
        booking,
        request,
        policy,
        refundInfo
      );

      // Handle waitlist promotion
      const waitlistPromoted = await this.processWaitlistPromotion(booking);

      // Send notifications
      await this.sendCancellationNotifications(booking, request, refundInfo);

      logger.info('Booking cancelled successfully', {
        bookingId: request.bookingId,
        reason: request.reason,
        refundAmount: refundInfo.refundAmount,
        waitlistPromoted: waitlistPromoted.promotedCount,
      });

      return {
        success: true,
        bookingId: request.bookingId,
        cancelledAt: new Date(),
        refundInfo,
        waitlistPromoted,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };

    } catch (error) {
      logger.error('Error cancelling booking:', error);
      return {
        success: false,
        bookingId: request.bookingId,
        cancelledAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel group booking with special handling
   */
  async cancelGroupBooking(
    groupBookingId: string,
    reason?: string,
    partialCancellation?: boolean,
    participantIds?: string[]
  ): Promise<CancellationResult & { affectedBookings: string[] }> {
    try {
      // Get group booking details
      const { data: groupBooking, error: groupError } = await supabase
        .from('group_bookings')
        .select('*')
        .eq('id', groupBookingId)
        .single();

      if (groupError || !groupBooking) {
        throw new Error('Group booking not found');
      }

      // Get individual bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, service_id, amount_paid, booking_date, booking_time')
        .eq('group_booking_id', groupBookingId);

      if (bookingsError) throw bookingsError;

      let bookingsToCancel = bookings || [];
      const affectedBookings: string[] = [];

      if (partialCancellation && participantIds) {
        // Cancel only specific participants
        bookingsToCancel = bookingsToCancel.filter(b => participantIds.includes(b.id));
      }

      // Process each booking cancellation
      const results = [];
      let totalRefundAmount = 0;
      let totalFeeAmount = 0;

      for (const booking of bookingsToCancel) {
        const cancelRequest: CancellationRequest = {
          bookingId: booking.id,
          reason: reason || `Group booking cancellation - ${partialCancellation ? 'partial' : 'full'}`,
          userId: groupBooking.creator_user_id || '',
        };

        const result = await this.cancelBooking(cancelRequest);
        results.push(result);
        affectedBookings.push(booking.id);

        if (result.refundInfo) {
          totalRefundAmount += result.refundInfo.refundAmount;
          totalFeeAmount += result.refundInfo.feeAmount;
        }
      }

      // Update group booking status
      if (!partialCancellation) {
        await supabase
          .from('group_bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', groupBookingId);
      }

      return {
        success: results.every(r => r.success),
        bookingId: groupBookingId,
        cancelledAt: new Date(),
        refundInfo: {
          originalAmount: totalRefundAmount + totalFeeAmount,
          refundAmount: totalRefundAmount,
          feeAmount: totalFeeAmount,
          feePercentage: totalFeeAmount > 0 ? (totalFeeAmount / (totalRefundAmount + totalFeeAmount)) * 100 : 0,
          feeWaived: false,
          refundMethod: 'original',
        },
        affectedBookings,
        error: results.some(r => !r.success) ? 'Some cancellations failed' : undefined,
      };

    } catch (error) {
      logger.error('Error cancelling group booking:', error);
      return {
        success: false,
        bookingId: groupBookingId,
        cancelledAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        affectedBookings: [],
      };
    }
  }

  /**
   * Bulk cancellation for admin (multiple bookings)
   */
  async bulkCancellation(
    bookingIds: string[],
    reason?: string,
    waiveFee?: boolean
  ): Promise<Array<CancellationResult>> {
    const results: CancellationResult[] = [];

    for (const bookingId of bookingIds) {
      try {
        const result = await this.cancelBooking({
          bookingId,
          reason: reason || 'Bulk cancellation by admin',
          waiveFee,
          waiveReason: waiveFee ? 'Admin bulk cancellation' : undefined,
          userId: 'admin', // Special admin user ID
        });
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          bookingId,
          cancelledAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get cancellation statistics for reporting
   */
  async getCancellationStats(
    serviceId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<CancellationStatistics> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          booking_changes (
            created_at,
            change_type,
            reason
          )
        `)
        .eq('status', 'cancelled');

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      if (dateRange) {
        query = query
          .gte('updated_at', dateRange.from.toISOString())
          .lte('updated_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const cancellations = data || [];
      const totalBookingsQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true });

      if (serviceId) {
        totalBookingsQuery.eq('service_id', serviceId);
      }

      const { count: totalBookings } = await totalBookingsQuery;

      // Calculate statistics
      let totalRefundAmount = 0;
      let totalFeeAmount = 0;
      let totalNoticeHours = 0;
      let lateCancellations = 0;
      let sameDayCancellations = 0;

      const cancellationsByReason: Record<string, number> = {};
      const cancellationsByService: Record<string, number> = {};

      for (const cancellation of cancellations) {
        // Get cancellation change record
        const cancellationChange = cancellation.booking_changes?.find(
          (change: any) => change.change_type === 'cancelled'
        );

        if (cancellationChange) {
          const bookingDateTime = new Date(
            `${cancellation.booking_date}T${cancellation.booking_time}`
          );
          const cancellationTime = new Date(cancellationChange.created_at);
          const noticeHours = (bookingDateTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

          totalNoticeHours += noticeHours;

          if (noticeHours < 24) lateCancellations++;
          if (noticeHours < 2) sameDayCancellations++;

          // Count by reason
          const reason = cancellationChange.reason || 'No reason';
          cancellationsByReason[reason] = (cancellationsByReason[reason] || 0) + 1;
        }

        // Count by service
        const serviceTitle = cancellation.services?.title || 'Unknown Service';
        cancellationsByService[serviceTitle] = (cancellationsByService[serviceTitle] || 0) + 1;

        // Calculate refund amounts (this would come from payment records)
        // For now, use placeholder values
        totalRefundAmount += cancellation.amount_paid * 0.8; // Assume 80% refund
        totalFeeAmount += cancellation.amount_paid * 0.2; // Assume 20% fee
      }

      return {
        totalCancellations: cancellations.length,
        cancellationRate: totalBookings ? (cancellations.length / totalBookings) * 100 : 0,
        averageCancellationNotice: cancellations.length > 0 ? totalNoticeHours / cancellations.length : 0,
        refundAmountTotal: totalRefundAmount,
        feeRevenueTotal: totalFeeAmount,
        cancellationsByReason,
        cancellationsByService,
        lateCancellations,
        sameDayCancellations,
      };

    } catch (error) {
      logger.error('Error getting cancellation stats:', error);
      return {
        totalCancellations: 0,
        cancellationRate: 0,
        averageCancellationNotice: 0,
        refundAmountTotal: 0,
        feeRevenueTotal: 0,
        cancellationsByReason: {},
        cancellationsByService: {},
        lateCancellations: 0,
        sameDayCancellations: 0,
      };
    }
  }

  // Private helper methods

  private async checkCancellationEligibility(
    booking: any,
    userId: string
  ): Promise<{ canCancel: boolean; reason?: string }> {
    try {
      // Check if booking can be cancelled based on status
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return {
          canCancel: false,
          reason: `Cannot cancel booking with status: ${booking.status}`,
        };
      }

      // Check if booking is in the past
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      if (bookingDateTime < new Date()) {
        return {
          canCancel: false,
          reason: 'Cannot cancel past bookings',
        };
      }

      // Check user authorization (booking owner or admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      if (booking.user_id !== userId && !isAdmin) {
        return {
          canCancel: false,
          reason: 'Not authorized to cancel this booking',
        };
      }

      return { canCancel: true };

    } catch (error) {
      logger.error('Error checking cancellation eligibility:', error);
      return {
        canCancel: false,
        reason: 'Error checking eligibility',
      };
    }
  }

  private async getApplicablePolicy(serviceId: string): Promise<CancellationPolicy | null> {
    try {
      // Try to get service-specific policy first
      const { data: servicePolicy, error: serviceError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .single();

      if (servicePolicy && !serviceError) {
        return servicePolicy;
      }

      // Fall back to default policy for service type
      const { data: service, error: serviceError2 } = await supabase
        .from('services')
        .select('service_type')
        .eq('id', serviceId)
        .single();

      if (serviceError2 || !service) {
        throw new Error('Service not found');
      }

      const { data: defaultPolicy, error: defaultError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .is('service_id', null)
        .eq('service_type', service.service_type)
        .eq('is_active', true)
        .single();

      if (defaultError || !defaultPolicy) {
        // Return very lenient default policy
        return {
          id: 'default',
          serviceId,
          name: 'Default Policy',
          deadlineHours: 2,
          feePercentage: 0,
          feeType: 'percentage',
          exceptions: [],
          isActive: true,
        };
      }

      return defaultPolicy;

    } catch (error) {
      logger.error('Error getting applicable policy:', error);
      return null;
    }
  }

  private async calculateRefund(
    booking: any,
    policy: CancellationPolicy,
    waiveFee?: boolean,
    waiveReason?: string,
    refundPolicy?: string
  ): Promise<{
    originalAmount: number;
    refundAmount: number;
    feeAmount: number;
    feePercentage: number;
    feeWaived: boolean;
    refundMethod: 'original' | 'credit' | 'partial';
  }> {
    try {
      const originalAmount = booking.amount_paid || 0;
      let feeAmount = 0;
      let feePercentage = 0;

      if (!waiveFee) {
        // Calculate notice period
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const now = new Date();
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if within fee window
        if (hoursUntilBooking < policy.deadlineHours) {
          feePercentage = policy.feePercentage;

          switch (policy.feeType) {
            case 'percentage':
              feeAmount = originalAmount * (policy.feePercentage / 100);
              break;
            case 'fixed':
              feeAmount = policy.feeAmount || 0;
              feePercentage = originalAmount > 0 ? (feeAmount / originalAmount) * 100 : 0;
              break;
            case 'hybrid':
              const percentageFee = originalAmount * (policy.feePercentage / 100);
              const fixedFee = policy.feeAmount || 0;
              feeAmount = Math.max(percentageFee, fixedFee);
              feePercentage = (feeAmount / originalAmount) * 100;
              break;
          }

          // Check for exceptions
          for (const exception of policy.exceptions) {
            if (this.matchesException(exception, hoursUntilBooking, booking)) {
              if (exception.feeAmount) {
                feeAmount = exception.feeAmount;
                feePercentage = originalAmount > 0 ? (feeAmount / originalAmount) * 100 : 0;
              } else {
                feeAmount = originalAmount * (exception.feePercentage / 100);
                feePercentage = exception.feePercentage;
              }
              break;
            }
          }
        }
      }

      // Apply refund policy override
      let refundAmount = originalAmount - feeAmount;
      let refundMethod: 'original' | 'credit' | 'partial' = 'original';

      switch (refundPolicy) {
        case 'full':
          refundAmount = originalAmount;
          feeAmount = 0;
          feePercentage = 0;
          break;
        case 'deposit_only':
          // Only refund deposit amount
          refundAmount = Math.min(originalAmount, originalAmount * 0.3); // Assume 30% deposit
          refundMethod = 'partial';
          break;
        case 'none':
          refundAmount = 0;
          feeAmount = originalAmount;
          feePercentage = 100;
          refundMethod = 'none';
          break;
      }

      return {
        originalAmount,
        refundAmount: Math.max(0, refundAmount),
        feeAmount: Math.max(0, feeAmount),
        feePercentage,
        feeWaived: waiveFee || false,
        refundMethod,
      };

    } catch (error) {
      logger.error('Error calculating refund:', error);
      // Return safe defaults
      return {
        originalAmount: 0,
        refundAmount: 0,
        feeAmount: 0,
        feePercentage: 0,
        feeWaived: false,
        refundMethod: 'original',
      };
    }
  }

  private matchesException(
    exception: any,
    hoursUntilBooking: number,
    booking: any
  ): boolean {
    try {
      switch (exception.condition) {
        case 'less_than_24h':
          return hoursUntilBooking < 24;
        case 'less_than_12h':
          return hoursUntilBooking < 12;
        case 'less_than_6h':
          return hoursUntilBooking < 6;
        case 'same_day':
          return hoursUntilBooking < 2;
        case 'high_value':
          return (booking.amount_paid || 0) > 500;
        case 'weekend':
          const bookingDay = new Date(booking.booking_date).getDay();
          return bookingDay === 0 || bookingDay === 6;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private async checkCancellationConflicts(booking: any): Promise<any[]> {
    const conflicts = [];

    // Check if booking is part of a group
    if (booking.group_booking_id) {
      conflicts.push({
        type: 'group_booking',
        description: 'This booking is part of a group booking',
        resolvable: true,
      });
    }

    // Check for non-refundable deposits
    if (booking.deposit_paid && !booking.deposit_refundable) {
      conflicts.push({
        type: 'non_refundable_deposit',
        description: 'Deposit for this booking is non-refundable',
        resolvable: false,
      });
    }

    // Check for promotional rates with special terms
    if (booking.metadata?.promo_code && booking.metadata?.promo_non_refundable) {
      conflicts.push({
        type: 'promo_terms',
        description: 'Promotional rate has special cancellation terms',
        resolvable: false,
      });
    }

    return conflicts;
  }

  private async processCancellation(
    booking: any,
    request: CancellationRequest,
    policy: CancellationPolicy,
    refundInfo: any
  ): Promise<void> {
    try {
      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          metadata: {
            ...booking.metadata,
            cancellation_info: {
              cancelled_at: new Date().toISOString(),
              reason: request.reason,
              policy_id: policy.id,
              refund_amount: refundInfo.refundAmount,
              fee_amount: refundInfo.feeAmount,
              fee_waived: refundInfo.feeWaived,
              waive_reason: request.waiveReason,
            },
          },
        })
        .eq('id', request.bookingId);

      if (updateError) throw updateError;

      // Log the cancellation
      await this.logCancellation(booking, request, policy, refundInfo);

      // Process refund if applicable
      if (refundInfo.refundAmount > 0) {
        await this.processRefund(booking, refundInfo);
      }

    } catch (error) {
      logger.error('Error processing cancellation:', error);
      throw error;
    }
  }

  private async processWaitlistPromotion(booking: any): Promise<{
    promotedCount: number;
    promotedBookingIds: string[];
  }> {
    try {
      // Check if there are waitlist entries for this slot
      const waitlistEntry = await waitlistService.getNextEligibleEntry(
        booking.service_id,
        new Date(booking.booking_date),
        booking.booking_time,
        1
      );

      if (waitlistEntry) {
        const bookingId = await waitlistService.promoteWaitlistEntry(waitlistEntry.id);

        if (bookingId) {
          logger.info('Waitlist entry promoted due to cancellation', {
            waitlistId: waitlistEntry.id,
            newBookingId: bookingId,
          });

          return {
            promotedCount: 1,
            promotedBookingIds: [bookingId],
          };
        }
      }

      return {
        promotedCount: 0,
        promotedBookingIds: [],
      };

    } catch (error) {
      logger.error('Error processing waitlist promotion:', error);
      return {
        promotedCount: 0,
        promotedBookingIds: [],
      };
    }
  }

  private async logCancellation(
    booking: any,
    request: CancellationRequest,
    policy: CancellationPolicy,
    refundInfo: any
  ): Promise<void> {
    try {
      await supabase
        .from('booking_change_history')
        .insert({
          booking_id: request.bookingId,
          user_id: request.userId,
          change_type: 'cancelled',
          old_status: booking.status,
          new_status: 'cancelled',
          change_reason: request.reason,
          system_generated: false,
          metadata: {
            policy_id: policy.id,
            policy_name: policy.name,
            refund_amount: refundInfo.refundAmount,
            fee_amount: refundInfo.feeAmount,
            fee_waived: refundInfo.feeWaived,
            waive_reason: request.waiveReason,
            hours_notice: this.calculateNoticeHours(booking),
          },
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      logger.error('Error logging cancellation:', error);
    }
  }

  private async processRefund(booking: any, refundInfo: any): Promise<void> {
    try {
      // This would integrate with your payment processor
      // For now, just log the refund
      logger.info('Processing refund', {
        bookingId: booking.id,
        originalAmount: refundInfo.originalAmount,
        refundAmount: refundInfo.refundAmount,
        refundMethod: refundInfo.refundMethod,
      });

      // Create refund record
      await supabase
        .from('refunds')
        .insert({
          booking_id: booking.id,
          original_amount: refundInfo.originalAmount,
          refund_amount: refundInfo.refundAmount,
          fee_amount: refundInfo.feeAmount,
          refund_method: refundInfo.refundMethod,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  private async sendCancellationNotifications(
    booking: any,
    request: CancellationRequest,
    refundInfo: any
  ): Promise<void> {
    try {
      // Send email notification
      await supabase.functions.invoke('send-cancellation-email', {
        bookingId: request.bookingId,
        reason: request.reason,
        refundAmount: refundInfo.refundAmount,
        feeAmount: refundInfo.feeAmount,
        feeWaived: refundInfo.feeWaived,
      });

      logger.info('Cancellation notification sent', {
        bookingId: request.bookingId,
        email: booking.client_email,
      });

    } catch (error) {
      logger.error('Error sending cancellation notifications:', error);
    }
  }

  private calculateNoticeHours(booking: any): number {
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const now = new Date();
    return Math.max(0, (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  }
}

export const cancellationService = new CancellationService();