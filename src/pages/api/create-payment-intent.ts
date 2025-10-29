import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { createClient as createStripeClient } from '@stripe/stripe-js';
import Stripe from 'stripe';

import { logger } from '@/lib/logger';
import { paymentSecurityManager, generateSecureSessionId } from '@/lib/payment-security';
import { getRequiredEnvVar } from '@/lib/runtime-env';

// Initialize Supabase client
const supabaseUrl = getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
const supabaseServiceRoleKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY']);

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'pln', metadata, customer_email, customer_name } = body;

    // Get request origin for security validation
    const origin = request.headers.get('origin') || request.headers.get('referer');

    // Security validation using enhanced payment security
    const securityValidation = paymentSecurityManager.validatePaymentRequest({
      amount,
      currency,
      customerEmail: customer_email,
      origin,
    });

    if (!securityValidation.valid) {
      logger.warn('Payment request security validation failed', {
        error: securityValidation.error,
        customerEmail: customer_email,
        amount,
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        { error: securityValidation.error },
        { status: 400 }
      );
    }

    // Validate request parameters
    if (!amount || amount <= 0) {
      return Response.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Generate secure session ID
    const sessionId = generateSecureSessionId();

    // Enhanced security validation for payment amount
    const amountValidation = paymentSecurityManager.validatePaymentAmount(
      amount,
      currency,
      customer_email
    );

    if (!amountValidation.isValid) {
      logger.warn('Payment amount validation failed', {
        warnings: amountValidation.warnings,
        riskLevel: amountValidation.riskLevel,
        customerEmail: customer_email,
        amount,
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        {
          error: 'Payment validation failed',
          details: amountValidation.warnings,
          riskLevel: amountValidation.riskLevel
        },
        { status: 400 }
      );
    }

    // Create secure payment intent
    const securityCheck = paymentSecurityManager.createSecurePaymentIntent({
      amount,
      currency,
      customerId: customer_email,
      metadata,
      sessionId,
    });

    if (!securityCheck.isAllowed) {
      logger.warn('Payment security check failed', {
        reason: securityCheck.reason,
        customerEmail: customer_email,
        amount,
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        { error: securityCheck.reason },
        { status: 429 } // Too Many Requests
      );
    }

    // Log payment attempt for audit
    logger.info('Payment intent creation attempt', {
      amount,
      currency,
      metadata,
      customer_email,
      sessionId,
      securityRiskLevel: amountValidation.riskLevel,
      timestamp: new Date().toISOString(),
    });

    // Create or retrieve customer
    let customerId;
    if (customer_email) {
      try {
        const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: customer_email,
            name: customer_name || 'Customer',
            metadata: {
              source: 'mariia-hub-booking',
              ...metadata,
            },
          });
          customerId = customer.id;
        }
      } catch (error) {
        logger.error('Error creating/retrieving Stripe customer:', error);
        // Continue without customer ID for now
      }
    }

    // Create payment intent with enhanced security features
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata: {
        ...securityCheck.enhancedMetadata, // Use security-enhanced metadata
        source: 'mariia-hub-booking',
        created_at: new Date().toISOString(),
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Keep user on our page
      },
      payment_method_types: ['card', 'blik'],
      capture_method: 'automatic',
      confirmation_method: 'automatic',
      // Enhanced security settings
      setup_future_usage: 'on_session', // Allow saving payment method
      receipt_email: customer_email,
      // Fraud prevention
      description: metadata?.service_title || 'Service Booking',
      shipping: metadata?.requires_shipping ? {
        address: {
          line1: metadata?.address_line1 || '',
          city: metadata?.city || '',
          postal_code: metadata?.postal_code || '',
          country: metadata?.country || 'PL',
        },
        name: customer_name || 'Customer',
      } : undefined,
      // Security and risk settings
      risk_level: amountValidation.riskLevel === 'high' ? 'normal' : undefined,
      statement_descriptor: 'MARIIA HUB',
    });

    // Store payment intent in our database for audit
    if (supabase) {
      try {
        await supabase
          .from('payment_intents')
          .insert({
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            customer_id: customerId,
            metadata: paymentIntent.metadata,
            created_at: new Date().toISOString(),
          });
      } catch (dbError) {
        logger.error('Failed to store payment intent in database:', dbError);
        // Continue anyway - payment intent is created in Stripe
      }
    }

    // Log successful creation
    logger.info('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customerId,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    logger.error('Error creating payment intent:', error);

    return Response.json(
      {
        error: 'Failed to create payment intent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
