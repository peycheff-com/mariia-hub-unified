import { log } from './logger';

import { Booking, Service, AvailabilitySlot } from '@/types';

interface OfflineCache {
  bookings: Booking[];
  services: Service[];
  availabilitySlots: AvailabilitySlot[];
  lastSync: number;
}

interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'cancel';
  endpoint: string;
  payload: any;
  timestamp: number;
  retryCount?: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private DB_NAME = 'mariia-offline-db';
  private DB_VERSION = 1;
  private CACHE_KEY = 'mariia-offline-cache';
  private QUEUE_KEY = 'mariia-offline-queue';
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        log.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains('bookings')) {
          const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
          bookingStore.createIndex('user_id', 'user_id', { unique: false });
          bookingStore.createIndex('status', 'status', { unique: false });
          bookingStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('services')) {
          const serviceStore = db.createObjectStore('services', { keyPath: 'id' });
          serviceStore.createIndex('category', 'category', { unique: false });
          serviceStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('availability')) {
          const availabilityStore = db.createObjectStore('availability', { keyPath: 'id' });
          availabilityStore.createIndex('service_id', 'service_id', { unique: false });
          availabilityStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      log.info('App is online');
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      log.info('App is offline');
    });
  }

  // Cache data for offline use
  async cacheBookings(bookings: Booking[]): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['bookings'], 'readwrite');
    const store = transaction.objectStore('bookings');

    for (const booking of bookings) {
      store.put({ ...booking, cached: true });
    }

    await this.completeTransaction(transaction);
    log.info(`Cached ${bookings.length} bookings for offline use`);
  }

  async cacheServices(services: Service[]): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['services'], 'readwrite');
    const store = transaction.objectStore('services');

    for (const service of services) {
      store.put({ ...service, cached: true });
    }

    await this.completeTransaction(transaction);
    log.info(`Cached ${services.length} services for offline use`);
  }

  async cacheAvailability(slots: AvailabilitySlot[]): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['availability'], 'readwrite');
    const store = transaction.objectStore('availability');

    // Clear old availability and cache new slots
    await store.clear();
    for (const slot of slots) {
      store.put({ ...slot, cached: true });
    }

    await this.completeTransaction(transaction);
    log.info(`Cached ${slots.length} availability slots for offline use`);
  }

  // Get cached data
  async getCachedBookings(userId?: string): Promise<Booking[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readonly');
      const store = transaction.objectStore('bookings');

      let request: IDBRequest;
      if (userId) {
        const index = store.index('user_id');
        request = index.getAll(userId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getCachedServices(category?: string): Promise<Service[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['services'], 'readonly');
      const store = transaction.objectStore('services');

      let request: IDBRequest;
      if (category) {
        const index = store.index('category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getCachedAvailability(serviceId?: string, date?: string): Promise<AvailabilitySlot[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['availability'], 'readonly');
      const store = transaction.objectStore('availability');

      let request: IDBRequest;
      if (serviceId) {
        const index = store.index('service_id');
        request = index.getAll(serviceId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let slots = request.result || [];

        // Filter by date if specified
        if (date) {
          slots = slots.filter(slot => slot.date === date);
        }

        resolve(slots);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Queue actions for when offline
  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    store.put(queuedAction);

    await this.completeTransaction(transaction);
    log.info('Queued action for offline:', queuedAction);

    // If we're online, try to sync immediately
    if (this.isOnline) {
      this.syncWhenOnline();
    }
  }

  // Sync queued actions when online
  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    log.info('Starting offline sync...');

    try {
      if (!this.db) await this.initDB();

      const transaction = this.db!.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = async () => {
        const actions = request.result || [];
        const successful: string[] = [];
        const failed: QueuedAction[] = [];

        for (const action of actions) {
          try {
            const response = await fetch(action.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(action.payload),
            });

            if (response.ok) {
              successful.push(action.id);
              log.info(`Successfully synced action: ${action.id}`);
            } else {
              failed.push({ ...action, retryCount: (action.retryCount || 0) + 1 });
            }
          } catch (error) {
            log.error(`Failed to sync action ${action.id}:`, error);
            failed.push({ ...action, retryCount: (action.retryCount || 0) + 1 });
          }
        }

        // Remove successful actions, update failed ones
        const updateTransaction = this.db!.transaction(['queue'], 'readwrite');
        const updateStore = updateTransaction.objectStore('queue');

        for (const id of successful) {
          updateStore.delete(id);
        }

        for (const action of failed) {
          // Only retry up to 3 times
          if (action.retryCount && action.retryCount < 3) {
            updateStore.put(action);
          } else {
            log.error(`Max retries exceeded for action: ${action.id}`);
            updateStore.delete(action.id);
          }
        }

        await this.completeTransaction(updateTransaction);

        // Notify components about sync completion
        window.dispatchEvent(new CustomEvent('offline-sync-complete', {
          detail: { successful: successful.length, failed: failed.length }
        }));

        this.syncInProgress = false;
        log.info(`Sync complete: ${successful.length} successful, ${failed.length} failed`);
      };
    } catch (error) {
      log.error('Sync failed:', error);
      this.syncInProgress = false;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Get queue length
  async getQueueLength(): Promise<number> {
    if (!this.db) await this.initDB();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result || 0);
      };
    });
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['bookings', 'services', 'availability', 'queue'], 'readwrite');

    await Promise.all([
      transaction.objectStore('bookings').clear(),
      transaction.objectStore('services').clear(),
      transaction.objectStore('availability').clear(),
      transaction.objectStore('queue').clear(),
    ]);

    await this.completeTransaction(transaction);
    log.info('Cleared all offline cache');
  }

  private completeTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineManager = OfflineManager.getInstance();
export { OfflineManager };