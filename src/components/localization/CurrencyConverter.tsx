import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coins,
  ArrowUpDown,
  TrendingUp,
  Info,
  RefreshCw,
  Calculator,
  PiggyBank
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrencyStore } from '@/stores/currencyStore';

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

interface ConversionHistory {
  id: string;
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
}

const CURRENCIES = [
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', flag: '🇧🇾' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
];

export const CurrencyConverter: React.FC = () => {
  const { t } = useTranslation();
  const {
    currency,
    setCurrency,
    exchangeRates,
    convertPrice,
    updateExchangeRates,
    lastUpdated
  } = useCurrencyStore();

  const [fromCurrency, setFromCurrency] = useState('PLN');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate conversion
  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      const result = convertCurrency(Number(amount), fromCurrency, toCurrency);
      setConvertedAmount(result);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;

    // Convert to base currency (PLN) first, then to target
    const plnAmount = from === 'PLN' ? amount : amount / (exchangeRates[from] || 1);
    return to === 'PLN' ? plnAmount : plnAmount * (exchangeRates[to] || 1);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(convertedAmount?.toString() || '0');
  };

  const saveConversion = () => {
    if (convertedAmount === null) return;

    const conversion: ConversionHistory = {
      id: Date.now().toString(),
      from: fromCurrency,
      to: toCurrency,
      amount: Number(amount),
      result: convertedAmount,
      rate: exchangeRates[toCurrency] || 1,
      timestamp: new Date()
    };

    setConversionHistory(prev => [conversion, ...prev.slice(0, 9)]); // Keep last 10
  };

  const updateRates = async () => {
    setIsUpdating(true);
    try {
      await updateExchangeRates();
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (value: number, currencyCode: string): string => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return value.toString();

    const formatter = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(value);
  };

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'PLN') return exchangeRates[to] || 0;
    if (to === 'PLN') return 1 / (exchangeRates[from] || 1);
    // Cross rate via PLN
    return (exchangeRates[to] || 0) / (exchangeRates[from] || 0);
  };

  const currentRate = getExchangeRate(fromCurrency, toCurrency);
  const inverseRate = 1 / currentRate;

  const clearHistory = () => {
    setConversionHistory([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                {t('currency.title', 'Currency Converter')}
              </CardTitle>
              <CardDescription>
                {t('currency.description', 'Convert between different currencies with real-time exchange rates')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Info className="w-3 h-3" />
                {lastUpdated ? t('currency.updated', 'Updated: {{time}}', {
                  time: lastUpdated.toLocaleTimeString()
                }) : t('currency.neverUpdated', 'Never updated')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={updateRates}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="converter" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="converter">Converter</TabsTrigger>
              <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="converter" className="space-y-6">
              {/* Main Converter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Currency */}
                <div className="space-y-2">
                  <Label>{t('currency.from', 'From')}</Label>
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <div className="flex items-center gap-2">
                            <span>{curr.flag}</span>
                            <span>{curr.code} - {curr.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    {CURRENCIES.find(c => c.code === fromCurrency)?.symbol}{' '}
                    {formatCurrency(Number(amount) || 0, fromCurrency)}
                  </p>
                </div>

                {/* Swap Button */}
                <div className="flex items-center justify-center md:mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={swapCurrencies}
                    className="rounded-full"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* To Currency */}
                <div className="space-y-2">
                  <Label>{t('currency.to', 'To')}</Label>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <div className="flex items-center gap-2">
                            <span>{curr.flag}</span>
                            <span>{curr.code} - {curr.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-lg font-semibold p-2 border rounded-md bg-muted">
                    {convertedAmount !== null && (
                      <>
                        {formatCurrency(convertedAmount, toCurrency)}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {CURRENCIES.find(c => c.code === toCurrency)?.symbol}{' '}
                    {convertedAmount !== null && formatCurrency(convertedAmount, toCurrency)}
                  </p>
                </div>
              </div>

              {/* Exchange Rate Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">
                      1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">
                      1 {toCurrency} = {inverseRate.toFixed(4)} {fromCurrency}
                    </span>
                  </div>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('currency.rateDisclaimer', 'Exchange rates are updated periodically. Actual rates may vary.')}
                  </p>
                )}
              </div>

              {/* Save Conversion */}
              <Button
                onClick={saveConversion}
                disabled={convertedAmount === null}
                className="w-full"
              >
                <Coins className="w-4 h-4 mr-2" />
                {t('currency.saveConversion', 'Save Conversion')}
              </Button>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <div className="grid gap-4">
                <h4 className="text-sm font-medium">
                  {t('currency.currentRates', 'Current Exchange Rates (Base: PLN)')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CURRENCIES.filter(c => c.code !== 'PLN').map((curr) => {
                    const rate = exchangeRates[curr.code] || 0;
                    return (
                      <div key={curr.code} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{curr.flag}</span>
                          <span className="font-medium">{curr.code}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{rate.toFixed(4)}</p>
                          <p className="text-xs text-muted-foreground">
                            1 PLN = {rate.toFixed(4)} {curr.code}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversion History */}
      {conversionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                {t('currency.history', 'Conversion History')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                {t('common.clear', 'Clear')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionHistory.map((conv) => (
                <div key={conv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{CURRENCIES.find(c => c.code === conv.from)?.flag}</span>
                    <span className="font-medium">
                      {formatCurrency(conv.amount, conv.from)}
                    </span>
                    <span>→</span>
                    <span>{CURRENCIES.find(c => c.code === conv.to)?.flag}</span>
                    <span className="font-medium">
                      {formatCurrency(conv.result, conv.to)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Rate: {conv.rate.toFixed(4)}</p>
                    <p>{conv.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t('currency.quickReference', 'Quick Reference')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <p className="font-medium mb-1">{t('currency.popularAmounts', 'Popular Amounts')}</p>
              <div className="space-y-1">
                {[100, 500, 1000].map((val) => (
                  <p key={val}>
                    {formatCurrency(val, 'PLN')} ≈ {formatCurrency(convertCurrency(val, 'PLN', toCurrency), toCurrency)}
                  </p>
                ))}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium mb-1">{t('currency.servicePrices', 'Service Prices')}</p>
              <div className="space-y-1">
                <p>Lips: {formatCurrency(convertCurrency(1200, 'PLN', toCurrency), toCurrency)}</p>
                <p>Brows: {formatCurrency(convertCurrency(800, 'PLN', toCurrency), toCurrency)}</p>
                <p>Training: {formatCurrency(convertCurrency(2000, 'PLN', toCurrency), toCurrency)}</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium mb-1">{t('currency.paymentTips', 'Payment Tips')}</p>
              <div className="space-y-1 text-xs">
                <p>• PL: BLIK available</p>
                <p>• EU: SEPA transfers</p>
                <p>• UK: Faster Payments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyConverter;