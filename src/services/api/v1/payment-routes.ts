import { Hono } from 'hono';

import {
  ValidationMiddleware,
  RateLimitMiddleware,
  AuthMiddleware,
  RateLimitConfigs,
  Permissions
} from '../middleware';
import { paymentSystemService } from '../../paymentSystemService';
import { loyaltyProgramService } from '../../loyaltyProgramService';

// Secure random string generator using Web Crypto API
function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

const app = new Hono();

// Apply middleware
app.use('*', RateLimitMiddleware.rateLimit(RateLimitConfigs.strict));
app.post('/stripe-webhook', RateLimitMiddleware.rateLimit(RateLimitConfigs.auth));

/**
 * POST /api/v1/payments/deposit/calculate
 * Calculate deposit requirements
 */
app.post('/deposit/calculate',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      service_id: {
        type: 'string',
        required: true
      },
      total_amount: {
        type: 'number',
        required: true,
        min: 0
      },
      service_type: {
        type: 'string',
        enum: ['beauty', 'fitness', 'lifestyle'],
        required: true
      },
      currency: {
        type: 'string',
        enum: ['PLN', 'EUR', 'USD'],
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { service_id, total_amount, service_type, currency = 'PLN' } = await c.req.json();

      const result = await paymentSystemService.calculateDeposit({
        serviceId: service_id,
        totalAmount: total_amount,
        serviceType: service_type,
        currency
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to calculate deposit'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Deposit calculation error'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/cancel-fee/calculate
 * Calculate cancellation fees
 */
app.post('/cancel-fee/calculate',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      booking_id: {
        type: 'string',
        required: true
      },
      total_amount: {
        type: 'number',
        required: true,
        min: 0
      },
      deposit_paid: {
        type: 'number',
        required: false,
        min: 0
      }
    }
  }),
  async (c) => {
    try {
      const { booking_id, total_amount, deposit_paid = 0 } = await c.req.json();

      const result = await paymentSystemService.calculateCancellationFee({
        bookingId: booking_id,
        totalAmount: total_amount,
        depositPaid: deposit_paid,
        cancellationTime: new Date(),
        bookingTime: new Date(), // Would fetch from booking
        currency: 'PLN'
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to calculate cancellation fee'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation fee calculation error'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/plans
 * Create a payment plan
 */
app.post('/plans',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      booking_id: {
        type: 'string',
        required: true
      },
      total_amount: {
        type: 'number',
        required: true,
        min: 0
      },
      number_of_installments: {
        type: 'number',
        required: true,
        min: 2,
        max: 12
      },
      deposit_amount: {
        type: 'number',
        required: false,
        min: 0
      },
      installment_schedule: {
        type: 'array',
        required: true,
        minItems: 2,
        maxItems: 12,
        items: {
          due_date: {
            type: 'string',
            format: 'date',
            required: true
          },
          amount: {
            type: 'number',
            required: true,
            min: 0
          }
        }
      }
    }
  }),
  async (c) => {
    try {
      const planData = await c.req.json();

      const result = await paymentSystemService.createPaymentPlan({
        bookingId: planData.booking_id,
        totalAmount: planData.total_amount,
        numberOfInstallments: planData.number_of_installments,
        depositAmount: planData.deposit_amount,
        installmentSchedule: planData.installment_schedule
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        }, 201);
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to create payment plan'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Payment plan creation error'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/payments/plans/:id
 * Get payment plan details
 */
app.get('/plans/:id',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    params: {
      id: {
        type: 'string',
        required: true
      }
    }
  }),
  async (c) => {
    try {
      const { id } = c.req.param();

      const result = await paymentSystemService.getPaymentPlan(id);

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Payment plan not found'
        }, 404);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment plan'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/payments/bookings/:id/summary
 * Get payment summary for a booking
 */
app.get('/bookings/:id/summary',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    params: {
      id: {
        type: 'string',
        required: true
      }
    }
  }),
  async (c) => {
    try {
      const { id } = c.req.param();

      const result = await paymentSystemService.getPaymentSummary(id);

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Booking not found'
        }, 404);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment summary'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/gift-cards/purchase
 * Purchase a gift card
 */
app.post('/gift-cards/purchase',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      amount: {
        type: 'number',
        required: true,
        min: 50,
        max: 5000
      },
      currency: {
        type: 'string',
        enum: ['PLN', 'EUR', 'USD'],
        required: false
      },
      recipient_email: {
        type: 'string',
        format: 'email',
        required: true
      },
      recipient_id: {
        type: 'string',
        required: false
      },
      personal_message: {
        type: 'string',
        maxLength: 500,
        required: false
      },
      valid_from: {
        type: 'string',
        format: 'date',
        required: false
      },
      expires_at: {
        type: 'string',
        format: 'date',
        required: false
      }
    }
  }),
  RateLimitMiddleware.rateLimit(RateLimitConfigs.upload),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const giftCardData = await c.req.json();

      const result = await paymentSystemService.purchaseGiftCard({
        amount: giftCardData.amount,
        currency: giftCardData.currency || 'PLN',
        purchaserId: user!.id,
        recipientEmail: giftCardData.recipient_email,
        recipientId: giftCardData.recipient_id,
        personalMessage: giftCardData.personal_message,
        validFrom: giftCardData.valid_from ? new Date(giftCardData.valid_from) : undefined,
        expiresAt: giftCardData.expires_at ? new Date(giftCardData.expires_at) : undefined
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        }, 201);
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to purchase gift card'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Gift card purchase error'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/gift-cards/redeem
 * Redeem a gift card
 */
app.post('/gift-cards/redeem',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      code: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 20
      },
      amount: {
        type: 'number',
        required: true,
        min: 1
      },
      booking_id: {
        type: 'string',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { code, amount, booking_id } = await c.req.json();

      const result = await paymentSystemService.redeemGiftCard(code, amount, booking_id);

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to redeem gift card'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Gift card redemption error'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/stripe/create-intent
 * Create a Stripe payment intent
 */
app.post('/stripe/create-intent',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      amount: {
        type: 'number',
        required: true,
        min: 1
      },
      currency: {
        type: 'string',
        enum: ['PLN', 'EUR', 'USD'],
        required: false
      },
      booking_id: {
        type: 'string',
        required: false
      },
      metadata: {
        type: 'object',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const { amount, currency = 'PLN', booking_id, metadata } = await c.req.json();

      // This would integrate with actual Stripe API
      // For now, return a mock response with secure random strings
      const paymentIntent = {
        id: `pi_${Date.now()}_${generateSecureRandomString(12)}`,
        client_secret: `pi_${Date.now()}_${generateSecureRandomString(12)}_secret_${generateSecureRandomString(20)}`,
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        metadata: {
          ...metadata,
          booking_id
        }
      };

      return c.json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/stripe/confirm-payment
 * Confirm a Stripe payment
 */
app.post('/stripe/confirm-payment',
  ValidationMiddleware.validate({
    body: {
      payment_intent_id: {
        type: 'string',
        required: true
      }
    }
  }),
  async (c) => {
    try {
      const { payment_intent_id } = await c.req.json();

      // This would integrate with actual Stripe API to confirm payment
      // For now, return a mock response
      const confirmedPayment = {
        id: payment_intent_id,
        status: 'succeeded',
        amount_received: 10000, // Mock amount in cents
        currency: 'pln',
        payment_method: 'card',
        created: Date.now()
      };

      return c.json({
        success: true,
        data: confirmedPayment
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/stripe/webhook
 * Handle Stripe webhooks
 */
app.post('/stripe-webhook',
  async (c) => {
    try {
      const signature = c.req.header('stripe-signature');
      const body = await c.req.text();

      // This would verify the Stripe webhook signature
      // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      // For now, just acknowledge the webhook
      return c.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return c.json({ error: 'Webhook handler failed' }, 400);
    }
  }
);

/**
 * POST /api/v1/payments/loyalty/points/award
 * Award loyalty points (admin only)
 */
app.post('/loyalty/points/award',
  AuthMiddleware.requirePermission(Permissions.USER_WRITE),
  ValidationMiddleware.validate({
    body: {
      user_id: {
        type: 'string',
        required: true
      },
      points: {
        type: 'number',
        required: true,
        min: 1
      },
      booking_id: {
        type: 'string',
        required: false
      },
      description: {
        type: 'string',
        maxLength: 500,
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const pointsData = await c.req.json();

      const result = await loyaltyProgramService.awardPoints({
        userId: pointsData.user_id,
        points: pointsData.points,
        bookingId: pointsData.booking_id,
        type: 'earned',
        description: pointsData.description || 'Points awarded by admin'
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to award points'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to award points'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/payments/loyalty/rewards/redeem
 * Redeem loyalty points for rewards
 */
app.post('/loyalty/rewards/redeem',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      reward_id: {
        type: 'string',
        required: true
      }
    }
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const { reward_id } = await c.req.json();

      const result = await loyaltyProgramService.redeemReward(user!.id, reward_id);

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to redeem reward'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Reward redemption error'
      }, 500);
    }
  }
);

export default app;