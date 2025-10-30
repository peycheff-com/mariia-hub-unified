import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Shield, Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConsentSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface CookieConsentBannerProps {
  onConsentChange?: (settings: ConsentSettings) => void;
}

export function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('cookie-consent');
    if (!hasConsent) {
      setIsVisible(true);
    } else {
      try {
        const savedSettings = JSON.parse(hasConsent);
        setConsentSettings(savedSettings);
        applyConsentSettings(savedSettings);
      } catch (error) {
        console.error('Error parsing consent settings:', error);
        setIsVisible(true);
      }
    }
  }, []);

  const applyConsentSettings = (settings: ConsentSettings) => {
    // Apply Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: settings.analytics ? 'granted' : 'denied',
        ad_storage: settings.marketing ? 'granted' : 'denied',
        functionality_storage: settings.functional ? 'granted' : 'denied',
      });
    }

    // Store consent with timestamp for GDPR compliance
    const consentRecord = {
      ...settings,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: null, // Will be set server-side for privacy
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentRecord));
    onConsentChange?.(settings);
  };

  const handleAcceptAll = () => {
    const allSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setConsentSettings(allSettings);
    applyConsentSettings(allSettings);
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setConsentSettings(necessaryOnly);
    applyConsentSettings(necessaryOnly);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    applyConsentSettings(consentSettings);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleSettingChange = (category: keyof ConsentSettings, value: boolean) => {
    if (category !== 'necessary') {
      setConsentSettings(prev => ({ ...prev, [category]: value }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t">
      <div className="container mx-auto p-4">
        {!showSettings ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t('cookie_consent.title', 'Privacy & Cookies')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('cookie_consent.description',
                      'We use cookies to enhance your experience, analyze site traffic, and personalize content. ' +
                      'By continuing to use our site, you agree to our use of cookies in accordance with our ' +
                      'Privacy Policy and GDPR regulations.')}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={handleAcceptAll} size="sm">
                      {t('cookie_consent.accept_all', 'Accept All')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAcceptNecessary}
                      size="sm"
                    >
                      {t('cookie_consent.accept_necessary', 'Only Necessary')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowSettings(true)}
                      size="sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('cookie_consent.customize', 'Customize')}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {t('cookie_consent.settings_title', 'Cookie Preferences')}
                </h3>
              </div>

              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="categories">
                    {t('cookie_consent.categories', 'Categories')}
                  </TabsTrigger>
                  <TabsTrigger value="details">
                    {t('cookie_consent.details', 'Details')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4 mt-4">
                  {[
                    { key: 'necessary', label: 'Essential Cookies', description: 'Required for the site to function', disabled: true },
                    { key: 'analytics', label: 'Analytics Cookies', description: 'Help us improve our website', disabled: false },
                    { key: 'marketing', label: 'Marketing Cookies', description: 'Used for advertising personalization', disabled: false },
                    { key: 'functional', label: 'Functional Cookies', description: 'Enable enhanced features', disabled: false },
                  ].map(({ key, label, description, disabled }) => (
                    <div key={key} className="flex items-center justify-between space-x-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{label}</Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={consentSettings[key as keyof ConsentSettings]}
                        onCheckedChange={(checked) => handleSettingChange(key as keyof ConsentSettings, checked)}
                        disabled={disabled}
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>{t('cookie_consent.gdpr_info', 'GDPR Information')}</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>{t('cookie_consent.gdpr_1', 'You have the right to withdraw consent at any time')}</li>
                      <li>{t('cookie_consent.gdpr_2', 'Consent records are stored with timestamps for compliance')}</li>
                      <li>{t('cookie_consent.gdpr_3', 'You can request data deletion under GDPR Article 17')}</li>
                      <li>{t('cookie_consent.gdpr_4', 'Data processing is based on legitimate interest and consent')}</li>
                    </ul>
                    <div className="pt-2">
                      <Button variant="link" className="p-0 h-auto text-xs">
                        {t('cookie_consent.privacy_policy', 'View Privacy Policy')}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSavePreferences} size="sm">
                  {t('cookie_consent.save_preferences', 'Save Preferences')}
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)} size="sm">
                  {t('cookie_consent.cancel', 'Cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Add TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: Record<string, any>) => void;
  }
}