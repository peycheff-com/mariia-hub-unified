// Multi-city location types for the application

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
}

export interface UserLocation {
  ip: string;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  coordinates?: Coordinates;
  detectedBy: 'ip' | 'geolocation' | 'manual';
  confidence: number; // 0-1
  timestamp: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  slug: string;
  defaultCurrency: string;
  timezone: string;
  coordinates?: Coordinates;
  population?: number;
  isActive: boolean;
  launchDate?: string;
  marketingConfig: Record<string, any>;
  legalConfig: Record<string, any>;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  cityId: string;
  city: string;
  address: string;
  coordinates?: Coordinates;
  timezone: string;
  phone: string;
  email: string;
  website?: string;
  operatingHours: Record<string, any>;
  servicesOffered: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  isPrimary: boolean;
}

export interface LocationType {
  id: string;
  name: string;
  description?: string;
  requiresInPerson: boolean;
  supportsMobile: boolean;
}

export interface RegionalPricing {
  id: string;
  serviceId: string;
  cityId?: string;
  locationId?: string;
  basePrice: number;
  currency: string;
  taxRate: number;
  validFrom: Date;
  validUntil?: Date;
  priceAdjustments: Record<string, any>;
  isActive: boolean;
}

export interface ServiceLocationAvailability {
  id: string;
  serviceId: string;
  cityId?: string;
  locationId?: string;
  isAvailable: boolean;
  maxDailyBookings: number;
  bookingLeadTimeDays: number;
  serviceDurationMinutes?: number;
  bufferTimeMinutes: number;
  availabilityRules: Record<string, any>;
  seasonalAvailability: Record<string, any>;
}

export interface CityTaxConfig {
  id: string;
  cityId: string;
  taxType: 'vat' | 'service_tax' | 'tourism_tax' | 'local_tax';
  taxRate: number;
  taxCode?: string;
  isCompound: boolean;
  applicableServiceTypes: string[];
  exemptionRules: Record<string, any>;
  reportingRequirements: Record<string, any>;
  effectiveDate: Date;
  expiresDate?: Date;
  isActive: boolean;
}

export interface LegalRequirement {
  id: string;
  cityId?: string;
  countryCode: string;
  requirementType: 'data_privacy' | 'consumer_rights' | 'health_safety' | 'age_verification' | 'licensing';
  documentUrl?: string;
  consentRequired: boolean;
  ageRestriction?: number;
  mandatoryDisclaimers: string[];
  integrationConfig: Record<string, any>;
  isActive: boolean;
}

export interface UserLocationPreferences {
  id: string;
  userId: string;
  cityId?: string;
  locationId?: string;
  autoDetectLocation: boolean;
  preferredRadiusKm: number;
  locationNotifications: boolean;
}

export interface LocationAnalytics {
  id: string;
  cityId?: string;
  locationId?: string;
  date: Date;
  metricType: string;
  metricValue: number;
  metadata: Record<string, any>;
}

export interface TravelTime {
  distance: number; // in meters
  duration: number; // in seconds
  mode: 'driving' | 'walking' | 'transit';
}

export interface SearchParams {
  cityId?: string;
  coordinates?: Coordinates;
  radius?: number; // in meters
  serviceType?: string;
  query?: string;
  limit?: number;
}

export interface LocationSearchResult {
  location: Location;
  distance?: number; // in meters
  travelTime?: TravelTime;
  availability: {
    isAvailable: boolean;
    nextAvailable?: Date;
    servicesOffered: string[];
  };
  pricing?: {
    minPrice: number;
    maxPrice: number;
    currency: string;
  };
}

export interface CityMarketingConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  featuredImage?: string;
  localFeatures: string[];
  testimonials: {
    name: string;
    rating: number;
    comment: string;
    date: Date;
  }[];
  localPartners: {
    name: string;
    website: string;
    logo?: string;
  }[];
  promotionalOffers: {
    title: string;
    description: string;
    discountCode?: string;
    validUntil: Date;
  }[];
}

export interface CityLegalConfig {
  ageRestrictions: {
    minAge: number;
    services: string[];
  };
  requiredConsents: {
    type: string;
    text: string;
    required: boolean;
  }[];
  localRegulations: {
    type: string;
    description: string;
    complianceRequired: boolean;
  }[];
  dataResidency: {
    storageLocation: string;
    crossBorderTransfer: boolean;
  };
}

export interface OperatingHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
    breaks?: {
      start: string;
      end: string;
    }[];
  };
}

export interface LocationFeatures {
  hasParking: boolean;
  hasWifi: boolean;
  isAccessible: boolean;
  hasChangingRoom: boolean;
  hasShower: boolean;
  equipment: string[];
  amenities: string[];
}

export interface LocationContact {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: Coordinates;
  };
}

// Type guards
export function isCityActive(city: City): boolean {
  if (!city.isActive) return false;

  if (city.launchDate) {
    const launchDate = new Date(city.launchDate);
    return launchDate <= new Date();
  }

  return true;
}

export function isValidCoordinate(coord: any): coord is Coordinates {
  return (
    coord &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
}

export function isLocationInRadius(
  center: Coordinates,
  location: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, location);
  return distance <= radiusKm * 1000; // Convert km to meters
}

// Utility functions
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function formatDistance(meters: number, locale: string = 'en'): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    const km = meters / 1000;
    return locale === 'en'
      ? `${km.toFixed(1)}km`
      : `${km.toFixed(1).replace('.', ',')}km`;
  }
}

export function getCoordinatesString(coordinates: Coordinates): string {
  return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
}

export function parseCoordinatesString(coordString: string): Coordinates | null {
  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;

  return { lat, lng };
}

// Database types (for Supabase integration)
export type DatabaseCity = Omit<City, 'coordinates'> & {
  latitude: number | null;
  longitude: number | null;
};

export type DatabaseLocation = Omit<Location, 'coordinates'> & {
  latitude: number | null;
  longitude: number | null;
};

// Convert database types to application types
export function cityFromDatabase(dbCity: DatabaseCity): City {
  return {
    ...dbCity,
    coordinates:
      dbCity.latitude && dbCity.longitude
        ? { lat: dbCity.latitude, lng: dbCity.longitude }
        : undefined,
  };
}

export function locationFromDatabase(dbLocation: DatabaseLocation): Location {
  return {
    ...dbLocation,
    coordinates:
      dbLocation.latitude && dbLocation.longitude
        ? { lat: dbLocation.latitude, lng: dbLocation.longitude }
        : undefined,
  };
}