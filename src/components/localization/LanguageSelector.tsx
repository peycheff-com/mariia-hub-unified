import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';

import { useLocalization } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'default',
  showLabel = true,
  className
}) => {
  const { currentLanguage, setLanguage, config, isLoading } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !config) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Globe className="w-4 h-4" />
        {showLabel && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  const currentLanguageConfig = config.supportedLanguages.find(
    lang => lang.code === currentLanguage
  );

  const handleLanguageSelect = (languageCode: string) => {
    setLanguage(languageCode);
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
            <span className="text-lg">{currentLanguageConfig?.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {config.supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
              {language.code === currentLanguage && (
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
            <Globe className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{currentLanguageConfig?.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {config.supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
              {language.code === currentLanguage && (
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
        <span className="text-sm font-medium text-muted-foreground">Language:</span>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-start">
            <Globe className="w-4 h-4 mr-2" />
            <span className="flex items-center gap-2">
              <span>{currentLanguageConfig?.flag}</span>
              <span>{currentLanguageConfig?.name}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {config.supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                {language.isDefault && (
                  <div className="text-xs text-muted-foreground">Default</div>
                )}
              </div>
              {language.code === currentLanguage && (
                <Check className="w-4 h-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSelector;