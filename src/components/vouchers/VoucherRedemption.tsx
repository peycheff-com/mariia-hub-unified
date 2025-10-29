import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, CheckCircle, XCircle, Tag, Percent, DollarSign } from 'lucide-react';

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

import type { VoucherApplicationResponse, PromotionalVoucher } from '@/types/gift-card';

interface VoucherRedemptionProps {
  orderAmount: number;
  serviceIds?: string[];
  serviceCategories?: string[];
  onVoucherApplied: (response: VoucherApplicationResponse & { voucher: PromotionalVoucher }) => void;
  onVoucherRemoved: () => void;
}

export function VoucherRedemption({
  orderAmount,
  serviceIds = [],
  serviceCategories = [],
  onVoucherApplied,
  onVoucherRemoved,
}: VoucherRedemptionProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [voucherCode, setVoucherCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<(VoucherApplicationResponse & { voucher: PromotionalVoucher }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await GiftCardService.applyVoucher(
        voucherCode,
        null, // User ID - would come from auth context
        orderAmount,
        serviceIds,
        serviceCategories
      );

      if (response.success && response.voucher_id) {
        // Get full voucher details
        const voucher = await GiftCardService.getVoucherByCode(voucherCode.toUpperCase());
        if (voucher) {
          const fullResponse = { ...response, voucher };
          setAppliedVoucher(fullResponse);
          onVoucherApplied(fullResponse);
        }
      } else {
        setError(response.error || t('vouchers.redemption.error.invalid', 'Nieprawidłowy kod kuponu'));
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      setError(t('vouchers.redemption.error.general', 'Wystąpił błąd podczas stosowania kuponu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setError(null);
    onVoucherRemoved();
  };

  const getDiscountDisplay = () => {
    if (!appliedVoucher) return null;

    const { voucher, discount_amount } = appliedVoucher;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('vouchers.redemption.discount', 'Rabat')}</span>
          <div className="flex items-center gap-1">
            {voucher.discount_type === 'percentage' ? (
              <Percent className="h-3 w-3" />
            ) : (
              <DollarSign className="h-3 w-3" />
            )}
            <span className="font-medium text-green-600">
              -{formatPrice(discount_amount)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('vouchers.redemption.newTotal', 'Nowa suma')}</span>
          <span className="font-semibold">{formatPrice(appliedVoucher.final_amount)}</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('vouchers.redemption.title', 'Kod Promocyjny')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!appliedVoucher ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="voucher-code">{t('vouchers.redemption.codeLabel', 'Wprowadź kod kuponu')}</Label>
              <div className="flex gap-2">
                <Input
                  id="voucher-code"
                  placeholder={t('vouchers.redemption.placeholder', 'Wpisz kod promocyjny')}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="font-mono"
                  maxLength={20}
                />
                <Button
                  onClick={handleApplyVoucher}
                  disabled={!voucherCode.trim() || isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>{t('vouchers.redemption.applying', 'Stosowanie...')}</>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      {t('vouchers.redemption.apply', 'Zastosuj')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {t('vouchers.redemption.note1', 'Wprowadź kod kuponu, aby otrzymać rabat')}</p>
              <p>• {t('vouchers.redemption.note2', 'Tylko jeden kupon może być użyty na zamówienie')}</p>
              <p>• {t('vouchers.redemption.note3', 'Sprawdź warunki użytkowania kuponu')}</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  {t('vouchers.redemption.applied', 'Kupon zastosowany!')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">{t('vouchers.redemption.code', 'Kod')}</span>
                  <code className="bg-green-100 px-2 py-0.5 rounded text-green-800 text-xs">
                    {appliedVoucher.voucher.code}
                  </code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">{t('vouchers.redemption.name', 'Nazwa')}</span>
                  <span className="text-green-800 font-medium">{appliedVoucher.voucher.name}</span>
                </div>
                {appliedVoucher.voucher.description && (
                  <div className="text-xs text-green-600 mt-1">
                    {appliedVoucher.voucher.description}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {getDiscountDisplay()}

            <Button
              onClick={handleRemoveVoucher}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {t('vouchers.redemption.remove', 'Usuń kupon')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}