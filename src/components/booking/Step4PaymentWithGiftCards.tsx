import { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle, Info, Loader2, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Elements , PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStripe, createPaymentIntent } from '@/lib/stripe';
import { GiftCardRedemption } from '@/components/giftcards/GiftCardRedemption';
import { GiftCardService } from '@/services/giftCard.service';

import type { GiftCardRedemptionResponse } from '@/types/gift-card';

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
    paymentMethod: 'card' | 'cash' | 'gift_card' | 'mixed';
    stripePaymentIntentId?: string;
    giftCardRedemptions?: GiftCardRedemptionResponse[];
    remainingAmount?: number;
  }) => void;
  onBack?: () => void;
}

export const Step4PaymentWithGiftCards = ({
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
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [useGiftCard, setUseGiftCard] = useState(false);
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [giftCardRedemptions, setGiftCardRedemptions] = useState<GiftCardRedemptionResponse[]>([]);
  const [stripePromise, setStripePromise] = useState<any>(null);

  const basePrice = service.price_from || 0;
  const remainingAmount = basePrice - giftCardAmount;
  const convertedPrice = convertPrice(basePrice);
  const formattedPrice = formatPrice(basePrice);
  const formattedRemainingAmount = formatPrice(remainingAmount);

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  const handleGiftCardRedemptionSuccess = (response: GiftCardRedemptionResponse) => {
    setGiftCardRedemptions(prev => [...prev, response]);
    setGiftCardAmount(prev => prev + (response.redeemed_amount || 0));
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // If using gift cards
      if (giftCardAmount > 0) {
        if (remainingAmount > 0) {
          // Partial payment with gift card + card/cash
          if (paymentMethod === 'card') {
            // Create Stripe payment intent for remaining amount
            const { client_secret, error } = await createPaymentIntent(
              remainingAmount,
              'PLN',
              { booking_id: 'temp_booking_id' }
            );

            if (!client_secret || error) {
              throw new Error('Failed to create payment intent');
            }

            onComplete({
              paymentMethod: 'mixed',
              stripePaymentIntentId: client_secret,
              giftCardRedemptions,
              remainingAmount,
            });
          } else {
            // Gift card + cash
            onComplete({
              paymentMethod: 'mixed',
              giftCardRedemptions,
              remainingAmount,
            });
          }
        } else {
          // Full payment with gift cards
          onComplete({
            paymentMethod: 'gift_card',
            giftCardRedemptions,
            remainingAmount: 0,
          });
        }
      } else {
        // Regular payment without gift cards
        if (paymentMethod === 'card') {
          const { client_secret, error } = await createPaymentIntent(
            basePrice,
            'PLN',
            { booking_id: 'temp_booking_id' }
          );

          if (!client_secret || error) {
            throw new Error('Failed to create payment intent');
          }

          onComplete({
            paymentMethod: 'card',
            stripePaymentIntentId: client_secret,
          });
        } else {
          onComplete({
            paymentMethod: 'cash',
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setProcessing(false);
    }
  };

  const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setProcessing(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success`,
          receipt_email: email,
        },
      });

      if (error) {
        console.error('Payment error:', error);
      }

      setProcessing(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button
          type="submit"
          disabled={processing || !stripe || !elements}
          className="w-full"
        >
          {processing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('payment.processing')}...</>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {remainingAmount > 0
                ? t('payment.payRemaining', 'Zapłać {{amount}}', { amount: formattedRemainingAmount })
                : t('payment.payNow', 'Zapłać teraz')}
            </>
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">{t('booking.summary')}</h3>

        <div className="p-4 rounded-2xl glass-subtle border border-champagne/15 space-y-3">
          {/* Service */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-pearl font-medium">{service.title}</div>
              <div className="text-pearl/60 text-sm">{service.duration_minutes || 60} {t('booking.minutes')}</div>
            </div>
            <div className="text-pearl font-semibold">{formattedPrice}</div>
          </div>

          {/* Date & Time */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between text-sm">
              <span className="text-pearl/60">{t('booking.date')}</span>
              <span className="text-pearl">{format(date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-pearl/60">{t('booking.time')}</span>
              <span className="text-pearl">{time}</span>
            </div>
          </div>

          {/* Client */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between text-sm">
              <span className="text-pearl/60">{t('booking.client')}</span>
              <span className="text-pearl">{fullName}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-pearl/60">{t('booking.email')}</span>
              <span className="text-pearl">{email}</span>
            </div>
          </div>

          {/* Gift Card Applied */}
          {giftCardAmount > 0 && (
            <div className="pt-3 border-t border-pearl/10">
              <div className="flex justify-between items-center">
                <span className="text-pearl/60 flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  {t('booking.giftCardApplied')}
                </span>
                <span className="text-green-400 font-medium">-{formatPrice(giftCardAmount)}</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-3 border-t border-pearl/10">
            <div className="flex justify-between items-center">
              <span className="text-pearl font-semibold">{t('booking.total')}</span>
              <span className="text-pearl font-bold text-xl">
                {remainingAmount > 0 ? formattedRemainingAmount : t('booking.paid')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Card Redemption */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pearl flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t('booking.haveGiftCard', 'Posiadasz voucher podarunkowy?')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseGiftCard(!useGiftCard)}
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            {useGiftCard ? t('common.hide') : t('common.use')}
          </Button>
        </div>

        {useGiftCard && (
          <GiftCardRedemption
            totalAmount={remainingAmount || basePrice}
            onRedemptionSuccess={handleGiftCardRedemptionSuccess}
            onAmountChange={(amount) => setGiftCardAmount(amount)}
          />
        )}
      </div>

      {/* Payment Method Selection - Only show if there's remaining amount */}
      {remainingAmount > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pearl">{t('payment.method')}</h3>

          <div className="grid grid-cols-1 gap-3">
            <label className={cn(
              "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
              paymentMethod === 'card'
                ? "border-champagne/40 bg-champagne/10"
                : "border-champagne/20 glass-subtle hover:border-champagne/30"
            )}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
                className="sr-only"
              />
              <CreditCard className="w-5 h-5 text-champagne mr-3" />
              <div className="flex-1">
                <div className="text-pearl font-medium">{t('payment.card')}</div>
                <div className="text-pearl/60 text-sm">{t('payment.cardDesc')}</div>
              </div>
            </label>

            <label className={cn(
              "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
              paymentMethod === 'cash'
                ? "border-champagne/40 bg-champagne/10"
                : "border-champagne/20 glass-subtle hover:border-champagne/30"
            )}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
                className="sr-only"
              />
              <div className="w-5 h-5 bg-champagne/20 rounded-full mr-3 flex items-center justify-center">
                <div className="w-2 h-2 bg-champagne rounded-full" />
              </div>
              <div className="flex-1">
                <div className="text-pearl font-medium">{t('payment.cash')}</div>
                <div className="text-pearl/60 text-sm">{t('payment.cashDesc')}</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {remainingAmount > 0 && paymentMethod === 'card' && stripePromise && (
        <Elements stripe={stripePromise} options={{ mode: 'payment', amount: remainingAmount * 100, currency: 'PLN' }}>
          <PaymentForm />
        </Elements>
      )}

      {/* Cash or Gift Card Only */}
      {((remainingAmount > 0 && paymentMethod === 'cash') || remainingAmount === 0) && (
        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 text-base font-semibold bg-gradient-to-r from-champagne to-copper hover:from-champagne/90 hover:to-copper/90 transition-all duration-200"
        >
          {processing ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('payment.processing')}...</>
          ) : remainingAmount === 0 ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              {t('booking.confirm', 'Potwierdź rezerwację')}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              {t('booking.confirmCash', 'Potwierdź rezerwację (płatność gotówką)')}
            </>
          )}
        </Button>
      )}

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2 text-xs text-pearl/60">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 rounded border-champagne/20 bg-champagne/10 text-champagne focus:ring-champagne/30"
        />
        <label htmlFor="terms" className="text-xs text-pearl/60">
          {t('booking.agree')} <a href="#" className="text-champagne hover:text-champagne/80 underline">{t('booking.terms')}</a> {t('booking.and')} <a href="#" className="text-champagne hover:text-champagne/80 underline">{t('booking.privacy')}</a>
        </label>
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="w-full py-3 text-pearl/60 hover:text-pearl transition-colors text-sm"
        >
          ← {t('booking.back')}
        </button>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center space-x-2 text-xs text-pearl/40">
        <Lock className="w-3 h-3" />
        <span>{t('payment.secure', 'Bezpieczna płatność')}</span>
      </div>
    </div>
  );
};