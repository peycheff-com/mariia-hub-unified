import { useQuery } from '@tanstack/react-query';

import { ServicesApi } from '@/services/api/services';
import { BookingsApi } from '@/services/api/bookings';

interface ServiceDetails {
  service: ServicesApi.Service;
  gallery: Array<{
    id: string;
    image_url: string;
    caption: string;
    display_order: number;
    is_active: boolean;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    display_order: number;
    is_active: boolean;
  }>;
  content: {
    id: string;
    preparation: string;
    aftercare: string;
    what_to_expect: string;
    contraindications: string;
    duration_notes: string;
  } | null;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    client_name: string;
    is_public: boolean;
    created_at: string;
  }>;
  availability?: Array<{
    date: string;
    slots: Array<{
      time: string;
      available: boolean;
    }>;
  }>;
}

export const useServiceDetails = (serviceId: string) => {
  return useQuery({
    queryKey: ['service-details', serviceId],
    queryFn: async () => {
      // Get service with all related data in a single query using database view
      const service = await ServicesApi.getServiceWithDetails(serviceId);

      if (!service) return null;

      // The service should already include all related data
      return service as ServiceDetails;
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useServicesWithDetails = (filters?: {
  type?: 'beauty' | 'fitness';
  category?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['services-with-details', filters],
    queryFn: async () => {
      // Get services list
      const services = await ServicesApi.getServices(filters);

      if (!services) return [];

      // For each service, we could prefetch details if needed
      // But for performance, we'll fetch details on demand

      return services;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Batch fetch multiple services
export const useBatchServiceDetails = (serviceIds: string[]) => {
  return useQuery({
    queryKey: ['batch-service-details', serviceIds],
    queryFn: async () => {
      if (!serviceIds.length) return [];

      // Create promises for each service
      const promises = serviceIds.map(id =>
        ServicesApi.getServiceWithDetails(id)
      );

      // Wait for all to complete
      const results = await Promise.allSettled(promises);

      // Extract successful results
      const services = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      return services as ServiceDetails[];
    },
    enabled: serviceIds.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};