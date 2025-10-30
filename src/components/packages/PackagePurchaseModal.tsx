import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Gift,
  Package,
  Check,
  AlertTriangle,
  Calendar,
  Users,
  Shield,
  Star
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { ServicePackage, ClientPackage , packageService } from '@/services/packageService';

interface PackagePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: ServicePackage | null;
  onSuccess?: (clientPackage: ClientPackage) => void;
  preSelectedGiftRecipient?: string;
}

const PackagePurchaseModal: React.FC<PackagePurchaseModalProps> = ({
  isOpen,
  onClose,
  package: pkg,
  onSuccess,
  preSelectedGiftRecipient
}) => {
  const { i18n } = useTranslation();
  const { formatPrice, currency } = useCurrency();
  const { user } = useAuth();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [purchaseType, setPurchaseType] = useState<'self' | 'gift'>('self');
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash' | 'bank_transfer'>('stripe');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Stripe
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (isOpen && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
    }
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedGiftRecipient) {
      setPurchaseType('gift');
      setGiftRecipient(preSelectedGiftRecipient);
    }
  }, [preSelectedGiftRecipient]);

  const handlePurchase = async () => {
    if (!user || !pkg) return;

    // Validation
    if (!acceptTerms || !acceptPrivacy) {
      toast aria-live="polite" aria-atomic="true"({
        title: i18n.t('validation.required', 'Required'),
        description: i18n.t('package.acceptTermsRequired', 'You must accept the terms and privacy policy to proceed.'),
        variant: 'destructive',
      });
      return;
    }

    if (purchaseType === 'gift' && !giftRecipient) {
      toast aria-live="polite" aria-atomic="true"({
        title: i18n.t('validation.required', 'Required'),
        description: i18n.t('package.recipientRequired', 'Please enter the gift recipient email.'),
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'stripe') {
        if (!stripePromise) {
          throw new Error('Stripe is not available');
        }

        // Create Stripe checkout session
        const response = await fetch('/api/create-package-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            package_id: pkg.id,
            user_id: user.id,
            purchase_type: purchaseType,
            gift_recipient: purchaseType === 'gift' ? giftRecipient : undefined,
            gift_message: purchaseType === 'gift' ? giftMessage : undefined,
            notes,
          }),
        });

        const { sessionId, error } = await response.json();

        if (error) {
          throw new Error(error);
        }

        const stripe = await stripePromise;
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        // The page will redirect, so we don't need to handle success here
      } else {
        // Non-Stripe payment (cash/bank transfer)
        const clientPackage = await packageService.purchasePackage({
          client_id: user.id,
          package_id: pkg.id,
          payment_method: paymentMethod,
          gift_to: purchaseType === 'gift' ? giftRecipient : undefined,
          gift_message: purchaseType === 'gift' ? giftMessage : undefined,
          purchase_notes: notes,
        });

        toast aria-live="polite" aria-atomic="true"({
          title: i18n.t('package.purchaseSuccess', 'Package Purchased!'),
          description: i18n.t('package.purchaseSuccessDesc', 'Your package has been successfully purchased.'),
        });

        if (onSuccess) {
          onSuccess(clientPackage);
        }

        handleClose();
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: i18n.t('error.purchaseFailed', 'Purchase Failed'),
        description: error.message || i18n.t('error.purchaseFailedDesc', 'Failed to process your purchase. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      // Reset form
      setPurchaseType('self');
      setGiftRecipient('');
      setGiftMessage('');
      setNotes('');
      setPaymentMethod('stripe');
      setAcceptTerms(false);
      setAcceptPrivacy(false);
      onClose();
    }
  };

  if (!pkg) return null;

  const finalPrice = pkg.package_price;
  const originalPrice = pkg.original_price || 0;
  const savings = originalPrice > finalPrice ? originalPrice - finalPrice : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl glass-card border-champagne/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Package className="w-6 h-6 text-champagne-200" />
            {i18n.t('package.purchaseTitle', 'Purchase Package')}
          </DialogTitle>
          <DialogDescription>
            {i18n.t('package.purchaseDesc', 'Complete your package purchase below')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Package Summary */}
          <div className="glass-card p-6 rounded-xl border border-champagne/20">
            <div className="flex gap-4">
              {pkg.image_url && (
                <img
                  src={pkg.image_url}
                  alt={pkg.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-pearl mb-2">
                  {pkg.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">
                    {pkg.service?.service_type}
                  </Badge>
                  <Badge variant="outline">
                    {pkg.session_count} {i18n.t('package.sessions', 'sessions')}
                  </Badge>
                  <Badge variant="outline">
                    {pkg.validity_days} {i18n.t('package.days', 'days')}
                  </Badge>
                </div>
                {pkg.description && (
                  <p className="text-sm text-pearl/70">
                    {pkg.description}
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-pearl/70">{i18n.t('package.pricePerSession', 'Price per session')}</span>
                <span className="text-pearl/90">
                  {formatPrice(finalPrice / pkg.session_count)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-pearl/70">{i18n.t('package.totalSessions', 'Total sessions')}</span>
                <span className="text-pearl/90">{pkg.session_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-pearl/70">{i18n.t('package.validity', 'Validity')}</span>
                <span className="text-pearl/90">{pkg.validity_days} {i18n.t('package.days', 'days')}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between items-center text-green-500">
                  <span>{i18n.t('package.savings', 'You save')}</span>
                  <span className="font-semibold">{formatPrice(savings)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{i18n.t('package.totalPrice', 'Total Price')}</span>
                <span className="text-pearl">{formatPrice(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Purchase Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-pearl">
              {i18n.t('package.purchaseType', 'Purchase Type')}
            </Label>
            <RadioGroup value={purchaseType} onValueChange={(value: any) => setPurchaseType(value)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-champagne/20 hover:bg-white/5">
                <RadioGroupItem value="self" id="self" />
                <Label htmlFor="self" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-champagne-200" />
                    <div>
                      <div className="font-medium text-pearl">
                        {i18n.t('package.forMyself', 'For myself')}
                      </div>
                      <div className="text-sm text-pearl/60">
                        {i18n.t('package.forMyselfDesc', 'I\'m buying this package for my own use')}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-champagne/20 hover:bg-white/5">
                <RadioGroupItem value="gift" id="gift" />
                <Label htmlFor="gift" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-champagne-200" />
                    <div>
                      <div className="font-medium text-pearl">
                        {i18n.t('package.asGift', 'As a gift')}
                      </div>
                      <div className="text-sm text-pearl/60">
                        {i18n.t('package.asGiftDesc', 'I\'m buying this package for someone else')}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Gift Details */}
          {purchaseType === 'gift' && (
            <div className="space-y-3">
              <Label htmlFor="giftRecipient" className="text-base font-medium text-pearl">
                {i18n.t('package.giftRecipient', 'Gift Recipient Email')}
              </Label>
              <Input
                id="giftRecipient"
                type="email"
                value={giftRecipient}
                onChange={(e) => setGiftRecipient(e.target.value)}
                placeholder={i18n.t('package.emailPlaceholder', 'Enter recipient email')}
                className="glass-subtle border-champagne/20"
              />
              <Label htmlFor="giftMessage" className="text-base font-medium text-pearl">
                {i18n.t('package.giftMessage', 'Gift Message (Optional)')}
              </Label>
              <Textarea
                id="giftMessage"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder={i18n.t('package.giftMessagePlaceholder', 'Add a personal message...')}
                rows={3}
                className="glass-subtle border-champagne/20 resize-none"
              />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-pearl">
              {i18n.t('package.paymentMethod', 'Payment Method')}
            </Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-champagne/20 hover:bg-white/5">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-champagne-200" />
                    <div>
                      <div className="font-medium text-pearl">
                        {i18n.t('payment.card', 'Credit/Debit Card')}
                      </div>
                      <div className="text-sm text-pearl/60">
                        {i18n.t('payment.cardDesc', 'Secure payment via Stripe')}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-champagne/20 hover:bg-white/5">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-champagne-200" />
                    <div>
                      <div className="font-medium text-pearl">
                        {i18n.t('payment.bankTransfer', 'Bank Transfer')}
                      </div>
                      <div className="text-sm text-pearl/60">
                        {i18n.t('payment.bankTransferDesc', 'Manual bank transfer')}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium text-pearl">
              {i18n.t('package.notes', 'Notes (Optional)')}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={i18n.t('package.notesPlaceholder', 'Any special requests or notes...')}
              rows={3}
              className="glass-subtle border-champagne/20 resize-none"
            />
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-pearl/80 leading-relaxed cursor-pointer">
                  {i18n.t(
                    'package.acceptTerms',
                    'I agree to the {{link}}Terms and Conditions{{/link}} for this package purchase.',
                    {
                      link: `<a href="/terms" target="_blank" rel="noopener noreferrer" class="text-champagne-200 hover:text-champagne-100 underline">`,
                      '/link': '</a>'
                    }
                  )}
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                />
                <Label htmlFor="privacy" className="text-sm text-pearl/80 leading-relaxed cursor-pointer">
                  {i18n.t(
                    'package.acceptPrivacy',
                    'I agree to the {{link}}Privacy Policy{{/link}}.',
                    {
                      link: `<a href="/privacy" target="_blank" rel="noopener noreferrer" class="text-champagne-200 hover:text-champagne-100 underline">`,
                      '/link': '</a>'
                    }
                  )}
                </Label>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {i18n.t(
                  'package.cancellationNotice',
                  'Please note: Package purchases are non-refundable. Sessions must be used within {{days}} days of purchase.',
                  { days: pkg.validity_days }
                )}
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {i18n.t('general.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || !acceptTerms || !acceptPrivacy || (purchaseType === 'gift' && !giftRecipient)}
            className="w-full sm:w-auto bg-gradient-brand text-brand-foreground shadow-luxury hover:shadow-luxury-lg"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                {i18n.t('general.processing', 'Processing...')}
              </>
            ) : (
              <>
                {paymentMethod === 'stripe' && <CreditCard className="w-4 h-4 mr-2" />}
                <Package className="w-4 h-4 mr-2" />
                {purchaseType === 'gift'
                  ? i18n.t('package.purchaseGift', 'Purchase as Gift')
                  : i18n.t('package.purchase', 'Purchase Package')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PackagePurchaseModal;