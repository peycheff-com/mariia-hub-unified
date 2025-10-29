export interface GiftCard {
  id: string;
  card_code: string;
  initial_balance: number;
  current_balance: number;
  currency: 'PLN' | 'EUR' | 'USD';
  purchaser_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  message?: string;
  purchase_date: string;
  expiry_date?: string;
  is_active: boolean;
  is_digital: boolean;
  qr_code_url?: string;
  pdf_url?: string;
  delivery_scheduled_at?: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  personalization_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  amount: number;
  transaction_type: 'purchase' | 'redemption' | 'refund' | 'adjustment';
  reference_id?: string;
  reference_type?: 'booking' | 'payment' | 'refund';
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PromotionalVoucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  applicable_services: string[];
  applicable_categories: string[];
  user_usage_limit: number;
  first_time_customers: boolean;
  auto_generate: boolean;
  campaign_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  user_id?: string;
  booking_id?: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  redemption_date: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export interface GiftCardAnalytics {
  id: string;
  gift_card_id: string;
  event_type: 'purchased' | 'viewed' | 'redeemed' | 'expired' | 'refunded';
  event_data: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface VoucherAnalytics {
  id: string;
  voucher_id: string;
  event_type: 'created' | 'viewed' | 'applied' | 'expired' | 'deactivated';
  event_data: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface GiftCardPurchaseData {
  amount: number;
  recipient_email: string;
  recipient_name: string;
  message?: string;
  delivery_date?: string;
  personalization: {
    design: 'birthday' | 'holiday' | 'general' | 'custom';
    theme_color?: string;
    logo_url?: string;
  };
  sender_name: string;
  sender_email: string;
}

export interface GiftCardDesign {
  id: string;
  name: string;
  preview_url: string;
  template_url: string;
  category: 'birthday' | 'holiday' | 'general' | 'custom';
  is_active: boolean;
}

export interface GiftCardBalanceResponse {
  success: boolean;
  error?: string;
  card_code?: string;
  current_balance?: number;
  initial_balance?: number;
  currency?: string;
  expiry_date?: string;
  recipient_name?: string;
  is_active?: boolean;
}

export interface GiftCardRedemptionResponse {
  success: boolean;
  error?: string;
  gift_card_id?: string;
  transaction_id?: string;
  original_balance?: number;
  redeemed_amount?: number;
  remaining_balance?: number;
}

export interface VoucherApplicationResponse {
  success: boolean;
  error?: string;
  voucher_id?: string;
  discount_amount?: number;
  original_amount?: number;
  final_amount?: number;
  discount_type?: string;
  discount_value?: number;
}

export interface VoucherGenerationData {
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit: number;
  user_usage_limit?: number;
  valid_from?: string;
  valid_until?: string;
  applicable_services?: string[];
  applicable_categories?: string[];
  first_time_customers?: boolean;
  campaign_id?: string;
  quantity?: number; // For bulk generation
}

export interface VoucherCampaign {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  budget?: number;
  target_audience?: string[];
  vouchers_created: number;
  vouchers_used: number;
  total_discount_given: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftCardStats {
  total_cards_sold: number;
  total_revenue: number;
  total_redeemed: number;
  total_redeemed_value: number;
  total_active_balance: number;
  cards_by_status: Record<string, number>;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  redemption_rate: number;
  average_redemption_time: number;
}

export interface VoucherStats {
  total_vouchers_created: number;
  total_vouchers_used: number;
  total_discount_given: number;
  usage_rate: number;
  vouchers_by_type: Record<string, number>;
  conversion_rate: number;
  average_discount_value: number;
  most_used_voucher?: PromotionalVoucher;
}