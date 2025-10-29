import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { MetaConversionsAPI } from '../meta-conversions-api';

// Mock fetch
global.fetch = vi.fn();

// Mock crypto.subtle.digest
const mockDigest = vi.fn().mockResolvedValue(
  new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])
);
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
});

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      eq: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue(1),
  },
}));

describe('MetaConversionsAPI', () => {
  let api: MetaConversionsAPI;
  const mockConfig = {
    accessToken: 'test_token',
    pixelId: 'test_pixel',
    apiVersion: 'v18.0',
    testEventCode: 'TEST123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api = new MetaConversionsAPI(mockConfig);

    // Mock successful fetch response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(api).toBeDefined();
    });

    it('should start retry processor', () => {
      vi.useFakeTimers();
      const newApi = new MetaConversionsAPI(mockConfig);
      expect(newApi).toBeDefined();
      vi.useRealTimers();
    });
  });

  describe('event deduplication', () => {
    it('should prevent duplicate events within 24 hours', async () => {
      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: 'test@example.com' },
        custom_data: { value: 100 },
        action_source: 'website' as const,
      };

      // First call should succeed
      const result1 = await api.sendEvent(event);
      expect(result1.duplicate).toBeUndefined();

      // Second call with same data should be detected as duplicate
      const result2 = await api.sendEvent(event);
      expect(result2.duplicate).toBe(true);
      expect(result2.message).toBe('Duplicate event detected');
    });

    it('should allow different events', async () => {
      const event1 = {
        event_name: 'TestEvent1',
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: 'test@example.com' },
        custom_data: { value: 100 },
        action_source: 'website' as const,
      };

      const event2 = {
        event_name: 'TestEvent2',
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: 'test@example.com' },
        custom_data: { value: 200 },
        action_source: 'website' as const,
      };

      const result1 = await api.sendEvent(event1);
      const result2 = await api.sendEvent(event2);

      expect(result1.duplicate).toBeUndefined();
      expect(result2.duplicate).toBeUndefined();
    });
  });

  describe('retry logic', () => {
    it('should add failed events to retry queue', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: 'test@example.com' },
        custom_data: { value: 100 },
        action_source: 'website' as const,
      };

      await expect(api.sendEvent(event)).rejects.toThrow('Network error');

      const status = api.getRetryQueueStatus();
      expect(status.queueLength).toBe(1);
      expect(status.isProcessing).toBe(false);
    });

    it('should process retry queue', async () => {
      vi.useFakeTimers();

      // Add event to retry queue
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: 'test@example.com' },
        custom_data: { value: 100 },
        action_source: 'website' as const,
        event_id: 'test_event_id',
      };

      try {
        await api.sendEvent(event);
      } catch (error) {
        // Expected to fail
      }

      // Fast forward time to trigger retry
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 minutes + 1 second

      // Check that retry was attempted
      expect(fetch).toHaveBeenCalledTimes(2); // Initial attempt + retry

      vi.useRealTimers();
    });
  });

  describe('user data hashing', () => {
    it('should hash user data for privacy', async () => {
      const userData = {
        em: 'test@example.com',
        ph: '+1234567890',
        fn: 'John',
        ln: 'Doe',
      };

      const hashedData = await api.hashUserData(userData);

      expect(hashedData).toHaveProperty('em');
      expect(hashedData).toHaveProperty('ph');
      expect(hashedData).toHaveProperty('fn');
      expect(hashedData).toHaveProperty('ln');

      // Hashed values should not equal original values
      expect(hashedData.em).not.toBe('test@example.com');
      expect(hashedData.ph).not.toBe('+1234567890');
    });

    it('should handle empty user data', async () => {
      const userData = {};
      const hashedData = await api.hashUserData(userData);
      expect(Object.keys(hashedData)).toHaveLength(0);
    });
  });

  describe('event tracking methods', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should track PageView events', async () => {
      const result = await api.trackPageView(mockUser);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test_pixel/events'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('PageView'),
        })
      );
    });

    it('should track AddToCart events', async () => {
      const service = {
        id: 'service_123',
        name: 'Test Service',
        price: 100,
        currency: 'PLN',
        category: 'beauty',
      };

      await api.trackAddToCart(mockUser, service, 2);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test_pixel/events'),
        expect.objectContaining({
          body: expect.stringContaining('AddToCart'),
        })
      );
    });

    it('should track business events', async () => {
      const businessData = {
        businessCategory: 'beauty',
        serviceLocation: 'warsaw',
        appointmentType: 'consultation',
      };

      await api.trackBusinessEvent('ConsultationRequest', mockUser, businessData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test_pixel/events'),
        expect.objectContaining({
          body: expect.stringContaining('ConsultationRequest'),
        })
      );
    });
  });

  describe('API configuration', () => {
    it('should use correct API endpoint', async () => {
      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {},
        action_source: 'website' as const,
      };

      await api.sendEvent(event);

      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test_pixel/events',
        expect.any(Object)
      );
    });

    it('should include test event code when configured', async () => {
      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {},
        action_source: 'website' as const,
      };

      await api.sendEvent(event);

      const callArgs = (fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.test_event_code).toBe('TEST123');
    });
  });

  describe('utility methods', () => {
    it('should clear retry queue', () => {
      api.clearRetryQueue();
      const status = api.getRetryQueueStatus();
      expect(status.queueLength).toBe(0);
    });

    it('should provide retry queue status', () => {
      const status = api.getRetryQueueStatus();
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('nextRetryCount');
      expect(typeof status.queueLength).toBe('number');
      expect(typeof status.isProcessing).toBe('boolean');
      expect(typeof status.nextRetryCount).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Invalid token' } }),
      });

      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {},
        action_source: 'website' as const,
      };

      await expect(api.sendEvent(event)).rejects.toThrow('Meta CAPI Error: Invalid token');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const event = {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {},
        action_source: 'website' as const,
      };

      await expect(api.sendEvent(event)).rejects.toThrow('Network error');
    });
  });
});