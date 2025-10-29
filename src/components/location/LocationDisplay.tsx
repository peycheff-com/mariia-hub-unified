import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  ExternalLink,
  Car,
  Train,
  Bus
} from 'lucide-react';

import { Location } from '@/lib/types/location';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LocationService from '@/services/LocationService';

interface LocationDisplayProps {
  location: Location;
  showMap?: boolean;
  showDirections?: boolean;
  showContactInfo?: boolean;
  showOperatingHours?: boolean;
  className?: string;
}

export function LocationDisplay({
  location,
  showMap = false,
  showDirections = true,
  showContactInfo = true,
  showOperatingHours = true,
  className
}: LocationDisplayProps) {
  const getDirectionsUrl = () => {
    if (!location.coordinates) return '#';
    const { lat, lng } = location.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const getMapUrl = () => {
    if (!location.coordinates) return '#';
    const { lat, lng } = location.coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'driving':
        return <Car className="h-4 w-4" />;
      case 'transit':
        return <Train className="h-4 w-4" />;
      case 'walking':
        return <Navigation className="h-4 w-4" />;
      default:
        return <Bus className="h-4 w-4" />;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'studio':
        return 'Beauty Studio';
      case 'gym':
        return 'Fitness Center';
      case 'online':
        return 'Online Service';
      case 'mobile':
        return 'Mobile Service';
      default:
        return type;
    }
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

  const formatPhone = (phone: string) => {
    // Basic phone formatting - can be enhanced
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const getOperatingHoursToday = () => {
    const today = new Date().toLocaleLowerCase('en-US', { weekday: 'long' });
    const todayHours = location.operatingHours?.[today];

    if (!todayHours || todayHours.closed) {
      return { status: 'closed', label: 'Closed today' };
    }

    if (todayHours.open && todayHours.close) {
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
    }

    return { status: 'unknown', label: 'Hours unavailable' };
  };

  const hoursToday = getOperatingHoursToday();

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getLocationTypeIcon(location.type)}</span>
            <div>
              <h3 className="text-xl font-semibold">{location.name}</h3>
              <p className="text-sm text-muted-foreground">
                {getLocationTypeLabel(location.type)}
                {location.isPrimary && (
                  <Badge variant="secondary" className="ml-2">Primary Location</Badge>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{location.address}</p>
              <p className="text-sm text-muted-foreground">
                {location.city}, {location.postalCode}
              </p>
              {location.coordinates && (
                <p className="text-xs text-muted-foreground mt-1">
                  {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          {showOperatingHours && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium',
                    hoursToday.status === 'open' ? 'text-green-600' : 'text-muted-foreground'
                  )}
                >
                  {hoursToday.label}
                </p>
                {Object.entries(location.operatingHours || {}).length > 0 && (
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      View all hours
                    </summary>
                    <div className="mt-2 space-y-1">
                      {Object.entries(location.operatingHours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span>
                            {hours?.closed ? 'Closed' : `${hours?.open || ''} - ${hours?.close || ''}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {showContactInfo && (location.phone || location.email) && (
            <div className="space-y-2">
              {location.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${location.phone.replace(/\s/g, '')}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {formatPhone(location.phone)}
                  </a>
                </div>
              )}
              {location.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${location.email}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {location.email}
                  </a>
                </div>
              )}
              {location.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Visit website
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {showDirections && location.coordinates && (
              <Button asChild className="flex-1">
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </a>
              </Button>
            )}
            {showMap && location.coordinates && (
              <Button variant="outline" asChild className="flex-1">
                <a
                  href={getMapUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  View on Map
                </a>
              </Button>
            )}
          </div>

          {/* Services Offered */}
          {location.servicesOffered && location.servicesOffered.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Services available at this location:</p>
              <div className="flex flex-wrap gap-1">
                {location.servicesOffered.map((service) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {location.timezone && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Timezone: {location.timezone}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}