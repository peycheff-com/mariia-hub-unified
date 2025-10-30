import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Sync,
  ChevronRight,
  Phone,
  MapPin,
  Camera,
  Share2,
  Download,
  Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';

interface OfflineBookingManagerProps {
  className?: string;
}

interface OfflineBooking {
  id: string;
  serviceType: 'beauty' | 'fitness';
  serviceName: string;
  dateTime: string;
  status: 'pending' | 'synced' | 'failed';
  clientInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  calendarIntegration?: boolean;
  locationServices?: boolean;
  photoUpload?: boolean;
}

interface LocationService {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  services: string[];
}

export function OfflineBookingManager({ className = '' }: OfflineBookingManagerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);
  const [nearbyServices, setNearbyServices] = useState<LocationService[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    camera: false,
    contacts: false,
    calendar: false,
    geolocation: false,
    notification aria-live="polite" aria-atomic="true"s: false,
    share: false,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      const wasOffline = !isOnline;
      const nowOnline = navigator.onLine;
      setIsOnline(nowOnline);

      if (nowOnline && wasOffline) {
        // Just came back online - trigger sync
        handleSyncOfflineData();
      }
    };

    const checkDeviceCapabilities = () => {
      setDeviceCapabilities({
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        contacts: 'contacts' in navigator && 'select' in navigator.contacts,
        calendar: 'share' in navigator, // Calendar integration via Web Share API
        geolocation: 'geolocation' in navigator,
        notification aria-live="polite" aria-atomic="true"s: 'Notification' in window && Notification.permission === 'granted',
        share: 'share' in navigator,
      });
    };

    // Load offline bookings from localStorage
    loadOfflineBookings();

    // Load cached location services
    loadCachedLocationServices();

    // Check device capabilities
    checkDeviceCapabilities();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  const loadOfflineBookings = () => {
    try {
      const stored = localStorage.getItem('offline-bookings');
      if (stored) {
        const bookings = JSON.parse(stored);
        setOfflineBookings(bookings);
      }
    } catch (error) {
      console.error('Failed to load offline bookings:', error);
    }
  };

  const loadCachedLocationServices = () => {
    try {
      const cached = localStorage.getItem('cached-location-services');
      if (cached) {
        const services = JSON.parse(cached);
        const isFresh = Date.now() - services.timestamp < 60 * 60 * 1000; // 1 hour
        if (isFresh) {
          setNearbyServices(services.data);
        }
      }
    } catch (error) {
      console.error('Failed to load cached location services:', error);
    }
  };

  const handleSyncOfflineData = async () => {
    if (!isOnline || isSyncing || offlineBookings.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const totalBookings = offlineBookings.filter(b => b.status === 'pending').length;
      let syncedCount = 0;

      for (const booking of offlineBookings) {
        if (booking.status !== 'pending') continue;

        try {
          const response = await fetch('/api/offline-booking/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(booking),
          });

          if (response.ok) {
            // Update booking status to synced
            setOfflineBookings(prev =>
              prev.map(b => b.id === booking.id ? { ...b, status: 'synced' } : b)
            );
            syncedCount++;
          }

          setSyncProgress((syncedCount / totalBookings) * 100);

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Failed to sync booking:', booking.id, error);
          // Mark as failed
          setOfflineBookings(prev =>
            prev.map(b => b.id === booking.id ? { ...b, status: 'failed' } : b)
          );
        }
      }

      // Update localStorage
      localStorage.setItem('offline-bookings', JSON.stringify(offlineBookings));

      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.syncComplete'),
        description: t('offlineBooking.syncCompleteDesc', { count: syncedCount }),
      });

      // Clear synced bookings after successful sync
      setTimeout(() => {
        setOfflineBookings(prev => prev.filter(b => b.status !== 'synced'));
        localStorage.setItem('offline-bookings', JSON.stringify(
          offlineBookings.filter(b => b.status !== 'synced')
        ));
      }, 3000);

    } catch (error) {
      console.error('Sync failed:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.syncFailed'),
        description: t('offlineBooking.syncFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleCalendarIntegration = async () => {
    if (!deviceCapabilities.calendar) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.calendarNotSupported'),
        description: t('offlineBooking.calendarNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create calendar event data
      const eventData = {
        title: t('offlineBooking.calendarEventTitle'),
        start: new Date().toISOString(),
        duration: 60 * 60 * 1000, // 1 hour
        location: 'Warsaw, Poland',
      };

      // Use Web Share API for calendar integration
      if (navigator.share) {
        await navigator.share({
          title: eventData.title,
          text: `${eventData.title} - ${eventData.location}`,
          url: window.location.href,
        });
      }

      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.calendarSuccess'),
        description: t('offlineBooking.calendarSuccessDesc'),
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Calendar integration failed:', error);
        toast aria-live="polite" aria-atomic="true"({
          title: t('offlineBooking.calendarFailed'),
          description: t('offlineBooking.calendarFailedDesc'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleLocationServices = async () => {
    if (!deviceCapabilities.geolocation) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.locationNotSupported'),
        description: t('offlineBooking.locationNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      // Get nearby services based on location
      const response = await fetch(`/api/location/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);

      if (response.ok) {
        const services = await response.json();
        setNearbyServices(services);

        // Cache location services
        localStorage.setItem('cached-location-services', JSON.stringify({
          timestamp: Date.now(),
          data: services,
        }));

        toast aria-live="polite" aria-atomic="true"({
          title: t('offlineBooking.locationSuccess'),
          description: t('offlineBooking.locationSuccessDesc', { count: services.length }),
        });
      }
    } catch (error) {
      console.error('Location services failed:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.locationFailed'),
        description: t('offlineBooking.locationFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCameraCapture = async () => {
    if (!deviceCapabilities.camera) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.cameraNotSupported'),
        description: t('offlineBooking.cameraNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create canvas for capturing image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Wait for video to be ready
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setTimeout(() => {
          context?.drawImage(video, 0, 0);

          // Convert to blob and store
          canvas.toBlob(async (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const imageData = reader.result as string;
                localStorage.setItem('profile-photo', imageData);

                toast aria-live="polite" aria-atomic="true"({
                  title: t('offlineBooking.photoSuccess'),
                  description: t('offlineBooking.photoSuccessDesc'),
                });
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.9);

          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
        }, 2000); // 2 second delay for user to prepare
      };
    } catch (error) {
      console.error('Camera capture failed:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.cameraFailed'),
        description: t('offlineBooking.cameraFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleContactsIntegration = async () => {
    if (!deviceCapabilities.contacts) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('offlineBooking.contactsNotSupported'),
        description: t('offlineBooking.contactsNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], {
        multiple: false
      });

      if (contacts.length > 0) {
        const contact = contacts[0];

        // Pre-fill booking form with contact data
        localStorage.setItem('contact-data', JSON.stringify({
          name: `${contact.name[0].given} ${contact.name[0].family}`,
          email: contact.email?.[0] || '',
          phone: contact.tel?.[0] || '',
        }));

        toast aria-live="polite" aria-atomic="true"({
          title: t('offlineBooking.contactsSuccess'),
          description: t('offlineBooking.contactsSuccessDesc'),
        });

        // Navigate to booking
        navigate('/book');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Contacts integration failed:', error);
        toast aria-live="polite" aria-atomic="true"({
          title: t('offlineBooking.contactsFailed'),
          description: t('offlineBooking.contactsFailedDesc'),
          variant: 'destructive',
        });
      }
    }
  };

  const pendingBookings = offlineBookings.filter(b => b.status === 'pending').length;
  const syncedBookings = offlineBookings.filter(b => b.status === 'synced').length;
  const failedBookings = offlineBookings.filter(b => b.status === 'failed').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {isOnline ? t('offlineBooking.online') : t('offlineBooking.offline')}
                </CardTitle>
                <CardDescription>
                  {isOnline
                    ? t('offlineBooking.onlineDesc')
                    : t('offlineBooking.offlineDesc')
                  }
                </CardDescription>
              </div>
            </div>

            {isOnline && pendingBookings > 0 && (
              <Button
                onClick={handleSyncOfflineData}
                disabled={isSyncing}
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <Sync className="h-4 w-4 mr-2 animate-spin" />
                    {t('offlineBooking.syncing')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('offlineBooking.syncNow')} ({pendingBookings})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Sync Progress */}
        {isSyncing && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('offlineBooking.syncProgress')}</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Offline Booking Summary */}
      {(pendingBookings > 0 || failedBookings > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('offlineBooking.pendingBookings')}
            </CardTitle>
            <CardDescription>
              {t('offlineBooking.pendingBookingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{pendingBookings}</div>
                <div className="text-sm text-blue-600">{t('offlineBooking.pending')}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{syncedBookings}</div>
                <div className="text-sm text-green-600">{t('offlineBooking.synced')}</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{failedBookings}</div>
                <div className="text-sm text-red-600">{t('offlineBooking.failed')}</div>
              </div>
            </div>

            {offlineBookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    booking.status === 'pending' ? 'bg-yellow-500' :
                    booking.status === 'synced' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">{booking.serviceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(booking.dateTime).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant={booking.status === 'pending' ? 'secondary' : booking.status === 'synced' ? 'default' : 'destructive'}>
                  {booking.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Device Integration Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('offlineBooking.deviceFeatures')}</CardTitle>
          <CardDescription>
            {t('offlineBooking.deviceFeaturesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Calendar Integration */}
            <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start"
                  disabled={!deviceCapabilities.calendar}
                >
                  <Calendar className="h-6 w-6 mb-2 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">{t('offlineBooking.calendarIntegration')}</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceCapabilities.calendar
                        ? t('offlineBooking.calendarAvailable')
                        : t('offlineBooking.calendarUnavailable')
                      }
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto mt-2" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('offlineBooking.calendarIntegration')}</DialogTitle>
                  <DialogDescription>
                    {t('offlineBooking.calendarIntegrationDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button onClick={handleCalendarIntegration} className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('offlineBooking.addToCalendar')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Location Services */}
            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start"
                  disabled={!deviceCapabilities.geolocation}
                >
                  <MapPin className="h-6 w-6 mb-2 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">{t('offlineBooking.locationServices')}</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceCapabilities.geolocation
                        ? t('offlineBooking.locationAvailable')
                        : t('offlineBooking.locationUnavailable')
                      }
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto mt-2" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('offlineBooking.nearbyServices')}</DialogTitle>
                  <DialogDescription>
                    {t('offlineBooking.nearbyServicesDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button onClick={handleLocationServices} className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('offlineBooking.findNearbyServices')}
                  </Button>

                  {nearbyServices.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {nearbyServices.map(service => (
                        <div key={service.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">{service.address}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {service.distance} km away • Rating: {service.rating}/5
                              </div>
                            </div>
                            <Badge variant="outline">{service.services.length} services</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Camera Integration */}
            <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start"
                  disabled={!deviceCapabilities.camera}
                >
                  <Camera className="h-6 w-6 mb-2 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">{t('offlineBooking.cameraIntegration')}</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceCapabilities.camera
                        ? t('offlineBooking.cameraAvailable')
                        : t('offlineBooking.cameraUnavailable')
                      }
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto mt-2" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('offlineBooking.profilePhoto')}</DialogTitle>
                  <DialogDescription>
                    {t('offlineBooking.profilePhotoDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button onClick={handleCameraCapture} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    {t('offlineBooking.takePhoto')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contacts Integration */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
              onClick={handleContactsIntegration}
              disabled={!deviceCapabilities.contacts}
            >
              <Phone className="h-6 w-6 mb-2 text-orange-600" />
              <div className="text-left">
                <div className="font-medium">{t('offlineBooking.contactsIntegration')}</div>
                <div className="text-sm text-muted-foreground">
                  {deviceCapabilities.contacts
                    ? t('offlineBooking.contactsAvailable')
                    : t('offlineBooking.contactsUnavailable')
                  }
                </div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto mt-2" />
            </Button>

            {/* Share Feature */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
              disabled={!deviceCapabilities.share}
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Mariia Beauty & Fitness',
                      text: 'Check out these amazing beauty and fitness services in Warsaw!',
                      url: window.location.href,
                    });
                  } catch (error) {
                    if (error.name !== 'AbortError') {
                      console.error('Share failed:', error);
                    }
                  }
                }
              }}
            >
              <Share2 className="h-6 w-6 mb-2 text-pink-600" />
              <div className="text-left">
                <div className="font-medium">{t('offlineBooking.shareApp')}</div>
                <div className="text-sm text-muted-foreground">
                  {deviceCapabilities.share
                    ? t('offlineBooking.shareAvailable')
                    : t('offlineBooking.shareUnavailable')
                  }
                </div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto mt-2" />
            </Button>

            {/* Offline Mode */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => navigate('/booking')}
            >
              <Download className="h-6 w-6 mb-2 text-gray-600" />
              <div className="text-left">
                <div className="font-medium">{t('offlineBooking.offlineMode')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('offlineBooking.offlineModeDesc')}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto mt-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Capabilities Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('offlineBooking.capabilitiesInfo')}
        </AlertDescription>
      </Alert>
    </div>
  );
}