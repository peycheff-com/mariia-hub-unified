import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GiftCardService } from '@/services/giftCard.service';
import { useCurrency } from '@/contexts/CurrencyContext';

import type { GiftCardBalanceResponse, GiftCardRedemptionResponse } from '@/types/gift-card';

interface GiftCardRedemptionProps {
  totalAmount: number;
  onRedemptionSuccess: (response: GiftCardRedemptionResponse) => void;
  onAmountChange: (amount: number) => void;
}

export function GiftCardRedemption({ totalAmount, onRedemptionSuccess, onAmountChange }: GiftCardRedemptionProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [cardCode, setCardCode] = useState('');
  const [balanceResponse, setBalanceResponse] = useState<GiftCardBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemedAmount, setRedeemedAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleCheckBalance = async () => {
    if (!cardCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setBalanceResponse(null);

    try {
      const response = await GiftCardService.checkGiftCardBalance(cardCode);
      setBalanceResponse(response);

      if (response.success && response.current_balance) {
        const maxRedeemable = Math.min(response.current_balance, totalAmount - redeemedAmount);
        if (maxRedeemable > 0) {
          setRedeemedAmount(maxRedeemable);
          onAmountChange(maxRedeemable);
        }
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      setError(t('giftCards.redemption.error.checking', 'Nie udało się sprawdzić salda karty'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!balanceResponse?.success || redeemedAmount <= 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await GiftCardService.redeemGiftCard(
        cardCode,
        redeemedAmount,
        undefined,
        'booking',
        t('giftCards.redemption.description', 'Opłata za rezerwację usługi')
      );

      if (response.success) {
        onRedemptionSuccess(response);
        setCardCode('');
        setBalanceResponse(null);
        setRedeemedAmount(0);
      } else {
        setError(response.error || t('giftCards.redemption.error.failed', 'Nie udało się zrealizować vouchera'));
      }
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      setError(t('giftCards.redemption.error.general', 'Wystąpił błąd podczas realizacji vouchera'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: number) => {
    const max = balanceResponse?.current_balance || totalAmount;
    const newAmount = Math.min(value, max, totalAmount);
    setRedeemedAmount(newAmount);
    onAmountChange(newAmount);
  };

  const getCardStatus = () => {
    if (!balanceResponse?.success) return 'invalid';
    if (!balanceResponse.is_active) return 'inactive';
    if (balanceResponse.expiry_date && new Date(balanceResponse.expiry_date) < new Date()) return 'expired';
    if (balanceResponse.current_balance === 0) return 'empty';
    return 'valid';
  };

  const statusConfig = {
    valid: { icon: CheckCircle, color: 'text-green-600', label: t('giftCards.redemption.status.valid', 'Ważna') },
    invalid: { icon: XCircle, color: 'text-red-600', label: t('giftCards.redemption.status.invalid', 'Nieprawidłowa') },
    inactive: { icon: XCircle, color: 'text-red-600', label: t('giftCards.redemption.status.inactive', 'Nieaktywna') },
    expired: { icon: Clock, color: 'text-orange-600', label: t('giftCards.redemption.status.expired', 'Wygasła') },
    empty: { icon: XCircle, color: 'text-gray-600', label: t('giftCards.redemption.status.empty', 'Brak środków') },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {t('giftCards.redemption.title', 'Zrealizuj Voucher Podarunkowy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-code">{t('giftCards.redemption.cardCode', 'Kod vouchera')}</Label>
          <div className="flex gap-2">
            <Input
              id="card-code"
              placeholder="MH-XXXXXXXXXXXX-X"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={16}
            />
            <Button
              onClick={handleCheckBalance}
              disabled={!cardCode.trim() || isLoading}
              variant="outline"
            >
              {isLoading ? t('giftCards.redemption.checking', 'Sprawdzanie...') : t('giftCards.redemption.check', 'Sprawdź')}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {balanceResponse && (
          <>
            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('giftCards.redemption.status.label', 'Status karty')}</span>
                <Badge
                  variant={getCardStatus() === 'valid' ? 'default' : 'secondary'}
                  className={cn(statusConfig[getCardStatus()].color, 'gap-1')}
                >
                  {React.createElement(statusConfig[getCardStatus()].icon, { className: 'h-3 w-3' })}
                  {statusConfig[getCardStatus()].label}
                </Badge>
              </div>

              {balanceResponse.success && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('giftCards.redemption.currentBalance', 'Aktualne saldo')}</span>
                    <span className="font-semibold">{formatPrice(balanceResponse.current_balance || 0)}</span>
                  </div>

                  {balanceResponse.expiry_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('giftCards.redemption.expiryDate', 'Data ważności')}</span>
                      <span className="text-sm">
                        {new Date(balanceResponse.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {balanceResponse.recipient_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('giftCards.redemption.recipient', 'Odbiorca')}</span>
                      <span className="text-sm">{balanceResponse.recipient_name}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {balanceResponse.success && balanceResponse.current_balance > 0 && (
              <>
                <Separator />

                <div className="space-y-3">
                  <Label>{t('giftCards.redemption.redeemAmount', 'Kwota do realizacji')}</Label>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={redeemedAmount}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={Math.min(balanceResponse.current_balance, totalAmount)}
                        step={0.01}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {t('giftCards.redemption.available', 'Dostępne')}
                      </div>
                      <div className="font-semibold">
                        {formatPrice(Math.min(balanceResponse.current_balance, totalAmount))}
                      </div>
                    </div>
                  </div>

                  {redeemedAmount > 0 && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span>{t('giftCards.redemption.remainingAfter', 'Saldo po realizacji')}</span>
                        <span className="font-medium">
                          {formatPrice(balanceResponse.current_balance - redeemedAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleRedeem}
                    disabled={redeemedAmount <= 0 || isLoading || getCardStatus() !== 'valid'}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>{t('giftCards.redemption.processing', 'Przetwarzanie...')}</>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('giftCards.redemption.redeemButton', 'Zrealizuj voucher')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• {t('giftCards.redemption.note1', 'Wprowadź kod vouchera aby sprawdzić dostępne saldo')}</p>
          <p>• {t('giftCards.redemption.note2', 'Możesz zrealizować częściową wartość vouchera')}</p>
          <p>• {t('giftCards.redemption.note3', 'Pozostała kwota zostanie zapisana na przyszłość')}</p>
        </div>
      </CardContent>
    </Card>
  );
}