import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Types for location data
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
  type: 'studio' | 'gym' | 'online' | 'mobile';
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

class LocationService {
  private static readonly IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN;
  private static readonly CACHE_KEY = 'user_location';
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Detect user location using multiple methods
   */
  static async detectUserLocation(): Promise<UserLocation | null> {
    try {
      // First, check if we have cached location data
      const cachedLocation = this.getCachedLocation();
      if (cachedLocation) {
        return cachedLocation;
      }

      // Try IP-based detection first (fast, no permissions needed)
      const ipLocation = await this.detectLocationByIP();
      if (ipLocation) {
        this.cacheLocation(ipLocation);
        return ipLocation;
      }

      // Fallback to browser geolocation (requires permission)
      const geoLocation = await this.detectLocationByGeolocation();
      if (geoLocation) {
        this.cacheLocation(geoLocation);
        return geoLocation;
      }

      return null;
    } catch (error) {
      logger.error('Error detecting user location:', error);
      return null;
    }
  }

  /**
   * Detect location by IP address using ipinfo.io
   */
  private static async detectLocationByIP(): Promise<UserLocation | null> {
    try {
      const response = await fetch(`https://ipinfo.io/json?token=${this.IPINFO_TOKEN}`);
      if (!response.ok) {
        throw new Error('Failed to fetch IP info');
      }

      const data = await response.json();

      const location: UserLocation = {
        ip: data.ip,
        country: data.country || 'Unknown',
        countryCode: data.country || 'XX',
        region: data.region,
        city: data.city,
        postalCode: data.postal,
        timezone: data.timezone,
        coordinates: data.loc ? {
          lat: parseFloat(data.loc.split(',')[0]),
          lng: parseFloat(data.loc.split(',')[1])
        } : undefined,
        detectedBy: 'ip',
        confidence: this.calculateIPConfidence(data),
        timestamp: new Date().toISOString()
      };

      return location;
    } catch (error) {
      logger.error('IP location detection failed:', error);
      return null;
    }
  }

  /**
   * Detect location using browser geolocation API
   */
  private static async detectLocationByGeolocation(): Promise<UserLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await this.reverseGeocode(latitude, longitude);

            const location: UserLocation = {
              ip: '',
              country: address.country,
              countryCode: address.countryCode,
              region: address.region,
              city: address.city,
              postalCode: address.postalCode,
              coordinates: { lat: latitude, lng: longitude },
              detectedBy: 'geolocation',
              confidence: 0.95, // High confidence for GPS
              timestamp: new Date().toISOString()
            };

            resolve(location);
          } catch (error) {
            logger.error('Geolocation reverse geocoding failed:', error);
            resolve(null);
          }
        },
        (error) => {
          logger.error('Geolocation permission denied or failed:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<Address> {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MariiaHub/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const address = data.address;

      return {
        street: address.road || address.pedestrian,
        city: address.city || address.town || address.village || 'Unknown',
        region: address.state || address.county,
        postalCode: address.postcode,
        country: address.country || 'Unknown',
        countryCode: address.country_code?.toUpperCase() || 'XX'
      };
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      // Return minimal address data on error
      return {
        city: 'Unknown',
        country: 'Unknown',
        countryCode: 'XX'
      };
    }
  }

  /**
   * Geocode address to coordinates
   */
  static async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MariiaHub/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      if (data.length === 0) {
        return null;
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get all active cities from database
   */
  static async getActiveCities(): Promise<City[]> {
    try {
      // Check if we have a valid Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('dev-project')) {
        logger.warn('Using fallback cities for development (Supabase not configured)');
        return LocationService.getFallbackCities();
      }

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching active cities:', error);
      // Return fallback cities if database is unavailable
      return LocationService.getFallbackCities();
    }
  }

  /**
   * Get fallback cities for development when database is not available
   */
  private static getFallbackCities(): City[] {
    return [
      {
        id: 'warsaw-pl',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        region: 'Mazowieckie',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        coordinates: { lat: 52.2297, lng: 21.0122 },
        population: 1793579,
        isActive: true,
        launchDate: '2024-01-01',
        marketingConfig: {
          primaryMarkets: ['beauty', 'fitness'],
          targetDemographics: ['25-45'],
          localCompetition: 'high'
        },
        legalConfig: {
          taxes: {
            services: 23,
            products: 23
          },
          regulations: ['EU-GDPR'],
          businessLicense: 'BEAUTY_SALON'
        }
      }
    ];
  }

  /**
   * Get city by slug
   */
  static async getCityBySlug(slug: string): Promise<City | null> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('seo_slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching city by slug:', error);
      return null;
    }
  }

  /**
   * Get city by name and country
   */
  static async getCityByName(cityName: string, countryCode: string = 'PL'): Promise<City | null> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('name', cityName)
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching city by name:', error);
      return null;
    }
  }

  /**
   * Get locations in a city
   */
  static async getLocationsInCity(cityId: string): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching locations in city:', error);
      return [];
    }
  }

  /**
   * Search for nearby locations
   */
  static async searchNearbyLocations(params: SearchParams): Promise<Location[]> {
    try {
      let query = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true);

      // Filter by city if provided
      if (params.cityId) {
        query = query.eq('city_id', params.cityId);
      }

      // Filter by service type if provided
      if (params.serviceType) {
        query = query.contains('services_offered', [params.serviceType]);
      }

      // Apply limit
      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      let locations = data || [];

      // Filter by coordinates and radius if provided
      if (params.coordinates && params.radius) {
        locations = locations.filter(location => {
          if (!location.coordinates) return false;
          const distance = this.calculateDistance(
            params.coordinates!,
            { lat: location.coordinates.y, lng: location.coordinates.x }
          );
          return distance <= params.radius!;
        });
      }

      // Sort by distance if coordinates provided, otherwise by name
      if (params.coordinates) {
        locations.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return 0;
          const distA = this.calculateDistance(
            params.coordinates!,
            { lat: a.coordinates.y, lng: a.coordinates.x }
          );
          const distB = this.calculateDistance(
            params.coordinates!,
            { lat: b.coordinates.y, lng: b.coordinates.x }
          );
          return distA - distB;
        });
      }

      return locations;
    } catch (error) {
      logger.error('Error searching nearby locations:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(from: Coordinates, to: Coordinates): number {
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

  /**
   * Get travel time between two points (mock implementation)
   */
  static async getTravelTime(
    from: Coordinates,
    to: Coordinates,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<TravelTime> {
    const distance = this.calculateDistance(from, to);

    // Simple estimation based on mode
    const speedKmh = mode === 'driving' ? 40 : mode === 'walking' ? 5 : 20;
    const durationSeconds = (distance / 1000 / speedKmh) * 3600;

    return {
      distance,
      duration: Math.round(durationSeconds),
      mode
    };
  }

  /**
   * Check if a city is active
   */
  static isCityActive(city: City): boolean {
    if (!city.isActive) return false;

    if (city.launchDate) {
      const launchDate = new Date(city.launchDate);
      return launchDate <= new Date();
    }

    return true;
  }

  /**
   * Cache location data in localStorage
   */
  private static cacheLocation(location: UserLocation): void {
    try {
      const cacheData = {
        location,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Error caching location:', error);
    }
  }

  /**
   * Get cached location data
   */
  private static getCachedLocation(): UserLocation | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { location, timestamp } = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_TTL) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return location;
    } catch (error) {
      logger.error('Error reading cached location:', error);
      return null;
    }
  }

  /**
   * Clear cached location data
   */
  static clearCachedLocation(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Calculate confidence score for IP-based location
   */
  private static calculateIPConfidence(data: any): number {
    let confidence = 0.5; // Base confidence for IP

    // Increase confidence based on data completeness
    if (data.city) confidence += 0.2;
    if (data.region) confidence += 0.1;
    if (data.postal) confidence += 0.1;
    if (data.loc) confidence += 0.1;

    // Check if it's a mobile carrier (less accurate)
    if (data.org && data.org.toLowerCase().includes('mobile')) {
      confidence -= 0.2;
    }

    return Math.min(0.9, Math.max(0.1, confidence));
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number, locale: string = 'en'): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      const km = meters / 1000;
      return locale === 'en'
        ? `${km.toFixed(1)}km`
        : `${km.toFixed(1).replace('.', ',')}km`;
    }
  }

  /**
   * Get timezone offset for a city
   */
  static getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    } catch {
      return 0;
    }
  }

  /**
   * Convert time from one timezone to another
   */
  static convertTimezone(
    time: Date,
    fromTimezone: string,
    toTimezone: string
  ): Date {
    try {
      const fromTime = new Date(
        time.toLocaleString('en-US', { timeZone: fromTimezone })
      );
      const toTime = new Date(
        fromTime.toLocaleString('en-US', { timeZone: toTimezone })
      );
      return toTime;
    } catch {
      return time;
    }
  }
}

export default LocationService;