import { supabase } from '@/integrations/supabase/client';

import { depositService, RefundCalculation, DepositTransaction } from './depositService';

export interface RefundRequest {
  bookingId: string;
  reason?: string;
  cancellationDate?: Date;
  requestedBy?: 'customer' | 'admin' | 'system';
  userId?: string;
}

export interface RefundResult {
  success: boolean;
  refundAmount: number;
  refundStatus: 'full_refund' | 'partial_refund' | 'forfeited' | 'none';
  refundReason: string;
  transactionId: string;
  stripeRefundId?: string;
  processedAt: Date;
  daysBeforeBooking: number;
  error?: string;
}

export interface DepositRefundPolicy {
  ruleId: string;
  policyType: 'refundable' | 'non_refundable' | 'partial';
  daysRequired: number;
  partialPercentage?: number;
  conditions: {
    minHoursBeforeBooking?: number;
    maxRefundAmount?: number;
    exemptCircumstances?: string[];
  };
}

class DepositRefundService {
  /**
   * Process a refund request for a booking deposit
   */
  async processRefundRequest(request: RefundRequest): Promise<RefundResult> {
    try {
      // Get the booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', request.bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      // Get the deposit transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('booking_id', request.bookingId)
        .eq('deposit_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transactionError || !transaction) {
        throw new Error('No paid deposit found for this booking');
      }

      // Calculate refund amount
      const refundCalculation = await depositService.calculateRefund(
        request.bookingId,
        request.cancellationDate || new Date()
      );

      // Process the refund through Stripe (simulated)
      let stripeRefundId: string | undefined;
      if (refundCalculation.refund_amount > 0) {
        try {
          // Here you would integrate with your Stripe service
          // const stripeRefund = await stripe.refunds.create({
          //   payment_intent: transaction.stripe_payment_intent_id,
          //   amount: Math.round(refundCalculation.refund_amount * 100), // Convert to cents
          //   reason: 'requested_by_customer',
          //   metadata: {
          //     booking_id: request.bookingId,
          //     cancellation_reason: request.reason || 'Customer request'
          //   }
          // });
          // stripeRefundId = stripeRefund.id;

          // For now, simulate a refund ID
          stripeRefundId = `re_simulated_${Date.now()}`;
        } catch (stripeError) {
          console.error('Stripe refund failed:', stripeError);
          throw new Error('Failed to process refund with payment provider');
        }
      }

      // Update the deposit transaction
      await depositService.processRefund(
        transaction.id,
        refundCalculation.refund_amount,
        refundCalculation.refund_reason
      );

      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          // Add cancellation metadata
          metadata: {
            ...(booking.metadata || {}),
            cancellation: {
              date: request.cancellationDate?.toISOString(),
              reason: request.reason,
              requestedBy: request.requestedBy,
              refundProcessed: true,
              refundAmount: refundCalculation.refund_amount
            }
          }
        })
        .eq('id', request.bookingId);

      // Log the refund for audit
      await this.logRefundAction({
        bookingId: request.bookingId,
        transactionId: transaction.id,
        refundAmount: refundCalculation.refund_amount,
        refundStatus: refundCalculation.refund_status,
        refundReason: refundCalculation.refund_reason,
        requestedBy: request.requestedBy,
        userId: request.userId,
        stripeRefundId
      });

      return {
        success: true,
        refundAmount: refundCalculation.refund_amount,
        refundStatus: refundCalculation.refund_status,
        refundReason: refundCalculation.refund_reason,
        transactionId: transaction.id,
        stripeRefundId,
        processedAt: new Date(),
        daysBeforeBooking: refundCalculation.days_before_booking
      };

    } catch (error) {
      console.error('Refund processing failed:', error);
      return {
        success: false,
        refundAmount: 0,
        refundStatus: 'none',
        refundReason: error instanceof Error ? error.message : 'Unknown error',
        transactionId: '',
        processedAt: new Date(),
        daysBeforeBooking: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate refund without processing it
   */
  async calculateRefundPreview(bookingId: string, cancellationDate?: Date): Promise<RefundCalculation> {
    return await depositService.calculateRefund(bookingId, cancellationDate || new Date());
  }

  /**
   * Get refund policy details for a service
   */
  async getRefundPolicy(serviceId: string): Promise<DepositRefundPolicy | null> {
    try {
      // Get the deposit rule for this service
      const { data, error } = await supabase
        .from('deposit_rules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ruleId: data.id,
        policyType: data.refund_policy,
        daysRequired: data.days_before_refund || 0,
        partialPercentage: data.partial_refund_percentage,
        conditions: {
          minHoursBeforeBooking: data.apply_after_hours,
          maxRefundAmount: data.max_deposit_amount,
          exemptCircumstances: []
        }
      };
    } catch (error) {
      console.error('Error fetching refund policy:', error);
      return null;
    }
  }

  /**
   * Check if refund is eligible for special circumstances
   */
  async checkSpecialCircumstances(
    bookingId: string,
    reason: string
  ): Promise<{ eligible: boolean; reason: string; fullRefund: boolean }> {
    // Define special circumstances that override normal refund policies
    const specialCircumstances = [
      {
        pattern: /medical|health|sick|illness|doctor/i,
        reason: 'Medical reason - documentation may be required',
        fullRefund: true
      },
      {
        pattern: /emergency|urgent|critical/i,
        reason: 'Emergency situation',
        fullRefund: true
      },
      {
        pattern: /covid|quarantine|isolation/i,
        reason: 'COVID-19 related circumstances',
        fullRefund: true
      },
      {
        pattern: /bereavement|funeral|death/i,
        reason: 'Bereavement',
        fullRefund: true
      },
      {
        pattern: /weather|natural disaster/i,
        reason: 'Severe weather or natural disaster',
        fullRefund: true
      }
    ];

    // Check if the reason matches any special circumstances
    for (const circumstance of specialCircumstances) {
      if (circumstance.pattern.test(reason)) {
        return {
          eligible: true,
          reason: circumstance.reason,
          fullRefund: circumstance.fullRefund
        };
      }
    }

    return {
      eligible: false,
      reason: 'Standard refund policy applies',
      fullRefund: false
    };
  }

  /**
   * Process refund with special circumstances consideration
   */
  async processRefundWithCircumstances(request: RefundRequest): Promise<RefundResult> {
    // Check for special circumstances first
    const specialCheck = await this.checkSpecialCircumstances(
      request.bookingId,
      request.reason || ''
    );

    if (specialCheck.eligible && specialCheck.fullRefund) {
      // Override the standard calculation for full refund
      try {
        const { data: transaction } = await supabase
          .from('deposit_transactions')
          .select('*')
          .eq('booking_id', request.bookingId)
          .eq('deposit_status', 'paid')
          .single();

        if (transaction) {
          await depositService.processRefund(
            transaction.id,
            parseFloat(transaction.deposit_amount),
            `Full refund - ${specialCheck.reason}`
          );

          return {
            success: true,
            refundAmount: parseFloat(transaction.deposit_amount),
            refundStatus: 'full_refund',
            refundReason: specialCheck.reason,
            transactionId: transaction.id,
            processedAt: new Date(),
            daysBeforeBooking: 0
          };
        }
      } catch (error) {
        console.error('Special circumstances refund failed:', error);
      }
    }

    // Fall back to standard refund processing
    return await this.processRefundRequest(request);
  }

  /**
   * Log refund actions for audit trail
   */
  private async logRefundAction(logData: {
    bookingId: string;
    transactionId: string;
    refundAmount: number;
    refundStatus: string;
    refundReason: string;
    requestedBy: string;
    userId?: string;
    stripeRefundId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('booking_changes')
        .insert({
          booking_id: logData.bookingId,
          change_type: 'cancelled',
          reason: `${logData.refundReason} - Refund: ${logData.refundAmount} PLN`,
          changed_by: logData.userId,
          system_generated: logData.requestedBy === 'system',
          metadata: {
            refund: {
              amount: logData.refundAmount,
              status: logData.refundStatus,
              transactionId: logData.transactionId,
              stripeRefundId: logData.stripeRefundId,
              requestedBy: logData.requestedBy
            }
          }
        });
    } catch (error) {
      console.error('Failed to log refund action:', error);
    }
  }

  /**
   * Get refund history for a user
   */
  async getRefundHistory(userId?: string, email?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('deposit_transactions')
        .select(`
          *,
          bookings!inner(
            client_email,
            client_name,
            services!inner(
              title,
              service_type
            )
          )
        `)
        .in('deposit_status', ['refunded', 'partially_refunded', 'forfeited'])
        .order('updated_at', { ascending: false });

      if (userId) {
        // Filter by user ID through bookings
        query = query.eq('bookings.user_id', userId);
      } else if (email) {
        // Filter by client email
        query = query.eq('bookings.client_email', email);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching refund history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching refund history:', error);
      return [];
    }
  }

  /**
   * Send refund notification email
   */
  async sendRefundNotification(refundResult: RefundResult, customerEmail: string, customerName: string): Promise<void> {
    try {
      // Here you would integrate with your email service
      console.log('Sending refund notification:', {
        to: customerEmail,
        name: customerName,
        refundAmount: refundResult.refundAmount,
        refundStatus: refundResult.refundStatus,
        refundReason: refundResult.refundReason
      });

      // Example email content:
      const emailContent = {
        to: customerEmail,
        subject: 'Information about your refund',
        template: 'refund-notification',
        data: {
          customerName,
          refundAmount: this.formatCurrency(refundResult.refundAmount),
          refundStatus: refundResult.refundStatus.replace('_', ' '),
          refundReason: refundResult.refundReason,
          processedAt: refundResult.processedAt.toLocaleDateString('pl-PL'),
          transactionId: refundResult.transactionId
        }
      };

      // await emailService.sendTemplate(emailContent);
    } catch (error) {
      console.error('Failed to send refund notification:', error);
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  }

  /**
   * Generate refund policy text for display
   */
  generatePolicyText(policy: DepositRefundPolicy): string[] {
    const lines: string[] = [];

    switch (policy.policyType) {
      case 'refundable':
        lines.push(
          `Full refund available if cancelled ${policy.daysRequired} days before booking`
        );
        break;
      case 'partial':
        lines.push(
          `Partial refund (${policy.partialPercentage}%) available if cancelled ${policy.daysRequired} days before booking`
        );
        break;
      case 'non_refundable':
        lines.push('Deposit is non-refundable');
        break;
    }

    if (policy.conditions.minHoursBeforeBooking) {
      lines.push(`Minimum ${policy.conditions.minHoursBeforeBooking} hours notice required`);
    }

    return lines;
  }
}

export const depositRefundService = new DepositRefundService();
export default depositRefundService;