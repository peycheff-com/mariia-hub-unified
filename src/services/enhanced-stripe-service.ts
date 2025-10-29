/**
 * Enhanced Stripe Service
 *
 * Secure Stripe integration with:
 * - Server-side credential management
 * - Retry logic with exponential backoff
 * - Idempotency handling
 * - Webhook signature verification
 * - Rate limiting
 * - Circuit breaker pattern
 */

import { apiGateway, stripeApi } from './secure-api-gateway';
import { credentialManager } from '@/lib/secure-credentials';
import { paymentSecurityManager } from '@/lib/payment-security';
import { secureErrorHandler } from '@/lib/secure-error-handler';
import { SecurityMonitor } from '@/lib/security';
import { createClient } from '@supabase/supabase-js';

// Stripe types
export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  price?: StripePrice;
  metadata?: Record<string, any>;
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

class EnhancedStripeService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private webhookSecret: string | null = null;
  private apiVersion: string = '2023-10-16';
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000;
  private idempotencyKeys: Map<string, string> = new Map();

  /**
   * Initialize Stripe service
   */
  async initialize(): Promise<boolean> {
    try {
      // Load credentials from secure storage
      const credentials = await credentialManager.getCredentials('stripe');
      if (!credentials) {
        console.error('No Stripe credentials found');
        return false;
      }

      // Load webhook secret
      await this.loadWebhookSecret();

      // Validate Stripe connectivity
      const isValid = await this.validateConnectivity();
      if (!isValid) {
        console.error('Stripe connectivity validation failed');
        return false;
      }

      console.log('Stripe service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Stripe service:', error);
      return false;
    }
  }

  /**
   * Load webhook secret from secure storage
   */
  private async loadWebhookSecret(): Promise<void> {
    const { data } = await this.supabase
      .from('integration_secrets')
      .select('encrypted_value')
      .eq('service', 'stripe')
      .eq('key', 'webhook_secret')
      .single();

    if (data) {
      this.webhookSecret = data.encrypted_value;
    }
  }

  /**
   * Validate Stripe connectivity
   */
  private async validateConnectivity(): Promise<boolean> {
    try {
      const response = await apiGateway.request('stripe', '/account', {
        method: 'GET',
        bypassCircuitBreaker: true
      });
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Create a payment intent with enhanced security validation
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customer?: string;
    metadata?: Record<string, any>;
    payment_method_types?: string[];
    capture_method?: 'automatic' | 'manual';
    confirm?: boolean;
    idempotencyKey?: string;
    sessionId?: string;
    userId?: string;
  }): Promise<StripePaymentIntent> {
    const context = {
      requestId: params.idempotencyKey || this.generateIdempotencyKey('payment_intent'),
      timestamp: Date.now()
    };

    try {
      // Enhanced security validation
      const securityValidation = paymentSecurityManager.createSecurePaymentIntent({
        amount: params.amount,
        currency: params.currency,
        customerId: params.customer,
        metadata: params.metadata,
        sessionId: params.sessionId
      });

      if (!securityValidation.isAllowed) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'high',
          details: {
            activity: 'payment_intent_blocked',
            reason: securityValidation.reason,
            amount: params.amount,
            currency: params.currency,
            customerId: params.customer
          }
        });

        throw new Error(`Payment security validation failed: ${securityValidation.reason}`);
      }

      const idempotencyKey = params.idempotencyKey || this.generateIdempotencyKey('payment_intent');

      const response = await stripeApi.createPaymentIntent({
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        metadata: securityValidation.enhancedMetadata,
        payment_method_types: params.payment_method_types || ['card', 'blik'],
        capture_method: params.capture_method || 'automatic',
        confirm: params.confirm || false,
        idempotency_key: idempotencyKey
      });

      if (!response.success) {
        const error = secureErrorHandler.handleSecureError(
          new Error(response.error),
          context,
          new Error(`Stripe API error: ${response.error}`)
        );

        throw new Error(error.message);
      }

      // Verify payment completion security
      const completionVerification = paymentSecurityManager.verifyPaymentCompletion(
        response.data,
        params.sessionId
      );

      if (!completionVerification.isValid) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          details: {
            activity: 'payment_completion_anomaly',
            paymentIntentId: response.data.id,
            anomalies: completionVerification.anomalies,
            securityScore: completionVerification.securityScore
          }
        });
      }

      // Store payment intent in our database
      await this.storePaymentIntent(response.data);

      return response.data;
    } catch (error) {
      const secureError = secureErrorHandler.handleSecureError(error, context);
      throw new Error(secureError.message);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<StripePaymentIntent> {
    const response = await stripeApi.confirmPayment(paymentIntentId);

    if (!response.success) {
      throw new Error(`Failed to confirm payment: ${response.error}`);
    }

    // Update status in database
    await this.updatePaymentIntentStatus(paymentIntentId, response.data.status);

    return response.data;
  }

  /**
   * Create or retrieve a customer
   */
  async createOrRetrieveCustomer(customerData: {
    email: string;
    name: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<StripeCustomer> {
    // First try to find existing customer by email
    const existingCustomer = await this.findCustomerByEmail(customerData.email);
    if (existingCustomer) {
      // Update existing customer if needed
      return await this.updateCustomer(existingCustomer.id, customerData);
    }

    // Create new customer
    const response = await apiGateway.request('stripe', '/customers', {
      method: 'POST',
      body: {
        ...customerData,
        metadata: {
          ...customerData.metadata,
          source: 'mariia-hub',
          created_at: new Date().toISOString()
        }
      }
    });

    if (!response.success) {
      throw new Error(`Failed to create customer: ${response.error}`);
    }

    // Store customer in our database
    await this.storeCustomer(response.data);

    return response.data;
  }

  /**
   * Find customer by email
   */
  private async findCustomerByEmail(email: string): Promise<StripeCustomer | null> {
    const response = await apiGateway.request('stripe', '/customers', {
      params: { email, limit: 1 }
    });

    if (response.success && response.data?.data?.length > 0) {
      return response.data.data[0];
    }

    return null;
  }

  /**
   * Update customer
   */
  private async updateCustomer(
    customerId: string,
    customerData: Partial<StripeCustomer>
  ): Promise<StripeCustomer> {
    const response = await apiGateway.request('stripe', `/customers/${customerId}`, {
      method: 'POST',
      body: customerData
    });

    if (!response.success) {
      throw new Error(`Failed to update customer: ${response.error}`);
    }

    // Update in our database
    await this.updateCustomerInDatabase(customerId, customerData);

    return response.data;
  }

  /**
   * Create a refund with retry logic
   */
  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await apiGateway.request('stripe', '/refunds', {
      method: 'POST',
      body: {
        ...params,
        metadata: {
          ...params.metadata,
          source: 'mariia-hub',
          refunded_at: new Date().toISOString()
        }
      }
    });

    if (!response.success) {
      throw new Error(`Failed to create refund: ${response.error}`);
    }

    // Store refund in database
    await this.storeRefund(response.data);

    return response.data;
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(paymentMethodData: {
    type: string;
    card?: any;
    blik?: {
      code: string;
    };
    billing_details?: {
      name: string;
      email: string;
      phone: string;
      address: any;
    };
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await apiGateway.request('stripe', '/payment_methods', {
      method: 'POST',
      body: paymentMethodData
    });

    if (!response.success) {
      throw new Error(`Failed to create payment method: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<any> {
    const response = await apiGateway.request(
      'stripe',
      `/payment_methods/${paymentMethodId}/attach`,
      {
        method: 'POST',
        body: { customer: customerId }
      }
    );

    if (!response.success) {
      throw new Error(`Failed to attach payment method: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Handle webhook events with enhanced security validation
   */
  async handleWebhook(
    payload: string,
    signature: string,
    ipAddress?: string
  ): Promise<{ processed: boolean; error?: string }> {
    const context = {
      requestId: `webhook_${Date.now()}`,
      ipAddress: ipAddress || 'unknown',
      timestamp: Date.now()
    };

    try {
      // Enhanced webhook signature verification
      const signatureVerification = paymentSecurityManager.verifyWebhookSignature(payload, signature);

      if (!signatureVerification.isValid) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'high',
          details: {
            activity: 'invalid_webhook_signature',
            error: signatureVerification.error,
            ipAddress,
            timestamp: context.timestamp
          }
        });

        return {
          processed: false,
          error: signatureVerification.error || 'Webhook signature verification failed'
        };
      }

    const webhookEvent: StripeWebhookEvent = JSON.parse(payload);

    try {
      switch (webhookEvent.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(webhookEvent.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(webhookEvent.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(webhookEvent.data.object);
          break;
        case 'customer.created':
        case 'customer.updated':
          await this.handleCustomerUpdate(webhookEvent.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(webhookEvent.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(webhookEvent.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${webhookEvent.type}`);
      }

      // Log webhook
      await this.logWebhook(webhookEvent, true);

      return { processed: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      await this.logWebhook(webhookEvent, false, error instanceof Error ? error.message : 'Unknown error');
      return { processed: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    await this.updatePaymentIntentStatus(paymentIntent.id, 'succeeded');

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await this.supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          paid: true,
          updated_at: new Date()
        })
        .eq('id', paymentIntent.metadata.booking_id);
    }

    // Send confirmation email
    // This would trigger an email workflow
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    await this.updatePaymentIntentStatus(paymentIntent.id, 'requires_payment_method');

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await this.supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          updated_at: new Date()
        })
        .eq('id', paymentIntent.metadata.booking_id);
    }

    // Send payment failure notification
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: any): Promise<void> {
    await this.updatePaymentIntentStatus(paymentIntent.id, 'canceled');

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await this.supabase
        .from('bookings')
        .update({
          status: 'canceled',
          updated_at: new Date()
        })
        .eq('id', paymentIntent.metadata.booking_id);
    }
  }

  /**
   * Handle customer update
   */
  private async handleCustomerUpdate(customer: any): Promise<void> {
    await this.updateCustomerInDatabase(customer.id, customer);
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    // Handle subscription payments
    console.log('Invoice payment succeeded:', invoice.id);
  }

  /**
   * Handle dispute
   */
  private async handleDisputeCreated(dispute: any): Promise<void> {
    // Alert admin about dispute
    console.error('Payment dispute created:', dispute.id);

    await this.supabase
      .from('payment_disputes')
      .insert({
        stripe_dispute_id: dispute.id,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidence_due_by: new Date(dispute.evidence_details.due_by * 1000),
        created_at: new Date()
      });
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(operation: string): string {
    const key = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.idempotencyKeys.set(operation, key);
    return key;
  }

  /**
   * Store payment intent in database
   */
  private async storePaymentIntent(paymentIntent: StripePaymentIntent): Promise<void> {
    await this.supabase
      .from('payment_intents')
      .upsert({
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
        created_at: new Date()
      });
  }

  /**
   * Update payment intent status
   */
  private async updatePaymentIntentStatus(
    paymentIntentId: string,
    status: string
  ): Promise<void> {
    await this.supabase
      .from('payment_intents')
      .update({
        status,
        updated_at: new Date()
      })
      .eq('id', paymentIntentId);
  }

  /**
   * Store customer in database
   */
  private async storeCustomer(customer: StripeCustomer): Promise<void> {
    await this.supabase
      .from('stripe_customers')
      .upsert({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created_at: new Date()
      });
  }

  /**
   * Update customer in database
   */
  private async updateCustomerInDatabase(
    customerId: string,
    customerData: Partial<StripeCustomer>
  ): Promise<void> {
    await this.supabase
      .from('stripe_customers')
      .update({
        ...customerData,
        updated_at: new Date()
      })
      .eq('id', customerId);
  }

  /**
   * Store refund in database
   */
  private async storeRefund(refund: any): Promise<void> {
    await this.supabase
      .from('payment_refunds')
      .insert({
        id: refund.id,
        payment_intent: refund.payment_intent,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        metadata: refund.metadata,
        created_at: new Date()
      });
  }

  /**
   * Log webhook event
   */
  private async logWebhook(
    event: StripeWebhookEvent,
    processed: boolean,
    error?: string
  ): Promise<void> {
    await this.supabase
      .from('webhook_logs')
      .insert({
        source: 'stripe',
        event_id: event.id,
        event_type: event.type,
        processed,
        error,
        raw_data: event,
        created_at: new Date()
      });
  }

  /**
   * Get payment metrics
   */
  async getPaymentMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalAmount: number;
    successRate: number;
    averageAmount: number;
    paymentCount: number;
    refundCount: number;
    disputeCount: number;
  }> {
    const query = this.supabase
      .from('payment_intents')
      .select('*')
      .eq('status', 'succeeded');

    if (startDate) {
      query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query.lte('created_at', endDate.toISOString());
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const paymentCount = payments?.length || 0;
    const averageAmount = paymentCount > 0 ? totalAmount / paymentCount : 0;

    // Get failed payments for success rate
    const { count: totalCount } = await this.supabase
      .from('payment_intents')
      .select('*', { count: 'exact', head: true });

    const successRate = totalCount > 0 ? (paymentCount / totalCount) * 100 : 0;

    // Get refunds count
    const { count: refundCount } = await this.supabase
      .from('payment_refunds')
      .select('*', { count: 'exact', head: true });

    // Get disputes count
    const { count: disputeCount } = await this.supabase
      .from('payment_disputes')
      .select('*', { count: 'exact', head: true });

    return {
      totalAmount,
      successRate,
      averageAmount,
      paymentCount,
      refundCount: refundCount || 0,
      disputeCount: disputeCount || 0
    };
  }
}

// Export singleton instance
export const enhancedStripeService = new EnhancedStripeService();

// Initialize the service
enhancedStripeService.initialize().catch(console.error);