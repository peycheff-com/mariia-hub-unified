import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { OfflineBookingManager } from '@/components/pwa/OfflineBookingManager';
import { PushNotificationManager } from '@/components/pwa/PushNotificationManager';
import { HomeScreenExperience } from '@/components/pwa/HomeScreenExperience';
import { DeviceIntegration } from '@/components/pwa/DeviceIntegration';
import { GeolocationServices } from '@/components/pwa/GeolocationServices';
import { MobilePerformance } from '@/components/pwa/MobilePerformance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Zap, MapPin, Settings, BarChart3 } from 'lucide-react';

export default function PWADashboard() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>PWA Dashboard - Mariia Beauty & Fitness</title>
        <meta name="description" content="Progressive Web App features and settings for enhanced mobile experience" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{t('pwaDashboard.title')}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pwaDashboard.description')}
            </p>
          </div>

          {/* PWA Features Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="offline" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.offline')}</span>
              </TabsTrigger>
              <TabsTrigger value="notification aria-live="polite" aria-atomic="true"s" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.notification aria-live="polite" aria-atomic="true"s')}</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.location')}</span>
              </TabsTrigger>
              <TabsTrigger value="device" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.device')}</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pwaDashboard.performance')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <HomeScreenExperience />
            </TabsContent>

            <TabsContent value="offline" className="space-y-6">
              <OfflineBookingManager />
            </TabsContent>

            <TabsContent value="notification aria-live="polite" aria-atomic="true"s" className="space-y-6">
              <PushNotificationManager />
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <GeolocationServices />
            </TabsContent>

            <TabsContent value="device" className="space-y-6">
              <DeviceIntegration />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <MobilePerformance />
            </TabsContent>
          </Tabs>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('pwaDashboard.offlineFirst')}
                </CardTitle>
                <CardDescription>
                  {t('pwaDashboard.offlineFirstDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('pwaDashboard.feature1')}</li>
                  <li>• {t('pwaDashboard.feature2')}</li>
                  <li>• {t('pwaDashboard.feature3')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('pwaDashboard.locationBased')}
                </CardTitle>
                <CardDescription>
                  {t('pwaDashboard.locationBasedDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('pwaDashboard.feature4')}</li>
                  <li>• {t('pwaDashboard.feature5')}</li>
                  <li>• {t('pwaDashboard.feature6')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  {t('pwaDashboard.deviceIntegration')}
                </CardTitle>
                <CardDescription>
                  {t('pwaDashboard.deviceIntegrationDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('pwaDashboard.feature7')}</li>
                  <li>• {t('pwaDashboard.feature8')}</li>
                  <li>• {t('pwaDashboard.feature9')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}