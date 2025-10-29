import { supabase } from '@/integrations/supabase/client';
import { ResendService } from '@/lib/resend';
import { CommunicationService } from '@/lib/communication';
import { bookingEvents } from '@/stores/bookingStore';
import { cacheService } from '@/services/cacheService';
import { logger } from '@/lib/logger';

export interface CancellationPolicy {
  id: string;
  serviceType: 'beauty' | 'fitness' | 'lifestyle' | 'all';
  noticePeriods: Array<{
    hoursBeforeAppointment: number;
    refundPercentage: number;
    feeAmount?: number;
    description: string;
  }>;
  maxCancellationsPerPeriod?: {
    period: 'month' | 'quarter' | 'year';
    maxCancellations: number;
  };
  specialConditions?: Array<{
    condition: string;
    waiverType: 'full_refund' | 'partial_refund' | 'no_fee';
    documentation: boolean;
    description: string;
  }>;
  autoRefund: boolean;
  processingFee?: number;
}

export interface CancellationRequest {
  bookingId: string;
  userId: string;
  reason: string;
  specialCondition?: string;
  documentation?: File[];
  autoRefund?: boolean;
}

export interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  refundPercentage?: number;
  feeAmount?: number;
  processingFee?: number;
  appliedPolicy?: {
    noticePeriod: number;
    refundPercentage: number;
    feeDescription: string;
  };
  requiresDocumentation?: string[];
  error?: string;
  requiresManualReview?: boolean;
}

export interface CancellationAnalytics {
  totalCancellations: number;
  cancellationRate: number;
  averageNoticeHours: number;
  refundAmountTotal: number;
  feeAmountTotal: number;
  cancellationsByReason: Record<string, number>;
  cancellationsByService: Record<string, number>;
  cancellationsByNoticePeriod: Record<string, number>;
  repeatCancellators: Array<{
    userId: string;
    email: string;
    cancellationsCount: number;
    lastCancellation: Date;
  }>;
}

class CancellationPolicyService {
  private CACHE_KEY_PREFIX = 'cancellation_policy_';
  private CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private defaultPolicies: Record<string, CancellationPolicy> = {
    beauty: {
      id: 'beauty_default',
      serviceType: 'beauty',
      noticePeriods: [
        {
          hoursBeforeAppointment: 48,
          refundPercentage: 100,
          description: 'Full refund with 48+ hours notice'
        },
        {
          hoursBeforeAppointment: 24,
          refundPercentage: 50,
          feeAmount: 50,
          description: '50% refund with 24-48 hours notice'
        },
        {
          hoursBeforeAppointment: 0,
          refundPercentage: 0,
          feeAmount: 100,
          description: 'No refund with less than 24 hours notice'
        }
      ],
      maxCancellationsPerPeriod: {
        period: 'month',
        maxCancellations: 3
      },
      specialConditions: [
        {
          condition: 'medical_emergency',
          waiverType: 'full_refund',
          documentation: true,
          description: 'Medical emergency with documentation'
        },
        {
          condition: 'bereavement',
          waiverType: 'full_refund',
          documentation: true,
          description: 'Family bereavement with documentation'
        }
      ],
      autoRefund: true,
      processingFee: 0
    },
    fitness: {
      id: 'fitness_default',
      serviceType: 'fitness',
      noticePeriods: [
        {
          hoursBeforeAppointment: 12,
          refundPercentage: 100,
          description: 'Full refund with 12+ hours notice'
        },
        {
          hoursBeforeAppointment: 4,
          refundPercentage: 50,
          feeAmount: 25,
          description: '50% refund with 4-12 hours notice'
        },
        {
          hoursBeforeAppointment: 0,
          refundPercentage: 0,
          feeAmount: 100,
          description: 'No refund with less than 4 hours notice'
        }
      ],
      maxCancellationsPerPeriod: {
        period: 'month',
        maxCancellations: 5
      },
      specialConditions: [
        {
          condition: 'injury',
          waiverType: 'partial_refund',
          documentation: true,
          description: 'Injury with medical documentation'
        }
      ],
      autoRefund: true,
      processingFee: 5
    }
  };

  async getCancellationPolicy(serviceType: string): Promise<CancellationPolicy> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${serviceType}`;

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get custom policy from database
      const { data: policy, error } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .single();

      if (error || !policy) {
        // Use default policy
        const defaultPolicy = this.defaultPolicies[serviceType] || this.defaultPolicies.beauty;
        await cacheService.set(cacheKey, defaultPolicy, this.CACHE_TTL);
        return defaultPolicy;
      }

      const mappedPolicy: CancellationPolicy = {
        id: policy.id,
        serviceType: policy.service_type,
        noticePeriods: policy.notice_periods || [],
        maxCancellationsPerPeriod: policy.max_cancellations_per_period,
        specialConditions: policy.special_conditions || [],
        autoRefund: policy.auto_refund,
        processingFee: policy.processing_fee
      };

      await cacheService.set(cacheKey, mappedPolicy, this.CACHE_TTL);
      return mappedPolicy;
    } catch (error) {
      logger.error('Failed to get cancellation policy', { error, serviceType });
      return this.defaultPolicies[serviceType] || this.defaultPolicies.beauty;
    }
  }

  async cancelBooking(request: CancellationRequest): Promise<CancellationResult> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            service_type,
            title,
            price_from
          )
        `)
        .eq('id', request.bookingId)
        .eq('user_id', request.userId)
        .single();

      if (bookingError || !booking) {
        return {
          success: false,
          error: 'Booking not found or access denied'
        };
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled') {
        return {
          success: false,
          error: 'Booking is already cancelled'
        };
      }

      if (['completed', 'no_show'].includes(booking.status)) {
        return {
          success: false,
          error: `Cannot cancel booking with status: ${booking.status}`
        };
      }

      // Get applicable policy
      const policy = await this.getCancellationPolicy(booking.services.service_type);

      // Calculate notice period
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const now = new Date();
      const hoursUntilAppointment = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Check for special conditions
      if (request.specialCondition && policy.specialConditions) {
        const specialCondition = policy.specialConditions.find(
          condition => condition.condition === request.specialCondition
        );

        if (specialCondition) {
          if (specialCondition.documentation && !request.documentation) {
            return {
              success: false,
              requiresDocumentation: [specialCondition.documentation ? 'documentation' : ''],
              error: 'Documentation required for this cancellation reason'
            };
          }

          // Apply special condition
          const refundAmount = this.calculateRefundAmount(
            booking.services.price_from,
            specialCondition.waiverType,
            100,
            policy.processingFee
          );

          await this.processCancellation(request, booking, refundAmount, specialCondition.waiverType, {
            noticePeriod: hoursUntilAppointment,
            refundPercentage: this.getRefundPercentage(specialCondition.waiverType),
            feeDescription: specialCondition.description
          });

          return {
            success: true,
            refundAmount,
            refundPercentage: this.getRefundPercentage(specialCondition.waiverType),
            appliedPolicy: {
              noticePeriod: hoursUntilAppointment,
              refundPercentage: this.getRefundPercentage(specialCondition.waiverType),
              feeDescription: specialCondition.description
            }
          };
        }
      }

      // Apply standard policy
      const applicablePeriod = this.getApplicableNoticePeriod(policy.noticePeriods, hoursUntilAppointment);

      if (!applicablePeriod) {
        return {
          success: false,
          error: 'No applicable cancellation policy found'
        };
      }

      // Check cancellation limits
      const limitCheck = await this.checkCancellationLimits(request.userId, policy);
      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason || 'Cancellation limit exceeded'
        };
      }

      // Calculate refund amount
      const refundAmount = this.calculateRefundAmount(
        booking.services.price_from,
        'standard',
        applicablePeriod.refundPercentage,
        policy.processingFee
      );

      // Process the cancellation
      await this.processCancellation(request, booking, refundAmount, 'standard', {
        noticePeriod: hoursUntilAppointment,
        refundPercentage: applicablePeriod.refundPercentage,
        feeDescription: applicablePeriod.description
      });

      return {
        success: true,
        refundAmount,
        refundPercentage: applicablePeriod.refundPercentage,
        feeAmount: booking.services.price_from - refundAmount,
        processingFee: policy.processingFee,
        appliedPolicy: {
          noticePeriod: hoursUntilAppointment,
          refundPercentage: applicablePeriod.refundPercentage,
          feeDescription: applicablePeriod.description
        }
      };
    } catch (error) {
      logger.error('Cancellation failed', { error, request });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed'
      };
    }
  }

  private getApplicableNoticePeriod(noticePeriods: CancellationPolicy['noticePeriods'], hoursUntilAppointment: number) {
    return noticePeriods
      .sort((a, b) => b.hoursBeforeAppointment - a.hoursBeforeAppointment)
      .find(period => hoursUntilAppointment >= period.hoursBeforeAppointment);
  }

  private getRefundPercentage(waiverType: string): number {
    switch (waiverType) {
      case 'full_refund':
        return 100;
      case 'partial_refund':
        return 50;
      case 'no_fee':
        return 100;
      default:
        return 0;
    }
  }

  private calculateRefundAmount(
    originalAmount: number,
    type: 'standard' | 'full_refund' | 'partial_refund' | 'no_fee',
    refundPercentage: number,
    processingFee: number
  ): number {
    let refundAmount = 0;

    switch (type) {
      case 'full_refund':
      case 'no_fee':
        refundAmount = originalAmount;
        break;
      case 'partial_refund':
        refundAmount = originalAmount * 0.5;
        break;
      case 'standard':
        refundAmount = originalAmount * (refundPercentage / 100);
        break;
    }

    // Apply processing fee
    refundAmount = Math.max(0, refundAmount - processingFee);

    return Math.round(refundAmount * 100) / 100; // Round to 2 decimal places
  }

  private async checkCancellationLimits(userId: string, policy: CancellationPolicy): Promise<{
    allowed: boolean;
    reason?: string;
    currentCount: number;
  }> {
    if (!policy.maxCancellationsPerPeriod) {
      return { allowed: true, currentCount: 0 };
    }

    try {
      const now = new Date();
      let startDate: Date;

      switch (policy.maxCancellationsPerPeriod.period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      const { data: cancellations, error } = await supabase
        .from('booking_cancellations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const currentCount = cancellations?.length || 0;

      return {
        allowed: currentCount < policy.maxCancellationsPerPeriod.maxCancellations,
        reason: currentCount >= policy.maxCancellationsPerPeriod.maxCancellations
          ? `Maximum ${policy.maxCancellationsPerPeriod.maxCancellations} cancellations per ${policy.maxCancellationsPerPeriod.period} reached`
          : undefined,
        currentCount
      };
    } catch (error) {
      logger.error('Failed to check cancellation limits', { error, userId });
      return { allowed: true, currentCount: 0 };
    }
  }

  private async processCancellation(
    request: CancellationRequest,
    booking: any,
    refundAmount: number,
    type: string,
    appliedPolicy: any
  ) {
    // Start transaction-like operation
    try {
      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: request.reason,
          refund_amount: refundAmount,
          metadata: {
            ...booking.metadata,
            cancellation_details: {
              reason: request.reason,
              specialCondition: request.specialCondition,
              refundAmount,
              appliedPolicy,
              processedAt: new Date().toISOString()
            }
          }
        })
        .eq('id', request.bookingId);

      if (updateError) throw updateError;

      // Log cancellation
      const { error: logError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: request.bookingId,
          user_id: request.userId,
          reason: request.reason,
          special_condition: request.specialCondition,
          refund_amount: refundAmount,
          original_amount: booking.services.price_from,
          applied_policy: appliedPolicy,
          cancellation_type: type,
          created_at: new Date().toISOString()
        });

      if (logError) throw logError;

      // Process refund if applicable
      if (refundAmount > 0 && request.autoRefund !== false) {
        await this.processRefund(request.bookingId, refundAmount, booking.payment_method);
      }

      // Send notifications
      await this.sendCancellationNotifications(request.bookingId, refundAmount, appliedPolicy);

      // Release any held slots
      await this.releaseHeldSlots(request.bookingId);

      // Emit event
      bookingEvents.emit('booking_cancelled', {
        bookingId: request.bookingId,
        refundAmount,
        reason: request.reason
      });

      logger.info('Booking cancelled successfully', {
        bookingId: request.bookingId,
        refundAmount,
        reason: request.reason
      });
    } catch (error) {
      logger.error('Failed to process cancellation', { error, request });
      throw error;
    }
  }

  private async processRefund(bookingId: string, amount: number, paymentMethod?: string) {
    try {
      if (paymentMethod === 'card' && bookingId) {
        // Process Stripe refund
        const { data: booking } = await supabase
          .from('bookings')
          .select('stripe_payment_intent_id')
          .eq('id', bookingId)
          .single();

        if (booking?.stripe_payment_intent_id) {
          // Call Stripe refund API (this would be implemented in a separate service)
          // For now, we'll just log it
          logger.info('Processing Stripe refund', {
            bookingId,
            amount,
            paymentIntentId: booking.stripe_payment_intent_id
          });
        }
      }

      // Log refund
      await supabase
        .from('refunds')
        .insert({
          booking_id: bookingId,
          amount,
          payment_method: paymentMethod,
          status: 'processing',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Failed to process refund', { error, bookingId, amount });
      throw error;
    }
  }

  private async sendCancellationNotifications(bookingId: string, refundAmount: number, appliedPolicy: any) {
    try {
      // Get booking details for notifications
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            title
          )
        `)
        .eq('id', bookingId)
        .single();

      if (!booking) return;

      // Send email notification
      if (booking.client_email) {
        await ResendService.sendCancellationConfirmation({
          bookingId,
          userId: booking.client_email,
          refundAmount,
          serviceTitle: booking.services?.title || 'Service',
        });
      }

      // Send WhatsApp notification
      if (booking.client_phone) {
        await CommunicationService.sendCancellationWhatsApp(
          booking.client_phone,
          booking.client_name || 'Client',
          booking.services?.title || 'Service',
          refundAmount > 0
        );
      }

      logger.info('Cancellation notifications sent', { bookingId });
    } catch (error) {
      logger.error('Failed to send cancellation notifications', { error, bookingId });
      // Don't fail the cancellation if notifications fail
    }
  }

  private async releaseHeldSlots(bookingId: string) {
    try {
      await supabase
        .from('holds')
        .delete()
        .eq('booking_id', bookingId);

      logger.info('Held slots released', { bookingId });
    } catch (error) {
      logger.error('Failed to release held slots', { error, bookingId });
    }
  }

  async getCancellationAnalytics(
    dateRange?: { from: Date; to: Date },
    serviceType?: string
  ): Promise<CancellationAnalytics> {
    try {
      let query = supabase
        .from('booking_cancellations')
        .select(`
          *,
          bookings (
            services:service_id (
              service_type,
              title
            )
          )
        `);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      if (serviceType) {
        query = query.eq('bookings.services.service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const cancellations = data || [];

      // Calculate basic metrics
      const totalCancellations = cancellations.length;
      const refundAmountTotal = cancellations.reduce((sum, c) => sum + (c.refund_amount || 0), 0);
      const feeAmountTotal = cancellations.reduce((sum, c) => sum + ((c.original_amount || 0) - (c.refund_amount || 0)), 0);

      // Calculate average notice hours
      const averageNoticeHours = totalCancellations > 0
        ? cancellations.reduce((sum, c) => sum + (c.applied_policy?.noticePeriod || 0), 0) / totalCancellations
        : 0;

      // Group cancellations by reason
      const cancellationsByReason = cancellations.reduce((acc, c) => {
        const reason = c.reason || 'No reason';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group cancellations by service
      const cancellationsByService = cancellations.reduce((acc, c) => {
        const serviceTitle = c.bookings?.services?.title || 'Unknown Service';
        acc[serviceTitle] = (acc[serviceTitle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group cancellations by notice period
      const cancellationsByNoticePeriod = cancellations.reduce((acc, c) => {
        const noticeHours = c.applied_policy?.noticePeriod || 0;
        let period = 'Unknown';
        if (noticeHours >= 48) period = '48+ hours';
        else if (noticeHours >= 24) period = '24-48 hours';
        else if (noticeHours >= 12) period = '12-24 hours';
        else if (noticeHours >= 4) period = '4-12 hours';
        else period = '< 4 hours';

        acc[period] = (acc[period] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Find repeat cancellators
      const repeatCancellators = Object.entries(
        cancellations.reduce((acc, c) => {
          acc[c.user_id] = (acc[c.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .filter(([_, count]) => count > 1)
        .map(([userId, count]) => ({
          userId,
          email: cancellations.find(c => c.user_id === userId)?.user?.email || 'Unknown',
          cancellationsCount: count,
          lastCancellation: new Date(
            Math.max(...cancellations
              .filter(c => c.user_id === userId)
              .map(c => new Date(c.created_at).getTime())
            )
          )
        }))
        .sort((a, b) => b.cancellationsCount - a.cancellationsCount);

      // Calculate overall cancellation rate (this would need total bookings count)
      const cancellationRate = 0.1; // Placeholder - would calculate from actual booking data

      return {
        totalCancellations,
        cancellationRate,
        averageNoticeHours,
        refundAmountTotal,
        feeAmountTotal,
        cancellationsByReason,
        cancellationsByService,
        cancellationsByNoticePeriod,
        repeatCancellators
      };
    } catch (error) {
      logger.error('Failed to get cancellation analytics', { error, dateRange, serviceType });
      return {
        totalCancellations: 0,
        cancellationRate: 0,
        averageNoticeHours: 0,
        refundAmountTotal: 0,
        feeAmountTotal: 0,
        cancellationsByReason: {},
        cancellationsByService: {},
        cancellationsByNoticePeriod: [],
        repeatCancellators: []
      };
    }
  }
}

export const cancellationPolicyService = new CancellationPolicyService();