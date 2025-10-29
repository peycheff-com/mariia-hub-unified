import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, ChevronDown, Globe } from 'lucide-react';

import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { City } from '@/lib/types/location';

interface CitySelectorProps {
  variant?: 'default' | 'compact' | 'inline';
  showFlags?: boolean;
  className?: string;
}

export function CitySelector({
  variant = 'default',
  showFlags = true,
  className
}: CitySelectorProps) {
  const {
    currentCity,
    availableCities,
    setCity,
    isDetectingLocation,
    detectUserLocation,
    locationError
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    await detectUserLocation();
    setIsDetecting(false);
    setIsOpen(false);
  };

  const handleCitySelect = async (cityId: string) => {
    await setCity(cityId);
    setIsOpen(false);
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'PL': '🇵🇱',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
    };
    return flags[countryCode] || '🌍';
  };

  const getCityDisplayName = (city: City) => {
    return city.region ? `${city.name}, ${city.region}` : city.name;
  };

  if (variant === 'compact') {
    return (
      <Select value={currentCity?.id} onValueChange={handleCitySelect}>
        <SelectTrigger className={cn('w-48', className)}>
          <div className="flex items-center gap-2">
            {currentCity && showFlags && (
              <span className="text-sm">{getCountryFlag(currentCity.countryCode)}</span>
            )}
            <MapPin className="h-4 w-4" />
            <SelectValue placeholder="Select city">
              {currentCity ? getCityDisplayName(currentCity) : 'Select city'}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableCities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              <div className="flex items-center gap-2">
                {showFlags && <span>{getCountryFlag(city.countryCode)}</span>}
                <span>{getCityDisplayName(city)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <span className="text-sm text-muted-foreground">Location:</span>
        <div className="flex items-center gap-2">
          {currentCity && showFlags && (
            <span className="text-sm">{getCountryFlag(currentCity.countryCode)}</span>
          )}
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getCityDisplayName(currentCity || { name: 'Select city' } as any)}</span>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Change
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select your city</DialogTitle>
              <DialogDescription>
                Choose your city to see available services and pricing in your area.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDetectLocation}
                disabled={isDetecting || isDetectingLocation}
              >
                {isDetecting || isDetectingLocation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Detect my location automatically
              </Button>
              <div className="grid gap-2">
                {availableCities.map((city) => (
                  <Button
                    key={city.id}
                    variant={currentCity?.id === city.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleCitySelect(city.id)}
                  >
                    <div className="flex items-center gap-2">
                      {showFlags && <span>{getCountryFlag(city.countryCode)}</span>}
                      <div className="text-left">
                        <div className="font-medium">{getCityDisplayName(city)}</div>
                        {!city.isActive && (
                          <div className="text-xs text-muted-foreground">Coming soon</div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              {locationError && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('justify-start', className)}>
          <div className="flex items-center gap-2">
            {currentCity && showFlags && (
              <span className="text-sm">{getCountryFlag(currentCity.countryCode)}</span>
            )}
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {currentCity ? getCityDisplayName(currentCity) : 'Select city'}
            </span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select your city</DialogTitle>
          <DialogDescription>
            Choose your city to see available services and pricing in your area.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleDetectLocation}
            disabled={isDetecting || isDetectingLocation}
          >
            {isDetecting || isDetectingLocation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Detect my location automatically
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or select manually
              </span>
            </div>
          </div>

          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {availableCities.map((city) => (
              <Button
                key={city.id}
                variant={currentCity?.id === city.id ? 'default' : 'ghost'}
                className="w-full justify-start h-auto p-3"
                onClick={() => handleCitySelect(city.id)}
                disabled={!city.isActive}
              >
                <div className="flex items-center gap-3 w-full">
                  {showFlags && (
                    <span className="text-lg flex-shrink-0">
                      {getCountryFlag(city.countryCode)}
                    </span>
                  )}
                  <div className="text-left flex-1">
                    <div className="font-medium">{getCityDisplayName(city)}</div>
                    <div className="text-sm text-muted-foreground">
                      {city.isActive ? 'Available now' : 'Coming soon'}
                    </div>
                  </div>
                  {currentCity?.id === city.id && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {locationError && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">{locationError}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}