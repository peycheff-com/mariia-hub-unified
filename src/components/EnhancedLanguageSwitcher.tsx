import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Globe, MapPin, Check, ChevronDown } from 'lucide-react';

import { languages } from '@/lib/i18n-utils';
import { isRTLLanguage } from '@/lib/rtl-support';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface EnhancedLanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'detailed';
  showFlag?: boolean;
  showNativeName?: boolean;
  autoDetect?: boolean;
  className?: string;
}

const EnhancedLanguageSwitcher: React.FC<EnhancedLanguageSwitcherProps> = ({
  variant = 'default',
  showFlag = true,
  showNativeName = true,
  autoDetect = true,
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);

  // Get current language info
  const currentLangInfo = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRTL = isRTLLanguage(i18n.language);

  // Detect user's country based on IP
  const detectCountry = useCallback(async () => {
    if (!autoDetect || isDetecting) return;

    setIsDetecting(true);
    try {
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const data = await response.json();

      if (data && data.country_code) {
        setDetectedCountry(data.country_code);

        // Suggest language based on location
        let suggestedLanguage = 'en'; // default
        switch (data.country_code) {
          case 'PL':
            suggestedLanguage = 'pl';
            break;
          case 'UA':
            suggestedLanguage = 'ua';
            break;
          case 'RU':
          case 'BY':
            suggestedLanguage = 'ru';
            break;
        }

        // Only show suggestion if different from current and no saved preference
        if (suggestedLanguage !== i18n.language && !localStorage.getItem('preferred-language')) {
          setPreferredLanguage(suggestedLanguage);
        }
      }
    } catch (error) {
      console.warn('Country detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [autoDetect, isDetecting, i18n.language]);

  // Apply RTL class to document when language changes
  useEffect(() => {
    const document = window.document;
    const html = document.documentElement;

    if (isRTL) {
      html.setAttribute('dir', 'rtl');
      html.classList.add('rtl');
    } else {
      html.setAttribute('dir', 'ltr');
      html.classList.remove('rtl');
    }

    // Update lang attribute for accessibility and SEO
    html.setAttribute('lang', i18n.language);

    // Update Open Graph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]') as HTMLMetaElement;
    if (ogLocale) {
      ogLocale.content = currentLangInfo.locale;
    }
  }, [i18n.language, isRTL, currentLangInfo.locale]);

  // Enhanced language change handler
  const handleLanguageChange = useCallback(async (languageCode: string) => {
    if (languageCode === i18n.language || isChanging) return;

    setIsChanging(true);

    try {
      // Change language
      await i18n.changeLanguage(languageCode);

      // Store preference in multiple places for persistence
      localStorage.setItem('preferred-language', languageCode);
      localStorage.setItem('i18nextLng', languageCode);

      // Set cookie for server-side rendering
      document.cookie = `i18next=${languageCode}; max-age=31536000; path=/; SameSite=Lax`;

      // Update document title with translated version
      const siteName = t('nav.brand', 'Mariia Beauty & Fitness');
      document.title = siteName;

      // Trigger analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'language_change', {
          language: languageCode,
          previous_language: i18n.language,
          method: 'manual_switch',
        });
      }

      // Trigger custom event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: {
          language: languageCode,
          isRTL: isRTLLanguage(languageCode),
          locale: languages.find(l => l.code === languageCode)?.locale
        }
      }));

      // Clear suggestion after manual change
      setPreferredLanguage(null);

    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  }, [i18n, isChanging, t]);

  // Auto-detect and suggest language on mount
  useEffect(() => {
    // Check for saved preference first
    const savedLanguage = localStorage.getItem('preferred-language');

    if (savedLanguage && savedLanguage !== i18n.language) {
      handleLanguageChange(savedLanguage);
    } else if (autoDetect) {
      // Detect country for suggestion
      detectCountry();
    }
  }, [i18n.language, autoDetect, detectCountry, handleLanguageChange]);

  // Different rendering variants
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleLanguageChange(languages.find(l => l.code !== i18n.language)?.code || 'en')}
        className={`gap-2 hover:bg-champagne/10 ${className}`}
        disabled={isChanging}
      >
        <span className="text-base">{currentLangInfo.flag}</span>
        <span className="text-xs">{currentLangInfo.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`language-switcher-detailed ${className}`}>
        <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-champagne" />
            <span className="text-sm font-medium">Language:</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={i18n.language === lang.code ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
                className={`gap-2 ${
                  i18n.language === lang.code
                    ? 'bg-champagne text-cocoa'
                    : 'hover:bg-champagne/10'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {i18n.language === lang.code && <Check className="w-3 h-3" />}
              </Button>
            ))}
          </div>

          {preferredLanguage && preferredLanguage !== i18n.language && (
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-pearl/70" />
              <span className="text-xs text-pearl/70">
                We detected you might prefer {languages.find(l => l.code === preferredLanguage)?.nativeName}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleLanguageChange(preferredLanguage)}
                className="text-xs px-2 py-1"
              >
                Switch
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant - dropdown menu
  return (
    <div className={`enhanced-language-switcher ${isRTL ? 'rtl' : 'ltr'} ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-pearl hover:text-champagne min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 group"
            disabled={isChanging}
            aria-label={`Current language: ${currentLangInfo.nativeName}. Click to change language.`}
          >
            <Languages className={`w-4 h-4 ${isChanging ? 'animate-spin' : 'animate-none'} transition-transform group-hover:scale-110`} />
            {showFlag && <span className="text-base" aria-hidden="true">{currentLangInfo.flag}</span>}
            {showNativeName && (
              <span className="text-xs hidden sm:inline" aria-hidden="true">
                {currentLangInfo.nativeName}
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-60" />
            <span className="sr-only">{currentLangInfo.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="glass-card backdrop-blur-xl border-pearl/20 min-w-[220px] z-50 animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
        >
          <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-pearl/70 flex items-center gap-2">
            <Globe className="w-3 h-3" />
            Choose Language
          </DropdownMenuLabel>

          {preferredLanguage && preferredLanguage !== i18n.language && (
            <>
              <DropdownMenuItem
                onClick={() => handleLanguageChange(preferredLanguage)}
                className="cursor-pointer py-2 px-3 bg-champagne/10 border border-champagne/20 rounded mx-1 my-1"
              >
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="w-3 h-3 text-champagne" />
                  <span className="text-xs text-champagne">
                    Suggested: {languages.find(l => l.code === preferredLanguage)?.nativeName}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={isChanging}
              className={`cursor-pointer py-3 px-4 min-h-[44px] touch-manipulation transition-all duration-200 group ${
                i18n.language === language.code
                  ? 'bg-champagne/20 text-champagne font-semibold'
                  : 'text-pearl hover:text-champagne hover:bg-pearl/10'
              } ${language.rtl ? 'text-right' : 'text-left'}`}
              aria-label={`Switch to ${language.nativeName}`}
              aria-current={i18n.language === language.code ? 'true' : 'false'}
            >
              <span className="mr-3 text-base" aria-hidden="true">{language.flag}</span>
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-pearl/70">{language.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {detectedCountry === 'PL' && language.code === 'pl' && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Local
                  </Badge>
                )}
                {i18n.language === language.code && (
                  <Check className="w-4 h-4 text-champagne" aria-hidden="true" />
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <div className="px-3 py-2 text-xs text-pearl/50">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <span>Preferences saved automatically</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EnhancedLanguageSwitcher;