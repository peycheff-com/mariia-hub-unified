import React from 'react';
import { MapPin, Globe, Coins } from 'lucide-react';

import { useLocation } from '@/contexts/LocationContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LocationDisplayProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showCurrency?: boolean;
  showLanguage?: boolean;
  className?: string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  variant = 'compact',
  showCurrency = true,
  showLanguage = true,
  className
}) => {
  const { currentCity, currentLocation } = useLocation();
  const { currentLanguage, currentCurrency, config } = useLocalization();

  if (!currentCity) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <MapPin className="w-4 h-4" />
        <span>Select location</span>
      </div>
    );
  }

  const currentLanguageConfig = config?.supportedLanguages.find(
    lang => lang.code === currentLanguage
  );

  const currentCurrencyConfig = config?.supportedCurrencies.find(
    currency => currency.code === currentCurrency
  );

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-sm">{currentLanguageConfig?.flag}</span>
        <span className="text-xs font-medium">{currentCurrencyConfig?.symbol}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{currentCity.name}</div>
            {currentLocation && (
              <div className="text-sm text-muted-foreground">{currentLocation.name}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {showLanguage && currentLanguageConfig && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span>{currentLanguageConfig.flag} {currentLanguageConfig.name}</span>
            </div>
          )}

          {showCurrency && currentCurrencyConfig && (
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-muted-foreground" />
              <span>{currentCurrencyConfig.symbol} {currentCurrencyConfig.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className="flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        <span>{currentCity.name}</span>
      </Badge>

      {showLanguage && currentLanguageConfig && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <span>{currentLanguageConfig.flag}</span>
          <span className="hidden sm:inline">{currentLanguageConfig.code.toUpperCase()}</span>
        </Badge>
      )}

      {showCurrency && currentCurrencyConfig && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <span>{currentCurrencyConfig.symbol}</span>
          <span className="hidden sm:inline">{currentCurrencyConfig.code}</span>
        </Badge>
      )}
    </div>
  );
};

export default LocationDisplay;