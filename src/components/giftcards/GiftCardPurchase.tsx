import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { CalendarIcon, CreditCard, Gift, Mail, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { GiftCardService } from '@/services/giftCard.service';
import { useCurrency } from '@/contexts/CurrencyContext';

import type { GiftCardPurchaseData } from '@/types/gift-card';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const predefinedAmounts = [100, 200, 300, 500, 750, 1000];
const cardDesigns = [
  { id: 'birthday', name: 'Urodziny', preview: '/assets/giftcards/birthday-preview.webp' },
  { id: 'holiday', name: 'Święta', preview: '/assets/giftcards/holiday-preview.webp' },
  { id: 'general', name: 'Uniwersalny', preview: '/assets/giftcards/general-preview.webp' },
  { id: 'custom', name: 'Własny projekt', preview: '/assets/giftcards/custom-preview.webp' },
];

export function GiftCardPurchase() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('general');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [purchaseData, setPurchaseData] = useState<GiftCardPurchaseData>({
    amount: 0,
    recipient_email: '',
    recipient_name: '',
    message: '',
    personalization: {
      design: 'general',
    },
    sender_name: '',
    sender_email: '',
  });

  const handleAmountChange = (value: string) => {
    setSelectedAmount(value);
    const amount = parseFloat(value);
    setPurchaseData(prev => ({ ...prev, amount }));
  };

  const handlePayment = async () => {
    if (!purchaseData.amount || !purchaseData.recipient_email || !purchaseData.recipient_name) {
      return;
    }

    setIsLoading(true);
    try {
      const { giftCard, paymentIntent } = await GiftCardService.createGiftCard({
        ...purchaseData,
        delivery_date: deliveryDate?.toISOString(),
        personalization: {
          ...purchaseData.personalization,
          design: selectedDesign as any,
        },
      });

      const stripe = await stripePromise;
      if (stripe && paymentIntent.client_secret) {
        const { error } = await stripe.confirmPayment({
          clientSecret: paymentIntent.client_secret,
          confirmParams: {
            return_url: `${window.location.origin}/gift-card/success?gift_card_id=${giftCard.id}`,
          },
        });

        if (error) {
          console.error('Payment error:', error);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = purchaseData.amount > 0 &&
                  purchaseData.recipient_email &&
                  purchaseData.recipient_name &&
                  purchaseData.sender_name &&
                  purchaseData.sender_email;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('giftCards.purchase.title', 'Podaruj Voucher Podarunkowy')}</h1>
        <p className="text-muted-foreground">
          {t('giftCards.purchase.subtitle', 'Idealny prezent dla bliskiej osoby')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Purchase Form */}
        <div className="space-y-6">
          {/* Amount Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('giftCards.purchase.selectAmount', 'Wybierz kwotę')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedAmount} onValueChange={handleAmountChange}>
                <div className="grid grid-cols-3 gap-3">
                  {predefinedAmounts.map((amount) => (
                    <div key={amount}>
                      <RadioGroupItem
                        value={amount.toString()}
                        id={`amount-${amount}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`amount-${amount}`}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                        )}
                      >
                        <span className="text-lg font-semibold">{formatPrice(amount)}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">lub</span>
                <Input
                  type="number"
                  placeholder={t('giftCards.purchase.customAmount', 'Własna kwota')}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    handleAmountChange(e.target.value);
                  }}
                  min={50}
                  max={5000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recipient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('giftCards.purchase.recipientInfo', 'Dane obdarowywanej osoby')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient-name">{t('giftCards.purchase.recipientName', 'Imię i nazwisko')}</Label>
                <Input
                  id="recipient-name"
                  value={purchaseData.recipient_name}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, recipient_name: e.target.value }))}
                  placeholder="Anna Kowalska"
                />
              </div>
              <div>
                <Label htmlFor="recipient-email">{t('giftCards.purchase.recipientEmail', 'Email')}</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={purchaseData.recipient_email}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, recipient_email: e.target.value }))}
                  placeholder="anna@example.com"
                />
              </div>
              <div>
                <Label htmlFor="message">{t('giftCards.purchase.message', 'Wiadomość (opcjonalnie)')}</Label>
                <Textarea
                  id="message"
                  value={purchaseData.message}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Wszystkiego najlepszego!..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('giftCards.purchase.deliveryOptions', 'Opcje dostawy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('giftCards.purchase.deliveryDate', 'Data dostarczenia')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "PPP") : t('giftCards.purchase.pickDate', 'Wybierz datę')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Design Preview and Summary */}
        <div className="space-y-6">
          {/* Card Design Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('giftCards.purchase.cardDesign', 'Wygląd karty')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedDesign} onValueChange={setSelectedDesign}>
                <div className="grid grid-cols-2 gap-4">
                  {cardDesigns.map((design) => (
                    <div key={design.id}>
                      <RadioGroupItem
                        value={design.id}
                        id={`design-${design.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`design-${design.id}`}
                        className="cursor-pointer"
                      >
                        <div className={cn(
                          "relative overflow-hidden rounded-lg border-2 transition-all",
                          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20"
                        )}>
                          <img
                            src={design.preview}
                            alt={design.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-medium">{design.name}</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Your Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('giftCards.purchase.yourInfo', 'Twoje dane')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender-name">{t('giftCards.purchase.yourName', 'Twoje imię')}</Label>
                <Input
                  id="sender-name"
                  value={purchaseData.sender_name}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, sender_name: e.target.value }))}
                  placeholder="Jan Nowak"
                />
              </div>
              <div>
                <Label htmlFor="sender-email">{t('giftCards.purchase.yourEmail', 'Twój email')}</Label>
                <Input
                  id="sender-email"
                  type="email"
                  value={purchaseData.sender_email}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, sender_email: e.target.value }))}
                  placeholder="jan@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('giftCards.purchase.summary', 'Podsumowanie')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>{t('giftCards.purchase.cardValue', 'Wartość vouchera')}</span>
                <span className="font-semibold">{formatPrice(purchaseData.amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('giftCards.purchase.total', 'Razem')}</span>
                <span>{formatPrice(purchaseData.amount)}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!isValid || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>{t('giftCards.purchase.processing', 'Przetwarzanie...')}</>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    {t('giftCards.purchase.payNow', 'Zapłać teraz')}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {t('giftCards.purchase.terms', 'Klikając przycisk, akceptujesz regulamin i politykę prywatności')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}