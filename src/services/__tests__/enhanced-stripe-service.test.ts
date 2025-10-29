/**
 * Comprehensive Test Suite for Enhanced Stripe Service
 *
 * Tests cover critical payment processing logic including:
 * - Payment intent creation and confirmation
 * - Customer management
 * - Refund processing
 * - Webhook handling with security validation
 * - Error handling and edge cases
 * - Payment metrics and reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { enhancedStripeService, EnhancedStripeService , StripePaymentIntent, StripeCustomer } from '../enhanced-stripe-service';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        lt: vi.fn(),
      })),
    })),
  })),
}));

vi.mock('@/lib/secure-credentials', () => ({
  credentialManager: {
    getCredentials: vi.fn(),
  },
}));

vi.mock('@/lib/payment-security', () => ({
  paymentSecurityManager: {
    createSecurePaymentIntent: vi.fn(),
    verifyPaymentCompletion: vi.fn(),
    verifyWebhookSignature: vi.fn(),
  },
}));

vi.mock('@/lib/secure-error-handler', () => ({
  secureErrorHandler: {
    handleSecureError: vi.fn(),
  },
}));

vi.mock('@/lib/security', () => ({
  SecurityMonitor: {
    getInstance: vi.fn(() => ({
      logSecurityEvent: vi.fn(),
    })),
  },
}));

vi.mock('../secure-api-gateway', () => ({
  apiGateway: {
    request: vi.fn(),
  },
  stripeApi: {
    createPaymentIntent: vi.fn(),
    confirmPayment: vi.fn(),
  },
}));

describe('EnhancedStripeService', () => {
  let service: EnhancedStripeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = enhancedStripeService as EnhancedStripeService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid credentials', async () => {
      const { credentialManager } = await import('@/lib/secure-credentials');
      const { apiGateway } = await import('../secure-api-gateway');

      (credentialManager.getCredentials as any).mockResolvedValue({
        apiKey: 'sk_test_123',
        webhookSecret: 'whsec_123',
      });

      (apiGateway.request as any).mockResolvedValue({ success: true });

      const result = await service.initialize();

      expect(result).toBe(true);
      expect(credentialManager.getCredentials).toHaveBeenCalledWith('stripe');
      expect(apiGateway.request).toHaveBeenCalledWith('stripe', '/account', {
        method: 'GET',
        bypassCircuitBreaker: true
      });
    });

    it('should fail initialization without credentials', async () => {
      const { credentialManager } = await import('@/lib/secure-credentials');

      (credentialManager.getCredentials as any).mockResolvedValue(null);

      const result = await service.initialize();

      expect(result).toBe(false);
    });

    it('should fail initialization with invalid connectivity', async () => {
      const { credentialManager } = await import('@/lib/secure-credentials');
      const { apiGateway } = await import('../secure-api-gateway');

      (credentialManager.getCredentials as any).mockResolvedValue({
        apiKey: 'sk_test_123',
      });

      (apiGateway.request as any).mockResolvedValue({ success: false });

      const result = await service.initialize();

      expect(result).toBe(false);
    });
  });

  describe('Payment Intent Creation', () => {
    beforeEach(async () => {
      // Mock successful initialization
      const { credentialManager } = await import('@/lib/secure-credentials');
      const { apiGateway } = await import('../secure-api-gateway');

      (credentialManager.getCredentials as any).mockResolvedValue({
        apiKey: 'sk_test_123',
      });

      (apiGateway.request as any).mockResolvedValue({ success: true });
      await service.initialize();
    });

    it('should create a payment intent successfully', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');
      const { stripeApi } = await import('../secure-api-gateway');

      const paymentParams = {
        amount: 2000,
        currency: 'PLN',
        customer: 'cus_123',
        metadata: { booking_id: 'booking_123' },
      };

      const mockSecurityValidation = {
        isAllowed: true,
        enhancedMetadata: {
          ...paymentParams.metadata,
          security_score: 0.95,
        },
      };

      const mockPaymentIntent: StripePaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        amount: 2000,
        currency: 'pln',
        status: 'requires_payment_method',
        metadata: paymentParams.metadata,
      };

      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue(mockSecurityValidation);
      (paymentSecurityManager.verifyPaymentCompletion as any).mockReturnValue({
        isValid: true,
        securityScore: 0.95,
      });
      (stripeApi.createPaymentIntent as any).mockResolvedValue({
        success: true,
        data: mockPaymentIntent,
      });

      const result = await service.createPaymentIntent(paymentParams);

      expect(result).toEqual(mockPaymentIntent);
      expect(paymentSecurityManager.createSecurePaymentIntent).toHaveBeenCalledWith(paymentParams);
      expect(stripeApi.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2000,
          currency: 'PLN',
          customer: 'cus_123',
          metadata: mockSecurityValidation.enhancedMetadata,
          payment_method_types: ['card', 'blik'],
          capture_method: 'automatic',
          confirm: false,
          idempotency_key: expect.any(String),
        })
      );
    });

    it('should block payment when security validation fails', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');
      const { SecurityMonitor } = await import('@/lib/security');

      const paymentParams = {
        amount: 2000,
        currency: 'PLN',
      };

      const mockSecurityValidation = {
        isAllowed: false,
        reason: 'Suspicious activity detected',
      };

      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue(mockSecurityValidation);

      await expect(service.createPaymentIntent(paymentParams)).rejects.toThrow(
        'Payment security validation failed: Suspicious activity detected'
      );

      expect(SecurityMonitor.getInstance().logSecurityEvent).toHaveBeenCalledWith({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: expect.objectContaining({
          activity: 'payment_intent_blocked',
          reason: 'Suspicious activity detected',
        }),
      });
    });

    it('should handle Stripe API errors', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');
      const { stripeApi, secureErrorHandler } = await import('../secure-api-gateway');

      const paymentParams = {
        amount: 2000,
        currency: 'PLN',
      };

      const mockSecurityValidation = {
        isAllowed: true,
        enhancedMetadata: {},
      };

      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue(mockSecurityValidation);
      (stripeApi.createPaymentIntent as any).mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      (secureErrorHandler.handleSecureError as any).mockReturnValue({
        message: 'Payment processing failed: Insufficient funds',
      });

      await expect(service.createPaymentIntent(paymentParams)).rejects.toThrow(
        'Payment processing failed: Insufficient funds'
      );
    });
  });

  describe('Customer Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create a new customer when none exists', async () => {
      const { apiGateway } = await import('../secure-api-gateway');

      const customerData = {
        email: 'test@example.com',
        name: 'John Doe',
        phone: '+48 123 456 789',
      };

      const mockCustomer: StripeCustomer = {
        id: 'cus_123',
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          source: 'mariia-hub',
          created_at: expect.any(String),
        },
      };

      // Mock customer lookup (not found)
      (apiGateway.request as any)
        .mockResolvedValueOnce({ success: true, data: { data: [] } }) // Find existing customer
        .mockResolvedValueOnce({ success: true, data: mockCustomer }); // Create new customer

      const result = await service.createOrRetrieveCustomer(customerData);

      expect(result).toEqual(mockCustomer);
      expect(apiGateway.request).toHaveBeenCalledWith('stripe', '/customers', {
        method: 'POST',
        body: expect.objectContaining({
          ...customerData,
          metadata: expect.objectContaining({
            source: 'mariia-hub',
          }),
        }),
      });
    });

    it('should retrieve existing customer when found', async () => {
      const { apiGateway } = await import('../secure-api-gateway');

      const customerData = {
        email: 'test@example.com',
        name: 'John Doe Updated',
      };

      const existingCustomer: StripeCustomer = {
        id: 'cus_123',
        email: customerData.email,
        name: 'John Doe',
        phone: '+48 123 456 789',
      };

      const updatedCustomer: StripeCustomer = {
        ...existingCustomer,
        name: customerData.name,
      };

      // Mock customer lookup (found) and update
      (apiGateway.request as any)
        .mockResolvedValueOnce({ success: true, data: { data: [existingCustomer] } }) // Find existing customer
        .mockResolvedValueOnce({ success: true, data: updatedCustomer }); // Update customer

      const result = await service.createOrRetrieveCustomer(customerData);

      expect(result).toEqual(updatedCustomer);
      expect(apiGateway.request).toHaveBeenCalledWith('stripe', `/customers/${existingCustomer.id}`, {
        method: 'POST',
        body: { name: customerData.name },
      });
    });
  });

  describe('Refund Processing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create a refund successfully', async () => {
      const { apiGateway } = await import('../secure-api-gateway');

      const refundParams = {
        payment_intent: 'pi_123',
        amount: 1000,
        reason: 'requested_by_customer' as const,
        metadata: { reason_code: 'R01' },
      };

      const mockRefund = {
        id: 're_123',
        payment_intent: refundParams.payment_intent,
        amount: refundParams.amount,
        currency: 'pln',
        status: 'succeeded',
        reason: refundParams.reason,
        metadata: {
          ...refundParams.metadata,
          source: 'mariia-hub',
          refunded_at: expect.any(String),
        },
      };

      (apiGateway.request as any).mockResolvedValue({
        success: true,
        data: mockRefund,
      });

      const result = await service.createRefund(refundParams);

      expect(result).toEqual(mockRefund);
      expect(apiGateway.request).toHaveBeenCalledWith('stripe', '/refunds', {
        method: 'POST',
        body: expect.objectContaining({
          ...refundParams,
          metadata: expect.objectContaining({
            source: 'mariia-hub',
          }),
        }),
      });
    });

    it('should handle refund errors', async () => {
      const { apiGateway } = await import('../secure-api-gateway');

      const refundParams = {
        payment_intent: 'pi_123',
      };

      (apiGateway.request as any).mockResolvedValue({
        success: false,
        error: 'Refund failed: insufficient funds',
      });

      await expect(service.createRefund(refundParams)).rejects.toThrow(
        'Failed to create refund: Refund failed: insufficient funds'
      );
    });
  });

  describe('Webhook Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should process valid payment succeeded webhook', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');

      const payload = JSON.stringify({
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: { booking_id: 'booking_123' },
          },
        },
        created: 1640995200,
      });

      const signature = 'whsec_valid_signature';
      const ipAddress = '192.168.1.1';

      (paymentSecurityManager.verifyWebhookSignature as any).mockReturnValue({
        isValid: true,
      });

      const result = await service.handleWebhook(payload, signature, ipAddress);

      expect(result.processed).toBe(true);
      expect(result.error).toBeUndefined();
      expect(paymentSecurityManager.verifyWebhookSignature).toHaveBeenCalledWith(payload, signature);
    });

    it('should reject webhook with invalid signature', async () => {
      const { paymentSecurityManager, SecurityMonitor } = await import('@/lib/payment-security');
      const { SecurityMonitor: SecurityMonitorType } = await import('@/lib/security');

      const payload = JSON.stringify({
        id: 'evt_123',
        type: 'payment_intent.succeeded',
      });

      const invalidSignature = 'whsec_invalid_signature';
      const ipAddress = '192.168.1.1';

      (paymentSecurityManager.verifyWebhookSignature as any).mockReturnValue({
        isValid: false,
        error: 'Invalid signature',
      });

      const result = await service.handleWebhook(payload, invalidSignature, ipAddress);

      expect(result.processed).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(SecurityMonitor.getInstance().logSecurityEvent).toHaveBeenCalledWith({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: expect.objectContaining({
          activity: 'invalid_webhook_signature',
          error: 'Invalid signature',
          ipAddress,
        }),
      });
    });

    it('should handle different webhook event types', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');

      const testCases = [
        { type: 'payment_intent.succeeded', shouldProcess: true },
        { type: 'payment_intent.payment_failed', shouldProcess: true },
        { type: 'payment_intent.canceled', shouldProcess: true },
        { type: 'customer.created', shouldProcess: true },
        { type: 'customer.updated', shouldProcess: true },
        { type: 'invoice.payment_succeeded', shouldProcess: true },
        { type: 'charge.dispute.created', shouldProcess: true },
        { type: 'unknown.event', shouldProcess: false }, // Should not throw but just log
      ];

      for (const testCase of testCases) {
        const payload = JSON.stringify({
          id: 'evt_123',
          type: testCase.type,
          data: { object: { id: 'obj_123' } },
          created: 1640995200,
        });

        const signature = 'whsec_valid_signature';

        (paymentSecurityManager.verifyWebhookSignature as any).mockReturnValue({
          isValid: true,
        });

        const result = await service.handleWebhook(payload, signature);

        if (testCase.shouldProcess) {
          expect(result.processed).toBe(true);
        } else {
          // Unknown events should still be processed (logged) without error
          expect(result.processed).toBe(true);
        }
        expect(result.error).toBeUndefined();
      }
    });

    it('should handle webhook processing errors gracefully', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');

      const payload = 'invalid json';
      const signature = 'whsec_valid_signature';

      (paymentSecurityManager.verifyWebhookSignature as any).mockReturnValue({
        isValid: true,
      });

      const result = await service.handleWebhook(payload, signature);

      expect(result.processed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Payment Metrics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should calculate payment metrics correctly', async () => {
      // Mock the Supabase client dependency
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  count: 'exact',
                  head: true,
                })),
              })),
            })),
          })),
        })),
      };

      // Mock successful payments
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                count: 'exact',
                head: true,
              })),
            })),
          })),
        })),
      });

      // Mock payment intents query
      const mockPaymentIntents = [
        { amount: 2000 },
        { amount: 1500 },
        { amount: 3000 },
      ];

      const { createClient } = await import('@/integrations/supabase/client');
      (createClient as any).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'payment_intents') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    lte: vi.fn(() => ({
                      count: 'exact',
                      head: true,
                    })),
                  })),
                })),
              })),
            };
          }
          if (table === 'payment_refunds') {
            return {
              select: vi.fn(() => ({
                count: 'exact',
                head: true,
              })),
            };
          }
          if (table === 'payment_disputes') {
            return {
              select: vi.fn(() => ({
                count: 'exact',
                head: true,
              })),
            };
          }
          return {};
        }),
      });

      const metrics = await service.getPaymentMetrics();

      expect(metrics).toHaveProperty('totalAmount');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageAmount');
      expect(metrics).toHaveProperty('paymentCount');
      expect(metrics).toHaveProperty('refundCount');
      expect(metrics).toHaveProperty('disputeCount');

      expect(typeof metrics.totalAmount).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.averageAmount).toBe('number');
      expect(typeof metrics.paymentCount).toBe('number');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle network timeouts gracefully', async () => {
      const { stripeApi, secureErrorHandler } = await import('../secure-api-gateway');

      const paymentParams = {
        amount: 2000,
        currency: 'PLN',
      };

      const { paymentSecurityManager } = await import('@/lib/payment-security');
      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue({
        isAllowed: true,
        enhancedMetadata: {},
      });

      (stripeApi.createPaymentIntent as any).mockRejectedValue(new Error('Network timeout'));
      (secureErrorHandler.handleSecureError as any).mockReturnValue({
        message: 'Payment service temporarily unavailable',
      });

      await expect(service.createPaymentIntent(paymentParams)).rejects.toThrow(
        'Payment service temporarily unavailable'
      );
    });

    it('should handle malformed responses', async () => {
      const { stripeApi } = await import('../secure-api-gateway');

      const customerData = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      (stripeApi.request as any).mockResolvedValue({
        success: true,
        data: null, // Malformed response
      });

      await expect(service.createOrRetrieveCustomer(customerData)).rejects.toThrow();
    });
  });

  describe('Security Validation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should log security events for suspicious activity', async () => {
      const { paymentSecurityManager, SecurityMonitor } = await import('@/lib/payment-security');

      const paymentParams = {
        amount: 50000, // Unusually large amount
        currency: 'PLN',
      };

      const mockSecurityValidation = {
        isAllowed: false,
        reason: 'High risk transaction detected',
      };

      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue(mockSecurityValidation);

      await expect(service.createPaymentIntent(paymentParams)).rejects.toThrow(
        'Payment security validation failed: High risk transaction detected'
      );

      expect(SecurityMonitor.getInstance().logSecurityEvent).toHaveBeenCalledWith({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: expect.objectContaining({
          activity: 'payment_intent_blocked',
          reason: 'High risk transaction detected',
          amount: 50000,
          currency: 'PLN',
        }),
      });
    });

    it('should verify payment completion security', async () => {
      const { paymentSecurityManager } = await import('@/lib/payment-security');
      const { stripeApi } = await import('../secure-api-gateway');

      const paymentParams = {
        amount: 2000,
        currency: 'PLN',
        sessionId: 'session_123',
      };

      const mockSecurityValidation = {
        isAllowed: true,
        enhancedMetadata: {},
      };

      const mockPaymentIntent: StripePaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        amount: 2000,
        currency: 'pln',
        status: 'succeeded',
      };

      const mockCompletionVerification = {
        isValid: false,
        anomalies: ['unusual_device', 'high_velocity'],
        securityScore: 0.3,
      };

      (paymentSecurityManager.createSecurePaymentIntent as any).mockReturnValue(mockSecurityValidation);
      (paymentSecurityManager.verifyPaymentCompletion as any).mockReturnValue(mockCompletionVerification);
      (stripeApi.createPaymentIntent as any).mockResolvedValue({
        success: true,
        data: mockPaymentIntent,
      });

      const { SecurityMonitor } = await import('@/lib/security');

      await service.createPaymentIntent(paymentParams);

      expect(SecurityMonitor.getInstance().logSecurityEvent).toHaveBeenCalledWith({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        details: expect.objectContaining({
          activity: 'payment_completion_anomaly',
          paymentIntentId: 'pi_123',
          anomalies: ['unusual_device', 'high_velocity'],
          securityScore: 0.3,
        }),
      });
    });
  });
});