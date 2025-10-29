import { useTranslation } from 'react-i18next';
import { Languages, Globe } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { isRTLLanguage } from '@/lib/date-localization';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const languages: Language[] = useMemo(() => [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      rtl: false
    },
    {
      code: 'pl',
      name: 'Polish',
      nativeName: 'Polski',
      flag: '🇵🇱',
      rtl: false
    },
    {
      code: 'ua',
      name: 'Ukrainian',
      nativeName: 'Українська',
      flag: '🇺🇦',
      rtl: false
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
      rtl: false
    },
  ], []);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRTL = isRTLLanguage(i18n.language);

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

    // Update lang attribute for accessibility
    html.setAttribute('lang', i18n.language);
  }, [i18n.language, isRTL]);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language || isChanging) return;

    setIsChanging(true);

    try {
      await i18n.changeLanguage(languageCode);

      // Store preference
      localStorage.setItem('preferred-language', languageCode);

      // Update document title if it contains translatable content
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent) {
        // You might want to update the document title based on translations
        document.title = titleElement.textContent;
      }

      // Trigger custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: languageCode, isRTL: isRTLLanguage(languageCode) }
      }));

    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Get preferred language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && savedLanguage !== i18n.language && languages.some(lang => lang.code === savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n, languages]);

  return (
    <div className={`language-switcher ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-pearl hover:text-champagne min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200"
            disabled={isChanging}
            aria-label={`Current language: ${currentLanguage.nativeName}. Click to change language.`}
          >
            <Languages className={`w-4 h-4 ${isChanging ? 'animate-spin' : ''}`} />
            <span className="text-sm" aria-hidden="true">{currentLanguage.flag}</span>
            <span className="sr-only">{currentLanguage.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="glass-card backdrop-blur-xl border-pearl/20 min-w-[200px] z-50"
          sideOffset={8}
        >
          <div className="px-3 py-2 text-xs text-pearl/70 font-medium border-b border-pearl/10">
            Choose Language
          </div>

          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={isChanging}
              className={`cursor-pointer py-3 px-4 min-h-[44px] touch-manipulation transition-all duration-200 ${
                i18n.language === language.code
                  ? 'bg-champagne/20 text-champagne font-semibold'
                  : 'text-pearl hover:text-champagne hover:bg-pearl/10'
              } ${language.rtl ? 'text-right' : 'text-left'}`}
              aria-label={`Switch to ${language.nativeName}`}
              aria-current={i18n.language === language.code ? 'true' : 'false'}
            >
              <span className="mr-3 text-base" aria-hidden="true">{language.flag}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-pearl/70">{language.name}</span>
              </div>
              {i18n.language === language.code && (
                <span className="ml-auto text-champagne" aria-hidden="true">✓</span>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="my-1" />

          <div className="px-3 py-2 text-xs text-pearl/50">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <span>Language preferences saved automatically</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher;
