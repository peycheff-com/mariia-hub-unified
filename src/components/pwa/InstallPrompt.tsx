import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay
      setTimeout(() => {
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);

      toast aria-live="polite" aria-atomic="true"({
        title: t('pwa.installSuccess'),
        description: t('pwa.installSuccessDesc'),
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user previously dismissed
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = Math.floor(
        (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDismissed < 30) {
        setDismissed(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed, toast aria-live="polite" aria-atomic="true", t]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // App will be installed - appinstalled event will handle success
      } else {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('pwa.installError'),
        description: t('pwa.installErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleShowInstructions = () => {
    setShowPrompt(false);
    // Show instructions based on device
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (/iphone|ipad|ipod/.test(userAgent)) {
      instructions = t('pwa.iosInstructions');
    } else if (/android/.test(userAgent)) {
      instructions = t('pwa.androidInstructions');
    } else {
      instructions = t('pwa.desktopInstructions');
    }

    toast aria-live="polite" aria-atomic="true"({
      title: t('pwa.installInstructions'),
      description: instructions,
      duration: 10000,
    });
  };

  // Don't show if already installed, no prompt, or dismissed
  if (isInstalled || !showPrompt || dismissed) {
    return null;
  }

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase());

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 shadow-2xl border-2 animate-in slide-in-from-bottom duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{t('pwa.installTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('pwa.installDesc')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isIOS ? (
              <Smartphone className="h-4 w-4" />
            ) : isAndroid ? (
              <Smartphone className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            <span>
              {isIOS
                ? t('pwa.iosDevice')
                : isAndroid
                ? t('pwa.androidDevice')
                : t('pwa.desktopDevice')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded-lg">
              <Badge variant="secondary" className="text-xs mb-1">
                {t('pwa.featureOffline')}
              </Badge>
              <p className="text-xs text-muted-foreground">{t('pwa.offlineDesc')}</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Badge variant="secondary" className="text-xs mb-1">
                {t('pwa.featureFast')}
              </Badge>
              <p className="text-xs text-muted-foreground">{t('pwa.fastDesc')}</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Badge variant="secondary" className="text-xs mb-1">
                {t('pwa.featureNative')}
              </Badge>
              <p className="text-xs text-muted-foreground">{t('pwa.nativeDesc')}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {deferredPrompt && !isIOS ? (
              <Button onClick={handleInstall} className="flex-1" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('pwa.installButton')}
              </Button>
            ) : (
              <Button onClick={handleShowInstructions} className="flex-1" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                {t('pwa.showInstructions')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              {t('pwa.maybeLater')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}