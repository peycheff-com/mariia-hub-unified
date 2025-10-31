import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  Users,
  Calendar,
  MapPin,
  Share2,
  Phone,
  Mail,
  Image,
  Video,
  Mic,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Download,
  Settings,
  Zap,
  Wifi,
  Battery,
  Navigation
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface DeviceIntegrationProps {
  className?: string;
}

interface DeviceCapability {
  camera: boolean;
  contacts: boolean;
  calendar: boolean;
  geolocation: boolean;
  notifications: boolean;
  share: boolean;
  bluetooth: boolean;
  nfc: boolean;
  vibration: boolean;
  fullscreen: boolean;
  orientation: boolean;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null;
  battery: {
    level: number;
    charging: boolean;
  } | null;
}

interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: string;
  size: number;
}

export function DeviceIntegration({ className = '' }: DeviceIntegrationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [capabilities, setCapabilities] = useState<DeviceCapability>({
    camera: false,
    contacts: false,
    calendar: false,
    geolocation: false,
    notifications: false,
    share: false,
    bluetooth: false,
    nfc: false,
    vibration: false,
    fullscreen: false,
    orientation: false,
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<MediaFile[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ContactInfo[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkDeviceCapabilities();
    getDeviceInfo();
    checkPermissions();

    return () => {
      // Cleanup media stream on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkDeviceCapabilities = () => {
    const newCapabilities: DeviceCapability = {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      contacts: !!(navigator as any).contacts && !!(navigator as any).contacts.select,
      calendar: !!(navigator.share && navigator.canShare), // Calendar integration via share API
      geolocation: !!navigator.geolocation,
      notifications: !!('Notification' in window),
      share: !!navigator.share,
      bluetooth: !!(navigator as any).bluetooth,
      nfc: !!(navigator as any).nfc,
      vibration: !!('vibrate' in navigator),
      fullscreen: !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled),
      orientation: !!(window.screen.orientation && window.screen.orientation.lock),
    };

    setCapabilities(newCapabilities);
  };

  const getDeviceInfo = async () => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    let battery = null;
    if ('getBattery' in navigator) {
      try {
        const batteryManager = await (navigator as any).getBattery();
        battery = {
          level: batteryManager.level,
          charging: batteryManager.charging,
        };
      } catch (error) {
        console.error('Battery API not available:', error);
      }
    }

    const info: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      deviceMemory: (navigator as any).deviceMemory || 0,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      } : null,
      battery,
    };

    setDeviceInfo(info);
  };

  const checkPermissions = async () => {
    // Check notification aria-live="polite" aria-atomic="true" permission
    if ('Notification' in window) {
      const notification aria-live="polite" aria-atomic="true"Permission = Notification.permission;
      setCapabilities(prev => ({
        ...prev,
        notifications: notification aria-live="polite" aria-atomic="true"Permission === 'granted'
      }));
    }
  };

  const requestCameraAccess = async () => {
    if (!capabilities.camera) {
      toast({
        title: t('deviceIntegration.cameraNotSupported'),
        description: t('deviceIntegration.cameraNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          audio: false
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      toast({
        title: t('deviceIntegration.cameraAccessDenied'),
        description: t('deviceIntegration.cameraAccessDeniedDesc'),
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !mediaStreamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const preview = URL.createObjectURL(file);

      const mediaFile: MediaFile = {
        file,
        preview,
        type: file.type,
        size: file.size,
      };

      setCapturedMedia(prev => [...prev, mediaFile]);

      // Save to localStorage for persistence
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result as string;
          const existingImages = JSON.parse(localStorage.getItem('captured-images') || '[]');
          existingImages.push({
            id: Date.now(),
            data: imageData,
            type: file.type,
            timestamp: Date.now(),
          });
          localStorage.setItem('captured-images', JSON.stringify(existingImages));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to save image to localStorage:', error);
      }

      toast({
        title: t('deviceIntegration.photoCaptured'),
        description: t('deviceIntegration.photoCapturedDesc'),
      });
    }, 'image/jpeg', 0.9);
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
  };

  const recordVideo = async () => {
    if (!capabilities.camera) {
      toast({
        title: t('deviceIntegration.videoNotSupported'),
        description: t('deviceIntegration.videoNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        setIsRecording(true);

        // Start recording implementation would go here
        // This would require MediaRecorder API
      }
    } catch (error) {
      console.error('Video recording failed:', error);
      toast({
        title: t('deviceIntegration.videoRecordingFailed'),
        description: t('deviceIntegration.videoRecordingFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const selectContacts = async () => {
    if (!capabilities.contacts) {
      toast({
        title: t('deviceIntegration.contactsNotSupported'),
        description: t('deviceIntegration.contactsNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel', 'address'], {
        multiple: true,
      });

      const contactInfos: ContactInfo[] = contacts.map((contact: any) => ({
        name: `${contact.name[0].given} ${contact.name[0].family}`,
        email: contact.email?.[0],
        phone: contact.tel?.[0],
        address: contact.address?.[0]?.formatted,
      }));

      setSelectedContacts(contactInfos);

      // Save to localStorage
      localStorage.setItem('selected-contacts', JSON.stringify(contactInfos));

      toast({
        title: t('deviceIntegration.contactsSelected'),
        description: t('deviceIntegration.contactsSelectedDesc', { count: contactInfos.length }),
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Contact selection failed:', error);
        toast({
          title: t('deviceIntegration.contactSelectionFailed'),
          description: t('deviceIntegration.contactSelectionFailedDesc'),
          variant: 'destructive',
        });
      }
    }
  };

  const getCurrentLocation = async () => {
    if (!capabilities.geolocation) {
      toast({
        title: t('deviceIntegration.locationNotSupported'),
        description: t('deviceIntegration.locationNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setCurrentLocation(location);

      // Save to localStorage
      localStorage.setItem('last-location', JSON.stringify({
        ...location,
        timestamp: Date.now(),
      }));

      // Get nearby services based on location
      try {
        const response = await fetch(`/api/location/nearby?lat=${location.latitude}&lng=${location.longitude}`);
        if (response.ok) {
          const services = await response.json();
          localStorage.setItem('nearby-services', JSON.stringify({
            services,
            location,
            timestamp: Date.now(),
          }));
        }
      } catch (error) {
        console.error('Failed to get nearby services:', error);
      }

      toast({
        title: t('deviceIntegration.locationObtained'),
        description: t('deviceIntegration.locationObtainedDesc', {
          accuracy: Math.round(location.accuracy),
        }),
      });
    } catch (error) {
      console.error('Location access failed:', error);
      toast({
        title: t('deviceIntegration.locationAccessFailed'),
        description: t('deviceIntegration.locationAccessFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const shareContent = async (content: {
    title: string;
    text: string;
    url?: string;
    files?: File[];
  }) => {
    if (!capabilities.share) {
      toast({
        title: t('deviceIntegration.shareNotSupported'),
        description: t('deviceIntegration.shareNotSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const shareData: ShareData = {
        title: content.title,
        text: content.text,
      };

      if (content.url) {
        shareData.url = content.url;
      }

      if (content.files && content.files.length > 0) {
        shareData.files = content.files;
      }

      await navigator.share(shareData);

      toast({
        title: t('deviceIntegration.contentShared'),
        description: t('deviceIntegration.contentSharedDesc'),
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          title: t('deviceIntegration.shareFailed'),
          description: t('deviceIntegration.shareFailedDesc'),
          variant: 'destructive',
        });
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!capabilities.fullscreen) return;

    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const vibrateDevice = (pattern: number | number[]) => {
    if (!capabilities.vibration) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  };

  const deleteMediaFile = (index: number) => {
    setCapturedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const getNetworkQualityColor = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g': return 'text-green-600';
      case '3g': return 'text-yellow-600';
      case '2g': return 'text-orange-600';
      case 'slow-2g': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 0.5) return 'text-green-600';
    if (level > 0.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Device Capabilities Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('deviceIntegration.deviceCapabilities')}
          </CardTitle>
          <CardDescription>
            {t('deviceIntegration.deviceCapabilitiesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(capabilities).map(([key, supported]) => {
              const icons: Record<string, any> = {
                camera: Camera,
                contacts: Users,
                calendar: Calendar,
                geolocation: MapPin,
                notifications: Bell,
                share: Share2,
                bluetooth: Zap,
                nfc: Wifi,
                vibration: Smartphone,
                fullscreen: Settings,
                orientation: Navigation,
              };

              const IconComponent = icons[key];

              return (
                <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                  <IconComponent className={`h-4 w-4 ${supported ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">
                      {t(`deviceIntegration.${key}`)}
                    </div>
                    <Badge variant={supported ? 'default' : 'secondary'} className="text-xs">
                      {supported ? t('deviceIntegration.supported') : t('deviceIntegration.notSupported')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Device Information */}
      {deviceInfo && (
        <Card>
          <CardHeader>
            <CardTitle>{t('deviceIntegration.deviceInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">{t('deviceIntegration.platform')}:</span> {deviceInfo.platform}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{t('deviceIntegration.language')}:</span> {deviceInfo.language}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{t('deviceIntegration.cpuCores')}:</span> {deviceInfo.hardwareConcurrency}
                </div>
                {deviceInfo.deviceMemory > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">{t('deviceIntegration.memory')}:</span> {deviceInfo.deviceMemory} GB
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {deviceInfo.connection && (
                  <>
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-medium">{t('deviceIntegration.connection')}:</span>
                      <Wifi className={`h-4 w-4 ${getNetworkQualityColor(deviceInfo.connection.effectiveType)}`} />
                      <span className={getNetworkQualityColor(deviceInfo.connection.effectiveType)}>
                        {deviceInfo.connection.effectiveType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{t('deviceIntegration.downloadSpeed')}:</span> {deviceInfo.connection.downlink} Mbps
                    </div>
                  </>
                )}

                {deviceInfo.battery && (
                  <div className="text-sm flex items-center gap-2">
                    <span className="font-medium">{t('deviceIntegration.battery')}:</span>
                    <Battery className={`h-4 w-4 ${getBatteryColor(deviceInfo.battery.level)}`} />
                    <span className={getBatteryColor(deviceInfo.battery.level)}>
                      {Math.round(deviceInfo.battery.level * 100)}%
                      {deviceInfo.battery.charging && ` (${t('deviceIntegration.charging')})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Integration Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('deviceIntegration.integrationFeatures')}</CardTitle>
          <CardDescription>
            {t('deviceIntegration.integrationFeaturesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="camera">{t('deviceIntegration.camera')}</TabsTrigger>
              <TabsTrigger value="contacts">{t('deviceIntegration.contacts')}</TabsTrigger>
              <TabsTrigger value="location">{t('deviceIntegration.location')}</TabsTrigger>
              <TabsTrigger value="share">{t('deviceIntegration.share')}</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-3">{t('deviceIntegration.cameraCapture')}</h3>

                  {!isCapturing ? (
                    <div className="space-y-2">
                      <Button onClick={requestCameraAccess} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        {t('deviceIntegration.openCamera')}
                      </Button>
                      <Button onClick={recordVideo} variant="outline" className="w-full">
                        <Video className="h-4 w-4 mr-2" />
                        {t('deviceIntegration.recordVideo')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg bg-black"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Image className="h-4 w-4 mr-2" alt="" />
                          {t('deviceIntegration.capture')}
                        </Button>
                        <Button onClick={stopCamera} variant="outline" className="flex-1">
                          <X className="h-4 w-4 mr-2" />
                          {t('deviceIntegration.close')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-3">{t('deviceIntegration.capturedMedia')}</h3>
                  {capturedMedia.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {capturedMedia.map((media, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <img
                            src={media.preview}
                            alt="Captured"
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{media.file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(media.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMediaFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {t('deviceIntegration.noCapturedMedia')}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <div className="space-y-4">
                <Button onClick={selectContacts} disabled={!capabilities.contacts}>
                  <Users className="h-4 w-4 mr-2" />
                  {t('deviceIntegration.selectContacts')}
                </Button>

                {selectedContacts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">{t('deviceIntegration.selectedContacts')}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedContacts.map((contact, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{contact.name}</div>
                          {contact.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-4">
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || !capabilities.geolocation}
                >
                  {isGettingLocation ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('deviceIntegration.gettingLocation')}
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('deviceIntegration.getCurrentLocation')}
                    </>
                  )}
                </Button>

                {currentLocation && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-medium">{t('deviceIntegration.currentLocation')}</h3>
                    <div className="text-sm">
                      <div>{t('deviceIntegration.latitude')}: {currentLocation.latitude.toFixed(6)}</div>
                      <div>{t('deviceIntegration.longitude')}: {currentLocation.longitude.toFixed(6)}</div>
                      <div>{t('deviceIntegration.accuracy')}: ±{Math.round(currentLocation.accuracy)}m</div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="share" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">{t('deviceIntegration.shareContent')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => shareContent({
                      title: 'Mariia Beauty & Fitness',
                      text: 'Check out these amazing beauty and fitness services in Warsaw!',
                      url: window.location.href,
                    })}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('deviceIntegration.shareApp')}
                  </Button>

                  {capturedMedia.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => shareContent({
                        title: 'My Photo',
                        text: 'Check out this photo from Mariia Beauty & Fitness!',
                        files: [capturedMedia[0].file],
                      })}
                    >
                      <Image className="h-4 w-4 mr-2" alt="" />
                      {t('deviceIntegration.sharePhoto')}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('deviceIntegration.advancedFeatures')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={toggleFullscreen}
              disabled={!capabilities.fullscreen}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isFullscreen ? t('deviceIntegration.exitFullscreen') : t('deviceIntegration.enterFullscreen')}
            </Button>

            <Button
              variant="outline"
              onClick={() => vibrateDevice([200, 100, 200])}
              disabled={!capabilities.vibration}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {t('deviceIntegration.testVibration')}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                vibrateDevice(1000);
                toast({
                  title: t('deviceIntegration.notification aria-live="polite" aria-atomic="true"Test'),
                  description: t('deviceIntegration.notification aria-live="polite" aria-atomic="true"TestDesc'),
                });
              }}
              disabled={!capabilities.notification aria-live="polite" aria-atomic="true"s}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t('deviceIntegration.testNotification')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('deviceIntegration.privacyNote')}
        </AlertDescription>
      </Alert>
    </div>
  );
}