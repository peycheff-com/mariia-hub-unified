import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, CheckCircle, XCircle, Clock, Search, Calendar, User, CreditCard } from 'lucide-react';

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

import type { GiftCardBalanceResponse } from '@/types/gift-card';

export function GiftCardBalanceLookup() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [cardCode, setCardCode] = useState('');
  const [balanceResponse, setBalanceResponse] = useState<GiftCardBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await GiftCardService.checkGiftCardBalance(cardCode);
      setBalanceResponse(response);
    } catch (error) {
      console.error('Error checking balance:', error);
      setError(t('giftCards.balance.error.checking', 'Nie udało się sprawdzić salda karty'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCardStatus = () => {
    if (!balanceResponse?.success) return 'invalid';
    if (!balanceResponse.is_active) return 'inactive';
    if (balanceResponse.expiry_date && new Date(balanceResponse.expiry_date) < new Date()) return 'expired';
    if (balanceResponse.current_balance === 0) return 'empty';
    return 'valid';
  };

  const statusConfig = {
    valid: { icon: CheckCircle, color: 'text-green-600', label: t('giftCards.balance.status.valid', 'Ważna') },
    invalid: { icon: XCircle, color: 'text-red-600', label: t('giftCards.balance.status.invalid', 'Nieprawidłowa') },
    inactive: { icon: XCircle, color: 'text-red-600', label: t('giftCards.balance.status.inactive', 'Nieaktywna') },
    expired: { icon: Clock, color: 'text-orange-600', label: t('giftCards.balance.status.expired', 'Wygasła') },
    empty: { icon: XCircle, color: 'text-gray-600', label: t('giftCards.balance.status.empty', 'Brak środków') },
  };

  const isExpired = balanceResponse?.expiry_date && new Date(balanceResponse.expiry_date) < new Date();
  const daysUntilExpiry = balanceResponse?.expiry_date
    ? Math.ceil((new Date(balanceResponse.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('giftCards.balance.title', 'Sprawdź Saldo Vouchera')}</h1>
        <p className="text-muted-foreground">
          {t('giftCards.balance.subtitle', 'Wprowadź kod vouchera, aby sprawdzić dostępne środki')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('giftCards.balance.lookup', 'Wyszukaj voucher')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckBalance} className="space-y-4">
            <div>
              <Label htmlFor="card-code">{t('giftCards.balance.cardCode', 'Kod vouchera')}</Label>
              <Input
                id="card-code"
                placeholder="MH-XXXXXXXXXXXX-X"
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                className="font-mono text-lg"
                maxLength={16}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={!cardCode.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>{t('giftCards.balance.checking', 'Sprawdzanie...')}</>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t('giftCards.balance.checkButton', 'Sprawdź saldo')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {balanceResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('giftCards.balance.details', 'Szczegóły vouchera')}
              </span>
              <Badge
                variant={getCardStatus() === 'valid' ? 'default' : 'secondary'}
                className={cn(statusConfig[getCardStatus()].color, 'gap-1')}
              >
                {React.createElement(statusConfig[getCardStatus()].icon, { className: 'h-3 w-3' })}
                {statusConfig[getCardStatus()].label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {balanceResponse.success ? (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('giftCards.balance.cardCode')}</p>
                      <p className="font-mono font-semibold">{balanceResponse.card_code}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{t('giftCards.balance.currentBalance')}</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(balanceResponse.current_balance || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{t('giftCards.balance.originalBalance')}</p>
                      <p className="font-medium">{formatPrice(balanceResponse.initial_balance || 0)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{t('giftCards.balance.currency')}</p>
                      <p className="font-medium">{balanceResponse.currency}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {balanceResponse.recipient_name && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {t('giftCards.balance.recipient')}
                        </p>
                        <p className="font-medium">{balanceResponse.recipient_name}</p>
                      </div>
                    )}

                    {balanceResponse.expiry_date && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t('giftCards.balance.expiryDate')}
                        </p>
                        <p className="font-medium">
                          {new Date(balanceResponse.expiry_date).toLocaleDateString()}
                        </p>
                        <p className={cn(
                          "text-xs mt-1",
                          isExpired ? "text-red-600" : daysUntilExpiry && daysUntilExpiry <= 30 ? "text-orange-600" : "text-muted-foreground"
                        )}>
                          {isExpired
                            ? t('giftCards.balance.expired', 'Voucher wygasł')
                            : daysUntilExpiry !== null
                            ? t('giftCards.balance.expiresIn', 'Wygasa za {{days}} dni', { days: daysUntilExpiry })
                            : t('giftCards.balance.neverExpires', 'Nie ograniczony czasowo')
                          }
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {t('giftCards.balance.status')}
                      </p>
                      <p className="font-medium">{statusConfig[getCardStatus()].label}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">{t('giftCards.balance.usageInfo', 'Informacje o wykorzystaniu')}</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground">{t('giftCards.balance.usedAmount')}</p>
                      <p className="font-semibold text-lg">
                        {formatPrice((balanceResponse.initial_balance || 0) - (balanceResponse.current_balance || 0))}
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground">{t('giftCards.balance.remainingAmount')}</p>
                      <p className="font-semibold text-lg text-primary">
                        {formatPrice(balanceResponse.current_balance || 0)}
                      </p>
                    </div>
                  </div>

                  {balanceResponse.current_balance > 0 && balanceResponse.is_active && !isExpired && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('giftCards.balance.canUse', 'Voucher jest aktywny i gotowy do użycia! Możesz go zrealizować podczas składania rezerwacji.')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isExpired && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('giftCards.balance.expiredWarning', 'Ten voucher wygasł. Niestety nie można go już zrealizować.')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {balanceResponse.current_balance === 0 && balanceResponse.is_active && !isExpired && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('giftCards.balance.fullyUsed', 'Voucher został w pełni wykorzystany. Dziękujemy!')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {balanceResponse.error || t('giftCards.balance.notFound', 'Nie znaleziono vouchera o podanym kodzie')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>• {t('giftCards.balance.note1', 'Kod vouchera znajdziesz w emailu potwierdzającym')}</p>
        <p>• {t('giftCards.balance.note2', 'Kod ma format MH-XXXXXXXXXXXX-X')}</p>
        <p>• {t('giftCards.balance.note3', 'Skontaktuj się z nami, jeśli masz problem z voucherem')}</p>
      </div>
    </div>
  );
}