import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coins,
  TrendingUp,
  CreditCard,
  Smartphone,
  MapPin,
  RefreshCw,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useLocalizationStore } from '@/stores/localizationStore';

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  region: string;
  paymentMethods: string[];
}

interface ConversionDisplay {
  from: string;
  to: string;
  amount: number;
  result: number;
}

const CURRENCIES: CurrencyInfo[] = [
  {
    code: 'PLN',
    name: 'Polish Złoty',
    symbol: 'zł',
    flag: '🇵🇱',
    country: 'Poland',
    region: 'Europe',
    paymentMethods: ['card', 'blik', 'transfer', 'cash']
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    country: 'European Union',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    country: 'United States',
    region: 'North America',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    country: 'United Kingdom',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    flag: '🇺🇦',
    country: 'Ukraine',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'BYN',
    name: 'Belarusian Ruble',
    symbol: 'Br',
    flag: '🇧🇾',
    country: 'Belarus',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    flag: '🇨🇭',
    country: 'Switzerland',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    flag: '🇨🇿',
    country: 'Czech Republic',
    region: 'Europe',
    paymentMethods: ['card', 'transfer', 'cash']
  }
];

const SAMPLE_CONVERSIONS: ConversionDisplay[] = [
  { from: 'PLN', to: 'EUR', amount: 100, result: 23 },
  { from: 'PLN', to: 'USD', amount: 100, result: 25 },
  { from: 'PLN', to: 'UAH', amount: 100, result: 1000 },
];

export const CurrencySelector: React.FC = () => {
  const { t } = useTranslation();
  const {
    currency,
    exchangeRates,
    lastUpdated,
    isLoading,
    setCurrency,
    updateExchangeRates,
    _convertPrice,
    convertValue
  } = useCurrencyStore();

  const {
    region,
    autoDetectRegion,
    setAutoDetectRegion
  } = useLocalizationStore();

  const [showConversions, setShowConversions] = useState(false);
  const [recentConversions, setRecentConversions] = useState<ConversionDisplay[]>([]);

  // Auto-detect currency based on region
  useEffect(() => {
    if (autoDetectRegion && region) {
      const regionCurrency = getCurrencyForRegion(region);
      if (regionCurrency && regionCurrency !== currency) {
        setCurrency(regionCurrency);
      }
    }
  }, [region, autoDetectRegion, currency, setCurrency]);

  const getCurrencyForRegion = (regionCode: string): string | null => {
    const regionCurrencyMap: Record<string, string> = {
      'PL': 'PLN',
      'UA': 'UAH',
      'BY': 'BYN',
      'GB': 'GBP',
      'US': 'USD',
    };

    return regionCurrencyMap[regionCode] || null;
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);

    // Track for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'currency_change', {
        from_currency: currency,
        to_currency: newCurrency,
        region: region
      });
    }

    // Add to recent conversions
    const currentCurrencyInfo = CURRENCIES.find(c => c.code === currency);
    const newCurrencyInfo = CURRENCIES.find(c => c.code === newCurrency);

    if (currentCurrencyInfo && newCurrencyInfo) {
      const sampleAmount = 100;
      const convertedAmount = convertValue(sampleAmount, currency, newCurrency);

      setRecentConversions(prev => [
        {
          from: currency,
          to: newCurrency,
          amount: sampleAmount,
          result: convertedAmount
        },
        ...prev.slice(0, 4) // Keep last 5
      ]);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'blik':
        return <Smartphone className="w-3 h-3" />;
      case 'card':
        return <CreditCard className="w-3 h-3" />;
      default:
        return <Coins className="w-3 h-3" />;
    }
  };

  const currentCurrencyInfo = CURRENCIES.find(c => c.code === currency);
  const exchangeRate = exchangeRates[currency] || 1;

  return (
    <div className="space-y-4">
      {/* Currency Selector */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 min-h-[44px] touch-manipulation"
              disabled={isLoading}
            >
              {currentCurrencyInfo && (
                <>
                  <span className="text-lg">{currentCurrencyInfo.flag}</span>
                  <span className="font-medium">{currency}</span>
                  <span className="text-muted-foreground">({currentCurrencyInfo.symbol})</span>
                </>
              )}
              {isLoading && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-80 z-50" sideOffset={8}>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Select Currency</span>
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  {region}
                </Badge>
              </div>
            </div>

            <DropdownMenuSeparator />

            {CURRENCIES.map((curr) => (
              <DropdownMenuItem
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`cursor-pointer py-3 min-h-[44px] touch-manipulation ${
                  currency === curr.code ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{curr.flag}</span>
                    <div>
                      <div className="font-medium">{curr.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {curr.name}
                      </div>
                    </div>
                  </div>

                  {currency === curr.code && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="auto-detect" className="text-sm">
                  Auto-detect from region
                </Label>
                <Switch
                  id="auto-detect"
                  checked={autoDetectRegion}
                  onCheckedChange={setAutoDetectRegion}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Exchange Rate Badge */}
        {currentCurrencyInfo && (
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            1 PLN = {exchangeRate.toFixed(4)} {currentCurrencyInfo.code}
          </Badge>
        )}
      </div>

      {/* Current Currency Details */}
      {currentCurrencyInfo && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Country:</span>
              <span className="font-medium">
                {currentCurrencyInfo.flag} {currentCurrencyInfo.country}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Symbol:</span>
              <span className="font-mono font-medium">
                {currentCurrencyInfo.symbol}
              </span>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Payment Methods:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentCurrencyInfo.paymentMethods.map((method) => (
                  <Badge key={method} variant="outline" className="gap-1">
                    {getPaymentMethodIcon(method)}
                    {method}
                  </Badge>
                ))}
              </div>
            </div>

            {lastUpdated && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last Updated:</span>
                <span>{lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Conversions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConversions(!showConversions)}
        className="gap-2"
      >
        <Coins className="w-4 h-4" />
        Quick Conversions
      </Button>

      {showConversions && (
        <div className="space-y-3">
          {/* Sample conversions */}
          <h4 className="text-sm font-medium">Quick Reference</h4>
          <div className="grid gap-2">
            {SAMPLE_CONVERSIONS.map((conv, index) => {
              const result = convertValue(conv.amount, conv.from, conv.to);
              const fromCurrency = CURRENCIES.find(c => c.code === conv.from);
              const toCurrency = CURRENCIES.find(c => c.code === conv.to);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{fromCurrency?.flag}</span>
                    <span>{conv.amount} {conv.from}</span>
                  </div>
                  <span>=</span>
                  <div className="flex items-center gap-2">
                    <span>{result.toFixed(2)} {conv.to}</span>
                    <span>{toCurrency?.flag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent conversions */}
          {recentConversions.length > 0 && (
            <>
              <h4 className="text-sm font-medium">Recent Conversions</h4>
              <div className="grid gap-2">
                {recentConversions.map((conv, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{conv.amount} {conv.from}</span>
                      <span>→</span>
                      <span>{conv.result.toFixed(2)} {conv.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Update Rates Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateExchangeRates()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('currency.updateRates', 'Update Rates')}
        </Button>

        <span className="text-xs text-muted-foreground">
          Rates are updated hourly
        </span>
      </div>
    </div>
  );
};

export default CurrencySelector;