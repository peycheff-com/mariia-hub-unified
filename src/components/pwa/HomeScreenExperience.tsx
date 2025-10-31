import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Download,
  Star,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Wifi,
  WifiOff,
  Home,
  Search,
  Calendar,
  User,
  Settings,
  Bell,
  Heart,
  Share2,
  Grid3X3,
  ArrowUp,
  Navigation,
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface HomeScreenExperienceProps {
  className?: string;
}

interface HomeScreenIcon {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  category: 'booking' | 'services' | 'account' | 'utility';
}

interface ShortcutData {
  name: string;
  short_name: string;
  description: string;
  url: string;
  icons: Array<{ src: string; sizes: string }>;
}

export function HomeScreenExperience({ className = '' }: HomeScreenExperienceProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [customShortcuts, setCustomShortcuts] = useState<HomeScreenIcon[]>([]);
  const [installationProgress, setInstallationProgress] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [lastVisitedPages, setLastVisitedPages] = useState<string[]>([]);

  // Check if app is running in standalone mode (PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast({
        title: t('homeScreen.appInstalled'),
        description: t('homeScreen.appInstalledDesc'),
      });
    };

    // Network status monitoring
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
      } else {
        const connection = (navigator as any).connection ||
                          (navigator as any).mozConnection ||
                          (navigator as any).webkitConnection;

        if (connection) {
          const effectiveType = connection.effectiveType;
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            setNetworkStatus('slow');
          } else {
            setNetworkStatus('online');
          }
        } else {
          setNetworkStatus('online');
        }
      }
    };

    // Load custom shortcuts
    loadCustomShortcuts();

    // Load last visited pages
    loadLastVisitedPages();

    // Check if this is first visit (show onboarding)
    const hasVisitedBefore = localStorage.getItem('pwa-onboarding-completed');
    if (!hasVisitedBefore && isStandalone) {
      setShowOnboarding(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [isStandalone, toast, t]);

  const loadCustomShortcuts = () => {
    try {
      const stored = localStorage.getItem('custom-shortcuts');
      if (stored) {
        const shortcuts = JSON.parse(stored);
        setCustomShortcuts(shortcuts);
      } else {
        // Set default shortcuts
        const defaults = getDefaultShortcuts();
        setCustomShortcuts(defaults);
        localStorage.setItem('custom-shortcuts', JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Failed to load custom shortcuts:', error);
    }
  };

  const loadLastVisitedPages = () => {
    try {
      const stored = localStorage.getItem('last-visited-pages');
      if (stored) {
        const pages = JSON.parse(stored);
        setLastVisitedPages(pages);
      }
    } catch (error) {
      console.error('Failed to load last visited pages:', error);
    }
  };

  const getDefaultShortcuts = (): HomeScreenIcon[] => [
    {
      id: 'beauty',
      name: t('homeScreen.beautyServices'),
      description: t('homeScreen.beautyServicesDesc'),
      url: '/beauty',
      icon: 'sparkles',
      color: 'text-pink-600',
      category: 'services'
    },
    {
      id: 'fitness',
      name: t('homeScreen.fitnessPrograms'),
      description: t('homeScreen.fitnessProgramsDesc'),
      url: '/fitness',
      icon: 'zap',
      color: 'text-blue-600',
      category: 'services'
    },
    {
      id: 'booking',
      name: t('homeScreen.bookAppointment'),
      description: t('homeScreen.bookAppointmentDesc'),
      url: '/book',
      icon: 'calendar',
      color: 'text-green-600',
      category: 'booking'
    },
    {
      id: 'dashboard',
      name: t('homeScreen.myDashboard'),
      description: t('homeScreen.myDashboardDesc'),
      url: '/dashboard',
      icon: 'user',
      color: 'text-purple-600',
      category: 'account'
    },
    {
      id: 'location',
      name: t('homeScreen.nearbyServices'),
      description: t('homeScreen.nearbyServicesDesc'),
      url: '/location',
      icon: 'map-pin',
      color: 'text-orange-600',
      category: 'utility'
    },
    {
      id: 'camera',
      name: t('homeScreen.profilePhoto'),
      description: t('homeScreen.profilePhotoDesc'),
      url: '/camera',
      icon: 'camera',
      color: 'text-indigo-600',
      category: 'utility'
    }
  ];

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstallationProgress(10);

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      setInstallationProgress(30);

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      setInstallationProgress(60);

      if (outcome === 'accepted') {
        setInstallationProgress(80);
        // User accepted the install prompt
        console.log('User accepted the install prompt');
      } else {
        // User dismissed the install prompt
        console.log('User dismissed the install prompt');
      }

      setInstallationProgress(100);

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);

      setTimeout(() => setInstallationProgress(0), 1000);

    } catch (error) {
      console.error('Error during app installation:', error);
      setInstallationProgress(0);
      toast({
        title: t('homeScreen.installationFailed'),
        description: t('homeScreen.installationFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  const shouldShowInstallPrompt = () => {
    if (isInstalled || !deferredPrompt || showInstallPrompt) return false;

    // Don't show if dismissed in last 7 days
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return false;
    }

    return true;
  };

  const addCustomShortcut = (shortcut: HomeScreenIcon) => {
    const updated = [...customShortcuts, shortcut];
    setCustomShortcuts(updated);
    localStorage.setItem('custom-shortcuts', JSON.stringify(updated));
    toast({
      title: t('homeScreen.shortcutAdded'),
      description: t('homeScreen.shortcutAddedDesc', { name: shortcut.name }),
    });
  };

  const removeCustomShortcut = (id: string) => {
    const updated = customShortcuts.filter(s => s.id !== id);
    setCustomShortcuts(updated);
    localStorage.setItem('custom-shortcuts', JSON.stringify(updated));
  };

  const trackPageVisit = (url: string) => {
    const updated = [url, ...lastVisitedPages.filter(p => p !== url)].slice(0, 5);
    setLastVisitedPages(updated);
    localStorage.setItem('last-visited-pages', JSON.stringify(updated));
  };

  const handleNavigation = (url: string) => {
    navigate(url);
    trackPageVisit(url);
  };

  const completeOnboarding = () => {
    localStorage.setItem('pwa-onboarding-completed', 'true');
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const onboardingSteps = [
    {
      title: t('homeScreen.welcomeTitle'),
      description: t('homeScreen.welcomeDesc'),
      icon: Home,
    },
    {
      title: t('homeScreen.shortcutsTitle'),
      description: t('homeScreen.shortcutsDesc'),
      icon: Grid3X3,
    },
    {
      title: t('homeScreen.offlineTitle'),
      description: t('homeScreen.offlineDesc'),
      icon: WifiOff,
    },
    {
      title: t('homeScreen.readyTitle'),
      description: t('homeScreen.readyDesc'),
      icon: CheckCircle,
    },
  ];

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      sparkles: Sparkles,
      zap: Zap,
      calendar: Calendar,
      user: User,
      'map-pin': MapPin,
      camera: Camera,
      search: Search,
      settings: Settings,
      bell: Bell,
      heart: Heart,
      home: Home,
      navigation: Navigation,
      clock: Clock,
    };
    return icons[iconName] || Grid3X3;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Install Prompt */}
      {shouldShowInstallPrompt() && (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('homeScreen.installApp')}</CardTitle>
                  <CardDescription>
                    {t('homeScreen.installAppDesc')}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissInstallPrompt}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <Button onClick={handleInstallClick} disabled={installationProgress > 0}>
                {installationProgress > 0 ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('homeScreen.installing')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('homeScreen.install')}
                  </>
                )}
              </Button>
              {installationProgress > 0 && (
                <div className="flex-1">
                  <Progress value={installationProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installation Success */}
      {isInstalled && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('homeScreen.installedSuccessfully')}
          </AlertDescription>
        </Alert>
      )}

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {React.createElement(onboardingSteps[onboardingStep].icon, {
                className: "h-6 w-6 text-primary"
              })}
              {onboardingSteps[onboardingStep].title}
            </DialogTitle>
            <DialogDescription>
              {onboardingSteps[onboardingStep].description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index <= onboardingStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {onboardingStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                >
                  {t('homeScreen.previous')}
                </Button>
              )}

              {onboardingStep < onboardingSteps.length - 1 ? (
                <Button onClick={() => setOnboardingStep(onboardingStep + 1)}>
                  {t('homeScreen.next')}
                </Button>
              ) : (
                <Button onClick={completeOnboarding}>
                  {t('homeScreen.getStarted')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Network Status */}
      {networkStatus !== 'online' && (
        <Card className={`border-l-4 ${
          networkStatus === 'offline' ? 'border-l-red-500' : 'border-l-yellow-500'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {networkStatus === 'offline' ? (
                <WifiOff className="h-5 w-5 text-red-600" />
              ) : (
                <Wifi className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <div className="font-medium">
                  {networkStatus === 'offline'
                    ? t('homeScreen.offline')
                    : t('homeScreen.slowConnection')
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {networkStatus === 'offline'
                    ? t('homeScreen.offlineDesc')
                    : t('homeScreen.slowConnectionDesc')
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Screen Shortcuts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                {isStandalone ? t('homeScreen.appShortcuts') : t('homeScreen.quickAccess')}
              </CardTitle>
              <CardDescription>
                {isStandalone
                  ? t('homeScreen.appShortcutsDesc')
                  : t('homeScreen.quickAccessDesc')
                }
              </CardDescription>
            </div>
            {isStandalone && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Smartphone className="h-3 w-3 mr-1" />
                {t('homeScreen.installed')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customShortcuts.map((shortcut) => {
              const IconComponent = getIconComponent(shortcut.icon);
              return (
                <Button
                  key={shortcut.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent/50"
                  onClick={() => handleNavigation(shortcut.url)}
                >
                  <div className={`p-3 rounded-lg ${shortcut.color} bg-opacity-10`}>
                    <IconComponent className={`h-6 w-6 ${shortcut.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{shortcut.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {shortcut.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Recently Visited */}
          {lastVisitedPages.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">{t('homeScreen.recentlyVisited')}</h3>
              <div className="flex flex-wrap gap-2">
                {lastVisitedPages.map((page, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleNavigation(page)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {page.replace('/', '') || t('homeScreen.home')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('homeScreen.pwaFeatures')}</CardTitle>
          <CardDescription>
            {t('homeScreen.pwaFeaturesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded">
                <WifiOff className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{t('homeScreen.offlineAccess')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('homeScreen.offlineAccessDesc')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-100 rounded">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">{t('homeScreen.lightningFast')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('homeScreen.lightningFastDesc')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">{t('homeScreen.pushNotifications')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('homeScreen.pushNotificationsDesc')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-orange-100 rounded">
                <Smartphone className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="font-medium">{t('homeScreen.nativeFeel')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('homeScreen.nativeFeelDesc')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Install Instructions for non-installed users */}
      {!isInstalled && !isStandalone && (
        <Card>
          <CardHeader>
            <CardTitle>{t('homeScreen.howToInstall')}</CardTitle>
            <CardDescription>
              {t('homeScreen.howToInstallDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <div className="font-medium">{t('homeScreen.installStep1')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('homeScreen.installStep1Desc')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <div className="font-medium">{t('homeScreen.installStep2')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('homeScreen.installStep2Desc')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <div className="font-medium">{t('homeScreen.installStep3')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('homeScreen.installStep3Desc')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for installed PWA */}
      {isStandalone && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setShowSpeedDial(!showSpeedDial)}
            >
              <Grid3X3 className="h-6 w-6" />
            </Button>

            {showSpeedDial && (
              <div className="absolute bottom-16 right-0 space-y-2">
                {customShortcuts.slice(0, 4).map((shortcut, index) => {
                  const IconComponent = getIconComponent(shortcut.icon);
                  return (
                    <Button
                      key={shortcut.id}
                      size="sm"
                      className="h-12 w-12 rounded-full shadow-md"
                      style={{
                        transform: `translateY(-${(index + 1) * 56}px)`,
                        opacity: showSpeedDial ? 1 : 0,
                        transition: 'all 0.2s ease-out',
                      }}
                      onClick={() => {
                        handleNavigation(shortcut.url);
                        setShowSpeedDial(false);
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}