import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServicesService } from '@/services/services.service';
import { createService, createServices, createServiceCategory } from '@/test/factories/extended-factories';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('ServicesService - Service Management', () => {
  let servicesService: ServicesService;
  let mockTable: any;

  beforeEach(() => {
    servicesService = new ServicesService();

    mockTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockSupabase.from.mockReturnValue(mockTable);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service CRUD Operations', () => {
    describe('getAllServices', () => {
      test('should retrieve all active services', async () => {
        const mockServices = createServices(5, { is_active: true });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await servicesService.getAllServices();

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.select).toHaveBeenCalledWith('*');
        expect(mockTable.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockTable.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toEqual({ data: mockServices, error: null });
      });

      test('should handle pagination parameters', async () => {
        const mockServices = createServices(10);
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        await servicesService.getAllServices({
          page: 2,
          limit: 20,
          sortBy: 'title',
          sortOrder: 'asc'
        });

        expect(mockTable.limit).toHaveBeenCalledWith(20);
        expect(mockTable.offset).toHaveBeenCalledWith(20); // (page - 1) * limit
        expect(mockTable.order).toHaveBeenCalledWith('title', { ascending: true });
      });

      test('should handle service retrieval error', async () => {
        const error = { message: 'Database connection failed' };
        mockTable.select.mockResolvedValue({ data: null, error });

        const result = await servicesService.getAllServices();

        expect(result.error).toEqual(error);
        expect(result.data).toBeNull();
      });

      test('should include related data when requested', async () => {
        const mockServices = createServices(3);
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        await servicesService.getAllServices({ include: ['category', 'gallery'] });

        expect(mockTable.select).toHaveBeenCalledWith(`
          *,
          category:service_categories(*),
          gallery:service_gallery(*)
        `);
      });
    });

    describe('getServiceById', () => {
      test('should retrieve service by ID', async () => {
        const mockService = createService({ id: 'service-123' });
        mockTable.single.mockResolvedValue({ data: mockService, error: null });

        const result = await servicesService.getServiceById('service-123');

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.select).toHaveBeenCalledWith('*');
        expect(mockTable.eq).toHaveBeenCalledWith('id', 'service-123');
        expect(mockTable.single).toHaveBeenCalled();
        expect(result).toEqual({ data: mockService, error: null });
      });

      test('should return null for non-existent service', async () => {
        mockTable.single.mockResolvedValue({ data: null, error: { message: 'No rows found' } });

        const result = await servicesService.getServiceById('non-existent-id');

        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
      });

      test('should include related data for service details', async () => {
        const mockService = createService({ id: 'service-123' });
        mockTable.single.mockResolvedValue({ data: mockService, error: null });

        await servicesService.getServiceById('service-123', {
          include: ['category', 'gallery', 'faqs', 'availability']
        });

        expect(mockTable.select).toHaveBeenCalledWith(`
          *,
          category:service_categories(*),
          gallery:service_gallery(*),
          faqs:service_faqs(*),
          availability:availability_slots(*)
        `);
      });
    });

    describe('createService', () => {
      test('should create a new service', async () => {
        const newService = createService({ id: undefined });
        const createdService = { ...newService, id: 'new-service-id' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdService, error: null });

        const result = await servicesService.createService(newService);

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.insert).toHaveBeenCalledWith(newService);
        expect(mockTable.select).toHaveBeenCalled();
        expect(mockTable.single).toHaveBeenCalled();
        expect(result.data).toEqual(createdService);
      });

      test('should validate required fields', async () => {
        const invalidService = {
          title: '', // Empty title
          price: -100, // Negative price
          duration: 0, // Zero duration
        };

        const result = await servicesService.createService(invalidService);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('validation');
      });

      test('should handle service creation error', async () => {
        const newService = createService({ id: undefined });
        const error = { message: 'Duplicate service title' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: null, error });

        const result = await servicesService.createService(newService);

        expect(result.error).toEqual(error);
      });

      test('should process service images during creation', async () => {
        const newService = createService({
          id: undefined,
          image_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          gallery_urls: ['data:image/jpeg;base64,test']
        });

        const createdService = { ...newService, id: 'new-service-id' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdService, error: null });

        // Mock storage upload
        const mockStorage = {
          upload: vi.fn().mockResolvedValue({ data: { path: 'uploaded-image.jpg' }, error: null }),
        };
        mockSupabase.storage.from.mockReturnValue(mockStorage);

        const result = await servicesService.createService(newService);

        expect(mockSupabase.storage.from).toHaveBeenCalledWith('service-images');
        expect(mockStorage.upload).toHaveBeenCalled();
        expect(result.data).toEqual(createdService);
      });
    });

    describe('updateService', () => {
      test('should update existing service', async () => {
        const serviceId = 'service-123';
        const updateData = {
          title: 'Updated Service Title',
          price: 250,
          description: 'Updated description',
        };
        const updatedService = createService({ id: serviceId, ...updateData });

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: updatedService, error: null });

        const result = await servicesService.updateService(serviceId, updateData);

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', serviceId);
        expect(mockTable.select).toHaveBeenCalled();
        expect(mockTable.single).toHaveBeenCalled();
        expect(result.data).toEqual(updatedService);
      });

      test('should validate update data', async () => {
        const serviceId = 'service-123';
        const invalidUpdateData = {
          price: -50, // Negative price
          duration: -30, // Negative duration
        };

        const result = await servicesService.updateService(serviceId, invalidUpdateData);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('validation');
      });

      test('should handle non-existent service update', async () => {
        const serviceId = 'non-existent-id';
        const updateData = { title: 'Updated Title' };
        const error = { message: 'Service not found' };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: null, error });

        const result = await servicesService.updateService(serviceId, updateData);

        expect(result.error).toEqual(error);
      });
    });

    describe('deleteService', () => {
      test('should soft delete service (set is_active to false)', async () => {
        const serviceId = 'service-123';
        const deactivatedService = createService({ id: serviceId, is_active: false });

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: deactivatedService, error: null });

        const result = await servicesService.deleteService(serviceId);

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.update).toHaveBeenCalledWith({ is_active: false });
        expect(mockTable.eq).toHaveBeenCalledWith('id', serviceId);
        expect(result.data).toEqual(deactivatedService);
      });

      test('should handle permanent delete when requested', async () => {
        const serviceId = 'service-123';
        const error = { message: 'Service deleted successfully' };

        mockTable.delete.mockReturnValue(mockTable);
        mockTable.eq.mockResolvedValue({ data: null, error });

        const result = await servicesService.deleteService(serviceId, { permanent: true });

        expect(mockTable.delete).toHaveBeenCalled();
        expect(mockTable.eq).toHaveBeenCalledWith('id', serviceId);
        expect(result.error).toEqual(error);
      });

      test('should handle service deletion error', async () => {
        const serviceId = 'service-123';
        const error = { message: 'Cannot delete service with active bookings' };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: null, error });

        const result = await servicesService.deleteService(serviceId);

        expect(result.error).toEqual(error);
      });
    });
  });

  describe('Service Filtering and Search', () => {
    describe('getServicesByCategory', () => {
      test('should retrieve services by category', async () => {
        const categoryId = 'category-123';
        const mockServices = createServices(3, { category: categoryId });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await servicesService.getServicesByCategory(categoryId);

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.eq).toHaveBeenCalledWith('category', categoryId);
        expect(mockTable.eq).toHaveBeenCalledWith('is_active', true);
        expect(result.data).toEqual(mockServices);
      });

      test('should handle subcategory filtering', async () => {
        const categoryId = 'category-123';
        const subcategory = 'lash-enhancement';
        const mockServices = createServices(2, {
          category: categoryId,
          subcategory: subcategory
        });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await servicesService.getServicesByCategory(categoryId, {
          subcategory,
          includeInactive: false
        });

        expect(mockTable.eq).toHaveBeenCalledWith('category', categoryId);
        expect(mockTable.eq).toHaveBeenCalledWith('subcategory', subcategory);
        expect(result.data).toEqual(mockServices);
      });
    });

    describe('searchServices', () => {
      test('should search services by keyword', async () => {
        const keyword = 'lash';
        const mockServices = createServices(3, {
          title: 'Lash Enhancement',
          description: 'Professional lash services'
        });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await servicesService.searchServices(keyword);

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.ilike).toHaveBeenCalledWith('title', `%${keyword}%`);
        expect(mockTable.ilike).toHaveBeenCalledWith('description', `%${keyword}%`);
        expect(result.data).toEqual(mockServices);
      });

      test('should search in multiple fields', async () => {
        const keyword = 'beauty';
        const options = {
          fields: ['title', 'description', 'tags'],
          category: 'beauty',
          priceRange: { min: 100, max: 500 }
        };

        mockTable.select.mockResolvedValue({ data: [], error: null });

        await servicesService.searchServices(keyword, options);

        expect(mockTable.ilike).toHaveBeenCalledWith('title', `%${keyword}%`);
        expect(mockTable.ilike).toHaveBeenCalledWith('description', `%${keyword}%`);
        expect(mockTable.ilike).toHaveBeenCalledWith('tags', `%${keyword}%`);
        expect(mockTable.eq).toHaveBeenCalledWith('category', 'beauty');
        expect(mockTable.gte).toHaveBeenCalledWith('price', 100);
        expect(mockTable.lte).toHaveBeenCalledWith('price', 500);
      });

      test('should handle empty search results', async () => {
        const keyword = 'nonexistent-service';
        mockTable.select.mockResolvedValue({ data: [], error: null });

        const result = await servicesService.searchServices(keyword);

        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
      });
    });

    describe('getFeaturedServices', () => {
      test('should retrieve featured services', async () => {
        const mockServices = createServices(5, { featured: true });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await servicesService.getFeaturedServices({ limit: 5 });

        expect(mockSupabase.from).toHaveBeenCalledWith('services');
        expect(mockTable.eq).toHaveBeenCalledWith('featured', true);
        expect(mockTable.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockTable.limit).toHaveBeenCalledWith(5);
        expect(result.data).toEqual(mockServices);
      });

      test('should prioritize by rating when requested', async () => {
        const mockServices = createServices(3, { featured: true });
        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        await servicesService.getFeaturedServices({
          limit: 3,
          sortBy: 'rating',
          category: 'beauty'
        });

        expect(mockTable.eq).toHaveBeenCalledWith('featured', true);
        expect(mockTable.eq).toHaveBeenCalledWith('category', 'beauty');
        expect(mockTable.order).toHaveBeenCalledWith('rating', { ascending: false });
      });
    });
  });

  describe('Service Categories', () => {
    describe('getAllCategories', () => {
      test('should retrieve all active categories', async () => {
        const mockCategories = [
          createServiceCategory({ id: 'cat-1', name: 'Beauty' }),
          createServiceCategory({ id: 'cat-2', name: 'Fitness' }),
        ];
        mockTable.select.mockResolvedValue({ data: mockCategories, error: null });

        const result = await servicesService.getAllCategories();

        expect(mockSupabase.from).toHaveBeenCalledWith('service_categories');
        expect(mockTable.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockTable.order).toHaveBeenCalledWith('sort_order', { ascending: true });
        expect(result.data).toEqual(mockCategories);
      });

      test('should include service counts when requested', async () => {
        const mockCategories = [createServiceCategory()];
        mockTable.select.mockResolvedValue({ data: mockCategories, error: null });

        await servicesService.getAllCategories({ includeServiceCount: true });

        expect(mockTable.select).toHaveBeenCalledWith(`
          *,
          services_count:services(count)
        `);
      });
    });

    describe('createCategory', () => {
      test('should create new service category', async () => {
        const newCategory = createServiceCategory({ id: undefined });
        const createdCategory = { ...newCategory, id: 'new-category-id' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdCategory, error: null });

        const result = await servicesService.createCategory(newCategory);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_categories');
        expect(mockTable.insert).toHaveBeenCalledWith(newCategory);
        expect(result.data).toEqual(createdCategory);
      });

      test('should validate category name uniqueness', async () => {
        const existingCategory = createServiceCategory({ name: 'Beauty' });
        const newCategory = createServiceCategory({
          id: undefined,
          name: 'Beauty' // Duplicate name
        });

        mockTable.insert.mockRejectedValue({
          message: 'duplicate key value violates unique constraint'
        });

        const result = await servicesService.createCategory(newCategory);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('duplicate');
      });
    });

    describe('updateCategory', () => {
      test('should update service category', async () => {
        const categoryId = 'cat-123';
        const updateData = { name: 'Updated Category Name', color: '#FF5733' };
        const updatedCategory = createServiceCategory({ id: categoryId, ...updateData });

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: updatedCategory, error: null });

        const result = await servicesService.updateCategory(categoryId, updateData);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_categories');
        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', categoryId);
        expect(result.data).toEqual(updatedCategory);
      });
    });
  });

  describe('Service Pricing', () => {
    describe('updatePricing', () => {
      test('should update service pricing', async () => {
        const serviceId = 'service-123';
        const pricingData = {
          price: 250,
          currency: 'PLN',
          price_display: {
            amount: 250,
            currency: 'PLN',
            formatted: '250 PLN'
          }
        };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: createService({ id: serviceId, ...pricingData }),
          error: null
        });

        const result = await servicesService.updatePricing(serviceId, pricingData);

        expect(mockTable.update).toHaveBeenCalledWith(pricingData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', serviceId);
        expect(result.data).toEqual(expect.objectContaining(pricingData));
      });

      test('should validate pricing data', async () => {
        const serviceId = 'service-123';
        const invalidPricing = {
          price: -100, // Negative price
          currency: 'INVALID', // Invalid currency
        };

        const result = await servicesService.updatePricing(serviceId, invalidPricing);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('validation');
      });
    });

    describe('getPricingHistory', () => {
      test('should retrieve pricing history for service', async () => {
        const serviceId = 'service-123';
        const mockHistory = [
          { price: 200, changed_at: '2024-01-01T00:00:00Z' },
          { price: 250, changed_at: '2024-02-01T00:00:00Z' },
        ];

        mockTable.select.mockResolvedValue({ data: mockHistory, error: null });

        const result = await servicesService.getPricingHistory(serviceId);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_pricing_history');
        expect(mockTable.eq).toHaveBeenCalledWith('service_id', serviceId);
        expect(mockTable.order).toHaveBeenCalledWith('changed_at', { ascending: false });
        expect(result.data).toEqual(mockHistory);
      });
    });
  });

  describe('Service Gallery Management', () => {
    describe('addGalleryImage', () => {
      test('should add image to service gallery', async () => {
        const serviceId = 'service-123';
        const imageData = {
          url: 'https://example.com/image.jpg',
          caption: 'Service image',
          order: 1,
        };
        const addedImage = { id: 'image-123', service_id, ...imageData };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: addedImage, error: null });

        const result = await servicesService.addGalleryImage(serviceId, imageData);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_gallery');
        expect(mockTable.insert).toHaveBeenCalledWith({ service_id: serviceId, ...imageData });
        expect(result.data).toEqual(addedImage);
      });

      test('should handle image upload', async () => {
        const serviceId = 'service-123';
        const imageData = {
          file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
          caption: 'Service image',
        };

        const mockStorage = {
          upload: vi.fn().mockResolvedValue({
            data: { path: 'uploaded-image.jpg' },
            error: null
          }),
        };
        mockSupabase.storage.from.mockReturnValue(mockStorage);

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: { id: 'image-123', url: 'uploaded-image.jpg' },
          error: null
        });

        const result = await servicesService.addGalleryImage(serviceId, imageData);

        expect(mockStorage.upload).toHaveBeenCalled();
        expect(result.data.url).toBe('uploaded-image.jpg');
      });
    });

    describe('updateGalleryImage', () => {
      test('should update gallery image details', async () => {
        const imageId = 'image-123';
        const updateData = { caption: 'Updated caption', order: 2 };
        const updatedImage = { id: imageId, ...updateData };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: updatedImage, error: null });

        const result = await servicesService.updateGalleryImage(imageId, updateData);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_gallery');
        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', imageId);
        expect(result.data).toEqual(updatedImage);
      });
    });

    describe('removeGalleryImage', () => {
      test('should remove image from gallery', async () => {
        const imageId = 'image-123';
        const error = { message: 'Image deleted successfully' };

        mockTable.delete.mockReturnValue(mockTable);
        mockTable.eq.mockResolvedValue({ data: null, error });

        const result = await servicesService.removeGalleryImage(imageId);

        expect(mockSupabase.from).toHaveBeenCalledWith('service_gallery');
        expect(mockTable.delete).toHaveBeenCalled();
        expect(mockTable.eq).toHaveBeenCalledWith('id', imageId);
        expect(result.error).toEqual(error);
      });
    });
  });

  describe('Service Analytics', () => {
    describe('getServiceStats', () => {
      test('should retrieve service statistics', async () => {
        const serviceId = 'service-123';
        const mockStats = {
          total_bookings: 150,
          total_revenue: 30000,
          average_rating: 4.8,
          popular_times: ['10:00', '14:00', '16:00'],
          cancellation_rate: 0.05,
        };

        mockSupabase.rpc.mockResolvedValue({ data: mockStats, error: null });

        const result = await servicesService.getServiceStats(serviceId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_service_stats', { service_id: serviceId });
        expect(result.data).toEqual(mockStats);
      });
    });

    describe('getPopularServices', () => {
      test('should retrieve most popular services', async () => {
        const mockServices = createServices(5);
        const popularServices = mockServices.map((service, index) => ({
          ...service,
          booking_count: 100 - index * 10,
          revenue: 20000 - index * 2000,
        }));

        mockSupabase.rpc.mockResolvedValue({ data: popularServices, error: null });

        const result = await servicesService.getPopularServices({
          limit: 5,
          period: '30d'
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_popular_services', {
          limit_count: 5,
          period_days: 30
        });
        expect(result.data).toEqual(popularServices);
      });
    });
  });

  describe('Error Handling and Validation', () => {
    test('should handle database connection errors', async () => {
      const connectionError = { message: 'Unable to connect to database' };
      mockTable.select.mockRejectedValue(connectionError);

      const result = await servicesService.getAllServices();

      expect(result.error).toEqual(connectionError);
      expect(result.data).toBeNull();
    });

    test('should validate service data structure', async () => {
      const invalidService = {
        // Missing required fields
        title: 'Test Service',
        // Missing price, duration, etc.
      };

      const result = await servicesService.createService(invalidService);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('required');
    });

    test('should handle rate limiting', async () => {
      // Simulate rate limiting response
      const rateLimitError = {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      };

      mockTable.select.mockResolvedValue({ data: null, error: rateLimitError });

      const result = await servicesService.getAllServices();

      expect(result.error).toEqual(rateLimitError);
      expect(result.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});