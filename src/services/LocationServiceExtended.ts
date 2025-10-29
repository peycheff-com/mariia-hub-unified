import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import LocationService, { SearchParams, ServiceSearchResult } from './LocationService';

// Extended service for location-based service discovery

export interface ServiceSearchParams extends SearchParams {
  sortBy?: 'distance' | 'price' | 'rating' | 'availability';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    priceRange?: { min: number; max: number };
    features?: string[];
    rating?: number;
    availability?: 'available-now' | 'today' | 'this-week';
  };
}

export interface ServiceRecommendationParams {
  userLocation?: { lat: number; lng: number };
  serviceType?: string;
  preferences?: {
    maxDistance?: number;
    maxPrice?: number;
    preferredFeatures?: string[];
  };
  excludeBooked?: boolean;
}

class LocationServiceExtended extends LocationService {
  /**
   * Enhanced service search with filtering and sorting
   */
  static async searchServicesAdvanced(params: ServiceSearchParams): Promise<ServiceSearchResult[]> {
    try {
      // Get base services
      const services = await this.searchServices(params);

      // Apply filters
      let filteredServices = services;

      if (params.filters) {
        filteredServices = this.applyServiceFilters(services, params.filters);
      }

      // Apply sorting
      if (params.sortBy) {
        filteredServices = this.sortServices(filteredServices, params.sortBy, params.sortOrder);
      }

      return filteredServices;
    } catch (error) {
      logger.error('Error in advanced service search:', error);
      return [];
    }
  }

  /**
   * Get personalized service recommendations
   */
  static async getServiceRecommendations(
    params: ServiceRecommendationParams
  ): Promise<{
    recommended: ServiceSearchResult[];
    nearby: ServiceSearchResult[];
    popular: ServiceSearchResult[];
  }> {
    try {
      // Get recommended services based on preferences
      const recommended = await this.getRecommendedServices(params);

      // Get nearby services
      const nearby = await this.getNearbyPopularServices(params);

      // Get generally popular services in the area
      const popular = await this.getPopularServices(params);

      return {
        recommended: recommended.slice(0, 6),
        nearby: nearby.slice(0, 6),
        popular: popular.slice(0, 6)
      };
    } catch (error) {
      logger.error('Error getting service recommendations:', error);
      return { recommended: [], nearby: [], popular: [] };
    }
  }

  /**
   * Find services with current availability
   */
  static async findAvailableServices(
    cityId: string,
    date?: Date,
    serviceType?: string
  ): Promise<ServiceSearchResult[]> {
    const searchDate = date || new Date();

    try {
      // Get all services in the city
      const services = await this.searchServices({
        cityId,
        serviceType,
        limit: 50
      });

      // Filter by availability
      const availableServices = await Promise.all(
        services.map(async (serviceResult) => {
          const availableLocations = await Promise.all(
            serviceResult.locations.map(async (locationData) => {
              // Check if service is available at this location
              const isAvailable = await this.checkServiceAvailability(
                serviceResult.service.id,
                locationData.location.id
              );

              return {
                ...locationData,
                availability: isAvailable.available,
                nextAvailable: isAvailable.nextAvailable
              };
            })
          );

          // Keep only services with at least one available location
          if (availableLocations.some(l => l.availability)) {
            return {
              ...serviceResult,
              locations: availableLocations
            };
          }

          return null;
        })
      );

      // Filter out null results
      return availableServices.filter(
        (service): service is ServiceSearchResult => service !== null
      );
    } catch (error) {
      logger.error('Error finding available services:', error);
      return [];
    }
  }

  /**
   * Get service availability calendar
   */
  static async getServiceAvailabilityCalendar(
    serviceId: string,
    locationId: string,
    startDate: Date,
    days: number = 30
  ): Promise<{
    date: Date;
    available: boolean;
    slots?: { time: string; available: boolean }[];
  }[]> {
    try {
      const availability: Array<{
        date: Date;
        available: boolean;
        slots?: { time: string; available: boolean }[];
      }> = [];

      // Get service availability configuration
      const { data: serviceAvailability } = await supabase
        .from('service_location_availability')
        .select('*')
        .eq('service_id', serviceId)
        .eq('location_id', locationId)
        .single();

      if (!serviceAvailability) {
        return [];
      }

      // Get location operating hours
      const { data: location } = await supabase
        .from('locations')
        .select('operating_hours')
        .eq('id', locationId)
        .single();

      const operatingHours = location?.operating_hours || {};

      // Generate calendar
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        const dayName = currentDate.toLocaleLowerCase('en-US', { weekday: 'long' });
        const dayHours = operatingHours[dayName];

        if (!dayHours || dayHours.closed) {
          availability.push({
            date: currentDate,
            available: false
          });
          continue;
        }

        // Check if it's a blackout date
        if (serviceAvailability.availability_rules?.blackoutDates?.includes(
          currentDate.toISOString().split('T')[0]
        )) {
          availability.push({
            date: currentDate,
            available: false
          });
          continue;
        }

        // Check seasonal availability
        if (serviceAvailability.seasonal_availability) {
          const month = currentDate.getMonth() + 1;
          const seasonConfig = serviceAvailability.seasonal_availability[`month_${month}`];

          if (seasonConfig?.available === false) {
            availability.push({
              date: currentDate,
              available: false
            });
            continue;
          }
        }

        // Generate time slots
        const slots = this.generateTimeSlots(dayHours, serviceAvailability);

        availability.push({
          date: currentDate,
          available: slots.some(s => s.available),
          slots
        });
      }

      return availability;
    } catch (error) {
      logger.error('Error getting service availability calendar:', error);
      return [];
    }
  }

  /**
   * Apply filters to service results
   */
  private static applyServiceFilters(
    services: ServiceSearchResult[],
    filters: ServiceSearchParams['filters']
  ): ServiceSearchResult[] {
    if (!filters) return services;

    return services.filter(service => {
      // Price range filter
      if (filters.priceRange) {
        const price = service.bestPrice.amount;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }
      }

      // Features filter (would need to implement service features)
      if (filters.features && filters.features.length > 0) {
        // This would check if service has required features
        // Implementation depends on how features are stored
      }

      // Rating filter
      if (filters.rating) {
        // This would check service rating
        // Implementation depends on rating system
      }

      return true;
    });
  }

  /**
   * Sort services by specified criteria
   */
  private static sortServices(
    services: ServiceSearchResult[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): ServiceSearchResult[] {
    return [...services].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'distance':
          if (!a.nearestLocation || !b.nearestLocation) {
            comparison = 0;
          } else {
            comparison = a.nearestLocation.distance - b.nearestLocation.distance;
          }
          break;

        case 'price':
          comparison = a.bestPrice.amount - b.bestPrice.amount;
          break;

        case 'rating':
          // Implementation depends on rating system
          comparison = 0;
          break;

        case 'availability':
          // Prioritize services with current availability
          const aHasAvailability = a.locations.some(l => l.availability);
          const bHasAvailability = b.locations.some(l => l.availability);
          comparison = aHasAvailability === bHasAvailability ? 0 : aHasAvailability ? -1 : 1;
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get recommended services based on user preferences
   */
  private static async getRecommendedServices(
    params: ServiceRecommendationParams
  ): Promise<ServiceSearchResult[]> {
    const searchParams: SearchParams = {
      coordinates: params.userLocation,
      radius: params.preferences?.maxDistance || 10000,
      serviceType: params.serviceType,
      limit: 20
    };

    const services = await this.searchServices(searchParams);

    // Filter by preferences
    return services.filter(service => {
      if (params.preferences?.maxPrice) {
        return service.bestPrice.amount <= params.preferences.maxPrice;
      }
      return true;
    });
  }

  /**
   * Get nearby popular services
   */
  private static async getNearbyPopularServices(
    params: ServiceRecommendationParams
  ): Promise<ServiceSearchResult[]> {
    // In a real implementation, this would use analytics data
    // For now, return nearby services sorted by distance
    const searchParams: SearchParams = {
      coordinates: params.userLocation,
      radius: 5000, // 5km
      limit: 20
    };

    const services = await this.searchServices(searchParams);

    return services.sort((a, b) => {
      if (!a.nearestLocation || !b.nearestLocation) return 0;
      return a.nearestLocation.distance - b.nearestLocation.distance;
    });
  }

  /**
   * Get popular services in the area
   */
  private static async getPopularServices(
    params: ServiceRecommendationParams
  ): Promise<ServiceSearchResult[]> {
    // In a real implementation, this would use analytics data
    // For now, return services with good ratings
    const searchParams: SearchParams = {
      cityId: params.userLocation ? undefined : await this.getCityFromCoordinates(params.userLocation!),
      serviceType: params.serviceType,
      limit: 20
    };

    return this.searchServices(searchParams);
  }

  /**
   * Get city ID from coordinates
   */
  private static async getCityFromCoordinates(
    coordinates: { lat: number; lng: number }
  ): Promise<string | undefined> {
    try {
      const address = await this.reverseGeocode(coordinates.lat, coordinates.lng);
      const city = await this.getCityByName(address.city, address.countryCode);
      return city?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate time slots for a day
   */
  private static generateTimeSlots(
    dayHours: { open: string; close: string },
    serviceAvailability: any
  ): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    if (!dayHours.open || !dayHours.close) {
      return slots;
    }

    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

    const serviceDuration = serviceAvailability.service_duration_minutes || 60;
    const bufferTime = serviceAvailability.buffer_time_minutes || 30;

    const currentTime = new Date();
    currentTime.setHours(openHour, openMin, 0, 0);

    const endTime = new Date();
    endTime.setHours(closeHour, closeMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      if (slotEnd <= endTime) {
        slots.push({
          time: currentTime.toTimeString().slice(0, 5),
          available: true // In real implementation, check against bookings
        });
      }

      currentTime.setMinutes(
        currentTime.getMinutes() + serviceDuration + bufferTime
      );
    }

    return slots;
  }
}

export default LocationServiceExtended;