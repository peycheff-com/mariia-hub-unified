import React, { useState } from 'react';
import { Coins, Check } from 'lucide-react';

import { useLocalization } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  showLabel?: boolean;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = 'default',
  showLabel = true,
  className
}) => {
  const { currentCurrency, setCurrency, config, isLoading } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !config) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Coins className="w-4 h-4" />
        {showLabel && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  const currentCurrencyConfig = config.supportedCurrencies.find(
    currency => currency.code === currentCurrency
  );

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsOpen(false);
  };

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-auto p-2", className)}
          >
            <span className="text-sm font-medium">{currentCurrencyConfig?.symbol}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {config.supportedCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleCurrencySelect(currency.code)}
              className="flex items-center gap-2"
            >
              <span className="font-medium">{currency.symbol}</span>
              <span>{currency.code}</span>
              {currency.code === currentCurrency && (
                <Check className="w-4 h-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Coins className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{currentCurrencyConfig?.code}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {config.supportedCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleCurrencySelect(currency.code)}
              className="flex items-center gap-2"
            >
              <span className="font-medium">{currency.symbol}</span>
              <span>{currency.name}</span>
              {currency.code === currentCurrency && (
                <Check className="w-4 h-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">Currency:</span>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-start">
            <Coins className="w-4 h-4 mr-2" />
            <span className="flex items-center gap-2">
              <span className="font-medium">{currentCurrencyConfig?.symbol}</span>
              <span>{currentCurrencyConfig?.name}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {config.supportedCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleCurrencySelect(currency.code)}
              className="flex items-center gap-2"
            >
              <span className="font-medium text-lg">{currency.symbol}</span>
              <div className="flex-1">
                <div className="font-medium">{currency.name}</div>
                <div className="text-xs text-muted-foreground">
                  {currency.code} • {currency.exchangeRate.toFixed(2)} rate
                </div>
              </div>
              {currency.code === currentCurrency && (
                <Check className="w-4 h-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CurrencySelector;