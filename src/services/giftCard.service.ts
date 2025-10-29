import { supabase } from '@/integrations/supabase/client';

import type {
  GiftCard,
  GiftCardTransaction,
  PromotionalVoucher,
  VoucherRedemption,
  GiftCardPurchaseData,
  GiftCardBalanceResponse,
  GiftCardRedemptionResponse,
  VoucherApplicationResponse,
  VoucherGenerationData,
  GiftCardStats,
  VoucherStats,
} from '@/types/gift-card';

export class GiftCardService {
  // Gift Card Operations
  static async createGiftCard(purchaseData: GiftCardPurchaseData): Promise<{ giftCard: GiftCard; paymentIntent: any }> {
    try {
      // Generate unique gift card code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_card_code');
      if (codeError) throw codeError;

      // Create Stripe payment intent
      const { data: paymentIntent, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: purchaseData.amount,
          currency: 'PLN',
          metadata: {
            type: 'gift_card',
            recipient_email: purchaseData.recipient_email,
          },
        },
      });

      if (paymentError) throw paymentError;

      // Create gift card record
      const { data: giftCard, error: giftCardError } = await supabase
        .from('gift_cards')
        .insert({
          card_code: codeData,
          initial_balance: purchaseData.amount,
          current_balance: purchaseData.amount,
          currency: 'PLN',
          recipient_email: purchaseData.recipient_email,
          recipient_name: purchaseData.recipient_name,
          message: purchaseData.message,
          delivery_scheduled_at: purchaseData.delivery_date,
          personalization_data: purchaseData.personalization,
        })
        .select()
        .single();

      if (giftCardError) throw giftCardError;

      // Log purchase analytics
      await supabase.from('gift_card_analytics').insert({
        gift_card_id: giftCard.id,
        event_type: 'purchased',
        event_data: {
          amount: purchaseData.amount,
          recipient_email: purchaseData.recipient_email,
          personalization: purchaseData.personalization,
        },
      });

      return { giftCard, paymentIntent };
    } catch (error) {
      console.error('Error creating gift card:', error);
      throw error;
    }
  }

  static async getUserGiftCards(userId: string): Promise<GiftCard[]> {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          gift_card_transactions (
            id,
            amount,
            transaction_type,
            created_at
          )
        `)
        .or(`purchaser_id.eq.${userId},recipient_email.eq.${(await supabase.auth.getUser()).data.user?.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user gift cards:', error);
      throw error;
    }
  }

  static async checkGiftCardBalance(cardCode: string): Promise<GiftCardBalanceResponse> {
    try {
      const { data, error } = await supabase.rpc('check_gift_card_balance', {
        p_card_code: cardCode,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking gift card balance:', error);
      return { success: false, error: 'Failed to check balance' };
    }
  }

  static async redeemGiftCard(
    cardCode: string,
    amount: number,
    referenceId?: string,
    referenceType?: string,
    description?: string
  ): Promise<GiftCardRedemptionResponse> {
    try {
      const { data, error } = await supabase.rpc('redeem_gift_card', {
        p_gift_card_code: cardCode,
        p_amount: amount,
        p_reference_id: referenceId,
        p_reference_type: referenceType,
        p_description: description,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      return { success: false, error: 'Failed to redeem gift card' };
    }
  }

  static async getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select('*')
        .eq('gift_card_id', giftCardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching gift card transactions:', error);
      throw error;
    }
  }

  static async scheduleGiftCardDelivery(
    giftCardId: string,
    scheduledDate: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gift_cards')
        .update({
          delivery_scheduled_at: scheduledDate,
          delivery_status: 'pending',
        })
        .eq('id', giftCardId);

      if (error) throw error;

      // Schedule the delivery via edge function
      await supabase.functions.invoke('schedule-gift-card-delivery', {
        body: {
          giftCardId,
          scheduledDate,
        },
      });
    } catch (error) {
      console.error('Error scheduling gift card delivery:', error);
      throw error;
    }
  }

  // Voucher Operations
  static async createVoucher(voucherData: VoucherGenerationData): Promise<PromotionalVoucher> {
    try {
      const { data, error } = await supabase
        .from('promotional_vouchers')
        .insert({
          code: voucherData.name.toUpperCase().replace(/\s+/g, '_'),
          name: voucherData.name,
          description: voucherData.description,
          discount_type: voucherData.discount_type,
          discount_value: voucherData.discount_value,
          minimum_amount: voucherData.minimum_amount,
          maximum_discount: voucherData.maximum_discount,
          usage_limit: voucherData.usage_limit,
          user_usage_limit: voucherData.user_usage_limit || 1,
          valid_from: voucherData.valid_from,
          valid_until: voucherData.valid_until,
          applicable_services: voucherData.applicable_services || [],
          applicable_categories: voucherData.applicable_categories || [],
          first_time_customers: voucherData.first_time_customers || false,
          campaign_id: voucherData.campaign_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log creation analytics
      await supabase.from('voucher_analytics').insert({
        voucher_id: data.id,
        event_type: 'created',
        event_data: voucherData,
      });

      return data;
    } catch (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }
  }

  static async generateBulkVouchers(
    baseData: VoucherGenerationData,
    quantity: number
  ): Promise<PromotionalVoucher[]> {
    try {
      const vouchers: PromotionalVoucher[] = [];

      for (let i = 0; i < quantity; i++) {
        const suffix = String(i + 1).padStart(3, '0');
        const voucherData = {
          ...baseData,
          name: `${baseData.name}_${suffix}`,
        };

        const voucher = await this.createVoucher(voucherData);
        vouchers.push(voucher);
      }

      return vouchers;
    } catch (error) {
      console.error('Error generating bulk vouchers:', error);
      throw error;
    }
  }

  static async applyVoucher(
    code: string,
    userId: string | null,
    orderAmount: number,
    serviceIds: string[] = [],
    serviceCategories: string[] = []
  ): Promise<VoucherApplicationResponse> {
    try {
      const { data, error } = await supabase.rpc('apply_voucher', {
        p_code: code,
        p_user_id: userId,
        p_order_amount: orderAmount,
        p_service_ids: serviceIds,
        p_service_categories: serviceCategories,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error applying voucher:', error);
      return { success: false, error: 'Failed to apply voucher' };
    }
  }

  static async recordVoucherRedemption(
    voucherId: string,
    userId: string | null,
    bookingId: string,
    discountAmount: number,
    originalAmount: number,
    finalAmount: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('voucher_redemptions').insert({
        voucher_id: voucherId,
        user_id: userId,
        booking_id: bookingId,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount,
      });

      if (error) throw error;

      // Update voucher usage count
      await supabase.rpc('increment_voucher_usage', { p_voucher_id: voucherId });

      // Log redemption analytics
      await supabase.from('voucher_analytics').insert({
        voucher_id: voucherId,
        event_type: 'applied',
        event_data: {
          discount_amount: discountAmount,
          original_amount: originalAmount,
          final_amount: finalAmount,
          booking_id: bookingId,
        },
        user_id: userId,
      });
    } catch (error) {
      console.error('Error recording voucher redemption:', error);
      throw error;
    }
  }

  static async getActiveVouchers(): Promise<PromotionalVoucher[]> {
    try {
      const { data, error } = await supabase
        .from('promotional_vouchers')
        .select('*')
        .eq('is_active', true)
        .or('valid_from.is.null,valid_from.lte.now()')
        .or('valid_until.is.null,valid_until.gte.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active vouchers:', error);
      throw error;
    }
  }

  static async getVoucherByCode(code: string): Promise<PromotionalVoucher | null> {
    try {
      const { data, error } = await supabase
        .from('promotional_vouchers')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching voucher by code:', error);
      return null;
    }
  }

  // Analytics Operations
  static async getGiftCardStats(): Promise<GiftCardStats> {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          gift_card_transactions (
            amount,
            transaction_type
          )
        `);

      if (error) throw error;

      const giftCards = data || [];
      const totalCardsSold = giftCards.length;
      const totalRevenue = giftCards.reduce((sum, card) => sum + card.initial_balance, 0);
      const totalRedeemed = giftCards.reduce((sum, card) => {
        const redeemed = card.gift_card_transactions
          ?.filter(t => t.transaction_type === 'redemption')
          ?.reduce((s, t) => s + t.amount, 0) || 0;
        return sum + redeemed;
      }, 0);
      const totalActiveBalance = giftCards.reduce((sum, card) => sum + card.current_balance, 0);

      const cardsByStatus = giftCards.reduce((acc, card) => {
        const status = card.is_active ? 'active' : 'inactive';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_cards_sold: totalCardsSold,
        total_revenue: totalRevenue,
        total_redeemed: totalRedeemed,
        total_redeemed_value: totalRedeemed,
        total_active_balance: totalActiveBalance,
        cards_by_status: cardsByStatus,
        revenue_by_month: [], // Would need more complex query
        redemption_rate: totalCardsSold > 0 ? (totalRedeemed / totalRevenue) * 100 : 0,
        average_redemption_time: 0, // Would need more complex calculation
      };
    } catch (error) {
      console.error('Error fetching gift card stats:', error);
      throw error;
    }
  }

  static async getVoucherStats(): Promise<VoucherStats> {
    try {
      const { data: vouchers, error } = await supabase
        .from('promotional_vouchers')
        .select(`
          *,
          voucher_redemptions (
            discount_amount
          )
        `);

      if (error) throw error;

      const voucherList = vouchers || [];
      const totalVouchersCreated = voucherList.length;
      const totalVouchersUsed = voucherList.reduce((sum, voucher) =>
        sum + (voucher.voucher_redemptions?.length || 0), 0);
      const totalDiscountGiven = voucherList.reduce((sum, voucher) =>
        sum + voucher.voucher_redemptions?.reduce((s, r) => s + r.discount_amount, 0) || 0, 0);

      const vouchersByType = voucherList.reduce((acc, voucher) => {
        acc[voucher.discount_type] = (acc[voucher.discount_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_vouchers_created: totalVouchersCreated,
        total_vouchers_used: totalVouchersUsed,
        total_discount_given: totalDiscountGiven,
        usage_rate: totalVouchersCreated > 0 ? (totalVouchersUsed / totalVouchersCreated) * 100 : 0,
        vouchers_by_type: vouchersByType,
        conversion_rate: 0, // Would need more complex calculation
        average_discount_value: totalVouchersUsed > 0 ? totalDiscountGiven / totalVouchersUsed : 0,
      };
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      throw error;
    }
  }

  // Admin Operations
  static async getAllGiftCards(options: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ data: GiftCard[]; total: number }> {
    try {
      let query = supabase
        .from('gift_cards')
        .select('*', { count: 'exact' });

      if (options.status) {
        query = query.eq('is_active', options.status === 'active');
      }

      if (options.sortBy) {
        query = query.order(options.sortBy, { ascending: options.sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (options.page && options.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error fetching all gift cards:', error);
      throw error;
    }
  }

  static async updateGiftCardStatus(
    giftCardId: string,
    isActive: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gift_cards')
        .update({
          is_active: isActive,
        })
        .eq('id', giftCardId);

      if (error) throw error;

      // Log status change analytics
      await supabase.from('gift_card_analytics').insert({
        gift_card_id: giftCardId,
        event_type: isActive ? 'viewed' : 'expired',
        event_data: { reason },
      });
    } catch (error) {
      console.error('Error updating gift card status:', error);
      throw error;
    }
  }

  static async deactivateVoucher(voucherId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('promotional_vouchers')
        .update({
          is_active: false,
        })
        .eq('id', voucherId);

      if (error) throw error;

      // Log deactivation analytics
      await supabase.from('voucher_analytics').insert({
        voucher_id: voucherId,
        event_type: 'deactivated',
        event_data: { reason },
      });
    } catch (error) {
      console.error('Error deactivating voucher:', error);
      throw error;
    }
  }
}