import React from 'react';
import { Globe, Coins } from 'lucide-react';

import { useLocalization } from '@/contexts/LocalizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';

interface LocalizationSelectorProps {
  variant?: 'horizontal' | 'vertical' | 'combined';
  showLabels?: boolean;
  className?: string;
}

export const LocalizationSelector: React.FC<LocalizationSelectorProps> = ({
  variant = 'horizontal',
  showLabels = true,
  className
}) => {
  const { isLoading } = useLocalization();

  if (variant === 'combined') {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Region Settings</h3>
            </div>

            <div className="space-y-3">
              <LanguageSelector
                variant="default"
                showLabel={true}
                className="w-full"
              />

              <Separator />

              <CurrencySelector
                variant="default"
                showLabel={true}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        <LanguageSelector
          variant="default"
          showLabel={showLabels}
          className="w-full"
        />
        <CurrencySelector
          variant="default"
          showLabel={showLabels}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <LanguageSelector
        variant="compact"
        showLabel={showLabels}
      />
      <CurrencySelector
        variant="compact"
        showLabel={showLabels}
      />
    </div>
  );
};

export default LocalizationSelector;