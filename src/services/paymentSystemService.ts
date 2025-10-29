import { supabase } from '@/integrations/supabase/client';
import {
  DepositCalculationParams,
  DepositCalculationResult,
  CancellationFeeCalculationParams,
  CancellationFeeResult,
  SplitPaymentPlanParams,
  GiftCardPurchaseParams,
  PaymentSummary,
  ApiResponse,
  GiftCard,
  PaymentPlan,
  PaymentInstallment,
  CancellationFee,
  CancellationPolicy
} from '@/types/payment-loyalty';

export class PaymentSystemService {
  // ========================================
  // DEPOSIT CALCULATION
  // ========================================

  /**
   * Calculate deposit requirements for a service
   */
  async calculateDeposit(params: DepositCalculationParams): Promise<ApiResponse<DepositCalculationResult>> {
    try {
      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('deposit_amount, deposit_percentage, price_from, price_to')
        .eq('id', params.serviceId)
        .single();

      if (serviceError) {
        return {
          data: null,
          error: {
            message: 'Service not found',
            code: 'SERVICE_NOT_FOUND'
          },
          success: false
        };
      }

      let depositAmount = 0;
      let depositPercentage: number | null = null;
      let depositType: 'fixed' | 'percentage' = 'fixed';

      // Calculate deposit based on service configuration
      if (service.deposit_amount && service.deposit_amount > 0) {
        depositAmount = service.deposit_amount;
        depositType = 'fixed';
      } else if (service.deposit_percentage && service.deposit_percentage > 0) {
        depositAmount = (params.totalAmount * service.deposit_percentage) / 100;
        depositPercentage = service.deposit_percentage;
        depositType = 'percentage';
      } else {
        // Default deposit rules based on service type and amount
        const defaultDeposits = this.getDefaultDepositRules();
        const rule = defaultDeposits[params.serviceType] || defaultDeposits.default;

        if (rule.percentage) {
          depositAmount = (params.totalAmount * rule.percentage) / 100;
          depositPercentage = rule.percentage;
          depositType = 'percentage';
        } else if (rule.fixed) {
          depositAmount = rule.fixed;
          depositType = 'fixed';
        }
      }

      // Apply maximum and minimum deposit limits
      const minDeposit = 50; // Minimum 50 PLN
      const maxDepositPercentage = 50; // Maximum 50% of total

      if (depositAmount < minDeposit) {
        depositAmount = minDeposit;
      } else if (depositType === 'percentage' && depositPercentage && depositPercentage > maxDepositPercentage) {
        depositAmount = (params.totalAmount * maxDepositPercentage) / 100;
        depositPercentage = maxDepositPercentage;
      }

      return {
        data: {
          depositAmount: Math.round(depositAmount * 100) / 100, // Round to 2 decimal places
          depositPercentage,
          depositType,
          currency: params.currency
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error calculating deposit:', error);
      return {
        data: null,
        error: {
          message: 'Failed to calculate deposit',
          code: 'CALCULATION_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Get default deposit rules for different service types
   */
  private getDefaultDepositRules() {
    return {
      beauty: {
        percentage: 25, // 25% for beauty services
        minimum: 100
      },
      fitness: {
        percentage: 20, // 20% for fitness programs
        minimum: 150
      },
      lifestyle: {
        percentage: 30, // 30% for lifestyle services
        minimum: 200
      },
      default: {
        percentage: 20,
        minimum: 50
      }
    };
  }

  // ========================================
  // CANCELLATION FEE CALCULATION
  // ========================================

  /**
   * Calculate cancellation fees based on policies
   */
  async calculateCancellationFee(params: CancellationFeeCalculationParams): Promise<ApiResponse<CancellationFeeResult>> {
    try {
      // Get applicable cancellation policy
      const { data: policy, error: policyError } = await this.getApplicableCancellationPolicy(
        params.bookingId,
        params.policyId
      );

      if (policyError || !policy) {
        return {
          data: null,
          error: {
            message: 'No cancellation policy found',
            code: 'POLICY_NOT_FOUND'
          },
          success: false
        };
      }

      // Calculate time difference in hours
      const timeDiffHours = (params.cancellationTime.getTime() - params.bookingTime.getTime()) / (1000 * 60 * 60);

      let feeAmount = 0;
      let refundAmount = params.totalAmount;
      const feeType = policy.fee_type;
      let reason = '';

      if (timeDiffHours >= policy.cancellation_window_hours) {
        // Free cancellation - outside the window
        reason = `Free cancellation - more than ${policy.cancellation_window_hours} hours notice`;
      } else {
        // Within cancellation window - apply fees
        switch (policy.fee_type) {
          case 'percentage':
            feeAmount = (params.totalAmount * policy.fee_percentage) / 100;
            refundAmount = params.totalAmount - feeAmount;
            reason = `${policy.fee_percentage}% cancellation fee applied`;
            break;

          case 'fixed':
            feeAmount = policy.fee_percentage; // Using fee_percentage as fixed amount
            refundAmount = params.totalAmount - feeAmount;
            reason = `Fixed cancellation fee of ${policy.fee_percentage} ${params.currency} applied`;
            break;

          case 'deposit_forfeiture':
            feeAmount = params.depositPaid;
            refundAmount = params.totalAmount - params.depositPaid;
            reason = 'Deposit forfeited due to late cancellation';
            break;
        }
      }

      // Ensure refund doesn't exceed total amount
      refundAmount = Math.max(0, Math.min(refundAmount, params.totalAmount));

      return {
        data: {
          feeAmount: Math.round(feeAmount * 100) / 100,
          refundAmount: Math.round(refundAmount * 100) / 100,
          feeType,
          reason
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error calculating cancellation fee:', error);
      return {
        data: null,
        error: {
          message: 'Failed to calculate cancellation fee',
          code: 'CALCULATION_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Get applicable cancellation policy for a booking
   */
  private async getApplicableCancellationPolicy(bookingId: string, policyId?: string): Promise<{ data: CancellationPolicy | null; error: any }> {
    try {
      if (policyId) {
        // Use specific policy if provided
        const { data, error } = await supabase
          .from('cancellation_policies')
          .select('*')
          .eq('id', policyId)
          .single();

        return { data, error };
      }

      // Get booking with service details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          services!inner(
            service_type,
            id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        return { data: null, error: bookingError };
      }

      // Try to find service-specific policy first
      const { data: servicePolicy, error: servicePolicyError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('service_id', booking.services.id)
        .single();

      if (servicePolicy && !servicePolicyError) {
        return { data: servicePolicy, error: null };
      }

      // Fall back to service type policy
      const { data: typePolicy, error: typePolicyError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('service_type', booking.services.service_type)
        .is('service_id', null)
        .single();

      if (typePolicy && !typePolicyError) {
        return { data: typePolicy, error: null };
      }

      // Finally, fall back to default policy
      const { data: defaultPolicy, error: defaultPolicyError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('is_default', true)
        .single();

      return { data: defaultPolicy, error: defaultPolicyError };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ========================================
  // SPLIT PAYMENT PLANS
  // ========================================

  /**
   * Create a payment plan for a booking
   */
  async createPaymentPlan(params: SplitPaymentPlanParams): Promise<ApiResponse<PaymentPlan>> {
    try {
      // Validate payment plan parameters
      if (params.numberOfInstallments < 2 || params.numberOfInstallments > 12) {
        return {
          data: null,
          error: {
            message: 'Number of installments must be between 2 and 12',
            code: 'INVALID_INSTALLMENTS'
          },
          success: false
        };
      }

      // Create payment plan
      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
          booking_id: params.bookingId,
          total_amount: params.totalAmount,
          currency: 'PLN', // Default currency
          number_of_installments: params.numberOfInstallments,
          installment_amount: (params.totalAmount - (params.depositAmount || 0)) / params.numberOfInstallments,
          deposit_amount: params.depositAmount || 0,
          status: 'pending'
        })
        .select()
        .single();

      if (planError) {
        return {
          data: null,
          error: {
            message: 'Failed to create payment plan',
            code: 'PLAN_CREATION_ERROR',
            details: planError
          },
          success: false
        };
      }

      // Create installment records
      const installments = params.installmentSchedule.map((schedule, index) => ({
        payment_plan_id: paymentPlan.id,
        installment_number: index + 1,
        due_date: schedule.dueDate.toISOString(),
        amount: schedule.amount,
        status: 'pending'
      }));

      const { error: installmentError } = await supabase
        .from('payment_installments')
        .insert(installments);

      if (installmentError) {
        // Rollback payment plan creation
        await supabase.from('payment_plans').delete().eq('id', paymentPlan.id);

        return {
          data: null,
          error: {
            message: 'Failed to create installments',
            code: 'INSTALLMENT_CREATION_ERROR',
            details: installmentError
          },
          success: false
        };
      }

      // Update payment plan status to active
      const { data: updatedPlan, error: updateError } = await supabase
        .from('payment_plans')
        .update({ status: 'active' })
        .eq('id', paymentPlan.id)
        .select()
        .single();

      return {
        data: updatedPlan,
        error: updateError,
        success: !updateError
      };
    } catch (error) {
      console.error('Error creating payment plan:', error);
      return {
        data: null,
        error: {
          message: 'Failed to create payment plan',
          code: 'PLAN_CREATION_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Get payment plan details with installments
   */
  async getPaymentPlan(paymentPlanId: string): Promise<ApiResponse<PaymentPlan & { installments: PaymentInstallment[] }>> {
    try {
      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('id', paymentPlanId)
        .single();

      if (planError) {
        return {
          data: null,
          error: {
            message: 'Payment plan not found',
            code: 'PLAN_NOT_FOUND'
          },
          success: false
        };
      }

      const { data: installments, error: installmentError } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('payment_plan_id', paymentPlanId)
        .order('installment_number');

      if (installmentError) {
        return {
          data: null,
          error: {
            message: 'Failed to fetch installments',
            code: 'INSTALLMENT_FETCH_ERROR'
          },
          success: false
        };
      }

      return {
        data: {
          ...paymentPlan,
          installments: installments || []
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error fetching payment plan:', error);
      return {
        data: null,
        error: {
          message: 'Failed to fetch payment plan',
          code: 'FETCH_ERROR'
        },
        success: false
      };
    }
  }

  // ========================================
  // GIFT CARDS
  // ========================================

  /**
   * Purchase a gift card
   */
  async purchaseGiftCard(params: GiftCardPurchaseParams): Promise<ApiResponse<GiftCard>> {
    try {
      // Generate unique gift card code
      const code = this.generateGiftCardCode();

      // Set expiration date (2 years from purchase if not specified)
      const expiresAt = params.expiresAt || new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 2);

      // Create gift card
      const { data: giftCard, error: giftCardError } = await supabase
        .from('gift_cards')
        .insert({
          code,
          type: 'gift_card',
          status: 'active',
          initial_value: params.amount,
          current_balance: params.amount,
          currency: params.currency,
          purchaser_id: params.purchaserId,
          recipient_email: params.recipientEmail,
          recipient_id: params.recipientId,
          personal_message: params.personalMessage,
          valid_from: params.validFrom || new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (giftCardError) {
        return {
          data: null,
          error: {
            message: 'Failed to create gift card',
            code: 'GIFT_CARD_CREATION_ERROR',
            details: giftCardError
          },
          success: false
        };
      }

      // Create initial transaction
      await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: giftCard.id,
          transaction_type: 'issued',
          amount: params.amount,
          balance_before: 0,
          balance_after: params.amount,
          metadata: {
            purchaser_id: params.purchaserId,
            recipient_email: params.recipientEmail
          }
        });

      return {
        data: giftCard,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error purchasing gift card:', error);
      return {
        data: null,
        error: {
          message: 'Failed to purchase gift card',
          code: 'PURCHASE_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Redeem a gift card
   */
  async redeemGiftCard(code: string, amount: number, bookingId?: string): Promise<ApiResponse<{ giftCard: GiftCard; amountApplied: number }>> {
    try {
      // Get gift card
      const { data: giftCard, error: giftCardError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (giftCardError || !giftCard) {
        return {
          data: null,
          error: {
            message: 'Invalid gift card code',
            code: 'INVALID_CODE'
          },
          success: false
        };
      }

      // Validate gift card
      if (giftCard.status !== 'active') {
        return {
          data: null,
          error: {
            message: `Gift card is ${giftCard.status}`,
            code: 'INACTIVE_CARD'
          },
          success: false
        };
      }

      if (new Date(giftCard.expires_at!) < new Date()) {
        return {
          data: null,
          error: {
            message: 'Gift card has expired',
            code: 'EXPIRED_CARD'
          },
          success: false
        };
      }

      if (giftCard.current_balance < amount) {
        return {
          data: null,
          error: {
            message: 'Insufficient gift card balance',
            code: 'INSUFFICIENT_BALANCE'
          },
          success: false
        };
      }

      // Calculate amount to apply (can't exceed current balance)
      const amountApplied = Math.min(amount, giftCard.current_balance);
      const newBalance = giftCard.current_balance - amountApplied;

      // Update gift card balance
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({
          current_balance: newBalance,
          status: newBalance === 0 ? 'used' : 'active'
        })
        .eq('id', giftCard.id);

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to update gift card',
            code: 'UPDATE_ERROR'
          },
          success: false
        };
      }

      // Create transaction record
      await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: giftCard.id,
          booking_id: bookingId,
          transaction_type: 'used',
          amount: amountApplied,
          balance_before: giftCard.current_balance,
          balance_after: newBalance,
          metadata: {
            booking_id: bookingId
          }
        });

      // Get updated gift card
      const { data: updatedCard } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('id', giftCard.id)
        .single();

      return {
        data: {
          giftCard: updatedCard!,
          amountApplied
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      return {
        data: null,
        error: {
          message: 'Failed to redeem gift card',
          code: 'REDEEM_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Generate unique gift card code
   */
  private generateGiftCardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ========================================
  // PAYMENT SUMMARY
  // ========================================

  /**
   * Get complete payment summary for a booking
   */
  async getPaymentSummary(bookingId: string): Promise<ApiResponse<PaymentSummary>> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return {
          data: null,
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          },
          success: false
        };
      }

      // Get payment plan if exists
      const { data: paymentPlan } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      // Calculate totals
      const totalAmount = booking.price_from || 0;
      const depositRequired = booking.deposit_paid || 0;
      const depositPaid = booking.deposit_paid || 0;
      const balanceDue = totalAmount - depositPaid;

      return {
        data: {
          totalAmount,
          depositRequired,
          depositPaid,
          balanceDue,
          currency: booking.currency || 'PLN',
          paymentPlan: paymentPlan || undefined
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      return {
        data: null,
        error: {
          message: 'Failed to get payment summary',
          code: 'SUMMARY_ERROR'
        },
        success: false
      };
    }
  }
}

// Export singleton instance
export const paymentSystemService = new PaymentSystemService();