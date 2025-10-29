import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

import LocationService, { City, Location, UserLocation } from '@/services/LocationService';

// Types
interface LocationState {
  // Current location state
  currentCity: City | null;
  currentLocation: Location | null;
  userLocation: UserLocation | null;
  availableCities: City[];
  availableLocations: Location[];

  // UI state
  isDetectingLocation: boolean;
  isCityLoading: boolean;
  locationError: string | null;

  // Preferences
  hasSeenLocationPrompt: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
}

type LocationAction =
  | { type: 'SET_DETECTING_LOCATION'; payload: boolean }
  | { type: 'SET_CITY_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_CITY'; payload: City | null }
  | { type: 'SET_CURRENT_LOCATION'; payload: Location | null }
  | { type: 'SET_USER_LOCATION'; payload: UserLocation | null }
  | { type: 'SET_AVAILABLE_CITIES'; payload: City[] }
  | { type: 'SET_AVAILABLE_LOCATIONS'; payload: Location[] }
  | { type: 'SET_LOCATION_ERROR'; payload: string | null }
  | { type: 'SET_LOCATION_PROMPT_SEEN'; payload: boolean }
  | { type: 'SET_LOCATION_PERMISSION'; payload: 'granted' | 'denied' | 'prompt' }
  | { type: 'RESET_LOCATION_ERROR' }
  | { type: 'INITIALIZE_FROM_CACHE'; payload: Partial<LocationState> };

interface LocationContextType extends LocationState {
  // Actions
  setCity: (cityId: string) => Promise<void>;
  setLocation: (locationId: string) => Promise<void>;
  detectUserLocation: () => Promise<void>;
  searchNearbyLocations: (coordinates: { lat: number; lng: number }) => Promise<Location[]>;

  // Utilities
  isCityActive: (cityId: string) => boolean;
  isLocationActive: (locationId: string) => boolean;
  getCityTimezone: (cityId: string) => string;
  calculateDistance: (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => number;
  clearLocationData: () => void;
  retryLocationDetection: () => Promise<void>;
}

// Initial state
const initialState: LocationState = {
  currentCity: null,
  currentLocation: null,
  userLocation: null,
  availableCities: [],
  availableLocations: [],
  isDetectingLocation: false,
  isCityLoading: false,
  locationError: null,
  hasSeenLocationPrompt: false,
  locationPermission: 'prompt'
};

// Reducer
function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'SET_DETECTING_LOCATION':
      return { ...state, isDetectingLocation: action.payload };

    case 'SET_CITY_LOADING':
      return { ...state, isCityLoading: action.payload };

    case 'SET_CURRENT_CITY':
      return { ...state, currentCity: action.payload };

    case 'SET_CURRENT_LOCATION':
      return { ...state, currentLocation: action.payload };

    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };

    case 'SET_AVAILABLE_CITIES':
      return { ...state, availableCities: action.payload };

    case 'SET_AVAILABLE_LOCATIONS':
      return { ...state, availableLocations: action.payload };

    case 'SET_LOCATION_ERROR':
      return { ...state, locationError: action.payload };

    case 'SET_LOCATION_PROMPT_SEEN':
      return { ...state, hasSeenLocationPrompt: action.payload };

    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermission: action.payload };

    case 'RESET_LOCATION_ERROR':
      return { ...state, locationError: null };

    case 'INITIALIZE_FROM_CACHE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Context
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Provider component
interface LocationProviderProps {
  children: ReactNode;
  defaultCitySlug?: string;
}

export function LocationProvider({ children, defaultCitySlug = 'warsaw' }: LocationProviderProps) {
  const [state, dispatch] = useReducer(locationReducer, initialState);

  // Load initial data and cached state
  useEffect(() => {
    initializeLocationContext();
  }, []);

  // Watch for geolocation permission changes
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        dispatch({ type: 'SET_LOCATION_PERMISSION', payload: result.state as any });

        result.addEventListener('change', () => {
          dispatch({ type: 'SET_LOCATION_PERMISSION', payload: result.state as any });
        });
      }).catch(() => {
        // Permissions API not supported
      });
    }
  }, []);

  const initializeLocationContext = async () => {
    try {
      // Load cached preferences
      const cachedPreferences = loadCachedPreferences();
      if (cachedPreferences) {
        dispatch({ type: 'INITIALIZE_FROM_CACHE', payload: cachedPreferences });
      }

      // Load available cities
      dispatch({ type: 'SET_CITY_LOADING', payload: true });
      const cities = await LocationService.getActiveCities();
      dispatch({ type: 'SET_AVAILABLE_CITIES', payload: cities });

      // Try to detect user location
      await detectUserLocationInternal(cities, defaultCitySlug);

      dispatch({ type: 'SET_CITY_LOADING', payload: false });
    } catch (error) {
      console.error('Error initializing location context:', error);
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Failed to initialize location services' });
      dispatch({ type: 'SET_CITY_LOADING', payload: false });
    }
  };

  const detectUserLocationInternal = async (cities: City[], defaultCitySlug: string) => {
    dispatch({ type: 'SET_DETECTING_LOCATION', payload: true });

    try {
      // Detect user location
      const userLocation = await LocationService.detectUserLocation();
      if (userLocation) {
        dispatch({ type: 'SET_USER_LOCATION', payload: userLocation });

        // Try to match detected location to available city
        if (userLocation.city && userLocation.countryCode) {
          const matchedCity = cities.find(
            city => city.name.toLowerCase() === userLocation.city?.toLowerCase() &&
                   city.countryCode === userLocation.countryCode
          );

          if (matchedCity && LocationService.isCityActive(matchedCity)) {
            await setCityInternal(matchedCity);
            return;
          }
        }
      }

      // Fallback to default city or first available city
      const defaultCity = cities.find(city => city.slug === defaultCitySlug) || cities[0];
      if (defaultCity) {
        await setCityInternal(defaultCity);
      }
    } catch (error) {
      console.error('Error detecting user location:', error);
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Unable to detect your location' });
    } finally {
      dispatch({ type: 'SET_DETECTING_LOCATION', payload: false });
    }
  };

  const setCity = async (cityId: string) => {
    try {
      const city = state.availableCities.find(c => c.id === cityId);
      if (!city) {
        throw new Error('City not found');
      }

      await setCityInternal(city);
    } catch (error) {
      console.error('Error setting city:', error);
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Failed to set city' });
    }
  };

  const setCityInternal = async (city: City) => {
    dispatch({ type: 'SET_CURRENT_CITY', payload: city });

    // Load locations for the city
    const locations = await LocationService.getLocationsInCity(city.id);
    dispatch({ type: 'SET_AVAILABLE_LOCATIONS', payload: locations });

    // Set primary location as default if available
    const primaryLocation = locations.find(l => l.isPrimary);
    if (primaryLocation) {
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: primaryLocation });
    } else if (locations.length > 0) {
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: locations[0] });
    }

    // Cache preferences
    cachePreferences({ cityId: city.id, locationId: primaryLocation?.id });
  };

  const setLocation = async (locationId: string) => {
    try {
      const location = state.availableLocations.find(l => l.id === locationId);
      if (!location) {
        throw new Error('Location not found');
      }

      dispatch({ type: 'SET_CURRENT_LOCATION', payload: location });
      cachePreferences({ cityId: state.currentCity?.id, locationId });
    } catch (error) {
      console.error('Error setting location:', error);
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Failed to set location' });
    }
  };

  const detectUserLocation = async () => {
    dispatch({ type: 'RESET_LOCATION_ERROR' });
    await detectUserLocationInternal(state.availableCities, defaultCitySlug);
  };

  const searchNearbyLocations = async (coordinates: { lat: number; lng: number }) => {
    try {
      const locations = await LocationService.searchNearbyLocations({
        coordinates,
        radius: 10000, // 10km radius
        limit: 20
      });
      return locations;
    } catch (error) {
      console.error('Error searching nearby locations:', error);
      dispatch({ type: 'SET_LOCATION_ERROR', payload: 'Failed to search nearby locations' });
      return [];
    }
  };

  const isCityActive = (cityId: string): boolean => {
    const city = state.availableCities.find(c => c.id === cityId);
    return city ? LocationService.isCityActive(city) : false;
  };

  const isLocationActive = (locationId: string): boolean => {
    const location = state.availableLocations.find(l => l.id === locationId);
    return location ? location.isActive : false;
  };

  const getCityTimezone = (cityId: string): string => {
    const city = state.availableCities.find(c => c.id === cityId);
    return city?.timezone || 'Europe/Warsaw';
  };

  const calculateDistance = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number => {
    return LocationService.calculateDistance(from, to);
  };

  const clearLocationData = () => {
    LocationService.clearCachedLocation();
    localStorage.removeItem('location_preferences');
    dispatch({ type: 'INITIALIZE_FROM_CACHE', payload: initialState });
  };

  const retryLocationDetection = async () => {
    dispatch({ type: 'RESET_LOCATION_ERROR' });
    await detectUserLocation();
  };

  // Cache management
  const cachePreferences = (preferences: { cityId?: string; locationId?: string }) => {
    try {
      localStorage.setItem('location_preferences', JSON.stringify({
        ...preferences,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching location preferences:', error);
    }
  };

  const loadCachedPreferences = () => {
    try {
      const cached = localStorage.getItem('location_preferences');
      if (!cached) return null;

      const { timestamp, ...preferences } = JSON.parse(cached);

      // Check if cache is still valid (7 days)
      if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('location_preferences');
        return null;
      }

      return preferences;
    } catch (error) {
      console.error('Error loading cached preferences:', error);
      return null;
    }
  };

  const value: LocationContextType = {
    ...state,
    setCity,
    setLocation,
    detectUserLocation,
    searchNearbyLocations,
    isCityActive,
    isLocationActive,
    getCityTimezone,
    calculateDistance,
    clearLocationData,
    retryLocationDetection
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Hook for using the location context
export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Higher-order component for location-aware components
export function withLocation<P extends object>(
  Component: React.ComponentType<P & { locationContext: LocationContextType }>
) {
  return function LocationAwareComponent(props: P) {
    const locationContext = useLocation();
    return <Component {...props} locationContext={locationContext} />;
  };
}

export default LocationContext;