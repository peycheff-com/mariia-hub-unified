import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Clock,
  Coins,
  Calculator,
  MapPin,
  Calendar,
  CreditCard,
  Smartphone
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useLocalizationStore } from '@/stores/localizationStore';

interface RegionalConfig {
  country: string;
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  paymentMethods: string[];
  features: {
    taxInclusive: boolean;
    militaryTime: boolean;
    weekStartsOn: number;
    drivingSide: 'left' | 'right';
  };
}

const REGIONAL_CONFIGS: Record<string, RegionalConfig> = {
  PL: {
    country: 'Poland',
    language: 'pl',
    currency: 'PLN',
    timezone: 'Europe/Warsaw',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: 'pl-PL',
    paymentMethods: ['card', 'blik', 'transfer', 'cash'],
    features: {
      taxInclusive: true,
      militaryTime: true,
      weekStartsOn: 1,
      drivingSide: 'right'
    }
  },
  UA: {
    country: 'Ukraine',
    language: 'ua',
    currency: 'UAH',
    timezone: 'Europe/Kyiv',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: 'uk-UA',
    paymentMethods: ['card', 'transfer', 'cash'],
    features: {
      taxInclusive: true,
      militaryTime: true,
      weekStartsOn: 1,
      drivingSide: 'right'
    }
  },
  BY: {
    country: 'Belarus',
    language: 'ru',
    currency: 'BYN',
    timezone: 'Europe/Minsk',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: 'be-BY',
    paymentMethods: ['card', 'transfer', 'cash'],
    features: {
      taxInclusive: true,
      militaryTime: true,
      weekStartsOn: 1,
      drivingSide: 'right'
    }
  },
  GB: {
    country: 'United Kingdom',
    language: 'en',
    currency: 'GBP',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-GB',
    paymentMethods: ['card', 'transfer', 'cash'],
    features: {
      taxInclusive: true,
      militaryTime: false,
      weekStartsOn: 1,
      drivingSide: 'left'
    }
  },
  US: {
    country: 'United States',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    paymentMethods: ['card', 'transfer', 'cash'],
    features: {
      taxInclusive: false,
      militaryTime: false,
      weekStartsOn: 0,
      drivingSide: 'right'
    }
  }
};

export const RegionalSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, convertPrice } = useCurrencyStore();
  const {
    region,
    setRegion,
    timezone,
    setTimezone,
    dateFormat,
    setDateFormat,
    timeFormat,
    setTimeFormat,
    autoDetectRegion,
    setAutoDetectRegion
  } = useLocalizationStore();

  const [detectedRegion, setDetectedRegion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect region on mount
  useEffect(() => {
    detectUserRegion();
  }, []);

  const detectUserRegion = async () => {
    setIsLoading(true);
    try {
      // Get timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get locale
      const userLocale = navigator.language || (navigator as any).userLanguage;

      // Get currency from locale
      const currency = (new Intl.NumberFormat(userLocale, {
        style: 'currency',
        currency: 'USD'
      }).resolvedOptions() as any).currency;

      // Try to match with our configs
      let matchedRegion = 'PL'; // Default to Poland

      // Check by timezone first
      Object.entries(REGIONAL_CONFIGS).forEach(([code, config]) => {
        if (config.timezone === userTimezone) {
          matchedRegion = code;
        }
      });

      // Then refine by locale
      if (userLocale.startsWith('pl')) matchedRegion = 'PL';
      else if (userLocale.startsWith('uk')) matchedRegion = 'UA';
      else if (userLocale.startsWith('be')) matchedRegion = 'BY';
      else if (userLocale.startsWith('en-GB')) matchedRegion = 'GB';
      else if (userLocale.startsWith('en-US')) matchedRegion = 'US';

      setDetectedRegion(matchedRegion);

      if (autoDetectRegion && matchedRegion) {
        applyRegionalSettings(matchedRegion);
      }
    } catch (error) {
      console.error('Error detecting region:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyRegionalSettings = (regionCode: string) => {
    const config = REGIONAL_CONFIGS[regionCode];
    if (!config) return;

    setRegion(regionCode);
    setCurrency(config.currency);
    setTimezone(config.timezone);
    setDateFormat(config.dateFormat);
    setTimeFormat(config.timeFormat);

    // Change language if supported
    if (config.language !== i18n.language) {
      i18n.changeLanguage(config.language);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'blik':
        return <Smartphone className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'blik': return 'BLIK';
      case 'card': return t('payment.card', 'Credit/Debit Card');
      case 'transfer': return t('payment.transfer', 'Bank Transfer');
      case 'cash': return t('payment.cash', 'Cash');
      default: return method;
    }
  };

  const currentConfig = REGIONAL_CONFIGS[region] || REGIONAL_CONFIGS.PL;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('regional.title', 'Regional Settings')}
          </CardTitle>
          <CardDescription>
            {t('regional.description', 'Configure your regional preferences for currency, dates, and payment methods')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-detection */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {t('regional.autoDetect', 'Auto-detect region')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('regional.autoDetectDesc', 'Automatically set regional settings based on your location')}
              </p>
            </div>
            <Switch
              checked={autoDetectRegion}
              onCheckedChange={setAutoDetectRegion}
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {t('regional.detecting', 'Detecting your region...')}
            </div>
          )}

          {!autoDetectRegion && detectedRegion && detectedRegion !== region && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('regional.detected', 'Detected region')}: {REGIONAL_CONFIGS[detectedRegion].country}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => applyRegionalSettings(detectedRegion)}
              >
                {t('regional.applyDetected', 'Apply detected settings')}
              </Button>
            </div>
          )}

          <Separator />

          {/* Manual Region Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('regional.selectRegion', 'Select Region')}
              </Label>
              <Select value={region} onValueChange={(value) => applyRegionalSettings(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONAL_CONFIGS).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {config.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('regional.currentCurrency', 'Currency')}
              </Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Coins className="w-4 h-4" />
                <span className="font-medium">{currency}</span>
                <span className="text-sm text-muted-foreground">
                  ({convertPrice(100)} = 100 {t('currency.base', 'PLN')})
                </span>
              </div>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="grid gap-4">
            <h4 className="text-sm font-medium">
              {t('regional.currentSettings', 'Current Regional Settings')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Timezone */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('regional.timezone', 'Timezone')}
                  </p>
                  <p className="text-sm font-medium">{currentConfig.timezone}</p>
                </div>
              </div>

              {/* Date Format */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('regional.dateFormat', 'Date Format')}
                  </p>
                  <p className="text-sm font-medium">{currentConfig.dateFormat}</p>
                </div>
              </div>

              {/* Time Format */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('regional.timeFormat', 'Time Format')}
                  </p>
                  <p className="text-sm font-medium">{currentConfig.timeFormat}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('regional.paymentMethods', 'Available Payment Methods')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentConfig.paymentMethods.map((method) => (
                <Badge key={method} variant="secondary" className="gap-1">
                  {getPaymentMethodIcon(method)}
                  {getPaymentMethodName(method)}
                </Badge>
              ))}
            </div>
            {region === 'PL' && (
              <p className="text-xs text-muted-foreground">
                💡 {t('regional.blikInfo', 'BLIK is a popular instant payment method in Poland')}
              </p>
            )}
          </div>

          {/* Cultural Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('regional.culturalFeatures', 'Regional Features')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>{t('regional.taxInclusive', 'Tax Included in Prices')}</span>
                <Badge variant={currentConfig.features.taxInclusive ? 'default' : 'secondary'}>
                  {currentConfig.features.taxInclusive ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>{t('regional.militaryTime', '24-Hour Time')}</span>
                <Badge variant={currentConfig.features.militaryTime ? 'default' : 'secondary'}>
                  {currentConfig.features.militaryTime ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>{t('regional.weekStart', 'Week Starts On')}</span>
                <Badge variant="secondary">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentConfig.features.weekStartsOn]}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>{t('regional.drivingSide', 'Driving Side')}</span>
                <Badge variant="secondary">
                  {currentConfig.features.drivingSide === 'left' ? '⬅️' : '➡️'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Test Display */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('regional.preview', 'Preview')}
            </h4>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <span className="font-medium">{t('regional.today', 'Today')}:</span>{' '}
                {new Date().toLocaleDateString(i18n.language, {
                  timeZone: currentConfig.timezone,
                  dateStyle: 'full'
                })}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t('regional.currentTime', 'Current Time')}:</span>{' '}
                {new Date().toLocaleTimeString(i18n.language, {
                  timeZone: currentConfig.timezone,
                  hour12: !currentConfig.features.militaryTime,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t('regional.samplePrice', 'Sample Price')}:</span>{' '}
                {convertPrice(299)} ({t('currency.sampleService', 'Example Service')})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalSettings;