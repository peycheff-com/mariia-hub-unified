// Payment System and Loyalty Program Types
// These types extend the main Database type from supabase

export interface GiftCard {
  id: string;
  code: string;
  type: 'gift_card' | 'voucher' | 'credit';
  status: 'active' | 'used' | 'expired' | 'void';
  initial_value: number;
  current_balance: number;
  currency: string;
  purchaser_id: string | null;
  recipient_id: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  valid_from: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  booking_id: string | null;
  transaction_type: 'issued' | 'used' | 'voided' | 'expired';
  amount: number;
  balance_before: number;
  balance_after: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentPlan {
  id: string;
  booking_id: string;
  total_amount: number;
  currency: string;
  number_of_installments: number;
  installment_amount: number;
  deposit_amount: number;
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PaymentInstallment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  service_id: string | null;
  cancellation_window_hours: number;
  fee_percentage: number;
  fee_type: 'percentage' | 'fixed' | 'deposit_forfeiture';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CancellationFee {
  id: string;
  booking_id: string;
  original_amount: number;
  fee_amount: number;
  fee_type: string;
  refund_amount: number;
  currency: string;
  cancellation_timestamp: string;
  policy_applied_id: string | null;
  stripe_refund_id: string | null;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string | null;
  points_per_currency: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTier {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  min_points: number;
  max_points: number | null;
  benefits: Record<string, any>;
  points_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerPoints {
  id: string;
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  tier_id: string | null;
  program_id: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  customer_points_id: string;
  booking_id: string | null;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  type: 'discount' | 'free_service' | 'upgrade' | 'voucher';
  points_cost: number;
  value: number | null;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null;
  applicable_service_types: string[] | null;
  is_active: boolean;
  stock_quantity: number | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  points_used: number;
  status: 'issued' | 'used' | 'expired' | 'cancelled';
  issued_at: string;
  used_at: string | null;
  expires_at: string;
  booking_id: string | null;
  redemption_code: string | null;
  metadata: Record<string, any>;
}

export interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  referrer_reward_points: number;
  referee_reward_points: number;
  referrer_discount_type: 'percentage' | 'fixed' | null;
  referrer_discount_value: number | null;
  referee_discount_type: 'percentage' | 'fixed' | null;
  referee_discount_value: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  program_id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  completed_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  referral_id: string;
  recipient_id: string;
  reward_type: 'points' | 'discount';
  reward_value: number;
  points_awarded: number | null;
  discount_code: string | null;
  status: 'pending' | 'issued' | 'used' | 'expired';
  issued_at: string;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

// ========================================
// SERVICE INTERFACES
// ========================================

export interface DepositCalculationParams {
  serviceId: string;
  serviceType: 'beauty' | 'fitness' | 'lifestyle';
  totalAmount: number;
  currency: string;
}

export interface DepositCalculationResult {
  depositAmount: number;
  depositPercentage: number | null;
  depositType: 'fixed' | 'percentage';
  currency: string;
}

export interface CancellationFeeCalculationParams {
  bookingId: string;
  cancellationTime: Date;
  bookingTime: Date;
  totalAmount: number;
  depositPaid: number;
  policyId?: string;
}

export interface CancellationFeeResult {
  feeAmount: number;
  refundAmount: number;
  feeType: string;
  reason: string;
}

export interface SplitPaymentPlanParams {
  bookingId: string;
  totalAmount: number;
  numberOfInstallments: number;
  depositAmount?: number;
  installmentSchedule: {
    dueDate: Date;
    amount: number;
  }[];
}

export interface GiftCardPurchaseParams {
  amount: number;
  currency: string;
  recipientEmail?: string;
  recipientId?: string;
  personalMessage?: string;
  purchaserId: string;
  validFrom?: Date;
  expiresAt?: Date;
}

export interface LoyaltyPointsParams {
  userId: string;
  bookingId?: string;
  points: number;
  type: 'earned' | 'redeemed';
  description?: string;
  expiresAt?: Date;
}

export interface ReferralCodeGenerationParams {
  referrerId: string;
  programId: string;
  customCode?: string;
  expiresIn?: number; // days
}

// ========================================
// HELPER TYPES
// ========================================

export interface PaymentSummary {
  totalAmount: number;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  paymentPlan?: PaymentPlan;
  giftCardsApplied?: {
    giftCardId: string;
    code: string;
    amountApplied: number;
  }[];
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
}

export interface CustomerLoyaltyStatus {
  customerId: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  benefits: Record<string, any>;
  pointsExpiring?: {
    amount: number;
    expiresAt: string;
  }[];
}

export interface ReferralStatus {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  rewards: ReferralReward[];
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ========================================
// FORM TYPES
// ========================================

export interface GiftCardForm {
  amount: number;
  recipientEmail: string;
  recipientName?: string;
  personalMessage?: string;
  sendImmediately: boolean;
  scheduledDate?: string;
}

export interface PaymentPlanForm {
  numberOfInstallments: number;
  depositAmount?: number;
  paymentMethod: string;
  agreeToTerms: boolean;
}

export interface ReferralForm {
  friendEmail: string;
  friendName?: string;
  personalMessage?: string;
}

// ========================================
// VALIDATION TYPES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface PaymentNotification {
  type: 'payment_due' | 'payment_successful' | 'payment_failed' | 'payment_plan_completed';
  userId: string;
  bookingId: string;
  amount?: number;
  dueDate?: string;
  paymentPlanId?: string;
  installmentNumber?: number;
}

export interface LoyaltyNotification {
  type: 'points_earned' | 'points_expiring' | 'tier_upgraded' | 'reward_available';
  userId: string;
  points?: number;
  tierName?: string;
  rewardId?: string;
  expiresAt?: string;
}

export interface ReferralNotification {
  type: 'referral_completed' | 'referral_rewarded' | 'referral_reminder';
  userId: string;
  referralId?: string;
  rewardValue?: number;
  referralCode?: string;
}