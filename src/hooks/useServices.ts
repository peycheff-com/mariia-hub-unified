import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { servicesService, Service, ServiceFilters, ServiceCategory } from '@/services/services.service';

// Basic hooks for services
export const useServices = (filters?: ServiceFilters) => {
  const queryKey = ['services', filters];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getServices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const services = useMemo(() => data?.data || [], [data?.data]);

  return {
    services,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    count: services.length,
  };
};

// Hook for single service by slug
export const useServiceBySlug = (slug: string) => {
  const queryKey = ['service', slug];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getServiceBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    service: data?.data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  };
};

// Hook for single service by ID
export const useServiceById = (id: string) => {
  const queryKey = ['service', id];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getServiceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    service: data?.data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  };
};

// Hook for service categories
export const useServiceCategories = (serviceType?: string) => {
  const queryKey = ['service-categories', serviceType];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getServiceCategories(serviceType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const categories = useMemo(() => data?.data || [], [data?.data]);

  return {
    categories,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    count: categories.length,
  };
};

// Hook for featured services
export const useFeaturedServices = (serviceType?: string, limit: number = 6) => {
  const queryKey = ['featured-services', serviceType, limit];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getFeaturedServices(serviceType, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const services = useMemo(() => data?.data || [], [data?.data]);

  return {
    services,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    count: services.length,
  };
};

// Hook for related services
export const useRelatedServices = (serviceId: string, limit: number = 3) => {
  const queryKey = ['related-services', serviceId, limit];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getRelatedServices(serviceId, limit),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const services = useMemo(() => data?.data || [], [data?.data]);

  return {
    services,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    count: services.length,
  };
};

// Hook for searching services
export const useServiceSearch = (query: string, filters?: ServiceFilters) => {
  const queryKey = ['service-search', query, filters];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.searchServices(query, filters),
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });

  const services = useMemo(() => data?.data || [], [data?.data]);

  return {
    services,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    count: services.length,
  };
};

// Hook for price range
export const usePriceRange = (serviceType?: string) => {
  const queryKey = ['price-range', serviceType];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey,
    queryFn: () => servicesService.getPriceRange(serviceType),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    priceRange: data || null,
    error,
    isLoading,
    isError,
    isSuccess,
  };
};

// Hook for infinite scroll of services
export const useInfiniteServices = (filters?: ServiceFilters, pageSize: number = 12) => {
  const queryKey = ['infinite-services', filters, pageSize];

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => {
      const offset = pageParam * pageSize;
      return servicesService.getServices({
        ...filters,
        // Note: This would require updating the service to support pagination
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < pageSize) return undefined;
      return allPages.length;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const services = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data?.pages]);

  return {
    services,
    error,
    isLoading,
    isError,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    count: services.length,
  };
};

// Hook for beauty-specific services
export const useBeautyServices = (filters?: Omit<ServiceFilters, 'service_type'>) => {
  return useServices({ ...filters, service_type: 'beauty' });
};

// Hook for fitness-specific services
export const useFitnessServices = (filters?: Omit<ServiceFilters, 'service_type'>) => {
  return useServices({ ...filters, service_type: 'fitness' });
};

// Hook for lifestyle-specific services
export const useLifestyleServices = (filters?: Omit<ServiceFilters, 'service_type'>) => {
  return useServices({ ...filters, service_type: 'lifestyle' });
};

// Combined hook for multiple service types
export const useServicesByType = () => {
  const beautyServices = useBeautyServices();
  const fitnessServices = useFitnessServices();
  const lifestyleServices = useLifestyleServices();

  const allServices = useMemo(() => [
    ...(beautyServices.services || []),
    ...(fitnessServices.services || []),
    ...(lifestyleServices.services || []),
  ], [beautyServices.services, fitnessServices.services, lifestyleServices.services]);

  const isLoading = beautyServices.isLoading ||
                   fitnessServices.isLoading ||
                   lifestyleServices.isLoading;

  const error = beautyServices.error ||
               fitnessServices.error ||
               lifestyleServices.error;

  return {
    beautyServices: beautyServices.services,
    fitnessServices: fitnessServices.services,
    lifestyleServices: lifestyleServices.services,
    allServices,
    isLoading,
    error,
    refetchAll: () => {
      beautyServices.refetch();
      fitnessServices.refetch();
      lifestyleServices.refetch();
    },
  };
};