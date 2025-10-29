import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useLocation } from '@/contexts/LocationContext';
import { usePricing } from '@/contexts/PricingContext';
import { useBooking } from '@/contexts/BookingContext';
import { cn } from '@/lib/utils';
import LocationService from '@/services/LocationService';
import PricingService from '@/services/PricingService';

interface LocationAwareBookingProps {
  serviceId: string;
  onLocationSelected: (locationId: string) => void;
  className?: string;
}

interface ServiceLocationInfo {
  location: any;
  distance?: number;
  availability: boolean;
  nextAvailable?: Date;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  operatingHours: any;
}

export function LocationAwareBooking({
  serviceId,
  onLocationSelected,
  className
}: LocationAwareBookingProps) {
  const { currentCity, currentLocation, userLocation } = useLocation();
  const { calculatePrice, formatPrice } = usePricing();
  const { updateBookingState } = useBooking();

  const [locations, setLocations] = useState<ServiceLocationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentCity && serviceId) {
      loadServiceLocations();
    }
  }, [currentCity, serviceId]);

  const loadServiceLocations = async () => {
    setIsLoading(true);
    try {
      // Get locations that offer this service
      const cityLocations = await LocationService.getLocationsInCity(currentCity!.id);

      // Get pricing for each location
      const locationsWithInfo = await Promise.all(
        cityLocations.map(async (location) => {
          // Get pricing
          const priceRange = await PricingService.getServicePriceRange(
            serviceId,
            currentCity!.id
          );

          const locationPricing = priceRange.find(p => p.locationId === location.id);

          // Check availability
          const availability = await LocationService.checkServiceAvailability(
            serviceId,
            location.id
          );

          // Calculate distance if user location is available
          const distance = userLocation?.coordinates && location.coordinates
            ? LocationService.calculateDistance(
                userLocation.coordinates,
                location.coordinates
              )
            : undefined;

          return {
            location,
            distance,
            availability: availability.available,
            nextAvailable: availability.nextAvailable,
            priceRange: locationPricing || {
              min: 0,
              max: 0,
              currency: 'PLN',
              locationId: location.id,
              locationName: location.name
            },
            operatingHours: location.operatingHours
          };
        })
      );

      // Sort locations: primary first, then by distance, then by price
      locationsWithInfo.sort((a, b) => {
        // Primary location first
        if (a.location.is_primary && !b.location.is_primary) return -1;
        if (!a.location.is_primary && b.location.is_primary) return 1;

        // Then by distance if available
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }

        // Then by price
        return a.priceRange.min - b.priceRange.min;
      });

      setLocations(locationsWithInfo);

      // Check availability for each location
      const availabilityStatus: Record<string, boolean> = {};
      for (const locInfo of locationsWithInfo) {
        availabilityStatus[locInfo.location.id] = locInfo.availability;
      }
      setAvailabilityCheck(availabilityStatus);

    } catch (error) {
      console.error('Error loading service locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (locationId: string) => {
    setSelectedLocation(locationId);
    const location = locations.find(l => l.location.id === locationId);

    if (location) {
      // Update booking state with location info
      await updateBookingState({
        locationId: locationId,
        location: {
          name: location.location.name,
          address: location.location.address,
          coordinates: location.location.coordinates,
          timezone: location.location.timezone
        },
        pricing: {
          basePrice: location.priceRange.min,
          currency: location.priceRange.currency
        }
      });

      onLocationSelected(locationId);
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    return LocationService.formatDistance(meters);
  };

  const formatOperatingHours = (operatingHours: any) => {
    const today = new Date().toLocaleLowerCase('en-US', { weekday: 'long' });
    const todayHours = operatingHours?.[today];

    if (!todayHours || todayHours.closed) {
      return { status: 'closed', label: 'Closed today' };
    }

    const now = new Date();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = new Date(now.setHours(openHour, openMin, 0, 0));
    const closeTime = new Date(now.setHours(closeHour, closeMin, 0, 0));

    const isOpen = now >= openTime && now <= closeTime;

    return {
      status: isOpen ? 'open' : 'closed',
      label: `${isOpen ? 'Open' : 'Closed'} • ${todayHours.open} - ${todayHours.close}`
    };
  };

  if (!currentCity) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select your city first to view available locations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Select Location</h3>
        <p className="text-sm text-muted-foreground">
          Choose where you'd like to receive this service in {currentCity.name}
        </p>
      </div>

      {/* Current City Display */}
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Showing locations in <strong>{currentCity.name}</strong>
          <Button
            variant="link"
            className="p-0 h-auto ml-2"
            onClick={() => window.dispatchEvent(new CustomEvent('open-city-selector'))}
          >
            Change city
          </Button>
        </AlertDescription>
      </Alert>

      {/* Locations List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((locInfo) => {
            const hours = formatOperatingHours(locInfo.operatingHours);
            const isSelected = selectedLocation === locInfo.location.id;
            const isAvailable = availabilityCheck[locInfo.location.id];

            return (
              <Card
                key={locInfo.location.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => handleLocationSelect(locInfo.location.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{locInfo.location.name}</CardTitle>
                        {locInfo.location.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                        {isAvailable && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {locInfo.location.address}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                      {locInfo.distance && (
                        <p className="text-sm font-medium">
                          {formatDistance(locInfo.distance)} away
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className={cn(
                          hours.status === 'open' ? 'text-green-600' : 'text-muted-foreground'
                        )}>
                          {hours.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Price Range */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatPrice(locInfo.priceRange.min, locInfo.priceRange.currency)}
                        {locInfo.priceRange.max > locInfo.priceRange.min && (
                          <>
                            {' - '}
                            {formatPrice(locInfo.priceRange.max, locInfo.priceRange.currency)}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Availability */}
                    {locInfo.nextAvailable && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Next available: {locInfo.nextAvailable.toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Location Type */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {locInfo.location.type}
                      </Badge>
                      {locInfo.location.servicesOffered.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {locInfo.location.servicesOffered.slice(0, 2).map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {locInfo.location.servicesOffered.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{locInfo.location.servicesOffered.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No locations available for this service in {currentCity.name}.
            Please try another service or city.
          </AlertDescription>
        </Alert>
      )}

      {/* Selection Summary */}
      {selectedLocation && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Selected Location</p>
                <p className="text-sm text-muted-foreground">
                  {locations.find(l => l.location.id === selectedLocation)?.location.name}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  // Proceed to next step
                  updateBookingState({ step: 2 });
                }}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LocationAwareBooking;