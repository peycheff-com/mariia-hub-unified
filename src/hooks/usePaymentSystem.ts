import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { paymentSystemService } from '@/services/paymentSystemService';
import { loyaltyProgramService } from '@/services/loyaltyProgramService';
import {
  DepositCalculationParams,
  DepositCalculationResult,
  CancellationFeeCalculationParams,
  CancellationFeeResult,
  SplitPaymentPlanParams,
  PaymentPlan,
  GiftCardPurchaseParams,
  GiftCard,
  PaymentSummary,
  LoyaltyPointsParams,
  CustomerLoyaltyStatus,
  Reward,
  RewardRedemption,
  ReferralCodeGenerationParams,
  ReferralStatus,
  ApiResponse
} from '@/types/payment-loyalty';

// ========================================
// DEPOSIT HOOKS
// ========================================

export function useDepositCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DepositCalculationParams) =>
      paymentSystemService.calculateDeposit(params),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
      }
    }
  });
}

// ========================================
// CANCELLATION FEE HOOKS
// ========================================

export function useCancellationFeeCalculation() {
  return useMutation({
    mutationFn: (params: CancellationFeeCalculationParams) =>
      paymentSystemService.calculateCancellationFee(params)
  });
}

// ========================================
// PAYMENT PLAN HOOKS
// ========================================

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SplitPaymentPlanParams) =>
      paymentSystemService.createPaymentPlan(params),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['payment-plan'] });
        queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
      }
    }
  });
}

export function usePaymentPlan(paymentPlanId?: string) {
  return useQuery({
    queryKey: ['payment-plan', paymentPlanId],
    queryFn: () => paymentPlanId
      ? paymentSystemService.getPaymentPlan(paymentPlanId)
      : Promise.resolve({ data: null, error: null, success: false }),
    enabled: !!paymentPlanId
  });
}

// ========================================
// GIFT CARD HOOKS
// ========================================

export function usePurchaseGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GiftCardPurchaseParams) =>
      paymentSystemService.purchaseGiftCard(params),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      }
    }
  });
}

export function useRedeemGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, amount, bookingId }: {
      code: string;
      amount: number;
      bookingId?: string;
    }) => paymentSystemService.redeemGiftCard(code, amount, bookingId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
        queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      }
    }
  });
}

// ========================================
// PAYMENT SUMMARY HOOKS
// ========================================

export function usePaymentSummary(bookingId?: string) {
  return useQuery({
    queryKey: ['payment-summary', bookingId],
    queryFn: () => bookingId
      ? paymentSystemService.getPaymentSummary(bookingId)
      : Promise.resolve({ data: null, error: null, success: false }),
    enabled: !!bookingId
  });
}

// ========================================
// LOYALTY POINTS HOOKS
// ========================================

export function useAwardPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: LoyaltyPointsParams) =>
      loyaltyProgramService.awardPoints(params),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['loyalty-status', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['customer-points', variables.userId] });
      }
    }
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, pointsToRedeem, rewardId, description }: {
      userId: string;
      pointsToRedeem: number;
      rewardId?: string;
      description?: string;
    }) => loyaltyProgramService.redeemPoints(userId, pointsToRedeem, rewardId, description),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['loyalty-status', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['customer-points', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['available-rewards', variables.userId] });
      }
    }
  });
}

export function useCustomerLoyaltyStatus(userId?: string) {
  return useQuery({
    queryKey: ['loyalty-status', userId],
    queryFn: () => userId
      ? loyaltyProgramService.getCustomerLoyaltyStatus(userId)
      : Promise.resolve({ data: null, error: null, success: false }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ========================================
// REWARDS HOOKS
// ========================================

export function useAvailableRewards(userId?: string, serviceType?: string) {
  return useQuery({
    queryKey: ['available-rewards', userId, serviceType],
    queryFn: () => userId
      ? loyaltyProgramService.getAvailableRewards(userId, serviceType)
      : Promise.resolve({ data: [], error: null, success: true }),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, rewardId }: {
      userId: string;
      rewardId: string;
    }) => loyaltyProgramService.redeemReward(userId, rewardId),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['loyalty-status', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['available-rewards', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['reward-redemptions', variables.userId] });
      }
    }
  });
}

export function useRewardRedemptions(userId?: string) {
  return useQuery({
    queryKey: ['reward-redemptions', userId],
    queryFn: async () => {
      if (!userId) return [];

      // This would need to be implemented in the service
      // For now, returning empty array
      return [];
    },
    enabled: !!userId
  });
}

// ========================================
// REFERRAL HOOKS
// ========================================

export function useGenerateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReferralCodeGenerationParams) =>
      loyaltyProgramService.generateReferralCode(params),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['referral-status', variables.referrerId] });
      }
    }
  });
}

export function useCompleteReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ referralCode, refereeId }: {
      referralCode: string;
      refereeId: string;
    }) => loyaltyProgramService.completeReferral(referralCode, refereeId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['referral-status'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty-status'] });
      }
    }
  });
}

export function useReferralStatus(userId?: string) {
  return useQuery({
    queryKey: ['referral-status', userId],
    queryFn: () => userId
      ? loyaltyProgramService.getReferralStatus(userId)
      : Promise.resolve({ data: null, error: null, success: false }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ========================================
// COMBINED HOOKS
// ========================================

export function usePaymentAndLoyalty(bookingId?: string, userId?: string) {
  const paymentSummary = usePaymentSummary(bookingId);
  const loyaltyStatus = useCustomerLoyaltyStatus(userId);
  const availableRewards = useAvailableRewards(userId);
  const referralStatus = useReferralStatus(userId);

  return {
    payment: paymentSummary,
    loyalty: loyaltyStatus,
    rewards: availableRewards,
    referrals: referralStatus,
    isLoading: paymentSummary.isLoading || loyaltyStatus.isLoading ||
               availableRewards.isLoading || referralStatus.isLoading,
    isError: paymentSummary.isError || loyaltyStatus.isError ||
              availableRewards.isError || referralStatus.isError
  };
}

// ========================================
// UTILITY HOOKS
// ========================================

export function usePaymentCalculation() {
  const [depositCalculation, setDepositCalculation] = useState<DepositCalculationResult | null>(null);
  const [cancellationFee, setCancellationFee] = useState<CancellationFeeResult | null>(null);

  const calculateDepositMutation = useDepositCalculation();
  const calculateCancellationFeeMutation = useCancellationFeeCalculation();

  const calculateDeposit = async (params: DepositCalculationParams) => {
    const result = await calculateDepositMutation.mutateAsync(params);
    if (result.success && result.data) {
      setDepositCalculation(result.data);
    }
    return result;
  };

  const calculateCancellationFee = async (params: CancellationFeeCalculationParams) => {
    const result = await calculateCancellationFeeMutation.mutateAsync(params);
    if (result.success && result.data) {
      setCancellationFee(result.data);
    }
    return result;
  };

  const resetCalculations = () => {
    setDepositCalculation(null);
    setCancellationFee(null);
  };

  return {
    depositCalculation,
    cancellationFee,
    calculateDeposit,
    calculateCancellationFee,
    resetCalculations,
    isCalculating: calculateDepositMutation.isPending || calculateCancellationFeeMutation.isPending
  };
}

// ========================================
// FORM HOOKS
// ========================================

export function useGiftCardForm() {
  const [formData, setFormData] = useState({
    amount: 100,
    recipientEmail: '',
    recipientName: '',
    personalMessage: '',
    sendImmediately: true,
    scheduledDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.amount < 50) {
      newErrors.amount = 'Minimum gift card amount is 50 PLN';
    }

    if (formData.amount > 10000) {
      newErrors.amount = 'Maximum gift card amount is 10,000 PLN';
    }

    if (!formData.recipientEmail) {
      newErrors.recipientEmail = 'Recipient email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    }

    if (!formData.sendImmediately && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required when not sending immediately';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      amount: 100,
      recipientEmail: '',
      recipientName: '',
      personalMessage: '',
      sendImmediately: true,
      scheduledDate: ''
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    validateForm,
    updateField,
    resetForm
  };
}

export function usePaymentPlanForm() {
  const [formData, setFormData] = useState({
    numberOfInstallments: 3,
    depositAmount: 0,
    paymentMethod: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (totalAmount: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.numberOfInstallments < 2 || formData.numberOfInstallments > 12) {
      newErrors.numberOfInstallments = 'Number of installments must be between 2 and 12';
    }

    const installmentAmount = (totalAmount - formData.depositAmount) / formData.numberOfInstallments;
    if (installmentAmount < 50) {
      newErrors.numberOfInstallments = 'Installment amount must be at least 50 PLN';
    }

    if (formData.depositAmount < 0 || formData.depositAmount > totalAmount * 0.5) {
      newErrors.depositAmount = 'Deposit must be between 0 and 50% of total amount';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the payment plan terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      numberOfInstallments: 3,
      depositAmount: 0,
      paymentMethod: '',
      agreeToTerms: false
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    validateForm,
    updateField,
    resetForm
  };
}