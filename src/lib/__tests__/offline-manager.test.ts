import { offlineManager, OfflineManager } from '../offline-manager';

import { Booking, Service } from '@/types';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStore: jest.fn(),
};

// Mock IDBFactory
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
} as any;

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
});

describe('OfflineManager', () => {
  let manager: OfflineManager;

  beforeEach(() => {
    manager = OfflineManager.getInstance();
    jest.clearAllMocks();
  });

  describe('Connection Status', () => {
    it('should detect online status', () => {
      window.navigator.onLine = true;
      expect(manager.getConnectionStatus()).toBe(true);
    });

    it('should detect offline status', () => {
      window.navigator.onLine = false;
      expect(manager.getConnectionStatus()).toBe(false);
    });
  });

  describe('Caching Bookings', () => {
    const mockBookings: Booking[] = [
      {
        id: '1',
        user_id: 'user1',
        service_id: 'service1',
        date: '2024-01-15',
        time: '10:00',
        status: 'confirmed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should cache bookings successfully', async () => {
      // Mock successful IndexedDB operations
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn(),
        }),
        oncomplete: null,
        onerror: null,
      };

      (global.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request } as any);
        }, 0);

        return request;
      });

      mockDB.transaction = jest.fn().mockReturnValue(mockTransaction);

      await manager.cacheBookings(mockBookings);

      expect(mockDB.transaction).toHaveBeenCalledWith(['bookings'], 'readwrite');
    });

    it('should retrieve cached bookings', async () => {
      // Mock successful IndexedDB operations
      const mockRequest = {
        result: mockBookings,
        onsuccess: null,
        onerror: null,
      };

      const mockStore = {
        getAll: jest.fn().mockReturnValue(mockRequest),
        index: jest.fn().mockReturnValue({
          getAll: jest.fn().mockReturnValue(mockRequest),
        }),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
      };

      (global.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request } as any);
        }, 0);

        return request;
      });

      mockDB.transaction = jest.fn().mockReturnValue(mockTransaction);

      const bookings = await manager.getCachedBookings();
      expect(bookings).toEqual(mockBookings);
    });
  });

  describe('Queueing Actions', () => {
    const mockAction = {
      type: 'create' as const,
      endpoint: '/api/bookings',
      payload: { service_id: 'service1', date: '2024-01-15' },
    };

    it('should queue actions when offline', async () => {
      window.navigator.onLine = false;

      // Mock successful IndexedDB operations
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn(),
        }),
        oncomplete: null,
        onerror: null,
      };

      (global.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request } as any);
        }, 0);

        return request;
      });

      mockDB.transaction = jest.fn().mockReturnValue(mockTransaction);

      await manager.queueAction(mockAction);

      expect(mockDB.transaction).toHaveBeenCalledWith(['queue'], 'readwrite');
    });

    it('should sync queued actions when online', async () => {
      window.navigator.onLine = true;

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Mock IndexedDB operations
      const mockRequest = {
        result: [
          {
            id: 'action1',
            type: 'create',
            endpoint: '/api/bookings',
            payload: { service_id: 'service1' },
            timestamp: Date.now(),
            retryCount: 0,
          },
        ],
        onsuccess: null,
        onerror: null,
      };

      const mockStore = {
        getAll: jest.fn().mockReturnValue(mockRequest),
        delete: jest.fn(),
        put: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
      };

      (global.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request } as any);
        }, 0);

        return request;
      });

      mockDB.transaction = jest.fn().mockReturnValue(mockTransaction);

      await manager.syncWhenOnline();

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear all cached data', async () => {
      // Mock successful IndexedDB operations
      const mockStore = {
        clear: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
      };

      (global.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request } as any);
        }, 0);

        return request;
      });

      mockDB.transaction = jest.fn().mockReturnValue(mockTransaction);

      await manager.clearCache();

      expect(mockDB.transaction).toHaveBeenCalledWith(
        ['bookings', 'services', 'availability', 'queue'],
        'readwrite'
      );
    });
  });
});