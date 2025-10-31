import React, { useState } from 'react';
import { CalendarIcon, Gift, CreditCard, Mail, Send } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useGiftCardForm, usePurchaseGiftCard } from '@/hooks/usePaymentSystem';
import { GiftCard } from '@/types/payment-loyalty';

interface GiftCardPurchaseProps {
  onSuccess?: (giftCard: GiftCard) => void;
  onCancel?: () => void;
  purchaserId: string;
}

const PRESET_AMOUNTS = [100, 200, 300, 500, 750, 1000];

export function GiftCardPurchase({ onSuccess, onCancel, purchaserId }: GiftCardPurchaseProps) {
  const { formData, errors, validateForm, updateField, resetForm } = useGiftCardForm();
  const purchaseGiftCard = usePurchaseGiftCard();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetAmount = (amount: number) => {
    updateField('amount', amount);
    setSelectedPreset(amount);
  };

  const handleCustomAmount = (amount: number) => {
    updateField('amount', amount);
    setSelectedPreset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await purchaseGiftCard.mutateAsync({
      amount: formData.amount,
      currency: 'PLN',
      recipientEmail: formData.recipientEmail,
      recipientId: undefined, // Would be populated if user selects from existing users
      personalMessage: formData.personalMessage || undefined,
      purchaserId,
      validFrom: formData.sendImmediately ? new Date() : new Date(formData.scheduledDate)
    });

    if (result.success && result.data) {
      onSuccess?.(result.data);
      resetForm();
    }
  };

  if (purchaseGiftCard.isPending) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processing gift card purchase...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Purchase Gift Card
        </CardTitle>
        <CardDescription>
          Give the gift of beauty and wellness with a mariiaborysevych gift card
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {purchaseGiftCard.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {purchaseGiftCard.error.message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Amount</Label>

            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedPreset === amount ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handlePresetAmount(amount)}
                >
                  {amount} PLN
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount">Custom Amount</Label>
              <Input
                id="customAmount"
                type="number"
                min="50"
                max="10000"
                step="10"
                placeholder="Enter custom amount"
                value={selectedPreset ? '' : formData.amount}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  handleCustomAmount(amount);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: 50 PLN | Maximum: 10,000 PLN
              </p>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Delivery Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Delivery Options</Label>

            <RadioGroup
              value={formData.sendImmediately ? 'immediate' : 'scheduled'}
              onValueChange={(value) => updateField('sendImmediately', value === 'immediate')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate">Send Immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled">Schedule for Later</Label>
              </div>
            </RadioGroup>

            {!formData.sendImmediately && (
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledDate ? (
                        format(new Date(formData.scheduledDate), "PPP", { locale: pl })
                      ) : (
                        "Pick a date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate ? new Date(formData.scheduledDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          updateField('scheduledDate', date.toISOString());
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.scheduledDate && (
                  <p className="text-sm text-destructive">{errors.scheduledDate}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Recipient Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Recipient Information</Label>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email Address *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="recipient@example.com"
                value={formData.recipientEmail}
                onChange={(e) => updateField('recipientEmail', e.target.value)}
              />
              {errors.recipientEmail && (
                <p className="text-sm text-destructive">{errors.recipientEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                placeholder="Jane Doe"
                value={formData.recipientName}
                onChange={(e) => updateField('recipientName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
              <Textarea
                id="personalMessage"
                placeholder="Write a personal message to the recipient..."
                value={formData.personalMessage}
                onChange={(e) => updateField('personalMessage', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {formData.personalMessage?.length || 0}/500 characters
              </p>
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Gift Card Amount:</span>
                  <span className="font-semibold">{formData.amount.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="text-green-600">0.00 PLN</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formData.amount.toFixed(2)} PLN</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <div className="space-y-3">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                The gift card will be sent to the recipient's email address.
                Gift cards are valid for 2 years from the date of issue.
              </AlertDescription>
            </Alert>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={purchaseGiftCard.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={purchaseGiftCard.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Purchase Gift Card
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}