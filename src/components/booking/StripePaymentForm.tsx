import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

interface StripePaymentFormProps {
  clientSecret: string;
  amount?: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  amount,
  currency = 'pln',
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [isGooglePaySupported, setIsGooglePaySupported] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Check for wallet support on mount
  useEffect(() => {
    if (!stripe) return;

    const checkWalletSupport = async () => {
      try {
        // Check Apple Pay support
        const applePayResult = await stripe.paymentRequest({
          country: 'PL',
          currency: currency.toUpperCase(),
          total: {
            label: 'Service Booking',
            amount: amount ? Math.round(amount * 100) : 0,
          },
        }).canMakePayment();

        setIsApplePaySupported(!!applePayResult?.applePay);

        // Check Google Pay support
        const googlePayResult = await stripe.paymentRequest({
          country: 'PL',
          currency: currency.toUpperCase(),
          total: {
            label: 'Service Booking',
            amount: amount ? Math.round(amount * 100) : 0,
          },
        }).canMakePayment();

        setIsGooglePaySupported(!!googlePayResult?.googlePay);
      } catch (error) {
        logger.warn('Error checking wallet support:', error);
      }
    };

    checkWalletSupport();
  }, [stripe, amount, currency]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system is not ready. Please refresh the page and try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    // Log payment attempt
    logger.info('Payment submission attempt', {
      timestamp: new Date().toISOString(),
      amount,
      currency,
    });

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle specific error types
        let errorMessage = error.message || 'An error occurred during payment';
        let isRecoverable = true;

        switch (error.type) {
          case 'card_error':
            if (error.code === 'card_declined') {
              errorMessage = 'Your card was declined. Please try a different card or contact your bank.';
            } else if (error.code === 'insufficient_funds') {
              errorMessage = 'Insufficient funds. Please try a different card or add funds to your account.';
            } else if (error.code === 'incorrect_cvc') {
              errorMessage = 'Incorrect CVC. Please check your card details and try again.';
            } else if (error.code === 'expired_card') {
              errorMessage = 'Your card has expired. Please use a different card.';
            } else if (error.code === 'processing_error') {
              errorMessage = 'There was an error processing your card. Please try again in a few moments.';
              isRecoverable = true;
            }
            break;
          case 'validation_error':
            errorMessage = 'Please check your payment details and try again.';
            isRecoverable = true;
            break;
          case 'api_error':
            errorMessage = 'Payment service is temporarily unavailable. Please try again.';
            isRecoverable = true;
            break;
          case 'rate_limit_error':
            errorMessage = 'Too many payment attempts. Please wait a moment and try again.';
            isRecoverable = true;
            break;
          default:
            errorMessage = 'An unexpected error occurred. Please try again or contact support.';
            isRecoverable = false;
        }

        setError(errorMessage);
        onError(error);

        // Log specific error for monitoring
        logger.error('Payment confirmation failed', {
          error: error.type,
          code: error.code,
          message: errorMessage,
          recoverable: isRecoverable,
          timestamp: new Date().toISOString(),
        });

        toast aria-live="polite" aria-atomic="true"({
          title: 'Payment failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (paymentIntent) {
        // Log successful payment
        logger.info('Payment successful', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          timestamp: new Date().toISOString(),
        });

        onSuccess(paymentIntent.id);
        toast aria-live="polite" aria-atomic="true"({
          title: 'Payment successful',
          description: 'Your payment has been processed successfully',
        });
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.';

      setError(errorMessage);
      onError(err);

      // Log unexpected errors
      logger.error('Unexpected payment error', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });

      toast aria-live="polite" aria-atomic="true"({
        title: 'Payment error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: isApplePaySupported ? 'auto' : 'never',
            googlePay: isGooglePaySupported ? 'auto' : 'never',
          },
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              phone: 'auto',
            },
          },
          terms: {
            card: 'never',
            sepaDebit: 'never',
            ideal: 'never',
            usBankAccount: 'never',
          },
        }}
      />

      {/* Payment Security Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="w-3 h-3" />
        <span>Secured by 256-bit SSL encryption. Your card details are never stored.</span>
      </div>

      <Button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full bg-gradient-brand text-white"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing payment...
          </>
        ) : (
          `Pay ${amount ? new Intl.NumberFormat('en-PL', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount) : ''}`
        )}
      </Button>
    </form>
  );
};