/**
 * Comprehensive Payment Service Factory
 *
 * This module provides a unified interface for multiple payment providers
 * optimized for the Polish market while supporting international clients.
 */

import { enhancedStripeService } from './enhanced-stripe-service';
import { PolishPaymentGateway } from './polish-payment-gateway';
import { CurrencyConversionService } from './currency-conversion-service';
import { InvoiceService } from './invoice-service';
import { SubscriptionService } from './subscription-service';
import { RefundService } from './refund-service';
import { ComplianceService } from './compliance-service';
import { PaymentAnalytics } from './payment-analytics';
import { createClient } from '@supabase/supabase-js';

// Core Types
export interface PaymentProvider {
  name: string;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult>;
  confirmPayment(paymentIntentId: string, params?: ConfirmPaymentParams): Promise<PaymentResult>;
  refundPayment(paymentIntentId: string, params?: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>;
  handleWebhook(payload: string, signature: string): Promise<WebhookResult>;
}

export interface PaymentMethod {
  id: string;
  name: string;
  displayName: string;
  type: 'card' | 'bank_transfer' | 'mobile' | 'wallet' | 'installments';
  provider: string;
  icon: string;
  description: string;
  fees: PaymentFees;
  limits: PaymentLimits;
  availableCountries: string[];
  verificationRequired: boolean;
  processingTime: ProcessingTime;
  metadata: Record<string, any>;
}

export interface PaymentFees {
  type: 'percentage' | 'fixed' | 'mixed';
  percentage?: number;
  fixed?: number;
  currency: string;
  description: string;
}

export interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface ProcessingTime {
  type: 'instant' | 'minutes' | 'hours' | 'days';
  value: number;
  description: string;
}

export interface PaymentIntentParams {
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId?: string;
  bookingId?: string;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  confirmationMethod?: 'automatic' | 'manual';
  captureMethod?: 'automatic' | 'manual';
  setupFutureUsage?: 'off_session' | 'on_session';
  requiresAction?: boolean;
}

export interface ConfirmPaymentParams {
  paymentMethodId?: string;
  returnUrl?: string;
  savePaymentMethod?: boolean;
  clientSecret?: string;
  mandateData?: any;
}

export interface RefundParams {
  amount?: number;
  reason?: RefundReason;
  metadata?: Record<string, any>;
  notifyCustomer?: boolean;
}

export type RefundReason =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'service_unavailable'
  | 'booking_cancelled'
  | 'partial_service';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status: PaymentStatus;
  requiresAction?: boolean;
  nextAction?: PaymentAction;
  error?: PaymentError;
  provider: string;
  fees?: PaymentFeesApplied;
  estimatedProcessingTime?: ProcessingTime;
  metadata?: Record<string, any>;
}

export interface PaymentFeesApplied {
  providerFee: number;
  paymentMethodFee: number;
  currencyConversionFee?: number;
  totalFee: number;
  currency: string;
  breakdown: {
    type: string;
    amount: number;
    description: string;
  }[];
}

export interface PaymentAction {
  type: 'redirect_to_url' | 'use_stripe_sdk' | 'verify_with_microdeposits' | 'authorize_3ds';
  url?: string;
  sdkData?: any;
  description: string;
  expiresIn?: number;
}

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'requires_action' | 'requires_confirmation';
  paid: boolean;
  amount: number;
  currency: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount?: number;
  currency?: string;
  reason?: string;
  error?: PaymentError;
  processingTime?: ProcessingTime;
  metadata?: Record<string, any>;
}

export interface WebhookResult {
  processed: boolean;
  eventType: string;
  eventId: string;
  error?: string;
  processedAt: string;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'validation' | 'processing' | 'provider' | 'fraud' | 'compliance';
  details?: Record<string, any>;
  retryPossible: boolean;
  suggestedAction?: string;
}

export interface PaymentAnalytics {
  totalVolume: number;
  transactionCount: number;
  successRate: number;
  averageTransactionValue: number;
  paymentMethodDistribution: Record<string, number>;
  currencyDistribution: Record<string, number>;
  topCurrencies: string[];
  providerPerformance: Record<string, {
    volume: number;
    transactions: number;
    successRate: number;
    averageProcessingTime: number;
  }>;
}

export interface CustomerPaymentProfile {
  customerId: string;
  providerCustomerId?: string;
  email: string;
  name: string;
  phone?: string;
  preferredPaymentMethod?: string;
  savedPaymentMethods: SavedPaymentMethod[];
  paymentHistory: PaymentSummary[];
  defaultCurrency: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'restricted';
  riskLevel: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
  lastUsed?: string;
  verificationStatus?: 'verified' | 'unverified';
}

export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  provider: string;
  createdAt: string;
  processedAt?: string;
  fees?: number;
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  currency: string;
  remainingDaily: number;
  remainingWeekly: number;
  remainingMonthly: number;
}

export interface PaymentOptions {
  amount: number;
  currency: string;
  customerCountry: string;
  availableMethods: PaymentMethod[];
  recommendedMethods: PaymentMethod[];
  currencyConversionAvailable: boolean;
  installmentPlansAvailable: boolean;
  estimatedFees: PaymentFeesApplied[];
  processingTimes: ProcessingTime[];
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
  provider: string;
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
}

export interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  seller: SellerData;
  buyer: BuyerData;
  items: InvoiceItem[];
  paymentMethod: string;
  paymentStatus: string;
  metadata: Record<string, any>;
}

export interface SellerData {
  name: string;
  address: string;
  nip: string; // Polish VAT number
  bankAccount?: string;
  email?: string;
  phone?: string;
}

export interface BuyerData {
  name: string;
  address: string;
  email?: string;
  phone?: string;
  nip?: string;
}

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
}

export interface ComplianceCheck {
  isValid: boolean;
  riskScore: number;
  checks: {
    aml: boolean;
    kyc: boolean;
    sanctions: boolean;
    transactionLimits: boolean;
    documentation: boolean;
  };
  requiredActions?: string[];
  blockedReason?: string;
  validUntil?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  features: string[];
  metadata: Record<string, any>;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
  metadata: Record<string, any>;
}

export class PaymentServiceFactory {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private providers: Map<string, PaymentProvider> = new Map();
  private currencyService: CurrencyConversionService;
  private invoiceService: InvoiceService;
  private subscriptionService: SubscriptionService;
  private refundService: RefundService;
  private complianceService: ComplianceService;
  private analytics: PaymentAnalytics;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    // Initialize services
    this.currencyService = new CurrencyConversionService();
    this.invoiceService = new InvoiceService();
    this.subscriptionService = new SubscriptionService();
    this.refundService = new RefundService();
    this.complianceService = new ComplianceService();
    this.analytics = new PaymentAnalytics();

    // Initialize providers
    await this.initializeProviders();
  }

  private async initializeProviders() {
    // Initialize Stripe
    await enhancedStripeService.initialize();
    this.providers.set('stripe', enhancedStripeService);

    // Initialize Polish payment gateways
    const polishGateway = new PolishPaymentGateway();
    await polishGateway.initialize();
    this.providers.set('polish', polishGateway);
  }

  /**
   * Get available payment methods based on context
   */
  async getAvailablePaymentMethods(params: {
    amount: number;
    currency: string;
    customerCountry: string;
    customerLanguage: string;
    businessType?: string;
  }): Promise<PaymentMethod[]> {
    const allMethods: PaymentMethod[] = [];

    for (const provider of this.providers.values()) {
      const providerMethods = provider.supportedMethods.filter(method =>
        method.availableCountries.includes(params.customerCountry) &&
        provider.supportedCurrencies.includes(params.currency)
      );
      allMethods.push(...providerMethods);
    }

    // Sort by relevance (Polish methods first for Polish customers)
    return allMethods.sort((a, b) => {
      if (params.customerCountry === 'PL') {
        // Prioritize Polish payment methods
        const polishMethods = ['blik', 'payu', 'przelewy24'];
        const aIsPolish = polishMethods.includes(a.id);
        const bIsPolish = polishMethods.includes(b.id);

        if (aIsPolish && !bIsPolish) return -1;
        if (!aIsPolish && bIsPolish) return 1;
      }
      return 0;
    });
  }

  /**
   * Create payment intent with automatic provider selection
   */
  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    try {
      // Perform compliance checks
      const complianceCheck = await this.complianceService.checkTransaction({
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        paymentMethodId: params.paymentMethodId,
        metadata: params.metadata
      });

      if (!complianceCheck.isValid) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'COMPLIANCE_FAILED',
            message: complianceCheck.blockedReason || 'Transaction blocked due to compliance checks',
            type: 'compliance',
            retryPossible: false,
            suggestedAction: complianceCheck.requiredActions?.join(', ')
          },
          provider: 'system'
        };
      }

      // Get payment method details
      const paymentMethod = await this.getPaymentMethod(params.paymentMethodId);
      if (!paymentMethod) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'INVALID_PAYMENT_METHOD',
            message: 'Payment method not found or unavailable',
            type: 'validation',
            retryPossible: false
          },
          provider: 'system'
        };
      }

      // Get provider
      const provider = this.providers.get(paymentMethod.provider);
      if (!provider) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `Payment provider ${paymentMethod.provider} is not available`,
            type: 'provider',
            retryPossible: true
          },
          provider: 'system'
        };
      }

      // Calculate fees
      const fees = await this.calculateFees({
        amount: params.amount,
        currency: params.currency,
        paymentMethod: paymentMethod,
        provider: paymentMethod.provider
      });

      // Add fee metadata
      params.metadata = {
        ...params.metadata,
        fees: JSON.stringify(fees),
        complianceRiskScore: complianceCheck.riskScore.toString(),
        paymentMethodType: paymentMethod.type
      };

      // Create payment intent with provider
      const result = await provider.createPaymentIntent({
        ...params,
        amount: params.amount + fees.totalFee // Include fees in total
      });

      // Store payment attempt
      await this.storePaymentAttempt({
        paymentIntentId: result.paymentIntentId,
        provider: paymentMethod.provider,
        amount: params.amount,
        currency: params.currency,
        fees: fees.totalFee,
        status: result.status.status,
        customerId: params.customerId,
        bookingId: params.bookingId,
        metadata: params.metadata
      });

      return result;

    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        error: {
          code: 'PAYMENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        },
        provider: 'system'
      };
    }
  }

  /**
   * Confirm payment with provider
   */
  async confirmPayment(
    paymentIntentId: string,
    params: ConfirmPaymentParams = {}
  ): Promise<PaymentResult> {
    try {
      // Get payment details from database
      const paymentDetails = await this.getPaymentDetails(paymentIntentId);
      if (!paymentDetails) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
            type: 'validation',
            retryPossible: false
          },
          provider: 'system'
        };
      }

      // Get provider
      const provider = this.providers.get(paymentDetails.provider);
      if (!provider) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: paymentDetails.amount, currency: paymentDetails.currency, createdAt: paymentDetails.createdAt },
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `Payment provider ${paymentDetails.provider} is not available`,
            type: 'provider',
            retryPossible: true
          },
          provider: 'system'
        };
      }

      // Confirm with provider
      const result = await provider.confirmPayment(paymentIntentId, params);

      // Update payment status in database
      await this.updatePaymentStatus(paymentIntentId, result.status.status);

      // If payment successful, trigger post-payment actions
      if (result.success && result.status.status === 'succeeded') {
        await this.handleSuccessfulPayment(paymentIntentId, paymentDetails);
      }

      return result;

    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
        error: {
          code: 'PAYMENT_CONFIRMATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        },
        provider: 'system'
      };
    }
  }

  /**
   * Process refund with automatic provider routing
   */
  async processRefund(
    paymentIntentId: string,
    params: RefundParams = {}
  ): Promise<RefundResult> {
    try {
      // Get payment details
      const paymentDetails = await this.getPaymentDetails(paymentIntentId);
      if (!paymentDetails) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
            type: 'validation',
            retryPossible: false
          }
        };
      }

      // Check compliance for refund
      const complianceCheck = await this.complianceService.checkRefund({
        paymentIntentId,
        amount: params.amount,
        reason: params.reason,
        requesterId: params.metadata?.requesterId
      });

      if (!complianceCheck.isValid) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'REFUND_COMPLIANCE_FAILED',
            message: complianceCheck.blockedReason || 'Refund blocked due to compliance checks',
            type: 'compliance',
            retryPossible: false
          }
        };
      }

      // Get provider and process refund
      const provider = this.providers.get(paymentDetails.provider);
      if (!provider) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `Payment provider ${paymentDetails.provider} is not available`,
            type: 'provider',
            retryPossible: true
          }
        };
      }

      const refundResult = await provider.refundPayment(paymentIntentId, params);

      // Store refund record
      if (refundResult.success) {
        await this.storeRefundRecord({
          refundId: refundResult.refundId,
          paymentIntentId,
          amount: refundResult.amount,
          reason: params.reason,
          metadata: params.metadata
        });
      }

      return refundResult;

    } catch (error) {
      console.error('Refund processing failed:', error);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'REFUND_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        }
      };
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate?: Date, endDate?: Date): Promise<PaymentAnalytics> {
    return this.analytics.getAnalytics(startDate, endDate);
  }

  /**
   * Handle webhook from any provider
   */
  async handleWebhook(
    providerName: string,
    payload: string,
    signature: string,
    ipAddress?: string
  ): Promise<WebhookResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return {
        processed: false,
        eventType: 'unknown',
        eventId: 'unknown',
        error: `Provider ${providerName} not found`,
        processedAt: new Date().toISOString()
      };
    }

    try {
      const result = await provider.handleWebhook(payload, signature);

      // Log webhook
      await this.logWebhook(providerName, payload, result);

      return result;
    } catch (error) {
      return {
        processed: false,
        eventType: 'unknown',
        eventId: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown webhook processing error',
        processedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get customer payment profile
   */
  async getCustomerPaymentProfile(customerId: string): Promise<CustomerPaymentProfile | null> {
    const { data, error } = await this.supabase
      .from('customer_payment_profiles')
      .select(`
        *,
        saved_payment_methods(*),
        payment_history(*)
      `)
      .eq('customer_id', customerId)
      .single();

    if (error || !data) return null;

    return data as CustomerPaymentProfile;
  }

  /**
   * Get currency conversion rates
   */
  async getExchangeRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate[]> {
    return this.currencyService.getExchangeRates(fromCurrency, toCurrency);
  }

  /**
   * Convert currency
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number; fees: number }> {
    return this.currencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }

  /**
   * Get transaction limits for customer
   */
  async getTransactionLimits(customerId: string): Promise<TransactionLimits> {
    return this.complianceService.getTransactionLimits(customerId);
  }

  /**
   * Get payment options for UI
   */
  async getPaymentOptions(params: {
    amount: number;
    currency: string;
    customerCountry: string;
    customerLanguage: string;
  }): Promise<PaymentOptions> {
    const availableMethods = await this.getAvailablePaymentMethods(params);

    // Calculate estimated fees for each method
    const methodsWithFees = await Promise.all(
      availableMethods.map(async method => {
        const fees = await this.calculateFees({
          amount: params.amount,
          currency: params.currency,
          paymentMethod: method,
          provider: method.provider
        });
        return { method, fees };
      })
    );

    const estimatedFees = methodsWithFees.map(({ fees }) => fees);
    const processingTimes = availableMethods.map(method => method.processingTime);

    // Determine recommended methods based on customer preferences
    const recommendedMethods = availableMethods.filter(method => {
      if (params.customerCountry === 'PL') {
        return ['blik', 'payu', 'przelewy24'].includes(method.id);
      }
      return method.type === 'card' || method.type === 'wallet';
    });

    return {
      amount: params.amount,
      currency: params.currency,
      customerCountry: params.customerCountry,
      availableMethods: availableMethods,
      recommendedMethods,
      currencyConversionAvailable: this.currencyService.isConversionAvailable(params.currency),
      installmentPlansAvailable: params.amount >= 100, // Available for amounts over 100 PLN
      estimatedFees,
      processingTimes
    };
  }

  // Private helper methods
  private async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod | null> {
    const { data } = await this.supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single();

    return data as PaymentMethod | null;
  }

  private async calculateFees(params: {
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    provider: string;
  }): Promise<PaymentFeesApplied> {
    const { amount, paymentMethod } = params;

    let providerFee = 0;
    let paymentMethodFee = 0;
    const breakdown: { type: string; amount: number; description: string; }[] = [];

    // Calculate provider fee
    if (paymentMethod.fees.type === 'percentage') {
      providerFee = (amount * (paymentMethod.fees.percentage || 0)) / 100;
    } else if (paymentMethod.fees.type === 'fixed') {
      providerFee = paymentMethod.fees.fixed || 0;
    } else if (paymentMethod.fees.type === 'mixed') {
      providerFee = ((amount * (paymentMethod.fees.percentage || 0)) / 100) + (paymentMethod.fees.fixed || 0);
    }

    breakdown.push({
      type: 'provider_fee',
      amount: providerFee,
      description: `${paymentMethod.fees.description}`
    });

    // Add payment method specific fees
    if (paymentMethod.id === 'blik') {
      paymentMethodFee = 0; // BLIK is usually free for customers
    } else if (paymentMethod.id === 'payu' || paymentMethod.id === 'przelewy24') {
      paymentMethodFee = amount * 0.01; // 1% fee
      breakdown.push({
        type: 'payment_method_fee',
        amount: paymentMethodFee,
        description: 'Płatności online opłata'
      });
    }

    const totalFee = providerFee + paymentMethodFee;

    return {
      providerFee,
      paymentMethodFee,
      totalFee,
      currency: params.currency,
      breakdown
    };
  }

  private async storePaymentAttempt(params: {
    paymentIntentId?: string;
    provider: string;
    amount: number;
    currency: string;
    fees: number;
    status: string;
    customerId?: string;
    bookingId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.supabase
      .from('payment_attempts')
      .insert({
        payment_intent_id: params.paymentIntentId,
        provider: params.provider,
        amount: params.amount,
        currency: params.currency,
        fees: params.fees,
        status: params.status,
        customer_id: params.customerId,
        booking_id: params.bookingId,
        metadata: params.metadata,
        created_at: new Date()
      });
  }

  private async getPaymentDetails(paymentIntentId: string): Promise<{
    provider: string;
    amount: number;
    currency: string;
    createdAt: string;
    customerId?: string;
    bookingId?: string;
  } | null> {
    const { data } = await this.supabase
      .from('payment_attempts')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    return data;
  }

  private async updatePaymentStatus(paymentIntentId: string, status: string): Promise<void> {
    await this.supabase
      .from('payment_attempts')
      .update({
        status,
        updated_at: new Date()
      })
      .eq('payment_intent_id', paymentIntentId);
  }

  private async handleSuccessfulPayment(
    paymentIntentId: string,
    paymentDetails: any
  ): Promise<void> {
    // Generate invoice
    if (paymentDetails.bookingId) {
      await this.invoiceService.generateInvoice(paymentDetails.bookingId, paymentIntentId);
    }

    // Update analytics
    await this.analytics.recordSuccessfulPayment({
      paymentIntentId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      provider: paymentDetails.provider,
      customerId: paymentDetails.customerId
    });
  }

  private async storeRefundRecord(params: {
    refundId?: string;
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.supabase
      .from('payment_refunds')
      .insert({
        refund_id: params.refundId,
        payment_intent_id: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason,
        metadata: params.metadata,
        created_at: new Date()
      });
  }

  private async logWebhook(
    provider: string,
    payload: string,
    result: WebhookResult
  ): Promise<void> {
    await this.supabase
      .from('webhook_logs')
      .insert({
        provider,
        payload,
        event_type: result.eventType,
        event_id: result.eventId,
        processed: result.processed,
        error: result.error,
        created_at: new Date()
      });
  }
}

// Export singleton instance
export const paymentServiceFactory = new PaymentServiceFactory();