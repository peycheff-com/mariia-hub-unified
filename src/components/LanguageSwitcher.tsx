import React from 'react';
import { Languages, Globe, Check, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'detailed';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  showFlags = true,
  showNativeNames = true,
  className,
}) => {
  const {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isChanging,
    isRTL,
    localeConfig
  } = useLanguage();

  const { t } = useTranslation();

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return;

    try {
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Compact variant - minimal design
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-2 text-pearl hover:text-champagne min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200",
          isChanging && "opacity-50",
          className
        )}
        disabled={isChanging}
        onClick={() => {}}
        aria-label={`Current language: ${currentLang.nativeName}. Click to change language.`}
      >
        <Languages className={cn("w-4 h-4", isChanging && "animate-spin")} />
        {showFlags && <span className="text-sm" aria-hidden="true">{currentLang.flag}</span>}
        <span className="sr-only">{currentLang.nativeName}</span>
      </Button>
    );
  }

  // Detailed variant - full featured dropdown
  return (
    <div className={cn("language-switcher", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-pearl hover:text-champagne min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200",
              isChanging && "opacity-50",
              className
            )}
            disabled={isChanging}
            aria-label={`Current language: ${currentLang.nativeName}. Click to change language.`}
          >
            <Languages className={cn("w-4 h-4", isChanging && "animate-spin")} />
            {showFlags && <span className="text-sm" aria-hidden="true">{currentLang.flag}</span>}
            {showNativeNames && (
              <span className="text-sm font-medium hidden sm:inline">
                {currentLang.nativeName}
              </span>
            )}
            <span className="sr-only">{currentLang.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="glass-card backdrop-blur-xl border-pearl/20 min-w-[280px] z-50"
          sideOffset={8}
        >
          {/* Header */}
          <div className="px-3 py-3 border-b border-pearl/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-pearl/70" />
                <span className="text-sm font-medium text-pearl">
                  {t('language.selectLanguage', 'Select Language')}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {localeConfig.currency}
              </Badge>
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-[300px] overflow-y-auto">
            {availableLanguages.map((language) => {
              const isSelected = language.code === currentLanguage;
              const isPrimary = language.isPrimary;

              return (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                  className={cn(
                    "cursor-pointer py-3 px-4 min-h-[48px] touch-manipulation transition-all duration-200 group",
                    isSelected
                      ? "bg-champagne/20 text-champagne font-semibold"
                      : "text-pearl hover:text-champagne hover:bg-pearl/10",
                    language.rtl ? "text-right" : "text-left"
                  )}
                  aria-label={`Switch to ${language.nativeName}`}
                  aria-current={isSelected ? "true" : "false"}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {showFlags && (
                      <span className="text-xl" aria-hidden="true">
                        {language.flag}
                      </span>
                    )}

                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{language.nativeName}</span>
                        {isPrimary && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {t('language.primary', 'Primary')}
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-champagne" />
                        )}
                      </div>
                      <span className="text-xs text-pearl/70">
                        {language.name} • {language.locale}
                      </span>
                    </div>
                  </div>

                  {language.rtl && (
                    <Badge variant="secondary" className="text-xs">
                      RTL
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Footer with additional options */}
          <div className="px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-pearl/50">
              <Settings className="w-3 h-3" />
              <span>{t('language.preferencesSaved', 'Language preferences saved automatically')}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-pearl/50">
              <Globe className="w-3 h-3" />
              <span>
                {t('language.currentLocale', 'Current locale')}: {localeConfig.locale}
              </span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher;
