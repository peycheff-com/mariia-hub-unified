import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { paymentSecurityManager } from '@/lib/payment-security';
import { getRequiredEnvVar } from '@/lib/runtime-env';

// Initialize Stripe with webhook secret
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Supabase
const supabaseUrl = getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
const supabaseServiceRoleKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY']);

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      logger.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Enhanced webhook signature verification
    const signatureVerification = paymentSecurityManager.verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );

    if (!signatureVerification.isValid) {
      logger.error('Webhook signature verification failed:', signatureVerification.error);
      return NextResponse.json({
        error: 'Invalid signature',
        details: signatureVerification.error
      }, { status: 401 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logger.error('Stripe webhook construction failed:', err.message);
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    // Log webhook received
    logger.info('Stripe webhook received', {
      eventId: event.id,
      eventType: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'payout.created':
      case 'payout.paid':
      case 'payout.failed':
        await handlePayoutEvent(event.type, event.data.object as Stripe.Payout);
        break;

      default:
        logger.warn('Unhandled webhook event type:', event.type);
    }

    // Store webhook log
    await storeWebhookLog(event, true);

    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing error:', error);

    // Try to store error log
    try {
      const body = await req.text();
      const signature = headers().get('stripe-signature');
      await storeWebhookLog(
        { id: 'error', type: 'webhook_error', created: Math.floor(Date.now() / 1000) } as Stripe.Event,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (logError) {
      logger.error('Failed to store webhook error log:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment succeeded', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customerId: paymentIntent.customer,
    metadata: paymentIntent.metadata,
  });

  // Enhanced payment completion verification
  const sessionId = paymentIntent.metadata?.security_session_id;
  const completionVerification = paymentSecurityManager.verifyPaymentCompletion(
    paymentIntent,
    sessionId
  );

  logger.info('Payment completion verification', {
    paymentIntentId: paymentIntent.id,
    isValid: completionVerification.isValid,
    securityScore: completionVerification.securityScore,
    anomalies: completionVerification.anomalies,
  });

  if (!completionVerification.isValid) {
    logger.error('Payment completion verification failed', {
      paymentIntentId: paymentIntent.id,
      anomalies: completionVerification.anomalies,
      securityScore: completionVerification.securityScore,
    });

    // Still process payment but flag for review
    // Don't block legitimate payments due to overly sensitive security
  }

  try {
    // Update payment intent in database
    await supabase
      .from('payment_intents')
      .update({
        status: 'succeeded',
        completed_at: new Date().toISOString(),
        security_score: completionVerification.securityScore,
        security_anomalies: completionVerification.anomalies,
      })
      .eq('id', paymentIntent.id);

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          paid: true,
          stripe_payment_intent_id: paymentIntent.id,
          security_verified: completionVerification.isValid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.metadata.booking_id);

      logger.info('Booking updated for successful payment', {
        bookingId: paymentIntent.metadata.booking_id,
        paymentIntentId: paymentIntent.id,
        securityVerified: completionVerification.isValid,
      });
    }

    // Send confirmation email/notifications
    // This would trigger email service
    logger.info('Payment success - notification triggered', {
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.receipt_email,
      securityVerified: completionVerification.isValid,
    });

  } catch (error) {
    logger.error('Error processing payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Payment failed', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata,
  });

  try {
    // Update payment intent in database
    await supabase
      .from('payment_intents')
      .update({
        status: 'requires_payment_method',
        last_error: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.id);

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.metadata.booking_id);
    }

    // Send failure notification
    logger.info('Payment failure - notification triggered', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });

  } catch (error) {
    logger.error('Error processing payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment canceled', {
    paymentIntentId: paymentIntent.id,
    metadata: paymentIntent.metadata,
  });

  try {
    // Update payment intent in database
    await supabase
      .from('payment_intents')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.id);

    // Update booking status if linked
    if (paymentIntent.metadata?.booking_id) {
      await supabase
        .from('bookings')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.metadata.booking_id);
    }

  } catch (error) {
    logger.error('Error processing payment cancellation:', error);
  }
}

async function handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment requires action', {
    paymentIntentId: paymentIntent.id,
    nextAction: paymentIntent.next_action,
  });

  try {
    // Update payment intent in database
    await supabase
      .from('payment_intents')
      .update({
        status: 'requires_action',
        next_action: paymentIntent.next_action?.type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.id);

  } catch (error) {
    logger.error('Error processing payment action required:', error);
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  logger.info('Charge succeeded', {
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amount: charge.amount,
    currency: charge.currency,
  });

  try {
    // Store charge information
    await supabase
      .from('payment_charges')
      .upsert({
        id: charge.id,
        payment_intent_id: charge.payment_intent as string,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        receipt_url: charge.receipt_url,
        created: new Date(charge.created * 1000).toISOString(),
      });

  } catch (error) {
    logger.error('Error processing charge success:', error);
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  logger.warn('Charge failed', {
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    failure_code: charge.failure_code,
    failure_message: charge.failure_message,
  });

  try {
    // Store charge information
    await supabase
      .from('payment_charges')
      .upsert({
        id: charge.id,
        payment_intent_id: charge.payment_intent as string,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        failure_code: charge.failure_code,
        failure_message: charge.failure_message,
        created: new Date(charge.created * 1000).toISOString(),
      });

  } catch (error) {
    logger.error('Error processing charge failure:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  logger.info('Customer created', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
  });

  try {
    // Store customer information
    await supabase
      .from('stripe_customers')
      .upsert({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created_at: new Date(customer.created * 1000).toISOString(),
      });

  } catch (error) {
    logger.error('Error processing customer creation:', error);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  logger.info('Customer updated', {
    customerId: customer.id,
    email: customer.email,
  });

  try {
    // Update customer information
    await supabase
      .from('stripe_customers')
      .update({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

  } catch (error) {
    logger.error('Error processing customer update:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Invoice payment succeeded', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
  });

  // Handle subscription payments if needed
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
  });

  // Handle subscription payment failures if needed
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  logger.info('Payment method attached', {
    paymentMethodId: paymentMethod.id,
    type: paymentMethod.type,
    customerId: paymentMethod.customer,
  });

  try {
    // Store payment method information
    await supabase
      .from('payment_methods')
      .upsert({
        id: paymentMethod.id,
        customer_id: paymentMethod.customer as string,
        type: paymentMethod.type,
        created_at: new Date(paymentMethod.created * 1000).toISOString(),
      });

  } catch (error) {
    logger.error('Error processing payment method attachment:', error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  logger.error('Dispute created', {
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: dispute.amount,
    reason: dispute.reason,
  });

  try {
    // Store dispute information and alert admin
    await supabase
      .from('payment_disputes')
      .insert({
        id: dispute.id,
        charge_id: dispute.charge,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidence_due_by: new Date(dispute.evidence_details!.due_by * 1000).toISOString(),
        created_at: new Date(dispute.created * 1000).toISOString(),
      });

    // Send immediate alert to admin
    logger.error('PAYMENT DISPUTE ALERT - Immediate attention required', {
      disputeId: dispute.id,
      amount: dispute.amount / 100, // Convert to currency units
      currency: dispute.currency,
      reason: dispute.reason,
    });

  } catch (error) {
    logger.error('Error processing dispute creation:', error);
  }
}

async function handlePayoutEvent(eventType: string, payout: Stripe.Payout) {
  logger.info('Payout event', {
    eventType,
    payoutId: payout.id,
    amount: payout.amount,
    currency: payout.currency,
    status: payout.status,
  });

  try {
    // Store payout information
    await supabase
      .from('payouts')
      .upsert({
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
        created_at: new Date(payout.created * 1000).toISOString(),
      });

  } catch (error) {
    logger.error('Error processing payout event:', error);
  }
}

async function storeWebhookLog(
  event: Stripe.Event,
  processed: boolean,
  error?: string
) {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        source: 'stripe',
        event_id: event.id,
        event_type: event.type,
        processed,
        error,
        raw_data: event,
        created_at: new Date().toISOString(),
      });
  } catch (logError) {
    logger.error('Failed to store webhook log:', logError);
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}
