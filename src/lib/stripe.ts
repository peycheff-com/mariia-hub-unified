import { loadStripe, Stripe } from '@stripe/stripe-js';

import { logger } from './logger';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'pln',
  metadata?: Record<string, string>,
  customerData?: {
    email: string;
    name: string;
  }
) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
        customer_email: customerData?.email,
        customer_name: customerData?.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    const { clientSecret, paymentIntentId } = await response.json();
    return { clientSecret, paymentIntentId };
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (
  clientSecret: string,
  paymentMethodId: string
) => {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethodId,
  });

  if (error) {
    throw error;
  }

  return paymentIntent;
};