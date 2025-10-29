import { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Elements } from '@stripe/react-stripe-js';

import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStripe, createPaymentIntent } from '@/lib/stripe';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

import { StripePaymentForm } from './StripePaymentForm';

interface Service {
  id: string;
  title: string;
  price_from?: number;
  duration_minutes?: number;
}

interface Step4Props {
  service: Service;
  date: Date;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  onComplete: (data: {
    paymentMethod: 'card' | 'cash';
    stripePaymentIntentId?: string;
  }) => void;
  onBack?: () => void;
}

export const Step4Payment = ({
  service,
  date,
  time,
  fullName,
  email,
  phone,
  onComplete,
  onBack,
}: Step4Props) => {
  const { t } = useTranslation();
  const { convertPrice, formatPrice } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const { toast } = useToast();
  const stripePromise = getStripe();

  const [agreedToTerms, setAgreedToTerms] = useState(true); // Already agreed in Step 3

  const basePrice = service.price_from || 0;
  const convertedPrice = convertPrice(basePrice);
  const formattedPrice = formatPrice(basePrice);

  // Create payment intent when card payment is selected
  useEffect(() => {
    if (paymentMethod === 'card' && !clientSecret && !paymentError) {
      initializePaymentIntent();
    }
  }, [paymentMethod]);

  const initializePaymentIntent = async () => {
    setIsLoadingStripe(true);
    setPaymentError(null);

    try {
      // Log payment intent creation attempt
      logger.info('Initializing payment intent', {
        serviceId: service.id,
        serviceTitle: service.title,
        amount: basePrice,
        currency: 'pln',
        customerEmail: email,
        customerName: fullName,
      });

      const { clientSecret: secret, paymentIntentId } = await createPaymentIntent(
        basePrice,
        'pln',
        {
          service_id: service.id,
          service_title: service.title,
          customer_email: email,
          customer_name: fullName,
          customer_phone: phone,
          booking_date: date.toISOString(),
          booking_time: time,
        },
        {
          email,
          name: fullName,
        }
      );

      if (secret) {
        setClientSecret(secret);
        logger.info('Payment intent created successfully', {
          paymentIntentId,
          clientSecret: secret.substring(0, 10) + '...', // Log partial secret for security
        });
      } else {
        throw new Error('No client secret returned from payment intent creation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
      setPaymentError(errorMessage);

      logger.error('Payment intent creation failed', {
        error: errorMessage,
        serviceId: service.id,
        customerEmail: email,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: 'Payment initialization failed',
        description: 'Unable to initialize payment. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    logger.info('Payment completed successfully', {
      paymentIntentId,
      serviceId: service.id,
      customerEmail: email,
      timestamp: new Date().toISOString(),
    });

    onComplete({
      paymentMethod: 'card',
      stripePaymentIntentId: paymentIntentId,
    });
    setProcessing(false);
  };

  const handlePaymentError = (error: Error) => {
    logger.error('Payment processing failed', {
      error: error.message,
      serviceId: service.id,
      customerEmail: email,
      timestamp: new Date().toISOString(),
    });

    setPaymentError(error.message);
    setProcessing(false);
  };

  const handleCashPayment = () => {
    setProcessing(true);

    // Log cash payment selection
    logger.info('Cash payment selected', {
      serviceId: service.id,
      serviceTitle: service.title,
      amount: basePrice,
      customerEmail: email,
      customerName: fullName,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      onComplete({
        paymentMethod: 'cash',
      });
      setProcessing(false);
    }, 1000); // Brief processing for UX
  };

  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      handleCashPayment();
    }
    // Card payment is handled by StripePaymentForm
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Booking summary</h3>
        
        <div className="p-4 rounded-2xl glass-subtle border border-champagne/15 space-y-3">
          {/* Service */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-pearl font-medium">{service.title}</div>
              <div className="text-pearl/60 text-sm">{service.duration_minutes || 60} minutes</div>
            </div>
            <div className="text-pearl font-semibold">{formattedPrice}</div>
          </div>
          
          {/* Date & Time */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between text-sm">
              <span className="text-pearl/60">Date</span>
              <span className="text-pearl">{format(date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-pearl/60">Time</span>
              <span className="text-pearl">{time}</span>
            </div>
          </div>
          
          {/* Client */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between text-sm">
              <span className="text-pearl/60">Client</span>
              <span className="text-pearl">{fullName}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-pearl/60">Contact</span>
              <span className="text-pearl">{phone}</span>
            </div>
          </div>
          
          {/* Total */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between items-center">
              <span className="text-pearl font-semibold">Total</span>
              <span className="text-xl font-bold text-champagne">{formattedPrice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-pearl">Payment method</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all",
              paymentMethod === 'card'
                ? "border-champagne/50 glass-card text-pearl"
                : "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
            )}
            disabled={processing}
          >
            <CreditCard className="w-5 h-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Card</div>
            <div className="text-xs opacity-60">Secure online</div>
            <div className="text-xs text-champagne">✓ Apple/Google Pay</div>
          </button>

          <button
            onClick={() => setPaymentMethod('cash')}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all",
              paymentMethod === 'cash'
                ? "border-champagne/50 glass-card text-pearl"
                : "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
            )}
            disabled={processing}
          >
            <div className="text-xl mb-2">💵</div>
            <div className="text-sm font-medium">Cash</div>
            <div className="text-xs opacity-60">Pay at venue</div>
          </button>
        </div>

        {/* Payment Error Display */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {/* Payment Info */}
        {paymentMethod === 'card' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm text-pearl/80">
                  Your payment is processed securely by Stripe. Your card details are never stored on our servers.
                </div>
              </div>
            </div>

            {/* Stripe Payment Form */}
            {isLoadingStripe ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-champagne" />
                  <span className="text-pearl/80">Initializing secure payment...</span>
                </div>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={basePrice}
                  currency="pln"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            ) : (
              <div className="text-center py-4">
                <Button
                  onClick={initializePaymentIntent}
                  variant="outline"
                  className="border-champagne/30 text-pearl hover:bg-champagne/10"
                >
                  Retry Payment Setup
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 mt-0.5" />
              <div className="text-sm text-pearl/80">
                Please bring exact change. A 50 PLN cancellation fee applies for no-shows or late cancellations (less than 24 hours).
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 py-4">
        <div className="flex items-center gap-2 text-xs text-pearl/60">
          <Lock className="w-4 h-4" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-pearl/60">
          <CheckCircle className="w-4 h-4" />
          <span>PCI Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-pearl/60">
          <CheckCircle className="w-4 h-4" />
          <span>Secure checkout</span>
        </div>
      </div>

      {/* Action button - only show for cash payment since card has its own form */}
      {paymentMethod === 'cash' && (
        <Button
          onClick={handlePayment}
          disabled={processing}
          size="lg"
          className="w-full bg-gradient-brand text-white"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Confirm cash booking'
          )}
        </Button>
      )}

      {/* Terms reminder */}
      <p className="text-xs text-pearl/60 text-center">
        By confirming, you agree to our{' '}
        <a href="/policies" target="_blank" className="text-champagne hover:text-champagne-400 underline">
          terms & conditions
        </a>{' '}
        and{' '}
        <a href="/policies" target="_blank" className="text-champagne hover:text-champagne-400 underline">
          cancellation policy
        </a>
      </p>
    </div>
  );
};