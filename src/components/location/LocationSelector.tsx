import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, Mail, Star } from 'lucide-react';

import { useLocation } from '@/contexts/LocationContext';
import { Location } from '@/lib/types/location';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LocationService from '@/services/LocationService';

interface LocationSelectorProps {
  cityId: string;
  selectedLocationId?: string;
  onLocationChange: (location: Location) => void;
  showDistance?: boolean;
  userCoordinates?: { lat: number; lng: number };
  variant?: 'default' | 'card' | 'list';
  className?: string;
}

export function LocationSelector({
  cityId,
  selectedLocationId,
  onLocationChange,
  showDistance = false,
  userCoordinates,
  variant = 'default',
  className
}: LocationSelectorProps) {
  const { availableLocations, currentLocation } = useLocation();
  const [locationsWithDistance, setLocationsWithDistance] = useState<(Location & { distance?: number })[]>([]);

  useEffect(() => {
    const calculateDistances = async () => {
      if (!showDistance || !userCoordinates) {
        setLocationsWithDistance(availableLocations);
        return;
      }

      const locationsWithDist = await Promise.all(
        availableLocations.map(async (location) => {
          if (!location.coordinates) return location;

          const distance = LocationService.calculateDistance(
            userCoordinates,
            { lat: location.coordinates.lat, lng: location.coordinates.lng }
          );

          return { ...location, distance };
        })
      );

      // Sort by distance
      locationsWithDist.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      setLocationsWithDistance(locationsWithDist);
    };

    calculateDistances();
  }, [availableLocations, showDistance, userCoordinates]);

  const handleLocationSelect = (locationId: string) => {
    const location = availableLocations.find(l => l.id === locationId);
    if (location) {
      onLocationChange(location);
    }
  };

  const formatDistance = (meters?: number) => {
    if (meters === undefined) return '';
    return LocationService.formatDistance(meters);
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'studio':
        return '🏢';
      case 'gym':
        return '💪';
      case 'online':
        return '💻';
      case 'mobile':
        return '🚗';
      default:
        return '📍';
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'studio':
        return 'Beauty Studio';
      case 'gym':
        return 'Fitness Center';
      case 'online':
        return 'Online';
      case 'mobile':
        return 'Mobile Service';
      default:
        return type;
    }
  };

  const getOperatingHoursToday = (operatingHours: any) => {
    const today = new Date().toLocaleLowerCase('en-US', { weekday: 'long' });
    const todayHours = operatingHours?.[today];

    if (!todayHours || todayHours.closed) {
      return 'Closed today';
    }

    if (todayHours.open && todayHours.close) {
      return `Open today: ${todayHours.open} - ${todayHours.close}`;
    }

    return 'Hours unavailable';
  };

  if (variant === 'default') {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="text-sm font-medium">Select Location</label>
        <Select value={selectedLocationId} onValueChange={handleLocationSelect}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <SelectValue placeholder="Choose a location">
                {currentLocation ? (
                  <div className="flex items-center gap-2">
                    <span>{getLocationTypeIcon(currentLocation.type)}</span>
                    <span>{currentLocation.name}</span>
                    {showDistance && (
                      <span className="text-sm text-muted-foreground">
                        {formatDistance(
                          locationsWithDistance.find(l => l.id === currentLocation.id)?.distance
                        )}
                      </span>
                    )}
                  </div>
                ) : (
                  'Choose a location'
                )}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {locationsWithDistance.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex items-center gap-2">
                  <span>{getLocationTypeIcon(location.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{location.name}</span>
                      {location.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    {showDistance && location.distance && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistance(location.distance)} away
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        <h3 className="text-lg font-semibold">Available Locations</h3>
        <div className="space-y-2">
          {locationsWithDistance.map((location) => (
            <Button
              key={location.id}
              variant={selectedLocationId === location.id ? 'default' : 'outline'}
              className="w-full justify-start h-auto p-4"
              onClick={() => handleLocationSelect(location.id)}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-2xl flex-shrink-0 mt-1">
                  {getLocationTypeIcon(location.type)}
                </span>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{location.name}</span>
                    {location.isPrimary && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {location.address}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {showDistance && location.distance && (
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {formatDistance(location.distance)} away
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getOperatingHoursToday(location.operatingHours)}
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {locationsWithDistance.map((location) => (
        <Card
          key={location.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selectedLocationId === location.id && 'ring-2 ring-primary'
          )}
          onClick={() => handleLocationSelect(location.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLocationTypeIcon(location.type)}</span>
                <div>
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <CardDescription>{getLocationTypeLabel(location.type)}</CardDescription>
                </div>
              </div>
              {location.isPrimary && (
                <Badge variant="secondary">Primary</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{location.address}</span>
              </div>
              {showDistance && location.distance && (
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDistance(location.distance)} away</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{getOperatingHoursToday(location.operatingHours)}</span>
              </div>
              {location.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{location.phone}</span>
                </div>
              )}
            </div>

            {location.servicesOffered && location.servicesOffered.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Services offered:</p>
                <div className="flex flex-wrap gap-1">
                  {location.servicesOffered.slice(0, 3).map((service) => (
                    <Badge key={service} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {location.servicesOffered.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{location.servicesOffered.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}