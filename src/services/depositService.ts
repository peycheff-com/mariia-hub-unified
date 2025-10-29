import { supabase } from '@/integrations/supabase/client';

export interface DepositRule {
  id: string;
  service_id?: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  category?: string;
  price_min?: number;
  price_max?: number;
  deposit_type: 'fixed' | 'percentage';
  deposit_amount: number;
  max_deposit_amount?: number;
  refund_policy: 'refundable' | 'non_refundable' | 'partial';
  days_before_refund: number;
  partial_refund_percentage?: number;
  apply_within_days?: number;
  apply_after_hours?: number;
  min_group_size?: number;
  promotion_exclusive?: boolean;
  loyalty_tier_exclusive?: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DepositCalculation {
  rule_id?: string;
  deposit_required: boolean;
  deposit_amount: number;
  deposit_type?: 'fixed' | 'percentage';
  refund_policy?: string;
  days_before_refund?: number;
  breakdown: {
    base_price: number;
    deposit_percentage?: number;
    max_deposit_applied?: boolean;
    applicable_rule?: string;
  };
}

export interface DepositTransaction {
  id: string;
  booking_id: string;
  deposit_amount: number;
  deposit_type: 'fixed' | 'percentage';
  deposit_percentage?: number;
  original_deposit_rule_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  deposit_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'forfeited' | 'failed';
  refund_amount: number;
  refund_reason?: string;
  refund_policy_applied?: string;
  days_before_cancellation?: number;
  refund_stripe_refund_id?: string;
  refund_processed_at?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  metadata: Record<string, any>;
}

export interface RefundCalculation {
  refund_amount: number;
  refund_status: 'full_refund' | 'partial_refund' | 'forfeited' | 'none';
  refund_reason: string;
  days_before_booking: number;
  original_deposit: number;
}

class DepositService {
  /**
   * Calculate deposit amount for a booking based on service and price
   */
  async calculateDepositAmount(
    serviceId: string,
    serviceType: 'beauty' | 'fitness' | 'lifestyle',
    price: number,
    options: {
      bookingDate?: Date;
      groupSize?: number;
      loyaltyTier?: string;
      category?: string;
    } = {}
  ): Promise<DepositCalculation> {
    try {
      const { data, error } = await supabase.rpc('calculate_deposit_amount', {
        p_service_id: serviceId,
        p_service_type: serviceType,
        p_price: price,
        p_booking_date: options.bookingDate?.toISOString().split('T')[0],
        p_group_size: options.groupSize || 1,
        p_loyalty_tier: options.loyaltyTier
      });

      if (error) {
        console.error('Error calculating deposit:', error);
        throw error;
      }

      const result = Array.isArray(data) ? data[0] : data;

      // Build breakdown
      const breakdown = {
        base_price: price,
        deposit_percentage: result.deposit_type === 'percentage' ? result.deposit_amount : undefined,
        max_deposit_applied: false,
        applicable_rule: result.rule_id ? `Rule #${result.rule_id.slice(0, 8)}` : undefined
      };

      return {
        rule_id: result.rule_id,
        deposit_required: result.deposit_required,
        deposit_amount: parseFloat(result.deposit_amount) || 0,
        deposit_type: result.deposit_type,
        refund_policy: result.refund_policy,
        days_before_refund: result.days_before_refund,
        breakdown
      };
    } catch (error) {
      console.error('Deposit calculation error:', error);
      // Return no deposit required on error
      return {
        deposit_required: false,
        deposit_amount: 0,
        breakdown: {
          base_price: price
        }
      };
    }
  }

  /**
   * Get all active deposit rules
   */
  async getDepositRules(serviceType?: string): Promise<DepositRule[]> {
    try {
      let query = supabase
        .from('deposit_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deposit rules:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deposit rules:', error);
      return [];
    }
  }

  /**
   * Create or update a deposit rule
   */
  async upsertDepositRule(rule: Partial<DepositRule>): Promise<DepositRule> {
    try {
      const { data, error } = await supabase
        .from('deposit_rules')
        .upsert({
          ...rule,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting deposit rule:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error upserting deposit rule:', error);
      throw error;
    }
  }

  /**
   * Delete a deposit rule
   */
  async deleteDepositRule(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('deposit_rules')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting deposit rule:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting deposit rule:', error);
      throw error;
    }
  }

  /**
   * Create a deposit transaction for a booking
   */
  async createDepositTransaction(
    bookingId: string,
    depositCalculation: DepositCalculation,
    metadata: Record<string, any> = {}
  ): Promise<DepositTransaction> {
    try {
      const { data, error } = await supabase
        .from('deposit_transactions')
        .insert({
          booking_id: bookingId,
          deposit_amount: depositCalculation.deposit_amount,
          deposit_type: depositCalculation.deposit_type,
          deposit_percentage: depositCalculation.breakdown.deposit_percentage,
          original_deposit_rule_id: depositCalculation.rule_id,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating deposit transaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating deposit transaction:', error);
      throw error;
    }
  }

  /**
   * Update deposit transaction with payment details
   */
  async updateDepositPayment(
    transactionId: string,
    paymentDetails: {
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
      status: 'paid' | 'failed';
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        deposit_status: paymentDetails.status,
        updated_at: new Date().toISOString()
      };

      if (paymentDetails.stripePaymentIntentId) {
        updateData.stripe_payment_intent_id = paymentDetails.stripePaymentIntentId;
      }
      if (paymentDetails.stripeChargeId) {
        updateData.stripe_charge_id = paymentDetails.stripeChargeId;
      }
      if (paymentDetails.status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deposit_transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating deposit payment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating deposit payment:', error);
      throw error;
    }
  }

  /**
   * Process a deposit refund calculation
   */
  async calculateRefund(
    bookingId: string,
    cancellationDate: Date = new Date()
  ): Promise<RefundCalculation> {
    try {
      const { data, error } = await supabase.rpc('process_deposit_refund', {
        p_booking_id: bookingId,
        p_cancellation_date: cancellationDate.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error calculating refund:', error);
        throw error;
      }

      const result = Array.isArray(data) ? data[0] : data;

      // Get original deposit amount
      const { data: depositData } = await supabase
        .from('deposit_transactions')
        .select('deposit_amount')
        .eq('booking_id', bookingId)
        .eq('deposit_status', 'paid')
        .single();

      const originalDeposit = depositData?.deposit_amount || 0;

      return {
        refund_amount: parseFloat(result.refund_amount) || 0,
        refund_status: result.refund_status || 'none',
        refund_reason: result.refund_reason || 'No refund applicable',
        days_before_booking: 0, // Calculate from booking date
        original_deposit: originalDeposit
      };
    } catch (error) {
      console.error('Error calculating refund:', error);
      return {
        refund_amount: 0,
        refund_status: 'none',
        refund_reason: 'Error calculating refund',
        days_before_booking: 0,
        original_deposit: 0
      };
    }
  }

  /**
   * Process an actual refund through Stripe (this would integrate with your Stripe service)
   */
  async processRefund(
    transactionId: string,
    refundAmount: number,
    reason?: string
  ): Promise<void> {
    try {
      // Get the deposit transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !transaction) {
        throw new Error('Deposit transaction not found');
      }

      // Here you would integrate with your Stripe service to process the refund
      // For now, we'll just update the transaction record
      const { error } = await supabase
        .from('deposit_transactions')
        .update({
          refund_amount: refundAmount,
          refund_reason: reason,
          refund_processed_at: new Date().toISOString(),
          deposit_status: refundAmount > 0 ? 'refunded' : 'forfeited',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error processing refund:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get deposit transactions for a booking
   */
  async getDepositTransactions(bookingId: string): Promise<DepositTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposit transactions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deposit transactions:', error);
      return [];
    }
  }

  /**
   * Get deposit analytics for reporting
   */
  async getDepositAnalytics(dateRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('deposit_transactions')
        .select(`
          *,
          bookings!inner(
            service_id,
            services!inner(
              service_type,
              title
            )
          )
        `);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deposit analytics:', error);
        throw error;
      }

      // Calculate analytics
      const analytics = {
        totalDeposits: 0,
        totalRefunded: 0,
        totalForfeited: 0,
        depositCount: 0,
        refundCount: 0,
        forfeitCount: 0,
        byServiceType: {} as Record<string, {
          total: number;
          refunded: number;
          forfeited: number;
          count: number;
        }>,
        averageDepositAmount: 0,
        refundRate: 0
      };

      if (data) {
        data.forEach(transaction => {
          const serviceType = transaction.bookings?.services?.service_type || 'unknown';
          const amount = parseFloat(transaction.deposit_amount);
          const refundAmount = parseFloat(transaction.refund_amount || '0');

          analytics.totalDeposits += amount;
          analytics.totalRefunded += refundAmount;
          analytics.totalForfeited += (amount - refundAmount);
          analytics.depositCount++;

          if (transaction.deposit_status === 'refunded') {
            analytics.refundCount++;
          } else if (transaction.deposit_status === 'forfeited') {
            analytics.forfeitCount++;
          }

          // By service type
          if (!analytics.byServiceType[serviceType]) {
            analytics.byServiceType[serviceType] = {
              total: 0,
              refunded: 0,
              forfeited: 0,
              count: 0
            };
          }
          analytics.byServiceType[serviceType].total += amount;
          analytics.byServiceType[serviceType].refunded += refundAmount;
          analytics.byServiceType[serviceType].forfeited += (amount - refundAmount);
          analytics.byServiceType[serviceType].count++;
        });

        analytics.averageDepositAmount = analytics.depositCount > 0
          ? analytics.totalDeposits / analytics.depositCount
          : 0;
        analytics.refundRate = analytics.depositCount > 0
          ? (analytics.refundCount / analytics.depositCount) * 100
          : 0;
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching deposit analytics:', error);
      return null;
    }
  }

  /**
   * Format deposit amount for display
   */
  formatDepositAmount(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Generate deposit breakdown text for display
   */
  generateDepositBreakdown(calculation: DepositCalculation): string[] {
    const lines: string[] = [];

    if (!calculation.deposit_required || calculation.deposit_amount === 0) {
      lines.push('No deposit required for this booking');
      return lines;
    }

    if (calculation.deposit_type === 'percentage') {
      lines.push(
        `Deposit: ${calculation.breakdown.deposit_percentage}% of total price`,
        `Amount: ${this.formatDepositAmount(calculation.deposit_amount)}`
      );
    } else {
      lines.push(
        `Fixed deposit amount: ${this.formatDepositAmount(calculation.deposit_amount)}`
      );
    }

    if (calculation.refund_policy) {
      switch (calculation.refund_policy) {
        case 'refundable':
          lines.push(
            `Fully refundable if cancelled ${calculation.days_before_refund} days before booking`
          );
          break;
        case 'partial':
          lines.push(
            `Partial refund available (${calculation.days_before_refund} days notice required)`
          );
          break;
        case 'non_refundable':
          lines.push('Non-refundable deposit');
          break;
      }
    }

    return lines;
  }
}

export const depositService = new DepositService();
export default depositService;