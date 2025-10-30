import React, { useState } from 'react';
import { X, Shield, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGDPR, useCookieConsent } from '@/contexts/GDPRContext';
import { CookieConsentCategory } from '@/types/gdpr';

interface CookieCategoryInfo {
  category: CookieConsentCategory;
  title: string;
  description: string;
  required: boolean;
  examples: string[];
}

const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    category: 'essential',
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be switched off in our systems.',
    required: true,
    examples: ['Authentication', 'Shopping cart', 'Security tokens'],
  },
  {
    category: 'analytics',
    title: 'Analytics Cookies',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.',
    required: false,
    examples: ['Google Analytics', 'Hotjar', 'Custom analytics'],
  },
  {
    category: 'marketing',
    title: 'Marketing Cookies',
    description: 'These cookies may be set through our site by our advertising partners to build a profile of your interests.',
    required: false,
    examples: ['Facebook Pixel', 'Google Ads', 'Email marketing'],
  },
  {
    category: 'personalization',
    title: 'Personalization Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization.',
    required: false,
    examples: ['Language preferences', 'Theme selection', 'Remembered choices'],
  },
];

export function CookieBanner() {
  const {
    showCookieBanner,
    cookieBannerConfig,
    acceptAllCookies,
    rejectAllCookies,
    updateConsentPreferences,
    hideCookieBanner,
    isUpdating,
  } = useGDPR();

  const [customPreferences, setCustomPreferences] = useState<Record<CookieConsentCategory, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  const [showCustomization, setShowCustomization] = useState(false);

  if (!showCookieBanner) return null;

  const handleAcceptAll = async () => {
    await acceptAllCookies();
  };

  const handleRejectAll = async () => {
    await rejectAllCookies();
  };

  const handleCustomize = () => {
    setShowCustomization(true);
  };

  const handleSaveCustomPreferences = async () => {
    await updateConsentPreferences(customPreferences);
    setShowCustomization(false);
  };

  const handleCategoryChange = (category: CookieConsentCategory, checked: boolean) => {
    if (category === 'essential') return; // Essential cookies cannot be changed
    setCustomPreferences(prev => ({
      ...prev,
      [category]: checked,
    }));
  };

  const isBottomPosition = cookieBannerConfig.position === 'bottom';

  return (
    <>
      {/* Main Cookie Banner */}
      <div
        className={`
          fixed ${isBottomPosition ? 'bottom-0' : 'top-0'} left-0 right-0 z-50
          ${cookieBannerConfig.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
          shadow-lg border-t border-gray-200
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Cookie Notice</h3>
                <p className="text-sm opacity-90 mb-3">
                  We use cookies to enhance your experience, analyze site traffic, and personalize content.
                  By continuing to use our site, you agree to our use of cookies as described in our{' '}
                  <a
                    href={cookieBannerConfig.privacyPolicyLink}
                    className="text-primary underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a
                    href={cookieBannerConfig.cookiePolicyLink}
                    className="text-primary underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cookie Policy
                  </a>.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex gap-2">
                {cookieBannerConfig.necessaryOnlyButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                    disabled={isUpdating}
                    className="whitespace-nowrap"
                  >
                    Necessary Only
                  </Button>
                )}

                {cookieBannerConfig.customizeButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomize}
                    disabled={isUpdating}
                    className="whitespace-nowrap"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Customize
                  </Button>
                )}

                {cookieBannerConfig.acceptAllButton && (
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    disabled={isUpdating}
                    className="whitespace-nowrap"
                  >
                    Accept All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Manage your cookie preferences below. You can change these settings at any time.
            </div>

            {COOKIE_CATEGORIES.map((categoryInfo) => (
              <Card key={categoryInfo.category} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {categoryInfo.title}
                        {categoryInfo.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {categoryInfo.description}
                      </p>
                    </div>
                    <Checkbox
                      id={`cookie-${categoryInfo.category}`}
                      checked={customPreferences[categoryInfo.category]}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(categoryInfo.category, checked as boolean)
                      }
                      disabled={categoryInfo.required}
                    />
                  </div>
                </CardHeader>

                {!categoryInfo.required && (
                  <CardContent className="pt-0">
                    <Label
                      htmlFor={`cookie-${categoryInfo.category}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Enable {categoryInfo.title.toLowerCase()}
                    </Label>
                    {categoryInfo.examples.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Examples:</div>
                        <div className="flex flex-wrap gap-1">
                          {categoryInfo.examples.map((example, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCustomization(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCustomPreferences}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add bottom padding to prevent content overlap when banner is at bottom */}
      {isBottomPosition && (
        <style jsx>{`
          body {
            padding-bottom: 200px;
          }
        `}</style>
      )}
    </>
  );
}

// Cookie Settings Button for users to manage preferences later
export function CookieSettingsButton() {
  const [showSettings, setShowSettings] = useState(false);
  const { consentPreferences, updateConsentPreferences, isUpdating } = useGDPR();

  const [localPreferences, setLocalPreferences] = useState<Record<CookieConsentCategory, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  React.useEffect(() => {
    if (consentPreferences) {
      setLocalPreferences({
        essential: consentPreferences.essential,
        analytics: consentPreferences.analytics,
        marketing: consentPreferences.marketing,
        personalization: consentPreferences.personalization,
      });
    }
  }, [consentPreferences]);

  const handleSaveSettings = async () => {
    await updateConsentPreferences(localPreferences);
    setShowSettings(false);
  };

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          <Cookie className="w-3 h-3 mr-1" />
          Cookie Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cookie Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            You can change your cookie preferences at any time. Some settings may affect your experience on the site.
          </div>

          {COOKIE_CATEGORIES.map((categoryInfo) => (
            <Card key={categoryInfo.category} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {categoryInfo.title}
                      {categoryInfo.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryInfo.description}
                    </p>
                  </div>
                  <Checkbox
                    id={`settings-cookie-${categoryInfo.category}`}
                    checked={localPreferences[categoryInfo.category]}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        [categoryInfo.category]: checked as boolean,
                      }))
                    }
                    disabled={categoryInfo.required}
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Label
                  htmlFor={`settings-cookie-${categoryInfo.category}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {categoryInfo.required ? 'Always enabled' : `Enable ${categoryInfo.title.toLowerCase()}`}
                </Label>
                {categoryInfo.examples.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Examples:</div>
                    <div className="flex flex-wrap gap-1">
                      {categoryInfo.examples.map((example, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}