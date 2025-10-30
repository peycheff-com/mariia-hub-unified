import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Star,
  Clock,
  Phone,
  Mail,
  Globe,
  Wifi,
  Car,
  Train,
  Bus,
  Bike,
  Users,
  Heart,
  Calendar,
  Camera,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  RefreshCw,
  Filter,
  Map,
  Compass,
  Route,
  Share2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';

interface GeolocationServicesProps {
  className?: string;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface NearbyService {
  id: string;
  name: string;
  category: 'beauty' | 'fitness' | 'wellness' | 'lifestyle';
  address: string;
  distance: number;
  rating: number;
  reviews: number;
  priceLevel: number;
  isOpen: boolean;
  hours: {
    open: string;
    close: string;
  };
  phone?: string;
  website?: string;
  services: string[];
  specialties: string[];
  images: string[];
  promotions: Promotion[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: Date;
  type: 'percentage' | 'fixed' | 'package';
}

interface LocationBasedAlert {
  id: string;
  type: 'nearby_service' | 'promotion' | 'event' | 'weather';
  title: string;
  description: string;
  triggerRadius: number;
  isActive: boolean;
}

interface WarsawDistrict {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  characteristics: string[];
  averagePrice: number;
  transportLinks: string[];
}

export function GeolocationServices({ className = '' }: GeolocationServicesProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(5); // km
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [locationBasedAlerts, setLocationBasedAlerts] = useState<LocationBasedAlert[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [trackingWatchId, setTrackingWatchId] = useState<number | null>(null);

  // Warsaw districts data
  const warsawDistricts: WarsawDistrict[] = [
    {
      id: 'sródmiescie',
      name: 'Śródmieście (City Center)',
      center: { latitude: 52.2297, longitude: 21.0122 },
      characteristics: ['business', 'luxury', 'shopping', 'culture'],
      averagePrice: 350,
      transportLinks: ['metro', 'tram', 'bus'],
    },
    {
      id: 'wola',
      name: 'Wola',
      center: { latitude: 52.2330, longitude: 20.9837 },
      characteristics: ['modern', 'business', 'residential'],
      averagePrice: 280,
      transportLinks: ['metro', 'bus'],
    },
    {
      id: 'mokotów',
      name: 'Mokotów',
      center: { latitude: 52.2057, longitude: 21.0227 },
      characteristics: ['residential', 'parks', 'expat-friendly'],
      averagePrice: 300,
      transportLinks: ['metro', 'tram', 'bus'],
    },
    {
      id: 'praga-południe',
      name: 'Praga-Południe',
      center: { latitude: 52.2447, longitude: 21.0980 },
      characteristics: ['trendy', 'affordable', 'artistic'],
      averagePrice: 220,
      transportLinks: ['tram', 'bus'],
    },
    {
      id: 'żoliborz',
      name: 'Żoliborz',
      center: { latitude: 52.2610, longitude: 20.9837 },
      characteristics: ['residential', 'family-friendly', 'quiet'],
      averagePrice: 260,
      transportLinks: ['metro', 'bus'],
    },
  ];

  useEffect(() => {
    checkLocationPermission();
    loadCachedData();
    loadFavorites();
    loadLocationBasedAlerts();

    return () => {
      if (trackingWatchId !== null) {
        navigator.geolocation.clearWatch(trackingWatchId);
      }
    };
  }, []);

  const checkLocationPermission = () => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
      });
    }
  };

  const loadCachedData = () => {
    try {
      // Load cached location
      const cachedLocation = localStorage.getItem('cached-location');
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        const isFresh = Date.now() - location.timestamp < 5 * 60 * 1000; // 5 minutes
        if (isFresh) {
          setCurrentLocation(location);
        }
      }

      // Load cached nearby services
      const cachedServices = localStorage.getItem('cached-nearby-services');
      if (cachedServices) {
        const services = JSON.parse(cachedServices);
        const isFresh = Date.now() - services.timestamp < 60 * 60 * 1000; // 1 hour
        if (isFresh && services.location) {
          setCurrentLocation(services.location);
          setNearbyServices(services.data);
        }
      }

      // Load location history
      const history = localStorage.getItem('location-history');
      if (history) {
        setLocationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('favorite-services');
      if (stored) {
        setFavoriteServices(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const loadLocationBasedAlerts = () => {
    try {
      const stored = localStorage.getItem('location-based-alerts');
      if (stored) {
        setLocationBasedAlerts(JSON.parse(stored));
      } else {
        // Set default alerts
        const defaultAlerts: LocationBasedAlert[] = [
          {
            id: 'nearby-beauty',
            type: 'nearby_service',
            title: t('geolocation.nearbyBeautyAlert'),
            description: t('geolocation.nearbyBeautyAlertDesc'),
            triggerRadius: 2, // 2km
            isActive: true,
          },
          {
            id: 'promotion-alert',
            type: 'promotion',
            title: t('geolocation.promotionAlert'),
            description: t('geolocation.promotionAlertDesc'),
            triggerRadius: 5, // 5km
            isActive: true,
          },
        ];
        setLocationBasedAlerts(defaultAlerts);
        localStorage.setItem('location-based-alerts', JSON.stringify(defaultAlerts));
      }
    } catch (error) {
      console.error('Failed to load location-based alerts:', error);
    }
  };

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('geolocation.notSupported'),
        description: t('geolocation.notSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };

      setCurrentLocation(location);
      setLocationPermission('granted');

      // Cache location
      localStorage.setItem('cached-location', JSON.stringify(location));

      // Update location history
      const updatedHistory = [location, ...locationHistory.slice(0, 9)]; // Keep last 10
      setLocationHistory(updatedHistory);
      localStorage.setItem('location-history', JSON.stringify(updatedHistory));

      // Get nearby services
      await getNearbyServices(location);

      toast aria-live="polite" aria-atomic="true"({
        title: t('geolocation.locationObtained'),
        description: t('geolocation.locationObtainedDesc', {
          accuracy: Math.round(location.accuracy),
        }),
      });
    } catch (error: any) {
      console.error('Location access failed:', error);

      if (error.code === 1) {
        setLocationPermission('denied');
        toast aria-live="polite" aria-atomic="true"({
          title: t('geolocation.accessDenied'),
          description: t('geolocation.accessDeniedDesc'),
          variant: 'destructive',
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({
          title: t('geolocation.locationFailed'),
          description: t('geolocation.locationFailedDesc'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsGettingLocation(false);
    }
  }, [locationHistory, toast aria-live="polite" aria-atomic="true", t]);

  const getNearbyServices = async (location: Location) => {
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock nearby services data
      const mockServices: NearbyService[] = [
        {
          id: '1',
          name: 'Lux Beauty Studio',
          category: 'beauty',
          address: 'ul. Marszałkowska 12, Warszawa',
          distance: calculateDistance(location.latitude, location.longitude, 52.2297, 21.0122),
          rating: 4.8,
          reviews: 127,
          priceLevel: 3,
          isOpen: true,
          hours: { open: '09:00', close: '20:00' },
          phone: '+48 22 123 4567',
          website: 'https://luxbeauty.pl',
          services: ['Permanent Makeup', 'Lip Blush', 'Microblading'],
          specialties: ['Natural Look', 'Precision Work'],
          images: ['/images/beauty1.jpg', '/images/beauty2.jpg'],
          promotions: [
            {
              id: 'promo1',
              title: 'First Visit Discount',
              description: '20% off your first permanent makeup session',
              discount: 20,
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              type: 'percentage',
            },
          ],
          coordinates: { latitude: 52.2297, longitude: 21.0122 },
        },
        {
          id: '2',
          name: 'Elite Fitness Center',
          category: 'fitness',
          address: 'ul. Piłsudskiego 5, Warszawa',
          distance: calculateDistance(location.latitude, location.longitude, 52.2330, 20.9837),
          rating: 4.6,
          reviews: 89,
          priceLevel: 2,
          isOpen: true,
          hours: { open: '06:00', close: '22:00' },
          phone: '+48 22 234 5678',
          services: ['Personal Training', 'Group Classes', 'Nutrition Planning'],
          specialties: ['Weight Loss', 'Muscle Building'],
          images: ['/images/fitness1.jpg'],
          promotions: [],
          coordinates: { latitude: 52.2330, longitude: 20.9837 },
        },
        // Add more mock services as needed
      ];

      // Filter by search radius
      const filteredServices = mockServices.filter(service => service.distance <= searchRadius);

      // Sort by distance
      filteredServices.sort((a, b) => a.distance - b.distance);

      setNearbyServices(filteredServices);

      // Cache results
      localStorage.setItem('cached-nearby-services', JSON.stringify({
        data: filteredServices,
        location,
        timestamp: Date.now(),
      }));

      // Check for location-based alerts
      checkLocationBasedAlerts(location, filteredServices);

    } catch (error) {
      console.error('Failed to get nearby services:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('geolocation.servicesFailed'),
        description: t('geolocation.servicesFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkLocationBasedAlerts = (location: Location, services: NearbyService[]) => {
    locationBasedAlerts.forEach(alert => {
      if (!alert.isActive) return;

      switch (alert.type) {
        case 'nearby_service':
          const nearbyServices = services.filter(s => s.distance <= alert.triggerRadius);
          if (nearbyServices.length > 0) {
            triggerLocationAlert(alert, nearbyServices);
          }
          break;
        case 'promotion':
          const servicesWithPromotions = services.filter(s =>
            s.distance <= alert.triggerRadius && s.promotions.length > 0
          );
          if (servicesWithPromotions.length > 0) {
            triggerLocationAlert(alert, servicesWithPromotions);
          }
          break;
      }
    });
  };

  const triggerLocationAlert = (alert: LocationBasedAlert, data: any[]) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.description + ` (${data.length} ${t('geolocation.nearby')})`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `location-alert-${alert.id}`,
      });
    }

    toast aria-live="polite" aria-atomic="true"({
      title: alert.title,
      description: alert.description + ` (${data.length} ${t('geolocation.nearby')})`,
    });
  };

  const toggleLocationTracking = () => {
    if (isLocationTracking) {
      // Stop tracking
      if (trackingWatchId !== null) {
        navigator.geolocation.clearWatch(trackingWatchId);
        setTrackingWatchId(null);
      }
      setIsLocationTracking(false);
    } else {
      // Start tracking
      if (currentLocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            };

            setCurrentLocation(newLocation);

            // Check if user moved significantly (more than 100m)
            if (currentLocation) {
              const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                newLocation.latitude,
                newLocation.longitude
              );

              if (distance > 0.1) { // 100m
                getNearbyServices(newLocation);
              }
            }
          },
          (error) => console.error('Location tracking error:', error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // 1 minute
          }
        );

        setTrackingWatchId(watchId);
        setIsLocationTracking(true);
      }
    }
  };

  const toggleFavorite = (serviceId: string) => {
    const updated = favoriteServices.includes(serviceId)
      ? favoriteServices.filter(id => id !== serviceId)
      : [...favoriteServices, serviceId];

    setFavoriteServices(updated);
    localStorage.setItem('favorite-services', JSON.stringify(updated));
  };

  const getDirections = (service: NearbyService) => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${service.coordinates.latitude},${service.coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  const shareService = async (service: NearbyService) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: `${service.name} - ${service.address}\nRating: ${service.rating}/5 (${service.reviews} reviews)\nDistance: ${service.distance.toFixed(1)}km`,
          url: `${window.location.origin}/services/${service.id}`,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const filteredServices = nearbyServices.filter(service => {
    if (selectedCategory !== 'all' && service.category !== selectedCategory) {
      return false;
    }
    if (selectedDistrict !== 'all') {
      const district = warsawDistricts.find(d => d.id === selectedDistrict);
      if (district) {
        const distanceFromDistrict = calculateDistance(
          service.coordinates.latitude,
          service.coordinates.longitude,
          district.center.latitude,
          district.center.longitude
        );
        return distanceFromDistrict <= 5; // Within 5km of district center
      }
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      beauty: Star,
      fitness: Zap,
      wellness: Heart,
      lifestyle: Users,
    };
    return icons[category] || MapPin;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      beauty: 'text-pink-600 bg-pink-50',
      fitness: 'text-blue-600 bg-blue-50',
      wellness: 'text-green-600 bg-green-50',
      lifestyle: 'text-purple-600 bg-purple-50',
    };
    return colors[category] || 'text-gray-600 bg-gray-50';
  };

  const getPriceLevelDisplay = (level: number) => {
    return 'zł'.repeat(level);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Location Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-lg">{t('geolocation.locationServices')}</CardTitle>
                <CardDescription>
                  {currentLocation
                    ? t('geolocation.locationActive', {
                        lat: currentLocation.latitude.toFixed(4),
                        lng: currentLocation.longitude.toFixed(4),
                      })
                    : t('geolocation.locationInactive')
                  }
                </CardDescription>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLocationTracking}
                disabled={!currentLocation}
              >
                <Navigation className={`h-4 w-4 mr-2 ${isLocationTracking ? 'text-green-600' : ''}`} />
                {isLocationTracking ? t('geolocation.tracking') : t('geolocation.track')}
              </Button>

              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                size="sm"
              >
                {isGettingLocation ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('geolocation.getting')}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('geolocation.getCurrentLocation')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Location Permission Alert */}
      {locationPermission === 'denied' && (
        <Alert className="border-red-200 bg-red-50">
          <MapPin className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {t('geolocation.permissionDenied')} {t('geolocation.enableInSettings')}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle>{t('geolocation.findNearby')}</CardTitle>
            <CardDescription>
              {t('geolocation.findNearbyDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="t-geolocation-category">{t('geolocation.category')}</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('geolocation.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('geolocation.allCategories')}</SelectItem>
                    <SelectItem value="beauty">{t('geolocation.beauty')}</SelectItem>
                    <SelectItem value="fitness">{t('geolocation.fitness')}</SelectItem>
                    <SelectItem value="wellness">{t('geolocation.wellness')}</SelectItem>
                    <SelectItem value="lifestyle">{t('geolocation.lifestyle')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="t-geolocation-radius">{t('geolocation.radius')}</label>
                <Select value={searchRadius.toString()} onValueChange={(value) => setSearchRadius(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="2">2 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="t-geolocation-district">{t('geolocation.district')}</label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('geolocation.selectDistrict')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('geolocation.allDistricts')}</SelectItem>
                    {warsawDistricts.map(district => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={() => currentLocation && getNearbyServices(currentLocation)} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  {t('geolocation.search')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Services */}
      {filteredServices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('geolocation.nearbyServices')}</CardTitle>
              <Badge variant="outline">
                {filteredServices.length} {t('geolocation.servicesFound')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredServices.map(service => {
                const IconComponent = getCategoryIcon(service.category);
                const isFavorite = favoriteServices.includes(service.id);

                return (
                  <div key={service.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${getCategoryColor(service.category)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.address}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{service.distance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{service.rating} ({service.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{getPriceLevelDisplay(service.priceLevel)}</span>
                          </div>
                          {service.isOpen && (
                            <Badge variant="default" className="text-green-600 bg-green-50 border-green-200">
                              {t('geolocation.open')}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="text-sm text-muted-foreground mb-2">
                            {t('geolocation.services')}:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {service.services.map(serviceName => (
                              <Badge key={serviceName} variant="secondary" className="text-xs">
                                {serviceName}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {service.promotions.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-sm text-yellow-800">
                                {t('geolocation.specialOffer')}
                              </span>
                            </div>
                            <p className="text-sm text-yellow-700">
                              {service.promotions[0].description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(service.id)}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => getDirections(service)}
                        >
                          <Route className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareService(service)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="flex-1"
                      >
                        {t('geolocation.viewDetails')}
                      </Button>
                      {service.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${service.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            {t('geolocation.call')}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warsaw Districts Guide */}
      <Card>
        <CardHeader>
          <CardTitle>{t('geolocation.warsawDistricts')}</CardTitle>
          <CardDescription>
            {t('geolocation.warsawDistrictsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warsawDistricts.map(district => (
              <div key={district.id} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{district.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {district.characteristics.map(char => (
                      <Badge key={char} variant="secondary" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-muted-foreground">
                    {t('geolocation.averagePrice')}: {district.averagePrice} zł
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {district.transportLinks.map(transport => (
                      <span key={transport} className="text-xs text-muted-foreground">
                        {transport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location-Based Alerts Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('geolocation.locationAlerts')}</CardTitle>
          <CardDescription>
            {t('geolocation.locationAlertsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationBasedAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('geolocation.triggerRadius')}: {alert.triggerRadius}km
                  </div>
                </div>
                <Switch
                  checked={alert.isActive}
                  onCheckedChange={(checked) => {
                    const updated = locationBasedAlerts.map(a =>
                      a.id === alert.id ? { ...a, isActive: checked } : a
                    );
                    setLocationBasedAlerts(updated);
                    localStorage.setItem('location-based-alerts', JSON.stringify(updated));
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location History */}
      {locationHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('geolocation.locationHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locationHistory.slice(0, 5).map((location, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                  <div>
                    <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                    <span className="text-muted-foreground ml-2">
                      ±{Math.round(location.accuracy)}m
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(location.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}