import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import LocationService from '@/services/LocationService';
import { City, Location, UserLocation, Coordinates } from '@/lib/types/location';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn(),
};
Object.defineProperty(navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
});

describe('LocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectUserLocation', () => {
    it('should detect location from IP', async () => {
      const mockIPResponse = {
        ok: true,
        json: () => Promise.resolve({
          ip: '194.181.208.194',
          country: 'Poland',
          country: 'PL',
          region: 'Masovian Voivodeship',
          city: 'Warsaw',
          postal: '00-001',
          timezone: 'Europe/Warsaw',
          loc: '52.2297,21.0122',
          org: 'Orange Polska'
        })
      };

      (fetch as any).mockResolvedValueOnce(mockIPResponse);

      const result = await LocationService.detectUserLocation();

      expect(result).toEqual({
        ip: '194.181.208.194',
        country: 'Poland',
        countryCode: 'PL',
        region: 'Masovian Voivodeship',
        city: 'Warsaw',
        postalCode: '00-001',
        timezone: 'Europe/Warsaw',
        coordinates: { lat: 52.2297, lng: 21.0122 },
        detectedBy: 'ip',
        confidence: expect.any(Number),
        timestamp: expect.any(String)
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('ipinfo.io/json'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );
    });

    it('should fallback to geolocation when IP detection fails', async () => {
      // IP detection fails
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Geolocation succeeds
      const mockPosition = {
        coords: {
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success) => success(mockPosition)
      );

      // Mock reverse geocoding
      const mockReverseResponse = {
        ok: true,
        json: () => Promise.resolve({
          address: {
            road: 'Nowy Świat',
            city: 'Warsaw',
            state: 'Masovian Voivodeship',
            postcode: '00-001',
            country: 'Poland',
            country_code: 'pl'
          }
        })
      };

      (fetch as any).mockResolvedValueOnce(mockReverseResponse);

      const result = await LocationService.detectUserLocation();

      expect(result).toEqual({
        ip: '',
        country: 'Poland',
        countryCode: 'pl',
        region: 'Masovian Voivodeship',
        city: 'Warsaw',
        postalCode: '00-001',
        coordinates: { lat: 52.2297, lng: 21.0122 },
        detectedBy: 'geolocation',
        confidence: 0.95,
        timestamp: expect.any(String)
      });
    });

    it('should return null when both detection methods fail', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => error(new Error('Permission denied'))
      );

      const result = await LocationService.detectUserLocation();

      expect(result).toBeNull();
    });

    it('should use cached location if available', async () => {
      const cachedLocation: UserLocation = {
        ip: '194.181.208.194',
        country: 'Poland',
        countryCode: 'PL',
        city: 'Warsaw',
        detectedBy: 'ip',
        confidence: 0.9,
        timestamp: new Date().toISOString()
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          location: cachedLocation,
          timestamp: Date.now()
        })
      );

      const result = await LocationService.detectUserLocation();

      expect(result).toEqual(cachedLocation);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const warsaw: Coordinates = { lat: 52.2297, lng: 21.0122 };
      const krakow: Coordinates = { lat: 50.0647, lng: 19.9450 };

      const distance = LocationService.calculateDistance(warsaw, krakow);

      // Distance between Warsaw and Krakow is approximately 254 km
      expect(distance).toBeGreaterThan(250000);
      expect(distance).toBeLessThan(260000);
    });

    it('should return 0 for identical coordinates', () => {
      const point: Coordinates = { lat: 52.2297, lng: 21.0122 };

      const distance = LocationService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters for short distances', () => {
      const result = LocationService.formatDistance(500);
      expect(result).toBe('500m');
    });

    it('should format distance in kilometers for long distances', () => {
      const result = LocationService.formatDistance(1500);
      expect(result).toBe('1.5km');
    });

    it('should use comma as decimal separator for Polish locale', () => {
      const result = LocationService.formatDistance(1500, 'pl');
      expect(result).toBe('1,5km');
    });
  });

  describe('getCityBySlug', () => {
    it('should fetch city by slug from database', async () => {
      const mockCity: City = {
        id: 'city-1',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        isActive: true,
        marketingConfig: {},
        legalConfig: {}
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockCity,
                  error: null
                }))
              }))
            }))
          }))
        }))
      };

      // Mock supabase client
      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: mockSupabase
      }));

      const result = await LocationService.getCityBySlug('warsaw');

      expect(result).toEqual(mockCity);
      expect(mockSupabase.from).toHaveBeenCalledWith('cities');
    });
  });

  describe('searchNearbyLocations', () => {
    it('should search locations within radius', async () => {
      const mockLocations: Location[] = [
        {
          id: 'loc-1',
          name: 'Studio 1',
          type: 'studio',
          cityId: 'city-1',
          city: 'Warsaw',
          address: 'Address 1',
          coordinates: { lat: 52.2297, lng: 21.0122 },
          timezone: 'Europe/Warsaw',
          phone: '123456',
          email: 'test@test.com',
          operatingHours: {},
          servicesOffered: [],
          metadata: {},
          isActive: true,
          isPrimary: false
        }
      ];

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: mockLocations,
                error: null
              }))
            }))
          }))
        }))
      };

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: mockSupabase
      }));

      const result = await LocationService.searchNearbyLocations({
        coordinates: { lat: 52.2297, lng: 21.0122 },
        radius: 1000,
        limit: 10
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('loc-1');
    });
  });

  describe('isCityActive', () => {
    it('should return true for active city without launch date', () => {
      const city: City = {
        id: 'city-1',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        isActive: true,
        marketingConfig: {},
        legalConfig: {}
      };

      expect(LocationService.isCityActive(city)).toBe(true);
    });

    it('should return true for active city with past launch date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const city: City = {
        id: 'city-1',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        isActive: true,
        launchDate: pastDate.toISOString().split('T')[0],
        marketingConfig: {},
        legalConfig: {}
      };

      expect(LocationService.isCityActive(city)).toBe(true);
    });

    it('should return false for active city with future launch date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const city: City = {
        id: 'city-1',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        isActive: true,
        launchDate: futureDate.toISOString().split('T')[0],
        marketingConfig: {},
        legalConfig: {}
      };

      expect(LocationService.isCityActive(city)).toBe(false);
    });

    it('should return false for inactive city', () => {
      const city: City = {
        id: 'city-1',
        name: 'Warsaw',
        country: 'Poland',
        countryCode: 'PL',
        slug: 'warsaw',
        defaultCurrency: 'PLN',
        timezone: 'Europe/Warsaw',
        isActive: false,
        marketingConfig: {},
        legalConfig: {}
      };

      expect(LocationService.isCityActive(city)).toBe(false);
    });
  });

  describe('clearCachedLocation', () => {
    it('should remove location from localStorage', () => {
      LocationService.clearCachedLocation();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_location');
    });
  });

  describe('getTravelTime', () => {
    it('should estimate travel time by driving', async () => {
      const warsaw: Coordinates = { lat: 52.2297, lng: 21.0122 };
      const pointNearby: Coordinates = { lat: 52.2397, lng: 21.0222 };

      const result = await LocationService.getTravelTime(warsaw, pointNearby, 'driving');

      expect(result).toEqual({
        distance: expect.any(Number),
        duration: expect.any(Number),
        mode: 'driving'
      });
    });
  });

  describe('convertTimezone', () => {
    it('should convert time between timezones', () => {
      const date = new Date('2024-01-01T12:00:00');

      const result = LocationService.convertTimezone(
        date,
        'Europe/Warsaw',
        'Europe/London'
      );

      expect(result).toBeInstanceOf(Date);
    });

    it('should return original date on error', () => {
      const date = new Date('2024-01-01T12:00:00');

      const result = LocationService.convertTimezone(
        date,
        'Invalid/Timezone',
        'Europe/London'
      );

      expect(result).toBe(date);
    });
  });
});

describe('Location Type Guards', () => {
  describe('isCityActive', () => {
    it('should validate city active status correctly', () => {
      const activeCity = {
        isActive: true,
        launchDate: null
      };

      const futureCity = {
        isActive: true,
        launchDate: '2099-01-01'
      };

      const inactiveCity = {
        isActive: false,
        launchDate: null
      };

      expect(LocationService.isCityActive(activeCity as any)).toBe(true);
      expect(LocationService.isCityActive(futureCity as any)).toBe(false);
      expect(LocationService.isCityActive(inactiveCity as any)).toBe(false);
    });
  });
});